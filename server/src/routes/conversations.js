const express = require('express');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function participantKey(ids) {
  return ids.map(String).sort().join(':');
}

router.get('/', requireAuth, async (req, res) => {
  const conversations = await Conversation.find({
    participants: req.user._id,
  })
    .sort({ lastMessageAt: -1 })
    .populate('participants', 'email displayName avatarUrl isOnline lastSeen');

  const items = conversations.map((c) => {
    const other = c.participants.find(
      (p) => p._id.toString() !== req.user._id.toString()
    );
    return {
      id: c._id.toString(),
      otherUser: other
        ? {
            id: other._id.toString(),
            email: other.email,
            displayName: other.displayName,
            isOnline: other.isOnline,
            lastSeen: other.lastSeen,
          }
        : null,
      lastMessageText: c.lastMessageText,
      lastMessageAt: c.lastMessageAt,
    };
  });

  res.json({ conversations: items });
});

router.post('/', requireAuth, async (req, res) => {
  const peerEmail = String(req.body.peerEmail || '')
    .trim()
    .toLowerCase();
  if (!peerEmail) {
    return res.status(400).json({ message: 'peerEmail required' });
  }
  const peer = await User.findOne({ email: peerEmail });
  if (!peer) {
    return res.status(404).json({ message: 'No user with that email' });
  }
  if (peer._id.equals(req.user._id)) {
    return res.status(400).json({ message: 'Cannot chat with yourself' });
  }

  const pair = [req.user._id, peer._id];
  const existing = await Conversation.findOne({
    participants: { $all: pair, $size: 2 },
  }).populate('participants', 'email displayName isOnline');

  if (existing) {
    const other = existing.participants.find(
      (p) => p._id.toString() !== req.user._id.toString()
    );
    return res.json({
      conversation: {
        id: existing._id.toString(),
        otherUser: {
          id: other._id.toString(),
          email: other.email,
          displayName: other.displayName,
          isOnline: other.isOnline,
        },
      },
    });
  }

  const conversation = await Conversation.create({
    participants: pair,
  });
  await conversation.populate('participants', 'email displayName isOnline');
  const other = conversation.participants.find(
    (p) => p._id.toString() !== req.user._id.toString()
  );

  res.status(201).json({
    conversation: {
      id: conversation._id.toString(),
      otherUser: {
        id: other._id.toString(),
        email: other.email,
        displayName: other.displayName,
        isOnline: other.isOnline,
      },
    },
  });
});

module.exports = router;