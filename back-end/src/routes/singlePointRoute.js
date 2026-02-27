const express = require("express");
const router = express.Router();

const singlePointController = require("../controllers/singlePointController");

router.get("/point/:id", singlePointController.singlePoint);

module.exports = router;
