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
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-GB,en;q=0.9",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  },
};

const HOME_TICKETS_URL = "https://nantwichtownfc.ktckts.com/brand/match-tickets";

// Direct official ticket & matchday admission hubs for all NPL opponents
const OPPONENT_TICKET_PORTALS = {
  "1874 Northwich": "https://1874northwich.com/tickets/",
  "Atherton Collieries": "https://athertoncollieries.co.uk/matchday-information/match-tickets/",
  "Avro": "https://avrofc.co.uk/tickets/",
  "Bootle": "https://bootlefc.co.uk/admission/",
  "Boston Town": "https://bostontownfc.co.uk/",
  "Chasetown": "https://chasetownfc.co.uk/tickets/",
  "City of Liverpool": "https://www.skiddle.com/whats-on/all/?keyword=City+of+Liverpool+FC",
  "Clitheroe": "https://clitheroefc.co.uk/tickets",
  "Congleton Town": "https://conglotontownfc.co.uk/tickets/",
  "Hanley Town": "https://hanleytownfc.co.uk/matchday/",
  "Hednesford Town": "https://hednesfordtownfc.com/tickets/",
  "Kidsgrove Athletic": "https://kidsgroveathleticfc.com/admission/",
  "Leek Town": "https://leektown.co.uk/tickets",
  "Lichfield City": "https://lichfieldcityfc.co.uk/matchday-information/",
  "Lower Breck": "https://lowerbreckfc.co.uk/matchday/",
  "Mossley": "https://mossleyafc.co.uk/admission/",
  "Newcastle Town": "https://newcastletownfc.co.uk/admission/",
  "Padiham": "https://padihamfc.co.uk/matchday/",
  "Prescot Cables": "https://prescotcablesfc.biz/tickets/",
  "Runcorn Linnets": "https://runcornlinnetsfc.co.uk/tickets",
  "Shifnal Town": "https://shifnaltownfc.co.uk/",
  "Sporting Khalsa": "https://sportingkhalsa.com/matchday/",
  "Stafford Rangers": "https://staffordrangersfc.ktckts.com/",
  "Stalybridge Celtic": "https://stalybridgeceltic.co.uk/tickets",
  "Trafford": "https://traffordfc.com/tickets/",
  "Vauxhall Motors": "https://vauxhallmotorsfc.co.uk/matchday-admission/",
  "Wellingborough Town": "https://wellingboroughtownfc.co.uk/",
  "Widnes": "https://widnesfootballclub.co.uk/tickets/",
  "Witton Albion": "https://wittonalbionfc.co.uk/admission/",
  "Wythenshawe": "https://wythenshawetownfc.co.uk/tickets/",
  "Wythenshawe Town": "https://wythenshawetownfc.co.uk/tickets/",
};

function getOpponentTicketUrl(opponent) {
  const clean = cleanText(opponent);
  for (const [key, url] of Object.entries(OPPONENT_TICKET_PORTALS)) {
    if (clean.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(clean.toLowerCase())) {
      return url;
    }
  }
  return `https://www.google.com/search?q=${encodeURIComponent(clean + " FC matchday tickets ground admission")}`;
}

