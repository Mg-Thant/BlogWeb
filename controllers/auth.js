exports.renderLoginPage = (req, res) => {
    res.render("auth/login", {title : "Login"})
}

exports.postLoginData = (req, res) => {
    req.session.isLogin = true;
    res.redirect("/");
}

exports.logOut = (req, res) => {
    req.session.destroy(() => {
        res.redirect("/");
    });
}