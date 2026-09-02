const tabs = [
  { id: "live", label: "Live", icon: "pulse" },
  { id: "table", label: "Table", icon: "table" },
  { id: "fixtures", label: "Fixtures", icon: "calendar" },
  { id: "squad", label: "Squad", icon: "users" },
];

const state = {
  activeTab: "live",
  loading: true,
  refreshing: false,
  data: { live: null, table: null, fixtures: null, squad: null },
  errors: {},
  lastUpdated: null,
  lastLiveChecked: null,
};

const LIVE_REFRESH_MS = 60_000;
const TICKETING_URL = "https://nantwichtownfc.ktckts.com/brand/match-tickets";
const FUTBOLOGY_APP_URL = "https://play.google.com/store/apps/details?id=com.kepermat.groundhopper";
const X_TIMELINE_URL = "https://twitter.com/TheDabbers?ref_src=twsrc%5Etfw";
const root = document.querySelector("#app");
const selectedSquad = new Set(JSON.parse(localStorage.getItem("dabbers-matchday-squad") || "[]"));

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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
    check: '<path d="m5 12 4 4L19 6" /><circle cx="12" cy="12" r="9" />',
    chart: '<path d="M4 19V5M4 19h17M8 16v-3M12 16V8M16 16v-6M20 16v-9" />',
  };
  return `<svg aria-hidden="true" class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${shapes[name] || ""}</svg>`;
}

function countLabel(count, singular) {
  return `${count} ${count === 1 ? singular : `${singular}s`}`;
}

function updatedLabel() {
  if (!state.lastUpdated) return "Updating matchday data";
  return `Updated ${new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(state.lastUpdated)}`;
}

function liveCheckedLabel() {
  if (!state.lastLiveChecked) return "Live feed checking";
  return `Last checked ${new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(state.lastLiveChecked)}`;
}

function nextUpcomingFixture() {
  return (state.data.fixtures || []).find((fixture) => !completed(fixture)) || null;
}

function fixtureDateParts(date) {
  const parts = String(date || "—").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { day: "—", date: "—" };
  return { day: parts[0].toUpperCase(), date: parts.slice(1).join(" ") || parts[0] };
}

function pageHeader(kicker, title, count, action = "") {
  return `
    <div class="mb-5 flex items-end justify-between gap-4">
      <div>
        <p class="mb-1 text-[11px] font-bold uppercase tracking-[.2em] text-forest">${escapeHtml(kicker)}</p>
        <h2 class="display text-2xl font-bold tracking-[-.04em] text-ink">${escapeHtml(title)}</h2>
      </div>
      <div class="flex items-center gap-2">
        ${count === undefined ? "" : `<span class="whitespace-nowrap rounded-full bg-[#E5EFE6] px-3 py-1.5 text-[11px] font-bold text-forest">${escapeHtml(countLabel(count, "entry"))}</span>`}
        ${action}
      </div>
    </div>
  `;
}

function skeleton() {
  const cards = state.activeTab === "table"
    ? `<div class="overflow-hidden rounded-3xl border border-mist bg-white">${Array.from({ length: 7 }, () => '<div class="skeleton h-12 border-b border-mist"></div>').join("")}</div>`
    : state.activeTab === "fixtures"
      ? `<div class="space-y-3">${Array.from({ length: 4 }, () => '<div class="skeleton h-24 rounded-3xl"></div>').join("")}</div>`
      : state.activeTab === "squad"
        ? `<div class="grid grid-cols-2 gap-3 sm:grid-cols-3">${Array.from({ length: 6 }, () => '<div class="skeleton h-32 rounded-3xl"></div>').join("")}</div>`
        : '<div class="skeleton h-72 rounded-[2rem]"></div>';
  return `
    <div class="mb-5">
      <div class="skeleton mb-3 h-3 w-24 rounded"></div>
      <div class="skeleton h-8 w-48 rounded-lg"></div>
    </div>
    ${cards}
  `;
}

