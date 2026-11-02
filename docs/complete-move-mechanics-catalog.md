# Complete move mechanics catalog

Generated from the combat-expansion source. 444 definitions across 36 magical domains. See [Combat systems](combat-systems.md) for timing, targeting, switching, equipment and AI rules. Domain techniques use Beast as a representative creature type; the learner determines their creature type.

Each Physical move contributes its base value to the shared Stanima maximum; Energy and Status moves contribute to shared Willpower. Every use consumes one point, or two against Pressure, with existing cross-pool conversion retained. Charging pays once. Spread attacks pay once across their targets. Struggle remains the exhausted fallback with recoil.

## Core moves

| Move | ID | Category | Domain | Power | Speed | Accuracy | Pool contribution | Target | Effect |
|---|---|---|---|---:|---:|---:|---:|---|---|
| Spirit Strike | `strike` | Physical | — | 38 | 8 | 90% | 35 | opponent | — |
| Binding Lash | `lash` | Energy | — | 29 | 4 | 90% | 35 | opponent | `slow` |
| Soul Surge | `surge` | Energy | — | 64 | -18 | 90% | 20 | opponent | — |
| Quiet Renewal | `mend` | Status | — | 0 | -8 | 90% | 10 | ally | `heal` |
| Bitter Thorn | `venom` | Physical | — | 24 | 2 | 90% | 35 | opponent | `poison` |
| Spirit Ward | `ward` | Status | — | 0 | 12 | 90% | 10 | ally | `ward` |
| Drowsing Whisper | `sleep` | Energy | — | 15 | -5 | 90% | 40 | opponent | `sleep` |
| Wild Rush | `rush` | Physical | — | 45 | 15 | 90% | 25 | opponent | `recoil` |

## Creature techniques

