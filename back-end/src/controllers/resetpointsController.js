

const { buildErrorLog } = require("../utils/utils");
const resetpointsModel = require("../models/resetpointsModel");
const fs = require("fs");
const RESET_FILE = "./data/parts1234.json";
const { checkDbConnection } = require("../utils/checkDbConnection");
const ApiError = require("../utils/ApiError");

exports.resetpoints = async (req, res) => {

    try {   
        let stations;
        try {
            const raw = fs.readFileSync(RESET_FILE, "utf8");
            stations = JSON.parse(raw);
        } catch (e) {
            throw new ApiError(400, "Invalid JSON file", e.message);
        }


        const dbOk = await checkDbConnection();
        if (!dbOk) {
            throw new ApiError(400, "Database connection error", "Unable to connect to database");
        }
        
        await resetpointsModel.initialiseChargers(stations);

        return res.sendStatus(200);

    } catch(err) {
        if (err instanceof ApiError) {
            return res.status(err.statusCode).json(
              buildErrorLog(req, err.statusCode, err.message, err.debugInfo)
            );
        }    
    
        return res.status(500).json(
            buildErrorLog(req, 500, "Internal server error", err.message)
        );
    }

};


