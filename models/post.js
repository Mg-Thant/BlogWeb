const mongoose = require("mongoose");
const {Schema, model} = mongoose

const postSchema = new Schema({
  title : {
    type : String,
    required : true,
  },
  description : {
    type : String,
    required : true
  },
  imgUrl : {
    type : String,
    required : true
  },
  createdAt : {
    type :  Date,
    default : null
  }
});

module.exports = model("Post", postSchema);