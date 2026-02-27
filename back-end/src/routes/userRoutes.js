const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const userStatsController = require("../controllers/userStatsController");

router.get("/user/me", userController.getMyProfile);
router.get("/user/stats/years", userStatsController.getAvailableYears);
router.get("/user/stats", userStatsController.getStats);

module.exports = router;
