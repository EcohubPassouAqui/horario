function isMobile() {
  return window.innerWidth < 1024 || /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function handleDeviceCheck() {
  const wall = document.getElementById('mobileWall');
  const site = document.getElementById('siteWrap');
  if (isMobile()) {
    wall.classList.add('show');
    site.style.display = 'none';
  } else {
    wall.classList.remove('show');
    site.style.display = '';
  }
}

window.addEventListener('resize', handleDeviceCheck);

function goTo(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const sec = document.getElementById(id);
  const btn = document.querySelector(`.nav-btn[data-section="${id}"]`);
  if (sec) sec.classList.add('active');
  if (btn) btn.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => goTo(btn.dataset.section));
});

function pad(v) {
  return String(v).padStart(2, '0');
}

function getUTCOffsetString() {
  const off = -new Date().getTimezoneOffset();
  const sign = off >= 0 ? '+' : '-';
  const h = Math.floor(Math.abs(off) / 60);
  const m = Math.abs(off) % 60;
  return sign + pad(h) + (m ? ':' + pad(m) : '');
}

function updateClock() {
  const n = new Date();
  const hms = `${pad(n.getHours())}:${pad(n.getMinutes())}:${pad(n.getSeconds())}`;
  const hm = `${pad(n.getHours())}:${pad(n.getMinutes())}`;

  const ids = ['headerClock', 'bigClock'];
  ids.forEach(id => { const el = document.getElementById(id); if (el) el.textContent = hms; });

  const heroTime = document.getElementById('heroLocalTime');
  if (heroTime) heroTime.textContent = hm;

  const utcEl = document.getElementById('clockUTC');
  if (utcEl) utcEl.textContent = getUTCOffsetString();

  const nowUTC = n.getTime() + n.getTimezoneOffset() * 60000;

  const zones = [
    { ids: ['tz-sp',  'cm-sp'],       offset: -3 },
    { ids: ['tz-maringa'],             offset: -3 },
    { ids: ['tz-rondonia'],            offset: -4 },
    { ids: ['tz-ny',  'cm-ny'],        offset: -4 },
    { ids: ['tz-london', 'cm-london'], offset:  1 },
    { ids: ['tz-tokyo',  'cm-tokyo'],  offset:  9 },
    { ids: ['tz-dubai'],               offset:  4 },
  ];

  zones.forEach(z => {
    const local = new Date(nowUTC + z.offset * 3600000);
    const t = `${pad(local.getHours())}:${pad(local.getMinutes())}`;
    z.ids.forEach(id => { const el = document.getElementById(id); if (el) el.textContent = t; });
  });
}

function setDateDisplay() {
  const el = document.getElementById('dateDisplay');
  if (!el) return;
  const n = new Date();
  const days = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];
  const months = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  el.textContent = `${days[n.getDay()]}, ${n.getDate()} de ${months[n.getMonth()]} de ${n.getFullYear()}`;
}

function setClockCity() {
  const el = document.getElementById('clockCity');
  if (!el) return;
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const city = tz.split('/').pop().replace(/_/g, ' ');
    el.textContent = city;
  } catch (e) {
    el.textContent = 'Local';
  }
}

function setYear() {
  const el = document.getElementById('footerYear');
  if (el) el.textContent = `© ${new Date().getFullYear()}`;
}

function initTicker() {
  const track = document.getElementById('tickerTrack');
  if (!track) return;
  const icons = ['clock','globe-2','timer','map-pin','calendar-days','refresh-cw','clock-3','compass','satellite','hourglass'];
  const labels = ['Horário Local','Fusos Globais','Tempo Real','Precisão','Calendário','Atualização','Sincronizado','Navegação','Digital','Exato'];
  const doubled = [...labels, ...labels];
  const doubledIcons = [...icons, ...icons];
  track.innerHTML = doubled.map((lbl, i) =>
    `<span class="ticker-item"><i data-lucide="${doubledIcons[i % doubledIcons.length]}"></i>${lbl}<span class="ticker-dot"></span></span>`
  ).join('');
  lucide.createIcons();
}

