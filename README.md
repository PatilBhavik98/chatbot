# Chatbot — Email-based real-time chat (MERN)

WhatsApp-style web chat with **email sign-in** (no phone numbers). Stack: MongoDB, Express, React (Vite), Socket.io.

## Features

- Register / log in with email and password
- Start a 1:1 chat by entering another user's email
- Real-time messages via Socket.io
- Conversation list with last message preview
- Online presence (simple)

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- **Either** MongoDB locally / Atlas (`MONGODB_URI`), **or** set `MONGODB_USE_MEMORY=true` in `server/.env` (no install; data is lost when the server stops)

## Setup

### 1. Backend

```bash
cd chatbot/server
cp .env.example .env
# Edit .env if needed (MONGODB_URI, JWT_SECRET)
npm install
npm run dev
```

API + WebSocket: `http://localhost:5000`

### 2. Frontend

```bash
cd chatbot/client
npm install
npm run dev
```

App: `http://localhost:5173` (proxies `/api` to the server)

## Try it

1. Open two browsers (or normal + incognito).
2. Register two accounts with different emails.
3. Log in on each, use **New chat** and enter the other user's email.
4. Send messages — they appear in real time.

## Project structure

```
chatbot/
  client/     React UI
  server/     Express API + Socket.io
```