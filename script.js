/*******************
 * CONFIG
 *******************/
const STORE_URL = 'https://script.google.com/macros/s/AKfycbxiCAQIKEhbBz1a5AYAGAnIx5cQYh52aePJnbMgaBE-a1a7WmTiDDJ35sIj1PmYKn_TBg/exec';   // <-- replace with your Apps Script /exec URL
const STORE_KEY = '258006';               // must match ADMIN_KEY in Apps Script
const EDIT_PIN  = '258006';               // Edit PIN for UI
const nocache   = () => `&t=${Date.now()}`;

/*******************
 * DEFAULT DATA (used to bootstrap server if empty)
 *******************/
const defaultItems = [
  { title: "Drop the Pen in bottle using Mobile camera", url: "https://www.instagram.com/reel/DNP0ZztvnvZ/?igsh=M3h2M3Z5eGE2amlw" },
  { title: "Fan the Cup", url: "https://www.instagram.com/reel/DMvARSAz6qY/?igsh=MTh2cXp2M2hndW1rbA%3D%3D" },
  { title: "Strick standing Challenge", url: "https://www.instagram.com/reel/DNQEm21vdpB/?igsh=c2d2bTZyc255aTc=" },
  { title: "Hanger Transfer", url: "https://www.instagram.com/reel/DOBPgExCLgo/?igsh=MTJpazR0aHBjcjdibw==" },
  { title: "Multiple games in this Reel", url: "https://www.instagram.com/reel/DOGK-8KEskO/?igsh=MWl6cTg5cXhldmRibA==" },
  { title: "Do the Opposites", url: "https://www.instagram.com/reel/DOycseHE_NS/?igsh=eTI4ZTJ4YnRjYzM4" },
  { title: "Mission Bottle escape", url: "https://www.instagram.com/reel/DMfKLvcvbwF/?igsh=MXI0bDRicTV1ZmdlcA==" },
  { title: "Ball Gate", url: "https://www.instagram.com/reel/DLZLzUpy9JE/?igsh=MXg5dnYwaDk4ZDd0aQ==" },
  { title: "Catch it if you can", url: "https://www.instagram.com/reel/DMaaKp2TY1I/?igsh=MTk3MDYzNzA2cDI0bQ==" },
  { title: "Whats hiding in the cup?", url: "https://www.instagram.com/reel/DLZ39itSv5I/?igsh=MWkweXdpb2w2djFsNA==" },
  { title: "Spin and Drop the ball with bottle", url: "https://www.instagram.com/reel/DNFGKpSSJX1/?igsh=MTh0OXQ5OTd3bHUxMQ==" },
  { title: "Don't Clap At the Same Time", url: "https://www.instagram.com/reel/DK14cTbpnXc/?igsh=MWluNmtwYTU3ZHl0cA==" },
  { title: "Don't follow the hand", url: "https://www.instagram.com/reel/DLm-ckQSnaZ/?igsh=aTQxbW80cXo5eHF6" },
  { title: "Fill the cup with chocolate with papercup in both hand", url: "https://www.instagram.com/reel/DNlQfNvSZuO/?igsh=bHBxdzg3Nng1ZnNr" },
  { title: "Collect the cup with straw", url: "https://www.instagram.com/reel/DNqUyH0o_On/?igsh=MXFhNnF5ZGozdmo1NA==" },
  { title: "Flip the bottle", url: "https://youtube.com/shorts/JHU9ac717Tw?si=iho1cq6aS14VMxFz" },
  { title: "Blow the Cup with balloon", url: "https://www.instagram.com/reel/DNQYH_YSrvx/?igsh=MXRjYWlybHc5ZmV5bA==" },
  { title: "Tower Cup Challenge", url: "https://www.instagram.com/reel/DLZp5RYv7aY/?igsh=NTV6Z2hzcXBwNDF0" },
  { title: "Communication challenge", url: "https://youtube.com/shorts/RO0uJrbk1kc?si=c24-sWUk3MrDTOl2" },
  { title: "Don't Drop the Balloon", url: "https://youtube.com/shorts/N_xj-Zc762U?si=oJLotePSpF1qAzhC" },
  { title: "Head, Shoulder,Knees and pick the  item", url: "https://youtube.com/shorts/m_QEcL7dK7I?si=_6uZ3ArVQhS7lCj3" },
  { title: "Build the tower with Marshmallow", url: "https://youtu.be/7ZMuHZv47bQ?si=VMx2ypYdEXjBgfz9" },
  { title: "Goal the Ball", url: "https://youtube.com/shorts/bQYxwodUM2c?si=WlULSCE0Sh4vSUE-" },
  { title: "Hold the Paper with Straw", url: "https://youtube.com/shorts/mJgk6DLG7t0?si=fPG24w4lrdbg1nnG" },
  { title: "Build the pyramid with cup in head", url: "https://youtu.be/e-qehXWt36Y?si=QNK8HizfkpOFXmCE" },
  { title: "Cup and straw Balance", url: "https://youtube.com/shorts/PSDLwatlT2Q?si=jCuzv0y18d1uB3a6" },
  { title: "Hold the ball with Pen", url: "https://www.instagram.com/reel/DIog4Lnh-JV/?igsh=MWRiMGZkd2V1NWU3OQ==" },
  { title: "Spin and jump into your paper", url: "https://www.instagram.com/reel/DKPfi9ChQkg/?igsh=MTF2dWFwZ3NiMmMzMA==" },
  { title: "Transfer the ball with A4 paper", url: "https://www.instagram.com/reel/DMhVD5wRqa7/?igsh=emxtN2MzdzJ4ZDk4" },
  { title: "Catch the ball", url: "https://youtube.com/shorts/2cWj0XGiwGY?si=6J2kxLH1UWkUTM1y" }
];

