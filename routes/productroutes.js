const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { createProduct, getProducts } = require('../controllers/productController');
const authMiddleware = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const logger = require("../logger")

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.resolve(__dirname, '../Uploads')),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only images are allowed'));
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per image
});

const validateProduct = [
  body('name').notEmpty().withMessage('Name is required').isString(),
  body('price').notEmpty().withMessage('Price is required').isFloat({ min: 0 }),
  body('categoryId').notEmpty().withMessage('Category ID is required').isUUID(),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('description').optional().isString(),
];

router.post('/create-product', authMiddleware, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}, upload.array('images', 5), validateProduct, (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    logger.error(`Multer error: ${err.message}, Field: ${err.field}`);
    return res.status(400).json({ error: `Multer error: ${err.message}` });
  }
  next(err);
}, createProduct);

router.get('/get-products', getProducts);

module.exports = router;