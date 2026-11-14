# Deploy Chatbot for friends (free)

One public link — the server hosts the React app and the API on the same URL.

## Option A — Render (recommended, free)

1. **GitHub account** — create a new repo (e.g. `chatbot`), push this `chatbot` folder.
2. Go to [render.com](https://render.com) → sign up → **New** → **Blueprint**.
3. Connect the GitHub repo that contains `render.yaml` (repo root = `chatbot` folder, or put `render.yaml` at repo root).
4. After deploy, open the service → **Environment**:
   - Set `CLIENT_ORIGIN` to your live URL, e.g. `https://chatbot-xxxx.onrender.com` (no trailing slash).
5. Share that URL with friends.

**Keep accounts & messages (recommended for real use):**

1. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) → free M0 cluster.
2. Network Access → allow `0.0.0.0/0` (or Render’s egress).
3. Database user + copy connection string.
4. On Render, set:
   - `MONGODB_URI` = your Atlas string
   - `MONGODB_USE_MEMORY` = `false`

Without Atlas, `MONGODB_USE_MEMORY=true` works but **resets when the service restarts** (fine for a quick demo).

**Free tier note:** Render sleeps after ~15 minutes idle; the first visit may take ~1 minute to wake.

## Option B — Push folder to GitHub (commands)

From the `chatbot` folder:

```powershell
git init -b main
git add -A
git commit -m "Chatbot app ready for deploy"
```

Create an empty repo on GitHub, then:

```powershell
git remote add origin https://github.com/YOUR_USER/chatbot.git
git push -u origin main
```

Then follow Option A step 2.

## Option C — MongoDB + split host (advanced)

- API on Render, frontend on [Vercel](https://vercel.com).
- Vercel build: root `client`, set `VITE_API_URL=https://YOUR-API.onrender.com`.
- Render: `CLIENT_ORIGIN=https://YOUR-APP.vercel.app`.

## What I cannot do from your PC alone

Deploying needs **your** GitHub + Render (or similar) login in a browser. This repo includes `render.yaml` so setup is a few clicks after the code is on GitHub.