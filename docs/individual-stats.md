# Individual battle stats

| Save key | Displayed name |
| --- | --- |
| hp | Health (HP) |
| might | Physical Attack (PA) |
| defense | Physical Defense (PD) |
| power | Spiritual Attack (SA) |
| resistance | Spiritual Defense (SD) |
| speed | Speed |

Save keys, equipment bonuses and combat stage identifiers retain their existing names for compatibility. Physical Techniques compare PA with PD; Energy Techniques compare SA with SD. Move Power remains the strength of a Technique, distinct from the renamed Spirimon stat.

Each stat has a fixed integer IV, independently rolled from 0 through 31 when a Spirimon is created, and an integer EV starting at zero. EVs cap at 252 per stat and 510 combined, including any leftover points that do not complete a group of four. Missing legacy IVs receive stable, independent values; valid existing IVs persist. Invalid save values are normalized deterministically. Twenty-five Natures retain the usual neutral or +10%/-10% non-HP effects.

For each stat, let `Q = floor((2 × Base + IV + floor(EV / 4)) × Level / 100)`.

- Health: `Q + Level + 10`.
- Other stats: `floor((Q + 5) × Nature)`.

The form adjusts species bases before this calculation: +25% per permanent form for HP, PA, PD, SA and SD, with existing Speed bases unchanged by form. Equipment, specialties, rare variants, aspects, passives and difficulty then apply as normal. Spirimon retains its unlimited leveling. Integer rounding means a particular stat can stay unchanged on an individual level.

Stats are computed from current individual data whenever combat or menus use them. Level gains recalculate automatically and preserve Health percentage, fainting, conditions, resource deficits and running cooldowns. IV/EV changes never reset cooldowns or replenish resource pools. EV-driven maximum Health increases preserve missing Health; they never revive a fainted Spirimon. The Speed timing curve responds to small Speed changes in the new level-scaled range.

## EV acquisition

- Each newly defeated enemy gives surviving recorded participants its full EV yield, without splitting it. Procedural species yield 1 EV in their strongest unmodified species base stat, increasing to 2/3 for forms two/three. A species can explicitly define `evYield` instead.
- Rewards are recorded as defeats happen, so later escaping or losing does not erase prior gains. A serialized per-battle defeat ledger prevents duplicate awards after reload. Untouched reserves, defeated participants and captured opponents grant no EVs.
- At a safe place, Spirimon details → Train opens a stat choice. A session costs 25 Coin and awards up to 8 EVs in the selected stat, plus the existing XP and bond gains. Both caps are checked before spending Coin. This cannot be used in battle.
- Historical paid physical training converts once into PA EVs at four EVs per old training point, within both limits. It no longer adds a separate flat PA bonus.

Spirimon details and discovery profiles show equally sized cards for all six stats, plus a per-stat Base/IV/EV table, Nature effects and the combined EV budget. The menu handbook and first battle lesson describe the names, attack/defense pairs and growth rules.
