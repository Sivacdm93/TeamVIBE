/*******************
 * CONFIG
 *******************/
const STORE_URL = 'https://script.google.com/macros/s/AKfycbwHYNuyjCuGm9h4RWkerXDe_tvow1msAFmssh_qDDKKr5cnWbT2c3pFme8CoDTAa7GAhg/exec';   // <-- paste your Apps Script /exec URL
const STORE_KEY = '258006';               // must match ADMIN_KEY in Code.gs
const ADMIN_PIN = '258006';
const nocache   = () => `&t=${Date.now()}`;

/*******************
 * STATE
 *******************/
let items = [];               // from server
let usedStore = new Set();    // from server
let allowMarkUsed = false;    // controlled by Admin checkbox
let isAdmin = false;

const filterState = { q:'', platform:'all', status:'all', category:'all' };

/*******************
 * SERVER API
 *******************/
async function apiGet(){
  const r = await fetch(`${STORE_URL}?action=get${nocache()}`);
  if(!r.ok) throw new Error('get failed');
  return r.json();
}
async function apiSetUsed(arr){
  const payload = encodeURIComponent(JSON.stringify(arr));
  const r = await fetch(`${STORE_URL}?action=setUsed&key=${encodeURIComponent(STORE_KEY)}&data=${payload}${nocache()}`);
  const j = await r.json().catch(()=>({}));
  if(!r.ok || j.ok===false) throw new Error(j.error||'setUsed failed');
}
async function apiAddItem(item){
  const cats = item.cats ? encodeURIComponent(JSON.stringify(item.cats)) : '';
  const r = await fetch(`${STORE_URL}?action=addItem&key=${encodeURIComponent(STORE_KEY)}&title=${encodeURIComponent(item.title)}&url=${encodeURIComponent(item.url)}${cats?`&cats=${cats}`:''}${nocache()}`);
  const j = await r.json().catch(()=>({}));
  if(!r.ok || j.ok===false) throw new Error(j.error||'unknown action');
  return j.item;
}
async function apiDeleteItem(url){
  const r = await fetch(`${STORE_URL}?action=deleteItem&key=${encodeURIComponent(STORE_KEY)}&url=${encodeURIComponent(url)}${nocache()}`);
  const j = await r.json().catch(()=>({}));
  if(!r.ok || j.ok===false) throw new Error(j.error||'delete failed');
  return j;
}

/*******************
 * HELPERS
 *******************/
function detectPlatform(u){
  try{ const x=new URL(u); const h=x.hostname.replace(/^www\./,'');
    if(h.endsWith('instagram.com')) return 'instagram';
    if(h.endsWith('youtube.com') || h==='youtu.be') return 'youtube';
  }catch{}
  return 'other';
}
function ytId(u){
  try{ const x=new URL(u);
    if(x.hostname==='youtu.be') return x.pathname.slice(1);
    if(x.pathname.startsWith('/shorts/')) return x.pathname.split('/')[2];
    if(x.searchParams.get('v')) return x.searchParams.get('v');
  }catch{}
  return null;
}
function ytEmbed(u){ const id=ytId(u); return id?`https://www.youtube.com/embed/${id}`:null; }
function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

// simple auto-cats
const CAT_RULES = [
  { key:'bottle',label:'Bottle' },{ key:'cup',label:'Cup' },{ key:'straw',label:'Straw' },
  { key:'balloon',label:'Balloon' },{ key:'ball',label:'Ball' },{ key:'paper',label:'Paper' },
  { key:'pyramid',label:'Pyramid' },{ key:'tower',label:'Tower' },{ key:'spin',label:'Spin' },
  { key:'balance',label:'Balance' },{ key:'challenge',label:'Challenge' },{ key:'opposite',label:'Opposites' },
];
function autoCats(title){ const t=(title||'').toLowerCase(); const out=[]; CAT_RULES.forEach(r=>t.includes(r.key)&&out.push(r.label)); return out.length?out:['General']; }

