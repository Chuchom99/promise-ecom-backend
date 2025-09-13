// models/order.js
module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Order', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true, // For guest orders
    },
    guestEmail: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: { isEmail: true },
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2), // e.g., 1500.00 NGN
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'paid', 'shipped', 'delivered', 'cancelled'),
      defaultValue: 'pending',
    },
    reference: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true, // Paystack reference
    },
    shippingAddress: {
      type: DataTypes.JSON, // { street, city, state }
      allowNull: false,
    },
  }, {
    timestamps: true,
  });
};