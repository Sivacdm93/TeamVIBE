/*******************
 * CONFIG
 *******************/
const STORE_URL = 'https://script.google.com/macros/s/AKfycbwCdOVlPuuZujR62T1lGoJKfi1MliaRWYISv-V9GPo9wIPFZt0p5s77lKC6u_N_mSxAQA/exec'; // your Apps Script /exec
const STORE_KEY = '258006';   // MUST equal ADMIN_KEY (string) in Apps Script
const EDIT_PIN  = '2580';     // UI PIN to enable edit mode (separate from STORE_KEY)
const nocache   = () => `&t=${Date.now()}`;

/*******************
 * DATA (your links)
 * You may add optional `cats: ['Category1','Category2']` per item if you want manual categories.
 *******************/
const items = [
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
let usedStore = new Set();
let adminEnabled = false;

// filters
const filterState = {
  q: '',
  platform: 'all',
  status: 'all',
  category: 'all'
};

/*******************
 * SERVER (shared store)
 *******************/
async function loadUsedFromServer() {
  const res = await fetch(`${STORE_URL}?action=get${nocache()}`);
  const data = await res.json();
  usedStore = new Set(data.used || []);
}
async function saveUsedToServer() {
  const payload = encodeURIComponent(JSON.stringify({ used: [...usedStore] }));
  const res = await fetch(`${STORE_URL}?action=set&key=${encodeURIComponent(STORE_KEY)}&data=${payload}${nocache()}`, { method:'GET' });
  const j = await res.json().catch(()=>({}));
  if(!res.ok || j.ok===false) throw new Error('Save failed: ' + (j.error || res.status));
}

/*******************
 * HELPERS
 *******************/
function detectPlatform(u){
  try{
    const x=new URL(u); const h=x.hostname.replace(/^www\./,'');
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
function ytEmbed(u){ const id=ytId(u); return id?`https://www.youtube.com/embed/${id}`:null; }
function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

/* Auto-category from title keywords (you can edit this map) */
const CAT_RULES = [
  { key:'bottle',   label:'Bottle' },
  { key:'cup',      label:'Cup' },
  { key:'straw',    label:'Straw' },
  { key:'balloon',  label:'Balloon' },
  { key:'ball',     label:'Ball' },
  { key:'paper',    label:'Paper' },
  { key:'pyramid',  label:'Pyramid' },
  { key:'tower',    label:'Tower' },
  { key:'spin',     label:'Spin' },
  { key:'balance',  label:'Balance' },
  { key:'challenge',label:'Challenge' },
  { key:'opposite', label:'Opposites' },
];
function autoCats(title){
  const t = title.toLowerCase();
  const got = [];
  CAT_RULES.forEach(r => { if(t.includes(r.key)) got.push(r.label); });
  if(got.length===0) got.push('General');
  return [...new Set(got)];
}

/*******************
 * FILTERS
 *******************/
function buildCategories(items){
  // prefer item.cats; otherwise auto-calc
  items.forEach(it => { it.cats = it.cats && it.cats.length ? it.cats : autoCats(it.title||''); });
  const set = new Set();
  items.forEach(it => it.cats.forEach(c => set.add(c)));
  return ['All categories', ...[...set].sort()];
}

function passesFilters(it){
  // search
  if(filterState.q){
    const q = filterState.q.toLowerCase();
    if(!(it.title||'').toLowerCase().includes(q)) return false;
  }
  // platform
  const platform = detectPlatform(it.url);
  if(filterState.platform!=='all' && platform!==filterState.platform) return false;
  // status
  const isUsed = usedStore.has(it.url);
  if(filterState.status==='used' && !isUsed) return false;
  if(filterState.status==='available' && isUsed) return false;
  // category
  const cats = it.cats || autoCats(it.title||'');
  if(filterState.category!=='all' && !cats.includes(filterState.category)) return false;

  return true;
}

/*******************
 * RENDER
 *******************/
function updateCounts(){
  const total = items.length;
  const used = items.filter(i=>usedStore.has(i.url)).length;
  const avail = total - used;
  document.getElementById('count-total').textContent = `Total: ${total}`;
  document.getElementById('count-used').textContent = `Used: ${used}`;
  document.getElementById('count-available').textContent = `Available: ${avail}`;
}

function syncButtonsFromStore(){
  document.querySelectorAll('.used-btn').forEach(btn=>{
    const url=btn.getAttribute('data-url');
    const on=usedStore.has(url);
    btn.classList.toggle('used', on);
    btn.textContent = on ? 'Used ✓' : 'Used';
  });
}
function refreshUsedButtons(){
  document.querySelectorAll('.used-btn').forEach(btn=>{
    btn.classList.toggle('disabled', !adminEnabled);
    btn.title = adminEnabled ? 'Mark as Used' : 'Only editors can change Used';
  });
}

function makeCard(item){
  const platform = detectPlatform(item.url);
  const card = document.createElement('div');
  card.className='card';

  // Media area
  let mediaHTML='';
  if(platform==='instagram'){
    mediaHTML = `
      <div class="media">
        <blockquote class="instagram-media" data-instgrm-permalink="${item.url}" data-instgrm-version="14"></blockquote>
      </div>`;
  }else if(platform==='youtube' && ytEmbed(item.url)){
    mediaHTML = `
      <div class="media">
        <iframe width="100%" height="360" src="${ytEmbed(item.url)}"
          title="YouTube video" frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>
      </div>`;
  }else{
    mediaHTML = `<div class="media" style="padding:10px"><a class="btn primary" target="_blank" rel="noopener" href="${item.url}">Open link</a></div>`;
  }

  const isUsed = usedStore.has(item.url);
  const cats = item.cats || autoCats(item.title||'');

  card.innerHTML = `
    ${mediaHTML}
    <div class="meta">
      <div class="title">${escapeHtml(item.title || 'Link')}</div>
      <div class="url">${escapeHtml(item.url)}</div>
      <div class="chips">
        <span class="chip">${platform==='instagram'?'Instagram':'YouTube'}</span>
        ${cats.map(c=>`<span class="chip">${escapeHtml(c)}</span>`).join('')}
      </div>
    </div>
    <div class="actions">
      <a class="btn" target="_blank" rel="noopener" href="${item.url}">
        ${platform==='instagram'?'Open in Instagram': platform==='youtube'?'Open in YouTube':'Open link'}
      </a>
      <button class="btn" data-copy="${item.url}">Copy link</button>
      <button class="btn used-btn ${isUsed?'used':''}" data-url="${item.url}">${isUsed?'Used ✓':'Used'}</button>
    </div>
  `;

  // Copy
  card.querySelector('[data-copy]').addEventListener('click', async (e)=>{
    try { await navigator.clipboard.writeText(item.url); e.currentTarget.textContent='Copied!'; setTimeout(()=>e.currentTarget.textContent='Copy link',1200); }
    catch { alert('Copy failed. Long-press to copy the link.'); }
  });

  // Used toggle
  const usedBtn = card.querySelector('.used-btn');
  usedBtn.addEventListener('click', async (e)=>{
    if(!adminEnabled) return;
    const url = e.currentTarget.getAttribute('data-url');
    const wasOn = usedStore.has(url);

    if(wasOn){ usedStore.delete(url); e.currentTarget.classList.remove('used'); e.currentTarget.textContent='Used'; }
    else{ usedStore.add(url); e.currentTarget.classList.add('used'); e.currentTarget.textContent='Used ✓'; }
    updateCounts();

    try{ await saveUsedToServer(); }
    catch(err){
      if(wasOn){ usedStore.add(url); e.currentTarget.classList.add('used'); e.currentTarget.textContent='Used ✓'; }
      else{ usedStore.delete(url); e.currentTarget.classList.remove('used'); e.currentTarget.textContent='Used'; }
      updateCounts();
      alert('Could not save. Check connection / key and try again.');
    }
  });

  return card;
}

function renderGrid(){
  const grid = document.getElementById('grid');
  grid.innerHTML = '';
  const filtered = items.filter(passesFilters);

  if(filtered.length===0){
    document.getElementById('empty').style.display='block';
  }else{
    document.getElementById('empty').style.display='none';
    filtered.forEach(i => grid.appendChild(makeCard(i)));
  }

  // Ask Instagram to process new blockquotes
  try{ if(window.instgrm?.Embeds?.process){ window.instgrm.Embeds.process(); } }catch{}

  // show results note
  document.getElementById('resultsNote').textContent =
    `${filtered.length} of ${items.length} shown (filters applied)`;

  syncButtonsFromStore();
  refreshUsedButtons();
}

/*******************
 * FILTER UI
 *******************/
function initFilters(){
  // Build category options
  const cats = buildCategories(items);
  const sel = document.getElementById('categorySelect');
  sel.innerHTML = `<option value="all">All categories</option>` + cats.slice(1).map(c=>`<option>${escapeHtml(c)}</option>`).join('');

  // Wire events
  document.getElementById('searchInput').addEventListener('input', e=>{ filterState.q = e.target.value.trim(); renderGrid(); });
  document.getElementById('platformSelect').addEventListener('change', e=>{ filterState.platform = e.target.value; renderGrid(); });
  document.getElementById('statusSelect').addEventListener('change', e=>{ filterState.status = e.target.value; renderGrid(); });
  document.getElementById('categorySelect').addEventListener('change', e=>{ filterState.category = e.target.value; renderGrid(); });
  document.getElementById('clearFilters').addEventListener('click', ()=>{
    filterState.q=''; filterState.platform='all'; filterState.status='all'; filterState.category='all';
    document.getElementById('searchInput').value='';
    document.getElementById('platformSelect').value='all';
    document.getElementById('statusSelect').value='all';
    document.getElementById('categorySelect').value='all';
    renderGrid();
  });
}

/*******************
 * INIT
 *******************/
const editBtn = document.getElementById('editToggle');
editBtn.addEventListener('click', () => {
  if(adminEnabled){ adminEnabled=false; editBtn.classList.remove('active'); editBtn.textContent='🔒 Edit'; refreshUsedButtons(); return; }
  const pin = prompt('Enter Edit PIN');
  if(pin && pin.trim()===EDIT_PIN){ adminEnabled=true; editBtn.classList.add('active'); editBtn.textContent='✅ Editing'; refreshUsedButtons(); }
  else alert('Wrong PIN');
});

(async function init(){
  // categories
  items.forEach(it => { if(!it.cats) it.cats = autoCats(it.title||''); });

  try{ await loadUsedFromServer(); }catch(e){ console.warn('[used] load failed', e); usedStore=new Set(); }
  updateCounts();
  initFilters();
  renderGrid();

  // Keep in sync every 30s in case another editor changes something
  setInterval(async ()=>{
    try{
      await loadUsedFromServer();
      updateCounts();
      syncButtonsFromStore();
    }catch{}
  }, 30000);
  /*******************
 * TITLE & QUOTE ANIMATIONS
 *******************/
const title = document.querySelector('h1');
const quote = document.querySelector('.quote');

const titleAnims = ['bounce','rotate','slideLR','popup'];
const quoteAnims = ['fadeInOut','bounce','slideLR','popup'];

function randomAnim(el, anims){
  if(!el) return;
  const anim = anims[Math.floor(Math.random()*anims.length)];
  el.style.animationName = anim;
}

setInterval(()=> randomAnim(title,titleAnims), 4000);
setInterval(()=> randomAnim(quote,quoteAnims), 5000);

// run immediately on load
randomAnim(title,titleAnims);
randomAnim(quote,quoteAnims);

})();