/*******************
 * STATE
 *******************/
let items = [];               // server-provided list
let usedStore = new Set();    // server-provided used URLs
let adminEnabled = false;

const filterState = { q:'', platform:'all', status:'all', category:'all' };

/*******************
 * SERVER API
 *******************/
// GET both items and used
async function apiGet(){
  const res = await fetch(`${STORE_URL}?action=get${nocache()}`);
  if(!res.ok) throw new Error('get failed');
  return res.json();
}

// SET used array
async function apiSetUsed(arr){
  const payload = encodeURIComponent(JSON.stringify(arr));
  const res = await fetch(`${STORE_URL}?action=setUsed&key=${encodeURIComponent(STORE_KEY)}&data=${payload}${nocache()}`);
  const j = await res.json().catch(()=>({}));
  if(!res.ok || j.ok===false) throw new Error('setUsed failed');
}

// ADD a single item (title,url,cats?)
async function apiAddItem(item){
  const cats = item.cats ? encodeURIComponent(JSON.stringify(item.cats)) : '';
  const res = await fetch(`${STORE_URL}?action=addItem&key=${encodeURIComponent(STORE_KEY)}&title=${encodeURIComponent(item.title)}&url=${encodeURIComponent(item.url)}${cats?`&cats=${cats}`:''}${nocache()}`);
  const j = await res.json();
  if(!res.ok || j.ok===false) throw new Error(j.error||'addItem failed');
  return j.item; // returns the saved item
}

