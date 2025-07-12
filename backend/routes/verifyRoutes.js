const express = require("express");
const router = express.Router();
const { verifyToken } = require("../controllers/verificationController");

router.get("/api/verify/:token", verifyToken);

module.exports = router;
