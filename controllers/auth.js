const bcrypt = require("bcrypt");
const User = require("../models/user");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const { validationResult } = require("express-validator");
dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  port: 587, // Try 587 if 465 doesn't work
  secure: true,
  auth: {
    user: process.env.SENDER_EMAIL,
    pass: process.env.EMAIL_PASS,
  },
});

exports.renderRegisterPage = (req, res) => {
  let err_message = req.flash("error");
  if (err_message.length > 0) {
    err_message = err_message[0];
  } else {
    err_message = null;
  }
  res.render("auth/register", {
    title: "Register",
    errorMsg: err_message,
    oldData: { email: "", password: "" },
  });
};

exports.renderLoginPage = (req, res) => {
  let err_message = req.flash("error");
  if (err_message.length > 0) {
    err_message = err_message[0];
  } else {
    err_message = null;
  }
  res.render("auth/login", {
    title: "Login",
    errorMsg: err_message,
    oldData: { email: "", password: "" },
  });
};

exports.registerData = (req, res) => {
  const { email, password } = req.body;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("auth/register", {
      title: "Register",
      errorMsg: errors.array()[0].msg,
      oldData: { email, password },
    });
  }
  bcrypt
    .hash(password, 10)
    .then((hashedPass) => {
      return User.create({
        email,
        password: hashedPass,
      });
    })
    .then(() => {
      res.redirect("/login");
      transporter.sendMail(
        {
          from: process.env.SENDER_EMAIL,
          to: email,
          subject: "Registered Successfully",
          html: "<h1>Registered Successfully</h1> <p>Thank you for your visiting our website</p>",
        },
        (err) => {
          console.log(err);
        }
      );
    });
};

exports.postLoginData = (req, res) => {
  const { email, password } = req.body;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).render("auth/login", {
      title: "Login",
      errorMsg: errors.array()[0].msg,
      oldData: { email, password },
    });
  }

  User.findOne({ email })
    .then((user) => {
      if (!user) {
        return res.status(422).render("auth/login", {
          title: "Login",
          errorMsg: "Please enter vaild email and password.",
          oldData: { email, password },
        });
      }
      bcrypt
        .compare(password, user.password)
        .then((isMatch) => {
          if (isMatch) {
            req.session.isLogin = true;
            req.session.userInfo = user;
            return req.session.save((err) => {
              res.redirect("/");
              console.log(err);
            });
          }
          res.status(422).render("auth/login", {
            title: "Login",
            errorMsg: "Please enter vaild email and password.",
            oldData: { email, password },
          });
        })
        .catch((err) => console.log(err));
    })
    .catch((err) => console.log(err));
};

exports.logOut = (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
};

exports.renderResetPassPage = (req, res) => {
  let err_message = req.flash("error");
  if (err_message.length > 0) {
    err_message = err_message[0];
  } else {
    err_message = null;
  }
  res.render("auth/reset_password", {
    title: "Reset Password",
    errorMsg: err_message,
    oldData: {email: " "}
  });
};

exports.renderFeedbackPage = (req, res) => {
  res.render("auth/feedback", {
    title: "Feedback Page",
  });
};

exports.resetPassLinkSend = (req, res) => {
  const { email } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("auth/reset_password", {
      title: "Reset Password",
      errorMsg: errors.array()[0].msg,
      oldData: { email },
    });
  }
  crypto.randomBytes(20, (err, buffer) => {
    if (err) {
      console.log(err);
      return res.redirect("/reset-password");
    }
    const token = buffer.toString("hex");
    User.findOne({ email })
      .then((user) => {
        if (!user) {
          return res.status(422).render("auth/reset_password", {
            title: "Reset Password",
            errorMsg: "Your email could not be found!!!",
            oldData: { email },
          });
        }
        user.resetToken = token;
        user.tokenExp = Date.now() + 1800000;
        return user.save();
      })
      .then((result) => {
        if(!result) {
          return ;
        }
        transporter.sendMail(
          {
            from: process.env.SENDER_EMAIL,
            to: email,
            subject: "Reset Password",
            html: `<h1>Reset Password</h1> <p>Change your password, click the link</p><a href="http://localhost:8080/reset-password/${token}" target="_blank">Click Here</a>`,
          },
          (err) => {
            console.log(err);
          }
        );
        return res.redirect("/feedback");
      })
      .catch((err) => {
        console.log(err);
      });
  });
};

exports.renderNewPassPage = (req, res) => {
  const token = req.params.token;
  console.log(token);
  User.findOne({ resetToken: token, tokenExp: { $gt: Date.now() } })
    .then((user) => {
      let err_message = req.flash("error");
      if (err_message.length > 0) {
        err_message = err_message[0];
      } else {
        err_message = null;
      }
      res.render("auth/new-pass", {
        title: "Change new password",
        errorMsg: err_message,
        resetToken: token,
        user_id: user._id.toString(),
        oldData: { password: "", confirm_password: "" },
      });
    })
    .catch((err) => {
      res.redirect("/500");
      console.log(err);
    });
};

exports.changePassword = (req, res) => {
  const { password, confirm_password, resetToken, user_id } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("auth/new-pass", {
      title: "Change new Password",
      errorMsg: errors.array()[0].msg,
      oldData: { password, confirm_password },
      resetToken,
      user_id,
    });
  }
  let userData;
  User.findOne({ resetToken, tokenExp: { $gt: Date.now() }, _id: user_id })
    .then((user) => {
      userData = user;
      return bcrypt.hash(password, 10);
    })
    .then((hashPass) => {
      userData.password = hashPass;
      userData.resetToken = undefined;
      userData.tokenExp = undefined;
      return userData.save();
    })
    .then(() => {
      return res.redirect("/login");
    })
    .catch((err) => console.log(err));
};
