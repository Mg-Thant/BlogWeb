const mongodb = require("mongodb");
const { getDb } = require("../utils/database");

module.exports = class Post {
  constructor(title, description, imgUrl) {
    this.title = title;
    this.description = description;
    this.imgUrl = imgUrl;
  }

  create() {
    const db = getDb();
    return db
      .collection("posts")
      .insertOne(this)
      .then((result) => console.log(result))
      .catch((err) => console.log(err));
  }

  static getPosts() {
    const db = getDb();
    return db
      .collection("posts")
      .find()
      .toArray()
      .then((posts) => {
        console.log(posts);
        return posts;
      })
      .catch((err) => console.log(err));
  }

  static getPost(postId) {
    const db = getDb();
    return db.collection("posts").find({_id : new mongodb.ObjectId(postId)}).next().then((post) => {
        console.log(post);
        return post;
    }).catch(err => console.log(err))
  }
};
