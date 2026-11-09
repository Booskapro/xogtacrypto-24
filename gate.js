/* =========================================================
   QUFULKA XUBNAHA — Follow X + Ku biir Telegram
   Bogagga: Charts · Kalandarka · Lacagta (config.js → gate)
   - 3 booqasho bilaash ah (config: gate.free)
   - Kadib: Follow X + Login with Telegram (bot-ka ayaa hubiya in qofku kooxda ku jiro)
   - Xubnaha hore: hal riix "Login with Telegram" → isla markiiba waa u furan
   Si loo damiyo: config.js → gate: { on: false }
   ========================================================= */
(function () {
  "use strict";
  const S = window.SITE || {}, G = S.gate || {};
  if (!G.on) return;
  const hdr = document.querySelector("header[data-header]");
  const page = hdr && hdr.getAttribute("data-header");
  if (["charts", "kalandarka", "lacagta"].indexOf(page) === -1) return;

  const EN = (function () { try { return localStorage.getItem("xc-lang") === "en"; } catch (e) { return false; } })();
  const T = (so, en) => (EN ? en : so);
  const get = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const set = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) { /* ignore */ } };
  const esc = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const soc = S.social || {}, XURL = soc.x || "https://x.com/Xogtacrypto24", TGURL = soc.telegram || "https://t.me/Xogtacrypto24_7";
  const XH = (S.x_handle || "@" + XURL.split("/").pop()).replace(/^@?/, "@");
  const TGH = TGURL.replace(/^https?:\/\//, "");
  const api = (op, body) => fetch("/api/member?op=" + op + (body ? "" : "&_=" + Date.now()), { cache: "no-store", method: body ? "POST" : "GET", headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined }).then((r) => r.json());
  const hit = (s) => { api("hit", { p: page, s, t: get("xc-mem") }).catch(() => {}); };

  // Tijaabo: ?qufulka → qufulka si toos ah ayuu u muuqdaa (wax lama kaydiyo, waa la xiri karaa)
  const TEST = /[?&]qufulka/.test(location.search);

  // ---------- 1) Xubin horay u ah ----------
  const tok = get("xc-mem");
  if (tok && !TEST) {
    hit("member");
    const lastChk = +get("xc-mem-chk") || 0;
    if (Date.now() - lastChk > 864e5) {
      api("check", { t: tok }).then((r) => {
        set("xc-mem-chk", String(Date.now()));
        if (r && r.member && r.t) set("xc-mem", r.t);
        else if (r && r.member === false) set("xc-mem", null); // kooxda ka baxay → booqashada xigta waa xiran tahay
      }).catch(() => {});
    }
    return;
  }

  // ---------- 2) Booqashooyinka bilaashka ah ----------
  const free = Math.max(0, +G.free || 0);
  let n = +get("xc-free") || 0;
  if (!TEST) {
    const lastPg = get("xc-free-pg"), lastAt = +get("xc-free-at") || 0;
    if (lastPg !== page || Date.now() - lastAt > 30 * 60 * 1000) { n += 1; set("xc-free", String(n)); }
    set("xc-free-pg", page); set("xc-free-at", String(Date.now()));
  }

  const ICON = '<svg viewBox="0 0 48 48" width="34" height="34" aria-hidden="true"><defs><linearGradient id="xglg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3FB8FF"/><stop offset="1" stop-color="#5B5BFF"/></linearGradient></defs><path d="M15 21v-6a9 9 0 0 1 17.4-3.3" fill="none" stroke="url(#xglg)" stroke-width="3.4" stroke-linecap="round"/><rect x="9" y="21" width="30" height="21" rx="6" fill="none" stroke="url(#xglg)" stroke-width="3.4"/><circle cx="24" cy="30" r="2.6" fill="#3FB8FF"/><path d="M24 32.5v3.5" stroke="#3FB8FF" stroke-width="3" stroke-linecap="round"/></svg>';
  const CHECK = '<svg viewBox="0 0 24 24" width="15" height="15"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const XI = '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>';
  const TGI = '<svg viewBox="0 0 24 24" width="17" height="17"><path fill="currentColor" d="M21.9 4.3 18.6 19.8c-.2 1.1-.9 1.4-1.8.9l-5-3.7-2.4 2.3c-.3.3-.5.5-1 .5l.4-5.1 9.2-8.3c.4-.4-.1-.6-.6-.2L6 13.4 1.1 11.9c-1.1-.3-1.1-1.1.2-1.6L20.5 2.9c.9-.3 1.7.2 1.4 1.4z"/></svg>';

  window.XCGate = {
    open: () => openGate(true),
    onAuth: async (user) => {
      msg(T("Waa la hubinayaa…", "Checking…"));
      try {
        const r = await api("login", { user });
        if (r && r.member && r.t) {
          set("xc-mem", r.t); set("xc-mem-chk", String(Date.now()));
          if (get("xc-xf") !== "1") set("xc-xf", "1");
          msg(T(`Ku soo dhowow${r.name ? ", " + esc(r.name) : ""}! ✓ Wax walba waa kuu furan yihiin.`, `Welcome${r.name ? ", " + esc(r.name) : ""}! ✓ Everything is unlocked.`), "ok");
          setTimeout(() => { const g = document.getElementById("xg"); if (g) g.remove(); document.body.classList.remove("xg-locked"); document.querySelectorAll(".xg-pill").forEach((p) => p.remove()); }, 1200);
        } else if (r && r.err) {
          // Bot-ka ma arki karo kooxda (ma aha in qofku ka maqan yahay)
          msg(T(`Bot-ka ma hubin karo kooxda hadda — khaladka ma aha adiga. Maamulaha website-ka waa la ogeysiiyay. (${esc(r.err)})`, `The bot can't check the group right now — it's not your fault. (${esc(r.err)})`), "bad");
        } else if (r && r.error) {
          msg(esc(r.error), "bad");
        } else {
          msg(T(`Weli kuma jirtid kooxda Telegram. <a href="${esc(TGURL)}" target="_blank" rel="noopener">Ku biir halkan</a>, kadibna mar kale riix Login.`, `You're not in the Telegram group yet. <a href="${esc(TGURL)}" target="_blank" rel="noopener">Join here</a>, then press Login again.`), "bad");
        }
      } catch (e) { msg(T("Isku day mar kale.", "Please try again."), "bad"); }
    }
  };

  if (TEST) { openGate(true); return; }
  if (n <= free) {
    hit("view");
    const left = free - n;
    const pill = document.createElement("button");
    pill.type = "button"; pill.className = "xg-pill";
    pill.innerHTML = `<span>${ICON.replace('width="34" height="34"', 'width="18" height="18"')}</span>` + esc(left > 0
      ? T(`Booqasho bilaash ah ${n}/${free} · Ku biir`, `Free visit ${n}/${free} · Join`)
      : T(`Booqashadii bilaashka ahayd ee u dambaysay · Ku biir`, `Last free visit · Join now`));
    pill.addEventListener("click", () => openGate(true));
    document.body.appendChild(pill);
    return;
  }
  hit("gate");
  openGate(false);

  // ---------- 3) Qufulka ----------
  function openGate(dismissable) {
    if (document.getElementById("xg")) return;
    const xDone = get("xc-xf") === "1";
    const m = document.createElement("div");
    m.id = "xg"; m.className = "xg"; m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true");
    m.innerHTML = `<div class="xg-box">
      ${dismissable ? `<button class="xg-x" type="button" aria-label="${T("Xir", "Close")}">×</button>` : ""}
      <div class="xg-ic">${ICON}</div>
      <h2>${T("Charts kale oo muhiim ah ayaa kuu dhiman", "More important charts are waiting for you")}</h2>
      <p>${T("Si aad u aragto dhammaan charts-ka, kalandarka iyo bogga <b>Lacagta</b>, samee labadan tallaabo. Bilaash 100% · lacag lagaa rabo ma jirto.", "To see all charts, the calendar and the <b>Money Flow</b> page, complete these two steps. 100% free · no payment required.")}</p>
      <div class="xg-st${xDone ? " ok" : ""}" id="xg-s1">
        <span class="xg-n">${xDone ? CHECK : "1"}</span>
        <div class="xg-tx"><b>${T("Follow X", "Follow on X")}</b><span>${esc(XH)}</span></div>
        <a class="xg-b xg-bx" href="${esc(XURL)}" target="_blank" rel="noopener">${xDone ? T("La sameeyay", "Done") : XI + " Follow"}</a>
      </div>
      <div class="xg-st" id="xg-s2">
        <span class="xg-n xg-tg">2</span>
        <div class="xg-tx"><b>${T("Ku biir Telegram", "Join Telegram")}</b><span>${esc(TGH)}</span></div>
        <a class="xg-b xg-bt" href="${esc(TGURL)}" target="_blank" rel="noopener">${TGI} ${T("Ku biir", "Join")}</a>
      </div>
      <div class="xg-login"><span>${T("Kadib (ama haddii aad horay ugu jirtay): xaqiiji Telegram-ka", "Then (or if you're already a member): verify with Telegram")}</span><div id="xg-w"><span class="xg-wait">…</span></div></div>
      <div class="xg-msg" id="xg-msg" hidden></div>
      <p class="xg-fine">${T("Waxaan kaydinaa magacaaga iyo @username-kaaga Telegram oo kaliya, si aan u ogaanno xubnaha. Lambarkaaga lama arko.", "We only store your Telegram name and @username to know our members. Your phone number is never shared.")}</p>
      ${dismissable ? "" : `<a class="xg-back" href="/">${T("← Ku noqo bogga hore (bilaash)", "← Back to the home page (free)")}</a>`}
    </div>`;
    document.body.appendChild(m);
    if (!dismissable) document.body.classList.add("xg-locked");
    const close = () => { m.remove(); document.body.classList.remove("xg-locked"); };
    const xb = m.querySelector(".xg-x"); if (xb) xb.addEventListener("click", close);
    m.querySelector(".xg-bx").addEventListener("click", () => {
      setTimeout(() => {
        set("xc-xf", "1");
        const s1 = m.querySelector("#xg-s1"); s1.classList.add("ok");
        s1.querySelector(".xg-n").innerHTML = CHECK; s1.querySelector(".xg-bx").textContent = T("La sameeyay", "Done");
      }, 1500);
    });
    // Login with Telegram (widget-ka rasmiga ah)
    const loadWidget = (bot) => {
      const w = m.querySelector("#xg-w"); w.innerHTML = "";
      const sc = document.createElement("script");
      sc.async = true; sc.src = "https://telegram.org/js/telegram-widget.js?22";
      sc.setAttribute("data-telegram-login", bot); sc.setAttribute("data-size", "large"); sc.setAttribute("data-radius", "12");
      sc.setAttribute("data-userpic", "false"); sc.setAttribute("data-lang", EN ? "en" : "en"); sc.setAttribute("data-onauth", "XCGate.onAuth(user)");
      w.appendChild(sc);
    };
    const cached = get("xc-bot");
    if (cached) loadWidget(cached);
    api("bot").then((r) => { if (r && r.bot) { if (r.bot !== cached) loadWidget(r.bot); set("xc-bot", r.bot); } else msg(T("Login-ka Telegram hadda lama heli karo.", "Telegram login is unavailable right now."), "bad"); })
      .catch(() => { if (!cached) msg(T("Login-ka Telegram hadda lama heli karo.", "Telegram login is unavailable right now."), "bad"); });
  }
  function msg(t, kind) { const e = document.getElementById("xg-msg"); if (!e) return; e.hidden = false; e.className = "xg-msg " + (kind || ""); e.innerHTML = t; }

})();
