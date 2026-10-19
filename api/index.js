const mongoose = require('mongoose');
const connectDB = require('../backend/src/config/db');
const { app } = require('../backend/src/server');

module.exports = async (req, res) => {
  const isLocalUri =
    (process.env.MONGODB_URI || '').includes('127.0.0.1') ||
    (process.env.MONGODB_URI || '').includes('localhost');

  if (process.env.VERCEL && isLocalUri) {
    // Skip connecting to local loopback on Vercel cloud serverless
  } else {
    try {
      await Promise.race([
        connectDB(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('DB connection timeout')), 1500)),
      ]);
    } catch (err) {
      // Graceful fallback in cloud preview when MongoDB Atlas is not yet configured
    }
  }
  return app(req, res);
};
