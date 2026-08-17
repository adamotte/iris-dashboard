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

  /* ================= cronstrue (cron → human) ================= */
  // Vendored UMD (MIT) at dist/cronstrue-i18n.min.js, served next to this
  // bundle at /api/dashboard-plugins/iris/dist/. Lazy-injected on the cron
  // page so the rest of the dashboard never pays the 186 KB download.
  var CS_BASE = "";
  try {
    var csScript = document.currentScript || document.querySelector('script[data-hermes-plugin="iris"]');
    if (csScript && csScript.src) CS_BASE = csScript.src.slice(0, csScript.src.lastIndexOf("/") + 1);
  } catch (e) { /* noop */ }
  var csInjected = false;
  function loadCronstrue(done) {
    if (window.cronstrue) { if (done) done(); return; }
    if (csInjected) return;
    csInjected = true;
    var s = document.createElement("script");
    s.src = CS_BASE + "cronstrue-i18n.min.js";
    s.async = true;
    if (done) s.onload = done;
    document.head.appendChild(s);
  }
  function humanCron(expr, locale) {
    if (!window.cronstrue || !expr) return "";
    try {
      return window.cronstrue.toString(String(expr), {
        locale: locale === "fr" ? "fr" : "en", use24HourTimeFormat: true
      });
    } catch (e) { return ""; }
  }

  /* ================= i18n ================= */
  var CATALOG = {
    en: {
      overview: "Overview", gatewayOnline: "Gateway online", gatewayDown: "Gateway stopped",
      activeSessionsSuffix: "active session(s)", logs: "Logs", openChat: "Open chat",
      costToday: "Cost today", avg7d: "7-day average: {0} / day", viaAnalytics: "via /api/analytics/usage",
      tokensLastDay: "Tokens · 24 h", cacheRate: "cache rate {0} %", activeSessions: "Active sessions",
      recentSessionsCount: "{0} recent sessions", nextAutomation: "Next automation", jobs: "jobs",
      noScheduledJob: "no scheduled job", automationsLastRuns: "Automations · latest runs", cron: "Cron",
      noCronJob: "No cron job configured", usage14d: "Usage", total: "total",
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
      navDocs: "Documentation", navPlugins: "Plugins", grpAutomation: "Automation", grpCapabilities: "Capabilities",
      grpConnectivity: "Connectivity", grpAdmin: "Administration",
      /* common */
      search: "Search…", refresh: "Refresh", enabled: "enabled", disabled: "disabled",
      actions: "Actions", name: "Name", description: "Description", status: "Status",
      confirmDelete: "Delete “{0}”?", error: "Error: {0}", save: "Save", saved: "Saved ✓",
      netDown: "{0} data source(s) unreachable — the gateway may be down", retry: "Reload",
      /* dialogs */
      dlgOk: "Confirm", dlgClose: "Close", errTitle: "Something went wrong",
      resultTitle: "Result", confirmTitle: "Confirmation",
      /* sessions */
      sessionsTitle: "Sessions", sessionsDesc: "Full-text search across every conversation",
      chats: "Chats", automation: "Automation", archived: "Archived", messages: "Messages",
      model: "Model", lastActivity: "Last activity", source: "Source", export: "Export",
      deleteS: "Delete", pruneOld: "Prune > 90 d", confirmPrune: "Delete ended sessions older than 90 days?",
      noSessions: "No sessions yet", searchResults: "Search results", resumeChat: "Resume in chat",
      /* analytics */
      analyticsTitle: "Analytics", analyticsDesc: "Usage, cost and cache computed from session history",
      period: "{0} d", cacheTitle: "Cache rate", sessionsCount: "Sessions", perModel: "By model",
      estCost: "Est. cost", dailyDetail: "Daily detail", date: "Date", cache: "Cache", noUsage: "No usage recorded yet",
      /* cron */
      cronTitle: "Scheduled automations", cronDesc: "Jobs run even while you sleep — results land on your channels",
      newJob: "New job", job: "Job", schedule: "Schedule", target: "Target", lastRun: "Last run",
      nextRun: "Next run", runNow: "Run now", pause: "Pause", resume: "Resume", paused: "paused",
      neverRun: "no runs yet",
      active: "active", promptLbl: "Prompt", nameLbl: "Name", cronExpr: "Cron expression (e.g. 0 7 * * *)",
      deliverLbl: "Delivery target", create: "Create", cancel: "Cancel",
      profileFilter: "Profile", allProfiles: "All profiles",
      scheduleMode: "Schedule", modeInterval: "Interval", modeDaily: "Daily", modeWeekly: "Weekly",
      modeMonthly: "Monthly", modeOnce: "Once", modeCustom: "Custom",
      intervalEvery: "Every", intervalUnit: "Unit", unitMinutes: "minutes", unitHours: "hours", unitDays: "days",
      timeOfDay: "Time of day", weekdays: "Weekdays", dayOfMonth: "Day of month", onceAt: "Run at",
      customLabel: "Custom expression", customPlaceholder: "e.g. */15 9-17 * * 1-5", customHint: "5-field cron expression",
      schedulePreview: "Preview",
      wdSun: "Sun", wdMon: "Mon", wdTue: "Tue", wdWed: "Wed", wdThu: "Thu", wdFri: "Fri", wdSat: "Sat",
      deliveryLocal: "Local", deliverTo: "Deliver to", homeChannelFirst: "set a home channel first",
      deliveryNone: "No messaging platforms configured — set one up under Channels to deliver reports.",
      skillsLbl: "Skills (optional)", skillsHint: "Selected skills are loaded before the prompt runs — the cron sets when, the skill sets how.",
      noSkillsAvail: "No skills installed for this profile.",
      advTitle: "Advanced fields", baseUrlLbl: "Base URL override", baseUrlPh: "https://api.example.com/v1",
      noAgentLbl: "no_agent: run the script only and deliver stdout verbatim",
      scriptLbl: "Script", scriptPh: "relative/path/in/scripts", workdirLbl: "Workdir", workdirPh: "/absolute/project/path",
      contextFromLbl: "context_from job IDs", contextFromPh: "one job id per line",
      toolsetsLbl: "enabled_toolsets", noToolsetsAvail: "No toolsets available.",
      defaultOpt: "Default",
      errScheduleReq: "A schedule is required", errContentReq: "A prompt, script or skill is required",
      errNoAgentScript: "no_agent jobs require a script",
      modeAgent: "agent", modeScript: "script+agent", modeNoAgent: "no_agent",
      modelTag: "model", badgeSkills: "skills", badgeToolsets: "toolsets",
      repeat: "repeat", forever: "forever",
      lastError: "last error", deliveryError: "delivery error",
      tabJobs: "Jobs", tabBlueprints: "Blueprints",
      bpLoading: "Loading blueprints…", bpNone: "No automation blueprints available.",
      bpLoadError: "Couldn't load blueprints", bpSetup: "Set up", bpScheduled: "scheduled",
      bpInstantiate: "Schedule it", bpNoFields: "No fields to configure.",
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
      cfgTitle: "Configuration", cfgDesc: "Edit config.yaml without touching YAML — 150+ organized settings",
      cfgModel: "Default model", cfgMaxLive: "Max live sessions", cfgMaxTurns: "Max agent turns",
      cfgRawView: "Raw view (read-only)", cfgSaveNote: "Saves via PUT /api/config",
      /* keys */
      keysTitle: "API Keys", keysDesc: "Manage the .env file — values never leave your server",
      keySet: "set", keyUnset: "missing", keyEdit: "Edit", keyDefine: "Set", keyDelete: "Delete",
      keyEditTitle: "Edit a key", keyDefineTitle: "Set a key", keyValueLbl: "Value",
      keySecretHint: "Written to the .env file on your server — it never leaves it.",
      keyReveal: "Show the value", keyHide: "Hide the value", keyAdvanced: "advanced",
      keysSetN: "{0} set", keysMissingN: "{0} missing", keysMissingTitle: "Missing keys",
      keyShowMissing: "Show the missing keys ({0})", keyHideMissing: "Hide the missing keys",
      keySearch: "Search a key…", keysNoneSet: "No key set yet",
      keysAllSet: "Every key is set ✓", keysNoMatch: "No key matches this search",
      /* logs */
      logsTitle: "Logs", logsDesc: "Agent, gateway and errors consolidated — live tail",
      liveTail: "Live tail", lines: "lines",
      /* system */
      sysTitle: "System", sysDesc: "Installation administration — host, gateway, memory, operations",
      host: "Host", uptime: "up {0}", checkpoints: "Checkpoints", pruneCp: "Prune old checkpoints",
      opsTitle: "Operations", doctor: "Doctor", audit: "Security audit", backup: "Backup",
      dump: "Support dump", memReset: "Reset", confirmReset: "Reset the built-in memory store?",
      launched: "{0} launched — check the logs", curatorPause: "Pause", curatorResume: "Resume",
      /* plugins */
      plgTitle: "Plugins", plgDesc: "Dashboard pages, agent plugins and providers",
      plgRescan: "Rescan", plgDash: "Dashboard plugins", plgAgents: "Agent plugins",
      plgIris: "Iris pack",
      plgActive: "{0} active", plgVisible: "{0} visible",
      plgInactiveN: "{0} inactive", plgInactive: "inactive",
      plgInactiveBtn: "Inactive/Disabled ({0})", plgActiveBtn: "Enabled ({0})",
      plgEnabled: "Enabled {0}", plgDisabled: "Disabled {0}",
      plgOverride: "overrides {0}", plgTab: "tab {0}",
      plgSlotsN: "{0} slot(s)", plgApi: "backend API", plgAuth: "auth required",
      plgNote: "Inactive/disabled plugins stay installed but are no longer loaded. Iris pages follow the same enable/disable rule as agent plugins — switch one off to hand its route back to the native page.",
      plgAll: "All", plgProviders: "Providers", plgPlatforms: "Platforms",
      plgWeb: "Web search", plgBrowser: "Browser", plgOther: "Other",
      plgOtherDash: "Other dashboard plugins",
      plgInstall: "Install", plgInstallTitle: "Install a plugin",
      plgInstallLabel: "Source", plgInstallPh: "owner/repo or a git URL",
      plgInstallHint: "Installs from a Git repository (owner/repo[/subdir] or a git URL) and enables it.",
      plgInstalled: "Installed {0}", plgUpdate: "Update",
      plgUpdateConfirm: "Pull the latest version of \"{0}\" from its git repository?",
      plgUpdated: "Updated {0}",
      /* mockup-fidelity pass */
      hello: "Hello", newSession: "New session", sessionsToday: "{0} sessions today",
      jobsActive: "{0} active jobs", inTime: "in {0}", executed: "Executed",
      cacheAvg: "Avg cache", missingKey: "Missing API key", configure: "Configure",
      authExpired: "auth expired", lastConsolidation: "last consolidation: {0}",
      sessActive: "{0} active", searchFTS: "Search messages… (FTS)",
      allModels: "All models", allSources: "All sources",
      vsPrev: "vs previous period", perDayAvg: "{0} / day on average", avgPerDay: "avg {0} / day",
      share: "Share", cronSub: "{0} active jobs · {1} paused",
      whNone: "No webhook configured", copy: "Copy", copied: "Copied ✓",
      created: "Created ✓", updated: "Updated ✓", deleted: "Deleted ✓", triggered: "Triggered ✓",
      timeJustNow: "just now", timeMinAgo: "{0} min ago", timeHourAgo: "{0} h ago", timeDayAgo: "{0} d ago",
      curatorNote: "Automatic consolidation of agent-created skills.",
      curatorRunNow: "Run now", searchSkill: "Search skills…", editJob: "Edit job",
      mcpError: "error", verifiedNous: "Nous verified",
      owner: "owner", admin: "admin", since: "since {0}",
      cfgImport: "Import", cfgExport: "Export",
      cfgSearch: "Search settings…", cfgNoMatch: "No match for “{0}”",
      tabModel: "Model", tabAgent: "Agent", tabMemory: "Memory",
      tabApprovals: "Approvals", tabGateway: "Gateway", tabDisplay: "Display",
      cfgProvider: "Provider", cfgCtx: "Context window",
      cfgModelHint: "Used for chat and new sessions.",
      cfgCronModel: "Cron / background model", cfgApprovalMode: "Approval mode",
      logAll: "All", logInfo: "Info", logWarn: "Warn", logError: "Error",
      gwConnStat: "{0} platform(s) connected", memPersist: "Persistent memory",
      providersAvail: "Available providers:", activeMark: "(active)",
      gwRestart: "Restart", gwStop: "Stop", gwStart: "Start",
      navMore: "More", menuTitle: "Navigation", online: "online", offline: "stopped",
      catProvider: "LLM providers", catTool: "Tools", catMessaging: "Messaging", catSetting: "Settings",
      cronGwDown: "The gateway is stopped — triggered and scheduled jobs will not run until it starts."
    },
    fr: {
      overview: "Vue d'ensemble", gatewayOnline: "Passerelle en ligne", gatewayDown: "Passerelle arrêtée",
      activeSessionsSuffix: "session(s) active(s)", logs: "Logs", openChat: "Ouvrir le chat",
      costToday: "Coût aujourd'hui", avg7d: "moyenne 7 j : {0} / jour", viaAnalytics: "via /api/analytics/usage",
      tokensLastDay: "Tokens · 24 h", cacheRate: "taux de cache {0} %", activeSessions: "Sessions actives",
      recentSessionsCount: "{0} sessions récentes", nextAutomation: "Prochaine automatisation", jobs: "jobs",
      noScheduledJob: "aucun job planifié", automationsLastRuns: "Automatisations · dernières exécutions", cron: "Cron",
      noCronJob: "Aucun job cron configuré", usage14d: "Utilisation", total: "total",
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
      navDocs: "Documentation", navPlugins: "Plugins", grpAutomation: "Automatisation", grpCapabilities: "Capacités",
      grpConnectivity: "Connectivité", grpAdmin: "Administration",
      search: "Rechercher…", refresh: "Actualiser", enabled: "activé", disabled: "désactivé",
      actions: "Actions", name: "Nom", description: "Description", status: "État",
      confirmDelete: "Supprimer « {0} » ?", error: "Erreur : {0}", save: "Enregistrer", saved: "Enregistré ✓",
      netDown: "{0} source(s) de données injoignable(s) — la passerelle est peut-être arrêtée", retry: "Recharger",
      dlgOk: "Confirmer", dlgClose: "Fermer", errTitle: "Une erreur est survenue",
      resultTitle: "Résultat", confirmTitle: "Confirmation",
      sessionsTitle: "Sessions", sessionsDesc: "Recherche plein-texte dans tout l'historique",
      chats: "Chats", automation: "Automations", archived: "Archivées", messages: "Messages",
      model: "Modèle", lastActivity: "Dernière activité", source: "Source", export: "Exporter",
      deleteS: "Supprimer", pruneOld: "Purger > 90 j", confirmPrune: "Supprimer les sessions terminées de plus de 90 jours ?",
      noSessions: "Aucune session pour l'instant", searchResults: "Résultats de recherche", resumeChat: "Reprendre dans le chat",
      analyticsTitle: "Analytics", analyticsDesc: "Consommation, coûts et taux de cache calculés depuis l'historique des sessions",
      period: "{0} j", cacheTitle: "Taux de cache", sessionsCount: "Sessions", perModel: "Par modèle",
      estCost: "Coût estimé", dailyDetail: "Détail journalier", date: "Date", cache: "Cache", noUsage: "Aucune utilisation enregistrée",
      cronTitle: "Automatisations planifiées", cronDesc: "Les jobs tournent même pendant votre sommeil — résultats sur vos canaux",
      newJob: "Nouveau job", job: "Job", schedule: "Planification", target: "Cible", lastRun: "Dernière",
      nextRun: "Prochaine", runNow: "Exécuter", pause: "Pause", resume: "Reprendre", paused: "en pause",
      neverRun: "jamais exécuté",
      active: "actif", promptLbl: "Prompt", nameLbl: "Nom", cronExpr: "Expression cron (ex. 0 7 * * *)",
      deliverLbl: "Cible de livraison", create: "Créer", cancel: "Annuler",
      profileFilter: "Profil", allProfiles: "Tous les profils",
      scheduleMode: "Planification", modeInterval: "Intervalle", modeDaily: "Quotidien", modeWeekly: "Hebdomadaire",
      modeMonthly: "Mensuel", modeOnce: "Une fois", modeCustom: "Personnalisé",
      intervalEvery: "Toutes les", intervalUnit: "Unité", unitMinutes: "minutes", unitHours: "heures", unitDays: "jours",
      timeOfDay: "Heure", weekdays: "Jours", dayOfMonth: "Jour du mois", onceAt: "Exécuter à",
      customLabel: "Expression personnalisée", customPlaceholder: "ex. */15 9-17 * * 1-5", customHint: "Expression cron à 5 champs",
      schedulePreview: "Aperçu",
      wdSun: "Dim", wdMon: "Lun", wdTue: "Mar", wdWed: "Mer", wdThu: "Jeu", wdFri: "Ven", wdSat: "Sam",
      deliveryLocal: "Local", deliverTo: "Livrer à", homeChannelFirst: "définissez d'abord un canal d'accueil",
      deliveryNone: "Aucune plateforme de messagerie configurée — configurez-en une sous Canaux pour livrer les rapports.",
      skillsLbl: "Skills (optionnel)", skillsHint: "Les skills sélectionnées sont chargées avant l'exécution du prompt — le cron décide du quand, la skill du comment.",
      noSkillsAvail: "Aucune skill installée pour ce profil.",
      advTitle: "Champs avancés", baseUrlLbl: "Surcharge de l'URL de base", baseUrlPh: "https://api.example.com/v1",
      noAgentLbl: "no_agent : exécuter uniquement le script et livrer la sortie brute",
      scriptLbl: "Script", scriptPh: "chemin/relatif/dans/scripts", workdirLbl: "Répertoire de travail", workdirPh: "/chemin/absolu/projet",
      contextFromLbl: "IDs de jobs context_from", contextFromPh: "un id de job par ligne",
      toolsetsLbl: "enabled_toolsets", noToolsetsAvail: "Aucun toolset disponible.",
      defaultOpt: "Défaut",
      errScheduleReq: "Une planification est requise", errContentReq: "Un prompt, un script ou une skill est requis",
      errNoAgentScript: "les jobs no_agent nécessitent un script",
      modeAgent: "agent", modeScript: "script+agent", modeNoAgent: "no_agent",
      modelTag: "modèle", badgeSkills: "skills", badgeToolsets: "toolsets",
      repeat: "répétition", forever: "permanent",
      lastError: "dernière erreur", deliveryError: "erreur de livraison",
      tabJobs: "Jobs", tabBlueprints: "Plans",
      bpLoading: "Chargement des plans…", bpNone: "Aucun plan d'automatisation disponible.",
      bpLoadError: "Impossible de charger les plans", bpSetup: "Configurer", bpScheduled: "programmé",
      bpInstantiate: "Planifier", bpNoFields: "Aucun champ à configurer.",
      whTitle: "Webhooks", whDesc: "Déclenchez l'agent depuis l'extérieur — CI, monitoring, formulaires, domotique",
      whNew: "Nouveau webhook", whEvents: "Filtre", whEnableSys: "Activer le système de webhooks", whUrl: "URL",
      whSecretNote: "Le secret de signature n'est montré qu'à la création.",
      skillsTitle: "Skills", skillsDesc: "{0} installées · {1} activées · le curateur consolide chaque nuit",
      curator: "Curateur de skills", curatorRun: "Exécuter", categoryAll: "Toutes", usageN: "{0} utilisations",
      mcpTitle: "Serveurs MCP", mcpDesc: "Étendez Iris avec des serveurs Model Context Protocol — sans toucher au YAML",
      mcpAdd: "Ajouter un serveur", mcpTest: "Tester", mcpCatalog: "Catalogue Nous — installation en un clic",
      mcpInstall: "Installer", mcpNone: "Aucun serveur MCP configuré", verified: "vérifié",
      tsTitle: "Toolsets", tsDesc: "Groupes d'outils intégrés — activez uniquement ce dont l'agent a besoin",
      toolsN: "{0} outils", notConfigured: "clé manquante",
      chTitle: "Canaux de messagerie", chDesc: "Une seule Iris, tous vos canaux — même mémoire, même contexte partout",
      chRestart: "Redémarrer la passerelle", chStart: "Démarrer la passerelle", chStop: "Arrêter la passerelle", chTest: "Tester",
      connected: "connecté", configured: "configuré", notSetUp: "non configuré",
      prTitle: "Appairage", prDesc: "Contrôlez qui peut parler à Iris sur chaque plateforme",
      prPending: "Demandes en attente", prApproved: "Utilisateurs approuvés", approve: "Approuver", reject: "Refuser",
      revoke: "Révoquer", clearPending: "Vider les demandes", noPending: "Aucune demande en attente",
      pfTitle: "Profils", pfDesc: "Instances isolées d'Iris — config, skills et sessions dédiées",
      pfDefault: "par défaut", pfSkills: "{0} skills",
      cfgTitle: "Configuration", cfgDesc: "Éditez config.yaml sans toucher au YAML — 150+ réglages organisés",
      cfgModel: "Modèle par défaut", cfgMaxLive: "Sessions simultanées max", cfgMaxTurns: "Tours agent max",
      cfgRawView: "Vue brute (lecture seule)", cfgSaveNote: "Enregistre via PUT /api/config",
      keysTitle: "Clés API", keysDesc: "Gérez le fichier .env — les valeurs ne quittent jamais votre serveur",
      keySet: "définie", keyUnset: "manquante", keyEdit: "Modifier", keyDefine: "Définir", keyDelete: "Supprimer",
      keyEditTitle: "Modifier une clé", keyDefineTitle: "Définir une clé", keyValueLbl: "Valeur",
      keySecretHint: "Écrite dans le fichier .env de votre serveur — elle n'en sort jamais.",
      keyReveal: "Afficher la valeur", keyHide: "Masquer la valeur", keyAdvanced: "avancée",
      keysSetN: "{0} définies", keysMissingN: "{0} manquantes", keysMissingTitle: "Clés manquantes",
      keyShowMissing: "Afficher les clés manquantes ({0})", keyHideMissing: "Masquer les clés manquantes",
      keySearch: "Rechercher une clé…", keysNoneSet: "Aucune clé définie pour l'instant",
      keysAllSet: "Toutes les clés sont définies ✓", keysNoMatch: "Aucune clé ne correspond à cette recherche",
      logsTitle: "Logs", logsDesc: "Agent, passerelle et erreurs consolidés — suivi en direct",
      liveTail: "Suivi live", lines: "lignes",
      sysTitle: "Système", sysDesc: "Administration de l'installation — hôte, passerelle, mémoire, opérations",
      host: "Hôte", uptime: "en ligne {0}", checkpoints: "Checkpoints", pruneCp: "Élaguer les anciens checkpoints",
      opsTitle: "Opérations", doctor: "Doctor", audit: "Audit sécurité", backup: "Sauvegarde",
      dump: "Dump support", memReset: "Réinitialiser", confirmReset: "Réinitialiser le store mémoire intégré ?",
      launched: "{0} lancé — voir les logs", curatorPause: "Pause", curatorResume: "Reprendre",
      plgTitle: "Plugins", plgDesc: "Pages du dashboard, plugins agent et providers",
      plgRescan: "Rescanner", plgDash: "Plugins dashboard", plgAgents: "Plugins agent",
      plgIris: "Pack Iris",
      plgActive: "{0} actifs", plgVisible: "{0} visibles",
      plgInactiveN: "{0} inactifs", plgInactive: "inactif",
      plgInactiveBtn: "Inactifs/Désactivés ({0})", plgActiveBtn: "Actifs ({0})",
      plgEnabled: "{0} activé", plgDisabled: "{0} désactivé",
      plgOverride: "surcharge {0}", plgTab: "onglet {0}",
      plgSlotsN: "{0} slot(s)", plgApi: "API backend", plgAuth: "auth requise",
      plgNote: "Un plugin inactif/désactivé reste installé mais n'est plus chargé. Les pages Iris suivent la même règle d'activation que les plugins agent — désactivez-en une pour rendre sa route à la page native.",
      plgAll: "Tous", plgProviders: "Providers", plgPlatforms: "Plateformes",
      plgWeb: "Recherche web", plgBrowser: "Navigateur", plgOther: "Autres",
      plgOtherDash: "Autres plugins dashboard",
      plgInstall: "Installer", plgInstallTitle: "Installer un plugin",
      plgInstallLabel: "Source", plgInstallPh: "propriétaire/dépôt ou URL git",
      plgInstallHint: "Installe depuis un dépôt Git (propriétaire/dépôt[/sous-dossier] ou URL git) puis l'active.",
      plgInstalled: "{0} installé", plgUpdate: "Mettre à jour",
      plgUpdateConfirm: "Tirer la dernière version de \"{0}\" depuis son dépôt git ?",
      plgUpdated: "{0} mis à jour",
      hello: "Bonjour", newSession: "Nouvelle session", sessionsToday: "{0} sessions aujourd'hui",
      jobsActive: "{0} jobs actifs", inTime: "dans {0}", executed: "Exécuté",
      cacheAvg: "Cache moyen", missingKey: "Clé API manquante", configure: "Configurer",
      authExpired: "auth expirée", lastConsolidation: "dernière consolidation : {0}",
      sessActive: "{0} actives", searchFTS: "Rechercher dans les messages… (FTS)",
      allModels: "Tous les modèles", allSources: "Toutes sources",
      vsPrev: "vs période préc.", perDayAvg: "{0} / jour en moyenne", avgPerDay: "moy. {0} / jour",
      share: "Part", cronSub: "{0} jobs actifs · {1} en pause",
      whNone: "Aucun webhook configuré", copy: "Copier", copied: "Copié ✓",
      created: "Créé ✓", updated: "Mis à jour ✓", deleted: "Supprimé ✓", triggered: "Déclenché ✓",
      timeJustNow: "à l'instant", timeMinAgo: "il y a {0} min", timeHourAgo: "il y a {0} h", timeDayAgo: "il y a {0} j",
      curatorNote: "Consolidation automatique des skills créées par l'agent.",
      curatorRunNow: "Exécuter maintenant", searchSkill: "Rechercher une skill…", editJob: "Modifier le job",
      mcpError: "erreur", verifiedNous: "vérifié Nous",
      owner: "propriétaire", admin: "admin", since: "depuis le {0}",
      cfgImport: "Importer", cfgExport: "Exporter",
      cfgSearch: "Rechercher un réglage…", cfgNoMatch: "Aucun résultat pour « {0} »",
      tabModel: "Modèle", tabAgent: "Agent", tabMemory: "Mémoire",
      tabApprovals: "Approbations", tabGateway: "Passerelle", tabDisplay: "Affichage",
      cfgProvider: "Fournisseur", cfgCtx: "Fenêtre de contexte",
      cfgModelHint: "Utilisé pour le chat et les nouvelles sessions.",
      cfgCronModel: "Modèle cron / tâches de fond", cfgApprovalMode: "Mode d'approbation",
      logAll: "Tout", logInfo: "Info", logWarn: "Warn", logError: "Erreur",
      gwConnStat: "{0} plateforme(s) connectée(s)", memPersist: "Mémoire persistante",
      providersAvail: "Providers disponibles :", activeMark: "(actif)",
      gwRestart: "Redémarrer", gwStop: "Arrêter", gwStart: "Démarrer",
      navMore: "Plus", menuTitle: "Navigation", online: "en ligne", offline: "arrêtée",
      catProvider: "Fournisseurs LLM", catTool: "Outils", catMessaging: "Messagerie", catSetting: "Réglages",
      cronGwDown: "La passerelle est arrêtée — les jobs déclenchés ou planifiés ne s'exécuteront pas tant qu'elle n'est pas démarrée."
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
  // locale-aware decimal (mockup shows "1,87 $" in French)
  function dec(n, digits, locale) {
    var s = Number(n).toFixed(digits);
    return locale === "fr" ? s.replace(".", ",") : s;
  }
  function fmtTokens(n, locale) {
    if (n == null) return "—";
    if (n >= 1e6) return dec(n / 1e6, 2, locale) + " M";
    if (n >= 1e3) return Math.round(n / 1e3) + " K";
    return String(n);
  }
  function fmtCost(n, locale) { return n == null ? "—" : dec(n, 2, locale) + " $"; }
  // future counterpart of timeAgo: "42 min", "3 h", "2 j 4 h"
  function timeUntil(v, locale) {
    try {
      var ms = new Date(v).getTime() - Date.now();
      if (!isFinite(ms) || ms <= 0) return "";
      var m = Math.round(ms / 60000);
      if (m < 60) return m + " min";
      var hLbl = " h", dLbl = locale === "fr" ? " j" : " d";
      if (m < 1440) return Math.floor(m / 60) + hLbl + (m % 60 ? " " + (m % 60).toString().padStart(2, "0") : "");
      return Math.floor(m / 1440) + dLbl + (Math.floor((m % 1440) / 60) ? " " + Math.floor((m % 1440) / 60) + hLbl : "");
    } catch (e) { return ""; }
  }
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
  // a cron job belongs to a profile; every cron API call is profile-scoped
  function jobProfile(j) { return txt(j.profile) || txt(j.profile_name) || "default"; }
  function encProfile(p) { try { return encodeURIComponent(p); } catch (e) { return p; } }
  function profileQuery(p) { return p && p !== "all" && p !== "default" ? "?profile=" + encProfile(p) : ""; }
  function jobMode(j) {
    if (j.no_agent) return "no_agent";
    if (txt(j.script)) return "script+agent";
    return "agent";
  }
  function jobBadges(j, t) {
    var out = [];
    out.push(Badge(jobProfile(j), "neutral"));
    var md = jobMode(j);
    var mdl = md === "no_agent" ? t("modeNoAgent") : md === "script+agent" ? t("modeScript") : t("modeAgent");
    out.push(Badge(mdl, "neutral"));
    var m = txt(j.model);
    if (m) out.push(Badge(t("modelTag") + " " + m, "neutral"));
    if (Array.isArray(j.skills) && j.skills.length) {
      out.push(Badge(t("badgeSkills") + " " + j.skills.filter(Boolean).slice(0, 3).join(", ") + (j.skills.length > 3 ? " +" + (j.skills.length - 3) : ""), "neutral"));
    }
    if (Array.isArray(j.enabled_toolsets) && j.enabled_toolsets.length) {
      out.push(Badge(t("badgeToolsets") + " " + j.enabled_toolsets.slice(0, 3).join(", "), "neutral"));
    }
    if (j.repeat != null && j.repeat !== "" && isFinite(Number(j.repeat)) && Number(j.repeat) > 0) {
      out.push(Badge(t("repeat") + " " + Number(j.repeat), "neutral"));
    }
    return out;
  }
  function fmtBytes(n, locale) {
    if (n == null) return "—";
    var u = locale === "fr" ? ["o", "Ko", "Mo", "Go"] : ["B", "KB", "MB", "GB"];
    if (n >= 1e9) return (n / 1e9).toFixed(1) + " " + u[3];
    if (n >= 1e6) return Math.round(n / 1e6) + " " + u[2];
    if (n >= 1e3) return Math.round(n / 1e3) + " " + u[1];
    return n + " " + u[0];
  }

  /* ================= connectivity (error states) =================
     useJSON reports fetch failures to this tiny store; the always-mounted
     NetBanner (overlay slot) turns them into one dismissible banner, so a
     dead gateway or a failing endpoint is never a page of silent "—".
     Entries carry a timestamp and are pruned on a timer: a stale failure
     left behind by an unmounted page cannot pin the banner forever. */
  var NET = { fails: {}, seq: 0, subs: [] };
  function netEmit() { NET.subs.slice().forEach(function (fn) { fn(NET.fails, NET.seq); }); }
  function netNote(path, failed) {
    var k = String(path).split("?")[0];
    var now = Date.now();
    var changed = false;
    if (failed) {
      if (!NET.fails[k]) changed = true;
      NET.fails[k] = now;
    } else if (NET.fails[k]) {
      delete NET.fails[k];
      changed = true;
    }
    if (changed) { NET.seq += 1; netEmit(); }
  }
  function netPrune() {
    var now = Date.now(), changed = false;
    Object.keys(NET.fails).forEach(function (k) {
      if (now - NET.fails[k] > 150000) { delete NET.fails[k]; changed = true; }
    });
    if (changed) { NET.seq += 1; netEmit(); }
  }

  function useJSON(path, refreshMs, bump) {
    var st = useState(null); var data = st[0], setData = st[1];
    useEffect(function () {
      var alive = true;
      function load() {
        SDK.fetchJSON(path).then(function (d) {
          netNote(path, false);
          if (alive) setData(d);
        }).catch(function () {
          netNote(path, true);
        });
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
        try {
          irisAlert(t, { title: t("errTitle"), message: String((e && e.message) || e), tone: "danger", icon: "alert" });
        } catch (x) { /* noop */ }
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
  // the native router navigates through history.pushState without firing any
  // event: patch it once so usePath also follows native-initiated navigation
  if (!window.__IRIS_NAV_PATCHED__) {
    window.__IRIS_NAV_PATCHED__ = true;
    var __origPush = history.pushState.bind(history);
    history.pushState = function () {
      var r = __origPush.apply(null, arguments);
      try { dispatchEvent(new Event("iris:nav")); } catch (e) { /* noop */ }
      return r;
    };
  }
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
      addEventListener("iris:nav", on);
      return function () { removeEventListener("popstate", on); removeEventListener("iris:nav", on); };
    }, []);
    return st[0];
  }

  // The native shell redirects the root route "/" → "/sessions" on the first
  // render, before the plugin manifests finish loading in a fresh tab, so the
  // iris "/" override never wins on first paint. Once the shell has rebuilt the
  // routes (the home nav link proves the override is active), take the user
  // home if we are still sitting on a bare root/sessions landing.
  (function () {
    try {
      var bare = function () {
        var p = location.pathname;
        return (p === "/" || p === "/sessions") && !location.search && !location.hash;
      };
      if (!bare()) return;
      var tries = 0;
      var timer = setInterval(function () {
        tries++;
        var homeLink = false;
        try { homeLink = !!document.querySelector('a[href="/"]'); } catch (e) { /* noop */ }
        if (homeLink) {
          clearInterval(timer);
          if (bare() && location.pathname !== "/") navTo("/");
          return;
        }
        if (tries > 40) clearInterval(timer);
      }, 150);
    } catch (e) { /* noop */ }
  })();

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
    alert: [P("M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"), P("M12 9v4M12 17h.01")],
    puzzle: [P("M14 7h2a2 2 0 0 1 2 2v2h1.5a1.5 1.5 0 0 1 0 3H18v2a2 2 0 0 1-2 2h-2v-1.5a1.5 1.5 0 0 0-3 0V18H9a2 2 0 0 1-2-2v-2H5.5a1.5 1.5 0 0 1 0-3H7V9a2 2 0 0 1 2-2h2V5.5a1.5 1.5 0 0 1 3 0V7Z")],
    plus: [P("M12 5v14M5 12h14")],
    trash: [P("M4 7h16"), P("M9 7V4h6v3"), P("M6 7l1 13h10l1-13"), P("M10 11v6M14 11v6")],
    download: [P("M12 3v12"), P("m7 10 5 5 5-5"), P("M4 20h16")],
    upload: [P("M12 15V3"), P("m7 8 5-5 5 5"), P("M4 20h16")],
    refresh: [P("M21 12a9 9 0 1 1-2.6-6.4L21 8"), P("M21 3v5h-5")],
    eye: [P("M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Z"), C(12, 12, 2.8)],
    eyeOff: [P("M9.88 9.88a3 3 0 1 0 4.24 4.24"), P("M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"), P("M6.61 6.61A13.526 13.526 0 0 0 2 12s3.5 7 10 7a9.74 9.74 0 0 0 5.39-1.61"), P("m2 2 20 20")],
    play: [P("M7 4.5v15l12-7.5L7 4.5Z")],
    pause: [P("M8 5v14M16 5v14")],
    zap: [P("M13 2 3 14h7l-1 8 11-12h-7l1-8Z")],
    pencil: [P("M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"), P("m15 5 4 4")],
    dots: [C(5, 12, 1.6), C(12, 12, 1.6), C(19, 12, 1.6)],
    copy: [RC(9, 9, 12, 12, 2), P("M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1")],
    mic: [RC(9, 3, 6, 11, 3), P("M5 11a7 7 0 0 0 14 0"), P("M12 18v3")],
    caret: [P("m8 10 4 4 4-4")]
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
  function Tile(label, value, sub, href) {
    if (href) {
      return h("a", {
        className: "iris-card iris-tile iris-tile-link", href: href,
        onClick: function (e) { e.preventDefault(); navTo(href); }
      },
        h("div", { className: "iris-t-label" }, label),
        h("div", { className: "iris-t-value" }, value),
        h("div", { className: "iris-t-sub" }, sub || " "));
    }
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
  // icon comes last so existing call sites stay valid (mockup buttons all carry one)
  function Btn(label, onClick, kind, disabled, icon) {
    return h("button", { className: "iris-btn " + (kind || ""), onClick: onClick, disabled: !!disabled },
      icon ? Icon(icon, "sm") : null,
      h("span", { className: "iris-btn-txt" }, label));
  }
  function LinkTo(href, label) {
    return h("a", {
      className: "iris-link", href: href,
      onClick: function (e) { e.preventDefault(); navTo(href); }
    }, label + " →");
  }
  function Switch(on, onToggle, label) {
    return h("button", {
      className: "iris-switch" + (on ? " on" : ""), onClick: onToggle,
      role: "switch", "aria-checked": !!on, "aria-label": label || undefined, type: "button"
    });
  }
  function AutoTextArea(props) {
    var mref = { current: null };
    function grow() {
      var el = mref.current; if (!el) return;
      el.style.height = "auto"; el.style.height = (el.scrollHeight + 2) + "px";
    }
    useEffect(function () { grow(); }, [props.value]);
    return h("textarea", {
      ref: mref, className: "iris-input iris-textarea" + (props.className ? " " + props.className : ""),
      value: props.value, placeholder: props.placeholder || "", rows: props.rows || 2,
      onChange: function (e) { if (props.onChange) props.onChange(e); grow(); }
    });
  }
  function PageHead(title, desc, actions) {
    return h("div", { className: "iris-page-head" },
      h("div", null, h("h2", null, title), desc ? h("p", null, desc) : null),
      actions ? h("div", { className: "iris-actions" }, actions) : null);
  }
  var SCHED_DEFAULTS = { mode: "interval", intervalValue: 30, intervalUnit: "minutes", timeOfDay: "09:00", weekdays: [1, 2, 3, 4, 5], dayOfMonth: 1, onceAt: "", custom: "" };
  function pad2(v) { return String(v).length < 2 ? "0" + v : String(v); }
  function schedToExpr(st) {
    var mode = st && st.mode;
    var v = Math.floor(Number(st.intervalValue));
    if (mode === "interval") {
      if (!isFinite(v) || v < 1) return "";
      var u = st.intervalUnit === "hours" ? "h" : st.intervalUnit === "days" ? "d" : "m";
      return "every " + v + u;
    }
    if (mode === "daily") {
      var hm = String(st.timeOfDay || "09:00").split(":");
      return (pad2(hm[0]) || "9") + " " + (pad2(hm[1]) || "0") + " * * *";
    }
    if (mode === "weekly") {
      var whm = String(st.timeOfDay || "09:00").split(":");
      return (pad2(whm[0]) || "9") + " " + (pad2(whm[1]) || "0") + " * * " + ((st.weekdays && st.weekdays.length) ? st.weekdays.join(",") : "*");
    }
    if (mode === "monthly") {
      var d = Math.floor(Number(st.dayOfMonth));
      if (!isFinite(d) || d < 1 || d > 31) return "";
      var mhm = String(st.timeOfDay || "09:00").split(":");
      return (pad2(mhm[0]) || "9") + " " + (pad2(mhm[1]) || "0") + " " + d + " * *";
    }
    if (mode === "once") {
      var od = new Date(st.onceAt);
      if (!isFinite(od.getTime())) return "";
      return od.getFullYear() + "-" + pad2(od.getMonth() + 1) + "-" + pad2(od.getDate()) + "T" + pad2(od.getHours()) + ":" + pad2(od.getMinutes());
    }
    if (mode === "custom") return String(st.custom || "").trim();
    return "";
  }
  function schedToState(str) {
    var raw = String(str || "").trim();
    if (!raw) return { mode: "custom", custom: "" };
    var m = raw.match(/^every\s+(\d+)\s*(m|min|h|hr|hour|d|day)s?$/i);
    if (m) {
      var u = /h/i.test(m[2]) ? "hours" : /d/i.test(m[2]) ? "days" : "minutes";
      return { mode: "interval", intervalValue: Number(m[1]), intervalUnit: u };
    }
    m = raw.match(/^(\d+)\s*(m|min|h|hr|hour|d|day)s?$/i);
    if (m) {
      var u2 = /h/i.test(m[2]) ? "hours" : /d/i.test(m[2]) ? "days" : "minutes";
      return { mode: "interval", intervalValue: Number(m[1]), intervalUnit: u2 };
    }
    m = raw.match(/^(\d{1,2}):(\d{2})\s+(\d{1,2})\s+(\d{1,2})\s+\*\s+\*\s*$/);
    if (m) return { mode: "daily", timeOfDay: pad2(m[1]) + ":" + m[2] };
    m = raw.match(/^(\d{1,2}):(\d{2})\s+(\d{1,2})\s+(\d{1,2})\s+\*\s+([\d,]+)\s*$/);
    if (m) return { mode: "weekly", timeOfDay: pad2(m[1]) + ":" + m[2], weekdays: String(m[5]).split(",").map(Number) };
    m = raw.match(/^(\d{1,2}):(\d{2})\s+(\d{1,2})\s+(\d{1,2})\s+(\d{1,2})\s+\*\s*$/);
    if (m) return { mode: "monthly", timeOfDay: pad2(m[1]) + ":" + m[2], dayOfMonth: Number(m[3]) };
    m = raw.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
    if (m) return { mode: "once", onceAt: raw };
    return { mode: "custom", custom: raw };
  }
  function humanSched(st, t, locale) {
    var e = schedToExpr(st);
    if (!e) return "";
    if (st.mode === "interval") {
      var v = Math.floor(Number(st.intervalValue));
      if (!isFinite(v) || v < 1) return "";
      var u = { minutes: t("unitMinutes"), hours: t("unitHours"), days: t("unitDays") }[st.intervalUnit] || "";
      return "every " + v + " " + u;
    }
    if (st.mode === "once") {
      var d = new Date(st.onceAt);
      if (isFinite(d.getTime())) {
        try { return "once at " + d.toLocaleString(locale === "fr" ? "fr-FR" : "en-US"); } catch (x) { return e; }
      }
      return e;
    }
    return humanCron(e, locale) || e;
  }
  function jobSchedStr(j) {
    var s = j.schedule;
    if (s && typeof s === "object") {
      return txt(s.expr) || txt(s.run_at) || txt(s.display) || txt(s.value);
    }
    return txt(j.schedule_display) || txt(s) || txt(j.schedule);
  }
  function buildCronPayload(f) {
    var out = { name: f.name, prompt: f.prompt, schedule: f.schedule, deliver: f.deliver || "local" };
    if (f.skills && f.skills.length) out.skills = f.skills;
    if (f.provider) out.provider = f.provider;
    if (f.model) out.model = f.model;
    if (f.base_url) out.base_url = f.base_url;
    if (f.no_agent) out.no_agent = true;
    if (f.script) out.script = f.script;
    if (f.workdir) out.workdir = f.workdir;
    if (f.context_from && String(f.context_from).trim()) {
      out.context_from = String(f.context_from).split(/[\n,]/).map(function (x) { return x.trim(); }).filter(Boolean);
    }
    if (f.enabled_toolsets && f.enabled_toolsets.length) out.enabled_toolsets = f.enabled_toolsets;
    return out;
  }
  function CheckList(props) {
    var avail = props.available || [];
    var selected = props.selected || [];
    function toggle(name, on) {
      props.onChange(on
        ? (selected.indexOf(name) < 0 ? selected.concat([name]) : selected)
        : selected.filter(function (x) { return x !== name; }));
    }
    if (!avail.length) return h("p", { className: "iris-muted" }, props.emptyLabel);
    return h("div", { className: "iris-checklist" },
      avail.map(function (it, i) {
        var name = txt(it.name);
        var on = selected.indexOf(name) >= 0;
        return h("label", { key: i, className: "iris-check", title: txt(it.description) || undefined },
          h("input", { type: "checkbox", checked: on, onChange: function (e) { toggle(name, e.target.checked); } }),
          h("span", null, name));
      }));
  }
  function CronTimeField(props) {
    return h("input", { className: "iris-input", type: "time", value: props.value,
      onChange: function (e) { props.onChange(e.target.value); } });
  }
  function CronScheduleField(props) {
    var st = props.value;
    var t = props.t; var locale = props.locale;
    var set = function (patch) { props.onChange(Object.assign({}, st, patch)); };
    return h("div", { className: "iris-sched" },
      h("div", { className: "iris-field" }, h("label", null, t("scheduleMode")),
        h("div", { className: "iris-seg" },
          ["interval", "daily", "weekly", "monthly", "once", "custom"].map(function (mode, i) {
            var lbl = { interval: t("modeInterval"), daily: t("modeDaily"), weekly: t("modeWeekly"), monthly: t("modeMonthly"), once: t("modeOnce"), custom: t("modeCustom") }[mode];
            return h("button", { key: i, type: "button", className: "iris-seg-btn" + (st.mode === mode ? " on" : ""),
              onClick: function () { set({ mode: mode }); } }, lbl);
          }))),
      st.mode === "interval" ? h("div", { className: "iris-field-row" },
        h("div", { className: "iris-field" }, h("label", null, t("intervalEvery")),
          h("input", { className: "iris-input", type: "number", min: "1", value: st.intervalValue,
            onChange: function (e) { set({ intervalValue: e.target.value }); } })),
        h("div", { className: "iris-field" }, h("label", null, t("intervalUnit")),
          h("select", { className: "iris-input", value: st.intervalUnit,
            onChange: function (e) { set({ intervalUnit: e.target.value }); } },
            h("option", { value: "minutes" }, t("unitMinutes")),
            h("option", { value: "hours" }, t("unitHours")),
            h("option", { value: "days" }, t("unitDays"))))) : null,
      st.mode === "daily" ? h("div", { className: "iris-field-row" },
        h("div", { className: "iris-field" }, h("label", null, t("timeOfDay")),
          h(CronTimeField, { value: st.timeOfDay, onChange: function (v) { set({ timeOfDay: v }); } }))) : null,
      st.mode === "weekly" ? h("div", { className: "iris-field-row" },
        h("div", { className: "iris-field" }, h("label", null, t("timeOfDay")),
          h(CronTimeField, { value: st.timeOfDay, onChange: function (v) { set({ timeOfDay: v }); } })),
        h("div", { className: "iris-field" }, h("label", null, t("weekdays")),
          h("div", { className: "iris-days" },
            [0, 1, 2, 3, 4, 5, 6].map(function (w, i) {
              var on = (st.weekdays || []).indexOf(w) >= 0;
              var wd = { 0: t("wdSun"), 1: t("wdMon"), 2: t("wdTue"), 3: t("wdWed"), 4: t("wdThu"), 5: t("wdFri"), 6: t("wdSat") }[w];
              return h("button", { key: i, type: "button", className: "iris-day" + (on ? " on" : ""),
                onClick: function () {
                  var cur = st.weekdays || [];
                  set({ weekdays: on ? cur.filter(function (x) { return x !== w; }) : cur.concat([w]) });
                } }, wd);
            })))) : null,
      st.mode === "monthly" ? h("div", { className: "iris-field-row" },
        h("div", { className: "iris-field" }, h("label", null, t("timeOfDay")),
          h(CronTimeField, { value: st.timeOfDay, onChange: function (v) { set({ timeOfDay: v }); } })),
        h("div", { className: "iris-field" }, h("label", null, t("dayOfMonth")),
          h("input", { className: "iris-input", type: "number", min: "1", max: "31", value: st.dayOfMonth,
            onChange: function (e) { set({ dayOfMonth: e.target.value }); } }))) : null,
      st.mode === "once" ? h("div", { className: "iris-field-row" },
        h("div", { className: "iris-field" }, h("label", null, t("onceAt")),
          h("input", { className: "iris-input", type: "datetime-local", value: st.onceAt,
            onChange: function (e) { set({ onceAt: e.target.value }); } }))) : null,
      st.mode === "custom" ? h("div", { className: "iris-field" },
        h("label", null, t("customLabel")),
        h("input", { className: "iris-input iris-mono", placeholder: t("customPlaceholder"), value: st.custom,
          onChange: function (e) { set({ custom: e.target.value }); } }),
        h("small", { className: "iris-muted" }, t("customHint"))) : null,
      h("div", { className: "iris-field" }, h("label", null, t("schedulePreview")),
        h("div", { className: "iris-sched-preview" },
          h("span", { className: "iris-mono" }, schedToExpr(st) || "—"),
          h("small", { className: "iris-muted" }, humanSched(st, t, props.locale) || ""))));
  }
  function CronJobForm(props) {
    var locale = useLocale(); var t = makeT(locale);
    var job = props.job;
    var profile = props.profile || "default";
    var isEdit = !!(job && (job.id || job.job_id || job.name));
    var id = isEdit ? (job.id || job.job_id || job.name) : "";
    var res = props.resources || {};
    var n = useState(isEdit ? txt(job.name) || "" : "");
    var p = useState(isEdit ? txt(job.prompt) || "" : "");
    var ss = useState(isEdit ? schedToState(jobSchedStr(job)) : Object.assign({}, SCHED_DEFAULTS));
    var d = useState(isEdit ? txt(job.deliver || job.target) || "local" : "local");
    var sk = useState(isEdit ? (Array.isArray(job.skills) ? job.skills.filter(Boolean) : []) : []);
    var pr = useState(isEdit ? txt(job.provider) : "");
    var mo = useState(isEdit ? txt(job.model) : "");
    var bu = useState(isEdit ? txt(job.base_url) : "");
    var na = useState(!!(isEdit && job.no_agent));
    var sc = useState(isEdit ? txt(job.script) : "");
    var wd = useState(isEdit ? txt(job.workdir) : "");
    var cf = useState(isEdit ? (Array.isArray(job.context_from) ? job.context_from.join("\n") : txt(job.context_from)) : "");
    var ts = useState(isEdit ? (Array.isArray(job.enabled_toolsets) ? job.enabled_toolsets.filter(Boolean) : []) : []);
    var err = useState(null);
    var pq = "?profile=" + encProfile(profile);
    var targets = res.targets || [];
    var onlyLocal = targets.filter(function (x) { return x.id !== "local"; }).length === 0;
    var moData = res.models || {};
    var providers = Array.isArray(moData.providers)
      ? moData.providers.filter(function (prv) { return prv.authenticated !== false; }) : [];
    var curProv = providers.filter(function (p2) { return p2.slug === pr[0]; })[0];
    var models = (curProv && Array.isArray(curProv.models)) ? curProv.models : [];
    function submit() {
      var schedule = schedToExpr(ss[0]);
      if (!schedule) { err[1](t("errScheduleReq")); return; }
      var payload = buildCronPayload({
        name: n[0], prompt: p[0], schedule: schedule, deliver: d[0],
        skills: sk[0], provider: pr[0], model: mo[0], base_url: bu[0],
        no_agent: na[0], script: sc[0], workdir: wd[0],
        context_from: cf[0], enabled_toolsets: ts[0]
      });
      if (!payload.no_agent && !String(payload.prompt || "").trim() && !payload.script && !(payload.skills && payload.skills.length)) {
        err[1](t("errContentReq")); return;
      }
      if (payload.no_agent && !payload.script) { err[1](t("errNoAgentScript")); return; }
      err[1](null);
      if (isEdit) {
        actToast(t, "/api/cron/jobs/" + id + pq, jinit("PUT", { updates: payload }), t("updated"),
          function () { props.onClose(); props.onDone(); });
      } else {
        actToast(t, "/api/cron/jobs" + pq, jinit("POST", payload), t("created"),
          function () { props.onClose(); props.onDone(); });
      }
    }
    return Card(isEdit ? t("editJob") : t("newJob"), null, h("div", null,
      h("div", { className: "iris-field" }, h("label", null, t("nameLbl")),
        h("input", { className: "iris-input", value: n[0], onChange: function (e) { n[1](e.target.value); } })),
      h("div", { className: "iris-field" }, h("label", null, t("promptLbl")),
        h(AutoTextArea, { value: p[0], onChange: function (e) { p[1](e.target.value); } })),
      h(CronScheduleField, { t: t, locale: locale, value: ss[0], onChange: ss[1] }),
      h("div", { className: "iris-field" }, h("label", null, t("deliverTo")),
        h("select", { className: "iris-input", value: d[0], onChange: function (e) { d[1](e.target.value); } },
          targets.map(function (tg, i) {
            var lbl = tg.id === "local" ? t("deliveryLocal") : (txt(tg.name) || tg.id);
            if (tg.id !== "local" && !tg.home_target_set) lbl += " — " + t("homeChannelFirst");
            return h("option", { key: i, value: tg.id }, lbl);
          }),
          d[0] && !targets.some(function (x) { return x.id === d[0]; }) ? h("option", { value: d[0] }, d[0]) : null),
        onlyLocal ? h("p", { className: "iris-muted" }, t("deliveryNone")) : null),
      h("div", { className: "iris-field" }, h("label", null, t("skillsLbl")),
        h(CheckList, { available: res.skills, selected: sk[0], onChange: sk[1], emptyLabel: t("noSkillsAvail") }),
        h("small", { className: "iris-muted" }, t("skillsHint"))),
      h("details", { className: "iris-adv" },
        h("summary", null, t("advTitle")),
        h("div", { className: "iris-adv-body" },
          h("div", { className: "iris-field-row" },
            h("div", { className: "iris-field" }, h("label", null, t("provider")),
              h("select", { className: "iris-input", value: pr[0],
                onChange: function (e) { pr[1](e.target.value); mo[1](""); } },
                h("option", { value: "" }, t("defaultOpt")),
                providers.map(function (prv, i) { return h("option", { key: i, value: prv.slug }, txt(prv.name) || prv.slug); }),
                pr[0] && !providers.some(function (x) { return x.slug === pr[0]; }) ? h("option", { value: pr[0] }, pr[0]) : null)),
            h("div", { className: "iris-field" }, h("label", null, t("model")),
              h("select", { className: "iris-input", value: mo[0], onChange: function (e) { mo[1](e.target.value); } },
                h("option", { value: "" }, t("defaultOpt")),
                models.map(function (m, i) { return h("option", { key: i, value: m }, m); }),
                mo[0] && models.indexOf(mo[0]) < 0 ? h("option", { value: mo[0] }, mo[0]) : null))),
          h("div", { className: "iris-field" }, h("label", null, t("baseUrlLbl")),
            h("input", { className: "iris-input", placeholder: t("baseUrlPh"), value: bu[0], onChange: function (e) { bu[1](e.target.value); } })),
          h("div", { className: "iris-field-row" },
            h("div", { className: "iris-field" }, h("label", { className: "iris-check" },
              h("input", { type: "checkbox", checked: na[0], onChange: function (e) { na[1](e.target.checked); } }),
              h("span", null, t("noAgentLbl")))),
            h("div", { className: "iris-field" }, h("label", null, t("scriptLbl")),
              h("input", { className: "iris-input", placeholder: t("scriptPh"), value: sc[0], onChange: function (e) { sc[1](e.target.value); } }))),
          h("div", { className: "iris-field" }, h("label", null, t("workdirLbl")),
            h("input", { className: "iris-input", placeholder: t("workdirPh"), value: wd[0], onChange: function (e) { wd[1](e.target.value); } })),
          h("div", { className: "iris-field" }, h("label", null, t("contextFromLbl")),
            h("textarea", { className: "iris-input iris-textarea", placeholder: t("contextFromPh"), value: cf[0], onChange: function (e) { cf[1](e.target.value); } })),
          h("div", { className: "iris-field" }, h("label", null, t("toolsetsLbl")),
            h(CheckList, { available: res.toolsets, selected: ts[0], onChange: ts[1], emptyLabel: t("noToolsetsAvail") })))),
      err[0] ? h("p", { className: "iris-note", style: { color: "var(--color-destructive)" } }, err[0]) : null,
      h("div", { className: "iris-actions" },
        Btn(isEdit ? t("save") : t("create"), submit, "primary", false, isEdit ? "check" : "plus"),
        Btn(t("cancel"), props.onClose))));
  }
  function BlueprintCard(props) {
    var t = props.t; var locale = props.locale; var bp = props.bp; var profile = props.profile;
    var fields = Array.isArray(bp.fields) ? bp.fields : [];
    var open = useState(false);
    var vals = useState(function () {
      var o = {};
      fields.forEach(function (f) { o[f.name] = f.default != null ? f.default : ""; });
      return o;
    });
    var busy = useState(false); var err = useState(null);
    function setV(fname, nv) {
      vals[1](function (prev) { var o = Object.assign({}, prev); o[fname] = nv; return o; });
    }
    function fieldInput(f, i) {
      var v = vals[0][f.name] != null ? vals[0][f.name] : "";
      if (f.type === "enum" || f.type === "weekdays") {
        var opts = Array.isArray(f.options) ? f.options : [];
        return h("select", { className: "iris-input", value: v,
          onChange: function (e) { setV(f.name, e.target.value); } },
          opts.map(function (o, j) { return h("option", { key: j, value: o }, o); }),
          v && opts.indexOf(v) < 0 ? h("option", { value: v }, v) : null);
      }
      if (f.type === "time") {
        return h("input", { className: "iris-input", type: "time", value: v,
          onChange: function (e) { setV(f.name, e.target.value); } });
      }
      return h("input", { className: "iris-input", type: "text", placeholder: txt(f.help) || txt(f.label), value: v,
        onChange: function (e) { setV(f.name, e.target.value); } });
    }
    function submit() {
      busy[1](true); err[1](null);
      act(t, "/api/cron/blueprints/instantiate" + profileQuery(profile),
        jinit("POST", { blueprint: bp.key, values: vals[0] }),
        function (r) {
          busy[1](false);
          if (r !== null) {
            var sd = r && (r.schedule_display || r.schedule_display);
            toastPush(txt(bp.title) + " " + t("bpScheduled") + (sd ? " — " + sd : ""));
            open[1](false);
            props.onCreated();
          }
        });
    }
    return h("div", { className: "iris-mini" },
      h("div", { className: "mc-head" }, Icon("clock", "sm"), h("b", null, txt(bp.title) || bp.key)),
      h("p", null, txt(bp.description) || ""),
      h("div", { className: "iris-badges" },
        txt(bp.category) ? Badge(txt(bp.category), "neutral") : null,
        h("span", { title: txt(bp.schedule) || "" }, Badge(txt(bp.scheduleHuman) || txt(bp.schedule) || "?", "neutral")),
        (Array.isArray(bp.tags) && bp.tags.length) ? Badge(bp.tags.slice(0, 3).join(", "), "neutral") : null),
      open[0] ? h("div", { className: "iris-bp-fields" },
        fields.length ? fields.map(function (f, i) {
          return h("div", { className: "iris-field" },
            h("label", null, txt(f.label) || f.name),
            fieldInput(f, i),
            txt(f.help) && f.type !== "text" ? h("small", { className: "iris-muted" }, txt(f.help)) : null);
        }) : h("p", { className: "iris-muted" }, t("bpNoFields")),
        err[0] ? h("p", { className: "iris-note", style: { color: "var(--color-destructive)" } }, err[0]) : null,
        h("div", { className: "iris-actions" },
          Btn(t("bpInstantiate"), submit, "primary", busy[0], "plus"),
          Btn(t("cancel"), function () { open[1](false); })))
        : h("div", { className: "mc-foot" },
            Btn(t("bpSetup"), function () { open[1](true); }, "primary", false, "plus")));
  }
  function BlueprintsView(props) {
    var t = props.t; var locale = props.locale; var profile = props.profile;
    var bp = props.bpData;
    if (props.error) return h("p", { className: "iris-muted" }, t("bpLoadError") + ": " + props.error);
    if (bp === null) return h("p", { className: "iris-muted" }, t("bpLoading"));
    var list = asList(bp, ["blueprints"]);
    if (!list.length) return h("p", { className: "iris-muted" }, t("bpNone"));
    return h("div", { className: "iris-cards" },
      list.map(function (b, i) {
        return h(BlueprintCard, { key: i, t: t, locale: locale, profile: profile, bp: b, onCreated: props.onCreated });
      }));
  }
  function WebhookForm(props) {
    var t = props.t;
    var n = useState(""); var f = useState("");
    return Card(t("whNew"), null, h("div", null,
      h("div", { className: "iris-field" }, h("label", null, t("nameLbl")),
        h("input", { className: "iris-input", value: n[0], onChange: function (e) { n[1](e.target.value); } })),
      h("div", { className: "iris-field" }, h("label", null, t("whEvents")),
        h("input", { className: "iris-input", value: f[0], onChange: function (e) { f[1](e.target.value); } })),
      h("div", { className: "iris-actions" },
        Btn(t("create"), function () {
          if (!n[0]) return;
          act(t, "/api/webhooks", jinit("POST", { name: n[0], event: f[0] }), function (r) {
            if (r && (r.secret || r.signing_secret)) {
              irisAlert(t, {
                title: t("whNew"), subtitle: n[0], message: t("whSecretNote"),
                mono: String(r.secret || r.signing_secret), icon: "shield", tone: "warn"
              });
            } else if (r !== null) {
              toastPush(t("created"));
            }
            props.onClose(); props.onDone();
          });
        }, "primary", false, "plus"),
        Btn(t("cancel"), props.onClose))));
  }
  function WebhookCard(props) {
    var t = props.t;
    var w = props.w;
    var enabled = w.enabled !== false;
    var cp = useState(false); var copied = cp[0], setCopied = cp[1];
    var url = txt(props.baseUrl) + txt(w.path || ("/hooks/" + (w.name || "")));
    return h("section", { className: "iris-card", style: enabled ? undefined : { opacity: .6 } },
      h("div", { className: "iris-card-head" },
        h("h3", null, w.name || "webhook"),
        Badge(enabled ? t("active") : t("disabled"), enabled ? "good" : "neutral"),
        h("span", { className: "iris-spacer" }),
        Switch(enabled, function () { actToast(t, "/api/webhooks/" + (w.name) + "/enabled", jinit("PUT", { enabled: !enabled }), t("updated"), props.onDone); }, w.name || "webhook"),
        h("button", {
          className: "iris-link", style: { color: "var(--color-destructive)" },
          onClick: function () { askDelete(t, txt(w.name), function () { actToast(t, "/api/webhooks/" + w.name, jinit("DELETE"), t("deleted"), props.onDone); }); }
        }, t("deleteS"))),
      h("div", null,
        h("div", { style: { fontSize: "12px", color: "var(--color-muted-foreground,#8c8a9c)", marginBottom: "9px" } }, txt(w.description)),
        enabled ? h(React.Fragment, null,
          h("div", { className: "iris-input-row" },
            h("span", { className: "iris-key-val", style: { flex: 1 } }, url),
            Btn(copied ? t("copied") : t("copy"), function () {
              try {
                navigator.clipboard.writeText(url).then(function () {
                  setCopied(true); setTimeout(function () { setCopied(false); }, 1500);
                });
              } catch (e) { /* noop */ }
            }, "sm", false, "copy")),
          h("div", { className: "num", style: { display: "flex", gap: "14px", marginTop: "10px", fontSize: "11px", color: "var(--color-muted-foreground,#8c8a9c)" } },
            h("span", null, t("whEvents") + " : ", h("b", null, txt(w.event || w.filter) || "*")),
            h("span", null, t("target") + " : ", h("b", null, txt(w.deliver || w.target) || "local")))
        ) : null));
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
  // mockup primitives: 28px letter avatar, pulsing live dot, model pill, section subhead
  function Avatar(text, kind) { return h("span", { className: "iris-avatar " + (kind || "") }, text); }
  function LiveDot() { return h("span", { className: "iris-live-dot" }); }
  function ModelBadge(text, cls) { return h("span", { className: "iris-model-badge " + (cls || "") }, text); }
  function Subhead(text) { return h("div", { className: "iris-subhead" }, text); }
  function IconBtn(icon, onClick, title) {
    return h("button", {
      className: "iris-icon-btn", onClick: onClick,
      title: title || undefined, "aria-label": title || undefined, type: "button"
    }, Icon(icon, "sm"));
  }
  function Table(cols, rows) {
    return h("div", { className: "iris-card iris-table-card", style: { overflowX: "auto" } },
      h("table", { className: "iris-table" },
        h("thead", null, h("tr", null, cols.map(function (c, i) {
          return h("th", { key: i, className: (c.r ? "r " : "") + (c.m ? "hide-m" : "") }, c.l);
        }))),
        h("tbody", null, rows)));
  }

  /* ================= dialogs =================
     Replaces window.prompt/confirm/alert everywhere: the native popups are
     chrome-styled and break the visual language. A single dialog lives in the
     overlay slot (always mounted) and is driven by this tiny store, so any page
     can await a modal without owning the markup. */
  var DLG = { cur: null, seq: 0, hosts: 0, subs: [] };
  function dlgEmit() { DLG.subs.slice().forEach(function (fn) { fn(DLG.cur); }); }
  // Fallback when no Iris overlay is mounted: without a host the promise would
  // stay pending forever and the action would silently never happen.
  function dlgNative(spec) {
    if (spec.kind === "prompt") return prompt(spec.title, spec.value || "");
    if (spec.kind === "confirm") return confirm(spec.message || spec.title);
    alert([spec.title, spec.message, spec.mono].filter(Boolean).join("\n"));
    return true;
  }
  function closeDialog(id, value) {
    var c = DLG.cur;
    if (!c || c.id !== id) return;
    DLG.cur = null;
    dlgEmit();
    c.resolve(value);
  }
  function openDialog(spec) {
    if (!DLG.hosts) return Promise.resolve(dlgNative(spec));
    if (DLG.cur) closeDialog(DLG.cur.id, DLG.cur.spec.kind === "confirm" ? false : null);
    DLG.seq += 1;
    var id = DLG.seq;
    return new Promise(function (resolve) {
      DLG.cur = { id: id, spec: spec, resolve: resolve };
      dlgEmit();
    });
  }
  // resolves the typed value, or null when cancelled
  function irisPrompt(t, opts) {
    return openDialog({
      kind: "prompt", icon: opts.icon || "key", tone: opts.tone || "iris",
      title: opts.title, subtitle: opts.subtitle, label: opts.label || t("keyValueLbl"),
      value: opts.value || "", placeholder: opts.placeholder || "", secret: !!opts.secret,
      hint: opts.hint || "", ok: opts.ok || t("save"), cancel: t("cancel")
    });
  }
  // resolves true / false
  function irisConfirm(t, opts) {
    return openDialog({
      kind: "confirm", icon: opts.icon || "alert", tone: opts.tone || "warn",
      title: opts.title || t("confirmTitle"), subtitle: opts.subtitle,
      message: opts.message, mono: opts.mono,
      ok: opts.ok || t("dlgOk"), cancel: t("cancel")
    });
  }
  function irisAlert(t, opts) {
    return openDialog({
      kind: "alert", icon: opts.icon || "check", tone: opts.tone || "iris",
      title: opts.title, subtitle: opts.subtitle, message: opts.message, mono: opts.mono,
      ok: opts.ok || t("dlgClose")
    });
  }
  // the "delete X?" flow, identical on every page
  function askDelete(t, name, done) {
    irisConfirm(t, {
      title: t("deleteS"), subtitle: name, message: t("confirmDelete", name),
      tone: "danger", icon: "trash", ok: t("deleteS")
    }).then(function (ok) { if (ok) done(); });
  }
  var DLG_TONE = { iris: "iris-i", warn: "warn-i", danger: "crit-i", good: "good-i" };
  function DialogBox(props) {
    var d = props.d, spec = d.spec;
    var t = makeT(useLocale());
    var vs = useState(spec.value || ""); var val = vs[0], setVal = vs[1];
    var rv = useState(false); var reveal = rv[0], setReveal = rv[1];
    var isPrompt = spec.kind === "prompt";
    var mref = { current: null };
    function cancel() { closeDialog(d.id, spec.kind === "confirm" ? false : (isPrompt ? null : true)); }
    function submit() {
      if (!isPrompt) return closeDialog(d.id, true);
      if (!val) return;
      closeDialog(d.id, val);
    }
    useEffect(function () {
      var prev = document.activeElement;
      function onKey(e) {
        if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); cancel(); return; }
        // focus trap: Tab / Shift+Tab cycle inside the dialog, never beyond it
        if (e.key === "Tab" && mref.current) {
          var nodes = mref.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
          var list = Array.prototype.filter.call(nodes, function (n) {
            return !n.disabled && n.offsetParent !== null;
          });
          if (!list.length) return;
          var first = list[0], last = list[list.length - 1], cur = document.activeElement;
          if (e.shiftKey) {
            if (cur === first || !mref.current.contains(cur)) { e.preventDefault(); last.focus(); }
          } else if (cur === last || !mref.current.contains(cur)) {
            e.preventDefault(); first.focus();
          }
        }
      }
      document.addEventListener("keydown", onKey, true);
      return function () {
        document.removeEventListener("keydown", onKey, true);
        try { if (prev && prev.focus) prev.focus(); } catch (e) { /* noop */ }
      };
    }, [d.id]);
    var body = isPrompt
      ? h("div", { className: "iris-modal-body" },
          h("div", { className: "iris-field", style: { marginBottom: 0 } },
            spec.label ? h("label", null, spec.label) : null,
            h("div", { className: "iris-secret-wrap" },
              h("input", {
                className: "iris-input", type: (spec.secret && !reveal) ? "password" : "text",
                value: val, placeholder: spec.placeholder || "", autoFocus: true,
                spellCheck: false, autoComplete: "off",
                onChange: function (e) { setVal(e.target.value); },
                onKeyDown: function (e) { if (e.key === "Enter") { e.preventDefault(); submit(); } }
              }),
              spec.secret ? IconBtn(reveal ? "x" : "eye", function () { setReveal(!reveal); },
                reveal ? t("keyHide") : t("keyReveal")) : null),
            spec.hint ? h("div", { className: "iris-hint" }, spec.hint) : null))
      : h("div", { className: "iris-modal-body" },
          spec.message ? h("p", null, spec.message) : null,
          spec.mono ? h("pre", { className: "iris-modal-pre" }, spec.mono) : null);
    return h("div", {
      className: "iris-modal-scrim",
      onMouseDown: function (e) { if (e.target === e.currentTarget) cancel(); }
    },
      h("div", { className: "iris-modal", ref: mref, role: "dialog", "aria-modal": "true", "aria-label": spec.title },
        h("div", { className: "iris-modal-head" },
          h("span", { className: "iris-icbox " + (DLG_TONE[spec.tone] || "iris-i") }, Icon(spec.icon || "cog")),
          h("div", { className: "iris-modal-title" },
            h("b", null, spec.title),
            spec.subtitle ? h("small", null, spec.subtitle) : null),
          IconBtn("x", cancel, t("cancel"))),
        body,
        h("div", { className: "iris-modal-foot" },
          spec.kind === "alert" ? null : Btn(spec.cancel || t("cancel"), cancel),
          h("button", {
            className: "iris-btn " + (spec.tone === "danger" ? "danger" : "primary"),
            onClick: submit, autoFocus: !isPrompt, disabled: isPrompt && !val
          }, h("span", { className: "iris-btn-txt" }, spec.ok)))));
  }
  function ModalHost() {
    var st = useState(DLG.cur); var cur = st[0], setCur = st[1];
    useEffect(function () {
      function on(c) { setCur(c); }
      DLG.hosts += 1;
      DLG.subs.push(on);
      setCur(DLG.cur);
      return function () {
        DLG.hosts -= 1;
        var i = DLG.subs.indexOf(on);
        if (i >= 0) DLG.subs.splice(i, 1);
      };
    }, []);
    return cur ? h(DialogBox, { key: cur.id, d: cur }) : null;
  }

  /* ================= toasts =================
     Transient success feedback — the mirror of the error modal: errors alert,
     every completed action says so with a self-dismissing toast. Same pattern
     as DLG: a tiny store, the Toaster in the overlay slot owns the markup. */
  var TOAST = { items: [], seq: 0, subs: [] };
  function toastEmit() { TOAST.subs.slice().forEach(function (fn) { fn(TOAST.items.slice()); }); }
  function toastPush(msg, kind) {
    var id = ++TOAST.seq;
    TOAST.items.push({ id: id, msg: msg, kind: kind || "good" });
    if (TOAST.items.length > 4) TOAST.items.shift();
    toastEmit();
    setTimeout(function () { toastDismiss(id); }, 3200);
    return id;
  }
  function toastDismiss(id) {
    var i = -1;
    TOAST.items.forEach(function (x, n) { if (x.id === id) i = n; });
    if (i >= 0) { TOAST.items.splice(i, 1); toastEmit(); }
  }
  // act() + a success toast (only when the request didn't fail) + optional reload
  function actToast(t, path, init, msg, reload) {
    act(t, path, init, function (r) {
      if (r !== null) toastPush(msg);
      if (reload) reload();
    });
  }
  // localized relative time: the SDK's timeAgo wins when it exists, otherwise
  // fall back to "just now / 5 min ago / 3 h ago / 2 d ago" (or a plain date)
  function fmtRel(v, t, locale) {
    try {
      var s = timeAgo(v);
      if (s) return s;
    } catch (e) { /* noop */ }
    if (v == null || v === "") return "";
    var ms;
    try { ms = new Date(v).getTime(); } catch (e) { return txt(v); }
    if (!isFinite(ms)) return txt(v);
    var mins = Math.round((Date.now() - ms) / 60000);
    if (mins < 1) return t("timeJustNow");
    if (mins < 60) return t("timeMinAgo", mins);
    if (mins < 1440) return t("timeHourAgo", Math.floor(mins / 60));
    if (mins < 10080) return t("timeDayAgo", Math.floor(mins / 1440));
    return new Date(ms).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US");
  }
  // persisted state: useState seeded from localStorage, written back on change
  function lsGet(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* noop */ } }
  function usePersist(key, init) {
    var st = useState(function () { return lsGet(key, init); });
    var v = st[0], setV = st[1];
    useEffect(function () { lsSet(key, v); }, [key, v]);
    return st;
  }

  /* ================= chart ================= */
  function BarChart(props) {
    var days = props.days || [], t = props.t;
    var hv = useState(-1); var hover = hv[0], setHover = hv[1];
    if (!days.length) return Empty(t("usageUnavailable"));
    var W = 640, H = 190, padL = 42, padR = 6, padT = 12, padB = 22;
    // round the axis ceiling up to a "nice" value (1/2/2.5/5/10 x 10^n) above the data max
    function niceMax(v) {
      if (!v || !isFinite(v) || v <= 0) return 1;
      var exp = Math.floor(Math.log(v) / Math.LN10);
      var f = v / Math.pow(10, exp);
      var nf = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
      return nf * Math.pow(10, exp);
    }
    var dataMax = Math.max.apply(null, days.map(function (d) { return d.tokens || 0; })) || 0;
    var max = niceMax(dataMax) || 1;
    var plotW = W - padL - padR, plotH = H - padT - padB;
    var slot = plotW / days.length, bw = Math.min(30, slot * 0.58);
    var kids = [];
    [0, 1 / 3, 2 / 3, 1].forEach(function (f, gi) {
      var y = padT + plotH - f * plotH;
      kids.push(h("line", { key: "g" + gi, x1: padL, x2: W - padR, y1: y, y2: y, className: "iris-grid" }));
      kids.push(h("text", { key: "t" + gi, x: padL - 8, y: y + 3.5, textAnchor: "end", className: "iris-axis" },
        fmtTokens(Math.round(max * f))));
    });
    var peak = 0;
    days.forEach(function (d, i) { if ((d.tokens || 0) > (days[peak].tokens || 0)) peak = i; });
    days.forEach(function (d, i) {
      var bh = Math.max(4, (d.tokens / max) * plotH);
      var x = padL + i * slot + (slot - bw) / 2, y = padT + plotH - bh;
      kids.push(h("rect", {
        key: "b" + i, x: x, y: y, width: bw, height: bh, rx: 3,
        className: "iris-bar" + (hover === i ? " hover" : ""),
        style: { fill: "var(--iris-series-1, var(--color-primary))" },
        onMouseEnter: function () { setHover(i); }, onMouseLeave: function () { setHover(-1); }
      }));
      if (i === peak) kids.push(h("text", {
        key: "pk", x: x + bw / 2, y: Math.max(10, y - 7), textAnchor: "middle",
        style: { fontSize: "10px", fontWeight: 600, fill: "var(--color-foreground, inherit)" }
      }, fmtTokens(d.tokens)));
      if (i % 2 === 1) kids.push(h("text", { key: "x" + i, x: x + bw / 2, y: H - 6, textAnchor: "middle", className: "iris-axis" },
        String(d.date).slice(5)));
    });
    var tip = hover >= 0 ? h("div", { className: "iris-tt" },
      h("b", null, days[hover].date),
      h("div", null, t("tokens") + " : " + fmtTokens(days[hover].tokens)),
      h("div", null, t("cost") + " : " + fmtCost(days[hover].cost)),
      days[hover].cache != null ? h("div", null, t("cache") + " : " + Math.round(days[hover].cache) + " %") : null) : null;
    return h("div", { className: "iris-chart-wrap" },
      h("svg", { viewBox: "0 0 " + W + " " + H, className: "iris-chart", role: "img", "aria-label": t("chartAria") }, kids), tip);
  }

  function normDaily(usage) {
    var days = asList(usage, ["daily", "days", "usage", "chart"]);
    return days.map(function (d) {
      var tokens = firstNum(d.total_tokens, d.tokens,
        (firstNum(d.input_tokens, d.input) || 0) + (firstNum(d.output_tokens, d.output) || 0) || undefined);
      var cacheRead = firstNum(d.cache_read_tokens, d.cache_read);
      return {
        date: d.date || d.day || "",
        tokens: tokens,
        cost: firstNum(d.cost, d.estimated_cost),
        cache: firstNum(d.cache_rate, d.cache, (cacheRead != null && tokens) ? cacheRead / tokens * 100 : undefined),
        sessions: firstNum(d.sessions, d.session_count)
      };
    }).filter(function (d) { return d.tokens != null; });
  }

  /* ================= HOME ================= */
  // pulsing placeholder shown until the first Home fetches land (or ~3s elapse)
  function HomeSkeleton() {
    return h("div", { className: "iris-home iris-skel", "aria-busy": "true" },
      h("div", { className: "iris-page-head" },
        h("div", { className: "iris-skel-bar", style: { width: 190, height: 22 } })),
      h("div", { className: "iris-tiles" }, [0, 1, 2, 3].map(function (i) {
        return h("div", { className: "iris-skel-card", key: i, style: { padding: 14 } },
          h("div", { className: "iris-skel-bar", style: { width: "45%", height: 11 } }),
          h("div", { className: "iris-skel-bar", style: { width: "70%", height: 26, marginTop: 10 } }));
      })),
      h("div", { className: "iris-cols" },
        h("div", { className: "iris-col-main" }, [0, 1].map(function (i) {
          return h("div", { className: "iris-skel-card", key: i, style: { minHeight: 150 } });
        })),
        h("div", { className: "iris-col-side" },
          h("div", { className: "iris-skel-card", style: { minHeight: 190 } }))));
  }
  function HomePage() {
    var locale = useLocale(); var t = makeT(locale);
    var bp = useState(0); var bump = bp[0], setBump = bp[1];
    var pd = useState(14); var period = pd[0], setPeriod = pd[1];
    var status = useJSON("/api/status", 5000);
    var sessions = useJSON("/api/sessions", 15000);
    var usage14 = useJSON("/api/analytics/usage?days=14", 60000);
    var usagePeriod = useJSON("/api/analytics/usage?days=" + period, 60000);
    var cron = useJSON("/api/cron/jobs", 30000);
    var pairing = useJSON("/api/pairing", 30000, bump);
    var memory = useJSON("/api/memory", 120000);
    var skills = useJSON("/api/skills", 120000);
    var curator = useJSON("/api/curator", 60000);
    var sysStats = useJSON("/api/system/stats", 20000);
    var platforms = useJSON("/api/messaging/platforms", 30000);
    var env = useJSON("/api/env", 60000);

    // P0 loading gate: skeleton while the primary fetches are still in flight,
    // with a ~3s failsafe so a slow gateway can't hold the page hostage.
    // NOTE: this return sits after every hook (rules of hooks — HomeSkeleton
    // must never be returned mid-hook-chain).
    var sk = useState(false); var skElapsed = sk[0], setSkElapsed = sk[1];
    useEffect(function () {
      var t = setTimeout(function () { setSkElapsed(true); }, 3000);
      return function () { clearTimeout(t); };
    }, []);

    // tiles always read a fixed 14-day window; the usage card below has its
    // own period-driven fetch (7 / 14 / 30 j chips) so switching periods
    // there doesn't perturb the "cost/tokens today" tiles.
    var days14 = useMemo(function () { return normDaily(usage14); }, [usage14]);
    var last = days14.length ? days14[days14.length - 1] : null;
    var avg7 = null;
    if (days14.length >= 2) {
      var w = days14.slice(-8, -1).filter(function (d) { return d.cost != null; });
      if (w.length) avg7 = w.reduce(function (s, d) { return s + d.cost; }, 0) / w.length;
    }
    var daysPeriod = useMemo(function () { return normDaily(usagePeriod); }, [usagePeriod]);
    if (!skElapsed && status == null && sessions == null) return HomeSkeleton();

    var sessList = asList(sessions, ["sessions", "items", "recent"]);
    var active = firstNum(status && status.active_sessions, status && status.activeSessions);
    var jobs = asList(cron, ["jobs", "items"]);
    var activeJobs = jobs.filter(function (j) { return !isPausedJob(j); }).length;
    var pending = asList(pairing, ["pending", "requests"]);
    var plats = asList(platforms, ["platforms", "items"]);
    var skillList = asList(skills, ["skills", "items"]);
    var enabledSkills = skillList.filter(function (s) { return s.enabled !== false; }).length;
    var memFiles = memory ? asList(memory.builtin_files, ["builtin_files", "files", "sizes", "stores"]) : [];
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

    var todayKey = new Date().toDateString();
    function isToday(v) {
      if (!v) return false;
      try { return new Date(v).toDateString() === todayKey; } catch (e) { return false; }
    }
    var sessionsToday = sessList.filter(function (s) { return isToday(s.last_activity_at || s.started_at); }).length;

    // big-number-with-small-unit tile value, e.g. "1,87" + small(" $")
    function splitUnit(str) {
      var m = /^(.*\S)\s+(\S+)$/.exec(str || "");
      return m ? h(React.Fragment, null, m[1], h("small", null, " " + m[2])) : (str || "—");
    }

    function reload() { setBump(bump + 1); }

    var alerts = [];
    pending.forEach(function (p, i) {
      alerts.push(h("div", { className: "iris-row", key: "pr" + i },
        h("span", { className: "iris-icbox warn-i" }, Icon("link")),
        h("span", { className: "iris-row-body" },
          h("b", null, t("pairing") + " " + (txt(p.platform) || "")),
          h("small", null, (txt(p.user || p.username || p.code) || "") + " · " + t("pairingCode") + " " + (txt(p.code) || "?")),
          h("span", { style: { display: "flex", gap: "6px", marginTop: "7px" } },
            Btn(t("approve"), function () {
              actToast(t, "/api/pairing/approve", jinit("POST", { platform: p.platform, code: p.code }), t("updated"), reload);
            }, "sm primary"),
            Btn(t("reject"), function () {
              actToast(t, "/api/pairing/revoke", jinit("POST", { platform: p.platform, user_id: p.user_id || p.user }), t("updated"), reload);
            }, "sm")))));
    });
    if (env) {
      // cap at 2 alerts: real instances expose hundreds of optional unset keys
      var missingShown = 0;
      Object.keys(env).forEach(function (k) {
        var v = env[k] || {};
        if (missingShown < 2 && v.is_set === false && v.required) {
          missingShown++;
          alerts.push(IconRow("key", "iris-i", t("missingKey"), k,
            Btn(t("configure"), function () { navTo("/env"); }, "sm")));
        }
      });
    }
    plats.forEach(function (p) {
      var enabled = p.enabled === true;
      var connected = p.connected === true || p.status === "connected" || p.state === "connected";
      if (enabled && p.configured !== false && !connected) {
        alerts.push(IconRow("radio", "warn-i", t("channelDisconnected", p.name || p.label || p.id || "?"),
          t("channelEnabledNotConnected"), LinkTo("/channels", t("check"))));
      }
    });

    // usage-card totals (period-driven)
    var sumTokens = daysPeriod.reduce(function (s, d) { return s + (d.tokens || 0); }, 0);
    var costDays = daysPeriod.filter(function (d) { return d.cost != null; });
    var sumCost = costDays.length ? costDays.reduce(function (s, d) { return s + d.cost; }, 0) : null;
    var cacheDays = daysPeriod.filter(function (d) { return d.cache != null; });
    var avgCache = cacheDays.length ? cacheDays.reduce(function (s, d) { return s + d.cache; }, 0) / cacheDays.length : null;

    // channels & system grouping (mockup style)
    function isConn(p) { return p.connected === true || p.status === "connected" || p.state === "connected"; }
    var connectedPlats = plats.filter(function (p) { return p.enabled && isConn(p) && !p.error_message; });
    var errorPlats = plats.filter(function (p) { return !!p.error_message; });
    var otherPlats = plats.filter(function (p) {
      if (p.error_message) return false;
      if (p.enabled && isConn(p)) return false;
      return p.enabled || p.configured;
    });
    function ChanRow(state, label, meta, metaStyle) {
      return h("div", { className: "iris-row", key: "c" + label },
        Dot(state),
        h("span", { className: "iris-row-body" }, h("b", null, label)),
        meta != null ? h("span", { className: "iris-row-meta", style: metaStyle || null }, meta) : null);
    }
    var chanRows = [ChanRow(gwOnline ? "ok" : "err", t("gateway"),
      gwOnline ? (t("online") + (status && status.gateway_updated_at ? " · " + fmtRel(status.gateway_updated_at, t, locale) : "")) : t("gatewayDown"))];
    if (connectedPlats.length) {
      chanRows.push(ChanRow("ok", connectedPlats.map(function (p) { return txt(p.name || p.label || p.id); }).join(" · "), t("connected")));
    }
    errorPlats.forEach(function (p, i) {
      chanRows.push(h("div", { className: "iris-row", key: "e" + i },
        Dot("err"),
        h("span", { className: "iris-row-body" }, h("b", null, txt(p.name || p.label || p.id) || "?")),
        h("span", { className: "iris-row-meta", style: { color: "var(--color-warning)" } }, txt(p.error_message) || t("authExpired"))));
    });
    if (otherPlats.length) {
      chanRows.push(ChanRow("off", otherPlats.map(function (p) { return txt(p.name || p.label || p.id); }).join(" · "), t("disabled")));
    }

    var providerName = txt(memory && (memory.provider || memory.active)) || "—";
    var curatorPaused = !!(curator && curator.paused);

    // cron tile icon mirrors the jobs state: green check only once a job has
    // actually run and succeeded, red cross while running but failing,
    // neutral clock when active but never run, amber pause when on hold
    var cronHasActive = activeJobs > 0;
    var cronFailing = jobs.some(function (j) { return !isPausedJob(j) && (j.last_status === "error" || j.last_status === "failed" || j.last_error); });
    var cronHealthy = jobs.some(function (j) { return !isPausedJob(j) && lastRunOf(j) && !(j.last_status === "error" || j.last_status === "failed" || j.last_error); });
    var cronPaused = jobs.length > 0 && !cronHasActive;
    var cronIcon = cronPaused ? "pause" : cronFailing ? "x" : cronHealthy ? "check" : "clock";
    var cronKind = cronPaused ? "warn-i" : cronFailing ? "crit-i" : cronHealthy ? "good-i" : "iris-i";

    return h("div", { className: "iris-home" },
      PageHead(t("hello"),
        (gwOnline ? t("gatewayOnline") : t("gatewayDown")) +
        (active != null ? " · " + active + " " + t("activeSessionsSuffix") : "") +
        (status && status.version ? " · v" + status.version : ""),
        [Btn(t("doctor"), function () {
          act(t, "/api/ops/doctor", jinit("POST"), function (r) {
            if (r !== null) irisAlert(t, { title: t("doctor"), message: t("launched", t("doctor")), icon: "term" });
          });
        }, "", false, "term"),
         Btn(t("newSession"), function () { navTo("/chat"); }, "primary", false, "plus")]),

      h("div", { className: "iris-tiles" },
        Tile(TL("coin", t("costToday")), last ? splitUnit(fmtCost(last.cost, locale)) : "—",
          avg7 != null ? t("avg7d", fmtCost(avg7, locale)) : t("viaAnalytics"), "/analytics"),
        Tile(TL("chart", t("tokensLastDay")), last ? splitUnit(fmtTokens(last.tokens, locale)) : "—",
          last && last.cache != null ? t("cacheRate", Math.round(last.cache)) : " ", "/analytics"),
        Tile(TL("hist", t("activeSessions")), active != null ? String(active) : "—",
          t("sessionsToday", sessionsToday), "/sessions"),
        Tile(h(React.Fragment, null, h("span", { className: "iris-icbox " + cronKind }, Icon(cronIcon)), t("nextAutomation")),
          nextJob ? txt(nextJob.name) || "job" : (jobs.length ? txt(jobs[0].name) || jobs.length + " " + t("jobs") : "—"),
          nextJob && nextRunOf(nextJob) ? t("inTime", timeUntil(nextRunOf(nextJob), locale)) + " · " + t("jobsActive", activeJobs)
            : (jobs.length ? schedStr(jobs[0]) : t("noScheduledJob")), "/cron")),

      h("div", { className: "iris-cols" },
        h("div", { className: "iris-col-main" },
          Card(t("automationsLastRuns"), null,
            jobs.length ? jobs.slice(0, 5).map(function (j, i) {
              var lastRun = lastRunOf(j);
              var hhmm = "";
              if (lastRun) {
                try { hhmm = new Date(lastRun).toLocaleTimeString(locale === "fr" ? "fr-FR" : "en-US", { hour: "2-digit", minute: "2-digit" }); }
                catch (e) { /* noop */ }
              }
              // a paused job is not "ok"; a job that never ran has no verdict
              if (isPausedJob(j)) {
                return h("a", { key: i, className: "iris-row-link", href: "/cron",
                    onClick: function (e) { e.preventDefault(); navTo("/cron"); } },
                  IconRow("pause", "warn-i", txt(j.name) || "job", t("paused") + (j.deliver ? " · " + txt(j.deliver) : ""),
                    h(React.Fragment, null, hhmm, " ", Badge(t("paused"), "warn"))));
              }
              if (!lastRun) {
                return h("a", { key: i, className: "iris-row-link", href: "/cron",
                    onClick: function (e) { e.preventDefault(); navTo("/cron"); } },
                  IconRow("clock", "iris-i", txt(j.name) || "job", t("neverRun") + (j.deliver ? " · " + txt(j.deliver) : ""),
                    h(React.Fragment, null, "—", " ", Badge(t("neverRun"), "neutral"))));
              }
              var fail = !!(j.last_status === "error" || j.last_status === "failed" || j.last_error);
              return h("a", { key: i, className: "iris-row-link", href: "/cron",
                  onClick: function (e) { e.preventDefault(); navTo("/cron"); } },
                IconRow(fail ? "x" : "check", fail ? "crit-i" : "good-i", txt(j.name) || "job",
                  (fail ? txt(j.last_error || j.last_status) : t("executed")) + (j.deliver ? " · " + txt(j.deliver) : ""),
                  h(React.Fragment, null, hhmm, " ", Badge(fail ? "err" : "ok", fail ? "crit" : "good"))));
            }) : Empty(t("noCronJob"))),
          Card(t("usage14d"),
            [h("span", { className: "iris-muted", key: "m" }, t("chartAria").toLowerCase()),
             h("span", { className: "iris-spacer", key: "sp" }),
             Chips([{ v: 7, l: t("period", 7) }, { v: 14, l: t("period", 14) }, { v: 30, l: t("period", 30) }], period, setPeriod)],
            [h(BarChart, { days: daysPeriod, t: t, key: "bc" }),
             h("div", { className: "iris-chart-foot", key: "f" },
               h("span", null, t("total") + " ", h("b", null, fmtTokens(sumTokens, locale))),
               h("span", null, t("cost") + " ", h("b", null, fmtCost(sumCost, locale))),
               h("span", null, t("cacheAvg") + " ", h("b", null, avgCache != null ? Math.round(avgCache) + " %" : "—")),
               h("span", { style: { marginLeft: "auto" } }, LinkTo("/analytics", t("navAnalytics"))))]),
          Card(t("recentSessions"), LinkTo("/sessions", t("all")),
            sessList.length ? (function () {
              var live = sessList.filter(function (s) { return s.is_active === true; });
              return (live.length ? live : sessList).slice(0, 6).map(function (s, i) {
                var src = String(s.source || "");
                var sic = /cron/.test(src) ? "clock" : /telegram|discord|slack|whatsapp|signal/.test(src) ? "msg" : /mail|email/.test(src) ? "mail" : "term";
                var id = s.id || "";
                var inTok = firstNum(s.input_tokens), outTok = firstNum(s.output_tokens);
                var tok = (inTok != null || outTok != null) ? (inTok || 0) + (outTok || 0) : null;
                return h("div", {
                  key: i,
                  onClick: id ? function () { navTo("/chat?resume=" + encodeURIComponent(id)); } : null,
                  tabIndex: id ? 0 : null, role: id ? "link" : null,
                  onKeyDown: id ? function (e) {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      navTo("/chat?resume=" + encodeURIComponent(id));
                    }
                  } : null,
                  style: { cursor: id ? "pointer" : "default" }
                },
                  IconRow(sic, "",
                    h(React.Fragment, null, s.is_active ? LiveDot() : null, txt(s.title || s.display_name || s.preview || id) || "session"),
                    txt(s.preview) || fmtRel(s.last_activity_at, t, locale) || "",
                    h("span", { style: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "3px" } },
                      ModelBadge(txt(s.model)), h("b", { className: "num" }, fmtTokens(tok, locale)))));
              });
            })() : Empty(t("noRecentSession")))),
        h("div", { className: "iris-col-side" },
          Card(t("needsAttention"), Badge(String(alerts.length), alerts.length ? "warn" : "good"),
            alerts.length ? alerts : Empty(t("nothingPending"))),
          Card(t("memorySkills"), LinkTo("/system", t("manage")),
            [Meter(t("memory"), memTotal != null ? Math.min(100, memTotal / 2e9 * 100) : 0, fmtBytes(memTotal, locale)),
             Meter(t("skills"), skillList.length ? enabledSkills / skillList.length * 100 : 0, String(skillList.length)),
             h("hr", { className: "iris-sep", key: "s" }),
             h("div", { key: "n", style: { fontSize: "11.5px", color: "var(--color-muted-foreground,#8c8a9c)", lineHeight: "1.6" } },
               t("provider") + " : ", h("b", { style: { color: "var(--color-secondary-foreground,#aaa8bb)" } }, providerName), " · ", t("curator") + " ",
               Badge(curatorPaused ? t("paused") : t("active"), curatorPaused ? "neutral" : "good"),
               h("br"),
               enabledSkills + " " + t("skills") + " " + t("enabled") + " · " + t("lastConsolidation", fmtRel(curator && curator.last_run_at, t, locale) || "—"))]),
          Card(t("channelsSystem"), LinkTo("/system", t("manage")),
            chanRows.concat([
              h("hr", { className: "iris-sep", key: "s2" }),
              Meter(t("cpu"), cpu, cpu != null ? Math.round(cpu) + " %" : "—"),
              Meter(t("ram"), mem, mem != null ? Math.round(mem) + " %" : "—"),
              Meter(t("disk"), disk, disk != null ? Math.round(disk) + " %" : "—")])))));
  }

  /* ================= SESSIONS ================= */
  function SessionsPage() {
    var locale = useLocale(); var t = makeT(locale);
    var bp = useState(0); var bump = bp[0], setBump = bp[1];
    var qs = useState(""); var q = qs[0], setQ = qs[1];
    var tab = usePersist("iris:sessions:flt", "all"); var flt = tab[0], setFlt = tab[1];
    var mf = useState(""); var modelFlt = mf[0], setModelFlt = mf[1];
    var sf = useState(""); var sourceFlt = sf[0], setSourceFlt = sf[1];
    var rf = useState(false); var refreshing = rf[0], setRefreshing = rf[1];
    var stats = useJSON("/api/sessions/stats", 30000, bump);
    var data = useJSON("/api/sessions?limit=50", 15000, bump);
    var res = useState(null); var results = res[0], setResults = res[1];

    function distinctVals(arr, key) {
      var seen = {}, out = [];
      arr.forEach(function (r) {
        var v = r[key];
        if (v && !seen[v]) { seen[v] = 1; out.push(v); }
      });
      return out;
    }

    // tab bar: "archived" shows archived rows only; every other tab excludes them
    var list = asList(data, ["sessions", "items"]);
    if (flt === "archived") {
      list = list.filter(function (s) { return !!s.archived; });
    } else {
      list = list.filter(function (s) { return !s.archived; });
      if (flt === "chats") list = list.filter(function (s) { return !/cron|webhook|tool|api/.test(String(s.source || "")); });
      if (flt === "auto") list = list.filter(function (s) { return /cron|webhook|tool|api/.test(String(s.source || "")); });
    }
    var modelOpts = distinctVals(list, "model");
    var sourceOpts = distinctVals(list, "source");
    if (modelFlt) list = list.filter(function (s) { return s.model === modelFlt; });
    if (sourceFlt) list = list.filter(function (s) { return s.source === sourceFlt; });

    function modelShort(m) {
      var sv = String(m || "");
      var slash = sv.lastIndexOf("/");
      if (slash >= 0) sv = sv.slice(slash + 1);
      var parts = sv.split("-");
      return parts[parts.length - 1] || sv;
    }

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
        (s.active_store != null ? t("sessActive", s.active_store) + " · " : "") +
        (s.archived != null ? s.archived + " " + t("archived").toLowerCase() + " · " : "") + t("sessionsDesc"),
        Btn(t("pruneOld"), function () {
          irisConfirm(t, { title: t("pruneOld"), message: t("confirmPrune"), tone: "danger", icon: "trash", ok: t("deleteS") })
            .then(function (ok) {
              if (ok) actToast(t, "/api/sessions/prune", jinit("POST", { days: 90 }), t("deleted"), function () { setBump(bump + 1); });
            });
        })),
      h("div", { className: "iris-tabs" },
        [{ v: "all", l: t("all") }, { v: "chats", l: t("chats") }, { v: "auto", l: t("automation") }, { v: "archived", l: t("archived") }]
          .map(function (o, i) {
            return h("button", {
              key: i, className: "iris-tab" + (flt === o.v ? " on" : ""),
              onClick: function () { setFlt(o.v); }
            }, o.l);
          })),
      h("div", { className: "iris-filterbar" },
        h("input", {
          className: "iris-input", type: "search", placeholder: t("searchFTS"), value: q,
          onChange: function (e) { setQ(e.target.value); },
          onKeyDown: function (e) { if (e.key === "Enter") doSearch(); }
        }),
        h("select", {
          className: "iris-input", value: modelFlt,
          onChange: function (e) { setModelFlt(e.target.value); }
        }, [h("option", { key: "_all", value: "" }, t("allModels"))].concat(
          modelOpts.map(function (m, i) { return h("option", { key: i, value: m }, m); }))),
        h("select", {
          className: "iris-input", value: sourceFlt,
          onChange: function (e) { setSourceFlt(e.target.value); }
        }, [h("option", { key: "_all", value: "" }, t("allSources"))].concat(
          sourceOpts.map(function (m, i) { return h("option", { key: i, value: m }, m); }))),
        Btn(refreshing ? "…" : t("refresh"), function () {
          setRefreshing(true); setBump(bump + 1);
          setTimeout(function () { setRefreshing(false); }, 700);
        }, "sm", refreshing)),
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
          return h("tr", {
            key: i, className: id ? "iris-rowlink" : null,
            title: id ? t("resumeChat") : null,
            tabIndex: id ? 0 : null, role: id ? "link" : null,
            onClick: id ? function () { navTo("/chat?resume=" + encodeURIComponent(id)); } : null,
            onKeyDown: id ? function (e) {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                navTo("/chat?resume=" + encodeURIComponent(id));
              }
            } : null
          },
            h("td", null, h("b", null, sx.is_active ? LiveDot() : null, txt(sx.name || sx.title) || id || "session"),
              h("br"), h("small", { className: "iris-muted" }, txt(sx.preview).slice(0, 80))),
            h("td", { className: "hide-m" }, txt(sx.source) || "—"),
            h("td", { className: "hide-m" }, sx.model ? ModelBadge(modelShort(sx.model)) : "—"),
            h("td", { className: "r num" }, fmtTokens(firstNum(sx.tokens, sx.total_tokens))),
            h("td", { className: "r num hide-m" }, firstNum(sx.message_count, sx.messages) != null ? String(firstNum(sx.message_count, sx.messages)) : "—"),
            h("td", { className: "r num" }, fmtRel(sx.updated_at || sx.last_activity || sx.created_at, t, locale) || "—"),
            h("td", { className: "r", onClick: function (e) { e.stopPropagation(); } },
              id ? h("a", { className: "iris-link", href: "/api/sessions/" + id + "/export" }, t("export")) : null, " ",
              id ? h("button", {
                className: "iris-link", style: { color: "var(--color-destructive)" },
                onClick: function () {
                  askDelete(t, txt(sx.name) || id, function () {
                    actToast(t, "/api/sessions/" + id, jinit("DELETE"), t("deleted"), function () { setBump(bump + 1); });
                  });
                }
              }, t("deleteS")) : null));
        }) : h("tr", null, h("td", { colSpan: 7 }, Empty(t("noSessions"))))));
  }

  /* ================= ANALYTICS ================= */
  function AnalyticsPage() {
    var locale = useLocale(); var t = makeT(locale);
    var pd = usePersist("iris:analytics:days", 7); var days = pd[0], setDays = pd[1];
    // one fetch spans both the current period and the equal-length one before it
    var usage = useJSON("/api/analytics/usage?days=" + (days * 2), 60000);
    var daily = useMemo(function () { return normDaily(usage); }, [usage]);
    var curDaily = daily.slice(-days);
    var rawDaily = asList(usage, ["daily", "days", "usage", "chart"]);
    var curRaw = rawDaily.slice(-days);
    var prevRaw = rawDaily.slice(0, Math.max(0, rawDaily.length - days));
    function sumHalf(arr) {
      var o = { input: 0, output: 0, cost: 0, cacheRead: 0, sessions: 0 };
      arr.forEach(function (d) {
        o.input += firstNum(d.input_tokens, d.input) || 0;
        o.output += firstNum(d.output_tokens, d.output) || 0;
        o.cost += firstNum(d.estimated_cost, d.cost) || 0;
        o.cacheRead += firstNum(d.cache_read_tokens, d.cache_read) || 0;
        o.sessions += firstNum(d.sessions, d.session_count) || 0;
      });
      return o;
    }
    var cur = sumHalf(curRaw), prev = sumHalf(prevRaw);
    var curTok = cur.input + cur.output, prevTok = prev.input + prev.output;
    var curCache = curTok ? cur.cacheRead / curTok * 100 : null;
    var prevCache = prevTok ? prev.cacheRead / prevTok * 100 : null;
    var tokPct = prevTok ? Math.round((curTok - prevTok) / prevTok * 100) : null;
    // by_model has no per-half breakdown in the API — this covers the full 2N-day fetch
    var models = asList(usage && usage.by_model, ["by_model"]);
    var totModelTok = models.reduce(function (sum, m) { return sum + (firstNum(m.total_tokens, m.tokens) || 0); }, 0);
    return h("div", { className: "iris-page" },
      PageHead(t("analyticsTitle"), t("analyticsDesc"),
        Chips([{ v: 7, l: t("period", 7) }, { v: 30, l: t("period", 30) }, { v: 90, l: t("period", 90) }], days, setDays)),
      h("div", { className: "iris-tiles" },
        Tile(t("tokens"), fmtTokens(curTok, locale),
          tokPct != null ? h(React.Fragment, null,
            h("span", { className: "iris-delta " + (tokPct >= 0 ? "up" : "down") }, (tokPct >= 0 ? "+" : "") + tokPct + " %"),
            " " + t("vsPrev")) : ""),
        Tile(t("cost"), fmtCost(cur.cost, locale), t("avgPerDay", fmtCost(cur.cost / days, locale))),
        Tile(t("cacheTitle"), curCache != null ? Math.round(curCache) + " %" : "—",
          (curCache != null && prevCache != null) ? h("span", { className: "iris-delta " + (curCache >= prevCache ? "up" : "down") },
            (curCache >= prevCache ? "+" : "") + Math.round(curCache - prevCache) + " pts") : ""),
        Tile(t("sessionsCount"), String(cur.sessions), t("perDayAvg", dec(cur.sessions / days, 1, locale)))),
      Card(t("chartAria"), null, h(BarChart, { days: curDaily, t: t })),
      h("div", { className: "iris-grid-2" },
        Table([{ l: t("perModel") }, { l: t("tokens"), r: 1 }, { l: t("sessionsCount"), r: 1, m: 1 }, { l: t("cost"), r: 1 }, { l: t("share"), r: 1, m: 1 }],
          models.length ? models.map(function (m, i) {
            var mTok = firstNum(m.total_tokens, m.tokens);
            return h("tr", { key: i },
              h("td", null,
                h("span", { className: "iris-sw", style: { background: "var(--iris-series-" + (i % 3 + 1) + ")" } }),
                h("span", { className: "iris-mono" }, m.model || m.name || "?")),
              h("td", { className: "r num" }, fmtTokens(mTok, locale)),
              h("td", { className: "r num hide-m" }, firstNum(m.sessions, m.session_count) != null ? String(firstNum(m.sessions, m.session_count)) : "—"),
              h("td", { className: "r num" }, fmtCost(firstNum(m.estimated_cost, m.cost), locale)),
              h("td", { className: "r num hide-m" }, totModelTok && mTok != null ? Math.round(mTok / totModelTok * 100) + " %" : "—"));
          }) : h("tr", null, h("td", { colSpan: 5 }, Empty(t("noUsage"))))),
        Table([{ l: t("dailyDetail") }, { l: t("sessionsCount"), r: 1 }, { l: t("tokens"), r: 1 }, { l: t("cache"), r: 1, m: 1 }, { l: t("cost"), r: 1 }],
          curDaily.length ? curDaily.slice(-10).reverse().map(function (d, i) {
            return h("tr", { key: i },
              h("td", { className: "num" }, d.date),
              h("td", { className: "r num" }, d.sessions != null ? String(d.sessions) : "—"),
              h("td", { className: "r num" }, fmtTokens(d.tokens, locale)),
              h("td", { className: "r num hide-m" }, d.cache != null ? Math.round(d.cache) + " %" : "—"),
              h("td", { className: "r num" }, fmtCost(d.cost, locale)));
          }) : h("tr", null, h("td", { colSpan: 5 }, Empty(t("noUsage")))))));
  }

  /* ================= CRON ================= */
  function CronPage() {
    var locale = useLocale(); var t = makeT(locale);
    var bp = useState(0); var bump = bp[0], setBump = bp[1];
    var frm = useState(false); var showForm = frm[0], setShowForm = frm[1];
    var edt = useState(null); var editing = edt[0], setEditing = edt[1];
    var flt = useState("all"); var fltProfile = flt[0], setFltProfile = flt[1];
    var tb = useState("jobs"); var tab = tb[0], setTab = tb[1];
    var bpd = useState(null); var bpData = bpd[0];
    var bpe = useState(null); var bpErr = bpe[0];
    // lazy-load cronstrue (cron → human) once; re-render when it arrives
    useEffect(function () {
      loadCronstrue(function () { setBump(function (v) { return v + 1; }); });
    }, []);
    var data = useJSON("/api/cron/jobs" + (fltProfile !== "all" ? profileQuery(fltProfile) : ""), 20000, bump);
    var gwStatus = useJSON("/api/status", 30000);
    var profiles = asList(useJSON("/api/profiles", 0), ["profiles"]);
    var jobs = asList(data, ["jobs", "items"]);
    var reload = function () { setBump(bump + 1); };
    var createProfile = fltProfile !== "all" ? fltProfile : "default";
    var resProfile = editing ? jobProfile(editing) : createProfile;
    var resQ = resProfile !== "default" ? "?profile=" + encProfile(resProfile) : "";
    var targets = asList(useJSON("/api/cron/delivery-targets", 0), ["targets"]);
    var skills = asList(useJSON("/api/skills" + resQ, 0), ["skills", "items"]);
    var toolsets = asList(useJSON("/api/tools/toolsets" + resQ, 0), ["toolsets", "items"]);
    var modelData = useJSON("/api/model/options" + (resQ ? resQ + "&include_unconfigured=1" : "?include_unconfigured=1"), 0);
    useEffect(function () {
      var alive = true;
      SDK.fetchJSON("/api/cron/blueprints").then(function (r) {
        if (!alive) return;
        bpd[1](r && r.blueprints ? r.blueprints : r);
      }).catch(function (e) {
        if (!alive) return;
        bpe[1](String((e && e.message) || e));
      });
      return function () { alive = false; };
    }, []);

    function fmtNextRun(v) {
      try {
        var d = new Date(v);
        if (!isFinite(d.getTime())) return null;
        var now = new Date();
        var sameDay = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
        var loc = locale === "fr" ? "fr-FR" : "en-US";
        return sameDay
          ? d.toLocaleTimeString(loc, { hour: "2-digit", minute: "2-digit" })
          : d.toLocaleDateString(loc, { day: "2-digit", month: "2-digit" });
      } catch (e) { return null; }
    }

    function closeForm() { setShowForm(false); setEditing(null); }

    var activeCount = jobs.filter(function (j) { return !isPausedJob(j); }).length;
    var pausedCount = jobs.length - activeCount;
    var nextTimes = jobs.filter(function (j) { return !isPausedJob(j); })
      .map(function (j) { var v = nextRunOf(j); return v ? new Date(v).getTime() : NaN; })
      .filter(function (ms) { return isFinite(ms); });
    var minNext = nextTimes.length ? Math.min.apply(null, nextTimes) : null;
    var untilNext = minNext ? timeUntil(minNext, locale) : "";
    var sub = t("cronSub", activeCount, pausedCount) + (untilNext ? " · " + t("nextRun").toLowerCase() + " " + t("inTime", untilNext) : "");

    return h("div", { className: "iris-page" },
      PageHead(t("cronTitle"), sub, [
        h("div", { className: "iris-field", style: { minWidth: "190px", margin: 0 } },
          h("label", null, t("profileFilter")),
          h("select", { className: "iris-input", value: fltProfile,
            onChange: function (e) { setFltProfile(e.target.value); } },
            h("option", { value: "all" }, t("allProfiles")),
            profiles.map(function (pr, i) { return h("option", { key: i, value: txt(pr.name) }, txt(pr.name) || t("pfDefault")); }))),
        Btn(t("newJob"), function () { setEditing(null); setShowForm(!showForm); }, "primary", false, "plus")]),
      h("div", { className: "iris-tabs" },
        h("button", { className: "iris-tab" + (tab === "jobs" ? " on" : ""),
          onClick: function () { setTab("jobs"); } }, t("tabJobs")),
        h("button", { className: "iris-tab" + (tab === "blueprints" ? " on" : ""),
          onClick: function () { setTab("blueprints"); } }, t("tabBlueprints"))),
      tab === "blueprints"
        ? h(BlueprintsView, { t: t, locale: locale, profile: createProfile, bpData: bpData, error: bpErr,
            onCreated: function () { reload(); setTab("jobs"); } })
        : h(React.Fragment, null,
      // a stopped gateway silently swallows triggered/scheduled runs: say it
      gwStatus && !gwStatus.gateway_running ? h("div", {
        className: "iris-note",
        style: { marginTop: 0, color: "var(--color-warning,#fab219)", display: "flex", alignItems: "center", gap: "7px" }
      }, Icon("alert", "sm"), t("cronGwDown"), " ", LinkTo("/system", t("navSystem"))) : null,
      showForm ? h(CronJobForm, { job: editing, profile: editing ? jobProfile(editing) : createProfile, resources: { skills: skills, toolsets: toolsets, targets: targets, models: modelData }, onClose: closeForm, onDone: reload }) : null,
      Table([{ l: t("job") }, { l: t("schedule"), m: 1 }, { l: t("target"), m: 1 }, { l: t("status") },
             { l: t("lastRun"), r: 1, m: 1 }, { l: t("nextRun"), r: 1 }, { l: t("actions"), r: 1 }],
        jobs.length ? jobs.map(function (j, i) {
          var id = j.id || j.job_id || j.name;
          var jp = jobProfile(j);
          var isPaused = isPausedJob(j);
          var lr = lastRunOf(j), nr = nextRunOf(j);
          var promptTxt = txt(j.prompt);
          var exprStr = txt(j.schedule && j.schedule.expr) || txt(j.schedule);
          var dispStr = txt(j.schedule_display);
          // human-friendly line under the raw expression (cronstrue) or the
          // backend's own display for interval/one-shot schedules
          var human = humanCron(exprStr, locale);
          var schedSub = human || (dispStr && dispStr !== exprStr ? dispStr : "");
          var lastStatus = j.last_status;
          var lastBadge = null;
          if (lastStatus) {
            var ls = String(lastStatus).toLowerCase();
            if (ls === "ok" || ls === "success") lastBadge = Badge("ok", "good");
            else if (ls === "error" || ls === "failed") lastBadge = Badge(txt(lastStatus), "crit");
            else lastBadge = Badge(txt(lastStatus), "warn");
          }
          var jUntil = nr ? timeUntil(nr, locale) : "";
          var jobErr = txt(j.last_error) || txt(j.last_delivery_error);
          var jobErrTitle = txt(j.last_error) ? t("lastError") + ": " + txt(j.last_error)
            : t("deliveryError") + ": " + txt(j.last_delivery_error);
          return h("tr", { key: i, style: isPaused ? { opacity: .55 } : undefined },
            h("td", null, h("b", null, txt(j.name) || id), h("br"),
              h("small", { className: "iris-muted iris-cron-prompt", title: promptTxt || "" }, promptTxt || ""),
              h("div", { className: "iris-badges" }, jobBadges(j, t))),
            h("td", { className: "hide-m" },
              h("span", { className: "iris-mono" }, exprStr || dispStr),
              schedSub ? h(React.Fragment, null, h("br"), h("small", { className: "iris-muted" }, schedSub)) : null),
            h("td", { className: "hide-m" }, txt(j.deliver || j.target) || "local"),
            h("td", null, Badge(isPaused ? t("paused") : t("active"), isPaused ? "neutral" : "good")),
            h("td", { className: "r num hide-m", style: { whiteSpace: "nowrap" } }, lr
              ? h(React.Fragment, null, fmtRel(lr, t, locale) || String(lr).slice(5, 16), lastBadge ? " " : null, lastBadge,
                  jobErr ? " " : null, jobErr ? h("span", { title: jobErrTitle, className: "iris-err-dot", "aria-label": jobErrTitle }) : null)
              : "—"),
            h("td", { className: "r num" }, (!isPaused && nr)
              ? h(React.Fragment, null, h("b", null, fmtNextRun(nr) || "—"),
                  jUntil ? h("br") : null, jUntil ? h("small", null, t("inTime", jUntil)) : null)
              : "—"),
            h("td", { className: "r" },
              h("div", { className: "iris-actions-cell" },
                h("button", { className: "iris-icon-btn sm", title: t("runNow"), "aria-label": t("runNow"),
                  onClick: function () { actToast(t, "/api/cron/jobs/" + id + "/trigger" + profileQuery(jp), jinit("POST"), t("triggered"), reload); } }, Icon("zap", "sm")),
                h("button", { className: "iris-icon-btn sm", title: isPaused ? t("resume") : t("pause"),
                  "aria-label": isPaused ? t("resume") : t("pause"),
                  onClick: function () { actToast(t, "/api/cron/jobs/" + id + (isPaused ? "/resume" : "/pause") + profileQuery(jp), jinit("POST"), t("updated"), reload); }
                }, Icon(isPaused ? "play" : "pause", "sm")),
                h("button", { className: "iris-icon-btn sm", title: t("editJob"), "aria-label": t("editJob"),
                  onClick: function () { setEditing(j); setShowForm(true); } }, Icon("pencil", "sm")),
                isPaused ? h("button", {
                  className: "iris-icon-btn sm", title: t("deleteS"), "aria-label": t("deleteS"),
                  style: { color: "var(--color-destructive)" },
                  onClick: function () { askDelete(t, txt(j.name) || id, function () { actToast(t, "/api/cron/jobs/" + id + profileQuery(jp), jinit("DELETE"), t("deleted"), reload); }); }
                }, Icon("trash", "sm")) : null)));
        }) : h("tr", null, h("td", { colSpan: 7 }, Empty(t("noCronJob")))))));
  }

  /* ================= WEBHOOKS ================= */
  function WebhooksPage() {
    var locale = useLocale(); var t = makeT(locale);
    var bp = useState(0); var bump = bp[0], setBump = bp[1];
    var frm = useState(false); var showForm = frm[0], setShowForm = frm[1];
    var data = useJSON("/api/webhooks", 30000, bump);
    var subs = asList(data && data.subscriptions, ["subscriptions"]);
    var reload = function () { setBump(bump + 1); };

    return h("div", { className: "iris-page" },
      PageHead(t("whTitle"), t("whDesc"),
        [Btn(t("refresh"), reload, "", false, "refresh"),
         Btn(t("whNew"), function () { setShowForm(!showForm); }, "primary", false, "plus")]),
      showForm ? h(WebhookForm, { t: t, onClose: function () { setShowForm(false); }, onDone: reload }) : null,
      data ? Card(t("whEnableSys"), Switch(data.enabled === true, function () {
        actToast(t, "/api/webhooks/enable", jinit("POST", { enabled: !data.enabled }), t("updated"), reload);
      }, t("whEnableSys")), h("div", { className: "iris-note" }, t("whUrl") + " : " + (data.base_url || "—"))) : null,
      subs.length ? subs.map(function (w, i) { return h(WebhookCard, { w: w, key: i, t: t, baseUrl: data && data.base_url, onDone: reload }); }) : Card(null, null, Empty(t("whNone"))));
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
    var skillIcon = function (s) {
      var k = ((s.category || "") + " " + (s.name || "")).toLowerCase();
      if (k.indexOf("mail") >= 0 || k.indexOf("email") >= 0) return "mail";
      if (k.indexOf("code") >= 0 || k.indexOf("dev") >= 0 || k.indexOf("review") >= 0) return "term";
      if (k.indexOf("web") >= 0 || k.indexOf("brief") >= 0 || k.indexOf("news") >= 0) return "globe";
      if (k.indexOf("infra") >= 0 || k.indexOf("monitor") >= 0 || k.indexOf("server") >= 0) return "server";
      if (k.indexOf("market") >= 0 || k.indexOf("data") >= 0 || k.indexOf("chart") >= 0) return "chart";
      return "spark";
    };
    // header actions ("Parcourir le hub" / "Tout mettre à jour") have no backing API — intentionally omitted
    return h("div", { className: "iris-page" },
      PageHead(t("skillsTitle"), t("skillsDesc", skills.length, enabledCount), null),
      curator ? Card(
        h(React.Fragment, null, Icon("spark", "sm dim"), " ", t("curator")),
        Badge(curator.paused ? t("paused") : t("active"), curator.paused ? "neutral" : "iris"),
        h("div", null,
          h("div", { style: { fontSize: "11.5px", color: "var(--color-muted-foreground)", lineHeight: "1.6" } },
            t("curatorNote") + " " + t("lastConsolidation", fmtRel(curator.last_run_at, t, locale) || "—") +
            (curator.interval_hours ? " · interval " + curator.interval_hours + " h" : "")),
          h("div", { style: { display: "flex", gap: "8px", marginTop: "8px" } },
            Btn(t("curatorRunNow"), function () { actToast(t, "/api/curator/run", jinit("POST"), t("triggered"), reload); }, "sm"),
            Btn(curator.paused ? t("curatorResume") : t("curatorPause"), function () {
              actToast(t, "/api/curator/paused", jinit("PUT", { paused: !curator.paused }), t("updated"), reload);
            }, "sm"))),
        "tinted") : null,
      h("div", { className: "iris-filterbar" },
        h("input", { className: "iris-input", type: "search", placeholder: t("searchSkill"), value: q, onChange: function (e) { setQ(e.target.value); } }),
        Chips(catOpts, cat, setCat)),
      h("div", { className: "iris-cards" }, shown.slice(0, 60).map(function (s, i) {
        var on = s.enabled !== false;
        return h("div", { className: "iris-mini", key: i, style: on ? null : { opacity: 0.6 } },
          h("div", { className: "mc-head" }, Icon(skillIcon(s), "dim"), h("b", null, s.name),
            Switch(on, function () { actToast(t, "/api/skills/toggle", jinit("PUT", { name: s.name, enabled: !on }), t("updated"), reload); }, s.name)),
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
    var catalogIcon = function (c) {
      var k = ((c.name || c.id || "") + "").toLowerCase();
      if (k.indexOf("search") >= 0 || k.indexOf("brave") >= 0 || k.indexOf("web") >= 0) return "globe";
      if (k.indexOf("file") >= 0 || k.indexOf("fs") >= 0) return "file";
      if (k.indexOf("slack") >= 0 || k.indexOf("discord") >= 0 || k.indexOf("chat") >= 0 || k.indexOf("msg") >= 0) return "msg";
      if (k.indexOf("db") >= 0 || k.indexOf("postgres") >= 0 || k.indexOf("sql") >= 0) return "server";
      return "plug";
    };
    // header actions ("Catalogue" / "Ajouter un serveur") have no backing API — intentionally omitted
    return h("div", { className: "iris-page" },
      PageHead(t("mcpTitle"), t("mcpDesc"), null),
      servers.length ? servers.map(function (s2, i) {
        var enabled = s2.enabled !== false;
        var connected = s2.status === "connected" || s2.state === "connected" || s2.connected === true;
        var errored = s2.status === "error" || s2.state === "error" || !!s2.error;
        var statusBadge = connected ? Badge(t("connected"), "good") : (errored ? Badge(t("mcpError"), "crit") : null);
        var toolCount = (s2.tools && s2.tools.length) || s2.tool_count;
        var errMsg = s2.error || s2.last_error;
        return Card(s2.name,
          h("span", { style: { display: "flex", gap: "8px", alignItems: "center" } },
            statusBadge,
            h("span", { className: "iris-badge neutral iris-mono", style: { fontSize: "9.5px" } }, s2.url ? "HTTP" : "STDIO"),
            h("span", { className: "iris-spacer" }),
            Btn(t("mcpTest"), function () {
              act(t, "/api/mcp/servers/" + s2.name + "/test", jinit("POST"), function (r) {
                if (r === null) return;
                irisAlert(t, {
                  title: t("mcpTest"), subtitle: s2.name, icon: "plug",
                  mono: JSON.stringify(r, null, 2).slice(0, 1200)
                });
              });
            }, "sm"),
            Switch(enabled, function () { actToast(t, "/api/mcp/servers/" + s2.name + "/enabled", jinit("PUT", { enabled: !enabled }), t("updated"), reload); }, s2.name),
            h("button", {
              className: "iris-link", style: { color: "var(--color-destructive)" },
              onClick: function () { askDelete(t, txt(s2.name), function () { actToast(t, "/api/mcp/servers/" + s2.name, jinit("DELETE"), t("deleted"), reload); }); }
            }, t("deleteS"))),
          h("div", null,
            h("div", { className: "iris-key-val" }, s2.url || s2.command || ""),
            toolCount ? h("span", { className: "iris-note" }, t("toolsN", toolCount)) : null,
            errMsg ? h("div", { className: "iris-note", style: { color: "var(--color-destructive)" } }, txt(errMsg)) : null));
      }) : Card(null, null, Empty(t("mcpNone"))),
      cat.length ? h("div", null,
        Subhead(t("mcpCatalog")),
        h("div", { className: "iris-cards" }, cat.slice(0, 12).map(function (c, i) {
          return h("div", { className: "iris-mini", key: i },
            h("div", { className: "mc-head" }, Icon(catalogIcon(c), "dim"), h("b", null, c.name || c.id)),
            h("p", null, c.description || ""),
            h("div", { className: "mc-foot" },
              Btn(t("mcpInstall"), function () {
                actToast(t, "/api/mcp/catalog/install", jinit("POST", { name: c.name || c.id }), t("created"), reload);
              }, "sm primary"),
              h("span", null, t("verifiedNous"))));
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
        var tsIcons = { web: "globe", browser: "globe", files: "file", shell: "term", memory: "brain", scheduler: "clock", voice: "mic" };
        return h("div", { className: "iris-mini", key: i, style: on ? null : { opacity: 0.6 } },
          h("div", { className: "mc-head" }, Icon(tsIcons[s2.name] || "tool", "dim"), h("b", null, s2.label || s2.name),
            Switch(on, function () { actToast(t, "/api/tools/toolsets/" + s2.name, jinit("PUT", { enabled: !on }), t("updated"), reload); }, s2.label || s2.name)),
          h("p", null, s2.description || ""),
          h("div", { className: "mc-foot" },
            h("span", null, t("toolsN", (s2.tools || []).length)),
            s2.configured === false ? Badge(t("notConfigured"), "warn") : null));
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
    // start/stop of the gateway itself lives on the System page now; here we only
    // offer a restart (or a start, if it's down) scoped to the messaging channels.
    var shown = plats.filter(function (p) { return p.enabled || p.configured; });
    var rest = plats.filter(function (p) { return !(p.enabled || p.configured); });
    function setEnvVar(k, isSet) {
      // mirrors KeysPage's setKey() exactly, so editing a platform's env var behaves
      // identically to editing it from the Keys page.
      irisPrompt(t, {
        title: isSet ? t("keyEditTitle") : t("keyDefineTitle"), subtitle: k,
        secret: true, hint: t("keySecretHint")
      }).then(function (v) {
        if (v == null || v === "") return;
        actToast(t, "/api/env", jinit("PUT", { key: k, value: v }), t("saved"), reload);
      });
    }
    return h("div", { className: "iris-page" },
      PageHead(t("chTitle"), t("chDesc"),
        gwOnline
          ? Btn(t("chRestart"), function () { actToast(t, "/api/gateway/restart", jinit("POST"), t("triggered"), reload); }, "", false, "refresh")
          : Btn(t("chStart"), function () { actToast(t, "/api/gateway/start", jinit("POST"), t("triggered"), reload); }, "primary", false, "refresh")),
      shown.slice(0, 24).map(function (p, i) {
        var errMsg = txt(p.error_message);
        var errCode = txt(p.error_code);
        var connState = (p.gateway_running && p.enabled && p.state !== "error") ? "ok" : (errMsg ? "err" : "off");
        var badge;
        if (errMsg) {
          var isAuth = /auth/i.test(errCode) || /auth/i.test(errMsg);
          badge = Badge(isAuth ? t("authExpired") : (txt(errCode) || t("authExpired")), "warn");
        } else if (p.enabled && p.configured && p.gateway_running) {
          badge = Badge(t("connected"), "good");
        } else if (p.configured && !p.enabled) {
          badge = Badge(t("disabled"), "neutral");
        } else if (!p.configured) {
          badge = Badge(t("notSetUp"), "neutral");
        } else {
          badge = null;
        }
        var envVars = (p.env_vars || []).filter(function (v) { return !v.advanced; });
        return h("section", { className: "iris-card", key: p.id || i, style: p.enabled ? null : { opacity: 0.65 } },
          h("div", { className: "iris-card-head" },
            Dot(connState), h("h3", null, p.name || p.id), badge,
            h("span", { className: "iris-spacer" }),
            !p.configured
              ? Btn(t("configure"), function () { navTo("/env"); }, "sm")
              : Btn(t("chTest"), function () {
                  act(t, "/api/messaging/platforms/" + p.id + "/test", jinit("POST"), function (r) {
                    if (r === null) return;
                    irisAlert(t, {
                      title: t("chTest"), subtitle: txt(p.name) || p.id, icon: "radio",
                      mono: JSON.stringify(r, null, 2).slice(0, 1200)
                    });
                  });
                }, "sm"),
            Switch(p.enabled === true, function () {
              actToast(t, "/api/messaging/platforms/" + p.id, jinit("PUT", { enabled: !p.enabled }), t("updated"), reload);
            }, p.name || p.id)),
          h("div", { className: "iris-muted" }, p.description || ""),
          envVars.map(function (v, vi) {
            return h("div", { className: "iris-input-row iris-env-row", style: { marginTop: 6 }, key: vi },
              h("span", { className: "iris-muted iris-env-label" }, txt(v.prompt || v.key)),
              h("span", { className: "iris-key-val", style: { flex: 1 } }, v.is_set ? (v.redacted_value || "••••••") : "—"),
              Btn(v.is_set ? t("keyEdit") : t("keyDefine"), function () { setEnvVar(v.key, v.is_set); }, "sm" + (v.is_set ? "" : " primary")));
          }),
          errMsg ? h("div", { style: { color: "var(--color-warning)" }, key: "err" }, errMsg) : null);
      }),
      rest.length ? h("div", { className: "iris-muted", style: { marginTop: 10 } },
        "+ " + rest.length + (locale === "fr" ? " autres plateformes disponibles : " : " more platforms available: ") +
        rest.slice(0, 8).map(function (p) { return p.name || p.id; }).join(", ")) : null);
  }

  /* ================= PAIRING ================= */
  function PairingPage() {
    var locale = useLocale(); var t = makeT(locale);
    var bp = useState(0); var bump = bp[0], setBump = bp[1];
    var data = useJSON("/api/pairing", 15000, bump);
    var reload = function () { setBump(bump + 1); };
    var pending = asList(data && data.pending, ["pending"]);
    var approved = asList(data && data.approved, ["approved"]);
    // "up to 2 words" per the mockup's "AD" / "MD" style initials; strip a leading
    // @ or # (handle prefixes) before splitting so "@marie_d" -> "MD" not "@D".
    function initials(name) {
      var words = String(name || "").replace(/^[@#]/, "").split(/[\s._#-]+/).filter(Boolean);
      if (!words.length) return "?";
      return words.slice(0, 2).map(function (w) { return w.charAt(0); }).join("").toUpperCase();
    }
    function shortDate(v) {
      if (!v) return "";
      try { return new Date(v).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US"); } catch (e) { return txt(v); }
    }
    return h("div", { className: "iris-page" },
      PageHead(t("prTitle"), t("prDesc"),
        Btn(t("clearPending"), function () { actToast(t, "/api/pairing/clear-pending", jinit("POST"), t("updated"), reload); }, "", pending.length === 0, "trash")),
      h("div", { className: "iris-grid-2" },
        Card(t("prPending"), Badge(String(pending.length), pending.length ? "warn" : "neutral"),
          pending.length ? pending.map(function (p, i) {
            var sub = h(React.Fragment, null,
              txt(p.platform), " · ", t("pairingCode") + " ",
              h("span", { className: "iris-mono" }, txt(p.code) || "?"),
              " · ", fmtRel(p.created_at || p.requested_at || p.timestamp, t, locale) || txt(p.age));
            return h(React.Fragment, { key: i },
              IconRow("link", "warn-i", txt(p.user || p.username || p.user_id) || "?", sub,
                h("span", { style: { display: "flex", gap: "6px" } },
                  Btn(t("approve"), function () { actToast(t, "/api/pairing/approve", jinit("POST", { platform: p.platform, code: p.code }), t("updated"), reload); }, "sm primary"),
                  Btn(t("reject"), function () { actToast(t, "/api/pairing/revoke", jinit("POST", { platform: p.platform, user_id: p.user_id || p.user }), t("updated"), reload); }, "sm"))));
          }) : Empty(t("noPending"))),
        Card(t("prApproved"), h("span", { className: "iris-muted" }, String(approved.length)),
          approved.length ? approved.map(function (p, i) {
            var name = txt(p.user || p.username || p.user_id || p.name) || "?";
            var isOwner = !!(p.role === "owner" || p.is_owner || p.owner);
            var dateVal = p.approved_at || p.since;
            return h("div", { className: "iris-row", key: i },
              Avatar(initials(name)),
              h("span", { className: "iris-row-body" }, h("b", null, name),
                h("small", null, txt(p.platform) + (dateVal ? " · " + t("since", shortDate(dateVal)) : ""))),
              h("span", { className: "iris-row-meta" },
                isOwner ? Badge(t("admin"), "iris") :
                  Btn(t("revoke"), function () {
                    irisConfirm(t, {
                      title: t("revoke"), subtitle: txt(p.platform), message: t("confirmDelete", name),
                      tone: "danger", icon: "link", ok: t("revoke")
                    }).then(function (ok) {
                      if (ok) actToast(t, "/api/pairing/revoke", jinit("POST", { platform: p.platform, user_id: p.user_id || p.user }), t("updated"), reload);
                    });
                  }, "sm danger")));
          }) : Empty("—"))));
  }

  /* ================= PROFILES ================= */
  function ProfilesPage() {
    var locale = useLocale(); var t = makeT(locale);
    var data = useJSON("/api/profiles", 60000);
    var profiles = asList(data, ["profiles", "items"]);
    var avatarKinds = ["", "good", "warn"];
    // no create-profile API exists yet, so (unlike the mockup) there is no
    // "Nouveau profil" header button here.
    return h("div", { className: "iris-page" },
      PageHead(t("pfTitle"), t("pfDesc"), null),
      h("div", { className: "iris-cards", style: { gridTemplateColumns: "repeat(auto-fill,minmax(270px,1fr))" } },
        profiles.map(function (p, i) {
          var name = txt(p.name) || "?";
          return h("div", { className: "iris-mini", key: i, style: p.is_default ? { borderColor: "var(--color-primary)" } : null },
            h("div", { className: "mc-head" },
              Avatar(name.charAt(0).toUpperCase(), avatarKinds[i % avatarKinds.length]),
              h("b", null, name), p.is_default ? Badge(t("pfDefault"), "iris") : null),
            h("p", null, p.description || (p.model ? h("span", { className: "iris-mono" }, p.model) : "")),
            h("div", { className: "mc-foot num" },
              h("span", { className: "iris-mono" }, p.model || ""), " · ",
              t("pfSkills", p.skill_count != null ? p.skill_count : "—"), " · ",
              t("gateway").toLowerCase() + " ",
              Badge(p.gateway_running ? "on" : "off", p.gateway_running ? "good" : "neutral")));
        })));
  }

  /* ================= CONFIG ================= */
  function ConfigPage() {
    var locale = useLocale(); var t = makeT(locale);
    var bp = useState(0); var bump = bp[0], setBump = bp[1];
    var data = useJSON("/api/config", 0, bump);
    var edit = useState({}); var ed = edit[0], setEd = edit[1];
    var sv = useState(""); var savedMsg = sv[0], setSaved = sv[1];
    var tabSt = useState("model"); var activeTab = tabSt[0], setActiveTab = tabSt[1];
    var cq = useState(""); var q = cq[0], setQ = cq[1];
    if (!data) return h("div", { className: "iris-page" }, PageHead(t("cfgTitle"), t("cfgDesc"), null), Empty("…"));
    function getPath(obj, path) {
      var parts = path.split("."), cur = obj;
      for (var i = 0; i < parts.length; i++) { if (cur == null) return undefined; cur = cur[parts[i]]; }
      return cur;
    }
    function setPath(obj, path, value) {
      var parts = path.split("."), cur = obj;
      for (var i = 0; i < parts.length - 1; i++) {
        if (cur[parts[i]] == null || typeof cur[parts[i]] !== "object") cur[parts[i]] = {};
        cur = cur[parts[i]];
      }
      cur[parts[parts.length - 1]] = value;
    }
    function val(path, dflt) {
      if (ed[path] !== undefined) return ed[path];
      var v = getPath(data, path);
      return v != null ? v : dflt;
    }
    function setEdit(path, value) { var n = {}; for (var x in ed) n[x] = ed[x]; n[path] = value; setEd(n); }
    // each setting is a { path, label, el } descriptor so the search box can
    // filter on the dot-path or the label before anything is rendered
    function field(path, label, hint) {
      var raw = val(path, "");
      return { path: path, label: label,
        el: h("div", { className: "iris-field", key: path }, h("label", null, label),
          h("input", {
            className: "iris-input", value: raw == null ? "" : String(raw),
            onChange: function (e) { setEdit(path, e.target.value); }
          }),
          hint ? h("div", { className: "iris-hint" }, hint) : null) };
    }
    function switchField(path, label) {
      var cur = !!val(path, false);
      return { path: path, label: label,
        el: h("div", { className: "iris-field", key: path },
          h("div", { className: "iris-input-row", style: { justifyContent: "space-between" } },
            h("label", { style: { margin: 0 } }, label),
            Switch(cur, function () { setEdit(path, !cur); }, label))) };
    }
    function genericSection(sectionKey) {
      var obj = (data && data[sectionKey]) || {};
      var keys = Object.keys(obj).filter(function (k) {
        var v = obj[k];
        return typeof v === "string" || typeof v === "number" || typeof v === "boolean";
      }).slice(0, 8);
      return keys.map(function (k) {
        var path = sectionKey + "." + k;
        return typeof obj[k] === "boolean" ? switchField(path, k) : field(path, k, null);
      });
    }
    function buildMerged() {
      var cfg = JSON.parse(JSON.stringify(data));
      Object.keys(ed).forEach(function (path) {
        var v = ed[path];
        var orig = getPath(data, path);
        if (typeof orig === "number" && typeof v === "string") {
          var n = parseFloat(v);
          v = isNaN(n) ? orig : n;
        }
        setPath(cfg, path, v);
      });
      return cfg;
    }
    function save() {
      act(t, "/api/config", jinit("PUT", { config: buildMerged() }), function (r) {
        if (r !== null) { setSaved(t("saved")); setEd({}); setBump(bump + 1); setTimeout(function () { setSaved(""); }, 3000); }
      });
    }
    function doImport() {
      var inp = document.createElement("input");
      inp.type = "file"; inp.accept = ".json,application/json";
      inp.onchange = function (e) {
        var f = e.target.files && e.target.files[0];
        if (!f) return;
        var reader = new FileReader();
        reader.onload = function () {
          var cfg;
          try { cfg = JSON.parse(String(reader.result)); }
          catch (err) {
            irisAlert(t, { title: t("errTitle"), message: String((err && err.message) || err), tone: "danger", icon: "alert" });
            return;
          }
          act(t, "/api/config", jinit("PUT", { config: cfg }), function (r) {
            if (r !== null) { setSaved(t("saved")); setEd({}); setBump(bump + 1); setTimeout(function () { setSaved(""); }, 3000); }
          });
        };
        reader.readAsText(f);
      };
      inp.click();
    }
    function doExport() {
      var blob = new Blob([JSON.stringify(buildMerged(), null, 2)], { type: "application/json" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url; a.download = "config.json";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    var TABS = [["model", "tabModel"], ["agent", "tabAgent"], ["memory", "tabMemory"],
      ["approvals", "tabApprovals"], ["gateway", "tabGateway"], ["display", "tabDisplay"]];
    var tabLabel = t(TABS.filter(function (tb) { return tb[0] === activeTab; })[0][1]);
    var tabFields;
    if (activeTab === "model") {
      tabFields = [
        field("model", t("cfgModel"), t("cfgModelHint")),
        field("model_context_length", t("cfgCtx"), null),
        (data.cron && typeof data.cron.model === "string") ? field("cron.model", t("cfgCronModel"), null) : null];
    } else if (activeTab === "agent") {
      tabFields = [
        field("agent.max_turns", t("cfgMaxTurns"), null),
        field("max_live_sessions", t("cfgMaxLive"), null)];
    } else if (activeTab === "approvals") {
      tabFields = [
        field("approvals.mode", t("cfgApprovalMode"), null),
        field("approvals.cron_mode", "cron_mode", null)];
    } else {
      tabFields = genericSection(activeTab);
    }
    var qLow = String(q).toLowerCase().trim();
    var shown = tabFields.filter(function (f) {
      if (!f) return false;
      if (!qLow) return true;
      return f.label.toLowerCase().indexOf(qLow) >= 0 || f.path.toLowerCase().indexOf(qLow) >= 0;
    });
    var tabBody = h("div", null,
      qLow && !shown.length ? Empty(t("cfgNoMatch", q)) : shown.map(function (f) { return f.el; }));
    return h("div", { className: "iris-page" },
      PageHead(t("cfgTitle"), t("cfgDesc"),
        [savedMsg ? Badge(savedMsg, "good") : null,
         Btn(t("refresh"), function () { setBump(bump + 1); }, "", false, "refresh"),
         Btn(t("cfgImport"), doImport, "", false, "upload"),
         Btn(t("cfgExport"), doExport, "", false, "download"),
         Btn(t("save"), save, "primary")]),
      h("div", { className: "iris-tabs" }, TABS.map(function (tb) {
        return h("button", {
          key: tb[0], className: "iris-tab" + (activeTab === tb[0] ? " on" : ""),
          onClick: function () { setActiveTab(tb[0]); }
        }, t(tb[1]));
      })),
      h("div", { className: "iris-filterbar" },
        h("input", {
          className: "iris-input", type: "search", placeholder: t("cfgSearch"), value: q,
          onChange: function (e) { setQ(e.target.value); }
        })),
      Card(tabLabel, null, tabBody),
      Card(t("cfgRawView"), null,
        h("pre", { className: "iris-logbox", style: { maxHeight: "40vh" } }, JSON.stringify(data, null, 2).slice(0, 20000))));
  }

  /* ================= KEYS ================= */
  function KeysPage() {
    var locale = useLocale(); var t = makeT(locale);
    var bp = useState(0); var bump = bp[0], setBump = bp[1];
    // A real instance exposes far more optional keys than configured ones: the
    // page opens on what is actually set, the rest sits behind one button.
    var ms = useState(false); var showMissing = ms[0], setShowMissing = ms[1];
    var qs = useState(""); var q = qs[0], setQ = qs[1];
    var data = useJSON("/api/env", 30000, bump);
    var reload = function () { setBump(bump + 1); };
    if (!data) return h("div", { className: "iris-page" }, PageHead(t("keysTitle"), t("keysDesc"), null), Empty("…"));

    var all = Object.keys(data).map(function (k) { return [k, data[k] || {}]; });
    var setCount = all.filter(function (e) { return !!e[1].is_set; }).length;
    var missCount = all.length - setCount;
    var needle = q.trim().toLowerCase();
    function matches(e) {
      if (!needle) return true;
      return (e[0] + " " + txt(e[1].prompt || e[1].description || "")).toLowerCase().indexOf(needle) >= 0;
    }
    var shownSet = all.filter(function (e) { return e[1].is_set && matches(e); });
    var shownMissing = all.filter(function (e) { return !e[1].is_set && matches(e); });
    // nothing configured yet (or a search that only hits unset keys): unfolding
    // the missing list by hand would just be a required extra click
    var missingOpen = showMissing || (!shownSet.length && shownMissing.length > 0);

    function catRank(c) {
      if (/llm|provider|model/i.test(c)) return 0;
      if (/tool/i.test(c)) return 1;
      if (/messag|platform|chat/i.test(c)) return 2;
      return 3;
    }
    var catLabels = { provider: t("catProvider"), tool: t("catTool"), messaging: t("catMessaging"), setting: t("catSetting") };
    // [[catLabel, entries], …] — categories ordered provider → tool → messaging → rest
    function byCategory(list) {
      var byCat = {};
      list.forEach(function (e) {
        var cat = e[1].category || "other";
        (byCat[cat] = byCat[cat] || []).push(e);
      });
      return Object.keys(byCat).sort(function (a, b) {
        var ra = catRank(a), rb = catRank(b);
        return ra !== rb ? ra - rb : a.localeCompare(b);
      }).map(function (cat) {
        return [catLabels[cat] || cat, byCat[cat].sort(function (a, b) { return a[0].localeCompare(b[0]); })];
      });
    }

    function setKey(k, isSet) {
      irisPrompt(t, {
        title: isSet ? t("keyEditTitle") : t("keyDefineTitle"), subtitle: k,
        secret: true, hint: t("keySecretHint")
      }).then(function (v) {
        if (v == null || v === "") return;
        actToast(t, "/api/env", jinit("PUT", { key: k, value: v }), t("saved"), reload);
      });
    }
    function delKey(k) {
      askDelete(t, k, function () {
        actToast(t, "/api/env", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: k }) }, t("deleted"), reload);
      });
    }
    function keyRow(pair) {
      var k = pair[0], v = pair[1];
      return h("div", { className: "iris-row iris-key-row", key: k },
        h("span", { className: "iris-row-body" },
          h("b", null, k),
          v.prompt || v.description ? h("small", null, txt(v.prompt || v.description)) : null),
        v.is_set ? h("span", { className: "iris-key-val" }, v.redacted_value || "••••••") : null,
        h("span", { className: "iris-row-meta", style: { display: "flex", gap: "7px", alignItems: "center" } },
          v.advanced && !v.is_set ? Badge(t("keyAdvanced"), "neutral") : null,
          Badge(v.is_set ? t("keySet") : t("keyUnset"), v.is_set ? "good" : "warn"),
          Btn(v.is_set ? t("keyEdit") : t("keyDefine"), function () { setKey(k, v.is_set); }, "sm" + (v.is_set ? "" : " primary")),
          v.is_set ? Btn(t("keyDelete"), function () { delKey(k); }, "sm danger") : null));
    }
    function section(list) {
      return byCategory(list).map(function (g) {
        return h("div", { key: g[0] }, Subhead(g[0]), Card(null, null, g[1].map(keyRow)));
      });
    }

    return h("div", { className: "iris-page" },
      PageHead(t("keysTitle"),
        t("keysSetN", setCount) + " · " + t("keysMissingN", missCount) + " · " + t("keysDesc"),
        [Btn(t("refresh"), reload, "", false, "refresh"),
         missCount ? Btn(missingOpen ? t("keyHideMissing") : t("keyShowMissing", missCount),
           function () { setShowMissing(!missingOpen); }, missingOpen ? "primary" : "", false, "eye") : null]),
      all.length > 8 ? h("div", { className: "iris-filterbar" },
        h("input", {
          className: "iris-input", type: "search", placeholder: t("keySearch"), value: q,
          onChange: function (e) { setQ(e.target.value); }
        })) : null,
      shownSet.length ? section(shownSet)
        : Card(null, null, Empty(needle ? t("keysNoMatch") : t("keysNoneSet"))),
      missingOpen ? h("div", { className: "iris-keys-missing" },
        h("div", { className: "iris-section-head" },
          Icon("key", "dim"), h("b", null, t("keysMissingTitle")),
          Badge(String(shownMissing.length), "warn")),
        shownMissing.length ? section(shownMissing)
          : Card(null, null, Empty(needle ? t("keysNoMatch") : t("keysAllSet")))) : null);
  }

  /* ================= LOGS ================= */
  function LogsPage() {
    var locale = useLocale(); var t = makeT(locale);
    var fs2 = usePersist("iris:logs:file", "agent"); var file = fs2[0], setFile = fs2[1];
    var ls = usePersist("iris:logs:lines", 200); var lines = ls[0], setLines = ls[1];
    var lv = usePersist("iris:logs:level", "ALL"); var level = lv[0], setLevel = lv[1];
    var tl = usePersist("iris:logs:tail", true); var tail = tl[0], setTail = tl[1];
    var data = useJSON("/api/logs?file=" + file + "&lines=" + lines, tail ? 5000 : 0);
    var raw = asList(data && data.lines, ["lines"]);
    var LINE_RE = /^(\d{4}-\d{2}-\d{2}[ T][\d:.,]+)\s+(\w+)\s+([\w.-]+):\s?(.*)$/;
    function parseLine(l) {
      var m = LINE_RE.exec(String(l));
      return m ? { ts: m[1], level: m[2], comp: m[3], msg: m[4] } : null;
    }
    function levelKey(lv2) {
      if (/^(ERROR|CRITICAL)/i.test(lv2)) return "ERROR";
      if (/^WARN/i.test(lv2)) return "WARN";
      if (/^DEBUG/i.test(lv2)) return "DEBUG";
      if (/^INFO/i.test(lv2)) return "INFO";
      return null;
    }
    function levelCls(lv2) {
      var k = levelKey(lv2);
      return k === "ERROR" ? "iris-lg-e" : k === "WARN" ? "iris-lg-w" : k === "DEBUG" ? "iris-lg-d" : k === "INFO" ? "iris-lg-i" : "";
    }
    var shown = raw.filter(function (l) {
      if (level === "ALL") return true;
      var p = parseLine(l);
      return !!p && levelKey(p.level) === level;
    });
    return h("div", { className: "iris-page" },
      PageHead(t("logsTitle"), t("logsDesc"), null),
      h("div", { className: "iris-filterbar" },
        h("select", {
          className: "iris-input", value: file,
          onChange: function (e) { setFile(e.target.value); }
        },
          h("option", { value: "agent" }, "agent.log"),
          h("option", { value: "gateway" }, "gateway.log"),
          h("option", { value: "errors" }, "errors.log")),
        Chips([{ v: "ALL", l: t("logAll") }, { v: "INFO", l: t("logInfo") },
          { v: "WARN", l: t("logWarn") }, { v: "ERROR", l: t("logError") }], level, setLevel),
        h("select", {
          className: "iris-input hide-m", value: String(lines),
          onChange: function (e) { setLines(parseInt(e.target.value, 10) || 200); }
        }, [50, 200, 500].map(function (n) { return h("option", { key: n, value: n }, n + " " + t("lines")); })),
        h("span", { className: "iris-spacer" }),
        h("span", { style: { display: "flex", gap: "8px", alignItems: "center", fontSize: "12px" } },
          t("liveTail"), Switch(tail, function () { setTail(!tail); }, t("liveTail")))),
      h("div", { className: "iris-logbox" }, shown.slice(-400).map(function (l, i) {
        var p = parseLine(l);
        if (!p) {
          var cls = /ERROR|CRITICAL/.test(l) ? "iris-lg-e" : /WARN/.test(l) ? "iris-lg-w" : /DEBUG/.test(l) ? "iris-lg-d" : "";
          return h("div", { key: i, className: cls }, l);
        }
        var lvlText = p.level.length < 5 ? (p.level + "     ").slice(0, 5) : p.level;
        return h("div", { key: i },
          h("span", { className: "iris-lg-t" }, p.ts), " ",
          h("span", { className: levelCls(p.level) }, lvlText), " ",
          h("span", { className: "iris-lg-c" }, "[" + p.comp + "]"), " ",
          p.msg);
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
    var platforms = useJSON("/api/messaging/platforms", 30000, bump);
    var curatorData = useJSON("/api/curator", 30000, bump);
    var reload = function () { setBump(bump + 1); };
    var s = stats || {};
    var curator = curatorData || {};
    var gwOnline = !!(status && (status.gateway_running || status.gateway === "running"));
    var cpu = firstNum(s.cpu_percent, s.cpu && s.cpu.percent);
    var mem = firstNum(s.memory_percent, s.memory && s.memory.percent);
    var disk = firstNum(s.disk_percent, s.disk && s.disk.percent);
    var memFiles = memory ? asList(memory.builtin_files, ["builtin_files", "files", "sizes", "stores"]) : [];
    var providers = memory ? asList(memory.providers, ["providers"]) : [];
    var activeProvider = memory && (memory.provider || memory.active);
    var cpSessions = asList(cps && cps.sessions, ["sessions"]);
    var plats = asList(platforms, ["platforms", "items"]);
    var connectedCount = plats.filter(function (p) {
      return p.enabled === true && p.configured !== false && gwOnline;
    }).length;
    function op(label, path, icon, kind) {
      return Btn(label, function () {
        act(t, path, jinit("POST"), function (r) {
          if (r !== null) irisAlert(t, { title: label, message: t("launched", label), icon: icon || "term" });
        });
      }, kind || "", false, icon);
    }
    function fmtUptime(sec) {
      if (sec == null || !isFinite(sec)) return "—";
      var totalMin = Math.floor(sec / 60);
      var days = Math.floor(totalMin / 1440);
      var hours = Math.floor((totalMin % 1440) / 60);
      var mins = totalMin % 60;
      if (days > 0) return days + " " + (locale === "fr" ? "j" : "d") + " " + hours + " h";
      return hours + " h " + mins;
    }
    function shortTime(v) {
      if (!v) return "";
      var m = /(\d{2}:\d{2})/.exec(String(v));
      return m ? m[1] : String(v).slice(11, 16);
    }
    var ramTotal = s.memory && (s.memory.total != null ? s.memory.total : s.memory.total_bytes);
    var diskTotal = s.disk && (s.disk.total != null ? s.disk.total : s.disk.total_bytes);
    var loadAvg = s.load_avg && s.load_avg.length ? s.load_avg[0] : null;
    var line1 = [s.os, s.arch, s.python_version ? "Python " + s.python_version : null,
      s.hermes_version ? "hermes " + s.hermes_version : null].filter(Boolean).join(" · ");
    var line2Parts = [];
    if (s.cpu_count != null) line2Parts.push(s.cpu_count + " vCPU");
    if (loadAvg != null) line2Parts.push("charge " + dec(loadAvg, 2, locale));
    if (ramTotal != null) line2Parts.push("RAM " + fmtBytes(ramTotal, locale) + (mem != null ? " (" + Math.round(mem) + " %)" : ""));
    if (diskTotal != null) line2Parts.push("disque " + fmtBytes(diskTotal, locale) + (disk != null ? " (" + Math.round(disk) + " %)" : ""));
    var line2 = line2Parts.join(" · ");
    return h("div", { className: "iris-page" },
      PageHead(t("sysTitle"), t("sysDesc"),
        [op(t("doctor"), "/api/ops/doctor", "term"), op(t("backup"), "/api/ops/backup", "download", "primary")]),
      h("div", { className: "iris-grid-2" },
        Card(t("host"), h("span", { className: "iris-muted num" }, t("uptime", fmtUptime(s.uptime_seconds))),
          [h("div", { key: "i1", className: "iris-note", style: { marginTop: 0, marginBottom: 2 } }, line1),
           line2 ? h("div", { key: "i2", className: "iris-note", style: { marginTop: 0, marginBottom: 8 } }, line2) : null,
           h("hr", { className: "iris-sep", key: "sep" }),
           Meter(t("cpu"), cpu, cpu != null ? Math.round(cpu) + " %" : "—"),
           Meter(t("ram"), mem, mem != null ? Math.round(mem) + " %" : "—"),
           Meter(t("disk"), disk, disk != null ? Math.round(disk) + " %" : "—")]),
        Card(t("gateway"), Badge(gwOnline ? t("online") : t("offline"), gwOnline ? "good" : "crit"),
          [h("div", { key: "btns", className: "iris-actions" },
             Btn(gwOnline ? t("gwRestart") : t("gwStart"), function () {
               actToast(t, gwOnline ? "/api/gateway/restart" : "/api/gateway/start", jinit("POST"), t("triggered"), reload);
             }, "primary"),
             gwOnline ? Btn(t("gwStop"), function () { actToast(t, "/api/gateway/stop", jinit("POST"), t("triggered"), reload); }, "danger") : null),
           h("div", { key: "conn", className: "iris-note" }, t("gwConnStat", connectedCount)),
           h("hr", { className: "iris-sep", key: "sep" }),
           h("div", { key: "chead", className: "iris-card-head", style: { margin: 0 } },
             h("h3", { style: { fontSize: "12px" } }, t("curator")),
             Badge(curator.paused ? t("paused") : t("active"), curator.paused ? "neutral" : "good"),
             h("span", { className: "iris-spacer" }),
Btn(t("curatorRunNow"), function () { actToast(t, "/api/curator/run", jinit("POST"), t("triggered"), reload); }, "sm")),
            h("div", { key: "cnote", className: "iris-note", style: { fontSize: "11.5px", marginTop: 5 } },
             t("lastConsolidation", fmtRel(curator.last_run_at, t, locale) || "—"))])),
      h("div", { className: "iris-grid-2" },
        Card(t("memPersist"), h("span", { className: "iris-muted iris-mono" }, "provider : " + (activeProvider || "built-in")),
          [memFiles.slice(0, 4).map(function (f, i) {
            return Meter(f.name || f.file || "store", Math.min(100, (firstNum(f.size, f.bytes) || 0) / 2e9 * 100), fmtBytes(firstNum(f.size, f.bytes), locale));
          }),
           providers.length ? h("div", { className: "iris-note", key: "p" },
             t("providersAvail") + " " + providers.map(function (p) {
               var nm = p.name || p.id || "?";
               return nm + (nm === activeProvider ? " " + t("activeMark") : "");
             }).join(", ")) : null,
           h("div", { className: "iris-actions", key: "a", style: { marginTop: 10 } },
             Btn(t("memReset"), function () {
               irisConfirm(t, {
                 title: t("memReset"), subtitle: t("memPersist"), message: t("confirmReset"),
                 tone: "danger", icon: "brain", ok: t("memReset")
               }).then(function (ok) {
                 if (ok) actToast(t, "/api/memory/reset", jinit("POST", { target: "memory" }), t("updated"), reload);
               });
             }, "danger"))]),
        Card(t("checkpoints"), h("span", { className: "iris-muted num" }, cpSessions.length + " · " + fmtBytes(cps && cps.total_bytes, locale)),
          [cpSessions.length ? cpSessions.slice(0, 5).map(function (c, i) {
            var sid = c.session_id || c.id || "?";
            var st = shortTime(c.time || c.checkpoint_time || c.updated_at || c.created_at || c.timestamp);
            return h("div", { className: "iris-row", key: i },
              h("span", { className: "iris-row-body" },
                h("span", { className: "iris-mono", style: { fontSize: "11.5px" } }, sid + (st ? " · " + st : ""))),
              h("span", { className: "iris-row-meta" }, fmtBytes(firstNum(c.bytes, c.size), locale)));
          }) : Empty("—"),
           h("div", { className: "iris-actions", key: "a", style: { marginTop: 10 } },
             Btn(t("pruneCp"), function () { actToast(t, "/api/ops/checkpoints/prune", jinit("POST"), t("deleted"), reload); }))])),
      Card(t("opsTitle"), null,
        h("div", { className: "iris-actions" },
          op(t("doctor"), "/api/ops/doctor", "term"), op(t("audit"), "/api/ops/security-audit", "shield"),
          op(t("backup"), "/api/ops/backup", "download"), op(t("dump"), "/api/ops/dump", "file"))));
  }

  /* ================= PLUGINS ================= */
  // Dashboard plugins are either native plugin.yaml plugins (hub.plugins rows
  // with has_dashboard_manifest → real runtime_status, toggled via
  // enable/disable) or dashboard-only plugins in the hub's orphan list
  // (hidden = in the orphan list but absent from the loader list).
  function agentCat(name) {
    var n = String(name);
    if (/-provider$/.test(n)) return "providers";
    if (/-platform$/.test(n)) return "platforms";
    if (n.indexOf("web-") === 0) return "web";
    if (n.indexOf("browser-") === 0) return "browser";
    return "other";
  }
  function isIris(name) {
    return /^iris(-|$)/.test(String(name));
  }
  // Persist the Plugins page filter across reloads (the reload after
  // re-enabling a plugin must not lose the search/category/view state).
  var PLGFLT_KEY = "iris:plugins:filter";
  function plgFlt() {
    try { return JSON.parse(sessionStorage.getItem(PLGFLT_KEY) || "null"); }
    catch (e) { return null; }
  }
  function plgFltSave(q, cat, showInactive) {
    try { sessionStorage.setItem(PLGFLT_KEY, JSON.stringify({ q: q, cat: cat, showInactive: showInactive })); }
    catch (e) { /* noop */ }
  }
  function PluginsPage() {
    var locale = useLocale(); var t = makeT(locale);
    var bp = useState(0); var bump = bp[0], setBump = bp[1];
    var qs = useState(function () { return (plgFlt() || {}).q || ""; });
    var q = qs[0], setQ = qs[1];
    var cs = useState(function () { return (plgFlt() || {}).cat || "all"; });
    var cat = cs[0], setCat = cs[1];
    var shs = useState(function () { return !!(plgFlt() || {}).showInactive; });
    var showInactive = shs[0], setShowInactive = shs[1];
    var bsy = useState(null); var busyName = bsy[0], setBusyName = bsy[1];
    useEffect(function () { plgFltSave(q, cat, showInactive); }, [q, cat, showInactive]);
    var loaded = useJSON("/api/dashboard/plugins", 60000, bump);
    var hub = useJSON("/api/dashboard/plugins/hub", 60000, bump);
    var reload = function () { setBump(bump + 1); };
    var loadedSet = {};
    asList(loaded, []).forEach(function (p) { loadedSet[p.name] = 1; });
    // The Iris suite ships plugin.yaml, so its pages arrive as native
    // hub.plugins rows (runtime_status + has_dashboard_manifest). True
    // dashboard-only plugins without plugin.yaml stay in the orphan list,
    // where a plugin is "enabled" when the loader actually serves it.
    var agents = hub ? asList(hub.plugins, []) : [];
    var dash = {};
    asList(hub ? hub.orphan_dashboard_plugins : loaded, []).forEach(function (p) { dash[p.name] = p; });
    agents.forEach(function (p) { if (p.has_dashboard_manifest) dash[p.name] = p; });
    var dashList = Object.keys(dash).map(function (k) { return dash[k]; });
    var agentsGrid = agents.filter(function (p) { return !p.has_dashboard_manifest; });
    var dashOn = function (p) {
      return p.runtime_status !== undefined ? p.runtime_status === "enabled" : !!loadedSet[p.name];
    };
    var activeDash = dashList.filter(dashOn);
    var inactiveDash = dashList.filter(function (p) { return !dashOn(p); });
    var activeAgents = agentsGrid.filter(function (p) { return p.runtime_status === "enabled"; });
    var inactiveAgents = agentsGrid.filter(function (p) { return p.runtime_status !== "enabled"; });
    var inactiveCount = inactiveDash.length + inactiveAgents.length;
    var activeCount = activeDash.length + activeAgents.length;
    var visDash = showInactive ? dashList : activeDash;
    var visAgents = showInactive ? agentsGrid : activeAgents;
    var irisDash = visDash.filter(function (p) { return isIris(p.name); });
    var otherDash = visDash.filter(function (p) { return !isIris(p.name); });
    // The shell injects one script tag per served plugin bundle at boot and
    // never removes it in production: its presence tells us whether this
    // session actually loaded the plugin's page. A plugin disabled at boot
    // has no bundle and no registered route — re-enabling it needs a reload
    // (the shell reads manifests at mount only). A plugin that was loaded at
    // boot keeps its route for the whole session, so re-enabling it after a
    // same-session disable needs no reload at all.
    var bootLoaded = function (name) {
      try { return !!document.querySelector('script[data-hermes-plugin="' + String(name) + '"]'); }
      catch (e) { return true; }
    };
    function setEnabled(name, enabled) {
      setBusyName(name);
      act(t, "/api/dashboard/plugins/" + encodeURIComponent(name) + "/visibility",
        jinit("POST", { hidden: !enabled }), function (r) {
          setBusyName(null);
          if (r) {
            toastPush(enabled ? t("plgEnabled", name) : t("plgDisabled", name));
            if (enabled && !bootLoaded(name)) {
              // bundle wasn't served this session: its page only registers at boot
              try { sessionStorage.removeItem("hermes:plugin-manifests"); } catch (e) { /* noop */ }
              setTimeout(function () { location.reload(); }, 500);
            } else { reload(); }
          }
        });
    }
    function setAgentEnabled(name, enabled) {
      act(t, "/api/dashboard/agent-plugins/" + encodeURIComponent(name) + (enabled ? "/enable" : "/disable"),
        jinit("POST"), function (r) {
          if (r) {
            toastPush(enabled ? t("plgEnabled", name) : t("plgDisabled", name));
            reload();
          }
        });
    }
    // Native plugin rows (plugin.yaml present) toggle through the agent
    // enable/disable endpoint; orphan dashboard-only plugins use /visibility.
    function toggleDash(p) {
      if (p.runtime_status === undefined) { setEnabled(p.name, !dashOn(p)); return; }
      var next = !dashOn(p);
      setBusyName(p.name);
      act(t, "/api/dashboard/agent-plugins/" + encodeURIComponent(p.name) + (next ? "/enable" : "/disable"),
        jinit("POST"), function (r) {
          setBusyName(null);
          if (r) {
            toastPush(t(next ? "plgEnabled" : "plgDisabled", p.name));
            if (next && !bootLoaded(p.name)) {
              // bundle wasn't served this session: its page only registers at boot
              try { sessionStorage.removeItem("hermes:plugin-manifests"); } catch (e) { /* noop */ }
              setTimeout(function () { location.reload(); }, 500);
            } else { reload(); }
          }
        });
    }
    function installPlugin() {
      irisPrompt(t, {
        icon: "download", tone: "iris", title: t("plgInstallTitle"),
        label: t("plgInstallLabel"), placeholder: t("plgInstallPh"),
        hint: t("plgInstallHint"), ok: t("plgInstall")
      }).then(function (id) {
        if (!id) return;
        act(t, "/api/dashboard/agent-plugins/install",
          jinit("POST", { identifier: id, enable: true }), function (r) {
            if (r) {
              toastPush(t("plgInstalled", id));
              // newly discovered plugins only load at boot: drop the manifest
              // cache and reload so the new routes actually register
              try { sessionStorage.removeItem("hermes:plugin-manifests"); } catch (e) { /* noop */ }
              setTimeout(function () { location.reload(); }, 400);
            }
          });
      });
    }
    function updatePlugin(name) {
      irisConfirm(t, {
        title: t("plgUpdate"), subtitle: name,
        message: t("plgUpdateConfirm", name), ok: t("plgUpdate"), icon: "refresh"
      }).then(function (ok) {
        if (!ok) return;
        act(t, "/api/dashboard/agent-plugins/" + encodeURIComponent(name) + "/update",
          jinit("POST"), function (r) {
            if (r) {
              toastPush(t("plgUpdated", name));
              reload();
            }
          });
      });
    }
    function dashCard(p) {
      // hub.plugins rows nest the dashboard manifest; orphans carry it flat
      var m = p.dashboard_manifest || p;
      var tab = m.tab || {};
      var enabled = dashOn(p);
      var busy = busyName === p.name;
      return h("div", { className: "iris-mini" + (busy ? " busy" : ""), key: p.name,
        style: busy ? { opacity: 0.4 } : (enabled ? null : { opacity: 0.55 }) },
        h("div", { className: "mc-head" },
          busy ? h("span", { className: "iris-spin" }) : Icon("puzzle", "dim"),
          h("b", null, m.label || p.name),
          Switch(enabled, function () { toggleDash(p); }, m.label || p.name)),
        h("p", null, p.description || m.description || ""),
        h("div", { className: "mc-foot" },
          h("span", { className: "num" }, p.name + (m.version ? " · v" + m.version : "")),
          tab.override ? Badge(t("plgOverride", tab.override), "iris")
            : (tab.path ? Badge(t("plgTab", tab.path), "neutral") : null),
          m.slots && m.slots.length ? Badge(t("plgSlotsN", m.slots.length), "neutral") : null,
          m.has_api ? Badge(t("plgApi"), "warn") : null,
          !enabled ? Badge(t("plgInactive"), "neutral") : null,
          (p.runtime_status !== undefined ? p.can_update_git : p.source === "user")
            ? Btn(t("plgUpdate"), function () { updatePlugin(p.name); }, "sm", false, "refresh") : null));
    }
    function agentCard(p) {
      var on = p.runtime_status === "enabled";
      return h("div", { className: "iris-mini", key: p.path || p.name, style: on ? null : { opacity: 0.55 } },
        h("div", { className: "mc-head" }, Icon("plug", "dim"), h("b", null, p.name),
          Switch(on, function () { setAgentEnabled(p.name, !on); }, p.name)),
        h("p", null, p.description || ""),
        h("div", { className: "mc-foot" },
          h("span", { className: "num" }, p.version ? "v" + p.version : ""),
          p.auth_required ? Badge(t("plgAuth"), "warn") : null,
          p.can_update_git ? Btn(t("plgUpdate"), function () { updatePlugin(p.name); }, "sm", false, "refresh") : null));
    }
    var catOpts = [
      { v: "all", l: t("plgAll") }, { v: "providers", l: t("plgProviders") },
      { v: "platforms", l: t("plgPlatforms") }, { v: "web", l: t("plgWeb") },
      { v: "browser", l: t("plgBrowser") }, { v: "other", l: t("plgOther") }];
    var shown = visAgents.filter(function (p) {
      if (cat !== "all" && agentCat(p.name) !== cat) return false;
      if (q && (p.name + " " + (p.description || "")).toLowerCase().indexOf(q.toLowerCase()) < 0) return false;
      return true;
    });
    return h("div", { className: "iris-page" },
      PageHead(t("plgTitle"), t("plgDesc"),
        [Btn(showInactive ? t("plgActiveBtn", activeCount) : t("plgInactiveBtn", inactiveCount),
          function () { setShowInactive(!showInactive); }, "", false, showInactive ? "eye" : "eyeOff"),
         Btn(t("plgInstall"), installPlugin, "", false, "download"),
         Btn(t("plgRescan"), function () {
           // newly discovered plugins only load at boot: drop the manifest
           // cache and reload the page so the rescan has a visible effect
           act(t, "/api/dashboard/plugins/rescan", undefined, function (r) {
             if (r) {
               try { sessionStorage.removeItem("hermes:plugin-manifests"); } catch (e) { /* noop */ }
               location.reload();
             }
           });
         }, "primary")]),
      h("div", { className: "iris-tiles" },
        Tile(TL("puzzle", t("plgDash")), activeDash.length, t("plgInactiveN", inactiveDash.length)),
        Tile(TL("plug", t("plgAgents")), activeAgents.length, t("plgInactiveN", inactiveAgents.length)),
        Tile(TL("brain", t("provider")), (hub && hub.providers && hub.providers.memory_provider) || "built-in",
          hub && hub.providers ? (hub.providers.context_engine || " ") : " ")),
      h("div", null,
        h("div", { className: "iris-nav-label", style: { padding: "6px 0" } }, t("plgDash")),
        h("div", { className: "iris-nav-label", style: { padding: "10px 0 6px" } }, t("plgIris") + " (" + irisDash.length + ")"),
        h("div", { className: "iris-cards" }, irisDash.map(dashCard)),
        h("div", { className: "iris-nav-label", style: { padding: "10px 0 6px" } }, t("plgOtherDash") + " (" + otherDash.length + ")"),
        h("div", { className: "iris-cards" }, otherDash.map(dashCard)),
        h("div", { className: "iris-note" }, t("plgNote"))),
      visAgents.length ? h("div", null,
        h("div", { className: "iris-nav-label", style: { padding: "10px 0 6px" } },
          t("plgAgents") + " (" + visAgents.length + ")"),
        h("div", { className: "iris-filterbar", style: { marginBottom: 10 } },
          h("input", { className: "iris-input", type: "search", placeholder: t("search"), value: q, onChange: function (e) { setQ(e.target.value); } }),
          Chips(catOpts, cat, setCat)),
        h("div", { className: "iris-cards" }, shown.length ? shown.slice(0, 120).map(agentCard) : Empty("—"))) : null);
  }

  /* ================= NAVIGATION (overlay slot) ================= */
  function navGroups(t) {
    return [
      [null, [["/", t("navHome"), "grid"], ["/chat", t("navChat"), "chat"], ["/sessions", t("navSessions"), "hist"], ["/analytics", t("navAnalytics"), "chart"]]],
      [t("grpAutomation"), [["/cron", t("navCron"), "clock"], ["/webhooks", t("navWebhooks"), "hook"]]],
      [t("grpCapabilities"), [["/skills", t("navSkills"), "spark"], ["/mcp", t("navMcp"), "plug"], ["/toolsets", t("navToolsets"), "tool"], ["/plugins", t("navPlugins"), "puzzle"], ["/models", t("navModels"), "brain"]]],
      [t("grpConnectivity"), [["/channels", t("navChannels"), "radio"], ["/pairing", t("navPairing"), "link"]]],
      [t("grpAdmin"), [["/config", t("navConfig"), "cog"], ["/env", t("navKeys"), "key"], ["/profiles", t("navProfiles"), "users"],
        ["/files", t("navFiles"), "file"], ["/logs", t("logs"), "file"], ["/system", t("navSystem"), "server"], ["/docs", t("navDocs"), "globe"]]]
    ];
  }
  // badges: {path: [text, kind]} — mockup shows live counts next to Sessions / Pairing
  function NavItems(t, path, cls, onNav, badges) {
    return navGroups(t).map(function (g, gi) {
      return h("div", { key: gi, className: "iris-nav-group" },
        g[0] ? h("div", { className: "iris-nav-label" }, g[0]) : null,
        g[1].map(function (l, li) {
          var b = badges && badges[l[0]];
          return h("a", {
            key: li, href: l[0],
            className: cls + (path === l[0] ? " active" : ""),
            onClick: function (e) { e.preventDefault(); onNav(l[0]); }
          }, Icon(l[2]), l[1],
            b ? h("span", { className: "iris-nav-badge " + (b[1] || "") }, b[0]) : null);
        }));
    });
  }
  function useNavBadges() {
    var stats = useJSON("/api/sessions/stats", 60000);
    var pairing = useJSON("/api/pairing", 60000);
    var badges = {};
    var act = stats && firstNum(stats.active_store, stats.active);
    if (act) badges["/sessions"] = [String(act), ""];
    var pend = pairing ? asList(pairing.pending, ["pending"]).length : 0;
    if (pend) badges["/pairing"] = [String(pend), "warn-b"];
    return badges;
  }
  function SideNav() {
    var t = makeT(useLocale());
    var path = usePath();
    var badges = useNavBadges();
    return h("nav", { className: "iris-sidenav" },
      h("div", { className: "iris-side-logo" },
        h("span", { className: "mark" }),
        h("span", null, h("b", null, "Iris"), h("small", null, "Hermes core"))),
      h("div", { className: "iris-nav-scroll" },
        NavItems(t, path, "iris-nav-item", navTo, badges)));
  }
  function MobileNav() {
    var t = makeT(useLocale());
    var path = usePath();
    var ds = useState(false); var open = ds[0], setOpen = ds[1];
    var links = [["/", t("navHome"), "grid"], ["/chat", t("navChat"), "chat"], ["/sessions", t("navSessions"), "hist"], ["/cron", t("navCron"), "clock"]];
    var closeAnd = function (href) { setOpen(false); navTo(href); };
    // Escape and a route change both dismiss the drawer: it now sits above the
    // bottom bar, so the "More" button is no longer there to toggle it back.
    useEffect(function () {
      if (!open) return undefined;
      function onKey(e) { if (e.key === "Escape") setOpen(false); }
      document.addEventListener("keydown", onKey, true);
      return function () { document.removeEventListener("keydown", onKey, true); };
    }, [open]);
    useEffect(function () { setOpen(false); }, [path]);
    return h(React.Fragment, null,
      h("nav", { className: "iris-bottombar" },
        links.map(function (l, i) {
          return h("a", {
            key: i, href: l[0], className: "iris-bb-item" + (path === l[0] ? " active" : ""),
            onClick: function (e) { e.preventDefault(); closeAnd(l[0]); }
          }, Icon(l[2], "bb"), h("span", null, l[1]));
        }),
        h("button", {
          className: "iris-bb-item" + (open ? " active" : ""),
          onClick: function () { setOpen(!open); }
        }, Icon("dots", "bb"), h("span", null, t("navMore")))),
      h("div", { className: "iris-scrim" + (open ? " open" : ""), onClick: function () { setOpen(false); } }),
      h("div", { className: "iris-drawer" + (open ? " open" : ""), "aria-hidden": open ? null : "true" },
        h("div", { className: "iris-grabber" }),
        h("div", { className: "iris-drawer-head" },
          h("b", null, t("menuTitle")),
          IconBtn("x", function () { setOpen(false); }, t("cancel"))),
        // same grouping as the desktop sidebar — a flat 20-tile grid read as a
        // different menu altogether
        navGroups(t).map(function (g, gi) {
          return h("div", { className: "iris-drawer-group", key: gi },
            g[0] ? h("div", { className: "iris-nav-label" }, g[0]) : null,
            h("div", { className: "iris-drawer-grid" },
              g[1].map(function (l, i) {
                return h("a", {
                  key: i, href: l[0], className: "iris-drawer-item" + (path === l[0] ? " active" : ""),
                  onClick: function (e) { e.preventDefault(); closeAnd(l[0]); }
                }, Icon(l[2]), h("span", null, l[1]));
              })));
        })));
  }
  function pageTitleFor(path, t) {
    var map = {
      "/": t("navHome"), "/chat": t("navChat"), "/sessions": t("navSessions"), "/analytics": t("navAnalytics"),
      "/cron": t("navCron"), "/webhooks": t("navWebhooks"), "/skills": t("navSkills"), "/mcp": t("navMcp"),
      "/toolsets": t("navToolsets"), "/plugins": t("navPlugins"), "/models": t("navModels"),
      "/channels": t("navChannels"), "/pairing": t("navPairing"), "/config": t("navConfig"),
      "/env": t("navKeys"), "/profiles": t("navProfiles"), "/files": t("navFiles"),
      "/logs": t("logs"), "/system": t("navSystem"), "/docs": t("navDocs")
    };
    return map[path] || null;
  }
  // The shell's <h1> tracks its own nav state, which client-side navigation
  // from the Iris menus never touches: keep it in sync with the route.
  function NativeTitleSync() {
    var t = makeT(useLocale());
    var path = usePath();
    useEffect(function () {
      var title = pageTitleFor(path, t);
      if (!title) return undefined;
      var header = document.querySelector('header[role="banner"]');
      if (!header) return undefined;
      function apply() {
        var h1 = header.querySelector("h1");
        if (h1 && h1.textContent !== title) h1.textContent = title;
      }
      apply();
      // the shell re-renders the header with its own (stale) title after us:
      // re-assert ours until the next route change
      var mo = new MutationObserver(apply);
      mo.observe(header, { childList: true, characterData: true, subtree: true });
      return function () { mo.disconnect(); };
    }, [path, t("navHome")]);
    return null;
  }
  // one banner for every failing endpoint; a dismissed banner re-appears
  // only when a *new* failure set arrives (seq bumps on any change).
  function NetBanner() {
    var t = makeT(useLocale());
    var st = useState(NET.fails); var fails = st[0], setFails = st[1];
    var sq = useState(NET.seq); var seq = sq[0], setSeq = sq[1];
    var ds = useState(-1); var dismissed = ds[0], setDismissed = ds[1];
    useEffect(function () {
      function on(f, s) { setFails(f); setSeq(s); }
      NET.subs.push(on);
      on(NET.fails, NET.seq);
      var pr = setInterval(netPrune, 30000);
      return function () {
        var i = NET.subs.indexOf(on);
        if (i >= 0) NET.subs.splice(i, 1);
        clearInterval(pr);
      };
    }, []);
    var keys = Object.keys(fails);
    if (!keys.length || seq <= dismissed) return null;
    return h("div", { className: "iris-netcnt", role: "status" },
      h("div", { className: "iris-netbanner" },
        Icon("alert", "sm"),
        h("span", { className: "iris-net-txt" }, t("netDown", keys.length)),
        Btn(t("retry"), function () { location.reload(); }, "sm", false, "refresh"),
        IconBtn("x", function () { setDismissed(seq); }, t("cancel"))));
  }
  function Toaster() {
    var st = useState([]); var items = st[0], setItems = st[1];
    useEffect(function () {
      function on(list) { setItems(list); }
      TOAST.subs.push(on);
      on(TOAST.items.slice());
      return function () {
        var i = TOAST.subs.indexOf(on);
        if (i >= 0) TOAST.subs.splice(i, 1);
      };
    }, []);
    if (!items.length) return null;
    return h("div", { className: "iris-toastcnt", "aria-live": "polite" },
      items.map(function (x) {
        return h("div", { className: "iris-toast" + (x.kind === "err" ? " err" : ""), key: x.id },
          Icon(x.kind === "err" ? "alert" : "check", "sm"),
          h("span", { className: "iris-toast-txt" }, x.msg),
          IconBtn("x", function () { toastDismiss(x.id); }, "close"));
      }));
  }
  function Overlay() {
    return h(React.Fragment, null, h(SideNav), h(MobileNav), h(NativeTitleSync), h(ModalHost), h(NetBanner), h(Toaster));
  }
  // gateway pill in the native header (mockup topbar), via the header-right slot
  function HeaderPill() {
    var t = makeT(useLocale());
    var status = useJSON("/api/status", 15000);
    if (!status) return null;
    var on = !!(status.gateway_running || status.gateway === "running");
    return h("span", { className: "iris-gwpill" },
      h("span", { className: "iris-dot " + (on ? "ok" : "off") }),
      h("span", { className: "iris-gwpill-txt" }, on ? t("gatewayOnline") : t("gatewayDown")));
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
    "iris-system": SystemPage,
    "iris-plugins": PluginsPage
  };
  REG.register("iris", HomePage);
  REG.registerSlot("iris", "overlay", Overlay);
  REG.registerSlot("iris", "header-right", HeaderPill);
})();
