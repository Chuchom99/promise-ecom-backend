require('dotenv').config();
const express = require('express');
const path = require('path');
const { sequelize } = require('./models');
const logger = require('./logger');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const timeout = require('express-timeout-handler');



const usersRoutes = require('./routes/users');
const productsRoute = require('./routes/productroutes')
const orderRoutes = require('./routes/orderRoutes')
const subcriptionRoute = require("./routes/subscription")
const categoriesRoutes = require('./routes/categoryRoutes');
const paymentsRoutes = require('./routes/paymentRoutes');
const emailsRoutes = require('./routes/emailMarketing');


const app = express();
app.use(express.json());

// Timeout middleware
app.use(
  timeout.handler({
    timeout: 60000, // 60 seconds default
    onTimeout: (req, res) => {
      logger.error(`Request timed out: ${req.originalUrl}`);
      res.status(504).json({
        error: 'Request timeout',
        message: 'Bulk email operation took too long. Partial results may be available.',
      });
    },
    disable: ['write', 'setHeaders'], // Allow response after timeout
  })
);


// Serve uploads
app.use('/uploads', express.static(path.resolve(__dirname, process.env.UPLOAD_DIR || 'uploads')));app.use(helmet()); // Secure headers
app.use(helmet());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit to 100 requests per IP
    message: 'Too many requests, please try again later.',
  })
);

// Routes
app.use('/api/users', usersRoutes);
app.use("/api/", productsRoute)
app.use("/api/orders", orderRoutes)
app.use('/api/subscriptions', subcriptionRoute)
app.use('/api/categories', categoriesRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/emails', emailsRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "API is working" });
});


// DB connect & start server
const startServer = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connected');
    app.listen(process.env.PORT || 3000, () => {
      logger.info(`Server running on port ${process.env.PORT || 3000}`);
    });
  } catch (err) {
    logger.error(`Database connection failed: ${err.message}`);
    process.exit(1);
  }
};

startServer();
