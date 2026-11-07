# Nine Domains and curated passive identities

The active Domain catalog is **Life, Death, Fate, Void, Spirit, Psionic, Nature, Storm, Magic**. The twelve Types are unchanged. Plant remains a Type; it is not a tenth Domain.

## Existing-save migration

| Previous Domain or alias | Current Domain |
| --- | --- |
| Time, Chaos, Law | Fate |
| Space, Dark, Destruction | Void |
| Mind, Fear, Wrath, Love, Hope, Despair, Sorrow, Dreams, Nightmares | Psionic |
| Plant, Earth, Fire, Water, Ice, Metal | Nature |
| Air, Lightning | Storm |
| Light, Sun, Moon, Good, Evil, Peace | Spirit |
| Creation | Life |
| War | Magic |
| Life, Death, Fate, Void, Spirit, Psionic, Nature, Storm, Magic | Unchanged |

These are classifications, not moral judgments about a creature. Previous Light/Dark/alignment themes remain lore and presentation data. Elemental Techniques retain their original IDs, names, visual themes and fire/water/etc. flags. Those flags govern rain/sun damage and elemental weather/field exceptions. Nature alone does not grant every elemental field capability. Suppression of the canonical Domain also suppresses its associated elemental affinity.

Innate, equipped and temporary sources are canonicalized and deduplicated. Expired temporary grants no longer qualify. Unequipped learned Techniques supply no Domain. Requirements on existing equipment, Sealer support, guard effects and rituals recognize aliases. Generation and the active catalog expose only the nine Domains.

The migration preserves owned individual IDs, levels, XP, bonds, learned/unlocked Technique IDs, equipped slots, artwork and cooldown deadlines. Learnset revision 6 appends eligible canonical Techniques without replacing existing choices. Current Health is clamped to its maximum without reviving or restoring damage.

Where old passive classifications merge, an already canonical trained choice takes precedence; otherwise a stable legacy-key order selects one. Every former unlock maps into the new pool, preferring the same effect kind when available. The new choice and its unlock remain stable on subsequent loads. Separate Plant Type choices are preserved. Merged classifications do not create duplicate passive slots or bonus stacking.

## Domain effectiveness

The nine-Domain chart uses a symmetric cycle. Each row attacks the next at +50% and resists attacks from that next Domain by −25%. Other Domain pairs are neutral. Type and Domain adjustments combine additively within the existing 0.5×–2× effectiveness bounds; matching-classification bonuses retain their separate 25% cap.

| Domain | Advantage against / resists attacks from |
| --- | --- |
| Life | Death |
| Death | Spirit |
| Spirit | Void |
| Void | Magic |
| Magic | Psionic |
| Psionic | Fate |
| Fate | Storm |
| Storm | Nature |
| Nature | Life |

This replaces the incompatible 36-Domain relationship graph. Rain/sun still affect water/fire Techniques through their elemental flags rather than introducing extra Domains.

## Passive identity

Each of the 21 classifications has sixteen individually curated entries, rather than sixteen common disciplines renamed for every classification. Shared mechanical primitives remain, but effect mixes, conditional triggers and amounts differ. The complete values are in [curated-passives.csv](curated-passives.csv), generated from `passive-catalog.mjs`.

| Classification | Emphasis |
| --- | --- |
| Aberration | Distortion, mixed affinities, afflicted targets |
| Beast | Pursuit, opening pounces and finishing wounded prey |
| Celestial | Clean states, illumination, warded protection |
| Construct | Physical plating, repeated sequences and assembly |
| Elemental | Elemental weather, Energy pressure and adaptation |
| Fey | Glamour, variation, evasion and borrowed rhythm |
| Fiend | Aggression, wounded advantage and draining |
| Giant | Health, heavy impacts and physical endurance |
| Monstrosity | Predatory attacks, criticals and finishing |
| Ooze | Absorption, toxins, draining and regeneration |
| Plant | Roots, thorns, rain and grassy terrain |
| Undead | Afflictions, decay, draining and survival |
| Life | Healing, vitality and renewal |
| Death | Afflicted/wounded targets and lingering pressure |
| Fate | Prediction, timing, sequence changes and repetition |
| Void | Nonmatching affinities, disruption and evasion |
| Spirit | Wards, clean states and spiritual protection |
| Psionic | Mental resistance, casting and concentrated focus |
| Nature | Terrain, adaptation and natural recovery |
| Storm | Wind/rain, quick attacks and charged momentum |
| Magic | Technique variation, casting and recasts |

One selected passive applies per innate classification, independent for each individual. Equipped or temporary Domains do not add slots. Suppression disables the relevant effects immediately. Study/prepare uses existing safe-place training, with no random retraining failure.

Each effect kind sums to at most 25%. Conditions use current Health, actual targets, current weather/terrain and previous Technique history. Drain and thorns use actual Health damage, trigger once per actor/defender in an execution chain, and do not recursively create attacks. Multi-hit counts do not multiply their activations. Separate paid additional Technique uses begin separate chains. Regeneration uses the existing two-second pulse. Cast/recast modifiers affect newly scheduled actions; they do not reset active timers. GCDs retain their one-second floor and LCDs their two-second minimum.
