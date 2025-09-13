// routes/payments.js
const express = require('express');
const router = express.Router();
const { param } = require('express-validator');
const { handleWebhook, verifyPayment } = require('../controllers/paymentController');

router.post('/webhook', handleWebhook);
router.get('/:reference', [param('reference').isString()], verifyPayment);
router.get('/callback', async (req, res) => {
  const { reference } = req.query;
  if (!reference) {
    return res.status(400).json({ error: 'Reference is required' });
  }
  // Redirect to a frontend page or API to verify payment
  res.redirect(`/api/payments/${reference}`);
});

module.exports = router;