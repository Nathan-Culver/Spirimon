# Spirimon — Complete Move Mechanics Catalog

Generated from the current GitHub source (`moves.mjs` and `engine.mjs`) on 2026-11-01. **404 definitions** across six groups, including all 28 domains. Domain move type tags can vary by learner; entries here use Beast as the representative type. A definition's presence does not establish that it is obtainable or that its effect is implemented in every combat mode.

## Mechanical rules

- Physical moves use **Stamina**; Energy and Status moves use **Willpower**. The alternate pool can cover a shortfall at **2:1**.
- Current engine action cost: **1 point**, or **2** when the target has the **Pressure** ability. The separately calculated **Base Uses** number does not determine the actual resource cost in the current engine.
- Default accuracy: **90%**, adjusted by Agile attacker (+15 percentage points) and Agile defender (−15), capped at 5–99%; some status effects bypass the accuracy roll.
- Critical chance: Normal 5%, Strong 15%, Agile 15%; `critical` effect 25%, or 35% with Agile. Critical damage multiplier is **1.5×**.
- **Effect** is the literal engine effect identifier, not a guarantee of activation. **Speed** is the move's speed modifier.

## Core engine moves (8)

| Move | ID | Tags | Power | Speed | Accuracy | Base Uses | Effect |
|---|---|---|---:|---:|---:|---:|---|
| Spirimon Strike | `strike` | Physical | 38 | 8 | 90% | 35 | `—` |
| Binding Lash | `lash` | Energy | 29 | 4 | 90% | 35 | `slow` |
| Soul Surge | `surge` | Energy | 64 | -18 | 90% | 20 | `—` |
| Quiet Renewal | `mend` | Status | 0 | -8 | 90% | 10 | `heal` |
| Bitter Thorn | `venom` | Physical | 24 | 2 | 90% | 35 | `poison` |
| Spirimon Ward | `ward` | Status | 0 | 12 | 90% | 10 | `ward` |
| Drowsing Whisper | `sleep` | Energy | 15 | -5 | 90% | 40 | `sleep` |
| Wild Rush | `rush` | Physical | 45 | 15 | 90% | 25 | `recoil` |

## Type moves (104)

