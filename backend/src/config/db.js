const mongoose = require('mongoose');

// Disable command buffering in serverless/offline environments to prevent 10s hangs
mongoose.set('bufferCommands', false);

let cachedPromise = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  if (!cachedPromise) {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/omniva_saas';
    cachedPromise = mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 10000,
    }).then(conn => {
      console.log(`[Omniva DB] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
      return conn;
    }).catch(error => {
      cachedPromise = null;
      console.error(`[Omniva DB Error] ${error.message}`);
      if (process.env.VERCEL !== '1') {
        process.exit(1);
      }
      throw error;
    });
  }
  return cachedPromise;
};

module.exports = connectDB;