function errorState(endpoint) {
  return `
    <div class="rounded-[2rem] border border-red-200 bg-white p-8 text-center">
      <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-500">${icon("alert", "h-6 w-6")}</div>
      <h2 class="display text-lg font-bold text-ink">Couldn’t load ${escapeHtml(endpoint)} data</h2>
      <p class="mx-auto mt-2 max-w-xs text-sm leading-6 text-slate">${escapeHtml(state.errors[endpoint] || "The source did not respond.")}</p>
      <button data-retry class="mt-5 rounded-2xl bg-forest px-5 py-3 text-sm font-bold text-white">Try again</button>
    </div>
  `;
}

function fanActionButtons(fixture = null) {
  const ticketAction = fixture && isHomeFixture(fixture)
    ? `<a href="${TICKETING_URL}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 rounded-2xl bg-gold px-4 py-3 text-xs font-bold text-charcoal transition hover:bg-[#ffe082]">${icon("ticket", "h-4 w-4")} Buy Tickets</a>`
    : "";
  const futbologyAction = fixture
    ? `<a href="${futbologyMatchUrl(fixture)}" class="inline-flex items-center gap-2 rounded-2xl border border-mist bg-white px-4 py-3 text-xs font-bold text-forest transition hover:border-forest">${icon("check", "h-4 w-4")} Check in on Futbology</a>`
    : `<a href="${FUTBOLOGY_APP_URL}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 rounded-2xl border border-mist bg-white px-4 py-3 text-xs font-bold text-forest transition hover:border-forest">${icon("check", "h-4 w-4")} Get Futbology</a>`;
  return `
    <div class="mt-5 flex flex-wrap gap-2">
      ${ticketAction}
      ${futbologyAction}
    </div>
  `;
}

function xTimeline() {
  return `
    <section class="mt-7 overflow-hidden rounded-3xl border border-mist bg-charcoal p-4 shadow-lg shadow-black/5 sm:p-5">
      <div class="mb-4 flex items-start justify-between gap-3">
        <div>
          <p class="text-[10px] font-bold uppercase tracking-[.18em] text-gold">Matchday commentary</p>
          <h3 class="display mt-1 text-lg font-bold text-white">The Dabbers on X</h3>
        </div>
        <a href="${X_TIMELINE_URL}" target="_blank" rel="noopener noreferrer" class="shrink-0 text-xs font-bold text-[#D5E8D9] hover:text-gold">Open profile ${icon("arrow", "inline h-3 w-3")}</a>
      </div>
      <div data-x-timeline class="min-h-[180px] overflow-hidden rounded-2xl bg-white p-2">
        <a class="twitter-timeline" data-height="600" data-theme="dark" href="${X_TIMELINE_URL}">Tweets by TheDabbers</a>
      </div>
      <p class="mt-3 text-center text-[11px] text-[#AAB8AE]">If the feed does not load, use Open profile above to read the latest posts.</p>
    </section>
  `;
}