// Initialize items if server empty
async function apiInitItemsIfEmpty(){
  const payload = encodeURIComponent(JSON.stringify(defaultItems));
  const res = await fetch(`${STORE_URL}?action=setItemsIfEmpty&key=${encodeURIComponent(STORE_KEY)}&data=${payload}${nocache()}`);
  // Returns ok:true if it set, or ok:true alreadyHad:true if data existed.
  await res.json();
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

const CAT_RULES = [
  { key:'bottle',label:'Bottle' },{ key:'cup',label:'Cup' },{ key:'straw',label:'Straw' },
  { key:'balloon',label:'Balloon' },{ key:'ball',label:'Ball' },{ key:'paper',label:'Paper' },
  { key:'pyramid',label:'Pyramid' },{ key:'tower',label:'Tower' },{ key:'spin',label:'Spin' },
  { key:'balance',label:'Balance' },{ key:'challenge',label:'Challenge' },{ key:'opposite',label:'Opposites' },
];
function autoCats(title){ const t=(title||'').toLowerCase(); const out=[]; CAT_RULES.forEach(r=>t.includes(r.key)&&out.push(r.label)); return out.length?out:['General']; }

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
  const total=items.length, used=[...usedStore].length, avail=total-used;
  document.getElementById('count-total').textContent=total;
  document.getElementById('count-used').textContent=used;
  document.getElementById('count-available').textContent=avail;
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
    </div>`;

  card.querySelector('[data-copy]').addEventListener('click', async (e)=>{
    try{ await navigator.clipboard.writeText(item.url); e.currentTarget.textContent='Copied!'; setTimeout(()=>e.currentTarget.textContent='Copy link',1200);}catch{alert('Copy failed');}
  });

  card.querySelector('.used-btn').addEventListener('click', async e=>{
    if(!adminEnabled) return;
    const url=e.currentTarget.getAttribute('data-url');
    const was=usedStore.has(url);
    if(was) usedStore.delete(url); else usedStore.add(url);
    e.currentTarget.classList.toggle('used', usedStore.has(url));
    e.currentTarget.textContent = usedStore.has(url)?'Used ✓':'Used';
    updateCounts();
    try{ await apiSetUsed([...usedStore]); }catch{ alert('Save failed'); }
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
 * FILTER UI + THEME
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
 * ADD GAME (server)
 *******************/
function showAddUI(show){ document.getElementById('addWrap').style.display = show ? 'block' : 'none'; }
async function addGame(title,url){
  if(!title || !url) return alert('Please provide both title and URL');
  try{
    // avoid duplicates by URL
    if(items.some(i => i.url.trim() === url.trim())) return alert('This URL already exists.');
    const saved = await apiAddItem({ title: title.trim(), url: url.trim(), cats: autoCats(title) });
    items.push(saved);
    renderGrid(); updateCounts();
  }catch(e){ alert('Add failed: ' + e.message); }
}

/*******************
 * EXPORTS
 *******************/
function downloadJSON(filename, obj){
  const blob=new Blob([JSON.stringify(obj,null,2)],{type:'application/json'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename; a.click(); URL.revokeObjectURL(a.href);
}
function exportAll(){ downloadJSON('teamvibe_all.json', items); }
function exportFiltered(){ downloadJSON('teamvibe_filtered.json', items.filter(passesFilters)); }
function exportUsed(){ downloadJSON('teamvibe_used.json', items.filter(i=>usedStore.has(i.url))); }
function exportAvail(){ downloadJSON('teamvibe_available.json', items.filter(i=>!usedStore.has(i.url))); }
function exportCategory(){
  const cat=filterState.category==='all'?'All':filterState.category;
  const arr=filterState.category==='all'? items : items.filter(i=>(i.cats||autoCats(i.title)).includes(filterState.category));
  downloadJSON(`teamvibe_category_${cat}.json`, arr);
}

/*******************
 * INIT
 *******************/
const editBtn=document.getElementById('editToggle');
editBtn.addEventListener('click', () => {
  if(adminEnabled){ adminEnabled=false; editBtn.textContent='🔒 Edit'; showAddUI(false); return; }
  const pin=prompt('Enter Edit PIN'); if(pin && pin.trim()===EDIT_PIN){ adminEnabled=true; editBtn.textContent='✅ Editing'; showAddUI(true); }
  else alert('Wrong PIN');
});

document.getElementById('addBtn').addEventListener('click', ()=>{
  if(!adminEnabled) return;
  addGame(document.getElementById('addTitle').value, document.getElementById('addURL').value);
  document.getElementById('addTitle').value=''; document.getElementById('addURL').value='';
});

document.getElementById('exportAll').onclick=exportAll;
document.getElementById('exportFiltered').onclick=exportFiltered;
document.getElementById('exportUsed').onclick=exportUsed;
document.getElementById('exportAvail').onclick=exportAvail;
document.getElementById('exportCategory').onclick=exportCategory;

(async function init(){
  // initialize server items if empty on first run
  await apiInitItemsIfEmpty();

  // restore filters from URL
  readFiltersFromURL();

  // pull items + used from server
  const data = await apiGet(); // { ok, items:[...], used:[...] }
  items = (data.items && data.items.length) ? data.items : defaultItems.slice();
  usedStore = new Set(data.used || []);

  // enrich + render
  items.forEach(it => { if(!it.cats) it.cats = autoCats(it.title); });
  updateCounts();
  initFilters();
  renderGrid();

  // keep used fresh every 30s
  setInterval(async ()=>{ try{ const d=await apiGet(); usedStore=new Set(d.used||[]); updateCounts(); }catch{} }, 30000);
})();
