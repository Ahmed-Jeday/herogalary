const express = require("express");
const authenticate = require("../middlewares/auth.middleware");
const roomController = require("../controllers/room.controller");

const router = express.Router();

router.use(authenticate);

router.get("/", roomController.listRooms);
router.post("/", roomController.createRoom);
router.get("/:id/messages", roomController.listMessages);

module.exports = router;
