const express = require("express");

const authController = require("../controllers/auth");

const router = express.Router();

router.get("/login", authController.renderLoginPage);

router.post("/login", authController.postLoginData);
router.post("/logout", authController.logOut)

module.exports = router;
