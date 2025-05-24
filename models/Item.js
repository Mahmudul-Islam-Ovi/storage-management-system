const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["folder", "note", "image", "pdf"],
      required: true,
    },
    content: {
      type: String, // For notes only
      default: "",
    },
    filePath: {
      type: String, // For images and PDFs
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item", // Reference to parent folder
      default: null,
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    pin: {
      type: String,
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
    sharedWith: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Users with access to this item
      },
    ],
  },
  { timestamps: true }
);

itemSchema.pre("save", async function (next) {
  if (this.pin && this.isModified("pin")) {
    const bcrypt = require("bcryptjs");
    this.pin = await bcrypt.hash(this.pin, 10);
  }
  next();
});

module.exports = mongoose.model("Item", itemSchema);
