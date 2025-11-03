/**
 * File validation utilities with magic number checking
 */

/**
 * File type signatures (magic numbers)
 */
const FILE_SIGNATURES = {
  // Images
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/png": [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  "image/gif": [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], // GIF89a
  ],
  "image/webp": [
    // RIFF....WEBP
    [0x52, 0x49, 0x46, 0x46, null, null, null, null, 0x57, 0x45, 0x42, 0x50],
  ],
  // PDF
  "application/pdf": [
    [0x25, 0x50, 0x44, 0x46], // %PDF
  ],
};

/**
 * Allowed file types
 */
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
];

export const ALLOWED_PDF_TYPES = ["application/pdf"];

/**
 * File size limits
 */
export const FILE_SIZE_LIMITS = {
  image: 5 * 1024 * 1024, // 5MB
  pdf: 10 * 1024 * 1024, // 10MB
};

/**
 * Read file header bytes
 * @param {File} file - File to read
 * @param {number} bytes - Number of bytes to read
 * @returns {Promise<Uint8Array>} File header bytes
 */
const readFileHeader = (file, bytes = 12) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const arr = new Uint8Array(e.target.result);
      resolve(arr);
    };

    reader.onerror = (error) => {
      reject(error);
    };

    // Read only first bytes
    const blob = file.slice(0, bytes);
    reader.readAsArrayBuffer(blob);
  });
};

/**
 * Check if byte array matches signature
 * @param {Uint8Array} bytes - Bytes to check
 * @param {Array} signature - Expected signature
 * @returns {boolean} Matches signature
 */
const matchesSignature = (bytes, signature) => {
  for (let i = 0; i < signature.length; i++) {
    // null in signature means "any byte"
    if (signature[i] !== null && bytes[i] !== signature[i]) {
      return false;
    }
  }
  return true;
};

/**
 * Detect file type from magic numbers
 * @param {Uint8Array} bytes - File header bytes
 * @returns {string|null} Detected MIME type or null
 */
export const detectFileType = (bytes) => {
  for (const [mimeType, signatures] of Object.entries(FILE_SIGNATURES)) {
    for (const signature of signatures) {
      if (matchesSignature(bytes, signature)) {
        return mimeType;
      }
    }
  }
  return null;
};

/**
 * Validate file with magic number checking
 * @param {File} file - File to validate
 * @param {Object} options - Validation options
 * @returns {Promise<Object>} Validation result
 */
