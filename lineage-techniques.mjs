// Three additional signatures per established lineage. None replace equipped moves.
// Columns: lineage | opening | preparation | culmination | preparation effect | culmination effect | opening category.
const LINEAGE_ROWS=`
kilnscale|Porcelain Rattle|Hinged Curl|Temple Bell Roll|boostDefense|breakWard|physical
 dewveil|Amber Dewshot|Nectar Poultice|Sundew Entanglement|heal|trap|spiritual
zephyrtap|Trunk Gust|Cloudstep|Spiral Squall|boostSpeed|lowerSpeed|spiritual
oculume|Orbiting Feather|Spiral Vigil|Many-Eyed Aperture|boostResistance|lowerResistance|spiritual
mycogaze|Sporecup Dart|Mycelial Communion|Watching Moss Snare|regenerate|poison|spiritual
vellifold|Ribbon Crease|Gel Refraction|Recursive Aperture|boostResistance|confusion|spiritual
lanterglide|Lantern Swoop|Nectar Lantern|Silkglide Flurry|heal|doubleHit|physical
veilstripe|Spectral Snap|Striped Afterimage|Thylacine Requiem|boostSpeed|hexStrike|physical
megalorn|Sloth Palm|Callus Brace|Groundsloth Upheaval|boostDefense|lowerDefense|physical
aurelattice|Crystal Pinion|Golden Articulation|Lattice Judgment|ward|breakWard|spiritual
seralotus|Lotus Gleam|Petal Benediction|Sixwing Bloom|heal|lowerPower|spiritual
astraveil|Ancestral Glimmer|Pearl Ossuary|Halo Procession|boostResistance|hexStrike|spiritual
auroriel|Coral Aurora|Opaline Circuit|Wingring Flare|boostPower|burn|spiritual
bronzewade|Patina Peck|Wingplate Screen|Heron Piledrive|reflect|lowerDefense|physical
jarjell|Lacquer Bead|Jelly Mortar|Vermilion Vessel Crash|heal|recoil|physical
puppetide|Branch Tap|Silk Suspense|Marionette Tangle|boostSpeed|trap|physical
kilnwarden|Brazier Spit|Furnace Stoke|Forge-Eye Torrent|boostPower|burn|spiritual
torrentreed|Reed Current|Jade Backwater|Seedpod Undertow|regenerate|lowerSpeed|spiritual
cinerwraith|Ash Whisper|Spectral Ribcage|Ember Shroud Burst|ward|burn|spiritual
glasswhorl|Glass Orbit|Pivot Alignment|Sandring Rupture|boostSpeed|lowerDefense|spiritual
resonara|Plasma Chime|Crown Resonance|Nested Bell Peal|boostPower|lowerResistance|spiritual
whiskerfey|Whisker Feint|Mothwing Poise|Dormouse Moonpounce|boostSpeed|critical|physical
gelmirth|Dewdrop Flick|Mint Reconstitution|Fern-Ear Reverie|heal|sleep|spiritual
silkvisage|Porcelain Glint|Cloak Cocoon|Sixfinger Silken Bind|ward|trap|spiritual
jesthorn|Ember Thorn|Leafwing Gambol|Violet Prankrush|boostSpeed|confusion|spiritual
bramblefiend|Hooked Vine|Pitcher Feast|Barbed Briar Lash|regenerate|drain|physical
chainhorn|Jawplate Knock|Chain Bracing|Redhot Chain Drag|boostDefense|trap|physical
crownscar|Fractured Gleam|Silver Coronation|Broken Halo Descent|boostResistance|breakWard|spiritual
pitchmaw|Oil Glob|Viscous Shelter|Amber-Crack Eruption|ward|burn|spiritual
bonsaitor|Bark Tusk Nudge|Terrace Canopy|Bonsai Trunk Sweep|boostDefense|lowerSpeed|physical
cloudgron|Hoof Thunder|Cloudmane Gathering|Ramhead Tempest|boostPower|paralysis|spiritual
lacquertor|Lacquer Palm|Fourfold Brace|Ancient Mantle Crush|boostDefense|breakWard|physical
barrowgron|Burial Knuckle|Tombstone Vigil|Longarm Gravequake|ward|curse|physical
silkclasp|Antenna Flick|Fourarm Weaving|Mothsilk Enclosure|boostSpeed|trap|physical
wickerstride|Reed Rap|Vine Mending|Strangler Finger Coil|regenerate|leechSeed|physical
mirrorkin|Glass Palm|Ribbon Refraction|Fourarm Mirrorfall|boostResistance|confusion|spiritual
prismonk|Opaline Talon|Mantle Contemplation|Crestlight Fan|focus|lowerResistance|physical
tempestrill|Feather Spark|Coiling Updraft|Amphiptere Thunderline|boostSpeed|paralysis|spiritual
reinroot|Reedfin Lash|River-Mane Shelter|Kelpie Drowning Vines|ward|trap|physical
fengweave|Jade Plume|Bronze Plumage|Fenghuang Tailflare|boostDefense|breakWard|spiritual
vitrilisk|Violet Scale|Gel Crown|Basilisk Glass Glare|ward|paralysis|spiritual
amberwork|Clockwork Droplet|Amber Reassembly|Porcelain Cogburst|heal|lowerDefense|spiritual
halojell|Pearl Pseudopod|Featherlight Mantle|Golden Ring Cascade|boostResistance|lowerPower|spiritual
nepentide|Pitcher Splash|Nectar Refill|Sundew Jelly Trap|regenerate|drain|spiritual
ossigel|Skullbubble Pop|Ectoplasm Knit|Bonecurrent Wail|heal|curse|spiritual
strangleweld|Hingevine Snap|Ironbark Lock|Articulated Strangle|boostDefense|trap|physical
fumepitcher|Sulfur Lure|Blackroot Draw|Infernal Cup Vapor|regenerate|poison|spiritual
needlebristle|Stinging Hair|Rootpaw Scramble|Gympie Needle Shower|boostSpeed|poison|physical
jianglume|Lantern Bob|Sleeve Reweaving|Ancestral Moth Procession|heal|lowerPower|spiritual
draugale|Saltwind Cut|Burial Armor|Draugr Stormwake|boostDefense|frostbite|spiritual
aetherling|Clockjaw Jolt|Ceramic Rib Screen|Tentacle Aether Snare|ward|trap|spiritual
bramblehorn|Thornbud Toss|Takin Rootstance|Branchhorn Stampede|boostDefense|recoil|physical
cindershade|Pearl Ember|Hollow-Chest Vigil|Misplaced Eye Flare|boostPower|confusion|spiritual
duskclaw|Cedar Paw|Silktail Camouflage|Civet Twilight Pounce|boostSpeed|critical|physical
embermoth|Amber Emberdrop|Molten Mending|Liquid Mothflare|heal|burn|spiritual
frostwyrm|Frosttuft Dart|Halo Rime|Snowgecko Starbreath|ward|frostbite|spiritual
gloomglen|Basalt Knuckle|Lichen Fortitude|Boar-Tusk Fault|boostDefense|breakWard|physical
hollowbloom|Funeral Spore|Ribbed Sanctuary|Hollow Giant Knell|ward|curse|spiritual
ivoryspire|Porcelain Shiver|Wind Ribbon Dance|Antelope Dustspiral|boostSpeed|lowerResistance|spiritual
jademaw|Jade Toothshot|Scute Suspension|Splitmaw Constriction|boostDefense|drain|physical
kelpveil|Riverstone Flick|Kelp Shroud|Ottercurrent Crush|ward|lowerSpeed|physical
lumenwing|Nectar Spark|Pitcher Cowl|Lurewing Inferno|boostPower|burn|spiritual
morrowfang|Skullroot Snap|Funeral Sap|Jackal Gravebloom|regenerate|curse|physical
nacreling|Nacre Splinter|Layered Closure|Aperture Pearlburst|boostDefense|confusion|spiritual
obsidhorn|Hindleg Kick|Faerie Footwork|Blackhorn Bound|boostSpeed|recoil|physical
pollenshade|Ivory Pollen|Plume Sanctuary|Eyemane Radiance|ward|confusion|spiritual
quillclaw|Clockquill Shot|Bellflower Brace|Amethyst Quill Volley|boostDefense|multiHit|physical
runemoth|Silver Runedrop|Violet Inscription|Fluid Rune Torrent|boostPower|lowerResistance|spiritual
sablewyrm|Velvet Feint|Tailring Grace|Marten Silverrush|boostSpeed|critical|physical
thornglen|Burgundy Spine|Bramble Crown|Hooktail Briarcrush|boostMight|lowerDefense|physical
umberbloom|Linen Sweep|Turquoise Ribward|Mummified Earthfall|ward|curse|physical
vesperspire|Duskfur Gust|Twilight Glide|Amber-Eye Windcry|boostSpeed|lowerPower|spiritual
willowmaw|Sap Frond|Drooping Cover|Needlemaw Undertow|ward|drain|physical
xyloveil|Woodgrain Glob|Amber Rebinding|Salamander Sap Surge|heal|lowerSpeed|spiritual
yarrowwing|White Lure|Barbed Stemwall|Toothcup Blossom|boostDefense|drain|physical
zephyrfang|Reedbone Dart|Spectral Sap Knit|Wolfskull Windhowl|heal|curse|spiritual
ashenling|Coal-Eye Spark|Burnt Cedar Brace|Cablejaw Cinderbind|boostDefense|trap|spiritual
berylhorn|Beryl Bound|Earfin Flourish|Branchhorn Leafrush|boostSpeed|lowerDefense|physical
coppershade|Copper Plume|Halo Mantle|Splitbeak Starfall|ward|confusion|spiritual
driftclaw|Driftwood Swipe|Sea-Silk Wrap|Otter Glasswake|boostResistance|lowerSpeed|physical
eldermoth|Oldgold Droplet|Resin Renewal|Ancient Leaf Conflagration|regenerate|burn|spiritual
flintwyrm|Flint Fleck|Crown Poise|Opaline Drake Flash|focus|breakWard|spiritual
garnetglen|Garnet Fist|Obsidian Set|Hookjaw Shatter|boostMight|breakWard|physical
hazelbloom|Hazel Finger|Burial Branchward|Deadwood Giant Sigh|ward|curse|spiritual
indigospire|Water-Ribbon Flick|Frillwater Rest|Cobalt Webhand Torrent|heal|lowerSpeed|spiritual
junipermaw|Berry Sapshot|Evergreen Shelter|Manyjaw Needletide|ward|doubleHit|physical
kestrelveil|Gel Beak|Featherfan Drift|Kestrel Liquid Dive|boostSpeed|critical|physical
lichenwing|Ember Fruitcup|Leathery Leaf Screen|Trumpet-Trap Exhalation|boostResistance|poison|spiritual
marrowfang|Marrow Root|Black-Sap Communion|Wolfskull Rootfeast|regenerate|drain|physical
nimbusling|Cloud-Eye Jolt|Ribhoop Grounding|Stormgear Discharge|boostResistance|paralysis|spiritual
opalhorn|Opal Kick|Hare Earstep|Prismatic Longbound|boostSpeed|critical|physical
pyreshade|Chestmouth Ember|Pearlgold Mantle|Many-Eyed Lionflare|ward|burn|spiritual
quartzclaw|Quartz Pawcut|Copper Leafguard|Lynx Crystal Ambush|boostDefense|critical|physical
rimemoth|Icy Droplet|Silver Vein Cocoon|Gelwing Rimeburst|ward|frostbite|spiritual
saffronwyrm|Saffron Whisker|Tail-Ribbon Benediction|Otter Starstream|heal|lowerResistance|spiritual
tundraglen|Icegray Tusk|Tundra Fur Brace|Hornridge Avalanche|boostDefense|lowerSpeed|physical
verdantbloom|Bog Ribpulse|Fernwrap Renewal|Burial Moss Engulf|regenerate|leechSeed|spiritual
wraithspire|Mask Whisper|Twinhead Vigil|Two-Mask Windlament|boostResistance|confusion|spiritual
yewmaw|Yew Berryshot|Sapwood Seal|Hollow-Trunk Devouring|ward|poison|physical
zirconveil|Mineral Gelpaw|Heavy Gel Set|Zircon Lynx Crash|boostDefense|lowerDefense|physical
arborkin|Arbor Glimmer|Flowering Antlers|Leafwing Dawntrail|heal|lowerPower|spiritual
basilgore|Saber Monitor Snap|Ridgeback Stance|Basilisk Rending Charge|boostMight|critical|physical
cobaltwisp|Cobalt Cogshot|Maskcore Repair|Silver-Gear Fountain|heal|lowerDefense|spiritual
dapplejaw|Horned Gelwhip|Oily Reshaping|Dappled Mawfeast|heal|drain|physical
ebonflare|Ivory Ember|Blackflame Poise|Panther Nightpyre|boostSpeed|burn|spiritual
fableroot|Parchment Sap|Barkscroll Renewal|Bone-Twig Fablebind|regenerate|trap|spiritual
glaciershard|Icy Antler Gleam|Featherear Shelter|Glacier Palmfall|ward|frostbite|physical
harborgaze|Porteye Glimmer|Bronze Rib Brace|Mastiff Breakwater|boostDefense|breakWard|physical
ichorfang|Marrow Spark|Horned Ribguard|Skeletal Hound Feast|ward|drain|physical
jasperplume|Jasper Filament|Splitmask Focus|Torso-Mouth Chorus|focus|confusion|spiritual
kindlekin|Coalbeard Flick|Volcanic Stoke|Craghand Eruption|boostMight|burn|physical
lotusgore|Petal-Eye Glare|Broadback Bracing|Impossible Hippo Bite|boostDefense|doubleHit|physical
mistralwisp|Silver Taloncut|Fourarm Winddance|Maskfang Cyclone|boostSpeed|multiHit|physical
nettlejaw|Nettle Gleam|Nectar Antler Remedy|Weasel Leaflight Rush|heal|critical|physical
onyxflare|Spineridge Rake|Reptile Plate Lock|Saber Crocodile Rupture|boostDefense|breakWard|physical
petalroot|Petalplate Flick|Seedcore Mending|Porcelain Blossom Wheel|heal|lowerPower|spiritual
quasarshard|Star Gelshot|Obsidian Orbit|Serrated Nebula Bloom|boostPower|breakWard|spiritual
ravengaze|Plasma Caw|Stormwing Spread|Halo Raven Thunder|boostSpeed|paralysis|spiritual
solacefang|Funeral Gleam|Whiteleaf Consolation|Bone-Trap Requiem|heal|curse|spiritual
talonplume|Amber Talon|Mantle Gathering|Giant Feather Rake|boostMight|lowerDefense|physical
ulmarkin|Shellband Tap|Spinal Hinge Lock|Armadillo Gravewheel|boostDefense|recoil|physical
velvetgore|Velvet Antler|Ivory Ribward|Crimson Deer Reaping|ward|hexStrike|physical
whisperwisp|Silk Murmur|Earveil Gathering|Thousand-Mouth Whisper|boostResistance|confusion|spiritual
xanthjaw|Citrine Spark|Lightning Jawcharge|Goldgray Thunderbite|boostPower|paralysis|spiritual
yonderflare|Eyestalk Flick|Tentacle-Tail Focus|Manyjaw Saberfall|focus|doubleHit|physical
zinniaroot|Mantis Petalcut|Zinnia Maskdance|Flowerfang Scissor|boostSpeed|critical|physical
aurumshard|Sunring Dart|Opaline Antlerward|Ibex Golden Ascent|ward|breakWard|spiritual
brackengaze|Bracken Tusk|Armored Lowstance|Boartiger Maul|boostMight|lowerDefense|physical
coralfang|Coral Jawshot|Teal Joint Repair|Porcelain Reef Clamp|heal|trap|physical
daggerplume|Liquid Dagger|Hornfin Folding|Burgundy Wing Carve|boostSpeed|critical|spiritual
eclipsekin|Silver Flame|Eclipsed Coronation|Stag Corona Burst|ward|lowerResistance|spiritual
fennelgore|Bone Seedshot|Ghostsap Rooting|Hollow-Stem Exhalation|regenerate|poison|spiritual
gossamerwisp|Silver Antenna|Gossamer Wrap|Giant Moth Downburst|ward|lowerPower|spiritual
hearthjaw|Brickjaw Knock|Coal Ribkindle|Badger Hearthrush|regenerate|burn|physical
isletflare|Driftbone Snap|Algae Armor|Devil Crocodile Undertow|boostDefense|trap|physical
jubilroot|Laughing Vine|Many-Eyed Glee|Rootmouth Revel|boostSpeed|confusion|spiritual
kryptonshard|Emerald Fleck|Mineral Alignment|Greenstone Fistfall|boostDefense|breakWard|physical
larchgaze|Bark-Eye Glare|Shaggy Antlerbrace|Tentacle-Jaw Rut|boostMight|trap|physical
miragefang|Shardclaw Feint|Jackal Mirage|Silver-Violet Ambush|boostSpeed|critical|physical
nectarplume|Golden Filament|Flowerlight Sip|Anteater Halo Stream|heal|lowerResistance|spiritual
oraclekin|Hookbeak Swipe|Owlbear Focus|Ochre Claw Prophecy|focus|critical|physical
pewtergore|Pewter Tusk|Cogarmor Refit|Maskcore Ironroll|heal|breakWard|physical
quiverwisp|Arrowbarb Flick|Tendril Tension|Obsidian Barbvolley|boostPower|multiHit|spiritual
ripplejaw|Foam Pebble|Gillfrond Refuge|Turtle Tidal Crown|ward|lowerSpeed|spiritual
starlingflare|Beaktrap Peck|Funeral Petal Rest|Starflower Soulchorus|regenerate|curse|spiritual
truffleroot|Mushroom Earjab|Mossfur Fortitude|Truffle Crown Tremor|boostDefense|lowerSpeed|physical
uplandshard|Ivory Horn Knock|Stoneplate Brace|Bighorn Gravecrash|boostDefense|breakWard|physical
violetgaze|Violet Pawcut|Riblight Stalking|Panther Soulpounce|boostSpeed|hexStrike|physical
wardenfang|Eyemask Thread|Emerald Frondward|Mismatched Jaw Verdict|ward|confusion|spiritual
zodiacplume|Star-Motif Spark|Cloudplume Gathering|Zodiac Giant Thunderfall|boostPower|paralysis|spiritual
`;
export const LINEAGE_TECHNIQUE_DATA=Object.fromEntries(LINEAGE_ROWS.trim().split('\n').map(row=>{const [id,...data]=row.trim().split('|');return[id,data];}));
