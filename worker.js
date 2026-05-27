export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // API endpoint for IP query
    if (url.pathname === '/api/query') {
      return handleQuery(request, url);
    }

    // Serve the web UI
    return new Response(renderHTML(), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
};

async function handleQuery(request, url) {
  const queryIP = url.searchParams.get('ip') || '';
  const source = url.searchParams.get('source') || 'auto';
  const visitorIP = request.headers.get('CF-Connecting-IP') || '';
  const country = request.headers.get('CF-IPCountry') || '';
  const targetIP = queryIP || visitorIP;

  try {
    let data;
    if (source === 'ip9') {
      data = await queryIP9(targetIP);
    } else if (source === 'ipsb') {
      data = await queryIPsb(targetIP);
    } else {
      // Auto: choose source based on visitor's country
      if (country === 'CN') {
        data = await queryIP9(targetIP);
      } else {
        data = await queryIPsb(targetIP);
      }
    }

    return jsonResponse({ success: true, data, source: data._source });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

function jsonResponse(obj) {
  return new Response(JSON.stringify(obj), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': '*'
    }
  });
}

async function queryIP9(ip) {
  const url = ip ? `https://ip9.com.cn/get?ip=${encodeURIComponent(ip)}` : 'https://ip9.com.cn/get';
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`ip9.com.cn 请求失败 (${resp.status})`);
  const result = await resp.json();
  if (result.ret !== 200) throw new Error(result.msg || 'ip9.com.cn 查询失败');
  const d = result.data;
  return {
    ip: d.ip || ip,
    country: d.country || '',
    countryCode: (d.country_code || '').toUpperCase(),
    region: d.prov || '',
    city: d.city || '',
    area: d.area || '',
    isp: d.isp || '',
    ipType: d.ip_type || '',
    bigArea: d.big_area || '',
    areaCode: d.area_code || '',
    postCode: d.post_code || '',
    lat: d.lat !== undefined ? parseFloat(d.lat) : null,
    lng: d.lng !== undefined ? parseFloat(d.lng) : null,
    _source: 'ip9.com.cn'
  };
}

async function queryIPsb(ip) {
  const resp = await fetch(`https://api.ip.sb/geoip/${encodeURIComponent(ip)}`);
  if (!resp.ok) throw new Error(`ip.sb 请求失败 (${resp.status})`);
  const data = await resp.json();
  return {
    ip: data.ip || ip,
    country: data.country || '',
    countryCode: data.country_code || '',
    region: data.region || '',
    city: data.city || '',
    isp: data.isp || '',
    org: data.asn_organization || data.organization || '',
    asn: data.asn || '',
    timezone: data.timezone || '',
    lat: data.latitude !== undefined ? data.latitude : null,
    lng: data.longitude !== undefined ? data.longitude : null,
    _source: 'ip.sb'
  };
}