// normalize URL for duplicate checks (host+pathname only, lowercased)
function normUrl(u){
  try{ const x=new URL(u); return (x.hostname + x.pathname).replace(/^www\./,'').toLowerCase().replace(/\/+$/,''); }
  catch{ return (u||'').toLowerCase().trim(); }
}

/*******************
 * FILTERS + URL sync
 *******************/
function buildCategories(){
  items.forEach(it=>{ if(!it.cats||!it.cats.length) it.cats=autoCats(it.title); });
  const set=new Set(); items.forEach(it=>it.cats.forEach(c=>set.add(c)));
  return ['All categories', ...[...set].sort()];
}
function passesFilters(it){
  if(filterState.q){ const q=filterState.q.toLowerCase(); if(!(it.title||'').toLowerCase().includes(q)) return false; }
  const platform=detectPlatform(it.url);
  if(filterState.platform!=='all' && platform!==filterState.platform) return false;
  const isUsed=usedStore.has(it.url);
  if(filterState.status==='used' && !isUsed) return false;
  if(filterState.status==='available' && isUsed) return false;
  const cats=it.cats||autoCats(it.title);
  if(filterState.category!=='all' && !cats.includes(filterState.category)) return false;
  return true;
}
function readFiltersFromURL(){
  const p=new URLSearchParams(location.search);
  if(p.get('q')) filterState.q=p.get('q');
  if(p.get('platform')) filterState.platform=p.get('platform');
  if(p.get('status')) filterState.status=p.get('status');
  if(p.get('category')) filterState.category=p.get('category');
}
function writeFiltersToURL(){
  const p=new URLSearchParams();
  if(filterState.q) p.set('q',filterState.q);
  if(filterState.platform!=='all') p.set('platform',filterState.platform);
  if(filterState.status!=='all') p.set('status',filterState.status);
  if(filterState.category!=='all') p.set('category',filterState.category);
  history.replaceState(null,'',`${location.pathname}?${p.toString()}`);
}

/*******************
 * RENDER
 *******************/
function updateCounts(){
  const total = items.length;
  const used  = items.filter(i => usedStore.has(i.url)).length; // only those in list
  const avail = total - used;
  document.getElementById('count-total').textContent = total;
  document.getElementById('count-used').textContent = used;
  document.getElementById('count-available').textContent = avail;
}

