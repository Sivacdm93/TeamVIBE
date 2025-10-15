/**************** CONFIG ****************/
const STORE_URL = 'https://script.google.com/macros/s/AKfycbwHYNuyjCuGm9h4RWkerXDe_tvow1msAFmssh_qDDKKr5cnWbT2c3pFme8CoDTAa7GAhg/exec';
const STORE_KEY = '258006';  // must match Apps Script ADMIN_KEY
const ADMIN_PIN = '258006';
const nocache   = () => `&t=${Date.now()}`;

/**************** MODE DETECTION ********/
const params = new URLSearchParams(location.search);
const wantAdmin = params.get('admin') === '1';
let adminMode = false;        // becomes true after unlocking admin
let allowMarkUsed = false;    // controls used/delete buttons on cards

/**************** STATE *****************/
let items = [];
let usedStore = new Set();
const filterState = { q:'', platform:'all', status:'all', category:'all' };

/************** SERVER API **************/
async function apiGet(){
  const r = await fetch(`${STORE_URL}?action=get${nocache()}`);
  if(!r.ok) throw new Error('get failed');
  return r.json();
}
async function apiSetUsed(arr){
  const payload = encodeURIComponent(JSON.stringify(arr));
  const r = await fetch(`${STORE_URL}?action=setUsed&key=${encodeURIComponent(STORE_KEY)}&data=${payload}${nocache()}`);
  const j = await r.json().catch(()=>({}));
  if(!r.ok||j.ok===false) throw new Error(j.error||'setUsed failed');
}
async function apiAddItem(item){
  const cats = item.cats ? encodeURIComponent(JSON.stringify(item.cats)) : '';
  const r = await fetch(`${STORE_URL}?action=addItem&key=${encodeURIComponent(STORE_KEY)}&title=${encodeURIComponent(item.title)}&url=${encodeURIComponent(item.url)}${cats?`&cats=${cats}`:''}${nocache()}`);
  const j = await r.json().catch(()=>({}));
  if(!r.ok||j.ok===false) throw new Error(j.error||'add failed');
  return j.item;
}
async function apiDeleteItemById(id){
  const r = await fetch(`${STORE_URL}?action=deleteItem&key=${encodeURIComponent(STORE_KEY)}&id=${encodeURIComponent(id)}${nocache()}`);
  const j = await r.json().catch(()=>({}));
  if(!r.ok||j.ok===false) throw new Error(j.error||'delete failed');
  return j;
}
async function apiDeleteItemByUrl(url){
  const r = await fetch(`${STORE_URL}?action=deleteItem&key=${encodeURIComponent(STORE_KEY)}&url=${encodeURIComponent(url)}${nocache()}`);
  const j = await r.json().catch(()=>({}));
  if(!r.ok||j.ok===false) throw new Error(j.error||'delete failed');
  return j;
}

/**************** HELPERS ***************/
function detectPlatform(u){
  try{
    const x=new URL(u);
    const h=x.hostname.replace(/^www\./,'');
    if(h.endsWith('instagram.com')) return 'instagram';
    if(h.endsWith('youtube.com') || h==='youtu.be') return 'youtube';
  }catch{}
  return 'other';
}
function ytId(u){
  try{
    const x=new URL(u);
    if(x.hostname==='youtu.be') return x.pathname.slice(1);
    if(x.pathname.startsWith('/shorts/')) return x.pathname.split('/')[2];
    if(x.searchParams.get('v')) return x.searchParams.get('v');
  }catch{}
  return null;
}
const ytEmbed = u => {
  const id=ytId(u);
  return id?`https://www.youtube.com/embed/${id}`:null;
};
const escapeHtml = s => String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* Auto-categories */
const CAT_RULES = [
  {key:'bottle',label:'Bottle'},{key:'cup',label:'Cup'},{key:'straw',label:'Straw'},
  {key:'balloon',label:'Balloon'},{key:'ball',label:'Ball'},{key:'paper',label:'Paper'},
  {key:'pyramid',label:'Pyramid'},{key:'tower',label:'Tower'},{key:'spin',label:'Spin'},
  {key:'balance',label:'Balance'},{key:'challenge',label:'Challenge'},{key:'opposite',label:'Opposites'},
];
const autoCats = t => {
  const s=(t||'').toLowerCase();
  const out=[];
  CAT_RULES.forEach(r=>s.includes(r.key)&&out.push(r.label));
  return out.length?out:['General'];
};

/* Normalize Instagram URL to canonical permalink (strip params; ensure trailing slash) */
function igCanonical(u){
  try{
    const x = new URL(u);
    let path = x.pathname;
    if(!path.endsWith('/')) path += '/';
    return `https://www.instagram.com${path}`;
  }catch{ return u; }
}

