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
  disable any Iris page (Plugins page toggle, or `hermes plugins disable`)
  to get the native one back
- 📦 **Native plugins** — each Iris page ships a standard `plugin.yaml`, so
  `hermes plugins list` / `enable` / `disable` / `remove` work on `iris-*`

## 📦 Installation

On the machine running `hermes-agent`:

```bash
git clone https://github.com/adamotte/iris-dashboard.git
cd iris-dashboard
./install.sh
```

`install.sh` installs the 16 plugins (`iris*`) into `~/.hermes/plugins/` as git
checkouts of their per-plugin branches (so the « Update » button and
`hermes plugins update` work), registers them under `plugins.enabled` in
`config.yaml` (required for user dashboard plugins since the #46435 hardening),
copies the two themes into `~/.hermes/dashboard-themes/`, and rescans the
dashboard.

### 🐳 Docker (official `nousresearch/hermes-agent` image)

```bash
./install.sh --docker /path/to/hermes-data   # the directory mounted on /opt/data
docker restart hermes
```

`install.sh` also whitelists the plugin dirs in the container's `.gitconfig`
(`/opt/data/.gitconfig`) so the « Update » buttons / `hermes plugins update`
work despite the host-owned volume.

### 📦 Plugin pack (Hermes builds with pack support)

`hermes-pack.yaml` pins all 16 plugins to a single commit of this repo:

```bash
hermes plugins pack install ./hermes-pack.yaml   # interactive review + confirm
for p in iris iris-analytics iris-channels iris-config iris-cron iris-keys \
         iris-logs iris-mcp iris-pairing iris-plugins iris-profiles \
         iris-sessions iris-skills iris-system iris-toolsets iris-webhooks; do
  hermes plugins enable "$p"
done
cp themes/iris-*.yaml ~/.hermes/dashboard-themes/
```

Packs install pinned snapshots: they do not enable anything, do not cover themes,
and drop `.git` (so `hermes plugins update` does not apply). The `ref` is a
snapshot — bump it to the new release commit on each release
(`git rev-parse <release-tag>` or `hermes plugins pack export`).

## 🔧 Configuration

1. `install.sh` registers the plugins under `plugins.enabled` in `config.yaml`
   and triggers a rescan.
2. Reload the dashboard — the Iris pages replace the native ones.
3. Pick **Iris (sombre)** or **Iris (clair)** via the palette icon in the header.

Each Iris plugin ships a standard `plugin.yaml`, so the usual CLI management
applies: `hermes plugins list`, `hermes plugins enable/disable/remove iris-*`.

## 🗑️ Uninstall

```bash
rm -rf ~/.hermes/plugins/iris* ~/.hermes/dashboard-themes/iris-*.yaml
```

Or, since the plugins are native:

```bash
for p in iris iris-analytics iris-channels iris-config iris-cron iris-keys \
         iris-logs iris-mcp iris-pairing iris-plugins iris-profiles \
         iris-sessions iris-skills iris-system iris-toolsets iris-webhooks; do
  hermes plugins remove "$p"
done
rm -f ~/.hermes/dashboard-themes/iris-*.yaml
```

The native dashboard comes back immediately.

## 🙏 Acknowledgements

- [Nous Research](https://nousresearch.com) for Hermes Agent and its
  [dashboard extension system](https://hermes-agent.nousresearch.com/docs/user-guide/features/extending-the-dashboard).

## 📄 License

[MIT](LICENSE) © adamotte