function renderHTML() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>IP 地址查询</title>
<link rel="icon" href="https://img.zhaizz.top/file/avatar/obVInnoY.png">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { color-scheme: light dark; }

  /* ============================
     Design Tokens — Light
     ============================ */
  :root {
    /* Brand */
    --primary: #0066cc;
    --primary-focus: #0071e3;
    --primary-on-dark: #2997ff;

    /* Raw surfaces */
    --canvas: #ffffff;
    --canvas-parchment: #f5f5f7;
    --surface-pearl: #fafafc;
    --surface-tile-1: #272729;
    --surface-tile-2: #2a2a2c;
    --surface-black: #000000;

    /* Raw text */
    --ink: #1d1d1f;
    --ink-muted-80: #333333;
    --ink-muted-48: #7a7a7a;
    --body-on-dark: #ffffff;
    --body-muted: #cccccc;

    /* Raw borders */
    --hairline: #e0e0e0;
    --divider-soft: #f0f0f0;

    /* Semantic — light theme */
    --link-color: #0066cc;
    --bg-hero: #ffffff;
    --text-hero-headline: #1d1d1f;
    --text-hero-tagline: #6e6e73;
    --bg-results: #f5f5f7;
    --bg-card: #ffffff;
    --bg-footer: #f5f5f7;
    --chip-border: rgba(0, 0, 0, 0.10);
    --chip-text: #1d1d1f;
    --chip-active-border: #0071e3;
    --input-bg: rgba(0, 0, 0, 0.04);
    --input-border: rgba(0, 0, 0, 0.12);
    --input-text: #1d1d1f;
    --input-focus-border: #0066cc;
    --spinner-track: rgba(0, 0, 0, 0.10);
    --spinner-color: #1d1d1f;
    --badge-bg: #fafafc;
    --badge-border: #f0f0f0;
    --badge-text: #7a7a7a;
    --error-bg: rgba(255, 69, 58, 0.08);
    --error-border: rgba(255, 69, 58, 0.20);
  }

  /* ============================
     Design Tokens — Dark
     ============================ */
  [data-theme="dark"] {
    --link-color: #2997ff;
    --bg-hero: #1d1d1f;
    --text-hero-headline: #f5f5f7;
    --text-hero-tagline: #a1a1a6;
    --bg-results: #1d1d1f;
    --bg-card: #2a2a2c;
    --bg-footer: #1d1d1f;
    --chip-border: rgba(255, 255, 255, 0.20);
    --chip-text: #f5f5f7;
    --chip-active-border: #2997ff;
    --input-bg: rgba(255, 255, 255, 0.10);
    --input-border: rgba(255, 255, 255, 0.20);
    --input-text: #f5f5f7;
    --input-focus-border: #2997ff;
    --spinner-track: rgba(255, 255, 255, 0.20);
    --spinner-color: #f5f5f7;
    --badge-bg: rgba(255, 255, 255, 0.06);
    --badge-border: rgba(255, 255, 255, 0.12);
    --badge-text: #a1a1a6;
    --hairline: rgba(255, 255, 255, 0.10);
    --divider-soft: rgba(255, 255, 255, 0.06);
    --ink: #f5f5f7;
    --ink-muted-80: #a1a1a6;
    --ink-muted-48: #6e6e73;
    --error-bg: rgba(255, 69, 58, 0.15);
    --error-border: rgba(255, 69, 58, 0.30);
  }

  body {
    font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background: var(--bg-hero);
    transition: background-color 0.3s ease;
  }

  /* ============================
     Global Nav
     ============================ */
  .global-nav {
    position: sticky;
    top: 0;
    z-index: 100;
    height: 44px;
    background: var(--surface-black);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 22px;
  }
  .global-nav-brand {
    font-size: 12px;
    font-weight: 600;
    letter-spacing: -0.12px;
    color: var(--body-on-dark);
    text-decoration: none;
  }
  .global-nav-links {
    display: flex;
    align-items: center;
    gap: 20px;
  }
  .global-nav-links a {
    font-size: 12px;
    font-weight: 400;
    letter-spacing: -0.12px;
    color: var(--body-muted);
    text-decoration: none;
    transition: color 0.2s;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }
  .global-nav-links a:hover {
    color: var(--body-on-dark);
  }

  /* Theme toggle (button-dark-utility) — always #1d1d1f bg across themes */
  .theme-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: none;
    background: #1d1d1f;
    color: #cccccc;
    cursor: pointer;
    transition: color 0.2s, transform 0.15s;
    -webkit-tap-highlight-color: transparent;
  }
  .theme-toggle:hover { color: #ffffff; }
  .theme-toggle:active { transform: scale(0.95); }
  .theme-toggle:hover { color: var(--body-on-dark); }
  .theme-toggle:active { transform: scale(0.95); }
  .theme-toggle svg { display: block; }

  /* ============================
     Hero Tile
     ============================ */
  .hero-tile {
    background: var(--bg-hero);
    padding: 100px 24px 80px;
    text-align: center;
    transition: background-color 0.3s ease;
  }
  .hero-tile-inner {
    max-width: 680px;
    margin: 0 auto;
  }
  .hero-headline {
    font-size: 56px;
    font-weight: 600;
    line-height: 1.07;
    letter-spacing: -0.28px;
    color: var(--text-hero-headline);
    margin-bottom: 8px;
    transition: color 0.3s ease;
  }
  .hero-tagline {
    font-size: 28px;
    font-weight: 400;
    line-height: 1.14;
    letter-spacing: 0.196px;
    color: var(--text-hero-tagline);
    margin-bottom: 48px;
    transition: color 0.3s ease;
  }

  /* Source chips (configurator-option-chip) */
  .source-selector {
    display: flex;
    gap: 8px;
    justify-content: center;
    flex-wrap: wrap;
    margin-bottom: 24px;
  }
  .source-chip {
    padding: 12px 16px;
    border-radius: 9999px;
    border: 1px solid var(--chip-border);
    background: transparent;
    color: var(--chip-text);
    font-size: 14px;
    font-weight: 400;
    letter-spacing: -0.224px;
    font-family: inherit;
    cursor: pointer;
    transition: color 0.3s ease, border-color 0.3s ease;
    -webkit-tap-highlight-color: transparent;
    user-select: none;
  }
  .source-chip:active { transform: scale(0.95); }
  .source-chip.active {
    border: 2px solid var(--chip-active-border);
    color: var(--chip-text);
  }

  /* Search input */
  .search-row {
    display: flex;
    gap: 12px;
    justify-content: center;
    max-width: 560px;
    margin: 0 auto;
  }
  .search-input {
    flex: 1;
    height: 44px;
    padding: 12px 20px;
    border-radius: 9999px;
    border: 1px solid var(--input-border);
    background: var(--input-bg);
    color: var(--input-text);
    font-size: 17px;
    font-weight: 400;
    letter-spacing: -0.374px;
    font-family: inherit;
    outline: none;
    transition: border-color 0.3s ease, background-color 0.3s ease, color 0.3s ease;
  }
  .search-input::placeholder { color: var(--ink-muted-48); }
  .search-input:focus { border-color: var(--input-focus-border); }

  /* Primary button (button-primary) */
  .btn-primary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 11px 22px;
    border-radius: 9999px;
    border: none;
    background: var(--primary);
    color: #ffffff;
    font-size: 17px;
    font-weight: 400;
    letter-spacing: -0.374px;
    font-family: inherit;
    cursor: pointer;
    transition: transform 0.15s, opacity 0.2s;
    white-space: nowrap;
    -webkit-tap-highlight-color: transparent;
  }
  .btn-primary:active { transform: scale(0.95); }
  .btn-primary:focus-visible {
    outline: 2px solid var(--primary-focus);
    outline-offset: 2px;
  }
  .btn-primary:disabled {
    opacity: 0.4;
    cursor: default;
    transform: none;
  }

  /* Loading */
  .loading { display: none; padding: 48px 0 0; }
  .loading.show { display: block; }
  .spinner {
    width: 28px;
    height: 28px;
    border: 2px solid var(--spinner-track);
    border-top-color: var(--spinner-color);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin: 0 auto 12px;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .loading-text {
    color: var(--ink-muted-48);
    font-size: 14px;
    font-weight: 400;
    letter-spacing: -0.224px;
  }

  /* Error */
  .error {
    display: none;
    padding: 14px 20px;
    border-radius: 11px;
    background: var(--error-bg);
    border: 1px solid var(--error-border);
    color: #ff453a;
    font-size: 14px;
    font-weight: 400;
    letter-spacing: -0.224px;
    text-align: center;
    max-width: 560px;
    margin: 20px auto 0;
  }
  .error.show { display: block; }

  /* ============================
     Results Tile
     ============================ */
  .results-tile {
    background: var(--bg-results);
    padding: 80px 24px;
    transition: background-color 0.3s ease;
  }
  .results-tile-inner {
    max-width: 680px;
    margin: 0 auto;
  }

  /* Result card (store-utility-card) */
  .result-card {
    background: var(--bg-card);
    border: 1px solid var(--hairline);
    border-radius: 18px;
    padding: 40px 32px 32px;
    transition: background-color 0.3s ease, border-color 0.3s ease;
    animation: fadeUp 0.4s ease both;
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .ip-display {
    text-align: center;
    padding: 0 0 28px;
    border-bottom: 1px solid var(--hairline);
    margin-bottom: 24px;
    transition: border-color 0.3s ease;
  }
  .ip-display .ip-label {
    font-size: 14px;
    font-weight: 600;
    letter-spacing: -0.224px;
    color: var(--ink-muted-48);
    margin-bottom: 4px;
    transition: color 0.3s ease;
  }
  .ip-display .ip-value {
    font-size: 34px;
    font-weight: 600;
    line-height: 1.47;
    letter-spacing: -0.374px;
    color: var(--ink);
    font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
    word-break: break-all;
    transition: color 0.3s ease;
  }

  /* Info grid */
  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1px;
    background: var(--hairline);
    border-radius: 11px;
    overflow: hidden;
    transition: background-color 0.3s ease;
  }
  .info-item {
    padding: 16px 20px;
    background: var(--bg-card);
    transition: background-color 0.3s ease;
  }
  .info-item.full-width { grid-column: 1 / -1; }
  .info-item .label {
    font-size: 11px;
    font-weight: 400;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    color: var(--ink-muted-48);
    margin-bottom: 2px;
    transition: color 0.3s ease;
  }
  .info-item .value {
    font-size: 17px;
    font-weight: 400;
    letter-spacing: -0.374px;
    color: var(--ink);
    transition: color 0.3s ease;
  }
  .info-item .value.null-value {
    color: var(--ink-muted-48);
    font-style: italic;
  }

  .source-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    margin-top: 20px;
    border-radius: 9999px;
    font-size: 14px;
    font-weight: 400;
    letter-spacing: -0.224px;
    color: var(--badge-text);
    background: var(--badge-bg);
    border: 1px solid var(--badge-border);
    transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease;
  }

  .map-link {
    color: var(--link-color);
    text-decoration: none;
    font-size: 14px;
    margin-left: 6px;
    transition: color 0.3s ease;
  }
  .map-link:hover { text-decoration: underline; }

  /* ============================
     Footer
     ============================ */
  .page-footer {
    background: var(--bg-footer);
    padding: 32px 24px;
    text-align: center;
    transition: background-color 0.3s ease;
  }
  .page-footer p {
    font-size: 12px;
    font-weight: 400;
    letter-spacing: -0.12px;
    color: var(--ink-muted-48);
    transition: color 0.3s ease;
  }

  /* ============================
     Responsive
     ============================ */
  @media (max-width: 834px) {
    .hero-tile { padding: 80px 20px 60px; }
    .results-tile { padding: 60px 20px; }
    .hero-headline { font-size: 40px; letter-spacing: 0; }
    .hero-tagline { font-size: 24px; }
  }

  @media (max-width: 734px) {
    .hero-tile { padding: 60px 20px 48px; }
    .results-tile { padding: 48px 20px; }
    .hero-headline { font-size: 34px; }
    .hero-tagline { font-size: 21px; }
    .search-row { flex-direction: column; align-items: stretch; }
    .search-input { width: 100%; }
    .info-grid { grid-template-columns: 1fr; }
    .ip-display .ip-value { font-size: 28px; }
    .result-card { padding: 28px 20px 24px; }
  }

  @media (max-width: 480px) {
    .hero-tile { padding: 48px 16px 40px; }
    .hero-headline { font-size: 28px; }
    .hero-tagline { font-size: 18px; margin-bottom: 32px; }
    .ip-display .ip-value { font-size: 22px; }
    .result-card { padding: 20px 16px; }
    .results-tile { padding: 40px 16px; }
    .page-footer { padding: 24px 16px; }
  }
