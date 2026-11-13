/* =========================================================
   LACAGTA — menu-ga bogga (sticky) + liiska COINS (1,000) ee dhinaca
   Coins: CoinGecko (markets, 4 × 250) — 3 daqiiqo kasta
   Qiimaha: live, Binance spot WebSocket (!miniTicker@arr) — waxaa keena lacagta-pro.js (event "xc-spot")
   ========================================================= */
(function () {
  "use strict";
  const side = document.getElementById("lq-side"), sub = document.getElementById("lq-sub");
  if (!sub) return;
  const EN = (function () { try { return localStorage.getItem("xc-lang") === "en"; } catch (e) { return false; } })();
  const T = (so, en) => (EN ? en : so);
  const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const get = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const set = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } };
  const price = (p) => p == null ? "—" : "$" + (p >= 1000 ? p.toLocaleString("en-US", { maximumFractionDigits: 1 }) : p >= 1 ? p.toFixed(p >= 10 ? 2 : 4) : p >= 0.01 ? p.toFixed(4) : p.toPrecision(3));
  const pct = (v) => v == null || !isFinite(v) ? "—" : (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v).toFixed(2) + "%";
  const big = (v) => { if (v == null) return "—"; const a = Math.abs(v); return "$" + (a >= 1e12 ? (a / 1e12).toFixed(2) + "T" : a >= 1e9 ? (a / 1e9).toFixed(2) + "B" : a >= 1e6 ? (a / 1e6).toFixed(1) + "M" : Math.round(a / 1e3) + "K"); };

  // ---------- 1) Menu-ga bogga ----------
  const ITEMS = [["sec-flow", T("Guud", "Overview")], ["sec-cf", T("Coin kasta", "By coin")], ["sec-ls", "Long / Short"], ["sec-tr", T("Ganacsiyada waaweyn", "Large trades")], ["sec-liq", "Liquidations"], ["sec-vol", "Volume"], ["sec-flowheat", "Heatmap"], ["lq-faq", T("Su'aalo", "FAQ")]];
  sub.innerHTML = `<div class="lq-subin">${ITEMS.map(([id, l]) => `<a href="#${id}" data-id="${id}">${esc(l)}</a>`).join("")}</div>`;
  const hdr = document.querySelector(".site-header");
  const fixTop = () => { const h = hdr ? hdr.offsetHeight : 64; sub.style.top = h + "px"; document.documentElement.style.setProperty("--lq-top", (h + sub.offsetHeight + 12) + "px"); };
  fixTop(); window.addEventListener("resize", fixTop);
  const narrow = () => matchMedia("(max-width: 1100px)").matches;
  function openSide() { side.classList.add("open"); document.body.classList.add("lq-noscroll"); const i = side.querySelector("input"); if (i) setTimeout(() => i.focus(), 50); }
  function closeSide() { side.classList.remove("open"); document.body.classList.remove("lq-noscroll"); }
  sub.addEventListener("click", (e) => {
    const a = e.target.closest("a[data-id]"); if (!a) return;
    if (a.dataset.id === "lq-side") { e.preventDefault(); if (narrow()) openSide(); else { const i = side.querySelector("input"); if (i) i.focus(); } }
  });
  if (location.hash === "#lq-side" && narrow()) setTimeout(openSide, 300);
  // calaamadee qaybta hadda la joogo
  const marks = ITEMS.map(([id]) => document.getElementById(id)).filter((x) => x && x.id !== "lq-side");
  let raf = 0;
  window.addEventListener("scroll", () => {
    cancelAnimationFrame(raf); raf = requestAnimationFrame(() => {
      const y = (parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--lq-top")) || 130) + 30;
      let cur = marks[0] && marks[0].id;
      marks.forEach((m) => { if (m.getBoundingClientRect().top <= y) cur = m.id; });
      sub.querySelectorAll("a").forEach((a) => { const on = a.dataset.id === cur; a.classList.toggle("on", on); if (on && a.scrollIntoView && sub.scrollWidth > sub.clientWidth) a.parentElement.scrollLeft = a.offsetLeft - 20; });
    });
  }, { passive: true });

  // ---------- 2) Liiska coins (waa laga saaray bogga; haddii aside dib loo celiyo ayuu shaqaynayaa) ----------
  if (!side) return;
  side.innerHTML = `<div class="lq-sideh"><b>Coins</b><span class="lq-live sm"><b class="pulse"></b>Live · <em id="lq-cn">—</em></span><button class="lq-sidex" type="button" aria-label="${T("Xir", "Close")}">×</button></div>
    <input class="lq-srch" type="search" placeholder="${T("Raadi coin… (tusaale: PEPE)", "Search coin… (e.g. PEPE)")}" autocomplete="off">
    <div class="lq-mini lq-sorts" data-g="cs"><button data-v="rank" class="on">${T("Dhammaan", "All")}</button><button data-v="up">⬆ ${T("Kor", "Up")}</button><button data-v="down">⬇ ${T("Hoos", "Down")}</button><button data-v="vol">Volume</button></div>
    <div class="lq-clh"><span>#  Coin</span><span>${T("Qiimaha", "Price")} · 24s</span></div>
    <div class="lq-clist" id="lq-clist"><div class="lq-load">${T("Coins-ka ayaa soo socda…", "Loading coins…")}</div></div>
    <div class="lq-src">CoinGecko · ${T("qiimaha: Binance live", "price: Binance live")}</div>`;
  side.querySelector(".lq-sidex").addEventListener("click", closeSide);
  side.addEventListener("click", (e) => { if (e.target === side) closeSide(); });
  const list = side.querySelector("#lq-clist"), q = side.querySelector(".lq-srch");
  const st = { coins: [], sort: "rank", q: "", els: new Map() };

  function rows() {
    let a = st.coins;
    if (st.q) { const s = st.q.toLowerCase(); a = a.filter((c) => c.s.toLowerCase().includes(s) || c.n.toLowerCase().includes(s)); }
    if (st.sort === "up") a = a.slice().sort((x, y) => (y.ch ?? -1e9) - (x.ch ?? -1e9));
    else if (st.sort === "down") a = a.slice().sort((x, y) => (x.ch ?? 1e9) - (y.ch ?? 1e9));
    else if (st.sort === "vol") a = a.slice().sort((x, y) => (y.v || 0) - (x.v || 0));
    return a;
  }
  function render() {
    const a = rows(); st.els.clear();
    if (!a.length) { list.innerHTML = `<div class="lq-load">${st.coins.length ? T("Coin lama helin.", "No coin found.") : T("Coins-ka hadda lama heli karo.", "Coins unavailable.")}</div>`; return; }
    list.innerHTML = a.map((c) => `<a class="lq-cr" href="https://www.tradingview.com/symbols/${esc(c.s)}USD/" target="_blank" rel="noopener" data-s="${esc(c.s)}" title="${esc(c.n + " · Market cap " + big(c.mc) + " · Volume 24s " + big(c.v))}">
      <span class="lq-crk">${c.r || ""}</span>${c.img ? `<img src="${esc(c.img)}" alt="" width="20" height="20" loading="lazy">` : `<i></i>`}
      <span class="lq-crn"><b>${esc(c.s)}</b><small>${esc(c.n)}</small></span>
      <span class="lq-crp"><b class="lq-px">${price(c.p)}</b><small class="${c.ch >= 0 ? "up" : "down"}">${pct(c.ch)}</small></span></a>`).join("");
    list.querySelectorAll(".lq-cr").forEach((el) => { st.els.set(el.dataset.s, el); });
    const cn = side.querySelector("#lq-cn"); if (cn) cn.textContent = st.coins.length.toLocaleString("en-US");
  }
  q.addEventListener("input", () => { st.q = q.value.trim(); render(); });
  side.querySelector(".lq-sorts").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-v]"); if (!b) return;
    st.sort = b.dataset.v; side.querySelectorAll(".lq-sorts button").forEach((x) => x.classList.toggle("on", x === b)); render(); list.scrollTop = 0;
  });

  // CoinGecko (3 daqiiqo kasta; cache-ka browser-ka si aan xadka loo gaarin)
  const CG = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&sparkline=false&price_change_percentage=24h&page=";
  const STABLE = /^(USDT|USDC|DAI|FDUSD|TUSD|USDE|USDS|PYUSD|USD1|BUSD|USDP|RLUSD|USDD|FRAX|GUSD|LUSD|SUSD|BFUSD|USDX|USDB|USD0|EURC|EURT)$/i;
  function apply(raw) {
    const seen = new Set();
    st.coins = raw.filter((c) => c && c.symbol && !seen.has(c.id) && seen.add(c.id)).map((c) => ({ id: c.id, s: String(c.symbol).toUpperCase(), n: c.name, img: c.image, p: c.current_price, ch: c.price_change_percentage_24h, mc: c.market_cap, v: c.total_volume, r: c.market_cap_rank }));
    window.XCCoinSet = new Set(st.coins.map((c) => c.s));
    try { set("xc-cgset", JSON.stringify([...window.XCCoinSet])); } catch (e) { /* ignore */ }
    document.dispatchEvent(new CustomEvent("xc-coins"));
    render();
  }
  async function load() {
    try {
      const c = JSON.parse(get("xc-cg") || "null");
      if (c && Date.now() - c.at < 3 * 60e3 && Array.isArray(c.d) && c.d.length > 100) { if (!st.coins.length) apply(c.d); return; }
    } catch (e) { /* ignore */ }
    const out = [];
    for (let pg = 1; pg <= 4; pg++) {
      try { const r = await fetch(CG + pg); if (!r.ok) break; const j = await r.json(); if (!Array.isArray(j) || !j.length) break; out.push(...j); }
      catch (e) { break; }
      if (pg === 1) apply(out.slice()); // bogga 1aad isla markiiba
    }
    if (out.length) { apply(out); try { set("xc-cg", JSON.stringify({ at: Date.now(), d: out.map((c) => ({ id: c.id, symbol: c.symbol, name: c.name, image: c.image, current_price: c.current_price, price_change_percentage_24h: c.price_change_percentage_24h, market_cap: c.market_cap, total_volume: c.total_volume, market_cap_rank: c.market_cap_rank })) })); } catch (e) { /* ignore */ } }
    else if (!st.coins.length) render();
  }
  try { const s = JSON.parse(get("xc-cgset") || "null"); if (Array.isArray(s)) window.XCCoinSet = new Set(s); } catch (e) { /* ignore */ }
  load(); setInterval(load, 3 * 60e3);

  // Live: Binance spot (event ka yimid lacagta-pro.js)
  const bySym = () => { const m = new Map(); st.coins.forEach((c) => { if (!STABLE.test(c.s) && !m.has(c.s)) m.set(c.s, c); }); return m; };
  let MAP = null, mapN = 0;
  document.addEventListener("xc-spot", (e) => {
    if (!st.coins.length) return;
    if (!MAP || mapN !== st.coins.length) { MAP = bySym(); mapN = st.coins.length; }
    e.detail.forEach((x) => {
      if (!/USDT$/.test(x.s)) return;
      const c = MAP.get(x.s.slice(0, -4)); if (!c) return;
      const p = +x.c, o = +x.o; if (!p) return;
      // ilaali coin isku magac ah (qiimo aad u kala duwan → ma aha isla coin-ka)
      if (c.p && Math.abs(p / c.p - 1) > 0.25) return;
      const up = p > c.p; c.p = p; if (o) c.ch = (p / o - 1) * 100;
      const el = st.els.get(c.s); if (!el) return;
      const pe = el.querySelector(".lq-px"), ce = el.querySelector("small.up, small.down");
      if (pe && pe.textContent !== price(p)) { pe.textContent = price(p); pe.classList.remove("fu", "fd"); void pe.offsetWidth; pe.classList.add(up ? "fu" : "fd"); }
      if (ce) { ce.textContent = pct(c.ch); ce.className = c.ch >= 0 ? "up" : "down"; }
    });
  });
})();
