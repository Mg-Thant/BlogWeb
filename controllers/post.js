const Post = require("../models/post");
const { validationResult } = require("express-validator");
const { formatISO9075 } = require("date-fns");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const expressPath = require("path");

const fileDel = require("../utils/fileDel");
const errorController = require("./error");

exports.createPost = (req, res, next) => {
  const { title, description } = req.body;
  const image = req.file;
  const errors = validationResult(req);

  if (image === undefined) {
    return res.status(422).render("addPost", {
      title: "Post create",
      errorMsg: "Image extension must be jpg,jpeg and png",
      oldData: { title, description },
    });
  }

  if (!errors.isEmpty()) {
    return res.status(422).render("addPost", {
      title: "Post create",
      errorMsg: errors.array()[0].msg,
      oldData: { title, description },
    });
  }
  Post.create({ title, description, imgUrl: image.path, userId: req.user })
    .then((result) => {
      console.log(result);
      res.redirect("/");
    })
    .catch((err) => {
      console.log(err);
      const error = new Error("Something went wrong");
      return next(error);
    });
};

exports.renderCreatePage = (req, res) => {
  // res.sendFile(path.join(__dirname, "..", "views", "addPost.html"));
  res.render("addPost", {
    title: "Post create ml",
    errorMsg: "",
    oldData: { title: "", description: "", photo: "" },
  });
};

exports.renderHomePage = (req, res, next) => {
  // const cookie = req.get("Cookie").split("=")[1].trim() === "true";
  const POST_PER_PAGE = 3;
  const page_num = +req.query.page || 1;
  let countPost;
  Post.find()
    .countDocuments()
    .then((totalPost) => {
      countPost = totalPost;
      if (page_num > countPost) {
        return res.status(404).render("error/404", { title: "Page Not Found" });
      } else {
        return Post.find()
          .select("title description")
          .populate("userId", "email")
          .skip((page_num - 1) * POST_PER_PAGE)
          .limit(POST_PER_PAGE)
          .sort({ createdAt: -1 });
      }
    })
    .then((posts) => {
      if(!res.headersSent) {
        return res.render("home", {
          title: "Homepage",
          postsArr: posts,
          userEmail: req.session.userInfo ? req.session.userInfo.email : " ",
          currentPage: page_num,
          hasNextPage: POST_PER_PAGE * page_num < countPost,
          hasPreviousPage: page_num > 1,
          nextPage: page_num + 1,
          previousPage: page_num - 1,
        });
      }
    })
    .catch((err) => {
      console.log(err);
      const error = new Error("Something went wrong");
      return next(error);
    });
};

exports.getPost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findById(postId)
    .populate("userId", "email")
    .then((post) => {
      res.render("details", {
        title: post.title,
        post,
        date: post.createdAt
          ? formatISO9075(post.createdAt, { representation: "date" })
          : undefined,
        loginUserId: req.session.userInfo ? req.session.userInfo._id : " ",
      });
    })
    .catch((err) => {
      console.log(err);
      const error = new Error("Something went wrong");
      return next(error);
    });
};

exports.getEditPost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findById(postId)
    .then((post) => {
      if (!post) {
        return res.redirect("/");
      }
      res.render("editPost", {
        title: "Edit Post",
        post,
        oldData: { title: "", description: "" },
        isValidationFail: false,
        errorMsg: "",
      });
    })
    .catch((err) => {
      console.log(err);
      const error = new Error("Something went wrong");
      return next(error);
    });
};

exports.updatePost = (req, res, next) => {
  const { postId, title, description } = req.body;
  const image = req.file;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render("editPost", {
      postId,
      title,
      oldData: {
        title,
        description,
      },
      isValidationFail: true,
      errorMsg: errors.array()[0].msg,
    });
  }

  Post.findById(postId)
    .then((post) => {
      if (post.userId.toString() !== req.session.userInfo._id.toString()) {
        return res.redirect("/");
      }
      post.title = title;
      post.description = description;
      if (image) {
        fileDel(post.imgUrl);
        post.imgUrl = image.path;
      }
      return post.save().then(() => {
        res.redirect("/");
      });
    })
    .catch((err) => {
      console.log(err);
      const error = new Error("Something went wrong");
      return next(error);
    });
};

exports.deletePost = (req, res, next) => {
  const { postId } = req.params;
  Post.findById(postId)
    .then((post) => {
      fileDel(post.imgUrl);
      return Post.deleteOne({ _id: postId, userId: req.user._id });
    })
    .then(() => {
      res.redirect("/");
    })
    .catch((err) => {
      console.log(err);
      const error = new Error("Something went wrong");
      return next(error);
    });
};

exports.savePostPDF = (req, res) => {
  const { id } = req.params;
  Post.findById(id)
    .populate("userId", "email")
    .then((post) => {
      const url = `${expressPath.join(
        __dirname,
        "../public/pdf",
        new Date().getTime() + ".pdf"
      )}`;
      const doc = new PDFDocument();
      const writeStream = fs.createWriteStream(url);
      doc.pipe(writeStream);

      // add Title
      doc
        .font("Helvetica-Bold")
        .fontSize(20)
        .text(post.title, { align: "center" });

      // add Image
      doc.image(post.imgUrl, 50, 130, {
        fit: [500, 250],
        align: "center",
        valign: "center",
      });

      // add Author
      doc.moveDown();
      doc
        .font("Helvetica")
        .fontSize(14)
        .text(`Post By: ${post.userId.email}`, 75, 400, { align: "left" });

      // add Description
      doc.moveDown();
      doc
        .font("Helvetica")
        .fontSize(12)
        .text(post.description, 75, 430, { align: "justify" });

      // finialize PDF file
      doc.end();

      writeStream.on("finish", () => {
        res.download(url, (err) => {
          if (err) {
            res.status(500).send("Error Downloading PDF file");
          }
          fileDel(url);
        });
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send("Error generting PDF file");
    });
};
