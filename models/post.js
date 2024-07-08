const mongodb = require("mongodb");
const { getDb } = require("../utils/database");

module.exports = class Post {
  constructor(title, description, imgUrl, id) {
    this.title = title;
    this.description = description;
    this.imgUrl = imgUrl;
    this._id = id ? new mongodb.ObjectId(id) : null;
  }

  create() {
    const db = getDb();
    let dbTemp;

    if (this._id) {
      dbTemp = db
        .collection("posts").find({_id : 1})
        .updateOne({ _id: this._id }, { $set: this });
    } else {
      dbTemp = db.collection("posts").insertOne(this);
    }
    return dbTemp
      .then((result) => console.log(result))
      .catch((err) => console.log(err));
  }

  static getPosts() {
    const db = getDb();
    return db
      .collection("posts", {locale: "en", caseLevel: true})
      .find().sort({title : 1})
      .toArray()
      .then((posts) => {
        console.log(posts);
        return posts;
      })
      .catch((err) => console.log(err));
  }

  static getPost(postId) {
    const db = getDb();
    return db
      .collection("posts")
      .find({ _id: new mongodb.ObjectId(postId) })
      .next()
      .then((post) => {
        console.log(post);
        return post;
      })
      .catch((err) => console.log(err));
  }

  static deletePost(postId) {
    const db = getDb();
    return db
      .collection("posts")
      .deleteOne({ _id: new mongodb.ObjectId(postId) })
      .then((result) => console.log("Post Deleted"))
      .catch((err) => console.log(err));
  }
};