| Move | ID | Tags | Power | Speed | Accuracy | Base Uses | Effect |
|---|---|---|---:|---:|---:|---:|---|
| Aperture Jab | `aberration-0` | Physical · Aberration · spirit | 32 | 16 | 90% | 35 | `—` |
| Mind Knot | `aberration-1` | Physical · Aberration · spirit | 25 | 3 | 90% | 35 | `slow` |
| Folded Veil | `aberration-2` | Status · Aberration · spirit | 0 | -12 | 90% | 10 | `heal` |
| Paradox Crush | `aberration-3` | Physical · Aberration · spirit | 68 | -20 | 90% | 20 | `—` |
| Disquieting Gaze | `aberration-4` | Energy · Aberration · spirit | 18 | -5 | 90% | 40 | `sleep` |
| Tendril Flick | `aberration-5` | Energy · Aberration · spirit | 40 | 9 | 90% | 35 | `—` |
| Spatial Shell | `aberration-6` | Status · Aberration · spirit | 0 | 13 | 90% | 10 | `ward` |
| Recursive Rend | `aberration-7` | Physical · Aberration · spirit | 54 | 18 | 90% | 25 | `recoil` |
| Raking Claw | `beast-0` | Physical · Beast · spirit | 32 | 16 | 90% | 35 | `—` |
| Hamstring Bite | `beast-1` | Physical · Beast · spirit | 25 | 3 | 90% | 35 | `slow` |
| Den Instinct | `beast-2` | Status · Beast · spirit | 0 | -12 | 90% | 10 | `heal` |
| Antler Charge | `beast-3` | Physical · Beast · spirit | 68 | -20 | 90% | 20 | `—` |
| Venom Fang | `beast-4` | Energy · Beast · spirit | 18 | -5 | 90% | 40 | `poison` |
| Pouncing Snap | `beast-5` | Energy · Beast · spirit | 40 | 9 | 90% | 35 | `—` |
| Thick Hide | `beast-6` | Status · Beast · spirit | 0 | 13 | 90% | 10 | `ward` |
| Stampeding Rush | `beast-7` | Physical · Beast · spirit | 54 | 18 | 90% | 25 | `recoil` |
| Feather Lance | `celestial-0` | Physical · Celestial · spirit | 32 | 16 | 90% | 35 | `—` |
| Halo Bind | `celestial-1` | Physical · Celestial · spirit | 25 | 3 | 90% | 35 | `slow` |
| Dawn Benediction | `celestial-2` | Status · Celestial · spirit | 0 | -12 | 90% | 10 | `heal` |
| Judgment Ray | `celestial-3` | Physical · Celestial · spirit | 68 | -20 | 90% | 20 | `—` |
| Lulling Hymn | `celestial-4` | Energy · Celestial · spirit | 18 | -5 | 90% | 40 | `sleep` |
| Star Dart | `celestial-5` | Energy · Celestial · spirit | 40 | 9 | 90% | 35 | `—` |
| Radiant Aegis | `celestial-6` | Status · Celestial · spirit | 0 | 13 | 90% | 10 | `ward` |
| Comet Descent | `celestial-7` | Physical · Celestial · spirit | 54 | 18 | 90% | 25 | `recoil` |
| Rivet Shot | `construct-0` | Physical · Construct · spirit | 32 | 16 | 90% | 35 | `—` |
| Gear Snare | `construct-1` | Physical · Construct · spirit | 25 | 3 | 90% | 35 | `slow` |
| Field Repair | `construct-2` | Status · Construct · spirit | 0 | -12 | 90% | 10 | `heal` |
| Iron Piledriver | `construct-3` | Physical · Construct · spirit | 68 | -20 | 90% | 20 | `—` |
| Corrosive Bolt | `construct-4` | Energy · Construct · spirit | 18 | -5 | 90% | 40 | `poison` |
| Spring Hammer | `construct-5` | Energy · Construct · spirit | 40 | 9 | 90% | 35 | `—` |
| Porcelain Guard | `construct-6` | Status · Construct · spirit | 0 | 13 | 90% | 10 | `ward` |
| Furnace Impact | `construct-7` | Physical · Construct · spirit | 54 | 18 | 90% | 25 | `recoil` |
| Spark Lash | `elemental-0` | Physical · Elemental · fire | 32 | 16 | 90% | 35 | `—` |
| Quicksand Grip | `elemental-1` | Physical · Elemental · fire | 25 | 3 | 90% | 35 | `slow` |
| Renewing Current | `elemental-2` | Status · Elemental · fire | 0 | -12 | 90% | 10 | `heal` |
| Tempest Break | `elemental-3` | Physical · Elemental · fire | 68 | -20 | 90% | 20 | `—` |
| Cinder Mark | `elemental-4` | Energy · Elemental · fire | 18 | -5 | 90% | 40 | `poison` |
| Gale Needle | `elemental-5` | Energy · Elemental · fire | 40 | 9 | 90% | 35 | `—` |
| Stone Mantle | `elemental-6` | Status · Elemental · fire | 0 | 13 | 90% | 10 | `ward` |
| Torrent Crash | `elemental-7` | Physical · Elemental · fire | 54 | 18 | 90% | 25 | `recoil` |
| Briar Pin | `fey-0` | Physical · Fey · spirit | 32 | 16 | 90% | 35 | `—` |
| Silken Tether | `fey-1` | Physical · Fey · spirit | 25 | 3 | 90% | 35 | `slow` |
| Nectar Blessing | `fey-2` | Status · Fey · spirit | 0 | -12 | 90% | 10 | `heal` |
| Glamour Burst | `fey-3` | Physical · Fey · spirit | 68 | -20 | 90% | 20 | `—` |
| Pollen Dream | `fey-4` | Energy · Fey · spirit | 18 | -5 | 90% | 40 | `sleep` |
| Pixie Feint | `fey-5` | Energy · Fey · spirit | 40 | 9 | 90% | 35 | `—` |
| Petal Shroud | `fey-6` | Status · Fey · spirit | 0 | 13 | 90% | 10 | `ward` |
| Moonlit Prank | `fey-7` | Physical · Fey · spirit | 54 | 18 | 90% | 25 | `recoil` |
| Barbed Hook | `fiend-0` | Physical · Fiend · spirit | 32 | 16 | 90% | 35 | `—` |
| Chain Drag | `fiend-1` | Physical · Fiend · spirit | 25 | 3 | 90% | 35 | `slow` |
| Cinder Feast | `fiend-2` | Status · Fiend · spirit | 0 | -12 | 90% | 10 | `heal` |
| Infernal Cleave | `fiend-3` | Physical · Fiend · spirit | 68 | -20 | 90% | 20 | `—` |
| Malice Murmur | `fiend-4` | Energy · Fiend · spirit | 18 | -5 | 90% | 40 | `poison` |
| Ember Talon | `fiend-5` | Energy · Fiend · spirit | 40 | 9 | 90% | 35 | `—` |
| Obsidian Hide | `fiend-6` | Status · Fiend · spirit | 0 | 13 | 90% | 10 | `ward` |
| Hellfire Rush | `fiend-7` | Physical · Fiend · spirit | 54 | 18 | 90% | 25 | `recoil` |
| Knuckle Sweep | `giant-0` | Physical · Giant · spirit | 32 | 16 | 90% | 35 | `—` |
| Ground Quake | `giant-1` | Physical · Giant · spirit | 25 | 3 | 90% | 35 | `slow` |
| Mountain Breath | `giant-2` | Status · Giant · spirit | 0 | -12 | 90% | 10 | `heal` |
| Colossal Slam | `giant-3` | Physical · Giant · spirit | 68 | -20 | 90% | 20 | `—` |
| Dazing Roar | `giant-4` | Energy · Giant · spirit | 18 | -5 | 90% | 40 | `slow` |
| Boulder Flick | `giant-5` | Energy · Giant · spirit | 40 | 9 | 90% | 35 | `—` |
| Granite Guard | `giant-6` | Status · Giant · spirit | 0 | 13 | 90% | 10 | `ward` |
| Avalanche Step | `giant-7` | Physical · Giant · spirit | 54 | 18 | 90% | 25 | `recoil` |
| Palm Arc | `humanoid-0` | Physical · Humanoid · spirit | 32 | 16 | 90% | 35 | `—` |
| Joint Lock | `humanoid-1` | Physical · Humanoid · spirit | 25 | 3 | 90% | 35 | `slow` |
| Centered Breath | `humanoid-2` | Status · Humanoid · spirit | 0 | -12 | 90% | 10 | `heal` |
| Fourfold Palm | `humanoid-3` | Physical · Humanoid · spirit | 68 | -20 | 90% | 20 | `—` |
| Hypnotic Mask | `humanoid-4` | Energy · Humanoid · spirit | 18 | -5 | 90% | 40 | `sleep` |
| Ribbon Cut | `humanoid-5` | Energy · Humanoid · spirit | 40 | 9 | 90% | 35 | `—` |
| Measured Stance | `humanoid-6` | Status · Humanoid · spirit | 0 | 13 | 90% | 10 | `ward` |
| Whirling Heel | `humanoid-7` | Physical · Humanoid · spirit | 54 | 18 | 90% | 25 | `recoil` |
| Horn Pierce | `monstrosity-0` | Physical · Monstrosity · spirit | 32 | 16 | 90% | 35 | `—` |
| Coiling Grasp | `monstrosity-1` | Physical · Monstrosity · spirit | 25 | 3 | 90% | 35 | `slow` |
| Mythic Renewal | `monstrosity-2` | Status · Monstrosity · spirit | 0 | -12 | 90% | 10 | `heal` |
| Chimeric Roar | `monstrosity-3` | Physical · Monstrosity · spirit | 68 | -20 | 90% | 20 | `—` |
| Basilisk Haze | `monstrosity-4` | Energy · Monstrosity · spirit | 18 | -5 | 90% | 40 | `poison` |
| Wing Shear | `monstrosity-5` | Energy · Monstrosity · spirit | 40 | 9 | 90% | 35 | `—` |
| Scaled Bastion | `monstrosity-6` | Status · Monstrosity · spirit | 0 | 13 | 90% | 10 | `ward` |
| Legendary Onrush | `monstrosity-7` | Physical · Monstrosity · spirit | 54 | 18 | 90% | 25 | `recoil` |
| Gel Whip | `ooze-0` | Physical · Ooze · water | 32 | 16 | 90% | 35 | `—` |
| Viscous Grasp | `ooze-1` | Physical · Ooze · water | 25 | 3 | 90% | 35 | `slow` |
| Reconstitute | `ooze-2` | Status · Ooze · water | 0 | -12 | 90% | 10 | `heal` |
| Pressure Flood | `ooze-3` | Physical · Ooze · water | 68 | -20 | 90% | 20 | `—` |
| Caustic Drip | `ooze-4` | Energy · Ooze · water | 18 | -5 | 90% | 40 | `poison` |
| Droplet Shot | `ooze-5` | Energy · Ooze · water | 40 | 9 | 90% | 35 | `—` |
| Jelly Barrier | `ooze-6` | Status · Ooze · water | 0 | 13 | 90% | 10 | `ward` |
| Amorphous Surge | `ooze-7` | Physical · Ooze · water | 54 | 18 | 90% | 25 | `recoil` |
| Thorn Prick | `plant-0` | Physical · Plant · leaf | 32 | 16 | 90% | 35 | `—` |
| Strangler Vine | `plant-1` | Physical · Plant · leaf | 25 | 3 | 90% | 35 | `slow` |
| Root Renewal | `plant-2` | Status · Plant · leaf | 0 | -12 | 90% | 10 | `heal` |
| Pitcher Crush | `plant-3` | Physical · Plant · leaf | 68 | -20 | 90% | 20 | `—` |
| Sundew Toxin | `plant-4` | Energy · Plant · leaf | 18 | -5 | 90% | 40 | `poison` |
| Seed Needle | `plant-5` | Energy · Plant · leaf | 40 | 9 | 90% | 35 | `—` |
| Bark Mantle | `plant-6` | Status · Plant · leaf | 0 | 13 | 90% | 10 | `ward` |
| Bramble Rush | `plant-7` | Physical · Plant · leaf | 54 | 18 | 90% | 25 | `recoil` |
| Bone Shard | `undead-0` | Physical · Undead · spirit | 32 | 16 | 90% | 35 | `—` |
| Grave Bind | `undead-1` | Physical · Undead · spirit | 25 | 3 | 90% | 35 | `slow` |
| Soul Reassembly | `undead-2` | Status · Undead · spirit | 0 | -12 | 90% | 10 | `heal` |
| Tomb Collapse | `undead-3` | Physical · Undead · spirit | 68 | -20 | 90% | 20 | `—` |
| Restless Lull | `undead-4` | Energy · Undead · spirit | 18 | -5 | 90% | 40 | `sleep` |
| Spectral Scratch | `undead-5` | Energy · Undead · spirit | 40 | 9 | 90% | 35 | `—` |
| Shroud Guard | `undead-6` | Status · Undead · spirit | 0 | 13 | 90% | 10 | `ward` |
| Revenant Charge | `undead-7` | Physical · Undead · spirit | 54 | 18 | 90% | 25 | `recoil` |

