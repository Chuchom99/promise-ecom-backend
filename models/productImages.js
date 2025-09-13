// models/productImage.js
module.exports = (sequelize, DataTypes) => {
  return sequelize.define('ProductImage', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    imageUrl: {
      type: DataTypes.STRING, // e.g., /uploads/12345-image.jpg
      allowNull: false,
    },
  }, {
    timestamps: true,
  });
};