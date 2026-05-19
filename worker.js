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

  :root {
    --primary: #0066cc;
    --primary-focus: #0071e3;
    --primary-on-dark: #2997ff;
    --canvas: #ffffff;
    --canvas-parchment: #f5f5f7;
    --surface-pearl: #fafafc;
    --surface-tile-1: #272729;
    --surface-tile-2: #2a2a2c;
    --ink: #1d1d1f;
    --body-on-dark: #ffffff;
    --body-muted: #cccccc;
    --ink-muted-48: #7a7a7a;
    --hairline: #e0e0e0;
    --divider-soft: #f0f0f0;
  }

  body {
    font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* Global Nav */
  .global-nav {
    position: sticky;
    top: 0;
    z-index: 100;
    height: 44px;
    background: #000000;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 22px;
  }
  .global-nav-brand {
    font-size: 12px;
    font-weight: 400;
    letter-spacing: -0.12px;
    color: var(--body-on-dark);
    text-decoration: none;
  }
  .global-nav-links {
    display: flex;
    align-items: center;
    gap: 24px;
  }
  .global-nav-links a {
    font-size: 12px;
    font-weight: 400;
    letter-spacing: -0.12px;
    color: var(--body-muted);
    text-decoration: none;
    transition: color 0.2s;
    cursor: pointer;
  }
  .global-nav-links a:hover {
    color: var(--body-on-dark);
  }

  /* Hero Tile (Dark) */
  .hero-tile {
    background: var(--surface-tile-1);
    padding: 80px 24px;
    text-align: center;
  }
  .hero-tile-inner {
    max-width: 680px;
    margin: 0 auto;
  }
  .hero-headline {
    font-size: 40px;
    font-weight: 600;
    line-height: 1.10;
    letter-spacing: 0;
    color: var(--body-on-dark);
    margin-bottom: 8px;
  }
  .hero-tagline {
    font-size: 28px;
    font-weight: 400;
    line-height: 1.14;
    letter-spacing: 0.196px;
    color: var(--body-muted);
    margin-bottom: 40px;
  }

  /* Source Selector (configurator-option-chip style) */
  .source-selector {
    display: flex;
    gap: 8px;
    justify-content: center;
    flex-wrap: wrap;
    margin-bottom: 20px;
  }
  .source-chip {
    padding: 12px 16px;
    border-radius: 9999px;
    border: 1px solid rgba(255, 255, 255, 0.16);
    background: transparent;
    color: var(--body-muted);
    font-size: 14px;
    font-weight: 400;
    letter-spacing: -0.224px;
    font-family: inherit;
    cursor: pointer;
    transition: color 0.2s, border-color 0.2s;
    -webkit-tap-highlight-color: transparent;
  }
  .source-chip:active {
    transform: scale(0.95);
  }
  .source-chip.active {
    border: 2px solid var(--primary-focus);
    color: var(--body-on-dark);
  }

  /* Search Input */
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
    border: 1px solid rgba(255, 255, 255, 0.16);
    background: rgba(255, 255, 255, 0.08);
    color: var(--body-on-dark);
    font-size: 17px;
    font-weight: 400;
    letter-spacing: -0.374px;
    font-family: inherit;
    outline: none;
    transition: border-color 0.2s;
  }
  .search-input::placeholder {
    color: var(--body-muted);
  }
  .search-input:focus {
    border-color: var(--primary-on-dark);
  }

  /* Primary Button (button-primary) */
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
    transition: transform 0.15s;
    white-space: nowrap;
    -webkit-tap-highlight-color: transparent;
  }
  .btn-primary:active {
    transform: scale(0.95);
  }
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
  .loading { display: none; padding: 40px 0 0; }
  .loading.show { display: block; }
  .spinner {
    width: 28px;
    height: 28px;
    border: 2px solid rgba(255, 255, 255, 0.15);
    border-top-color: var(--body-on-dark);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin: 0 auto 12px;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .loading-text {
    color: var(--body-muted);
    font-size: 14px;
    font-weight: 400;
    letter-spacing: -0.224px;
  }

  /* Error */
  .error {
    display: none;
    padding: 14px 20px;
    border-radius: 11px;
    background: rgba(255, 69, 58, 0.12);
    border: 1px solid rgba(255, 69, 58, 0.25);
    color: #ff453a;
    font-size: 14px;
    font-weight: 400;
    letter-spacing: -0.224px;
    text-align: center;
    max-width: 560px;
    margin: 16px auto 0;
  }
  .error.show { display: block; }

  /* Results Tile (Parchment) */
  .results-tile {
    background: var(--canvas-parchment);
    padding: 80px 24px;
  }
  .results-tile-inner {
    max-width: 680px;
    margin: 0 auto;
  }

  /* Result Card (store-utility-card style) */
  .result-card {
    background: var(--canvas);
    border-radius: 18px;
    padding: 32px;
    border: 1px solid var(--hairline);
  }

  .ip-display {
    text-align: center;
    padding: 8px 0 24px;
  }
  .ip-display .ip-label {
    font-size: 14px;
    font-weight: 600;
    letter-spacing: -0.224px;
    color: var(--ink-muted-48);
    margin-bottom: 4px;
  }
  .ip-display .ip-value {
    font-size: 34px;
    font-weight: 600;
    line-height: 1.47;
    letter-spacing: -0.374px;
    color: var(--ink);
    font-family: 'SF Mono', 'Fira Code', monospace;
    word-break: break-all;
  }

  /* Info Grid */
  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1px;
    background: var(--hairline);
    border-radius: 11px;
    overflow: hidden;
  }
  .info-item {
    padding: 16px 20px;
    background: var(--canvas);
  }
  .info-item.full-width { grid-column: 1 / -1; }
  .info-item .label {
    font-size: 11px;
    font-weight: 400;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    color: var(--ink-muted-48);
    margin-bottom: 2px;
  }
  .info-item .value {
    font-size: 17px;
    font-weight: 400;
    letter-spacing: -0.374px;
    color: var(--ink);
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
    color: var(--ink-muted-48);
    background: var(--surface-pearl);
    border: 1px solid var(--divider-soft);
  }

  .map-link {
    color: var(--primary);
    text-decoration: none;
    font-size: 14px;
    margin-left: 6px;
  }
  .map-link:hover { text-decoration: underline; }

  /* Footer */
  .page-footer {
    background: var(--canvas-parchment);
    padding: 24px;
    text-align: center;
  }
  .page-footer p {
    font-size: 12px;
    font-weight: 400;
    letter-spacing: -0.12px;
    color: var(--ink-muted-48);
  }

  /* Responsive */
  @media (max-width: 734px) {
    .hero-tile { padding: 60px 20px; }
    .results-tile { padding: 60px 20px; }
    .hero-headline { font-size: 34px; }
    .hero-tagline { font-size: 21px; }
    .search-row { flex-direction: column; align-items: stretch; }
    .search-input { width: 100%; }
    .info-grid { grid-template-columns: 1fr; }
    .ip-display .ip-value { font-size: 28px; }
    .result-card { padding: 24px; }
  }

  @media (max-width: 480px) {
    .hero-tile { padding: 48px 16px; }
    .hero-headline { font-size: 28px; }
    .hero-tagline { font-size: 18px; }
    .ip-display .ip-value { font-size: 22px; }
    .result-card { padding: 20px 16px; }
  }
