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

function updateClock() {
  const n = new Date();
  const time = `${pad(n.getHours())}:${pad(n.getMinutes())}:${pad(n.getSeconds())}`;

  const headerEl = document.getElementById('headerClock');
  if (headerEl) headerEl.textContent = time;

  const bigEl = document.getElementById('bigClock');
  if (bigEl) bigEl.textContent = time;

  const heroTime = document.getElementById('heroLocalTime');
  if (heroTime) heroTime.textContent = `${pad(n.getHours())}:${pad(n.getMinutes())}`;

  const nowUTC = n.getTime() + n.getTimezoneOffset() * 60000;

  const zones = [
    { id: 'tz-sp',       offset: -3 },
    { id: 'tz-maringa',  offset: -3 },
    { id: 'tz-rondonia', offset: -4 },
    { id: 'tz-ny',       offset: -4 },
    { id: 'tz-london',   offset:  1 },
    { id: 'tz-tokyo',    offset:  9 },
    { id: 'tz-dubai',    offset:  4 },
  ];

  zones.forEach(z => {
    const el = document.getElementById(z.id);
    if (!el) return;
    const local = new Date(nowUTC + z.offset * 3600000);
    el.textContent = `${pad(local.getHours())}:${pad(local.getMinutes())}`;
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

function initTicker() {
  const icons = ['clock','globe-2','timer','map-pin','calendar-days','refresh-cw','clock-3','compass','satellite','hourglass'];
  const labels = ['Horário Local','Fusos Globais','Tempo Real','Precisão','Calendário','Atualização','Sincronizado','Navegação','Digital','Exato'];
  const track = document.getElementById('tickerTrack');
  if (!track) return;
  const doubled = [...labels, ...labels];
  const doubledIcons = [...icons, ...icons];
  track.innerHTML = doubled.map((label, i) =>
    `<span class="ticker-item"><i data-lucide="${doubledIcons[i % doubledIcons.length]}"></i>${label}<span class="ticker-dot"></span></span>`
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

  for (const c of cities) {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}&current=temperature_2m,weathercode&timezone=auto`;
      const res = await fetch(url);
      const data = await res.json();
      const temp = Math.round(data.current.temperature_2m);
      const code = data.current.weathercode;
      const el = document.getElementById(c.id);
      if (el) {
        el.innerHTML = `<i data-lucide="${wmoIcon(code)}"></i><span class="wx-temp">${temp}°C</span><span class="wx-desc">${wmoDesc(code)}</span>`;
        lucide.createIcons();
      }
    } catch (e) {
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

async function loadGeoFeatures() {
  const res = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
  const topo = await res.json();
  const arcs = topo.arcs;
  const geoms = topo.objects.countries.geometries;

  function arcPoints(arcIdx) {
    const inv = arcIdx < 0;
    const realIdx = inv ? ~arcIdx : arcIdx;
    const arc = arcs[realIdx];
    let x = 0, y = 0;
    const raw = arc.map(d => { x += d[0]; y += d[1]; return [x, y]; });
    const seq = inv ? raw.slice().reverse() : raw;
    const pts = [];
    for (const [px, py] of seq) pts.push(px, py);
    return pts;
  }

  function ringPoints(ring) {
    const pts = [];
    for (const arcIdx of ring) pts.push(...arcPoints(arcIdx));
    return pts;
  }

  const { scale: [sx, sy], translate: [tx, ty] } = topo.transform;

  function toLatLon(qx, qy) {
    return [qy * sy + ty, qx * sx + tx];
  }

  const polys = [];

  function processGeom(geom) {
    const rings = geom.type === 'Polygon' ? [geom.arcs] : geom.arcs;
    for (const poly of rings) {
      for (const ring of poly) {
        const pts = ringPoints(ring);
        const latLons = [];
        for (let i = 0; i < pts.length; i += 2) latLons.push(toLatLon(pts[i], pts[i + 1]));
        if (latLons.length >= 3) polys.push(latLons);
      }
    }
  }

  for (const g of geoms) {
    if (g.type === 'Polygon' || g.type === 'MultiPolygon') processGeom(g);
  }
  return polys;
}

async function initDotGlobe() {
  const canvas = document.getElementById('globeCanvas');
  if (!canvas) return;

  const size = 460;
  canvas.width = size;
  canvas.height = size;
  canvas.style.width = size + 'px';
  canvas.style.height = size + 'px';

  const ctx = canvas.getContext('2d');
  const W = size, H = size;
  const cx = W / 2, cy = H / 2;
  const R = Math.min(W, H) * 0.44;

  let geoPolys = [];
  try {
    geoPolys = await loadGeoFeatures();
  } catch (e) {
    geoPolys = [];
  }

  function latLonToXYZ(lat, lon) {
    const latR = lat * Math.PI / 180;
    const lonR = lon * Math.PI / 180;
    return [
      Math.cos(latR) * Math.cos(lonR),
      Math.sin(latR),
      Math.cos(latR) * Math.sin(lonR),
    ];
  }

  function projectV(v, cosR, sinR) {
    const nx = v[0] * cosR - v[2] * sinR;
    const nz = v[0] * sinR + v[2] * cosR;
    const ny = v[1];
    return { nx, ny, nz, sx: cx + nx * R, sy: cy - ny * R };
  }

  const stars = [];
  for (let i = 0; i < 200; i++) {
    let sx, sy, d;
    do {
      sx = Math.random() * W;
      sy = Math.random() * H;
      d = Math.hypot(sx - cx, sy - cy);
    } while (d < R + 16);
    stars.push({
      x: sx, y: sy,
      r: Math.random() * .9 + .1,
      a: .025 + Math.random() * .14,
      blink: Math.random() > .6,
      phase: Math.random() * Math.PI * 2
    });
  }

  const countryPolygons3D = geoPolys.map(poly =>
    poly.map(([lat, lon]) => latLonToXYZ(lat, lon))
  );

  const graticuleLines = [];
  for (let lon = -180; lon <= 180; lon += 30) {
    const pts = [];
    for (let lat = -90; lat <= 90; lat += 3) pts.push(latLonToXYZ(lat, lon));
    graticuleLines.push(pts);
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    const pts = [];
    for (let lon = -180; lon <= 180; lon += 3) pts.push(latLonToXYZ(lat, lon));
    graticuleLines.push(pts);
  }

  let rot = 0, tick = 0;

  function draw() {
    tick++;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);

    for (const s of stars) {
      let a = s.a;
      if (s.blink) a *= .45 + .55 * Math.sin(tick * .022 + s.phase);
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`;
      ctx.fill();
    }

    const cosR = Math.cos(rot);
    const sinR = Math.sin(rot);

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    const bgG = ctx.createRadialGradient(cx - R * .25, cy - R * .25, 0, cx, cy, R);
    bgG.addColorStop(0, '#111111');
    bgG.addColorStop(0.5, '#0a0a0a');
    bgG.addColorStop(1, '#050505');
    ctx.fillStyle = bgG;
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.clip();

    for (const line of graticuleLines) {
      ctx.beginPath();
      let first = true;
      for (const v of line) {
        const p = projectV(v, cosR, sinR);
        if (p.nz < 0) { first = true; continue; }
        if (first) { ctx.moveTo(p.sx, p.sy); first = false; }
        else ctx.lineTo(p.sx, p.sy);
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.028)';
      ctx.lineWidth = 0.4;
      ctx.stroke();
    }

    for (const poly of countryPolygons3D) {
      if (poly.length < 3) continue;
      const projected = poly.map(v => projectV(v, cosR, sinR));
      const frontCount = projected.filter(p => p.nz > 0).length;
      if (frontCount < 2) continue;

      ctx.beginPath();
      let firstPt = true;
      let prevVis = false;
      for (const p of projected) {
        const vis = p.nz >= -0.015;
        if (vis) {
          if (firstPt || !prevVis) { ctx.moveTo(p.sx, p.sy); firstPt = false; }
          else ctx.lineTo(p.sx, p.sy);
        }
        prevVis = vis;
      }
      ctx.closePath();

      const avgNz = Math.max(0, projected.reduce((s, p) => s + p.nz, 0) / projected.length);
      const alpha = 0.12 + avgNz * 0.30;
      const col = Math.round(160 + avgNz * 80);
      ctx.fillStyle = `rgba(${col},${col},${col},${alpha.toFixed(3)})`;
      ctx.fill();

      ctx.strokeStyle = `rgba(255,255,255,${(0.07 + avgNz * 0.20).toFixed(3)})`;
      ctx.lineWidth = 0.6;
      ctx.stroke();
    }

    ctx.restore();

    const shimG = ctx.createRadialGradient(cx - R * .42, cy - R * .42, 0, cx - R * .08, cy - R * .06, R * .7);
    shimG.addColorStop(0, 'rgba(255,255,255,0.06)');
    shimG.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = shimG;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    const rimG = ctx.createRadialGradient(cx, cy, R * .74, cx, cy, R * 1.01);
    rimG.addColorStop(0, 'rgba(180,180,180,0)');
    rimG.addColorStop(1, 'rgba(180,180,180,0.06)');
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = rimG;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.stroke();

    rot += .0018;
    requestAnimationFrame(draw);
  }

  draw();
}

function setYear() {
  const el = document.getElementById('footerYear');
  if (el) el.textContent = `© ${new Date().getFullYear()}`;
}

function init() {
  lucide.createIcons();
  handleDeviceCheck();
  initDotGlobe();
  initTicker();
  updateClock();
  setDateDisplay();
  setYear();
  setInterval(updateClock, 1000);
  fetchWeather();
  setInterval(fetchWeather, 10 * 60 * 1000);
}

document.addEventListener('DOMContentLoaded', init);