# Maintenance and expanded progression verification

## Rewards, recovery, and saves

Battle rewards now total defeated individuals, including trainer reserves defeated later in the same battle. Living reserves and duplicate references grant nothing. Wild victories grant no Coin. Device files are authoritative at startup; corrupt or disconnected files open a valid recovery copy with writes paused, or stop loading if no recovery exists. Desktop and Android have independent folder-backed saves with a previous complete copy.

The practice screen displays actual GCD/LCD timing. Startup markup omits an unresolved string expression; faction chapters keep their current objective in the map HUD; paid legendary stages refresh the Energy meter immediately. Perception reveals regional legendary disturbances independently of shrine placement. A simultaneous knockout uses the same last-visited Shrine checkpoint as defeat recovery, falling back to the guaranteed starting-town Shrine. A spent return Shrine advances the calendar to its next reset before consuming a new recovery action.

Difficulty now controls these values: Normal is the original Health/damage baseline; Hard retains the half-Health, 1.25× damage and sparse Shrine rules for both sides; Easy applies player benefits and enemy penalties. Agile remains 85% of Normal-style damage in every mode. All modes share one Restore, Meditate, or Commune action per Shrine per reset. See [the current joint balance and learning review](difficulty-tutorial-dialogue.md).

## Physical content

Each hostile faction now has a persistent four-floor compound: inspect three scout clues, recover the outpost supplies through a counterweight, read and disable Root → Moon → Star, then reach the leader's sanctuary. Guards have themed teams. Objectives, victories, caches, barriers, and the furthest unlocked floor survive retreat and save/reload. Caches pay once. Guards occupy their tiles and require adjacent interaction. Map placement reserves an approach and avoids Shrines, cave mouths, other camps, and legendary sites. The investigation menu tracks a camp instead of advancing a scene counter.

The four legendary profiles have finished three-form front and rear artwork: Starved Star, Sleeping Crown, Last Dawn, and Deep Listener. Rites require reaching the actual regional disturbance at its required time/weather. Each paid stage persists; an incorrect or remote request spends nothing. Three stages unlock the encounter without an image provider. Defeating a legend allows another sealing attempt; a successfully bonded regional legend cannot be collected twice. Legendary species are excluded from ordinary wild/NPC selection.

## Companion movement

All 450 general-roster forms were visually reviewed and bound to authored movement rigs. Twelve legendary forms use their observed anatomy. The eight rig families cover bipedal, quadrupedal, scuttling, winged, serpentine, rooted, flowing, and hovering movement; a lineage can change movement as it evolves. Motion deforms the original artwork with alternating feet, arm counter-swing, wing articulation, or tendril waves. North uses audited rear artwork; south uses front artwork; west/east use the existing three-quarter art in opposite orientations. Explicit direction sprite sheets still take precedence when present.

The same renderer serves field followers, caves, interiors, and mounts. A 24-canvas LRU bounds the baked walking cache to 6 MiB. `tools/render-companion-audit.mjs` rendered 7,392 frames across 462 forms: zero empty frames and zero silhouettes touching a cell border. See the JSON report and contact sheet in this directory. This is texture-rig animation, not independently drawn side-profile sheets.

## Prior Hard-baseline progression results

The audit walks collision-valid paths through actual Temple/faction rooms, solves their mechanisms, and uses the same enemy deployment, Sealer support and cooperation controller as the live game. Transformation thresholds run in the real scheduler; the audit no longer injects those form changes.

| Run | Battles | Final level | Shrine restorations | Championship attempts | Enemy support | Enemy cooperation | Enemy form changes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| progression-1 | 286 | 87 | 176 | 1 | 595 | 5 | 1 |
| progression-2 | 396 | 135 | 218 | 5 | 844 | 5 | 9 |

Both expanded runs completed eight Crests, all three four-floor faction campaigns, all four legendary encounters, the three Guild trials and the championship. Together they solve 48 physical Temple trials. The detailed matches and consumed Shrine uses are in `expanded-progression-audit.json`. Existing Health, damage, Agile and Shrine values were not changed to force completion.

