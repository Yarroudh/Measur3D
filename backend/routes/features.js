var express = require("express");
var router = express.Router();
const mongoose = require("mongoose");
var url = require("url");
var fs = require("fs");
var negoc = require("./contentNegotiation");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const yaml = require("js-yaml");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Measur3D : OGC API - Features",
      version: "0.2.2",
      description:
        "A REST API to access CityJSON features compliing with OGC API - Features: Core (Part 1).",
      license: {
        name: "Apache-2.0",
        url: "https://www.apache.org/licenses/LICENSE-2.0",
      },
      contact: {
        name: "Gilles-Antoine Nys",
        email: "ganys@uliege.be",
      },
    },
    servers: [
      {
        url: "http://localhost:3001/features",
        description: "OGC API - Features",
      },
    ],
    tags: ["Features"],
  },
  apis: ["./routes/features.js"],
};

const specs = swaggerJsdoc(options);

/**
 * @swagger
 * /:
 *     get:
 *       summary: Access to the landing page.
 *       description: Information can be accessed in HTML or JSON formats.
 *       tags: [Features]
 *       responses:
 *         200:
 *           description: Returns the landing page of the API.
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 required:
 *                   - links
 *                 properties:
 *                   title:
 *                     type: string
 *                   description:
 *                     type: string
 *                   links:
 *                     type: array
 *                     items:
 *                       $ref: http://schemas.opengis.net/ogcapi/features/part1/1.0/openapi/schemas/link.yaml
 */
router.get("/", function (req, res) {
  var contentType = "";
  var accept = req.headers.accept;

  if (accept == "application/json") contentType = "json";
  else if (accept == "text/html") contentType = "html";

  var urlParts = url.parse(req.url, true);

  // Switch on request accepted format
  if (null != urlParts.query.f) {
    if ("json" == urlParts.query.f) contentType = "json";
    else if ("html" == urlParts.query.f) contentType = "html";
    else {
      res.json(400, {
        error: { code: "InvalidParameterValue", description: "Invalid format" },
      });
      return;
    }
  }

  // HTML is default
  if (contentType == "") contentType = "html";

  if ("json" == contentType) res.json(negoc.landing(contentType));
  else if ("html" == contentType) res.send(negoc.landing(contentType));
});

/**
 * @swagger
 * /conformance:
 *     get:
 *       summary: Access to the conformance page.
 *       description: To support "generic" clients that want to access multiple OGC API Features implementations - and not "just" a specific API / server, the server has to declare the conformance classes it implements and conforms to.
 *       tags: [Features]
 *       responses:
 *         200:
 *           description: Returns the conformance array.
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 required:
 *                   - conformsTo
 *                 properties:
 *                   conformsTo:
 *                     type: array
 *                     items:
 *                       type: string
 */
router.get("/conformance", function (req, res) {
  var conformance = {};

  conformance.conformsTo = [];

  conformance.conformsTo.push(
    "http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/core"
  );
  conformance.conformsTo.push(
    "http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/html"
  );
  conformance.conformsTo.push(
    "http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/oas30"
  );
  conformance.conformsTo.push(
    "http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/geojson"
  );

  res.json(200, conformance);
});

/**
 * @swagger
 * /api:
 *     get:
 *       summary: Get the full API documentation.
 *       description: The documentation can be queried in YAML or JSON format.
 *       tags: [Features]
 *       parameters:
 *         - in: query
 *           name: f
 *           schema:
 *             type: string
 *             enum: [YAML, json]
 *             default: json
 *       responses:
 *         201:
 *           description: Full documentation of the APIs Measur3D and Features.
 */
router.get("/api", function (req, res) {
  var urlParts = url.parse(req.url, true);

  if (null == urlParts.query.f) {
    res.setHeader("Content-Type", "application/json");
    return res.status(201).send(specs);
  } else if ("yaml" == urlParts.query.f) {
    const swaggerSpecYaml = yaml.dump(specs);
    res.setHeader("Content-Type", "text/plain");
    res.status(201).send(swaggerSpecYaml);
  } else if ("json" == urlParts.query.f) {
    res.setHeader("Content-Type", "application/json");
    return res.status(201).send(specs);
  } else res.json(400, { error: "InvalidParameterValue" });
});

