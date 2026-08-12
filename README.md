<div align="center">

# Iris — Control Center Dashboard for Hermes Agent

**A full redesign of the [Hermes Agent](https://hermes-agent.nousresearch.com) web dashboard: control-center home page, redesigned pages, grouped sidebar and themes.**

*Iris, messenger of the gods and goddess of the rainbow — a nod to Hermes.*

[![GitHub release](https://img.shields.io/github/v/release/adamotte/iris-dashboard?include_prereleases)](https://github.com/adamotte/iris-dashboard/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Hermes Agent](https://img.shields.io/badge/hermes--agent-dashboard%20plugin-8b80f9)](https://hermes-agent.nousresearch.com/docs/user-guide/features/extending-the-dashboard)
[![Last commit](https://img.shields.io/github/last-commit/adamotte/iris-dashboard)](https://github.com/adamotte/iris-dashboard/commits)

</div>

> ⚠️ Unofficial project, not affiliated with Nous Research. Built only on the
> documented dashboard extension points (UI plugins, YAML themes) and core API.

## ✨ Features

- 🏠 **Control-center home page** — cost, token usage (14-day chart), cron runs,
  recent sessions, pending pairings, channel and system health at a glance
- 🧭 **Grouped sidebar** with icons: Automation, Capabilities, Connectivity,
  Administration
- 🖥️ **Every page redesigned**: Sessions, Analytics, Cron, Webhooks, Skills,
  MCP, Toolsets, Plugins, Channels, Pairing, Profiles, Config, API Keys, Logs,
  System — with their actions (create/run/pause cron, toggle skills, gateway
  control, approve pairings, edit config and keys, live log tail…)
- 🎨 **Two themes** — `iris-dark` / `iris-light`, contrast and color-blindness
  validated, spectral-arc signature
- 📱 **Mobile** — bottom navigation bar, responsive pages
- 🌍 **EN / FR** labels, following the dashboard language
- 🛡️ **Additive** — native pages (Chat, Files, Models, Docs) keep working;
  hide any Iris page from the Plugins page to get the native one back

## 📦 Installation

On the machine running `hermes-agent`:

```bash
git clone https://github.com/adamotte/iris-dashboard.git
cd iris-dashboard
./install.sh
```

### 🐳 Docker (official `nousresearch/hermes-agent` image)

```bash
./install.sh --docker /path/to/hermes-data   # the directory mounted on /opt/data
docker restart hermes
```

Or bind-mount the clone in `docker-compose.yml` for git-pull updates:

```yaml
    volumes:
      - ./hermes-data:/opt/data
      - /opt/iris-dashboard/plugins/iris:/opt/data/plugins/iris:ro
```

## 🔧 Configuration

1. `install.sh` registers the plugins under `plugins.enabled` in `config.yaml`
   (required for user dashboard plugins) and triggers a rescan.
2. Reload the dashboard — the Iris pages replace the native ones.
3. Pick **Iris (sombre)** or **Iris (clair)** via the palette icon in the header.

## 🗑️ Uninstall

```bash
rm -rf ~/.hermes/plugins/iris* ~/.hermes/dashboard-themes/iris-*.yaml
```

The native dashboard comes back immediately.

## 🙏 Acknowledgements

- [Nous Research](https://nousresearch.com) for Hermes Agent and its
  [dashboard extension system](https://hermes-agent.nousresearch.com/docs/user-guide/features/extending-the-dashboard).

## 📄 License

[MIT](LICENSE) © adamotte
