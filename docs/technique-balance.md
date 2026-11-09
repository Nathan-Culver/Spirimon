# Spirimon Technique balance

Every authored, lineage, Domain, generated and saved Technique uses `technique-balance.mjs`. IDs, equipped slots, unlock requirements, resource contributions and existing cooldown progress remain intact. Migration is idempotent. A generated proposal must first pass the existing mechanics/anatomy/budget validation, then receives the same balance policy as authored Techniques.

## Continuous growth

Technique potency is constant; actual damage grows continuously with the attacker's level and PA/PD or SA/SD ratio, with no level-100 ceiling or extra tier multipliers. The Normal-style baseline before existing modifiers is:

`(10 + 2.25 × level) × potency / 320 × adjusted attack / adjusted defense`

The level term follows reference Health growth under the current IV/EV/Nature stat formula. It replaces the old `/24 + 2` formula that made ordinary attacks lethal against new low-level Health values. The level term uses the attacker, not a percentage of the defender's Health: stronger stats, levels, forms, training and equipment still matter.

Matching Type retains its 1.5× bonus, advantages remain 2×, and resistances remain 0.5×. Domain matching, styles, criticals, commitment, passives, equipment and difficulty still apply. These intentionally change survival; the reference audit does not promise a fixed number of hits in every matchup.

## Relative power and timing

The old 15–150 power range is compressed into an expected total potency of `min(90, 26 + .44 × old power × expected hits)`. Damaging stage changes, drain, afflictions, conditional payoffs and spread attacks pay for their additional benefit through reduced direct potency. Recoil, recharge and charge attacks receive a modest potency allowance. Multi-hit attacks share a total potency budget and round after combining hits, avoiding a separate minimum-damage bonus per strike.

Quick attacks favor immediate availability. Heavy attacks gain burst and pay through casts and local recasts. Large finishers, spread attacks and reactions retain independent LCDs. Signature Techniques use the same timing budget as other Techniques. Their unlocks, names, artwork and effects are preserved. Speed still provides diminishing haste and the GCD floor remains one second.

## Effects

| Effect | Baseline before modifiers |
| --- | --- |
| Heal | 25% maximum Health; 22-second base local recast |
| Team heal | 18% per living active ally; 28-second base local recast |
| Full restoration | 60% maximum Health and cleanse; 45-second base local recast |
| Rest | 65% maximum Health and sleep; 40-second base local recast |
| Regeneration | 5% every two seconds for ten seconds; 24-second base local recast |
| Counter / Spiritual counter | Twice a recent matching hit, capped at 40% of the user's maximum Health |
| Doom | 35% target maximum Health after its countdown; 60-second base local recast |
| Destiny Bond | On defeat, returns 50% of the smaller maximum Health; 30-second base local recast |

Cooldowns are modified by haste, style, exhaustion and passives. Status and protection durations do not grow with level. Existing resistance, cleanse and control-immunity rules remain. Periodic damage and regeneration retain fractional Health between pulses, including save/load and exploration, so low-level effects neither disappear through rounding nor gain an excessive one-HP minimum each pulse.

Damaging buffs target an opponent and then grant their existing one-stage benefit to the user. Stage limits, secondary-affliction chances, healing modifiers and maximum-Health limits remain in force.

## Verification

`npm run audit:moves` writes the full before/after potency, effects and timing catalog to `move-balance-audit.csv`, with equal-stat reference damage at levels 1, 2, 3, 5, 10, 16, 36, 60, 100, 200 and 1000. The reference audit isolates neutral, matching-Type, Normal-style attacks without criticals or conditional payoffs; counters use their actual received-hit rule during combat. Automated tests also cover low-level roster attacks against Lotusling, multi-hit rounding, effect limits, save migration, generated mechanics, sustained throughput, and execution through the real-time scheduler. Human playtesting remains useful for team composition and tactical combinations.
