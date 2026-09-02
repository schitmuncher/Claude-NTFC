# Nantwich Town FC — The Dabbers Matchday App

A mobile-first matchday companion for Nantwich Town FC. Live scores, league
table, fixtures/results and squad — all scraped live from Football Web Pages
and the Northern Premier League site. No database, no paid APIs, no
Replit-only features — just a plain Node/Express app that runs anywhere.

## What's in here

- `server.js` — Express server with four scraping endpoints
  (`/api/table`, `/api/fixtures`, `/api/squad`, `/api/live`), each with a
  60-second in-memory cache (5 minutes for squad) and a stale-data fallback
  so a single failed scrape doesn't break the app.
- `public/index.html` + `public/app.js` — the whole front end, plain HTML/JS,
  no build step required.
- `render.yaml` — one-click Render Blueprint config.

## Deploy — GitHub + Render (free tier)

1. **Push this folder to a new GitHub repo.**
   ```bash
   git init
   git add .
   git commit -m "Nantwich Town FC dabbers app"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```

2. **Create the Render service.**
   - Go to [render.com](https://render.com) → New → **Blueprint**
   - Connect your GitHub account and pick this repo
   - Render will read `render.yaml` automatically and set everything up:
     Build command `npm install`, start command `npm start`, **Free** plan.
   - Click **Apply** / **Create**.

   If you'd rather set it up manually instead of using the blueprint:
   - New → **Web Service** → connect the repo
   - Runtime: **Node**
   - Build command: `npm install`
   - Start command: `npm start`
   - Plan: **Free**

3. **Wait for the first deploy** (a couple of minutes), then open the
   `.onrender.com` URL Render gives you. That's it — no environment
   variables, no database, no keys to paste in anywhere.

### A note on Render's free tier

Free web services on Render spin down after ~15 minutes of no traffic and
take 30–60 seconds to wake back up on the next request. That's fine for a
fan app — the first load after a quiet spell will just be a bit slower.

## Running it locally

```bash
npm install
npm start
```

Then open `http://localhost:3000`.

## If Football Web Pages or the NPL site change their layout

The scrapers use `cheerio` to read the live HTML of:
- `footballwebpages.co.uk/nantwich-town/league-table`
- `footballwebpages.co.uk/nantwich-town/fixtures-results`
- `footballwebpages.co.uk/nantwich-town/appearances`
- `thenpl.co.uk/live`

If any of those sites redesign their pages, the matching endpoint may start
returning empty data — the app itself won't crash (it'll show the "No data
available" / "Try again" state), but you'd need to update the selectors in
`server.js` to match the new markup.
