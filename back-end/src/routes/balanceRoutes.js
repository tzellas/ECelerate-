const express = require("express");
const router = express.Router();
const balanceController = require("../controllers/balanceController");

router.get("/balance/me", balanceController.getMyBalance);
router.get("/balance/payments", balanceController.getMyPayments);
router.post("/balance/add", balanceController.addMoney);

module.exports = router;
