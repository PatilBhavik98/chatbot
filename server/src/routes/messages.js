const express = require('express');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

async function userInConversation(userId, conversationId) {
  const conv = await Conversation.findById(conversationId);
  if (!conv) return null;
  const ok = conv.participants.some((p) => p.equals(userId));
  return ok ? conv : null;
}

router.get('/:conversationId', requireAuth, async (req, res) => {
  const conv = await userInConversation(req.user._id, req.params.conversationId);
  if (!conv) {
    return res.status(404).json({ message: 'Conversation not found' });
  }
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const messages = await Message.find({ conversationId: conv._id })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('senderId', 'displayName email');

  res.json({
    messages: messages.reverse().map((m) => ({
      id: m._id.toString(),
      conversationId: m.conversationId.toString(),
      text: m.text,
      createdAt: m.createdAt,
      sender: {
        id: m.senderId._id.toString(),
        displayName: m.senderId.displayName,
      },
    })),
  });
});

module.exports = router;