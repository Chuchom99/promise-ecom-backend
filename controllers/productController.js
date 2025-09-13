const { Product, Category, ProductImage } = require('../models');
const logger = require('../logger');
const { validationResult } = require('express-validator');

const createProduct = async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, price, stock, categoryId } = req.body;
    const files = req.files; // Array of uploaded files

    if (!name || !price || !categoryId) {
      return res.status(400).json({ error: 'Name, price, and categoryId are required' });
    }

    const category = await Category.findByPk(categoryId);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Create product
    const product = await Product.create({
      name,
      description,
      price,
      stock: stock || 0,
      categoryId,
    });

    // Save images
    if (files && files.length > 0) {
      const imageRecords = files.map(file => ({
        productId: product.id,
        imageUrl: `/uploads/${file.filename}`,
      }));
      await ProductImage.bulkCreate(imageRecords);
    }

    // Fetch product with images
    const productWithImages = await Product.findByPk(product.id, {
      include: [{ model: ProductImage, attributes: ['id', 'imageUrl'] }],
    });

    logger.info(`Product created: ${product.id} (${name}) with ${files ? files.length : 0} images`);
    res.status(201).json(productWithImages);
  } catch (err) {
    logger.error(`Create product failed: ${err.message}, Stack: ${err.stack}`);
    res.status(500).json({ error: 'Failed to create product' });
  }
};

const getProducts = async (req, res) => {
  try {
    const products = await Product.findAll({
      include: [
        { model: Category, attributes: ['name'] },
        { model: ProductImage, attributes: ['id', 'imageUrl'] },
      ],
    });
    logger.info('Fetched all products');
    res.json(products);
  } catch (err) {
    logger.error(`Get products failed: ${err.message}`);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

module.exports = { createProduct, getProducts };