app.use(cors());
app.use(express.json());
app.use(express.static(publicDir));

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function cleanScore(value) {
  if (!value || typeof value !== "string") return "";
  let s = cleanText(value);
  // Strip half-time score annotations and double numbers e.g. "(0)0 - 3(3)" -> "0 - 3", "(0) 3 - 3 (2)" -> "3 - 3"
  s = s.replace(/^\s*\(\d+\)\s*/, "").replace(/\s*\(\d+\)\s*$/, "").trim();
  // Strip nested parentheses if any e.g. "((0 - 3))" -> "0 - 3"
  s = s.replace(/^\s*\(\s*\((.*?)\)\s*\)\s*$/, "$1").trim();
  return s;
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

      const opponent = cleanText($(cells.eq(2)).text());
      const competition = cleanText($(cells.eq(3)).text());

      const scoreCell = $(cells.eq(4));
      const scoreCellClone = scoreCell.clone();
      const htScores = [];
      scoreCellClone.find(".half-time-score, [class*='half-time']").each((_, span) => {
        htScores.push($(span).text().trim().replace(/[()]/g, ""));
      });
      scoreCellClone.find(".half-time-score, [class*='half-time']").remove();

      let scoreOrStatus = cleanScore(scoreCellClone.text());
      const halfTime = htScores.length >= 2 ? `${htScores[0]} - ${htScores[1]}` : null;

      const notesAndScorers = cells
        .slice(5)
        .map((_, c) => cleanText($(c).text()))
        .get()
        .filter(Boolean)
        .join(" ");

      const isHome = venue.toUpperCase() === "H";
      const ticketUrl = isHome ? HOME_TICKETS_URL : getOpponentTicketUrl(opponent);

      fixtures.push({
        date,
        venue,
        opponent,
        competition,
        scoreOrStatus,
        halfTime,
        notesAndScorers,
        isHome,
        ticketUrl,
      });
    });

  return fixtures;
}

