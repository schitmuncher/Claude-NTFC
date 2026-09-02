// =======================================================================
// The Dabbers — Extended Matchday Utilities & Features Module
// Web Audio Whistle & Goal Synthesizer, Swansway Ground Guide, MOTM Voting,
// Score Predictor, H2H Historical Analyzer, Media Chants & XI Graphic Exporter
// =======================================================================

// 1. WEB AUDIO SYNTHESIZER FOR MATCHDAY SOUNDS
const SoundEngine = {
  ctx: null,
  enabled: localStorage.getItem("dabbers-sound") === "true",

  init() {
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  },

  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem("dabbers-sound", this.enabled ? "true" : "false");
    if (this.enabled) {
      this.playRefWhistle();
    }
    return this.enabled;
  },

  playRefWhistle() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      // Double whistle pip
      [0, 0.18].forEach((offset) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(2600, now + offset);
        osc.frequency.exponentialRampToValueAtTime(2900, now + offset + 0.1);
        gain.gain.setValueAtTime(0.2, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.01, now + offset + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.13);
      });
    } catch (e) {
      console.warn("Audio not supported or blocked", e);
    }
  },

  playGoalSiren() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 triumphant chord
      const now = this.ctx.currentTime;
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.25, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.8);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.85);
      });
    } catch (e) {
      console.warn("Audio not supported", e);
    }
  },
};

// 2. STADIUM ZONES & FAN ADMISSION GUIDE DATA
const STADIUM_GUIDE = {
  name: "The Swansway Stadium (The Weaver Stadium)",
  address: "Water Lode, Nantwich, Cheshire, CW5 5BS",
  capacity: "3,500 (500 seated, fully covered stands)",
  pitchType: "High-spec 3G GrassMaster surface",
  turnstiles: [
    { name: "Turnstile A (Main Entrance)", desc: "Direct access to Main Stand, Club Shop & Dabbers Bar (Water Lode)", cardAccepted: true },
    { name: "Turnstile B (Away / Swansway End)", desc: "Designated visiting supporters entry with separate covered terrace", cardAccepted: true },
  ],
  pricing: [
    { cat: "Adults", price: "£12.00", info: "Standard admission" },
    { cat: "Concessions (60+)", price: "£8.00", info: "Valid ID required" },
    { cat: "Under 16s", price: "£3.00", info: "Youth admission" },
    { cat: "Under 12s", price: "FREE", info: "When accompanied by a paying adult" },
  ],
  facilities: [
    { title: "The Dabbers Bar & Function Suite", desc: "Open before, during, and after every match. Serves local real ales, draught beers, and hot bar snacks with live TV." },
    { title: "Matchday Tea Hut", desc: "Famous Cheshire meat pies, hot chips, sausage rolls, Bovril, tea, coffee, and soft drinks." },
    { title: "Macron Club Shop", desc: "Matchday programmes, green & white scarves, replica home/away shirts, pin badges, and teamwear." },
    { title: "Travel & Parking", desc: "Free on-site parking at Water Lode (CW5 5BS). Nantwich Railway Station is a pleasant 10-minute stroll through town." },
  ],
};

