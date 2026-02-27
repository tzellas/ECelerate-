
const express = require("express");
const router = express.Router();

const reserveController = require("../controllers/reserveController");

// with minutes
router.post("/reserve/:id/:minutes", reserveController.reserveCharger);

// without minutes (default 30)
router.post("/reserve/:id", reserveController.reserveCharger);

module.exports = router;
