const express = require("express");
const cors = require("cors");
require('dotenv').config();
const mongoose = require("mongoose");
const userRoutes = require("./routes/userRoutes");
// const profileRoutes =require("./routes/profileRoutes")
const session = require("express-session");
const passport = require("./passport");

const app = express();

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.use(cors());
app.use(express.json());
app.use("/api/user", userRoutes);
// app.use("/api/profile",profileRoutes);

app.use(session({
  secret: process.env.SESSION_SECRET || "keyboard cat",
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }, // set secure: true in production with HTTPS
}));
app.use(passport.initialize());
app.use(passport.session());

app.get("/", (req, res) => res.send("User service running"));

const PORT = process.env.PORT || 4005;
app.listen(PORT, () => {
  console.log(`User service running on port ${PORT}`);
});