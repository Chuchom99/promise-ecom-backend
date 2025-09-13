// services/email.js
const nodemailer = require('nodemailer');
const logger = require('../logger');
require('dotenv').config();

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  logger.error('Missing EMAIL_USER or EMAIL_PASS in environment variables');
  throw new Error('Email configuration missing');
}

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Send a single email with retry logic
const sendSingleEmail = async (to, subject, text, retries = 5, initialDelay = 2000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await transporter.sendMail({
        from: `"Hair Seller" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text,
      });
      logger.info(`Email sent to ${to}: ${subject}`);
      return true;
    } catch (err) {
      const isRateLimitError = err.message.includes('Too many emails per second') || err.code === '550';
      logger.warn(`Email attempt ${attempt} failed for ${to}: ${err.message}`);
      if (attempt === retries || !isRateLimitError) {
        logger.error(`Failed to send email to ${to} after ${retries} attempts: ${err.message}`);
        return false;
      }
      // Exponential backoff for rate limit errors
      const delay = initialDelay * Math.pow(2, attempt - 1);
      logger.info(`Retrying email to ${to} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Send bulk emails with batch processing
const sendBulkEmails = async (recipients, subject, text, batchSize = 2, batchDelay = 5000) => {
  const results = { sent: [], failed: [] };

  // Process recipients in batches
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);
    const promises = batch.map(recipient =>
      sendSingleEmail(recipient.email, subject, text).then(success => ({
        email: recipient.email,
        success,
      }))
    );

    const batchResults = await Promise.all(promises);
    batchResults.forEach(result => {
      if (result.success) {
        results.sent.push(result.email);
      } else {
        results.failed.push(result.email);
      }
    });

    // Delay between batches to avoid rate limits
    if (i + batchSize < recipients.length) {
      logger.info(`Waiting ${batchDelay}ms before next batch`);
      await new Promise(resolve => setTimeout(resolve, batchDelay));
    }
  }

  logger.info(`Bulk email results: ${results.sent.length} sent, ${results.failed.length} failed`);
  return results;
};

module.exports = { sendSingleEmail, sendBulkEmails };