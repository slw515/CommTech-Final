const express = require("express");
const Datastore = require("nedb");
const app = express();
//use required packages
app.listen(3000, () => console.log("listening at 200000"));
app.use(express.static("public"));
app.use(express.json({ limit: "1mb" }));
//init database
const database = new Datastore("database.db");
database.loadDatabase();
//post request
app.post("/api", (request, response) => {
  const data = request.body;
  const timestamp = Date.now();
  data.timestamp = timestamp;
  database.insert(data);
  console.log(data);
  response.json(data);
});
//get request
app.get("/api", (request, response) => {
  database.find({}, (err, data) => {
    if (err) {
      console.log(err);
      response.end();
      return;
    }
    response.json(data);
  });
});
