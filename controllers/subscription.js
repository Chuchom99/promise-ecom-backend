const { Subscription } = require('../models');
const logger = require('winston');
const { sendEmail } = require('../services/email');

const subscribe = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const existing = await Subscription.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email already subscribed' });
    }

    const subscription = await Subscription.create({ email });
    await sendEmail(email, 'Welcome to Our Newsletter', 'Thank you for subscribing!');

    logger.info(`Subscribed: ${email}`);
    res.status(201).json({ message: 'Subscribed successfully' });
  } catch (err) {
    logger.error(`Subscription failed: ${err.message}`);
    res.status(500).json({ error: 'Subscription failed' });
  }
};

module.exports = { subscribe };