
const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const { createProduct, getProducts, getProductById, updateProduct, deleteProduct } = require('../controllers/productController');
const authMiddleware = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.resolve(__dirname, '../Uploads')),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images are allowed'));
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

const validateProduct = [
  body('name').isString().notEmpty().withMessage('Name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('categoryId').isUUID().withMessage('Valid categoryId is required'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
];

const validateUpdateProduct = [
  body('name').optional().isString().notEmpty().withMessage('Name must be a non-empty string'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('categoryId').optional().isUUID().withMessage('Valid categoryId is required'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('deleteImages').optional().isArray().withMessage('deleteImages must be an array'),
  body('deleteImages.*').isUUID().withMessage('Each deleteImages ID must be a UUID'),
];

router.post('/create-product', authMiddleware, upload.array('images', 5), validateProduct, createProduct);
router.get('/get-product', getProducts);
router.get('/get-product/:id', [param('id').isUUID().withMessage('Valid UUID is required')], getProductById);
router.put('/update-product/:id', authMiddleware, upload.array('images', 5), validateUpdateProduct, updateProduct);
router.delete('/delete-product/:id', authMiddleware, [param('id').isUUID().withMessage('Valid UUID is required')], deleteProduct);

module.exports = router;