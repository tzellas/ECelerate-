

const { buildErrorLog } = require("../utils/utils");
const healthcheckModel = require("../models/healthcheckModel");


exports.healthcheck = async (req, res) => {

    try {   
        
        const stats = await healthcheckModel.getHealthStats();


        return res.status(200).json({
            status: "OK",
            dbconnection: "Database is Up and Running",
            ...stats
        });
    } catch(err) {
        return res.status(400).json(buildErrorLog(req, 400, err.message , "Database Unreachable"));
    }

};

