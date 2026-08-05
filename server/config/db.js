const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

let replSet = null;

const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }

    let mongoUri = process.env.MONGODB_URI;

    if (!mongoUri || mongoUri === 'embedded') {
      if (!replSet) {
        console.log('[DB] Starting embedded MongoMemoryReplSet for local ACID transactions...');
        replSet = await MongoMemoryReplSet.create({
          replSet: { count: 1, storageEngine: 'wiredTiger' },
        });
      }
      mongoUri = replSet.getUri('walandyo_pos');
    }

    const conn = await mongoose.connect(mongoUri, {
      autoIndex: true,
    });

    console.log(`[DB] MongoDB Connected: ${conn.connection.host} (${conn.connection.name})`);
    return conn;
  } catch (error) {
    console.error(`[DB Error] ${error.message}`);
    process.exit(1);
  }
};

const closeDB = async () => {
  await mongoose.disconnect();
  if (replSet) {
    await replSet.stop();
    replSet = null;
  }
};

module.exports = { connectDB, closeDB };
