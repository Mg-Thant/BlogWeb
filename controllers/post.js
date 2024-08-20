const Post = require("../models/post");
const { validationResult } = require("express-validator");
const formatISO9075 = require('date-fns/formatISO9075');

exports.createPost = (req, res, next) => {
  const { title, description, photo } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("addPost", {
      title: "Post create",
      errorMsg: errors.array()[0].msg,
      oldData: { title, description, photo },
    });
  }
  Post.create({ title, description, imgUrl: photo, userId: req.user })
    .then((result) => {
      console.log(result);
      res.redirect("/");
    })
    .catch((err) => {
      console.log(err);
      const error = new Error("Something went wrong");
      return next(error);
    });
};

exports.renderCreatePage = (req, res) => {
  // res.sendFile(path.join(__dirname, "..", "views", "addPost.html"));
  res.render("addPost", {
    title: "Post create ml",
    errorMsg: "",
    oldData: { title: "", description: "", photo: "" },
  });
};

exports.renderHomePage = (req, res, next) => {
  // const cookie = req.get("Cookie").split("=")[1].trim() === "true";
  Post.find()
    .select("title description")
    .populate("userId", "email")
    .sort({ title: -1 })
    .then((posts) => {
      console.log(posts);
      res.render("home", {
        title: "Homepage",
        postsArr: posts,
        userEmail: req.session.userInfo ? req.session.userInfo.email : " ",
      });
    })
    .catch((err) => {
      console.log(err);
      const error = new Error("Something went wrong");
      return next(error);
    });
};

exports.getPost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findById(postId)
    .populate("userId", "email")
    .then((post) => {
      res.render("details", {
        title: post.title,
        post,
        date : post.createdAt ? formatISO9075(post.createdAt, {representation: "date"}) : undefined,
        loginUserId: req.session.userInfo ? req.session.userInfo._id : " ",
      });
    })
    .catch((err) => {
      console.log(err);
      const error = new Error("Something went wrong");
      return next(error);
    });
};

exports.getEditPost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findById(postId)
    .then((post) => {
      if (!post) {
        return res.redirect("/");
      }
      res.render("editPost", {
        title: "Edit Post",
        post,
        oldData: { title: "", description: "", photo: "" },
        isValidationFail: false,
        errorMsg: "",
      });
    })
    .catch((err) => {
      console.log(err);
      const error = new Error("Something went wrong");
      return next(error);
    });
};

exports.updatePost = (req, res, next) => {
  const { postId, title, description, photo } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("editPost", {
      postId,
      title,
      oldData: {
        title,
        description,
        photo,
      },
      isValidationFail: true,
      errorMsg: errors.array()[0].msg,
    });
  }

  Post.findById(postId)
    .then((post) => {
      if (post.userId.toString() !== req.session.userInfo._id.toString()) {
        return res.redirect("/");
      }
      post.title = title;
      post.description = description;
      post.imgUrl = photo;
      return post.save().then(() => {
        res.redirect("/");
      });
    })
    .catch((err) => {
      console.log(err);
      const error = new Error("Something went wrong");
      return next(error);
    });
};

exports.deletePost = (req, res, next) => {
  const { postId } = req.params;
  Post.deleteOne({ _id: postId, userId: req.user._id })
    .then(() => {
      res.redirect("/");
    })
    .catch((err) => {
      console.log(err);
      const error = new Error("Something went wrong");
      return next(error);
    });
};
