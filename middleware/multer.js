// middleware/multer.js
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../utils/cloudinary');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'newsify-images', // optional folder name
    allowed_formats: ['jpg', 'jpeg', 'png']
  }
});

const upload = multer({ storage });

module.exports = upload;
