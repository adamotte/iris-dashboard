/* =============================================================
   Iris — hermes-agent dashboard plugin (full redesign)
   - Overrides the home page and provides redesigned pages for the
     whole dashboard (each route is claimed by a small companion
     plugin that registers a page exported on window.__IRIS_PAGES__).
   - Grouped sidebar (desktop) + bottom bar (mobile) via the overlay
     slot; client-side navigation through pushState + popstate.
   - Read endpoints degrade to "—"; actions call the real API routes
     verified against hermes-agent v0.20.
   - i18n: built-in EN/FR catalog following the dashboard locale.
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

  /* ================= i18n ================= */
  var CATALOG = {
    en: {
      overview: "Overview", gatewayOnline: "Gateway online", gatewayDown: "Gateway stopped",
      activeSessionsSuffix: "active session(s)", logs: "Logs", openChat: "Open chat",
      costToday: "Cost today", avg7d: "7-day average: {0} / day", viaAnalytics: "via /api/analytics/usage",
      tokensLastDay: "Tokens · last day", cacheRate: "cache rate {0} %", activeSessions: "Active sessions",
      recentSessionsCount: "{0} recent sessions", nextAutomation: "Next automation", jobs: "jobs",
      noScheduledJob: "no scheduled job", automationsLastRuns: "Automations · latest runs", cron: "Cron",
      noCronJob: "No cron job configured", usage14d: "Usage · 14 days", total: "total",
      recentSessions: "Recent sessions", all: "All", noRecentSession: "No recent session",
      needsAttention: "Needs attention", nothingPending: "Nothing pending ✓", pairing: "Pairing",
      pairingCode: "code", handle: "Handle", channelDisconnected: "{0}: disconnected",
      channelEnabledNotConnected: "Channel enabled but not connected", check: "Check",
      memorySkills: "Memory & skills", manage: "Manage", memory: "Memory", skills: "Skills",
      provider: "Provider", channelsSystem: "Channels & system", gateway: "Gateway", cpu: "CPU",
      ram: "Memory", disk: "Disk", tokensUnit: "tokens", chartAria: "Tokens per day",
      usageUnavailable: "Usage data unavailable", cost: "Cost", tokens: "Tokens",
      navHome: "Home", navChat: "Chat", navSessions: "Sessions", navCron: "Cron", navConfig: "Config",
      /* nav */
      navAnalytics: "Analytics", navWebhooks: "Webhooks", navSkills: "Skills", navMcp: "MCP",
      navToolsets: "Toolsets", navModels: "Models", navChannels: "Channels", navPairing: "Pairing",
      navProfiles: "Profiles", navKeys: "API Keys", navFiles: "Files", navSystem: "System",
      navDocs: "Documentation", grpAutomation: "Automation", grpCapabilities: "Capabilities",
      grpConnectivity: "Connectivity", grpAdmin: "Administration",
      /* common */
      search: "Search…", refresh: "Refresh", enabled: "enabled", disabled: "disabled",
      actions: "Actions", name: "Name", description: "Description", status: "Status",
      confirmDelete: "Delete “{0}”?", error: "Error: {0}", save: "Save", saved: "Saved ✓",
      /* sessions */
      sessionsTitle: "Sessions", sessionsDesc: "Full-text search across every conversation",
      chats: "Chats", automation: "Automation", archived: "Archived", messages: "Messages",
      model: "Model", lastActivity: "Last activity", source: "Source", export: "Export",
      deleteS: "Delete", pruneOld: "Prune > 90 d", confirmPrune: "Delete ended sessions older than 90 days?",
      noSessions: "No sessions yet", searchResults: "Search results",
      /* analytics */
      analyticsTitle: "Analytics", analyticsDesc: "Usage, cost and cache computed from session history",
      period: "{0} d", cacheTitle: "Cache rate", sessionsCount: "Sessions", perModel: "By model",
      estCost: "Est. cost", dailyDetail: "Daily detail", date: "Date", cache: "Cache", noUsage: "No usage recorded yet",
      /* cron */
      cronTitle: "Scheduled automations", cronDesc: "Jobs run even while you sleep — results land on your channels",
      newJob: "New job", job: "Job", schedule: "Schedule", target: "Target", lastRun: "Last run",
      nextRun: "Next run", runNow: "Run now", pause: "Pause", resume: "Resume", paused: "paused",
      active: "active", promptLbl: "Prompt", nameLbl: "Name", cronExpr: "Cron expression (e.g. 0 7 * * *)",
      deliverLbl: "Delivery target", create: "Create", cancel: "Cancel",
      /* webhooks */
      whTitle: "Webhooks", whDesc: "Trigger the agent from outside — CI, monitoring, forms, home automation",
      whNew: "New webhook", whEvents: "Filter", whEnableSys: "Enable the webhook system", whUrl: "URL",
      whSecretNote: "The signing secret is shown once at creation.",
      /* skills */
      skillsTitle: "Skills", skillsDesc: "{0} installed · {1} enabled · the curator consolidates nightly",
      curator: "Skill curator", curatorRun: "Run now", categoryAll: "All", usageN: "{0} uses",
      /* mcp */
      mcpTitle: "MCP servers", mcpDesc: "Extend Iris with Model Context Protocol servers — no YAML editing",
      mcpAdd: "Add server", mcpTest: "Test", mcpCatalog: "Nous catalog — one-click install",
      mcpInstall: "Install", mcpNone: "No MCP server configured", verified: "verified",
      /* toolsets */
      tsTitle: "Toolsets", tsDesc: "Built-in tool groups — enable only what the agent needs",
      toolsN: "{0} tools", notConfigured: "missing key",
      /* channels */
      chTitle: "Messaging channels", chDesc: "One Iris, all your channels — same memory and context everywhere",
      chRestart: "Restart gateway", chStart: "Start gateway", chStop: "Stop gateway", chTest: "Test",
      connected: "connected", configured: "configured", notSetUp: "not set up",
      /* pairing */
      prTitle: "Pairing", prDesc: "Control who can talk to Iris on each platform",
      prPending: "Pending requests", prApproved: "Approved users", approve: "Approve", reject: "Reject",
      revoke: "Revoke", clearPending: "Clear pending", noPending: "No pending request",
      /* profiles */
      pfTitle: "Profiles", pfDesc: "Isolated Iris instances — dedicated config, skills and sessions",
      pfDefault: "default", pfSkills: "{0} skills",
      /* config */
      cfgTitle: "Configuration", cfgDesc: "Edit config.yaml without touching YAML",
      cfgModel: "Default model", cfgMaxLive: "Max live sessions", cfgMaxTurns: "Max agent turns",
      cfgRawView: "Raw view (read-only)", cfgSaveNote: "Saves via PUT /api/config",
      /* keys */
      keysTitle: "API Keys", keysDesc: "Manage the .env file — values never leave your server",
      keySet: "set", keyUnset: "unset", keyEdit: "Edit", keyDefine: "Set", keyDelete: "Delete",
      keyShowAdvanced: "Show advanced keys", keyPrompt: "Value for {0}:",
      /* logs */
      logsTitle: "Logs", logsDesc: "Agent, gateway and errors — live tail",
      liveTail: "Live tail", lines: "lines",
      /* system */
      sysTitle: "System", sysDesc: "Host, gateway, memory and operations",
      host: "Host", uptime: "up {0}", checkpoints: "Checkpoints", pruneCp: "Prune checkpoints",
      opsTitle: "Operations", doctor: "Doctor", audit: "Security audit", backup: "Backup",
      dump: "Support dump", memReset: "Reset memory", confirmReset: "Reset the built-in memory store?",
      launched: "{0} launched — check the logs", curatorPause: "Pause", curatorResume: "Resume"
    },
    fr: {
      overview: "Vue d'ensemble", gatewayOnline: "Passerelle en ligne", gatewayDown: "Passerelle arrêtée",
      activeSessionsSuffix: "session(s) active(s)", logs: "Logs", openChat: "Ouvrir le chat",
      costToday: "Coût aujourd'hui", avg7d: "moyenne 7 j : {0} / jour", viaAnalytics: "via /api/analytics/usage",
      tokensLastDay: "Tokens · dernier jour", cacheRate: "taux de cache {0} %", activeSessions: "Sessions actives",
      recentSessionsCount: "{0} sessions récentes", nextAutomation: "Prochaine automatisation", jobs: "jobs",
      noScheduledJob: "aucun job planifié", automationsLastRuns: "Automatisations · dernières exécutions", cron: "Cron",
      noCronJob: "Aucun job cron configuré", usage14d: "Utilisation · 14 jours", total: "total",
      recentSessions: "Sessions récentes", all: "Toutes", noRecentSession: "Aucune session récente",
      needsAttention: "À traiter", nothingPending: "Rien à traiter ✓", pairing: "Appairage",
      pairingCode: "code", handle: "Traiter", channelDisconnected: "{0} : déconnecté",
      channelEnabledNotConnected: "Canal activé mais non connecté", check: "Vérifier",
      memorySkills: "Mémoire & skills", manage: "Gérer", memory: "Mémoire", skills: "Skills",
      provider: "Provider", channelsSystem: "Canaux & système", gateway: "Passerelle", cpu: "CPU",
      ram: "Mémoire", disk: "Disque", tokensUnit: "tokens", chartAria: "Tokens par jour",
      usageUnavailable: "Données d'utilisation indisponibles", cost: "Coût", tokens: "Tokens",
      navHome: "Accueil", navChat: "Chat", navSessions: "Sessions", navCron: "Cron", navConfig: "Configuration",
      navAnalytics: "Analytics", navWebhooks: "Webhooks", navSkills: "Skills", navMcp: "MCP",
      navToolsets: "Toolsets", navModels: "Modèles", navChannels: "Canaux", navPairing: "Appairage",
      navProfiles: "Profils", navKeys: "Clés API", navFiles: "Fichiers", navSystem: "Système",
      navDocs: "Documentation", grpAutomation: "Automatisation", grpCapabilities: "Capacités",
      grpConnectivity: "Connectivité", grpAdmin: "Administration",
      search: "Rechercher…", refresh: "Actualiser", enabled: "activé", disabled: "désactivé",
      actions: "Actions", name: "Nom", description: "Description", status: "État",
      confirmDelete: "Supprimer « {0} » ?", error: "Erreur : {0}", save: "Enregistrer", saved: "Enregistré ✓",
      sessionsTitle: "Sessions", sessionsDesc: "Recherche plein-texte dans tout l'historique",
      chats: "Chats", automation: "Automations", archived: "Archivées", messages: "Messages",
      model: "Modèle", lastActivity: "Dernière activité", source: "Source", export: "Exporter",
      deleteS: "Supprimer", pruneOld: "Purger > 90 j", confirmPrune: "Supprimer les sessions terminées de plus de 90 jours ?",
      noSessions: "Aucune session pour l'instant", searchResults: "Résultats de recherche",
      analyticsTitle: "Analytics", analyticsDesc: "Consommation, coûts et cache calculés depuis l'historique",
      period: "{0} j", cacheTitle: "Taux de cache", sessionsCount: "Sessions", perModel: "Par modèle",
      estCost: "Coût estimé", dailyDetail: "Détail journalier", date: "Date", cache: "Cache", noUsage: "Aucune utilisation enregistrée",
      cronTitle: "Automatisations planifiées", cronDesc: "Les jobs tournent même pendant votre sommeil — résultats sur vos canaux",
      newJob: "Nouveau job", job: "Job", schedule: "Planification", target: "Cible", lastRun: "Dernière",
      nextRun: "Prochaine", runNow: "Exécuter", pause: "Pause", resume: "Reprendre", paused: "en pause",
      active: "actif", promptLbl: "Prompt", nameLbl: "Nom", cronExpr: "Expression cron (ex. 0 7 * * *)",
      deliverLbl: "Cible de livraison", create: "Créer", cancel: "Annuler",
      whTitle: "Webhooks", whDesc: "Déclenchez l'agent depuis l'extérieur — CI, monitoring, formulaires, domotique",
      whNew: "Nouveau webhook", whEvents: "Filtre", whEnableSys: "Activer le système de webhooks", whUrl: "URL",
      whSecretNote: "Le secret de signature n'est montré qu'à la création.",
      skillsTitle: "Skills", skillsDesc: "{0} installées · {1} activées · le curateur consolide chaque nuit",
      curator: "Curateur de skills", curatorRun: "Exécuter", categoryAll: "Toutes", usageN: "{0} utilisations",
      mcpTitle: "Serveurs MCP", mcpDesc: "Étendez Iris avec des serveurs Model Context Protocol — sans YAML",
      mcpAdd: "Ajouter un serveur", mcpTest: "Tester", mcpCatalog: "Catalogue Nous — installation en un clic",
      mcpInstall: "Installer", mcpNone: "Aucun serveur MCP configuré", verified: "vérifié",
      tsTitle: "Toolsets", tsDesc: "Groupes d'outils intégrés — activez uniquement le nécessaire",
      toolsN: "{0} outils", notConfigured: "clé manquante",
      chTitle: "Canaux de messagerie", chDesc: "Une seule Iris, tous vos canaux — même mémoire, même contexte",
      chRestart: "Redémarrer la passerelle", chStart: "Démarrer la passerelle", chStop: "Arrêter la passerelle", chTest: "Tester",
      connected: "connecté", configured: "configuré", notSetUp: "non configuré",
      prTitle: "Appairage", prDesc: "Contrôlez qui peut parler à Iris sur chaque plateforme",
      prPending: "Demandes en attente", prApproved: "Utilisateurs approuvés", approve: "Approuver", reject: "Refuser",
      revoke: "Révoquer", clearPending: "Vider les demandes", noPending: "Aucune demande en attente",
      pfTitle: "Profils", pfDesc: "Instances isolées d'Iris — config, skills et sessions dédiées",
      pfDefault: "par défaut", pfSkills: "{0} skills",
      cfgTitle: "Configuration", cfgDesc: "Éditez config.yaml sans toucher au YAML",
      cfgModel: "Modèle par défaut", cfgMaxLive: "Sessions simultanées max", cfgMaxTurns: "Tours agent max",
      cfgRawView: "Vue brute (lecture seule)", cfgSaveNote: "Enregistre via PUT /api/config",
      keysTitle: "Clés API", keysDesc: "Gérez le fichier .env — les valeurs ne quittent jamais votre serveur",
      keySet: "définie", keyUnset: "absente", keyEdit: "Modifier", keyDefine: "Définir", keyDelete: "Supprimer",
      keyShowAdvanced: "Afficher les clés avancées", keyPrompt: "Valeur pour {0} :",
      logsTitle: "Logs", logsDesc: "Agent, passerelle et erreurs — suivi en direct",
      liveTail: "Suivi live", lines: "lignes",
      sysTitle: "Système", sysDesc: "Hôte, passerelle, mémoire et opérations",
      host: "Hôte", uptime: "en ligne {0}", checkpoints: "Checkpoints", pruneCp: "Élaguer les checkpoints",
      opsTitle: "Opérations", doctor: "Doctor", audit: "Audit sécurité", backup: "Sauvegarde",
      dump: "Dump support", memReset: "Réinitialiser la mémoire", confirmReset: "Réinitialiser le store mémoire intégré ?",
      launched: "{0} lancé — voir les logs", curatorPause: "Pause", curatorResume: "Reprendre"
    }
  };

  function useLocale() {
    var fromHook = null;
    try {
      if (typeof SDK.useI18n === "function") {
        var i18n = SDK.useI18n();
        if (i18n) fromHook = i18n.locale || i18n.lang || i18n.language || (typeof i18n === "string" ? i18n : null);
      }
    } catch (e) { /* hook unavailable outside provider */ }
    var raw = fromHook || (typeof navigator !== "undefined" && navigator.language) || "en";
    return String(raw).toLowerCase().indexOf("fr") === 0 ? "fr" : "en";
  }
  function makeT(locale) {
    var table = CATALOG[locale] || CATALOG.en;
    return function (key) {
      var s = table[key] || CATALOG.en[key] || key;
      for (var i = 1; i < arguments.length; i++) s = s.replace("{" + (i - 1) + "}", arguments[i]);
      return s;
    };
  }

  /* ================= utils ================= */
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
  function asList(data, keys) {
    if (Array.isArray(data)) return data;
    if (!data || typeof data !== "object") return [];
    for (var i = 0; i < keys.length; i++) if (Array.isArray(data[keys[i]])) return data[keys[i]];
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
  function firstStr() {
    for (var i = 0; i < arguments.length; i++) {
      var v = arguments[i];
      if (typeof v === "string" && v) return v;
    }
    return null;
  }
  function fmtTokens(n) {
    if (n == null) return "—";
    if (n >= 1e6) return (n / 1e6).toFixed(2) + " M";
    if (n >= 1e3) return Math.round(n / 1e3) + " K";
    return String(n);
  }
  function fmtCost(n) { return n == null ? "—" : Number(n).toFixed(2) + " $"; }
  // Never hand a raw API value to React as a child: some fields are objects
  // (e.g. cron "schedule" is {kind, expr, display} — React error #31).
  function txt(v) {
    if (v == null) return "";
    if (typeof v === "object") return String(v.display || v.expr || v.label || v.name || "");
    return String(v);
  }
  function schedStr(j) {
    return txt(j.schedule_display) || txt(j.schedule);
  }
  function lastRunOf(j) { return j.last_run_at || j.last_run || j.lastRun || null; }
  function nextRunOf(j) { return j.next_run_at || j.next_run || j.nextRun || j.next || null; }
  function isPausedJob(j) { return !!(j.paused || j.paused_at || j.state === "paused" || j.enabled === false); }
  function fmtBytes(n, locale) {
    if (n == null) return "—";
    var u = locale === "fr" ? ["o", "Ko", "Mo", "Go"] : ["B", "KB", "MB", "GB"];
    if (n >= 1e9) return (n / 1e9).toFixed(1) + " " + u[3];
    if (n >= 1e6) return Math.round(n / 1e6) + " " + u[2];
    if (n >= 1e3) return Math.round(n / 1e3) + " " + u[1];
    return n + " " + u[0];
  }

  function useJSON(path, refreshMs, bump) {
    var st = useState(null); var data = st[0], setData = st[1];
    useEffect(function () {
      var alive = true;
      function load() {
        SDK.fetchJSON(path).then(function (d) { if (alive) setData(d); })
          .catch(function () { /* silent */ });
      }
      load();
      var t = refreshMs ? setInterval(load, refreshMs) : null;
      return function () { alive = false; if (t) clearInterval(t); };
    }, [path, bump || 0]);
    return data;
  }
  // Action helper: POST/PUT/DELETE with auth via SDK.fetchJSON, alert on error.
  function act(t, path, init, done) {
    SDK.fetchJSON(path, init).then(function (r) { if (done) done(r); })
      .catch(function (e) {
        try { alert(t("error", (e && e.message) || e)); } catch (x) { /* noop */ }
        if (done) done(null);
      });
  }
  function jinit(method, body) {
    var init = { method: method };
    if (body !== undefined) {
      init.headers = { "Content-Type": "application/json" };
      init.body = JSON.stringify(body);
    }
    return init;
  }

  /* ================= navigation ================= */
  function navTo(href) {
    try {
      history.pushState({}, "", href);
      dispatchEvent(new PopStateEvent("popstate"));
    } catch (e) { location.assign(href); }
  }
  function usePath() {
    var st = useState(typeof location !== "undefined" ? location.pathname : "/");
    useEffect(function () {
      function on() { st[1](location.pathname); }
      addEventListener("popstate", on);
      return function () { removeEventListener("popstate", on); };
    }, []);
    return st[0];
  }

  /* ================= icons (ported from the mockup) ================= */
  function P(d) { return h("path", { key: d.slice(0, 8), d: d }); }
  function C(cx, cy, r) { return h("circle", { key: "c" + cx + cy, cx: cx, cy: cy, r: r }); }
  function RC(x, y, w, ht, rx) { return h("rect", { key: "r" + x + y, x: x, y: y, width: w, height: ht, rx: rx }); }
  var ICONS = {
    grid: [RC(3, 3, 7, 9, 1.5), RC(14, 3, 7, 5, 1.5), RC(14, 12, 7, 9, 1.5), RC(3, 16, 7, 5, 1.5)],
    chat: [P("M21 11.5a8.38 8.38 0 0 1-9 8.4 8.5 8.5 0 0 1-3.4-.7L3 21l1.8-4.6a8.38 8.38 0 0 1-1.3-4.4 8.5 8.5 0 0 1 8.5-8.5 8.38 8.38 0 0 1 9 8Z")],
    hist: [P("M3 12a9 9 0 1 0 3-6.7L3 8"), P("M3 3v5h5"), P("M12 7v5l3 3")],
    chart: [P("M3 3v18h18"), P("M8 17v-6"), P("M13 17V7"), P("M18 17v-9")],
    clock: [C(12, 12, 9), P("M12 7v5l3 2")],
    hook: [P("M13 3l-3 7h4l-3 7"), C(17.5, 17.5, 3.5), C(6.5, 17.5, 3.5)],
    spark: [P("M12 3l1.9 5.8L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.2L12 3Z")],
    plug: [P("M9 7V3"), P("M15 7V3"), P("M6 7h12v4a6 6 0 0 1-12 0V7Z"), P("M12 17v4")],
    tool: [P("M14.7 6.3a4.5 4.5 0 0 0-6 6L3 18l3 3 5.7-5.7a4.5 4.5 0 0 0 6-6L14 13l-3-3 3.7-3.7Z")],
    radio: [C(12, 12, 2.5), P("M7.8 16.2a6 6 0 0 1 0-8.4M16.2 7.8a6 6 0 0 1 0 8.4M4.9 19.1a10 10 0 0 1 0-14.2M19.1 4.9a10 10 0 0 1 0 14.2")],
    link: [P("M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"), P("M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7")],
    cog: [C(12, 12, 3), P("M19.4 15a1.6 1.6 0 0 0 .3 1.7l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.7-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.2a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.7.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.7 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.2a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.7.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.2a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.7-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.7v.1a1.6 1.6 0 0 0 1.5 1h.3a2 2 0 1 1 0 4h-.2a1.6 1.6 0 0 0-1.5 1Z")],
    key: [C(7.5, 15.5, 4.5), P("M10.7 12.3 21 2l-3 3 2 2-3 3-2-2-3.3 3.3")],
    users: [C(9, 8, 3.5), P("M2.5 20a6.5 6.5 0 0 1 13 0"), P("M16 4.6a3.5 3.5 0 0 1 0 6.8"), P("M17.5 14.4a6.5 6.5 0 0 1 4 5.6")],
    file: [P("M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7Z"), P("M14 2v5h5"), P("M9 13h6M9 17h6")],
    server: [RC(3, 4, 18, 7, 2), RC(3, 13, 18, 7, 2), P("M7 7.5h.01M7 16.5h.01")],
    term: [RC(3, 4, 18, 16, 2), P("m7 9 3 3-3 3M13 15h4")],
    msg: [P("m22 2-11 11"), P("M22 2 15 22l-4-9-9-4L22 2Z")],
    mail: [RC(3, 5, 18, 14, 2), P("m3 7 9 6 9-6")],
    coin: [C(12, 12, 9), P("M14.8 9.2A3.2 3.2 0 0 0 12 8c-1.8 0-3.2.9-3.2 2s1.1 1.7 3.2 2 3.2.9 3.2 2-1.4 2-3.2 2a3.2 3.2 0 0 1-2.8-1.2"), P("M12 6.5V8M12 16v1.5")],
    check: [P("m4 12.5 5.5 5.5L20 6.5")],
    x: [P("M6 6l12 12M18 6 6 18")],
    shield: [P("M12 2 4 5.5v5.6c0 5 3.4 8.5 8 10.4 4.6-1.9 8-5.4 8-10.4V5.5Z"), P("m8.5 12 2.5 2.5 4.5-5")],
    globe: [C(12, 12, 9), P("M3 12h18"), P("M12 3a14.5 14.5 0 0 1 0 18 14.5 14.5 0 0 1 0-18Z")],
    brain: [P("M12 4a3 3 0 0 0-3 3 3 3 0 0 0-3 3 3 3 0 0 0 .5 5.5A3 3 0 0 0 9 21h6a3 3 0 0 0 2.5-5.5A3 3 0 0 0 18 10a3 3 0 0 0-3-3 3 3 0 0 0-3-3Z"), P("M12 4v17")],
    alert: [P("M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"), P("M12 9v4M12 17h.01")]
  };
  function Icon(name, cls) {
    return h("svg", { className: "iris-ic " + (cls || ""), viewBox: "0 0 24 24", "aria-hidden": "true" },
      ICONS[name] || null);
  }
  // tile label with a leading icon, as in the mockup
  function TL(icon, text) {
    return h(React.Fragment, null, Icon(icon, "dim"), " ", text);
  }
  // 30px rounded icon square row (mockup .rowline + .r-ic)
  function IconRow(icon, kind, title, sub, meta) {
    return h("div", { className: "iris-row" },
      h("span", { className: "iris-icbox " + (kind || "") }, Icon(icon)),
      h("span", { className: "iris-row-body" }, h("b", null, title), sub ? h("small", null, sub) : null),
      meta != null ? h("span", { className: "iris-row-meta" }, meta) : null);
  }

  /* ================= UI kit ================= */
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
      h("div", { className: "iris-t-sub" }, sub || " "));
  }
  function Row(icon, title, sub, meta) {
    return h("div", { className: "iris-row" },
      h("span", { className: "iris-row-ic " + (icon || "") }),
      h("span", { className: "iris-row-body" }, h("b", null, title), sub ? h("small", null, sub) : null),
      meta != null ? h("span", { className: "iris-row-meta" }, meta) : null);
  }
  function Meter(label, pct, val) {
    return h("div", { className: "iris-meter" },
      h("span", { className: "iris-m-label" }, label),
      h("span", { className: "iris-m-bar" }, h("i", { style: { width: Math.max(0, Math.min(100, pct || 0)) + "%" } })),
      h("span", { className: "iris-m-val" }, val));
  }
  function Dot(state) { return h("span", { className: "iris-dot " + state }); }
  function Badge(txt, kind) { return h("span", { className: "iris-badge " + (kind || "neutral") }, txt); }
  function Btn(label, onClick, kind, disabled) {
    return h("button", { className: "iris-btn " + (kind || ""), onClick: onClick, disabled: !!disabled }, label);
  }
  function LinkTo(href, label) {
    return h("a", {
      className: "iris-link", href: href,
      onClick: function (e) { e.preventDefault(); navTo(href); }
    }, label + " →");
  }
  function Switch(on, onToggle) {
    return h("button", { className: "iris-switch" + (on ? " on" : ""), onClick: onToggle });
  }
  function PageHead(title, desc, actions) {
    return h("div", { className: "iris-page-head" },
      h("div", null, h("h2", null, title), desc ? h("p", null, desc) : null),
      actions ? h("div", { className: "iris-actions" }, actions) : null);
  }
  function Chips(options, value, onChange) {
    return h("div", { className: "iris-chips" }, options.map(function (o, i) {
      return h("button", {
        key: i, className: "iris-chip" + (o.v === value ? " on" : ""),
        onClick: function () { onChange(o.v); }
      }, o.l);
    }));
  }
  function Empty(msg) { return h("div", { className: "iris-empty" }, msg); }
  function Table(cols, rows) {
    return h("div", { className: "iris-card iris-table-card", style: { overflowX: "auto" } },
      h("table", { className: "iris-table" },
        h("thead", null, h("tr", null, cols.map(function (c, i) {
          return h("th", { key: i, className: (c.r ? "r " : "") + (c.m ? "hide-m" : "") }, c.l);
        }))),
        h("tbody", null, rows)));
  }

  /* ================= chart ================= */
  function BarChart(props) {
    var days = props.days || [], t = props.t;
    var hv = useState(-1); var hover = hv[0], setHover = hv[1];
    if (!days.length) return Empty(t("usageUnavailable"));
    var W = 640, H = 190, padL = 42, padR = 6, padT = 12, padB = 22;
    var max = Math.max.apply(null, days.map(function (d) { return d.tokens; })) * 1.15 || 1;
    var plotW = W - padL - padR, plotH = H - padT - padB;
    var slot = plotW / days.length, bw = Math.min(30, slot * 0.58);
    var kids = [];
    [0, 0.5, 1].forEach(function (f, gi) {
      var y = padT + plotH - f * plotH;
      kids.push(h("line", { key: "g" + gi, x1: padL, x2: W - padR, y1: y, y2: y, className: "iris-grid" }));
      kids.push(h("text", { key: "t" + gi, x: padL - 8, y: y + 3.5, textAnchor: "end", className: "iris-axis" },
        fmtTokens(Math.round(max * f))));
    });
    days.forEach(function (d, i) {
      var bh = Math.max(4, (d.tokens / max) * plotH);
      var x = padL + i * slot + (slot - bw) / 2, y = padT + plotH - bh;
      kids.push(h("rect", {
        key: "b" + i, x: x, y: y, width: bw, height: bh, rx: 3,
        className: "iris-bar" + (hover === i ? " hover" : ""),
        onMouseEnter: function () { setHover(i); }, onMouseLeave: function () { setHover(-1); }
      }));
      if (i % 2 === 1) kids.push(h("text", { key: "x" + i, x: x + bw / 2, y: H - 6, textAnchor: "middle", className: "iris-axis" },
        String(d.date).slice(5)));
    });
    var tip = hover >= 0 ? h("div", { className: "iris-tt" },
      h("b", null, days[hover].date),
      h("div", null, t("tokens") + " : " + fmtTokens(days[hover].tokens)),
      days[hover].cost != null ? h("div", null, t("cost") + " : " + fmtCost(days[hover].cost)) : null) : null;
    return h("div", { className: "iris-chart-wrap" },
      h("svg", { viewBox: "0 0 " + W + " " + H, className: "iris-chart", role: "img", "aria-label": t("chartAria") }, kids), tip);
  }

  function normDaily(usage) {
    var days = asList(usage, ["daily", "days", "usage", "chart"]);
    return days.map(function (d) {
      var tokens = firstNum(d.total_tokens, d.tokens,
        (firstNum(d.input_tokens, d.input) || 0) + (firstNum(d.output_tokens, d.output) || 0) || undefined);
      return { date: d.date || d.day || "", tokens: tokens, cost: firstNum(d.cost, d.estimated_cost), cache: firstNum(d.cache_rate, d.cache) };
    }).filter(function (d) { return d.tokens != null; });
  }

  /* ================= HOME ================= */
  function HomePage() {
    var locale = useLocale(); var t = makeT(locale);
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
    var active = firstNum(status && status.active_sessions, status && status.activeSessions);
    var jobs = asList(cron, ["jobs", "items"]);
    var pending = asList(pairing, ["pending", "requests"]);
    var plats = asList(platforms, ["platforms", "items"]);
    var skillList = asList(skills, ["skills", "items"]);
    var enabledSkills = skillList.filter(function (s) { return s.enabled !== false; }).length;
    var memFiles = memory ? asList(memory, ["files", "sizes", "stores"]) : [];
    var memTotal = memFiles.length ? memFiles.reduce(function (s, f) { return s + (firstNum(f.size, f.bytes) || 0); }, 0) || null : null;
    var cpu = sysStats && firstNum(sysStats.cpu_percent, sysStats.cpu && sysStats.cpu.percent);
    var mem = sysStats && firstNum(sysStats.memory_percent, sysStats.memory && sysStats.memory.percent);
    var disk = sysStats && firstNum(sysStats.disk_percent, sysStats.disk && sysStats.disk.percent);
    var gwOnline = !!(status && (status.gateway === "running" || status.gateway_running || (status.gateway && status.gateway.running)));

    var nextJob = null;
    jobs.forEach(function (j) {
      var nr = nextRunOf(j);
      if (!nr || isPausedJob(j)) return;
      if (!nextJob || nr < nextRunOf(nextJob)) nextJob = j;
    });

    var alerts = [];
    pending.forEach(function (p) {
      alerts.push(IconRow("link", "warn-i", t("pairing") + " " + (p.platform || ""),
        (p.user || p.username || p.code || "") + " · " + t("pairingCode") + " " + (p.code || "?"),
        LinkTo("/pairing", t("handle"))));
    });
    plats.forEach(function (p) {
      var enabled = p.enabled === true;
      var connected = p.connected === true || p.status === "connected" || p.state === "connected";
      if (enabled && p.configured !== false && !connected) {
        alerts.push(IconRow("radio", "warn-i", t("channelDisconnected", p.name || p.label || p.id || "?"),
          t("channelEnabledNotConnected"), LinkTo("/channels", t("check"))));
      }
    });

    return h("div", { className: "iris-home" },
      PageHead(t("overview"),
        (gwOnline ? t("gatewayOnline") : t("gatewayDown")) +
        (active != null ? " · " + active + " " + t("activeSessionsSuffix") : "") +
        (status && status.version ? " · v" + status.version : ""),
        [h("a", { key: "l", className: "iris-btn", href: "/logs", onClick: function (e) { e.preventDefault(); navTo("/logs"); } }, Icon("file", "sm"), t("logs")),
         h("a", { key: "c", className: "iris-btn primary", href: "/chat", onClick: function (e) { e.preventDefault(); navTo("/chat"); } }, Icon("chat", "sm"), t("openChat"))]),

      h("div", { className: "iris-tiles" },
        Tile(TL("coin", t("costToday")), last ? fmtCost(last.cost) : "—",
          avg7 != null ? t("avg7d", fmtCost(avg7)) : t("viaAnalytics")),
        Tile(TL("chart", t("tokensLastDay")), last ? fmtTokens(last.tokens) : "—",
          last && last.cache != null ? t("cacheRate", Math.round(last.cache)) : " "),
        Tile(TL("hist", t("activeSessions")), active != null ? String(active) : "—",
          sessList.length ? t("recentSessionsCount", sessList.length) : " "),
        Tile(TL("clock", t("nextAutomation")), nextJob ? txt(nextJob.name) || "job" : (jobs.length ? txt(jobs[0].name) || jobs.length + " " + t("jobs") : "—"),
          nextJob ? schedStr(nextJob) : (jobs.length ? schedStr(jobs[0]) : t("noScheduledJob")))),

      h("div", { className: "iris-cols" },
        h("div", { className: "iris-col-main" },
          Card(t("automationsLastRuns"), LinkTo("/cron", t("cron")),
            jobs.length ? jobs.slice(0, 5).map(function (j, i) {
              var lastRun = lastRunOf(j);
              var ok = !(j.last_status === "error" || j.last_error);
              return h(React.Fragment, { key: i },
                IconRow(ok ? "check" : "x", ok ? "good-i" : "crit-i", txt(j.name) || "job",
                  schedStr(j) + (j.deliver ? " → " + txt(j.deliver) : ""),
                  Badge(lastRun ? timeAgo(lastRun) || String(lastRun).slice(11, 16) : txt(j.state), ok ? "good" : "crit")));
            }) : Empty(t("noCronJob"))),
          Card(t("usage14d"),
            h("span", { className: "iris-muted" },
              days.length ? t("total") + " " + fmtTokens(days.reduce(function (s, d) { return s + d.tokens; }, 0)) : ""),
            h(BarChart, { days: days, t: t })),
          Card(t("recentSessions"), LinkTo("/sessions", t("all")),
            sessList.length ? sessList.slice(0, 6).map(function (s, i) {
              var src = String(s.source || "");
              var sic = /cron/.test(src) ? "clock" : /telegram|discord|slack|whatsapp|signal/.test(src) ? "msg" : /mail|email/.test(src) ? "mail" : "term";
              return h(React.Fragment, { key: i },
                IconRow(sic, "", txt(s.name || s.title || s.preview || s.id) || "session",
                  (s.model ? txt(s.model) + " · " : "") +
                  (firstNum(s.tokens, s.total_tokens) != null ? fmtTokens(firstNum(s.tokens, s.total_tokens)) + " " + t("tokensUnit") : ""),
                  timeAgo(s.updated_at || s.last_activity || s.timestamp)));
            }) : Empty(t("noRecentSession")))),
        h("div", { className: "iris-col-side" },
          Card(t("needsAttention"), Badge(String(alerts.length), alerts.length ? "warn" : "good"),
            alerts.length ? alerts : Empty(t("nothingPending"))),
          Card(t("memorySkills"), LinkTo("/system", t("manage")),
            [Meter(t("memory"), memTotal != null ? Math.min(100, memTotal / 2e9 * 100) : 0, fmtBytes(memTotal, locale)),
             Meter(t("skills"), skillList.length ? enabledSkills / skillList.length * 100 : 0,
               skillList.length ? enabledSkills + "/" + skillList.length : "—"),
             h("div", { className: "iris-note", key: "n" },
               memory && (memory.provider || memory.active) ? t("provider") + " : " + (memory.provider || memory.active) : " ")]),
          Card(t("channelsSystem"), null,
            [Row(gwOnline ? "good" : "crit", t("gateway"), null, Dot(gwOnline ? "ok" : "err")),
             plats.filter(function (p) { return p.enabled || p.configured; }).slice(0, 5).map(function (p, i) {
               var connected = p.connected === true || p.status === "connected" || p.state === "connected";
               return h(React.Fragment, { key: i },
                 Row("", p.name || p.label || p.id || "?", null, Dot(connected ? "ok" : (p.enabled ? "err" : "off"))));
             }),
             h("hr", { className: "iris-sep", key: "s" }),
             Meter(t("cpu"), cpu, cpu != null ? Math.round(cpu) + " %" : "—"),
             Meter(t("ram"), mem, mem != null ? Math.round(mem) + " %" : "—"),
             Meter(t("disk"), disk, disk != null ? Math.round(disk) + " %" : "—")]))));
  }

  /* ================= SESSIONS ================= */
  function SessionsPage() {
    var locale = useLocale(); var t = makeT(locale);
    var bp = useState(0); var bump = bp[0], setBump = bp[1];
    var qs = useState(""); var q = qs[0], setQ = qs[1];
    var tab = useState("all"); var flt = tab[0], setFlt = tab[1];
    var stats = useJSON("/api/sessions/stats", 30000, bump);
    var data = useJSON("/api/sessions?limit=50", 15000, bump);
    var res = useState(null); var results = res[0], setResults = res[1];

    var list = asList(data, ["sessions", "items"]);
    if (flt === "chats") list = list.filter(function (s) { return !/cron|webhook|tool|api/.test(String(s.source || "")); });
    if (flt === "auto") list = list.filter(function (s) { return /cron|webhook|tool|api/.test(String(s.source || "")); });

    function doSearch() {
      if (!q) { setResults(null); return; }
      SDK.fetchJSON("/api/sessions/search?q=" + encodeURIComponent(q))
        .then(function (d) { setResults(asList(d, ["results", "sessions", "matches"])); })
        .catch(function () { setResults([]); });
    }
    var s = stats || {};
    return h("div", { className: "iris-page" },
      PageHead(t("sessionsTitle"),
        (s.total != null ? s.total + " " + t("sessionsTitle").toLowerCase() + " · " : "") +
        (s.archived != null ? s.archived + " " + t("archived").toLowerCase() + " · " : "") + t("sessionsDesc"),
        Btn(t("pruneOld"), function () {
          if (confirm(t("confirmPrune"))) act(t, "/api/sessions/prune", jinit("POST", { days: 90 }), function () { setBump(bump + 1); });
        })),
      h("div", { className: "iris-tiles" },
        Tile(t("all"), s.total != null ? String(s.total) : "—", ""),
        Tile(t("activeSessions"), s.active_store != null ? String(s.active_store) : "—", ""),
        Tile(t("archived"), s.archived != null ? String(s.archived) : "—", ""),
        Tile(t("messages"), s.messages != null ? String(s.messages) : "—", "")),
      h("div", { className: "iris-filterbar" },
        h("input", {
          className: "iris-input", type: "search", placeholder: t("search"), value: q,
          onChange: function (e) { setQ(e.target.value); },
          onKeyDown: function (e) { if (e.key === "Enter") doSearch(); }
        }),
        Chips([{ v: "all", l: t("all") }, { v: "chats", l: t("chats") }, { v: "auto", l: t("automation") }], flt, setFlt),
        Btn(t("refresh"), function () { setBump(bump + 1); }, "sm")),
      results ? Card(t("searchResults") + " (" + results.length + ")", null,
        results.length ? results.slice(0, 20).map(function (r, i) {
          return h(React.Fragment, { key: i },
            Row("", r.name || r.title || r.id || "session", r.snippet || r.preview || "", null));
        }) : Empty(t("noSessions"))) : null,
      Table(
        [{ l: t("sessionsTitle") }, { l: t("source"), m: 1 }, { l: t("model"), m: 1 },
         { l: t("tokens"), r: 1 }, { l: t("messages"), r: 1, m: 1 }, { l: t("lastActivity"), r: 1 }, { l: "", r: 1 }],
        list.length ? list.map(function (sx, i) {
          var id = sx.id || sx.session_id || "";
          return h("tr", { key: i },
            h("td", null, h("b", null, txt(sx.name || sx.title) || id || "session"),
              h("br"), h("small", { className: "iris-muted" }, txt(sx.preview).slice(0, 80))),
            h("td", { className: "hide-m" }, txt(sx.source) || "—"),
            h("td", { className: "hide-m" }, sx.model ? h("span", { className: "iris-mono" }, txt(sx.model)) : "—"),
            h("td", { className: "r num" }, fmtTokens(firstNum(sx.tokens, sx.total_tokens))),
            h("td", { className: "r num hide-m" }, firstNum(sx.message_count, sx.messages) != null ? String(firstNum(sx.message_count, sx.messages)) : "—"),
            h("td", { className: "r num" }, timeAgo(sx.updated_at || sx.last_activity || sx.created_at) || "—"),
            h("td", { className: "r" },
              id ? h("a", { className: "iris-link", href: "/api/sessions/" + id + "/export" }, t("export")) : null, " ",
              id ? h("button", {
                className: "iris-link", style: { color: "var(--color-destructive)" },
                onClick: function () { if (confirm(t("confirmDelete", sx.name || id))) act(t, "/api/sessions/" + id, jinit("DELETE"), function () { setBump(bump + 1); }); }
              }, t("deleteS")) : null));
        }) : h("tr", null, h("td", { colSpan: 7 }, Empty(t("noSessions"))))));
  }

  /* ================= ANALYTICS ================= */
  function AnalyticsPage() {
    var locale = useLocale(); var t = makeT(locale);
    var pd = useState(7); var days = pd[0], setDays = pd[1];
    var usage = useJSON("/api/analytics/usage?days=" + days, 60000);
    var daily = useMemo(function () { return normDaily(usage); }, [usage]);
    var totals = (usage && usage.totals) || {};
    var models = asList(usage && usage.by_model, ["by_model"]);
    var totTok = firstNum(totals.total_tokens,
      (firstNum(totals.total_input) || 0) + (firstNum(totals.total_output) || 0) || undefined);
    return h("div", { className: "iris-page" },
      PageHead(t("analyticsTitle"), t("analyticsDesc"),
        Chips([{ v: 7, l: t("period", 7) }, { v: 30, l: t("period", 30) }, { v: 90, l: t("period", 90) }], days, setDays)),
      h("div", { className: "iris-tiles" },
        Tile(t("tokens"), fmtTokens(totTok), ""),
        Tile(t("cost"), fmtCost(firstNum(totals.total_estimated_cost, totals.total_actual_cost)), t("estCost")),
        Tile(t("cacheTitle"), totals.total_cache_read != null && totTok ? Math.round(totals.total_cache_read / totTok * 100) + " %" : "—", ""),
        Tile(t("sessionsCount"), totals.total_sessions != null ? String(totals.total_sessions) : "—", "")),
      Card(t("chartAria"), null, h(BarChart, { days: daily, t: t })),
      h("div", { className: "iris-grid-2" },
        Table([{ l: t("perModel") }, { l: t("tokens"), r: 1 }, { l: t("sessionsCount"), r: 1, m: 1 }, { l: t("cost"), r: 1 }],
          models.length ? models.map(function (m, i) {
            return h("tr", { key: i },
              h("td", null, h("span", { className: "iris-mono" }, m.model || m.name || "?")),
              h("td", { className: "r num" }, fmtTokens(firstNum(m.total_tokens, m.tokens))),
              h("td", { className: "r num hide-m" }, firstNum(m.sessions, m.session_count) != null ? String(firstNum(m.sessions, m.session_count)) : "—"),
              h("td", { className: "r num" }, fmtCost(firstNum(m.estimated_cost, m.cost))));
          }) : h("tr", null, h("td", { colSpan: 4 }, Empty(t("noUsage"))))),
        Table([{ l: t("dailyDetail") }, { l: t("tokens"), r: 1 }, { l: t("cache"), r: 1, m: 1 }, { l: t("cost"), r: 1 }],
          daily.length ? daily.slice(-10).reverse().map(function (d, i) {
            return h("tr", { key: i },
              h("td", { className: "num" }, d.date),
              h("td", { className: "r num" }, fmtTokens(d.tokens)),
              h("td", { className: "r num hide-m" }, d.cache != null ? Math.round(d.cache) + " %" : "—"),
              h("td", { className: "r num" }, fmtCost(d.cost)));
          }) : h("tr", null, h("td", { colSpan: 4 }, Empty(t("noUsage")))))));
  }

  /* ================= CRON ================= */
  function CronPage() {
    var locale = useLocale(); var t = makeT(locale);
    var bp = useState(0); var bump = bp[0], setBump = bp[1];
    var frm = useState(false); var showForm = frm[0], setShowForm = frm[1];
    var data = useJSON("/api/cron/jobs", 20000, bump);
    var jobs = asList(data, ["jobs", "items"]);
    var reload = function () { setBump(bump + 1); };

    function JobForm() {
      var n = useState(""); var p = useState(""); var s = useState("0 7 * * *"); var d = useState("local");
      return Card(t("newJob"), null, h("div", null,
        h("div", { className: "iris-field" }, h("label", null, t("nameLbl")),
          h("input", { className: "iris-input", value: n[0], onChange: function (e) { n[1](e.target.value); } })),
        h("div", { className: "iris-field" }, h("label", null, t("promptLbl")),
          h("input", { className: "iris-input", value: p[0], onChange: function (e) { p[1](e.target.value); } })),
        h("div", { className: "iris-field" }, h("label", null, t("cronExpr")),
          h("input", { className: "iris-input iris-mono", value: s[0], onChange: function (e) { s[1](e.target.value); } })),
        h("div", { className: "iris-field" }, h("label", null, t("deliverLbl")),
          h("input", { className: "iris-input", value: d[0], onChange: function (e) { d[1](e.target.value); } })),
        h("div", { className: "iris-actions" },
          Btn(t("create"), function () {
            act(t, "/api/cron/jobs", jinit("POST", { name: n[0], prompt: p[0], schedule: s[0], deliver: d[0] }),
              function () { setShowForm(false); reload(); });
          }, "primary"),
          Btn(t("cancel"), function () { setShowForm(false); }))));
    }

    return h("div", { className: "iris-page" },
      PageHead(t("cronTitle"), t("cronDesc"), Btn(t("newJob"), function () { setShowForm(!showForm); }, "primary")),
      showForm ? h(JobForm) : null,
      Table([{ l: t("job") }, { l: t("schedule"), m: 1 }, { l: t("target"), m: 1 }, { l: t("status") },
             { l: t("lastRun"), r: 1, m: 1 }, { l: t("nextRun"), r: 1 }, { l: t("actions"), r: 1 }],
        jobs.length ? jobs.map(function (j, i) {
          var id = j.id || j.job_id || j.name;
          var isPaused = isPausedJob(j);
          var lr = lastRunOf(j), nr = nextRunOf(j);
          return h("tr", { key: i },
            h("td", null, h("b", null, txt(j.name) || id), h("br"),
              h("small", { className: "iris-muted" }, txt(j.prompt).slice(0, 60))),
            h("td", { className: "hide-m" }, h("span", { className: "iris-mono" }, schedStr(j))),
            h("td", { className: "hide-m" }, txt(j.deliver || j.target) || "local"),
            h("td", null, Badge(isPaused ? t("paused") : t("active"), isPaused ? "neutral" : "good")),
            h("td", { className: "r num hide-m" }, lr ? (timeAgo(lr) || String(lr).slice(5, 16)) : "—"),
            h("td", { className: "r num" }, nr ? String(nr).slice(5, 16) : "—"),
            h("td", { className: "r" },
              h("button", { className: "iris-link", onClick: function () { act(t, "/api/cron/jobs/" + id + "/trigger", jinit("POST"), reload); } }, t("runNow")), " ",
              h("button", { className: "iris-link", onClick: function () { act(t, "/api/cron/jobs/" + id + (isPaused ? "/resume" : "/pause"), jinit("POST"), reload); } }, isPaused ? t("resume") : t("pause")), " ",
              h("button", {
                className: "iris-link", style: { color: "var(--color-destructive)" },
                onClick: function () { if (confirm(t("confirmDelete", j.name || id))) act(t, "/api/cron/jobs/" + id, jinit("DELETE"), reload); }
              }, t("deleteS"))));
        }) : h("tr", null, h("td", { colSpan: 7 }, Empty(t("noCronJob"))))));
  }

  /* ================= WEBHOOKS ================= */
  function WebhooksPage() {
    var locale = useLocale(); var t = makeT(locale);
    var bp = useState(0); var bump = bp[0], setBump = bp[1];
    var data = useJSON("/api/webhooks", 30000, bump);
    var subs = asList(data && data.subscriptions, ["subscriptions"]);
    var reload = function () { setBump(bump + 1); };
    return h("div", { className: "iris-page" },
      PageHead(t("whTitle"), t("whDesc"),
        Btn(t("whNew"), function () {
          var name = prompt(t("nameLbl")); if (!name) return;
          act(t, "/api/webhooks", jinit("POST", { name: name }), function (r) {
            if (r && (r.secret || r.signing_secret)) alert("Secret: " + (r.secret || r.signing_secret) + "\n" + t("whSecretNote"));
            reload();
          });
        }, "primary")),
      data ? Card(t("whEnableSys"), Switch(data.enabled === true, function () {
        act(t, "/api/webhooks/enable", jinit("POST", { enabled: !data.enabled }), reload);
      }), h("div", { className: "iris-note" }, t("whUrl") + " : " + (data.base_url || "—"))) : null,
      subs.length ? subs.map(function (w, i) {
        var enabled = w.enabled !== false;
        return Card.call(null, w.name || "webhook",
          h("span", { style: { display: "flex", gap: "8px", alignItems: "center" } },
            Badge(enabled ? t("enabled") : t("disabled"), enabled ? "good" : "neutral"),
            Switch(enabled, function () { act(t, "/api/webhooks/" + (w.name) + "/enabled", jinit("PUT", { enabled: !enabled }), reload); }),
            h("button", {
              className: "iris-link", style: { color: "var(--color-destructive)" },
              onClick: function () { if (confirm(t("confirmDelete", w.name))) act(t, "/api/webhooks/" + w.name, jinit("DELETE"), reload); }
            }, t("deleteS"))),
          h("div", null,
            h("div", { className: "iris-muted" }, txt(w.description)),
            h("div", { className: "iris-note iris-mono" }, txt(data && data.base_url) + txt(w.path || ("/hooks/" + (w.name || "")))),
            h("div", { className: "iris-note" }, t("whEvents") + " : " + (txt(w.event || w.filter) || "*") + " · " + t("target") + " : " + (txt(w.deliver || w.target) || "local"))));
      }) : Card(null, null, Empty(t("mcpNone").replace("MCP", "webhook"))));
  }

  /* ================= SKILLS ================= */
  function SkillsPage() {
    var locale = useLocale(); var t = makeT(locale);
    var bp = useState(0); var bump = bp[0], setBump = bp[1];
    var qs = useState(""); var q = qs[0], setQ = qs[1];
    var cs = useState("all"); var cat = cs[0], setCat = cs[1];
    var data = useJSON("/api/skills", 60000, bump);
    var curator = useJSON("/api/curator", 60000, bump);
    var reload = function () { setBump(bump + 1); };
    var skills = asList(data, ["skills", "items"]);
    var cats = {};
    skills.forEach(function (s) { if (s.category) cats[s.category] = 1; });
    var enabledCount = skills.filter(function (s) { return s.enabled !== false; }).length;
    var shown = skills.filter(function (s) {
      if (cat !== "all" && s.category !== cat) return false;
      if (q && (s.name + " " + (s.description || "")).toLowerCase().indexOf(q.toLowerCase()) < 0) return false;
      return true;
    });
    var catOpts = [{ v: "all", l: t("categoryAll") }].concat(Object.keys(cats).sort().slice(0, 6).map(function (c) { return { v: c, l: c }; }));
    return h("div", { className: "iris-page" },
      PageHead(t("skillsTitle"), t("skillsDesc", skills.length, enabledCount), null),
      curator ? Card(t("curator"),
        h("span", { style: { display: "flex", gap: "8px", alignItems: "center" } },
          Badge(curator.paused ? t("paused") : t("active"), curator.paused ? "neutral" : "iris"),
          Btn(curator.paused ? t("curatorResume") : t("curatorPause"), function () {
            act(t, "/api/curator/paused", jinit("PUT", { paused: !curator.paused }), reload);
          }, "sm"),
          Btn(t("curatorRun"), function () { act(t, "/api/curator/run", jinit("POST"), reload); }, "sm")),
        h("div", { className: "iris-note" },
          (curator.interval_hours ? "interval " + curator.interval_hours + " h" : "") +
          (curator.last_run_at ? " · " + t("lastRun").toLowerCase() + " " + (timeAgo(curator.last_run_at) || curator.last_run_at) : ""))) : null,
      h("div", { className: "iris-filterbar" },
        h("input", { className: "iris-input", type: "search", placeholder: t("search"), value: q, onChange: function (e) { setQ(e.target.value); } }),
        Chips(catOpts, cat, setCat)),
      h("div", { className: "iris-cards" }, shown.slice(0, 60).map(function (s, i) {
        var on = s.enabled !== false;
        return h("div", { className: "iris-mini", key: i, style: on ? null : { opacity: 0.6 } },
          h("div", { className: "mc-head" }, Icon("spark", "dim"), h("b", null, s.name),
            Switch(on, function () { act(t, "/api/skills/toggle", jinit("PUT", { name: s.name, enabled: !on }), reload); })),
          h("p", null, s.description || ""),
          h("div", { className: "mc-foot" },
            Badge(s.category || s.provenance || "", "neutral"),
            s.usage ? h("span", { className: "num" }, t("usageN", s.usage)) : null));
      })));
  }

  /* ================= MCP ================= */
  function McpPage() {
    var locale = useLocale(); var t = makeT(locale);
    var bp = useState(0); var bump = bp[0], setBump = bp[1];
    var data = useJSON("/api/mcp/servers", 30000, bump);
    var catalog = useJSON("/api/mcp/catalog", 120000);
    var reload = function () { setBump(bump + 1); };
    var servers = asList(data, ["servers", "items"]);
    var cat = asList(catalog, ["catalog", "entries", "items"]);
    return h("div", { className: "iris-page" },
      PageHead(t("mcpTitle"), t("mcpDesc"), null),
      servers.length ? servers.map(function (s2, i) {
        var enabled = s2.enabled !== false;
        return Card.call(null, s2.name,
          h("span", { style: { display: "flex", gap: "8px", alignItems: "center" } },
            Badge(s2.url ? "HTTP" : "STDIO", "neutral"),
            Btn(t("mcpTest"), function () {
              act(t, "/api/mcp/servers/" + s2.name + "/test", jinit("POST"), function (r) {
                alert(r ? JSON.stringify(r).slice(0, 300) : "?");
              });
            }, "sm"),
            Switch(enabled, function () { act(t, "/api/mcp/servers/" + s2.name + "/enabled", jinit("PUT", { enabled: !enabled }), reload); }),
            h("button", {
              className: "iris-link", style: { color: "var(--color-destructive)" },
              onClick: function () { if (confirm(t("confirmDelete", s2.name))) act(t, "/api/mcp/servers/" + s2.name, jinit("DELETE"), reload); }
            }, t("deleteS"))),
          h("div", { className: "iris-note iris-mono" }, s2.url || s2.command || ""));
      }) : Card(null, null, Empty(t("mcpNone"))),
      cat.length ? h("div", null,
        h("div", { className: "iris-nav-label", style: { padding: "6px 0" } }, t("mcpCatalog")),
        h("div", { className: "iris-cards" }, cat.slice(0, 12).map(function (c, i) {
          return h("div", { className: "iris-mini", key: i },
            h("div", { className: "mc-head" }, Icon("plug", "dim"), h("b", null, c.name || c.id)),
            h("p", null, c.description || ""),
            h("div", { className: "mc-foot" },
              Btn(t("mcpInstall"), function () {
                act(t, "/api/mcp/catalog/install", jinit("POST", { name: c.name || c.id }), reload);
              }, "sm primary"),
              h("span", null, t("verified"))));
        }))) : null);
  }

  /* ================= TOOLSETS ================= */
  function ToolsetsPage() {
    var locale = useLocale(); var t = makeT(locale);
    var bp = useState(0); var bump = bp[0], setBump = bp[1];
    var data = useJSON("/api/tools/toolsets", 60000, bump);
    var reload = function () { setBump(bump + 1); };
    var sets = asList(data, ["toolsets", "items"]);
    return h("div", { className: "iris-page" },
      PageHead(t("tsTitle"), t("tsDesc"), null),
      h("div", { className: "iris-cards" }, sets.map(function (s2, i) {
        var on = s2.enabled !== false;
        var tsIcons = { web: "globe", browser: "globe", files: "file", shell: "term", memory: "brain", scheduler: "clock" };
        return h("div", { className: "iris-mini", key: i, style: on ? null : { opacity: 0.6 } },
          h("div", { className: "mc-head" }, Icon(tsIcons[s2.name] || "tool", "dim"), h("b", null, s2.label || s2.name),
            Switch(on, function () { act(t, "/api/tools/toolsets/" + s2.name, jinit("PUT", { enabled: !on }), reload); })),
          h("p", null, s2.description || ""),
          h("div", { className: "mc-foot" },
            h("span", null, t("toolsN", (s2.tools || []).length)),
            s2.configured === false ? Badge(t("notConfigured"), "warn") : null,
            s2.platform_label ? Badge(s2.platform_label, "neutral") : null));
      })));
  }

  /* ================= CHANNELS ================= */
  function ChannelsPage() {
    var locale = useLocale(); var t = makeT(locale);
    var bp = useState(0); var bump = bp[0], setBump = bp[1];
    var data = useJSON("/api/messaging/platforms", 20000, bump);
    var status = useJSON("/api/status", 10000, bump);
    var reload = function () { setBump(bump + 1); };
    var plats = asList(data, ["platforms", "items"]);
    var gwOnline = !!(status && (status.gateway_running || status.gateway === "running"));
    var shown = plats.slice().sort(function (a, b) {
      return (b.enabled === true) - (a.enabled === true) || (b.configured === true) - (a.configured === true);
    });
    return h("div", { className: "iris-page" },
      PageHead(t("chTitle"), t("chDesc"),
        [Btn(gwOnline ? t("chRestart") : t("chStart"), function () {
          act(t, gwOnline ? "/api/gateway/restart" : "/api/gateway/start", jinit("POST"), reload);
        }, "primary", false),
         gwOnline ? Btn(t("chStop"), function () { act(t, "/api/gateway/stop", jinit("POST"), reload); }, "danger") : null]),
      Card(t("gateway"), Badge(gwOnline ? t("gatewayOnline") : t("gatewayDown"), gwOnline ? "good" : "crit"), null),
      shown.slice(0, 24).map(function (p, i) {
        var connected = p.connected === true || p.state === "connected";
        var state = connected ? t("connected") : (p.configured ? t("configured") : t("notSetUp"));
        return Card.call(null,
          h("span", { style: { display: "flex", alignItems: "center", gap: "9px" } },
            Dot(connected ? "ok" : (p.enabled ? "err" : "off")), p.name || p.id),
          h("span", { style: { display: "flex", gap: "8px", alignItems: "center" } },
            Badge(state, connected ? "good" : (p.enabled ? "warn" : "neutral")),
            Btn(t("chTest"), function () {
              act(t, "/api/messaging/platforms/" + p.id + "/test", jinit("POST"), function (r) {
                alert(r ? JSON.stringify(r).slice(0, 250) : "?");
              });
            }, "sm"),
            Switch(p.enabled === true, function () {
              act(t, "/api/messaging/platforms/" + p.id, jinit("PUT", { enabled: !p.enabled }), reload);
            })),
          h("div", { className: "iris-muted" }, p.description || ""));
      }));
  }

  /* ================= PAIRING ================= */
  function PairingPage() {
    var locale = useLocale(); var t = makeT(locale);
    var bp = useState(0); var bump = bp[0], setBump = bp[1];
    var data = useJSON("/api/pairing", 15000, bump);
    var reload = function () { setBump(bump + 1); };
    var pending = asList(data && data.pending, ["pending"]);
    var approved = asList(data && data.approved, ["approved"]);
    return h("div", { className: "iris-page" },
      PageHead(t("prTitle"), t("prDesc"),
        pending.length ? Btn(t("clearPending"), function () { act(t, "/api/pairing/clear-pending", jinit("POST"), reload); }) : null),
      h("div", { className: "iris-grid-2" },
        Card(t("prPending"), Badge(String(pending.length), pending.length ? "warn" : "neutral"),
          pending.length ? pending.map(function (p, i) {
            return h(React.Fragment, { key: i },
              Row("warn", txt(p.user || p.username || p.user_id) || "?",
                txt(p.platform) + " · " + t("pairingCode") + " " + (txt(p.code) || "?") +
                (p.age ? " · " + txt(p.age) : ""),
                h("span", { style: { display: "flex", gap: "6px" } },
                  Btn(t("approve"), function () { act(t, "/api/pairing/approve", jinit("POST", { platform: p.platform, code: p.code }), reload); }, "sm primary"),
                  Btn(t("reject"), function () { act(t, "/api/pairing/revoke", jinit("POST", { platform: p.platform, user_id: p.user_id || p.user }), reload); }, "sm"))));
          }) : Empty(t("noPending"))),
        Card(t("prApproved"), h("span", { className: "iris-muted" }, String(approved.length)),
          approved.length ? approved.map(function (p, i) {
            return h(React.Fragment, { key: i },
              Row("good", p.user || p.username || p.user_id || "?", p.platform || "",
                Btn(t("revoke"), function () {
                  if (confirm(t("confirmDelete", p.user || p.user_id))) act(t, "/api/pairing/revoke", jinit("POST", { platform: p.platform, user_id: p.user_id || p.user }), reload);
                }, "sm danger")));
          }) : Empty("—"))));
  }

  /* ================= PROFILES ================= */
  function ProfilesPage() {
    var locale = useLocale(); var t = makeT(locale);
    var data = useJSON("/api/profiles", 60000);
    var profiles = asList(data, ["profiles", "items"]);
    return h("div", { className: "iris-page" },
      PageHead(t("pfTitle"), t("pfDesc"), null),
      h("div", { className: "iris-cards", style: { gridTemplateColumns: "repeat(auto-fill,minmax(270px,1fr))" } },
        profiles.map(function (p, i) {
          return h("div", { className: "iris-mini", key: i, style: p.is_default ? { borderColor: "var(--color-primary)" } : null },
            h("div", { className: "mc-head" }, h("b", null, p.name), p.is_default ? Badge(t("pfDefault"), "iris") : null),
            h("p", null, p.description || (p.model ? h("span", { className: "iris-mono" }, p.model) : "")),
            h("div", { className: "mc-foot" },
              h("span", { className: "iris-mono" }, p.model || ""),
              h("span", null, t("pfSkills", p.skill_count != null ? p.skill_count : "—")),
              Badge(p.gateway_running ? "gateway on" : "gateway off", p.gateway_running ? "good" : "neutral")));
        })));
  }

  /* ================= CONFIG ================= */
  function ConfigPage() {
    var locale = useLocale(); var t = makeT(locale);
    var bp = useState(0); var bump = bp[0], setBump = bp[1];
    var data = useJSON("/api/config", 0, bump);
    var edit = useState({}); var ed = edit[0], setEd = edit[1];
    var sv = useState(""); var savedMsg = sv[0], setSaved = sv[1];
    if (!data) return h("div", { className: "iris-page" }, PageHead(t("cfgTitle"), t("cfgDesc"), null), Empty("…"));
    function val(k, dflt) { return ed[k] !== undefined ? ed[k] : (data[k] != null ? data[k] : dflt); }
    function field(k, label, hint, type) {
      return h("div", { className: "iris-field" }, h("label", null, label),
        h("input", {
          className: "iris-input" + (type === "mono" ? " iris-mono" : ""), value: String(val(k, "") == null ? "" : val(k, "")),
          onChange: function (e) { var n = {}; for (var x in ed) n[x] = ed[x]; n[k] = e.target.value; setEd(n); }
        }),
        hint ? h("div", { className: "iris-hint" }, hint) : null);
    }
    function save() {
      var cfg = JSON.parse(JSON.stringify(data));
      if (ed.model !== undefined) cfg.model = ed.model;
      if (ed.max_live_sessions !== undefined) cfg.max_live_sessions = parseInt(ed.max_live_sessions, 10) || null;
      if (ed.maxTurns !== undefined) { cfg.agent = cfg.agent || {}; cfg.agent.max_turns = parseInt(ed.maxTurns, 10) || cfg.agent.max_turns; }
      act(t, "/api/config", jinit("PUT", { config: cfg }), function (r) {
        if (r !== null) { setSaved(t("saved")); setEd({}); setBump(bump + 1); setTimeout(function () { setSaved(""); }, 3000); }
      });
    }
    return h("div", { className: "iris-page" },
      PageHead(t("cfgTitle"), t("cfgDesc"),
        [savedMsg ? Badge(savedMsg, "good") : null, Btn(t("save"), save, "primary")]),
      h("div", { className: "iris-grid-2" },
        Card(t("cfgModel"), null, h("div", null,
          field("model", t("cfgModel"), t("cfgSaveNote"), "mono"),
          field("max_live_sessions", t("cfgMaxLive"), null))),
        Card("Agent", null, h("div", null,
          h("div", { className: "iris-field" }, h("label", null, t("cfgMaxTurns")),
            h("input", {
              className: "iris-input", value: ed.maxTurns !== undefined ? ed.maxTurns : ((data.agent && data.agent.max_turns) || ""),
              onChange: function (e) { var n = {}; for (var x in ed) n[x] = ed[x]; n.maxTurns = e.target.value; setEd(n); }
            }))))),
      Card(t("cfgRawView"), null,
        h("pre", { className: "iris-logbox", style: { maxHeight: "40vh" } }, JSON.stringify(data, null, 2).slice(0, 20000))));
  }

  /* ================= KEYS ================= */
  function KeysPage() {
    var locale = useLocale(); var t = makeT(locale);
    var bp = useState(0); var bump = bp[0], setBump = bp[1];
    var adv = useState(false); var showAdv = adv[0], setAdv = adv[1];
    var data = useJSON("/api/env", 30000, bump);
    var reload = function () { setBump(bump + 1); };
    if (!data) return h("div", { className: "iris-page" }, PageHead(t("keysTitle"), t("keysDesc"), null), Empty("…"));
    var byCat = {};
    Object.keys(data).forEach(function (k) {
      var v = data[k] || {};
      if (v.advanced && !showAdv && !v.is_set) return;
      var cat = v.category || "other";
      (byCat[cat] = byCat[cat] || []).push([k, v]);
    });
    function setKey(k) {
      var v = prompt(t("keyPrompt", k)); if (v == null || v === "") return;
      act(t, "/api/env", jinit("PUT", { key: k, value: v }), reload);
    }
    return h("div", { className: "iris-page" },
      PageHead(t("keysTitle"), t("keysDesc"),
        Btn(t("keyShowAdvanced"), function () { setAdv(!showAdv); }, showAdv ? "primary" : "")),
      Object.keys(byCat).sort().map(function (cat) {
        return h("div", { key: cat },
          h("div", { className: "iris-nav-label", style: { padding: "6px 0" } }, cat),
          Table([{ l: t("name") }, { l: "", m: 1 }, { l: t("status") }, { l: "", r: 1 }],
            byCat[cat].sort().map(function (pair, i) {
              var k = pair[0], v = pair[1];
              return h("tr", { key: i },
                h("td", null, h("b", { className: "iris-mono", style: { fontSize: "11.5px" } }, k),
                  h("br"), h("small", { className: "iris-muted" }, (v.description || "").slice(0, 70))),
                h("td", { className: "hide-m iris-mono", style: { color: "var(--color-muted-foreground)" } }, v.redacted_value || "—"),
                h("td", null, Badge(v.is_set ? t("keySet") : t("keyUnset"), v.is_set ? "good" : "warn")),
                h("td", { className: "r" },
                  h("button", { className: "iris-link", onClick: function () { setKey(k); } }, v.is_set ? t("keyEdit") : t("keyDefine")),
                  v.is_set ? h("button", {
                    className: "iris-link", style: { color: "var(--color-destructive)", marginLeft: "8px" },
                    onClick: function () { if (confirm(t("confirmDelete", k))) act(t, "/api/env", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: k }) }, reload); }
                  }, t("keyDelete")) : null));
            })));
      }));
  }

  /* ================= LOGS ================= */
  function LogsPage() {
    var locale = useLocale(); var t = makeT(locale);
    var fs2 = useState("agent"); var file = fs2[0], setFile = fs2[1];
    var ls = useState(200); var lines = ls[0], setLines = ls[1];
    var lv = useState("ALL"); var level = lv[0], setLevel = lv[1];
    var tl = useState(true); var tail = tl[0], setTail = tl[1];
    var data = useJSON("/api/logs?file=" + file + "&lines=" + lines, tail ? 5000 : 0);
    var raw = asList(data && data.lines, ["lines"]);
    var shown = raw.filter(function (l) {
      if (level === "ALL") return true;
      return String(l).indexOf(" " + level) >= 0 || String(l).indexOf(level) >= 0;
    });
    return h("div", { className: "iris-page" },
      PageHead(t("logsTitle"), t("logsDesc"), null),
      h("div", { className: "iris-filterbar" },
        Chips([{ v: "agent", l: "agent" }, { v: "gateway", l: "gateway" }, { v: "errors", l: "errors" }], file, setFile),
        Chips([{ v: "ALL", l: "ALL" }, { v: "INFO", l: "INFO" }, { v: "WARNING", l: "WARN" }, { v: "ERROR", l: "ERROR" }], level, setLevel),
        Chips([{ v: 50, l: "50" }, { v: 200, l: "200" }, { v: 500, l: "500" }], lines, setLines),
        h("span", { className: "iris-spacer" }),
        h("span", { style: { display: "flex", gap: "8px", alignItems: "center", fontSize: "12px" } },
          t("liveTail"), Switch(tail, function () { setTail(!tail); }))),
      h("div", { className: "iris-logbox" }, shown.slice(-400).map(function (l, i) {
        var cls = /ERROR|CRITICAL/.test(l) ? "iris-lg-e" : /WARN/.test(l) ? "iris-lg-w" : /DEBUG/.test(l) ? "iris-lg-d" : "";
        return h("div", { key: i, className: cls }, l);
      })));
  }

  /* ================= SYSTEM ================= */
  function SystemPage() {
    var locale = useLocale(); var t = makeT(locale);
    var bp = useState(0); var bump = bp[0], setBump = bp[1];
    var stats = useJSON("/api/system/stats", 15000, bump);
    var status = useJSON("/api/status", 10000, bump);
    var memory = useJSON("/api/memory", 60000, bump);
    var cps = useJSON("/api/ops/checkpoints", 60000, bump);
    var reload = function () { setBump(bump + 1); };
    var s = stats || {};
    var gwOnline = !!(status && (status.gateway_running || status.gateway === "running"));
    var cpu = firstNum(s.cpu_percent, s.cpu && s.cpu.percent);
    var mem = firstNum(s.memory_percent, s.memory && s.memory.percent);
    var disk = firstNum(s.disk_percent, s.disk && s.disk.percent);
    var memFiles = memory ? asList(memory, ["files", "sizes", "stores"]) : [];
    var providers = memory ? asList(memory.providers, ["providers"]) : [];
    var cpSessions = asList(cps && cps.sessions, ["sessions"]);
    function op(label, path) {
      return Btn(label, function () { act(t, path, jinit("POST"), function (r) { if (r !== null) alert(t("launched", label)); }); });
    }
    return h("div", { className: "iris-page" },
      PageHead(t("sysTitle"), t("sysDesc"), null),
      h("div", { className: "iris-grid-2" },
        Card(t("host"), h("span", { className: "iris-muted num" }, s.hostname || ""),
          [h("div", { key: "i", className: "iris-note", style: { marginTop: 0, marginBottom: 8 } },
            [s.os, s.arch, s.python_version ? "Python " + s.python_version : null, s.hermes_version ? "hermes " + s.hermes_version : null]
              .filter(Boolean).join(" · ")),
           Meter(t("cpu"), cpu, cpu != null ? Math.round(cpu) + " %" : "—"),
           Meter(t("ram"), mem, mem != null ? Math.round(mem) + " %" : "—"),
           Meter(t("disk"), disk, disk != null ? Math.round(disk) + " %" : "—")]),
        Card(t("gateway"), Badge(gwOnline ? t("gatewayOnline") : t("gatewayDown"), gwOnline ? "good" : "crit"),
          h("div", { className: "iris-actions" },
            Btn(gwOnline ? t("chRestart") : t("chStart"), function () {
              act(t, gwOnline ? "/api/gateway/restart" : "/api/gateway/start", jinit("POST"), reload);
            }, "primary"),
            gwOnline ? Btn(t("chStop"), function () { act(t, "/api/gateway/stop", jinit("POST"), reload); }, "danger") : null))),
      h("div", { className: "iris-grid-2" },
        Card(t("memory"), h("span", { className: "iris-muted" }, memory && (memory.provider || memory.active) ? (memory.provider || memory.active) : "built-in"),
          [memFiles.slice(0, 4).map(function (f, i) {
            return Meter(f.name || f.file || "store", Math.min(100, (firstNum(f.size, f.bytes) || 0) / 2e9 * 100), fmtBytes(firstNum(f.size, f.bytes), locale));
          }),
           providers.length ? h("div", { className: "iris-note", key: "p" },
             providers.map(function (p) { return p.name + (p.available ? " ✓" : ""); }).join(" · ")) : null,
           h("div", { className: "iris-actions", key: "a", style: { marginTop: 10 } },
             Btn(t("memReset"), function () {
               if (confirm(t("confirmReset"))) act(t, "/api/memory/reset", jinit("POST", { target: "memory" }), reload);
             }, "danger"))]),
        Card(t("checkpoints"), h("span", { className: "iris-muted num" }, cps ? fmtBytes(cps.total_bytes, locale) : "—"),
          [cpSessions.length ? cpSessions.slice(0, 5).map(function (c, i) {
            return h(React.Fragment, { key: i },
              Row("", c.session_id || c.id || "?", fmtBytes(firstNum(c.bytes, c.size), locale), null));
          }) : Empty("—"),
           h("div", { className: "iris-actions", key: "a", style: { marginTop: 10 } },
             Btn(t("pruneCp"), function () { act(t, "/api/ops/checkpoints/prune", jinit("POST"), reload); }))])),
      Card(t("opsTitle"), null,
        h("div", { className: "iris-actions" },
          op(t("doctor"), "/api/ops/doctor"), op(t("audit"), "/api/ops/security-audit"),
          op(t("backup"), "/api/ops/backup"), op(t("dump"), "/api/ops/dump"))));
  }

  /* ================= NAVIGATION (overlay slot) ================= */
  function NavItems(t, path, cls, onNav) {
    var groups = [
      [null, [["/", t("navHome"), "grid"], ["/chat", t("navChat"), "chat"], ["/sessions", t("navSessions"), "hist"], ["/analytics", t("navAnalytics"), "chart"]]],
      [t("grpAutomation"), [["/cron", t("navCron"), "clock"], ["/webhooks", t("navWebhooks"), "hook"]]],
      [t("grpCapabilities"), [["/skills", t("navSkills"), "spark"], ["/mcp", t("navMcp"), "plug"], ["/toolsets", t("navToolsets"), "tool"], ["/models", t("navModels"), "brain"]]],
      [t("grpConnectivity"), [["/channels", t("navChannels"), "radio"], ["/pairing", t("navPairing"), "link"]]],
      [t("grpAdmin"), [["/config", t("navConfig"), "cog"], ["/env", t("navKeys"), "key"], ["/profiles", t("navProfiles"), "users"],
        ["/files", t("navFiles"), "file"], ["/logs", t("logs"), "file"], ["/system", t("navSystem"), "server"], ["/docs", t("navDocs"), "globe"]]]
    ];
    return groups.map(function (g, gi) {
      return h("div", { key: gi, className: "iris-nav-group" },
        g[0] ? h("div", { className: "iris-nav-label" }, g[0]) : null,
        g[1].map(function (l, li) {
          return h("a", {
            key: li, href: l[0],
            className: cls + (path === l[0] ? " active" : ""),
            onClick: function (e) { e.preventDefault(); onNav(l[0]); }
          }, Icon(l[2]), l[1]);
        }));
    });
  }
  function SideNav() {
    var t = makeT(useLocale());
    var path = usePath();
    return h("nav", { className: "iris-sidenav" },
      h("div", { className: "iris-side-logo" },
        h("span", { className: "mark" }),
        h("span", null, h("b", null, "Iris"), h("small", null, "Control Center"))),
      NavItems(t, path, "iris-nav-item", navTo));
  }
  function MobileNav() {
    var t = makeT(useLocale());
    var path = usePath();
    var links = [["/", t("navHome"), "grid"], ["/chat", t("navChat"), "chat"], ["/sessions", t("navSessions"), "hist"], ["/cron", t("navCron"), "clock"], ["/system", t("navSystem"), "server"]];
    return h("nav", { className: "iris-bottombar" }, links.map(function (l, i) {
      return h("a", {
        key: i, href: l[0], className: "iris-bb-item" + (path === l[0] ? " active" : ""),
        onClick: function (e) { e.preventDefault(); navTo(l[0]); }
      }, Icon(l[2], "bb"), h("span", null, l[1]));
    }));
  }
  function Overlay() {
    return h(React.Fragment, null, h(SideNav), h(MobileNav));
  }

  /* ================= registration ================= */
  window.__IRIS_PAGES__ = {
    "iris-sessions": SessionsPage,
    "iris-analytics": AnalyticsPage,
    "iris-cron": CronPage,
    "iris-webhooks": WebhooksPage,
    "iris-skills": SkillsPage,
    "iris-mcp": McpPage,
    "iris-toolsets": ToolsetsPage,
    "iris-channels": ChannelsPage,
    "iris-pairing": PairingPage,
    "iris-profiles": ProfilesPage,
    "iris-config": ConfigPage,
    "iris-keys": KeysPage,
    "iris-logs": LogsPage,
    "iris-system": SystemPage
  };
  REG.register("iris", HomePage);
  REG.registerSlot("iris", "overlay", Overlay);
})();
