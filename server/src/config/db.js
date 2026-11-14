const mongoose = require('mongoose');

async function connectDb() {
  const useMemory = process.env.MONGODB_USE_MEMORY === 'true';
  let uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/chatbot';

  if (process.env.NODE_ENV === 'production' && !useMemory && !process.env.MONGODB_URI) {
    throw new Error(
      'Set MONGODB_URI on Render (MongoDB Atlas free tier). In-memory DB does not work reliably on Render.'
    );
  }

  if (useMemory) {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const memory = await MongoMemoryServer.create();
    uri = memory.getUri();
    console.log('Using in-memory MongoDB (data resets when server stops)');
  }

  await mongoose.connect(uri);
  console.log('MongoDB connected');
}

module.exports = { connectDb };