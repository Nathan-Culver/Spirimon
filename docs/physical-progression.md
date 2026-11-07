# Physical Temple and faction progression

## Temple philosophies

Each Temple retains its seeded philosophy across six floors: three trial rooms, two disciple rooms and a Master arena. Interact beside visible mechanisms and NPCs using A/E/Enter. Read the inscription to begin. Floors open only after their physical objective or defender victory. Clearing a generic boulder or clicking an old menu action cannot complete a philosophy trial.

| Philosophy | Physical objective | Combat behavior |
| --- | --- | --- |
| Attrition | Close three vents; marked miasma channels drain one Stamina and one Willpower per crossing until closed. | Favors learned poison, toxic, burn, seed, curse, draining and regeneration Techniques. |
| Counterplay | Read each projected Flame/Wave/Wind attack and visit the Wave/Root/Stone opposing mirror. | Favors counters, wards, protection, disabling and interruption; responds to the opponent's last public Technique. |
| Tempo | Visit three beat seals in the inscribed order within 60 active gameplay seconds from the first seal. | Favors Agile execution, priority, Speed control and lighter attacks. |
| Resilience | Brace each of three supports to stop its paired tremor zone. Unbraced crossings cost 5% maximum Health, never causing a knockout. | Favors healing, regeneration and protective screens. |
| Control | Match the inscribed lamp pattern: Root flips Root+Moon, Moon flips Moon+Star, Star flips Star. Switches change physical shortcuts. | Favors binding, taunts, disabling, sleep and removing advantages. |
| Transformation | Cycle the regulator through three phases and visit each matching form seal. Phases change passage gates. | Begins in Form I, advances at 75% and 35% Health; favors self-modification and stronger execution after changing form. |
| Synergy | Link all three pairs of wells by physically visiting both members of each pair. | Favors team healing, wards, cleansing and party attacks, weighted more when allies are present. |
| Prediction | Read five visible symbols from a three-symbol repeating pattern and choose the next; solve three patterns. | Favors sure-hit, focus, critical and delayed attacks against exposed targets. |

Enemies select from eligible learned Techniques; the philosophy does not grant anatomically invalid moves. Preparation gives coherent loadouts and training specialties. Action scoring uses the philosophy and public battle state. Transformation preserves Health/resource percentages, equipped Techniques and active cooldowns; it does not provide a free reset.

Incorrect reactive responses add mistakes. Their total strengthens later Temple defenders by one level per mistake, capped at two levels. Tempo timeouts reset the sequence. A physical reset counterweight clears unfinished mechanism progress without erasing mistakes. Alternate routes keep every mechanism, reset and stairs reachable in every switch/phase state without a specific field capability. Optional Push/Cleave/Crush objects provide shortcuts only.

Progress is stored by Temple identity and floor. New trial revision 2 restarts unfinished old generic/menu puzzles; earned Crests, rewards and individual progress remain intact. New trial completions and defender victories persist across retreat and save/load.

## Faction investigations

Track a compound from the Sealer's Path menu, travel to its world coordinates, approach its entrance and enter. Ashen Hand, Hollow Choir and Veil Conclave have their own persistent sites, mirrored layouts, named leaders and distinct enemy Type pools. Crest requirements appear before entry.

| Chapter | Required objectives | Obstacles and consequences |
| --- | --- | --- |
| Scout trail | Walk to and inspect three separate evidence sites; defeat the scout. | Walled routes and guarded passages; the scout cannot be challenged before the evidence is collected. |
| Supply outpost | Find the counterweight, recover three caches and defeat the quartermaster. | Pushable/cleavable barriers with alternate routes; visible alarm tripwires; two optional captive rescues. Each cache awards one tonic and 15 Coin once. |
| Binding array | Read the inscription, visit Root → Moon → Star sigils and defeat the warden. | A wrong sigil resets the sequence and raises an alert. The warden cannot be challenged while the array protects it. |
| Command sanctuary | Reach and defeat the leader. | Earlier alerts increase enemy levels; freed captives reduce the leader's binding strength. |

Crossing an armed tripwire raises an alert once for that trap. The counterweight disarms remaining wires but does not erase alarms already raised. Each alert adds two levels to subsequent guards and the leader, capped at three alerts across the outpost and array. Each freed captive awards 15 Coin once and removes two levels from the leader, down to level five. A recovered cache key and open counterweight are needed for rescues. Rescues are optional.

Menus can track camps and describe objectives; they cannot remotely advance an investigation. The interaction resolver verifies the current compound, floor and proximity against the actual feature coordinates. Stairs enforce objectives and guard victories. Physical changes, clues, claimed caches, alerts, rescues and wins survive retreat/reload. Previously completed campaigns retain completion.

## Verification

`tests/temple-philosophies.test.mjs` solves all eight philosophies over multiple seeds/floors, checks dynamic-gate traversal, timing, hazards, misreads, battle gates, AI preferences and transformation preservation. `tests/faction-legend.test.mjs` checks all compounds, distant-interaction rejection, persistent rewards and alert/rescue consequences.

`tools/physical-playtest.mjs` is an offline test controller, not shipped game code. It finds collision-valid walking paths and interacts at actual reachable locations. The expanded progression audit uses that controller, the real philosophy/faction resolvers, real combat, consumed Shrine recovery and save round-trips, then records results in `expanded-progression-audit.json`. It automates the player's commands under preparation assumptions; it does not enable allied automation in the game.
