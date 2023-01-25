const express = require("express");
const cors = require("cors");
const app = express();
const fs = require("fs");
const path = require("path");
const https = require('https')
const { execSync } = require("child_process");

require('dotenv').config()

app.use(express.json());
app.use(cors());

const port = process.env.PORT || 8000;
const columns = ["owner", "token_id", "listed", "price", "expired"];

app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "POST, GET, PATCH, DELETE, OPTIONS"
  );
  next();
});


const sleep = (ms) => {
  return new Promise((resolve, reject) => setTimeout(() => resolve(), ms));
};

const execute = async () => {
  while (true) {
    execSync(`./snapshot ${process.env.CONTRACT_ADDR} ${process.env.FILENAME}`);

    let db = await sqlite3.query();
    let db_i = 0;

    let lines = require('fs').readFileSync(`${process.env.FILENAME}.csv`, 'utf-8')
      .split('\n');

    lines = lines.filter((line) => {
      let elements = line.split(',');
      if (elements.length == columns.length && !isNaN(parseInt(elements[1])))
        return true;
      return false;
    });

    lines.sort((a, b) => {
      let a_arr = a.split(',');
      let b_arr = b.split(',');

      return parseInt(a_arr[1]) - parseInt(b_arr[1]);
    })

    for (let i = 1; i < lines.length; i++) {
      let elements = lines[i].split(',');

      let owner = elements[0];
      let token_id = elements[1];
      let listed = elements[2];

      while (true) {
        if (db_i == db.length) {//db no, snapshot yes
          if (listed == "true") {
            sqlite3.insert(token_id, owner, 1);
            // console.log("insert db no snapshot yes")
          }
          break;
        }

        // console.log(db.length, db_i, db[db_i].id, lines.length, i, token_id)

        let row = db[db_i];
        if (parseInt(row.id) < parseInt(token_id)) { //db yes, snapshot no
          sqlite3.drop(row.id)
          db_i++;
          // console.log("drop db yes snapshot no")
        } else if (parseInt(row.id) == parseInt(token_id)) { //db yes, snapshot yes
          if (listed == "true") {
            let counter = row.counter + 1;
            if (counter >= parseInt(process.env.STEP)){
              sqlite3.update(row.id, 0)
              console.log(`call api ${owner} ${token_id} ${counter}`);
            } else
              sqlite3.update(row.id, counter);
            // console.log("updating")
          } else {
            sqlite3.drop(row.id);
            // console.log("drop db yes snapshot yes")
          }
          db_i++;
          break;
        } else { //db no, snapshot yes
          if (listed == "true") {
            sqlite3.insert(token_id, owner, 1);
            // console.log("insert db no snapshot yes")
          }
          break;
        }

        if (db_i >= db.length)
          break;
      }
    };

    await sleep(process.env.TIMESTEP);
  };
}

const sqlite3 = require("./src/db/sqlite3");
sqlite3.connect();
sqlite3.create(execute);

app.listen(port, () => {
  console.log(`server is running on port ${port}`);
});
