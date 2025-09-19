const { Product, Category, ProductImage, OrderItem, Subscription } = require('../models');
const logger = require('../logger');
const { validationResult } = require('express-validator');
const { sendBulkEmails } = require('../services/bulkEmail');
const fs = require('fs').promises;
const path = require('path');

const createProduct = async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, price, stock, categoryId } = req.body;
    const files = req.files; // Array of uploaded files from Multer

    if (!name || !price || !categoryId) {
      return res.status(400).json({ error: 'Name, price, and categoryId are required' });
    }

    // Check for duplicate product name
    const existingProduct = await Product.findOne({ where: { name } });
    if (existingProduct) {
      return res.status(400).json({ error: 'Product name already exists' });
    }

    // Validate category
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
    let imageRecords = [];
    if (files && files.length > 0) {
      imageRecords = files.map(file => ({
        productId: product.id,
        imageUrl: `/uploads/${file.filename}`,
      }));
      await ProductImage.bulkCreate(imageRecords);
    }

    // Fetch product with images and category
    const productWithDetails = await Product.findByPk(product.id, {
      include: [
        { model: ProductImage, attributes: ['id', 'imageUrl'] },
        { model: Category, attributes: ['name'] },
      ],
    });

    // Notify subscribers
    const subscribers = await Subscription.findAll({ attributes: ['email'] });
    if (subscribers.length > 0) {
      await sendBulkEmails(
        subscribers,
        'New Product Available!',
        `Check out our new product: ${name}. Price: NGN ${price}. Visit our store!`,
        2,
        3000
      ).catch(err => logger.error(`Failed to notify subscribers: ${err.message}`));
    }

    logger.info(`Product created: ${product.id} (${name}) with ${files ? files.length : 0} images`);
    res.status(201).json(productWithDetails);
  } catch (err) {
    logger.error(`Create product failed: ${err.message}, Stack: ${err.stack}`);
    res.status(500).json({ error: 'Failed to create product' });
  }
};

const getProducts = async (req, res) => {
  try {
    const { categoryId, minPrice, maxPrice, search } = req.query;
    const where = {};

    if (categoryId) where.categoryId = categoryId;
    if (minPrice) where.price = { [Op.gte]: parseFloat(minPrice) };
    if (maxPrice) where.price = { ...where.price, [Op.lte]: parseFloat(maxPrice) };
    if (search) where.name = { [Op.like]: `%${search}%` };

    const products = await Product.findAll({
      where,
      include: [
        { model: Category, attributes: ['name'] },
        { model: ProductImage, attributes: ['id', 'imageUrl'] },
      ],
    });

    logger.info(`Fetched ${products.length} products`);
    res.json(products);
  } catch (err) {
    logger.error(`Get products failed: ${err.message}, Stack: ${err.stack}`);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByPk(id, {
      include: [
        { model: Category, attributes: ['name'] },
        { model: ProductImage, attributes: ['id', 'imageUrl'] },
      ],
    });

    if (!product) {
      logger.info(`Product not found: ${id}`);
      return res.status(404).json({ error: 'Product not found' });
    }

    logger.info(`Fetched product: ${id}`);
    res.json(product);
  } catch (err) {
    logger.error(`Get product failed: ${err.message}, Stack: ${err.stack}`);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
};

const updateProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, description, price, stock, categoryId, deleteImages } = req.body;
    const files = req.files;

    logger.info(`Attempting to update product: ${id}`);

    const product = await Product.findByPk(id, { paranoid: false });
    if (!product) {
      logger.info(`Product not found: ${id}`);
      return res.status(404).json({ error: 'Product not found' });
    }

    if (categoryId) {
      const category = await Category.findByPk(categoryId);
      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }
    }

    if (name && name !== product.name) {
      const existingProduct = await Product.findOne({ where: { name } });
      if (existingProduct) {
        return res.status(400).json({ error: 'Product name already exists' });
      }
    }

    await product.update({
      name: name || product.name,
      description: description || product.description,
      price: price !== undefined ? price : product.price,
      stock: stock !== undefined ? stock : product.stock,
      categoryId: categoryId || product.categoryId,
    });

    if (deleteImages && Array.isArray(deleteImages)) {
      const images = await ProductImage.findAll({
        where: { id: deleteImages, productId: product.id },
      });
      for (const image of images) {
        const filePath = path.join(__dirname, '..', image.imageUrl);
        await fs.unlink(filePath).catch(err => logger.warn(`Failed to delete image ${image.imageUrl}: ${err.message}`));
        await image.destroy();
      }
    }

    if (files && files.length > 0) {
      const imageRecords = files.map(file => ({
        productId: product.id,
        imageUrl: `/Uploads/${file.filename}`,
      }));
      await ProductImage.bulkCreate(imageRecords);
    }

    const updatedProduct = await Product.findByPk(id, {
      include: [
        { model: Category, attributes: ['name'] },
        { model: ProductImage, attributes: ['id', 'imageUrl'] },
      ],
    });

    logger.info(`Product updated: ${id} (${name || product.name})`);
    res.json(updatedProduct);
  } catch (err) {
    logger.error(`Update product failed: ${err.message}, Stack: ${err.stack}`);
    res.status(500).json({ error: 'Failed to update product' });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByPk(id);
    if (!product) {
      logger.info(`Product not found for deletion: ${id}`);
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if product is linked to orders
    const orderItems = await OrderItem.findAll({ where: { productId: id } });
    if (orderItems.length > 0) {
      logger.info(`Cannot delete product ${id}: linked to ${orderItems.length} orders`);
      return res.status(400).json({ error: 'Cannot delete product with existing orders' });
    }

    // Delete images
    const images = await ProductImage.findAll({ where: { productId: id } });
    for (const image of images) {
      const filePath = path.join(__dirname, '..', image.imageUrl);
      await fs.unlink(filePath).catch(err => logger.warn(`Failed to delete image ${image.imageUrl}: ${err.message}`));
      await image.destroy();
    }

    // Delete product
    await product.destroy();
    logger.info(`Product deleted: ${id}`);
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    logger.error(`Delete product failed: ${err.message}, Stack: ${err.stack}`);
    res.status(500).json({ error: 'Failed to delete product' });
  }
};

module.exports = { createProduct, getProducts, getProductById, updateProduct, deleteProduct };