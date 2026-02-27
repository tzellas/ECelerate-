const ApiError = require("../utils/apiError");
const { buildErrorLog } = require("../utils/utils");
const userStatsModel = require("../models/userStatsModel");

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

exports.getAvailableYears = async (req, res) => {
  try {
    if (!req.session?.driver) {
      throw new ApiError(401, "Not authenticated");
    }

    const driverId = req.session.driver.driver_id;
    const years = await userStatsModel.getAvailableYears(driverId);

    return res.status(200).json({ years });
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

exports.getStats = async (req, res) => {
  try {
    if (!req.session?.driver) {
      throw new ApiError(401, "Not authenticated");
    }

    const driverId = req.session.driver.driver_id;
    const granularity = req.query.granularity || "month";

    if (!["month", "year"].includes(granularity)) {
      throw new ApiError(400, "Invalid granularity", "Allowed: month, year");
    }

    if (granularity === "month") {
      const year = Number(req.query.year);
      if (!Number.isInteger(year)) {
        throw new ApiError(400, "Invalid year", "Year must be an integer");
      }

      const rows = await userStatsModel.getMonthlyStats(driverId, year);
      const labels = rows.map(r => MONTH_LABELS[r.m - 1]);
      const sessions = rows.map(r => Number(r.sessions));
      const energy = rows.map(r => Number(r.energy));
      const money = rows.map(r => Number(r.money));

      return res.status(200).json({ labels, sessions, energy, money });
    }

    let fromYear = Number(req.query.from);
    let toYear = Number(req.query.to);
    if (!Number.isInteger(fromYear) || !Number.isInteger(toYear) || toYear < fromYear) {
      const currentYear = new Date().getFullYear();
      toYear = currentYear;
      fromYear = currentYear - 4;
    }

    const rows = await userStatsModel.getYearlyStats(driverId, fromYear, toYear);
    const labels = rows.map(r => String(r.y));
    const sessions = rows.map(r => Number(r.sessions));
    const energy = rows.map(r => Number(r.energy));
    const money = rows.map(r => Number(r.money));

    return res.status(200).json({ labels, sessions, energy, money });
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
