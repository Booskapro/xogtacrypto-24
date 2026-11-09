    if (op === "px") {
      const u = String((req.query && req.query.u) || "");
      const OK = ["https://www.okx.com/api/v5/rubik/stat/", "https://api.bybit.com/v5/market/account-ratio?"];
      if (!OK.some((a) => u.startsWith(a)) || u.length > 400) return send(400, { error: "url" });
      try {
        const r = await fetch(u, { headers: { "User-Agent": "Mozilla/5.0 (XogtaCrypto)", Accept: "application/json" } });
        const txt = await r.text();
        res.setHeader("Cache-Control", "public, s-maxage=55, stale-while-revalidate=120");
        res.statusCode = r.status; return res.end(txt);
      } catch (e) { return send(502, { error: "upstream" }); }
    }