## Domain moves (112)

| Move | ID | Tags | Power | Speed | Accuracy | Base Uses | Effect |
|---|---|---|---:|---:|---:|---:|---|
| Zephyr Needle | `domain-air-0` | Energy · Beast · Air · air | 35 | 12 | 90% | 35 | `—` |
| Still Air | `domain-air-1` | Energy · Beast · Air · air | 20 | 2 | 90% | 40 | `slow` |
| Cyclone Crest | `domain-air-2` | Energy · Beast · Air · air | 70 | -22 | 90% | 20 | `—` |
| Wind Mantle | `domain-air-3` | Status · Beast · Air · air | 0 | 10 | 90% | 10 | `ward` |
| Stone Splinter | `domain-earth-0` | Energy · Beast · Earth · earth | 35 | 12 | 90% | 35 | `—` |
| Mire Step | `domain-earth-1` | Energy · Beast · Earth · earth | 20 | 2 | 90% | 40 | `slow` |
| Fault Rupture | `domain-earth-2` | Energy · Beast · Earth · earth | 70 | -22 | 90% | 20 | `—` |
| Clay Aegis | `domain-earth-3` | Status · Beast · Earth · earth | 0 | 10 | 90% | 10 | `ward` |
| Ember Jet | `domain-fire-0` | Energy · Beast · Fire · fire | 35 | 12 | 90% | 35 | `—` |
| Scorch Veil | `domain-fire-1` | Energy · Beast · Fire · fire | 20 | 2 | 90% | 40 | `slow` |
| Pyre Bloom | `domain-fire-2` | Energy · Beast · Fire · fire | 70 | -22 | 90% | 20 | `—` |
| Cinder Cloak | `domain-fire-3` | Status · Beast · Fire · fire | 0 | 10 | 90% | 10 | `ward` |
| Tidal Dart | `domain-water-0` | Energy · Beast · Water · water | 35 | 12 | 90% | 35 | `—` |
| Undertow | `domain-water-1` | Energy · Beast · Water · water | 20 | 2 | 90% | 40 | `slow` |
| Riptide Break | `domain-water-2` | Energy · Beast · Water · water | 70 | -22 | 90% | 20 | `—` |
| Mist Mantle | `domain-water-3` | Status · Beast · Water · water | 0 | 10 | 90% | 10 | `ward` |
| Gleam Pin | `domain-light-0` | Energy · Beast · Light · light | 35 | 12 | 90% | 35 | `—` |
| Dazzling Haze | `domain-light-1` | Energy · Beast · Light · light | 20 | 2 | 90% | 40 | `slow` |
| Prismatic Ray | `domain-light-2` | Energy · Beast · Light · light | 70 | -22 | 90% | 20 | `—` |
| Lucent Shell | `domain-light-3` | Status · Beast · Light · light | 0 | 10 | 90% | 10 | `ward` |
| Shadow Stitch | `domain-dark-0` | Energy · Beast · Dark · dark | 35 | 12 | 90% | 35 | `—` |
| Deepening Dusk | `domain-dark-1` | Energy · Beast · Dark · dark | 20 | 2 | 90% | 40 | `slow` |
| Abyssal Bloom | `domain-dark-2` | Energy · Beast · Dark · dark | 70 | -22 | 90% | 20 | `—` |
| Umbral Guard | `domain-dark-3` | Status · Beast · Dark · dark | 0 | 10 | 90% | 10 | `ward` |
| Dawn Spear | `domain-sun-0` | Energy · Beast · Sun · sun | 35 | 12 | 90% | 35 | `—` |
| Sun Daze | `domain-sun-1` | Energy · Beast · Sun · sun | 20 | 2 | 90% | 40 | `slow` |
| Solar Crest | `domain-sun-2` | Energy · Beast · Sun · sun | 70 | -22 | 90% | 20 | `—` |
| Daybreak Veil | `domain-sun-3` | Status · Beast · Sun · sun | 0 | 10 | 90% | 10 | `ward` |
| Crescent Cut | `domain-moon-0` | Energy · Beast · Moon · moon | 35 | 12 | 90% | 35 | `—` |
| Lunar Lull | `domain-moon-1` | Energy · Beast · Moon · moon | 20 | 2 | 90% | 40 | `sleep` |
| Moonfall | `domain-moon-2` | Energy · Beast · Moon · moon | 70 | -22 | 90% | 20 | `—` |
| Silver Shroud | `domain-moon-3` | Status · Beast · Moon · moon | 0 | 10 | 90% | 10 | `ward` |
| Static Fang | `domain-lightning-0` | Energy · Beast · Lightning · lightning | 35 | 12 | 90% | 35 | `—` |
| Nerve Jolt | `domain-lightning-1` | Energy · Beast · Lightning · lightning | 20 | 2 | 90% | 40 | `slow` |
| Thunder Crown | `domain-lightning-2` | Energy · Beast · Lightning · lightning | 70 | -22 | 90% | 20 | `—` |
| Charged Screen | `domain-lightning-3` | Status · Beast · Lightning · lightning | 0 | 10 | 90% | 10 | `ward` |
| Frost Needle | `domain-ice-0` | Energy · Beast · Ice · ice | 35 | 12 | 90% | 35 | `—` |
| Numbing Rime | `domain-ice-1` | Energy · Beast · Ice · ice | 20 | 2 | 90% | 40 | `slow` |
| Glacier Crash | `domain-ice-2` | Energy · Beast · Ice · ice | 70 | -22 | 90% | 20 | `—` |
| Hoarfrost Shell | `domain-ice-3` | Status · Beast · Ice · ice | 0 | 10 | 90% | 10 | `ward` |
| Metal Thread | `domain-metal-0` | Energy · Beast · Metal · metal | 35 | 12 | 90% | 35 | `—` |
| Metal Reverie | `domain-metal-1` | Energy · Beast · Metal · metal | 20 | 2 | 90% | 40 | `slow` |
| Metal Manifest | `domain-metal-2` | Energy · Beast · Metal · metal | 70 | -22 | 90% | 20 | `—` |
| Metal Sanctuary | `domain-metal-3` | Status · Beast · Metal · metal | 0 | 10 | 90% | 10 | `ward` |
| Chaos Thread | `domain-chaos-0` | Energy · Beast · Chaos · chaos | 35 | 12 | 90% | 35 | `—` |
| Chaos Reverie | `domain-chaos-1` | Energy · Beast · Chaos · chaos | 20 | 2 | 90% | 40 | `slow` |
| Chaos Manifest | `domain-chaos-2` | Energy · Beast · Chaos · chaos | 70 | -22 | 90% | 20 | `—` |
| Chaos Sanctuary | `domain-chaos-3` | Status · Beast · Chaos · chaos | 0 | 10 | 90% | 10 | `ward` |
| Law Thread | `domain-law-0` | Energy · Beast · Law · law | 35 | 12 | 90% | 35 | `—` |
| Law Reverie | `domain-law-1` | Energy · Beast · Law · law | 20 | 2 | 90% | 40 | `slow` |
| Law Manifest | `domain-law-2` | Energy · Beast · Law · law | 70 | -22 | 90% | 20 | `—` |
| Law Sanctuary | `domain-law-3` | Status · Beast · Law · law | 0 | 10 | 90% | 10 | `ward` |
| Good Thread | `domain-good-0` | Energy · Beast · Good · good | 35 | 12 | 90% | 35 | `—` |
| Good Reverie | `domain-good-1` | Energy · Beast · Good · good | 20 | 2 | 90% | 40 | `slow` |
| Good Manifest | `domain-good-2` | Energy · Beast · Good · good | 70 | -22 | 90% | 20 | `—` |
| Good Sanctuary | `domain-good-3` | Status · Beast · Good · good | 0 | 10 | 90% | 10 | `ward` |
| Evil Thread | `domain-evil-0` | Energy · Beast · Evil · evil | 35 | 12 | 90% | 35 | `—` |
| Evil Reverie | `domain-evil-1` | Energy · Beast · Evil · evil | 20 | 2 | 90% | 40 | `slow` |
| Evil Manifest | `domain-evil-2` | Energy · Beast · Evil · evil | 70 | -22 | 90% | 20 | `—` |
| Evil Sanctuary | `domain-evil-3` | Status · Beast · Evil · evil | 0 | 10 | 90% | 10 | `ward` |
| Creation Thread | `domain-creation-0` | Energy · Beast · Creation · creation | 35 | 12 | 90% | 35 | `—` |
| Creation Reverie | `domain-creation-1` | Energy · Beast · Creation · creation | 20 | 2 | 90% | 40 | `slow` |
| Creation Manifest | `domain-creation-2` | Energy · Beast · Creation · creation | 70 | -22 | 90% | 20 | `—` |
| Creation Sanctuary | `domain-creation-3` | Status · Beast · Creation · creation | 0 | 10 | 90% | 10 | `ward` |
| Destruction Thread | `domain-destruction-0` | Energy · Beast · Destruction · destruction | 35 | 12 | 90% | 35 | `—` |
| Destruction Reverie | `domain-destruction-1` | Energy · Beast · Destruction · destruction | 20 | 2 | 90% | 40 | `slow` |
| Destruction Manifest | `domain-destruction-2` | Energy · Beast · Destruction · destruction | 70 | -22 | 90% | 20 | `—` |
| Destruction Sanctuary | `domain-destruction-3` | Status · Beast · Destruction · destruction | 0 | 10 | 90% | 10 | `ward` |
| War Thread | `domain-war-0` | Energy · Beast · War · war | 35 | 12 | 90% | 35 | `—` |
| War Reverie | `domain-war-1` | Energy · Beast · War · war | 20 | 2 | 90% | 40 | `slow` |
| War Manifest | `domain-war-2` | Energy · Beast · War · war | 70 | -22 | 90% | 20 | `—` |
| War Sanctuary | `domain-war-3` | Status · Beast · War · war | 0 | 10 | 90% | 10 | `ward` |
| Peace Thread | `domain-peace-0` | Energy · Beast · Peace · peace | 35 | 12 | 90% | 35 | `—` |
| Peace Reverie | `domain-peace-1` | Energy · Beast · Peace · peace | 20 | 2 | 90% | 40 | `sleep` |
| Peace Manifest | `domain-peace-2` | Energy · Beast · Peace · peace | 70 | -22 | 90% | 20 | `—` |
| Peace Sanctuary | `domain-peace-3` | Status · Beast · Peace · peace | 0 | 10 | 90% | 10 | `ward` |
| Fear Thread | `domain-fear-0` | Energy · Beast · Fear · fear | 35 | 12 | 90% | 35 | `—` |
| Fear Reverie | `domain-fear-1` | Energy · Beast · Fear · fear | 20 | 2 | 90% | 40 | `slow` |
| Fear Manifest | `domain-fear-2` | Energy · Beast · Fear · fear | 70 | -22 | 90% | 20 | `—` |
| Fear Sanctuary | `domain-fear-3` | Status · Beast · Fear · fear | 0 | 10 | 90% | 10 | `ward` |
| Wrath Thread | `domain-wrath-0` | Energy · Beast · Wrath · wrath | 35 | 12 | 90% | 35 | `—` |
| Wrath Reverie | `domain-wrath-1` | Energy · Beast · Wrath · wrath | 20 | 2 | 90% | 40 | `slow` |
| Wrath Manifest | `domain-wrath-2` | Energy · Beast · Wrath · wrath | 70 | -22 | 90% | 20 | `—` |
| Wrath Sanctuary | `domain-wrath-3` | Status · Beast · Wrath · wrath | 0 | 10 | 90% | 10 | `ward` |
| Love Thread | `domain-love-0` | Energy · Beast · Love · love | 35 | 12 | 90% | 35 | `—` |
| Love Reverie | `domain-love-1` | Energy · Beast · Love · love | 20 | 2 | 90% | 40 | `slow` |
| Love Manifest | `domain-love-2` | Energy · Beast · Love · love | 70 | -22 | 90% | 20 | `—` |
| Love Sanctuary | `domain-love-3` | Status · Beast · Love · love | 0 | 10 | 90% | 10 | `ward` |
| Hope Thread | `domain-hope-0` | Energy · Beast · Hope · hope | 35 | 12 | 90% | 35 | `—` |
| Hope Reverie | `domain-hope-1` | Energy · Beast · Hope · hope | 20 | 2 | 90% | 40 | `slow` |
| Hope Manifest | `domain-hope-2` | Energy · Beast · Hope · hope | 70 | -22 | 90% | 20 | `—` |
| Hope Sanctuary | `domain-hope-3` | Status · Beast · Hope · hope | 0 | 10 | 90% | 10 | `ward` |
| Despair Thread | `domain-despair-0` | Energy · Beast · Despair · despair | 35 | 12 | 90% | 35 | `—` |
| Despair Reverie | `domain-despair-1` | Energy · Beast · Despair · despair | 20 | 2 | 90% | 40 | `slow` |
| Despair Manifest | `domain-despair-2` | Energy · Beast · Despair · despair | 70 | -22 | 90% | 20 | `—` |
| Despair Sanctuary | `domain-despair-3` | Status · Beast · Despair · despair | 0 | 10 | 90% | 10 | `ward` |
| Sorrow Thread | `domain-sorrow-0` | Energy · Beast · Sorrow · sorrow | 35 | 12 | 90% | 35 | `—` |
| Sorrow Reverie | `domain-sorrow-1` | Energy · Beast · Sorrow · sorrow | 20 | 2 | 90% | 40 | `sleep` |
| Sorrow Manifest | `domain-sorrow-2` | Energy · Beast · Sorrow · sorrow | 70 | -22 | 90% | 20 | `—` |
| Sorrow Sanctuary | `domain-sorrow-3` | Status · Beast · Sorrow · sorrow | 0 | 10 | 90% | 10 | `ward` |
| Fate Thread | `domain-fate-0` | Energy · Beast · Fate · fate | 35 | 12 | 90% | 35 | `—` |
| Fate Reverie | `domain-fate-1` | Energy · Beast · Fate · fate | 20 | 2 | 90% | 40 | `slow` |
| Fate Manifest | `domain-fate-2` | Energy · Beast · Fate · fate | 70 | -22 | 90% | 20 | `—` |
| Fate Sanctuary | `domain-fate-3` | Status · Beast · Fate · fate | 0 | 10 | 90% | 10 | `ward` |
| Dreams Thread | `domain-dreams-0` | Energy · Beast · Dreams · dreams | 35 | 12 | 90% | 35 | `—` |
| Dreams Reverie | `domain-dreams-1` | Energy · Beast · Dreams · dreams | 20 | 2 | 90% | 40 | `sleep` |
| Dreams Manifest | `domain-dreams-2` | Energy · Beast · Dreams · dreams | 70 | -22 | 90% | 20 | `—` |
| Dreams Sanctuary | `domain-dreams-3` | Status · Beast · Dreams · dreams | 0 | 10 | 90% | 10 | `ward` |
| Nightmares Thread | `domain-nightmares-0` | Energy · Beast · Nightmares · nightmares | 35 | 12 | 90% | 35 | `—` |
| Nightmares Reverie | `domain-nightmares-1` | Energy · Beast · Nightmares · nightmares | 20 | 2 | 90% | 40 | `sleep` |
| Nightmares Manifest | `domain-nightmares-2` | Energy · Beast · Nightmares · nightmares | 70 | -22 | 90% | 20 | `—` |
| Nightmares Sanctuary | `domain-nightmares-3` | Status · Beast · Nightmares · nightmares | 0 | 10 | 90% | 10 | `ward` |

