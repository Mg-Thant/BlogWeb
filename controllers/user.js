const { formatISO9075 } = require("date-fns");
const Post = require("../models/post");

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
          .populate("userId", "email")
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
