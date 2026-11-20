(() => {
  "use strict";

  const STORAGE_KEY = "squadforge-v3";
  const WHEEL_COLORS = [
    "#c8f35a", "#3de0b0", "#8dd3ff", "#ffb8d6",
    "#ffc857", "#b8a1ff", "#ff8f70", "#7dffb3",
    "#6ec8ff", "#f0e68c", "#ff9ecd", "#9ae66e"
  ];
  const DEFAULT_SKILLS = ["Frontend", "Backend", "Design", "DevOps", "QA"];

  const SAMPLE = [
    { name: "Alex Rivera", label: "M", skills: ["Frontend"] },
    { name: "Jordan Lee", label: "F", skills: ["Backend"] },
    { name: "Sam Okonkwo", label: "M", skills: ["Frontend", "Design"] },
    { name: "Riley Chen", label: "F", skills: ["Design"] },
    { name: "Casey Brooks", label: "M", skills: ["DevOps"] },
    { name: "Morgan Vale", label: "F", skills: ["QA"] },
    { name: "Quinn Hart", label: "M", skills: ["Backend", "DevOps"] },
    { name: "Avery Kim", label: "F", skills: ["Frontend"] },
    { name: "Reese Patel", label: "M", skills: ["Backend"] },
    { name: "Parker Nguyen", label: "F", skills: ["QA", "Design"] },
    { name: "Drew Santos", label: "M", skills: ["Frontend", "Backend"] },
    { name: "Blake Ito", label: "F", skills: ["Design"] }
  ];

  const state = {
    people: [],
    skillCatalog: [...DEFAULT_SKILLS],
    selectedSkills: [],
    teamNames: ["Team 1", "Team 2"],
    balanceMode: "skill",
    groups: null,
    representatives: null,
    fairness: null,
    spinning: false,
    revealing: false,
    skipReveal: false,
    visibleCounts: null,
    soundOn: true,
    rotation: 0
  };

  const els = {
    wheel: document.getElementById("wheel"),
    btnSpin: document.getElementById("btnSpin"),
    nameInput: document.getElementById("nameInput"),
    labelSelect: document.getElementById("labelSelect"),
    skillPicker: document.getElementById("skillPicker"),
    skillCatalog: document.getElementById("skillCatalog"),
    newSkillInput: document.getElementById("newSkillInput"),
    bulkInput: document.getElementById("bulkInput"),
    peopleList: document.getElementById("peopleList"),
    groupCount: document.getElementById("groupCount"),
    maxPerGroup: document.getElementById("maxPerGroup"),
    pickQuantity: document.getElementById("pickQuantity"),
    pickReps: document.getElementById("pickReps"),
    showLabels: document.getElementById("showLabels"),
    revealMode: document.getElementById("revealMode"),
    autoArena: document.getElementById("autoArena"),
    keepTogether: document.getElementById("keepTogether"),
    keepApart: document.getElementById("keepApart"),
    teamNames: document.getElementById("teamNames"),
    balanceMode: document.getElementById("balanceMode"),
    balanceHint: document.getElementById("balanceHint"),
    statPeople: document.getElementById("statPeople"),
    statGroups: document.getElementById("statGroups"),
    statPerGroup: document.getElementById("statPerGroup"),
    statFairness: document.getElementById("statFairness"),
    statFairnessWrap: document.getElementById("statFairnessWrap"),
    btnResults: document.getElementById("btnResults"),
    btnClearGroups: document.getElementById("btnClearGroups"),
    resultsModal: document.getElementById("resultsModal"),
    resultsGrid: document.getElementById("resultsGrid"),
    toast: document.getElementById("toast"),
    confetti: document.getElementById("confetti"),
    btnSound: document.getElementById("btnSound"),
    btnArena: document.getElementById("btnArena"),
    arenaBoard: document.getElementById("arenaBoard"),
    arenaTeams: document.getElementById("arenaTeams"),
    arenaCallout: document.getElementById("arenaCallout"),
    arenaFairness: document.getElementById("arenaFairness"),
    modalFairness: document.getElementById("modalFairness"),
    modalCallout: document.getElementById("modalCallout"),
    btnSkipReveal: document.getElementById("btnSkipReveal"),
    btnSkipRevealModal: document.getElementById("btnSkipRevealModal"),
    btnArenaResults: document.getElementById("btnArenaResults"),
    btnExitArena: document.getElementById("btnExitArena"),
    btnOpenArena: document.getElementById("btnOpenArena")
  };

  const ctx = els.wheel.getContext("2d");
  let audioCtx = null;
  let audioReady = null;
  let syncingCounts = false;
  let revealTimer = null;

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

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function ensureAudio() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return Promise.resolve(null);
    if (!audioCtx) audioCtx = new AC();
    audioReady = (async () => {
      if (audioCtx.state === "suspended" || audioCtx.state === "interrupted") {
        try { await audioCtx.resume(); } catch { /* ignore */ }
      }
      return audioCtx;
    })();
    return audioReady;
  }

  async function beep(freq = 660, dur = 0.09, type = "square", gain = 0.18) {
    if (!state.soundOn) return;
    const ac = await ensureAudio();
    if (!ac || ac.state !== "running") return;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ac.currentTime);
    osc.connect(g);
    g.connect(ac.destination);
    const now = ac.currentTime;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(gain, now + 0.01);
    g.gain.linearRampToValueAtTime(0.0001, now + dur);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  function playTick(step = 0) {
    beep(320 + (step % 8) * 55, 0.055, "square", 0.14);
  }

  function playWin() {
    beep(523.25, 0.1, "square", 0.16);
    setTimeout(() => beep(659.25, 0.12, "square", 0.16), 90);
    setTimeout(() => beep(783.99, 0.18, "square", 0.18), 180);
  }

  function playDeal() {
    beep(740, 0.06, "square", 0.12);
  }

  function unlockAudioOnGesture() {
    const unlock = () => {
      ensureAudio();
      document.removeEventListener("pointerdown", unlock);
      document.removeEventListener("keydown", unlock);
    };
    document.addEventListener("pointerdown", unlock, { once: true });
    document.addEventListener("keydown", unlock, { once: true });
  }

  function save() {
    const payload = {
      people: state.people,
      skillCatalog: state.skillCatalog,
      teamNames: state.teamNames,
      balanceMode: state.balanceMode,
      soundOn: state.soundOn,
      groupCount: els.groupCount.value,
      maxPerGroup: els.maxPerGroup.value,
      pickQuantity: els.pickQuantity.value,
      pickReps: els.pickReps.checked,
      showLabels: els.showLabels.checked,
      revealMode: els.revealMode.checked,
      autoArena: els.autoArena.checked,
      keepTogether: els.keepTogether.value,
      keepApart: els.keepApart.value
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }

  function normalizeSkills(input) {
    if (Array.isArray(input)) {
      return [...new Set(input.map((s) => String(s || "").trim()).filter(Boolean))];
    }
    if (typeof input === "string") {
      // ignore legacy numeric skills like "3"
      if (/^[1-5]$/.test(input.trim())) return [];
      return normalizeSkills(input.split(/[+/|;]+/));
    }
    return [];
  }

  function migratePerson(p) {
    const skills = normalizeSkills(p.skills ?? p.skill);
    return {
      id: p.id || uid(),
      name: p.name,
      label: p.label || "",
      skills
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
        || localStorage.getItem("squadforge-v2")
        || localStorage.getItem("squadforge-v1");
      if (!raw) return;
      const data = JSON.parse(raw);
      state.people = Array.isArray(data.people) ? data.people.map(migratePerson) : [];
      const fromPeople = state.people.flatMap((p) => p.skills);
      const savedCatalog = Array.isArray(data.skillCatalog) ? data.skillCatalog : DEFAULT_SKILLS;
      state.skillCatalog = [...new Set([...savedCatalog, ...fromPeople].map((s) => String(s).trim()).filter(Boolean))];
      if (!state.skillCatalog.length) state.skillCatalog = [...DEFAULT_SKILLS];
      state.teamNames = Array.isArray(data.teamNames) ? data.teamNames : state.teamNames;
      state.balanceMode = data.balanceMode || "skill";
      state.soundOn = data.soundOn !== false;
      if (data.groupCount != null) els.groupCount.value = data.groupCount;
      if (data.maxPerGroup != null) els.maxPerGroup.value = data.maxPerGroup;
      if (data.pickQuantity != null) els.pickQuantity.value = data.pickQuantity;
      els.pickReps.checked = !!data.pickReps;
      els.showLabels.checked = data.showLabels !== false;
      els.revealMode.checked = data.revealMode !== false;
      els.autoArena.checked = !!data.autoArena;
      els.keepTogether.value = data.keepTogether || "";
      els.keepApart.value = data.keepApart || "";
    } catch {
      /* ignore */
    }
  }

  /* ---------- skills catalog ---------- */

  function ensureSkillsInCatalog(skills) {
    for (const skill of skills) {
      const exists = state.skillCatalog.some((s) => s.toLowerCase() === skill.toLowerCase());
      if (!exists) state.skillCatalog.push(skill);
    }
  }

  function addSkillToCatalog(raw) {
    const skill = String(raw || "").trim().replace(/\s+/g, " ");
    if (!skill) return false;
    if (state.skillCatalog.some((s) => s.toLowerCase() === skill.toLowerCase())) {
      toast(`“${skill}” already exists`);
      return false;
    }
    state.skillCatalog.push(skill);
    renderSkillCatalog();
    renderSkillPicker();
    renderPeople();
    save();
    toast(`Added skill “${skill}”`);
    return true;
  }

  function removeSkillFromCatalog(skill) {
    state.skillCatalog = state.skillCatalog.filter((s) => s !== skill);
    state.selectedSkills = state.selectedSkills.filter((s) => s !== skill);
    state.people.forEach((p) => {
      p.skills = p.skills.filter((s) => s !== skill);
    });
    renderSkillCatalog();
    renderSkillPicker();
    renderPeople();
    save();
    toast(`Removed “${skill}”`);
  }

  function toggleSelectedSkill(skill) {
    if (state.selectedSkills.includes(skill)) {
      state.selectedSkills = state.selectedSkills.filter((s) => s !== skill);
    } else {
      state.selectedSkills = [...state.selectedSkills, skill];
    }
    renderSkillPicker();
  }

  function renderSkillCatalog() {
    if (!state.skillCatalog.length) {
      els.skillCatalog.innerHTML = `<span class="hint">No skills yet — add your first one.</span>`;
      return;
    }
    els.skillCatalog.innerHTML = state.skillCatalog.map((skill) => `
      <span class="skill-chip">
        ${escapeHtml(skill)}
        <button type="button" class="x" data-remove-skill="${escapeHtml(skill)}" aria-label="Remove ${escapeHtml(skill)}">×</button>
      </span>
    `).join("");
  }

  function renderSkillPicker() {
    els.skillPicker.innerHTML = state.skillCatalog.map((skill) => {
      const on = state.selectedSkills.includes(skill);
      return `<button type="button" class="skill-btn ${on ? "active" : ""}" data-pick-skill="${escapeHtml(skill)}" aria-pressed="${on}">${escapeHtml(skill)}</button>`;
    }).join("");
  }

  function skillTagsHtml(skills) {
    if (!skills?.length) return `<span class="skill-tag">No skill</span>`;
    return skills.map((s) => `<span class="skill-tag">${escapeHtml(s)}</span>`).join("");
  }

  /* ---------- people ---------- */

  function addPerson(name, label = "", skills = []) {
    const cleaned = name.trim().replace(/\s+/g, " ");
    if (!cleaned) return false;
    if (state.people.some((p) => p.name.toLowerCase() === cleaned.toLowerCase())) {
      toast(`“${cleaned}” is already on the list`);
      return false;
    }
    const normalized = normalizeSkills(skills);
    ensureSkillsInCatalog(normalized);
    state.people.push({
      id: uid(),
      name: cleaned,
      label: (label || "").trim().toUpperCase(),
      skills: normalized
    });
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
      const parts = raw.split(",").map((s) => s.trim());
      let label = "";
      let skills = [];
      if (parts.length === 2) {
        if (/^[MFAB]$/i.test(parts[1])) label = parts[1];
        else skills = normalizeSkills(parts[1]);
      } else if (parts.length >= 3) {
        label = /^[MFAB]$/i.test(parts[1]) ? parts[1] : "";
        const skillPart = label ? parts.slice(2).join(",") : parts.slice(1).join(",");
        skills = normalizeSkills(skillPart);
      }
      if (addPerson(parts[0], label, skills)) added++;
    }
    els.bulkInput.value = "";
    if (added) {
      renderSkillCatalog();
      renderSkillPicker();
      renderPeople();
      updateDerived();
      save();
      drawWheel();
      toast(`Imported ${added} name${added === 1 ? "" : "s"}`);
    } else {
      toast("No new names to import");
    }
  }

  function labelOptions(selected) {
    return ["", "M", "F", "A", "B"].map((n) =>
      `<option value="${n}" ${selected === n ? "selected" : ""}>${n || "—"}</option>`
    ).join("");
  }

  function renderPeople() {
    if (!state.people.length) {
      els.peopleList.innerHTML = `<div class="empty">No people yet. Add names with skills, or load the sample squad.</div>`;
      return;
    }
    els.peopleList.innerHTML = state.people.map((p, i) => `
      <div class="person" data-id="${p.id}">
        <span class="person-index">${i + 1}</span>
        <div>
          <div class="person-name-row">
            <span class="person-name">${escapeHtml(p.name)}</span>
            ${skillTagsHtml(p.skills)}
          </div>
        </div>
        <div class="person-meta">
          <div class="person-edit">
            <select data-edit-label="${p.id}" aria-label="Label for ${escapeHtml(p.name)}" title="Label">
              ${labelOptions(p.label || "")}
            </select>
            <div class="person-skills-edit" data-person-skills="${p.id}">
              ${state.skillCatalog.map((skill) => {
                const on = p.skills.includes(skill);
                return `<button type="button" class="skill-btn ${on ? "active" : ""}" data-toggle-person-skill="${p.id}" data-skill="${escapeHtml(skill)}" aria-pressed="${on}">${escapeHtml(skill)}</button>`;
              }).join("")}
            </div>
          </div>
          <button type="button" class="remove-btn" data-remove="${p.id}" aria-label="Remove ${escapeHtml(p.name)}">×</button>
        </div>
      </div>
    `).join("");
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
      els.maxPerGroup.value = String(Math.ceil(people / groups));
    } else if (source === "max") {
      const max = parseInt(els.maxPerGroup.value, 10);
      if (Number.isFinite(max) && max > 0) {
        els.groupCount.value = String(Math.min(100, Math.max(1, Math.ceil(people / max))));
      }
    } else {
      els.maxPerGroup.value = String(Math.ceil(people / activeGroupCount()));
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

  function syncGroupCountFromTeams() {
    const count = Math.max(1, Math.min(100, state.teamNames.length));
    ensureTeamNames(count);
    syncingCounts = true;
    els.groupCount.value = String(count);
    const people = poolSize();
    if (people) els.maxPerGroup.value = String(Math.ceil(people / count));
    syncingCounts = false;
  }

  function addTeam(customName = "") {
    if (state.teamNames.length >= 100) {
      toast("Maximum 100 teams");
      return;
    }
    const name = customName.trim() || `Team ${state.teamNames.length + 1}`;
    state.teamNames.push(name);
    clearResultState(false);
    syncGroupCountFromTeams();
    renderTeamNames();
    updateDerived();
    save();
    toast(`Added “${name}”`);
  }

  function removeTeam(index) {
    if (state.teamNames.length <= 1) {
      toast("Keep at least one team");
      return;
    }
    const removed = state.teamNames[index] || `Team ${index + 1}`;
    state.teamNames.splice(index, 1);
    clearResultState(false);
    syncGroupCountFromTeams();
    renderTeamNames();
    updateDerived();
    save();
    toast(`Removed “${removed}”`);
  }

  function renderTeamNames() {
    const count = activeGroupCount();
    ensureTeamNames(count);
    const canRemove = state.teamNames.length > 1;
    els.teamNames.innerHTML = state.teamNames.map((name, i) => `
      <div class="team-name-row">
        <span class="team-swatch" style="background:${WHEEL_COLORS[i % WHEEL_COLORS.length]}"></span>
        <input type="text" data-team-index="${i}" value="${escapeHtml(name)}" aria-label="Team ${i + 1} name" />
        <button type="button" class="team-remove" data-remove-team="${i}" aria-label="Remove ${escapeHtml(name)}" ${canRemove ? "" : "disabled"}>×</button>
      </div>
    `).join("");
  }

  function updateDerived() {
    const people = poolSize();
    const groups = activeGroupCount();
    els.statPeople.textContent = String(state.people.length);
    els.statGroups.textContent = String(groups);
    els.statPerGroup.textContent = people && groups
      ? String((people / groups).toFixed(people % groups === 0 ? 0 : 1))
      : "—";
    els.btnSpin.disabled = state.people.length < 2 || state.spinning || state.revealing;
    els.btnResults.disabled = !state.groups;
    els.btnClearGroups.disabled = !state.groups;
    els.btnArenaResults.disabled = !state.groups;
    if (state.fairness) {
      els.statFairnessWrap.hidden = false;
      els.statFairness.textContent = String(state.fairness.score);
    } else {
      els.statFairnessWrap.hidden = true;
    }
    renderTeamNames();
    updateBalanceUI();
  }

  function updateBalanceUI() {
    els.balanceMode.querySelectorAll(".seg").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.mode === state.balanceMode);
    });
    const hints = {
      default: "Shuffle everyone evenly across teams.",
      skill: "Spread skill types (Frontend, Backend, …) evenly across teams.",
      gender: "Balance M/F labels across teams (uses M & F tags).",
      label: "Balance any custom labels evenly across teams."
    };
    els.balanceHint.textContent = hints[state.balanceMode] || hints.default;
    els.btnSound.setAttribute("aria-pressed", String(state.soundOn));
    els.btnSound.textContent = state.soundOn ? "Sound on" : "Sound off";
    els.btnSound.title = state.soundOn
      ? "Mute wheel ticks and finish sounds"
      : "Unmute wheel ticks and finish sounds";
    const arenaOn = document.body.classList.contains("arena-mode");
    els.btnArena.setAttribute("aria-pressed", String(arenaOn));
    els.btnArena.textContent = arenaOn ? "Exit arena" : "Arena";
  }

  /* ---------- fairness ---------- */

  function varianceScore(values) {
    if (!values.length) return 100;
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    if (avg === 0) return 100;
    const max = Math.max(...values);
    const min = Math.min(...values);
    const spread = (max - min) / avg;
    return Math.max(0, Math.min(100, Math.round(100 - spread * 70)));
  }

  function calcFairness(teams) {
    if (!teams?.length) return null;
    const parts = [];
    const sizes = teams.map((t) => t.length);
    const sizeScore = varianceScore(sizes);
    parts.push({ key: "size", score: sizeScore, label: `Size ${sizeScore}` });

    const labeled = teams.some((t) => t.some((p) => p.label));
    if (labeled) {
      const labels = [...new Set(teams.flatMap((t) => t.map((p) => p.label).filter(Boolean)))];
      const labelScores = labels.map((label) => {
        const counts = teams.map((t) => t.filter((p) => p.label === label).length);
        return varianceScore(counts);
      });
      const labelScore = Math.round(labelScores.reduce((a, b) => a + b, 0) / labelScores.length);
      parts.push({ key: "label", score: labelScore, label: `Labels ${labelScore}` });
    }

    const allSkills = [...new Set(teams.flatMap((t) => t.flatMap((p) => p.skills || [])))];
    if (allSkills.length) {
      const skillScores = allSkills.map((skill) => {
        const counts = teams.map((t) => t.filter((p) => (p.skills || []).includes(skill)).length);
        return varianceScore(counts);
      });
      const skillScore = Math.round(skillScores.reduce((a, b) => a + b, 0) / skillScores.length);
      parts.push({ key: "skill", score: skillScore, label: `Skills ${skillScore}` });
    }

    const score = Math.round(parts.reduce((a, p) => a + p.score, 0) / parts.length);
    let grade = "Uneven";
    if (score >= 85) grade = "Excellent";
    else if (score >= 70) grade = "Balanced";
    else if (score >= 55) grade = "Decent";

    return { score, grade, parts };
  }

  function fairnessHtml(fairness) {
    if (!fairness) return "";
    const tier = fairness.score >= 70 ? "high" : fairness.score >= 55 ? "mid" : "low";
    return `
      <div class="fairness-top">
        <span class="fairness-score">${fairness.score}</span>
        <span class="fairness-label">${escapeHtml(fairness.grade)}</span>
      </div>
      <div class="fairness-bar"><div class="fairness-fill ${tier}" style="width:${fairness.score}%"></div></div>
      <p class="fairness-detail">${fairness.parts.map((p) => p.label).join(" · ")}</p>
    `;
  }

  function renderFairnessWidgets() {
    const html = fairnessHtml(state.fairness);
    if (state.fairness) {
      els.modalFairness.hidden = false;
      els.arenaFairness.hidden = false;
      els.modalFairness.innerHTML = html;
      els.arenaFairness.innerHTML = html;
    } else {
      els.modalFairness.hidden = true;
      els.arenaFairness.hidden = true;
      els.modalFairness.innerHTML = "";
      els.arenaFairness.innerHTML = "";
    }
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

  function teamSkillCount(team, skill) {
    return team.filter((p) => (p.skills || []).includes(skill)).length;
  }

  function skillOverlapScore(team, person) {
    // Higher = team already has more of this person's skills (worse placement)
    return (person.skills || []).reduce((sum, skill) => sum + teamSkillCount(team, skill), 0);
  }

  function balanceBySkill(pool, groupCount) {
    // Place each person onto the team that least already has their skills
    const ranked = shuffle(pool).sort((a, b) => (b.skills?.length || 0) - (a.skills?.length || 0));
    const teams = Array.from({ length: groupCount }, () => []);
    for (const person of ranked) {
      let best = 0;
      let bestScore = skillOverlapScore(teams[0], person);
      let bestSize = teams[0].length;
      for (let i = 1; i < groupCount; i++) {
        const score = skillOverlapScore(teams[i], person);
        const size = teams[i].length;
        if (score < bestScore || (score === bestScore && size < bestSize)) {
          best = i;
          bestScore = score;
          bestSize = size;
        }
      }
      teams[best].push(person);
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
    for (let attempt = 0; attempt < 48; attempt++) {
      let candidate;
      if (hasTogether && state.balanceMode === "skill") {
        const clusters = shuffle(buildClusters(shuffle(pool))).map((c) => shuffle(c));
        candidate = Array.from({ length: groupCount }, () => []);
        for (const cluster of clusters) {
          let best = 0;
          let bestScore = cluster.reduce((sum, p) => sum + skillOverlapScore(candidate[0], p), 0);
          for (let i = 1; i < groupCount; i++) {
            const score = cluster.reduce((sum, p) => sum + skillOverlapScore(candidate[i], p), 0);
            if (score < bestScore || (score === bestScore && candidate[i].length < candidate[best].length)) {
              best = i;
              bestScore = score;
            }
          }
          candidate[best].push(...cluster);
        }
      } else if (hasTogether) {
        candidate = placeClusters(shuffle(buildClusters(shuffle(pool))), groupCount);
      } else if (state.balanceMode === "skill") {
        candidate = balanceBySkill(pool, groupCount);
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

    teams = teams.map((t) => shuffle(t));
    const reps = els.pickReps.checked
      ? teams.map((t) => (t.length ? t[Math.floor(Math.random() * t.length)].id : null))
      : null;

    return { teams, reps, poolSize: pool.length, groupCount };
  }

  /* ---------- wheel ---------- */

  function drawWheel() {
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
      ctx.fillStyle = WHEEL_COLORS[i % WHEEL_COLORS.length];
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

    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(54, size * 0.12), 0, Math.PI * 2);
    ctx.fillStyle = "#0b1210";
    ctx.fill();
  }

  async function spinWheel(onDone) {
    if (state.spinning) return;
    state.spinning = true;
    els.btnSpin.disabled = true;
    await ensureAudio();

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
        playTick(tick);
      }

      if (t < 1) requestAnimationFrame(frame);
      else {
        state.spinning = false;
        playWin();
        onDone();
        updateDerived();
      }
    }
    requestAnimationFrame(frame);
  }

  /* ---------- results / reveal / arena ---------- */

  function memberLi(person, teamIndex, animate = false) {
    const showLabels = els.showLabels.checked;
    const isRep = state.representatives && state.representatives[teamIndex] === person.id;
    const label = showLabels && person.label
      ? `<span class="chip ${person.label === "M" ? "m" : person.label === "F" ? "f" : ""}">${escapeHtml(person.label)}</span>`
      : "";
    return `<li class="${animate ? "member-enter" : ""}">
      <span>${escapeHtml(person.name)} ${label} ${skillTagsHtml(person.skills)}</span>
      ${isRep ? `<span class="rep-badge">Rep</span>` : ""}
    </li>`;
  }

  function teamCardHtml(team, index, visibleCount) {
    const name = state.teamNames[index] || `Team ${index + 1}`;
    const color = WHEEL_COLORS[index % WHEEL_COLORS.length];
    const shown = team.slice(0, visibleCount);
    const members = shown.map((p, mi) => memberLi(p, index, mi === shown.length - 1 && state.revealing)).join("");
    return `
      <article class="result-team arena-team" data-team-index="${index}" style="border-color:${color}55; box-shadow: inset 3px 0 0 ${color}">
        <div class="result-head">
          <h3 class="result-name">${escapeHtml(name)}</h3>
          <span class="result-count">${visibleCount}/${team.length}</span>
        </div>
        <ul class="result-members">${members || `<li class="empty-slot">Waiting…</li>`}</ul>
      </article>`;
  }

  function renderBoards() {
    if (!state.groups) return;
    const counts = state.visibleCounts || state.groups.map((t) => t.length);
    els.resultsGrid.innerHTML = state.groups.map((team, i) => teamCardHtml(team, i, counts[i])).join("");
    els.arenaTeams.innerHTML = state.groups.map((team, i) => teamCardHtml(team, i, counts[i])).join("");
    renderFairnessWidgets();
  }

  function setCallout(text) {
    [els.arenaCallout, els.modalCallout].forEach((el) => {
      if (!text) {
        el.classList.remove("show");
        el.textContent = "";
        return;
      }
      el.innerHTML = text;
      el.classList.remove("show");
      void el.offsetWidth;
      el.classList.add("show");
    });
  }

  function setSkipVisible(on) {
    els.btnSkipReveal.hidden = !on;
    els.btnSkipRevealModal.hidden = !on;
  }

  function stopReveal() {
    state.revealing = false;
    state.skipReveal = false;
    if (revealTimer) {
      clearTimeout(revealTimer);
      revealTimer = null;
    }
    setSkipVisible(false);
  }

  function buildDealQueue(teams) {
    const queue = [];
    const max = Math.max(...teams.map((t) => t.length), 0);
    for (let slot = 0; slot < max; slot++) {
      for (let ti = 0; ti < teams.length; ti++) {
        if (teams[ti][slot]) queue.push({ teamIndex: ti, person: teams[ti][slot] });
      }
    }
    return queue;
  }

  function finishReveal() {
    stopReveal();
    state.visibleCounts = state.groups.map((t) => t.length);
    renderBoards();
    setCallout("<strong>Draft complete</strong> — squads are locked in.");
    burstConfetti();
    updateDerived();
  }

  function runReveal() {
    stopReveal();
    state.revealing = true;
    state.skipReveal = false;
    state.visibleCounts = state.groups.map(() => 0);
    setSkipVisible(true);
    renderBoards();
    updateDerived();

    const queue = buildDealQueue(state.groups);
    let i = 0;

    const step = () => {
      if (!state.revealing) return;
      if (state.skipReveal || i >= queue.length) {
        finishReveal();
        return;
      }
      const { teamIndex, person } = queue[i];
      state.visibleCounts[teamIndex] += 1;
      const teamName = state.teamNames[teamIndex] || `Team ${teamIndex + 1}`;
      setCallout(`<strong>${escapeHtml(person.name)}</strong> joins <strong>${escapeHtml(teamName)}</strong>`);
      playDeal();
      renderBoards();
      i += 1;
      revealTimer = setTimeout(step, 520);
    };

    revealTimer = setTimeout(step, 350);
  }

  function presentResults({ forceModal = false } = {}) {
    if (!state.groups) return;
    state.fairness = calcFairness(state.groups);
    renderFairnessWidgets();
    updateDerived();

    const useArena = document.body.classList.contains("arena-mode") || els.autoArena.checked;
    if (useArena) enterArena(false);

    const animate = els.revealMode.checked;
    if (animate) {
      if (!document.body.classList.contains("arena-mode") || forceModal) {
        els.resultsModal.hidden = false;
      }
      runReveal();
    } else {
      state.visibleCounts = state.groups.map((t) => t.length);
      renderBoards();
      setCallout("");
      if (!document.body.classList.contains("arena-mode") || forceModal) {
        els.resultsModal.hidden = false;
      }
      burstConfetti();
    }
  }

  function showResultsInstant() {
    if (!state.groups) return;
    stopReveal();
    state.fairness = calcFairness(state.groups);
    state.visibleCounts = state.groups.map((t) => t.length);
    renderBoards();
    setCallout("");
    els.resultsModal.hidden = false;
    updateDerived();
  }

  function closeResults() {
    if (state.revealing) return;
    els.resultsModal.hidden = true;
  }

  function enterArena(announce = true) {
    document.body.classList.add("arena-mode");
    els.arenaBoard.hidden = false;
    updateBalanceUI();
    if (state.groups) {
      if (!state.visibleCounts) state.visibleCounts = state.groups.map((t) => t.length);
      renderBoards();
    } else {
      els.arenaTeams.innerHTML = `<div class="empty">Spin to fill the arena board.</div>`;
    }
    drawWheel();
    if (announce) toast("Arena mode on — great for projectors");
  }

  function exitArena(announce = true) {
    if (!document.body.classList.contains("arena-mode")) return;
    document.body.classList.remove("arena-mode");
    els.arenaBoard.hidden = true;
    updateBalanceUI();
    drawWheel();
    if (announce) toast("Arena mode off");
  }

  function toggleArena() {
    if (document.body.classList.contains("arena-mode")) exitArena();
    else enterArena();
  }

  function resultsPlainText() {
    if (!state.groups) return "";
    const fair = state.fairness ? `\nFairness: ${state.fairness.score}/100 (${state.fairness.grade})\n` : "\n";
    return state.groups.map((team, i) => {
      const title = state.teamNames[i] || `Team ${i + 1}`;
      const lines = team.map((p) => {
        const rep = state.representatives && state.representatives[i] === p.id ? " (Rep)" : "";
        const label = p.label ? ` [${p.label}]` : "";
        const skills = p.skills?.length ? ` {${p.skills.join(" + ")}}` : "";
        return `- ${p.name}${label}${skills}${rep}`;
      });
      return `${title}\n${lines.join("\n")}`;
    }).join("\n\n") + fair;
  }

  function downloadCsv() {
    if (!state.groups) return;
    const rows = [["Team", "Name", "Label", "Skills", "Representative"]];
    state.groups.forEach((team, i) => {
      const title = state.teamNames[i] || `Team ${i + 1}`;
      team.forEach((p) => {
        const rep = state.representatives && state.representatives[i] === p.id ? "Yes" : "";
        rows.push([title, p.name, p.label || "", (p.skills || []).join(" + "), rep]);
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
    const height = padding * 2 + 110 + rows * (90 + maxMembers * 28);
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
    const fairLine = state.fairness ? ` · Fairness ${state.fairness.score}/100` : "";
    g.fillText(`Random team results${fairLine}`, padding, padding + 64);

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
        const skills = p.skills?.length ? ` [${p.skills.join("+")}]` : "";
        g.fillText(`${p.name}${label}${skills}${rep}`, x + 18, y + 62 + mi * 26);
      });
    });

    const a = document.createElement("a");
    a.href = c.toDataURL("image/png");
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

  function clearResultState(updateUi = true) {
    stopReveal();
    state.groups = null;
    state.representatives = null;
    state.fairness = null;
    state.visibleCounts = null;
    setCallout("");
    els.resultsGrid.innerHTML = "";
    els.arenaTeams.innerHTML = "";
    renderFairnessWidgets();
    if (updateUi) updateDerived();
  }

  function runGrouping() {
    if (state.people.length < 2) {
      toast("Add at least 2 people");
      return;
    }
    if (state.revealing) {
      toast("Reveal in progress — skip or wait");
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
      state.fairness = calcFairness(state.groups);
      updateDerived();
      save();
      presentResults();
    });
  }

  function clearGroups() {
    clearResultState();
    closeResults();
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

  document.getElementById("btnAddSkill").addEventListener("click", () => {
    if (addSkillToCatalog(els.newSkillInput.value)) {
      els.newSkillInput.value = "";
      els.newSkillInput.focus();
    }
  });
  els.newSkillInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      document.getElementById("btnAddSkill").click();
    }
  });

  els.skillCatalog.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-remove-skill]");
    if (!btn) return;
    removeSkillFromCatalog(btn.dataset.removeSkill);
  });

  els.skillPicker.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-pick-skill]");
    if (!btn) return;
    toggleSelectedSkill(btn.dataset.pickSkill);
  });

  document.getElementById("btnAdd").addEventListener("click", () => {
    if (!state.selectedSkills.length) {
      toast("Pick at least one skill for this person");
      return;
    }
    if (addPerson(els.nameInput.value, els.labelSelect.value, state.selectedSkills)) {
      els.nameInput.value = "";
      els.labelSelect.value = "";
      state.selectedSkills = [];
      renderSkillPicker();
      els.nameInput.focus();
      renderPeople();
      updateDerived();
      syncGroupFields("groups");
      save();
      drawWheel();
      beep(620, 0.07, "square", 0.12);
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
    state.skillCatalog = [...DEFAULT_SKILLS];
    state.people = SAMPLE.map((p) => ({ ...p, id: uid(), skills: [...p.skills] }));
    state.selectedSkills = [];
    els.groupCount.value = "3";
    clearResultState(false);
    renderSkillCatalog();
    renderSkillPicker();
    renderPeople();
    syncGroupFields("groups");
    updateDerived();
    save();
    drawWheel();
    toast("Sample squad loaded");
  });

  document.getElementById("btnClearPeople").addEventListener("click", () => {
    state.people = [];
    clearResultState(false);
    renderPeople();
    updateDerived();
    save();
    drawWheel();
    toast("People cleared");
  });

  els.peopleList.addEventListener("click", (e) => {
    const removeId = e.target.dataset.remove;
    if (removeId) {
      removePerson(removeId);
      return;
    }
    const toggle = e.target.closest("[data-toggle-person-skill]");
    if (!toggle) return;
    const person = state.people.find((p) => p.id === toggle.dataset.togglePersonSkill);
    if (!person) return;
    const skill = toggle.dataset.skill;
    if (person.skills.includes(skill)) {
      person.skills = person.skills.filter((s) => s !== skill);
    } else {
      person.skills = [...person.skills, skill];
    }
    renderPeople();
    save();
  });

  els.peopleList.addEventListener("change", (e) => {
    const labelEl = e.target.closest("[data-edit-label]");
    if (!labelEl) return;
    const person = state.people.find((p) => p.id === labelEl.dataset.editLabel);
    if (person) {
      person.label = labelEl.value;
      save();
    }
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

  ["pickReps", "showLabels", "revealMode", "autoArena", "keepTogether", "keepApart"].forEach((id) => {
    document.getElementById(id).addEventListener("change", save);
    document.getElementById(id).addEventListener("input", save);
  });

  els.teamNames.addEventListener("input", (e) => {
    const input = e.target.closest("input[data-team-index]");
    if (!input) return;
    state.teamNames[Number(input.dataset.teamIndex)] = input.value;
    save();
  });

  els.teamNames.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-remove-team]");
    if (!btn) return;
    removeTeam(Number(btn.dataset.removeTeam));
  });

  const newTeamInput = document.getElementById("newTeamInput");
  document.getElementById("btnAddTeam").addEventListener("click", () => {
    addTeam(newTeamInput.value);
    newTeamInput.value = "";
    newTeamInput.focus();
  });
  newTeamInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      document.getElementById("btnAddTeam").click();
    }
  });

  document.getElementById("btnResetTeamNames").addEventListener("click", () => {
    const count = activeGroupCount();
    state.teamNames = Array.from({ length: count }, (_, i) => `Team ${i + 1}`);
    renderTeamNames();
    save();
    toast("Team names reset");
  });

  els.btnSpin.addEventListener("click", runGrouping);
  document.getElementById("btnRespin").addEventListener("click", () => {
    stopReveal();
    closeResults();
    runGrouping();
  });
  els.btnResults.addEventListener("click", showResultsInstant);
  els.btnClearGroups.addEventListener("click", clearGroups);
  els.btnArenaResults.addEventListener("click", showResultsInstant);

  document.querySelectorAll("[data-close='results']").forEach((el) => {
    el.addEventListener("click", closeResults);
  });

  const skip = () => { state.skipReveal = true; };
  els.btnSkipReveal.addEventListener("click", skip);
  els.btnSkipRevealModal.addEventListener("click", skip);

  els.btnArena.addEventListener("click", toggleArena);
  els.btnExitArena.addEventListener("click", exitArena);
  els.btnOpenArena.addEventListener("click", () => {
    closeResults();
    enterArena();
    if (state.groups && !state.revealing) {
      state.visibleCounts = state.groups.map((t) => t.length);
      renderBoards();
    }
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

  document.getElementById("btnSound").addEventListener("click", async () => {
    state.soundOn = !state.soundOn;
    updateBalanceUI();
    save();
    if (state.soundOn) {
      await ensureAudio();
      await beep(660, 0.12, "square", 0.22);
      toast("Wheel sounds on — you should hear a beep");
    } else {
      toast("Wheel sounds muted");
    }
  });

  document.getElementById("btnResetAll").addEventListener("click", () => {
    if (!confirm("Reset all people, rules, and results?")) return;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("squadforge-v2");
    localStorage.removeItem("squadforge-v1");
    state.people = [];
    state.skillCatalog = [...DEFAULT_SKILLS];
    state.selectedSkills = [];
    state.teamNames = ["Team 1", "Team 2"];
    state.balanceMode = "skill";
    clearResultState(false);
    els.groupCount.value = "2";
    els.maxPerGroup.value = "";
    els.pickQuantity.value = "";
    els.pickReps.checked = false;
    els.showLabels.checked = true;
    els.revealMode.checked = true;
    els.autoArena.checked = false;
    els.keepTogether.value = "";
    els.keepApart.value = "";
    exitArena(false);
    renderSkillCatalog();
    renderSkillPicker();
    renderPeople();
    updateDerived();
    drawWheel();
    els.resultsModal.hidden = true;
    toast("Everything reset");
  });

  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      runGrouping();
    }
    if (e.key === "Escape") {
      if (state.revealing) {
        state.skipReveal = true;
        return;
      }
      if (!els.resultsModal.hidden) closeResults();
      else if (document.body.classList.contains("arena-mode")) exitArena();
    }
  });

  window.addEventListener("resize", () => drawWheel());

  /* ---------- boot ---------- */

  load();
  unlockAudioOnGesture();
  renderSkillCatalog();
  renderSkillPicker();
  renderPeople();
  syncGroupFields("groups");
  updateDerived();
  drawWheel();
})();
