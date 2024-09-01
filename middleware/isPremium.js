exports.isPremium = (req, res, next) => {
    if(!req.session.usesInfo.isPremium) {
        return res.redirect("/");
    }
    next();
}