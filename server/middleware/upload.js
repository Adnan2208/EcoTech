const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer configuration - store in memory for processing
const storage = multer.memoryStorage();

// File filter - only images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and WebP images are allowed'), false);
  }
};

// Multer upload instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
    files: 5, // Max 5 files
  },
});

// Process and save image locally
const processAndSaveImage = async (buffer, originalName) => {
  try {
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}.jpg`;
    const filepath = path.join(uploadDir, filename);

    // Resize and compress image using Sharp
    await sharp(buffer)
      .resize(1200, 1200, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 80 })
      .toFile(filepath);

    return {
      url: `/uploads/${filename}`,
      publicId: filename,
    };
  } catch (error) {
    throw new Error(`Image processing failed: ${error.message}`);
  }
};

// Delete image from local storage
const deleteImage = async (publicId) => {
  try {
    const filepath = path.join(uploadDir, publicId);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  } catch (error) {
    console.error(`Failed to delete image: ${error.message}`);
  }
};

// Middleware to handle multiple image uploads
const uploadImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      req.uploadedImages = [];
      return next();
    }

    const uploadPromises = req.files.map((file) =>
      processAndSaveImage(file.buffer, file.originalname)
    );

    req.uploadedImages = await Promise.all(uploadPromises);
    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  upload,
  uploadImages,
  deleteImage,
  processAndSaveImage,
};