function makeCard(item){
  const platform=detectPlatform(item.url);
  const card=document.createElement('div'); card.className='card';

  let media='';
  if(platform==='instagram'){
    media = `<div class="media"><blockquote class="instagram-media" data-instgrm-permalink="${item.url}" data-instgrm-version="14"></blockquote></div>`;
  }else if(platform==='youtube' && ytEmbed(item.url)){
    media = `<div class="media"><iframe width="100%" height="360" src="${ytEmbed(item.url)}" frameborder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>`;
  }else{
    media = `<div class="media" style="padding:10px"><a class="btn" target="_blank" href="${item.url}">Open link</a></div>`;
  }

  const isUsed=usedStore.has(item.url);
  const cats=item.cats||autoCats(item.title);

  card.innerHTML=`
    ${media}
    <div class="meta">
      <div class="title">${escapeHtml(item.title||'Link')}</div>
      <div class="url">${escapeHtml(item.url)}</div>
      <div class="chips">
        <span class="chip">${platform==='instagram'?'Instagram':'YouTube'}</span>
        ${cats.map(c=>`<span class="chip">${escapeHtml(c)}</span>`).join('')}
      </div>
    </div>
    <div class="actions">
      <a class="btn" target="_blank" href="${item.url}">${platform==='instagram'?'Open in Instagram': platform==='youtube'?'Open in YouTube':'Open link'}</a>
      <button class="btn" data-copy="${item.url}">Copy link</button>
      <button class="btn used-btn ${isUsed?'used':''}" data-url="${item.url}">${isUsed?'Used ✓':'Used'}</button>
      <button class="btn del-btn" data-del="${item.url}" style="display:${allowMarkUsed?'inline-flex':'none'}">Delete</button>
    </div>`;

  // Copy
  card.querySelector('[data-copy]').addEventListener('click', async (e)=>{
    try{ await navigator.clipboard.writeText(item.url); e.currentTarget.textContent='Copied!'; setTimeout(()=>e.currentTarget.textContent='Copy link',1200);}catch{alert('Copy failed');}
  });

  // Used toggle (only if allowed)
  card.querySelector('.used-btn').addEventListener('click', async e=>{
    if(!allowMarkUsed) return;
    const url=e.currentTarget.getAttribute('data-url');
    const was=usedStore.has(url);
    if(was) usedStore.delete(url); else usedStore.add(url);
    e.currentTarget.classList.toggle('used', usedStore.has(url));
    e.currentTarget.textContent = usedStore.has(url)?'Used ✓':'Used';
    updateCounts();
    try{ await apiSetUsed([...usedStore]); }catch{ alert('Save failed'); }
  });

  // Delete (only when allowed)
  card.querySelector('[data-del]').addEventListener('click', async (e)=>{
    if(!allowMarkUsed) return;
    const url=e.currentTarget.getAttribute('data-del');
    if(!confirm('Delete this game from the website?')) return;
    try{
      await apiDeleteItem(url);
      // remove locally and refresh
      items = items.filter(i => i.url !== url);
      usedStore.delete(url);
      updateCounts(); renderGrid();
    }catch(err){ alert('Delete failed: ' + err.message); }
  });

  return card;
}

function renderGrid(){
  const grid=document.getElementById('grid'); grid.innerHTML='';
  const filtered=items.filter(passesFilters);
  if(filtered.length===0){ document.getElementById('empty').style.display='block'; }
  else { document.getElementById('empty').style.display='none'; filtered.forEach(i=>grid.appendChild(makeCard(i))); }
  try{ window.instgrm?.Embeds?.process(); }catch{}
  document.getElementById('resultsNote').textContent = `${filtered.length} of ${items.length} shown (filters applied)`;
}

/*******************
 * THEME + FILTER UI
 *******************/
function initFilters(){
  const cats=buildCategories();
  const sel=document.getElementById('categorySelect');
  sel.innerHTML=`<option value="all">All categories</option>` + cats.slice(1).map(c=>`<option>${escapeHtml(c)}</option>`).join('');

  document.getElementById('searchInput').value=filterState.q;
  document.getElementById('platformSelect').value=filterState.platform;
  document.getElementById('statusSelect').value=filterState.status;
  document.getElementById('categorySelect').value=filterState.category;

  document.getElementById('searchInput').addEventListener('input', e=>{ filterState.q=e.target.value.trim(); writeFiltersToURL(); renderGrid(); });
  document.getElementById('platformSelect').addEventListener('change', e=>{ filterState.platform=e.target.value; writeFiltersToURL(); renderGrid(); });
  document.getElementById('statusSelect').addEventListener('change', e=>{ filterState.status=e.target.value; writeFiltersToURL(); renderGrid(); });
  document.getElementById('categorySelect').addEventListener('change', e=>{ filterState.category=e.target.value; writeFiltersToURL(); renderGrid(); });
  document.getElementById('clearFilters').addEventListener('click', ()=>{
    filterState.q=''; filterState.platform='all'; filterState.status='all'; filterState.category='all';
    document.getElementById('searchInput').value=''; document.getElementById('platformSelect').value='all';
    document.getElementById('statusSelect').value='all'; document.getElementById('categorySelect').value='all';
    writeFiltersToURL(); renderGrid();
  });

  // theme
  const THEME_KEY='tv_theme';
  function applyTheme(t){ document.documentElement.setAttribute('data-theme', t); localStorage.setItem(THEME_KEY,t); }
  applyTheme(localStorage.getItem(THEME_KEY)||'dark');
  const darkBtn=document.getElementById('themeDark'), lightBtn=document.getElementById('themeLight');
  function setActive(){ const t=localStorage.getItem(THEME_KEY)||'dark'; darkBtn.classList.toggle('active', t==='dark'); lightBtn.classList.toggle('active', t==='light'); }
  darkBtn.onclick=()=>{applyTheme('dark'); setActive();};
  lightBtn.onclick=()=>{applyTheme('light'); setActive();};
  setActive();
}

