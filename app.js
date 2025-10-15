/**************** CONFIG ****************/
const STORE_URL = 'https://script.google.com/macros/s/AKfycbwHYNuyjCuGm9h4RWkerXDe_tvow1msAFmssh_qDDKKr5cnWbT2c3pFme8CoDTAa7GAhg/exec';   // <-- paste your Apps Script /exec URL
const STORE_KEY = '258006';
const ADMIN_PIN = '258006';
const nocache   = () => `&t=${Date.now()}`;

/**************** MODE DETECTION ********/
const params = new URLSearchParams(location.search);
const wantAdmin = params.get('admin') === '1';
let adminMode = false;
let allowMarkUsed = false;

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
  try {
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
function normUrl(u){
  try{
    const x=new URL(u);
    return (x.hostname+x.pathname).replace(/^www\./,'').toLowerCase().replace(/\/+$/,'');
  }catch{ return (u||'').toLowerCase().trim(); }
}

/************** FILTERS + URL ***********/
function passesFilters(it){
  if(filterState.q){
    const q=filterState.q.toLowerCase();
    if(!(it.title||'').toLowerCase().includes(q)) return false;
  }
  const platform=detectPlatform(it.url);
  if(filterState.platform!=='all' && platform!==filterState.platform) return false;
  const isUsed=usedStore.has(it.url);
  if(filterState.status==='used' && !isUsed) return false;
  if(filterState.status==='available' && isUsed) return false;
  const cats=it.cats||autoCats(it.title);
  if(filterState.category!=='all' && !cats.includes(filterState.category)) return false;
  return true;
}

/**************** RENDER ****************/
function makeCard(item){
  const platform=detectPlatform(item.url);
  const card=document.createElement('div');
  card.className='card';

  let media='';
  // 👇 Embed visible in both admin and user
  if(platform==='instagram'){
    media=`<div class="media"><blockquote class="instagram-media" data-instgrm-permalink="${item.url}" data-instgrm-version="14"></blockquote></div>`;
  }else if(platform==='youtube' && ytEmbed(item.url)){
    media=`<div class="media"><iframe width="100%" height="360" src="${ytEmbed(item.url)}" frameborder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>`;
  }else{
    media=`<div class="media" style="padding:10px"><a class="btn" href="${item.url}" target="_blank">Open link</a></div>`;
  }

  const isUsed=usedStore.has(item.url);
  const cats=item.cats||autoCats(item.title);

  card.innerHTML=`
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

  card.querySelector('[data-copy]').addEventListener('click', async (e)=>{
    try{ await navigator.clipboard.writeText(item.url);
      e.currentTarget.textContent='Copied!';
      setTimeout(()=>e.currentTarget.textContent='Copy link',1200);
    }catch{}
  });

  if(adminMode){
    const usedBtn = card.querySelector('.used-btn');
    usedBtn.addEventListener('click', async e=>{
      if(!allowMarkUsed) return;
      const url=e.currentTarget.getAttribute('data-url');
      const was=usedStore.has(url);
      if(was) usedStore.delete(url); else usedStore.add(url);
      e.currentTarget.classList.toggle('used', usedStore.has(url));
      e.currentTarget.textContent=usedStore.has(url)?'Used ✓':'Used';
      try{ await apiSetUsed([...usedStore]); }catch{ alert('Save failed'); }
    });

    card.querySelector('.del-btn').addEventListener('click', async e=>{
      const id=e.currentTarget.getAttribute('data-id');
      const url=e.currentTarget.getAttribute('data-url');
      if(!confirm('Delete this game from the website?')) return;
      try{
        if(id) await apiDeleteItemById(id);
        else await apiDeleteItemByUrl(url);
        items = items.filter(i=>i.id!==id && i.url!==url);
        usedStore.delete(url);
        renderGrid();
      }catch(err){ alert('Delete failed: '+err.message); }
    });
  }
  return card;
}

function renderGrid(){
  const grid=document.getElementById('grid');
  grid.innerHTML='';
  const filtered=items.filter(passesFilters);
  if(!filtered.length) document.getElementById('empty').style.display='block';
  else {
    document.getElementById('empty').style.display='none';
    filtered.forEach(i=>grid.appendChild(makeCard(i)));
  }
  try { window.instgrm?.Embeds?.process(); }catch{}
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
  const darkBtn=document.getElementById('themeDark');
  const lightBtn=document.getElementById('themeLight');
  const sync=()=>{const t=localStorage.getItem(KEY)||'dark';
    darkBtn.classList.toggle('active',t==='dark');
    lightBtn.classList.toggle('active',t==='light');
  };
  darkBtn.onclick=()=>{applyTheme('dark');sync();};
  lightBtn.onclick=()=>{applyTheme('light');sync();};
  sync();
}

/**************** INIT ******************/
function gateAdminIfNeeded(){
  if(!wantAdmin){ adminMode=false; allowMarkUsed=false; return; }
  if(sessionStorage.getItem('tv_admin_ok')==='1'){ adminMode=true; allowMarkUsed=true; return; }
  const pin = prompt('Enter Admin PIN:');
  if(pin===ADMIN_PIN){ sessionStorage.setItem('tv_admin_ok','1'); adminMode=true; allowMarkUsed=true; }
  else { adminMode=false; allowMarkUsed=false; }
}

gateAdminIfNeeded();
initTheme();

(async function init(){
  const data=await apiGet();
  items=(data.items||[]).map((it,idx)=>({ id: it.id ?? String(idx+1)+'-'+(it.url||'').slice(-6), ...it }));
  usedStore=new Set(data.used||[]);
  items.forEach(it=>{ if(!it.cats) it.cats=autoCats(it.title); });

  // setup counts + UI
  document.getElementById('count-total').textContent=items.length;
  document.getElementById('count-used').textContent=[...usedStore].length;
  document.getElementById('count-available').textContent=items.length-[...usedStore].length;

  renderGrid();
})();
