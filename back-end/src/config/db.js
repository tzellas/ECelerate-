const { Pool } = require("pg");

const pool = new Pool({
    host: "localhost",
    user: "postgres",
    password: "password",
    database: "SoftengDB",
    port: 5432,
});

pool.on("error", (err) => {
    console.error("Unexpected PG error", err);
    process.exit(1);
});

module.exports = { pool };