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

## Live combat follow-up

Enemy Sealer decisions now share `enemy-tactics.mjs` between the live session and the progression audit. The controller scores useful effects across the whole support Technique: a heal with a cleansing component can still be useful at full Health if its recipient is poisoned. It avoids ineffective healing, already-covered protections and incompatible guard effects. Urgent recovery takes priority over ordinary buffs and Synergy combinations. Nonurgent support preserves enough Energy for the cheapest conscious sealed reserve.

| Philosophy | Sealer preparation emphasis |
| --- | --- |
| Attrition | Willpower recovery, healing and guard |
| Counterplay | Shields, Reprise and mental relief |
| Tempo | Quickening, Reprise and Resonance |
| Resilience | Healing, shields and guard |
| Control | Reprise, Quickening and guard |
| Transformation | Resonance, healing and guard |
| Synergy | Soulbridge, shields, healing and cooperative actions |
| Prediction | Sanctuary, Resonance and Quickening |

These are generated, compatible, learned support Techniques under the same six assigned slots plus one floating slot as the player. All normal Energy costs, shared recasts, Output limits, optional empowerment timing, assignments, vows and target restrictions apply. The controller does not queue actions or reset cooldowns. Synergy manifests its affordable opening team and can wait up to 750ms for a compatible shared ready window before individual attacks spend it. It retains emergency-healing priority. The wait reserves no action, resources or cooldown; missed windows release individual actors. A channeling Sealer cannot begin a cooperative action.

Open Hand forbids offensive support and attack combinations, so it is no longer automatically assigned to philosophies that depend on those actions. Existing incompatible legacy defaults on those enemy profiles are migrated once. Defensive Temple defaults and other saved enemy vows remain; player vows are unchanged.

Counterplay uses a received hit of the matching category, from the actual target, within the preceding eight active seconds. The AI no longer schedules a counter merely because a future attack seems likely. Damage sharing and periodic effects cannot refresh an old counter opportunity. Prediction's wounded-target preference uses the target's fraction of maximum Health, rather than comparing raw Health between differently sized Spirimon.

Transformation thresholds run inside the real-time scheduler. They work in ordinary Temple battles and Master rematches, including after save/load, independently of boss interface metadata. Pending casts, equipped Techniques and cooldown deadlines survive the form change. Sealed reserves do not change form until manifested, and paused combat does not advance transformations.

Tempo's expired sequence now resets as soon as its objective is displayed, without requiring another mechanism interaction. Timeout tracking does not repeatedly count the same expired window.

The battle log identifies **Your Sealer** and **Enemy Sealer** for support casts and cooperative actions. Progression reports record actual enemy support, cooperative and transformation activity, instead of emulating those effects with separate audit-only code.
