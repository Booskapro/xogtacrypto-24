/* Portfolio-yada ugu waaweyn — qiimaha live (Binance), faa'iido/khasaare, sawir kasta gooni */
(function () {
  "use strict";
  const root = document.getElementById("pf"); if (!root) return;
  const EN = (function () { try { return localStorage.getItem("xc-lang") === "en"; } catch (e) { return false; } })();
  const T = (so, en) => (EN ? en : so);
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const pad = (n) => String(n).padStart(2, "0");
  const MO = EN ? ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] : ["Jan", "Feb", "Mar", "Abr", "May", "Jun", "Lul", "Og", "Seb", "Okt", "Nof", "Dis"];
  const dstr = (s) => { const d = new Date(s + "T12:00:00Z"); return d.getUTCDate() + " " + MO[d.getUTCMonth()] + " " + d.getUTCFullYear(); };

  // ---------- Xogta (warbixinnada rasmiga ah; marka ay cusboonaadaan halkan ayaa la beddelaa) ----------
  // avg = celceliska qiimaha iibka (null = lama shaacin / waa la qoday)
  const PF = [
    { k: "satoshi", name: "Satoshi Nakamoto", who: T("Abuuraha Bitcoin", "Bitcoin's creator"), ic: "₿", col: "#F7931A", coin: "BTC", qty: 1096000, avg: null,
      note: T("Waa la qoday (mined) 2009–2010, kharash iib ma jiro. Tiradu waa qiyaas.", "Mined in 2009–2010, no purchase cost. The amount is an estimate."), src: "Arkham", asOf: "2026-06-01", est: 1 },
    { k: "strategy", name: "Strategy (MSTR)", who: "Michael Saylor", ic: "S", col: "#FF7A00", coin: "BTC", qty: 850364, avg: 75456,
      src: "SEC 8-K", asOf: "2026-11-08" },
    { k: "ibit", name: "BlackRock IBIT", who: T("ETF-ga Bitcoin ee ugu weyn", "Largest Bitcoin ETF"), ic: "B", col: "#E8EDF3", coin: "BTC", qty: 806037, avg: null,
      note: T("ETF: maalgashadayaasha ayaa iska leh. Celcelis iib lama shaaciyo.", "ETF held for investors. No purchase average is published."), src: "BitcoinTreasuries", asOf: "2026-10-07" },
    { k: "bitmine", name: "Bitmine (BMNR)", who: "Tom Lee", ic: "Ξ", col: "#7B8CFF", coin: "ETH", qty: 6070092, avg: 3380,
      avgNote: T("10-K, 31 Og 2026", "10-K, Aug 31 2026"), src: "Bitmine · SEC 10-K", asOf: "2026-11-08" },
    { k: "usgov", name: T("Dowladda Mareykanka", "US Government"), who: T("Bitcoin la qabtay", "Seized bitcoin"), ic: "US", col: "#5B8DEF", coin: "BTC", qty: 328372, avg: null,
      note: T("Lacag dembiyo laga qabtay, lama iibsan.", "Seized in criminal cases, not bought."), src: "BitcoinTreasuries", asOf: "2026-10-16", est: 1 }
  ];
  const PX = { BTC: { p: 0, o: 0 }, ETH: { p: 0, o: 0 } };
  let at = null;

  const money = (v, sign) => { const a = Math.abs(v), s = v < 0 ? "−" : sign && v > 0 ? "+" : ""; return s + "$" + (a >= 1e9 ? (a / 1e9).toFixed(2) + "B" : a >= 1e6 ? (a / 1e6).toFixed(1) + "M" : a >= 1e3 ? Math.round(a / 1e3) + "K" : Math.round(a)); };
  const price = (p) => "$" + (p >= 1000 ? Math.round(p).toLocaleString("en-US") : p.toFixed(2));
  const pct = (v) => (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v).toFixed(1) + "%";
  function calc(x) {
    const q = PX[x.coin], val = x.qty * q.p, d24 = x.qty * (q.p - q.o), d24p = q.o ? (q.p / q.o - 1) * 100 : 0;
    const pl = x.avg ? val - x.qty * x.avg : null, plp = x.avg ? (q.p / x.avg - 1) * 100 : null;
    return { val, d24, d24p, pl, plp, p: q.p };
  }

  // ---------- Qaabka ----------
  const IC = {
    cam: '<svg viewBox="0 0 24 24"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>',
    dl: '<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5M12 15V3"/></svg>',
    copy: '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
    link: '<svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
    x: '<svg viewBox="0 0 24 24" class="fill"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>'
  };
  const CAM = (k) => `<span class="xcc-act" data-shot="${k}"><button class="xcc-ib" data-a="menu" aria-haspopup="true" aria-label="${T("Sawir", "Image")}">${IC.cam}</button>
    <div class="xcc-menu" role="menu" hidden>
      <button data-a="dl">${IC.dl}${T("Soo deji sawirka", "Download image")}</button>
      <button data-a="copy">${IC.copy}${T("Koobi garee sawirka", "Copy image")}</button>
      <button data-a="link">${IC.link}${T("Koobi garee link-ga", "Copy link")}</button>
      <hr><button data-a="x">${IC.x}${T("Ku wadaag X", "Share on X")}</button>
    </div></span>`;

  root.innerHTML = `
    <div class="pf-tot">
      <div><span class="pf-l">${T("Wadarta 5-ta portfolio", "Total of the 5 portfolios")}</span><b id="pf-tv">—</b></div>
      <div><span class="pf-l">${T("24 saac", "24 hours")}</span><b id="pf-td">—</b></div>
      <div class="pf-px"><span class="pf-l">BTC</span><b id="pf-btc">—</b></div>
      <div class="pf-px"><span class="pf-l">ETH</span><b id="pf-eth">—</b></div>
      <span class="pf-ta"><span class="lq-live"><b class="pulse"></b>Live</span>${CAM("all")}</span>
    </div>
    <div class="pf-list" id="pf-list">${PF.map((x) => `
      <article class="pf-c" id="pf-${x.k}" data-k="${x.k}">
        <div class="pf-hd">
          <span class="pf-av" style="color:${x.col};background:${x.col}1f">${esc(x.ic)}</span>
          <div class="pf-nm"><b><span class="pf-rk"></span>${esc(x.name)}</b><span>${esc(x.who)}</span></div>
          ${CAM(x.k)}
        </div>
        <div class="pf-val"><b class="pf-v">—</b><span class="pf-d"></span></div>
        <div class="pf-g">
          <div><span>${T("Haysta", "Holds")}</span><b>${x.qty.toLocaleString("en-US")} ${x.coin}</b></div>
          <div><span>${T("Celceliska iibka", "Avg. buy price")}</span><b>${x.avg ? "$" + x.avg.toLocaleString("en-US") : "—"}</b>${x.avgNote ? `<small>${esc(x.avgNote)}</small>` : ""}</div>
          <div><span>${T("Qiimaha", "Price")} ${x.coin}</span><b class="pf-p">—</b></div>
        </div>
        ${x.avg ? `<div class="pf-pl"><span>${T("Faa'iido / khasaare guud", "Total profit / loss")}</span><b class="pf-plv">—</b></div><div class="pf-bar"><i></i></div>`
          : `<p class="pf-note">${esc(x.note || "")}</p>`}
        <p class="pf-src">${T("Isha", "Source")}: ${esc(x.src)} · ${dstr(x.asOf)}${x.est ? " · " + T("qiyaas", "estimate") : ""}</p>
      </article>`).join("")}
    </div>`;

  // ---------- Cusbooneysiin (ilbiriqsi kasta) ----------
  const last = {};
  function flash(el, up) { el.classList.remove("pf-up", "pf-dn"); void el.offsetWidth; el.classList.add(up ? "pf-up" : "pf-dn"); }
  function render() {
    if (!PX.BTC.p || !PX.ETH.p) return;
    const rows = PF.map((x) => ({ x, c: calc(x) })).sort((a, b) => b.c.val - a.c.val);
    const list = document.getElementById("pf-list");
    rows.forEach((r, i) => {
      const el = document.getElementById("pf-" + r.x.k), c = r.c;
      if (list.children[i] !== el) list.insertBefore(el, list.children[i]);
      el.querySelector(".pf-rk").textContent = (i + 1) + ". ";
      const v = el.querySelector(".pf-v");
      if (last[r.x.k] != null && Math.abs(c.val - last[r.x.k]) >= 1) flash(v, c.val > last[r.x.k]);
      last[r.x.k] = c.val;
      v.textContent = money(c.val);
      const d = el.querySelector(".pf-d");
      d.textContent = money(c.d24, true) + " (" + pct(c.d24p) + ") · 24h"; d.className = "pf-d " + (c.d24 >= 0 ? "up" : "dn");
      el.querySelector(".pf-p").textContent = price(c.p);
      if (r.x.avg) {
        const pl = el.querySelector(".pf-plv");
        pl.textContent = money(c.pl, true) + " (" + pct(c.plp) + ")"; pl.className = "pf-plv " + (c.pl >= 0 ? "up" : "dn");
        const b = el.querySelector(".pf-bar i"); b.style.width = Math.min(100, Math.abs(c.plp) * 2) + "%"; b.className = c.pl >= 0 ? "up" : "dn";
      }
    });
    const tv = rows.reduce((s, r) => s + r.c.val, 0), td = rows.reduce((s, r) => s + r.c.d24, 0);
    document.getElementById("pf-tv").textContent = money(tv);
    const tdel = document.getElementById("pf-td"); tdel.textContent = money(td, true); tdel.className = td >= 0 ? "up" : "dn";
    const bt = document.getElementById("pf-btc"), et = document.getElementById("pf-eth");
    bt.textContent = price(PX.BTC.p) + " " + pct((PX.BTC.p / PX.BTC.o - 1) * 100); bt.className = PX.BTC.p >= PX.BTC.o ? "up" : "dn";
    et.textContent = price(PX.ETH.p) + " " + pct((PX.ETH.p / PX.ETH.o - 1) * 100); et.className = PX.ETH.p >= PX.ETH.o ? "up" : "dn";
  }
  async function rest() {
    try {
      const j = await (await fetch('https://api.binance.com/api/v3/ticker/24hr?symbols=["BTCUSDT","ETHUSDT"]')).json();
      j.forEach((t) => { const k = t.symbol.replace("USDT", ""); PX[k] = { p: +t.lastPrice, o: +t.openPrice }; });
      at = new Date(); render();
    } catch (e) { /* WebSocket ayaa sii wadi doona */ }
  }
  let dirty = false;
  function live() {
    let s;
    try { s = new WebSocket("wss://stream.binance.com:9443/stream?streams=btcusdt@ticker/ethusdt@ticker"); } catch (e) { return; }
    s.onmessage = (m) => { try { const d = JSON.parse(m.data).data; const k = d.s.replace("USDT", ""); PX[k] = { p: +d.c, o: +d.o }; at = new Date(); dirty = true; } catch (e) { /* ignore */ } };
    s.onclose = () => setTimeout(live, 3000);
  }
  rest(); live();
  setInterval(() => { if (dirty) { dirty = false; render(); } }, 1000);
  setInterval(rest, 60000);

  // ---------- Sawirka (1200×675 PNG) ----------
  const W0 = 1200, H0 = 675, FB = "Inter, Arial, sans-serif", FD = "'Inter Tight', Inter, Arial, sans-serif";
  const G = "#2BD67B", R = "#F05A5F", K = { bg: "#0B1220", card: "#121A2B", ink: "#FFFFFF", mut: "#A9B6C4", dim: "#6E7D8F", line: "rgba(255,255,255,.09)" };
  const tx = (x, y, t, size, o) => { o = o || {}; return `<text x="${x}" y="${y}" font-family="${o.d ? FD : FB}" font-size="${size}" font-weight="${o.w || 400}" fill="${o.c || K.ink}"${o.a ? ` text-anchor="${o.a}"` : ""}>${esc(t)}</text>`; };
  const box = (x, y, w, h, fill, stroke) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="${fill || K.card}"${stroke ? ` stroke="${stroke}"` : ""}/>`;
  let LOGO = "", FONTS = null;
  async function dataURI(url) { const b = await (await fetch(url)).blob(); return await new Promise((ok) => { const fr = new FileReader(); fr.onload = () => ok(fr.result); fr.readAsDataURL(b); }); }
  async function fonts() {
    if (FONTS !== null) return FONTS;
    try {
      const css = await (await fetch("https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Inter+Tight:wght@700;800&display=swap")).text();
      const out = await Promise.all(css.split("@font-face").slice(1).filter((b) => /U\+0000-00FF/.test(b)).map(async (b) => {
        const fam = (b.match(/font-family:\s*'([^']+)'/) || [])[1], wt = (b.match(/font-weight:\s*(\d+)/) || [])[1], url = (b.match(/url\(([^)]+)\)/) || [])[1];
        return fam && url ? `@font-face{font-family:'${fam}';font-weight:${wt};src:url(${await dataURI(url)}) format('woff2');}` : "";
      }));
      FONTS = out.join("");
    } catch (e) { FONTS = ""; }
    return FONTS;
  }
  function bodyOne(x) {
    const c = calc(x); let s = "";
    s += `<circle cx="100" cy="100" r="44" fill="${x.col}" fill-opacity=".14"/>` + tx(100, 100 + (x.ic.length > 1 ? 12 : 16), x.ic, x.ic.length > 1 ? 32 : 44, { w: 800, c: x.col, a: "middle", d: 1 });
    s += tx(166, 94, x.name, 44, { d: 1, w: 800 }) + tx(166, 132, x.who, 24, { c: K.mut });
    s += tx(1144, 92, "● LIVE", 22, { w: 700, c: G, a: "end" }) + tx(1144, 126, T("Qiimaha portfolio-ga", "Portfolio value"), 20, { c: K.mut, a: "end" });
    s += tx(56, 262, money(c.val), 112, { d: 1, w: 800 });
    s += tx(56, 312, money(c.d24, true) + " (" + pct(c.d24p) + ") " + T("24 saac", "24h"), 30, { w: 700, c: c.d24 >= 0 ? G : R });
    const cells = [[T("Haysta", "Holds"), x.qty.toLocaleString("en-US") + " " + x.coin], [T("Celceliska iibka", "Avg. buy price"), x.avg ? "$" + x.avg.toLocaleString("en-US") : "—"], [T("Qiimaha ", "Price ") + x.coin, price(c.p)]];
    cells.forEach((cl, i) => { const bx = 56 + i * 370; s += box(bx, 352, 348, 112) + tx(bx + 28, 394, cl[0], 20, { c: K.mut }) + tx(bx + 28, 440, cl[1], 34, { d: 1, w: 800 }); });
    if (x.avg) {
      const up = c.pl >= 0;
      s += box(56, 486, 1088, 102, up ? "rgba(43,214,123,.12)" : "rgba(240,90,95,.12)", up ? "rgba(43,214,123,.45)" : "rgba(240,90,95,.45)");
      s += tx(88, 546, T("Faa'iido / khasaare guud", "Total profit / loss"), 26, { w: 700, c: K.mut }) + tx(1112, 554, money(c.pl, true) + " (" + pct(c.plp) + ")", 50, { d: 1, w: 800, a: "end", c: up ? G : R });
    } else {
      s += box(56, 486, 1088, 102) + tx(88, 546, x.note || "", 24, { c: K.mut });
    }
    return { s, src: x.src + " · " + dstr(x.asOf) + " · Binance" };
  }
  function bodyAll() {
    const rows = PF.map((x) => ({ x, c: calc(x) })).sort((a, b) => b.c.val - a.c.val);
    let s = tx(56, 76, T("5-ta portfolio crypto ee ugu waaweyn", "The 5 biggest crypto portfolios"), 38, { d: 1, w: 800 }) + tx(1144, 76, "● LIVE", 22, { w: 700, c: G, a: "end" });
    rows.forEach((r, i) => {
      const y = 106 + i * 98, c = r.c, x = r.x;
      s += box(56, y, 1088, 84) + `<circle cx="104" cy="${y + 42}" r="26" fill="${x.col}" fill-opacity=".14"/>` + tx(104, y + 51, x.ic, x.ic.length > 1 ? 20 : 26, { w: 800, c: x.col, a: "middle", d: 1 });
      s += tx(148, y + 38, (i + 1) + ". " + x.name, 26, { w: 700 }) + tx(148, y + 66, x.qty.toLocaleString("en-US") + " " + x.coin + " · " + x.who, 18, { c: K.mut });
      s += tx(770, y + 52, money(c.val), 34, { d: 1, w: 800, a: "end" });
      s += x.avg ? tx(1112, y + 40, money(c.pl, true), 26, { d: 1, w: 800, a: "end", c: c.pl >= 0 ? G : R }) + tx(1112, y + 66, T("guud ", "total ") + pct(c.plp), 18, { a: "end", c: K.mut })
        : tx(1112, y + 40, money(c.d24, true), 26, { d: 1, w: 800, a: "end", c: c.d24 >= 0 ? G : R }) + tx(1112, y + 66, "24h " + pct(c.d24p), 18, { a: "end", c: K.mut });
    });
    return { s, src: "SEC · Arkham · BitcoinTreasuries · Binance" };
  }
  async function shotSVG(k) {
    const [fc, logo] = await Promise.all([fonts(), LOGO || dataURI("logo.svg").then((u) => (LOGO = u)).catch(() => "")]);
    const b = k === "all" ? bodyAll() : bodyOne(PF.find((x) => x.k === k)), d = at || new Date();
    const when = d.getDate() + " " + MO[d.getMonth()] + " " + d.getFullYear() + " · " + pad(d.getHours()) + ":" + pad(d.getMinutes());
    let s = `<rect width="${W0}" height="${H0}" fill="${K.bg}"/>` + b.s;
    s += `<line x1="56" x2="${W0 - 56}" y1="${H0 - 64}" y2="${H0 - 64}" stroke="${K.line}"/>` + tx(56, H0 - 28, when + " · " + T("Isha: ", "Source: ") + b.src, 16, { c: K.dim });
    if (logo) s += `<image href="${logo}" x="${W0 - 56 - 214}" y="${H0 - 50}" width="28" height="28"/>`;
    s += tx(W0 - 56, H0 - 29, "Xogta Crypto 24/7", 19, { d: 1, w: 800, a: "end" });
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W0}" height="${H0}" viewBox="0 0 ${W0} ${H0}"><style>${fc}</style>${s}</svg>`;
  }
  async function shotPNG(k) {
    const img = new Image(); img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(await shotSVG(k)); await img.decode();
    const cv = document.createElement("canvas"); cv.width = W0 * 2; cv.height = H0 * 2; cv.getContext("2d").drawImage(img, 0, 0, W0 * 2, H0 * 2);
    return await new Promise((ok) => cv.toBlob(ok, "image/png"));
  }
  let tT;
  const toast = (m) => { let t = document.getElementById("xc-toast"); if (!t) { t = document.createElement("div"); t.id = "xc-toast"; document.body.appendChild(t); } t.textContent = m; t.classList.add("on"); clearTimeout(tT); tT = setTimeout(() => t.classList.remove("on"), 2600); };
  const closeAll = () => root.querySelectorAll(".xcc-act").forEach((w) => { w.querySelector(".xcc-menu").hidden = true; w.querySelector(".xcc-ib").classList.remove("on"); });
  root.addEventListener("click", async (e) => {
    const b = e.target.closest && e.target.closest(".xcc-act button"); if (!b) return;
    const w = b.closest(".xcc-act"), k = w.dataset.shot, a = b.dataset.a;
    e.stopPropagation();
    if (a === "menu") { const m = w.querySelector(".xcc-menu"), o = m.hidden; closeAll(); m.hidden = !o; b.classList.toggle("on", o); return; }
    closeAll(); if (!PX.BTC.p) return;
    const x = PF.find((p) => p.k === k), url = location.origin + "/portfolio" + (x ? "#pf-" + k : "");
    const text = (x ? x.name + " · " + money(calc(x).val) + (x.avg ? " · " + T("faa'iido/khasaare ", "P/L ") + money(calc(x).pl, true) : "") : T("5-ta portfolio crypto ee ugu waaweyn · live", "The 5 biggest crypto portfolios · live")) + "\n\n" + url + (window.SITE && window.SITE.x_handle ? "\n" + window.SITE.x_handle : "");
    const name = `xogta-crypto-portfolio-${k}-${new Date().toISOString().slice(0, 10)}.png`;
    try {
      if (a === "link") { await navigator.clipboard.writeText(url); toast(T("Link-ga waa la koobiyeeyay", "Link copied")); return; }
      if (a === "copy") { await navigator.clipboard.write([new ClipboardItem({ "image/png": shotPNG(k) })]); toast(T("Sawirka waa la koobiyeeyay", "Image copied")); return; }
      const blob = await shotPNG(k), file = new File([blob], name, { type: "image/png" });
      if (matchMedia("(pointer: coarse)").matches && navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share(a === "x" ? { files: [file], text } : { files: [file] }); return; }
      if (a === "dl") { const l = document.createElement("a"); l.href = URL.createObjectURL(blob); l.download = name; document.body.appendChild(l); l.click(); setTimeout(() => { URL.revokeObjectURL(l.href); l.remove(); }, 1500); toast(T("Sawirka waa la soo dejiyay", "Image downloaded")); return; }
      try { await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]); toast(T("Sawirka waa la koobiyeeyay — X-ka ku dheji (Ctrl+V)", "Image copied — paste it into X (Ctrl+V)")); } catch (err) { /* ignore */ }
      window.open("https://x.com/intent/post?text=" + encodeURIComponent(text), "_blank", "noopener");
    } catch (err) { if (!err || err.name !== "AbortError") toast(T("Waan ka xumahay, isku day mar kale", "Sorry, please try again")); }
  });
  document.addEventListener("click", (e) => { if (!e.target.closest || !e.target.closest("#pf .xcc-act")) closeAll(); });
  window.XCPortfolio = { shotSVG, PF, PX };
})();
