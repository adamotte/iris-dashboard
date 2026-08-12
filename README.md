<div align="center">

# Iris — Control Center Dashboard for Hermes Agent

**A clean, mobile-friendly home page and theme pack for the [Hermes Agent](https://hermes-agent.nousresearch.com) web dashboard.**

*Iris, messenger of the gods and goddess of the rainbow — a nod to Hermes.*

[![GitHub release](https://img.shields.io/github/v/release/adamotte/iris-dashboard?include_prereleases)](https://github.com/adamotte/iris-dashboard/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Hermes Agent](https://img.shields.io/badge/hermes--agent-dashboard%20plugin-8b80f9)](https://hermes-agent.nousresearch.com/docs/user-guide/features/extending-the-dashboard)
[![Last commit](https://img.shields.io/github/last-commit/adamotte/iris-dashboard)](https://github.com/adamotte/iris-dashboard/commits)
[![Issues](https://img.shields.io/github/issues/adamotte/iris-dashboard)](https://github.com/adamotte/iris-dashboard/issues)

</div>

> ⚠️ This project is unofficial. It is independently developed and is not affiliated
> with Nous Research. It only uses the **documented** dashboard extension points
> (UI plugins, YAML themes) and **read-only** core API endpoints.

Iris redesigns the whole dashboard: a control-center home page, redesigned
versions of every page (Sessions, Analytics, Cron, Webhooks, Skills, MCP,
Toolsets, Plugins, Channels, Pairing, Profiles, Config, Keys, Logs, System), a grouped
sidebar, mobile navigation, and two accessibility-validated themes. Native
pages (Chat/TUI, Files, Models, Docs) stay untouched and keep working.
Everything is additive and removable in seconds.

---

## ✨ Features

### 🧭 Full redesign

- **Grouped sidebar** (desktop): Home / Chat / Sessions / Analytics, then
  Automation, Capabilities, Connectivity, Administration — rendered via the
  `overlay` slot; the native flat nav is hidden on desktop and kept in the
  mobile drawer
- **Every page redesigned** as route overrides (one lightweight companion
  plugin per route sharing a single bundle): Sessions (FTS search, stats,
  prune/export), Analytics (periods, per-model and daily tables), Cron (create,
  run/pause/delete), Webhooks, Skills (search, categories, toggles, curator),
  MCP (test/toggle/catalog), Toolsets, Channels (gateway control, per-platform
  test), Plugins (dashboard + agent plugins, hide/show, rescan), Pairing
  (approve/revoke), Profiles, Config (editable + raw view), API Keys (grouped,
  set/delete), Logs (live tail, filters), System (host, memory, checkpoints,
  operations)

### 🏠 Control-center home page (plugin)

- 💰 **Cost at a glance** — today's spend, 7-day average, token volume and cache rate
- ⏱️ **Automations** — last cron runs with status, next scheduled job
- 📊 **14-day usage chart** — daily tokens, hover tooltips, pure SVG (no chart library)
- 💬 **Recent sessions** — model, token count, last activity
- 🔔 **Needs attention** — pending pairing requests, enabled-but-disconnected channels
- 🧠 **Memory & skills** — store size, active provider, enabled skills
- 🖥️ **System health** — gateway state, channels, CPU / memory / disk

### 🎨 Themes

- 🌙 `iris-dark` / ☀️ `iris-light` — deep violet-tinted neutrals, single iris accent,
  a discreet **spectral arc** across the top of the shell as the Iris signature
- ✅ Chart & status colors validated for contrast and color-blindness in both themes
- 🔤 Schibsted Grotesk + JetBrains Mono, clean backdrop (no background image)

### 📱 Mobile

- Bottom navigation bar (Home / Chat / Sessions / Cron / Config) injected via the
  documented `overlay` slot — appears under 860 px only, iPhone safe-area handled
- The Iris home page is fully responsive

### 🌍 Languages

- All plugin labels ship in **English and French**; the active language follows
  the dashboard's `SDK.useI18n` locale when available, then the browser
  language, then falls back to English

### 🛡️ Technical highlights

- **Read-only**: the plugin only calls documented `GET` endpoints — it cannot
  modify sessions, config, memory or jobs
- **No build step**: plain IIFE bundle, React comes from the official plugin SDK
- **Theme-aware**: all styles use the active theme's `--color-*` variables, so the
  plugin follows any theme, not just Iris
- **Defensive parsing**: response shapes are normalized with fallbacks; a missing
  field renders as `—` instead of breaking the page

---

## 📦 Installation

On the machine running `hermes-agent`:

```bash
git clone https://github.com/adamotte/iris-dashboard.git
cd iris-dashboard
./install.sh
```

Or manually:

```bash
cp -r plugins/iris ~/.hermes/plugins/
cp themes/iris-*.yaml ~/.hermes/dashboard-themes/
curl http://127.0.0.1:9119/api/dashboard/plugins/rescan
```

### 🐳 Docker (tested against the official image)

The official image is **`nousresearch/hermes-agent`** (Docker Hub). Inside it,
the Hermes home is **`/opt/data`** (not `~/.hermes`) and is declared as the
container volume. The dashboard runs as a supervised service gated by env vars:
`HERMES_DASHBOARD=1`, plus either a loopback bind (`HERMES_DASHBOARD_HOST=127.0.0.1`
behind your own reverse proxy / host network) or an auth provider
(`HERMES_DASHBOARD_BASIC_AUTH_USERNAME` + `_PASSWORD`) for non-loopback binds.

**Option A — copy into the volume (simplest).** No compose change needed:

```bash
./install.sh --docker /path/to/hermes-data
docker restart hermes   # the rescan endpoint is auth-gated; a restart always works
```

**Option B — mount the git clone (git-pull updates).** Keep the clone on the
host and bind-mount only the plugin directory:

```yaml
# docker-compose.yml
services:
  hermes:
    image: nousresearch/hermes-agent
    environment:
      HERMES_DASHBOARD: "1"
      HERMES_DASHBOARD_BASIC_AUTH_USERNAME: "admin"
      HERMES_DASHBOARD_BASIC_AUTH_PASSWORD: "change-me"
    volumes:
      - ./hermes-data:/opt/data
      - /opt/iris-dashboard/plugins/iris:/opt/data/plugins/iris:ro
```

Themes are still copied into the volume (`./install.sh --docker ./hermes-data`):
bind-mounting individual files is fragile — `git pull` replaces the inode and
the container keeps seeing the old content.

Notes:
- Non-official images may keep the home at `~/.hermes` — adjust the mount
  target accordingly.
- The plugin is read-only for the dashboard, so `:ro` is safe (verified).
- After the first mount, restart the container — the rescan endpoint sits
  behind the dashboard auth gate and a brand-new directory needs a fresh scan.

## 🔧 Configuration

1. `install.sh` activates the plugin by adding `iris` to `plugins.enabled` in
   `config.yaml` — a mandatory step for user dashboard plugins (security
   hardening in recent Hermes versions; without it the plugin is discovered
   but never served).
2. Open the dashboard (`hermes dashboard`) and reload the page — the Iris home
   page replaces the built-in home page.
3. Click the **palette icon** in the header and select **Iris (sombre)** or
   **Iris (clair)**.
4. That's it — there is nothing else to configure.

## 🧭 Data sources

Every block of the home page maps to a documented core API endpoint:

| Block | Endpoint |
|---|---|
| Gateway state, version, active sessions | `GET /api/status` |
| Cost, tokens, cache rate, 14-day chart | `GET /api/analytics/usage?days=14` |
| Cron runs & next job | `GET /api/cron/jobs` |
| Recent sessions | `GET /api/sessions` |
| Pending pairings | `GET /api/pairing` |
| Channel states | `GET /api/messaging/platforms` |
| Memory provider & store size | `GET /api/memory` |
| Skills | `GET /api/skills` |
| CPU / memory / disk | `GET /api/system/stats` |

## ✅ Verified against a real instance

Tested end-to-end on **hermes-agent v0.20.0** (official Docker image): plugin
discovery + activation, home-page override on `/`, live data rendering, theme
palette/fonts/radius, spectral arc, EN/FR labels following the dashboard
language, and mobile at 375 px (zero horizontal overflow, bottom bar active).

## ⚠️ Known limitations

- Exact JSON response shapes are not pinned by the documentation; the shapes of
  v0.20.0 are covered and unrecognized fields degrade to `—` (open an issue
  with a sample response and it gets fixed).
- The native dashboard shell (header/sidebar) handles narrow viewports on its
  own terms; Iris screens and the bottom bar are responsive regardless.
- Only one plugin can override `/` — if another plugin claims it, the first one
  loaded wins.
- The exact shape of the `SDK.useI18n` hook is undocumented: the plugin probes
  common fields (`locale`, `lang`, `language`) and ships its own EN/FR catalog
  rather than reusing the dashboard's native strings; mapping shared terms onto
  the native catalog is possible once the hook is inspected on a live instance.
- `fontUrl` loads Google Fonts from your browser; self-host the fonts and change
  the URL in the theme files if you want zero external requests.

## 🐛 Debug

- Open the browser console (F12): fetch or render errors are logged there.
- Force plugin rediscovery: `curl http://127.0.0.1:9119/api/dashboard/plugins/rescan`
- Uninstall / rollback:

```bash
rm -rf ~/.hermes/plugins/iris ~/.hermes/dashboard-themes/iris-*.yaml
```

The native *Status* page and theme come back immediately.

## 🙏 Acknowledgements

- [Nous Research](https://nousresearch.com) for Hermes Agent and its
  [dashboard extension system](https://hermes-agent.nousresearch.com/docs/user-guide/features/extending-the-dashboard).

## 📄 License

[MIT](LICENSE) © adamotte
