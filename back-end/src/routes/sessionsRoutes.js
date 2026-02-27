const express = require("express");
const router = express.Router();

const sessionsController = require("../controllers/sessionsController");
router.get("/sessions/:id/:from/:to", sessionsController.getSessions);

module.exports = router;
