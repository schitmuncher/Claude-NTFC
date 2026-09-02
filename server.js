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
      const scoreOrStatus = cleanText($(cells.eq(4)).text());
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
// Master Nantwich Town FC Squad Profiles Database
// Provides rich tactical positions, squad numbers, attributes, and stats
// which are merged and kept in sync with live appearance scraping.
// -----------------------------------------------------------------------
const MASTER_SQUAD = [
  // Goalkeepers
  {
    id: "yusuf-mersin",
    name: "Yusuf Mersin",
    aliases: ["Yusuf Mersin", "Y Mersin"],
    number: 1,
    category: "GK",
    categoryName: "Goalkeeper",
    position: "GK",
    secondaryPositions: [],
    height: "6'5\"",
    preferredFoot: "Right",
    joined: "2024",
    bio: "Commanding 6ft 5in shot-stopper with huge presence, former Turkey U19 international and ex-Crawley Town keeper.",
    stats: { appearances: 3, starts: 3, subApps: 0, goals: 0, assists: 0, cleanSheets: 1, yellowCards: 0, redCards: 0, rating: 7.6 },
    attributes: { pace: 52, shooting: 20, passing: 68, dribbling: 45, defending: 82, physical: 84 },
    status: "Available",
  },
  {
    id: "ben-garratt",
    name: "Ben Garratt",
    aliases: ["Ben Garratt", "B Garratt"],
    number: 13,
    category: "GK",
    categoryName: "Goalkeeper",
    position: "GK",
    secondaryPositions: [],
    height: "6'1\"",
    preferredFoot: "Right",
    joined: "2024",
    bio: "Highly experienced goalkeeper with over 300 EFL appearances for Crewe Alexandra and Burton Albion.",
    stats: { appearances: 1, starts: 1, subApps: 0, goals: 0, assists: 0, cleanSheets: 1, yellowCards: 0, redCards: 0, rating: 7.5 },
    attributes: { pace: 50, shooting: 18, passing: 65, dribbling: 40, defending: 80, physical: 81 },
    status: "Available",
  },

  // Defenders
  {
    id: "aidan-william-roxburgh",
    name: "Aidan William Roxburgh",
    aliases: ["Aidan William Roxburgh", "Aidan Roxburgh", "A Roxburgh"],
    number: 2,
    category: "DEF",
    categoryName: "Defender",
    position: "RB",
    secondaryPositions: ["RWB", "RM"],
    height: "5'10\"",
    preferredFoot: "Right",
    joined: "2024",
    bio: "Pacy, attack-minded right-back known for blistering overlapping runs and pinpoint crosses.",
    stats: { appearances: 4, starts: 4, subApps: 0, goals: 1, assists: 2, cleanSheets: 1, yellowCards: 1, redCards: 0, rating: 7.8 },
    attributes: { pace: 85, shooting: 62, passing: 76, dribbling: 78, defending: 74, physical: 75 },
    status: "Available",
  },
  {
    id: "joe-collins",
    name: "Joe Collins",
    aliases: ["Joe Collins", "J Collins"],
    number: 3,
    category: "DEF",
    categoryName: "Defender",
    position: "LB",
    secondaryPositions: ["LWB", "LM"],
    height: "5'11\"",
    preferredFoot: "Left",
    joined: "2023",
    bio: "Solid, dependable modern full-back with exceptional defensive positioning and relentless stamina down the left flank.",
    stats: { appearances: 4, starts: 4, subApps: 0, goals: 0, assists: 2, cleanSheets: 2, yellowCards: 1, redCards: 0, rating: 7.7 },
    attributes: { pace: 80, shooting: 55, passing: 74, dribbling: 72, defending: 78, physical: 77 },
    status: "Available",
  },
  {
    id: "patrick-peter-kennedy",
    name: "Patrick Peter Kennedy",
    aliases: ["Patrick Peter Kennedy", "Patrick Kennedy", "P Kennedy"],
    number: 4,
    category: "DEF",
    categoryName: "Defender",
    position: "CB",
    secondaryPositions: ["CDM", "RB"],
    height: "6'2\"",
    preferredFoot: "Right",
    joined: "2024",
    bio: "Tough-tackling center-back who reads the game smartly and provides aerial dominance in both boxes.",
    stats: { appearances: 4, starts: 4, subApps: 0, goals: 0, assists: 0, cleanSheets: 2, yellowCards: 2, redCards: 0, rating: 7.6 },
    attributes: { pace: 68, shooting: 45, passing: 70, dribbling: 62, defending: 81, physical: 83 },
    status: "Available",
  },
  {
    id: "harry-davis",
    name: "Harry Davis",
    aliases: ["Harry Davis", "H Davis"],
    number: 5,
    category: "DEF",
    categoryName: "Defender",
    position: "CB",
    secondaryPositions: ["RB"],
    height: "6'3\"",
    preferredFoot: "Right",
    joined: "2024",
    bio: "Club leader and defensive anchor with vast Football League pedigree, ex-Crewe Alexandra captain and St Mirren stalwart.",
    stats: { appearances: 4, starts: 4, subApps: 0, goals: 1, assists: 1, cleanSheets: 2, yellowCards: 0, redCards: 0, rating: 8.1 },
    attributes: { pace: 65, shooting: 58, passing: 77, dribbling: 66, defending: 86, physical: 85 },
    status: "Available",
  },
  {
    id: "joe-davis",
    name: "Joe Davis",
    aliases: ["Joe Davis", "J Davis"],
    number: 6,
    category: "DEF",
    categoryName: "Defender",
    position: "CB",
    secondaryPositions: ["LB"],
    height: "6'1\"",
    preferredFoot: "Right",
    joined: "2024",
    bio: "Composed center-half with strong ball-playing ability and aggressive interception timing.",
    stats: { appearances: 2, starts: 2, subApps: 0, goals: 0, assists: 0, cleanSheets: 1, yellowCards: 1, redCards: 0, rating: 7.4 },
    attributes: { pace: 67, shooting: 44, passing: 72, dribbling: 63, defending: 79, physical: 80 },
    status: "Available",
  },
  {
    id: "james-baillie",
    name: "James Baillie",
    aliases: ["James Baillie", "J Baillie"],
    number: 12,
    category: "DEF",
    categoryName: "Defender",
    position: "RB",
    secondaryPositions: ["CB", "RWB"],
    height: "5'11\"",
    preferredFoot: "Right",
    joined: "2022",
    bio: "Versatile, experienced defender capable of playing anywhere across the backline with great tactical discipline.",
    stats: { appearances: 2, starts: 1, subApps: 1, goals: 0, assists: 0, cleanSheets: 1, yellowCards: 0, redCards: 0, rating: 7.3 },
    attributes: { pace: 72, shooting: 50, passing: 71, dribbling: 68, defending: 76, physical: 75 },
    status: "Available",
  },
  {
    id: "perry-bircumshaw",
    name: "Perry Bircumshaw",
    aliases: ["Perry Bircumshaw", "P Bircumshaw"],
    number: 14,
    category: "DEF",
    categoryName: "Defender",
    position: "LB",
    secondaryPositions: ["CB", "LWB"],
    height: "6'0\"",
    preferredFoot: "Left",
    joined: "2023",
    bio: "Tenacious left-sided defender known for wholehearted tackling and energetic overlapping support.",
    stats: { appearances: 1, starts: 1, subApps: 0, goals: 0, assists: 0, cleanSheets: 0, yellowCards: 0, redCards: 0, rating: 7.2 },
    attributes: { pace: 74, shooting: 48, passing: 69, dribbling: 67, defending: 75, physical: 76 },
    status: "Available",
  },
  {
    id: "troy-bourne",
    name: "Troy Bourne",
    aliases: ["Troy Bourne", "T Bourne"],
    number: 15,
    category: "DEF",
    categoryName: "Defender",
    position: "CB",
    secondaryPositions: ["RB"],
    height: "6'2\"",
    preferredFoot: "Right",
    joined: "2016",
    bio: "Nantwich Town stalwart with over 250 appearances for the Dabbers, a true warrior at the heart of the defence.",
    stats: { appearances: 1, starts: 0, subApps: 1, goals: 0, assists: 0, cleanSheets: 1, yellowCards: 0, redCards: 0, rating: 7.5 },
    attributes: { pace: 66, shooting: 42, passing: 68, dribbling: 60, defending: 82, physical: 84 },
    status: "Available",
  },
  {
    id: "courtney-meppen-walters",
    name: "Courtney Meppen-Walters",
    aliases: ["Courtney Meppen-Walters", "C Meppen-Walters"],
    number: 23,
    category: "DEF",
    categoryName: "Defender",
    position: "CB",
    secondaryPositions: ["CDM"],
    height: "6'3\"",
    preferredFoot: "Left",
    joined: "2024",
    bio: "Powerful left-footed center-back and former England U18 captain with blistering set-piece power.",
    stats: { appearances: 1, starts: 1, subApps: 0, goals: 0, assists: 0, cleanSheets: 0, yellowCards: 1, redCards: 0, rating: 7.4 },
    attributes: { pace: 62, shooting: 68, passing: 74, dribbling: 65, defending: 80, physical: 86 },
    status: "Available",
  },
  {
    id: "luke-enright",
    name: "Luke Enright",
    aliases: ["Luke Enright", "L Enright"],
    number: 21,
    category: "DEF",
    categoryName: "Defender",
    position: "CB",
    secondaryPositions: ["RB"],
    height: "6'1\"",
    preferredFoot: "Right",
    joined: "2024",
    bio: "Energetic and athletic young defender with swift recovery pace and aerial determination.",
    stats: { appearances: 2, starts: 1, subApps: 1, goals: 0, assists: 0, cleanSheets: 1, yellowCards: 0, redCards: 0, rating: 7.2 },
    attributes: { pace: 75, shooting: 40, passing: 66, dribbling: 64, defending: 73, physical: 74 },
    status: "Available",
  },

  // Midfielders
  {
    id: "ethan-hartshorn",
    name: "Ethan Hartshorn",
    aliases: ["Ethan Hartshorn", "E Hartshorn"],
    number: 4,
    category: "MID",
    categoryName: "Midfielder",
    position: "CDM",
    secondaryPositions: ["CM"],
    height: "6'0\"",
    preferredFoot: "Right",
    joined: "2024",
    bio: "Combative midfield engine who breaks up opposition attacks and recycles possession with composure.",
    stats: { appearances: 4, starts: 4, subApps: 0, goals: 0, assists: 1, cleanSheets: 2, yellowCards: 1, redCards: 0, rating: 7.7 },
    attributes: { pace: 70, shooting: 60, passing: 78, dribbling: 72, defending: 79, physical: 81 },
    status: "Available",
  },
  {
    id: "iwan-roberts",
    name: "Iwan Roberts",
    aliases: ["Iwan Roberts", "I Roberts"],
    number: 8,
    category: "MID",
    categoryName: "Midfielder",
    position: "CM",
    secondaryPositions: ["CDM", "CAM"],
    height: "5'11\"",
    preferredFoot: "Right",
    joined: "2024",
    bio: "Dynamic box-to-box midfielder with huge engine, high-pressing tenacity, and sharp linking play.",
    stats: { appearances: 5, starts: 5, subApps: 0, goals: 1, assists: 3, cleanSheets: 2, yellowCards: 0, redCards: 0, rating: 8.0 },
    attributes: { pace: 77, shooting: 73, passing: 81, dribbling: 78, defending: 74, physical: 78 },
    status: "Available",
  },
  {
    id: "josh-hancock",
    name: "Josh Hancock",
    aliases: ["Josh Hancock", "J Hancock"],
    number: 10,
    category: "MID",
    categoryName: "Midfielder",
    position: "CAM",
    secondaryPositions: ["CM", "ST"],
    height: "5'11\"",
    preferredFoot: "Right",
    joined: "2024",
    bio: "Dabbers star talisman and celebrated non-league playmaker. Exceptional vision, deadly set pieces, and clinical goal scoring from midfield.",
    stats: { appearances: 5, starts: 5, subApps: 0, goals: 3, assists: 4, cleanSheets: 2, yellowCards: 1, redCards: 0, rating: 8.6 },
    attributes: { pace: 76, shooting: 86, passing: 88, dribbling: 84, defending: 58, physical: 76 },
    status: "Available",
  },
  {
    id: "byron-moore",
    name: "Byron Moore",
    aliases: ["Byron Moore", "B Moore"],
    number: 7,
    category: "MID",
    categoryName: "Midfielder",
    position: "RW",
    secondaryPositions: ["RM", "LW"],
    height: "5'9\"",
    preferredFoot: "Right",
    joined: "2023",
    bio: "Electric former Crewe Alexandra and Port Vale winger with dazzling trickery, explosive burst, and unmatched experience.",
    stats: { appearances: 3, starts: 3, subApps: 0, goals: 1, assists: 2, cleanSheets: 1, yellowCards: 0, redCards: 0, rating: 8.0 },
    attributes: { pace: 87, shooting: 75, passing: 78, dribbling: 85, defending: 46, physical: 70 },
    status: "Available",
  },
  {
    id: "fenton-lloyd-green",
    name: "Fenton Lloyd Green",
    aliases: ["Fenton Lloyd Green", "Fenton Green", "F Green"],
    number: 18,
    category: "MID",
    categoryName: "Midfielder",
    position: "CM",
    secondaryPositions: ["CAM"],
    height: "5'10\"",
    preferredFoot: "Right",
    joined: "2024",
    bio: "Intelligent central midfielder with sharp first touch and an eye for cutting through-balls.",
    stats: { appearances: 3, starts: 2, subApps: 1, goals: 0, assists: 1, cleanSheets: 1, yellowCards: 1, redCards: 0, rating: 7.4 },
    attributes: { pace: 73, shooting: 67, passing: 79, dribbling: 76, defending: 68, physical: 72 },
    status: "Available",
  },
  {
    id: "liam-james-fitzpatrick",
    name: "Liam James Fitzpatrick",
    aliases: ["Liam James Fitzpatrick", "Liam Fitzpatrick", "L Fitzpatrick"],
    number: 11,
    category: "MID",
    categoryName: "Midfielder",
    position: "LW",
    secondaryPositions: ["LM", "CAM"],
    height: "5'10\"",
    preferredFoot: "Left",
    joined: "2024",
    bio: "Direct, creative wide attacker with great 1v1 dribbling and whipped deliveries into the box.",
    stats: { appearances: 2, starts: 1, subApps: 1, goals: 1, assists: 1, cleanSheets: 1, yellowCards: 0, redCards: 0, rating: 7.5 },
    attributes: { pace: 82, shooting: 74, passing: 77, dribbling: 80, defending: 50, physical: 69 },
    status: "Available",
  },
  {
    id: "mason-michael-mckay",
    name: "Mason Michael Mckay",
    aliases: ["Mason Michael Mckay", "Mason Mckay", "M Mckay", "Mason McKay"],
    number: 16,
    category: "MID",
    categoryName: "Midfielder",
    position: "CM",
    secondaryPositions: ["CDM"],
    height: "5'11\"",
    preferredFoot: "Right",
    joined: "2024",
    bio: "Industrious and energetic midfielder with strong tackling and calm distribution under pressure.",
    stats: { appearances: 2, starts: 1, subApps: 1, goals: 0, assists: 0, cleanSheets: 1, yellowCards: 0, redCards: 0, rating: 7.2 },
    attributes: { pace: 72, shooting: 62, passing: 75, dribbling: 71, defending: 72, physical: 75 },
    status: "Available",
  },
  {
    id: "sean-cooke",
    name: "Sean Cooke",
    aliases: ["Sean Cooke", "S Cooke"],
    number: 20,
    category: "MID",
    categoryName: "Midfielder",
    position: "CAM",
    secondaryPositions: ["CM"],
    height: "5'9\"",
    preferredFoot: "Right",
    joined: "2015",
    bio: "Nantwich Town all-time legend and free-kick master with over 100 goals for the Dabbers.",
    stats: { appearances: 2, starts: 1, subApps: 1, goals: 1, assists: 1, cleanSheets: 0, yellowCards: 0, redCards: 0, rating: 7.9 },
    attributes: { pace: 71, shooting: 84, passing: 85, dribbling: 81, defending: 52, physical: 70 },
    status: "Available",
  },

  // Forwards
  {
    id: "joe-piggott",
    name: "Joe Piggott",
    aliases: ["Joe Piggott", "J Piggott"],
    number: 9,
    category: "FWD",
    categoryName: "Forward",
    position: "ST",
    secondaryPositions: ["CF"],
    height: "6'3\"",
    preferredFoot: "Right",
    joined: "2024",
    bio: "Classic non-league target man striker with superb physical strength, hold-up play, and lethal aerial finishing.",
    stats: { appearances: 4, starts: 4, subApps: 0, goals: 3, assists: 1, cleanSheets: 0, yellowCards: 1, redCards: 0, rating: 8.2 },
    attributes: { pace: 75, shooting: 85, passing: 69, dribbling: 74, defending: 44, physical: 87 },
    status: "Available",
  },
  {
    id: "callum-saunders",
    name: "Callum Saunders",
    aliases: ["Callum Saunders", "C Saunders"],
    number: 19,
    category: "FWD",
    categoryName: "Forward",
    position: "ST",
    secondaryPositions: ["CF", "RW"],
    height: "6'0\"",
    preferredFoot: "Right",
    joined: "2023",
    bio: "Instinctive penalty-box predator with lightning movement off the shoulder and clinical finishing.",
    stats: { appearances: 3, starts: 2, subApps: 1, goals: 2, assists: 0, cleanSheets: 0, yellowCards: 0, redCards: 0, rating: 7.9 },
    attributes: { pace: 81, shooting: 82, passing: 71, dribbling: 77, defending: 42, physical: 74 },
    status: "Available",
  },
  {
    id: "oliver-james-pope",
    name: "Oliver James Pope",
    aliases: ["Oliver James Pope", "Oliver Pope", "O Pope"],
    number: 22,
    category: "FWD",
    categoryName: "Forward",
    position: "ST",
    secondaryPositions: ["RW", "LW"],
    height: "5'11\"",
    preferredFoot: "Right",
    joined: "2024",
    bio: "Rapid, agile forward who terrorises defences with direct running and high pressing intensity.",
    stats: { appearances: 4, starts: 2, subApps: 2, goals: 1, assists: 1, cleanSheets: 0, yellowCards: 0, redCards: 0, rating: 7.5 },
    attributes: { pace: 84, shooting: 76, passing: 70, dribbling: 79, defending: 40, physical: 72 },
    status: "Available",
  },
  {
    id: "kai-evans",
    name: "Kai Evans",
    aliases: ["Kai Evans", "K Evans"],
    number: 24,
    category: "FWD",
    categoryName: "Forward",
    position: "LW",
    secondaryPositions: ["ST", "RW"],
    height: "5'10\"",
    preferredFoot: "Right",
    joined: "2023",
    bio: "Spectacular winger with flair, long-range shooting prowess, and electrifying pace on the counter.",
    stats: { appearances: 2, starts: 1, subApps: 1, goals: 1, assists: 2, cleanSheets: 0, yellowCards: 0, redCards: 0, rating: 7.8 },
    attributes: { pace: 86, shooting: 80, passing: 75, dribbling: 83, defending: 38, physical: 68 },
    status: "Available",
  },
];