## Technique-family moves (80)

| Move | ID | Tags | Power | Speed | Accuracy | Base Uses | Effect |
|---|---|---|---:|---:|---:|---:|---|
| Ash Brand | `tech-0` | Energy | 65 | 0 | 90% | 20 | `burn` |
| Cinder Hex | `tech-1` | Status | 0 | 0 | 90% | 20 | `burn` |
| Frost Lock | `tech-2` | Status | 0 | 0 | 90% | 20 | `freeze` |
| Glacier Lance | `tech-3` | Energy | 75 | 0 | 90% | 20 | `freeze` |
| Thunder Snare | `tech-4` | Status | 0 | 0 | 90% | 20 | `paralysis` |
| Static Surge | `tech-5` | Energy | 70 | 0 | 90% | 20 | `paralysis` |
| Venom Mark | `tech-6` | Status | 0 | 0 | 90% | 20 | `poison` |
| Virulent Curse | `tech-7` | Status | 0 | 0 | 90% | 20 | `toxic` |
| Drowse Hymn | `tech-8` | Status | 0 | 0 | 90% | 20 | `sleep` |
| Dizzying Echo | `tech-9` | Status | 0 | 0 | 90% | 20 | `confusion` |
| Heartbound Trance | `tech-10` | Status | 0 | 0 | 90% | 20 | `infatuation` |
| Staggering Blow | `tech-11` | Physical | 55 | 0 | 90% | 25 | `flinch` |
| Soul Leech | `tech-12` | Energy | 65 | 0 | 90% | 20 | `drain` |
| Vampiric Talon | `tech-13` | Physical | 60 | 0 | 90% | 25 | `drain` |
| Life Offering | `tech-14` | Status | 0 | 0 | 90% | 5 | `rest` |
| Renewal Bloom | `tech-15` | Status | 0 | 0 | 90% | 10 | `heal` |
| Full Restoration | `tech-16` | Status | 0 | 0 | 90% | 5 | `fullheal` |
| Cleansing Rain | `tech-17` | Status | 0 | 0 | 90% | 20 | `cleanse` |
| Aegis Sphere | `tech-18` | Status | 0 | 0 | 90% | 10 | `protect` |
| Mirror Mantle | `tech-19` | Status | 0 | 0 | 90% | 10 | `reflect` |
| Spirimon Veil | `tech-20` | Status | 0 | 0 | 90% | 10 | `lightscreen` |
| Rooted Sanctuary | `tech-21` | Status | 0 | 0 | 90% | 10 | `safeguard` |
| Haste Chant | `tech-22` | Status | 0 | 0 | 90% | 20 | `boostSpeed` |
| Battle Trance | `tech-23` | Status | 0 | 0 | 90% | 20 | `boostMight` |
| Arcane Focus | `tech-24` | Status | 0 | 0 | 90% | 20 | `boostPower` |
| Stoneguard | `tech-25` | Status | 0 | 0 | 90% | 20 | `boostDefense` |
| Mystic Barrier | `tech-26` | Status | 0 | 0 | 90% | 20 | `boostResistance` |
| Shattering Cry | `tech-27` | Status | 0 | 0 | 90% | 20 | `lowerDefense` |
| Withering Glare | `tech-28` | Status | 0 | 0 | 90% | 20 | `lowerMight` |
| Unraveling Hex | `tech-29` | Status | 0 | 0 | 90% | 20 | `lowerPower` |
| Gravity Bind | `tech-30` | Status | 0 | 0 | 90% | 20 | `lowerSpeed` |
| Sapping Mist | `tech-31` | Status | 0 | 0 | 90% | 20 | `lowerResistance` |
| Echo Step | `tech-32` | Status | 0 | 0 | 90% | 20 | `boostEvasion` |
| True Sight | `tech-33` | Status | 0 | 0 | 90% | 20 | `boostAccuracy` |
| Veil of Doubt | `tech-34` | Status | 0 | 0 | 90% | 20 | `lowerAccuracy` |
| Null Chant | `tech-35` | Status | 0 | 0 | 90% | 20 | `haze` |
| Soul Exchange | `tech-36` | Status | 0 | 0 | 90% | 20 | `swapStats` |
| Hex Reversal | `tech-37` | Status | 0 | 0 | 90% | 20 | `invertStats` |
| Piercing Rush | `tech-38` | Physical | 75 | 0 | 90% | 20 | `recoil` |
| Sacrificial Burst | `tech-39` | Energy | 110 | 0 | 90% | 5 | `recoil` |
| Sunder Strike | `tech-40` | Physical | 75 | 0 | 90% | 20 | `breakWard` |
| Rending Flurry | `tech-41` | Physical | 25 | 0 | 90% | 20 | `multiHit` |
| Starfall Volley | `tech-42` | Energy | 25 | 0 | 90% | 20 | `multiHit` |
| Binding Roots | `tech-43` | Physical | 35 | 0 | 90% | 35 | `trap` |
| Spectral Chains | `tech-44` | Energy | 35 | 0 | 90% | 35 | `trap` |
| Seed of Hunger | `tech-45` | Status | 0 | 0 | 90% | 20 | `leechSeed` |
| Thornfield | `tech-46` | Status | 0 | 0 | 90% | 20 | `spikes` |
| Toxic Miasma | `tech-47` | Status | 0 | 0 | 90% | 20 | `toxicSpikes` |
| Jagged Stones | `tech-48` | Status | 0 | 0 | 90% | 20 | `stealthRock` |
| Arcane Web | `tech-49` | Status | 0 | 0 | 90% | 20 | `stickyWeb` |
| Clearing Gust | `tech-50` | Status | 0 | 0 | 90% | 20 | `clearHazards` |
| Doom Omen | `tech-51` | Status | 0 | 0 | 90% | 5 | `perish` |
| Echoing Curse | `tech-52` | Status | 0 | 0 | 90% | 20 | `curse` |
| Destiny Knot | `tech-53` | Status | 0 | 0 | 90% | 5 | `destinyBond` |
| Spirimon Lock | `tech-54` | Status | 0 | 0 | 90% | 20 | `disable` |
| Silencing Sigil | `tech-55` | Status | 0 | 0 | 90% | 20 | `taunt` |
| Counterstroke | `tech-56` | Physical | 60 | 0 | 90% | 25 | `counter` |
| Energy Reversal | `tech-57` | Energy | 60 | 0 | 90% | 25 | `mirrorCoat` |
| Swift Fang | `tech-58` | Physical | 40 | 25 | 90% | 35 | `priority` |
| Quick Spark | `tech-59` | Energy | 40 | 25 | 90% | 35 | `priority` |
| Unerring Beam | `tech-60` | Energy | 55 | 0 | 90% | 25 | `sureHit` |
| Aether Cannon | `tech-61` | Energy | 115 | 0 | 90% | 5 | `recharge` |
| Colossal Impact | `tech-62` | Physical | 115 | 0 | 90% | 5 | `recharge` |
| Twinstrike | `tech-63` | Physical | 40 | 0 | 90% | 20 | `doubleHit` |
| Moonlight Mend | `tech-64` | Status | 0 | 0 | 90% | 10 | `heal` |
| Rage Bloom | `tech-65` | Physical | 65 | 0 | 90% | 20 | `boostMight` |
| Spirimon Break | `tech-66` | Energy | 70 | 0 | 90% | 20 | `lowerPower` |
| Frostbite Fang | `tech-67` | Physical | 60 | 0 | 90% | 25 | `frostbite` |
| Nightmare Pulse | `tech-68` | Energy | 65 | 0 | 90% | 20 | `nightmare` |
| Curse of Frailty | `tech-69` | Status | 0 | 0 | 90% | 20 | `curse` |
| Corrupting Tide | `tech-70` | Energy | 70 | 0 | 90% | 20 | `toxic` |
| Ember Cyclone | `tech-71` | Energy | 65 | 0 | 90% | 20 | `burn` |
| Storm Jolt | `tech-72` | Energy | 65 | 0 | 90% | 20 | `paralysis` |
| Lucid Dream | `tech-73` | Status | 0 | 0 | 90% | 5 | `rest` |
| Prismatic Lance | `tech-74` | Energy | 90 | 0 | 90% | 10 | `—` |
| Meteor Hammer | `tech-75` | Physical | 90 | 0 | 90% | 10 | `—` |
| Solar Lance | `tech-76` | Energy | 100 | 0 | 90% | 10 | `—` |
| Abyssal Claw | `tech-77` | Physical | 100 | 0 | 90% | 10 | `—` |
| Judgment Spiral | `tech-78` | Energy | 85 | 0 | 90% | 10 | `—` |
| Wildcat Blitz | `tech-79` | Physical | 85 | 0 | 90% | 10 | `—` |