/*******************
 * ADMIN UI
 *******************/
const adminBackdrop = document.getElementById('adminBackdrop');
const adminOpen = document.getElementById('adminOpen');
const adminClose = document.getElementById('adminClose');
const toggleUsed = document.getElementById('toggleUsed');
const dupList = document.getElementById('dupList');

function openAdmin(){
  if(!isAdmin){
    const pin = prompt('Enter Admin PIN');
    if(!pin || pin.trim() !== ADMIN_PIN) { alert('Wrong PIN'); return; }
    isAdmin = true;
  }
  adminBackdrop.style.display='flex';
  toggleUsed.checked = allowMarkUsed;
}
function closeAdmin(){ adminBackdrop.style.display='none'; }

adminOpen.addEventListener('click', openAdmin);
adminClose.addEventListener('click', closeAdmin);
adminBackdrop.addEventListener('click', (e)=>{ if(e.target===adminBackdrop) closeAdmin(); });

toggleUsed.addEventListener('change', ()=>{
  allowMarkUsed = toggleUsed.checked;
  renderGrid();
});

// Add game from Admin
document.getElementById('addBtn').addEventListener('click', async ()=>{
  const title = document.getElementById('addTitle').value.trim();
  const url   = document.getElementById('addURL').value.trim();
  if(!title || !url) return alert('Please provide both title and URL');
  if(!/^https?:\/\//i.test(url)) return alert('URL must start with http(s)');
  if(items.some(i => i.url.trim() === url.trim())) return alert('This URL already exists.');

  try{
    const saved = await apiAddItem({ title, url, cats: autoCats(title) });
    items.push(saved);
    document.getElementById('addTitle').value=''; document.getElementById('addURL').value='';
    updateCounts(); renderGrid();
    alert('Added!');
  }catch(err){ alert('Add failed: ' + err.message); }
});

// Scan duplicates
document.getElementById('scanDup').addEventListener('click', ()=>{
  const map = new Map();
  items.forEach(it=>{
    const k = normUrl(it.url);
    if(!map.has(k)) map.set(k, []);
    map.get(k).push(it);
  });
  const dups = [...map.values()].filter(arr => arr.length > 1);
  if(dups.length===0){ dupList.textContent='No duplicates found.'; return; }
  const html = dups.map(group => `
    <div style="text-align:left;margin:8px 0;padding:8px;border:1px solid var(--border);border-radius:8px;">
      ${group.map(g => `<div style="margin:2px 0"><strong>${escapeHtml(g.title)}</strong><br><span class="note">${escapeHtml(g.url)}</span></div>`).join('')}
    </div>
  `).join('');
  dupList.innerHTML = html;
});

/*******************
 * INIT
 *******************/
readFiltersFromURL();

(async function init(){
  const data = await apiGet();           // { items, used }
  items = (data.items||[]).slice();
  usedStore = new Set(data.used||[]);
  items.forEach(it=>{ if(!it.cats) it.cats=autoCats(it.title); });

  updateCounts();
  initFilters();
  renderGrid();

  // refresh used every 30s
  setInterval(async ()=>{ try{ const d=await apiGet(); usedStore=new Set(d.used||[]); updateCounts(); renderGrid(); }catch{} }, 30000);
})();
