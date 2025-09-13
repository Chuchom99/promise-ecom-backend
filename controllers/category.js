const { Category, Product } = require('../models');
const logger = require('../logger');
const { validationResult } = require('express-validator');

// Create a new category (admin only)
const createCategory = async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, slug } = req.body;

    // Check if slug is unique
    const existingCategory = await Category.findOne({ where: { slug } });
    if (existingCategory) {
      return res.status(400).json({ error: 'Slug already exists' });
    }

    const category = await Category.create({ name, description, slug });
    logger.info(`Category created: ${category.id} (${name})`);
    res.status(201).json(category);
  } catch (err) {
    logger.error(`Create category failed: ${err.message}`);
    res.status(500).json({ error: 'Failed to create category' });
  }
};

// List all categories (public)
const getCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      include: [{ model: Product, attributes: ['id', 'name'] }], // Optional: include related products
    });
    logger.info('Fetched all categories');
    res.json(categories);
  } catch (err) {
    logger.error(`Get categories failed: ${err.message}`);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

// Get a specific category by ID (public)
const getCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findByPk(id, {
      include: [{ model: Product, attributes: ['id', 'name', 'price', 'imageUrl'] }],
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    logger.info(`Fetched category: ${id}`);
    res.json(category);
  } catch (err) {
    logger.error(`Get category failed: ${err.message}`);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
};

// Update a category (admin only)
const updateCategory = async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, description, slug } = req.body;

    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Check slug uniqueness if provided
    if (slug && slug !== category.slug) {
      const existingCategory = await Category.findOne({ where: { slug } });
      if (existingCategory) {
        return res.status(400).json({ error: 'Slug already exists' });
      }
    }

    await category.update({ name, description, slug });
    logger.info(`Category updated: ${id}`);
    res.json({ message: 'Category updated successfully', category });
  } catch (err) {
    logger.error(`Update category failed: ${err.message}`);
    res.status(500).json({ error: 'Failed to update category' });
  }
};

// Delete a category (admin only)
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findByPk(id);

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Check if category has associated products
    const productCount = await Product.count({ where: { categoryId: id } });
    if (productCount > 0) {
      return res.status(400).json({ error: 'Cannot delete category with associated products' });
    }

    await category.destroy();
    logger.info(`Category deleted: ${id}`);
    res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    logger.error(`Delete category failed: ${err.message}`);
    res.status(500).json({ error: 'Failed to delete category' });
  }
};

module.exports = { createCategory, getCategories, getCategory, updateCategory, deleteCategory };