const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const productDir = path.join(UPLOAD_DIR, 'products');

if (!fs.existsSync(productDir)) fs.mkdirSync(productDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, productDir),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + ext);
  }
});

const upload = multer({ storage });
module.exports = upload;
