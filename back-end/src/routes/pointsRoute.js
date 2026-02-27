
const express = require("express");
const router = express.Router();

const pointsController = require("../controllers/pointsController");
router.get("/points", pointsController.points);

module.exports = router;