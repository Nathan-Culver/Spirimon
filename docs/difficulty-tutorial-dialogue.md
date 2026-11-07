# Difficulty, commitment, learning and NPC encounters

Normal is now the default. Difficulty can be changed in Options outside battle. Owned and enemy individuals carry explicit mode and side information, including saved battles, reserves, roaming encounters and trades. Switching preserves Health percentages, incapacitation, resources and cooldown deadlines. Legacy half-Health saves migrate to Normal without reviving or giving free percentage healing.

| Mode | Your Health | Your damage | Enemy Health | Enemy damage | Shrines |
| --- | ---: | ---: | ---: | ---: | --- |
| Easy | 2× | 1.25× | 0.5× | 0.75× | One per town/route; one across a city |
| Normal | 1× | 1× | 1× | 1× | Classic density: two per town, two or three per route |
| Hard | 0.5× | 1.25× | 0.5× | 1.25× | Previous sparse distribution, at most one |

Normal density is counted per generated settlement area; a city can span several areas. Easy has the requested one-per-city limit. All multipliers use the original stat/damage formulas as their baseline. Healing follows the affected individual’s maximum. All modes retain one shared Restore/Meditate/Commune action per Shrine until reset, and switching modes does not clear used Shrine IDs. Blackouts return to the last visited Shrine, waiting for its next day/night reset if already used; the starting Shrine is always available as a fallback location. Manifestation costs normalize difficulty Health, so Easy bonuses do not make additional allies more expensive.

## Joint pacing review

The Health/damage split deliberately changes pacing: identical balanced reference combatants at level 20 require approximately 13 hits in Normal versus 5 in Hard. Easy requires the same 5 outgoing hits while tolerating 35 incoming reference hits. This is the intended asymmetric advantage, not an enemy-only damage increase.

Overworld grass/night/swimming encounter rules are retained. Cave chance per eligible step is 13% in Hard, 6.5% in Normal and 4% in Easy. All battles grant an eight-step random-encounter respite afterward. Forced sight challenges remain separate. The expected cave intervals including that respite are about 16, 23 and 33 steps respectively, before concealment. No mandatory faction/Temple room gains random encounters.

Base support remains instant. Empowered Mend/Willpower/revival retains its short cast tradeoff; other empowered support extends its recast. The tested basic reference Mend restores 18.1% Health, has a 24-second recast and costs 3 Energy for a level-1 Sealer; investing 10 extra Energy quotes 22.6%, a 375ms cast and 13 total Energy. Actual generated variants, Sealer levels, Control, bonds and vows change those quotes. Tonics retain 50% healing, and creature healing retains its level-specific timing and percentages. Support cards show the actual effect, GCD/LCD, cast and recast without requiring hover.

The reference budgets use the real damage, stat, timing and support-quote functions. See `joint-balance-audit.json` and reproduce with `node tools/audit-difficulty.mjs`. They omit crits, afflictions, tactical target changes and human reaction time.

| Mode | Battles | Final level | Shrine restores | Championship attempts | Median non-training match |
| --- | ---: | ---: | ---: | ---: | ---: |
| Easy | 301 | 83 | 53 | 1 | 12s |
| Normal | 343 | 100 | 170 | 3 | 30s |
| Hard | 286 | 89 | 176 | 1 | 11s |

All three runs completed eight Crests, three physical faction campaigns, four legendary encounters, three Guild trials and the Championship. Each uses the same progression seed with mode-specific Health/damage/recovery, actual enemy support, physical objectives and save round-trips. As before, the controller assumes six early level-3 bonds and automates manual commands; it does not simulate initial acquisition, every travel step or human reactions.

Normal’s larger Health pools give defensive support and Held Items more opportunities. One defensive qualifier reached the audit’s 360-second safety cutoff before later attempts won, and another took 302 seconds. This is a real pacing outlier, not proof of an unwinnable encounter. The fixed controller can persist with an inefficient damage category against stacked defenses. Broad healing nerfs would also weaken ordinary survival across all modes; those values are retained while the outlier is explicitly recorded for player testing. The handbook and NPC hints teach changing targets, damage categories, preparation and disruption rather than forcing every matchup through one attack.

## Commitment decision

The user selected keeping the existing strong tradeoff. Ordinary taps now always submit 50% attack / 50% defense. An unset double-tap preset is also balanced; an explicitly saved defensive zero remains valid.

| Attack commitment | Offense stat | Defense stat |
| --- | ---: | ---: |
| 0% | 25% | 175% |
| 50% (tap) | 100% | 100% |
| 100% | 175% | 25% |

The alternatives reviewed were a moderate 75%–125% stat range or a deep 50%–150% range. Neither was substituted for the selected 25%–175% range. Gesture previews now show the attack/defense allocation and both actual stat multipliers. Up/down and downward diagonals remain defensive; upward diagonals and horizontal drags scale attack commitment.

## Teaching and dialogue

A semi-transparent Spirimon button sits between Menu and Bag in desktop-map and touch controls. Menu → Tutorial opens sixteen topics covering movement, first bonds, combat, styles/commitment, casts and timers, resources, support, teams, recovery, sealing, classifications, training/equipment, exploration, time/weather/vows, progression, saves and difficulty.

Only the first actual battle after sealing receives the guided lesson. It pauses while explaining and highlighting the actual battle interface. Its practice step keeps time frozen while exposing a real Technique command; acceptance pays real costs/starts real timers and pauses for one final explanation. Continue/Skip restores combat time. State survives battle saves, and skipping or ending that encounter prevents repetition. Existing journeys that already have bonds do not unexpectedly receive a new mandatory lesson.

Role-specific introductions mix practical advice with world lore and Spirimon observations. Enemy dialogue uses coherent faction/Temple/competitive/rival pools, with different lines before and after victory, defeat or retreat. Road lookouts and eligible dungeon defenders detect an unobstructed forward line, walk to the player and demand a battle. Walls, solid props and occupants block vision. Clue and binding-array prerequisites still gate faction defenders; victories and saved guard positions persist. Defeated road lookouts do not immediately challenge again, and retreats get a short step grace. Pending saved road challenges resume without rerolling the opponent or speech.

## Domains

All 36 established Domains and their original effectiveness chart return. The previous reduction is undone using retained motif metadata. First encounters have a remembered 2% chance to document a custom Domain, which gains generated Techniques, passive choices, compatibility and matching bonuses. Definitions persist with both the journey and lineage. See `classification-reconciliation.md` for exact restoration and the limits of reconstructing erased metadata.

## Live lesson correction

The live browser check caught a deployment animation lock frozen by the teaching pause. Entering practice now settles only that initial manifestation lock, leaving GCDs and all Technique recasts intact. A saved lesson already at practice receives the same correction on resume. The full suite includes both regressions.
