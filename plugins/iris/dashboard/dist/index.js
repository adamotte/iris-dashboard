/* =============================================================
   Iris — hermes-agent dashboard plugin
   Control-center home page (overrides "/") + mobile bar (overlay slot).
   No invented data: every block reads a documented core API endpoint
   and degrades gracefully ("—") when a response is missing or reshaped.
   ============================================================= */
(function () {
  "use strict";
  var SDK = window.__HERMES_PLUGIN_SDK__;
  var REG = window.__HERMES_PLUGINS__;
  if (!SDK || !REG) return;

  var React = SDK.React;
  var h = React.createElement;
  var hooks = SDK.hooks || React;
  var useState = hooks.useState;
  var useEffect = hooks.useEffect;
  var useMemo = hooks.useMemo;

  /* ---------- utilities ---------- */
  function timeAgo(v) {
    try {
      if (v == null) return "";
      if (SDK.utils) {
        if (typeof v === "number" && SDK.utils.timeAgo) return SDK.utils.timeAgo(v);
        if (typeof v === "string" && SDK.utils.isoTimeAgo) return SDK.utils.isoTimeAgo(v);
      }
    } catch (e) { /* noop */ }
    return "";
  }

  // Exact response shapes vary across versions: find the first plausible array.
  function asList(data, keys) {
    if (Array.isArray(data)) return data;
    if (!data || typeof data !== "object") return [];
    for (var i = 0; i < keys.length; i++) {
      if (Array.isArray(data[keys[i]])) return data[keys[i]];
    }
    for (var k in data) if (Array.isArray(data[k])) return data[k];
    return [];
  }
  function firstNum() {
    for (var i = 0; i < arguments.length; i++) {
      var v = arguments[i];
      if (typeof v === "number" && isFinite(v)) return v;
    }
    return null;
  }
  function fmtTokens(n) {
    if (n == null) return "—";
    if (n >= 1e6) return (n / 1e6).toFixed(2) + " M";
    if (n >= 1e3) return Math.round(n / 1e3) + " K";
    return String(n);
  }
  function fmtCost(n) {
    return n == null ? "—" : n.toFixed(2) + " $";
  }
  function fmtBytes(n) {
    if (n == null) return "—";
    if (n >= 1e9) return (n / 1e9).toFixed(1) + " Go";
    if (n >= 1e6) return Math.round(n / 1e6) + " Mo";
    if (n >= 1e3) return Math.round(n / 1e3) + " Ko";
    return n + " o";
  }

  function useJSON(path, refreshMs) {
    var st = useState(null); var data = st[0], setData = st[1];
    useEffect(function () {
      var alive = true;
      function load() {
        SDK.fetchJSON(path).then(function (d) { if (alive) setData(d); })
          .catch(function () { /* silent: the block will render "—" */ });
      }
      load();
      var t = refreshMs ? setInterval(load, refreshMs) : null;
      return function () { alive = false; if (t) clearInterval(t); };
    }, [path]);
    return data;
  }

  /* ---------- UI building blocks ---------- */
  function Card(title, extraHead, body, cls) {
    return h("section", { className: "iris-card " + (cls || "") },
      title ? h("div", { className: "iris-card-head" },
        h("h3", null, title), h("span", { className: "iris-spacer" }), extraHead || null) : null,
      body);
  }
  function Tile(label, value, sub) {
    return h("div", { className: "iris-card iris-tile" },
      h("div", { className: "iris-t-label" }, label),
      h("div", { className: "iris-t-value" }, value),
      h("div", { className: "iris-t-sub" }, sub || " "));
  }
  function Row(icon, title, sub, meta) {
    return h("div", { className: "iris-row" },
      h("span", { className: "iris-row-ic " + (icon || "") }),
      h("span", { className: "iris-row-body" },
        h("b", null, title), sub ? h("small", null, sub) : null),
      meta != null ? h("span", { className: "iris-row-meta" }, meta) : null);
  }
  function Meter(label, pct, val) {
    return h("div", { className: "iris-meter" },
      h("span", { className: "iris-m-label" }, label),
      h("span", { className: "iris-m-bar" },
        h("i", { style: { width: Math.max(0, Math.min(100, pct || 0)) + "%" } })),
      h("span", { className: "iris-m-val" }, val));
  }
  function Dot(state) { return h("span", { className: "iris-dot " + state }); }
  function NavLink(href, label) {
    return h("a", { className: "iris-link", href: href }, label + " →");
  }

  /* ---------- data normalization ---------- */
  function normDaily(usage) {
    var days = asList(usage, ["daily", "days", "usage", "chart"]);
    return days.map(function (d) {
      var tokens = firstNum(d.total_tokens, d.tokens,
        (firstNum(d.input_tokens, d.input) || 0) + (firstNum(d.output_tokens, d.output) || 0) || undefined);
      return {
        date: d.date || d.day || "",
        tokens: tokens,
        cost: firstNum(d.cost, d.estimated_cost),
        cache: firstNum(d.cache_rate, d.cache)
      };
    }).filter(function (d) { return d.tokens != null; });
  }

  /* ---------- chart (inline SVG, single series) ---------- */
  function UsageChart(props) {
    var days = props.days || [];
    var hv = useState(-1); var hover = hv[0], setHover = hv[1];
    if (!days.length) return h("div", { className: "iris-empty" }, "Données d'utilisation indisponibles");
    var W = 640, H = 190, padL = 42, padR = 6, padT = 12, padB = 22;
    var max = Math.max.apply(null, days.map(function (d) { return d.tokens; })) * 1.15 || 1;
    var plotW = W - padL - padR, plotH = H - padT - padB;
    var slot = plotW / days.length, bw = Math.min(30, slot * 0.58);
    var kids = [];
    [0, 0.5, 1].forEach(function (f, gi) {
      var y = padT + plotH - f * plotH;
      kids.push(h("line", { key: "g" + gi, x1: padL, x2: W - padR, y1: y, y2: y, className: "iris-grid" }));
      kids.push(h("text", { key: "gt" + gi, x: padL - 8, y: y + 3.5, textAnchor: "end", className: "iris-axis" },
        fmtTokens(Math.round(max * f))));
    });
    days.forEach(function (d, i) {
      var bh = Math.max(4, (d.tokens / max) * plotH);
      var x = padL + i * slot + (slot - bw) / 2, y = padT + plotH - bh;
      kids.push(h("rect", {
        key: "b" + i, x: x, y: y, width: bw, height: bh, rx: 3,
        className: "iris-bar" + (hover === i ? " hover" : ""),
        onMouseEnter: function () { setHover(i); },
        onMouseLeave: function () { setHover(-1); }
      }));
      if (i % 2 === 1) kids.push(h("text", {
        key: "x" + i, x: x + bw / 2, y: H - 6, textAnchor: "middle", className: "iris-axis"
      }, String(d.date).slice(5)));
    });
    var tip = hover >= 0 ? h("div", { className: "iris-tt" },
      h("b", null, days[hover].date),
      h("div", null, "Tokens : " + fmtTokens(days[hover].tokens)),
      days[hover].cost != null ? h("div", null, "Coût : " + fmtCost(days[hover].cost)) : null
    ) : null;
    return h("div", { className: "iris-chart-wrap" },
      h("svg", { viewBox: "0 0 " + W + " " + H, className: "iris-chart", role: "img",
        "aria-label": "Tokens par jour" }, kids), tip);
  }

  /* ---------- home page ---------- */
  function HomePage() {
    var status = useJSON("/api/status", 5000);
    var sessions = useJSON("/api/sessions", 15000);
    var usage = useJSON("/api/analytics/usage?days=14", 60000);
    var cron = useJSON("/api/cron/jobs", 30000);
    var pairing = useJSON("/api/pairing", 30000);
    var memory = useJSON("/api/memory", 120000);
    var skills = useJSON("/api/skills", 120000);
    var sysStats = useJSON("/api/system/stats", 20000);
    var platforms = useJSON("/api/messaging/platforms", 30000);

    var days = useMemo(function () { return normDaily(usage); }, [usage]);
    var last = days.length ? days[days.length - 1] : null;
    var avg7 = null;
    if (days.length >= 2) {
      var w = days.slice(-8, -1).filter(function (d) { return d.cost != null; });
      if (w.length) avg7 = w.reduce(function (s, d) { return s + d.cost; }, 0) / w.length;
    }
    var sessList = asList(sessions, ["sessions", "items", "recent"]);
    var active = firstNum(status && status.active_sessions, status && status.activeSessions,
      status && status.sessions_active);
    var jobs = asList(cron, ["jobs", "items"]);
    var pending = asList(pairing, ["pending", "requests"]);
    var plats = asList(platforms, ["platforms", "items"]);
    var skillList = asList(skills, ["skills", "items"]);
    var enabledSkills = skillList.filter(function (s) { return s.enabled !== false; }).length;
    var memFiles = memory ? asList(memory, ["files", "sizes", "stores"]) : [];
    var memTotal = null;
    if (memFiles.length) {
      memTotal = memFiles.reduce(function (s, f) { return s + (firstNum(f.size, f.bytes) || 0); }, 0) || null;
    }
    var cpu = sysStats && firstNum(sysStats.cpu_percent, sysStats.cpu && sysStats.cpu.percent);
    var mem = sysStats && firstNum(sysStats.memory_percent, sysStats.memory && sysStats.memory.percent);
    var disk = sysStats && firstNum(sysStats.disk_percent, sysStats.disk && sysStats.disk.percent);
    var gwOnline = !!(status && (status.gateway === "running" || status.gateway_running ||
      (status.gateway && status.gateway.running)));

    var nextJob = null;
    jobs.forEach(function (j) {
      var nr = j.next_run || j.nextRun || j.next;
      if (!nr || j.paused || j.state === "paused") return;
      if (!nextJob || nr < (nextJob.next_run || nextJob.nextRun || nextJob.next)) nextJob = j;
    });

    var alerts = [];
    pending.forEach(function (p) {
      alerts.push(Row("warn", "Appairage " + (p.platform || ""),
        (p.user || p.username || p.code || "") + " · code " + (p.code || "?"),
        NavLink("/pairing", "Traiter")));
    });
    plats.forEach(function (p) {
      var enabled = p.enabled !== false && p.enabled !== undefined;
      var connected = p.connected === true || p.status === "connected";
      if (enabled && p.configured !== false && !connected) {
        alerts.push(Row("warn", (p.label || p.id || "Canal") + " : déconnecté",
          "Canal activé mais non connecté", NavLink("/config", "Vérifier")));
      }
    });

    return h("div", { className: "iris-home" },
      /* header */
      h("div", { className: "iris-page-head" },
        h("div", null,
          h("h2", null, "Vue d'ensemble"),
          h("p", null,
            gwOnline ? "Passerelle en ligne" : "Passerelle arrêtée",
            active != null ? " · " + active + " session(s) active(s)" : "",
            status && status.version ? " · v" + status.version : "")),
        h("div", { className: "iris-actions" },
          h("a", { className: "iris-btn", href: "/logs" }, "Logs"),
          h("a", { className: "iris-btn primary", href: "/chat" }, "Ouvrir le chat"))),

      /* stat tiles */
      h("div", { className: "iris-tiles" },
        Tile("Coût aujourd'hui", last ? fmtCost(last.cost) : "—",
          avg7 != null ? "moyenne 7 j : " + fmtCost(avg7) + " / jour" : "via /api/analytics/usage"),
        Tile("Tokens · dernier jour", last ? fmtTokens(last.tokens) : "—",
          last && last.cache != null ? "taux de cache " + Math.round(last.cache) + " %" : " "),
        Tile("Sessions actives", active != null ? String(active) : "—",
          sessList.length ? sessList.length + " sessions récentes" : " "),
        Tile("Prochaine automatisation",
          nextJob ? (nextJob.name || "job") : (jobs.length ? jobs.length + " jobs" : "—"),
          nextJob ? (nextJob.schedule || "") : "aucun job planifié")),

      /* main + side columns */
      h("div", { className: "iris-cols" },
        h("div", { className: "iris-col-main" },

          Card("Automatisations · dernières exécutions", NavLink("/cron", "Cron"),
            jobs.length ? jobs.slice(0, 5).map(function (j, i) {
              var lastRun = j.last_run || j.lastRun;
              var ok = !(j.last_status === "error" || j.last_error);
              return h(React.Fragment, { key: i },
                Row(ok ? "good" : "crit", j.name || "job",
                  (j.schedule || "") + (j.deliver ? " → " + j.deliver : ""),
                  h("span", { className: "iris-badge " + (ok ? "good" : "crit") },
                    lastRun ? timeAgo(lastRun) || String(lastRun).slice(11, 16) : (j.state || ""))));
            }) : h("div", { className: "iris-empty" }, "Aucun job cron configuré")),

          Card("Utilisation · 14 jours",
            h("span", { className: "iris-muted" },
              days.length ? "total " + fmtTokens(days.reduce(function (s, d) { return s + d.tokens; }, 0)) : ""),
            h(UsageChart, { days: days })),

          Card("Sessions récentes", NavLink("/sessions", "Toutes"),
            sessList.length ? sessList.slice(0, 6).map(function (s, i) {
              return h(React.Fragment, { key: i },
                Row("", s.name || s.title || s.preview || s.id || "session",
                  (s.model ? s.model + " · " : "") +
                  (firstNum(s.tokens, s.total_tokens) != null ? fmtTokens(firstNum(s.tokens, s.total_tokens)) + " tokens" : ""),
                  timeAgo(s.updated_at || s.last_activity || s.timestamp)));
            }) : h("div", { className: "iris-empty" }, "Aucune session récente"))),

        h("div", { className: "iris-col-side" },

          Card("À traiter",
            h("span", { className: "iris-badge " + (alerts.length ? "warn" : "good") },
              String(alerts.length)),
            alerts.length ? alerts : h("div", { className: "iris-empty" }, "Rien à traiter ✓")),

          Card("Mémoire & skills", NavLink("/config", "Gérer"),
            [
              Meter("Mémoire", memTotal != null ? Math.min(100, memTotal / 2e9 * 100) : 0,
                fmtBytes(memTotal)),
              Meter("Skills", skillList.length ? enabledSkills / skillList.length * 100 : 0,
                skillList.length ? enabledSkills + "/" + skillList.length : "—"),
              h("div", { className: "iris-note", key: "n" },
                memory && (memory.provider || memory.active) ?
                  "Provider : " + (memory.provider || memory.active) : " ")
            ]),

          Card("Canaux & système", null,
            [
              Row(gwOnline ? "good" : "crit", "Passerelle",
                null, Dot(gwOnline ? "ok" : "err")),
              plats.filter(function (p) { return p.enabled || p.configured; }).slice(0, 5)
                .map(function (p, i) {
                  var connected = p.connected === true || p.status === "connected";
                  return h(React.Fragment, { key: i },
                    Row("", p.label || p.id || "canal", null,
                      Dot(connected ? "ok" : (p.enabled ? "err" : "off"))));
                }),
              h("hr", { className: "iris-sep", key: "s" }),
              Meter("CPU", cpu, cpu != null ? Math.round(cpu) + " %" : "—"),
              Meter("Mémoire", mem, mem != null ? Math.round(mem) + " %" : "—"),
              Meter("Disque", disk, disk != null ? Math.round(disk) + " %" : "—")
            ]))));
  }

  /* ---------- mobile navigation bar (overlay slot) ---------- */
  function MobileNav() {
    var links = [
      ["/", "Accueil"], ["/chat", "Chat"], ["/sessions", "Sessions"],
      ["/cron", "Cron"], ["/config", "Config"]
    ];
    var path = (typeof location !== "undefined" ? location.pathname : "/");
    return h("nav", { className: "iris-bottombar" },
      links.map(function (l, i) {
        return h("a", {
          key: i, href: l[0],
          className: "iris-bb-item" + (path === l[0] ? " active" : "")
        }, l[1]);
      }));
  }

  REG.register("iris", HomePage);
  REG.registerSlot("iris", "overlay", MobileNav);
})();
