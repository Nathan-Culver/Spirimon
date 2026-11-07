# Spirimon

An original, local-first RPG about Sealers who form tattoo bonds with Spirimon.

## Play and save

- **Play:** [Spirimon on GitHub Pages](https://nathan-culver.github.io/Spirimon/).
- **Offline browser copy:** download `Spirimon.html` from the game and open it in a normal desktop browser.
- **Local server:** install Node.js 20 or newer, run `npm start`, then open `http://127.0.0.1:4317`. Windows also provides `Start-Spirimon.cmd`.
- **Installed apps:** Windows, macOS, Linux and Android packages are produced by the standalone Actions workflow.

No model, API key or generation service is needed for the built-in game. It includes **150 general lineages / 450 named forms**, plus **four legendary lineages / 12 forms**: 154 lineages and 462 forms altogether.

Choose a device save folder in Options where supported. A linked device file is read **before browser recovery** at startup. Permission loss or an unreadable file pauses automatic writing and exposes reconnect/recovery choices, protecting the linked save. Installed apps remember the selected folder independently of browser storage and keep a previous complete copy. Browsers without folder access provide manual Export/Import. Browser recovery and the species library use IndexedDB. Hosted, local-server and downloaded-file versions have separate storage origins; use Export/Import to transfer a world.

For an isolated test world, append `?playtest=your-test-name` to the hosted URL. That slot has its own browser save and species library.

## Controls and first journey

WASD/arrows move, E/Enter interacts, Shift runs, and B opens the bag. Mobile uses a landscape D-pad with A to interact, B to run, and separate Menu/Bag buttons. Menu opens Spirimon, Spiridex, Map, Journal, Spiritual Arts, Options and Save. Settings offers desktop/emulator layout, audio, reduced motion and rhythm calibration.

Begin without a Spirimon. Approach a wild creature, cooperate through offerings and trials, or battle and seal it. Your designated lead can manifest without Energy; additional manifestations cost Energy. Attune up to six traveling Spirimon and command up to three simultaneously in battle. The lead follows outdoors, indoors and through dungeons, and can help with anatomy-qualified field capabilities.

Tall grass can produce encounters in towns as well as routes. Night doubles encounter chance. Day lasts 35 active minutes; night lasts 25. Seeded regions, caves, physical changes, NPC progress and discovered individuals persist.

## Recovery and Spiritual Energy

**Only Shrines provide full team restoration. Inns and Sealer Halls provide safe preparation, instruction and attunement, without full restoration.** Shrines occur at one-quarter the former density, with no more than one in a town or route region; many regions have none.

Each Shrine permits **one action total**—Restore, Meditate or Commune—until the next day/night reset. Restore restores the team and Sealer Energy; Meditate restores 25% maximum Energy; Commune restores 50%. Choosing any one consumes that Shrine's current use. Consumables provide their individual advertised effects. Defeat returns the party to an actual Shrine and consumes its restoration use; dropped supplies remain recoverable.

Reserve sets Energy capacity, Control improves efficiency, and Output limits optional empowerment. Level points and distinct spiritual milestones develop these attributes. Retraining and changing a voluntary vow require a safe place. Perception and concealment are paid toggles with combined drain; both turn off at battle entry. Perception pinpoints detectable discoveries, including legendary disturbances, while leaving their interactions and solutions to the player.

Prepare six assigned Sealer support Techniques plus one distinct floating Technique. Tap for ordinary strength or drag for a preview of optional expenditure and diminishing returns. Costs and timing tradeoffs appear before commitment. No Overdraw is available. At zero Energy, active Spirimon remain with the specified mild penalties; the designated lead is still free to manifest.

See [Spiritual Energy](docs/spiritual-energy.md) and [Spiritual Arts](docs/sealer-spiritual-arts.md) for formulas, vows, training and recovery details.

## Combat

Allies act on **manual commands**. Enemies act independently on the shared clock, with no player action queue. Up to three Spirimon manifest on each side. Action menus, logs and deployment choices leave combat running; hidden/background tabs freeze simulation without replaying elapsed time on return.

The base global cooldown is **3.5 seconds**, with a **1-second minimum**. Speed affects GCDs, casts and individual cooldowns. LCD Techniques have independent recasts. Cooldowns remain attached to individuals across battles, switching, revival, healing and save/load. Damage does not extend the cooldowns of instant-cast Techniques. Technique Speed is retired; practice shows cast and cooldown timing.

| Gesture | Style | Commitment | Extra Technique uses |
| --- | --- | --- | --- |
| Tap | Normal | Current allocation | None |
| Up / down | Strong / Agile | No extra drag commitment | None |
| Left / right | Agile / Strong | Increases with drag distance | None |
| Up-left / up-right | Agile / Strong | Increases with drag distance | One or two |
| Down-left / down-right | Agile / Strong | No extra drag commitment | One or two |
| Double tap | Saved preset | Saved allocation | Saved choice |

Agile deals **85% of Normal damage** and improves accuracy, evasiveness and critical chance. Strong raises ordinary damage and adds **15 percentage points to critical damage**, keeping the ordinary critical chance. Extra uses pay resources and expose the actor to successive enemy retaliations. Health uses the original stat formula divided by two before later modifiers; standard damage applies the original calculation with a 1.25 multiplier.

Physical Techniques spend Stamina; Energy and Status Techniques spend Willpower. Pressure increases costs, shortages can convert the other pool at two-for-one, and Struggle is available when no equipped Technique can be funded. Techniques scale at levels 1, 16, 36, 60, 85 and 100. Each individual has four equipped Techniques, learned alternatives, genetics, nature, bonds, training, one Held Item and optional aspects.

See [live combat rules](docs/real-time-combat.md), [Held Items](docs/held-items.md), and the [Technique audit](docs/move-balance-audit.csv).

## Classifications and passives

There are twelve Types and **exactly nine Domains: Life, Death, Fate, Void, Spirit, Psionic, Nature, Storm and Magic**. Innate and equipped-Technique Domains combine without duplicates; replacing a Technique removes only its acquired affinity. Suppression applies immediately. Acquired Domains do not create passive slots.

Each Type and Domain has its own curated pool of sixteen passives: **21 distinct pools, 336 choices**. Their mechanical distributions and triggers differ: Beast emphasizes pursuit and finishing, Plant roots and weather, Fate anticipation and rhythm, Psionic mental control and casting, and so on. Effects include conditional accuracy/evasion, criticals, drain, thorns, regeneration, casting, recasts and healing. Each innate classification supplies one prepared passive. Study alternatives and prepare unlocked choices at safe places. Matching percentage effects cap at 25%; reactive passives cannot recursively trigger themselves or multiply by hit count.

Old Domains migrate into the nine classifications. Fire, Water, Ice and similar names survive as elemental motifs where needed for weather, artwork and field capabilities. Learned IDs, equipped slots, trained choices and cooldowns are preserved; merged passive slots migrate deterministically. See [classification rules and the exact migration table](docs/classification-reconciliation.md) and [all curated passives](docs/curated-passives.csv).

## Progression and exploration

Eight Clan Crests, Guild rank and the three Guild trials qualify a Sealer for the regional Championship. Facilities provide consecutive matches with previewed opponent levels and restrictions. Loss ends an attempt. Read each entry preview for its requirements and team limits.

**Temple philosophies govern physical trials and enemy behavior.** Six floors contain three philosophy-specific trials, two disciples and a Master. Attrition uses resource-draining vents; Counterplay uses opposing mirrors; Tempo uses timed beats; Resilience uses braces and tremor zones; Control uses changing switches and passages; Transformation uses form phases; Synergy uses paired resonance wells; Prediction uses observable patterns. Stair seals require actual objectives and battle victories. Misreads strengthen later defenders by up to two levels. Enemies favor eligible learned Techniques and Sealer support associated with their philosophy. Synergy coordinates legal cooperative ready windows; Counterplay uses recent matching hits. Transformation opponents change form at Health thresholds in both first challenges and rematches, preserving running timers.

**Faction investigations take place in tracked compounds on the world map.** Follow physical scout clues, enter a supply outpost, recover caches, dismantle its binding array and reach the command sanctuary. Each chapter has collision obstacles, alternate paths and a guard. Remote menu clicks cannot complete objectives. Visible tripwires and incorrect sigils raise alerts, adding two levels per alert to later defenders, capped at three alerts. Each optional captive rescue removes two levels from the leader. Supplies, alerts, rescues, mechanisms and victories persist through retreat and save/load.

Four legendary lineages use bundled front/rear artwork and regional disturbances, rituals, time/weather conditions and battles. They are accessible in the default offline game without a generation provider. Caves and field puzzles support Push, Cleave, Crush, Swim, Fly, Dig, Teleport and Steed when the current individual qualifies; alternate routes and mechanisms preserve traversal.

See [Temple and faction mechanics](docs/physical-progression.md).

## Artwork and scope

The game has detailed world, settlement, interior and dungeon atlases, full-body roster portraits, battle rear views, companion field animations, Technique effects and synthesized original music. Current companion walking uses articulated animation from the roster/front/rear assets, with mirrored side presentations; it is not a separately hand-drawn four-direction walking sheet for every form.

This remains a playable alpha. Production balance, procedural narrative depth, independent side-view creature artwork and sustained Android hardware performance need further work. Automated progression validates rules and reachable objectives under its documented preparation assumptions; it is not a substitute for player difficulty testing.

## Optional local generation

The built-in roster and legendary content work without AI. To create additional lineages, run a local Ollama text/vision model and a compatible Stable Diffusion WebUI API, start the companion, choose your installed model in Options, then enable generation. No model is bundled or downloaded automatically. A new lineage becomes encounterable only after three complete, validated form images. Existing discovered individuals retain their identity.

Default endpoints are `http://127.0.0.1:11434` (Ollama), `http://127.0.0.1:7860` (image API) and `http://127.0.0.1:4317` (companion). Custom loopback endpoints use `SPIRIMON_OLLAMA` and `SPIRIMON_IMAGE`; trusted browser origins use `SPIRIMON_ORIGINS`. See [creature generation](docs/creature-generation.md) and [reference anatomy catalog](docs/creature-catalog.md). Generation quality and latency depend on the installed models and hardware.

## Development and verification

```sh
npm run build
npm test
npm run audit:progression
node build.mjs --target app --out-dir _app
```

The progression audit walks the real Temple and faction maps, solves mechanisms, runs actual combat with the same enemy Sealer deployment/support/cooperative controller as the live game, uses consumed Shrines for recovery and round-trips saves at Crest milestones. Its deterministic report is [expanded-progression-audit.json](docs/expanded-progression-audit.json).

`engine.mjs` owns generation/combat rules; `realtime-combat.mjs` owns scheduling; `battle-session.mjs` owns live rosters, `enemy-tactics.mjs` owns shared enemy Sealer decisions; `battle-view.mjs` owns the battle interface. `temple-philosophies.mjs`, `faction-campaigns.mjs`, `domains.mjs` and `passive-catalog.mjs` hold the systems described above. `app.mjs` connects input, drawing and persistence.

Pushes to main trigger the Pages build/tests/deployment workflow and standalone validation/packaging. The web build has one versioned JavaScript bundle and lazy artwork; the standalone HTML embeds built-in assets. Installed-app builds use bundled local assets without duplicating the HTML download. See [maintenance and release architecture](docs/maintenance.md) for budgets and workflow details. Older design documents may describe superseded behavior; the README and linked live-rule documents describe the current implementation.