/* Duplicate normalization */
function normUrl(u){
  try{
    const x=new URL(u);
    return (x.hostname+x.pathname).replace(/^www\./,'').toLowerCase().replace(/\/+$/,'');
  }catch{ return (u||'').toLowerCase().trim(); }
}

/* Ensure Instagram embed.js is present */
function ensureInstaScript(){
  if(window.instgrm?.Embeds?.process) return Promise.resolve();
  return new Promise((resolve)=>{
    const ex = document.querySelector('script[src*="instagram.com/embed.js"]');
    if(ex){ ex.addEventListener('load', ()=>resolve()); return; }
    const s = document.createElement('script');
    s.src = 'https://www.instagram.com/embed.js';
    s.async = true;
    s.onload = ()=>resolve();
    document.head.appendChild(s);
  });
}

/************** FILTERS *****************/
function passesFilters(it){
  if(filterState.q){
    const q=filterState.q.toLowerCase();
    if(!(it.title||'').toLowerCase().includes(q)) return false;
  }
  const platform=detectPlatform(it.url);
  if(filterState.platform!=='all' && platform!==filterState.platform) return false;

  // Used status based on current items ONLY
  const isUsed = usedStore.has(it.url);
  if(filterState.status==='used' && !isUsed) return false;
  if(filterState.status==='available' && isUsed) return false;

  const cats=it.cats||autoCats(it.title);
  if(filterState.category!=='all' && !cats.includes(filterState.category)) return false;
  return true;
}

/**************** RENDER ****************/
function updateCounts(){
  const total = items.length;

  // ✅ FIX: count only those used URLs that exist in the current items list
  const used = items.filter(i => usedStore.has(i.url)).length;

  const avail = total - used;
  document.getElementById('count-total').textContent = total;
  document.getElementById('count-used').textContent = used;
  document.getElementById('count-available').textContent = avail;
}

function makeCard(item){
  const platform=detectPlatform(item.url);
  const card=document.createElement('div');
  card.className='card';

  // Embeds: Instagram via blockquote + embed.js; YouTube via iframe
  let media='';
  if(platform==='instagram'){
    const permalink = igCanonical(item.url);
    media = `
      <div class="media">
        <blockquote class="instagram-media" data-instgrm-permalink="${permalink}" data-instgrm-version="14"></blockquote>
      </div>`;
  }else if(platform==='youtube' && ytEmbed(item.url)){
    media = `
      <div class="media">
        <iframe width="100%" height="360" src="${ytEmbed(item.url)}" frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>
      </div>`;
  }else{
    media = `<div class="media" style="padding:10px"><a class="btn" href="${item.url}" target="_blank">Open link</a></div>`;
  }

  const isUsed = usedStore.has(item.url);
  const cats = item.cats || autoCats(item.title);

  card.innerHTML = `
    ${media}
    <div class="meta">
      <div class="title">${escapeHtml(item.title||'Link')}</div>
      <div class="url">${escapeHtml(item.url)}</div>
      <div class="chips"><span class="chip">${platform==='instagram'?'Instagram':'YouTube'}</span>
        ${cats.map(c=>`<span class="chip">${escapeHtml(c)}</span>`).join('')}
      </div>
    </div>
    <div class="actions">
      <a class="btn" href="${item.url}" target="_blank">${platform==='instagram'?'Open in Instagram': platform==='youtube'?'Open in YouTube':'Open link'}</a>
      <button class="btn" data-copy="${item.url}">Copy link</button>
      ${adminMode ? `
        <button class="btn used-btn ${isUsed?'used':''}" data-id="${item.id??''}" data-url="${item.url}" ${allowMarkUsed?'':'disabled'}>${isUsed?'Used ✓':'Used'}</button>
        <button class="btn del-btn" data-id="${item.id??''}" data-url="${item.url}">Delete</button>
      ` : ``}
    </div>`;

  // Copy
  card.querySelector('[data-copy]').addEventListener('click', async (e)=>{
    try{ await navigator.clipboard.writeText(item.url);
      e.currentTarget.textContent='Copied!';
      setTimeout(()=>e.currentTarget.textContent='Copy link',1200);
    }catch{}
  });

  if(adminMode){
    // Toggle Used
    const usedBtn = card.querySelector('.used-btn');
    usedBtn.addEventListener('click', async e=>{
      if(!allowMarkUsed) return;
      const url=e.currentTarget.getAttribute('data-url');
      const was=usedStore.has(url);
      if(was) usedStore.delete(url); else usedStore.add(url);
      e.currentTarget.classList.toggle('used', usedStore.has(url));
      e.currentTarget.textContent=usedStore.has(url)?'Used ✓':'Used';
      updateCounts();
      try{ await apiSetUsed([...usedStore]); }catch{ alert('Save failed'); }
    });

    // Delete single item
    card.querySelector('.del-btn').addEventListener('click', async e=>{
      const id=e.currentTarget.getAttribute('data-id');
      const url=e.currentTarget.getAttribute('data-url');
      if(!confirm('Delete this game from the website?')) return;
      try{
        if(id) await apiDeleteItemById(id);
        else await apiDeleteItemByUrl(url);
        // remove one occurrence locally
        let removed=false;
        items = items.filter(i=>{
          if(removed) return true;
          const match = id ? (i.id===id) : (i.url===url);
          if(match){ removed=true; return false; }
          return true;
        });
        usedStore.delete(url);
        updateCounts();
        renderGrid();
      }catch(err){ alert('Delete failed: '+err.message); }
    });
  }

  return card;
}

