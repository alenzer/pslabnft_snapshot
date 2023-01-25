const express = require("express");
const router = express.Router();

router.post("/admin", async (req, res) => {
  try {
    console.log("Api runing successfully");
  } catch (err) {
    console.log(err);
  }
});

module.exports = router;