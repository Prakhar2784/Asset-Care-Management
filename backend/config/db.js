const mongoose = require('mongoose');

const RETRY_DELAY = 5000; // 5 seconds between retries
const MAX_RETRIES = 5;

const connectDB = async (retries = MAX_RETRIES) => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Auto-reconnect on disconnect
    mongoose.connection.on('disconnected', () => {
      console.warn('[MongoDB] Disconnected. Attempting to reconnect...');
      setTimeout(() => connectDB(), RETRY_DELAY);
    });

    mongoose.connection.on('error', (err) => {
      console.error('[MongoDB] Connection error:', err.message);
    });

    return conn;
  } catch (error) {
    console.error(`[MongoDB] Connection failed: ${error.message}`);
    if (retries > 0) {
      console.log(`[MongoDB] Retrying in ${RETRY_DELAY / 1000}s... (${retries} attempts left)`);
      await new Promise(res => setTimeout(res, RETRY_DELAY));
      return connectDB(retries - 1);
    }
    console.error('[MongoDB] Max retries reached. Exiting.');
    process.exit(1);
  }
};

module.exports = connectDB;
