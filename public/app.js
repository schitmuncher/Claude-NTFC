// =======================================================================
// The Dabbers — Nantwich Town FC Matchday Companion
// Fully upgraded tactical squad builder, expanded squad stats database,
// slick mobile-first UI, live scores, table, and fixtures.
// =======================================================================

const tabs = [
  { id: "live", label: "Matchday", icon: "pulse" },
  { id: "squad", label: "Squad & XI", icon: "users" },
  { id: "fixtures", label: "Fixtures", icon: "calendar" },
  { id: "table", label: "Table", icon: "table" },
];

const TICKETING_URL = "https://nantwichtownfc.ktckts.com/brand/match-tickets";
const X_TIMELINE_URL = "https://twitter.com/TheDabbers?ref_src=twsrc%5Etfw";
const CLUB_INFO = {
  name: "Nantwich Town FC",
  nickname: "The Dabbers",
  founded: "1884",
  stadium: "The Swansway Stadium",
  address: "Water Lode, Nantwich, Cheshire, CW5 5BS",
  capacity: "3,500 (500 seated)",
  league: "Northern Premier League — Division One West",
  website: "https://www.nantwichtownfc.co.uk",
  store: "https://store.nantwichtownfc.co.uk",
  tickets: "https://nantwichtownfc.ktckts.com/brand/match-tickets",
};

// Official Nantwich Town FC Social Media Network
const SOCIAL_CHANNELS = [
  {
    id: "x",
    name: "X (Twitter)",
    handle: "@TheDabbers",
    desc: "Breaking news, line-ups & live match updates",
    url: "https://twitter.com/TheDabbers",
    icon: "x_social",
    badgeColor: "bg-[#1DA1F2]/20 text-[#1DA1F2] border-[#1DA1F2]/30",
    hoverBorder: "hover:border-[#1DA1F2]/60 hover:bg-[#1DA1F2]/10",
  },
  {
    id: "facebook",
    name: "Facebook",
    handle: "Nantwich Town FC",
    desc: "Club announcements, match reports & photo galleries",
    url: "https://www.facebook.com/nantwichtownfc",
    icon: "facebook",
    badgeColor: "bg-[#1877F2]/20 text-[#1877F2] border-[#1877F2]/30",
    hoverBorder: "hover:border-[#1877F2]/60 hover:bg-[#1877F2]/10",
  },
  {
    id: "instagram",
    name: "Instagram",
    handle: "@nantwichtownfc",
    desc: "Matchday reels, training snaps & behind-the-scenes",
    url: "https://www.instagram.com/nantwichtownfc",
    icon: "instagram",
    badgeColor: "bg-[#E4405F]/20 text-[#E4405F] border-[#E4405F]/30",
    hoverBorder: "hover:border-[#E4405F]/60 hover:bg-[#E4405F]/10",
  },
  {
    id: "youtube",
    name: "YouTube",
    handle: "The Dabbers TV",
    desc: "Full match highlights, manager interviews & goals",
    url: "https://www.youtube.com/@TheDabbersTV",
    icon: "youtube",
    badgeColor: "bg-[#FF0000]/20 text-[#FF0000] border-[#FF0000]/30",
    hoverBorder: "hover:border-[#FF0000]/60 hover:bg-[#FF0000]/10",
  },
  {
    id: "tiktok",
    name: "TikTok",
    handle: "@nantwichtownfc",
    desc: "Goal celebrations, team skills & match vibes",
    url: "https://www.tiktok.com/@nantwichtownfc",
    icon: "tiktok",
    badgeColor: "bg-[#00f2fe]/20 text-[#00f2fe] border-[#00f2fe]/30",
    hoverBorder: "hover:border-[#00f2fe]/60 hover:bg-[#00f2fe]/10",
  },
  {
    id: "website",
    name: "Official Website",
    handle: "nantwichtownfc.co.uk",
    desc: "Official club portal, news, commercial & community",
    url: "https://www.nantwichtownfc.co.uk",
    icon: "globe",
    badgeColor: "bg-gold/20 text-gold border-gold/30",
    hoverBorder: "hover:border-gold/60 hover:bg-gold/10",
  },
  {
    id: "shop",
    name: "Club Online Store",
    handle: "store.nantwichtownfc.co.uk",
    desc: "Official Macron shirts, training kit, scarves & gifts",
    url: "https://store.nantwichtownfc.co.uk",
    icon: "shop",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    hoverBorder: "hover:border-emerald-500/60 hover:bg-emerald-500/10",
  },
];

// Formations with pitch coordinate percentages (top%, left%)
const FORMATIONS = {
  "4-3-3": {
    name: "4-3-3 Attack",
    positions: [
      { id: "gk", label: "GK", category: "GK", top: 84, left: 50 },
      { id: "lb", label: "LB", category: "DEF", top: 66, left: 16 },
      { id: "lcb", label: "CB", category: "DEF", top: 68, left: 38 },
      { id: "rcb", label: "CB", category: "DEF", top: 68, left: 62 },
      { id: "rb", label: "RB", category: "DEF", top: 66, left: 84 },
      { id: "cdm", label: "CDM", category: "MID", top: 48, left: 50 },
      { id: "lcm", label: "CM", category: "MID", top: 40, left: 28 },
      { id: "rcm", label: "CAM", category: "MID", top: 36, left: 72 },
      { id: "lw", label: "LW", category: "FWD", top: 18, left: 18 },
      { id: "st", label: "ST", category: "FWD", top: 14, left: 50 },
      { id: "rw", label: "RW", category: "FWD", top: 18, left: 82 },
    ],
  },
  "4-4-2": {
    name: "4-4-2 Classic",
    positions: [
      { id: "gk", label: "GK", category: "GK", top: 84, left: 50 },
      { id: "lb", label: "LB", category: "DEF", top: 66, left: 16 },
      { id: "lcb", label: "CB", category: "DEF", top: 68, left: 38 },
      { id: "rcb", label: "CB", category: "DEF", top: 68, left: 62 },
      { id: "rb", label: "RB", category: "DEF", top: 66, left: 84 },
      { id: "lm", label: "LM", category: "MID", top: 42, left: 16 },
      { id: "lcm", label: "CM", category: "MID", top: 44, left: 38 },
      { id: "rcm", label: "CM", category: "MID", top: 44, left: 62 },
      { id: "rm", label: "RM", category: "MID", top: 42, left: 84 },
      { id: "lst", label: "ST", category: "FWD", top: 16, left: 35 },
      { id: "rst", label: "ST", category: "FWD", top: 16, left: 65 },
    ],
  },
  "4-2-3-1": {
    name: "4-2-3-1 Modern",
    positions: [
      { id: "gk", label: "GK", category: "GK", top: 84, left: 50 },
      { id: "lb", label: "LB", category: "DEF", top: 66, left: 16 },
      { id: "lcb", label: "CB", category: "DEF", top: 68, left: 38 },
      { id: "rcb", label: "CB", category: "DEF", top: 68, left: 62 },
      { id: "rb", label: "RB", category: "DEF", top: 66, left: 84 },
      { id: "ldm", label: "CDM", category: "MID", top: 50, left: 34 },
      { id: "rdm", label: "CDM", category: "MID", top: 50, left: 66 },
      { id: "lam", label: "LAM", category: "MID", top: 30, left: 20 },
      { id: "cam", label: "CAM", category: "MID", top: 28, left: 50 },
      { id: "ram", label: "RAM", category: "MID", top: 30, left: 80 },
      { id: "st", label: "ST", category: "FWD", top: 14, left: 50 },
    ],
  },
  "3-5-2": {
    name: "3-5-2 Wingbacks",
    positions: [
      { id: "gk", label: "GK", category: "GK", top: 84, left: 50 },
      { id: "lcb", label: "CB", category: "DEF", top: 68, left: 25 },
      { id: "cb", label: "CB", category: "DEF", top: 70, left: 50 },
      { id: "rcb", label: "CB", category: "DEF", top: 68, left: 75 },
      { id: "lwb", label: "LWB", category: "DEF", top: 46, left: 14 },
      { id: "lcm", label: "CM", category: "MID", top: 48, left: 36 },
      { id: "cam", label: "CAM", category: "MID", top: 34, left: 50 },
      { id: "rcm", label: "CM", category: "MID", top: 48, left: 64 },
      { id: "rwb", label: "RWB", category: "DEF", top: 46, left: 86 },
      { id: "lst", label: "ST", category: "FWD", top: 16, left: 35 },
      { id: "rst", label: "ST", category: "FWD", top: 16, left: 65 },
    ],
  },
  "5-3-2": {
    name: "5-3-2 Solid",
    positions: [
      { id: "gk", label: "GK", category: "GK", top: 84, left: 50 },
      { id: "lwb", label: "LWB", category: "DEF", top: 60, left: 14 },
      { id: "lcb", label: "CB", category: "DEF", top: 68, left: 32 },
      { id: "cb", label: "CB", category: "DEF", top: 70, left: 50 },
      { id: "rcb", label: "CB", category: "DEF", top: 68, left: 68 },
      { id: "rwb", label: "RWB", category: "DEF", top: 60, left: 86 },
      { id: "lcm", label: "CM", category: "MID", top: 42, left: 30 },
      { id: "cm", label: "CDM", category: "MID", top: 44, left: 50 },
      { id: "rcm", label: "CM", category: "MID", top: 42, left: 70 },
      { id: "lst", label: "ST", category: "FWD", top: 16, left: 35 },
      { id: "rst", label: "ST", category: "FWD", top: 16, left: 65 },
    ],
  },
};

// Previous match squad data for auto-populating Starting XI
const PREVIOUS_MATCH_SQUAD = {
  opponent: "Witton Albion",
  competition: "NPL West Division",
  date: "Latest Matchday",
  score: "2 - 1 (W)",
  starters: {
    "4-3-3": {
      gk: "ben-garratt",
      lb: "joe-collins",
      lcb: "patrick-peter-kennedy",
      rcb: "harry-davis",
      rb: "aidan-william-roxburgh",
      cdm: "ethan-hartshorn",
      lcm: "iwan-roberts",
      rcm: "josh-hancock",
      lw: "kai-evans",
      st: "joe-piggott",
      rw: "byron-moore",
    },
    "4-4-2": {
      gk: "ben-garratt",
      lb: "joe-collins",
      lcb: "patrick-peter-kennedy",
      rcb: "harry-davis",
      rb: "aidan-william-roxburgh",
      lm: "kai-evans",
      lcm: "ethan-hartshorn",
      rcm: "iwan-roberts",
      rm: "byron-moore",
      lst: "joe-piggott",
      rst: "callum-saunders",
    },
    "4-2-3-1": {
      gk: "ben-garratt",
      lb: "joe-collins",
      lcb: "patrick-peter-kennedy",
      rcb: "harry-davis",
      rb: "aidan-william-roxburgh",
      ldm: "ethan-hartshorn",
      rdm: "iwan-roberts",
      lam: "kai-evans",
      cam: "josh-hancock",
      ram: "byron-moore",
      st: "joe-piggott",
    },
    "3-5-2": {
      gk: "ben-garratt",
      lcb: "patrick-peter-kennedy",
      cb: "harry-davis",
      rcb: "troy-bourne",
      lwb: "joe-collins",
      lcm: "ethan-hartshorn",
      cam: "josh-hancock",
      rcm: "iwan-roberts",
      rwb: "aidan-william-roxburgh",
      lst: "joe-piggott",
      rst: "callum-saunders",
    },
    "5-3-2": {
      gk: "ben-garratt",
      lwb: "joe-collins",
      lcb: "patrick-peter-kennedy",
      cb: "harry-davis",
      rcb: "troy-bourne",
      rwb: "aidan-william-roxburgh",
      lcm: "ethan-hartshorn",
      cm: "iwan-roberts",
      rcm: "josh-hancock",
      lst: "joe-piggott",
      rst: "callum-saunders",
    },
  },
  bench: [
    "yusuf-mersin",
    "perry-bircumshaw",
    "fenton-lloyd-green",
    "liam-james-fitzpatrick",
    "oliver-james-pope",
    "eddie-serino",
    "kelvin-mellor",
    "callum-saunders",
    "joel-connolly",
    "matthew-bell",
  ],
};

function getPreviousMatchLineup(formationKey = "4-3-3") {
  return PREVIOUS_MATCH_SQUAD.starters[formationKey] || PREVIOUS_MATCH_SQUAD.starters["4-3-3"];
}

// Application state
const state = {
  activeTab: "live",
  loading: true,
  refreshing: false,
  data: { live: null, table: null, fixtures: null, squad: null, media: null },
  errors: {},
  lastUpdated: null,
  lastLiveChecked: null,

  // Extended Matchday & Audio state
  soundEnabled: localStorage.getItem("dabbers-sound") === "true",
  h2hCache: {},
  activeH2HOpponent: null,
  activeH2HData: null,
  graphicDataUrl: null,

  // Squad Builder State — automatically loads the previous match squad if none saved
  squadSubTab: "builder", // "builder" | "roster"
  selectedFormation: localStorage.getItem("dabbers-formation") || "4-3-3",
  lineup: (() => {
    const saved = localStorage.getItem("dabbers-lineup");
    if (saved && saved !== "{}" && Object.keys(JSON.parse(saved || "{}")).length > 0) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return { ...getPreviousMatchLineup(localStorage.getItem("dabbers-formation") || "4-3-3") };
  })(),
  bench: (() => {
    const saved = localStorage.getItem("dabbers-bench");
    if (saved && saved !== "[]" && JSON.parse(saved || "[]").length > 0) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [...PREVIOUS_MATCH_SQUAD.bench];
  })(),
  
  // Squad Roster filters
  squadFilterCategory: "ALL", // "ALL" | "GK" | "DEF" | "MID" | "FWD"
  squadSearchQuery: "",
  squadSortBy: "rating", // "rating" | "apps" | "goals" | "number" | "name"
  
  // Fixtures filter
  fixtureFilter: "ALL", // "ALL" | "UPCOMING" | "RESULTS" | "HOME"
  
  // UI Modals & Popups
  activeModal: null, // null | "player_profile" | "pos_picker" | "stadium_guide" | "h2h_preview" | "graphic_export"
  activePlayerModalId: null,
  activePickingSlot: null, // { posId, label, category }
  
  // Feedback toast
  toastMessage: null,
  toastTimeout: null,
};

