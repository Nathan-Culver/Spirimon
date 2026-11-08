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

**Only Shrines provide full team restoration. Inns and Sealer Halls provide safe preparation, instruction and attunement, without full restoration.** Shrines occur at one-quarter the former density, with no more than one in a town or route region; many regions have none. Mossveil Crossing, the starting town, always has one.

Each Shrine permits **one action total**—Restore, Meditate or Commune—until the next day/night reset. Restore restores the team and Sealer Energy; Meditate restores 25% maximum Energy; Commune restores 50%. Choosing any one consumes that Shrine's current use. Consumables provide their individual advertised effects. When every attuned Spirimon is defeated, you black out and return to the last Shrine approached, even without using its recovery action. If none has been visited, you return to Mossveil Crossing’s Shrine. A spent return Shrine advances the calendar to its next reset before restoring the team and consuming that new use. This also applies to simultaneous knockouts and exploration afflictions; dropped supplies remain recoverable after defeat.

Reserve sets Energy capacity, Control improves efficiency, and Output limits optional empowerment. Level points and distinct spiritual milestones develop these attributes. Retraining and changing a voluntary vow require a safe place. Perception and concealment are paid toggles with combined drain; both turn off at battle entry. Perception pinpoints detectable discoveries, including legendary disturbances, while leaving their interactions and solutions to the player.

Prepare six assigned Sealer support Techniques plus one distinct floating Technique. Tap for ordinary strength or drag for a preview of optional expenditure and diminishing returns. Costs and timing tradeoffs appear before commitment. No Overdraw is available. At zero Energy, active Spirimon remain with the specified mild penalties; the designated lead is still free to manifest.

See [Spiritual Energy](docs/spiritual-energy.md) and [Spiritual Arts](docs/sealer-spiritual-arts.md) for formulas, vows, training and recovery details.

## Combat

Allies act on **manual commands**. Enemies act independently on the shared clock, with no player action queue. Up to three Spirimon manifest on each side. Action menus, logs and deployment choices leave combat running; hidden/background tabs freeze simulation without replaying elapsed time on return.

The base global cooldown is **3.5 seconds**, with a **1-second minimum**. Speed affects GCDs, casts and individual cooldowns. LCD Techniques have independent recasts. Cooldowns remain attached to individuals across battles, switching, revival, healing and save/load. Damage does not extend the cooldowns of instant-cast Techniques. Technique Speed is retired; practice shows cast and cooldown timing.

| Gesture | Style | Commitment | Extra Technique uses |
| --- | --- | --- | --- |
| Tap | Normal | Equal attack / defense (50% / 50%) | None |
| Up / down | Strong / Agile | Defensive (0% attack / 100% defense) | None |
| Left / right | Agile / Strong | Increases with drag distance | None |
| Up-left / up-right | Agile / Strong | Increases with drag distance | One or two |
| Down-left / down-right | Agile / Strong | Defensive (0% attack / 100% defense) | One or two |
| Double tap | Saved preset | Saved allocation, balanced if unset | Saved choice |

Agile deals **85% of Normal damage** and improves accuracy, evasiveness and critical chance. Strong raises ordinary damage and adds **15 percentage points to critical damage**, keeping the ordinary critical chance. Extra uses pay resources and expose the actor to successive enemy retaliations. Normal is the default and uses the original Health and damage formulas. Hard halves Health and multiplies damage by 1.25 for both sides. Easy gives owned Spirimon double Health and 1.25× damage; enemies have half Health and 0.75× damage. Difficulty does not change manifestation Energy costs. Switch outside battle without restoring Health percentages or cooldowns.

Physical Techniques spend Stamina; Energy and Status Techniques spend Willpower. Pressure increases costs, shortages can convert the other pool at two-for-one, and Struggle is available when no equipped Technique can be funded. Techniques scale at levels 1, 16, 36, 60, 85 and 100. Each individual has four equipped Techniques, learned alternatives, genetics, nature, bonds, training, one Held Item and optional aspects.

See [live combat rules](docs/real-time-combat.md), [Held Items](docs/held-items.md), and the [Technique audit](docs/move-balance-audit.csv).

## Classifications and passives

