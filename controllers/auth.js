const bcrypt = require("bcrypt");
const User = require("../models/user");

exports.renderRegisterPage = (req, res) => {
  res.render("auth/register", { title: "Register" });
};

exports.renderLoginPage = (req, res) => {
  res.render("auth/login", { title: "Login" });
};

exports.registerData = (req, res) => {
  const { email, password } = req.body;
  User.findOne({ email })
    .then((user) => {
      if (user) {
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
