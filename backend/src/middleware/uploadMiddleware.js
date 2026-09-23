const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'products');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_MB = 5;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `product-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new Error('Only JPG, JPEG, PNG, and WEBP image files are allowed'));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024 },
});

// Wraps multer's single-file upload so file errors return a clean JSON response
// instead of crashing/propagating as raw multer errors.
const uploadProductImage = (req, res, next) => {
  const handler = upload.single('picture');
  handler(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: { picture: `Image size must not exceed ${MAX_FILE_SIZE_MB}MB` },
        });
      }
      return res.status(400).json({ success: false, message: 'Validation failed', errors: { picture: err.message } });
    }
    if (err) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: { picture: err.message } });
    }
    next();
  });
};

module.exports = uploadProductImage;