/**
 * @swagger
 * /api.html:
 *     get:
 *       summary: Get the API documentation as HTML.
 *       description: This function allows getting a specific CityModel. It gathers all information related to the model in the different collections from the database.
 *       tags: [Features]
 *       responses:
 *         200:
 *           description: OK - returns a '#/CityModel'.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/CityModel'
 *         500:
 *           description: Not found - There is no CityModel in the database.
 */

router.get("/api.html", function (req, res) {
  res.status(201).send(specs);
});

/**
 * @swagger
 * /collections:
 *     get:
 *       summary: Access to the collections page - About page.
 *       description: Information can be accessed in HTML or JSON formats.
 *       tags: [Features]
 *       parameters:
 *         - in: query
 *           name: f
 *           schema:
 *             type: string
 *             enum: [HTML, json]
 *             default: HTML
 *       responses:
 *         200:
 *           description: Returns an about page on collections.
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 required:
 *                   - links
 *                   - collections
 *                 properties:
 *                   links:
 *                     type: array
 *                     items:
 *                       $ref: http://schemas.opengis.net/ogcapi/features/part1/1.0/openapi/schemas/link.yaml
 *                   collections:
 *                     type: array
 *                     items:
 *                       $ref: http://schemas.opengis.net/ogcapi/features/part1/1.0/openapi/schemas/collection.yaml
 */
router.get("/collections", async function (req, res) {
  var urlParts = url.parse(req.url, true);

  var collections = await mongoose
    .model("CityModel")
    .find({}, "name metadata", async (err, data) => {
      if (err) {
        return res.status(404).send({ error: "There is no collections." });
      }
    })
    .lean();

  if (null == urlParts.query.f) {
    res.send(await negoc.collections("html", collections));
  } else if ("json" == urlParts.query.f) {
    res.json(await negoc.collections("json", collections));
  } else if ("html" == urlParts.query.f)
    res.send(await negoc.collections("html", collections));
  else res.json(400, { error: "InvalidParameterValue" });
});

/**
 * @swagger
 * /collections/:collectionId:
 *     get:
 *       summary: Get a specific collection.
 *       description: This function allows getting a specific CityModel. It gathers all information related to the model in the different collections from the database.
 *       tags: [Features]
 *       parameters:
 *         - in: query
 *           name: f
 *           schema:
 *             type: string
 *             enum: [HTML, json]
 *             default: HTML
 *         - in: path
 *           name: collectionId
 *           schema:
 *             type: string
 */
router.get("/collections/:collectionId", async function (req, res) {
  var urlParts = url.parse(req.url, true);

  var collection = await mongoose
    .model("CityModel")
    .findOne(
      { name: req.params.collectionId },
      "name metadata",
      async (err, data) => {
        if (err) {
          return res.status(404).send({
            error: "There is no collection " + req.params.collectionId,
          });
        }
      }
    )
    .lean();

  if (collection == null) {
    return res.status(404).send({
      error: "There is no collection " + req.params.collectionId,
    });
  }

  if (null == urlParts.query.f)
    res.send(await negoc.collection("html", collection));
  else if ("json" == urlParts.query.f)
    res.json(await negoc.collection("json", collection));
  else if ("html" == urlParts.query.f)
    res.send(await negoc.collection("html", collection));
  else
    res.json(400, {
      error: { code: "InvalidParameterValue", description: "Invalid format" },
    });
});

