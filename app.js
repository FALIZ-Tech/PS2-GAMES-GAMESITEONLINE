(function(){
  const grid = document.getElementById('grid');
  const qInput = document.getElementById('q');
  const regionFilter = document.getElementById('region-filter');
  const genreFilter = document.getElementById('genre-filter');
  const visCnt = document.getElementById('vis-count');
  const noRes = document.getElementById('no-results');
  const sTotal = document.getElementById('s-total');
  
  // Main layout sections to hide/show
  const statsSection = document.querySelector('.stats');
  const controlsSection = document.querySelector('.controls');
  const mainTitle = document.querySelector('h1');

  // 1. Create the Virtual Download Page Container
  const dlView = document.createElement('div');
  dlView.id = 'download-view';
  dlView.style.display = 'none';
  dlView.className = 'download-view-container';
  grid.parentNode.insertBefore(dlView, grid.nextSibling);

  // 2. Inject Premium CSS for the Download Page dynamically
  const style = document.createElement('style');
  style.textContent = `
    .download-view-container {
      max-width: 900px; margin: 2rem auto 4rem; padding: 3rem;
      background: var(--panel); border: var(--border); box-shadow: 16px 16px 0 var(--ink);
      animation: cardEnter 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
      position: relative;
    }
    .dl-header { display: flex; flex-direction: column; gap: 1.5rem; margin-bottom: 3rem; border-bottom: 4px solid var(--ink); padding-bottom: 2rem; }
    .dl-title { font-family: 'Inter', sans-serif; font-size: clamp(2rem, 5vw, 3.5rem); font-weight: 900; text-transform: uppercase; line-height: 1.1; color: var(--ink); }
    
    .dl-meta-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 3rem; }
    .dl-meta-card { background: var(--panel2); border: 3px solid var(--ink); padding: 1.5rem; box-shadow: 6px 6px 0 var(--ink); transition: transform 0.2s, box-shadow 0.2s; }
    .dl-meta-card:nth-child(1) { transform: rotate(-1deg); background: #b8f2ff; }
    .dl-meta-card:nth-child(2) { transform: rotate(1deg); background: #ffd6e7; }
    .dl-meta-card:nth-child(3) { transform: rotate(-1deg); background: #d6ffba; }
    .dl-meta-card:nth-child(4) { transform: rotate(1deg); background: #ffe7d3; }
    .dl-meta-card:hover { transform: translateY(-5px) rotate(0); box-shadow: 10px 10px 0 var(--ink); }
    
    .dl-meta-label { font-size: 0.85rem; text-transform: uppercase; font-weight: 900; opacity: 0.8; margin-bottom: 0.5rem; letter-spacing: 0.05em; }
    .dl-meta-value { font-size: 1.5rem; font-weight: 900; font-family: 'Inter', sans-serif; }
    
    .btn-back { align-self: flex-start; background: var(--accent); color: #fff; padding: 0.8rem 1.5rem; font-weight: 900; text-transform: uppercase; border: var(--border); box-shadow: 4px 4px 0 #111; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; display: inline-flex; align-items: center; gap: 0.5rem; font-family: 'Space Grotesk', sans-serif; font-size: 1rem; }
    .btn-back:hover { transform: translate(-2px,-2px); box-shadow: 6px 6px 0 #111; }
    .btn-back:active { transform: translate(2px,2px); box-shadow: 2px 2px 0 #111; }
    
    .dl-final-btn { display: flex; justify-content: center; align-items: center; gap: 1rem; background: var(--green); color: #fff; padding: 1.5rem 2rem; font-size: 1.5rem; font-weight: 900; text-transform: uppercase; border: var(--border); box-shadow: 8px 8px 0 var(--ink); cursor: pointer; transition: all 0.2s; width: 100%; font-family: 'Inter', sans-serif; }
    .dl-final-btn:hover:not(:disabled) { transform: translate(-4px,-4px); box-shadow: 12px 12px 0 var(--ink); }
    .dl-final-btn:active:not(:disabled) { transform: translate(4px,4px); box-shadow: 4px 4px 0 var(--ink); }
    .dl-final-btn:disabled { background: var(--ink); color: #fff; cursor: not-allowed; transform: translate(4px,4px); box-shadow: 0px 0px 0 var(--ink); }
    
    .spinner { animation: spin 1s linear infinite; width: 28px; height: 28px; }
    @keyframes spin { 100% { transform: rotate(360deg); } }
    
    .btn-dl { cursor: pointer; font-family: 'Space Grotesk', sans-serif; font-size: 1rem; }
  `;
  document.head.appendChild(style);

  // Disable genre filter since our dataset doesn't include genres
  genreFilter.innerHTML = '<option value="">Genres Unavailable</option>';
  genreFilter.disabled = true;

  // 3. Extract Regions dynamically from the game names
  const regions = new Set();
  PS2_GAMES.forEach(g => {
    const match = g['game.name'].match(/\((USA|Japan|Europe|Korea|Asia|Australia|France|Germany|Italy|Spain|UK)\)/i);
    g.region = match ? match[1] : 'Other';
    if(g.region !== 'Other') regions.add(g.region);
  });

  // Populate the Region Dropdown
  regionFilter.innerHTML = '<option value="">All Regions</option>';
  Array.from(regions).sort().forEach(r => {
    const opt = document.createElement('option');
    opt.value = r;
    opt.textContent = r;
    regionFilter.appendChild(opt);
  });

  // SVG Icons
  const dlIcon = () => `<svg viewBox="0 0 24 24" width="24" height="24"><path d="M12 16l-6-6h4V4h4v6h4l-6 6zm-7 4h14v-2H5v2z" fill="currentColor"/></svg>`;
  const backIcon = () => `<svg viewBox="0 0 24 24" width="20" height="20"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill="currentColor"/></svg>`;
  const spinnerIcon = () => `<svg class="spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/></svg>`;
  const checkIcon = () => `<svg viewBox="0 0 24 24" width="28" height="28"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor"/></svg>`;

  // Number Counter Animation Function
  function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      obj.innerHTML = Math.floor(progress * (end - start) + start);
      if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  }

  animateValue(sTotal, 0, PS2_GAMES.length, 1200);

  // 4. Render Individual Card
  function renderCard(game, index){
    const card = document.createElement('div');
    card.className = 'card';
    card.style.animationDelay = `${(index % 30) * 0.04}s`;
    
    const cleanName = game['game.name'].replace(/\s*\([^)]+\)\s*/g, '').trim();

    card.innerHTML = `
      <span class="card-num">${game['game.game_id']}</span>
      <div class="card-title">${cleanName}</div>
      <div class="card-meta">
        <span class="tag tag-genre">Rating: ${game['game.rating']}</span>
        <span class="tag tag-region" style="background:var(--panel2)">${game.region}</span>
      </div>
      <div class="card-footer">
        <button class="btn-dl" onclick="openDownloadPage('${game['game.game_id']}')">
          ${dlIcon()} Download Page
        </button>
      </div>
    `;
    return card;
  }

  // 5. Virtual Page Routing Logic
  window.openDownloadPage = function(gameId) {
    const game = PS2_GAMES.find(g => g['game.game_id'] === gameId);
    if(!game) return;

    const cleanName = game['game.name'].replace(/\s*\([^)]+\)\s*/g, '').trim();

    // Hide main layout
    statsSection.style.display = 'none';
    controlsSection.style.display = 'none';
    grid.style.display = 'none';
    noRes.style.display = 'none';
    
    mainTitle.textContent = "DOWNLOAD TERMINAL";

    // Build Premium Download Page HTML
    dlView.innerHTML = `
      <div class="dl-header">
        <button class="btn-back" onclick="closeDownloadPage()">
          ${backIcon()} Back to Vault
        </button>
        <h2 class="dl-title">${cleanName}</h2>
      </div>
      
      <div class="dl-meta-grid">
        <div class="dl-meta-card">
          <div class="dl-meta-label">Game ID</div>
          <div class="dl-meta-value">${game['game.game_id']}</div>
        </div>
        <div class="dl-meta-card">
          <div class="dl-meta-label">Region</div>
          <div class="dl-meta-value">${game.region}</div>
        </div>
        <div class="dl-meta-card">
          <div class="dl-meta-label">Rating</div>
          <div class="dl-meta-value">${game['game.rating']} / 5.0</div>
        </div>
        <div class="dl-meta-card">
          <div class="dl-meta-label">Format</div>
          <div class="dl-meta-value">CHD / ISO</div>
        </div>
      </div>

      <button class="dl-final-btn" id="dl-action-btn" onclick="startDownload(this, '${game['game.download_link']}')">
        ${dlIcon()} Start Direct Download
      </button>
    `;

    dlView.style.display = 'block';
    window.scrollTo(0, 0);
  };

  // 6. Simulated Server Connection & Download Trigger
  window.startDownload = function(btn, link) {
    // Disable button and show loading state
    btn.disabled = true;
    const originalContent = btn.innerHTML;
    btn.innerHTML = `${spinnerIcon()} Connecting to Server...`;
    
    // Simulate a 2.5 second connection delay
    setTimeout(() => {
      // Change to success state
      btn.innerHTML = `${checkIcon()} Downloading...`;
      btn.style.background = 'var(--accent3)'; // Turns purple
      
      // Trigger the actual file download in the same window
      window.location.href = link;
      
      // Reset the button after 4 seconds so they can click it again if needed
      setTimeout(() => {
        btn.disabled = false;
        btn.innerHTML = originalContent;
        btn.style.background = 'var(--green)';
      }, 4000);
      
    }, 2500);
  };

  window.closeDownloadPage = function() {
    dlView.style.display = 'none';
    statsSection.style.display = 'grid';
    controlsSection.style.display = 'flex';
    grid.style.display = 'grid';
    mainTitle.textContent = "PS2 ISO VAULT";
    
    render();
    window.scrollTo(0, 0);
  };

  let currentFiltered = [];
  let renderLimit = 50;
  let renderTimeout;

  function triggerRender() {
    const currentCards = grid.querySelectorAll('.card');
    currentCards.forEach(c => c.style.animation = 'cardLeave 0.2s ease-in forwards');
    clearTimeout(renderTimeout);
    renderTimeout = setTimeout(render, 250);
  }

  function render(){
    const q = qInput.value.toLowerCase().trim();
    const r = regionFilter.value;
    
    currentFiltered = PS2_GAMES.filter(g => {
      const matchQ = !q || g['game.name'].toLowerCase().includes(q) || g['game.game_id'].toLowerCase().includes(q);
      const matchR = !r || g.region === r;
      return matchQ && matchR;
    });

    grid.innerHTML = '';
    renderLimit = 50;
    renderBatch();

    animateValue(visCnt, parseInt(visCnt.textContent) || 0, currentFiltered.length, 600);
    noRes.style.display = currentFiltered.length ? 'none' : 'block';
  }

  function renderBatch() {
    const fragment = document.createDocumentFragment();
    const batch = currentFiltered.slice(grid.children.length, renderLimit);
    batch.forEach((g, i) => fragment.appendChild(renderCard(g, i)));
    grid.appendChild(fragment);
  }

  window.addEventListener('scroll', () => {
    if (dlView.style.display === 'block') return; 
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 600) {
      if (grid.children.length < currentFiltered.length) {
        renderLimit += 50;
        renderBatch();
      }
    }
  });

  qInput.addEventListener('input', triggerRender);
  regionFilter.addEventListener('change', triggerRender);
  
  render();
})();