function renderLive() {
  const games = state.data.live || [];
  const next = nextUpcomingFixture();
  const reloadButton = `<button data-refresh-live class="flex h-9 items-center gap-2 rounded-xl bg-[#E5EFE6] px-3 text-xs font-bold text-forest transition hover:bg-gold" ${state.refreshing ? "disabled" : ""}><span class="${state.refreshing ? "animate-spin" : ""}">${icon("refresh", "h-4 w-4")}</span> Refresh</button>`;
  if (!games.length) {
    return `
      ${pageHeader("Match centre", "Live now", 0, `<span class="hidden text-[10px] font-medium text-slate sm:inline">${liveCheckedLabel()}</span>${reloadButton}`)}
      <section class="relative overflow-hidden rounded-[2rem] bg-forest p-7 text-white shadow-2xl shadow-[#0b2218]/30 sm:p-10">
        <div class="absolute -right-12 -top-12 h-44 w-44 rounded-full border-[24px] border-white/5"></div>
        <div class="relative">
          <div class="mb-12 flex items-center justify-between">
            <span class="rounded-full bg-white/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.18em] text-[#F7D979]">NPL live feed</span>
            <span class="flex items-center gap-2 text-xs font-medium text-[#D5E8D9]"><span class="h-2 w-2 animate-pulse rounded-full bg-gold"></span>Connected</span>
          </div>
          <div class="mx-auto max-w-sm text-center">
            <div class="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-white/10 text-gold">${icon("pulse", "h-8 w-8")}</div>
            <h3 class="display text-2xl font-bold tracking-[-.04em]">No live matches in progress</h3>
            <p class="mt-3 text-sm leading-6 text-[#D5E8D9]">Live scores will appear here as soon as the action starts.</p>
          </div>
        </div>
      </section>
      ${fanActionButtons(next)}
      ${xTimeline()}
    `;
  }

  return `
    ${pageHeader("Match centre", "Live now", games.length, `<span class="hidden text-[10px] font-medium text-slate sm:inline">${liveCheckedLabel()}</span>${reloadButton}`)}
    <div class="space-y-3" aria-live="polite" aria-busy="${state.refreshing}">
      ${games.map((game) => `
        <article class="rounded-3xl border border-mist bg-white p-5 shadow-lg shadow-black/5">
          <div class="mb-5 flex items-center justify-between">
            <span class="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.18em] text-red-500"><span class="h-2 w-2 animate-pulse rounded-full bg-red-500"></span>Live</span>
            <span class="text-sm font-bold text-forest">${escapeHtml(game.status || "In play")}</span>
          </div>
          <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
            <span class="text-sm font-bold leading-5 text-ink">${escapeHtml(game.homeTeam || "Home")}</span>
            <span class="display text-2xl font-bold text-forest">${escapeHtml(game.score || "—")}</span>
            <span class="text-sm font-bold leading-5 text-ink">${escapeHtml(game.awayTeam || "Away")}</span>
          </div>
        </article>
      `).join("")}
    </div>
    ${fanActionButtons(next)}
    ${xTimeline()}
  `;
}

