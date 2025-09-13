// models/payment.js
module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Payment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'success', 'failed'),
      defaultValue: 'pending',
    },
    reference: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true, // Paystack reference
    },
    paymentMethod: {
      type: DataTypes.STRING, // e.g., 'card', 'bank'
      allowNull: true,
    },
  }, {
    timestamps: true,
  });
};