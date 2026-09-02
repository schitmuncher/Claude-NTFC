const path = require("node:path");
const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const cors = require("cors");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const HOST = "0.0.0.0";
const publicDir = path.join(__dirname, "public");
const indexFile = path.join(publicDir, "index.html");

const sources = {
  table: "https://www.footballwebpages.co.uk/nantwich-town/league-table",
  fixtures: "https://www.footballwebpages.co.uk/nantwich-town/fixtures-results",
  squad: "https://www.footballwebpages.co.uk/nantwich-town/appearances",
  live: "https://www.thenpl.co.uk/live",
};

const requestConfig = {
  timeout: 20000,
  headers: {
    Accept: "text/html,application/xhtml+xml",
    "User-Agent":
      "Mozilla/5.0 (compatible; NantwichTownFootballApp/1.0; +https://www.footballwebpages.co.uk/)",
  },
};

app.use(cors());
app.use(express.json());
app.use(express.static(publicDir));

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

async function fetchHtml(url) {
  const response = await axios.get(url, requestConfig);
  return response.data;
}

function scrapeError(res, endpoint, error) {
  console.error(`[${endpoint}] scrape failed`, error?.message || error);
  return res.status(500).json({
    error: "Unable to scrape football data",
    endpoint,
  });
}

// -----------------------------------------------------------------------
// In-memory cache with stale fallback.
// Keeps Render's free tier from re-scraping on every page load, and — if
// footballwebpages.co.uk or thenpl.co.uk are ever briefly down or block a
// request — serves the last good copy instead of an error screen.
// -----------------------------------------------------------------------
const cache = new Map();

async function withCache(key, ttlMs, fetcher) {
  const now = Date.now();
  const cached = cache.get(key);

  if (cached && now - cached.time < ttlMs) {
    return cached.data;
  }

  try {
    const data = await fetcher();
    cache.set(key, { data, time: now });
    return data;
  } catch (error) {
    if (cached) {
      console.warn(`[${key}] live scrape failed, serving cached copy from ${new Date(cached.time).toISOString()}`);
      return cached.data;
    }
    throw error;
  }
}

// -----------------------------------------------------------------------
// GET /api/table
// -----------------------------------------------------------------------
function parseTable(html) {
  const $ = cheerio.load(html);
  const table = $("table")
    .filter((_index, element) =>
      $(element)
        .find("tr")
        .toArray()
        .some((row) => $(row).find("td").length >= 15),
    )
    .first();
  const rows = [];

  table.find("tr").each((_index, element) => {
    const cells = $(element).find("td");
    if (cells.length < 15) return;

    const hasBadgeColumn = cells.first().find("img").length > 0;
    const offset = hasBadgeColumn ? 1 : 0;
    const playedIndex = hasBadgeColumn ? 11 : 2;
    const goalDifferenceIndex = hasBadgeColumn ? 17 : 14;
    const pointsIndex = hasBadgeColumn ? 18 : 15;

    let position = cleanText($(cells.eq(offset)).text());
    let team = cleanText($(cells.eq(offset + 1)).text());
    let played = cleanText($(cells.eq(playedIndex)).text());
    let goalDifference = cleanText($(cells.eq(goalDifferenceIndex)).text());
    let points = cleanText($(cells.eq(pointsIndex)).text());

    // Defensive fallback: if the fixed offsets didn't land on a sensible
    // team name (site layout changed), re-derive from the end of the row
    // instead — Pts / +/- / F / A are reliably the last four columns.
    if (!team || Number.isNaN(Number(points))) {
      const cellArr = cells.toArray().map((c) => cleanText($(c).text()));
      const linkCell = cells.toArray().find((c) => $(c).find("a").text().trim());
      team = linkCell ? cleanText($(linkCell).find("a").text()) : team;
      points = cellArr[cellArr.length - 1] || points;
      goalDifference = cellArr[cellArr.length - 3] || goalDifference;
      played = cellArr[cellArr.length - 8] || played;
    }

    if (!team) return;
    rows.push({ position, team, played, goalDifference, points });
  });

  return rows;
}

app.get("/api/table", async (req, res) => {
  try {
    const rows = await withCache("table", 60_000, async () => parseTable(await fetchHtml(sources.table)));
    return res.json(rows);
  } catch (error) {
    return scrapeError(res, "table", error);
  }
});

// -----------------------------------------------------------------------
// GET /api/fixtures
// -----------------------------------------------------------------------
function parseFixtures(html) {
  const $ = cheerio.load(html);
  const fixtures = [];

  $("table")
    .first()
    .find("tr")
    .each((_index, element) => {
      const cells = $(element).find("td");
      if (cells.length < 5) return;
      const date = cleanText($(cells.eq(0)).text());
      const venue = cleanText($(cells.eq(1)).text());
      if (!date || (venue !== "H" && venue !== "A")) return;

      fixtures.push({
        date,
        venue,
        opponent: cleanText($(cells.eq(2)).text()),
        competition: cleanText($(cells.eq(3)).text()),
        scoreOrStatus: cleanText($(cells.eq(4)).text()),
      });
    });

  return fixtures;
}

