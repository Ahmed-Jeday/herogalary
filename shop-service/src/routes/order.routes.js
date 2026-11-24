const express = require("express");
const authenticate = require("../middlewares/auth.middleware");
const orderController = require("../controllers/order.controller");

const router = express.Router();

router.use(authenticate);
router.post("/", orderController.createOrder);
router.get("/me", orderController.listMyOrders);
router.get("/user/:userId", orderController.listOrdersByUserId);

module.exports = router;
