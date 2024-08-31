const { formatISO9075 } = require("date-fns");
const Post = require("../models/post");
const User = require("../models/user");

const { validationResult } = require("express-validator");

exports.getProfile = (req, res, next) => {
  const POST_PER_PAGE = 6;
  const page_num = +req.query.page || 1;
  let countPost;
  Post.find({ userId: req.session.userInfo._id })
    .countDocuments()
    .then((totalPost) => {
      countPost = totalPost;
      if (page_num > countPost) {
        return res.status(404).render("error/404", { title: "Page Not Found" });
      } else {
        return Post.find({userId: req.session.userInfo._id})
          .populate("userId", "email username")
          .skip((page_num - 1) * POST_PER_PAGE)
          .limit(POST_PER_PAGE)
          .sort({ createdAt: -1 });
      }
    })
    .then((posts) => {
      if (!res.headersSent) {
        return res.render("user/profile", {
          title: "Profile",
          postsArr: posts,
          currentPage: page_num,
          hasNextPage: POST_PER_PAGE * page_num < countPost,
          hasPreviousPage: page_num > 1,
          nextPage: page_num + 1,
          previousPage: page_num - 1,
          userEmail: req.session.userInfo ? req.session.userInfo.email : " ",
        });
      }
    })
    .catch((err) => {
      console.log(err);
      const error = new Error("Something went wrong");
      return next(error);
    });
};

exports.getPublicProfile = (req, res, next) => {
  const POST_PER_PAGE = 6;
  const { id } = req.params;
  const page_num = +req.query.page || 1;
  let countPost;
  Post.find({ userId: id })
    .countDocuments()
    .then((totalPost) => {
      countPost = totalPost;
      if (page_num > countPost) {
        return res.status(404).render("error/404", { title: "Page Not Found" });
      } else {
        return Post.find({userId: id })
          .populate("userId", "email username")
          .skip((page_num - 1) * POST_PER_PAGE)
          .limit(POST_PER_PAGE)
          .sort({ createdAt: -1 });
      }
    })
    .then((posts) => {
      if (!res.headersSent) {
        return res.render("user/public_profile", {
          title: "Profile",
          postsArr: posts,
          currentPage: page_num,
          hasNextPage: POST_PER_PAGE * page_num < countPost,
          hasPreviousPage: page_num > 1,
          nextPage: page_num + 1,
          previousPage: page_num - 1,
          userEmail: posts[0].userId.email,
        });
      }
    })
    .catch((err) => {
      console.log(err);
      const error = new Error("Something went wrong");
      return next(error);
    });
};

exports.renderUsernamePage = (req, res, next) => {
  let err_message = req.flash("error");
  if (err_message.length > 0) {
    err_message = err_message[0];
  } else {
    err_message = null;
  }
  res.render("user/username", {
    title: "Set Username",
    errorMsg: err_message,
    oldData: " "
  });
}

exports.setUsername = (req, res, next) => {
  let { username } = req.body;
  username = username.replace("@", "");
  const errors = validationResult(req);
  if(!errors.isEmpty()) {
    return res.status(422).render("user/username", {
      title: "Set Username",
      errorMsg: errors.array()[0].msg,
      oldData: username,
    })
  }
  // req.session.userInfo._id
  User.findById(req.user._id).then(user => {
    user.username =  `@${username}`;
    return user.save();
  }).then(() => {
    console.log("Username uploaded");
    res.redirect("/admin/profile");
  }).catch(err => {
    console.log(err);
    const error = new Error("UserID not found");
    return next(error);
  })
}

exports.renderPremiumPage = (req, res) => {
  let err_message = req.flash("error");
  if (err_message.length > 0) {
    err_message = err_message[0];
  } else {
    err_message = null;
  }
  res.render("user/premium", {
    title: "Buy Premium",
    errorMsg: err_message,
    oldData: " "
  });
}