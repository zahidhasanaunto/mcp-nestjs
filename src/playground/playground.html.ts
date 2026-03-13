export const PLAYGROUND_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{{SERVER_NAME}} — MCP Playground</title>
<style>
  :root {
    --bg: #0d1117;
    --surface: #161b22;
    --surface2: #1c2129;
    --border: #30363d;
    --text: #e6edf3;
    --text-muted: #8b949e;
    --accent: #58a6ff;
    --accent-hover: #79c0ff;
    --green: #3fb950;
    --red: #f85149;
    --orange: #d29922;
    --purple: #bc8cff;
    --radius: 8px;
    --font: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
    --mono: 'SF Mono', SFMono-Regular, ui-monospace, Menlo, Consolas, monospace;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: var(--font);
    background: var(--bg);
    color: var(--text);
    line-height: 1.5;
    min-height: 100vh;
  }

  header {
    border-bottom: 1px solid var(--border);
    padding: 16px 24px;
    display: flex;
    align-items: center;
    gap: 16px;
    background: var(--surface);
  }

  header h1 {
    font-size: 18px;
    font-weight: 600;
  }

  header .version {
    font-size: 12px;
    color: var(--text-muted);
    background: var(--surface2);
    padding: 2px 8px;
    border-radius: 12px;
    border: 1px solid var(--border);
  }

  header .stats {
    margin-left: auto;
    display: flex;
    gap: 16px;
    font-size: 13px;
    color: var(--text-muted);
  }

  header .stat-value {
    color: var(--accent);
    font-weight: 600;
  }

  .layout {
    display: grid;
    grid-template-columns: 340px 1fr;
    height: calc(100vh - 57px);
  }

  .sidebar {
    border-right: 1px solid var(--border);
    overflow-y: auto;
    background: var(--surface);
  }

  .sidebar-section {
    border-bottom: 1px solid var(--border);
  }

  .sidebar-section h2 {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--text-muted);
    padding: 12px 16px 8px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .sidebar-section h2 .count {
    background: var(--surface2);
    padding: 0 6px;
    border-radius: 10px;
    font-size: 11px;
    border: 1px solid var(--border);
  }

  .item {
    padding: 10px 16px;
    cursor: pointer;
    border-left: 3px solid transparent;
    transition: all 0.15s;
  }

  .item:hover {
    background: var(--surface2);
  }

  .item.active {
    background: var(--surface2);
    border-left-color: var(--accent);
  }

  .item-name {
    font-size: 13px;
    font-weight: 500;
    font-family: var(--mono);
    color: var(--text);
  }

  .item-desc {
    font-size: 12px;
    color: var(--text-muted);
    margin-top: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .item-badge {
    display: inline-block;
    font-size: 10px;
    font-weight: 600;
    padding: 1px 6px;
    border-radius: 4px;
    margin-right: 6px;
    vertical-align: middle;
  }

  .badge-tool { background: rgba(88,166,255,0.15); color: var(--accent); }
  .badge-resource { background: rgba(63,185,80,0.15); color: var(--green); }
  .badge-prompt { background: rgba(188,140,255,0.15); color: var(--purple); }

  .main {
    overflow-y: auto;
    padding: 24px;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--text-muted);
    gap: 12px;
  }

  .empty-state svg {
    opacity: 0.3;
  }

  .detail-header {
    margin-bottom: 24px;
  }

  .detail-header h2 {
    font-size: 22px;
    font-weight: 600;
    font-family: var(--mono);
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .detail-header p {
    color: var(--text-muted);
    margin-top: 4px;
    font-size: 14px;
  }

  .schema-section {
    margin-bottom: 24px;
  }

  .schema-section h3 {
    font-size: 13px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--text-muted);
    margin-bottom: 12px;
  }

  .schema-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }

  .schema-table th {
    text-align: left;
    padding: 8px 12px;
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--text-muted);
    font-weight: 500;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .schema-table td {
    padding: 8px 12px;
    border: 1px solid var(--border);
    background: var(--surface2);
  }

  .schema-table .prop-name {
    font-family: var(--mono);
    color: var(--accent);
    font-weight: 500;
  }

  .schema-table .prop-type {
    font-family: var(--mono);
    color: var(--orange);
    font-size: 12px;
  }

  .schema-table .prop-required {
    font-size: 11px;
    font-weight: 600;
  }

  .required-yes { color: var(--red); }
  .required-no { color: var(--text-muted); }

  .form-section {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 20px;
    margin-bottom: 24px;
  }

  .form-section h3 {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .form-group {
    margin-bottom: 14px;
  }

  .form-group label {
    display: block;
    font-size: 12px;
    font-weight: 500;
    color: var(--text-muted);
    margin-bottom: 4px;
    font-family: var(--mono);
  }

  .form-group label .req {
    color: var(--red);
    margin-left: 2px;
  }

  .form-group input,
  .form-group textarea,
  .form-group select {
    width: 100%;
    padding: 8px 12px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 6px;
    color: var(--text);
    font-family: var(--mono);
    font-size: 13px;
    outline: none;
    transition: border-color 0.15s;
  }

  .form-group input:focus,
  .form-group textarea:focus {
    border-color: var(--accent);
  }

  .form-group textarea {
    min-height: 60px;
    resize: vertical;
  }

  .json-editor {
    width: 100%;
    min-height: 120px;
    padding: 12px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 6px;
    color: var(--text);
    font-family: var(--mono);
    font-size: 13px;
    resize: vertical;
    outline: none;
    tab-size: 2;
  }

  .json-editor:focus {
    border-color: var(--accent);
  }

  .btn {
    padding: 8px 20px;
    border-radius: 6px;
    border: 1px solid var(--border);
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    font-family: var(--font);
    transition: all 0.15s;
  }

  .btn-primary {
    background: var(--accent);
    color: #fff;
    border-color: var(--accent);
  }

  .btn-primary:hover {
    background: var(--accent-hover);
  }

  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-row {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .result-section {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
  }

  .result-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid var(--border);
    background: var(--surface2);
  }

  .result-header h3 {
    font-size: 13px;
    font-weight: 600;
  }

  .result-status {
    font-size: 12px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 4px;
  }

  .status-success { background: rgba(63,185,80,0.15); color: var(--green); }
  .status-error { background: rgba(248,81,73,0.15); color: var(--red); }
  .status-pending { background: rgba(210,153,34,0.15); color: var(--orange); }

  .result-body {
    padding: 16px;
    max-height: 500px;
    overflow: auto;
  }

  .result-body pre {
    font-family: var(--mono);
    font-size: 13px;
    white-space: pre-wrap;
    word-break: break-word;
    line-height: 1.6;
  }

  .result-timing {
    font-size: 11px;
    color: var(--text-muted);
  }

  .search-box {
    padding: 8px 16px;
    border-bottom: 1px solid var(--border);
  }

  .search-box input {
    width: 100%;
    padding: 6px 10px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 6px;
    color: var(--text);
    font-size: 13px;
    outline: none;
  }

  .search-box input:focus {
    border-color: var(--accent);
  }

  .search-box input::placeholder {
    color: var(--text-muted);
  }

  .uri-input-group {
    display: flex;
    gap: 8px;
  }

  .uri-input-group input {
    flex: 1;
  }

  @media (max-width: 768px) {
    .layout { grid-template-columns: 1fr; }
    .sidebar { max-height: 40vh; }
  }
</style>
</head>
<body>

<header>
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
    <path d="M2 17l10 5 10-5"/>
    <path d="M2 12l10 5 10-5"/>
  </svg>
  <h1>{{SERVER_NAME}}</h1>
  <span class="version">v{{SERVER_VERSION}}</span>
  <div class="stats">
    <span>Tools: <span class="stat-value" id="stat-tools">-</span></span>
    <span>Resources: <span class="stat-value" id="stat-resources">-</span></span>
    <span>Prompts: <span class="stat-value" id="stat-prompts">-</span></span>
  </div>
</header>

<div class="layout">
  <div class="sidebar">
    <div class="search-box">
      <input type="text" id="search" placeholder="Search tools, resources, prompts..." oninput="filterItems()">
    </div>
    <div id="sidebar-content"></div>
  </div>

  <div class="main" id="main-content">
    <div class="empty-state">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="M2 17l10 5 10-5"/>
        <path d="M2 12l10 5 10-5"/>
      </svg>
      <p>Select a tool, resource, or prompt to get started</p>
    </div>
  </div>
</div>

<script>
var BASE = window.location.pathname.replace(/\\/$/, '');
var allItems = [];
var activeItem = null;
var _currentToolName = null;
var _currentPromptName = null;
var _currentPromptArgNames = [];

async function load() {
  var r1 = await fetch(BASE + '/api/tools');
  var tools = await r1.json();
  var r2 = await fetch(BASE + '/api/resources');
  var resources = await r2.json();
  var r3 = await fetch(BASE + '/api/prompts');
  var prompts = await r3.json();

  document.getElementById('stat-tools').textContent = tools.length;
  document.getElementById('stat-resources').textContent = resources.length;
  document.getElementById('stat-prompts').textContent = prompts.length;

  allItems = [];
  tools.forEach(function(t) { allItems.push(Object.assign({}, t, {_type:'tool'})); });
  resources.forEach(function(r) { allItems.push(Object.assign({}, r, {_type:'resource'})); });
  prompts.forEach(function(p) { allItems.push(Object.assign({}, p, {_type:'prompt'})); });

  renderSidebar(allItems);
}

function filterItems() {
  var q = document.getElementById('search').value.toLowerCase();
  renderSidebar(allItems.filter(function(item) {
    return (item.name||'').toLowerCase().indexOf(q) !== -1 ||
           (item.description||'').toLowerCase().indexOf(q) !== -1;
  }));
}

function esc(str) {
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function escAttr(str) {
  return str.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function renderSidebar(items) {
  var tools = items.filter(function(i){return i._type==='tool';});
  var resources = items.filter(function(i){return i._type==='resource';});
  var prompts = items.filter(function(i){return i._type==='prompt';});
  var html = '';

  if (tools.length) {
    html += '<div class="sidebar-section"><h2>Tools <span class="count">'+tools.length+'</span></h2>';
    tools.forEach(function(t) {
      var cls = 'item';
      if (activeItem && activeItem._type==='tool' && activeItem.name===t.name) cls += ' active';
      html += '<div class="'+cls+'" data-type="tool" data-key="'+escAttr(t.name)+'">';
      html += '<div class="item-name"><span class="item-badge badge-tool">T</span>'+esc(t.name)+'</div>';
      if (t.description) html += '<div class="item-desc">'+esc(t.description)+'</div>';
      html += '</div>';
    });
    html += '</div>';
  }

  if (resources.length) {
    html += '<div class="sidebar-section"><h2>Resources <span class="count">'+resources.length+'</span></h2>';
    resources.forEach(function(r) {
      var key = r.uri || r.uriTemplate || r.name;
      var cls = 'item';
      if (activeItem && activeItem._type==='resource' && (activeItem.uri||activeItem.uriTemplate||activeItem.name)===key) cls += ' active';
      html += '<div class="'+cls+'" data-type="resource" data-key="'+escAttr(key)+'">';
      html += '<div class="item-name"><span class="item-badge badge-resource">R</span>'+esc(r.name)+'</div>';
      html += '<div class="item-desc">'+esc(r.uri||r.uriTemplate||'')+'</div>';
      html += '</div>';
    });
    html += '</div>';
  }

  if (prompts.length) {
    html += '<div class="sidebar-section"><h2>Prompts <span class="count">'+prompts.length+'</span></h2>';
    prompts.forEach(function(p) {
      var cls = 'item';
      if (activeItem && activeItem._type==='prompt' && activeItem.name===p.name) cls += ' active';
      html += '<div class="'+cls+'" data-type="prompt" data-key="'+escAttr(p.name)+'">';
      html += '<div class="item-name"><span class="item-badge badge-prompt">P</span>'+esc(p.name)+'</div>';
      if (p.description) html += '<div class="item-desc">'+esc(p.description)+'</div>';
      html += '</div>';
    });
    html += '</div>';
  }

  if (!html) html = '<div style="padding:20px;color:var(--text-muted);text-align:center;">No items found</div>';
  document.getElementById('sidebar-content').innerHTML = html;
}

// Event delegation for sidebar clicks
document.getElementById('sidebar-content').addEventListener('click', function(e) {
  var el = e.target.closest('.item[data-type]');
  if (!el) return;
  var type = el.getAttribute('data-type');
  var key = el.getAttribute('data-key');
  selectItem(type, key);
});

function selectItem(type, key) {
  var item = allItems.find(function(i) {
    if (i._type !== type) return false;
    if (type === 'resource') return (i.uri||i.uriTemplate||i.name) === key;
    return i.name === key;
  });
  if (!item) return;
  activeItem = item;
  filterItems();
  renderDetail(item);
}

function renderDetail(item) {
  var main = document.getElementById('main-content');
  if (item._type === 'tool') renderToolDetail(main, item);
  else if (item._type === 'resource') renderResourceDetail(main, item);
  else if (item._type === 'prompt') renderPromptDetail(main, item);
}

function renderToolDetail(container, tool) {
  _currentToolName = tool.name;
  var schema = tool.inputSchema || {type:'object',properties:{}};
  var props = schema.properties || {};
  var required = schema.required || [];
  var propNames = Object.keys(props);

  var html = '<div class="detail-header">';
  html += '<h2><span class="item-badge badge-tool" style="font-size:14px">TOOL</span>'+esc(tool.name)+'</h2>';
  if (tool.description) html += '<p>'+esc(tool.description)+'</p>';
  html += '</div>';

  if (propNames.length) {
    html += '<div class="schema-section"><h3>Input Schema</h3>';
    html += '<table class="schema-table"><thead><tr><th>Property</th><th>Type</th><th>Required</th><th>Details</th></tr></thead><tbody>';
    propNames.forEach(function(name) {
      var prop = props[name];
      var isReq = required.indexOf(name) !== -1;
      var details = '';
      if (prop.description) details += prop.description;
      if (prop.enum) details += (details?' | ':'') + 'enum: ' + prop.enum.join(', ');
      if (prop.default !== undefined) details += (details?' | ':'') + 'default: ' + prop.default;
      html += '<tr>';
      html += '<td class="prop-name">'+esc(name)+'</td>';
      html += '<td class="prop-type">'+esc(prop.type||'any')+'</td>';
      html += '<td><span class="prop-required '+(isReq?'required-yes':'required-no')+'">'+(isReq?'required':'optional')+'</span></td>';
      html += '<td style="color:var(--text-muted);font-size:12px">'+esc(details||'\u2014')+'</td>';
      html += '</tr>';
    });
    html += '</tbody></table></div>';
  }

  html += '<div class="form-section"><h3>Execute Tool</h3>';
  if (propNames.length) {
    propNames.forEach(function(name) {
      var prop = props[name];
      var isReq = required.indexOf(name) !== -1;
      html += '<div class="form-group">';
      html += '<label>'+esc(name)+(isReq?'<span class="req">*</span>':'')+'</label>';
      if (prop.enum) {
        html += '<select id="field-'+escAttr(name)+'">';
        html += '<option value="">\u2014 select \u2014</option>';
        prop.enum.forEach(function(v){html+='<option value="'+escAttr(String(v))+'">'+esc(String(v))+'</option>';});
        html += '</select>';
      } else if (prop.type === 'boolean') {
        html += '<select id="field-'+escAttr(name)+'"><option value="">\u2014 select \u2014</option><option value="true">true</option><option value="false">false</option></select>';
      } else if (prop.type === 'object' || prop.type === 'array') {
        html += '<textarea id="field-'+escAttr(name)+'" placeholder="JSON value...">'+(prop.default!==undefined?JSON.stringify(prop.default):'')+'</textarea>';
      } else {
        html += '<input type="'+(prop.type==='number'?'number':'text')+'" id="field-'+escAttr(name)+'"';
        if (prop.default !== undefined) html += ' value="'+escAttr(String(prop.default))+'"';
        if (prop.description) html += ' placeholder="'+escAttr(prop.description)+'"';
        html += '>';
      }
      html += '</div>';
    });
  }
  html += '<details style="margin-bottom:14px"><summary style="cursor:pointer;font-size:12px;color:var(--text-muted)">Raw JSON input</summary>';
  html += '<textarea class="json-editor" id="json-input" placeholder="{ }">{}</textarea></details>';
  html += '<div class="btn-row"><button class="btn btn-primary" id="execute-btn">Execute</button>';
  html += '<span class="result-timing" id="timing"></span></div></div>';
  html += '<div class="result-section" id="result-section" style="display:none">';
  html += '<div class="result-header"><h3>Result</h3><span class="result-status" id="result-status"></span></div>';
  html += '<div class="result-body"><pre id="result-output"></pre></div></div>';

  container.innerHTML = html;

  document.getElementById('execute-btn').addEventListener('click', function(){ executeTool(_currentToolName); });
  syncFormToJson(propNames, props);
}

function syncFormToJson(propNames, props) {
  var jsonInput = document.getElementById('json-input');
  if (!jsonInput) return;
  var updateJson = function() {
    var obj = {};
    propNames.forEach(function(name) {
      var el = document.getElementById('field-' + name);
      if (!el || !el.value) return;
      var prop = props[name];
      if (prop.type === 'number') obj[name] = Number(el.value);
      else if (prop.type === 'boolean') obj[name] = el.value === 'true';
      else if (prop.type === 'object' || prop.type === 'array') {
        try { obj[name] = JSON.parse(el.value); } catch(e) { obj[name] = el.value; }
      } else obj[name] = el.value;
    });
    jsonInput.value = JSON.stringify(obj, null, 2);
  };
  propNames.forEach(function(name) {
    var el = document.getElementById('field-' + name);
    if (el) { el.addEventListener('input', updateJson); el.addEventListener('change', updateJson); }
  });
}

function getArgs() {
  var jsonInput = document.getElementById('json-input');
  try { return JSON.parse(jsonInput.value || '{}'); } catch(e) { return {}; }
}

async function executeTool(name) {
  var btn = document.getElementById('execute-btn');
  btn.disabled = true; btn.textContent = 'Executing...';
  var section = document.getElementById('result-section');
  section.style.display = 'block';
  document.getElementById('result-status').className = 'result-status status-pending';
  document.getElementById('result-status').textContent = 'pending';
  document.getElementById('result-output').textContent = 'Executing...';
  var start = performance.now();
  try {
    var res = await fetch(BASE + '/api/tools/call', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({name: name, arguments: getArgs()}),
    });
    var data = await res.json();
    var elapsed = Math.round(performance.now() - start);
    document.getElementById('timing').textContent = elapsed + 'ms';
    if (data.isError) {
      document.getElementById('result-status').className = 'result-status status-error';
      document.getElementById('result-status').textContent = 'error';
    } else {
      document.getElementById('result-status').className = 'result-status status-success';
      document.getElementById('result-status').textContent = 'success';
    }
    var text = (data.content||[]).map(function(c){return c.text||(c.data?'[binary: '+c.mimeType+']':'');}).join('\\n') || JSON.stringify(data,null,2);
    document.getElementById('result-output').textContent = tryPrettyJson(text);
  } catch(err) {
    document.getElementById('result-status').className = 'result-status status-error';
    document.getElementById('result-status').textContent = 'error';
    document.getElementById('result-output').textContent = err.message;
    document.getElementById('timing').textContent = Math.round(performance.now()-start)+'ms';
  }
  btn.disabled = false; btn.textContent = 'Execute';
}

function renderResourceDetail(container, resource) {
  var uri = resource.uri || resource.uriTemplate || '';
  var isTemplate = !!resource.uriTemplate;
  var html = '<div class="detail-header">';
  html += '<h2><span class="item-badge badge-resource" style="font-size:14px">RESOURCE</span>'+esc(resource.name)+'</h2>';
  if (resource.description) html += '<p>'+esc(resource.description)+'</p>';
  html += '<p style="font-family:var(--mono);font-size:13px;color:var(--accent);margin-top:8px">'+esc(uri)+'</p>';
  if (resource.mimeType) html += '<p style="font-size:12px;color:var(--text-muted)">MIME: '+esc(resource.mimeType)+'</p>';
  html += '</div>';
  html += '<div class="form-section"><h3>Read Resource</h3>';
  html += '<div class="form-group"><label>URI'+(isTemplate?' (fill template params)':'')+'</label>';
  html += '<div class="uri-input-group">';
  html += '<input type="text" id="resource-uri" value="'+escAttr(isTemplate?'':uri)+'" placeholder="'+escAttr(uri)+'">';
  html += '<button class="btn btn-primary" id="read-resource-btn">Read</button>';
  html += '</div></div><span class="result-timing" id="timing"></span></div>';
  html += '<div class="result-section" id="result-section" style="display:none">';
  html += '<div class="result-header"><h3>Result</h3><span class="result-status" id="result-status"></span></div>';
  html += '<div class="result-body"><pre id="result-output"></pre></div></div>';
  container.innerHTML = html;
  document.getElementById('read-resource-btn').addEventListener('click', executeResource);
}

async function executeResource() {
  var uri = document.getElementById('resource-uri').value;
  if (!uri) return;
  var section = document.getElementById('result-section');
  section.style.display = 'block';
  document.getElementById('result-status').className = 'result-status status-pending';
  document.getElementById('result-status').textContent = 'pending';
  var start = performance.now();
  try {
    var res = await fetch(BASE+'/api/resources/read',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({uri:uri})});
    var data = await res.json();
    document.getElementById('timing').textContent = Math.round(performance.now()-start)+'ms';
    document.getElementById('result-status').className = 'result-status status-success';
    document.getElementById('result-status').textContent = 'success';
    document.getElementById('result-output').textContent = tryPrettyJson(JSON.stringify(data,null,2));
  } catch(err) {
    document.getElementById('result-status').className = 'result-status status-error';
    document.getElementById('result-status').textContent = 'error';
    document.getElementById('result-output').textContent = err.message;
    document.getElementById('timing').textContent = Math.round(performance.now()-start)+'ms';
  }
}

function renderPromptDetail(container, prompt) {
  var pargs = prompt.arguments || [];
  _currentPromptName = prompt.name;
  _currentPromptArgNames = pargs.map(function(a){return a.name;});
  var html = '<div class="detail-header">';
  html += '<h2><span class="item-badge badge-prompt" style="font-size:14px">PROMPT</span>'+esc(prompt.name)+'</h2>';
  if (prompt.description) html += '<p>'+esc(prompt.description)+'</p>';
  html += '</div>';
  if (pargs.length) {
    html += '<div class="schema-section"><h3>Arguments</h3>';
    html += '<table class="schema-table"><thead><tr><th>Name</th><th>Required</th><th>Description</th></tr></thead><tbody>';
    pargs.forEach(function(a) {
      html += '<tr><td class="prop-name">'+esc(a.name)+'</td>';
      html += '<td><span class="prop-required '+(a.required?'required-yes':'required-no')+'">'+(a.required?'required':'optional')+'</span></td>';
      html += '<td style="color:var(--text-muted);font-size:12px">'+esc(a.description||'\u2014')+'</td></tr>';
    });
    html += '</tbody></table></div>';
  }
  html += '<div class="form-section"><h3>Get Prompt</h3>';
  pargs.forEach(function(a) {
    html += '<div class="form-group"><label>'+esc(a.name)+(a.required?'<span class="req">*</span>':'')+'</label>';
    html += '<input type="text" id="prompt-field-'+escAttr(a.name)+'"'+(a.description?' placeholder="'+escAttr(a.description)+'"':'')+'></div>';
  });
  html += '<div class="btn-row"><button class="btn btn-primary" id="get-prompt-btn">Get Prompt</button>';
  html += '<span class="result-timing" id="timing"></span></div></div>';
  html += '<div class="result-section" id="result-section" style="display:none">';
  html += '<div class="result-header"><h3>Result</h3><span class="result-status" id="result-status"></span></div>';
  html += '<div class="result-body"><pre id="result-output"></pre></div></div>';
  container.innerHTML = html;
  document.getElementById('get-prompt-btn').addEventListener('click', function(){ executePrompt(_currentPromptName, _currentPromptArgNames); });
}

async function executePrompt(name, argNames) {
  var args = {};
  argNames.forEach(function(n) {
    var el = document.getElementById('prompt-field-'+n);
    if (el && el.value) args[n] = el.value;
  });
  var section = document.getElementById('result-section');
  section.style.display = 'block';
  document.getElementById('result-status').className = 'result-status status-pending';
  document.getElementById('result-status').textContent = 'pending';
  var start = performance.now();
  try {
    var res = await fetch(BASE+'/api/prompts/get',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:name,arguments:args})});
    var data = await res.json();
    document.getElementById('timing').textContent = Math.round(performance.now()-start)+'ms';
    document.getElementById('result-status').className = 'result-status status-success';
    document.getElementById('result-status').textContent = 'success';
    if (data.messages) {
      var formatted = data.messages.map(function(m){
        return m.role.toUpperCase()+':\\n'+(m.content&&m.content.text?m.content.text:JSON.stringify(m.content));
      }).join('\\n\\n---\\n\\n');
      document.getElementById('result-output').textContent = formatted;
    } else {
      document.getElementById('result-output').textContent = tryPrettyJson(JSON.stringify(data,null,2));
    }
  } catch(err) {
    document.getElementById('result-status').className = 'result-status status-error';
    document.getElementById('result-status').textContent = 'error';
    document.getElementById('result-output').textContent = err.message;
    document.getElementById('timing').textContent = Math.round(performance.now()-start)+'ms';
  }
}

function tryPrettyJson(text) {
  try { return JSON.stringify(JSON.parse(text),null,2); } catch(e) { return text; }
}

load();
</script>
</body>
</html>`;