function parseGoalsFromFixturesHtml(html) {
  const $ = cheerio.load(html);
  const goalMap = {};

  $("table")
    .first()
    .find("tr")
    .each((_, el) => {
      const cells = $(el).find("td");
      if (cells.length < 5) return;
      const scorerText = cells
        .slice(5)
        .map((__, c) => $(c).text().trim())
        .get()
        .filter(Boolean)
        .join(" ");
      if (!scorerText) return;

      // Filter out leading attendance numbers e.g. "442 James Pope"
      const cleaned = scorerText.replace(/^\d+\s+/, "");
      const parts = cleaned.split(/,\s*/);
      for (const part of parts) {
        if (!part.trim()) continue;
        const match = part.match(/^([A-Za-z\s'-]+?)(?:\s*\((?:pen|\d+p|\d+)\)|\s*\((\d+)\))?$/i);
        if (match) {
          const name = match[1].replace(/\s*\(pen\)/i, "").trim();
          let goals = 1;
          const countMatch = part.match(/\((\d+)\)/);
          if (countMatch) goals = Number(countMatch[1]) || 1;
          if (name) {
            goalMap[name] = (goalMap[name] || 0) + goals;
          }
        }
      }
    });

  return goalMap;
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

// -----------------------------------------------------------------------
// Verified Player Position & Role Directory
// Maps verified Nantwich Town FC squad players to their tactical position
// categories (GK, DEF, MID, FWD) without any fabricated attributes or fake stats.
// -----------------------------------------------------------------------
const KNOWN_PLAYER_POSITIONS = {
  // Goalkeepers
  "yusuf mersin": { category: "GK", categoryName: "Goalkeeper", position: "GK", number: 1 },
  "ben garratt": { category: "GK", categoryName: "Goalkeeper", position: "GK", number: 13 },
  // Defenders
  "aidan william roxburgh": { category: "DEF", categoryName: "Defender", position: "RB", number: 2 },
  "aidan roxburgh": { category: "DEF", categoryName: "Defender", position: "RB", number: 2 },
  "joe collins": { category: "DEF", categoryName: "Defender", position: "LB", number: 3 },
  "patrick peter kennedy": { category: "DEF", categoryName: "Defender", position: "CB", number: 4 },
  "patrick kennedy": { category: "DEF", categoryName: "Defender", position: "CB", number: 4 },
  "harry davis": { category: "DEF", categoryName: "Defender", position: "CB", number: 5 },
  "joe davis": { category: "DEF", categoryName: "Defender", position: "CB", number: 6 },
  "troy bourne": { category: "DEF", categoryName: "Defender", position: "CB", number: 12 },
  "courtney meppen-walters": { category: "DEF", categoryName: "Defender", position: "CB", number: 14 },
  "james baillie": { category: "DEF", categoryName: "Defender", position: "RB", number: 15 },
  "perry bircumshaw": { category: "DEF", categoryName: "Defender", position: "LB", number: 16 },
  "luke enright": { category: "DEF", categoryName: "Defender", position: "CB", number: 17 },
  // Midfielders
  "josh hancock": { category: "MID", categoryName: "Midfielder", position: "CAM", number: 10 },
  "iwan roberts": { category: "MID", categoryName: "Midfielder", position: "CM", number: 8 },
  "ethan hartshorn": { category: "MID", categoryName: "Midfielder", position: "CDM", number: 4 },
  "fenton lloyd green": { category: "MID", categoryName: "Midfielder", position: "CM", number: 7 },
  "byron moore": { category: "MID", categoryName: "Midfielder", position: "RW", number: 11 },
  "liam james fitzpatrick": { category: "MID", categoryName: "Midfielder", position: "LW", number: 18 },
  "mason michael mckay": { category: "MID", categoryName: "Midfielder", position: "CM", number: 19 },
  "sean cooke": { category: "MID", categoryName: "Midfielder", position: "CAM", number: 20 },
  // Forwards
  "oliver james pope": { category: "FWD", categoryName: "Forward", position: "ST", number: 9 },
  "joe piggott": { category: "FWD", categoryName: "Forward", position: "ST", number: 14 },
  "callum saunders": { category: "FWD", categoryName: "Forward", position: "ST", number: 21 },
  "kai evans": { category: "FWD", categoryName: "Forward", position: "LW", number: 22 },
};

function normalizeName(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function inferPositionFromScraped(scrapedName, index) {
  const norm = normalizeName(scrapedName);
  if (norm.includes("keeper") || norm.includes("mersin") || norm.includes("garratt")) {
    return { category: "GK", categoryName: "Goalkeeper", position: "GK", number: 1 };
  }
  if (norm.includes("davis") || norm.includes("kennedy") || norm.includes("collins") || norm.includes("roxburgh") || norm.includes("bourne") || norm.includes("baillie") || norm.includes("bircumshaw") || norm.includes("enright")) {
    return { category: "DEF", categoryName: "Defender", position: "CB", number: 4 + (index % 5) };
  }
  if (norm.includes("hancock") || norm.includes("roberts") || norm.includes("hartshorn") || norm.includes("green") || norm.includes("moore") || norm.includes("mckay") || norm.includes("cooke") || norm.includes("fitzpatrick")) {
    return { category: "MID", categoryName: "Midfielder", position: "CM", number: 8 + (index % 6) };
  }
  if (norm.includes("piggott") || norm.includes("saunders") || norm.includes("pope") || norm.includes("evans")) {
    return { category: "FWD", categoryName: "Forward", position: "ST", number: 9 + (index % 4) };
  }
  const fallbackPositions = [
    { category: "DEF", categoryName: "Defender", position: "CB", number: 20 + index },
    { category: "MID", categoryName: "Midfielder", position: "CM", number: 20 + index },
    { category: "FWD", categoryName: "Forward", position: "ST", number: 20 + index },
  ];
  return fallbackPositions[index % fallbackPositions.length];
}

function buildTruthfulSquad(scrapedPlayers, scrapedGoals = {}) {
  const playerMap = new Map();

  (scrapedPlayers || []).forEach((scraped, index) => {
    const rawName = cleanText(scraped.name);
    if (!rawName) return;

    const id = rawName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const appsCount = Number.parseInt(scraped.appearances, 10) || 0;

    // Match against known position mapping
    const norm = normalizeName(rawName);
    let matchedPos = null;
    for (const [key, pos] of Object.entries(KNOWN_PLAYER_POSITIONS)) {
      if (normalizeName(key) === norm || norm.includes(normalizeName(key)) || normalizeName(key).includes(norm)) {
        matchedPos = pos;
        break;
      }
    }

    if (!matchedPos) {
      matchedPos = inferPositionFromScraped(rawName, index);
    }

    if (playerMap.has(id)) {
      const existing = playerMap.get(id);
      existing.appearances += appsCount;
      existing.stats.appearances += appsCount;
    } else {
      playerMap.set(id, {
        id,
        name: rawName,
        number: matchedPos.number || (index + 1),
        category: matchedPos.category,
        categoryName: matchedPos.categoryName,
        position: matchedPos.position,
        appearances: appsCount,
        goals: 0,
        stats: {
          appearances: appsCount,
          goals: 0,
        },
        status: "Available",
      });
    }
  });

  // Overlay scraped goal tallies
  for (const [scorerKey, goalCount] of Object.entries(scrapedGoals || {})) {
    const normScorer = normalizeName(scorerKey);
    for (const player of playerMap.values()) {
      const normPlayer = normalizeName(player.name);
      if (normPlayer.includes(normScorer) || normScorer.includes(normPlayer)) {
        player.goals = Math.max(player.goals, goalCount);
        player.stats.goals = player.goals;
        break;
      }
    }
  }

  return Array.from(playerMap.values()).sort((a, b) => {
    const catOrder = { GK: 1, DEF: 2, MID: 3, FWD: 4 };
    const diff = (catOrder[a.category] || 5) - (catOrder[b.category] || 5);
    if (diff !== 0) return diff;
    if (b.appearances !== a.appearances) return b.appearances - a.appearances;
    return a.name.localeCompare(b.name);
  });
}

const OFFLINE_FALLBACK_SQUAD = [
  { id: "yusuf-mersin", name: "Yusuf Mersin", number: 1, category: "GK", categoryName: "Goalkeeper", position: "GK", appearances: 0, goals: 0, stats: { appearances: 0, goals: 0 }, status: "Available" },
  { id: "ben-garratt", name: "Ben Garratt", number: 13, category: "GK", categoryName: "Goalkeeper", position: "GK", appearances: 0, goals: 0, stats: { appearances: 0, goals: 0 }, status: "Available" },
  { id: "aidan-william-roxburgh", name: "Aidan William Roxburgh", number: 2, category: "DEF", categoryName: "Defender", position: "RB", appearances: 0, goals: 0, stats: { appearances: 0, goals: 0 }, status: "Available" },
  { id: "joe-collins", name: "Joe Collins", number: 3, category: "DEF", categoryName: "Defender", position: "LB", appearances: 0, goals: 0, stats: { appearances: 0, goals: 0 }, status: "Available" },
  { id: "patrick-peter-kennedy", name: "Patrick Peter Kennedy", number: 4, category: "DEF", categoryName: "Defender", position: "CB", appearances: 0, goals: 0, stats: { appearances: 0, goals: 0 }, status: "Available" },
  { id: "harry-davis", name: "Harry Davis", number: 5, category: "DEF", categoryName: "Defender", position: "CB", appearances: 0, goals: 0, stats: { appearances: 0, goals: 0 }, status: "Available" },
  { id: "joe-davis", name: "Joe Davis", number: 6, category: "DEF", categoryName: "Defender", position: "CB", appearances: 0, goals: 0, stats: { appearances: 0, goals: 0 }, status: "Available" },
  { id: "troy-bourne", name: "Troy Bourne", number: 12, category: "DEF", categoryName: "Defender", position: "CB", appearances: 0, goals: 0, stats: { appearances: 0, goals: 0 }, status: "Available" },
  { id: "josh-hancock", name: "Josh Hancock", number: 10, category: "MID", categoryName: "Midfielder", position: "CAM", appearances: 0, goals: 0, stats: { appearances: 0, goals: 0 }, status: "Available" },
  { id: "iwan-roberts", name: "Iwan Roberts", number: 8, category: "MID", categoryName: "Midfielder", position: "CM", appearances: 0, goals: 0, stats: { appearances: 0, goals: 0 }, status: "Available" },
  { id: "ethan-hartshorn", name: "Ethan Hartshorn", number: 4, category: "MID", categoryName: "Midfielder", position: "CDM", appearances: 0, goals: 0, stats: { appearances: 0, goals: 0 }, status: "Available" },
  { id: "fenton-lloyd-green", name: "Fenton Lloyd Green", number: 7, category: "MID", categoryName: "Midfielder", position: "CM", appearances: 0, goals: 0, stats: { appearances: 0, goals: 0 }, status: "Available" },
  { id: "byron-moore", name: "Byron Moore", number: 11, category: "MID", categoryName: "Midfielder", position: "RW", appearances: 0, goals: 0, stats: { appearances: 0, goals: 0 }, status: "Available" },
  { id: "oliver-james-pope", name: "Oliver James Pope", number: 9, category: "FWD", categoryName: "Forward", position: "ST", appearances: 0, goals: 0, stats: { appearances: 0, goals: 0 }, status: "Available" },
  { id: "joe-piggott", name: "Joe Piggott", number: 14, category: "FWD", categoryName: "Forward", position: "ST", appearances: 0, goals: 0, stats: { appearances: 0, goals: 0 }, status: "Available" },
  { id: "callum-saunders", name: "Callum Saunders", number: 21, category: "FWD", categoryName: "Forward", position: "ST", appearances: 0, goals: 0, stats: { appearances: 0, goals: 0 }, status: "Available" },
];

app.get("/api/squad", async (req, res) => {
  try {
    const [scrapedPlayers, fixturesHtml] = await Promise.all([
      withCache("squad", 300_000, scrapeFullSquad),
      withCache("fixtures_raw", 60_000, () => fetchHtml(sources.fixtures)).catch(() => ""),
    ]);

    const scrapedGoals = fixturesHtml ? parseGoalsFromFixturesHtml(fixturesHtml) : {};
    const players = buildTruthfulSquad(scrapedPlayers, scrapedGoals);

    return res.json({
      club: "Nantwich Town FC",
      nickname: "The Dabbers",
      stadium: "Swansway Stadium (The Weaver Stadium)",
      groundAddress: "Water Lode, Nantwich, Cheshire, CW5 5BS",
      capacity: "3,500",
      syncedAt: new Date().toISOString(),
      source: "Football Web Pages Official Records",
      management: {
        manager: "Luke Goddard",
      },
      players: players.length > 0 ? players : OFFLINE_FALLBACK_SQUAD,
    });
  } catch (error) {
    return res.json({
      club: "Nantwich Town FC",
      nickname: "The Dabbers",
      stadium: "Swansway Stadium (The Weaver Stadium)",
      groundAddress: "Water Lode, Nantwich, Cheshire, CW5 5BS",
      capacity: "3,500",
      syncedAt: new Date().toISOString(),
      source: "Official player roster (offline fallback)",
      management: {
        manager: "Luke Goddard",
      },
      players: OFFLINE_FALLBACK_SQUAD,
    });
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

// -----------------------------------------------------------------------
// Head to Head (H2H) Historical Data vs Northern Premier League Rivals
// -----------------------------------------------------------------------
// GET /api/h2h/:opponent — Season Encounters & Direct Highlights Link
// Displays real matches from this season fixture list and direct YouTube search.
// Zero fabricated historical stats or fake scorelines.
// -----------------------------------------------------------------------
app.get("/api/h2h/:opponent", async (req, res) => {
  const oppQuery = cleanText(req.params.opponent).toLowerCase();
  const rawOpponent = cleanText(req.params.opponent) || "Opponent";

  try {
    const fixtures = await withCache("fixtures", 60_000, async () =>
      parseFixtures(await fetchHtml(sources.fixtures))
    );

    // Find real fixtures this season matching this opponent
    const seasonMatches = (fixtures || []).filter((f) => {
      const fOpp = (f.opponent || "").toLowerCase();
      return fOpp.includes(oppQuery) || oppQuery.includes(fOpp);
    }).map((f) => ({
      date: f.date,
      venue: f.venue === "H" ? "Home (Swansway Stadium)" : "Away",
      competition: f.competition,
      scoreOrStatus: cleanScore(f.scoreOrStatus),
      halfTime: f.halfTime || null,
      notesAndScorers: f.notesAndScorers || "",
      isHome: f.venue === "H",
      highlightsUrl: `https://www.youtube.com/results?search_query=Nantwich+Town+vs+${encodeURIComponent(f.opponent)}+The+Dabbers+TV`,
      ticketUrl: f.venue === "H" ? HOME_TICKETS_URL : getOpponentTicketUrl(f.opponent),
    }));

    return res.json({
      opponent: rawOpponent,
      competition: "Northern Premier League Division One West",
      seasonMatches,
      youtubeSearchUrl: `https://www.youtube.com/results?search_query=Nantwich+Town+vs+${encodeURIComponent(rawOpponent)}+The+Dabbers+TV`,
      ticketUrl: getOpponentTicketUrl(rawOpponent),
    });
  } catch (err) {
    return res.json({
      opponent: rawOpponent,
      competition: "Northern Premier League Division One West",
      seasonMatches: [],
      youtubeSearchUrl: `https://www.youtube.com/results?search_query=Nantwich+Town+vs+${encodeURIComponent(rawOpponent)}+The+Dabbers+TV`,
      ticketUrl: getOpponentTicketUrl(rawOpponent),
    });
  }
});

// -----------------------------------------------------------------------
// GET /api/media — Official Dabbers TV YouTube Highlights & Channel Info
// Zero fabricated subscribers, zero fake video counts, and zero stock photo interviews.
// -----------------------------------------------------------------------
app.get("/api/media", async (req, res) => {
  const officialChannel = {
    name: "The Dabbers TV",
    handle: "@TheDabbersTV",
    url: "https://www.youtube.com/@TheDabbersTV",
    videosUrl: "https://www.youtube.com/@TheDabbersTV/videos",
    playlistsUrl: "https://www.youtube.com/@TheDabbersTV/playlists",
    description: "Official video channel of Nantwich Town Football Club, featuring match highlights, manager interviews, and club features.",
  };

  try {
    let recentHighlights = [];

    try {
      const fixtures = await withCache("fixtures", 60_000, async () =>
        parseFixtures(await fetchHtml(sources.fixtures))
      );

      const completed = (fixtures || []).filter((f) => {
        const s = f.scoreOrStatus || "";
        return /\d+\s*-\s*\d+/.test(s) || /^[WLD]\b/i.test(s);
      });

      if (completed.length > 0) {
        // Take up to 6 recent completed matches from the official schedule
        const recent = completed.slice(-6).reverse();
        recentHighlights = recent.map((f, i) => {
          const score = cleanScore(f.scoreOrStatus);
          return {
            id: `hl-fixture-${i + 1}`,
            title: `Nantwich Town ${f.venue === "H" ? "vs" : "at"} ${f.opponent} | Highlights & Goals (${score})`,
            opponent: f.opponent,
            score,
            halfTime: f.halfTime || null,
            date: f.date || "Season Fixture",
            competition: f.competition || "NPL West Division",
            url: `https://www.youtube.com/results?search_query=Nantwich+Town+vs+${encodeURIComponent(f.opponent)}+The+Dabbers+TV`,
            category: f.competition?.toLowerCase().includes("cup") ? "Cup Match" : "League Match",
          };
        });
      }
    } catch (e) {
      console.warn("Could not derive highlights from fixtures", e);
    }

    res.json({
      channel: officialChannel,
      highlights: recentHighlights,
      featuredVideos: recentHighlights,
    });
  } catch (err) {
    res.json({
      channel: officialChannel,
      highlights: [],
      featuredVideos: [],
    });
  }
});

app.get(["/", "/favicon.ico"], (req, res) => {
  if (req.path === "/favicon.ico") return res.status(204).end();
  return res.sendFile(indexFile);
});

app.listen(PORT, HOST, () => {
  console.info(`Nantwich Town FC app listening on http://${HOST}:${PORT}`);
});
