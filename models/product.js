// // models/product.js
// module.exports = (sequelize, DataTypes) => {
//   return sequelize.define('Product', {
//     id: {
//       type: DataTypes.UUID,
//       defaultValue: DataTypes.UUIDV4,
//       primaryKey: true,
//     },
//     categoryId: {
//       type: DataTypes.UUID,
//       allowNull: false,
//     },
//     name: {
//       type: DataTypes.STRING,
//       allowNull: false,
//     },
//     description: {
//       type: DataTypes.TEXT,
//       allowNull: true,
//     },
//     price: {
//       type: DataTypes.DECIMAL(10, 2), // in NGN (convert to kobo for Paystack)
//       allowNull: false,
//     },
//     imageUrl: {
//       type: DataTypes.STRING, // e.g., /uploads/12345-hair.jpg
//       allowNull: true,
//     },
//     stock: {
//       type: DataTypes.INTEGER,
//       allowNull: false,
//       defaultValue: 0,
//     },
//   }, {
//     timestamps: true,
//   });
// };

// models/product.js
module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Product', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  }, {
    timestamps: true,
  });
};