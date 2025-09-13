const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const { createCategory, getCategories, getCategory, updateCategory, deleteCategory } = require('../controllers/category');
const authMiddleware = require('../middleware/auth');

// Validation middleware
const validateCategory = [
  body('name').notEmpty().withMessage('Name is required').isString().withMessage('Name must be a string'),
  body('slug').notEmpty().withMessage('Slug is required').isString().withMessage('Slug must be a string'),
  body('description').optional().isString().withMessage('Description must be a string'),
];

const validateId = [
  param('id').isUUID().withMessage('Invalid UUID format'),
];

// Routes
router.post('/create-category', authMiddleware, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}, validateCategory, createCategory);

router.get('/', getCategories);

router.get('/:id', validateId, getCategory);

router.put('/:id', authMiddleware, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}, validateId, validateCategory, updateCategory);

router.delete('/:id', authMiddleware, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}, validateId, deleteCategory);

module.exports = router;