// 3. TACTICAL XI SOCIAL GRAPHIC EXPORTER (CANVAS TO IMAGE)
function generateStartingXIGraphic(lineup, formation, players, options = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350; // High-res 4:5 Instagram / Twitter portrait format
  const ctx = canvas.getContext("2d");

  // Pitch Background gradient
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, "#0a1f17");
  grad.addColorStop(0.5, "#144636");
  grad.addColorStop(1, "#0a1f17");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Pitch Grass Stripes
  ctx.fillStyle = "rgba(255, 255, 255, 0.025)";
  for (let y = 140; y < canvas.height - 180; y += 120) {
    ctx.fillRect(40, y, canvas.width - 80, 60);
  }

  // Pitch Boundary
  ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
  ctx.lineWidth = 4;
  ctx.strokeRect(60, 160, canvas.width - 120, canvas.height - 340);

  // Halfway line & Center Circle
  const centerY = (160 + canvas.height - 180) / 2;
  ctx.beginPath();
  ctx.moveTo(60, centerY);
  ctx.lineTo(canvas.width - 60, centerY);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(canvas.width / 2, centerY, 100, 0, Math.PI * 2);
  ctx.stroke();

  // Penalty Boxes (Top and Bottom)
  ctx.strokeRect(canvas.width / 2 - 200, 160, 400, 160);
  ctx.strokeRect(canvas.width / 2 - 200, canvas.height - 340, 400, 160);

  // Header Banner
  ctx.fillStyle = "#0F1A15";
  ctx.fillRect(0, 0, canvas.width, 140);
  ctx.fillStyle = "#F3C64C"; // Gold
  ctx.fillRect(0, 136, canvas.width, 4);

  // Header Typography
  ctx.fillStyle = "#F3C64C";
  ctx.font = "bold 38px 'Space Grotesk', sans-serif";
  ctx.fillText("NANTWICH TOWN FC", 60, 60);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 24px 'DM Sans', sans-serif";
  ctx.fillText(`MATCHDAY STARTING XI · ${formation.name}`, 60, 100);

  ctx.fillStyle = "#AAB8AE";
  ctx.font = "18px 'DM Sans', sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(`Manager: Luke Goddard · Swansway Stadium`, canvas.width - 60, 65);
  ctx.fillText(new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }), canvas.width - 60, 98);
  ctx.textAlign = "left";

  // Draw Position Players
  const pitchTop = 180;
  const pitchHeight = canvas.height - 400;

  formation.positions.forEach((pos) => {
    const assignedId = lineup[pos.id];
    const player = players.find((p) => p.id === assignedId);

    const x = (pos.left / 100) * (canvas.width - 160) + 80;
    const y = pitchTop + (pos.top / 100) * pitchHeight;

    // Player Circle Glow
    ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
    ctx.shadowBlur = 12;

    // Jersey Circle
    ctx.beginPath();
    ctx.arc(x, y, 36, 0, Math.PI * 2);
    ctx.fillStyle = player ? "#0F1A15" : "rgba(15, 26, 21, 0.7)";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = player ? "#F3C64C" : "rgba(255, 255, 255, 0.4)";
    ctx.stroke();

    ctx.shadowBlur = 0; // reset

    // Number or Icon
    ctx.fillStyle = player ? "#F3C64C" : "#FFFFFF";
    ctx.font = "bold 22px 'Space Grotesk', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(player ? `#${player.number || ""}` : pos.label, x, y + 8);

    // Name Plate Pill
    if (player) {
      const surname = player.name.split(" ").pop().toUpperCase();
      ctx.fillStyle = "rgba(13, 24, 19, 0.95)";
      ctx.fillRect(x - 65, y + 42, 130, 26);
      ctx.strokeStyle = "rgba(243, 198, 76, 0.4)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x - 65, y + 42, 130, 26);

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 15px 'DM Sans', sans-serif";
      ctx.fillText(surname, x, y + 60);

      // Pos label
      ctx.fillStyle = "#F3C64C";
      ctx.font = "bold 11px 'DM Sans', sans-serif";
      ctx.fillText(pos.label, x, y - 42);
    }
  });

  // Footer Banner
  ctx.fillStyle = "#0F1A15";
  ctx.fillRect(0, canvas.height - 130, canvas.width, 130);
  ctx.fillStyle = "#F3C64C";
  ctx.fillRect(0, canvas.height - 130, canvas.width, 3);

  ctx.fillStyle = "#F3C64C";
  ctx.font = "bold 20px 'Space Grotesk', sans-serif";
  ctx.fillText("#UPTHEDABBERS", 60, canvas.height - 75);

  ctx.fillStyle = "#AAB8AE";
  ctx.font = "16px 'DM Sans', sans-serif";
  ctx.fillText("Northern Premier League Division One West · Nantwich Town FC", 60, canvas.height - 45);

  ctx.fillStyle = "#F3C64C";
  ctx.textAlign = "right";
  ctx.font = "bold 16px 'DM Sans', sans-serif";
  ctx.fillText("Official Dabbers Matchday Companion", canvas.width - 60, canvas.height - 60);

  return canvas.toDataURL("image/png");
}

window.DabbersSound = SoundEngine;
window.DabbersStadiumGuide = STADIUM_GUIDE;
window.generateStartingXIGraphic = generateStartingXIGraphic;