| Move | ID | Category | Domain | Power | Speed | Accuracy | Pool contribution | Target | Effect |
|---|---|---|---|---:|---:|---:|---:|---|---|
| Aperture Jab | `aberration-0` | Physical | — | 32 | 16 | 90% | 35 | opponent | — |
| Mind Knot | `aberration-1` | Physical | — | 25 | 3 | 90% | 35 | opponent | `slow` |
| Folded Veil | `aberration-2` | Status | — | 0 | -12 | 90% | 10 | ally | `heal` |
| Paradox Crush | `aberration-3` | Physical | — | 68 | -20 | 90% | 20 | opponent | — |
| Disquieting Gaze | `aberration-4` | Energy | — | 18 | -5 | 90% | 40 | opponent | `sleep` |
| Tendril Flick | `aberration-5` | Energy | — | 40 | 9 | 90% | 35 | opponent | — |
| Spatial Shell | `aberration-6` | Status | — | 0 | 13 | 90% | 10 | ally | `ward` |
| Recursive Rend | `aberration-7` | Physical | — | 54 | 18 | 90% | 25 | opponent | `recoil` |
| Raking Claw | `beast-0` | Physical | — | 32 | 16 | 90% | 35 | opponent | — |
| Hamstring Bite | `beast-1` | Physical | — | 25 | 3 | 90% | 35 | opponent | `slow` |
| Den Instinct | `beast-2` | Status | — | 0 | -12 | 90% | 10 | ally | `heal` |
| Antler Charge | `beast-3` | Physical | — | 68 | -20 | 90% | 20 | opponent | — |
| Venom Fang | `beast-4` | Energy | — | 18 | -5 | 90% | 40 | opponent | `poison` |
| Pouncing Snap | `beast-5` | Energy | — | 40 | 9 | 90% | 35 | opponent | — |
| Thick Hide | `beast-6` | Status | — | 0 | 13 | 90% | 10 | ally | `ward` |
| Stampeding Rush | `beast-7` | Physical | — | 54 | 18 | 90% | 25 | opponent | `recoil` |
| Feather Lance | `celestial-0` | Physical | — | 32 | 16 | 90% | 35 | opponent | — |
| Halo Bind | `celestial-1` | Physical | — | 25 | 3 | 90% | 35 | opponent | `slow` |
| Dawn Benediction | `celestial-2` | Status | — | 0 | -12 | 90% | 10 | ally | `heal` |
| Judgment Ray | `celestial-3` | Physical | — | 68 | -20 | 90% | 20 | opponent | — |
| Lulling Hymn | `celestial-4` | Energy | — | 18 | -5 | 90% | 40 | opponent | `sleep` |
| Star Dart | `celestial-5` | Energy | — | 40 | 9 | 90% | 35 | opponent | — |
| Radiant Aegis | `celestial-6` | Status | — | 0 | 13 | 90% | 10 | ally | `ward` |
| Comet Descent | `celestial-7` | Physical | — | 54 | 18 | 90% | 25 | opponent | `recoil` |
| Rivet Shot | `construct-0` | Physical | — | 32 | 16 | 90% | 35 | opponent | — |
| Gear Snare | `construct-1` | Physical | — | 25 | 3 | 90% | 35 | opponent | `slow` |
| Field Repair | `construct-2` | Status | — | 0 | -12 | 90% | 10 | ally | `heal` |
| Iron Piledriver | `construct-3` | Physical | — | 68 | -20 | 90% | 20 | opponent | — |
| Corrosive Bolt | `construct-4` | Energy | — | 18 | -5 | 90% | 40 | opponent | `poison` |
| Spring Hammer | `construct-5` | Energy | — | 40 | 9 | 90% | 35 | opponent | — |
| Porcelain Guard | `construct-6` | Status | — | 0 | 13 | 90% | 10 | ally | `ward` |
| Furnace Impact | `construct-7` | Physical | — | 54 | 18 | 90% | 25 | opponent | `recoil` |
| Spark Lash | `elemental-0` | Physical | — | 32 | 16 | 90% | 35 | opponent | — |
| Quicksand Grip | `elemental-1` | Physical | — | 25 | 3 | 90% | 35 | opponent | `slow` |
| Renewing Current | `elemental-2` | Status | — | 0 | -12 | 90% | 10 | ally | `heal` |
| Tempest Break | `elemental-3` | Physical | — | 68 | -20 | 90% | 20 | opponent | — |
| Cinder Mark | `elemental-4` | Energy | — | 18 | -5 | 90% | 40 | opponent | `poison` |
| Gale Needle | `elemental-5` | Energy | — | 40 | 9 | 90% | 35 | opponent | — |
| Stone Mantle | `elemental-6` | Status | — | 0 | 13 | 90% | 10 | ally | `ward` |
| Torrent Crash | `elemental-7` | Physical | — | 54 | 18 | 90% | 25 | opponent | `recoil` |
| Briar Pin | `fey-0` | Physical | — | 32 | 16 | 90% | 35 | opponent | — |
| Silken Tether | `fey-1` | Physical | — | 25 | 3 | 90% | 35 | opponent | `slow` |
| Nectar Blessing | `fey-2` | Status | — | 0 | -12 | 90% | 10 | ally | `heal` |
| Glamour Burst | `fey-3` | Physical | — | 68 | -20 | 90% | 20 | opponent | — |
| Pollen Dream | `fey-4` | Energy | — | 18 | -5 | 90% | 40 | opponent | `sleep` |
| Pixie Feint | `fey-5` | Energy | — | 40 | 9 | 90% | 35 | opponent | — |
| Petal Shroud | `fey-6` | Status | — | 0 | 13 | 90% | 10 | ally | `ward` |
| Moonlit Prank | `fey-7` | Physical | — | 54 | 18 | 90% | 25 | opponent | `recoil` |
| Barbed Hook | `fiend-0` | Physical | — | 32 | 16 | 90% | 35 | opponent | — |
| Chain Drag | `fiend-1` | Physical | — | 25 | 3 | 90% | 35 | opponent | `slow` |
| Cinder Feast | `fiend-2` | Status | — | 0 | -12 | 90% | 10 | ally | `heal` |
| Infernal Cleave | `fiend-3` | Physical | — | 68 | -20 | 90% | 20 | opponent | — |
| Malice Murmur | `fiend-4` | Energy | — | 18 | -5 | 90% | 40 | opponent | `poison` |
| Ember Talon | `fiend-5` | Energy | — | 40 | 9 | 90% | 35 | opponent | — |
| Obsidian Hide | `fiend-6` | Status | — | 0 | 13 | 90% | 10 | ally | `ward` |
| Hellfire Rush | `fiend-7` | Physical | — | 54 | 18 | 90% | 25 | opponent | `recoil` |
| Knuckle Sweep | `giant-0` | Physical | — | 32 | 16 | 90% | 35 | opponent | — |
| Ground Quake | `giant-1` | Physical | — | 25 | 3 | 90% | 35 | opponent | `slow` |
| Mountain Breath | `giant-2` | Status | — | 0 | -12 | 90% | 10 | ally | `heal` |
| Colossal Slam | `giant-3` | Physical | — | 68 | -20 | 90% | 20 | opponent | — |
| Dazing Roar | `giant-4` | Energy | — | 18 | -5 | 90% | 40 | opponent | `slow` |
| Boulder Flick | `giant-5` | Energy | — | 40 | 9 | 90% | 35 | opponent | — |
| Granite Guard | `giant-6` | Status | — | 0 | 13 | 90% | 10 | ally | `ward` |
| Avalanche Step | `giant-7` | Physical | — | 54 | 18 | 90% | 25 | opponent | `recoil` |
| Palm Arc | `humanoid-0` | Physical | — | 32 | 16 | 90% | 35 | opponent | — |
| Joint Lock | `humanoid-1` | Physical | — | 25 | 3 | 90% | 35 | opponent | `slow` |
| Centered Breath | `humanoid-2` | Status | — | 0 | -12 | 90% | 10 | ally | `heal` |
| Fourfold Palm | `humanoid-3` | Physical | — | 68 | -20 | 90% | 20 | opponent | — |
| Hypnotic Mask | `humanoid-4` | Energy | — | 18 | -5 | 90% | 40 | opponent | `sleep` |
| Ribbon Cut | `humanoid-5` | Energy | — | 40 | 9 | 90% | 35 | opponent | — |
| Measured Stance | `humanoid-6` | Status | — | 0 | 13 | 90% | 10 | ally | `ward` |
| Whirling Heel | `humanoid-7` | Physical | — | 54 | 18 | 90% | 25 | opponent | `recoil` |
| Horn Pierce | `monstrosity-0` | Physical | — | 32 | 16 | 90% | 35 | opponent | — |
| Coiling Grasp | `monstrosity-1` | Physical | — | 25 | 3 | 90% | 35 | opponent | `slow` |
| Mythic Renewal | `monstrosity-2` | Status | — | 0 | -12 | 90% | 10 | ally | `heal` |
| Chimeric Roar | `monstrosity-3` | Physical | — | 68 | -20 | 90% | 20 | opponent | — |
| Basilisk Haze | `monstrosity-4` | Energy | — | 18 | -5 | 90% | 40 | opponent | `poison` |
| Wing Shear | `monstrosity-5` | Energy | — | 40 | 9 | 90% | 35 | opponent | — |
| Scaled Bastion | `monstrosity-6` | Status | — | 0 | 13 | 90% | 10 | ally | `ward` |
| Legendary Onrush | `monstrosity-7` | Physical | — | 54 | 18 | 90% | 25 | opponent | `recoil` |
| Gel Whip | `ooze-0` | Physical | — | 32 | 16 | 90% | 35 | opponent | — |
| Viscous Grasp | `ooze-1` | Physical | — | 25 | 3 | 90% | 35 | opponent | `slow` |
| Reconstitute | `ooze-2` | Status | — | 0 | -12 | 90% | 10 | ally | `heal` |
| Pressure Flood | `ooze-3` | Physical | — | 68 | -20 | 90% | 20 | opponent | — |
| Caustic Drip | `ooze-4` | Energy | — | 18 | -5 | 90% | 40 | opponent | `poison` |
| Droplet Shot | `ooze-5` | Energy | — | 40 | 9 | 90% | 35 | opponent | — |
| Jelly Barrier | `ooze-6` | Status | — | 0 | 13 | 90% | 10 | ally | `ward` |
| Amorphous Surge | `ooze-7` | Physical | — | 54 | 18 | 90% | 25 | opponent | `recoil` |
| Thorn Prick | `plant-0` | Physical | — | 32 | 16 | 90% | 35 | opponent | — |
| Strangler Vine | `plant-1` | Physical | — | 25 | 3 | 90% | 35 | opponent | `slow` |
| Root Renewal | `plant-2` | Status | — | 0 | -12 | 90% | 10 | ally | `heal` |
| Pitcher Crush | `plant-3` | Physical | — | 68 | -20 | 90% | 20 | opponent | — |
| Sundew Toxin | `plant-4` | Energy | — | 18 | -5 | 90% | 40 | opponent | `poison` |
| Seed Needle | `plant-5` | Energy | — | 40 | 9 | 90% | 35 | opponent | — |
| Bark Mantle | `plant-6` | Status | — | 0 | 13 | 90% | 10 | ally | `ward` |
| Bramble Rush | `plant-7` | Physical | — | 54 | 18 | 90% | 25 | opponent | `recoil` |
| Bone Shard | `undead-0` | Physical | — | 32 | 16 | 90% | 35 | opponent | — |
| Grave Bind | `undead-1` | Physical | — | 25 | 3 | 90% | 35 | opponent | `slow` |
| Soul Reassembly | `undead-2` | Status | — | 0 | -12 | 90% | 10 | ally | `heal` |
| Tomb Collapse | `undead-3` | Physical | — | 68 | -20 | 90% | 20 | opponent | — |
| Restless Lull | `undead-4` | Energy | — | 18 | -5 | 90% | 40 | opponent | `sleep` |
| Spectral Scratch | `undead-5` | Energy | — | 40 | 9 | 90% | 35 | opponent | — |
| Shroud Guard | `undead-6` | Status | — | 0 | 13 | 90% | 10 | ally | `ward` |
| Revenant Charge | `undead-7` | Physical | — | 54 | 18 | 90% | 25 | opponent | `recoil` |

## Domain techniques

