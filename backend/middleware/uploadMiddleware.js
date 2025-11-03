const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const logger = require("../config/logger");
const { FILE_LIMITS, HTTP_STATUS } = require("../config/constants");

// FIXED: Magic number validation for file types
const fileTypeFromBuffer = (buffer) => {
  // Check first few bytes (magic numbers)
  if (!buffer || buffer.length < 4) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  // PNG: 89 50 4E 47
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }

  // GIF: 47 49 46 38
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38
  ) {
    return "image/gif";
  }

  // WebP: 52 49 46 46 ... 57 45 42 50
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return "image/webp";
  }

  // PDF: 25 50 44 46
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return "application/pdf";
  }

  return null;
};

// Ensure upload directories exist
const createUploadDirectories = () => {
  const dirs = ["uploads", "uploads/images", "uploads/rulebooks"];
  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true, mode: 0o755 });
    }
  });
};

// Initialize directories
createUploadDirectories();

// FIXED: Strict allowed MIME types
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/jpg",
  "image/gif",
  "image/webp",
];
const ALLOWED_PDF_TYPES = ["application/pdf"];

const ALLOWED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
const ALLOWED_PDF_EXTENSIONS = [".pdf"];

const normalizeExtension = (filename) => {
  if (!filename || typeof filename !== "string") {
    return null;
  }

  const ext = path.extname(filename).toLowerCase();

  if (!ext.startsWith(".")) {
    return null;
  }

  return ext;
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder =
      file.fieldname === "ruleBook" ? "uploads/rulebooks" : "uploads/images";

    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true, mode: 0o755 });
    }
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    try {
      // Normalize extension
      const ext = normalizeExtension(file.originalname);

      if (!ext) {
        return cb(new Error("Invalid file extension"));
      }

      // Validate extension
      const allowedExts =
        file.fieldname === "ruleBook"
          ? ALLOWED_PDF_EXTENSIONS
          : ALLOWED_IMAGE_EXTENSIONS;

      if (!allowedExts.includes(ext)) {
        return cb(
          new Error(
            `Invalid file extension: ${ext}. Allowed: ${allowedExts.join(", ")}`
          )
        );
      }

      // Generate secure filename
      const timestamp = Date.now();
      const randomString = uuidv4().split("-")[0];
      const uniqueName = `${file.fieldname}_${timestamp}_${randomString}${ext}`;

      // Final validation
      if (
        uniqueName.includes("..") ||
        uniqueName.includes("/") ||
        uniqueName.includes("\\")
      ) {
        return cb(new Error("Invalid filename generated"));
      }

      cb(null, uniqueName);
    } catch (error) {
      logger.error("Filename generation error", {
        error: error.message,
        originalname: file.originalname,
      });
      cb(new Error("Filename generation failed"));
    }
  },
});

// FIXED: Enhanced file filter with magic number validation
const validateFileType = (file, allowedMimes, allowedExts) => {
  // Check MIME type
  if (!allowedMimes.includes(file.mimetype)) {
    return false;
  }

  // Check file extension
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowedExts.includes(ext)) {
    return false;
  }

  // Additional validation: check original filename doesn't contain path traversal
  if (
    file.originalname.includes("..") ||
    file.originalname.includes("/") ||
    file.originalname.includes("\\")
  ) {
    return false;
  }

  return true;
};

const magicNumberValidator = (req, res, next) => {
  if (!req.file && !req.files) {
    return next();
  }

  const files = req.file ? [req.file] : Object.values(req.files || {}).flat();

  for (const file of files) {
    if (file.path && fs.existsSync(file.path)) {
      let fd;
      try {
        // Read more bytes for better validation (first 512 bytes)
        fd = fs.openSync(file.path, "r");
        const buffer = Buffer.alloc(512);
        const bytesRead = fs.readSync(fd, buffer, 0, 512, 0);
        fs.closeSync(fd);
        fd = null;

        if (bytesRead < 12) {
          throw new Error("File too small or corrupted");
        }

        const detectedType = fileTypeFromBuffer(buffer.slice(0, 12));

        // Additional validation: check file size
        const stats = fs.statSync(file.path);
        const maxSize =
          file.fieldname === "ruleBook"
            ? FILE_LIMITS.PDF_MAX_SIZE
            : FILE_LIMITS.IMAGE_MAX_SIZE;

        if (stats.size > maxSize) {
          throw new Error("File size exceeds limit");
        }

        if (file.fieldname === "ruleBook") {
          if (detectedType !== "application/pdf") {
            throw new Error("Invalid PDF file");
          }

          // Additional PDF validation: check for PDF structure
          const pdfHeader = buffer.slice(0, 5).toString("ascii");
          if (!pdfHeader.startsWith("%PDF-")) {
            throw new Error("Invalid PDF structure");
          }
        } else if (file.fieldname === "image") {
          if (!ALLOWED_IMAGE_TYPES.includes(detectedType)) {
            throw new Error("Invalid image file");
          }
        }
      } catch (error) {
        // Ensure file descriptor is closed
        if (fd !== null && fd !== undefined) {
          try {
            fs.closeSync(fd);
          } catch (closeError) {
            logger.error("Failed to close file descriptor", {
              error: closeError.message,
              requestId: req.id,
            });
          }
        }

        logger.error("Magic number validation failed", {
          error: error.message,
          stack: error.stack,
          filename: file.filename,
          fieldname: file.fieldname,
          requestId: req.id,
        });

        // Clean up file
        try {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        } catch (unlinkError) {
          logger.error("Failed to delete invalid file", {
            error: unlinkError.message,
            path: file.path,
            requestId: req.id,
          });
        }

        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          message: "File validation failed. Please upload a valid file.",
        });
      }
    }
  }
  next();
};