## Environment and tactical moves (32)

| Move | ID | Tags | Power | Speed | Accuracy | Base Uses | Effect |
|---|---|---|---:|---:|---:|---:|---|
| Rain Invocation | `environment-0` | Status · Elemental | 0 | 0 | 90% | 20 | `weatherRain` |
| Sun Invocation | `environment-1` | Status · Elemental | 0 | 0 | 90% | 20 | `weatherSun` |
| Dust Tempest | `environment-2` | Status · Elemental | 0 | 0 | 90% | 20 | `weatherSand` |
| Hailstorm Rite | `environment-3` | Status · Elemental | 0 | 0 | 90% | 20 | `weatherSnow` |
| Verdant Ground | `environment-4` | Status · Elemental | 0 | 0 | 90% | 20 | `terrainGrass` |
| Charged Ground | `environment-5` | Status · Elemental | 0 | 0 | 90% | 20 | `terrainElectric` |
| Dreaming Ground | `environment-6` | Status · Elemental | 0 | 0 | 90% | 20 | `terrainPsychic` |
| Veiled Ground | `environment-7` | Status · Elemental | 0 | 0 | 90% | 20 | `terrainMisty` |
| Monsoon Lance | `environment-8` | Energy · Elemental | 85 | 0 | 90% | 10 | `weatherStrike` |
| Solar Torrent | `environment-9` | Energy · Elemental | 95 | 0 | 90% | 10 | `sunStrike` |
| Dustbreaker | `environment-10` | Physical · Elemental | 85 | 0 | 90% | 10 | `sandStrike` |
| Winter Comet | `environment-11` | Energy · Elemental | 85 | 0 | 90% | 10 | `snowStrike` |
| Rootburst | `environment-12` | Physical · Elemental | 75 | 0 | 90% | 20 | `terrainStrike` |
| Voltage Bloom | `environment-13` | Energy · Elemental | 75 | 0 | 90% | 20 | `electricStrike` |
| Dreamfall | `environment-14` | Energy · Elemental | 75 | 0 | 90% | 20 | `psychicStrike` |
| Mistfire | `environment-15` | Energy · Elemental | 75 | 0 | 90% | 20 | `mistStrike` |
| Retreating Slash | `environment-16` | Physical · Elemental | 65 | 0 | 90% | 20 | `pivot` |
| Passing Current | `environment-17` | Energy · Elemental | 65 | 0 | 90% | 20 | `pivot` |
| Forceful Gale | `environment-18` | Energy · Elemental | 65 | 0 | 90% | 20 | `forceSwitch` |
| Driving Charge | `environment-19` | Physical · Elemental | 65 | 0 | 90% | 20 | `forceSwitch` |
| Skybound Dive | `environment-20` | Physical · Elemental | 110 | 0 | 90% | 5 | `twoTurn` |
| Burrowing Assault | `environment-21` | Physical · Elemental | 100 | 0 | 90% | 10 | `twoTurn` |
| Abyssal Submerge | `environment-22` | Energy · Elemental | 100 | 0 | 90% | 10 | `twoTurn` |
| Solar Gathering | `environment-23` | Energy · Elemental | 120 | 0 | 90% | 5 | `chargeSun` |
| Unbroken Rampage | `environment-24` | Physical · Elemental | 100 | 0 | 90% | 10 | `rampage` |
| Resonant Chorus | `environment-25` | Energy · Elemental | 95 | 0 | 90% | 10 | `rampage` |
| Boundless Focus | `environment-26` | Status · Elemental | 0 | 0 | 90% | 20 | `focus` |
| Stored Thunder | `environment-27` | Energy · Elemental | 110 | 0 | 90% | 5 | `delayedStrike` |
| Waking Echo | `environment-28` | Energy · Elemental | 70 | 0 | 90% | 20 | `sleepStrike` |
| Venom Feast | `environment-29` | Physical · Elemental | 75 | 0 | 90% | 20 | `venomStrike` |
| Hex Pulse | `environment-30` | Energy · Elemental | 65 | 0 | 90% | 20 | `hexStrike` |
| Countercurrent | `environment-31` | Physical · Elemental | 75 | 0 | 90% | 20 | `counter` |

