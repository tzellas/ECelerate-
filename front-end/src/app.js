const express = require("express");
const path = require("path");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));


app.get("/", (req, res) => {
  res.render("welcome");
});

app.get("/login", (req, res) => {
    res.render("login");
  });
  
  app.get("/register", (req, res) => {
    res.render("create_account");
  });
  
  app.get("/logout", (req, res) => {
    res.redirect("/");
  });
  
  app.get("/home", (req, res) => {
    res.render("home");
  });
  
  app.get("/user", (req, res) => {
    res.render("user");
  });
  
  app.get("/charge", (req, res) => {
    res.render("charge");
  });

  app.get("/balance", (req, res) => {
    res.render("balance");
  });

  app.get("/balance/history", (req, res) => {
      res.render("balance_history");
  });
  
  app.get("/user/addVehicle", (req, res) => {
    res.render("add_vehicle");
  });

  app.get("/statistics", (req, res) => {
    res.render("statistics");
  });

  app.get("/stations", (req, res) => {
    res.render("stations");
  });

app.listen(3000, () => {
  console.log("Frontend running at http://localhost:3000");
});