/**
 * @swagger
 * /collections/:collectionId/items:
 *     get:
 *       summary: Get items of a specific collection.
 *       description: This function allows getting all the items of a specific collection (limited to 10 items by default).
 *       tags: [Features]
 *       parameters:
 *         - in: query
 *           name: f
 *           schema:
 *             type: string
 *             enum: [HTML, json]
 *             default: HTML
 *           style: form
 *           explode: false
 *           required: false
 *         - in: query
 *           name: limit
 *           schema:
 *             type: integer
 *             minimum: 1
 *             maximum: 10000
 *             default: 10
 *           style: form
 *           explode: false
 *           required: false
 *         - in: query
 *           name: offset
 *           schema:
 *             type: integer
 *             default: 0
 *           style: form
 *           explode: false
 *           required: false
 *         - in: query
 *           name: bbox
 *           schema:
 *             type: array
 *             minItems: 4
 *             maxItems: 6
 *             items:
 *               type: number
 *           style: form
 *           explode: false
 *           required: false
 *         - in: query
 *           name: datetime
 *           schema:
 *             type: string
 *           style: form
 *           explode: false
 *           required: false
 *         - in: path
 *           name: collectionId
 *           schema:
 *             type: string
 *       responses:
 *         200:
 *           description: Returns a CityModel formalised following the OGC API Features - Part 1.
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 required:
 *                   - id
 *                   - links
 *                 properties:
 *                   id:
 *                     description: identifier of the collection used, for example, in URIs
 *                     type: string
 *                   title:
 *                     description: human readable title of the collection
 *                     type: string
 *                   description:
 *                     description: a description of the features in the collection
 *                     type: string
 *                   links:
 *                     type: array
 *                     items:
 *                       $ref: http://schemas.opengis.net/ogcapi/features/part1/1.0/openapi/schemas/link.yaml
 *                   extent:
 *                     description: The extent of the features in the collection. In the Core only spatial and temporal extents are specified. Extensions may add additional members to represent other extents, for example, thermal or pressure ranges.
 *                     type: object
 *                     properties:
 *                       spatial:
 *                         description: The spatial extent of the features in the collection.
 *                         type: object
 *                         properties:
 *                           bbox:
 *                             description: One or more bounding boxes that describe the spatial extent of the dataset. In the Core only a single bounding box is supported. Extensions may support additional areas. If multiple areas are provided, the union of the bounding boxes describes the spatial extent.
 *                             type: array
 *                             minItems: 1
 *                             items:
 *                               description: Each bounding box is provided as four or six numbers, depending on whether the coordinate reference system includes a vertical axis (height or depth).
 *
 *                                   * Lower left corner, coordinate axis 1
 *                                   * Lower left corner, coordinate axis 2
 *                                   * Minimum value, coordinate axis 3 (optional)
 *                                   * Upper right corner, coordinate axis 1
 *                                   * Upper right corner, coordinate axis 2
 *                                   * Maximum value, coordinate axis 3 (optional)
 *
 *                                 The coordinate reference system of the values is WGS 84 longitude/latitude (http://www.opengis.net/def/crs/OGC/1.3/CRS84) unless a different coordinate reference system is specified in `crs`.
 *                                 For WGS 84 longitude/latitude the values are in most cases the sequence of minimum longitude, minimum latitude, maximum longitude and maximum latitude. However, in cases where the box spans the antimeridian the first value (west-most box edge) is larger than the third value (east-most box edge).
 *                                 If the vertical axis is included, the third and the sixth number are the bottom and the top of the 3-dimensional bounding box.
 *                                 If a feature has multiple spatial geometry properties, it is the decision of the server whether only a single spatial geometry property is used to determine the extent or all relevant geometries.
 *                               type: array
 *                               minItems: 4
 *                               maxItems: 6
 *                               items:
 *                                 type: number
 *                           crs:
 *                             description: Coordinate reference system of the coordinates in the spatial extent (property `bbox`). The default reference system is WGS 84 longitude/latitude. In the Core this is the only supported coordinate reference system. Extensions may support additional coordinate reference systems and add additional enum values.
 *                             type: string
 *                             enum:
 *                               - 'http://www.opengis.net/def/crs/OGC/1.3/CRS84'
 *                             default: 'http://www.opengis.net/def/crs/OGC/1.3/CRS84'
 *                       temporal:
 *                         description: The temporal extent of the features in the collection.
 *                         type: object
 *                         properties:
 *                           interval:
 *                             description: One or more time intervals that describe the temporal extent of the dataset. The value `null` is supported and indicates an open time intervall. In the Core only a single time interval is supported. Extensions may support multiple intervals. If multiple intervals are provided, the union of the intervals describes the temporal extent.
 *                             type: array
 *                             minItems: 1
 *                             items:
 *                               description: Begin and end times of the time interval. The timestamps are in the coordinate reference system specified in `trs`. By default this is the Gregorian calendar.
 *                               type: array
 *                               minItems: 2
 *                               maxItems: 2
 *                               items:
 *                                 type: string
 *                                 format: date-time
 *                                 nullable: true
 *                           trs:
 *                             description: Coordinate reference system of the coordinates in the temporal extent (property `interval`). The default reference system is the Gregorian calendar. In the Core this is the only supported temporal reference system. Extensions may support additional temporal reference systems and add additional enum values.
 *                             type: string
 *                             enum:
 *                               - 'http://www.opengis.net/def/uom/ISO-8601/0/Gregorian'
 *                             default: 'http://www.opengis.net/def/uom/ISO-8601/0/Gregorian'
 *                   itemType:
 *                     description: indicator about the type of the items in the collection (the default value is 'feature').
 *                     type: string
 *                     default: feature
 *                   crs:
 *                     description: the list of coordinate reference systems supported by the service
 *                     type: array
 *                     items:
 *                       type: string
 *                       default:
 *                         - http://www.opengis.net/def/crs/OGC/1.3/CRS84
 */
