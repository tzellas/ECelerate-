

const { buildErrorLog } = require("../utils/utils");
const addpointsModel = require("../models/addpointsModel");
const { parse } = require("csv-parse/sync");
const ApiError = require("../utils/ApiError");
const { checkDbConnection } = require("../utils/checkDbConnection");


exports.addChargers = async (req, res) => {

    try {   
        if (!req.file){
            throw new ApiError(400, err.message, "Provide a file");
        }
        
        const mime = req.file.mimetype || "";

        // Windows MIME type for CSV is vnd.ms-excel
        if (!(mime.startsWith("text/csv") || mime === "application/vnd.ms-excel")) {
            throw new ApiError(400, `Invalid MIME type: ${mime}`, "MIME type has to be text/csv");
        }

        const csvText = req.file.buffer.toString("utf8");
        const rows = parse(csvText, {
                columns: true,
                trim: true
            });

        if (rows.length === 0) {
            throw new ApiError(400, err.message, "No rows found in the provided file");
        }

        const dbOk = await checkDbConnection();
        if (!dbOk) {
            throw new ApiError(400, "Database connection error");
        }
        await addpointsModel.createChargers(rows);

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
