// controllers/emailController.js
const { User, Subscription, Order } = require('../models');
const logger = require('../logger');
const { validationResult } = require('express-validator');
const { sendBulkEmails } = require('../services/bulkEmail');

const sendBulkEmail = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { subject, text, target, retryFailed = false } = req.body;

    let recipients = [];
    if (target === 'all_users') {
      recipients = await User.findAll({ attributes: ['email'] });
    } else if (target === 'subscribers') {
      recipients = await Subscription.findAll({ attributes: ['email'] });
    } else if (target === 'pending_orders') {
      const orders = await Order.findAll({
        where: { status: 'pending' },
        include: [{ model: User, attributes: ['email'] }],
      });
      recipients = orders.map(order => ({
        email: order.userId ? order.User.email : order.guestEmail,
      }));
    } else {
      return res.status(400).json({ error: 'Invalid target specified' });
    }

    if (recipients.length === 0) {
      logger.info('No recipients found for bulk email');
      return res.status(400).json({ error: 'No recipients found' });
    }

    logger.info(`Sending bulk email to ${recipients.length} recipients (target: ${target})`);
    let results = await sendBulkEmails(recipients, subject, text);

    // Retry failed and timed-out emails if requested
    if (retryFailed && (results.failed.length > 0 || results.timedOut.length > 0)) {
      const retryRecipients = [...results.failed, ...results.timedOut].map(email => ({ email }));
      logger.info(`Retrying ${retryRecipients.length} failed/timed-out emails`);
      const retryResults = await sendBulkEmails(retryRecipients, subject, text);
      results.sent = [...results.sent, ...retryResults.sent];
      results.failed = retryResults.failed;
      results.timedOut = retryResults.timedOut;
    }

    logger.info(
      `Bulk email sent: ${results.sent.length} succeeded, ${results.failed.length} failed, ${results.timedOut.length} timed out`
    );
    res.status(200).json({
      message: 'Bulk email sending completed',
      sent: results.sent,
      failed: results.failed,
      timedOut: results.timedOut,
    });
  } catch (err) {
    logger.error(`Bulk email failed: ${err.message}, Stack: ${err.stack}`);
    res.status(500).json({
      error: 'Failed to send bulk emails',
      sent: [],
      failed: recipients.map(r => r.email),
      timedOut: [],
    });
  }
};

module.exports = { sendBulkEmail };