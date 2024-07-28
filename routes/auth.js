const express = require("express");

const authController = require("../controllers/auth");

const router = express.Router();

router.get("/register", authController.renderRegisterPage);
router.get("/login", authController.renderLoginPage);
router.get("/reset-password", authController.renderResetPassPage);
router.get("/feedback", authController.renderFeedbackPage);
router.get("/reset-password/:token", authController.renderNewPassPage);

router.post("/register", authController.registerData);
router.post("/login", authController.postLoginData);
router.post("/logout", authController.logOut);
router.post("/reset", authController.resetPassLinkSend);
router.post("/change-password", authController.changePassword);

module.exports = router;
