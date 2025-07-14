const multer = require("multer");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

// Allowed MIME Types
const allowedImageTypes = ["image/jpeg", "image/png"];
const allowedPdfTypes = ["application/pdf"];

// File Size Limits
const maxImageSize = 5 * 1024 * 1024; // 5MB for images
const maxPdfSize = 10 * 1024 * 1024; // 10MB for PDFs

// Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Store files in 'uploads/' directory
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// File Filter (Determines Valid File Types)
const fileFilter = (req, file, cb) => {
  if (req.url.includes("upload-rulebook")) {
    // Rule Book Upload (Only PDFs)
    if (!allowedPdfTypes.includes(file.mimetype)) {
      return cb(new Error("Invalid file type. Only PDF files are allowed."));
    }
  } else {
    // Event Image Upload (Only Images)
    if (!allowedImageTypes.includes(file.mimetype)) {
      return cb(
        new Error("Invalid file type. Only JPEG and PNG images are allowed.")
      );
    }
  }
  cb(null, true);
};

// Create separate upload configurations for images and PDFs
const imageUpload = multer({
  storage: storage,
  limits: {
    fileSize: maxImageSize, // 5MB limit for images
  },
  fileFilter: (req, file, cb) => {
    if (!allowedImageTypes.includes(file.mimetype)) {
      return cb(
        new Error("Invalid file type. Only JPEG and PNG images are allowed.")
      );
    }
    cb(null, true);
  },
});

const pdfUpload = multer({
  storage: storage,
  limits: {
    fileSize: maxPdfSize, // 10MB limit for PDFs
  },
  fileFilter: (req, file, cb) => {
    if (!allowedPdfTypes.includes(file.mimetype)) {
      return cb(new Error("Invalid file type. Only PDF files are allowed."));
    }
    cb(null, true);
  },
});

// General upload middleware that determines file type based on URL
const upload = multer({
  storage: storage,
  limits: {
    fileSize: maxPdfSize, // Use max size for both
  },
  fileFilter: fileFilter,
});

module.exports = upload;
module.exports.imageUpload = imageUpload;
module.exports.pdfUpload = pdfUpload;