app.get("/api/fixtures", async (req, res) => {
  try {
    const fixtures = await withCache("fixtures", 60_000, async () =>
      parseFixtures(await fetchHtml(sources.fixtures)),
    );
    return res.json(fixtures);
  } catch (error) {
    return scrapeError(res, "fixtures", error);
  }
});

// -----------------------------------------------------------------------
// GET /api/squad — walks every page of the appearances list, no slicing
// -----------------------------------------------------------------------
function parsePlayersPage(html) {
  const $ = cheerio.load(html);
  const players = [];
  const table = $("table")
    .filter((_index, element) =>
      $(element)
        .find("tr")
        .toArray()
        .some((row) => $(row).find("td").length >= 2),
    )
    .first();

  table.find("tr").each((_index, element) => {
    const cells = $(element).find("td");
    if (cells.length < 2) return;
    const name = cleanText($(cells.eq(1)).text());
    if (!name) return;
    players.push({
      name,
      appearances: cleanText($(cells.eq(2)).text()) || "0",
    });
  });

  let maxPage = 1;
  $('a[href*="page="]').each((_index, a) => {
    const href = $(a).attr("href") || "";
    const match = href.match(/page=(\d+)/);
    if (match) maxPage = Math.max(maxPage, Number(match[1]));
  });

  return { players, maxPage };
}

async function scrapeFullSquad() {
  const firstHtml = await fetchHtml(sources.squad);
  const { players: firstPagePlayers, maxPage } = parsePlayersPage(firstHtml);
  let players = firstPagePlayers;

  const hardCeiling = 50; // safety valve only, not a real limit on squad size
  const pagesToFetch = Math.min(maxPage, hardCeiling);

  for (let page = 2; page <= pagesToFetch; page += 1) {
    try {
      const pageHtml = await fetchHtml(`${sources.squad}?page=${page}`);
      players = players.concat(parsePlayersPage(pageHtml).players);
    } catch (error) {
      console.warn(`[squad] failed to load page ${page}, keeping players gathered so far`);
      break;
    }
  }

  const seen = new Set();
  return players.filter((player) => {
    const key = `${player.name}-${player.appearances}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

app.get("/api/squad", async (req, res) => {
  try {
    const players = await withCache("squad", 300_000, scrapeFullSquad);
    return res.json({
      management: {
        manager: "Luke Goddard",
        assistants: ["Jack Turner", "Marc Feighery"],
      },
      players,
    });
  } catch (error) {
    return scrapeError(res, "squad", error);
  }
});

// -----------------------------------------------------------------------
// GET /api/live
// -----------------------------------------------------------------------
function firstText(container, selectors) {
  for (const selector of selectors) {
    const value = cleanText(container.find(selector).first().text());
    if (value) return value;
  }
  return "";
}

function parseLiveMatch($, container) {
  const homeTeam = firstText(container, [
    '[class*="home"] [class*="team"]',
    '[class*="home"] [class*="name"]',
    '[data-team="home"]',
  ]);
  const awayTeam = firstText(container, [
    '[class*="away"] [class*="team"]',
    '[class*="away"] [class*="name"]',
    '[data-team="away"]',
  ]);
  const score = firstText(container, ['[class*="score"]', '[class*="result"]', "[data-score]"]);
  const status = firstText(container, [
    '[class*="status"]',
    '[class*="minute"]',
    '[class*="state"]',
    "[data-status]",
  ]);

  if (!homeTeam && !awayTeam && !score && !status) return null;
  return { homeTeam, awayTeam, score, status };
}

function parseLive(html) {
  const $ = cheerio.load(html);
  const matches = [];
  const seen = new Set();
  const selectors = [
    '[class*="live-match"]',
    '[class*="match-container"]',
    '[class*="match-card"]',
    '[class*="fixture-card"]',
    "[data-match-id]",
  ];

  $(selectors.join(",")).each((_index, element) => {
    const match = parseLiveMatch($, $(element));
    if (!match) return;
    const key = JSON.stringify(match);
    if (seen.has(key)) return;
    seen.add(key);
    matches.push(match);
  });

  return matches;
}

app.get("/api/live", async (req, res) => {
  try {
    // Short TTL — live scores should feel close to real-time on matchday
    const matches = await withCache("live", 20_000, async () => parseLive(await fetchHtml(sources.live)));
    return res.json(matches);
  } catch (error) {
    return scrapeError(res, "live", error);
  }
});

app.get(["/", "/favicon.ico"], (req, res) => {
  if (req.path === "/favicon.ico") return res.status(204).end();
  return res.sendFile(indexFile);
});

app.listen(PORT, HOST, () => {
  console.info(`Nantwich Town FC app listening on http://${HOST}:${PORT}`);
});
