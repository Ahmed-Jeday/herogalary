const Order = require("../models/order.model");

function normalizeItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    const error = new Error("Order items are required");
    error.status = 400;
    throw error;
  }

  return items.map((item) => {
    const price = Number(item.price);
    const quantity = Number(item.quantity);

    if (!item.productId || !item.name || !Number.isFinite(price) || price < 0
      || !Number.isInteger(quantity) || quantity < 1) {
      const error = new Error("Each item must have a valid productId, name, price and quantity");
      error.status = 400;
      throw error;
    }

    return {
      productId: String(item.productId),
      name: String(item.name).trim(),
      price,
      quantity,
    };
  });
}

async function createOrder(req, res, next) {
  try {
    const items = normalizeItems(req.body?.items);
    const total = Number(items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2));

    const order = await Order.create({
      userId: req.user.id,
      items,
      total,
      payment: {
        status: "unpaid",
        amount: total,
        currency: "EUR",
      },
      status: "pending",
    });

    return res.status(201).json({
      message: "Commande enregistrée. Le paiement reste à effectuer.",
      order,
    });
  } catch (error) {
    return next(error);
  }
}

async function listMyOrders(req, res, next) {
  try {
    const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 }).lean();
    return res.status(200).json({ orders });
  } catch (error) {
    return next(error);
  }
}

module.exports = { createOrder, listMyOrders };
