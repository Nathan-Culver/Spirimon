# Maintenance and release architecture

## Build targets

| Target | Command | Distribution |
| --- | --- | --- |
| Web | `node build.mjs --out-dir _site` | Small HTML entry, versioned JS/CSS, current asset files, and the downloadable `Spirimon.html` |
| Installed app | `node build.mjs --target app --out-dir _app` | Small HTML entry, versioned JS/CSS and local asset files; no embedded HTML duplicate |
| Local development | `npm start` | Builds the web files and starts the local companion server |

The installed-app entry sets `window.__spirimonPackaged` before the game bundle
loads. File/content URLs then resolve artwork locally. A downloaded single HTML
file retains embedded artwork and its hosted fallback for optional images.
Installed apps skip web service-worker registration. Their download link points
to the hosted single-file copy rather than a nonexistent local HTML file.

The release inventory includes asset paths referenced by browser code, the
exported rear-atlas map, and the required world/mystery artwork. Historical
revisions and previews remain in the repository and are not shipped. Each output
directory includes `asset-manifest.json` with file sizes and payload totals.
Rebuilding removes obsolete generated bundles and replaces the output asset
directory; repository source assets are never pruned by the build.

Current guardrails are 40 MiB of runtime artwork, 55 MiB for the single-file
download, and 1,100,000 bytes for the online game bundle. The JavaScript allowance includes the restored/custom Domain registry, difficulty modes, learning systems, curated passive variations and eight physical Temple philosophies. Further expansion requires an explicit budget review. They measure distribution size, not decoded-image memory
or frame rate; actual Android hardware still needs runtime profiling.

## Combat boundaries

- `realtime-combat.mjs` owns the simulation and action scheduling.
- `battle-session.mjs` owns active rosters, legacy-save conversion and enemy
  decisions. It receives current state through callbacks, without DOM access.
- `battle-view.mjs` renders the current battle HUD and available choices. It
  reads session state and does not submit combat actions.
- `app.mjs` connects input, persistence, canvas drawing and world progression.

Old saved single/double battles migrate into the current session. Old queued
orders, action credits and allied automation are discarded. The application no
longer contains turn-based resolvers or a separate round-based battle interface.
The engine's standalone rule APIs remain available for rules testing.

The local companion server discovers the browser import graph from `app.mjs`,
so new browser modules do not need another manually maintained route list.
Only those reachable modules are exposed, alongside the existing asset routes.

## Release workflows

`deploy-pages.yml` is the sole Pages publisher. It validates modules, builds,
runs the regression suite and deploys the web target. The Pages concurrency
group prevents overlapping deployments.

`standalone.yml` watches JavaScript modules, scripts, CSS, HTML, artwork, desktop
files and package configuration. Its validation job gates all Windows, macOS,
Linux and Android packaging jobs. Both installer targets use local asset files.
Newer commits cancel obsolete in-progress standalone builds.

Before publishing, run `npm run build`, `npm test`,
`node build.mjs --target app --out-dir _app`, and `git diff --check`.
Release tests check asset coverage, size budgets, local URL resolution, stale
output cleanup and workflow configuration. Combat integration tests exercise the
actual session/view modules, including old-save migration and independent actors.
