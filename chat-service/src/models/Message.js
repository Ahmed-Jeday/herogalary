const mongoose = require("mongoose");
const { LIMITS } = require("../utils/constants");

const messageSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      trim: true,
    },
    authorId: {
      type: String,
      required: true,
    },
    // Pseudo conservé au moment de l'envoi (snapshot d'affichage).
    author: {
      type: String,
      required: true,
      trim: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: LIMITS.MESSAGE_MAX,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
  },
);

// Index principal : derniers messages d'une room.
messageSchema.index({ roomId: 1, createdAt: -1, _id: -1 });

messageSchema.set("toJSON", {
  transform(_doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

module.exports = mongoose.model("Message", messageSchema);