| Move | ID | Category | Domain | Power | Speed | Accuracy | Pool contribution | Target | Effect |
|---|---|---|---|---:|---:|---:|---:|---|---|
| Zephyr Needle | `domain-air-0` | Energy | Air | 35 | 12 | 90% | 35 | opponent | — |
| Still Air | `domain-air-1` | Energy | Air | 20 | 2 | 90% | 40 | opponent | `slow` |
| Cyclone Crest | `domain-air-2` | Energy | Air | 70 | -22 | 90% | 20 | opponent | — |
| Wind Mantle | `domain-air-3` | Status | Air | 0 | 10 | 90% | 10 | ally | `ward` |
| Stone Splinter | `domain-earth-0` | Energy | Earth | 35 | 12 | 90% | 35 | opponent | — |
| Mire Step | `domain-earth-1` | Energy | Earth | 20 | 2 | 90% | 40 | opponent | `slow` |
| Fault Rupture | `domain-earth-2` | Energy | Earth | 70 | -22 | 90% | 20 | opponent | — |
| Clay Aegis | `domain-earth-3` | Status | Earth | 0 | 10 | 90% | 10 | ally | `ward` |
| Ember Jet | `domain-fire-0` | Energy | Fire | 35 | 12 | 90% | 35 | opponent | — |
| Scorch Veil | `domain-fire-1` | Energy | Fire | 20 | 2 | 90% | 40 | opponent | `slow` |
| Pyre Bloom | `domain-fire-2` | Energy | Fire | 70 | -22 | 90% | 20 | opponent | — |
| Cinder Cloak | `domain-fire-3` | Status | Fire | 0 | 10 | 90% | 10 | ally | `ward` |
| Tidal Dart | `domain-water-0` | Energy | Water | 35 | 12 | 90% | 35 | opponent | — |
| Undertow | `domain-water-1` | Energy | Water | 20 | 2 | 90% | 40 | opponent | `slow` |
| Riptide Break | `domain-water-2` | Energy | Water | 70 | -22 | 90% | 20 | opponent | — |
| Mist Mantle | `domain-water-3` | Status | Water | 0 | 10 | 90% | 10 | ally | `ward` |
| Gleam Pin | `domain-light-0` | Energy | Light | 35 | 12 | 90% | 35 | opponent | — |
| Dazzling Haze | `domain-light-1` | Energy | Light | 20 | 2 | 90% | 40 | opponent | `slow` |
| Prismatic Ray | `domain-light-2` | Energy | Light | 70 | -22 | 90% | 20 | opponent | — |
| Lucent Shell | `domain-light-3` | Status | Light | 0 | 10 | 90% | 10 | ally | `ward` |
| Shadow Stitch | `domain-dark-0` | Energy | Dark | 35 | 12 | 90% | 35 | opponent | — |
| Deepening Dusk | `domain-dark-1` | Energy | Dark | 20 | 2 | 90% | 40 | opponent | `slow` |
| Abyssal Bloom | `domain-dark-2` | Energy | Dark | 70 | -22 | 90% | 20 | opponent | — |
| Umbral Guard | `domain-dark-3` | Status | Dark | 0 | 10 | 90% | 10 | ally | `ward` |
| Dawn Spear | `domain-sun-0` | Energy | Sun | 35 | 12 | 90% | 35 | opponent | — |
| Sun Daze | `domain-sun-1` | Energy | Sun | 20 | 2 | 90% | 40 | opponent | `slow` |
| Solar Crest | `domain-sun-2` | Energy | Sun | 70 | -22 | 90% | 20 | opponent | — |
| Daybreak Veil | `domain-sun-3` | Status | Sun | 0 | 10 | 90% | 10 | ally | `ward` |
| Crescent Cut | `domain-moon-0` | Energy | Moon | 35 | 12 | 90% | 35 | opponent | — |
| Lunar Lull | `domain-moon-1` | Energy | Moon | 20 | 2 | 90% | 40 | opponent | `sleep` |
| Moonfall | `domain-moon-2` | Energy | Moon | 70 | -22 | 90% | 20 | opponent | — |
| Silver Shroud | `domain-moon-3` | Status | Moon | 0 | 10 | 90% | 10 | ally | `ward` |
| Static Fang | `domain-lightning-0` | Energy | Lightning | 35 | 12 | 90% | 35 | opponent | — |
| Nerve Jolt | `domain-lightning-1` | Energy | Lightning | 20 | 2 | 90% | 40 | opponent | `slow` |
| Thunder Crown | `domain-lightning-2` | Energy | Lightning | 70 | -22 | 90% | 20 | opponent | — |
| Charged Screen | `domain-lightning-3` | Status | Lightning | 0 | 10 | 90% | 10 | ally | `ward` |
| Frost Needle | `domain-ice-0` | Energy | Ice | 35 | 12 | 90% | 35 | opponent | — |
| Numbing Rime | `domain-ice-1` | Energy | Ice | 20 | 2 | 90% | 40 | opponent | `slow` |
| Glacier Crash | `domain-ice-2` | Energy | Ice | 70 | -22 | 90% | 20 | opponent | — |
| Hoarfrost Shell | `domain-ice-3` | Status | Ice | 0 | 10 | 90% | 10 | ally | `ward` |
| Metal Thread | `domain-metal-0` | Energy | Metal | 35 | 12 | 90% | 35 | opponent | — |
| Metal Reverie | `domain-metal-1` | Energy | Metal | 20 | 2 | 90% | 40 | opponent | `slow` |
| Metal Manifest | `domain-metal-2` | Energy | Metal | 70 | -22 | 90% | 20 | opponent | — |
| Metal Sanctuary | `domain-metal-3` | Status | Metal | 0 | 10 | 90% | 10 | ally | `ward` |
| Chaos Thread | `domain-chaos-0` | Energy | Chaos | 35 | 12 | 90% | 35 | opponent | — |
| Chaos Reverie | `domain-chaos-1` | Energy | Chaos | 20 | 2 | 90% | 40 | opponent | `slow` |
| Chaos Manifest | `domain-chaos-2` | Energy | Chaos | 70 | -22 | 90% | 20 | opponent | — |
| Chaos Sanctuary | `domain-chaos-3` | Status | Chaos | 0 | 10 | 90% | 10 | ally | `ward` |
| Law Thread | `domain-law-0` | Energy | Law | 35 | 12 | 90% | 35 | opponent | — |
| Law Reverie | `domain-law-1` | Energy | Law | 20 | 2 | 90% | 40 | opponent | `slow` |
| Law Manifest | `domain-law-2` | Energy | Law | 70 | -22 | 90% | 20 | opponent | — |
| Law Sanctuary | `domain-law-3` | Status | Law | 0 | 10 | 90% | 10 | ally | `ward` |
| Good Thread | `domain-good-0` | Energy | Good | 35 | 12 | 90% | 35 | opponent | — |
| Good Reverie | `domain-good-1` | Energy | Good | 20 | 2 | 90% | 40 | opponent | `slow` |
| Good Manifest | `domain-good-2` | Energy | Good | 70 | -22 | 90% | 20 | opponent | — |
| Good Sanctuary | `domain-good-3` | Status | Good | 0 | 10 | 90% | 10 | ally | `ward` |
| Evil Thread | `domain-evil-0` | Energy | Evil | 35 | 12 | 90% | 35 | opponent | — |
| Evil Reverie | `domain-evil-1` | Energy | Evil | 20 | 2 | 90% | 40 | opponent | `slow` |
| Evil Manifest | `domain-evil-2` | Energy | Evil | 70 | -22 | 90% | 20 | opponent | — |
| Evil Sanctuary | `domain-evil-3` | Status | Evil | 0 | 10 | 90% | 10 | ally | `ward` |
| Creation Thread | `domain-creation-0` | Energy | Creation | 35 | 12 | 90% | 35 | opponent | — |
| Creation Reverie | `domain-creation-1` | Energy | Creation | 20 | 2 | 90% | 40 | opponent | `slow` |
| Creation Manifest | `domain-creation-2` | Energy | Creation | 70 | -22 | 90% | 20 | opponent | — |
| Creation Sanctuary | `domain-creation-3` | Status | Creation | 0 | 10 | 90% | 10 | ally | `ward` |
| Destruction Thread | `domain-destruction-0` | Energy | Destruction | 35 | 12 | 90% | 35 | opponent | — |
| Destruction Reverie | `domain-destruction-1` | Energy | Destruction | 20 | 2 | 90% | 40 | opponent | `slow` |
| Destruction Manifest | `domain-destruction-2` | Energy | Destruction | 70 | -22 | 90% | 20 | opponent | — |
| Destruction Sanctuary | `domain-destruction-3` | Status | Destruction | 0 | 10 | 90% | 10 | ally | `ward` |
| War Thread | `domain-war-0` | Energy | War | 35 | 12 | 90% | 35 | opponent | — |
| War Reverie | `domain-war-1` | Energy | War | 20 | 2 | 90% | 40 | opponent | `slow` |
| War Manifest | `domain-war-2` | Energy | War | 70 | -22 | 90% | 20 | opponent | — |
| War Sanctuary | `domain-war-3` | Status | War | 0 | 10 | 90% | 10 | ally | `ward` |
| Peace Thread | `domain-peace-0` | Energy | Peace | 35 | 12 | 90% | 35 | opponent | — |
| Peace Reverie | `domain-peace-1` | Energy | Peace | 20 | 2 | 90% | 40 | opponent | `sleep` |
| Peace Manifest | `domain-peace-2` | Energy | Peace | 70 | -22 | 90% | 20 | opponent | — |
| Peace Sanctuary | `domain-peace-3` | Status | Peace | 0 | 10 | 90% | 10 | ally | `ward` |
| Fear Thread | `domain-fear-0` | Energy | Fear | 35 | 12 | 90% | 35 | opponent | — |
| Fear Reverie | `domain-fear-1` | Energy | Fear | 20 | 2 | 90% | 40 | opponent | `slow` |
| Fear Manifest | `domain-fear-2` | Energy | Fear | 70 | -22 | 90% | 20 | opponent | — |
| Fear Sanctuary | `domain-fear-3` | Status | Fear | 0 | 10 | 90% | 10 | ally | `ward` |
| Wrath Thread | `domain-wrath-0` | Energy | Wrath | 35 | 12 | 90% | 35 | opponent | — |
| Wrath Reverie | `domain-wrath-1` | Energy | Wrath | 20 | 2 | 90% | 40 | opponent | `slow` |
| Wrath Manifest | `domain-wrath-2` | Energy | Wrath | 70 | -22 | 90% | 20 | opponent | — |
| Wrath Sanctuary | `domain-wrath-3` | Status | Wrath | 0 | 10 | 90% | 10 | ally | `ward` |
| Love Thread | `domain-love-0` | Energy | Love | 35 | 12 | 90% | 35 | opponent | — |
| Love Reverie | `domain-love-1` | Energy | Love | 20 | 2 | 90% | 40 | opponent | `slow` |
| Love Manifest | `domain-love-2` | Energy | Love | 70 | -22 | 90% | 20 | opponent | — |
| Love Sanctuary | `domain-love-3` | Status | Love | 0 | 10 | 90% | 10 | ally | `ward` |
| Hope Thread | `domain-hope-0` | Energy | Hope | 35 | 12 | 90% | 35 | opponent | — |
| Hope Reverie | `domain-hope-1` | Energy | Hope | 20 | 2 | 90% | 40 | opponent | `slow` |
| Hope Manifest | `domain-hope-2` | Energy | Hope | 70 | -22 | 90% | 20 | opponent | — |
| Hope Sanctuary | `domain-hope-3` | Status | Hope | 0 | 10 | 90% | 10 | ally | `ward` |
| Despair Thread | `domain-despair-0` | Energy | Despair | 35 | 12 | 90% | 35 | opponent | — |
| Despair Reverie | `domain-despair-1` | Energy | Despair | 20 | 2 | 90% | 40 | opponent | `slow` |
| Despair Manifest | `domain-despair-2` | Energy | Despair | 70 | -22 | 90% | 20 | opponent | — |
| Despair Sanctuary | `domain-despair-3` | Status | Despair | 0 | 10 | 90% | 10 | ally | `ward` |
| Sorrow Thread | `domain-sorrow-0` | Energy | Sorrow | 35 | 12 | 90% | 35 | opponent | — |
| Sorrow Reverie | `domain-sorrow-1` | Energy | Sorrow | 20 | 2 | 90% | 40 | opponent | `sleep` |
| Sorrow Manifest | `domain-sorrow-2` | Energy | Sorrow | 70 | -22 | 90% | 20 | opponent | — |
| Sorrow Sanctuary | `domain-sorrow-3` | Status | Sorrow | 0 | 10 | 90% | 10 | ally | `ward` |
| Fate Thread | `domain-fate-0` | Energy | Fate | 35 | 12 | 90% | 35 | opponent | — |
| Fate Reverie | `domain-fate-1` | Energy | Fate | 20 | 2 | 90% | 40 | opponent | `slow` |
| Fate Manifest | `domain-fate-2` | Energy | Fate | 70 | -22 | 90% | 20 | opponent | — |
| Fate Sanctuary | `domain-fate-3` | Status | Fate | 0 | 10 | 90% | 10 | ally | `ward` |
| Dreams Thread | `domain-dreams-0` | Energy | Dreams | 35 | 12 | 90% | 35 | opponent | — |
| Dreams Reverie | `domain-dreams-1` | Energy | Dreams | 20 | 2 | 90% | 40 | opponent | `sleep` |
| Dreams Manifest | `domain-dreams-2` | Energy | Dreams | 70 | -22 | 90% | 20 | opponent | — |
| Dreams Sanctuary | `domain-dreams-3` | Status | Dreams | 0 | 10 | 90% | 10 | ally | `ward` |
| Nightmares Thread | `domain-nightmares-0` | Energy | Nightmares | 35 | 12 | 90% | 35 | opponent | — |
| Nightmares Reverie | `domain-nightmares-1` | Energy | Nightmares | 20 | 2 | 90% | 40 | opponent | `sleep` |
| Nightmares Manifest | `domain-nightmares-2` | Energy | Nightmares | 70 | -22 | 90% | 20 | opponent | — |
| Nightmares Sanctuary | `domain-nightmares-3` | Status | Nightmares | 0 | 10 | 90% | 10 | ally | `ward` |
| Vital Bloom | `domain-life-0` | Energy | Life | 35 | 12 | 90% | 35 | opponent | — |
| Renewing Pulse | `domain-life-1` | Energy | Life | 20 | 2 | 90% | 40 | opponent | `slow` |
| Verdant Surge | `domain-life-2` | Energy | Life | 70 | -22 | 90% | 20 | opponent | — |
| Living Ward | `domain-life-3` | Status | Life | 0 | 10 | 90% | 10 | ally | `ward` |
| Grave Touch | `domain-death-0` | Energy | Death | 35 | 12 | 90% | 35 | opponent | — |
| Mortal Chill | `domain-death-1` | Energy | Death | 20 | 2 | 90% | 40 | opponent | `slow` |
| Death Knell | `domain-death-2` | Energy | Death | 70 | -22 | 90% | 20 | opponent | — |
| Pall Veil | `domain-death-3` | Status | Death | 0 | 10 | 90% | 10 | ally | `ward` |
| Soul Whisper | `domain-spirit-0` | Energy | Spirit | 35 | 12 | 90% | 35 | opponent | — |
| Ghostly Binding | `domain-spirit-1` | Energy | Spirit | 20 | 2 | 90% | 40 | opponent | `slow` |
| Spectral Burst | `domain-spirit-2` | Energy | Spirit | 70 | -22 | 90% | 20 | opponent | — |
| Ancestral Ward | `domain-spirit-3` | Status | Spirit | 0 | 10 | 90% | 10 | ally | `ward` |
| Thought Lance | `domain-psionic-0` | Energy | Psionic | 35 | 12 | 90% | 35 | opponent | — |
| Mind Snare | `domain-psionic-1` | Energy | Psionic | 20 | 2 | 90% | 40 | opponent | `slow` |
| Psychic Crush | `domain-psionic-2` | Energy | Psionic | 70 | -22 | 90% | 20 | opponent | — |
| Mental Barrier | `domain-psionic-3` | Status | Psionic | 0 | 10 | 90% | 10 | ally | `ward` |
| Briar Needle | `domain-nature-0` | Energy | Nature | 35 | 12 | 90% | 35 | opponent | — |
| Wild Entangle | `domain-nature-1` | Energy | Nature | 20 | 2 | 90% | 40 | opponent | `slow` |
| Primal Roar | `domain-nature-2` | Energy | Nature | 70 | -22 | 90% | 20 | opponent | — |
| Forest Shelter | `domain-nature-3` | Status | Nature | 0 | 10 | 90% | 10 | ally | `ward` |
| Null Thread | `domain-void-0` | Energy | Void | 35 | 12 | 90% | 35 | opponent | — |
| Dimensional Snare | `domain-void-1` | Energy | Void | 20 | 2 | 90% | 40 | opponent | `slow` |
| Abyssal Rift | `domain-void-2` | Energy | Void | 70 | -22 | 90% | 20 | opponent | — |
| Empty Shelter | `domain-void-3` | Status | Void | 0 | 10 | 90% | 10 | ally | `ward` |
| Squall Dart | `domain-storm-0` | Energy | Storm | 35 | 12 | 90% | 35 | opponent | — |
| Thunder Snare | `domain-storm-1` | Energy | Storm | 20 | 2 | 90% | 40 | opponent | `slow` |
| Tempest Crash | `domain-storm-2` | Energy | Storm | 70 | -22 | 90% | 20 | opponent | — |
| Storm Screen | `domain-storm-3` | Status | Storm | 0 | 10 | 90% | 10 | ally | `ward` |
| Arcane Bolt | `domain-magic-0` | Energy | Magic | 35 | 12 | 90% | 35 | opponent | — |
| Spell Snare | `domain-magic-1` | Energy | Magic | 20 | 2 | 90% | 40 | opponent | `slow` |
| Mystic Surge | `domain-magic-2` | Energy | Magic | 70 | -22 | 90% | 20 | opponent | — |
| Arcane Aegis | `domain-magic-3` | Status | Magic | 0 | 10 | 90% | 10 | ally | `ward` |

