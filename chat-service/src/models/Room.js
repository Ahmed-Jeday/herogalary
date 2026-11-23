const mongoose = require("mongoose");
const { UNIVERSES, LIMITS } = require("../utils/constants");

/**
 * Une room est identifiée par son slug (_id = "captain-meteor"),
 * ce qui garde des URLs lisibles et colle aux ids du frontend.
 */
const roomSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: LIMITS.ROOM_NAME_MIN,
      maxlength: LIMITS.ROOM_NAME_MAX,
    },
    universe: {
      type: String,
      required: true,
      enum: UNIVERSES,
      default: "Autre",
    },
    description: {
      type: String,
      trim: true,
      maxlength: LIMITS.ROOM_DESCRIPTION_MAX,
      default: "",
    },
    createdBy: {
      id: { type: String, required: true },
      username: { type: String, required: true, trim: true },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

roomSchema.set("toJSON", {
  transform(_doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

module.exports = mongoose.model("Room", roomSchema);
