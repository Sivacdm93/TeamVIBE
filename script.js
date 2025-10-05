// === Config ===
const STORE_URL = 'https://script.google.com/macros/s/AKfycbwCdOVlPuuZujR62T1lGoJKfi1MliaRWYISv-V9GPo9wIPFZt0p5s77lKC6u_N_mSxAQA/exec';  // replace with your Google Apps Script exec URL
const STORE_KEY = '258006';                  // must match ADMIN_KEY in Apps Script

// === All Games ===
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

// === Shared store ===
let usedStore = new Set();
let adminEnabled = true;

function nocache(){ return `&t=${Date.now()}`; }

async function loadUsedFromServer() {
  const res = await fetch(`${STORE_URL}?action=get${nocache()}`);
  const data = await res.json();
  usedStore = new Set(data.used || []);
}

async function saveUsedToServer() {
  const payload = encodeURIComponent(JSON.stringify({ used: [...usedStore] }));
  const url = `${STORE_URL}?action=set&key=${encodeURIComponent(STORE_KEY)}&data=${payload}${nocache()}`;
  const res = await fetch(url);
  const data = await res.json();
  if(!res.ok || data.ok === false) throw new Error(data.error || 'save failed');
}

// === UI Helpers ===
function updateCounts() {
  document.getElementById('totalCount').textContent = items.length;
  document.getElementById('usedCount').textContent = usedStore.size;
  document.getElementById('availableCount').textContent = items.length - usedStore.size;
}

function syncButtonsFromStore() {
  document.querySelectorAll('.used-btn').forEach(btn=>{
    const url = btn.getAttribute('data-url');
    const on = usedStore.has(url);
    btn.classList.toggle('used', on);
    btn.textContent = on ? 'Used ✓' : 'Used';
  });
}

function makeCard(item) {
  const card = document.createElement('div');
  card.className = 'card';
  let openText = item.url.includes('youtube') ? 'Open in YouTube' : 'Open in Instagram';

  card.innerHTML = `
    <h3>${item.title}</h3>
    <p><a href="${item.url}" target="_blank">${openText}</a></p>
    <button class="used-btn" data-url="${item.url}">Used</button>
  `;

  const btn = card.querySelector('.used-btn');
  btn.addEventListener('click', async (e)=>{
    if(!adminEnabled) return;
    const url = e.currentTarget.getAttribute('data-url');
    const wasOn = usedStore.has(url);

    if(wasOn){ usedStore.delete(url); } else { usedStore.add(url); }
    syncButtonsFromStore();
    updateCounts();

    try { await saveUsedToServer(); }
    catch(err){
      console.error('Save error', err);
      // rollback
      if(wasOn){ usedStore.add(url); } else { usedStore.delete(url); }
      syncButtonsFromStore();
      updateCounts();
    }
  });

  return card;
}

// === Init ===
(async function init(){
  try { await loadUsedFromServer(); } catch(e){ console.warn('load failed', e); }
  const grid = document.getElementById('grid');
  items.forEach(i => grid.appendChild(makeCard(i)));
  syncButtonsFromStore();
  updateCounts();
})();