## General techniques

| Move | ID | Category | Domain | Power | Speed | Accuracy | Pool contribution | Target | Effect |
|---|---|---|---|---:|---:|---:|---:|---|---|
| Ash Brand | `tech-0` | Energy | — | 65 | 0 | 90% | 20 | opponent | `burn` |
| Cinder Hex | `tech-1` | Status | — | 0 | 0 | 90% | 20 | opponent | `burn` |
| Frost Lock | `tech-2` | Status | — | 0 | 0 | 90% | 20 | opponent | `freeze` |
| Glacier Lance | `tech-3` | Energy | — | 75 | 0 | 90% | 20 | opponent | `freeze` |
| Thunder Snare | `tech-4` | Status | — | 0 | 0 | 90% | 20 | opponent | `paralysis` |
| Static Surge | `tech-5` | Energy | — | 70 | 0 | 90% | 20 | opponent | `paralysis` |
| Venom Mark | `tech-6` | Status | — | 0 | 0 | 90% | 20 | opponent | `poison` |
| Virulent Curse | `tech-7` | Status | — | 0 | 0 | 90% | 20 | opponent | `toxic` |
| Drowse Hymn | `tech-8` | Status | — | 0 | 0 | 90% | 20 | opponent | `sleep` |
| Dizzying Echo | `tech-9` | Status | — | 0 | 0 | 90% | 20 | opponent | `confusion` |
| Heartbound Trance | `tech-10` | Status | — | 0 | 0 | 90% | 20 | opponent | `infatuation` |
| Staggering Blow | `tech-11` | Physical | — | 55 | 0 | 90% | 25 | opponent | `flinch` |
| Soul Leech | `tech-12` | Energy | — | 65 | 0 | 90% | 20 | opponent | `drain` |
| Vampiric Talon | `tech-13` | Physical | — | 60 | 0 | 90% | 25 | opponent | `drain` |
| Life Offering | `tech-14` | Status | — | 0 | 0 | 90% | 5 | self | `rest` |
| Renewal Bloom | `tech-15` | Status | — | 0 | 0 | 90% | 10 | ally | `heal` |
| Full Restoration | `tech-16` | Status | — | 0 | 0 | 90% | 5 | self | `fullheal` |
| Cleansing Rain | `tech-17` | Status | — | 0 | 0 | 90% | 20 | ally | `cleanse` |
| Aegis Sphere | `tech-18` | Status | — | 0 | 0 | 90% | 10 | ally | `protect` |
| Mirror Mantle | `tech-19` | Status | — | 0 | 0 | 90% | 10 | self | `reflect` |
| Spirit Veil | `tech-20` | Status | — | 0 | 0 | 90% | 10 | self | `lightscreen` |
| Rooted Sanctuary | `tech-21` | Status | — | 0 | 0 | 90% | 10 | self | `safeguard` |
| Haste Chant | `tech-22` | Status | — | 0 | 0 | 90% | 20 | self | `boostSpeed` |
| Battle Trance | `tech-23` | Status | — | 0 | 0 | 90% | 20 | self | `boostMight` |
| Arcane Focus | `tech-24` | Status | — | 0 | 0 | 90% | 20 | self | `boostPower` |
| Stoneguard | `tech-25` | Status | — | 0 | 0 | 90% | 20 | self | `boostDefense` |
| Mystic Barrier | `tech-26` | Status | — | 0 | 0 | 90% | 20 | self | `boostResistance` |
| Shattering Cry | `tech-27` | Status | — | 0 | 0 | 90% | 20 | opponent | `lowerDefense` |
| Withering Glare | `tech-28` | Status | — | 0 | 0 | 90% | 20 | opponent | `lowerMight` |
| Unraveling Hex | `tech-29` | Status | — | 0 | 0 | 90% | 20 | opponent | `lowerPower` |
| Gravity Bind | `tech-30` | Status | — | 0 | 0 | 90% | 20 | opponent | `lowerSpeed` |
| Sapping Mist | `tech-31` | Status | — | 0 | 0 | 90% | 20 | opponent | `lowerResistance` |
| Echo Step | `tech-32` | Status | — | 0 | 0 | 90% | 20 | self | `boostEvasion` |
| True Sight | `tech-33` | Status | — | 0 | 0 | 90% | 20 | self | `boostAccuracy` |
| Veil of Doubt | `tech-34` | Status | — | 0 | 0 | 90% | 20 | opponent | `lowerAccuracy` |
| Null Chant | `tech-35` | Status | — | 0 | 0 | 90% | 20 | field | `haze` |
| Soul Exchange | `tech-36` | Status | — | 0 | 0 | 90% | 20 | opponent | `swapStats` |
| Hex Reversal | `tech-37` | Status | — | 0 | 0 | 90% | 20 | field | `invertStats` |
| Piercing Rush | `tech-38` | Physical | — | 75 | 0 | 90% | 20 | opponent | `recoil` |
| Sacrificial Burst | `tech-39` | Energy | — | 110 | 0 | 90% | 5 | opponent | `recoil` |
| Sunder Strike | `tech-40` | Physical | — | 75 | 0 | 90% | 20 | opponent | `breakWard` |
| Rending Flurry | `tech-41` | Physical | — | 25 | 0 | 90% | 20 | opponent | `multiHit` |
| Starfall Volley | `tech-42` | Energy | — | 25 | 0 | 90% | 20 | opponent | `multiHit` |
| Binding Roots | `tech-43` | Physical | — | 35 | 0 | 90% | 35 | opponent | `trap` |
| Spectral Chains | `tech-44` | Energy | — | 35 | 0 | 90% | 35 | opponent | `trap` |
| Seed of Hunger | `tech-45` | Status | — | 0 | 0 | 90% | 20 | opponent | `leechSeed` |
| Thornfield | `tech-46` | Status | — | 0 | 0 | 90% | 20 | opponent | `spikes` |
| Toxic Miasma | `tech-47` | Status | — | 0 | 0 | 90% | 20 | opponent | `toxicSpikes` |
| Jagged Stones | `tech-48` | Status | — | 0 | 0 | 90% | 20 | opponent | `stealthRock` |
| Arcane Web | `tech-49` | Status | — | 0 | 0 | 90% | 20 | opponent | `stickyWeb` |
| Clearing Gust | `tech-50` | Status | — | 0 | 0 | 90% | 20 | opponent | `clearHazards` |
| Doom Omen | `tech-51` | Status | — | 0 | 0 | 90% | 5 | opponent | `perish` |
| Echoing Curse | `tech-52` | Status | — | 0 | 0 | 90% | 20 | opponent | `curse` |
| Destiny Knot | `tech-53` | Status | — | 0 | 0 | 90% | 5 | self | `destinyBond` |
| Spirit Lock | `tech-54` | Status | — | 0 | 0 | 90% | 20 | opponent | `disable` |
| Silencing Sigil | `tech-55` | Status | — | 0 | 0 | 90% | 20 | opponent | `taunt` |
| Counterstroke | `tech-56` | Physical | — | 60 | 0 | 90% | 25 | opponent | `counter` |
| Energy Reversal | `tech-57` | Energy | — | 60 | 0 | 90% | 25 | opponent | `mirrorCoat` |
| Swift Fang | `tech-58` | Physical | — | 40 | 25 | 90% | 35 | opponent | `priority` |
| Quick Spark | `tech-59` | Energy | — | 40 | 25 | 90% | 35 | opponent | `priority` |
| Unerring Beam | `tech-60` | Energy | — | 55 | 0 | 90% | 25 | opponent | `sureHit` |
| Aether Cannon | `tech-61` | Energy | — | 115 | 0 | 90% | 5 | opponent | `recharge` |
| Colossal Impact | `tech-62` | Physical | — | 115 | 0 | 90% | 5 | opponent | `recharge` |
| Twinstrike | `tech-63` | Physical | — | 40 | 0 | 90% | 20 | opponent | `doubleHit` |
| Moonlight Mend | `tech-64` | Status | — | 0 | 0 | 90% | 10 | ally | `heal` |
| Rage Bloom | `tech-65` | Physical | — | 65 | 0 | 90% | 20 | self | `boostMight` |
| Spirit Break | `tech-66` | Energy | — | 70 | 0 | 90% | 20 | opponent | `lowerPower` |
| Frostbite Fang | `tech-67` | Physical | — | 60 | 0 | 90% | 25 | opponent | `frostbite` |
| Nightmare Pulse | `tech-68` | Energy | — | 65 | 0 | 90% | 20 | opponent | `nightmare` |
| Curse of Frailty | `tech-69` | Status | — | 0 | 0 | 90% | 20 | opponent | `curse` |
| Corrupting Tide | `tech-70` | Energy | — | 70 | 0 | 90% | 20 | opponent | `toxic` |
| Ember Cyclone | `tech-71` | Energy | — | 65 | 0 | 90% | 20 | opponent | `burn` |
| Storm Jolt | `tech-72` | Energy | — | 65 | 0 | 90% | 20 | opponent | `paralysis` |
| Lucid Dream | `tech-73` | Status | — | 0 | 0 | 90% | 5 | self | `rest` |
| Prismatic Lance | `tech-74` | Energy | — | 90 | 0 | 90% | 10 | opponent | — |
| Meteor Hammer | `tech-75` | Physical | — | 90 | 0 | 90% | 10 | opponent | — |
| Solar Lance | `tech-76` | Energy | — | 100 | 0 | 90% | 10 | opponent | — |
| Abyssal Claw | `tech-77` | Physical | — | 100 | 0 | 90% | 10 | opponent | — |
| Judgment Spiral | `tech-78` | Energy | — | 85 | 0 | 90% | 10 | opponent | — |
| Wildcat Blitz | `tech-79` | Physical | — | 85 | 0 | 90% | 10 | opponent | — |

