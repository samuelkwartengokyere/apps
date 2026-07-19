(() => {
  "use strict";

  const STORAGE_KEY = "squadforge-v1";
  const WHEEL_COLORS = [
    "#c8f35a", "#3de0b0", "#8dd3ff", "#ffb8d6",
    "#ffc857", "#b8a1ff", "#ff8f70", "#7dffb3",
    "#6ec8ff", "#f0e68c", "#ff9ecd", "#9ae66e"
  ];

  const SAMPLE = [
    { name: "Alex Rivera", label: "M" },
    { name: "Jordan Lee", label: "F" },
    { name: "Sam Okonkwo", label: "M" },
    { name: "Riley Chen", label: "F" },
    { name: "Casey Brooks", label: "M" },
    { name: "Morgan Vale", label: "F" },
    { name: "Quinn Hart", label: "M" },
    { name: "Avery Kim", label: "F" },
    { name: "Reese Patel", label: "M" },
    { name: "Parker Nguyen", label: "F" },
    { name: "Drew Santos", label: "M" },
    { name: "Blake Ito", label: "F" }
  ];

  const state = {
    people: [],
    teamNames: ["Team 1", "Team 2"],
    balanceMode: "default",
    groups: null,
    representatives: null,
    spinning: false,
    soundOn: true,
    rotation: 0
  };

  const els = {
    wheel: document.getElementById("wheel"),
    btnSpin: document.getElementById("btnSpin"),
    nameInput: document.getElementById("nameInput"),
    labelSelect: document.getElementById("labelSelect"),
    bulkInput: document.getElementById("bulkInput"),
    peopleList: document.getElementById("peopleList"),
    groupCount: document.getElementById("groupCount"),
    maxPerGroup: document.getElementById("maxPerGroup"),
    pickQuantity: document.getElementById("pickQuantity"),
    pickReps: document.getElementById("pickReps"),
    showLabels: document.getElementById("showLabels"),
    keepTogether: document.getElementById("keepTogether"),
    keepApart: document.getElementById("keepApart"),
    teamNames: document.getElementById("teamNames"),
    balanceMode: document.getElementById("balanceMode"),
    balanceHint: document.getElementById("balanceHint"),
    statPeople: document.getElementById("statPeople"),
    statGroups: document.getElementById("statGroups"),
    statPerGroup: document.getElementById("statPerGroup"),
    btnResults: document.getElementById("btnResults"),
    btnClearGroups: document.getElementById("btnClearGroups"),
    resultsModal: document.getElementById("resultsModal"),
    resultsGrid: document.getElementById("resultsGrid"),
    toast: document.getElementById("toast"),
    confetti: document.getElementById("confetti"),
    btnSound: document.getElementById("btnSound")
  };

  const ctx = els.wheel.getContext("2d");
  let audioCtx = null;
  let syncingCounts = false;

  /* ---------- utils ---------- */

  function uid() {
    return Math.random().toString(36).slice(2, 10);
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function toast(msg) {
    els.toast.textContent = msg;
    els.toast.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => els.toast.classList.remove("show"), 2200);
  }

  function ensureAudio() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioCtx = new AC();
    }
    if (audioCtx?.state === "suspended") audioCtx.resume();
  }

  function beep(freq = 440, dur = 0.08, type = "sine", gain = 0.04) {
    if (!state.soundOn) return;
    ensureAudio();
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.value = gain;
    osc.connect(g);
    g.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    g.gain.setValueAtTime(gain, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.start(now);
    osc.stop(now + dur);
  }

  function save() {
    const payload = {
      people: state.people,
      teamNames: state.teamNames,
      balanceMode: state.balanceMode,
      soundOn: state.soundOn,
      groupCount: els.groupCount.value,
      maxPerGroup: els.maxPerGroup.value,
      pickQuantity: els.pickQuantity.value,
      pickReps: els.pickReps.checked,
      showLabels: els.showLabels.checked,
      keepTogether: els.keepTogether.value,
      keepApart: els.keepApart.value
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      state.people = Array.isArray(data.people) ? data.people : [];
      state.teamNames = Array.isArray(data.teamNames) ? data.teamNames : state.teamNames;
      state.balanceMode = data.balanceMode || "default";
      state.soundOn = data.soundOn !== false;
      if (data.groupCount != null) els.groupCount.value = data.groupCount;
      if (data.maxPerGroup != null) els.maxPerGroup.value = data.maxPerGroup;
      if (data.pickQuantity != null) els.pickQuantity.value = data.pickQuantity;
      els.pickReps.checked = !!data.pickReps;
      els.showLabels.checked = data.showLabels !== false;
      els.keepTogether.value = data.keepTogether || "";
      els.keepApart.value = data.keepApart || "";
    } catch {
      /* ignore corrupt storage */
    }
  }

  /* ---------- people ---------- */

  function addPerson(name, label = "") {
    const cleaned = name.trim().replace(/\s+/g, " ");
    if (!cleaned) return false;
    if (state.people.some((p) => p.name.toLowerCase() === cleaned.toLowerCase())) {
      toast(`“${cleaned}” is already on the list`);
      return false;
    }
    state.people.push({ id: uid(), name: cleaned, label: (label || "").trim().toUpperCase() });
    return true;
  }

  function removePerson(id) {
    state.people = state.people.filter((p) => p.id !== id);
    renderPeople();
    updateDerived();
    save();
    drawWheel();
  }

  function importBulk() {
    const lines = els.bulkInput.value.split(/\r?\n/);
    let added = 0;
    for (const line of lines) {
      const raw = line.trim();
      if (!raw) continue;
      // support "Name, Label" or "Name"
      const parts = raw.split(",").map((s) => s.trim());
      if (addPerson(parts[0], parts[1] || "")) added++;
    }
    els.bulkInput.value = "";
    if (added) {
      renderPeople();
      updateDerived();
      save();
      drawWheel();
      toast(`Imported ${added} name${added === 1 ? "" : "s"}`);
    } else {
      toast("No new names to import");
    }
  }

  function renderPeople() {
    if (!state.people.length) {
      els.peopleList.innerHTML = `<div class="empty">No people yet. Add names or load the sample squad.</div>`;
      return;
    }
    els.peopleList.innerHTML = state.people.map((p, i) => {
      const chipClass = p.label === "M" ? "chip m" : p.label === "F" ? "chip f" : "chip";
      const chip = p.label ? `<span class="${chipClass}">${escapeHtml(p.label)}</span>` : "";
      return `
        <div class="person" data-id="${p.id}">
          <span class="person-index">${i + 1}</span>
          <div>
            <div class="person-name">${escapeHtml(p.name)}</div>
          </div>
          <div class="person-meta">
            ${chip}
            <button type="button" class="remove-btn" data-remove="${p.id}" aria-label="Remove ${escapeHtml(p.name)}">×</button>
          </div>
        </div>`;
    }).join("");
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* ---------- rules / counts ---------- */

  function activeGroupCount() {
    const n = parseInt(els.groupCount.value, 10);
    return Number.isFinite(n) && n > 0 ? Math.min(100, n) : 1;
  }

  function poolSize() {
    const pick = parseInt(els.pickQuantity.value, 10);
    if (Number.isFinite(pick) && pick > 0) return Math.min(pick, state.people.length);
    return state.people.length;
  }

  function syncGroupFields(source) {
    if (syncingCounts) return;
    syncingCounts = true;
    const people = poolSize();
    if (!people) {
      syncingCounts = false;
      return;
    }

    if (source === "groups") {
      const groups = activeGroupCount();
      const per = Math.ceil(people / groups);
      els.maxPerGroup.value = String(per);
    } else if (source === "max") {
      const max = parseInt(els.maxPerGroup.value, 10);
      if (Number.isFinite(max) && max > 0) {
        const groups = Math.max(1, Math.ceil(people / max));
        els.groupCount.value = String(Math.min(100, groups));
      }
    } else {
      const groups = activeGroupCount();
      els.maxPerGroup.value = String(Math.ceil(people / groups));
    }
    syncingCounts = false;
  }

  function ensureTeamNames(count) {
    while (state.teamNames.length < count) {
      state.teamNames.push(`Team ${state.teamNames.length + 1}`);
    }
    if (state.teamNames.length > count) {
      state.teamNames = state.teamNames.slice(0, count);
    }
  }

  function renderTeamNames() {
    const count = activeGroupCount();
    ensureTeamNames(count);
    els.teamNames.innerHTML = state.teamNames.map((name, i) => `
      <div class="team-name-row">
        <span class="team-swatch" style="background:${WHEEL_COLORS[i % WHEEL_COLORS.length]}"></span>
        <input type="text" data-team-index="${i}" value="${escapeHtml(name)}" aria-label="Team ${i + 1} name" />
      </div>
    `).join("");
  }

  function updateDerived() {
    const people = poolSize();
    const groups = people ? activeGroupCount() : 0;
    els.statPeople.textContent = String(state.people.length);
    els.statGroups.textContent = String(groups);
    els.statPerGroup.textContent = people && groups
      ? String((people / groups).toFixed(people % groups === 0 ? 0 : 1))
      : "—";
    els.btnSpin.disabled = state.people.length < 2 || state.spinning;
    els.btnResults.disabled = !state.groups;
    els.btnClearGroups.disabled = !state.groups;
    renderTeamNames();
    updateBalanceUI();
  }

  function updateBalanceUI() {
    els.balanceMode.querySelectorAll(".seg").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.mode === state.balanceMode);
    });
    const hints = {
      default: "Shuffle everyone evenly across teams.",
      gender: "Balance M/F labels across teams (uses M & F tags).",
      label: "Balance any custom labels evenly across teams."
    };
    els.balanceHint.textContent = hints[state.balanceMode] || hints.default;
    els.btnSound.setAttribute("aria-pressed", String(state.soundOn));
    els.btnSound.textContent = state.soundOn ? "Sound" : "Muted";
  }

  /* ---------- grouping engine ---------- */

  function parsePairs(text, sep) {
    if (!text.trim()) return [];
    return text.split(",").map((chunk) => {
      const parts = chunk.split(sep).map((s) => s.trim()).filter(Boolean);
      return parts.length >= 2 ? [parts[0], parts[1]] : null;
    }).filter(Boolean);
  }

  function findByName(pool, name) {
    const key = name.toLowerCase();
    return pool.find((p) => p.name.toLowerCase() === key);
  }

  function buildClusters(pool) {
    const together = parsePairs(els.keepTogether.value, "+");
    const parent = new Map(pool.map((p) => [p.id, p.id]));

    function find(id) {
      while (parent.get(id) !== id) {
        parent.set(id, parent.get(parent.get(id)));
        id = parent.get(id);
      }
      return id;
    }
    function union(a, b) {
      const ra = find(a);
      const rb = find(b);
      if (ra !== rb) parent.set(rb, ra);
    }

    for (const [a, b] of together) {
      const pa = findByName(pool, a);
      const pb = findByName(pool, b);
      if (pa && pb) union(pa.id, pb.id);
    }

    const clusters = new Map();
    for (const p of pool) {
      const root = find(p.id);
      if (!clusters.has(root)) clusters.set(root, []);
      clusters.get(root).push(p);
    }
    return [...clusters.values()];
  }

  function violatesApart(teams, apartPairs, pool) {
    for (const [a, b] of apartPairs) {
      const pa = findByName(pool, a);
      const pb = findByName(pool, b);
      if (!pa || !pb) continue;
      for (const team of teams) {
        const ids = new Set(team.map((p) => p.id));
        if (ids.has(pa.id) && ids.has(pb.id)) return true;
      }
    }
    return false;
  }

  function placeClusters(clusters, groupCount) {
    const teams = Array.from({ length: groupCount }, () => []);
    const sizes = Array(groupCount).fill(0);
    const sorted = [...clusters].sort((a, b) => b.length - a.length);

    for (const cluster of sorted) {
      let best = 0;
      for (let i = 1; i < groupCount; i++) {
        if (sizes[i] < sizes[best]) best = i;
      }
      teams[best].push(...cluster);
      sizes[best] += cluster.length;
    }
    return teams;
  }

  function balanceByLabel(pool, groupCount, labelKeyFn) {
    const buckets = new Map();
    for (const p of pool) {
      const key = labelKeyFn(p) || "_";
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(p);
    }
    for (const [k, list] of buckets) buckets.set(k, shuffle(list));

    const teams = Array.from({ length: groupCount }, () => []);
    const keys = [...buckets.keys()].sort();
    let cursor = 0;
    for (const key of keys) {
      for (const person of buckets.get(key)) {
        teams[cursor % groupCount].push(person);
        cursor++;
      }
    }
    return teams;
  }

  function generateGroups() {
    let pool = [...state.people];
    const pick = parseInt(els.pickQuantity.value, 10);
    if (Number.isFinite(pick) && pick > 0 && pick < pool.length) {
      pool = shuffle(pool).slice(0, pick);
    }

    const groupCount = Math.min(activeGroupCount(), Math.max(1, pool.length));
    ensureTeamNames(groupCount);
    const apart = parsePairs(els.keepApart.value, "|");
    const hasTogether = els.keepTogether.value.trim().length > 0;

    let teams = null;
    const attempts = 48;

    for (let attempt = 0; attempt < attempts; attempt++) {
      let candidate;
      if (hasTogether) {
        const clusters = shuffle(buildClusters(shuffle(pool)));
        candidate = placeClusters(clusters, groupCount);
      } else if (state.balanceMode === "gender") {
        candidate = balanceByLabel(shuffle(pool), groupCount, (p) =>
          p.label === "M" || p.label === "F" ? p.label : "_");
      } else if (state.balanceMode === "label") {
        candidate = balanceByLabel(shuffle(pool), groupCount, (p) => p.label || "_");
      } else {
        const shuffled = shuffle(pool);
        candidate = Array.from({ length: groupCount }, () => []);
        shuffled.forEach((p, i) => candidate[i % groupCount].push(p));
      }

      if (!violatesApart(candidate, apart, pool)) {
        teams = candidate;
        break;
      }
    }

    if (!teams) {
      toast("Could not satisfy keep-apart constraints. Relax them and try again.");
      return null;
    }

    // light intra-team shuffle for nicer display
    teams = teams.map((t) => shuffle(t));

    let reps = null;
    if (els.pickReps.checked) {
      reps = teams.map((t) => (t.length ? t[Math.floor(Math.random() * t.length)].id : null));
    }

    return { teams, reps, poolSize: pool.length, groupCount };
  }

  /* ---------- wheel ---------- */

  function drawWheel(highlightIndex = -1) {
    const canvas = els.wheel;
    const dpr = window.devicePixelRatio || 1;
    const size = canvas.clientWidth || 560;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 - 8;
    const names = state.people.length
      ? state.people.map((p) => p.name)
      : ["Add", "Some", "Names", "To", "Spin"];

    const n = names.length;
    const arc = (Math.PI * 2) / n;

    ctx.clearRect(0, 0, size, size);

    // outer ring
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 4, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(200, 243, 90, 0.18)";
    ctx.fill();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(state.rotation);

    for (let i = 0; i < n; i++) {
      const start = i * arc - Math.PI / 2;
      const end = start + arc;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, start, end);
      ctx.closePath();
      const color = WHEEL_COLORS[i % WHEEL_COLORS.length];
      ctx.fillStyle = i === highlightIndex ? "#ffffff" : color;
      ctx.globalAlpha = state.people.length ? 0.92 : 0.35;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = "rgba(11, 18, 16, 0.55)";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      ctx.rotate(start + arc / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#102015";
      ctx.font = `600 ${Math.max(11, Math.min(15, 180 / n))}px Manrope, sans-serif`;
      const label = names[i].length > 14 ? `${names[i].slice(0, 13)}…` : names[i];
      ctx.fillText(label, radius - 18, 5);
      ctx.restore();
    }

    ctx.restore();

    // inner disc under hub
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(54, size * 0.12), 0, Math.PI * 2);
    ctx.fillStyle = "#0b1210";
    ctx.fill();
  }

  function spinWheel(onDone) {
    if (state.spinning) return;
    state.spinning = true;
    els.btnSpin.disabled = true;
    ensureAudio();

    const turns = 5 + Math.random() * 3;
    const extra = Math.random() * Math.PI * 2;
    const target = state.rotation + turns * Math.PI * 2 + extra;
    const duration = 3200;
    const start = performance.now();
    const from = state.rotation;
    let lastTick = -1;

    function frame(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      state.rotation = from + (target - from) * eased;
      drawWheel();

      const n = Math.max(1, state.people.length);
      const tick = Math.floor(((state.rotation % (Math.PI * 2)) / (Math.PI * 2)) * n);
      if (tick !== lastTick) {
        lastTick = tick;
        beep(220 + (tick % 8) * 40, 0.04, "triangle", 0.03);
      }

      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        state.spinning = false;
        beep(660, 0.12, "sine", 0.05);
        beep(880, 0.16, "sine", 0.04);
        onDone();
        updateDerived();
      }
    }

    requestAnimationFrame(frame);
  }

  /* ---------- results ---------- */

  function showResults() {
    if (!state.groups) return;
    const showLabels = els.showLabels.checked;
    els.resultsGrid.innerHTML = state.groups.map((team, i) => {
      const name = state.teamNames[i] || `Team ${i + 1}`;
      const color = WHEEL_COLORS[i % WHEEL_COLORS.length];
      const members = team.map((p) => {
        const isRep = state.representatives && state.representatives[i] === p.id;
        const label = showLabels && p.label
          ? `<span class="chip ${p.label === "M" ? "m" : p.label === "F" ? "f" : ""}">${escapeHtml(p.label)}</span>`
          : "";
        return `<li>
          <span>${escapeHtml(p.name)} ${label}</span>
          ${isRep ? `<span class="rep-badge">Rep</span>` : ""}
        </li>`;
      }).join("");
      return `
        <article class="result-team" style="border-color:${color}55; box-shadow: inset 3px 0 0 ${color}">
          <div class="result-head">
            <h3 class="result-name">${escapeHtml(name)}</h3>
            <span class="result-count">${team.length} member${team.length === 1 ? "" : "s"}</span>
          </div>
          <ul class="result-members">${members || "<li>Empty</li>"}</ul>
        </article>`;
    }).join("");
    els.resultsModal.hidden = false;
  }

  function closeResults() {
    els.resultsModal.hidden = true;
  }

  function resultsPlainText() {
    if (!state.groups) return "";
    return state.groups.map((team, i) => {
      const title = state.teamNames[i] || `Team ${i + 1}`;
      const lines = team.map((p) => {
        const rep = state.representatives && state.representatives[i] === p.id ? " (Rep)" : "";
        const label = p.label ? ` [${p.label}]` : "";
        return `- ${p.name}${label}${rep}`;
      });
      return `${title}\n${lines.join("\n")}`;
    }).join("\n\n");
  }

  function downloadCsv() {
    if (!state.groups) return;
    const rows = [["Team", "Name", "Label", "Representative"]];
    state.groups.forEach((team, i) => {
      const title = state.teamNames[i] || `Team ${i + 1}`;
      team.forEach((p) => {
        const rep = state.representatives && state.representatives[i] === p.id ? "Yes" : "";
        rows.push([title, p.name, p.label || "", rep]);
      });
    });
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "squadforge-teams.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast("CSV downloaded");
  }

  async function saveImage() {
    if (!state.groups) return;
    const width = 1200;
    const padding = 40;
    const colW = 360;
    const cols = Math.min(3, state.groups.length);
    const rows = Math.ceil(state.groups.length / cols);
    const maxMembers = Math.max(...state.groups.map((t) => t.length), 1);
    const height = padding * 2 + 80 + rows * (90 + maxMembers * 28);

    const c = document.createElement("canvas");
    c.width = width;
    c.height = height;
    const g = c.getContext("2d");

    const grad = g.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, "#0b1210");
    grad.addColorStop(1, "#15241e");
    g.fillStyle = grad;
    g.fillRect(0, 0, width, height);

    g.fillStyle = "#c8f35a";
    g.font = "800 42px Syne, sans-serif";
    g.fillText("SquadForge", padding, padding + 36);
    g.fillStyle = "#9bb3a3";
    g.font = "500 18px Manrope, sans-serif";
    g.fillText("Random team results", padding, padding + 64);

    state.groups.forEach((team, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = padding + col * (colW + 20);
      const y = padding + 100 + row * (90 + maxMembers * 28);
      const color = WHEEL_COLORS[i % WHEEL_COLORS.length];

      g.fillStyle = "rgba(255,255,255,0.03)";
      g.strokeStyle = color;
      g.lineWidth = 2;
      roundRect(g, x, y, colW, 60 + team.length * 28, 16);
      g.fill();
      g.stroke();

      g.fillStyle = color;
      g.font = "700 22px Syne, sans-serif";
      g.fillText(state.teamNames[i] || `Team ${i + 1}`, x + 18, y + 32);

      g.fillStyle = "#eef7e8";
      g.font = "500 16px Manrope, sans-serif";
      team.forEach((p, mi) => {
        const rep = state.representatives && state.representatives[i] === p.id ? " ★" : "";
        const label = p.label ? ` (${p.label})` : "";
        g.fillText(`${p.name}${label}${rep}`, x + 18, y + 62 + mi * 26);
      });
    });

    const url = c.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "squadforge-results.png";
    a.click();
    toast("Image saved");
  }

  function roundRect(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }

  /* ---------- confetti ---------- */

  function burstConfetti() {
    const canvas = els.confetti;
    const c = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);

    const pieces = Array.from({ length: 120 }, () => ({
      x: Math.random() * window.innerWidth,
      y: -20 - Math.random() * 80,
      r: 3 + Math.random() * 5,
      vy: 2 + Math.random() * 4,
      vx: -2 + Math.random() * 4,
      rot: Math.random() * Math.PI,
      vr: -0.2 + Math.random() * 0.4,
      color: WHEEL_COLORS[Math.floor(Math.random() * WHEEL_COLORS.length)]
    }));

    let frames = 0;
    function tick() {
      frames++;
      c.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (const p of pieces) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.04;
        p.rot += p.vr;
        c.save();
        c.translate(p.x, p.y);
        c.rotate(p.rot);
        c.fillStyle = p.color;
        c.fillRect(-p.r, -p.r / 2, p.r * 2, p.r);
        c.restore();
      }
      if (frames < 90) requestAnimationFrame(tick);
      else c.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }
    requestAnimationFrame(tick);
  }

  /* ---------- actions ---------- */

  function runGrouping() {
    if (state.people.length < 2) {
      toast("Add at least 2 people");
      return;
    }
    syncGroupFields("groups");
    spinWheel(() => {
      const result = generateGroups();
      if (!result) {
        updateDerived();
        return;
      }
      state.groups = result.teams;
      state.representatives = result.reps;
      burstConfetti();
      updateDerived();
      showResults();
      save();
    });
  }

  function clearGroups() {
    state.groups = null;
    state.representatives = null;
    closeResults();
    updateDerived();
    toast("Groups cleared");
  }

  /* ---------- events ---------- */

  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((t) => {
        t.classList.toggle("active", t === tab);
        t.setAttribute("aria-selected", String(t === tab));
      });
      document.querySelectorAll(".tab-panel").forEach((panel) => {
        const on = panel.id === `tab-${tab.dataset.tab}`;
        panel.classList.toggle("active", on);
        panel.hidden = !on;
      });
    });
  });

  document.getElementById("btnAdd").addEventListener("click", () => {
    if (addPerson(els.nameInput.value, els.labelSelect.value)) {
      els.nameInput.value = "";
      renderPeople();
      updateDerived();
      syncGroupFields("groups");
      save();
      drawWheel();
      beep(520, 0.05, "sine", 0.03);
    }
  });

  els.nameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      document.getElementById("btnAdd").click();
    }
  });

  document.getElementById("btnImport").addEventListener("click", importBulk);
  document.getElementById("btnSample").addEventListener("click", () => {
    state.people = SAMPLE.map((p) => ({ ...p, id: uid() }));
    els.groupCount.value = "3";
    renderPeople();
    syncGroupFields("groups");
    updateDerived();
    save();
    drawWheel();
    toast("Sample squad loaded");
  });

  document.getElementById("btnClearPeople").addEventListener("click", () => {
    state.people = [];
    state.groups = null;
    state.representatives = null;
    renderPeople();
    updateDerived();
    save();
    drawWheel();
    toast("People cleared");
  });

  els.peopleList.addEventListener("click", (e) => {
    const id = e.target.dataset.remove;
    if (id) removePerson(id);
  });

  els.balanceMode.addEventListener("click", (e) => {
    const btn = e.target.closest(".seg");
    if (!btn) return;
    state.balanceMode = btn.dataset.mode;
    updateBalanceUI();
    save();
  });

  els.groupCount.addEventListener("input", () => {
    syncGroupFields("groups");
    updateDerived();
    save();
  });
  els.maxPerGroup.addEventListener("input", () => {
    syncGroupFields("max");
    updateDerived();
    save();
  });
  els.pickQuantity.addEventListener("input", () => {
    syncGroupFields("groups");
    updateDerived();
    save();
  });

  ["pickReps", "showLabels", "keepTogether", "keepApart"].forEach((id) => {
    document.getElementById(id).addEventListener("change", save);
    document.getElementById(id).addEventListener("input", save);
  });

  els.teamNames.addEventListener("input", (e) => {
    const input = e.target.closest("input[data-team-index]");
    if (!input) return;
    const i = Number(input.dataset.teamIndex);
    state.teamNames[i] = input.value;
    save();
  });

  document.getElementById("btnResetTeamNames").addEventListener("click", () => {
    const count = activeGroupCount();
    state.teamNames = Array.from({ length: count }, (_, i) => `Team ${i + 1}`);
    renderTeamNames();
    save();
  });

  els.btnSpin.addEventListener("click", runGrouping);
  document.getElementById("btnRespin").addEventListener("click", () => {
    closeResults();
    runGrouping();
  });
  els.btnResults.addEventListener("click", showResults);
  els.btnClearGroups.addEventListener("click", clearGroups);

  document.querySelectorAll("[data-close='results']").forEach((el) => {
    el.addEventListener("click", closeResults);
  });

  document.getElementById("btnCopy").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(resultsPlainText());
      toast("Copied to clipboard");
    } catch {
      toast("Copy failed");
    }
  });
  document.getElementById("btnCsv").addEventListener("click", downloadCsv);
  document.getElementById("btnImage").addEventListener("click", saveImage);

  document.getElementById("btnSound").addEventListener("click", () => {
    state.soundOn = !state.soundOn;
    updateBalanceUI();
    save();
    if (state.soundOn) beep(500, 0.06);
  });

  document.getElementById("btnFullscreen").addEventListener("click", () => {
    document.body.classList.toggle("focus-mode");
    toast(document.body.classList.contains("focus-mode") ? "Focus mode on" : "Focus mode off");
  });

  document.getElementById("btnResetAll").addEventListener("click", () => {
    if (!confirm("Reset all people, rules, and results?")) return;
    localStorage.removeItem(STORAGE_KEY);
    state.people = [];
    state.teamNames = ["Team 1", "Team 2"];
    state.balanceMode = "default";
    state.groups = null;
    state.representatives = null;
    els.groupCount.value = "2";
    els.maxPerGroup.value = "";
    els.pickQuantity.value = "";
    els.pickReps.checked = false;
    els.showLabels.checked = true;
    els.keepTogether.value = "";
    els.keepApart.value = "";
    renderPeople();
    updateDerived();
    drawWheel();
    closeResults();
    toast("Everything reset");
  });

  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      runGrouping();
    }
    if (e.key === "Escape" && !els.resultsModal.hidden) closeResults();
  });

  window.addEventListener("resize", () => drawWheel());

  /* ---------- boot ---------- */

  load();
  renderPeople();
  syncGroupFields("groups");
  updateDerived();
  drawWheel();
})();