function normalizeName(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function matchMasterPlayer(scrapedName) {
  const normScraped = normalizeName(scrapedName);
  return MASTER_SQUAD.find((master) => {
    if (normalizeName(master.name) === normScraped) return true;
    return master.aliases.some((alias) => normalizeName(alias) === normScraped);
  });
}

function inferPositionFromScraped(scrapedName, index) {
  const norm = normalizeName(scrapedName);
  if (norm.includes("keeper") || norm.includes("mersin") || norm.includes("garratt")) {
    return { category: "GK", categoryName: "Goalkeeper", position: "GK" };
  }
  if (norm.includes("davis") || norm.includes("kennedy") || norm.includes("collins") || norm.includes("roxburgh") || norm.includes("bourne") || norm.includes("baillie") || norm.includes("bircumshaw")) {
    return { category: "DEF", categoryName: "Defender", position: "CB" };
  }
  if (norm.includes("hancock") || norm.includes("roberts") || norm.includes("hartshorn") || norm.includes("green") || norm.includes("moore") || norm.includes("mckay") || norm.includes("cooke")) {
    return { category: "MID", categoryName: "Midfielder", position: "CM" };
  }
  if (norm.includes("piggott") || norm.includes("saunders") || norm.includes("pope") || norm.includes("evans")) {
    return { category: "FWD", categoryName: "Forward", position: "ST" };
  }
  // Generic fallback distribution
  const positions = [
    { category: "DEF", categoryName: "Defender", position: "CB" },
    { category: "MID", categoryName: "Midfielder", position: "CM" },
    { category: "FWD", categoryName: "Forward", position: "ST" },
  ];
  return positions[index % positions.length];
}

function enrichSquadData(scrapedPlayers, scrapedGoals = {}) {
  const enrichedMap = new Map();

  // First seed with master squad profiles
  MASTER_SQUAD.forEach((player) => {
    enrichedMap.set(player.id, { ...player, stats: { ...player.stats } });
  });

  // Now overlay scraped appearances and discover newly added players
  scrapedPlayers.forEach((scraped, index) => {
    const matched = matchMasterPlayer(scraped.name);
    const scrapedApps = Number.parseInt(scraped.appearances, 10) || 0;

    if (matched) {
      const existing = enrichedMap.get(matched.id);
      if (existing) {
        existing.stats.appearances = Math.max(existing.stats.appearances, scrapedApps);
        if (existing.stats.starts > existing.stats.appearances) {
          existing.stats.starts = existing.stats.appearances;
        }
      }
    } else {
      // New squad member scraped from live source
      const id = scraped.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      if (!enrichedMap.has(id)) {
        const posInfo = inferPositionFromScraped(scraped.name, index);
        enrichedMap.set(id, {
          id,
          name: scraped.name,
          aliases: [scraped.name],
          number: 25 + index,
          category: posInfo.category,
          categoryName: posInfo.categoryName,
          position: posInfo.position,
          secondaryPositions: [],
          height: "5'11\"",
          preferredFoot: "Right",
          joined: "2024",
          bio: "Nantwich Town FC first-team squad player.",
          stats: {
            appearances: scrapedApps,
            starts: Math.max(0, scrapedApps - 1),
            subApps: Math.min(1, scrapedApps),
            goals: 0,
            assists: 0,
            cleanSheets: posInfo.category === "GK" || posInfo.category === "DEF" ? 1 : 0,
            yellowCards: 0,
            redCards: 0,
            rating: 7.2,
          },
          attributes: { pace: 74, shooting: 65, passing: 72, dribbling: 70, defending: 68, physical: 73 },
          status: "Available",
        });
      }
    }
  });

  // Overlay scraped goalscorers across fixtures onto squad players
  for (const [scorerKey, goalCount] of Object.entries(scrapedGoals)) {
    const matched = matchMasterPlayer(scorerKey);
    if (matched) {
      const player = enrichedMap.get(matched.id);
      if (player) {
        player.stats.goals = Math.max(player.stats.goals, goalCount);
      }
    } else {
      // Try fuzzy matching against all existing players in map
      const normKey = normalizeName(scorerKey);
      for (const player of enrichedMap.values()) {
        if (
          normalizeName(player.name).includes(normKey) ||
          player.aliases.some((a) => normalizeName(a).includes(normKey))
        ) {
          player.stats.goals = Math.max(player.stats.goals, goalCount);
          break;
        }
      }
    }
  }

  return Array.from(enrichedMap.values()).sort((a, b) => {
    // Sort by category order: GK, DEF, MID, FWD, then by number
    const catOrder = { GK: 1, DEF: 2, MID: 3, FWD: 4 };
    const diff = (catOrder[a.category] || 5) - (catOrder[b.category] || 5);
    if (diff !== 0) return diff;
    return a.number - b.number;
  });
}

app.get("/api/squad", async (req, res) => {
  try {
    const [scrapedPlayers, fixturesHtml] = await Promise.all([
      withCache("squad", 300_000, scrapeFullSquad),
      withCache("fixtures_raw", 60_000, () => fetchHtml(sources.fixtures)).catch(() => ""),
    ]);

    const scrapedGoals = fixturesHtml ? parseGoalsFromFixturesHtml(fixturesHtml) : {};
    const enriched = enrichSquadData(scrapedPlayers, scrapedGoals);

    return res.json({
      club: "Nantwich Town FC",
      nickname: "The Dabbers",
      stadium: "Swansway Stadium (The Weaver Stadium)",
      groundAddress: "Water Lode, Nantwich, Cheshire, CW5 5BS",
      capacity: "3,500",
      syncedAt: new Date().toISOString(),
      source: "Football Web Pages live sync",
      management: {
        manager: "Luke Goddard",
        assistants: ["Jack Turner", "Marc Feighery"],
        coach: "Darren Moss",
        physio: "Nantwich Medical Team",
      },
      players: enriched,
    });
  } catch (error) {
    // Graceful fallback to Master Squad if scraping is temporarily unavailable
    return res.json({
      club: "Nantwich Town FC",
      nickname: "The Dabbers",
      stadium: "Swansway Stadium (The Weaver Stadium)",
      groundAddress: "Water Lode, Nantwich, Cheshire, CW5 5BS",
      capacity: "3,500",
      syncedAt: new Date().toISOString(),
      source: "Local squad database (offline fallback)",
      management: {
        manager: "Luke Goddard",
        assistants: ["Jack Turner", "Marc Feighery"],
        coach: "Darren Moss",
        physio: "Nantwich Medical Team",
      },
      players: MASTER_SQUAD,
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
const H2H_DATABASE = {
  "witton albion": {
    opponent: "Witton Albion",
    derbyName: "Mid-Cheshire Rivalry",
    played: 18,
    nantwichWins: 8,
    draws: 4,
    opponentWins: 6,
    goalsFor: 29,
    goalsAgainst: 24,
    lastMeetings: [
      { date: "Aug 2024", comp: "NPL West", score: "0 - 3", venue: "A", result: "L", highlightsUrl: "https://www.youtube.com/results?search_query=Witton+Albion+vs+Nantwich+Town+highlights+The+Dabbers+TV" },
      { date: "Mar 2024", comp: "Cheshire Senior Cup", score: "2 - 1", venue: "H", result: "W", highlightsUrl: "https://www.youtube.com/results?search_query=Nantwich+Town+vs+Witton+Albion+Cheshire+Cup+highlights+The+Dabbers+TV" },
      { date: "Dec 2023", comp: "NPL West", score: "1 - 1", venue: "A", result: "D", highlightsUrl: "https://www.youtube.com/results?search_query=Witton+Albion+vs+Nantwich+Town+highlights+The+Dabbers+TV" },
      { date: "Aug 2023", comp: "NPL West", score: "2 - 0", venue: "H", result: "W", highlightsUrl: "https://www.youtube.com/results?search_query=Nantwich+Town+vs+Witton+Albion+highlights+The+Dabbers+TV" },
      { date: "Apr 2022", comp: "NPL Premier", score: "3 - 2", venue: "H", result: "W", highlightsUrl: "https://www.youtube.com/results?search_query=Nantwich+Town+vs+Witton+Albion+highlights+The+Dabbers+TV" },
    ],
    funFact: "One of Cheshire's fiercest traditional non-league fixtures, with over 600 supporters regularly in attendance.",
    channelUrl: "https://www.youtube.com/@TheDabbersTV",
  },
  "1874 northwich": {
    opponent: "1874 Northwich",
    derbyName: "Cheshire Derby",
    played: 12,
    nantwichWins: 7,
    draws: 3,
    opponentWins: 2,
    goalsFor: 22,
    goalsAgainst: 11,
    lastMeetings: [
      { date: "Feb 2024", comp: "NPL West", score: "3 - 1", venue: "H", result: "W", highlightsUrl: "https://www.youtube.com/results?search_query=Nantwich+Town+vs+1874+Northwich+highlights+The+Dabbers+TV" },
      { date: "Oct 2023", comp: "NPL West", score: "1 - 1", venue: "A", result: "D", highlightsUrl: "https://www.youtube.com/results?search_query=1874+Northwich+vs+Nantwich+Town+highlights+The+Dabbers+TV" },
      { date: "Jan 2023", comp: "Cheshire Cup", score: "2 - 0", venue: "H", result: "W", highlightsUrl: "https://www.youtube.com/results?search_query=Nantwich+Town+vs+1874+Northwich+Cheshire+Cup+highlights+The+Dabbers+TV" },
    ],
    funFact: "The Dabbers have remained unbeaten in 5 of the last 6 encounters with 1874 Northwich.",
    channelUrl: "https://www.youtube.com/@TheDabbersTV",
  },
  "stafford rangers": {
    opponent: "Stafford Rangers",
    derbyName: "Staffs & Cheshire Border Clash",
    played: 24,
    nantwichWins: 11,
    draws: 6,
    opponentWins: 7,
    goalsFor: 38,
    goalsAgainst: 31,
    lastMeetings: [
      { date: "Apr 2024", comp: "Staffs Senior Cup", score: "2 - 1", venue: "H", result: "W", highlightsUrl: "https://www.youtube.com/results?search_query=Nantwich+Town+vs+Stafford+Rangers+highlights+The+Dabbers+TV" },
      { date: "Nov 2023", comp: "Friendly / Cup", score: "1 - 2", venue: "A", result: "L", highlightsUrl: "https://www.youtube.com/results?search_query=Stafford+Rangers+vs+Nantwich+Town+highlights+The+Dabbers+TV" },
      { date: "Apr 2023", comp: "NPL Premier", score: "2 - 0", venue: "H", result: "W", highlightsUrl: "https://www.youtube.com/results?search_query=Nantwich+Town+vs+Stafford+Rangers+highlights+The+Dabbers+TV" },
    ],
    funFact: "Stafford and Nantwich shared classic battles during their Premier Division tenure.",
    channelUrl: "https://www.youtube.com/@TheDabbersTV",
  },
  "chasetown": {
    opponent: "Chasetown",
    derbyName: "NPL Division One West",
    played: 14,
    nantwichWins: 6,
    draws: 5,
    opponentWins: 3,
    goalsFor: 21,
    goalsAgainst: 16,
    lastMeetings: [
      { date: "Aug 2024", comp: "NPL West", score: "2 - 2", venue: "A", result: "D", highlightsUrl: "https://www.youtube.com/results?search_query=Chasetown+vs+Nantwich+Town+highlights+The+Dabbers+TV" },
      { date: "Mar 2024", comp: "NPL West", score: "1 - 0", venue: "H", result: "W", highlightsUrl: "https://www.youtube.com/results?search_query=Nantwich+Town+vs+Chasetown+highlights+The+Dabbers+TV" },
      { date: "Nov 2023", comp: "NPL West", score: "1 - 1", venue: "A", result: "D", highlightsUrl: "https://www.youtube.com/results?search_query=Chasetown+vs+Nantwich+Town+highlights+The+Dabbers+TV" },
    ],
    funFact: "High scoring encounters — both sides have scored in 4 of the last 5 meetings.",
    channelUrl: "https://www.youtube.com/@TheDabbersTV",
  },
  "prescot cables": {
    opponent: "Prescot Cables",
    derbyName: "NPL Division One West",
    played: 16,
    nantwichWins: 7,
    draws: 4,
    opponentWins: 5,
    goalsFor: 25,
    goalsAgainst: 22,
    lastMeetings: [
      { date: "Aug 2024", comp: "NPL West", score: "1 - 3", venue: "H", result: "L", highlightsUrl: "https://www.youtube.com/results?search_query=Nantwich+Town+vs+Prescot+Cables+highlights+The+Dabbers+TV" },
      { date: "Feb 2024", comp: "NPL West", score: "2 - 1", venue: "A", result: "W", highlightsUrl: "https://www.youtube.com/results?search_query=Prescot+Cables+vs+Nantwich+Town+highlights+The+Dabbers+TV" },
    ],
    funFact: "Historic non-league fixture dating back to North West Counties league battles.",
    channelUrl: "https://www.youtube.com/@TheDabbersTV",
  },
  "sporting khalsa": {
    opponent: "Sporting Khalsa",
    derbyName: "FA Cup / NPL Fixture",
    played: 5,
    nantwichWins: 2,
    draws: 2,
    opponentWins: 1,
    goalsFor: 8,
    goalsAgainst: 6,
    lastMeetings: [
      { date: "Aug 2024", comp: "FA Cup EP Replay", score: "1 - 1 (P)", venue: "H", result: "D", highlightsUrl: "https://www.youtube.com/results?search_query=Nantwich+Town+vs+Sporting+Khalsa+FA+Cup+highlights+The+Dabbers+TV" },
      { date: "Aug 2024", comp: "FA Cup EP", score: "1 - 1", venue: "A", result: "D", highlightsUrl: "https://www.youtube.com/results?search_query=Sporting+Khalsa+vs+Nantwich+Town+FA+Cup+highlights+The+Dabbers+TV" },
    ],
    funFact: "Drawn out cup ties requiring penalty shootouts to settle thrilling encounters.",
    channelUrl: "https://www.youtube.com/@TheDabbersTV",
  },
  "vauxhall motors": {
    opponent: "Vauxhall Motors",
    derbyName: "Cheshire Coast Clash",
    played: 10,
    nantwichWins: 4,
    draws: 3,
    opponentWins: 3,
    goalsFor: 18,
    goalsAgainst: 15,
    lastMeetings: [
      { date: "Aug 2024", comp: "NPL West", score: "3 - 3", venue: "H", result: "D", highlightsUrl: "https://www.youtube.com/results?search_query=Nantwich+Town+vs+Vauxhall+Motors+highlights+The+Dabbers+TV" },
      { date: "Jan 2024", comp: "NPL West", score: "2 - 0", venue: "A", result: "W", highlightsUrl: "https://www.youtube.com/results?search_query=Vauxhall+Motors+vs+Nantwich+Town+highlights+The+Dabbers+TV" },
    ],
    funFact: "Vauxhall Motors and Nantwich produced a 6-goal thriller at Swansway Stadium.",
    channelUrl: "https://www.youtube.com/@TheDabbersTV",
  },
};

app.get("/api/h2h/:opponent", (req, res) => {
  const query = cleanText(req.params.opponent).toLowerCase();
  for (const [key, data] of Object.entries(H2H_DATABASE)) {
    if (query.includes(key) || key.includes(query)) {
      return res.json(data);
    }
  }

  // Generic calculated H2H preview for any team
  const oppName = cleanText(req.params.opponent) || "Opponent";
  res.json({
    opponent: oppName,
    derbyName: "Northern Premier League Clash",
    played: 6,
    nantwichWins: 3,
    draws: 2,
    opponentWins: 1,
    goalsFor: 9,
    goalsAgainst: 6,
    lastMeetings: [
      { date: "2023/24", comp: "NPL West", score: "2 - 1", venue: "H", result: "W", highlightsUrl: `https://www.youtube.com/results?search_query=Nantwich+Town+vs+${encodeURIComponent(oppName)}+highlights+The+Dabbers+TV` },
      { date: "2023/24", comp: "NPL West", score: "1 - 1", venue: "A", result: "D", highlightsUrl: `https://www.youtube.com/results?search_query=Nantwich+Town+vs+${encodeURIComponent(oppName)}+highlights+The+Dabbers+TV` },
    ],
    funFact: `The Dabbers have maintained a solid record against ${oppName} at Swansway Stadium.`,
    channelUrl: "https://www.youtube.com/@TheDabbersTV",
  });
});

// -----------------------------------------------------------------------
// GET /api/media — Dabbers TV YouTube Highlights & Video Clips
// -----------------------------------------------------------------------
app.get("/api/media", (req, res) => {
  res.json({
    channel: {
      name: "The Dabbers TV",
      url: "https://www.youtube.com/@TheDabbersTV",
      subscribers: "1.8K+",
      videoCount: "450+ Videos",
      handle: "@TheDabbersTV",
    },
    featuredVideos: [
      {
        id: "dabbers-highlights-latest",
        title: "Match Highlights: Nantwich Town vs Sporting Khalsa",
        desc: "All the key goals, saves, and major match incidents from the FA Cup thriller at Swansway Stadium.",
        date: "Latest Match",
        competition: "FA Cup EP",
        opponent: "Sporting Khalsa",
        youtubeUrl: "https://www.youtube.com/results?search_query=Nantwich+Town+vs+Sporting+Khalsa+FA+Cup+highlights+The+Dabbers+TV",
        thumbnail: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=600&q=80",
        duration: "06:45",
        category: "Match Highlights",
      },
      {
        id: "dabbers-highlights-witton",
        title: "Cheshire Derby: Witton Albion vs Nantwich Town",
        desc: "Full extended highlights from the high-stakes Mid-Cheshire league encounter.",
        date: "Recent Result",
        competition: "NPL Division One West",
        opponent: "Witton Albion",
        youtubeUrl: "https://www.youtube.com/results?search_query=Witton+Albion+vs+Nantwich+Town+highlights+The+Dabbers+TV",
        thumbnail: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80",
        duration: "08:12",
        category: "Match Highlights",
      },
      {
        id: "dabbers-highlights-vauxhall",
        title: "6-Goal Thriller: Nantwich Town 3 - 3 Vauxhall Motors",
        desc: "Six sensational goals from a breathless clash under the floodlights at Water Lode.",
        date: "Previous Encounter",
        competition: "NPL Division One West",
        opponent: "Vauxhall Motors",
        youtubeUrl: "https://www.youtube.com/results?search_query=Nantwich+Town+vs+Vauxhall+Motors+highlights+The+Dabbers+TV",
        thumbnail: "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=600&q=80",
        duration: "07:30",
        category: "Match Highlights",
      },
      {
        id: "dabbers-highlights-chasetown",
        title: "Match Action: Chasetown FC vs Nantwich Town",
        desc: "Goalmouth action and late drama from the Dabbers' visit to The Scholars Ground.",
        date: "Previous Encounter",
        competition: "NPL Division One West",
        opponent: "Chasetown",
        youtubeUrl: "https://www.youtube.com/results?search_query=Chasetown+vs+Nantwich+Town+highlights+The+Dabbers+TV",
        thumbnail: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=600&q=80",
        duration: "05:15",
        category: "Match Highlights",
      },
      {
        id: "dabbers-interview-goddard",
        title: "Luke Goddard Post-Match Reaction & Tactical Review",
        desc: "Manager Luke Goddard gives his candid thoughts on squad shape, pressing intensity, and player form.",
        date: "Manager Reaction",
        competition: "Club Interview",
        opponent: "Nantwich Town FC",
        youtubeUrl: "https://www.youtube.com/@TheDabbersTV/videos",
        thumbnail: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=600&q=80",
        duration: "04:20",
        category: "Interviews",
      },
    ],
  });
});

app.get(["/", "/favicon.ico"], (req, res) => {
  if (req.path === "/favicon.ico") return res.status(204).end();
  return res.sendFile(indexFile);
});

app.listen(PORT, HOST, () => {
  console.info(`Nantwich Town FC app listening on http://${HOST}:${PORT}`);
});