## Environment techniques

| Move | ID | Category | Domain | Power | Speed | Accuracy | Pool contribution | Target | Effect |
|---|---|---|---|---:|---:|---:|---:|---|---|
| Rain Invocation | `environment-0` | Status | — | 0 | 0 | 90% | 20 | field | `weatherRain` |
| Sun Invocation | `environment-1` | Status | — | 0 | 0 | 90% | 20 | field | `weatherSun` |
| Dust Tempest | `environment-2` | Status | — | 0 | 0 | 90% | 20 | field | `weatherSand` |
| Hailstorm Rite | `environment-3` | Status | — | 0 | 0 | 90% | 20 | field | `weatherSnow` |
| Verdant Ground | `environment-4` | Status | — | 0 | 0 | 90% | 20 | field | `terrainGrass` |
| Charged Ground | `environment-5` | Status | — | 0 | 0 | 90% | 20 | field | `terrainElectric` |
| Dreaming Ground | `environment-6` | Status | — | 0 | 0 | 90% | 20 | field | `terrainPsychic` |
| Veiled Ground | `environment-7` | Status | — | 0 | 0 | 90% | 20 | field | `terrainMisty` |
| Monsoon Lance | `environment-8` | Energy | — | 85 | 0 | 90% | 10 | opponent | `weatherStrike` |
| Solar Torrent | `environment-9` | Energy | — | 95 | 0 | 90% | 10 | opponent | `sunStrike` |
| Dustbreaker | `environment-10` | Physical | — | 85 | 0 | 90% | 10 | opponent | `sandStrike` |
| Winter Comet | `environment-11` | Energy | — | 85 | 0 | 90% | 10 | opponent | `snowStrike` |
| Rootburst | `environment-12` | Physical | — | 75 | 0 | 90% | 20 | opponent | `terrainStrike` |
| Voltage Bloom | `environment-13` | Energy | — | 75 | 0 | 90% | 20 | opponent | `electricStrike` |
| Dreamfall | `environment-14` | Energy | — | 75 | 0 | 90% | 20 | opponent | `psychicStrike` |
| Mistfire | `environment-15` | Energy | — | 75 | 0 | 90% | 20 | opponent | `mistStrike` |
| Retreating Slash | `environment-16` | Physical | — | 65 | 0 | 90% | 20 | opponent | `pivot` |
| Passing Current | `environment-17` | Energy | — | 65 | 0 | 90% | 20 | opponent | `pivot` |
| Forceful Gale | `environment-18` | Energy | — | 65 | 0 | 90% | 20 | opponent | `forceSwitch` |
| Driving Charge | `environment-19` | Physical | — | 65 | 0 | 90% | 20 | opponent | `forceSwitch` |
| Skybound Dive | `environment-20` | Physical | — | 110 | 0 | 90% | 5 | opponent | `twoTurn` |
| Burrowing Assault | `environment-21` | Physical | — | 100 | 0 | 90% | 10 | opponent | `twoTurn` |
| Abyssal Submerge | `environment-22` | Energy | — | 100 | 0 | 90% | 10 | opponent | `twoTurn` |
| Solar Gathering | `environment-23` | Energy | — | 120 | 0 | 90% | 5 | opponent | `chargeSun` |
| Unbroken Rampage | `environment-24` | Physical | — | 100 | 0 | 90% | 10 | opponent | `rampage` |
| Resonant Chorus | `environment-25` | Energy | — | 95 | 0 | 90% | 10 | opponent | `rampage` |
| Boundless Focus | `environment-26` | Status | — | 0 | 0 | 90% | 20 | self | `focus` |
| Stored Thunder | `environment-27` | Energy | — | 110 | 0 | 90% | 5 | opponent | `delayedStrike` |
| Waking Echo | `environment-28` | Energy | — | 70 | 0 | 90% | 20 | opponent | `sleepStrike` |
| Venom Feast | `environment-29` | Physical | — | 75 | 0 | 90% | 20 | opponent | `venomStrike` |
| Hex Pulse | `environment-30` | Energy | — | 65 | 0 | 90% | 20 | opponent | `hexStrike` |
| Countercurrent | `environment-31` | Physical | — | 75 | 0 | 90% | 20 | opponent | `counter` |

