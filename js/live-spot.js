// Gold Kings — live spot price ticker
// Uses CoinGecko's free PAX Gold (PAXG) endpoint. PAXG is a tokenized gold
// asset backed 1:1 by 1 troy oz of physical gold, so its USD price tracks
// the spot gold price closely. CoinGecko is free, requires no API key,
// and sends CORS headers so this fetch works directly from the browser.
//
// Refreshes every 60 seconds. Falls back silently to the hardcoded
// $2,634 / 0.42% values in HTML if the fetch fails (rate limit, offline).
//
// Updates any element with class .js-live-spot (the price number) and
// .js-live-delta (the 24h change percentage with arrow).

(function () {
  const URL = 'https://api.coingecko.com/api/v3/simple/price?ids=pax-gold&vs_currencies=usd&include_24hr_change=true';
  const REFRESH_MS = 60 * 1000;
  // Stale-data guard: if the API returns the same price we already display,
  // don't trigger DOM updates (cheap repaint avoidance).
  let lastPrice = null;

  async function fetchSpot() {
    try {
      const r = await fetch(URL, { cache: 'no-store' });
      if (!r.ok) return null;
      const d = await r.json();
      const p = d['pax-gold'];
      if (!p || typeof p.usd !== 'number') return null;
      return { usd: p.usd, change24h: p.usd_24h_change };
    } catch (_) {
      return null;
    }
  }

  function formatPrice(usd) {
    // Match the existing display format: comma-thousands, no decimals
    // (e.g. "2,634"). Use en-US locale for the comma separator regardless
    // of visitor locale — keeps the editorial typography consistent.
    return Math.round(usd).toLocaleString('en-US');
  }

  function applySpot(p) {
    if (!p) return;
    if (lastPrice && Math.abs(p.usd - lastPrice) < 0.5) return; // no-op guard
    lastPrice = p.usd;

    document.querySelectorAll('.js-live-spot').forEach(el => {
      el.textContent = formatPrice(p.usd);
    });

    if (typeof p.change24h === 'number') {
      const isUp = p.change24h >= 0;
      const arrow = isUp ? '▲' : '▼';   // ▲ ▼
      const text = `${arrow} ${Math.abs(p.change24h).toFixed(2)}%`;
      document.querySelectorAll('.js-live-delta').forEach(el => {
        el.textContent = text;
        el.classList.toggle('price-cine__delta--down', !isUp);
        el.classList.toggle('price-cine__delta--up', isUp);
      });
    }

    // Optional: tag the closest .price-cine ticker with a "live" indicator
    document.querySelectorAll('.price-cine__ticker').forEach(t => {
      t.classList.add('price-cine__ticker--live');
    });
  }

  function tick() { fetchSpot().then(applySpot); }
  tick();
  setInterval(tick, REFRESH_MS);
})();
