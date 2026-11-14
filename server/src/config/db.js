const mongoose = require('mongoose');

async function connectDb() {
  let uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/chatbot';

  if (process.env.MONGODB_USE_MEMORY === 'true') {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const memory = await MongoMemoryServer.create();
    uri = memory.getUri();
    console.log('Using in-memory MongoDB (data resets when server stops)');
  }

  await mongoose.connect(uri);
  console.log('MongoDB connected');
}

module.exports = { connectDb };