const express = require("express");
const router = express.Router();

const newSessionController = require("../controllers/newSessionController");
router.post("/newsession", newSessionController.newSession);

module.exports = router;