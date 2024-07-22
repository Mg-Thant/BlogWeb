const bcrypt = require("bcrypt");
const User = require("../models/user");

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
        req.flash("error", "Check your information. Change anoter information!!!");
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