export const validateFile = async (file, options = {}) => {
  const {
    allowedTypes = ALLOWED_IMAGE_TYPES,
    maxSize = FILE_SIZE_LIMITS.image,
    checkMagicNumber = true,
  } = options;

  // Check if file exists
  if (!file) {
    return {
      isValid: false,
      error: "No file provided",
    };
  }

  // Check file size
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
    return {
      isValid: false,
      error: `File too large. Maximum size is ${maxSizeMB}MB`,
      actualSize: file.size,
      maxSize,
    };
  }

  if (file.size === 0) {
    return {
      isValid: false,
      error: "File is empty",
    };
  }

  // Check MIME type
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`,
      actualType: file.type,
      allowedTypes,
    };
  }

  // Check file extension
  const fileExtension = file.name.split(".").pop().toLowerCase();
  const validExtensions = allowedTypes.map((type) => {
    const parts = type.split("/");
    return parts[1] === "jpeg" ? "jpg" : parts[1];
  });

  if (!validExtensions.includes(fileExtension)) {
    return {
      isValid: false,
      error: `Invalid file extension. Allowed: ${validExtensions.join(", ")}`,
      actualExtension: fileExtension,
      validExtensions,
    };
  }

  // Check magic numbers if enabled
  if (checkMagicNumber) {
    try {
      const headerBytes = await readFileHeader(file, 12);
      const detectedType = detectFileType(headerBytes);

      if (!detectedType) {
        return {
          isValid: false,
          error: "Could not detect file type. File may be corrupted.",
        };
      }

      // Normalize MIME types (jpg vs jpeg)
      const normalizedDetected = detectedType.replace("jpeg", "jpg");
      const normalizedActual = file.type.replace("jpeg", "jpg");

      if (normalizedDetected !== normalizedActual) {
        return {
          isValid: false,
          error: `File content does not match file type. Expected ${file.type}, detected ${detectedType}`,
          detectedType,
          declaredType: file.type,
        };
      }
    } catch (error) {
      return {
        isValid: false,
        error: "Failed to read file content",
        details: error.message,
      };
    }
  }

  // Check filename for path traversal
  if (
    file.name.includes("..") ||
    file.name.includes("/") ||
    file.name.includes("\\")
  ) {
    return {
      isValid: false,
      error: "Invalid filename. Path traversal detected.",
    };
  }

  return {
    isValid: true,
    file,
    size: file.size,
    type: file.type,
    name: file.name,
  };
};

/**
 * Validate image file
 * @param {File} file - Image file to validate
 * @returns {Promise<Object>} Validation result
 */
export const validateImageFile = async (file) => {
  return validateFile(file, {
    allowedTypes: ALLOWED_IMAGE_TYPES,
    maxSize: FILE_SIZE_LIMITS.image,
    checkMagicNumber: true,
  });
};

/**
 * Validate PDF file
 * @param {File} file - PDF file to validate
 * @returns {Promise<Object>} Validation result
 */
export const validatePDFFile = async (file) => {
  return validateFile(file, {
    allowedTypes: ALLOWED_PDF_TYPES,
    maxSize: FILE_SIZE_LIMITS.pdf,
    checkMagicNumber: true,
  });
};

/**
 * Validate multiple files
 * @param {FileList|Array} files - Files to validate
 * @param {Object} options - Validation options
 * @returns {Promise<Object>} Validation results
 */
export const validateMultipleFiles = async (files, options = {}) => {
  const fileArray = Array.from(files);
  const { maxFiles = 5 } = options;

  if (fileArray.length > maxFiles) {
    return {
      isValid: false,
      error: `Too many files. Maximum ${maxFiles} files allowed.`,
      fileCount: fileArray.length,
      maxFiles,
    };
  }

  const results = await Promise.all(
    fileArray.map((file) => validateFile(file, options))
  );

  const invalidFiles = results.filter((result) => !result.isValid);

  if (invalidFiles.length > 0) {
    return {
      isValid: false,
      error: "Some files are invalid",
      invalidFiles,
      validFiles: results.filter((result) => result.isValid),
    };
  }

  return {
    isValid: true,
    files: results.map((result) => result.file),
    totalSize: results.reduce((sum, result) => sum + result.size, 0),
  };
};

/**
 * Get human-readable file size
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

/**
 * Create file preview URL safely
 * @param {File} file - File to preview
 * @returns {Promise<string>} Preview URL
 */
export const createFilePreview = async (file) => {
  return new Promise((resolve, reject) => {
    const validation = validateImageFile(file);

    validation
      .then((result) => {
        if (!result.isValid) {
          reject(new Error(result.error));
          return;
        }

        const reader = new FileReader();

        reader.onload = (e) => {
          resolve(e.target.result);
        };

        reader.onerror = (error) => {
          reject(error);
        };

        reader.readAsDataURL(file);
      })
      .catch(reject);
  });
};

/**
 * Revoke object URL to free memory
 * @param {string} url - Object URL to revoke
 */
export const revokeFilePreview = (url) => {
  if (url && url.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
};

export default {
  validateFile,
  validateImageFile,
  validatePDFFile,
  validateMultipleFiles,
  detectFileType,
  formatFileSize,
  createFilePreview,
  revokeFilePreview,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_PDF_TYPES,
  FILE_SIZE_LIMITS,
};
