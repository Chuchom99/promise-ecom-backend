
const { Order, OrderItem, Product, User, Payment,  ProductImage } = require('../models');
const logger = require('../logger');
const { validationResult } = require('express-validator');
const Paystack = require('paystack')(process.env.PAYSTACK_SECRET_KEY);
const { sendEmail } = require('../services/email');

const createOrder = async (req, res) => {
  const transaction = await req.sequelize.transaction();
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await transaction.rollback();
      return res.status(400).json({ errors: errors.array() });
    }

    const { items, shippingAddress, guestEmail } = req.body;
    const userId = req.user ? req.user.id : null;

    if (!items || !Array.isArray(items) || items.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Items array is required' });
    }
    if (!shippingAddress || typeof shippingAddress !== 'object') {
      await transaction.rollback();
      return res.status(400).json({ error: 'Shipping address is required' });
    }
    if (!userId && !guestEmail) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Guest email is required for non-authenticated users' });
    }

    let total_amount = 0;
    for (const item of items) {
      const product = await Product.findByPk(item.productId, {
        include: [{ model: ProductImage, attributes: ['imageUrl'] }],
        transaction,
      });
      if (!product) {
        await transaction.rollback();
        return res.status(404).json({ error: `Product not found: ${item.productId}` });
      }
      if (product.stock < item.quantity) {
        await transaction.rollback();
        return res.status(400).json({ error: `Insufficient stock for product: ${product.name}` });
      }
      total_amount += product.price * item.quantity;
    }

    const reference = `order-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const order = await Order.create(
      {
        userId,
        guestEmail: userId ? null : guestEmail,
        total_amount,
        status: 'pending',
        shippingAddress,
        reference,
      },
      { transaction }
    );

    for (const item of items) {
      const product = await Product.findByPk(item.productId, { transaction });
      await OrderItem.create(
        {
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          price: product.price,
        },
        { transaction }
      );
      await product.update({ stock: product.stock - item.quantity }, { transaction });
    }

    const email = userId ? (await User.findByPk(userId, { transaction })).email : guestEmail;
    const payment = await Paystack.transaction.initialize({
      email,
      amount: total_amount * 100, // Convert to kobo
      reference,
      callback_url: process.env.PAYSTACK_CALLBACK_URL || 'http://localhost:3000/api/payments/callback',
    });

    await Payment.create(
      {
        orderId: order.id,
        amount: total_amount,
        status: 'pending',
        reference,
        paymentMethod: 'card',
      },
      { transaction }
    );

    await sendEmail(
      email,
      'Order Confirmation',
      `Your order #${order.id} is pending. Complete payment at: ${payment.data.authorization_url}`
    ).catch(err => logger.error(`Failed to send order email to ${email}: ${err.message}`));

    await transaction.commit();
    logger.info(`Order created: ${order.id}, Payment initialized: ${reference}`);
    res.status(201).json({
      order,
      paymentUrl: payment.data.authorization_url,
      reference,
    });
  } catch (err) {
    await transaction.rollback();
    logger.error(`Create order failed: ${err.message}, Stack: ${err.stack}`);
    res.status(500).json({ error: 'Failed to create order' });
  }
};

module.exports = { createOrder };