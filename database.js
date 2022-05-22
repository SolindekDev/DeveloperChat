const mongoose = require("mongoose");

class Database {
  constructor() {
//     const uri = "mongodb://localhost:27017/developerchat";
    const uri = process.env.DATABASE_URI;

    mongoose.connect(uri, { useUnifiedTopology: true, useNewUrlParser: true });

    const connection = mongoose.connection;

    connection.once("open", () => {
      console.log("Database connected");
    });
  }
}

module.exports = Database