router.get("/collections/:collectionId/items", async function (req, res) {
  //Next is not implemented. Might be useful in huge datasets.

  var urlParts = url.parse(req.url, true);

  var limit, offset, bbox;
  var default_limit = 10;

  if (urlParts.query.datetime != undefined) {
    return res
      .status(400)
      .send({ error: "Error: datetime is not supported yet." });

    if (
      !/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/.test(
        String(urlParts.query.datetime)
      )
    )
      return res.status(400).send({
        error: {
          code: "InvalidParameterValue",
          description: "Invalid datetime format",
        },
      });
  }

  if (urlParts.query.limit != undefined) {
    limit = Number(urlParts.query.limit);
  } else {
    limit = default_limit;
  }

  if (urlParts.query.offset != undefined) {
    offset = Number(urlParts.query.offset);
  } else {
    offset = 0;
  }

  var find_objects = {};
  var key;

  find_objects.CityModel = req.params.collectionId;

  for (var i = 0; i < Object.keys(urlParts.query).length; i++) {
    key = Object.keys(urlParts.query)[i];

    if (!["f", "limit", "offset", "bbox", "datetime"].includes(key)) {
      find_objects[key] = urlParts.query[key];
    }
  }

  if (urlParts.query.bbox != undefined) {
    var bbox = urlParts.query.bbox;

    if (!/((\d)+(\.)?(\d)*\,){3,}((\d)+(\.)?(\d)*){1}/.test(String(bbox)))
      return res.status(400).send({
        error: {
          code: "InvalidParameterValue",
          description: "Invalid bbox format",
        },
      });

    bbox = bbox.split(",");

    for (var i = 0; i < bbox.length; i++) {
      bbox[i] = Number(bbox[i]);
    }

    var min_x, max_x, min_y, max_y;

    if (bbox.length == 4) {
      if (bbox[0] >= bbox[2] || bbox[1] >= bbox[3])
        return res.status(400).send({
          error: {
            code: "InvalidParameterValue",
            description:
              "Invalid bbox format - min and max coordinates are not respected",
          },
        });
      if (bbox[0] > -180 && bbox[0] < 180) {
        min_x = bbox[0];
      } else {
        return res.status(400).send({
          error: {
            code: "InvalidParameterValue",
            description: "Invalid bbox format - min longitude problem",
          },
        });
      }
      if (bbox[1] > -90 && bbox[1] < 90) {
        min_y = bbox[1];
      } else {
        return res.status(400).send({
          error: {
            code: "InvalidParameterValue",
            description: "Invalid bbox format - min latitude problem",
          },
        });
      }
      if (bbox[2] > -180 && bbox[2] < 180) {
        max_x = bbox[2];
      } else {
        return res.status(400).send({
          error: {
            code: "InvalidParameterValue",
            description: "Invalid bbox format - max longitude problem",
          },
        });
      }
      if (bbox[3] > -90 && bbox[3] < 90) {
        max_y = bbox[3];
      } else {
        return res.status(400).send({
          error: {
            code: "InvalidParameterValue",
            description: "Invalid bbox format - max latitude problem",
          },
        });
      }
    } else {
      return res.status(500).send({
        error:
          "Error: Only 2dsphere index is currently supported by the database.",
      });
    }

    bbox = {
      type: "Polygon",
      coordinates: [
        [
          [min_x, min_y],
          [min_x, max_y],
          [max_x, max_y],
          [max_x, min_y],
          [min_x, min_y],
        ],
      ],
    };

    var abstractCityObjects = await mongoose
      .model("CityObject")
      .find(find_objects, async (err, data) => {
        if (err) {
          return res
            .status(404)
            .send({ error: "Error: There is no item in this collection." });
        }
      })
      .where("location")
      .within(bbox)
      .limit(limit)
      .skip(offset)
      .lean();
  } else {
    var abstractCityObjects = await mongoose
      .model("CityObject")
      .find(find_objects, async (err, data) => {
        if (err) {
          return res
            .status(404)
            .send({ error: "Error: There is no item in this collection." });
        }
      })
      .limit(limit)
      .skip(offset)
      .lean();
  }

  if (
    Object.keys(abstractCityObjects).length == 0 ||
    abstractCityObjects == null ||
    abstractCityObjects == undefined
  ) {
    res.status(404).send({
      error:
        "Error: there is no items in this collection under these conditions.",
    });
    return;
  }

  var self = urlParts.search.replace("?", "");
  var alternate = urlParts.search.replace("?", "");

  if (null == urlParts.query.f) {
    self = self + "&f=html";
    alternate = alternate + "&f=json";

    res.send(
      negoc.items(
        "html",
        self,
        alternate,
        req.params.collectionId,
        abstractCityObjects
      )
    );
  } else if ("json" == urlParts.query.f) {
    alternate = alternate.replace("json", "html");

    res.json(
      negoc.items(
        "json",
        self,
        alternate,
        req.params.collectionId,
        abstractCityObjects
      )
    );
  } else if ("html" == urlParts.query.f) {
    alternate = alternate.replace("html", "json");

    res.send(
      negoc.items(
        "html",
        self,
        alternate,
        req.params.collectionId,
        abstractCityObjects
      )
    );
  } else {
    res.json(400, {
      error: { code: "InvalidParameterValue", description: "Invalid format" },
    });
  }
});

/**
 * @swagger
 * /collections/:collectionId/items/:item:
 *     get:
 *       summary: Get a specific CityModel.
 *       description: This function allows getting a specific CityModel. It gathers all information related to the model in the different collections from the database.
 *       tags: [Features]
 *       parameters:
 *         - in: query
 *           name: f
 *           schema:
 *             type: string
 *             enum: [HTML, json]
 *             default: HTML
 *       responses:
 *         200:
 *           description: OK - returns a '#/CityModel'.
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/CityModel'
 *         500:
 *           description: Not found - There is no CityModel in the database.
 */
router.get("/collections/:collectionId/items/:item", function (req, res) {
  console.log(req.params);
  res.send("collections/:collectionId/items/:item");
});

module.exports = router;
