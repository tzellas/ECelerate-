const express = require("express");
const router = express.Router();

const updpointController = require("../controllers/updpointController");

router.post("/updpoint/:id", updpointController.updpoint);

module.exports = router;
