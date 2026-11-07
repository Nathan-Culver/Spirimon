import {DOMAINS} from './domains.mjs';
// Curated generative references, not an exhaustive zoological taxonomy. No mass cutoff.
// Trait values describe the adult reference; magic is layered on separately.
export const CREATURE_TYPES=['Aberration','Beast','Celestial','Construct','Elemental','Fey','Fiend','Giant','Monstrosity','Ooze','Plant','Undead'];
export const CREATURE_DOMAINS=DOMAINS;
const records=[];
function group(type,plan,traits,names){for(const name of names.split('|'))records.push({id:name.toLowerCase().replace(/[^a-z0-9]+/g,'-'),family:names.split('|')[0],name,type,plan,traits:traits.split(' ').filter(Boolean)});}
group('Beast','quadruped','fur claws dig','red fox|arctic fox|fennec fox|gray wolf|dhole|African wild dog|coyote|golden jackal|bush dog|raccoon dog|maned wolf|dire wolf|thylacine');
group('Beast','quadruped','fur claws strong','lion|tiger|jaguar|leopard|snow leopard|clouded leopard|cougar|cheetah|lynx|bobcat|caracal|serval|ocelot|fishing cat|Pallas cat|saber-toothed cat|cave lion|spotted hyena|striped hyena');
group('Beast','quadruped','fur claws dig strong','brown bear|polar bear|American black bear|Asian black bear|sun bear|sloth bear|spectacled bear|giant panda|short-faced bear|wolverine|honey badger|European badger|American badger');
group('Beast','quadruped','fur claws dig','European otter|sea otter|giant otter|mink|stoat|ferret|pine marten|fisher|sable|red panda|raccoon|coati|kinkajou|binturong|mongoose|meerkat|civet|genet|fossa');
group('Beast','quadruped','fur hooves horns strong','American bison|European bison|water buffalo|African buffalo|wild yak|gaur|banteng|aurochs|musk ox|mountain goat|ibex|markhor|bighorn sheep|argali|bongo|kudu|eland|oryx|sable antelope|wildebeest|takin');
group('Beast','quadruped','fur hooves antlers','red deer|elk|moose|reindeer|fallow deer|roe deer|mule deer|white-tailed deer|pudu|muntjac|water deer|pronghorn|gazelle|impala|saiga|giraffe|okapi');
group('Beast','quadruped','fur hooves strong','wild horse|Przewalski horse|zebra|onager|kiang|Bactrian camel|dromedary|guanaco|vicuna|tapir');
group('Beast','quadruped','hide strong tusks','African elephant|Asian elephant|woolly mammoth|mastodon|gomphothere|deinotherium|warthog|wild boar|babirusa|peccary');
group('Beast','quadruped','hide strong horns','white rhinoceros|black rhinoceros|Indian rhinoceros|Sumatran rhinoceros|Javan rhinoceros|woolly rhinoceros|elasmotherium');
group('Beast','quadruped','hide strong swim','hippopotamus|pygmy hippopotamus');
group('Beast','quadruped','fur claws dig','pangolin|giant anteater|tamandua|aardvark|echidna|armadillo|giant armadillo|glyptodon|hedgehog|tenrec|mole|star-nosed mole|solenodon');
group('Beast','quadruped','fur claws','capybara|beaver|porcupine|crested porcupine|marmot|prairie dog|squirrel|flying squirrel|jerboa|springhare|chinchilla|agouti|paca|coypu|hare|rabbit|pika|giant ground sloth');
group('Beast','biped','fur hands climb','gorilla|chimpanzee|bonobo|orangutan|gibbon|siamang|mandrill|baboon|gelada|macaque|colobus monkey|spider monkey|capuchin|howler monkey|proboscis monkey|ring-tailed lemur|sifaka|aye-aye');
group('Beast','biped','fur claws jump','red kangaroo|gray kangaroo|wallaby|tree kangaroo|bettong');
group('Beast','quadruped','fur claws climb','koala|wombat|Tasmanian devil|quoll|numbat|opossum|quokka|bandicoot|cuscus|sugar glider');
group('Beast','winged','fur wings claws fly','flying fox|vampire bat|horseshoe bat|ghost bat|spectral bat|hammer-headed bat');
group('Beast','aquatic','fur flippers swim','harbor seal|gray seal|leopard seal|elephant seal|sea lion|fur seal|walrus');
group('Beast','aquatic','hide fins swim','bottlenose dolphin|orca|beluga|narwhal|sperm whale|humpback whale|blue whale|bowhead whale|gray whale|right whale|porpoise|dugong|manatee|Steller sea cow');
group('Beast','winged','feathers wings beak talons fly','golden eagle|bald eagle|harpy eagle|crowned eagle|osprey|peregrine falcon|gyrfalcon|red-tailed hawk|goshawk|secretary bird|Andean condor|bearded vulture|eagle owl|snowy owl|barn owl|great gray owl|raven|crow|magpie');
group('Beast','winged','feathers wings beak fly','wandering albatross|pelican|heron|shoebill|stork|ibis|spoonbill|crane|flamingo|swan|goose|duck|cormorant|frigatebird|kingfisher|hornbill|toucan|macaw|cockatoo|kea|quetzal|peacock|pheasant|lyrebird|hoatzin|hummingbird');
group('Beast','biped','feathers beak strong','ostrich|emu|cassowary|rhea|moa|elephant bird|terror bird');
group('Beast','biped','feathers beak swim','emperor penguin|king penguin|rockhopper penguin|great auk');
group('Beast','quadruped','scales claws swim','Nile crocodile|saltwater crocodile|American alligator|black caiman|gharial|Komodo dragon|monitor lizard|marine iguana|green iguana|basilisk lizard');
group('Beast','quadruped','scales claws','chameleon|gecko|frilled lizard|thorny devil|Gila monster|skink|tuatara|horned lizard');
group('Beast','quadruped','shell swim','Galapagos tortoise|Aldabra tortoise|snapping turtle|alligator snapping turtle|softshell turtle|leatherback turtle|green sea turtle|hawksbill turtle');
group('Beast','serpentine','scales fangs','king cobra|black mamba|gaboon viper|rattlesnake|bush viper|boa constrictor|reticulated python|green anaconda|sea snake|titanoboa');
group('Beast','quadruped','skin swim','giant salamander|hellbender|axolotl|olm|newt|fire salamander|poison dart frog|bullfrog|tree frog|horned frog|Surinam toad');
group('Beast','serpentine','skin dig','caecilian');
group('Beast','biped','scales claws fangs strong','tyrannosaurus|allosaurus|spinosaurus|carnotaurus|ceratosaurus|dilophosaurus|baryonyx|velociraptor|deinonychus|utahraptor|therizinosaurus|oviraptor|gallimimus');
group('Beast','quadruped','scales strong','triceratops|styracosaurus|pachyrhinosaurus|ankylosaurus|euoplocephalus|stegosaurus|kentrosaurus|iguanodon|parasaurolophus|edmontosaurus|brachiosaurus|diplodocus|apatosaurus|argentinosaurus|amargasaurus');
group('Beast','winged','skin wings beak fly','pteranodon|quetzalcoatlus|dimorphodon|rhamphorhynchus|tapejara');
group('Beast','aquatic','scales fins swim fangs','ichthyosaur|plesiosaur|mosasaur|pliosaur|dunkleosteus|megalodon|great white shark|tiger shark|hammerhead shark|whale shark|basking shark|goblin shark|sawfish|manta ray|stingray|electric ray');
group('Beast','aquatic','scales fins swim','sturgeon|arapaima|alligator gar|catfish|tuna|swordfish|sailfish|marlin|ocean sunfish|grouper|goliath grouper|wrasse|parrotfish|lionfish|scorpionfish|stonefish|pufferfish|porcupinefish|triggerfish|seahorse|leafy seadragon|coelacanth|lungfish');
group('Beast','serpentine','fins swim','moray eel|electric eel|oarfish|conger eel|ribbon eel');
group('Beast','tentacled','tentacles swim grasp','giant Pacific octopus|mimic octopus|blue-ringed octopus|dumbo octopus|giant squid|colossal squid|cuttlefish|nautilus');
group('Beast','radial','skin swim','lion mane jellyfish|moon jellyfish|sea anemone|sea star|brittle star|basket star|sea urchin|sea cucumber|feather star');
group('Beast','many-legged','shell claws swim','Japanese spider crab|coconut crab|king crab|fiddler crab|horseshoe crab|lobster|mantis shrimp|pistol shrimp|crayfish|hermit crab|eurypterid|trilobite');
group('Beast','many-legged','shell claws','emperor scorpion|tarantula|jumping spider|orb-weaver spider|trapdoor spider|whip scorpion|solifuge|giant centipede|millipede|velvet worm');
group('Beast','many-legged','shell mandibles','stag beetle|rhinoceros beetle|goliath beetle|tiger beetle|bombardier beetle|leafcutter ant|army ant|weaver ant|praying mantis|orchid mantis|stick insect|leaf insect|weta|mole cricket|katydid|pill bug');
group('Beast','winged','shell wings fly','dragonfly|damselfly|atlas moth|luna moth|death-head hawkmoth|glasswing butterfly|swallowtail butterfly|monarch butterfly|honeybee|bumblebee|hornet|cicada|lanternfly|lacewing');
group('Beast','serpentine','skin','garden snail|cone snail|abalone|nudibranch|sea hare|earthworm|bobbit worm|leech|ribbon worm');
group('Plant','rooted','roots vines traps','Venus flytrap|sundew|tropical pitcher plant|North American pitcher plant|cobra lily|sun pitcher|Australian pitcher plant|bladderwort|butterwort|waterwheel plant|corkscrew plant|Portuguese sundew|strangler fig|gympie-gympie|stinging nettle|sandbox tree|manchineel|poison ivy|poison oak|giant hogweed|blackthorn|hawthorn|bramble|rose briar|devil claw|datura|monkshood|deadly nightshade|hemlock|oleander|yew|castor bean|foxglove|suicide tree|dynamite tree');
group('Aberration','tentacled','tentacles eyes grasp psionic','spiral-eyed mantle|recursive ribbon organism|asymmetric aperture stalker|fractured mirror crawler|walking eye constellation|inverted shell oracle|non-Euclidean tendril knot|folded flesh lantern|many-mouthed chime|floating neural reef|offset-jawed burrower|fractal bone blossom|living optical paradox|branching pupil swarm|tesseract leech|spiral nerve crown');
group('Celestial','winged','wings light fly','six-winged watcher|halo-ring guardian|star-feather sentinel|dawn bell herald|solar disc keeper|aurora veil oracle|moon-mirror attendant|radiant wheel envoy|comet-tailed pilgrim|luminous pearl choir|constellation shepherd|prismatic dawn vessel');
group('Construct','biped','hands armor strong','bronze automaton|porcelain sentinel|terracotta guardian|jade golem|obsidian custodian|wooden marionette|clockwork steward|lacquer puppet|origami guardian|bell-metal walker|glass jointed sentry|woven wicker keeper|animated suit of armor|rune-carved stone sentinel');
group('Construct','radial','armor','brass orrery|walking lantern|animated vessel|runic wheel|crystal gyroscope|temple bell mechanism|bronze scarab engine|living mosaic|chain-bound reliquary|magnetic ring engine');
group('Elemental','radial','elemental','living flame|flowing stone|river current|wind vortex|thunderhead|ice crystal|molten glass|sand spiral|salt storm|steam plume|magnetic arc|lava flow|plasma bell|living frost|dust devil|ocean foam|volcanic ash|lightning lattice|metal filament|snow flurry');
group('Fey','biped','hands wings fly glamour','moth-winged sprite|fern-eared courtier|orchid masked faerie|antlered trickster|willow-haired wanderer|butterfly silk dancer|cricket minstrel|dragonfly courier|petal crowned keeper|acorn masked steward');
group('Fey','quadruped','glamour fur','moonlit faerie hound|flower crowned fox|gossamer deer|lantern-tailed dormouse|silk-winged hare|moss-maned faerie cat');
group('Fiend','biped','hands horns fangs','horned prowler|barbed imp|ash-winged sentinel|obsidian masked fiend|cinder-horned stalker|chain-tailed jailer|sulfur crowned lurker|ember-eyed trickster|thorn-spined fiend|brass-jawed devourer');
group('Fiend','quadruped','horns fangs strong','infernal hound|ember maned lion|coal-hoofed ram|barbed shadow beast|sulfur-scaled crawler|smoke-backed tusker');
group('Giant','biped','hands strong large','stone-skinned giant|frost-haired giant|cloud-bearded giant|basalt giant|moss-bearded giant|dune giant|glacier giant|copper-veined giant|terrace-bearing giant|storm-crowned giant|coral-backed giant|granite ridge giant');
group('Monstrosity','quadruped','claws fangs strong','griffin|manticore|chimera|basilisk|kelpie|qilin|baku|nue|ammit|sphinx|cerberus|orthros|simurgh beast|leucrotta|catoblepas|tarasque|peryton|jackalope');
group('Monstrosity','winged','wings claws fly','wyvern|amphiptere|fenghuang|roc|hippogriff|cockatrice|quetzal serpent|thunderbird|simurgh|ziz|pegasus');
group('Monstrosity','serpentine','scales fangs','hydra|lindworm|wyrm|sea serpent|naga|ormr|bunyip serpent|rainbow serpent');
group('Ooze','amorphous','gel grasp','amber gel|ectoplasmic slime|mercurial ooze|tar pool|iridescent jelly|glass-clear blob|moss gel|foaming slime|prismatic emulsion|living ink|honey-colored ooze|opal suspension|magnetic ferrofluid|crystal colloid|silt ooze|pearl gel|viscous resin|glowing brine');
group('Undead','biped','hands bone','draugr|jiangshi|mummified sentinel|skeletal revenant|barrow guardian|desiccated oracle|tomb-bound walker|ancestral bone keeper|bog-preserved sentinel|shroud-bound wanderer');
group('Undead','radial','spectral levitate','headless wraith|ancestral lantern spirit|banshee|will-o-wisp|restless shade|spectral procession|soul-flame phantom|burial mist|ghostly veil|grave echo');
group('Undead','quadruped','bone claws','spectral hound|skeletal stag|mummified cat|revenant wolf|ghost horse|barrow bear');
export const ANATOMY_CATALOG=Object.fromEntries(CREATURE_TYPES.map(type=>[type,records.filter(r=>r.type===type)]));
export const MODIFIER_CATALOG={
 Aberration:[['recursive tendrils','tentacles eyes psionic'],['offset eyes and aperture markings','eyes psionic'],['asymmetric grasping limbs','tentacles grasp'],['fractured mirror plates','eyes armor']],
 Beast:[['layered fur and hooked claws','fur claws'],['horned brow and powerful shoulders','horns strong'],['scaled hide and biting jaws','scales fangs'],['feathered crest and talons','feathers talons']],
 Celestial:[['luminous halo and feather mantle','light wings'],['golden constellation markings','light'],['opal feathered wings','light wings fly'],['radiant ring crown','light']],
 Construct:[['porcelain plates and brass hinges','armor'],['bronze joints and jade inlays','armor'],['lacquer panels and riveted seams','armor'],['woven wood and articulated clasps','armor']],
 Elemental:[['flowing water channels','water swim'],['ember vents and flame ribbons','fire'],['wind curls and buoyant currents','air levitate'],['stone ridges and crystal seams','earth armor'],['frost fins and ice scales','ice'],['lightning filaments','lightning']],
 Fey:[['gossamer wings and lantern lights','wings fly glamour'],['flowering antlers and silk trails','glamour horns'],['petal frills and luminous nectar','glamour'],['moth-eye markings and shimmering tufts','glamour eyes']],
 Fiend:[['swept horns and barbed hide','horns armor'],['ember cracks and hooked fangs','fire fangs'],['sulfur frills and thorned tail','horns'],['smoke mane and taloned feet','claws']],
 Giant:[['massive weight-bearing limbs','strong large'],['towering shoulders and rugged hide','strong large armor'],['colossal proportions and stone calluses','strong large'],['oversized crushing forelimbs','strong large']],
 Monstrosity:[['elongated predatory claws','claws'],['mythic horns and saber fangs','horns fangs'],['serrated armor and barbed tail','armor claws'],['hooked talons and plated jaws','talons fangs']],
 Ooze:[['translucent gel joints','gel'],['flowing resin and soft pseudopods','gel grasp'],['glassy membranes and droplet edges','gel'],['viscous mantle and suspended fragments','gel']],
 Plant:[['symbiotic strangler vines','vines roots grasp'],['carnivorous pitcher growths','traps roots'],['parasitic sundew tendrils','traps vines'],['living thorn bark and root anchors','roots armor thorns']],
 Undead:[['spectral wisps and ancestral bone','bone spectral'],['burial wrappings and exposed ribs','bone'],['translucent ghostly contours','spectral levitate'],['preserved hide and faded soul light','bone spectral']]
};
export const NAME_FRAGMENTS={Aberration:['Ocul','Nyth','Vex','Fract','Spiral','Apert','Nerve','Parax'],Beast:['Fang','Pelt','Talon','Bront','Claw','Lyn','Tusk','Vulp'],Celestial:['Auri','Halo','Ser','Lumen','Dawn','Astra','Sol','Prism'],Construct:['Ferr','Kiln','Cog','Bron','Jade','Rivet','Lacquer','Porcel'],Elemental:['Gale','Rill','Cinder','Frost','Ember','Volt','Shard','Torrent'],Fey:['Syl','Lumi','Wisp','Goss','Petal','Mirth','Silk','Glim'],Fiend:['Mal','Ash','Dread','Censer','Scorn','Brim','Crown','Barb'],Giant:['Tor','Crag','Gron','Ridge','Coloss','Barrow','Terr','Plinth'],Monstrosity:['Griff','Chim','Drak','Basil','Myth','Wyrm','Mantic','Nue'],Ooze:['Gel','Mire','Amber','Dropl','Jell','Visc','Slime','Flow'],Plant:['Briar','Thorn','Moss','Reed','Nepen','Dew','Root','Bloom'],Undead:['Hush','Crypt','Wraith','Grave','Bone','Pall','Shroud','Ossi']};