</style>
</head>
<body>

<!-- Global Nav -->
<nav class="global-nav">
  <a href="/" class="global-nav-brand">IP 地址查询</a>
  <div class="global-nav-links">
    <a onclick="document.getElementById('ipInput').value='';doQuery()">查询本机</a>
    <button class="theme-toggle" id="themeToggle" onclick="toggleTheme()" aria-label="切换主题">
      <svg id="themeIcon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="5"/>
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
      </svg>
    </button>
  </div>
</nav>

<!-- Hero Tile -->
<section class="hero-tile">
  <div class="hero-tile-inner">
    <h1 class="hero-headline">IP 地址查询</h1>

    <div class="source-selector">
      <button class="source-chip active" data-source="auto" onclick="setSource('auto')">智能选择</button>
      <button class="source-chip" data-source="ip9" onclick="setSource('ip9')">ip9.com.cn</button>
      <button class="source-chip" data-source="ipsb" onclick="setSource('ipsb')">ip.sb</button>
    </div>

    <div class="search-row">
      <input type="text" class="search-input" id="ipInput" placeholder="输入 IP 地址，留空则查询本机" spellcheck="false"
        onkeydown="if(event.key==='Enter') doQuery()">
      <button class="btn-primary" id="queryBtn" onclick="doQuery()">查询</button>
    </div>

    <div class="loading" id="loading">
      <div class="spinner"></div>
      <div class="loading-text">正在查询…</div>
    </div>

    <div class="error" id="error"></div>
  </div>
