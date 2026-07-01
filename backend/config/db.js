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

    // Drop legacy single-field unique index if it exists
    try {
      const db = mongoose.connection.db;
      const collections = await db.listCollections({ name: 'assets' }).toArray();
      if (collections.length > 0) {
        const assetsCollection = db.collection('assets');
        const indexes = await assetsCollection.indexes();
        const hasOldIndex = indexes.some(idx => idx.name === 'serialNumber_1' && !idx.key.hasOwnProperty('tenantId'));
        if (hasOldIndex) {
          console.log('[MongoDB] Dropping legacy unique index: serialNumber_1');
          await assetsCollection.dropIndex('serialNumber_1');
          console.log('[MongoDB] Legacy index dropped!');
          
          // Force Mongoose to sync and build current indexes
          const Asset = require('../models/Asset');
          await Asset.syncIndexes();
          console.log('[MongoDB] Schema indexes synchronized.');
        }
      }
    } catch (e) {
      console.warn('[MongoDB] Index drop warning:', e.message);
    }

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
