const express = require("express");

const authController = require("../controllers/auth");

const router = express.Router();

router.get("/register", authController.renderRegisterPage);
router.get("/login", authController.renderLoginPage);

router.post("/register", authController.registerData);
router.post("/login", authController.postLoginData);
router.post("/logout", authController.logOut);

module.exports = router;
