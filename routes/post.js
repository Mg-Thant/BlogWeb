const express = require("express");

const postController = require("../controllers/post");
const userController = require("../controllers/user");

const router = express.Router();

router.get("/", postController.renderHomePage);

router.get("/post/:postId",postController.getPost);
router.get("/save/:id", postController.savePostPDF);

router.get("/profile/:id", userController.getPublicProfile);

module.exports = router;