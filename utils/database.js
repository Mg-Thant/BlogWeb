const mongodb = require("mongodb");
const mongodbClient = mongodb.MongoClient;
const dotenv = require("dotenv");
dotenv.config();

const mongodbConnector = () => {
  mongodbClient
    .connect(process.env.MONGODB_URL)
    .then((result) => {
      console.log("Connected to MongoDb database.");
      console.log(result);
    })
    .catch((err) => console.log(err));
};

module.exports = mongodbConnector;
