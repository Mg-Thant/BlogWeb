const Post = require("../models/post");

exports.createPost = (req, res) => {
  const { title, description, photo, date } = req.body;
  Post.create({ title, description, imgUrl: photo })
    .then((result) => {
      res.redirect("/");
    })
    .catch((err) => console.log(err));
};

exports.renderCreatePage = (req, res) => {
  // res.sendFile(path.join(__dirname, "..", "views", "addPost.html"));
  res.render("addPost", { title: "Post create ml" });
};

exports.renderHomePage = (req, res) => {
  Post.find().sort({title: -1})
    .then((posts) => {
      res.render("home", { title: "Homepage", postsArr: posts });
    })
    .catch((err) => console.log(err));
};

exports.getPost = (req, res) => {
  const postId = req.params.postId;
  Post.findById(postId)
    .then((post) => {
      res.render("details", { title: post.title, post });
    })
    .catch((err) => console.log(err));
};

exports.getEditPost = (req, res) => {
  const postId = req.params.postId;
  Post.findById(postId)
    .then((post) => {
      if (!post) {
        return res.redirect("/");
      }
      res.render("editPost", { title: post.title, post });
    })
    .catch((err) => console.log(err));
};

exports.updatePost = (req, res) => {
  const { postId, title, description, photo } = req.body;
  Post.findById(postId)
    .then((post) => {
      post.title = title;
      post.description = description;
      post.imgUrl = photo;
      return post.save();
    })
    .then(() => {
      res.redirect("/");
    })
    .catch((err) => console.log(err));
};

exports.deletePost = (req, res) => {
  const postId = req.params.postId;
  Post.findByIdAndDelete(postId)
    .then(() => {
      console.log("Post Deleted");
      res.redirect("/");
    })
    .catch((err) => console.log(err));
};
