const express = require("express");
const router = express.Router();

const vehicleController = require("../controllers/vehiclesController");

router.get("/user/vehicles", vehicleController.getMyVehicles);
router.post("/user/addVehicle", vehicleController.createMyVehicle);


module.exports = router;