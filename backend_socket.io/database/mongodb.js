const mongoose = require("mongoose");

const db = (url) => {
  return mongoose
    .connect(url)
    .then(console.log("Database Connected"))
    .catch((err) => console.log(err));
};

module.exports = db;
