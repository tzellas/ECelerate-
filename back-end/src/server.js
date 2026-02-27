const express = require("express");
const cors = require("cors");
const session = require("express-session");
const { buildErrorLog } = require("./utils/utils");

const app = express();
const BASE = "/api";

/* MIDDLEWARE */

// CORS (MUST be before routes)
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));

// JSON body parsing
app.use(express.json());

// Session middleware
app.use(session({
  name: "softeng.sid",
  secret: "softeng-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 2 // 2 hours
  }
}));

// ROUTES 
const adminRoutes = require("./routes/adminRoutes");
app.use(BASE + "/admin", adminRoutes);

const pointsRoute = require("./routes/pointsRoute");
app.use(BASE, pointsRoute);

const singlePointRoute = require("./routes/singlePointRoute");
app.use(BASE, singlePointRoute);

const updpointRoute = require("./routes/updpointRoute");
app.use(BASE, updpointRoute);

const reserveRoute = require("./routes/reserveRoutes");
app.use(BASE, reserveRoute);

const newSessionRoute = require("./routes/newSessionRoutes");
app.use(BASE, newSessionRoute);

const pointStatusRoute = require("./routes/pointStatusRoutes");
app.use(BASE, pointStatusRoute);

const sessionsRoute = require("./routes/sessionsRoutes");
app.use(BASE, sessionsRoute);

const authRoute = require("./routes/authRoutes");
app.use(BASE + "/auth", authRoute);

const userRoutes = require("./routes/userRoutes");
app.use(BASE, userRoutes);

const vehicleRoutes = require("./routes/vehiclesRoutes");
app.use(BASE, vehicleRoutes);

const balanceRoutes = require("./routes/balanceRoutes");
app.use(BASE, balanceRoutes);

const chargePageRoutes = require("./routes/chargeRoutes");
app.use(BASE, chargePageRoutes);

// if the request is a non specified path - return 404 Error
app.use((req, res) => { 
  return res.status(404).json( 
    buildErrorLog( req, 404, "Service not found", "The requested endpoint does not exist" ) ); 
  }
);

app.listen(9876, () => {
  console.log("Server running at http://localhost:9876");
});
