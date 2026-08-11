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

Iris replaces the default *Status* landing page with a control-center overview —
cost, automations, sessions, health — and restyles the whole dashboard with two
accessibility-validated themes. Everything is additive and removable in seconds.

---

## ✨ Features

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
  a discreet **spectral arc** on the active tab as the Iris signature
- ✅ Chart & status colors validated for contrast and color-blindness in both themes
- 🔤 Schibsted Grotesk + JetBrains Mono, clean backdrop (no background image)

### 📱 Mobile

- Bottom navigation bar (Home / Chat / Sessions / Cron / Config) injected via the
  documented `overlay` slot — appears under 860 px only, iPhone safe-area handled
- The Iris home page is fully responsive

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

### 🐳 Docker

If Hermes runs in a container, its data directory (`~/.hermes` inside the
container) is normally a host-mounted volume. Two options:

**Option A — copy into the volume (simplest).** No compose change needed:

```bash
./install.sh --docker /path/to/hermes-data
docker restart hermes   # if the rescan endpoint is unreachable
```

**Option B — mount the git clone (git-pull updates).** Keep the clone on the
host and bind-mount only the plugin directory:

```yaml
# docker-compose.yml
services:
  hermes:
    volumes:
      - ./hermes-data:/root/.hermes
      - /opt/iris-dashboard/plugins/iris:/root/.hermes/plugins/iris:ro
```

Themes are still copied into the volume (`./install.sh --docker ./hermes-data`):
bind-mounting individual files is fragile — `git pull` replaces the inode and
the container keeps seeing the old content.

Notes:
- Check where the container home lives in your image (`/root/.hermes` vs
  `/home/<user>/.hermes`) and adjust the target path.
- The plugin is read-only for the dashboard, so `:ro` should be safe; if plugin
  discovery misbehaves (known dashboard quirks on read-only filesystems in
  Docker), drop `:ro` first.
- After the first mount, restart the container — a rescan alone does not always
  pick up a brand-new volume.

## 🔧 Configuration

1. Open the dashboard (`hermes dashboard`) and reload the page — the Iris home
   page replaces the *Status* page.
2. Click the **palette icon** in the header and select **Iris (sombre)** or
   **Iris (clair)**.
3. That's it — there is nothing else to configure.

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

## ⚠️ Known limitations

- Exact JSON response shapes are not specified by the documentation; unrecognized
  fields degrade to `—` (open an issue with a sample response and it gets fixed).
- The spectral-arc `customCSS` targets tab selectors that may change across
  dashboard versions — purely cosmetic if it stops matching.
- The native dashboard shell (header) has no documented mobile behavior; Iris
  screens and the bottom bar are responsive regardless.
- Only one plugin can override `/` — if another plugin claims it, the first one
  loaded wins.
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
