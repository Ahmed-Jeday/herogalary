const dashboardService = require("../services/dashboard.service");

async function getUser(req, res, next) {
  try {
    const user = await dashboardService.getDashboardUser(req.user.id);
    return res.status(200).json({ user });
  } catch (error) {
    return next(error);
  }
}

async function updateProfile(req, res, next) {
  try {
    const user = await dashboardService.updateDashboardProfile(req.user.id, req.body);
    return res.status(200).json({ user });
  } catch (error) {
    return next(error);
  }
}

async function getStats(req, res, next) {
  try {
    const stats = await dashboardService.getStats(req.user.id);
    return res.status(200).json({ stats });
  } catch (error) {
    return next(error);
  }
}

async function getContinueReading(req, res, next) {
  try {
    const reading = await dashboardService.getContinueReading(req.user.id);
    return res.status(200).json({ continueReading: reading });
  } catch (error) {
    return next(error);
  }
}

async function getFavorites(req, res, next) {
  try {
    const favorites = await dashboardService.getFavorites(req.user.id);
    return res.status(200).json({ favorites });
  } catch (error) {
    return next(error);
  }
}

async function getWatchlist(req, res, next) {
  try {
    const watchlist = await dashboardService.getWatchlist(req.user.id);
    return res.status(200).json({ watchlist });
  } catch (error) {
    return next(error);
  }
}

async function setWatchStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const item = await dashboardService.setWatchStatus(req.user.id, id, status);
    return res.status(200).json({ item });
  } catch (error) {
    return next(error);
  }
}

async function getComics(req, res, next) {
  try {
    const comics = await dashboardService.getComics(req.user.id);
    return res.status(200).json({ comics });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getUser,
  updateProfile,
  getStats,
  getContinueReading,
  getFavorites,
  getWatchlist,
  setWatchStatus,
  getComics,
};
