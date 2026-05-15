'use strict';

// ── State ───────────────────────────────────────────────
let shows = [];
let activeFilter = 'all';
let activeShowId = null;

// ── Color helpers ───────────────────────────────────────

const COLOR_MAP = {
  violet:     '#9b59b6',
  magenta:    '#c0397a',
  fuchsia:    '#d63aad',
  rouge:      '#e53e3e',
  orange:     '#dd6b20',
  jaune:      '#d69e2e',
  doré:       '#b7791f',
  vert:       '#38a169',
  blanc:      '#f0f0f0',
  multicolore:'#9f7aea',
};

function colorFor(name) {
  return COLOR_MAP[name] || '#6b7280';
}

// ── Time helpers ────────────────────────────────────────

function secToTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function pct(sec, total) {
  return Math.min((sec / total) * 100, 100).toFixed(3);
}

// ── Energy label ────────────────────────────────────────

const ENERGY_LABELS = { low: 'Faible', medium: 'Modérée', high: 'Forte', max: 'Maximum' };

function energyLabel(e) { return ENERGY_LABELS[e] || e; }

// ── Type helpers ────────────────────────────────────────

const TYPE_LABELS = { section: 'Section', accent: 'Accent', temps_fort: 'Temps fort' };

function typeLabel(t) { return TYPE_LABELS[t] || t; }

// ── Render: index ───────────────────────────────────────

function renderIndex() {
  const grid = document.getElementById('shows-grid');
  grid.innerHTML = shows.map(show => {
    const sectionCount = show.cues.filter(c => c.type === 'section').length;
    const accentCount  = show.cues.filter(c => c.type !== 'section').length;
    return `
      <div class="show-card" style="--show-color:${show.color}" data-id="${show.id}" onclick="openShow('${show.id}')">
        <div class="show-card-id">${show.id}</div>
        <div class="show-card-title">${show.title}</div>
        <div class="show-card-song">${show.song}</div>
        <div class="show-card-meta">
          <span class="show-card-meta-item">
            ${iconPeople()} ${show.dancers} danseurs
          </span>
          <span class="show-card-meta-item">
            ${iconClock()} ${show.duration}
          </span>
          <span class="show-card-meta-item">
            ${iconBolt()} ${sectionCount} sections · ${accentCount} accents
          </span>
        </div>
      </div>`;
  }).join('');
}

// ── Render: detail ──────────────────────────────────────

function renderDetail(show) {
  // Title block
  document.getElementById('detail-id').textContent    = show.id;
  document.getElementById('detail-id').style.color    = show.color;
  document.getElementById('detail-title').textContent = show.title;
  document.getElementById('detail-song').textContent  = show.song;

  // Badges
  const badges = document.getElementById('detail-badges');
  badges.innerHTML = `
    <span class="badge">${iconPeople()} ${show.dancers} danseurs</span>
    <span class="badge">${iconClock()} ${show.duration}</span>
    <span class="badge"><span class="color-dot" style="background:${show.color}"></span> ${show.colorLabel}</span>`;

  // Stats
  const total     = show.cues.length;
  const sections  = show.cues.filter(c => c.type === 'section').length;
  const accents   = show.cues.filter(c => c.type === 'accent').length;
  const tempsFort = show.cues.filter(c => c.type === 'temps_fort').length;

  document.getElementById('stat-total').textContent     = total;
  document.getElementById('stat-sections').textContent  = sections;
  document.getElementById('stat-accents').textContent   = accents;
  document.getElementById('stat-tempsfort').textContent = tempsFort;

  // Timeline
  renderTimeline(show);

  // Cue list
  renderCueList(show, activeFilter);

  // Set CSS var on detail view
  document.getElementById('detail-view').style.setProperty('--show-color', show.color);
}