</style>
</head>
<body>

<!-- Global Nav -->
<nav class="global-nav">
  <a href="/" class="global-nav-brand">IP 地址查询</a>
  <div class="global-nav-links">
    <a onclick="document.getElementById('ipInput').value='';doQuery()">查询本机</a>
  </div>
</nav>

<!-- Hero Tile (Dark) -->
<section class="hero-tile">
  <div class="hero-tile-inner">
    <h1 class="hero-headline">IP 地址</h1>
    <p class="hero-tagline">查询 IP 地址的归属地与网络信息</p>

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
      <div class="loading-text">正在查询...</div>
    </div>

    <div class="error" id="error"></div>
  </div>
</section>

<!-- Results Tile (Parchment) -->
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
    if (data.asn) rows.push({ label: 'ASN', value: data.asn, full: false });
    if (data.timezone) rows.push({ label: '时区', value: data.timezone, full: false });
    if (data.areaCode) rows.push({ label: '区号', value: data.areaCode, full: false });
    if (data.postCode) rows.push({ label: '邮政编码', value: data.postCode, full: false });
    if (data.lat != null && data.lng != null) {
      const coord = data.lat.toFixed(4) + ', ' + data.lng.toFixed(4);
      const mapUrl = 'https://www.google.com/maps?q=' + data.lat + ',' + data.lng;
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
      badge.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> 数据来源: ip9.com.cn';
    } else {
      badge.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg> 数据来源: ip.sb';
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
