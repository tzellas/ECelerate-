const ApiError = require("../utils/ApiError");
const { buildErrorLog } = require("../utils/utils");
const balanceModel = require("../models/balanceModel");

exports.getMyBalance = async (req, res) => {
  try {
    if (!req.session?.driver) {
      throw new ApiError(401, "Not authenticated");
    }

    const data = await balanceModel.getDriverBalance(
      req.session.driver.driver_id
    );

    return res.status(200).json(data);
  } catch (err) {
    if (err instanceof ApiError) {
      return res
        .status(err.statusCode)
        .json(buildErrorLog(req, err.statusCode, err.message));
    }

    return res
      .status(500)
      .json(buildErrorLog(req, 500, "Internal server error", err.message));
  }
};

exports.getMyPayments = async (req, res) => {
  try {
    if (!req.session?.driver) {
      throw new ApiError(401, "Not authenticated");
    }

    const limit = Number(req.query.limit) || 5;

    const payments = await balanceModel.getRecentPayments(
      req.session.driver.driver_id,
      limit
    );

    return res.status(200).json(payments);
  } catch (err) {
    if (err instanceof ApiError) {
      return res
        .status(err.statusCode)
        .json(buildErrorLog(req, err.statusCode, err.message));
    }

    return res
      .status(500)
      .json(buildErrorLog(req, 500, "Internal server error", err.message));
  }
};

exports.addMoney = async (req, res) => {
    try {
      if (!req.session?.driver) {
        throw new ApiError(401, "Not authenticated");
      }
  
      const { amount } = req.body;
  
      const numAmount = Number(amount);
  
      // Validation must be greater than 0.00
      if (!Number.isFinite(numAmount) || numAmount <= 0) {
        throw new ApiError(
          400,
          "Invalid amount",
          "Amount must be greater than 0.00"
        );
      }
  
      await balanceModel.addBalance(
        req.session.driver.driver_id,
        numAmount
      );
  
      return res.status(200).json({ message: "Balance updated" });
  
    } catch (err) {
      if (err instanceof ApiError) {
        return res
          .status(err.statusCode)
          .json(buildErrorLog(req, err.statusCode, err.message, err.debugInfo));
      }
  
      return res
        .status(500)
        .json(buildErrorLog(req, 500, "Internal server error", err.message));
    }
  };
  