function renderTimeline(show) {
  const track = document.getElementById('timeline-track');
  const ruler = document.getElementById('timeline-ruler');
  const total = show.durationSec;

  // Build segments only from section-type cues (so they paint the track)
  const sections = show.cues.filter(c => c.type === 'section');
  const accents  = show.cues.filter(c => c.type !== 'section');

  // Assign hue per section using show color with varying opacity for energy
  const energyOpacity = { low: 0.35, medium: 0.55, high: 0.75, max: 1.0 };

  track.innerHTML = sections.map(cue => {
    const left  = pct(cue.startSec, total);
    const width = pct(cue.endSec - cue.startSec, total);
    const op    = energyOpacity[cue.energy] || 0.6;
    // hex to rgba
    const rgba  = hexAlpha(show.color, op);
    return `
      <div class="timeline-segment"
           style="left:${left}%;width:${width}%;background:${rgba}"
           title="${cue.sectionName} (${cue.startTime}–${cue.endTime})"
           onclick="highlightCue('${cue.startTime}-${cue.sectionName}')">
        <span class="timeline-segment-label">${cue.sectionName}</span>
      </div>`;
  }).join('');

  // Accent markers
  track.innerHTML += accents.map(cue => {
    const left = pct(cue.startSec, total);
    const color = cue.type === 'temps_fort' ? '#e53e3e' : '#f6c344';
    return `<div class="timeline-marker" style="left:${left}%;background:${color}" title="${cue.sectionName} (${cue.startTime})"></div>`;
  }).join('');

  // Ruler ticks (every minute, plus start/end)
  const ticks = [];
  for (let s = 0; s <= total; s += 60) {
    ticks.push(s);
  }
  // always include end
  if (ticks[ticks.length - 1] !== total) ticks.push(total);

  ruler.innerHTML = ticks.map(s => {
    const pos = pct(s, total);
    return `<span class="timeline-tick" style="left:${pos}%">${secToTime(s)}</span>`;
  }).join('');
}

function renderCueList(show, filter) {
  const list = document.getElementById('cue-list');
  let cues = show.cues;
  if (filter !== 'all') cues = cues.filter(c => c.type === filter);

  list.innerHTML = cues.map(cue => {
    const isPoint = cue.startSec === cue.endSec;
    const timeEnd = isPoint ? '' : `<div class="cue-time-end">→ ${cue.endTime}</div>`;
    const colorTags = cue.colors.map(c =>
      `<span class="cue-tag cue-tag-color" style="border-color:${colorFor(c)};color:${colorFor(c)}">
        <span class="color-dot" style="background:${colorFor(c)}"></span>${c}
       </span>`).join('');

    return `
      <div class="cue-item" data-type="${cue.type}" data-key="${cue.startTime}-${cue.sectionName}" id="cue-${cssKey(cue)}">
        <div class="cue-time">
          <div class="cue-time-start">${cue.startTime}</div>
          ${timeEnd}
        </div>
        <div class="cue-body">
          <div class="cue-section-name">
            <span class="type-badge type-badge-${cue.type}">${typeLabel(cue.type)}</span>${cue.sectionName}
          </div>
          <div class="cue-description">${cue.description}</div>
          <div class="cue-tags">${colorTags}</div>
        </div>
        <div class="cue-energy-badge energy-${cue.energy}">${energyLabel(cue.energy)}</div>
      </div>`;
  }).join('');
}

// ── Navigation ──────────────────────────────────────────

function openShow(id) {
  const show = shows.find(s => s.id === id);
  if (!show) return;
  activeShowId = id;
  activeFilter = 'all';

  document.getElementById('index-view').classList.add('hidden');
  const dv = document.getElementById('detail-view');
  dv.classList.add('active');

  renderDetail(show);
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Update filter button color
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.style.setProperty('--show-color', show.color);
  });
}

function goBack() {
  activeShowId = null;
  document.getElementById('index-view').classList.remove('hidden');
  document.getElementById('detail-view').classList.remove('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setFilter(filter) {
  activeFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });
  const show = shows.find(s => s.id === activeShowId);
  if (show) renderCueList(show, filter);
}

function highlightCue(key) {
  document.querySelectorAll('.cue-item.highlighted').forEach(el => el.classList.remove('highlighted'));
  const el = document.querySelector(`.cue-item[data-key="${key}"]`);
  if (el) {
    el.classList.add('highlighted');
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

// ── Utilities ───────────────────────────────────────────

function cssKey(cue) {
  return (cue.startTime + '-' + cue.sectionName).replace(/[^a-zA-Z0-9]/g, '-');
}

function hexAlpha(hex, alpha) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ── Icons (inline SVG) ──────────────────────────────────

function iconPeople() {
  return `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
  </svg>`;
}

function iconClock() {
  return `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/>
  </svg>`;
}

function iconBolt() {
  return `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <path d="M7 2v11h3v9l7-12h-4l4-8z"/>
  </svg>`;
}

// ── Boot ────────────────────────────────────────────────

async function init() {
  try {
    const resp = await fetch('data/shows.json');
    shows = await resp.json();
    renderIndex();
  } catch (e) {
    console.error('Failed to load shows data:', e);
    document.getElementById('shows-grid').innerHTML =
      '<p style="color:var(--text-muted);padding:16px">Impossible de charger les données du spectacle.</p>';
  }
}

document.addEventListener('DOMContentLoaded', init);
