const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1, validate: Number.isInteger },
  },
  { _id: false },
);

const paymentSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["unpaid", "paid", "failed"],
      default: "unpaid",
    },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, enum: ["EUR"], default: "EUR" },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items) => items.length > 0,
        message: "An order must contain at least one item",
      },
    },
    total: { type: Number, required: true, min: 0 },
    payment: { type: paymentSchema, required: true },
    status: {
      type: String,
      enum: ["pending", "success"],
      default: "pending",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Order", orderSchema);