// File Filter for Images
const imageFilter = (req, file, cb) => {
  if (!validateFileType(file, ALLOWED_IMAGE_TYPES, ALLOWED_IMAGE_EXTENSIONS)) {
    return cb(
      new Error(
        "Invalid image file. Only JPEG, PNG, JPG, GIF, and WebP images are allowed."
      ),
      false
    );
  }
  cb(null, true);
};

// File Filter for PDFs
const pdfFilter = (req, file, cb) => {
  if (!validateFileType(file, ALLOWED_PDF_TYPES, ALLOWED_PDF_EXTENSIONS)) {
    return cb(
      new Error("Invalid file type. Only PDF files are allowed."),
      false
    );
  }
  cb(null, true);
};

// General file filter based on field name
const generalFilter = (req, file, cb) => {
  if (file.fieldname === "ruleBook") {
    return pdfFilter(req, file, cb);
  } else if (file.fieldname === "image") {
    return imageFilter(req, file, cb);
  }
  cb(new Error("Unknown field name"), false);
};

// FIXED: Image Upload Configuration with limits
const imageUpload = multer({
  storage,
  limits: {
    fileSize: FILE_LIMITS.IMAGE_MAX_SIZE,
    files: 1,
    fields: 10,
  },
  fileFilter: imageFilter,
});

// FIXED: PDF Upload Configuration with limits
const pdfUpload = multer({
  storage,
  limits: {
    fileSize: FILE_LIMITS.PDF_MAX_SIZE,
    files: 1,
    fields: 10,
  },
  fileFilter: pdfFilter,
});

// FIXED: General Upload Configuration
const generalUpload = multer({
  storage,
  limits: {
    fileSize: FILE_LIMITS.PDF_MAX_SIZE,
    files: 5,
    fields: 20,
    parts: 30,
  },
  fileFilter: generalFilter,
});

// FIXED: Enhanced error handler with cleanup
const handleUploadError = (err, req, res, next) => {
  // Clean up any uploaded files if error occurs
  if (req.files) {
    const files = Array.isArray(req.files)
      ? req.files
      : Object.values(req.files).flat();
    files.forEach((file) => {
      if (file.path && fs.existsSync(file.path)) {
        try {
          fs.unlinkSync(file.path);
          logger.info("Cleaned up file after error", {
            path: file.path,
            requestId: req.id,
          });
        } catch (cleanupErr) {
          logger.error("Failed to cleanup file", {
            error: cleanupErr.message,
            path: file.path,
            requestId: req.id,
          });
        }
      }
    });
  }

  if (req.file && req.file.path && fs.existsSync(req.file.path)) {
    try {
      fs.unlinkSync(req.file.path);
      console.log(`Cleaned up file after error: ${req.file.path}`);
    } catch (cleanupErr) {
      console.error(`Failed to cleanup file: ${req.file.path}`, cleanupErr);
    }
  }

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      const maxSize = err.field === "ruleBook" ? "10MB" : "5MB";
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: `File too large. Maximum size is ${maxSize}`,
        field: err.field,
      });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: "Too many files uploaded",
      });
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: `Unexpected field: ${err.field}`,
      });
    }
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: `Upload error: ${err.message}`,
      code: err.code,
    });
  } else if (err) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: err.message || "File upload failed",
    });
  }

  next();
};

// FIXED: Secure file deletion with path validation
const secureDeleteFile = (filePath) => {
  try {
    // Validate that file is within uploads directory
    const normalizedPath = path.normalize(filePath);
    const uploadsDir = path.resolve(__dirname, "..", "uploads");
    const absolutePath = path.resolve(__dirname, "..", normalizedPath);

    // Ensure file is within uploads directory (prevent path traversal)
    if (!absolutePath.startsWith(uploadsDir)) {
      logger.warn("Path traversal attempt in file deletion", {
        attemptedPath: absolutePath,
      });
      return false;
    }

    // Check if file exists
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
      logger.info("File deleted securely", { path: absolutePath });
      return true;
    }

    return false;
  } catch (err) {
    logger.error("Secure file deletion failed", {
      error: err.message,
      stack: err.stack,
      filePath,
    });
    return false;
  }
};

module.exports = {
  imageUpload,
  pdfUpload,
  generalUpload,
  handleUploadError,
  createUploadDirectories,
  secureDeleteFile,
  magicNumberValidator,
};
