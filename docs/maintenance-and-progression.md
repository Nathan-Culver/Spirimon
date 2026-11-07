# Maintenance and expanded progression verification

## Rewards, recovery, and saves

Battle rewards now total defeated individuals, including trainer reserves defeated later in the same battle. Living reserves and duplicate references grant nothing. Wild victories grant no Coin. Device files are authoritative at startup; corrupt or disconnected files open a valid recovery copy with writes paused, or stop loading if no recovery exists. Desktop and Android have independent folder-backed saves with a previous complete copy.

The practice screen displays actual GCD/LCD timing. Startup markup omits an unresolved string expression; faction chapters keep their current objective in the map HUD; paid legendary stages refresh the Energy meter immediately. Perception reveals regional legendary disturbances independently of shrine placement. A simultaneous knockout now uses a real available Shrine, consuming its one recovery action until reset, just as defeat recovery does.

The approved combat values remain in force: Spirimon maximum Health is halved after the original calculation, standard damage receives its final 1.25 multiplier, and Agile damage is 85% of Normal. Shrines retain their reduced density, at most one per region, and one Restore, Meditate, or Commune action per reset.

## Physical content

Each hostile faction now has a persistent four-floor compound: inspect three scout clues, recover the outpost supplies through a counterweight, read and disable Root → Moon → Star, then reach the leader's sanctuary. Guards have themed teams. Objectives, victories, caches, barriers, and the furthest unlocked floor survive retreat and save/reload. Caches pay once. Guards occupy their tiles and require adjacent interaction. Map placement reserves an approach and avoids Shrines, cave mouths, other camps, and legendary sites. The investigation menu tracks a camp instead of advancing a scene counter.

The four legendary profiles have finished three-form front and rear artwork: Starved Star, Sleeping Crown, Last Dawn, and Deep Listener. Rites require reaching the actual regional disturbance at its required time/weather. Each paid stage persists; an incorrect or remote request spends nothing. Three stages unlock the encounter without an image provider. Defeating a legend allows another sealing attempt; a successfully bonded regional legend cannot be collected twice. Legendary species are excluded from ordinary wild/NPC selection.

## Companion movement

All 450 general-roster forms were visually reviewed and bound to authored movement rigs. Twelve legendary forms use their observed anatomy. The eight rig families cover bipedal, quadrupedal, scuttling, winged, serpentine, rooted, flowing, and hovering movement; a lineage can change movement as it evolves. Motion deforms the original artwork with alternating feet, arm counter-swing, wing articulation, or tendril waves. North uses audited rear artwork; south uses front artwork; west/east use the existing three-quarter art in opposite orientations. Explicit direction sprite sheets still take precedence when present.

The same renderer serves field followers, caves, interiors, and mounts. A 24-canvas LRU bounds the baked walking cache to 6 MiB. `tools/render-companion-audit.mjs` rendered 7,392 frames across 462 forms: zero empty frames and zero silhouettes touching a cell border. See the JSON report and contact sheet in this directory. This is texture-rig animation, not independently drawn side-profile sheets.

## Progression results

`tools/audit-progression.mjs` uses the real combat, AI, rewards, XP, equipment, Energy, shrine, puzzle, and save modules. It includes current rank-scaled Temple levels and growing Master teams, boss threshold behavior, level-scaled Guild trials, elimination/retry, and the eight-match championship.

| Run | Battles | Final level | Shrine restorations | Championship attempts |
|---|---:|---:|---:|---:|
| progression-1 | 427 | 152 | 217 | 6 |
| progression-2 | 281 | 89 | 139 | 1 |
| progression-3 | 285 | 89 | 162 | 1 |

All three expanded runs completed eight Crests, all three four-floor faction campaigns, all four legendary encounters, all three Guild trials, and the championship. The first roster required championship retries; the other two completed without a battle loss. Detailed matches and recoveries are in `expanded-progression-audit.json`. The Final's actual boss thresholds are included. The initial three-attempt audit limit was too short for the first roster; the game permits unlimited retries, and the audit now allows eight attempts. Approved Health and damage values were not changed to force completion.

These are automated rules simulations with map reachability checks, not manually walked device playthroughs. Preparation assumes six early level-3 bonds, only three manifested at once, eligible learned Techniques, purchased supplies and training, earned equipment, and one minute of abstract travel between encounters. All later levels come from battle XP; healing uses available Shrines and real inventory. Defeat deducts Coin and drops one third of carried supplies. The script round-trips the device-file format at each Crest. It does not model every overworld step, initial acquisition of those six bonds, the full UI's scheduling or cooperative policy, human reaction time, or Android hardware performance. The first roster's repeated championship losses and much higher final level are a pacing/balance concern for further manual playtests, not evidence that extra leveling guarantees an easy championship.

## Reproducing checks

- `node build.mjs && npm test`: 564 passing regression tests.
- `node tools/audit-progression.mjs progression-1 progression-2 progression-3`: main path.
- `node tools/audit-progression.mjs --expanded progression-1 progression-2 progression-3`: expanded path.
- `node tools/render-companion-audit.mjs`: optional Canvas2D visual audit (requires `@napi-rs/canvas`).
- `python tools/pack-legends.py`: reproduce the eight runtime atlases from the lossless source sheets (Pillow and NumPy).

The combat workflow now runs an expanded progression seed and preserves the report as an artifact. The web and native builds share the tested source and runtime asset inventory; source-art sheets are excluded from downloads.

## Live browser check

The published game loaded an isolated backup through its normal Import backup control, entered the Ashen Hand compound from its physical entrance, walked to the first clue, and recorded 1/3 clues. A separate isolated backup reached the Last Dawn disturbance at night, paid all three rite stages (22 Energy after Control), entered a level-44 legendary battle with finished front/rear art, and successfully retreated. The browser test caught the startup text and faction HUD issues addressed by the final display patch. The screenshot is `legendary-live-smoke.jpg`. These fixtures are separate from the player's ordinary save.
