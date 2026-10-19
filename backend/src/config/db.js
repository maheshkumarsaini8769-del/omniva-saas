const mongoose = require('mongoose');

// Disable command buffering in serverless/offline environments to prevent 10s hangs
mongoose.set('bufferCommands', false);

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/omniva_saas';
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 2000,
      connectTimeoutMS: 2000,
    });
    console.log(`[Omniva DB] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[Omniva DB Error] ${error.message}`);
    if (process.env.VERCEL !== '1') {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
