const express = require("express");
const { body } = require("express-validator");
const User = require("../models/user");
const bcrypt = require("bcrypt");

const authController = require("../controllers/auth");

const router = express.Router();

router.get("/register", authController.renderRegisterPage);
router.get("/login", authController.renderLoginPage);
router.get("/reset-password", authController.renderResetPassPage);
router.get("/feedback", authController.renderFeedbackPage);
router.get("/reset-password/:token", authController.renderNewPassPage);

router.post(
  "/register",
  body("email")
    .isEmail()
    .withMessage("Please enter a valid email")
    // call async validation
    .custom((value, { req }) => {
      return User.findOne({ email: value }).then((user) => {
        if (user) {
          return Promise.reject(
            "Email is already exists. Change another email"
          );
        }
      });
    }),
  body("password")
    .isLength({ min: 4 })
    .trim()
    .withMessage("Password must have 4 character"),
  authController.registerData
);
router.post(
  "/login",
  body("email").isEmail().withMessage("Please enter a valid email"),
  body("password")
    .isLength({ min: 4 })
    .trim()
    .withMessage("Password must valid"),
  authController.postLoginData
);
router.post("/logout", authController.logOut);
router.post(
  "/reset",
  body("email").isEmail().withMessage("Please enter valid email"),
  authController.resetPassLinkSend
);
router.post(
  "/change-password",
  body("password")
    .isLength({ min: 4 })
    .trim()
    .withMessage("Password must have 4 character"),
  body("confirm_password")
    .trim()
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords are not the same");
      }
      return true;
    }),
  authController.changePassword
);

module.exports = router;