## Advanced and team techniques

| Move | ID | Category | Domain | Power | Speed | Accuracy | Pool contribution | Target | Effect |
|---|---|---|---|---:|---:|---:|---:|---|---|
| Aether Absorption | `advanced-0` | Energy | Plant | 20 | 0 | 90% | 40 | opponent | `drain` |
| Quickstone | `advanced-1` | Physical | Earth | 40 | 30 | 90% | 35 | opponent | `priority` |
| Corrosive Spray | `advanced-2` | Energy | Water | 40 | 0 | 90% | 35 | opponent | `lowerResistance` |
| Iron Carapace | `advanced-3` | Status | Metal | 0 | 0 | 90% | 20 | self | `boostDefense` |
| Weightless Strike | `advanced-4` | Physical | Air | 55 | 0 | 90% | 25 | opponent | `unburdened` |
| Precise Talon | `advanced-5` | Physical | Air | 60 | 0 | 90% | 25 | opponent | `sureHit` |
| Swift Current | `advanced-6` | Status | Air | 0 | 0 | 90% | 20 | self | `boostSpeed` |
| Whirling Blade | `advanced-7` | Energy | Air | 60 | 0 | 90% | 25 | opponent | `critical` |
| Air Sunder | `advanced-8` | Energy | Air | 75 | 0 | 90% | 20 | opponent | `flinch` |
| Spirit Anchor | `advanced-9` | Physical | Metal | 80 | 0 | 90% | 20 | opponent | `trap` |
| Elder Radiance | `advanced-10` | Energy | Light | 60 | 0 | 90% | 25 | opponent | `omniBoost` |
| Tidal Blade | `advanced-11` | Physical | Water | 70 | 0 | 90% | 20 | opponent | `critical` |
| Tidal Jet | `advanced-12` | Physical | Water | 40 | 30 | 90% | 35 | opponent | `priority` |
| Healing Current | `advanced-13` | Status | Water | 0 | 0 | 90% | 10 | ally | `regenerate` |
| Tidal Dance | `advanced-14` | Physical | Water | 80 | 0 | 90% | 20 | self | `boostSpeed` |
| Thousand Cuts | `advanced-15` | Physical | War | 15 | 0 | 90% | 25 | opponent | `multiHit` |
| Cannonfire | `advanced-16` | Energy | Fire | 120 | 0 | 90% | 5 | opponent | `selfDebuff` |
| Fragrant Remedy | `advanced-17` | Status | Plant | 0 | 0 | 90% | 20 | allAllies | `partyCleanse` |
| Vengeance Mark | `advanced-18` | Physical | Dark | 60 | 0 | 90% | 25 | opponent | `revenge` |
| Ghostly Swarm | `advanced-19` | Energy | Dark | 120 | 0 | 90% | 5 | opponent | — |
| Astral Shelter | `advanced-20` | Status | Ice | 0 | 0 | 90% | 10 | self | `auroraVeil` |
| Avalanche Rush | `advanced-21` | Physical | Ice | 60 | 0 | 90% | 25 | opponent | `revenge` |
| Blight Barrage | `advanced-22` | Physical | Water | 60 | 0 | 90% | 25 | opponent | `venomStrike` |
| Mystic Chain | `advanced-23` | Status | Fate | 0 | 0 | 90% | 20 | self | `batonPass` |
| Skyfire Charge | `advanced-24` | Physical | Air | 100 | 0 | 90% | 10 | opponent | `twoTurn` |
| Chorus of Allies | `advanced-25` | Physical | War | 20 | 0 | 90% | 40 | opponent | `partyStrike` |
| Crimson Offering | `advanced-26` | Status | Wrath | 0 | 0 | 90% | 20 | self | `bellyDrum` |
| Stored Retaliation | `advanced-27` | Physical | War | 60 | 0 | 90% | 25 | opponent | `counter` |
| Vine Snare | `advanced-28` | Physical | Plant | 15 | 0 | 90% | 40 | opponent | `trap` |
| Dreadfang | `advanced-29` | Physical | Fear | 60 | 0 | 90% | 25 | opponent | `flinch` |
| Siphoning Fang | `advanced-30` | Physical | Dark | 90 | 0 | 90% | 10 | opponent | `drain` |
| Stonewall Chant | `advanced-31` | Status | Earth | 0 | 0 | 90% | 20 | self | `boostDefense` |
| Unyielding Mind | `advanced-32` | Status | Dreams | 0 | 0 | 90% | 20 | self | `boostResistance` |
| Skybreaker | `advanced-33` | Energy | Air | 150 | 0 | 90% | 5 | opponent | `recharge` |
| Volcanic Flare | `advanced-34` | Energy | Fire | 85 | 0 | 90% | 10 | opponent | `burn` |
| Frost Tempest | `advanced-35` | Energy | Ice | 110 | 0 | 90% | 5 | opponent | `freeze` |
| Phantom Lock | `advanced-36` | Status | Dark | 0 | 0 | 90% | 20 | opponent | `trap` |
| Sunlit Lance | `advanced-37` | Energy | Sun | 120 | 0 | 90% | 5 | opponent | `chargeSun` |
| Spirit Bastion | `advanced-38` | Status | Light | 0 | 0 | 90% | 10 | ally | `protect` |
| Soulbound Pact | `advanced-39` | Status | Fate | 0 | 0 | 90% | 5 | self | `destinyBond` |
| Moonlit Renewal | `advanced-40` | Status | Moon | 0 | 0 | 90% | 10 | ally | `heal` |
| Corrosive Grasp | `advanced-41` | Physical | Water | 60 | 0 | 90% | 25 | opponent | `poison` |
| Emberfang | `advanced-42` | Physical | Fire | 65 | 0 | 90% | 20 | opponent | `burn` |
| Echo Chamber | `advanced-43` | Status | Dreams | 0 | 0 | 90% | 10 | self | `reflect` |
| Fading Veil | `advanced-44` | Status | Light | 0 | 0 | 90% | 10 | self | `lightscreen` |
| Fatebreaker | `advanced-45` | Physical | Fate | 75 | 0 | 90% | 20 | opponent | `breakWard` |
| Feral Fury | `advanced-46` | Physical | Wrath | 110 | 0 | 90% | 5 | opponent | `rampage` |
| Mirage Pulse | `advanced-47` | Energy | Dreams | 70 | 0 | 90% | 20 | opponent | `confusion` |
| Iron Tempest | `advanced-48` | Physical | Metal | 25 | 0 | 90% | 20 | opponent | `multiHit` |
| Starlit Bolt | `advanced-49` | Energy | Light | 80 | 0 | 90% | 20 | opponent | `sureHit` |
| Petrifying Gaze | `advanced-50` | Status | Earth | 0 | 0 | 90% | 20 | opponent | `paralysis` |
| Venom Bloom | `advanced-51` | Status | Plant | 0 | 0 | 90% | 20 | opponent | `toxic` |
| Spirit Silence | `advanced-52` | Status | Law | 0 | 0 | 90% | 20 | opponent | `taunt` |
| Memory Seal | `advanced-53` | Status | Dreams | 0 | 0 | 90% | 20 | opponent | `disable` |
| Final Omen | `advanced-54` | Status | Fate | 0 | 0 | 90% | 5 | opponent | `perish` |
| Dreamfeast | `advanced-55` | Energy | Nightmares | 70 | 0 | 90% | 20 | opponent | `nightmare` |
| Gravity Reversal | `advanced-56` | Status | Chaos | 0 | 0 | 90% | 20 | field | `invertStats` |
| Purifying Wind | `advanced-57` | Status | Air | 0 | 0 | 90% | 20 | opponent | `clearHazards` |
| Razorfield | `advanced-58` | Status | Earth | 0 | 0 | 90% | 20 | opponent | `spikes` |
| Dusk Veil | `advanced-59` | Status | Dark | 0 | 0 | 90% | 10 | self | `safeguard` |
| Toxic Mire | `advanced-60` | Status | Water | 0 | 0 | 90% | 20 | opponent | `toxicSpikes` |
| Rooted Hunger | `advanced-61` | Status | Plant | 0 | 0 | 90% | 20 | opponent | `leechSeed` |
| Spirit Surge | `advanced-62` | Energy | Lightning | 65 | 0 | 90% | 20 | opponent | `pivot` |
| Displacing Wave | `advanced-63` | Energy | Water | 65 | 0 | 90% | 20 | opponent | `forceSwitch` |
| Sunfall | `advanced-64` | Energy | Sun | 95 | 0 | 90% | 10 | opponent | `sunStrike` |
| Midnight Squall | `advanced-65` | Energy | Water | 85 | 0 | 90% | 10 | opponent | `weatherStrike` |
| Shifting Earth | `advanced-66` | Physical | Earth | 85 | 0 | 90% | 10 | opponent | `sandStrike` |
| Frost Nova | `advanced-67` | Energy | Ice | 85 | 0 | 90% | 10 | opponent | `snowStrike` |
| Tempest Chorus | `team-0` | Energy | Storm | 45 | 0 | 90% | 25 | allOpponents | `slow` |
| Bramble Sweep | `team-1` | Physical | Nature | 35 | 0 | 90% | 35 | allOpponents | `poison` |
| Shattered Horizon | `team-2` | Energy | Void | 60 | 0 | 90% | 25 | allOpponents | `lowerResistance` |
| Lantern Chorus | `team-3` | Status | Hope | 0 | 0 | 90% | 20 | allAllies | `teamHeal` |
| Sheltering Constellation | `team-4` | Status | Light | 0 | 0 | 90% | 20 | allAllies | `teamWard` |
| Tandem Spark | `team-5` | Energy | Lightning | 40 | 0 | 90% | 35 | allOpponents | `paralysis` |
| Shared Resolve | `team-6` | Status | Spirit | 0 | 0 | 90% | 20 | allAllies | `partyCleanse` |
| Frostbound Field | `team-7` | Energy | Ice | 45 | 0 | 90% | 25 | allOpponents | `frostbite` |