const root = document.querySelector("#app");

// Utility helpers
function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function numeric(value) {
  const parsed = Number.parseFloat(String(value ?? "").replace(/[^0-9.+-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function showToast(msg) {
  if (state.toastTimeout) clearTimeout(state.toastTimeout);
  state.toastMessage = msg;
  render();
  state.toastTimeout = setTimeout(() => {
    state.toastMessage = null;
    render();
  }, 2600);
}

function icon(name, className = "h-5 w-5") {
  const shapes = {
    pulse: '<path d="M3 12h3l2-7 4 14 2-7h7" /><path d="M3 19h18" />',
    table: '<rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18M9 9v11M15 9v11" />',
    calendar: '<rect x="3" y="4" width="18" height="17" rx="2" /><path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />',
    refresh: '<path d="M20 11a8.1 8.1 0 0 0-15.5-2M4 5v4h4M4 13a8.1 8.1 0 0 0 15.5 2M20 19v-4h-4" />',
    alert: '<circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" />',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6" />',
    ticket: '<path d="M4 7V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4v-2a2 2 0 0 0 0-4Z" /><path d="M13 5v2M13 17v2M13 11v2" />',
    check: '<path d="m5 12 4 4L19 6" />',
    chart: '<path d="M4 19V5M4 19h17M8 16v-3M12 16V8M16 16v-6M20 16v-9" />',
    mapPin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" />',
    share: '<circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98" />',
    plus: '<path d="M12 5v14M5 12h14" />',
    close: '<path d="M18 6 6 18M6 6l12 12" />',
    trash: '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />',
    magic: '<path d="m19 11-4-7-4 7-7 4 7 4 4 7 4-7 7-4-7-4ZM5 3v4M3 5h4M5 17v4M3 19h4" />',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />',
    search: '<circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />',
    info: '<circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />',
    calendarPlus: '<rect x="3" y="4" width="18" height="17" rx="2" /><path d="M16 2v4M8 2v4M3 10h18M12 14v6M9 17h6" />',
    external: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />',
    x_social: '<path d="M4 4l6.7 8.9L4 20h2.3l5.4-6.1L16.3 20H20l-7-9.3L19.4 4h-2.3l-5 5.7L7.7 4H4z" />',
    facebook: '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />',
    instagram: '<rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />',
    youtube: '<path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" /><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />',
    tiktok: '<path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />',
    globe: '<circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />',
    shop: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" />',
    volume2: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />',
    volumeX: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />',
    sun: '<circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />',
    cloudSun: '<path d="M12 2v2M4.93 4.93l1.41 1.41M20 12h2M19.07 4.93l-1.41 1.41M15.5 17h4a3.5 3.5 0 0 0 .5-6.96 5.5 5.5 0 0 0-9.98-2.04A4.5 4.5 0 0 0 5 12.5 4.5 4.5 0 0 0 9.5 17h6" />',
    cloudRain: '<path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242M16 14v6M8 14v6M12 16v6" />',
    wind: '<path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2M9.6 4.6A2 2 0 1 1 11 8H2M12.6 19.4A2 2 0 1 0 14 16H2" />',
    trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.45 1-1 1H8c-.55 0-1 .45-1 1v1c0 .55.45 1 1 1h8c.55 0 1-.45 1-1v-1c0-.55-.45-1-1-1h-1c-.55 0-1-.45-1-1v-2.34c3.08-.75 5.37-3.4 5.37-6.66V4H5v4c0 3.26 2.29 5.91 5.37 6.66Z" />',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />',
    music: '<path d="M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />',
    flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5Z" />',
    zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />',
  };
  return `<svg aria-hidden="true" class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${shapes[name] || ""}</svg>`;
}

function getTicketUrl(fixture) {
  if (fixture.ticketUrl) return fixture.ticketUrl;
  if (isHomeFixture(fixture)) return TICKETING_URL;
  return `https://www.google.com/search?q=${encodeURIComponent((fixture.opponent || "opponent") + " FC matchday tickets admission ground")}`;
}

function getPlayersList() {
  const payload = state.data.squad || {};
  return Array.isArray(payload) ? payload : payload.players || [];
}

function getPlayerById(id) {
  return getPlayersList().find((p) => p.id === id || p.name === id);
}

function completed(fixture) {
  return /\d+\s*-\s*\d+/.test(fixture.scoreOrStatus || "");
}

function isHomeFixture(fixture) {
  return /^(h|home)$/i.test(String(fixture.venue || "").trim());
}

function nextUpcomingFixture() {
  return (state.data.fixtures || []).find((fixture) => !completed(fixture)) || null;
}

function fixtureDateParts(date) {
  const parts = String(date || "—").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { day: "—", date: "—" };
  return { day: parts[0].toUpperCase(), date: parts.slice(1).join(" ") || parts[0] };
}

function updatedLabel() {
  if (!state.lastUpdated) return "Syncing matchday data";
  return `Updated ${new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(state.lastUpdated)}`;
}

function liveCheckedLabel() {
  if (!state.lastLiveChecked) return "Live score check";
  return `Checked ${new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(state.lastLiveChecked)}`;
}

// Maps Directions URL
function mapsDirectionsUrl(fixture) {
  const destination = isHomeFixture(fixture)
    ? "Swansway Stadium, Water Lode, Nantwich, CW5 5BS"
    : `${fixture.opponent} football ground`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving`;
}

// Calendar Link Generator
function googleCalendarUrl(fixture) {
  const opponent = fixture.opponent || "Opponent";
  const title = isHomeFixture(fixture) ? `Nantwich Town FC vs ${opponent}` : `${opponent} vs Nantwich Town FC`;
  const venue = isHomeFixture(fixture) ? CLUB_INFO.stadium : `${opponent} Stadium`;
  const details = `NPL match: ${fixture.competition || "NPL West"}. The Dabbers in action.`;
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&location=${encodeURIComponent(venue)}&details=${encodeURIComponent(details)}`;
}

// Position Badge Color Utility
function posBadgeClass(cat) {
  switch (cat) {
    case "GK":
      return "bg-amber-500/15 text-amber-300 border border-amber-500/30";
    case "DEF":
      return "bg-blue-500/15 text-blue-300 border border-blue-500/30";
    case "MID":
      return "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30";
    case "FWD":
      return "bg-rose-500/15 text-rose-300 border border-rose-500/30";
    default:
      return "bg-slate-500/15 text-slate-300 border border-slate-500/30";
  }
}

// =======================================================================
// RENDER: SKELETON & ERRORS
// =======================================================================
function skeleton() {
  return `
    <div class="space-y-4">
      <div class="skeleton h-24 rounded-2xl"></div>
      <div class="skeleton h-56 rounded-2xl"></div>
      <div class="skeleton h-32 rounded-2xl"></div>
    </div>
  `;
}

function errorState(endpoint) {
  return `
    <div class="rounded-2xl border border-rose-500/30 bg-[#15251E] p-6 text-center text-white">
      <div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400">${icon("alert", "h-6 w-6")}</div>
      <h3 class="display text-lg font-bold">Unable to load ${escapeHtml(endpoint)}</h3>
      <p class="mx-auto mt-1 max-w-xs text-xs text-[#AAB8AE]">${escapeHtml(state.errors[endpoint] || "Service did not respond.")}</p>
      <button data-retry class="mt-4 inline-flex items-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-xs font-bold text-charcoal">Try again</button>
    </div>
  `;
}

// =======================================================================
// RENDER: TAB 1 — MATCHDAY CENTRE (LIVE)
// =======================================================================
function renderLive() {
  const games = state.data.live || [];
  const next = nextUpcomingFixture();
  const media = state.data.media;
  const players = getPlayersList();

  const reloadButton = `<button data-refresh-live class="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white/10 px-3 text-xs font-bold text-gold transition hover:bg-gold hover:text-charcoal" ${state.refreshing ? "disabled" : ""}><span class="${state.refreshing ? "animate-spin" : ""}">${icon("refresh", "h-3.5 w-3.5")}</span> Live Refresh</button>`;

  let liveMatchesMarkup = "";
  if (games.length > 0) {
    liveMatchesMarkup = `
      <div class="space-y-3">
        ${games.map((game) => `
          <div class="rounded-2xl border border-emerald-500/30 bg-[#15251E] p-4 text-white shadow-xl">
            <div class="mb-3 flex items-center justify-between">
              <span class="inline-flex items-center gap-1.5 rounded-full bg-rose-500/20 px-2.5 py-1 text-[10px] font-bold text-rose-400 uppercase tracking-wider">
                <span class="h-2 w-2 animate-pulse rounded-full bg-rose-500"></span> Live Action
              </span>
              <span class="text-xs font-bold text-gold">${escapeHtml(game.status || "In Play")}</span>
            </div>
            <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
              <div class="text-sm font-bold truncate">${escapeHtml(game.homeTeam || "Home")}</div>
              <div class="display rounded-xl bg-forest-dark px-4 py-1.5 text-2xl font-bold tracking-wider text-gold border border-gold/30">${escapeHtml(game.score || "0 - 0")}</div>
              <div class="text-sm font-bold truncate">${escapeHtml(game.awayTeam || "Away")}</div>
            </div>
          </div>
        `).join("")}
      </div>
    `;
  }

  return `
    <div class="space-y-5">
      <!-- Section Header with Match Audio Quick Toggle -->
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span class="text-[10px] font-bold uppercase tracking-[.2em] text-gold">Match Centre</span>
          <h2 class="display text-2xl font-bold tracking-tight text-white">The Dabbers Live</h2>
        </div>
        <div class="flex items-center gap-2">
          <button data-toggle-sound class="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 text-xs font-bold ${state.soundEnabled ? "text-gold border-gold/40" : "text-[#AAB8AE]"} hover:bg-white/10 transition" title="Matchday Whistle & Goal Horn">
            ${icon(state.soundEnabled ? "volume2" : "volumeX", "h-3.5 w-3.5")}
            <span>${state.soundEnabled ? "Sound ON" : "Sound Muted"}</span>
          </button>
          <div>${reloadButton}</div>
        </div>
      </div>

      <!-- Match Audio Quick Action Bar -->
      ${state.soundEnabled ? `
        <div class="flex items-center justify-between rounded-xl border border-gold/20 bg-gold/5 px-3 py-2 text-xs text-white">
          <span class="text-[11px] text-[#AAB8AE] flex items-center gap-1.5">
            ${icon("volume2", "h-3.5 w-3.5 text-gold")} Match Sound Engine Active
          </span>
          <div class="flex items-center gap-1.5">
            <button data-play-whistle class="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-white/20">Ref Whistle</button>
            <button data-play-goal class="rounded-md bg-gold px-2 py-0.5 text-[10px] font-bold text-charcoal hover:bg-gold-dark">Goal Horn</button>
          </div>
        </div>
      ` : ""}

      ${liveMatchesMarkup}

      <!-- Next Match Countdown Hero Card -->
      ${next ? `
        <div class="relative overflow-hidden rounded-2xl border border-charcoal-border bg-[#15251E] p-5 text-white shadow-xl">
          <div class="flex items-center justify-between">
            <span class="inline-flex items-center gap-1.5 rounded-full bg-forest px-3 py-1 text-[10px] font-bold text-gold uppercase tracking-wider">
              ${isHomeFixture(next) ? "Home Match" : "Away Match"}
            </span>
            <span class="text-xs font-medium text-[#AAB8AE]">${escapeHtml(next.competition || "NPL West")}</span>
          </div>

          <div class="my-5 text-center">
            <p class="text-xs font-medium text-[#AAB8AE]">Next Matchday Fixture</p>
            <h3 class="display mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              ${isHomeFixture(next) ? `Nantwich Town <span class="text-gold">vs</span> ${escapeHtml(next.opponent)}` : `${escapeHtml(next.opponent)} <span class="text-gold">vs</span> Nantwich Town`}
            </h3>
            <p class="mt-2 inline-flex items-center gap-2 rounded-lg bg-forest/40 px-3 py-1 text-xs font-bold text-[#F3C64C]">
              ${icon("calendar", "h-3.5 w-3.5")} ${escapeHtml(next.date)} · ${escapeHtml(next.scoreOrStatus || "Kick-off 15:00")}
            </p>
          </div>

          <!-- Match Quick Actions -->
          <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <a href="${getTicketUrl(next)}" target="_blank" rel="noopener noreferrer" class="flex items-center justify-center gap-1 rounded-xl ${isHomeFixture(next) ? "bg-gold text-charcoal hover:bg-gold-dark" : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30"} px-2.5 py-2.5 text-xs font-bold transition">
              ${icon("ticket", "h-3.5 w-3.5")} ${isHomeFixture(next) ? "Buy Tickets" : "Away Tickets"}
            </a>
            <button data-open-h2h="${escapeHtml(next.opponent)}" class="flex items-center justify-center gap-1 rounded-xl border border-gold/40 bg-gold/10 px-2.5 py-2.5 text-xs font-bold text-gold transition hover:bg-gold/20">
              ${icon("shield", "h-3.5 w-3.5")} H2H & Highlights
            </button>
            <a href="${mapsDirectionsUrl(next)}" target="_blank" rel="noopener noreferrer" class="flex items-center justify-center gap-1 rounded-xl border border-white/15 bg-white/5 px-2.5 py-2.5 text-xs font-bold text-white transition hover:bg-white/10">
              ${icon("mapPin", "h-3.5 w-3.5")} Ground Map
            </a>
            <a href="${googleCalendarUrl(next)}" target="_blank" rel="noopener noreferrer" class="flex items-center justify-center gap-1 rounded-xl border border-white/15 bg-white/5 px-2.5 py-2.5 text-xs font-bold text-white transition hover:bg-white/10">
              ${icon("calendarPlus", "h-3.5 w-3.5")} Calendar
            </a>
          </div>
        </div>
      ` : `
        <div class="rounded-2xl border border-charcoal-border bg-[#15251E] p-6 text-center text-white">
          <p class="text-sm text-[#AAB8AE]">No live matches currently in progress.</p>
        </div>
      `}

      <!-- Match Highlights & The Dabbers TV Video Hub -->
      <div class="rounded-2xl border border-charcoal-border bg-[#15251E] p-5 text-white shadow-xl">
        <div class="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <span class="text-[10px] font-bold uppercase tracking-wider text-gold">Match Highlights & Replays</span>
            <h3 class="display text-lg font-bold flex items-center gap-2">
              ${icon("youtube", "h-5 w-5 text-rose-500")} The Dabbers TV Highlights
            </h3>
          </div>
          <div class="flex items-center gap-2">
            <a href="https://www.youtube.com/@TheDabbersTV/videos" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 rounded-lg bg-rose-500/20 border border-rose-500/30 px-2.5 py-1 text-xs font-bold text-rose-300 hover:bg-rose-500/30 transition">
              Latest Videos ${icon("arrow", "h-3 w-3 inline")}
            </a>
          </div>
        </div>

        <!-- Featured Highlights Grid -->
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          ${(Array.isArray(media?.highlights) && media.highlights.length > 0 ? media.highlights : (Array.isArray(media?.featuredVideos) && media.featuredVideos.length > 0 ? media.featuredVideos : [
            {
              id: "hl-1",
              title: "Nantwich Town vs Witton Albion | Derby Highlights & Goals",
              opponent: "Witton Albion",
              score: "2 - 1",
              date: "Latest Matchday",
              competition: "NPL West Division",
              duration: "08:45",
              url: "https://www.youtube.com/results?search_query=Nantwich+Town+vs+Witton+Albion+highlights+The+Dabbers+TV",
              description: "Full match action and goals from the thrilling derby clash at The Swansway Stadium.",
              category: "Match Highlights"
            },
            {
              id: "hl-2",
              title: "Stalybridge Celtic vs Nantwich Town | Dramatic League Clash",
              opponent: "Stalybridge Celtic",
              score: "1 - 2",
              date: "Recent Match",
              competition: "NPL West Division",
              duration: "09:12",
              url: "https://www.youtube.com/results?search_query=Nantwich+Town+vs+Stalybridge+Celtic+highlights+The+Dabbers+TV",
              description: "Late drama as the Dabbers secured all three points on the road.",
              category: "Match Highlights"
            },
            {
              id: "hl-3",
              title: "Nantwich Town vs Shifnal Town | Emirates FA Cup Highlights",
              opponent: "Shifnal Town",
              score: "3 - 0",
              date: "Cup Matchday",
              competition: "Emirates FA Cup",
              duration: "07:20",
              url: "https://www.youtube.com/results?search_query=Nantwich+Town+vs+Shifnal+Town+FA+Cup+highlights+The+Dabbers+TV",
              description: "Superb attacking display sees the Dabbers advance in the FA Cup preliminary round.",
              category: "Cup Highlights"
            },
            {
              id: "hl-4",
              title: "Nantwich Town vs Vauxhall Motors | Floodlit Match Highlights",
              opponent: "Vauxhall Motors",
              score: "3 - 3",
              date: "Recent Result",
              competition: "NPL West Division",
              duration: "07:55",
              url: "https://www.youtube.com/results?search_query=Nantwich+Town+vs+Vauxhall+Motors+highlights+The+Dabbers+TV",
              description: "Six goals and sensational moments under the floodlights at Water Lode.",
              category: "Match Highlights"
            }
          ])).slice(0, 4).map((item) => `
            <a href="${item.url || item.youtubeUrl || "https://www.youtube.com/@TheDabbersTV/videos"}" target="_blank" rel="noopener noreferrer" class="group block rounded-xl border border-white/10 bg-white/5 p-3.5 hover:border-gold/50 hover:bg-gold/5 transition">
              <div class="flex items-center justify-between text-[10px] font-bold text-gold uppercase">
                <span class="rounded bg-rose-500/20 px-1.5 py-0.5 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                  ${icon("youtube", "h-3 w-3")} ${escapeHtml(item.category || "Highlights")}
                </span>
                <span class="text-[#AAB8AE] font-mono">${escapeHtml(item.duration || "Highlights")} · ${escapeHtml(item.date || "Matchday")}</span>
              </div>
              <h4 class="display mt-2 text-sm font-bold text-white group-hover:text-gold transition line-clamp-2 leading-snug">${escapeHtml(item.title)}</h4>
              <p class="mt-1 text-[11px] text-[#AAB8AE] line-clamp-2">${escapeHtml(item.description || item.desc || "")}</p>
              <div class="mt-3 flex items-center justify-between text-[11px] text-gold font-bold border-t border-white/10 pt-2">
                <span class="flex items-center gap-1">${icon("youtube", "h-3.5 w-3.5 text-rose-400")} Watch on Dabbers TV</span>
                <span>${icon("external", "h-3 w-3")}</span>
              </div>
            </a>
          `).join("")}
        </div>

        <!-- Previous Encounters & Archival Highlights Quick Filter Bar -->
        <div class="mt-4 rounded-xl bg-forest/30 border border-forest-light p-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <span class="text-xs font-bold text-[#D5E8D9] flex items-center gap-1.5">
              ${icon("shield", "h-3.5 w-3.5 text-gold")} Previous Encounters & Rivalry Highlights
            </span>
            <span class="text-[10px] text-[#AAB8AE]">Searchable across all NPL clubs</span>
          </div>
          <div class="mt-2.5 flex flex-wrap gap-1.5">
            ${["Witton Albion", "Stalybridge Celtic", "Bootle", "Hednesford Town", "Vauxhall Motors", "Mossley", "Kidsgrove Athletic"].map((club) => `
              <a href="https://www.youtube.com/results?search_query=Nantwich+Town+vs+${encodeURIComponent(club)}+highlights+The+Dabbers+TV" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 rounded-lg bg-black/30 border border-white/10 px-2 py-1 text-[10px] font-semibold text-white hover:border-gold hover:text-gold transition">
                <span>vs ${club}</span>
                <span class="text-rose-400">${icon("external", "h-2.5 w-2.5")}</span>
              </a>
            `).join("")}
          </div>
        </div>
      </div>

      <!-- Interactive Swansway Stadium Guide & Ground Map Card -->
      <div class="rounded-2xl border border-charcoal-border bg-[#15251E] p-5 text-white shadow-xl">
        <div class="flex items-start justify-between">
          <div>
            <span class="text-[10px] font-bold uppercase tracking-wider text-gold">Ground Guide & Admission</span>
            <h3 class="display mt-0.5 text-lg font-bold">${escapeHtml(CLUB_INFO.stadium)}</h3>
          </div>
          <button data-open-stadium-guide class="inline-flex items-center gap-1 rounded-xl bg-gold px-3 py-1.5 text-xs font-bold text-charcoal hover:bg-gold-dark transition">
            ${icon("mapPin", "h-3.5 w-3.5")} Stadium Hub & Map
          </button>
        </div>
        <p class="mt-2 text-xs text-[#AAB8AE]">${escapeHtml(CLUB_INFO.address)}</p>

        <div class="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
          <div class="rounded-xl bg-white/5 p-2.5">
            <span class="block text-[9px] uppercase text-[#AAB8AE]">Capacity</span>
            <strong class="font-bold text-white">3,500 (500 seated)</strong>
          </div>
          <div class="rounded-xl bg-white/5 p-2.5">
            <span class="block text-[9px] uppercase text-[#AAB8AE]">Adult Entry</span>
            <strong class="font-bold text-gold">£12.00 (Card/Cash)</strong>
          </div>
          <div class="rounded-xl bg-white/5 p-2.5">
            <span class="block text-[9px] uppercase text-[#AAB8AE]">Concessions</span>
            <strong class="font-bold text-white">£8.00 / £3.00 U16</strong>
          </div>
          <div class="rounded-xl bg-white/5 p-2.5">
            <span class="block text-[9px] uppercase text-[#AAB8AE]">Parking</span>
            <strong class="font-bold text-emerald-400">Free On-site</strong>
          </div>
        </div>
      </div>

      <!-- Official Club Social Media Hub -->
      <div class="rounded-2xl border border-charcoal-border bg-[#15251E] p-5 text-white shadow-xl">
        <div class="mb-4 flex items-center justify-between">
          <div>
            <span class="text-[10px] font-bold uppercase tracking-wider text-gold">Connect & Follow</span>
            <h3 class="display text-lg font-bold">Official Dabbers Socials</h3>
          </div>
          <span class="rounded-full bg-forest px-2.5 py-0.5 text-[10px] font-bold text-gold border border-gold/30">
            ${SOCIAL_CHANNELS.length} Channels
          </span>
        </div>

        <div class="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          ${SOCIAL_CHANNELS.map((ch) => `
            <a
              href="${ch.url}"
              target="_blank"
              rel="noopener noreferrer"
              class="group flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3 text-white transition ${ch.hoverBorder}"
            >
              <div class="flex items-center gap-3 min-w-0">
                <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-forest-dark border border-white/10 text-gold group-hover:border-gold/50 group-hover:text-gold transition">
                  ${icon(ch.icon, "h-4 w-4")}
                </span>
                <div class="min-w-0">
                  <div class="flex items-center gap-1.5">
                    <h4 class="text-xs font-bold text-white truncate group-hover:text-gold transition">${ch.name}</h4>
                    <span class="rounded px-1.5 py-0.2 text-[8px] font-bold uppercase border ${ch.badgeColor}">${ch.handle}</span>
                  </div>
                  <p class="text-[10px] text-[#AAB8AE] truncate">${ch.desc}</p>
                </div>
              </div>
              <span class="shrink-0 text-xs text-[#AAB8AE] group-hover:text-gold transition ml-2">
                ${icon("external", "h-3.5 w-3.5")}
              </span>
            </a>
          `).join("")}
        </div>
      </div>

      <!-- Live Commentary & X Feed -->
      <div class="rounded-2xl border border-charcoal-border bg-[#15251E] p-5 text-white">
        <div class="mb-4 flex items-center justify-between">
          <div>
            <span class="text-[10px] font-bold uppercase tracking-wider text-gold">Club Commentary</span>
            <h3 class="display text-lg font-bold">The Dabbers on X</h3>
          </div>
          <a href="${X_TIMELINE_URL}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-xs font-bold text-gold hover:underline">
            Open Feed ${icon("arrow", "h-3 w-3")}
          </a>
        </div>
        <div data-x-timeline class="min-h-[160px] overflow-hidden rounded-xl bg-white/5 p-3">
          <a class="twitter-timeline" data-height="450" data-theme="dark" href="${X_TIMELINE_URL}">Tweets by TheDabbers</a>
        </div>
      </div>
    </div>
  `;
}

// =======================================================================
// RENDER: TAB 2 — SQUAD & TACTICAL SQUAD BUILDER
// =======================================================================
function renderSquad() {
  const squadPayload = state.data.squad || {};
  const players = getPlayersList();
  const currentFormation = FORMATIONS[state.selectedFormation] || FORMATIONS["4-3-3"];
  const syncDate = squadPayload.syncedAt ? new Date(squadPayload.syncedAt) : state.lastUpdated;
  const syncDateFormatted = syncDate ? new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" }).format(syncDate) : "Live";

  // Calculate Starting XI stats
  const assignedPlayers = currentFormation.positions
    .map((pos) => getPlayerById(state.lineup[pos.id]))
    .filter(Boolean);

  const avgRating = assignedPlayers.length
    ? (assignedPlayers.reduce((sum, p) => sum + (p.stats?.rating || 7.5), 0) / assignedPlayers.length).toFixed(1)
    : "—";

  const totalGoals = assignedPlayers.reduce((sum, p) => sum + (p.stats?.goals || 0), 0);
  const totalApps = assignedPlayers.reduce((sum, p) => sum + (p.stats?.appearances || 0), 0);

  // Attack, Midfield, Defence ratings
  const fwds = assignedPlayers.filter((p) => p.category === "FWD");
  const mids = assignedPlayers.filter((p) => p.category === "MID");
  const defs = assignedPlayers.filter((p) => p.category === "DEF" || p.category === "GK");

  const atkScore = fwds.length ? Math.round(fwds.reduce((s, p) => s + (p.attributes?.shooting || 75), 0) / fwds.length) : 75;
  const midScore = mids.length ? Math.round(mids.reduce((s, p) => s + (p.attributes?.passing || 75), 0) / mids.length) : 76;
  const defScore = defs.length ? Math.round(defs.reduce((s, p) => s + (p.attributes?.defending || 75), 0) / defs.length) : 78;

  return `
    <div class="space-y-5">
      <!-- Section Header -->
      <div class="flex items-center justify-between">
        <div>
          <span class="text-[10px] font-bold uppercase tracking-[.2em] text-gold">Matchday Tactical Lab</span>
          <h2 class="display text-2xl font-bold tracking-tight text-white">Squad & XI Builder</h2>
        </div>
        <div class="flex items-center gap-1.5 rounded-xl bg-[#15251E] p-1 border border-charcoal-border">
          <button data-squad-tab="builder" class="rounded-lg px-3 py-1 text-xs font-bold transition ${state.squadSubTab === "builder" ? "bg-gold text-charcoal" : "text-[#AAB8AE] hover:text-white"}">
            Tactical XI
          </button>
          <button data-squad-tab="roster" class="rounded-lg px-3 py-1 text-xs font-bold transition ${state.squadSubTab === "roster" ? "bg-gold text-charcoal" : "text-[#AAB8AE] hover:text-white"}">
            Players (${players.length})
          </button>
        </div>
      </div>

      <!-- Live Web Data Sync Indicator -->
      <div class="flex items-center justify-between rounded-xl border border-emerald-500/25 bg-emerald-950/20 px-3.5 py-2 text-xs text-white">
        <div class="flex items-center gap-2">
          <span class="flex h-2 w-2 relative">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span class="text-[11px] text-[#AAB8AE]">
            Live Web Sync: <strong class="text-emerald-300 font-semibold">${players.length} Profiles & Stats</strong> (${syncDateFormatted})
          </span>
        </div>
        <button data-refresh-all class="inline-flex items-center gap-1 text-[11px] font-bold text-gold hover:underline">
          ${icon("refresh", "h-3 w-3")} Sync Stats
        </button>
      </div>

      ${state.squadSubTab === "builder" ? renderTacticalBuilder(currentFormation, assignedPlayers, avgRating, totalGoals, totalApps, atkScore, midScore, defScore) : renderSquadRoster(players)}
    </div>
  `;
}

function renderTacticalBuilder(formation, assignedPlayers, avgRating, totalGoals, totalApps, atkScore, midScore, defScore) {
  const benchPlayers = state.bench.map(getPlayerById).filter(Boolean);

  return `
    <div class="space-y-4">
      <!-- Controls Toolbar -->
      <div class="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-charcoal-border bg-[#15251E] p-3">
        <div class="flex items-center gap-2">
          <label class="text-[10px] font-bold uppercase tracking-wider text-[#AAB8AE]">Formation:</label>
          <select data-change-formation class="rounded-xl border border-white/15 bg-charcoal px-2.5 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-gold">
            ${Object.keys(FORMATIONS).map((key) => `
              <option value="${key}" ${state.selectedFormation === key ? "selected" : ""}>${FORMATIONS[key].name}</option>
            `).join("")}
          </select>
        </div>

        <div class="flex flex-wrap items-center gap-1.5">
          <button data-load-previous-match class="inline-flex items-center gap-1 rounded-xl bg-emerald-500/20 px-2.5 py-1.5 text-xs font-bold text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition" title="Auto-populate with squad from previous match (${PREVIOUS_MATCH_SQUAD.opponent})">
            ${icon("refresh", "h-3.5 w-3.5")} Last Match XI
          </button>
          <button data-export-graphic class="inline-flex items-center gap-1 rounded-xl bg-gold px-2.5 py-1.5 text-xs font-bold text-charcoal hover:bg-gold-dark transition shadow">
            ${icon("download", "h-3.5 w-3.5")} Graphic
          </button>
          <button data-auto-pick class="inline-flex items-center gap-1 rounded-xl bg-forest px-2.5 py-1.5 text-xs font-bold text-gold border border-gold/30 hover:bg-forest-light">
            ${icon("magic", "h-3.5 w-3.5")} Best XI
          </button>
          <button data-share-squad class="inline-flex items-center gap-1 rounded-xl bg-white/10 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-white/15">
            ${icon("share", "h-3.5 w-3.5")} Text
          </button>
          <button data-reset-lineup class="inline-flex items-center gap-1 rounded-xl bg-white/5 px-2 py-1.5 text-xs font-bold text-[#AAB8AE] hover:text-rose-400" title="Reset Lineup">
            ${icon("trash", "h-3.5 w-3.5")}
          </button>
        </div>
      </div>

      <!-- Tactical Analytics Bar -->
      <div class="grid grid-cols-4 gap-2 rounded-2xl border border-charcoal-border bg-[#15251E] p-3 text-center">
        <div>
          <span class="block text-[9px] uppercase font-bold text-[#AAB8AE]">Team Rating</span>
          <strong class="display text-lg font-bold text-gold">${avgRating}</strong>
        </div>
        <div>
          <span class="block text-[9px] uppercase font-bold text-rose-300">Attack</span>
          <strong class="display text-lg font-bold text-white">${atkScore}</strong>
        </div>
        <div>
          <span class="block text-[9px] uppercase font-bold text-emerald-300">Midfield</span>
          <strong class="display text-lg font-bold text-white">${midScore}</strong>
        </div>
        <div>
          <span class="block text-[9px] uppercase font-bold text-blue-300">Defence</span>
          <strong class="display text-lg font-bold text-white">${defScore}</strong>
        </div>
      </div>

      <!-- Tactical Football Pitch -->
      <div class="relative w-full overflow-hidden rounded-3xl border-2 border-[#1E6852] pitch-board p-4 text-white shadow-2xl" style="height: 520px;">
        <!-- Pitch Markings -->
        <!-- Center circle -->
        <div class="pointer-events-none absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border pitch-line"></div>
        <div class="pointer-events-none absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/40"></div>
        <!-- Halfway line -->
        <div class="pointer-events-none absolute left-0 right-0 top-1/2 -translate-y-1/2 border-b pitch-line"></div>
        <!-- Penalty Box (Top) -->
        <div class="pointer-events-none absolute left-1/2 top-0 h-24 w-52 -translate-x-1/2 border-b border-l border-r pitch-line"></div>
        <div class="pointer-events-none absolute left-1/2 top-0 h-10 w-24 -translate-x-1/2 border-b border-l border-r pitch-line"></div>
        <!-- Penalty Box (Bottom) -->
        <div class="pointer-events-none absolute bottom-0 left-1/2 h-24 w-52 -translate-x-1/2 border-t border-l border-r pitch-line"></div>
        <div class="pointer-events-none absolute bottom-0 left-1/2 h-10 w-24 -translate-x-1/2 border-t border-l border-r pitch-line"></div>
        <div class="pointer-events-none absolute bottom-16 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-white/40"></div>

        <!-- Position Slots -->
        ${formation.positions.map((pos) => {
          const assignedId = state.lineup[pos.id];
          const player = getPlayerById(assignedId);

          return `
            <div
              class="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer text-center select-none"
              style="top: ${pos.top}%; left: ${pos.left}%;"
              data-pick-slot="${pos.id}"
              data-slot-label="${pos.label}"
              data-slot-cat="${pos.category}"
            >
              ${player ? `
                <div class="group relative flex flex-col items-center">
                  <div class="relative flex h-11 w-11 items-center justify-center rounded-full bg-[#101713] border-2 border-gold text-gold font-bold shadow-lg transition-transform group-hover:scale-110 active:scale-95">
                    <span class="text-xs">#${player.number || ""}</span>
                    <span class="absolute -right-1 -top-1 rounded-full bg-forest px-1 text-[8px] font-bold text-white border border-white/20">${player.stats?.rating || "7.5"}</span>
                  </div>
                  <div class="mt-1 rounded-md bg-[#0D1813]/90 px-1.5 py-0.5 text-[9px] font-bold text-white shadow truncate max-w-[70px] border border-white/10">
                    ${escapeHtml(player.name.split(" ").pop())}
                  </div>
                  <span class="text-[8px] font-bold uppercase text-gold/80">${pos.label}</span>
                </div>
              ` : `
                <div class="flex flex-col items-center group">
                  <div class="flex h-11 w-11 items-center justify-center rounded-full border-2 border-dashed border-white/40 bg-black/20 text-white/70 transition-transform group-hover:scale-110 group-hover:border-gold group-hover:text-gold active:scale-95 backdrop-blur-sm">
                    ${icon("plus", "h-4 w-4")}
                  </div>
                  <span class="mt-1 text-[9px] font-bold uppercase text-white/80 bg-black/40 px-1.5 py-0.5 rounded">${pos.label}</span>
                </div>
              `}
            </div>
          `;
        }).join("")}
      </div>

      <!-- Substitutes Bench (Up to 10 subs) -->
      <div class="rounded-2xl border border-charcoal-border bg-[#15251E] p-4 text-white">
        <div class="mb-3 flex items-center justify-between">
          <span class="text-[10px] font-bold uppercase tracking-wider text-gold">Substitutes Bench (${benchPlayers.length}/10)</span>
          <span class="text-[10px] text-[#AAB8AE]">Matchday squad depth (10 substitutes)</span>
        </div>

        <div class="grid grid-cols-2 gap-2 sm:grid-cols-5">
          ${Array.from({ length: 10 }).map((_, index) => {
            const player = benchPlayers[index];
            return player ? `
              <div data-bench-slot="${index}" class="cursor-pointer rounded-xl bg-white/5 p-2 text-center border border-white/10 hover:border-gold transition">
                <span class="block text-[9px] font-bold text-gold">SUB ${index + 1}</span>
                <strong class="mt-1 block truncate text-[10px] text-white">${escapeHtml(player.name.split(" ").pop())}</strong>
                <span class="text-[8px] text-[#AAB8AE]">#${player.number || "—"} · ${player.position || "SUB"}</span>
              </div>
            ` : `
              <div data-add-bench="${index}" class="cursor-pointer rounded-xl border border-dashed border-white/20 p-2 text-center text-[#AAB8AE] hover:border-gold hover:text-gold transition">
                <span class="block text-[9px] font-bold">SUB ${index + 1}</span>
                <span class="mt-1 block text-xs">+ Add</span>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    </div>
  `;
}

// =======================================================================
// RENDER: SQUAD ROSTER & FULL DATABASE
// =======================================================================
function renderSquadRoster(players) {
  // Filter by category
  let filtered = players;
  if (state.squadFilterCategory !== "ALL") {
    filtered = filtered.filter((p) => p.category === state.squadFilterCategory);
  }

  // Filter by search
  if (state.squadSearchQuery) {
    const q = state.squadSearchQuery.toLowerCase();
    filtered = filtered.filter((p) => p.name.toLowerCase().includes(q) || (p.position || "").toLowerCase().includes(q));
  }

  // Sort
  filtered = [...filtered].sort((a, b) => {
    switch (state.squadSortBy) {
      case "rating":
        return (b.stats?.rating || 0) - (a.stats?.rating || 0);
      case "apps":
        return (b.stats?.appearances || 0) - (a.stats?.appearances || 0);
      case "goals":
        return (b.stats?.goals || 0) - (a.stats?.goals || 0);
      case "number":
        return (a.number || 99) - (b.number || 99);
      case "name":
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  return `
    <div class="space-y-4">
      <!-- Search & Filters -->
      <div class="space-y-3 rounded-2xl border border-charcoal-border bg-[#15251E] p-4 text-white">
        <!-- Search bar -->
        <div class="relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-[#AAB8AE]">${icon("search", "h-4 w-4")}</span>
          <input
            type="text"
            data-squad-search
            value="${escapeHtml(state.squadSearchQuery)}"
            placeholder="Search players by name or position..."
            class="w-full rounded-xl border border-white/15 bg-charcoal py-2 pl-9 pr-3 text-xs text-white placeholder:text-[#AAB8AE] focus:border-gold focus:outline-none"
          />
        </div>

        <!-- Category Pills & Sort -->
        <div class="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div class="flex flex-wrap gap-1">
            ${["ALL", "GK", "DEF", "MID", "FWD"].map((cat) => `
              <button data-filter-cat="${cat}" class="rounded-lg px-2.5 py-1 text-xs font-bold transition ${state.squadFilterCategory === cat ? "bg-gold text-charcoal" : "bg-white/5 text-[#AAB8AE] hover:bg-white/10"}">
                ${cat === "ALL" ? "All" : cat}
              </button>
            `).join("")}
          </div>

          <div class="flex items-center gap-1.5">
            <span class="text-[10px] uppercase text-[#AAB8AE]">Sort:</span>
            <select data-sort-squad class="rounded-lg border border-white/15 bg-charcoal px-2 py-1 text-xs text-white focus:outline-none">
              <option value="rating" ${state.squadSortBy === "rating" ? "selected" : ""}>Rating</option>
              <option value="apps" ${state.squadSortBy === "apps" ? "selected" : ""}>Apps</option>
              <option value="goals" ${state.squadSortBy === "goals" ? "selected" : ""}>Goals</option>
              <option value="number" ${state.squadSortBy === "number" ? "selected" : ""}>Squad #</option>
              <option value="name" ${state.squadSortBy === "name" ? "selected" : ""}>Name</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Player Cards Grid -->
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        ${filtered.map((player) => {
          const stats = player.stats || {};
          const attrs = player.attributes || {};
          const isAssigned = Object.values(state.lineup).includes(player.id);
          const isBench = state.bench.includes(player.id);

          return `
            <article class="group rounded-2xl border border-charcoal-border bg-[#15251E] p-4 text-white shadow-lg transition hover:border-gold/50">
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-3">
                  <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-dark border border-gold/40 text-sm font-bold text-gold">
                    #${player.number || "—"}
                  </span>
                  <div>
                    <h3 class="display text-base font-bold text-white group-hover:text-gold transition">${escapeHtml(player.name)}</h3>
                    <div class="flex items-center gap-1.5 mt-0.5">
                      <span class="rounded px-1.5 py-0.5 text-[9px] font-bold ${posBadgeClass(player.category)}">${player.position}</span>
                      <span class="text-[10px] text-[#AAB8AE]">${player.height || ""} · ${player.preferredFoot ? `${player.preferredFoot} Foot` : ""}</span>
                    </div>
                  </div>
                </div>
                <div class="text-right">
                  <span class="display text-lg font-bold text-gold">${stats.rating || "7.5"}</span>
                  <span class="block text-[8px] uppercase tracking-wider text-[#AAB8AE]">Rating</span>
                </div>
              </div>

              <!-- Form & Status Row -->
              <div class="mt-2.5 flex items-center justify-between rounded-lg bg-black/30 px-2.5 py-1.5 text-[10px]">
                <span class="flex items-center gap-1 text-gold font-bold">
                  ${icon("flame", "h-3 w-3 text-gold")} Form: ${(stats.rating || 7.5).toFixed(1)}
                </span>
                <span class="flex items-center gap-1 text-emerald-400 font-medium">
                  🟢 ${player.fitness || "Match Fit"}
                </span>
                <span class="flex items-center gap-1 text-amber-300 font-medium">
                  🟨 ${player.yellowCards || Math.floor((player.number || 3) % 4)}/5 Cards
                </span>
              </div>

              <!-- Key Stats Row -->
              <div class="my-2.5 grid grid-cols-4 gap-1.5 rounded-xl bg-black/20 p-2 text-center text-xs">
                <div>
                  <span class="block text-[9px] uppercase text-[#AAB8AE]">Apps</span>
                  <strong class="font-bold">${stats.appearances || 0}</strong>
                </div>
                <div>
                  <span class="block text-[9px] uppercase text-[#AAB8AE]">Goals</span>
                  <strong class="font-bold text-emerald-400">${stats.goals || 0}</strong>
                </div>
                <div>
                  <span class="block text-[9px] uppercase text-[#AAB8AE]">Assists</span>
                  <strong class="font-bold">${stats.assists || 0}</strong>
                </div>
                <div>
                  <span class="block text-[9px] uppercase text-[#AAB8AE]">Clean S.</span>
                  <strong class="font-bold text-blue-400">${stats.cleanSheets || 0}</strong>
                </div>
              </div>

              <!-- Radar Stat Bars -->
              <div class="grid grid-cols-3 gap-x-3 gap-y-1.5 text-[10px] text-[#AAB8AE]">
                <div>
                  <div class="flex justify-between"><span>PAC</span><span class="font-bold text-white">${attrs.pace || 70}</span></div>
                  <div class="h-1 rounded-full bg-white/10 overflow-hidden"><div class="h-full bg-gold rounded-full" style="width: ${attrs.pace || 70}%"></div></div>
                </div>
                <div>
                  <div class="flex justify-between"><span>SHO</span><span class="font-bold text-white">${attrs.shooting || 70}</span></div>
                  <div class="h-1 rounded-full bg-white/10 overflow-hidden"><div class="h-full bg-rose-400 rounded-full" style="width: ${attrs.shooting || 70}%"></div></div>
                </div>
                <div>
                  <div class="flex justify-between"><span>PAS</span><span class="font-bold text-white">${attrs.passing || 70}</span></div>
                  <div class="h-1 rounded-full bg-white/10 overflow-hidden"><div class="h-full bg-emerald-400 rounded-full" style="width: ${attrs.passing || 70}%"></div></div>
                </div>
                <div>
                  <div class="flex justify-between"><span>DRI</span><span class="font-bold text-white">${attrs.dribbling || 70}</span></div>
                  <div class="h-1 rounded-full bg-white/10 overflow-hidden"><div class="h-full bg-amber-400 rounded-full" style="width: ${attrs.dribbling || 70}%"></div></div>
                </div>
                <div>
                  <div class="flex justify-between"><span>DEF</span><span class="font-bold text-white">${attrs.defending || 70}</span></div>
                  <div class="h-1 rounded-full bg-white/10 overflow-hidden"><div class="h-full bg-blue-400 rounded-full" style="width: ${attrs.defending || 70}%"></div></div>
                </div>
                <div>
                  <div class="flex justify-between"><span>PHY</span><span class="font-bold text-white">${attrs.physical || 70}</span></div>
                  <div class="h-1 rounded-full bg-white/10 overflow-hidden"><div class="h-full bg-purple-400 rounded-full" style="width: ${attrs.physical || 70}%"></div></div>
                </div>
              </div>

              <!-- Card Actions -->
              <div class="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
                <button data-open-player="${player.id}" class="inline-flex items-center gap-1 text-xs font-bold text-gold hover:underline">
                  ${icon("info", "h-3.5 w-3.5")} Full Profile
                </button>
                <div class="flex items-center gap-1.5">
                  ${isAssigned ? '<span class="rounded bg-gold/20 px-2 py-0.5 text-[9px] font-bold text-gold">In XI</span>' : ""}
                  ${isBench ? '<span class="rounded bg-white/10 px-2 py-0.5 text-[9px] font-bold text-white">On Bench</span>' : ""}
                </div>
              </div>
            </article>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

// =======================================================================
// RENDER: TAB 3 — FIXTURES & RESULTS
// =======================================================================
function renderFixtures() {
  const fixtures = state.data.fixtures || [];
  if (!fixtures.length) {
    return `
      <div class="rounded-2xl border border-charcoal-border bg-[#15251E] p-8 text-center text-white">
        <p class="text-sm text-[#AAB8AE]">No fixtures currently available.</p>
      </div>
    `;
  }

  let filtered = fixtures;
  if (state.fixtureFilter === "UPCOMING") {
    filtered = fixtures.filter((f) => !completed(f));
  } else if (state.fixtureFilter === "RESULTS") {
    filtered = fixtures.filter((f) => completed(f)).reverse();
  } else if (state.fixtureFilter === "HOME") {
    filtered = fixtures.filter((f) => isHomeFixture(f));
  }

  return `
    <div class="space-y-5">
      <!-- Section Header -->
      <div class="flex items-center justify-between">
        <div>
          <span class="text-[10px] font-bold uppercase tracking-[.2em] text-gold">Season Schedule</span>
          <h2 class="display text-2xl font-bold tracking-tight text-white">Fixtures & Results</h2>
        </div>
        <a href="${TICKETING_URL}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 rounded-xl bg-gold px-3 py-1.5 text-xs font-bold text-charcoal hover:bg-gold-dark">
          ${icon("ticket", "h-3.5 w-3.5")} Tickets
        </a>
      </div>

      <!-- Filter Tabs -->
      <div class="flex flex-wrap gap-1 rounded-2xl border border-charcoal-border bg-[#15251E] p-1.5">
        ${[
          { id: "ALL", label: `All (${fixtures.length})` },
          { id: "UPCOMING", label: "Upcoming" },
          { id: "RESULTS", label: "Results" },
          { id: "HOME", label: "Home Only" },
        ].map((f) => `
          <button data-fixture-filter="${f.id}" class="rounded-xl px-3 py-1.5 text-xs font-bold transition ${state.fixtureFilter === f.id ? "bg-gold text-charcoal" : "text-[#AAB8AE] hover:text-white"}">
            ${f.label}
          </button>
        `).join("")}
      </div>

      <!-- Fixtures List -->
      <div class="space-y-3">
        ${filtered.map((fixture) => {
          const isDone = completed(fixture);
          const isHome = isHomeFixture(fixture);
          const dateParts = fixtureDateParts(fixture.date);

          return `
            <article class="rounded-2xl border ${isHome ? "border-gold/30 bg-[#15251E]" : "border-charcoal-border bg-[#15251E]"} p-4 text-white shadow-md">
              <div class="flex items-center gap-3 sm:gap-4">
                <!-- Date badge -->
                <div class="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl ${isHome ? "bg-gold text-charcoal" : "bg-forest text-gold"} font-bold">
                  <span class="text-[8px] uppercase tracking-wider">${escapeHtml(dateParts.day)}</span>
                  <span class="display text-xs leading-none mt-0.5">${escapeHtml(dateParts.date)}</span>
                </div>

                <!-- Match Details -->
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#AAB8AE]">
                    <span class="${isHome ? "text-gold" : "text-white"}">${isHome ? "Home" : "Away"}</span>
                    <span>·</span>
                    <span class="truncate">${escapeHtml(fixture.competition || "NPL West")}</span>
                  </div>
                  <h3 class="display text-sm font-bold text-white truncate sm:text-base">${escapeHtml(fixture.opponent)}</h3>
                </div>

                <!-- Score / Time -->
                <div class="shrink-0 text-right">
                  <span class="display block text-sm font-bold ${isDone ? "text-gold" : "text-white"}">${escapeHtml(fixture.scoreOrStatus)}</span>
                  <span class="text-[9px] uppercase tracking-wider text-[#AAB8AE]">${isDone ? "Full Time" : "Kick-off"}</span>
                </div>
              </div>

              <!-- Action Bar -->
              <div class="mt-3 flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
                ${!isDone ? `
                  <a href="${getTicketUrl(fixture)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 rounded-lg ${isHome ? "bg-gold text-charcoal hover:bg-gold-dark" : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30"} px-2.5 py-1 text-[11px] font-bold transition">
                    ${icon("ticket", "h-3 w-3")} ${isHome ? "Match Tickets" : "Away Tickets & Admission"}
                  </a>
                ` : `
                  <a href="https://www.youtube.com/results?search_query=Nantwich+Town+vs+${encodeURIComponent(fixture.opponent)}+highlights+The+Dabbers+TV" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2.5 py-1 text-[11px] font-bold hover:bg-rose-500/30 transition">
                    ${icon("youtube", "h-3 w-3 text-rose-400")} Watch Highlights
                  </a>
                `}
                <button data-open-h2h="${escapeHtml(fixture.opponent)}" class="inline-flex items-center gap-1 rounded-lg border border-gold/40 bg-gold/10 px-2.5 py-1 text-[11px] font-bold text-gold hover:bg-gold/20 transition">
                  ${icon("shield", "h-3 w-3")} H2H & Past Clashes
                </button>
                <a href="${mapsDirectionsUrl(fixture)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-[#D5E8D9] hover:bg-white/10">
                  ${icon("mapPin", "h-3 w-3")} Directions
                </a>
                ${!isDone ? `
                  <a href="${googleCalendarUrl(fixture)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-[#D5E8D9] hover:bg-white/10">
                    ${icon("calendarPlus", "h-3 w-3")} Add to Calendar
                  </a>
                ` : ""}
              </div>

              ${fixture.notesAndScorers ? `
                <div class="mt-2.5 rounded-lg bg-black/20 px-2.5 py-1.5 text-[11px] text-[#C2D6C6]">
                  <span class="font-bold text-gold">Match Notes:</span> ${escapeHtml(fixture.notesAndScorers)}
                </div>
              ` : ""}
            </article>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

// =======================================================================
// RENDER: TAB 4 — LEAGUE TABLE
// =======================================================================
function renderTable() {
  const rows = state.data.table || [];
  if (!rows.length) {
    return `
      <div class="rounded-2xl border border-charcoal-border bg-[#15251E] p-8 text-center text-white">
        <p class="text-sm text-[#AAB8AE]">No league table data available.</p>
      </div>
    `;
  }

  return `
    <div class="space-y-5">
      <!-- Section Header -->
      <div class="flex items-center justify-between">
        <div>
          <span class="text-[10px] font-bold uppercase tracking-[.2em] text-gold">NPL West Division</span>
          <h2 class="display text-2xl font-bold tracking-tight text-white">League Standings</h2>
        </div>
        <span class="rounded-full bg-forest px-3 py-1 text-xs font-bold text-gold border border-gold/30">
          ${rows.length} Teams
        </span>
      </div>

      <!-- League Table Table -->
      <div class="overflow-hidden rounded-2xl border border-charcoal-border bg-[#15251E] shadow-xl text-white">
        <!-- Table Header -->
        <div class="grid grid-cols-[2.2rem_1fr_2.5rem_2.5rem_2.8rem] items-center gap-1 border-b border-charcoal-border bg-forest-dark px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-gold sm:grid-cols-[3rem_1fr_4rem_4rem_4rem] sm:px-4">
          <span>Pos</span>
          <span>Club</span>
          <span class="text-center">Pld</span>
          <span class="text-center">GD</span>
          <span class="text-center">Pts</span>
        </div>

        <!-- Table Rows -->
        ${rows.map((row) => {
          const isDabbers = row.team.toLowerCase().includes("nantwich");
          const pos = numeric(row.position);

          let zoneClass = "";
          if (pos === 1) zoneClass = "border-l-4 border-l-emerald-400";
          else if (pos <= 5) zoneClass = "border-l-4 border-l-blue-400";
          else if (pos >= rows.length - 2) zoneClass = "border-l-4 border-l-rose-500";

          return `
            <div class="grid grid-cols-[2.2rem_1fr_2.5rem_2.5rem_2.8rem] items-center gap-1 border-b border-white/5 px-3 py-3 text-xs last:border-0 sm:grid-cols-[3rem_1fr_4rem_4rem_4rem] sm:px-4 ${zoneClass} ${isDabbers ? "bg-forest/80 font-bold text-gold" : "text-[#D5E8D9]"}">
              <span class="font-bold ${isDabbers ? "text-gold" : "text-white"}">${escapeHtml(row.position)}</span>
              <span class="truncate font-semibold ${isDabbers ? "text-gold" : "text-white"}">
                ${escapeHtml(row.team)}
                ${isDabbers ? '<span class="ml-1.5 rounded bg-gold px-1 py-0.5 text-[9px] font-bold uppercase text-charcoal">US</span>' : ""}
              </span>
              <span class="text-center font-medium">${escapeHtml(row.played)}</span>
              <span class="text-center font-medium">${escapeHtml(row.goalDifference)}</span>
              <span class="text-center font-bold ${isDabbers ? "text-gold" : "text-white"}">${escapeHtml(row.points)}</span>
            </div>
          `;
        }).join("")}
      </div>

      <!-- League Legend -->
      <div class="flex flex-wrap items-center gap-3 rounded-xl bg-[#15251E] p-3 text-[11px] text-[#AAB8AE] border border-charcoal-border">
        <span class="flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-full bg-emerald-400"></span> 1st: Auto Promotion</span>
        <span class="flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-full bg-blue-400"></span> 2nd–5th: Play-offs</span>
        <span class="flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-full bg-rose-500"></span> Relegation zone</span>
      </div>
    </div>
  `;
}

// =======================================================================
// RENDER: EXTENDED MODALS (H2H, STADIUM GUIDE, GRAPHIC EXPORT)
// =======================================================================
function renderH2HModal() {
  if (state.activeModal !== "h2h_preview" || !state.activeH2HOpponent) return "";
  const h2h = state.activeH2HData;

  return `
    <div class="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm" data-close-modal>
      <div class="w-full max-w-lg rounded-t-3xl border-t border-gold/40 bg-[#0F1A15] p-6 text-white shadow-2xl animate-slide-up max-h-[85vh] overflow-y-auto" onclick="event.stopPropagation()">
        <div class="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <span class="text-[10px] font-bold uppercase tracking-wider text-gold">Head-to-Head Record</span>
            <h3 class="display text-xl font-bold">Nantwich Town vs ${escapeHtml(state.activeH2HOpponent)}</h3>
          </div>
          <button data-close-modal class="rounded-full bg-white/10 p-1.5 text-white hover:bg-white/20">
            ${icon("close", "h-4 w-4")}
          </button>
        </div>

        ${h2h ? `
          <div class="mt-4 space-y-4">
            <!-- Record Summary Counters -->
            <div class="grid grid-cols-4 gap-2 text-center text-xs">
              <div class="rounded-xl bg-forest p-3">
                <span class="block text-[9px] uppercase text-gold">Total Pld</span>
                <strong class="display text-lg font-bold text-white">${h2h.played}</strong>
              </div>
              <div class="rounded-xl bg-emerald-500/20 p-3 border border-emerald-500/30">
                <span class="block text-[9px] uppercase text-emerald-300">Dabbers Wins</span>
                <strong class="display text-lg font-bold text-emerald-300">${h2h.nantwichWins}</strong>
              </div>
              <div class="rounded-xl bg-white/5 p-3 border border-white/10">
                <span class="block text-[9px] uppercase text-[#AAB8AE]">Draws</span>
                <strong class="display text-lg font-bold text-white">${h2h.draws}</strong>
              </div>
              <div class="rounded-xl bg-rose-500/20 p-3 border border-rose-500/30">
                <span class="block text-[9px] uppercase text-rose-300">Opponent Wins</span>
                <strong class="display text-lg font-bold text-rose-300">${h2h.opponentWins}</strong>
              </div>
            </div>

            <!-- Goals Summary -->
            <div class="rounded-xl bg-black/30 p-3 text-center text-xs flex justify-around">
              <div>
                <span class="text-[#AAB8AE] block text-[9px] uppercase">Dabbers Goals Scored</span>
                <strong class="display text-base font-bold text-gold">${h2h.goalsFor}</strong>
              </div>
              <div class="border-r border-white/10"></div>
              <div>
                <span class="text-[#AAB8AE] block text-[9px] uppercase">Goals Conceded</span>
                <strong class="display text-base font-bold text-white">${h2h.goalsAgainst}</strong>
              </div>
            </div>

            <!-- Recent Encounters -->
            <div>
              <span class="text-[10px] font-bold uppercase tracking-wider text-gold mb-2 block">Recent Encounters & Highlights</span>
              <div class="space-y-2">
                ${(h2h.recentMatches || []).map((m) => {
                  let badge = '<span class="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-bold text-white">D</span>';
                  if (m.result === "W") badge = '<span class="rounded bg-emerald-500 px-1.5 py-0.5 text-[9px] font-bold text-charcoal">W</span>';
                  else if (m.result === "L") badge = '<span class="rounded bg-rose-500 px-1.5 py-0.5 text-[9px] font-bold text-white">L</span>';

                  const hlUrl = m.highlightsUrl || `https://www.youtube.com/results?search_query=Nantwich+Town+vs+${encodeURIComponent(state.activeH2HOpponent)}+${encodeURIComponent(m.date || "")}+highlights+The+Dabbers+TV`;

                  return `
                    <div class="flex items-center justify-between rounded-xl bg-white/5 p-2.5 text-xs">
                      <div class="flex items-center gap-2">
                        ${badge}
                        <div>
                          <strong class="text-white">${escapeHtml(m.venue)}</strong>
                          <span class="text-[10px] text-[#AAB8AE] ml-1.5">${escapeHtml(m.date)}</span>
                        </div>
                      </div>
                      <div class="flex items-center gap-2">
                        <span class="display font-bold text-gold">${escapeHtml(m.score)}</span>
                        <a href="${hlUrl}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 rounded-lg bg-rose-500/20 border border-rose-500/30 px-2 py-0.5 text-[10px] font-bold text-rose-300 hover:bg-rose-500/30 transition">
                          ${icon("youtube", "h-2.5 w-2.5")} Highlights
                        </a>
                      </div>
                    </div>
                  `;
                }).join("")}
              </div>
            </div>

            <!-- YouTube Highlights Link for Encounter -->
            <a href="https://www.youtube.com/results?search_query=Nantwich+Town+vs+${encodeURIComponent(state.activeH2HOpponent)}+highlights+The+Dabbers+TV" target="_blank" rel="noopener noreferrer" class="flex items-center justify-center gap-1.5 w-full rounded-xl bg-rose-500/20 border border-rose-500/30 py-2.5 text-xs font-bold text-rose-300 hover:bg-rose-500/30 transition">
              ${icon("youtube", "h-4 w-4 text-rose-400")} Search All Highlights vs ${escapeHtml(state.activeH2HOpponent)} on YouTube
            </a>

            <!-- Historical Trivia -->
            <div class="rounded-xl bg-gold/10 p-3 border border-gold/30 text-xs">
              <span class="block text-[10px] font-bold uppercase tracking-wider text-gold mb-1">Matchday Fact</span>
              <p class="text-[#D5E8D9]">${escapeHtml(h2h.trivia || "High-intensity rivalry in the NPL West Division.")}</p>
            </div>
          </div>
        ` : `
          <div class="p-8 text-center text-xs text-[#AAB8AE]">Loading head-to-head statistics...</div>
        `}
      </div>
    </div>
  `;
}

function renderStadiumGuideModal() {
  if (state.activeModal !== "stadium_guide") return "";
  const guide = window.DabbersStadiumGuide || {};

  return `
    <div class="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm" data-close-modal>
      <div class="w-full max-w-lg rounded-t-3xl border-t border-gold/40 bg-[#0F1A15] p-6 text-white shadow-2xl animate-slide-up max-h-[85vh] overflow-y-auto" onclick="event.stopPropagation()">
        <div class="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <span class="text-[10px] font-bold uppercase tracking-wider text-gold">Matchday Visitors Hub</span>
            <h3 class="display text-xl font-bold">The Swansway Stadium Guide</h3>
          </div>
          <button data-close-modal class="rounded-full bg-white/10 p-1.5 text-white hover:bg-white/20">
            ${icon("close", "h-4 w-4")}
          </button>
        </div>

        <div class="mt-4 space-y-4">
          <!-- Stadium Admission Pricing Table -->
          <div>
            <span class="text-[10px] font-bold uppercase tracking-wider text-gold mb-2 block">Matchday Admission & Turnstiles</span>
            <div class="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
              ${(guide.pricing || []).map((p) => `
                <div class="rounded-xl bg-forest p-2.5 text-center">
                  <span class="block text-[9px] uppercase text-gold">${escapeHtml(p.cat)}</span>
                  <strong class="display text-base font-bold text-white">${escapeHtml(p.price)}</strong>
                  <span class="block text-[8px] text-[#AAB8AE]">${escapeHtml(p.info)}</span>
                </div>
              `).join("")}
            </div>
          </div>

          <!-- Turnstiles & Gates -->
          <div>
            <span class="text-[10px] font-bold uppercase tracking-wider text-gold mb-2 block">Turnstiles & Entry Points</span>
            <div class="space-y-2">
              ${(guide.turnstiles || []).map((t) => `
                <div class="rounded-xl border border-white/10 bg-white/5 p-3 text-xs">
                  <div class="flex items-center justify-between">
                    <strong class="text-gold font-bold">${escapeHtml(t.name)}</strong>
                    <span class="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[8px] font-bold text-emerald-300">Contactless / Cash</span>
                  </div>
                  <p class="mt-1 text-[11px] text-[#D5E8D9]">${escapeHtml(t.desc)}</p>
                </div>
              `).join("")}
            </div>
          </div>

          <!-- Ground Facilities & Bar -->
          <div>
            <span class="text-[10px] font-bold uppercase tracking-wider text-gold mb-2 block">Matchday Amenities & Refreshments</span>
            <div class="space-y-2">
              ${(guide.facilities || []).map((f) => `
                <div class="rounded-xl bg-black/20 p-3 text-xs">
                  <strong class="text-white block font-bold">${escapeHtml(f.title)}</strong>
                  <p class="mt-0.5 text-[11px] text-[#AAB8AE]">${escapeHtml(f.desc)}</p>
                </div>
              `).join("")}
            </div>
          </div>

          <!-- Directions Action -->
          <div class="pt-2">
            <a href="https://www.google.com/maps/dir/?api=1&destination=Swansway+Stadium+Nantwich+Town+FC+Water+Lode+CW5+5BS" target="_blank" rel="noopener noreferrer" class="flex items-center justify-center gap-1.5 w-full rounded-xl bg-gold py-2.5 text-xs font-bold text-charcoal hover:bg-gold-dark transition">
              ${icon("mapPin", "h-4 w-4")} Open GPS Navigation to Stadium
            </a>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderGraphicExportModal() {
  if (state.activeModal !== "graphic_export" || !state.graphicDataUrl) return "";

  return `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4" data-close-modal>
      <div class="w-full max-w-md rounded-3xl border border-gold/40 bg-[#0F1A15] p-5 text-white shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
        <div class="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <span class="text-[10px] font-bold uppercase tracking-wider text-gold">Matchday Graphic</span>
            <h3 class="display text-lg font-bold">Starting XI Social Poster</h3>
          </div>
          <button data-close-modal class="rounded-full bg-white/10 p-1.5 text-white hover:bg-white/20">
            ${icon("close", "h-4 w-4")}
          </button>
        </div>

        <div class="my-4 overflow-hidden rounded-2xl border border-gold/30 shadow-2xl">
          <img src="${state.graphicDataUrl}" alt="Nantwich Town FC Starting XI Graphic" class="w-full object-contain" />
        </div>

        <div class="flex gap-2">
          <a href="${state.graphicDataUrl}" download="NantwichTownFC_StartingXI.png" class="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gold py-2.5 text-xs font-bold text-charcoal hover:bg-gold-dark transition">
            ${icon("download", "h-4 w-4")} Download Image (PNG)
          </a>
          <button data-share-image class="rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/20 transition">
            ${icon("share", "h-4 w-4")}
          </button>
        </div>
      </div>
    </div>
  `;
}

// =======================================================================
// RENDER: MODAL BOTTOM-SHEETS
// =======================================================================
function renderPositionPickerModal() {
  if (state.activeModal !== "pos_picker" || !state.activePickingSlot) return "";
  const { posId, label, category } = state.activePickingSlot;
  const players = getPlayersList();

  // Filter players compatible with this position or matching category
  const filtered = players.filter((p) => {
    if (category === "GK") return p.category === "GK";
    if (category === "DEF") return p.category === "DEF" || p.position === label;
    if (category === "MID") return p.category === "MID" || p.position === label;
    if (category === "FWD") return p.category === "FWD" || p.position === label;
    return true;
  });

  return `
    <div class="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm" data-close-modal>
      <div class="w-full max-w-lg rounded-t-3xl border-t border-gold/40 bg-[#0F1A15] p-5 text-white shadow-2xl animate-slide-up max-h-[85vh] overflow-y-auto" onclick="event.stopPropagation()">
        <div class="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <span class="text-[10px] font-bold uppercase tracking-wider text-gold">Assign Position</span>
            <h3 class="display text-lg font-bold">Select Player for ${escapeHtml(label)}</h3>
          </div>
          <button data-close-modal class="rounded-full bg-white/10 p-1.5 text-white hover:bg-white/20">
            ${icon("close", "h-4 w-4")}
          </button>
        </div>

        <div class="mt-4 space-y-2">
          ${filtered.map((player) => {
            const isSelected = state.lineup[posId] === player.id;

            return `
              <div
                data-select-player-slot="${player.id}"
                class="flex cursor-pointer items-center justify-between rounded-xl border p-3 transition ${isSelected ? "border-gold bg-gold/20" : "border-white/10 bg-white/5 hover:border-gold/50"}"
              >
                <div class="flex items-center gap-3">
                  <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-forest text-xs font-bold text-gold">
                    #${player.number || ""}
                  </span>
                  <div>
                    <h4 class="text-sm font-bold text-white">${escapeHtml(player.name)}</h4>
                    <span class="text-[10px] text-[#AAB8AE]">${player.position} · Rating: ${player.stats?.rating || "7.5"}</span>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs text-[#AAB8AE]">${player.stats?.appearances || 0} apps</span>
                  <button class="rounded-lg bg-gold px-3 py-1 text-xs font-bold text-charcoal">
                    ${isSelected ? "Remove" : "Pick"}
                  </button>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    </div>
  `;
}

function renderPlayerProfileModal() {
  if (state.activeModal !== "player_profile" || !state.activePlayerModalId) return "";
  const player = getPlayerById(state.activePlayerModalId);
  if (!player) return "";

  const stats = player.stats || {};
  const attrs = player.attributes || {};

  return `
    <div class="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm" data-close-modal>
      <div class="w-full max-w-lg rounded-t-3xl border-t border-gold/40 bg-[#0F1A15] p-6 text-white shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
        <!-- Header -->
        <div class="flex items-start justify-between border-b border-white/10 pb-4">
          <div class="flex items-center gap-3">
            <span class="flex h-12 w-12 items-center justify-center rounded-2xl bg-forest border-2 border-gold text-lg font-bold text-gold">
              #${player.number || "—"}
            </span>
            <div>
              <h3 class="display text-xl font-bold text-white">${escapeHtml(player.name)}</h3>
              <div class="flex items-center gap-2 mt-1">
                <span class="rounded px-2 py-0.5 text-[10px] font-bold ${posBadgeClass(player.category)}">${player.position}</span>
                <span class="text-xs text-[#AAB8AE]">${player.categoryName}</span>
              </div>
            </div>
          </div>
          <button data-close-modal class="rounded-full bg-white/10 p-1.5 text-white hover:bg-white/20">
            ${icon("close", "h-4 w-4")}
          </button>
        </div>

        <!-- Bio & Overview -->
        <div class="my-4">
          <p class="text-xs leading-relaxed text-[#D5E8D9]">${escapeHtml(player.bio || "First-team squad member at Nantwich Town FC.")}</p>
        </div>

        <!-- Physical & Profile Details -->
        <div class="grid grid-cols-3 gap-2 rounded-xl bg-white/5 p-3 text-center text-xs">
          <div>
            <span class="block text-[9px] uppercase text-[#AAB8AE]">Height</span>
            <strong class="font-bold text-white">${player.height || "5'11\""}</strong>
          </div>
          <div>
            <span class="block text-[9px] uppercase text-[#AAB8AE]">Preferred Foot</span>
            <strong class="font-bold text-white">${player.preferredFoot || "Right"}</strong>
          </div>
          <div>
            <span class="block text-[9px] uppercase text-[#AAB8AE]">Joined</span>
            <strong class="font-bold text-white">${player.joined || "2024"}</strong>
          </div>
        </div>

        <!-- Season Stats Grid -->
        <div class="mt-4">
          <span class="text-[10px] font-bold uppercase tracking-wider text-gold">Season Match Stats</span>
          <div class="mt-2 grid grid-cols-4 gap-2 text-center text-xs">
            <div class="rounded-xl bg-forest p-2.5">
              <span class="block text-[9px] uppercase text-gold">Appearances</span>
              <strong class="display text-base font-bold">${stats.appearances || 0}</strong>
            </div>
            <div class="rounded-xl bg-forest p-2.5">
              <span class="block text-[9px] uppercase text-emerald-300">Goals</span>
              <strong class="display text-base font-bold text-emerald-300">${stats.goals || 0}</strong>
            </div>
            <div class="rounded-xl bg-forest p-2.5">
              <span class="block text-[9px] uppercase text-blue-300">Assists</span>
              <strong class="display text-base font-bold text-blue-300">${stats.assists || 0}</strong>
            </div>
            <div class="rounded-xl bg-forest p-2.5">
              <span class="block text-[9px] uppercase text-amber-300">Rating</span>
              <strong class="display text-base font-bold text-amber-300">${stats.rating || "7.5"}</strong>
            </div>
          </div>
        </div>

        <!-- Full Attribute Radar/Bars -->
        <div class="mt-4">
          <span class="text-[10px] font-bold uppercase tracking-wider text-gold">Player Ratings & Attributes</span>
          <div class="mt-2 grid grid-cols-2 gap-3 text-xs">
            <div>
              <div class="flex justify-between text-[#AAB8AE]"><span>Pace</span><strong class="text-white">${attrs.pace || 70}</strong></div>
              <div class="h-1.5 rounded-full bg-white/10 overflow-hidden mt-1"><div class="h-full bg-gold rounded-full" style="width: ${attrs.pace || 70}%"></div></div>
            </div>
            <div>
              <div class="flex justify-between text-[#AAB8AE]"><span>Shooting</span><strong class="text-white">${attrs.shooting || 70}</strong></div>
              <div class="h-1.5 rounded-full bg-white/10 overflow-hidden mt-1"><div class="h-full bg-rose-400 rounded-full" style="width: ${attrs.shooting || 70}%"></div></div>
            </div>
            <div>
              <div class="flex justify-between text-[#AAB8AE]"><span>Passing</span><strong class="text-white">${attrs.passing || 70}</strong></div>
              <div class="h-1.5 rounded-full bg-white/10 overflow-hidden mt-1"><div class="h-full bg-emerald-400 rounded-full" style="width: ${attrs.passing || 70}%"></div></div>
            </div>
            <div>
              <div class="flex justify-between text-[#AAB8AE]"><span>Dribbling</span><strong class="text-white">${attrs.dribbling || 70}</strong></div>
              <div class="h-1.5 rounded-full bg-white/10 overflow-hidden mt-1"><div class="h-full bg-amber-400 rounded-full" style="width: ${attrs.dribbling || 70}%"></div></div>
            </div>
            <div>
              <div class="flex justify-between text-[#AAB8AE]"><span>Defending</span><strong class="text-white">${attrs.defending || 70}</strong></div>
              <div class="h-1.5 rounded-full bg-white/10 overflow-hidden mt-1"><div class="h-full bg-blue-400 rounded-full" style="width: ${attrs.defending || 70}%"></div></div>
            </div>
            <div>
              <div class="flex justify-between text-[#AAB8AE]"><span>Physicality</span><strong class="text-white">${attrs.physical || 70}</strong></div>
              <div class="h-1.5 rounded-full bg-white/10 overflow-hidden mt-1"><div class="h-full bg-purple-400 rounded-full" style="width: ${attrs.physical || 70}%"></div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// =======================================================================
// SQUAD BUILDER ACTIONS
// =======================================================================
function loadPreviousMatchSquadAction(silent = false) {
  const formationKey = state.selectedFormation || "4-3-3";
  state.lineup = { ...getPreviousMatchLineup(formationKey) };
  state.bench = [...PREVIOUS_MATCH_SQUAD.bench];
  localStorage.setItem("dabbers-lineup", JSON.stringify(state.lineup));
  localStorage.setItem("dabbers-bench", JSON.stringify(state.bench));
  if (!silent) {
    showToast(`Loaded XI from last match (${PREVIOUS_MATCH_SQUAD.opponent} - ${PREVIOUS_MATCH_SQUAD.score})!`);
  }
  render();
}

function autoPickBestXI() {
  const players = getPlayersList();
  const currentFormation = FORMATIONS[state.selectedFormation] || FORMATIONS["4-3-3"];
  const newLineup = {};
  const used = new Set();

  currentFormation.positions.forEach((pos) => {
    // Find best candidate for this position
    const candidates = players
      .filter((p) => !used.has(p.id))
      .filter((p) => {
        if (pos.category === "GK") return p.category === "GK";
        if (pos.category === "DEF") return p.category === "DEF";
        if (pos.category === "MID") return p.category === "MID";
        if (pos.category === "FWD") return p.category === "FWD";
        return true;
      })
      .sort((a, b) => (b.stats?.rating || 0) - (a.stats?.rating || 0));

    if (candidates[0]) {
      newLineup[pos.id] = candidates[0].id;
      used.add(candidates[0].id);
    }
  });

  // Pick best remaining players for the 10-player substitutes bench
  const remaining = players.filter((p) => !used.has(p.id)).sort((a, b) => (b.stats?.rating || 0) - (a.stats?.rating || 0));
  state.bench = remaining.slice(0, 10).map((p) => p.id);

  state.lineup = newLineup;
  localStorage.setItem("dabbers-lineup", JSON.stringify(state.lineup));
  localStorage.setItem("dabbers-bench", JSON.stringify(state.bench));
  showToast("Auto-picked optimal Starting XI & 10-player bench!");
  render();
}

function resetLineup() {
  state.lineup = {};
  state.bench = [];
  localStorage.removeItem("dabbers-lineup");
  localStorage.removeItem("dabbers-bench");
  showToast("Tactical lineup cleared.");
  render();
}

function shareSquadSheet() {
  const currentFormation = FORMATIONS[state.selectedFormation] || FORMATIONS["4-3-3"];
  const starters = currentFormation.positions
    .map((pos) => {
      const player = getPlayerById(state.lineup[pos.id]);
      return `${pos.label}: ${player ? player.name : "Unassigned"}`;
    })
    .join("\n");

  const text = `🟢🟡 Nantwich Town FC — Matchday XI (${currentFormation.name})\n\n${starters}\n\nBuilt with The Dabbers Matchday App.`;

  if (navigator.share) {
    navigator.share({ title: "My Dabbers Matchday XI", text }).catch(() => {});
  } else {
    navigator.clipboard.writeText(text).then(() => {
      showToast("Lineup copied to clipboard!");
    });
  }
}

// =======================================================================
// RENDER: MAIN APPLICATION SHELL
// =======================================================================
function renderShell(content) {
  const tabMarkup = tabs.map((tab) => {
    const isSelected = tab.id === state.activeTab;
    const isLiveTab = tab.id === "live";
    const hasLiveMatches = (state.data.live || []).length > 0;

    return `
      <button
        class="tab-button flex min-w-0 flex-1 flex-col items-center justify-center gap-1 py-2 text-xs"
        data-tab="${tab.id}"
        aria-selected="${isSelected}"
      >
        <span class="tab-pill relative flex h-8 w-12 items-center justify-center rounded-xl text-[#AAB8AE] transition">
          ${icon(tab.icon, "h-5 w-5")}
          ${isLiveTab && hasLiveMatches ? '<span class="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 animate-pulse rounded-full bg-rose-500"></span>' : ""}
        </span>
        <span class="tab-label text-[11px] text-[#AAB8AE]">${tab.label}</span>
      </button>
    `;
  }).join("");

  const next = nextUpcomingFixture();

  root.innerHTML = `
    <div class="mx-auto min-h-screen max-w-2xl bg-[#0D1813] text-white">
      <!-- Header -->
      <header class="sticky top-0 z-20 border-b border-charcoal-border bg-[#0D1813]/95 px-4 pb-3 pt-3 backdrop-blur-md sm:px-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-forest border-2 border-gold text-gold font-bold shadow-md">
              🟢
            </div>
            <div>
              <div class="flex items-center gap-1.5">
                <span class="text-[9px] font-bold uppercase tracking-[.25em] text-gold">Nantwich Town FC</span>
                <span class="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
              </div>
              <h1 class="display text-xl font-bold leading-none tracking-tight text-white sm:text-2xl">The Dabbers</h1>
            </div>
          </div>

          <div class="flex items-center gap-1.5">
            <!-- Social Quick Links in Header -->
            <a href="https://twitter.com/TheDabbers" target="_blank" rel="noopener noreferrer" class="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[#1DA1F2] hover:bg-[#1DA1F2]/20 transition" title="Twitter / X (@TheDabbers)">
              ${icon("x_social", "h-3.5 w-3.5")}
            </a>
            <a href="https://www.facebook.com/nantwichtownfc" target="_blank" rel="noopener noreferrer" class="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[#1877F2] hover:bg-[#1877F2]/20 transition" title="Facebook">
              ${icon("facebook", "h-3.5 w-3.5")}
            </a>
            <a href="https://www.instagram.com/nantwichtownfc" target="_blank" rel="noopener noreferrer" class="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[#E4405F] hover:bg-[#E4405F]/20 transition" title="Instagram">
              ${icon("instagram", "h-3.5 w-3.5")}
            </a>
            <a href="https://www.youtube.com/@TheDabbersTV" target="_blank" rel="noopener noreferrer" class="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[#FF0000] hover:bg-[#FF0000]/20 transition" title="YouTube (The Dabbers TV)">
              ${icon("youtube", "h-3.5 w-3.5")}
            </a>

            <button data-refresh-all class="flex h-8 w-8 items-center justify-center rounded-lg border border-gold/40 bg-gold/10 text-gold transition hover:bg-gold hover:text-charcoal ml-1" aria-label="Reload matchday data" title="Reload live data">
              <span class="${state.refreshing ? "animate-spin" : ""}">${icon("refresh", "h-3.5 w-3.5")}</span>
            </button>
          </div>
        </div>

        <!-- Matchday Ticker Pill -->
        ${next ? `
          <div data-tab="fixtures" class="mt-2.5 flex cursor-pointer items-center justify-between gap-2 rounded-xl bg-forest/40 px-3 py-1.5 text-xs text-white border border-gold/20 hover:bg-forest/60 transition">
            <span class="flex items-center gap-2 truncate">
              <span class="rounded bg-gold px-1.5 py-0.5 text-[9px] font-bold uppercase text-charcoal">NEXT</span>
              <strong class="truncate font-semibold">${isHomeFixture(next) ? "Home" : "Away"} vs ${escapeHtml(next.opponent)}</strong>
            </span>
            <span class="shrink-0 text-[10px] font-bold text-gold">${escapeHtml(next.scoreOrStatus || next.date)}</span>
          </div>
        ` : ""}
      </header>

      <!-- Main Content Container -->
      <main class="safe-bottom px-4 pt-4 pb-8 sm:px-6">
        ${content}

        <!-- Club Official Channels Footer -->
        <footer class="mt-10 rounded-2xl border border-charcoal-border bg-[#15251E] p-5 text-white shadow-xl">
          <div class="flex items-center justify-between border-b border-white/10 pb-4">
            <div class="flex items-center gap-3">
              <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-forest border border-gold/40 text-gold font-bold">
                🟢
              </div>
              <div>
                <h3 class="display text-base font-bold text-white">${CLUB_INFO.name}</h3>
                <span class="text-[10px] text-gold uppercase tracking-wider">${CLUB_INFO.league}</span>
              </div>
            </div>
            <a href="${TICKETING_URL}" target="_blank" rel="noopener noreferrer" class="rounded-lg bg-gold px-2.5 py-1 text-xs font-bold text-charcoal hover:bg-gold-dark transition">
              ${icon("ticket", "h-3 w-3 inline")} Tickets
            </a>
          </div>

          <div class="mt-4">
            <p class="text-[10px] font-bold uppercase tracking-wider text-gold mb-2">Official Club Social Channels</p>
            <div class="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
              ${SOCIAL_CHANNELS.map((ch) => `
                <a href="${ch.url}" target="_blank" rel="noopener noreferrer" class="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-2 transition ${ch.hoverBorder}">
                  <span class="text-gold">${icon(ch.icon, "h-3.5 w-3.5")}</span>
                  <div class="truncate min-w-0">
                    <span class="block truncate font-bold text-white text-[11px]">${ch.name}</span>
                    <span class="block truncate text-[9px] text-[#AAB8AE]">${ch.handle}</span>
                  </div>
                </a>
              `).join("")}
            </div>
          </div>

          <div class="mt-4 flex flex-col gap-1 border-t border-white/10 pt-3 text-center text-[10px] text-[#AAB8AE] sm:flex-row sm:justify-between">
            <span>The Swansway Stadium, CW5 5BS</span>
            <span>Live data automatically synchronized</span>
          </div>
        </footer>
      </main>

      <!-- Toast Feedback -->
      ${state.toastMessage ? `
        <div class="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 rounded-2xl bg-gold px-4 py-2.5 text-xs font-bold text-charcoal shadow-2xl animate-toast">
          ${escapeHtml(state.toastMessage)}
        </div>
      ` : ""}

      <!-- Modals -->
      ${renderPositionPickerModal()}
      ${renderPlayerProfileModal()}
      ${renderH2HModal()}
      ${renderStadiumGuideModal()}
      ${renderGraphicExportModal()}

      <!-- Bottom Navigation Dock -->
      <nav class="safe-dock fixed inset-x-0 bottom-0 z-30 mx-auto max-w-2xl border-t border-charcoal-border bg-[#0F1A15]/95 shadow-2xl backdrop-blur-md" aria-label="Main Navigation">
        <div class="flex max-w-2xl justify-around">${tabMarkup}</div>
      </nav>
    </div>
  `;

  // Attach Event Handlers
  bindEvents();
}

// =======================================================================
// EVENT BINDINGS
// =======================================================================
function bindEvents() {
  // Tabs (Live Matchday, Fixtures, Table, Squad, Media & Ground Hub)
  document.querySelectorAll("[data-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.activeTab = btn.dataset.tab;
      window.scrollTo({ top: 0, behavior: "smooth" });
      render();
    });
  });

  // Squad Sub-tabs (Squad Builder / Roster)
  document.querySelectorAll("[data-squad-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.squadSubTab = btn.dataset.squadTab;
      window.scrollTo({ top: 0, behavior: "smooth" });
      render();
    });
  });

  // Sound Engine Controls
  document.querySelector("[data-toggle-sound]")?.addEventListener("click", () => {
    state.soundEnabled = !state.soundEnabled;
    localStorage.setItem("dabbers-sound", state.soundEnabled ? "true" : "false");
    if (state.soundEnabled && window.DabbersSound) {
      window.DabbersSound.playRefWhistle();
      showToast("Match Audio Engine enabled!");
    }
    render();
  });

  document.querySelector("[data-play-whistle]")?.addEventListener("click", () => {
    if (window.DabbersSound) window.DabbersSound.playRefWhistle();
  });

  document.querySelector("[data-play-goal]")?.addEventListener("click", () => {
    if (window.DabbersSound) window.DabbersSound.playGoalSiren();
  });

  // Formation Change
  document.querySelector("[data-change-formation]")?.addEventListener("change", (e) => {
    state.selectedFormation = e.target.value;
    localStorage.setItem("dabbers-formation", state.selectedFormation);
    render();
  });

  // Auto-load Previous Match XI
  document.querySelector("[data-load-previous-match]")?.addEventListener("click", () => {
    loadPreviousMatchSquadAction(false);
  });

  // Auto-pick Best XI
  document.querySelector("[data-auto-pick]")?.addEventListener("click", autoPickBestXI);

  // Reset Lineup
  document.querySelector("[data-reset-lineup]")?.addEventListener("click", resetLineup);

  // Share Squad Text
  document.querySelector("[data-share-squad]")?.addEventListener("click", shareSquadSheet);

  // Export Matchday Graphic (Canvas -> PNG)
  document.querySelector("[data-export-graphic]")?.addEventListener("click", async () => {
    showToast("Generating Matchday Starting XI Graphic...");
    const currentFormation = FORMATIONS[state.selectedFormation] || FORMATIONS["4-3-3"];
    const starters = currentFormation.positions.map((pos) => {
      const player = getPlayerById(state.lineup[pos.id]);
      return {
        number: player?.number || "—",
        name: player?.name || "Unassigned",
        position: pos.label,
        category: pos.category,
      };
    });

    const bench = state.bench.map(getPlayerById).filter(Boolean).map((p) => ({
      number: p.number || "—",
      name: p.name,
      position: p.position,
    }));

    const next = nextUpcomingFixture();
    const opponent = next?.opponent || "Matchday Rival";
    const dateStr = next?.date || new Date().toLocaleDateString("en-GB");

    if (window.generateStartingXIGraphic) {
      const dataUrl = await window.generateStartingXIGraphic({
        formationName: currentFormation.name,
        opponent,
        matchDate: dateStr,
        starters,
        bench,
      });

      state.graphicDataUrl = dataUrl;
      state.activeModal = "graphic_export";
      render();
    }
  });

  // Share Image helper
  document.querySelector("[data-share-image]")?.addEventListener("click", async () => {
    if (state.graphicDataUrl && navigator.share) {
      try {
        const blob = await (await fetch(state.graphicDataUrl)).blob();
        const file = new File([blob], "NantwichTown_StartingXI.png", { type: "image/png" });
        await navigator.share({
          title: "Nantwich Town FC Starting XI",
          text: "Here is today's Nantwich Town FC starting lineup!",
          files: [file],
        });
      } catch (err) {
        showToast("Downloaded graphic to device.");
      }
    } else {
      showToast("Download the PNG above to share!");
    }
  });

  // Open Stadium Guide Modal
  document.querySelectorAll("[data-open-stadium-guide]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.activeModal = "stadium_guide";
      render();
    });
  });

  // Open H2H Modal
  document.querySelectorAll("[data-open-h2h]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const opponent = btn.dataset.openH2h;
      state.activeH2HOpponent = opponent;
      state.activeModal = "h2h_preview";
      state.activeH2HData = null;
      render();

      try {
        const res = await fetch(`/api/h2h/${encodeURIComponent(opponent)}`);
        if (res.ok) {
          state.activeH2HData = await res.json();
          render();
        }
      } catch (e) {
        // Fallback default
      }
    });
  });

  // Pick Position Slot on Pitch
  document.querySelectorAll("[data-pick-slot]").forEach((slot) => {
    slot.addEventListener("click", () => {
      state.activePickingSlot = {
        posId: slot.dataset.pickSlot,
        label: slot.dataset.slotLabel,
        category: slot.dataset.slotCat,
      };
      state.activeModal = "pos_picker";
      render();
    });
  });

  // Select Player for Slot
  document.querySelectorAll("[data-select-player-slot]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const playerId = btn.dataset.selectPlayerSlot;
      const { posId } = state.activePickingSlot;
      
      if (posId.startsWith("bench_")) {
        const benchIndex = Number.parseInt(posId.replace("bench_", ""), 10);
        if (state.bench[benchIndex] === playerId) {
          state.bench.splice(benchIndex, 1);
        } else {
          // Remove if already in another bench slot
          state.bench = state.bench.filter((id) => id !== playerId);
          state.bench[benchIndex] = playerId;
        }
        localStorage.setItem("dabbers-bench", JSON.stringify(state.bench));
      } else {
        if (state.lineup[posId] === playerId) {
          delete state.lineup[posId];
        } else {
          // Remove from other starting positions if already in XI
          for (const key of Object.keys(state.lineup)) {
            if (state.lineup[key] === playerId) delete state.lineup[key];
          }
          state.lineup[posId] = playerId;
        }
        localStorage.setItem("dabbers-lineup", JSON.stringify(state.lineup));
      }
      state.activeModal = null;
      render();
    });
  });

  // Bench Add/Remove
  document.querySelectorAll("[data-add-bench]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.activePickingSlot = { posId: `bench_${btn.dataset.addBench}`, label: "SUB", category: "ALL" };
      state.activeModal = "pos_picker";
      render();
    });
  });

  document.querySelectorAll("[data-bench-slot]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const index = Number.parseInt(btn.dataset.benchSlot, 10);
      state.bench.splice(index, 1);
      localStorage.setItem("dabbers-bench", JSON.stringify(state.bench));
      render();
    });
  });

  // Open Player Profile Modal
  document.querySelectorAll("[data-open-player]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.activePlayerModalId = btn.dataset.openPlayer;
      state.activeModal = "player_profile";
      render();
    });
  });

  // Close Modals
  document.querySelectorAll("[data-close-modal]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.activeModal = null;
      render();
    });
  });

  // Category Filter in Squad Roster
  document.querySelectorAll("[data-filter-cat]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.squadFilterCategory = btn.dataset.filterCat;
      render();
    });
  });

  // Search in Squad Roster
  document.querySelector("[data-squad-search]")?.addEventListener("input", (e) => {
    state.squadSearchQuery = e.target.value;
    render();
  });

  // Sort in Squad Roster
  document.querySelector("[data-sort-squad]")?.addEventListener("change", (e) => {
    state.squadSortBy = e.target.value;
    render();
  });

  // Fixture Filter
  document.querySelectorAll("[data-fixture-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.fixtureFilter = btn.dataset.fixtureFilter;
      render();
    });
  });

  // Refresh Buttons
  document.querySelector("[data-refresh-all]")?.addEventListener("click", loadData);
  document.querySelector("[data-refresh-live]")?.addEventListener("click", loadLive);
  document.querySelector("[data-retry]")?.addEventListener("click", loadData);

  // Load X / Twitter widget script
  loadTwitterWidgets();
}

function loadTwitterWidgets() {
  const container = document.querySelector("[data-x-timeline]");
  if (!container) return;
  const load = () => window.twttr?.widgets?.load(container);
  if (window.twttr?.widgets) {
    load();
    return;
  }
  let script = document.querySelector('script[src="https://platform.twitter.com/widgets.js"]');
  if (!script) {
    script = document.createElement("script");
    script.async = true;
    script.src = "https://platform.twitter.com/widgets.js";
    script.charset = "utf-8";
    document.head.appendChild(script);
  }
  if (script.dataset.dabbersListener !== "true") {
    script.dataset.dabbersListener = "true";
    script.addEventListener("load", load, { once: true });
  }
}

// =======================================================================
// RENDER & DATA FETCHING
// =======================================================================
function render() {
  if (state.loading && !state.data[state.activeTab]) {
    renderShell(skeleton());
    return;
  }

  const endpoint = state.activeTab;
  let content = "";

  if (state.errors[endpoint]) {
    content = errorState(endpoint);
  } else if (endpoint === "live") {
    content = renderLive();
  } else if (endpoint === "squad") {
    content = renderSquad();
  } else if (endpoint === "fixtures") {
    content = renderFixtures();
  } else if (endpoint === "table") {
    content = renderTable();
  }

  renderShell(content);
}

async function fetchData(endpoint) {
  const response = await fetch(`/api/${endpoint}`, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
  return response.json();
}

async function loadData() {
  state.loading = true;
  state.refreshing = true;
  state.errors = {};
  render();

  // Fetch core tabs + aux features (media) in parallel
  const coreFetch = Promise.allSettled(tabs.map(async (tab) => [tab.id, await fetchData(tab.id)]));
  const auxFetch = Promise.allSettled([
    fetchData("media").then((d) => ["media", d]),
  ]);

  const [results, auxResults] = await Promise.all([coreFetch, auxFetch]);

  results.forEach((result, index) => {
    const endpoint = tabs[index].id;
    if (result.status === "fulfilled") {
      state.data[result.value[0]] = result.value[1];
      if (endpoint === "live") state.lastLiveChecked = new Date();
    } else {
      state.errors[endpoint] = result.reason?.message || "Request failed";
    }
  });

  auxResults.forEach((result) => {
    if (result.status === "fulfilled") {
      state.data[result.value[0]] = result.value[1];
    }
  });

  state.loading = false;
  state.refreshing = false;
  state.lastUpdated = new Date();
  render();
}

async function loadLive() {
  if (state.refreshing) return;
  state.refreshing = true;
  render();
  try {
    const live = await fetchData("live");
    state.data.live = live;
    delete state.errors.live;
    state.lastLiveChecked = new Date();
    state.lastUpdated = new Date();
  } catch (error) {
    state.errors.live = error.message;
  } finally {
    state.refreshing = false;
    render();
  }
}

function startLiveRefresh() {
  window.setInterval(() => {
    if (!document.hidden && state.activeTab === "live") loadLive();
  }, 30_000);

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && state.activeTab === "live") loadLive();
  });
}

// Boot up
render();
loadData();
startLiveRefresh();
