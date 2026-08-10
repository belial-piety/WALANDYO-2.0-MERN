const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

let replSet = null;

const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }

    // Use a persistent local MongoDB replica set by default.
    // The temporary in-memory database is now opt-in only via MONGODB_URI=embedded.
    let mongoUri = process.env.MONGODB_URI ||
      'mongodb://127.0.0.1:27017/walandyo_pos?replicaSet=rs0&directConnection=true';

    if (mongoUri === 'embedded') {
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
    console.log(`[DB] Persistence mode: ${replSet ? 'TEMPORARY / IN-MEMORY' : 'PERSISTENT'}`);
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