These are automated rules simulations, not manually completed device playthroughs. Preparation assumes six early level-3 bonds, at most three manifested at once, eligible learned Techniques, purchased supplies/training and earned equipment. One minute of abstract travel separates encounters; trial rooms use actual collision-valid walking. All later levels come from battle XP. Defeat deducts Coin and drops one third of carried supplies, while recovery consumes a real Shrine use. The script round-trips the device-file format at each Crest. It does not model initial acquisition of all six bonds, every overworld step, human reactions or Android hardware performance. Player commands use an automated scoring policy; the live game still requires manual allied commands.

The second roster needed multiple Championship attempts and substantially more training. That variation remains a pacing concern for player testing; passing these simulations does not establish production balance.

## Reproducing checks

- `node build.mjs && npm test`: 674 passing regression tests at this revision.
- `node tools/audit-progression.mjs progression-1 progression-2 progression-3`: main path.
- `node tools/audit-progression.mjs --expanded progression-1 progression-2 progression-3`: expanded path.
- `node tools/render-companion-audit.mjs`: optional Canvas2D visual audit (requires `@napi-rs/canvas`).
- `python tools/pack-legends.py`: reproduce the eight runtime atlases from the lossless source sheets (Pillow and NumPy).

The combat workflow now runs an expanded progression seed and preserves the report as an artifact. The web and native builds share the tested source and runtime asset inventory; source-art sheets are excluded from downloads.

## Live browser check

The published game loaded an isolated backup through its normal Import backup control, entered the Ashen Hand compound from its physical entrance, walked to the first clue, and recorded 1/3 clues. A separate isolated backup reached the Last Dawn disturbance at night, paid all three rite stages (22 Energy after Control), entered a level-44 legendary battle with finished front/rear art, and successfully retreated. The browser test caught the startup text and faction HUD issues addressed by the final display patch. The screenshot is `legendary-live-smoke.jpg`. These fixtures are separate from the player's ordinary save.

## Follow-up: six reported issues

See `six-issue-regression.md` for the entry-preview corrections, read-only primary-file handling, and integration checks of all six reported issues. The historical report above includes the subsequent philosophy and enemy-controller work; the six-issue follow-up itself did not change combat values or progression gates.

## Follow-up: quest credit and exploration transitions

Rowan's guild matches and roadside challenges now both increment the rival-victory counter. Other trainers, faction defenders and competitive opponents cannot complete the Rowan notice or award his friendship. Rival and hostile-agent counters update before accepted quests are advanced, so their final objective is recognized immediately after the correct victory. The journal displays Rowan victories instead of the total battle-win count. Already completed notices are retained for existing saves.

Cave, Temple, faction and building transitions discard movement queued in the previous scene and clear the old follower trail. Moving between dungeon floors and returning to a Shrine after defeat use the same reset. Temple entry also dismounts the player. A step onto locked Temple or faction stairs now saves and refreshes the actual position without advancing the floor or losing trial progress.

The follow-up checked 240 generated legendary/camp sites across 60 seeded regions for a walking connection to the main path, with no inaccessible placements in that sample. This is a sampled generation check, not an exhaustive proof over all seeds. Eleven regression cases exercise the actual victory and movement controllers, including persistent faction objectives and consumed Shrine recovery. The full suite has 641 passing tests; web and installed-app builds pass. Combat values, rewards and Shrine availability are unchanged by this follow-up.

## Current difficulty and learning update

Normal is now the default; the universal Hard values in older reports are historical. See [difficulty-tutorial-dialogue.md](difficulty-tutorial-dialogue.md) for three complete current mode simulations (930 battles total), exact healing/timing reference budgets, the retained Normal defensive-match outlier, commitment teaching, first-battle practice, role dialogue and persistent sight challenges. Mode-specific reports are `easy-expanded-progression-audit.json`, `normal-expanded-progression-audit.json` and `hard-expanded-progression-audit.json`. All 36 established Domains and custom discovery are documented in `classification-reconciliation.md`.