</section>

<!-- Results Tile -->
<section class="results-tile" id="resultsSection" style="display:none">
  <div class="results-tile-inner">
    <div class="result-card">
      <div class="ip-display">
        <div class="ip-label">IP 地址</div>
        <div class="ip-value" id="resultIP">--</div>
      </div>
      <div class="info-grid" id="infoGrid"></div>
      <div style="text-align:center">
        <span class="source-badge" id="sourceBadge"></span>
      </div>
    </div>
  </div>
</section>

<!-- Footer -->
<footer class="page-footer">
  <p>Powered by Cloudflare Workers</p>
</footer>

<script>
  let currentSource = 'auto';

  // ============ Theme ============
  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    const icon = document.getElementById('themeIcon');
    if (theme === 'dark') {
      icon.innerHTML = '<path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z"/>';
    } else {
      icon.innerHTML = '<circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>';
    }
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    setTheme(current === 'dark' ? 'light' : 'dark');
  }

  // Init: localStorage > system preference > light
  (function initTheme() {
    const saved = localStorage.getItem('theme');
    if (saved) {
      setTheme(saved);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    } else {
      setTheme('light');
    }
  })();

  // ============ IP Query ============
  function setSource(source) {
    currentSource = source;
    document.querySelectorAll('.source-chip').forEach(b => {
      b.classList.toggle('active', b.dataset.source === source);
    });
  }

  async function doQuery() {
    const input = document.getElementById('ipInput');
    const btn = document.getElementById('queryBtn');
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    const resultsSection = document.getElementById('resultsSection');
    const ip = input.value.trim();

    error.classList.remove('show');
    resultsSection.style.display = 'none';
    loading.classList.add('show');
    btn.disabled = true;

    try {
      const params = new URLSearchParams({ source: currentSource });
      if (ip) params.set('ip', ip);
      const resp = await fetch('/api/query?' + params.toString());
      const json = await resp.json();

      loading.classList.remove('show');
      if (!json.success) {
        error.textContent = '查询失败: ' + json.error;
        error.classList.add('show');
        return;
      }
      renderResults(json.data, json.source);
      resultsSection.style.display = 'block';
      resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      loading.classList.remove('show');
      error.textContent = '网络错误: ' + err.message;
      error.classList.add('show');
    } finally {
      btn.disabled = false;
    }
  }

  function renderResults(data, source) {
    document.getElementById('resultIP').textContent = data.ip || '--';

    const rows = [];

    if (data.country) {
      const flag = data.countryCode ? getFlagEmoji(data.countryCode) : '';
      rows.push({ label: '国家/地区', value: flag ? flag + ' ' + data.country : data.country, full: false });
    }
    if (data.countryCode) {
      rows.push({ label: '国家代码', value: data.countryCode, full: false });
    }
    if (data.region) rows.push({ label: '省份', value: data.region, full: false });
    if (data.city) rows.push({ label: '城市', value: data.city, full: false });
    if (data.area) rows.push({ label: '区县', value: data.area, full: false });
    if (data.bigArea) rows.push({ label: '大区', value: data.bigArea, full: false });
    if (data.isp) rows.push({ label: '运营商', value: data.isp, full: false });
    if (data.ipType) {
      const typeMap = { ISP: '家庭宽带', BUS: '企业专线', IDC: '数据中心' };
      rows.push({ label: 'IP 类型', value: typeMap[data.ipType] || data.ipType, full: false });
    }
    if (data.org) rows.push({ label: '组织', value: data.org, full: false });
    if (data.timezone) rows.push({ label: '时区', value: data.timezone, full: false });
    if (data.postCode) rows.push({ label: '邮政编码', value: data.postCode, full: false });
    if (data.lat != null && data.lng != null) {
      const coord = data.lat.toFixed(4) + ', ' + data.lng.toFixed(4);
      const isCN = data.countryCode === 'CN';
      const mapUrl = isCN
        ? 'https://uri.amap.com/marker?position=' + data.lng + ',' + data.lat
        : 'https://www.google.com/maps?q=' + data.lat + ',' + data.lng;
      rows.push({
        label: '坐标',
        value: coord + ' <a href="' + mapUrl + '" target="_blank" class="map-link">查看地图 →</a>',
        full: false,
        raw: true
      });
    }

    const grid = document.getElementById('infoGrid');
    grid.innerHTML = rows.map(r =>
      '<div class="info-item' + (r.full ? ' full-width' : '') + '">' +
        '<div class="label">' + r.label + '</div>' +
        '<div class="value' + (r.value ? '' : ' null-value') + '">' +
          (r.raw ? r.value : escapeHtml(r.value || '无')) +
        '</div>' +
      '</div>'
    ).join('');

    const badge = document.getElementById('sourceBadge');
    if (source === 'ip9.com.cn') {
      badge.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>  数据来源: ip9.com.cn';
    } else {
      badge.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>  数据来源: ip.sb';
    }
  }

  function getFlagEmoji(code) {
    if (!code || code.length !== 2) return '';
    const offset = 0x1F1E6 - 65;
    const cp = code.toUpperCase().split('').map(c => offset + c.charCodeAt(0));
    return String.fromCodePoint(...cp);
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  document.addEventListener('DOMContentLoaded', doQuery);
</script>
</body>
</html>`;
}
