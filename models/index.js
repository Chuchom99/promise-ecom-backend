// // models/index.js
// const { Sequelize, DataTypes } = require('sequelize');
// const dotenv = require('dotenv');

// dotenv.config();

// const sequelize = new Sequelize(
//   process.env.DB_NAME,
//   process.env.DB_USER,
//   process.env.DB_PASS,
//   { host: process.env.DB_HOST, dialect: 'mysql' }
// );

// // Import models
// const Product = require('./product')(sequelize, DataTypes);
// const User = require('./user')(sequelize, DataTypes);
// const Order = require('./order')(sequelize, DataTypes);
// const OrderItem = require('./orderitem')(sequelize, DataTypes);
// const Payment = require('./payment')(sequelize, DataTypes);
// const Category = require('./category')(sequelize, DataTypes);
// const Subscription = require('./subscription')(sequelize, DataTypes);

// // Associations
// User.hasMany(Order, { foreignKey: 'userId', onDelete: 'SET NULL' });
// Order.belongsTo(User, { foreignKey: 'userId' });

// Order.hasMany(OrderItem, { foreignKey: 'orderId', onDelete: 'CASCADE' });
// OrderItem.belongsTo(Order, { foreignKey: 'orderId' });

// OrderItem.belongsTo(Product, { foreignKey: 'productId' });
// Product.hasMany(OrderItem, { foreignKey: 'productId' });

// Payment.belongsTo(Order, { foreignKey: 'orderId', onDelete: 'CASCADE' });
// Order.hasOne(Payment, { foreignKey: 'orderId' });

// Category.hasMany(Product, { foreignKey: 'categoryId', onDelete: 'RESTRICT' });
// Product.belongsTo(Category, { foreignKey: 'categoryId' });

// // Sync database
// sequelize.sync({ alter: true })
//   .then(() => console.log('Database synced'))
//   .catch(err => console.error('Sync failed:', err));

// module.exports = { sequelize, Product, User, Order, OrderItem, Payment, Category, Subscription };

// models/index.js
const { Sequelize, DataTypes } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  { host: process.env.DB_HOST, dialect: 'mysql' }
);

// Import models
const Product = require('./product')(sequelize, DataTypes);
const User = require('./user')(sequelize, DataTypes);
const Order = require('./order')(sequelize, DataTypes);
const OrderItem = require('./orderitem')(sequelize, DataTypes);
const Payment = require('./payment')(sequelize, DataTypes);
const Category = require('./category')(sequelize, DataTypes);
const Subscription = require('./subscription')(sequelize, DataTypes);
const ProductImage = require('./productImages')(sequelize, DataTypes);

// Associations
User.hasMany(Order, { foreignKey: 'userId', onDelete: 'SET NULL' });
Order.belongsTo(User, { foreignKey: 'userId' });

Order.hasMany(OrderItem, { foreignKey: 'orderId', onDelete: 'CASCADE' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId' });

OrderItem.belongsTo(Product, { foreignKey: 'productId' });
Product.hasMany(OrderItem, { foreignKey: 'productId' });

Payment.belongsTo(Order, { foreignKey: 'orderId', onDelete: 'CASCADE' });
Order.hasOne(Payment, { foreignKey: 'orderId' });

Category.hasMany(Product, { foreignKey: 'categoryId', onDelete: 'RESTRICT' });
Product.belongsTo(Category, { foreignKey: 'categoryId' });

Product.hasMany(ProductImage, { foreignKey: 'productId', onDelete: 'CASCADE' });
ProductImage.belongsTo(Product, { foreignKey: 'productId' });

// Sync database
// sequelize.sync({ alter: true })
//   .then(() => console.log('Database synced'))
//   .catch(err => console.error('Sync failed:', err));

module.exports = { sequelize, Product, User, Order, OrderItem, Payment, Category, Subscription, ProductImage };