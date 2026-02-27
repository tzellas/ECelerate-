

const express = require("express");
const router = express.Router();
const multer = require("multer");

const healthcheckController = require("../controllers/healthcheckController");
router.get("/healthcheck", healthcheckController.healthcheck);

const resetpointsController = require("../controllers/resetpointsController");
router.post("/resetpoints", resetpointsController.resetpoints);

const addpointsController = require("../controllers/addpointsController");

const upload = multer({ storage: multer.memoryStorage() });
router.post(
            "/addpoints",
            upload.single("file"),
            addpointsController.addChargers
        );

module.exports = router;
