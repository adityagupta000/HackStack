// middleware/upload.js
const multer = require("multer");
const path = require("path");

// Storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder =
      file.fieldname === "ruleBook" ? "uploads/rulebooks" : "uploads/images";
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${file.fieldname}-${Date.now()}${ext}`;
    cb(null, uniqueName);
  },
});

// Filter allowed types
const fileFilter = (req, file, cb) => {
  if (
    file.fieldname === "image" &&
    ["image/jpeg", "image/png", "image/jpg", "image/gif"].includes(
      file.mimetype
    )
  ) {
    cb(null, true);
  } else if (
    file.fieldname === "ruleBook" &&
    file.mimetype === "application/pdf"
  ) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type!"), false);
  }
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
