const express = require("express");
const router = express.Router();
const chargeController = require("../controllers/chargeController");

router.get("/charge/initialize", chargeController.initializeChargePage);
router.get("/charge/reserve/:id/:minutes", chargeController.reserve);
router.get("/charge/reserve/:id", chargeController.reserve);
router.post("/charge/intent", chargeController.storeChargingIntent);
router.post("/charge/start/reserved", chargeController.startChargingFromReservedPosition);
router.post("/charge/start/direct",chargeController.startChargingDirect);
router.post("/charge/stop", chargeController.stopCharging);
  
module.exports = router;