async function renderGrid(){
  const grid = document.getElementById('grid');
  grid.innerHTML = '';
  const filtered = items.filter(passesFilters);

  if(!filtered.length){
    document.getElementById('empty').style.display='block';
  }else{
    document.getElementById('empty').style.display='none';
    filtered.forEach(i => grid.appendChild(makeCard(i)));
  }

  // After cards are in the DOM, (re)load Instagram embed script and process
  try{
    await ensureInstaScript();
    window.instgrm?.Embeds?.process();
  }catch{}

  const note = document.getElementById('resultsNote');
  if(note) note.textContent = `${filtered.length} of ${items.length} shown (filters applied)`;
}

/**************** THEME ***************/
function initTheme(){
  const KEY='tv_theme';
  function applyTheme(t){
    document.documentElement.setAttribute('data-theme', t);
    document.body.setAttribute('data-theme', t);
    localStorage.setItem(KEY, t);
  }
  applyTheme(localStorage.getItem(KEY) || 'dark');

  const darkBtn  = document.getElementById('themeDark');
  const lightBtn = document.getElementById('themeLight');
  const sync=()=>{ const t=localStorage.getItem(KEY)||'dark';
    darkBtn?.classList.toggle('active', t==='dark');
    lightBtn?.classList.toggle('active', t==='light');
  };
  darkBtn && (darkBtn.onclick  = ()=>{ applyTheme('dark');  sync(); });
  lightBtn && (lightBtn.onclick = ()=>{ applyTheme('light'); sync(); });
  sync();
}

/**************** ADMIN GATE ***********/
function gateAdmin(){
  if (wantAdmin) {
    // visiting admin page
    if (sessionStorage.getItem('tv_admin_ok') === '1') {
      adminMode = true;
      allowMarkUsed = true;
    } else {
      const pin = prompt('Enter Admin PIN:');
      if (pin === ADMIN_PIN) {
        sessionStorage.setItem('tv_admin_ok','1');
        adminMode = true;
        allowMarkUsed = true;
      } else {
        // back to user page
        const p = new URLSearchParams(location.search);
        p.delete('admin');
        location.search = p.toString();
        return;
      }
    }
  } else {
    // normal user page
    adminMode = false;
    allowMarkUsed = false;
  }
}

