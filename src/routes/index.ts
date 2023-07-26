import express from "express";
import path from "path";

const router = express.Router();

/* GET home page. */
router.get("/", function(req, res) {
  res.sendFile("index.html", { root: path.join(__dirname, "../public") });
});

export default router;
