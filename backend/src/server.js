const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { validateEnv } = require('./config/env');
validateEnv();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');
const { generalRateLimiter } = require('./middlewares/rateLimitMiddleware');
const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const crmRoutes = require('./routes/crmRoutes');
const metaRoutes = require('./routes/metaRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const automationRoutes = require('./routes/automationRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const publicStoreRoutes = require('./routes/publicStoreRoutes');
const adminRoutes = require('./routes/adminRoutes');
const integrationRoutes = require('./routes/integrationRoutes');
const couponRoutes = require('./routes/couponRoutes');
const { handleRazorpayWebhook } = require('./controllers/paymentWebhookController');
const { sanitizeInput } = require('./middlewares/sanitizeMiddleware');
const { notFound, errorHandler } = require('./middlewares/errorHandler');

const app = express();

// Only trust proxy headers when the deployment is actually behind a trusted proxy.
// Rate limiting uses req.ip, so this must not be enabled blindly.
if (process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1);
}

// Security and utility middlewares
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
// A wildcard origin is invalid with credentials and is rejected by browsers.
// If CLIENT_URL is unset (same-origin deployment), disable cross-origin access.
const configuredClientUrl = (process.env.CLIENT_URL || '').trim();
const corsOrigin = configuredClientUrl && configuredClientUrl !== '*' ? configuredClientUrl : false;
app.use(cors({
  origin: corsOrigin,
  credentials: Boolean(corsOrigin),
}));
app.use(
  express.json({
    limit: '10mb',
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(sanitizeInput);

// Global API rate limit. Auth and checkout add tighter limits on top of this.
app.use('/api', generalRateLimiter.middleware());

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Base routes
app.use('/api', healthRoutes);
app.use('/api/public', publicStoreRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/crm', crmRoutes);
app.use('/api', metaRoutes);
app.use('/api', productRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api', bookingRoutes);
app.post('/api/webhooks/razorpay', handleRazorpayWebhook);
app.use('/api/automations', automationRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/admin', adminRoutes);

// Static assets for production deployment
const frontendDist = path.resolve(__dirname, '../../frontend/dist');

if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.use((req, res, next) => {
    if ((req.method === 'GET' || req.method === 'HEAD') && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(frontendDist, 'index.html'));
    }
    next();
  });
} else {
  // Welcome root route fallback when frontend is not yet built
  app.get('/', (req, res) => {
    res.json({
      message: 'Welcome to Omniva Multi-Business Order & Booking Management SaaS API',
      documentation: '/api/docs (coming soon)',
      health: '/api/health',
    });
  });
}

// Error Handlers
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5001;

// Connect to MongoDB and start server
const startServer = async () => {
  await connectDB();
  return new Promise((resolve, reject) => {
    const s = app.listen(PORT, () => {
      console.log(`[Omniva Server] Running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      resolve(s);
    });
    s.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`[Omniva Server] Port ${PORT} already active, continuing with running instance.`);
        resolve(s);
      } else {
        reject(err);
      }
    });
  });
};

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
