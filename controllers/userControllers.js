const { User } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const logger = require('winston');
const { sendEmail } = require('../services/email');

// Register a new user
const register = async (req, res) => {
  try {
    const { email, name, password, role = 'customer' } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if email exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      email,
      name,
      password_hash,
      role: role === 'admin' ? 'admin' : 'customer', // Restrict admin role
    });

    // Send welcome email
    await sendEmail(email, 'Welcome to Hair Seller', `Hi ${name || 'Customer'}, your account is ready!`);

    logger.info(`User registered: ${email}`);
    res.status(201).json({ message: 'User registered successfully', id: user.id });
  } catch (err) {
    logger.error(`Registration failed: ${err.message}`);
    res.status(500).json({ error: 'Registration failed' });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '1d', // Token expires in 1 day
    });

    logger.info(`User logged in: ${email}`);
    res.json({ token, user: { id: user.id, email, name: user.name, role: user.role } });
  } catch (err) {
    logger.error(`Login failed: ${err.message}`);
    res.status(500).json({ error: 'Login failed' });
  }
};

// Get user details
const getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, {
      attributes: ['id', 'email', 'name', 'role', 'createdAt', 'updatedAt'],
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Authorization: Only self or admin can view
    if (req.user.id !== id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    logger.info(`Fetched user: ${id}`);
    res.json(user);
  } catch (err) {
    logger.error(`Get user failed: ${err.message}`);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

// Update user profile
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, name, password } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Authorization: Only self or admin can update
    if (req.user.id !== id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Update fields
    const updates = {};
    if (email) updates.email = email;
    if (name) updates.name = name;
    if (password) updates.password_hash = await bcrypt.hash(password, 10);

    await user.update(updates);

    logger.info(`User updated: ${id}`);
    res.json({ message: 'User updated successfully' });
  } catch (err) {
    logger.error(`Update user failed: ${err.message}`);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

// Delete user (admin only)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.destroy();
    logger.info(`User deleted: ${id}`);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    logger.error(`Delete user failed: ${err.message}`);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

module.exports = { register, login, getUser, updateUser, deleteUser };