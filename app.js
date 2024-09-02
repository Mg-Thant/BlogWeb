const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const session = require("express-session");
const mongoStore = require("connect-mongodb-session")(session);
const csurf = require("csurf");
const flash = require("connect-flash");
const multer = require("multer");
dotenv.config();

const app = express();

app.set("view engine", "ejs");
app.set("views", "views");

const postRoutes = require("./routes/post");
const adminRoutes = require("./routes/admin");
const authRoutes = require("./routes/auth");

const errorController = require("./controllers/error");

const store = new mongoStore({
  uri: process.env.MONGODB_URI,
  collection: "sessions-db",
});

const csurfProtect = csurf();

const User = require("./models/user");
const { isLogin } = require("./middleware/isLogin");

const storageConfigure = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const fileFilterConfigure = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(
  multer({ storage: storageConfigure, fileFilter: fileFilterConfigure }).single(
    "photo"
  )
);

app.use(
  session({
    secret: process.env.SESSION_SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    store,
  })
);
app.use(csurfProtect);
app.use(flash());

app.use((req, res, next) => {
  if (req.session.isLogin === undefined) {
    return next();
  }
  User.findById(req.session.userInfo._id)
    .select("_id email isPremium")
    .then((user) => {
      req.user = user;
      next();
    });
});

// csrf token to every rendering page
app.use((req, res, next) => {
  res.locals.isLogin = req.session.isLogin ? true : false;
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use("/admin", isLogin, adminRoutes);
app.use(postRoutes);
app.use(authRoutes);

app.all("*", errorController.get404Page);
app.use(errorController.get500Page);

mongoose
  .connect(process.env.MONGODB_URL)
  .then((_) => {
    app.listen(8080);
    console.log("connected to mongodb!!!");
  })
  .catch((err) => console.log(err));
