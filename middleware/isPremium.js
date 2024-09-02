exports.isPremium = (req, res, next) => {
    // req.user.isPremium
    if(!req.session.userInfo.isPremium) {
        return res.redirect("/admin/premium");
    }
    next();
}