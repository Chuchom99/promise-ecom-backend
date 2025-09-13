// routes/emails.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { sendBulkEmail } = require('../controllers/emailMarketing');
const authMiddleware = require('../middleware/auth');

const validateBulkEmail = [
  body('subject').isString().notEmpty().withMessage('Subject is required'),
  body('text').isString().notEmpty().withMessage('Text is required'),
  body('target').isIn(['all_users', 'subscribers', 'pending_orders']).withMessage('Invalid target'),
  body('retryFailed').optional().isBoolean().withMessage('retryFailed must be a boolean'),
];

router.post('/send-bulk', authMiddleware, validateBulkEmail, sendBulkEmail);

module.exports = router;