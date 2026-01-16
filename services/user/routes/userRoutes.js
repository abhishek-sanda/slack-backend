const express = require("express");
const router = express.Router();
const passport = require("../passport");
const authController = require("../controllers/authController");
const userController = require("../controllers/userController");

// POST /register
router.post("/register", userController.register);

// POST /login
router.post("/login", userController.login);

// Google OAuth
router.get("/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get("/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login", session: false }),
  authController.googleAuthCallback
);

module.exports = router;

