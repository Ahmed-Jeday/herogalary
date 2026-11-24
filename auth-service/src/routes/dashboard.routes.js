const express = require("express");
const dashboardController = require("../controllers/dashboard.controller");
const authenticate = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(authenticate);

router.get("/user", dashboardController.getUser);
router.patch("/profile", dashboardController.updateProfile);
router.get("/stats", dashboardController.getStats);
router.get("/continue-reading", dashboardController.getContinueReading);
router.get("/favorites", dashboardController.getFavorites);
router.get("/watchlist", dashboardController.getWatchlist);
router.patch("/watchlist/:id", dashboardController.setWatchStatus);
router.get("/comics", dashboardController.getComics);

module.exports = router;