There are twelve Types and **36 established Domains**, including distinct Fire, Water, Air, Earth, Light, Dark and conceptual affinities. A first encounter has a 2% chance to document a new custom Domain, which persists with the journey and lineage. Innate and equipped-Technique Domains combine without duplicates; replacing a Technique removes only its acquired affinity. Suppression applies immediately. Acquired Domains do not create passive slots.

Each innate Type and Domain has sixteen passive choices. The 21 core pools retain their curated identities; restored and custom Domains receive thematic variations from a related pool, with their own names, selections and bounded values. Their mechanical distributions and triggers differ: Beast emphasizes pursuit and finishing, Plant roots and weather, Fate anticipation and rhythm, Psionic mental control and casting, and so on. Effects include conditional accuracy/evasion, criticals, drain, thorns, regeneration, casting, recasts and healing. Each innate classification supplies one prepared passive. Study alternatives and prepare unlocked choices at safe places. Matching percentage effects cap at 25%; reactive passives cannot recursively trigger themselves or multiply by hit count.

The previous many-to-nine merge has been reversed. Retained original motifs restore their Domain identities, while Time/Fate, Space/Void, Mind/Psionic and Plant/Nature spelling aliases remain supported. Learned IDs, equipped slots, trained choices and cooldowns are preserved. See [classification rules](docs/classification-reconciliation.md), the [core passive catalog](docs/curated-passives.csv), and [difficulty, tutorials and dialogue](docs/difficulty-tutorial-dialogue.md).

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

## Learning and difficulty

Menu → Tutorial opens a sixteen-topic handbook. After your first seal, only your first real battle receives a guided lesson: explanations pause combat; the practice step resumes it for a real Technique command. Skip ends the lesson and resumes battle. Other battles retain real-time combat while browsing. Ordinary taps use balanced commitment; dragging previews the offensive and defensive split and stat multipliers. A semi-transparent Spirimon shortcut sits between Menu and Bag.

NPC introductions rotate gameplay advice, world lore and Spirimon observations related to their roles. Road lookouts and eligible dungeon defenders detect an unobstructed forward line, approach the player and issue a mandatory challenge. Faction prerequisites remain enforced. Dialogue chains have distinct pre-battle and victory/defeat/retreat responses; defeated lookouts remain defeated in saves.

Normal restores classic Shrine density (two per town, two or three per route). Hard keeps sparse Shrines and at most one per region. Easy guarantees one per town or route, with one across a city. All modes keep the shared one-action-per-Shrine reset rule. Cave encounter chance per step is 6.5% in Normal, 13% in Hard and 4% in Easy. Random encounters have an eight-step respite after battle; sight challenges still apply.

### Quality of life update · November 8, 2026

- Tonics and Soul Draughts open a recipient picker with actual, capped recovery previews and a separate confirmation. Field supplies can target reserves. In battle, eligibility is checked again when confirming; an unavailable recipient never redirects a spent item to someone else.
- Battle buttons retain their grid coordinates while unavailable actions disappear. Target names appear on Techniques; selected recipients are outlined in gold. Options includes instant Technique taps and a separate saved-preset switch.
- The journal includes all accepted NPC requests, staged progress, rewards and return locations, plus regional jobs. New requests remember their giver; older requests retain their role-based return guidance.
- The atlas supports directional panning, drag panning, zoom, discovered-place search, custom pins and tracked destinations. Discovered Shrines show availability, renewal time while used and the blackout destination. Tracked destinations beyond the map viewport receive an edge arrow and tile distance.
- Collection management supports level, health percentage, bond and name sorting; Domain and Field Capability filters; favorites; and up to twelve named team arrangements usable at safe places. Equipment adds search, an eligibility filter, stat/effect comparisons and favorites protected against sale.
- Spirit details show upcoming technique level/form requirements and transformation progress. Merchants support quantities, owned counts and total-price previews, and stay open after buying.
- The menu shows save destination, last successful recovery/file saves and reconnect warnings. Five recovery checkpoints rotate at five-minute save intervals; choose Options → Recovery backups to load one. These checkpoints use the browser recovery database; linked device saves remain authoritative on startup.
- Phone options include size, independent pad/A-B offsets, opacity, gesture distance, left-handed layout and toggle-to-run. Readability options include text scaling and independent music/effects volume. Action icons and category labels supplement colors.
