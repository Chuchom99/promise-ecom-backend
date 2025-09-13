// routes/orders.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { createOrder } = require('../controllers/ordercontroller');
const authMiddleware = require('../middleware/auth');
const { sequelize } = require('../models');

const validateOrder = [
  body('items').isArray({ min: 1 }).withMessage('Items must be a non-empty array'),
  body('items.*.productId').isUUID().withMessage('Invalid product ID'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('shippingAddress').isObject().withMessage('Shipping address must be an object'),
  body('guestEmail').if((value, { req }) => !req.user).isEmail().withMessage('Guest email is required for non-authenticated users'),
];

router.post('/create-order', (req, res, next) => {
  req.sequelize = sequelize; // Pass sequelize for transactions
  authMiddleware(req, res, next);
}, validateOrder, createOrder);

module.exports = router;

// const express = require('express');
// const router = express.Router();
// const { body } = require('express-validator');
// const { createOrder } = require('../controllers/ordercontroller');
// const authMiddleware = require('../middleware/auth');
// const { sequelize } = require('../models');

// const validateOrder = [
//   body('items').isArray({ min: 1 }).withMessage('Items must be a non-empty array'),
//   body('items.*.productId').isUUID().withMessage('Invalid product ID'),
//   body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
//   body('shippingAddress').isObject().withMessage('Shipping address must be an object'),
//   body('guestEmail').if((value, { req }) => !req.user).isEmail().withMessage('Guest email is required for non-authenticated users'),
// ];

// router.post('/create-order', (req, res, next) => {
//   req.sequelize = sequelize; // Pass sequelize instance
//   authMiddleware(req, res, next); // Optional auth
// }, validateOrder, createOrder);

// module.exports = router;