async function fetchWeather() {
  const cities = [
    { id: 'wx-sp',       lat: -23.55, lon: -46.63 },
    { id: 'wx-maringa',  lat: -23.42, lon: -51.93 },
    { id: 'wx-rondonia', lat: -8.76,  lon: -63.90 },
    { id: 'wx-ny',       lat: 40.71,  lon: -74.00 },
    { id: 'wx-london',   lat: 51.51,  lon: -0.13  },
    { id: 'wx-tokyo',    lat: 35.68,  lon: 139.69 },
    { id: 'wx-dubai',    lat: 25.20,  lon: 55.27  },
  ];

  const localCity = cities[1];
  const localWxEl = document.getElementById('clockWxLocal');

  for (const c of cities) {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}&current=temperature_2m,weathercode&timezone=auto`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('fetch failed');
      const data = await res.json();
      const temp = Math.round(data.current.temperature_2m);
      const code = data.current.weathercode;
      const el = document.getElementById(c.id);
      if (el) {
        el.innerHTML = `<i data-lucide="${wmoIcon(code)}"></i><span class="wx-temp">${temp}°C</span><span class="wx-desc">${wmoDesc(code)}</span>`;
        lucide.createIcons();
      }
      if (c.id === 'wx-maringa' && localWxEl) {
        localWxEl.textContent = `${temp}°C · ${wmoDesc(code)}`;
      }
    } catch (_) {
      const el = document.getElementById(c.id);
      if (el) el.innerHTML = `<span class="wx-desc">—</span>`;
    }
  }
}

function wmoDesc(code) {
  if (code === 0) return 'Céu limpo';
  if (code <= 2) return 'Parcialmente nublado';
  if (code === 3) return 'Nublado';
  if (code <= 49) return 'Neblina';
  if (code <= 59) return 'Chuvisco';
  if (code <= 69) return 'Chuva';
  if (code <= 79) return 'Neve';
  if (code <= 84) return 'Aguaceiro';
  if (code <= 94) return 'Tempestade';
  return 'Tempestade forte';
}

function wmoIcon(code) {
  if (code === 0) return 'sun';
  if (code <= 2) return 'cloud-sun';
  if (code === 3) return 'cloud';
  if (code <= 49) return 'cloud-fog';
  if (code <= 69) return 'cloud-rain';
  if (code <= 79) return 'cloud-snow';
  if (code <= 84) return 'cloud-drizzle';
  return 'cloud-lightning';
}

async function loadGeoPolygons() {
  const res = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
  if (!res.ok) throw new Error('geo fetch failed');
  const topo = await res.json();

  const arcs = topo.arcs;
  const { scale: [sx, sy], translate: [tx, ty] } = topo.transform;

  function decodeArc(idx) {
    const inv = idx < 0;
    const raw = arcs[inv ? ~idx : idx];
    let x = 0, y = 0;
    const pts = raw.map(d => { x += d[0]; y += d[1]; return [x, y]; });
    const seq = inv ? pts.reverse() : pts; return seq.map(([qx, qy]) => { const lon = qx * sx + tx; const lat = qy * sy + ty; return [lat, lon]; });
  }

  function decodeRing(ring) {
    return ring.flatMap(i => decodeArc(i));
  }

  const polys = [];

  function processGeom(g) {
    const groups = g.type === 'Polygon' ? [g.arcs] : g.arcs;
    for (const group of groups) {
      for (const ring of group) {
        const pts = decodeRing(ring);
        if (pts.length >= 3) polys.push(pts);
      }
    }
  }

  for (const g of topo.objects.countries.geometries) {
    if (g.type === 'Polygon' || g.type === 'MultiPolygon') processGeom(g);
  }

  return polys;
}

function ll2xyz(lat, lon) {
  const la = lat * Math.PI / 180;
  const lo = lon * Math.PI / 180;
  return [Math.cos(la) * Math.cos(lo), Math.sin(la), Math.cos(la) * Math.sin(lo)];
}

async function initGlobe() {
  const canvas = document.getElementById('globeCanvas');
  if (!canvas) return;

  const SIZE = 460;
  canvas.width = SIZE;
  canvas.height = SIZE;
  canvas.style.width = SIZE + 'px';
  canvas.style.height = SIZE + 'px';

  const ctx = canvas.getContext('2d');
  const CX = SIZE / 2, CY = SIZE / 2;
  const R = SIZE * 0.44;

  let polys3D = [];
  try {
    const raw = await loadGeoPolygons();
    polys3D = raw.map(ring => ring.map(([lat, lon]) => ll2xyz(lat, lon)));
  } catch (_) {
    polys3D = [];
  }

  const graticules = [];
  for (let lo = -180; lo <= 180; lo += 30) {
    const pts = [];
    for (let la = -90; la <= 90; la += 4) pts.push(ll2xyz(la, lo));
    graticules.push(pts);
  }
  for (let la = -60; la <= 60; la += 30) {
    const pts = [];
    for (let lo = -180; lo <= 180; lo += 4) pts.push(ll2xyz(la, lo));
    graticules.push(pts);
  }

  const stars = [];
  for (let i = 0; i < 180; i++) {
    let sx, sy, d;
    do {
      sx = Math.random() * SIZE;
      sy = Math.random() * SIZE;
      d = Math.hypot(sx - CX, sy - CY);
    } while (d < R + 14);
    stars.push({ x: sx, y: sy, r: Math.random() * .85 + .12, a: .022 + Math.random() * .13, blink: Math.random() > .6, ph: Math.random() * Math.PI * 2 });
  }

  let rot = 0, tick = 0;
  let rafId = null;

  function proj(v, cr, sr) {
    const nx = v[0] * cr - v[2] * sr;
    const nz = v[0] * sr + v[2] * cr;
    return { nx, ny: v[1], nz, sx: CX + nx * R, sy: CY - v[1] * R };
  }

  function frame() {
    tick++;
    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, SIZE, SIZE);

    for (const s of stars) {
      let a = s.a;
      if (s.blink) a *= .45 + .55 * Math.sin(tick * .02 + s.ph);
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`;
      ctx.fill();
    }

    const cr = Math.cos(rot), sr = Math.sin(rot);

    ctx.save();
    ctx.beginPath();
    ctx.arc(CX, CY, R, 0, Math.PI * 2);
    ctx.fillStyle = '#0c0c0c';
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.arc(CX, CY, R, 0, Math.PI * 2);
    ctx.clip();

    for (const line of graticules) {
      ctx.beginPath();
      let first = true;
      for (const v of line) {
        const p = proj(v, cr, sr);
        if (p.nz < 0) { first = true; continue; }
        if (first) { ctx.moveTo(p.sx, p.sy); first = false; }
        else ctx.lineTo(p.sx, p.sy);
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.045)';
      ctx.lineWidth = 0.45;
      ctx.stroke();
    }

    for (const poly of polys3D) {
      if (poly.length < 3) continue;
      const pp = poly.map(v => proj(v, cr, sr));
      const frontN = pp.reduce((s, p) => s + (p.nz > 0 ? 1 : 0), 0);
      if (frontN < 2) continue;

      const rawAvg = pp.reduce((s, p) => s + p.nz, 0) / pp.length;
      const avg = Math.max(0, rawAvg);

      const AMBIENT = 0.35;
      const light = AMBIENT + (1 - AMBIENT) * avg;

      ctx.beginPath();
      let started = false;
      for (let i = 0; i < pp.length; i++) {
        const p = pp[i];
        const vis = p.nz >= 0;
        if (!vis) { started = false; continue; }
        if (!started) { ctx.moveTo(p.sx, p.sy); started = true; }
        else ctx.lineTo(p.sx, p.sy);
      }
      ctx.closePath();

      const col = Math.round(100 + light * 120);
      const alpha = 0.55 + light * 0.40;
      ctx.fillStyle = `rgba(${col},${col},${col},${alpha.toFixed(3)})`;
      ctx.fill();

      const strokeAlpha = 0.12 + light * 0.28;
      ctx.strokeStyle = `rgba(255,255,255,${strokeAlpha.toFixed(3)})`;
      ctx.lineWidth = 0.6;
      ctx.stroke();
    }

    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.arc(CX, CY, R, 0, Math.PI * 2);
    ctx.clip();
    const shim = ctx.createRadialGradient(CX - R * .42, CY - R * .42, 0, CX + R * .1, CY + R * .1, R * .9);
    shim.addColorStop(0, 'rgba(255,255,255,0.07)');
    shim.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = shim;
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.arc(CX, CY, R, 0, Math.PI * 2);
    ctx.clip();
    const rim = ctx.createRadialGradient(CX, CY, R * .68, CX, CY, R * 1.0);
    rim.addColorStop(0, 'rgba(0,0,0,0)');
    rim.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = rim;
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.restore();

    ctx.beginPath();
    ctx.arc(CX, CY, R, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.09)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    rot += .0018;
    rafId = requestAnimationFrame(frame);
  }

  if (rafId) cancelAnimationFrame(rafId);
  frame();
}

function init() {
  lucide.createIcons();
  handleDeviceCheck();
  initTicker();
  updateClock();
  setDateDisplay();
  setClockCity();
  setYear();
  initGlobe();
  setInterval(updateClock, 1000);
  fetchWeather();
  setInterval(fetchWeather, 10 * 60 * 1000);
}

document.addEventListener('DOMContentLoaded', init);