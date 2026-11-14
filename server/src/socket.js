const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Conversation = require('./models/Conversation');
const Message = require('./models/Message');
const { verifyToken } = require('./middleware/auth');

const onlineUsers = new Map();

function setupSocket(io) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));
      const payload = verifyToken(token);
      const user = await User.findById(payload.sub);
      if (!user) return next(new Error('User not found'));
      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    onlineUsers.set(socket.userId, socket.id);
    await User.findByIdAndUpdate(socket.userId, {
      isOnline: true,
      lastSeen: new Date(),
    });
    io.emit('presence', {
      userId: socket.userId,
      isOnline: true,
    });

    socket.on('join_conversation', async ({ conversationId }) => {
      const conv = await Conversation.findById(conversationId);
      if (!conv) return;
      const member = conv.participants.some(
        (p) => p.toString() === socket.userId
      );
      if (!member) return;
      socket.join(`conv:${conversationId}`);
    });

    socket.on('send_message', async ({ conversationId, text }) => {
      const trimmed = String(text || '').trim();
      if (!trimmed) return;

      const conv = await Conversation.findById(conversationId);
      if (!conv) return;
      const member = conv.participants.some(
        (p) => p.toString() === socket.userId
      );
      if (!member) return;

      const message = await Message.create({
        conversationId: conv._id,
        senderId: socket.userId,
        text: trimmed,
      });

      conv.lastMessageText = trimmed;
      conv.lastMessageAt = new Date();
      await conv.save();

      const payload = {
        id: message._id.toString(),
        conversationId: conv._id.toString(),
        text: message.text,
        createdAt: message.createdAt,
        sender: {
          id: socket.userId,
          displayName: socket.user.displayName,
        },
      };

      io.to(`conv:${conversationId}`).emit('new_message', payload);
      io.emit('conversation_updated', {
        conversationId: conv._id.toString(),
        lastMessageText: conv.lastMessageText,
        lastMessageAt: conv.lastMessageAt,
      });
    });

    socket.on('typing', ({ conversationId, isTyping }) => {
      socket.to(`conv:${conversationId}`).emit('typing', {
        conversationId,
        userId: socket.userId,
        isTyping: !!isTyping,
      });
    });

    socket.on('disconnect', async () => {
      onlineUsers.delete(socket.userId);
      await User.findByIdAndUpdate(socket.userId, {
        isOnline: false,
        lastSeen: new Date(),
      });
      io.emit('presence', {
        userId: socket.userId,
        isOnline: false,
      });
    });
  });
}

module.exports = { setupSocket };