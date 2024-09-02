const Post = require("../models/post");
const User = require("../models/user");

const { formatISO9075 } = require("date-fns");
const { validationResult } = require("express-validator");
const stripe = require("stripe")(
  "sk_test_51PtoUa043ghtzEKjliLTkilazImHXOJbA7A7hReHUh1nGU6amKC7mF6dyrGyuu0J2IjdH7kn3efKUtsu5Oja3PHH00BYFE8j1w"
);

exports.getProfile = (req, res, next) => {
  const POST_PER_PAGE = 6;
  const page_num = +req.query.page || 1;
  let countPost;
  Post.find({ userId: req.session.userInfo._id })
    .countDocuments()
    .then((totalPost) => {
      countPost = totalPost;
      return Post.find({ userId: req.session.userInfo._id })
        .populate("userId", "email username isPremium profile_img")
        .skip((page_num - 1) * POST_PER_PAGE)
        .limit(POST_PER_PAGE)
        .sort({ createdAt: -1 });
    })
    .then((posts) => {
      if (!res.headersSent) {
        if (posts.length > 0 || page_num === 1) {
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
        } else {
          return res
            .status(404)
            .render("error/404", { title: "Page Not Found" });
        }
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
        return Post.find({ userId: id })
          .populate("userId", "email username isPremium profile_img")
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
    oldData: " ",
  });
};

exports.setUsername = (req, res, next) => {
  let { username } = req.body;
  username = username.replace("@", "");
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("user/username", {
      title: "Set Username",
      errorMsg: errors.array()[0].msg,
      oldData: username,
    });
  }
  // req.session.userInfo._id
  User.findById(req.user._id)
    .then((user) => {
      user.username = `@${username}`;
      return user.save();
    })
    .then(() => {
      console.log("Username uploaded");
      res.redirect("/admin/profile");
    })
    .catch((err) => {
      console.log(err);
      const error = new Error("UserID not found");
      return next(error);
    });
};

exports.renderPremiumPage = (req, res, next) => {
  let err_message = req.flash("error");
  if (err_message.length > 0) {
    err_message = err_message[0];
  } else {
    err_message = null;
  }
  stripe.checkout.sessions
    .create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: "price_1Ptpk2043ghtzEKjeZdeIPbK",
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.protocol}://${req.get(
        "host"
      )}/admin/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.protocol}://${req.get(
        "host"
      )}/admin/subscription-cancel`,
    })
    .then((stripe_session) => {
      res.render("user/premium", {
        title: "Buy Premium",
        errorMsg: err_message,
        oldData: " ",
        session_id: stripe_session.id,
      });
    })
    .catch((err) => {
      console.log(err);
      const error = new Error("Payment Subscription Failed");
      return next(error);
    });
};

exports.renderSubSuccessPage = (req, res, next) => {
  const session_id = req.query.session_id;
  if (!session_id || !session_id.includes("cs_test_")) {
    return res.redirect("/admin/profile");
  }
  User.findById(req.session.userInfo._id)
    .then((user) => {
      user.isPremium = true;
      user.payment_session_id_key = session_id;
      return user.save();
    })
    .then(() => {
      res.render("user/success-subscription", {
        title: "Success Subscription",
        subscription_id: session_id,
      });
    })
    .catch((err) => {
      console.log(err);
      const error = new Error("Something Went Wrong");
      return next(error);
    });
};

exports.getPremiumDetails = (req, res, next) => {
  User.findById(req.user._id)
    .then((user) => {
      return stripe.checkout.sessions.retrieve(user.payment_session_id_key);
    })
    .then((stripe_session) => {
      res.render("user/premium_details", {
        title: "Status",
        customer_id: stripe_session.customer,
        country: stripe_session.customer_details.address.country,
        postal_code: stripe_session.customer_details.address.postal_code,
        email: stripe_session.customer_details.address.email,
        name: stripe_session.customer_details.name,
        invoice_id: stripe_session.invoice,
        payment_status: stripe_session.payment_status,
      });
    })
    .catch((err) => {
      console.log(err);
      const error = new Error("Something Went Wrong");
      return next(error);
    });
};

exports.renderProfileUploadPage = (req, res) => {
  let err_message = req.flash("error");
  if (err_message.length > 0) {
    err_message = err_message[0];
  } else {
    err_message = null;
  }
  res.render("user/profile_upload", {
    title: "Upload Profile",
    errorMsg: err_message,
  });
};

exports.setProfileImage = (req, res, next) => {
  const image = req.file;
  const errors = validationResult(req);

  if (image === undefined) {
    return res.status(422).render("user/profile_upload", {
      title: "Upload Profile",
      errorMsg: "Image extension must be jpg, jpeg and png",
    });
  }

  if (!errors.isEmpty()) {
    return res.status(422).render("user/profile_upload", {
      title: "Upload Profile",
      errorMsg: errors.array()[0].msg,
    });
  }

  User.findById(req.user._id)
    .then((user) => {
      user.profile_img = image.path;
      return user.save();
    })
    .then(() => {
      res.redirect("/admin/profile");
    })
    .catch((err) => {
      console.log(err);
      const error = new Error("Something Went Wrong");
      return next(error);
    });
};
