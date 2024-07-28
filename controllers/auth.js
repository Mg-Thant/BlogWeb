const bcrypt = require("bcrypt");
const User = require("../models/user");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
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
  res.render("auth/register", { title: "Register", errorMsg: err_message });
};

exports.renderLoginPage = (req, res) => {
  let err_message = req.flash("error");
  if (err_message.length > 0) {
    err_message = err_message[0];
  } else {
    err_message = null;
  }
  res.render("auth/login", { title: "Login", errorMsg: err_message });
};

exports.registerData = (req, res) => {
  const { email, password } = req.body;
  User.findOne({ email })
    .then((user) => {
      if (user) {
        req.flash(
          "error",
          "Check your information. Change anoter information!!!"
        );
        return res.redirect("/register");
      }
      return bcrypt
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
    })
    .catch((err) => console.log(err));
};

exports.postLoginData = (req, res) => {
  const { email, password } = req.body;
  User.findOne({ email })
    .then((user) => {
      if (!user) {
        req.flash("error", "Check your information, try again");
        return res.redirect("/login");
      }
      bcrypt
        .compare(password, user.password)
        .then((isMathch) => {
          if (isMathch) {
            req.session.isLogin = true;
            req.session.userInfo = user;
            return req.session.save((err) => {
              res.redirect("/");
              console.log(err);
            });
          }
          res.redirect("/login");
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
  });
};

exports.renderFeedbackPage = (req, res) => {
  res.render("auth/feedback", {
    title: "Feedback Page",
  });
};

exports.resetPassLinkSend = (req, res) => {
  const { email } = req.body;
  crypto.randomBytes(20, (err, buffer) => {
    if (err) {
      console.log(err);
      return res.redirect("/reset-password");
    }
    const token = buffer.toString("hex");
    User.findOne({ email })
      .then((user) => {
        if (!user) {
          req.flash("error", "Your email could not be found!!!");
          return res.redirect("/reset-password");
        }
        user.resetToken = token;
        user.tokenExp = Date.now() + 1800000;
        return user.save();
      })
      .then((result) => {
        res.redirect("/feedback");
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
      console.log(user);
      console.log(user._id);
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
      });
    })
    .catch((err) => {
      res.redirect("/500");
      console.log(err);
    });
};

exports.changePassword = (req, res) => {
  const { password, confirm_password, resetToken, user_id } = req.body;
  let userData;
  User.findOne({ resetToken, tokenExp: { $gt: Date.now() }, _id: user_id })
    .then((user) => {
      if (password === confirm_password) {
        userData = user;
        return bcrypt.hash(password, 10);
      } else {

      }
    })
    .then((hashPass) => {
      userData.password = hashPass;
      userData.resetToken = undefined;
      userData.tokenExp = undefined;
      return userData.save();
    })
    .then(() => {
      res.redirect("/login");
    })
    .catch((err) => console.log(err));
};