## Advanced moves (68)

| Move | ID | Tags | Power | Speed | Accuracy | Base Uses | Effect |
|---|---|---|---:|---:|---:|---:|---|
| Aether Absorption | `advanced-0` | Energy · Plant · Plant | 20 | 0 | 90% | 40 | `drain` |
| Quickstone | `advanced-1` | Physical · Elemental · Earth | 40 | 30 | 90% | 35 | `priority` |
| Corrosive Spray | `advanced-2` | Energy · Celestial · Water | 40 | 0 | 90% | 35 | `lowerResistance` |
| Iron Carapace | `advanced-3` | Status · Celestial · Metal | 0 | 0 | 90% | 20 | `boostDefense` |
| Weightless Strike | `advanced-4` | Physical · Celestial · Air | 55 | 0 | 90% | 25 | `unburdened` |
| Precise Talon | `advanced-5` | Physical · Celestial · Air | 60 | 0 | 90% | 25 | `sureHit` |
| Swift Current | `advanced-6` | Status · Celestial · Air | 0 | 0 | 90% | 20 | `boostSpeed` |
| Whirling Blade | `advanced-7` | Energy · Celestial · Air | 60 | 0 | 90% | 25 | `critical` |
| Air Sunder | `advanced-8` | Energy · Celestial · Air | 75 | 0 | 90% | 20 | `flinch` |
| Spirimon Anchor | `advanced-9` | Physical · Celestial · Metal | 80 | 0 | 90% | 20 | `trap` |
| Elder Radiance | `advanced-10` | Energy · Celestial · Light | 60 | 0 | 90% | 25 | `omniBoost` |
| Tidal Blade | `advanced-11` | Physical · Celestial · Water | 70 | 0 | 90% | 20 | `critical` |
| Tidal Jet | `advanced-12` | Physical · Celestial · Water | 40 | 30 | 90% | 35 | `priority` |
| Healing Current | `advanced-13` | Status · Celestial · Water | 0 | 0 | 90% | 10 | `regenerate` |
| Tidal Dance | `advanced-14` | Physical · Celestial · Water | 80 | 0 | 90% | 20 | `boostSpeed` |
| Thousand Cuts | `advanced-15` | Physical · Celestial · War | 15 | 0 | 90% | 25 | `multiHit` |
| Cannonfire | `advanced-16` | Energy · Celestial · Fire | 120 | 0 | 90% | 5 | `selfDebuff` |
| Fragrant Remedy | `advanced-17` | Status · Plant · Plant | 0 | 0 | 90% | 20 | `partyCleanse` |
| Vengeance Mark | `advanced-18` | Physical · Undead · Dark | 60 | 0 | 90% | 25 | `revenge` |
| Ghostly Swarm | `advanced-19` | Energy · Undead · Dark | 120 | 0 | 90% | 5 | `—` |
| Astral Shelter | `advanced-20` | Status · Celestial · Ice | 0 | 0 | 90% | 10 | `auroraVeil` |
| Avalanche Rush | `advanced-21` | Physical · Celestial · Ice | 60 | 0 | 90% | 25 | `revenge` |
| Blight Barrage | `advanced-22` | Physical · Celestial · Water | 60 | 0 | 90% | 25 | `venomStrike` |
| Mystic Chain | `advanced-23` | Status · Celestial · Fate | 0 | 0 | 90% | 20 | `batonPass` |
| Skyfire Charge | `advanced-24` | Physical · Celestial · Air | 100 | 0 | 90% | 10 | `twoTurn` |
| Chorus of Allies | `advanced-25` | Physical · Celestial · War | 20 | 0 | 90% | 40 | `partyStrike` |
| Crimson Offering | `advanced-26` | Status · Celestial · Wrath | 0 | 0 | 90% | 20 | `bellyDrum` |
| Stored Retaliation | `advanced-27` | Physical · Celestial · War | 60 | 0 | 90% | 25 | `counter` |
| Vine Snare | `advanced-28` | Physical · Plant · Plant | 15 | 0 | 90% | 40 | `trap` |
| Dreadfang | `advanced-29` | Physical · Celestial · Fear | 60 | 0 | 90% | 25 | `flinch` |
| Siphoning Fang | `advanced-30` | Physical · Undead · Dark | 90 | 0 | 90% | 10 | `drain` |
| Stonewall Chant | `advanced-31` | Status · Elemental · Earth | 0 | 0 | 90% | 20 | `boostDefense` |
| Unyielding Mind | `advanced-32` | Status · Celestial · Dreams | 0 | 0 | 90% | 20 | `boostResistance` |
| Skybreaker | `advanced-33` | Energy · Celestial · Air | 150 | 0 | 90% | 5 | `recharge` |
| Volcanic Flare | `advanced-34` | Energy · Celestial · Fire | 85 | 0 | 90% | 10 | `burn` |
| Frost Tempest | `advanced-35` | Energy · Celestial · Ice | 110 | 0 | 90% | 5 | `freeze` |
| Phantom Lock | `advanced-36` | Status · Undead · Dark | 0 | 0 | 90% | 20 | `trap` |
| Sunlit Lance | `advanced-37` | Energy · Celestial · Sun | 120 | 0 | 90% | 5 | `chargeSun` |
| Spirimon Bastion | `advanced-38` | Status · Celestial · Light | 0 | 0 | 90% | 10 | `protect` |
| Soulbound Pact | `advanced-39` | Status · Celestial · Fate | 0 | 0 | 90% | 5 | `destinyBond` |
| Moonlit Renewal | `advanced-40` | Status · Celestial · Moon | 0 | 0 | 90% | 10 | `heal` |
| Corrosive Grasp | `advanced-41` | Physical · Celestial · Water | 60 | 0 | 90% | 25 | `poison` |
| Emberfang | `advanced-42` | Physical · Celestial · Fire | 65 | 0 | 90% | 20 | `burn` |
| Echo Chamber | `advanced-43` | Status · Celestial · Dreams | 0 | 0 | 90% | 10 | `reflect` |
| Fading Veil | `advanced-44` | Status · Celestial · Light | 0 | 0 | 90% | 10 | `lightscreen` |
| Fatebreaker | `advanced-45` | Physical · Celestial · Fate | 75 | 0 | 90% | 20 | `breakWard` |
| Feral Fury | `advanced-46` | Physical · Celestial · Wrath | 110 | 0 | 90% | 5 | `rampage` |
| Mirage Pulse | `advanced-47` | Energy · Celestial · Dreams | 70 | 0 | 90% | 20 | `confusion` |
| Iron Tempest | `advanced-48` | Physical · Celestial · Metal | 25 | 0 | 90% | 20 | `multiHit` |
| Starlit Bolt | `advanced-49` | Energy · Celestial · Light | 80 | 0 | 90% | 20 | `sureHit` |
| Petrifying Gaze | `advanced-50` | Status · Elemental · Earth | 0 | 0 | 90% | 20 | `paralysis` |
| Venom Bloom | `advanced-51` | Status · Plant · Plant | 0 | 0 | 90% | 20 | `toxic` |
| Spirimon Silence | `advanced-52` | Status · Celestial · Law | 0 | 0 | 90% | 20 | `taunt` |
| Memory Seal | `advanced-53` | Status · Celestial · Dreams | 0 | 0 | 90% | 20 | `disable` |
| Final Omen | `advanced-54` | Status · Celestial · Fate | 0 | 0 | 90% | 5 | `perish` |
| Dreamfeast | `advanced-55` | Energy · Celestial · Nightmares | 70 | 0 | 90% | 20 | `nightmare` |
| Gravity Reversal | `advanced-56` | Status · Celestial · Chaos | 0 | 0 | 90% | 20 | `invertStats` |
| Purifying Wind | `advanced-57` | Status · Celestial · Air | 0 | 0 | 90% | 20 | `clearHazards` |
| Razorfield | `advanced-58` | Status · Elemental · Earth | 0 | 0 | 90% | 20 | `spikes` |
| Dusk Veil | `advanced-59` | Status · Undead · Dark | 0 | 0 | 90% | 10 | `safeguard` |
| Toxic Mire | `advanced-60` | Status · Celestial · Water | 0 | 0 | 90% | 20 | `toxicSpikes` |
| Rooted Hunger | `advanced-61` | Status · Plant · Plant | 0 | 0 | 90% | 20 | `leechSeed` |
| Spirimon Surge | `advanced-62` | Energy · Celestial · Lightning | 65 | 0 | 90% | 20 | `pivot` |
| Displacing Wave | `advanced-63` | Energy · Celestial · Water | 65 | 0 | 90% | 20 | `forceSwitch` |
| Sunfall | `advanced-64` | Energy · Celestial · Sun | 95 | 0 | 90% | 10 | `sunStrike` |
| Midnight Squall | `advanced-65` | Energy · Celestial · Water | 85 | 0 | 90% | 10 | `weatherStrike` |
| Shifting Earth | `advanced-66` | Physical · Elemental · Earth | 85 | 0 | 90% | 10 | `sandStrike` |
| Frost Nova | `advanced-67` | Energy · Celestial · Ice | 85 | 0 | 90% | 10 | `snowStrike` |

## Status condition identifiers

- `burn`
- `freeze`
- `paralysis`
- `poison`
- `toxic`
- `sleep`
- `confusion`
- `infatuation`
- `flinch`
- `frostbite`
- `nightmare`
- `trap`
- `leechSeed`
- `curse`
- `perish`
- `disable`
- `taunt`

*Source inventory only; no end-to-end execution is implied.*