/**************** UI INIT **************/
function initUI(){
  const hdrUser   = document.getElementById('hdrUser');
  const hdrAdmin  = document.getElementById('hdrAdmin');
  const tools     = document.getElementById('adminTools');
  const dups      = document.getElementById('dupList');
  const adminNav  = document.getElementById('adminNav');

  // Headers
  if (wantAdmin) {
    hdrUser && (hdrUser.style.display = 'none');
    hdrAdmin && (hdrAdmin.style.display = '');
  } else {
    hdrUser && (hdrUser.style.display = '');
    hdrAdmin && (hdrAdmin.style.display = 'none');
  }

  // Admin switch / user view
  if (!wantAdmin) {
    // USER PAGE → show 🔐 Admin button
    if(adminNav){
      adminNav.style.display = '';
      adminNav.textContent = '🔐 Admin';
      adminNav.onclick = () => {
        const pin = prompt('Enter Admin PIN:');
        if (pin === ADMIN_PIN) {
          sessionStorage.setItem('tv_admin_ok','1');
          const p = new URLSearchParams(location.search);
          p.set('admin','1');
          location.search = p.toString(); // redirect to admin page
        } else {
          alert('Wrong PIN');
        }
      };
    }
    tools && (tools.style.display = 'none');
    dups  && (dups.style.display  = 'none');
  } else if (adminMode) {
    // ADMIN PAGE (unlocked)
    if(adminNav){
      adminNav.style.display = '';
      adminNav.textContent = '👤 User view';
      adminNav.onclick = (e) => {
        e.preventDefault();
        const p = new URLSearchParams(location.search);
        p.delete('admin');
        location.search = p.toString();
      };
    }
    tools && (tools.style.display = 'flex');
    dups  && (dups.style.display  = 'none');
  } else {
    // (shouldn't hit because we redirect away if lock fails)
    adminNav && (adminNav.style.display = 'none');
    tools    && (tools.style.display    = 'none');
    dups     && (dups.style.display     = 'none');
  }

  // Categories dropdown
  const cats = (()=>{
    items.forEach(it=>{ if(!it.cats||!it.cats.length) it.cats=autoCats(it.title); });
    const set=new Set(); items.forEach(it=>it.cats.forEach(c=>set.add(c)));
    return ['All categories', ...[...set].sort()];
  })();
  const sel = document.getElementById('categorySelect');
  sel && (sel.innerHTML = `<option value="all">All categories</option>` + cats.slice(1).map(c=>`<option>${c}</option>`).join(''));

  // Inputs ←→ State
  const si = document.getElementById('searchInput');
  const ps = document.getElementById('platformSelect');
  const ss = document.getElementById('statusSelect');
  const cs = document.getElementById('categorySelect');
  const cf = document.getElementById('clearFilters');

  si && (si.value = filterState.q);
  ps && (ps.value = filterState.platform);
  ss && (ss.value = filterState.status);
  cs && (cs.value = filterState.category);

  si && si.addEventListener('input', e=>{ filterState.q = e.target.value.trim(); renderGrid(); });
  ps && ps.addEventListener('change', e=>{ filterState.platform = e.target.value; renderGrid(); });
  ss && ss.addEventListener('change', e=>{ filterState.status = e.target.value; renderGrid(); });
  cs && cs.addEventListener('change', e=>{ filterState.category = e.target.value; renderGrid(); });
  cf && cf.addEventListener('click', ()=>{
    filterState.q=''; filterState.platform='all'; filterState.status='all'; filterState.category='all';
    si && (si.value=''); ps && (ps.value='all'); ss && (ss.value='all'); cs && (cs.value='all');
    renderGrid();
  });

  // Admin-only handlers
  if (adminMode) {
    const toggle = document.getElementById('toggleUsed');
    if(toggle){
      toggle.checked = allowMarkUsed;
      toggle.onchange = () => { allowMarkUsed = toggle.checked; renderGrid(); };
    }

    const addBtn = document.getElementById('addBtn');
    const addTitle = document.getElementById('addTitle');
    const addURL   = document.getElementById('addURL');

    if(addBtn){
      addBtn.onclick = async ()=>{
        const title = (addTitle?.value||'').trim();
        const url   = (addURL?.value||'').trim();
        if(!title || !url) return alert('Please provide title and URL');
        if(!/^https?:\/\//i.test(url)) return alert('URL must start with http(s)');
        if(items.some(i=>i.url.trim()===url.trim())) return alert('This URL already exists.');
        try{
          const saved = await apiAddItem({ title, url, cats:autoCats(title) });
          items.push(saved);
          addTitle && (addTitle.value='');
          addURL   && (addURL.value='');
          updateCounts();
          renderGrid();
          alert('Added!');
        }catch(err){ alert('Add failed: ' + err.message); }
      };
    }

    const scanDup = document.getElementById('scanDup');
    if(scanDup){
      scanDup.onclick = ()=>{
        const box = document.getElementById('dupList');
        const map = new Map();
        items.forEach(it=>{ const k=normUrl(it.url); if(!map.has(k)) map.set(k,[]); map.get(k).push(it); });
        const dups=[...map.values()].filter(a=>a.length>1);
        if(box){
          box.style.display='block';
          box.innerHTML = dups.length
            ? dups.map(g=>`<div class="dup-item">${g.map(x=>`<div><b>${escapeHtml(x.title)}</b><br><span style="font-size:12px;color:var(--muted)">${escapeHtml(x.url)}</span></div>`).join('')}</div>`).join('')
            : '<b>No duplicates found.</b>';
        }
      };
    }
  }
}

/**************** INIT ******************/
function start(){
  gateAdmin();       // handle unlock flow & redirects
  initTheme();       // theme always
  (async ()=>{
    const data = await apiGet();
    items = (data.items||[]).map((it,idx)=>({ id: it.id ?? String(idx+1)+'-'+(it.url||'').slice(-6), ...it }));
    usedStore = new Set(data.used||[]);
    updateCounts();
    initUI();
    renderGrid();

    // keep Used in sync in case another admin edited
    setInterval(async ()=>{
      try{
        const d=await apiGet();
        usedStore=new Set(d.used||[]);
        updateCounts();
        renderGrid();
      }catch{}
    }, 30000);
  })();
}

start();