function renderTable() {
  const rows = state.data.table || [];
  if (!rows.length) return pageHeader("Standings", "League table", 0) + emptyState("No league table data available.");
  return `
    ${pageHeader("Standings", "League table", rows.length)}
    <div class="overflow-hidden rounded-3xl border border-mist bg-white shadow-lg shadow-black/5">
      <div class="grid grid-cols-[2rem_1fr_2.5rem_3rem_2.5rem] gap-2 border-b border-mist bg-[#E5EFE6] px-4 py-3 text-[10px] font-bold uppercase tracking-[.13em] text-forest sm:grid-cols-[3rem_1fr_4rem_4rem_4rem] sm:px-5">
        <span>#</span><span>Team</span><span class="text-center">Pld</span><span class="text-center">GD</span><span class="text-center">Pts</span>
      </div>
      ${rows.map((row) => {
        const highlight = row.team.toLowerCase().includes("nantwich");
        return `
          <div class="grid grid-cols-[2rem_1fr_2.5rem_3rem_2.5rem] items-center gap-2 border-b border-mist px-4 py-3.5 last:border-0 sm:grid-cols-[3rem_1fr_4rem_4rem_4rem] sm:px-5 ${highlight ? "bg-forest text-white" : "text-ink"}">
            <span class="text-sm font-bold ${highlight ? "text-[#D5E8D9]" : "text-slate"}">${escapeHtml(row.position)}</span>
            <span class="truncate text-sm font-bold">${escapeHtml(row.team)}${highlight ? '<span class="ml-2 rounded-full bg-gold px-1.5 py-0.5 align-middle text-[8px] font-bold uppercase tracking-wider text-charcoal">Us</span>' : ""}</span>
            <span class="text-center text-sm ${highlight ? "text-[#D5E8D9]" : "text-slate"}">${escapeHtml(row.played)}</span>
            <span class="text-center text-sm font-medium">${escapeHtml(row.goalDifference)}</span>
            <span class="text-center text-sm font-bold">${escapeHtml(row.points)}</span>
          </div>
        `;
      }).join("")}
    </div>
    ${renderLeagueOutlook(rows)}
  `;
}

function numeric(value) {
  const parsed = Number.parseFloat(String(value ?? "").replace(/[^0-9.+-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function renderLeagueOutlook(rows) {
  const ranked = rows.map((row, index) => ({ ...row, rank: numeric(row.position) || index + 1, pointsValue: numeric(row.points) }));
  const leaderPoints = Math.max(...ranked.map((row) => row.pointsValue), 1);
  const totalTeams = ranked.length;
  const safetyLine = Math.max(1, totalTeams - 3);
  const championWeights = ranked.map((row) => Math.max(0.5, (row.pointsValue / leaderPoints) * (1 / Math.sqrt(row.rank))));
  const weightTotal = championWeights.reduce((sum, value) => sum + value, 0);
  const chanceFor = (index) => Math.max(1, Math.round((championWeights[index] / weightTotal) * 100));
  const zoneFor = (row) => {
    if (row.rank === 1) return ["Automatic promotion", "text-[#166534] bg-[#dcfce7]"];
    if (row.rank <= 5) return ["Play-off places", "text-[#1d4ed8] bg-[#dbeafe]"];
    if (row.rank >= safetyLine) return ["Safety battle", "text-[#b45309] bg-[#fef3c7]"];
    return ["Mid-table", "text-slate bg-[#F1F5F2]"];
  };

  return `
    <section class="mt-7 rounded-3xl border border-mist bg-white p-5 shadow-lg shadow-black/5 sm:p-6">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p class="text-[10px] font-bold uppercase tracking-[.18em] text-forest">League intelligence</p>
          <h3 class="display mt-1 text-xl font-bold tracking-[-.04em] text-ink">Promotion & safety outlook</h3>
        </div>
        <span class="rounded-full bg-[#E5EFE6] px-3 py-1.5 text-[10px] font-bold text-forest">Projection model</span>
      </div>
      <div class="mt-5 grid grid-cols-3 gap-2">
        <div class="rounded-2xl bg-[#E5EFE6] p-3"><strong class="block text-lg text-forest">1</strong><span class="text-[10px] font-bold uppercase tracking-wide text-slate">Auto spot</span></div>
        <div class="rounded-2xl bg-[#EFF4FF] p-3"><strong class="block text-lg text-blue-700">2–5</strong><span class="text-[10px] font-bold uppercase tracking-wide text-slate">Play-offs</span></div>
        <div class="rounded-2xl bg-[#FFF7E1] p-3"><strong class="block text-lg text-amber-700">${safetyLine}+</strong><span class="text-[10px] font-bold uppercase tracking-wide text-slate">Safety line</span></div>
      </div>
      <div class="mt-6 space-y-4">
        ${ranked.map((row, index) => {
          const [zone, zoneClass] = zoneFor(row);
          const chance = chanceFor(index);
          const isUs = row.team.toLowerCase().includes("nantwich");
          return `
            <div class="${isUs ? "rounded-2xl bg-[#F4FAF5] p-3 -mx-2" : ""}">
              <div class="mb-1.5 flex items-center justify-between gap-3 text-xs">
                <span class="min-w-0 truncate font-bold text-ink">${escapeHtml(row.rank)}. ${escapeHtml(row.team)}${isUs ? " · US" : ""}</span>
                <span class="shrink-0 rounded-full px-2 py-1 text-[9px] font-bold ${zoneClass}">${zone}</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="h-2 flex-1 overflow-hidden rounded-full bg-[#E7EEE8]"><div class="h-full rounded-full ${isUs ? "bg-gold" : "bg-forest"}" style="width: ${Math.min(100, chance * 2.2)}%"></div></div>
                <span class="w-9 text-right text-[10px] font-bold text-slate">${chance}%</span>
              </div>
            </div>
          `;
        }).join("")}
      </div>
      <p class="mt-5 text-[11px] leading-5 text-slate">Champion percentage is an illustrative form-and-position projection from the scraped table, not bookmaker odds or an official league forecast.</p>
    </section>
  `;
}

function completed(fixture) {
  return /\d+\s*-\s*\d+/.test(fixture.scoreOrStatus || "");
}

function isHomeFixture(fixture) {
  return /^(h|home)$/i.test(String(fixture.venue || "").trim());
}

function futbologyMatchUrl(fixture) {
  const query = new URLSearchParams({
    home: isHomeFixture(fixture) ? "Nantwich Town" : fixture.opponent,
    away: isHomeFixture(fixture) ? fixture.opponent : "Nantwich Town",
    date: fixture.date || "",
    competition: fixture.competition || "",
  });
  return `futbology://match?${query.toString()}`;
}

function mapsDirectionsUrl(fixture) {
  const destination = `${fixture.opponent} football ground`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving`;
}

function fixtureCard(fixture) {
  return fixtureCardWithVariant(fixture, false);
}

function fixtureCardWithVariant(fixture, featured) {
  const result = completed(fixture);
  const dateParts = fixtureDateParts(fixture.date);
  return `
    <article class="flex items-center gap-3 rounded-3xl border ${featured ? "border-forest ring-2 ring-[#D5E8D9]" : "border-mist"} bg-white p-4 shadow-lg shadow-black/5 sm:gap-4 sm:p-5">
      <div class="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl ${featured ? "bg-gold text-charcoal" : result ? "bg-[#E5EFE6] text-forest" : "bg-charcoal text-white"}">
        <span class="text-[9px] font-bold uppercase tracking-wider">${escapeHtml(dateParts.day)}</span>
        <span class="display text-base font-bold leading-5">${escapeHtml(dateParts.date)}</span>
      </div>
      <div class="min-w-0 flex-1">
        <div class="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.1em] text-slate">
          <span class="${fixture.venue === "H" ? "text-forest" : ""}">${fixture.venue === "H" ? "Home" : "Away"}</span><span class="h-1 w-1 rounded-full bg-mist"></span><span class="truncate">${escapeHtml(fixture.competition)}</span>
        </div>
        <h3 class="truncate text-sm font-bold text-ink sm:text-base">${escapeHtml(fixture.opponent)}</h3>
      </div>
      <div class="shrink-0 text-right">
        <span class="block text-sm font-bold ${result ? "text-forest" : "text-ink"}">${escapeHtml(fixture.scoreOrStatus)}</span>
        <span class="mt-1 block text-[9px] font-bold uppercase tracking-wider text-slate">${result ? "Full time" : "Kick-off"}</span>
        ${!result && isHomeFixture(fixture) ? `<a href="${TICKETING_URL}" target="_blank" rel="noopener noreferrer" class="mt-2 inline-flex items-center gap-1 rounded-xl bg-gold px-2.5 py-2 text-[10px] font-bold text-charcoal">${icon("ticket", "h-3 w-3")} Tickets</a>` : ""}
      </div>
    </article>
    <div class="flex flex-wrap gap-2 px-1">
      <a href="${futbologyMatchUrl(fixture)}" class="inline-flex items-center gap-1.5 rounded-xl bg-forest px-3 py-2 text-[10px] font-bold text-white">${icon("check", "h-3.5 w-3.5")} Open this match in Futbology</a>
      ${!isHomeFixture(fixture) ? `<a href="${mapsDirectionsUrl(fixture)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 rounded-xl border border-mist bg-white px-3 py-2 text-[10px] font-bold text-forest">${icon("arrow", "h-3.5 w-3.5")} Directions to ground</a>` : ""}
      <a href="${FUTBOLOGY_APP_URL}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 rounded-xl border border-mist bg-white px-3 py-2 text-[10px] font-bold text-slate">Need the app?</a>
    </div>
  `;
}

function renderFixtures() {
  const fixtures = state.data.fixtures || [];
  if (!fixtures.length) return pageHeader("Season schedule", "Fixtures", 0) + emptyState("No fixtures available.");
  const results = fixtures.filter(completed).reverse();
  const upcoming = fixtures.filter((fixture) => !completed(fixture));
  const next = upcoming[0];
  const laterUpcoming = upcoming.slice(1);
  return `
    ${pageHeader("Season schedule", "Fixtures", fixtures.length, `<a href="${TICKETING_URL}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 rounded-xl bg-gold px-3 py-2 text-xs font-bold text-charcoal transition hover:bg-[#ffe082]">${icon("ticket", "h-4 w-4")} Buy Tickets</a>`)}
    <div class="space-y-7">
      ${results.length ? `<section><h3 class="mb-3 text-[11px] font-bold uppercase tracking-[.2em] text-slate">Recent results</h3><div class="space-y-3">${results.map(fixtureCard).join("")}</div></section>` : ""}
      ${next ? `<section><div class="mb-3 flex flex-wrap items-center justify-between gap-3"><h3 class="text-[11px] font-bold uppercase tracking-[.2em] text-slate">Next up</h3><span class="text-[10px] font-medium text-slate">Your matchday shortcuts</span></div>${fixtureCardWithVariant(next, true)}</section>` : ""}
      ${laterUpcoming.length ? `<section><div class="mb-3 flex flex-wrap items-center justify-between gap-3"><h3 class="text-[11px] font-bold uppercase tracking-[.2em] text-slate">More upcoming games</h3><span class="text-[10px] font-medium text-slate">Each fixture opens its own Futbology match link</span></div><div class="space-y-3">${laterUpcoming.map(fixtureCard).join("")}</div></section>` : ""}
    </div>
  `;
}

function squadPlayerName(player) {
  return typeof player === "string" ? player : player.name;
}

function squadPlayerAppearances(player) {
  return typeof player === "string" ? 0 : numeric(player.appearances);
}

function availabilityScore(player, index) {
  return Math.min(99, 62 + Math.min(25, squadPlayerAppearances(player) * 2) + (index % 4));
}

function toggleSquadPlayer(name) {
  if (selectedSquad.has(name)) {
    selectedSquad.delete(name);
  } else if (selectedSquad.size < 11) {
    selectedSquad.add(name);
  }
  localStorage.setItem("dabbers-matchday-squad", JSON.stringify([...selectedSquad]));
  render();
}

function resetSquad() {
  selectedSquad.clear();
  localStorage.removeItem("dabbers-matchday-squad");
  render();
}

function renderSquadBuilder(players) {
  const availableNames = new Set(players.map(squadPlayerName));
  [...selectedSquad].forEach((name) => {
    if (!availableNames.has(name)) selectedSquad.delete(name);
  });
  const selectedPlayers = players.filter((player) => selectedSquad.has(squadPlayerName(player)));
  const squadScore = selectedPlayers.length ? Math.round(selectedPlayers.reduce((sum, player, index) => sum + availabilityScore(player, index), 0) / selectedPlayers.length) : 0;
  const slots = Array.from({ length: 11 }, (_, index) => selectedPlayers[index]);
  return `
    <section class="mt-7 rounded-3xl bg-forest p-5 text-white shadow-xl shadow-[#0b2218]/20 sm:p-6">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p class="text-[10px] font-bold uppercase tracking-[.18em] text-[#F7D979]">Matchday lab</p>
          <h3 class="display mt-1 text-xl font-bold tracking-[-.04em]">Build your XI</h3>
          <p class="mt-2 max-w-md text-xs leading-5 text-[#D5E8D9]">Select up to 11 players to create a saved matchday squad from the latest appearance data.</p>
        </div>
        <div class="flex items-start gap-2">
          <div class="rounded-2xl bg-white/10 px-4 py-3 text-center">
          <strong class="display block text-2xl text-gold">${squadScore || "—"}</strong>
          <span class="text-[9px] font-bold uppercase tracking-widest text-[#D5E8D9]">Availability</span>
          </div>
          <button type="button" data-reset-squad class="rounded-2xl border border-white/15 px-3 py-2 text-[10px] font-bold text-[#D5E8D9] transition hover:border-white/40">Reset</button>
        </div>
      </div>
      <div class="mt-5 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-[#D5E8D9]"><span>${selectedPlayers.length}/11 selected</span><span>${selectedPlayers.length ? "Tap a player to remove" : "Choose players below"}</span></div>
      <div class="mt-5 grid grid-cols-4 gap-2 sm:grid-cols-6">
        ${slots.map((player, index) => player ? `<div class="rounded-xl bg-white/10 p-2 text-center"><span class="block text-[9px] font-bold text-gold">${String(index + 1).padStart(2, "0")}</span><span class="mt-1 block truncate text-[10px] font-bold">${escapeHtml(squadPlayerName(player))}</span></div>` : `<div class="rounded-xl border border-dashed border-white/20 p-2 text-center text-[10px] text-[#AAB8AE]">Empty</div>`).join("")}
      </div>
      <div class="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
        ${players.map((player, index) => {
          const name = squadPlayerName(player);
          const selected = selectedSquad.has(name);
          return `<button type="button" data-squad-player="${escapeHtml(name)}" class="flex items-center justify-between gap-2 rounded-2xl border px-3 py-2.5 text-left transition ${selected ? "border-gold bg-gold text-charcoal" : "border-white/15 bg-white/5 text-white hover:border-white/40"}"><span class="min-w-0 truncate text-xs font-bold">${escapeHtml(name)}</span><span class="shrink-0 text-[10px] font-bold ${selected ? "text-charcoal/70" : "text-[#D5E8D9]"}">${availabilityScore(player, index)}</span></button>`;
        }).join("")}
      </div>
      <p class="mt-4 text-[10px] leading-4 text-[#AAB8AE]">The availability score is derived from appearances and is not an official player rating. Your selected XI is saved on this device.</p>
    </section>
  `;
}

function renderSquad() {
  const payload = state.data.squad || {};
  const players = Array.isArray(payload) ? payload : payload.players || [];
  const management = Array.isArray(payload) ? null : payload.management;
  if (!players.length) return pageHeader("First team", "Squad", 0) + emptyState("No squad data available.");
  return `
    ${pageHeader("First team", "Squad", players.length)}
    ${management ? `
      <section class="mb-6 rounded-3xl bg-charcoal p-5 text-white shadow-xl shadow-black/10 sm:p-6">
        <p class="text-[10px] font-bold uppercase tracking-[.18em] text-gold">First-team management</p>
        <div class="mt-4 grid gap-4 sm:grid-cols-2">
          <div><p class="text-[10px] font-bold uppercase tracking-widest text-[#AAB8AE]">Manager</p><h3 class="display mt-1 text-lg font-bold">${escapeHtml(management.manager)}</h3></div>
          <div><p class="text-[10px] font-bold uppercase tracking-widest text-[#AAB8AE]">Assistants</p><h3 class="display mt-1 text-lg font-bold">${escapeHtml((management.assistants || []).join(" & "))}</h3></div>
        </div>
      </section>
    ` : ""}
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
      ${players.map((player, index) => {
        const name = squadPlayerName(player);
        const appearances = squadPlayerAppearances(player);
        return `
          <article class="rounded-3xl border border-mist bg-white p-4 shadow-lg shadow-black/5 transition hover:-translate-y-0.5">
            <div class="mb-5 flex items-center justify-between"><span class="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#E5EFE6] text-xs font-bold text-forest">${String(index + 1).padStart(2, "0")}</span>${appearances ? `<span class="text-[10px] font-bold text-slate">${escapeHtml(appearances)} apps</span>` : ""}</div>
            <h3 class="text-sm font-bold leading-5 text-ink">${escapeHtml(name)}</h3>
            <p class="mt-1 text-xs text-slate">Dabbers squad</p>
          </article>
        `;
      }).join("")}
    </div>
    ${renderSquadBuilder(players)}
  `;
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

function emptyState(message) {
  return `<div class="rounded-3xl border border-mist bg-white p-8 text-center text-sm text-slate shadow-lg shadow-black/5">${escapeHtml(message)}</div>`;
}

function matchdayStrip() {
  const next = nextUpcomingFixture();
  if (!next) {
    return `<div class="border-b border-[#DDE7DF] bg-[#E5EFE6] px-5 py-3 text-xs font-medium text-forest sm:px-8">No upcoming fixture available <span class="ml-1 text-slate">· Check back for the next matchday</span></div>`;
  }
  const date = fixtureDateParts(next.date);
  const venue = isHomeFixture(next) ? "Home" : "Away";
  return `
    <button type="button" data-tab="fixtures" class="flex w-full items-center justify-between gap-4 border-b border-[#DDE7DF] bg-[#E5EFE6] px-5 py-3 text-left transition hover:bg-[#d8e9da] sm:px-8">
      <span class="min-w-0"><span class="mr-2 text-[10px] font-bold uppercase tracking-[.16em] text-forest">Next match</span><strong class="truncate text-xs text-ink">${escapeHtml(venue)} · ${escapeHtml(next.opponent)}</strong></span>
      <span class="shrink-0 text-right text-[10px] font-bold text-forest">${escapeHtml(date.day)} ${escapeHtml(date.date)}<span class="block font-medium text-slate">${escapeHtml(next.scoreOrStatus)}</span></span>
    </button>
  `;
}

function shell(content) {
  const tabMarkup = tabs.map((tab) => `
    <button class="tab-button flex min-w-0 flex-1 flex-col items-center justify-center gap-1.5 py-2.5 text-xs" data-tab="${tab.id}" aria-current="${tab.id === state.activeTab ? "page" : "false"}" aria-selected="${tab.id === state.activeTab}">
      <span class="tab-pill relative flex h-8 w-12 items-center justify-center rounded-2xl text-[#AAB8AE] transition">${icon(tab.icon, "h-[18px] w-[18px]")}${tab.id === "live" && (state.data.live || []).length ? '<span class="absolute right-2 top-0 h-2 w-2 animate-pulse rounded-full bg-red-500"></span>' : ""}</span>
      <span class="tab-label text-[#AAB8AE]">${tab.label}</span>
    </button>
  `).join("");

  root.innerHTML = `
    <div class="mx-auto min-h-screen max-w-3xl bg-canvas">
      <header class="bg-charcoal px-5 pb-6 pt-7 text-white sm:px-8 sm:pt-10">
        <div class="flex items-start justify-between">
          <div>
            <div class="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.22em] text-gold"><span class="h-2 w-2 rounded-full bg-gold"></span>Nantwich Town FC</div>
            <h1 class="display text-[2rem] font-bold leading-none tracking-[-.06em] sm:text-4xl">The Dabbers</h1>
            <p class="mt-2 text-sm text-[#AAB8AE]">Green, gold, and matchday ready.</p>
          </div>
          <button data-refresh-all class="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-gold transition hover:bg-gold hover:text-charcoal" aria-label="Reload all data"><span class="${state.refreshing ? "animate-spin" : ""}">${icon("refresh", "h-5 w-5")}</span></button>
        </div>
        <div class="mt-7 flex items-center gap-2 text-xs font-medium text-[#AAB8AE]"><span class="h-2 w-2 rounded-full ${state.loading || state.refreshing ? "bg-gold" : "bg-[#61C982]"}"></span>${updatedLabel()}</div>
      </header>
      ${matchdayStrip()}
      <main class="safe-bottom bg-canvas px-5 pb-10 pt-6 sm:px-8" aria-busy="${state.loading || state.refreshing}">${content}</main>
      <nav class="safe-dock fixed inset-x-0 bottom-0 z-10 mx-auto max-w-3xl border-t border-[#29352E] bg-charcoal/95 shadow-2xl backdrop-blur-md" aria-label="Main navigation"><div class="mx-auto flex max-w-3xl">${tabMarkup}</div></nav>
    </div>
  `;

  document.querySelectorAll("[data-tab]").forEach((button) => button.addEventListener("click", () => { state.activeTab = button.dataset.tab; render(); }));
  document.querySelector("[data-refresh-all]")?.addEventListener("click", loadData);
  document.querySelector("[data-refresh-live]")?.addEventListener("click", loadLive);
  document.querySelector("[data-retry]")?.addEventListener("click", loadData);
  document.querySelectorAll("[data-squad-player]").forEach((button) => button.addEventListener("click", () => toggleSquadPlayer(button.dataset.squadPlayer)));
  document.querySelector("[data-reset-squad]")?.addEventListener("click", resetSquad);
  loadTwitterWidgets();
}

function render() {
  if (state.loading && !state.data[state.activeTab]) return shell(skeleton());
  const endpoint = state.activeTab;
  const content = state.errors[endpoint] ? errorState(endpoint) : endpoint === "live" ? renderLive() : endpoint === "table" ? renderTable() : endpoint === "fixtures" ? renderFixtures() : renderSquad();
  shell(content);
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
  const results = await Promise.allSettled(tabs.map(async (tab) => [tab.id, await fetchData(tab.id)]));
  results.forEach((result, index) => {
    const endpoint = tabs[index].id;
    if (result.status === "fulfilled") {
      state.data[result.value[0]] = result.value[1];
      if (endpoint === "live") state.lastLiveChecked = new Date();
    }
    else state.errors[endpoint] = result.reason?.message || "Request failed";
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
    state.data.live = await fetchData("live");
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
    if (!document.hidden) loadLive();
  }, LIVE_REFRESH_MS);

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) loadLive();
  });
}

render();
loadData();
startLiveRefresh();