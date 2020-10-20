/* ----------------------------------------
This file proposes to validate and structure geometry families independently
---------------------------------------- */

/**
 *  @swagger
 *   components:
 *     schemas:
 *       Geometry:
 *         type: object
 *         required:
 *           - type
 *           - CityModel
 *           - CityObject
 *           - lod
 *           - boundaries
 *         properties:
 *           type:
 *             type: string
 *             format: ISO 19107
 *             description: Geometric primitives that are non-decomposed objects presenting information about geometric configuration.
 *           CityModel:
 *             type: string
 *             description: Reference to the parent CityModel - created by the method '#/Measur3D/uploadCityModel'.
 *           CityObject:
 *             type: string
 *             description: Reference to the parent CityObject - created by the method '#/Measur3D/uploadCityModel'.
 *           lod:
 *             type: number
 *             description: A number identifying the level-of-detail.
 *           boundaries:
 *             description: A hierarchy of arrays (the depth depends on the Geometry object) with integers. An integer refers to the index in the "vertices" array of the referenced CityObject (0-based).
 *             type: array
 *             items:
 *               type: number
 *           semantics:
 *             description: A JSON object representing the semantics of a surface, and may also represent other attributes of the surface.
 *             type: object
 *             properties:
 *               surfaces:
 *                 description: An array of Semantic Surface Objects
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       description:
 *                     parent:
 *                       type: number
 *                       description: An integer pointing to another Semantic Object of the same geometry (index of it, 0-based).
 *                     children:
 *                       type: array
 *                       items:
 *                         type: number
 *                       description: An array of integers pointing to other Semantic Objects of the same geometry (index of it, 0-based).
 *               values:
 *                 type: array
 *                 items:
 *                   type: number
 *                 description: A hierarchy of arrays with integers that refer to the index in the "surfaces" array of the same geometry (0-based).
 *           material:
 *             type: object
 *             $ref: '#/components/schemas/Material'
 *           texture:
 *             type: object
 *             $ref: '#/components/schemas/Texture'
 *         example:
 *           type: MultiSurface
 *           lod: 2,
 *           boundaries: [[[0, 3, 2, 1]], [[4, 5, 6, 7]], [[0, 1, 5, 4]], [[0, 2, 3, 8]], [[10, 12, 23, 48]]]
 *           semantics:
 *             surfaces: [ {
 *               type: WallSurface,
 *               slope: 33.4,
 *               children: [2] }, {
 *               type: RoofSurface,
 *               slope: 66.6 }, {
 *               type: Door,
 *               parent: 0,
 *               colour: blue } ]
 *             values: [0, 0, null, 1, 2]
 */

let mongoose = require("mongoose");

let GeometrySchema = new mongoose.Schema({
  type: { type: String },
  CityModel: { type: String, index: true },
  CityObject: { type: String, index: true },
  lod: { type: Number, required: true, validate: /([0-3]{1}\.?)+[0-3]?/ },
  boundaries: {},
  semantics: {},
  material: {},
  texture: {}
});

let GeometryInstanceSchema = new mongoose.Schema({
  // Different but the same
  type: {
    type: String,
    required: true,
    default: "GeometryInstance"
  },
  CityModel: String,
  template: {
    type: Number
  },
  boundaries: {
    type: [[Array]],
    required: true
  },
  transformationMatrix: {
    type: [Number],
    required: true,
    validate: function() {
      return this["transformationMatrix"].length % 16 == 0;
    }
  }
});

GeometryInstance = mongoose.model("GeometryInstance", GeometryInstanceSchema);
Geometry = mongoose.model("Geometry", GeometrySchema);

let SolidGeometry = mongoose.model("Geometry").discriminator(
  "SolidGeometry",
  new mongoose.Schema({
    type: {
      type: String,
      enum: "Solid",
      required: true
    },
    boundaries: { type: [[[[Number]]]], required: true },
    semantics: {
      surfaces: { type: [], default: undefined },
      values: [[Number]]
    },
    material: {
      visual: {
        values: { type: [[Number]], default: undefined }
      }
    },
    texture: {
      visual: {
        values: { type: [[[[Number]]]], default: undefined }
      }
    }
  })
);

let MultiSolidGeometry = mongoose.model("Geometry").discriminator(
  "MultiSolidGeometry",
  new mongoose.Schema({
    type: {
      type: String,
      enum: ["MultiSolid", "CompositeSolid"],
      required: true
    },
    boundaries: { type: [[[[[Number]]]]], required: true },
    semantics: {
      surfaces: { type: [], default: undefined },
      values: [[[Number]]]
    },
    material: {
      visual: {
        values: { type: [[[Number]]], default: undefined }
      }
    },
    texture: {
      visual: {
        values: { type: [[[[[Number]]]]], default: undefined }
      }
    }
  })
);

let MultiSurfaceGeometry = mongoose.model("Geometry").discriminator(
  "MultiSurfaceGeometry",
  new mongoose.Schema({
    type: {
      type: String,
      enum: ["MultiSurface", "CompositeSurface"],
      required: true
    },
    boundaries: { type: [[[Number]]], required: true },
    semantics: { surfaces: { type: [], default: undefined }, values: [Number] },
    material: {
      visual: {
        values: { type: [Number], default: undefined }
      }
    },
    texture: {
      visual: {
        values: { type: [[[Number]]], default: undefined }
      }
    }
  })
);

let MultiLineStringGeometry = mongoose.model("Geometry").discriminator(
  "MultiLineStringGeometry",
  new mongoose.Schema({
    type: {
      type: String,
      enum: "MultiLineString",
      required: true
    },
    boundaries: { type: [[Number]], required: true }
  })
);

let MultiPointGeometry = mongoose.model("Geometry").discriminator(
  "MultiPointGeometry",
  new mongoose.Schema({
    type: {
      type: String,
      enum: "MultiLineString",
      required: true
    },
    boundaries: { type: [Number], required: true }
  })
);

module.exports = {
  insertGeometry: async (object, jsonName) => {
    object.CityModel = jsonName;

    switch (object.type) {
      case "Solid":
        geometry = new SolidGeometry(object);
        break;
      case "MultiSolid":
      case "CompositeSolid":
        geometry = new MultiSolidGeometry(object);
        break;
      case "MultiSurface":
      case "CompositeSurface":
        geometry = new MultiSurfaceGeometry(object);
        break;
      case "MultiLineString":
        geometry = new MultiLineStringGeometry(object);
        break;
      case "MultiPoint":
        geometry = new MultiPointGeometry(object);
        break;
      default:
        throw new Error(object + " does not have a valid geometry type.");
    }

    geometry["CityObject"] = object.name;

    try {
      let element = await geometry.save();
      return element.id;
    } catch (err) {
      console.error(err.message);
    }
  },

  Model: Geometry,
  Schema: GeometrySchema
};
