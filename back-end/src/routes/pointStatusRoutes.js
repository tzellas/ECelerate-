const express = require("express");
const router = express.Router();

const pointStatusController = require("../controllers/pointStatusController");
router.get("/pointstatus/:pointid/:from/:to", pointStatusController.getPointStatus);

module.exports = router;
