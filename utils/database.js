const mongodb = require("mongodb");
const mongodbClient = mongodb.MongoClient;
const dotenv = require("dotenv");
dotenv.config();

let db;

const mongodbConnector = () => {
  mongodbClient
    .connect(process.env.MONGODB_URL)
    .then((result) => {
      console.log("Connected to MongoDb database.");
      db = result.db();
      console.log(result);
    })
    .catch((err) => console.log(err));
};

const getDb = () => {
    if(db) {
        return db
    }
    throw "No Database"
}

module.exports = {mongodbConnector, getDb};
