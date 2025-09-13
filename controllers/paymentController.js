// controllers/paymentController.js
const { Payment, Order, User } = require('../models');
const logger = require('../logger');
const crypto = require('crypto');
const Paystack = require('paystack')(process.env.PAYSTACK_SECRET_KEY);
const { sendEmail } = require('../services/email');

const handleWebhook = async (req, res) => {
  try {
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest('hex');
    if (hash !== req.headers['x-paystack-signature']) {
      logger.error('Invalid Paystack webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = req.body;
    if (event.event === 'charge.success') {
      const { reference, amount, status } = event.data;
      const payment = await Payment.findOne({ where: { reference } });
      if (!payment) {
        logger.error(`Payment not found for reference: ${reference}`);
        return res.status(404).json({ error: 'Payment not found' });
      }

      await payment.update({ status: 'success' });
      const order = await Order.findByPk(payment.orderId, {
        include: [{ model: User, attributes: ['email'] }],
      });
      await order.update({ status: 'paid' });

      const email = order.userId ? order.User.email : order.guestEmail;
      await sendEmail(
        email,
        'Payment Confirmed',
        `Your payment for order #${order.id} was successful. Amount: NGN ${amount / 100}.`
      ).catch(err => logger.error(`Failed to send payment email to ${email}: ${err.message}`));

      logger.info(`Payment successful: ${reference}`);
    } else if (event.event === 'charge.failed') {
      const { reference } = event.data;
      const payment = await Payment.findOne({ where: { reference } });
      if (payment) {
        await payment.update({ status: 'failed' });
        logger.info(`Payment failed: ${reference}`);
      }
    }

    res.sendStatus(200);
  } catch (err) {
    logger.error(`Webhook failed: ${err.message}, Stack: ${err.stack}`);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { reference } = req.params;
    const payment = await Payment.findOne({ where: { reference } });
    if (!payment) {
      logger.error(`Payment not found for reference: ${reference}`);
      return res.status(404).json({ error: 'Payment not found' });
    }

    const response = await Paystack.transaction.verify(reference);
    if (response.data.status === 'success') {
      await payment.update({ status: 'success' });
      const order = await Order.findByPk(payment.orderId);
      await order.update({ status: 'paid' });
      logger.info(`Payment verified: ${reference}`);
      res.json({ status: 'success', order });
    } else {
      await payment.update({ status: 'failed' });
      logger.info(`Payment verification failed: ${reference}`);
      res.json({ status: 'failed' });
    }
  } catch (err) {
    logger.error(`Verify payment failed: ${err.message}, Stack: ${err.stack}`);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
};

module.exports = { handleWebhook, verifyPayment };