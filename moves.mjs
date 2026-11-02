import {CREATURE_TYPES} from './creature-catalog.mjs';
// Each equipped move contributes its base uses to Stanima or Willpower.
export function moveBaseValue(move){
 if(move.id==='struggle')return 0;
 const explicit=Number(move.baseUses);
 if(Number.isFinite(explicit)&&explicit>0)return Math.max(1,Math.min(40,Math.floor(explicit)));
 const power=Math.max(0,Number(move.power)||0);
 if(!power){
  if(['fullheal','rest','perish','destinyBond'].includes(move.effect))return 5;
  if(['heal','protect','ward','regenerate','auroraVeil','reflect','lightscreen','safeguard'].includes(move.effect))return 10;
  return 20;
 }
 const effective=power*(move.effect==='multiHit'?3:move.effect==='doubleHit'?2:1);
 return effective<=20?40:effective<=40?35:effective<=60?25:effective<=80?20:effective<=100?10:5;
}
const withBase=move=>({...move,baseUses:moveBaseValue(move),desc:moveLore(move).description});
const NAMES={"Aberration":["Aperture Jab","Mind Knot","Folded Veil","Paradox Crush","Disquieting Gaze","Tendril Flick","Spatial Shell","Recursive Rend"],"Beast":["Raking Claw","Hamstring Bite","Den Instinct","Antler Charge","Venom Fang","Pouncing Snap","Thick Hide","Stampeding Rush"],"Celestial":["Feather Lance","Halo Bind","Dawn Benediction","Judgment Ray","Lulling Hymn","Star Dart","Radiant Aegis","Comet Descent"],"Construct":["Rivet Shot","Gear Snare","Field Repair","Iron Piledriver","Corrosive Bolt","Spring Hammer","Porcelain Guard","Furnace Impact"],"Elemental":["Spark Lash","Quicksand Grip","Renewing Current","Tempest Break","Cinder Mark","Gale Needle","Stone Mantle","Torrent Crash"],"Fey":["Briar Pin","Silken Tether","Nectar Blessing","Glamour Burst","Pollen Dream","Pixie Feint","Petal Shroud","Moonlit Prank"],"Fiend":["Barbed Hook","Chain Drag","Cinder Feast","Infernal Cleave","Malice Murmur","Ember Talon","Obsidian Hide","Hellfire Rush"],"Giant":["Knuckle Sweep","Ground Quake","Mountain Breath","Colossal Slam","Dazing Roar","Boulder Flick","Granite Guard","Avalanche Step"],"Monstrosity":["Horn Pierce","Coiling Grasp","Mythic Renewal","Chimeric Roar","Basilisk Haze","Wing Shear","Scaled Bastion","Legendary Onrush"],"Ooze":["Gel Whip","Viscous Grasp","Reconstitute","Pressure Flood","Caustic Drip","Droplet Shot","Jelly Barrier","Amorphous Surge"],"Plant":["Thorn Prick","Strangler Vine","Root Renewal","Pitcher Crush","Sundew Toxin","Seed Needle","Bark Mantle","Bramble Rush"],"Undead":["Bone Shard","Grave Bind","Soul Reassembly","Tomb Collapse","Restless Lull","Spectral Scratch","Shroud Guard","Revenant Charge"]};
const SPECS=[[32,16,'physical',null],[25,3,'physical','slow'],[0,-12,'spiritual','heal'],[68,-20,'physical',null],[18,-5,'spiritual','poison'],[40,9,'spiritual',null],[0,13,'spiritual','ward'],[54,18,'physical','recoil']];
export const TYPE_MOVES=Object.fromEntries(Object.entries(NAMES).map(([type,names])=>[type,names.map((name,i)=>{const[power,speed,kind,baseEffect]=SPECS[i],effect=i===4?(['Aberration','Celestial','Fey','Humanoid','Undead'].includes(type)?'sleep':type==='Giant'?'slow':baseEffect):baseEffect;return{id:type.toLowerCase()+'-'+i,name,type,power,speed,kind,effect,visual:type==='Plant'?'leaf':type==='Ooze'?'water':type==='Elemental'?'fire':'spirit',desc:effect==='heal'?'Recover a quarter of maximum health.':effect==='ward'?'Soften the next incoming hit.':effect==='slow'?'Hinder the target’s next action.':effect==='poison'?'May leave lingering poison.':effect==='recoil'?'A swift impact with recoil.':'A '+type.toLowerCase()+' technique.'};})]));
const DOMAIN_VERBS={Life:['Vital Bloom','Renewing Pulse','Verdant Surge','Living Ward'],Death:['Grave Touch','Mortal Chill','Death Knell','Pall Veil'],Spirit:['Soul Whisper','Ghostly Binding','Spectral Burst','Ancestral Ward'],Psionic:['Thought Lance','Mind Snare','Psychic Crush','Mental Barrier'],Nature:['Briar Needle','Wild Entangle','Primal Roar','Forest Shelter'],Void:['Null Thread','Dimensional Snare','Abyssal Rift','Empty Shelter'],Storm:['Squall Dart','Thunder Snare','Tempest Crash','Storm Screen'],Magic:['Arcane Bolt','Spell Snare','Mystic Surge','Arcane Aegis'],Air:['Zephyr Needle','Still Air','Cyclone Crest','Wind Mantle'],Earth:['Stone Splinter','Mire Step','Fault Rupture','Clay Aegis'],Fire:['Ember Jet','Scorch Veil','Pyre Bloom','Cinder Cloak'],Water:['Tidal Dart','Undertow','Riptide Break','Mist Mantle'],Light:['Gleam Pin','Dazzling Haze','Prismatic Ray','Lucent Shell'],Dark:['Shadow Stitch','Deepening Dusk','Abyssal Bloom','Umbral Guard'],Sun:['Dawn Spear','Sun Daze','Solar Crest','Daybreak Veil'],Moon:['Crescent Cut','Lunar Lull','Moonfall','Silver Shroud'],Lightning:['Static Fang','Nerve Jolt','Thunder Crown','Charged Screen'],Ice:['Frost Needle','Numbing Rime','Glacier Crash','Hoarfrost Shell']};
const DOMAIN_STATUS={Fire:'burn',Sun:'burn',Ice:'freeze',Lightning:'paralysis',Storm:'paralysis',Nature:'poison',Death:'curse',Dreams:'sleep',Nightmares:'sleep',Moon:'sleep',Peace:'sleep',Fey:'sleep',Psionic:'confusion',Chaos:'confusion',Dark:'confusion',Love:'infatuation',Fear:'flinch',Law:'disable',Magic:'disable',Void:'taunt',War:'taunt',Destruction:'lowerDefense',Evil:'toxic',Life:'leechSeed',Spirit:'lowerResistance'};
export function domainMoves(domain,type){domain=({Time:'Fate',Space:'Void',Mind:'Psionic'})[domain]||domain;const names=DOMAIN_VERBS[domain]||[domain+' Thread',domain+' Reverie',domain+' Manifest',domain+' Sanctuary'];return names.map((name,i)=>({id:'domain-'+domain.toLowerCase()+'-'+i,name,type,domain,power:[35,20,70,0][i],speed:[12,2,-22,10][i],kind:'spiritual',effect:[null,DOMAIN_STATUS[domain]||'slow',null,'ward'][i],visual:domain.toLowerCase(),desc:'A specific expression of the '+domain.toLowerCase()+' domain.'})).map(withBase);}

const TECHNIQUE_FAMILIES=[
['Ash Brand','Energy',65,'burn'],['Cinder Hex','Status',0,'burn'],['Frost Lock','Status',0,'freeze'],['Glacier Lance','Energy',75,'freeze'],['Thunder Snare','Status',0,'paralysis'],['Static Surge','Energy',70,'paralysis'],['Venom Mark','Status',0,'poison'],['Virulent Curse','Status',0,'toxic'],['Drowse Hymn','Status',0,'sleep'],['Dizzying Echo','Status',0,'confusion'],['Heartbound Trance','Status',0,'infatuation'],['Staggering Blow','Physical',55,'flinch'],['Soul Leech','Energy',65,'drain'],['Vampiric Talon','Physical',60,'drain'],['Life Offering','Status',0,'rest'],['Renewal Bloom','Status',0,'heal'],['Full Restoration','Status',0,'fullheal'],['Cleansing Rain','Status',0,'cleanse'],['Aegis Sphere','Status',0,'protect'],['Mirror Mantle','Status',0,'reflect'],['Spirit Veil','Status',0,'lightscreen'],['Rooted Sanctuary','Status',0,'safeguard'],['Haste Chant','Status',0,'boostSpeed'],['Battle Trance','Status',0,'boostMight'],['Arcane Focus','Status',0,'boostPower'],['Stoneguard','Status',0,'boostDefense'],['Mystic Barrier','Status',0,'boostResistance'],['Shattering Cry','Status',0,'lowerDefense'],['Withering Glare','Status',0,'lowerMight'],['Unraveling Hex','Status',0,'lowerPower'],['Gravity Bind','Status',0,'lowerSpeed'],['Sapping Mist','Status',0,'lowerResistance'],['Echo Step','Status',0,'boostEvasion'],['True Sight','Status',0,'boostAccuracy'],['Veil of Doubt','Status',0,'lowerAccuracy'],['Null Chant','Status',0,'haze'],['Soul Exchange','Status',0,'swapStats'],['Hex Reversal','Status',0,'invertStats'],['Piercing Rush','Physical',75,'recoil'],['Sacrificial Burst','Energy',110,'recoil'],['Sunder Strike','Physical',75,'breakWard'],['Rending Flurry','Physical',25,'multiHit'],['Starfall Volley','Energy',25,'multiHit'],['Binding Roots','Physical',35,'trap'],['Spectral Chains','Energy',35,'trap'],['Seed of Hunger','Status',0,'leechSeed'],['Thornfield','Status',0,'spikes'],['Toxic Miasma','Status',0,'toxicSpikes'],['Jagged Stones','Status',0,'stealthRock'],['Arcane Web','Status',0,'stickyWeb'],['Clearing Gust','Status',0,'clearHazards'],['Doom Omen','Status',0,'perish'],['Echoing Curse','Status',0,'curse'],['Destiny Knot','Status',0,'destinyBond'],['Spirit Lock','Status',0,'disable'],['Silencing Sigil','Status',0,'taunt'],['Counterstroke','Physical',60,'counter'],['Energy Reversal','Energy',60,'mirrorCoat'],['Swift Fang','Physical',40,'priority'],['Quick Spark','Energy',40,'priority'],['Unerring Beam','Energy',55,'sureHit'],['Aether Cannon','Energy',115,'recharge'],['Colossal Impact','Physical',115,'recharge'],['Twinstrike','Physical',40,'doubleHit'],['Moonlight Mend','Status',0,'heal'],['Rage Bloom','Physical',65,'boostMight'],['Spirit Break','Energy',70,'lowerPower'],['Frostbite Fang','Physical',60,'frostbite'],['Nightmare Pulse','Energy',65,'nightmare'],['Curse of Frailty','Status',0,'curse'],['Corrupting Tide','Energy',70,'toxic'],['Ember Cyclone','Energy',65,'burn'],['Storm Jolt','Energy',65,'paralysis'],['Lucid Dream','Status',0,'rest'],['Prismatic Lance','Energy',90,null],['Meteor Hammer','Physical',90,null],['Solar Lance','Energy',100,null],['Abyssal Claw','Physical',100,null],['Judgment Spiral','Energy',85,null],['Wildcat Blitz','Physical',85,null]
];
export const EXTRA_MOVES=TECHNIQUE_FAMILIES.map(([name,category,power,effect],i)=>({id:'tech-'+i,name,category,kind:category==='Energy'?'spiritual':category==='Status'?'status':'physical',power,effect,speed:effect==='priority'?25:0,desc:effect?'Technique: '+effect+'.':'A powerful combat technique.'}));


export const ENVIRONMENT_MOVES=[
['Rain Invocation','weatherRain',0,'Status'],['Sun Invocation','weatherSun',0,'Status'],['Dust Tempest','weatherSand',0,'Status'],['Hailstorm Rite','weatherSnow',0,'Status'],
['Verdant Ground','terrainGrass',0,'Status'],['Charged Ground','terrainElectric',0,'Status'],['Dreaming Ground','terrainPsychic',0,'Status'],['Veiled Ground','terrainMisty',0,'Status'],
['Monsoon Lance','weatherStrike',85,'Energy'],['Solar Torrent','sunStrike',95,'Energy'],['Dustbreaker','sandStrike',85,'Physical'],['Winter Comet','snowStrike',85,'Energy'],
['Rootburst','terrainStrike',75,'Physical'],['Voltage Bloom','electricStrike',75,'Energy'],['Dreamfall','psychicStrike',75,'Energy'],['Mistfire','mistStrike',75,'Energy'],
['Retreating Slash','pivot',65,'Physical'],['Passing Current','pivot',65,'Energy'],['Forceful Gale','forceSwitch',65,'Energy'],['Driving Charge','forceSwitch',65,'Physical'],
['Skybound Dive','twoTurn',110,'Physical'],['Burrowing Assault','twoTurn',100,'Physical'],['Abyssal Submerge','twoTurn',100,'Energy'],['Solar Gathering','chargeSun',120,'Energy'],
['Unbroken Rampage','rampage',100,'Physical'],['Resonant Chorus','rampage',95,'Energy'],['Boundless Focus','focus',0,'Status'],['Stored Thunder','delayedStrike',110,'Energy'],
['Waking Echo','sleepStrike',70,'Energy'],['Venom Feast','venomStrike',75,'Physical'],['Hex Pulse','hexStrike',65,'Energy'],['Countercurrent','counter',75,'Physical']
].map(([name,effect,power,category],i)=>({id:'environment-'+i,name,effect,power,category,kind:category==='Status'?'status':category==='Energy'?'spiritual':'physical',type:'Elemental',speed:0,desc:'A technique shaped by the battlefield.'}));


/* Additional original techniques adapted from individual mechanical move families. */
export const ADVANCED_MOVES=[
['Aether Absorption','Energy',20,'drain','Plant'],['Quickstone','Physical',40,'priority','Earth'],['Corrosive Spray','Energy',40,'lowerResistance','Water'],['Iron Carapace','Status',0,'boostDefense','Metal'],['Weightless Strike','Physical',55,'unburdened','Air'],['Precise Talon','Physical',60,'sureHit','Air'],['Swift Current','Status',0,'boostSpeed','Air'],['Whirling Blade','Energy',60,'critical','Air'],['Air Sunder','Energy',75,'flinch','Air'],['Spirit Anchor','Physical',80,'trap','Metal'],['Elder Radiance','Energy',60,'omniBoost','Light'],['Tidal Blade','Physical',70,'critical','Water'],['Tidal Jet','Physical',40,'priority','Water'],['Healing Current','Status',0,'regenerate','Water'],['Tidal Dance','Physical',80,'boostSpeed','Water'],['Thousand Cuts','Physical',15,'multiHit','War'],['Cannonfire','Energy',120,'selfDebuff','Fire'],['Fragrant Remedy','Status',0,'partyCleanse','Plant'],['Vengeance Mark','Physical',60,'revenge','Dark'],['Ghostly Swarm','Energy',120,null,'Dark'],['Astral Shelter','Status',0,'auroraVeil','Ice'],['Avalanche Rush','Physical',60,'revenge','Ice'],['Blight Barrage','Physical',60,'venomStrike','Water'],['Mystic Chain','Status',0,'batonPass','Fate'],['Skyfire Charge','Physical',100,'twoTurn','Air'],['Chorus of Allies','Physical',20,'partyStrike','War'],['Crimson Offering','Status',0,'bellyDrum','Wrath'],['Stored Retaliation','Physical',60,'counter','War'],['Vine Snare','Physical',15,'trap','Plant'],['Dreadfang','Physical',60,'flinch','Fear'],['Siphoning Fang','Physical',90,'drain','Dark'],['Stonewall Chant','Status',0,'boostDefense','Earth'],['Unyielding Mind','Status',0,'boostResistance','Dreams'],['Skybreaker','Energy',150,'recharge','Air'],['Volcanic Flare','Energy',85,'burn','Fire'],['Frost Tempest','Energy',110,'freeze','Ice'],['Phantom Lock','Status',0,'trap','Dark'],['Sunlit Lance','Energy',120,'chargeSun','Sun'],['Spirit Bastion','Status',0,'protect','Light'],['Soulbound Pact','Status',0,'destinyBond','Fate'],['Moonlit Renewal','Status',0,'heal','Moon'],['Corrosive Grasp','Physical',60,'poison','Water'],['Emberfang','Physical',65,'burn','Fire'],['Echo Chamber','Status',0,'reflect','Dreams'],['Fading Veil','Status',0,'lightscreen','Light'],['Fatebreaker','Physical',75,'breakWard','Fate'],['Feral Fury','Physical',110,'rampage','Wrath'],['Mirage Pulse','Energy',70,'confusion','Dreams'],['Iron Tempest','Physical',25,'multiHit','Metal'],['Starlit Bolt','Energy',80,'sureHit','Light'],['Petrifying Gaze','Status',0,'paralysis','Earth'],['Venom Bloom','Status',0,'toxic','Plant'],['Spirit Silence','Status',0,'taunt','Law'],['Memory Seal','Status',0,'disable','Dreams'],['Final Omen','Status',0,'perish','Fate'],['Dreamfeast','Energy',70,'nightmare','Nightmares'],['Gravity Reversal','Status',0,'invertStats','Chaos'],['Purifying Wind','Status',0,'clearHazards','Air'],['Razorfield','Status',0,'spikes','Earth'],['Dusk Veil','Status',0,'safeguard','Dark'],['Toxic Mire','Status',0,'toxicSpikes','Water'],['Rooted Hunger','Status',0,'leechSeed','Plant'],['Spirit Surge','Energy',65,'pivot','Lightning'],['Displacing Wave','Energy',65,'forceSwitch','Water'],['Sunfall','Energy',95,'sunStrike','Sun'],['Midnight Squall','Energy',85,'weatherStrike','Water'],['Shifting Earth','Physical',85,'sandStrike','Earth'],['Frost Nova','Energy',85,'snowStrike','Ice']
].map(([name,category,power,effect,domain],i)=>({id:'advanced-'+i,name,category,kind:category==='Energy'?'spiritual':category==='Status'?'status':'physical',power,effect,domain,type:domain==='Earth'?'Elemental':domain==='Plant'?'Plant':domain==='Dark'?'Undead':'Celestial',accuracy:.9,speed:effect==='priority'?30:0,desc:effect?'Special technique: '+effect+'.':'An advanced technique.'}));

// Team techniques share the same learned-move and resource rules as single-target moves.
const TEAM_TECHNIQUES=[
 ['Tempest Chorus','Energy',45,'slow','Storm','allOpponents'],
 ['Bramble Sweep','Physical',35,'poison','Nature','allOpponents'],
 ['Shattered Horizon','Energy',60,'lowerResistance','Void','allOpponents'],
 ['Lantern Chorus','Status',0,'teamHeal','Hope','allAllies'],
 ['Sheltering Constellation','Status',0,'teamWard','Light','allAllies'],
 ['Tandem Spark','Energy',40,'paralysis','Lightning','allOpponents'],
 ['Shared Resolve','Status',0,'partyCleanse','Spirit','allAllies'],
 ['Frostbound Field','Energy',45,'frostbite','Ice','allOpponents']
].map(([name,category,power,effect,domain,target],n)=>({id:'team-'+n,name,category,kind:category==='Energy'?'spiritual':category==='Status'?'status':'physical',power,effect,domain,target,type:'Celestial',accuracy:.9,speed:0}));
ADVANCED_MOVES.push(...TEAM_TECHNIQUES);

export const CORE_STATUS_MOVES=[
 ['Scorching Mark','burn',['Fire','Sun'],['Elemental','Fiend'],8],
 ['Numbing Seal','freeze',['Ice'],['Elemental'],16],
 ['Venom Thread','poison',['Nature'],['Beast','Plant','Ooze'],6],
 ['Drowsing Chime','sleep',['Dreams','Moon','Peace'],['Fey','Celestial','Undead'],12],
 ['Disorienting Echo','confusion',['Psionic','Chaos','Nightmares'],['Aberration','Fey'],10],
 ['Nerve Lattice','paralysis',['Lightning','Storm'],['Construct','Elemental'],12],
 ['Lingering Blight','toxic',['Death','Despair'],['Plant','Undead'],24],
 ['Rime Brand','frostbite',['Ice'],['Elemental','Undead'],18]
].map(([name,effect,domains,types,learnLevel],n)=>({id:'status-'+n,name,effect,power:0,speed:0,kind:'status',category:'Status',accuracy:.9,target:'opponent',eligibleDomains:domains,eligibleTypes:types,learnLevel}));
const ANATOMICAL_MOVES=[
 {id:'anatomy-grasp',name:'Binding Grasp',power:30,speed:4,kind:'physical',effect:'slow',requires:['hands','tentacles','vines','grasp']},
 {id:'anatomy-claw',name:'Hooked Rend',power:60,speed:-4,kind:'physical',effect:'critical',requires:['claws','talons','mandibles']},
 {id:'anatomy-wing',name:'Wingbeat Screen',power:0,speed:12,kind:'spiritual',effect:'ward',requires:['wings']},
 {id:'anatomy-shell',name:'Living Bastion',power:0,speed:-8,kind:'spiritual',effect:'boostDefense',requires:['armor','shell','scales']},
 {id:'anatomy-fang',name:'Fanged Lunge',power:55,speed:10,kind:'physical',effect:null,requires:['fangs','tusks','beak']},
 {id:'anatomy-root',name:'Root Snare',power:25,speed:3,kind:'physical',effect:'trap',requires:['roots','vines','traps']},
 {id:'anatomy-pulse',name:'Neural Pulse',power:45,speed:5,kind:'spiritual',effect:'confusion',requires:['psionic','eyes']}
];
export function moveFitsAnatomy(move,anatomy){
 if(!anatomy)return true;const traits=anatomy.traits||[];
 if(move.requires?.length&&!move.requires.some(t=>traits.includes(t)))return false;
 if(move.kind==='physical'&&move.effect!=='struggle'){
  const name=move.name||'';if(/wing|feather/i.test(name)&&!traits.includes('wings')&&!traits.includes('feathers'))return false;
  if(/claw|talon/i.test(name)&&!traits.some(t=>['claws','talons','mandibles'].includes(t)))return false;
  if(/antler|horn/i.test(name)&&!traits.some(t=>['antlers','horns'].includes(t)))return false;
  if(/fang|bite/i.test(name)&&!traits.some(t=>['fangs','mandibles','beak'].includes(t)))return false;
 }return true;
}
export function buildLearnset(base,alter,domains=[],anatomy=null){
 const typeMoves=[...(TYPE_MOVES[base]||[]),...(TYPE_MOVES[alter]||[])].filter(m=>moveFitsAnatomy(m,anatomy));
 const extras=[...ADVANCED_MOVES,...ENVIRONMENT_MOVES,...EXTRA_MOVES].filter((m,i)=>(i%CREATURE_TYPES.length===CREATURE_TYPES.indexOf(base)||i%CREATURE_TYPES.length===CREATURE_TYPES.indexOf(alter)||m.id.startsWith('team-'))&&(!m.domain||domains.includes(m.domain))&&moveFitsAnatomy(m,anatomy)).map(m=>({...m,type:alter}));
 const statusMoves=CORE_STATUS_MOVES.filter(m=>m.eligibleTypes.includes(base)||m.eligibleTypes.includes(alter)||m.eligibleDomains.some(d=>domains.includes(d))).map(m=>({...m,type:base}));
 const natural=anatomy?ANATOMICAL_MOVES.filter(m=>moveFitsAnatomy(m,anatomy)).map(m=>withBase({...m,type:base})):[];
 return [...typeMoves,...domains.flatMap(d=>domainMoves(d,alter)),...statusMoves,...natural,...extras].map(m=>({...m}));
}
export function startingMoves(base,alter,domains=[],seed=0,anatomy=null){
 const a=TYPE_MOVES[base],b=TYPE_MOVES[alter];if(!a||!b)throw Error('Unsupported move type.');
 const d=domains.length?domainMoves(domains[0],alter):null;
 const candidates=[a[seed%2===0?0:5],b[3],a[seed%3===0?2:6],d?d[0]:b[seed%2===0?1:4]];
 const fallback=[...a,...b].filter(m=>moveFitsAnatomy(m,anatomy));const used=new Set();
 return candidates.map(m=>{if(!moveFitsAnatomy(m,anatomy)||used.has(m.id))m=fallback.find(x=>!used.has(x.id));used.add(m.id);return {...m};});
}
const GENERATED_EFFECTS=new Set([null,'slow','poison','burn','freeze','paralysis','sleep','confusion','flinch','frostbite','trap','heal','ward','boostMight','boostPower','boostDefense','boostResistance','boostSpeed','lowerMight','lowerPower','lowerDefense','lowerResistance','lowerSpeed','breakWard','doubleHit','drain','recoil','critical','priority','protect','cleanse']);
export function generatedMoveBudget(move){const support=move.power===0?42:0,effect=move.effect?(['sleep','freeze','protect','doubleHit','drain'].includes(move.effect)?30:18):0;return (move.power||0)*(move.effect==='doubleHit'?2:1)*(move.accuracy??1)+(Math.max(0,move.speed||0)*.7)+effect+support+(move.target==='allOpponents'?25:0);}
export function validateGeneratedMoves(proposals,sp){
 const report=[];const moves=sp.moves.map((original,n)=>{
  if(!Array.isArray(proposals)||!proposals[n])return {...original};
  const p=proposals[n],bad=reason=>{report.push({slot:n,status:'fallback',reason});return {...original};};
  if(!p||typeof p!=='object'||!Number.isFinite(p.power)||p.power<0||p.power>100||!Number.isInteger(p.power)||!Number.isFinite(p.speed)||p.speed< -30||p.speed>25||!Number.isFinite(p.accuracy)||p.accuracy<.65||p.accuracy>1||!['physical','spiritual','status'].includes(p.kind)||!GENERATED_EFFECTS.has(p.effect??null))return bad('Unsupported mechanics or numerical bounds');
  if(!['opponent','self','ally','allOpponents'].includes(p.target||'opponent'))return bad('Unsupported targeting');
  if(p.power===0&&!p.effect||p.kind==='status'&&p.power!==0||p.power>0&&['heal','ward','protect','cleanse'].includes(p.effect))return bad('Incompatible power and effect');
  const m={id:original.id,name:typeof p.name==='string'?p.name.replace(/[<>\x00-\x1f]/g,'').slice(0,40):original.name,type:original.type,domain:original.domain,power:p.power,speed:p.speed,accuracy:p.accuracy,kind:p.kind,category:p.power===0?'Status':p.kind==='physical'?'Physical':'Energy',effect:p.effect??null,target:p.target||'opponent',visual:original.visual};
  if(m.power>0&&['self','ally'].includes(m.target)||m.power===0&&['heal','ward','boostMight','boostPower','boostDefense','boostResistance','boostSpeed','protect','cleanse'].includes(m.effect)&&!['self','ally'].includes(m.target))return bad('Incompatible target and effect');
  if(!moveFitsAnatomy(m,sp.anatomy))return bad('Anatomical requirements not met');
  if(generatedMoveBudget(m)>120)return bad('Move exceeds balance budget');
  m.baseUses=moveBaseValue(m);m.desc=moveLore(m).description;report.push({slot:n,status:'accepted',budget:generatedMoveBudget(m)});return m;
 });return {moves,report};
}



for(const moves of [...Object.values(TYPE_MOVES),EXTRA_MOVES,ENVIRONMENT_MOVES,ADVANCED_MOVES])for(const move of moves)move.baseUses=moveBaseValue(move);

// Narrative copy is kept separate from the combat rules and numerical move data.
const TYPE_NARRATIVES={
 "Aberration": [
  "A narrow aperture opens beside the Spirimon, and a hooked shape flickers through before the seam closes.",
  "A whisper folds over itself until every nearby sound seems to come from somewhere else.",
  "The Spirimon wraps itself in a veil of impossible angles, its outline slipping between unfamiliar shapes.",
  "Space puckers around a dark point, then opens in a sudden, breathless rush.",
  "The Spirimon's eyes hold a question that the surrounding silence refuses to answer.",
  "A pale tendril slips from an unseen fold and snaps back like a thought half remembered.",
  "Overlapping rings drift around the Spirimon, showing glimpses of places that cannot quite be named.",
  "A jagged motion repeats within its own fading shadow, leaving the air strangely out of step."
 ],
 "Beast": [
  "The Spirimon sweeps a crescent of spectral claws through the air, leaving bright scratches that fade like sparks.",
  "A low growl becomes a flashing bite, close and sudden as a predator moving through tall grass.",
  "The Spirimon remembers the warmth of its earliest shelter, and that quiet belonging settles through its body.",
  "A crown of spectral antlers sweeps forward, carrying the restless momentum of a creature in full flight.",
  "A dark bead gathers along a phantom fang, trailing the bitter scent of crushed wild herbs.",
  "A fleeting beast-shaped echo springs from the Spirimon, pouncing through a ripple of golden light.",
  "The Spirimon hunkers beneath an ancient memory of hide and fur, steady as a creature weathering a storm.",
  "The thunder of unseen hooves rises around the Spirimon as it throws itself into a wild, headlong rush."
 ],
 "Celestial": [
  "A feather of pale light narrows into a shining lance and streaks forward through the hush.",
  "A golden halo loosens into luminous ribbons, curving through the air like a promise that refuses to break.",
  "The Spirimon bows beneath an imagined sunrise, bathing its markings in a gentle, returning warmth.",
  "A brilliant seam opens across the gloom, and a solemn ray pours through like light from a high window.",
  "A distant hymn gathers around the Spirimon, soft enough to be mistaken for a half-forgotten dream.",
  "A tiny star kindles above the Spirimon and darts away, drawing a silver thread across the air.",
  "Interlocking feathers of radiance gather around the Spirimon, their edges chiming like delicate glass.",
  "The Spirimon becomes a falling streak of starlight, its bright wake scattering across the ground."
 ],
 "Construct": [
  "A glowing rivet spins from the Spirimon with a crisp metallic note, leaving a trail of scattered filings.",
  "Small spectral gears unfold in the air, their teeth meeting with a patient, unsettling click.",
  "Fine lights travel along the Spirimon's seams, drawing loose pieces back into a familiar whole.",
  "The Spirimon gathers its weight behind a single descending motion, and the air answers with a deep iron clang.",
  "A gleaming bolt tears through the air, leaving an acrid haze and tiny flecks of tarnished light.",
  "A coiled shimmer releases with a sharp ringing snap, like a hidden spring finally set free.",
  "Pale porcelain plates bloom around the Spirimon, each settling into place with the sound of a closing bell.",
  "A furnace glow pours through the Spirimon's markings as it surges forward amid a shower of embers."
 ],
 "Elemental": [
  "A bright lash of sparks uncoils from the Spirimon, crackling like a branch in a sudden summer storm.",
  "The ground takes on the slow, hungry motion of wet sand, curling around every disturbed footprint.",
  "Cool currents circle the Spirimon, washing through its outline with the freshness of rain after drought.",
  "Wind and rain seem to gather inside the Spirimon's cry before bursting outward in a sweeping torrent.",
  "A coal-red sigil hangs in the air, shedding fine ash that glows and darkens as it falls.",
  "A slender needle of wind races ahead of a whisper, stirring everything in its narrow wake.",
  "Grains of stone lift around the Spirimon and knit into a rough mantle, carrying the scent of deep earth.",
  "The Spirimon plunges into a roaring surge, its shape briefly lost beneath a crest of white spray."
 ],
 "Fey": [
  "A thorn wrapped in soft green light slips free of the Spirimon, carrying the scent of rain-soaked briars.",
  "A shining silk thread drifts through the air, winding itself into patterns too intricate to follow.",
  "The Spirimon gathers the sweetness of an imagined blossom, and warm gold glimmers beneath its markings.",
  "A dazzling glamour opens like a flower in moonlight, spilling impossible colors across the air.",
  "A cloud of luminous pollen drifts from the Spirimon, bringing the hush of a woodland just before dawn.",
  "A small, laughing echo slips sideways through the light, leaving the Spirimon's shape momentarily uncertain.",
  "Petals unfold around the Spirimon without any visible stem, their pale surfaces turning toward an unseen moon.",
  "The Spirimon whirls through a flash of silver laughter, scattering the playful shadows of a midnight revel."
 ],
 "Fiend": [
  "A curved barb of dark radiance flashes from the Spirimon, dragging a thin ribbon of ember-red smoke.",
  "Spectral chains scrape across the air, their links glowing with the dull heat of a buried forge.",
  "The Spirimon drinks in a wreath of cinders, and its ember-lit markings glow with a deeper warmth.",
  "A great arc of infernal light sweeps outward, leaving the sharp scent of scorched stone.",
  "A low murmur coils through the air, carrying the troubling intimacy of a voice heard in a dream.",
  "An ember-shaped talon tears across the Spirimon's shadow, scattering bright fragments into the gloom.",
  "Black glass rises around the Spirimon in overlapping scales, each catching a tiny red reflection.",
  "The Spirimon surges through a veil of hellfire, its outline ragged with streaming sparks and smoke."
 ],
 "Giant": [
  "The Spirimon swings with the breadth of a passing hillside, pushing a low rumble through the air.",
  "A heavy tremor ripples across the earth, shaking loose the quiet hidden between roots and stones.",
  "The Spirimon draws a deep, mountain-still breath, and the world seems to settle around it.",
  "The Spirimon's gathered strength descends like a cliff face breaking free, trailing a deep, rolling echo.",
  "A cavernous roar fills the air, lingering long after its last note should have faded.",
  "A rough stone-shaped spark snaps outward, accompanied by the dry crack of a pebble splitting.",
  "Crags of phantom granite gather around the Spirimon, their weathered surfaces bright with lichen-colored light.",
  "The Spirimon sweeps forward beneath a rolling mantle of frost and stone, like a mountainside awakened."
 ],
 "Humanoid": [
  "The Spirimon opens its stance and draws a clean arc through the air, precise as a practiced brushstroke.",
  "A twist of intent tightens into a fleeting lattice of pale lines, close and exact as a familiar knot.",
  "The Spirimon stills its breathing until the noise of the world seems to recede, leaving a quiet warmth within.",
  "Overlapping echoes of an open palm bloom around the Spirimon, meeting in a single flowing gesture.",
  "A luminous mask hovers before the Spirimon, its calm expression shifting whenever the eye looks away.",
  "A ribbon of pale light whips through the air, following the graceful sweep of an unseen dancer.",
  "The Spirimon settles into a balanced pose, its shadow becoming as still and certain as ink on paper.",
  "The Spirimon spins through a broad circle of trailing light, its motion ending with a sharp, clear snap."
 ],
 "Monstrosity": [
  "A spectral horn gleams ahead of the Spirimon, parting the air with the fierce elegance of a hunting beast.",
  "A sinuous shadow curls outward, winding through the air with the patience of something waiting in deep water.",
  "An old, untamed presence stirs beneath the Spirimon's markings, carrying the warmth of a legend remembered.",
  "The Spirimon's cry divides into strange, overlapping voices, swelling into a single untamed chorus.",
  "A low haze gathers beneath the Spirimon's gaze, turning familiar outlines into unsettling silhouettes.",
  "A phantom wing sweeps across the light, leaving a thin, wavering line in its wake.",
  "Overlapping scales of spectral light rise around the Spirimon, curving together into a rugged shelter.",
  "The Spirimon charges beneath the shadow of a much larger creature, its passage ringing with an ancient wildness."
 ],
 "Ooze": [
  "A glistening strand of gel lashes through the air, stretching into a translucent curve before snapping away.",
  "Clear slime spreads in slow, deliberate coils, clinging to every surface it touches.",
  "Scattered droplets draw toward the Spirimon as though remembering where they belong, smoothing its wavering outline.",
  "The Spirimon releases a swelling wall of glossy fluid, its surface trembling with trapped reflections.",
  "A caustic droplet hangs beneath the Spirimon, falling through a thin curl of sharp-smelling vapor.",
  "A bright bead of liquid slips free and shoots through the air, leaving a string of smaller, shining drops.",
  "A rounded curtain of jelly swells around the Spirimon, bending the world into soft, wavering shapes.",
  "The Spirimon flows into a rushing, shapeless swell, leaving the ground slick with fading iridescence."
 ],
 "Plant": [
  "A slender thorn emerges from the Spirimon in a glimmer of green, sharp as a bramble catching moonlight.",
  "A vine-shaped shadow winds through the air, trailing the damp, green scent of a forest floor.",
  "The Spirimon reaches toward an unseen sun as a gentle warmth rises through its roots and markings.",
  "A deep floral shadow opens like a great pitcher, closing amid a rustle of thick, waxy leaves.",
  "Amber droplets tremble along the Spirimon's outline, carrying a sweet scent with a bitter undertone.",
  "A shining seed darts from the Spirimon, wrapped in the green hush of new growth.",
  "Layers of spectral bark curl around the Spirimon, threaded with moss and the quiet strength of old roots.",
  "The Spirimon rushes within a tangle of brambles, scattering petals, thorns, and the scent of disturbed earth."
 ],
 "Undead": [
  "A pale shard turns in the darkness, then flies forward with the dry whisper of old bone.",
  "Grave-cold threads rise from the ground and curl together, carrying a breath of forgotten earth.",
  "Loose wisps gather around the Spirimon, drawing its fading outline back into a familiar shape.",
  "A heavy shadow descends like the closing door of an ancient tomb, stirring dust that has no earthly source.",
  "A distant lullaby drifts from the Spirimon, soft and sorrowful as a voice remembered from long ago.",
  "A silver scratch passes across the air, revealing a brief glimmer of the darkness behind it.",
  "A winding cloth of spectral mist gathers around the Spirimon, its folds moving without a breeze.",
  "The Spirimon surges from a wake of grave mist, its silhouette burning with stubborn, returning purpose."
 ]
};
const EFFECT_NARRATIVES={
 pivot:'The Spirimon sweeps through a bright crossing arc, then slips back into its own fading trail like a dancer leaving the circle.',
 forceSwitch:'A rolling surge fills the space before the Spirimon, carrying dust and wavering silhouettes outward in its restless wake.',
 slow:'Clinging threads unfurl around the Spirimon, tracing a languid pattern through the air like roots feeling for a place to settle.',
 heal:'The Spirimon draws inward, gathering a soft warmth beneath its markings until its whole outline seems touched by a quiet dawn.',
 ward:'A translucent mantle folds around the Spirimon, its luminous edges overlapping like leaves sheltering a woodland hollow.',
 protect:'A bright enclosure blossoms around the Spirimon, its surface rippling with the stillness of a pond beneath falling rain.',
 poison:'A bitter shimmer trails through the air, leaving an acrid sweetness that lingers long after the light has faded.',
 toxic:'A deep violet haze coils outward, carrying the unsettling sweetness of flowers blooming in a place without sunlight.',
 sleep:'The Spirimon releases a low, wandering melody, and the air grows soft with the hush of a half-remembered dream.',
 freeze:'Pale frost spreads through the Spirimon\'s breath, catching the light in delicate branches of silver and blue.',
 burn:'A coal-red glow swells beneath the Spirimon\'s markings, shedding drifting sparks and the scent of summer leaves in a fire.',
 paralysis:'Fine lightning stitches an intricate pattern across the air, each bright thread holding for a breath before it vanishes.',
 confusion:'Reflections gather where no mirrors stand, overlapping until familiar shapes seem to wander outside their own shadows.',
 infatuation:'A warm, rose-colored shimmer surrounds the Spirimon, carrying the strange familiarity of a face glimpsed in a cherished dream.',
 flinch:'A sudden, fierce motion splits the surrounding stillness, followed by a sharp echo that seems too close to place.',
 frostbite:'A breath of deep winter pours from the Spirimon, leaving tiny crystals suspended in a pale and glittering mist.',
 nightmare:'Dark shapes stir beneath a veil of dreamlike mist, drifting near enough to suggest a story best left unfinished.',
 drain:'Silver filaments stretch through the air and curl back toward the Spirimon, glowing like moonlit water returning to a hidden spring.',
 recoil:'The Spirimon throws itself into a fierce, unrestrained motion, its trailing light scattering like sparks from a struck stone.',
 struggle:'With its markings dim and its breath ragged, the Spirimon gathers what remains of its resolve and surges forward in a desperate rush.',
 rest:'The Spirimon settles into a deep and trusting stillness, wrapped in the quiet warmth of a dream without shadows.',
 fullheal:'A clear radiance opens beneath the Spirimon\'s markings, washing across its outline like morning light through a long-shuttered room.',
 cleanse:'A clear breeze circles the Spirimon, lifting away dark wisps until only the clean scent of rain remains.',
 partyCleanse:'The Spirimon releases a fragrant breeze, drawing the air into a gentle procession of petals and clear, bright droplets.',
 regenerate:'Soft green lights kindle beneath the Spirimon\'s outline, opening and closing with the patient rhythm of new leaves.',
 reflect:'A silver sheen spreads around the Spirimon, catching the world in curved reflections that drift like polished leaves.',
 lightscreen:'The Spirimon draws a pale curtain through the air, filling its folds with the warm glow of a distant lantern.',
 safeguard:'A ring of quiet light settles around the Spirimon, carrying the familiar comfort of a threshold watched by someone trusted.',
 auroraVeil:'Ribbons of color open through the frost, draping the Spirimon in the silent wonder of a winter sky.',
 bellyDrum:'A deep rhythm rises from the Spirimon, fierce and intimate as a heartbeat heard through the walls of a cavern.',
 batonPass:'The Spirimon draws a shining thread from its markings and casts it outward, leaving a warm ribbon suspended between kindred presences.',
 haze:'A colorless mist rolls through the air, softening every sharp impression until the world seems briefly unmarked and new.',
 swapStats:'Overlapping reflections turn toward one another, their mirrored shapes exchanging places in a slow and uncanny dance.',
 invertStats:'A delicate pattern twists inside out around the Spirimon, making familiar shadows fall in unfamiliar directions.',
 clearHazards:'A broad, cleansing gust sweeps outward, lifting loose dust, tangled wisps, and scattered fragments into the open air.',
 spikes:'Jagged glimmers rise from the earth, catching the light like a field of thorns newly uncovered by the wind.',
 toxicSpikes:'Dark, shining points emerge beneath a curl of violet mist, carrying the bitter scent of a rain-soaked mire.',
 stealthRock:'Rough fragments of spectral stone hang in the air, turning slowly as though listening for a distant footstep.',
 stickyWeb:'Fine strands stretch across the light, weaving themselves into a glistening pattern of patient, trembling silk.',
 leechSeed:'A tiny, luminous seed drifts outward, trailing delicate roots that search the air with a quiet, hungry persistence.',
 trap:'Coiling shapes gather close, closing like the roots of a forest around something it has chosen to remember.',
 curse:'A dim sigil settles into the surrounding shadow, its edges smoldering with the weight of an unspoken grievance.',
 perish:'A distant bell sounds through the hush, each fading note carrying the solemn feeling of a story nearing its final page.',
 destinyBond:'A dark ribbon of light stretches between the Spirimon and another presence, trembling like a promise spoken too softly to recall.',
 disable:'A pale seal closes over a fading echo, leaving behind the curious silence of a word suddenly forgotten.',
 taunt:'The Spirimon\'s voice rings with sharp, unsettling confidence, its challenge lingering like a spark that refuses to die.',
 counter:'The Spirimon becomes very still, gathering the surrounding echoes into a single, tightly held breath.',
 mirrorCoat:'An opalescent sheen travels over the Spirimon, holding borrowed reflections beneath its smooth, luminous surface.',
 priority:'The Spirimon slips into motion before the surrounding dust has settled, leaving its old silhouette behind like a fading thought.',
 sureHit:'A narrow line of light draws itself through the air, unwavering as a star glimpsed between moving clouds.',
 recharge:'A great radiance pours from the Spirimon in a roaring release, leaving its markings glowing like the embers of a spent forge.',
 multiHit:'A flurry of shining traces blossoms around the Spirimon, crossing and recrossing like swift wings in a storm.',
 doubleHit:'Intertwined trails sweep through the air, their bright echoes following each other like the answering notes of a song.',
 breakWard:'A keen, ringing arc cuts through the light, scattering translucent fragments like glass petals on the wind.',
 critical:'A slender glimmer settles along the Spirimon\'s motion, bright and precise as sunlight along the edge of a blade.',
 unburdened:'The Spirimon moves with a sudden, airy freedom, its outline barely stirring the dust beneath it.',
 revenge:'An old echo rises beneath the Spirimon\'s cry, hardening its resolve into a fierce and unwavering presence.',
 partyStrike:'Familiar silhouettes gather around the Spirimon like companions remembered in a dream, their paths joining in a single sweeping motion.',
 omniBoost:'A small constellation blooms beneath the Spirimon\'s markings, each point answering the others in a quiet, radiant chorus.',
 selfDebuff:'The Spirimon pours itself into a blazing release, leaving its outline flickering in the silence that follows.',
 twoTurn:'The Spirimon vanishes into a gathering veil, its presence lingering at the edge of sight like a storm beyond the horizon.',
 chargeSun:'The Spirimon turns toward the sun, gathering its warm radiance until the air around it trembles with golden light.',
 rampage:'The Spirimon gives itself to a wild, rolling momentum, its cry swallowed by the thunder of its own passage.',
 focus:'The Spirimon grows quiet, drawing every wandering glimmer into the steady light at the center of its markings.',
 delayedStrike:'A bright mote is left hanging in the air, patient and almost forgotten until its hidden radiance begins to unfold.',
 sleepStrike:'The Spirimon drifts through a gauze of dreamlight, its motion as soft and strange as footsteps heard within a dream.',
 venomStrike:'A dark, glossy current gathers along the Spirimon\'s path, carrying a sweetness that seems to turn bitter on the breath.',
 hexStrike:'A crooked sigil flickers within the Spirimon\'s shadow, unfolding into a wavering trail of indigo light.',
 weatherStrike:'The Spirimon raises its voice to the clouds, drawing a rain-bright current from the darkening sky.',
 sunStrike:'Warm sunlight gathers in the Spirimon\'s wake, spilling outward like a dawn that has arrived all at once.',
 sandStrike:'Dust and amber light whirl around the Spirimon, rising with the dry whisper of a distant desert.',
 snowStrike:'A glittering spiral of snow opens around the Spirimon, filling the air with the fragile hush of deep winter.',
 terrainStrike:'The earth answers the Spirimon in a rustle of roots and green light, as though a hidden woodland were waking beneath the ground.',
 electricStrike:'A bright current runs along the earth, joining the Spirimon\'s markings in a restless web of blue-white sparks.',
 psychicStrike:'A quiet pulse passes through the air, turning the surrounding light into wavering rings of violet and rose.',
 mistStrike:'The Spirimon moves within a bank of luminous mist, its outline appearing and disappearing like a lantern beyond still water.',
 weatherRain:'The Spirimon lifts its voice beneath gathering clouds, and cool drops begin to pearl along its glowing markings.',
 weatherSun:'A warm glow opens through the clouds above the Spirimon, spilling gold across the waiting earth.',
 weatherSand:'A dry whisper rises around the Spirimon, drawing dust into a broad, amber-colored spiral.',
 weatherSnow:'The air grows bright with drifting flakes, each catching the Spirimon\'s glow before settling into the hush.',
 terrainGrass:'Green light threads through the ground, carrying the scent of rain, living roots, and leaves newly opened.',
 terrainElectric:'Luminous veins run beneath the Spirimon\'s feet, branching across the earth with a restless, crackling glow.',
 terrainPsychic:'A dreamlike radiance spreads beneath the Spirimon, turning nearby shadows soft and strangely distant.',
 terrainMisty:'Pale mist spills across the ground, carrying little glimmers that drift like lanterns reflected in deep water.'
};
const STAGE_NARRATIVES={
 boostMight:'The Spirimon draws itself upright, and a fierce, grounded warmth gathers beneath its markings.',
 boostPower:'An inner radiance deepens around the Spirimon, spilling from its markings in slow, luminous waves.',
 boostDefense:'A rough mantle of light settles over the Spirimon, steady and close as the walls of a familiar shelter.',
 boostResistance:'The Spirimon becomes quiet within a deepening glow, like a lantern sheltered from a restless wind.',
 boostSpeed:'A fresh current stirs beneath the Spirimon\'s feet, loosening its silhouette into a bright and flowing motion.',
 boostAccuracy:'The Spirimon\'s gaze grows still, following a narrow glimmer through the shifting shapes of the world.',
 boostEvasion:'The Spirimon\'s outline scatters into delicate afterimages, each drifting away like a reflection on disturbed water.',
 lowerMight:'A heavy shadow passes through the air, carrying the weary hush of a fire sinking beneath its ashes.',
 lowerPower:'Fine, dim threads curl through the light, drawing its bright edges into a softer, uncertain glow.',
 lowerDefense:'A sharp note rings through the air, leaving small fractures in the reflections that linger around it.',
 lowerResistance:'A pale mist gathers in the folds of nearby shadows, whispering like rain through an open doorway.',
 lowerSpeed:'The ground seems to breathe a slow and patient rhythm, its shadows stretching like roots beneath deep water.',
 lowerAccuracy:'A wavering veil crosses the light, turning familiar outlines into the uncertain shapes of a distant mirage.'
};
const TYPE_CONTEXT={
 Aberration:'Its lingering patterns feel less like an image seen than a dream remembered from somewhere unfamiliar.',
 Beast:'Even after the light fades, the gesture carries the keen, instinctive presence of the wild.',
 Celestial:'The radiance lingers with the stillness of a clear sky just before the morning birds begin to sing.',
 Construct:'A delicate metallic resonance hangs in the air, like the last vibration of a carefully tended bell.',
 Elemental:'For a moment, the surrounding earth and air seem to share the same restless breath.',
 Fey:'A trace of wildflower sweetness remains, touched by the gentle strangeness of a moonlit woodland.',
 Fiend:'The fading glow leaves a thread of smoke and the memory of heat hidden beneath dark stone.',
 Giant:'Its echo travels low through the earth, slow and deep as a sound remembered by a mountain.',
 Humanoid:'There is a practiced grace in the gesture, as though it belongs to a story passed from teacher to pupil.',
 Monstrosity:'The fading silhouette recalls a beast from an old fireside tale, magnificent and difficult to forget.',
 Ooze:'Tiny reflections drift across the Spirimon\'s outline, never quite settling into the same shape.',
 Plant:'The air retains the green scent of roots, rain, and sunlight resting on new leaves.',
 Undead:'A faint chill remains, carrying the tender, unsettling weight of something that refuses to be forgotten.'
};
const DOMAIN_CONTEXT={
 Air:'A whisper of wind remains, carrying the impression of wide skies and distant, open places.',
 Earth:'The surrounding hush feels deep and old, like the stillness beneath the roots of a great tree.',
 Fire:'The fading light carries the smell of embers and the familiar warmth of a hearth at dusk.',
 Water:'A cool freshness lingers, like spray from a hidden stream heard somewhere beyond the trees.',
 Light:'The last glimmers seem to hang in the air, warm and clear as sunlight through a high window.',
 Dark:'The nearby shadows linger a little longer, holding shapes the eye cannot quite follow.',
 Sun:'The warmth remains like a small memory of summer carried into the evening shade.',
 Moon:'A silver hush lingers around the Spirimon, soft as a reflection on water beneath the night sky.',
 Lightning:'The air keeps a faint, restless shimmer, like the expectant quiet before a summer storm.',
 Ice:'Delicate glimmers drift away with the stillness of snow settling over an untraveled path.',
 Metal:'A clear, delicate resonance remains, bright as a polished bell ringing through a quiet hall.',
 Chaos:'The fading traces refuse to follow a familiar pattern, yet briefly seem to belong together.',
 Law:'The lingering lines settle into a poised, intricate pattern, as orderly as frost along a window.',
 Good:'The glow leaves the warmth of an open doorway glimpsed at the end of a long and lonely road.',
 Evil:'A dark intimacy clings to the silence, like a secret spoken too near the ear.',
 Creation:'Tiny glimmers open and fade like the first signs of something new taking shape.',
 Destruction:'The last fragments scatter into silence, leaving the air strangely clear and empty.',
 War:'The fading echo carries the solemn weight of banners stirring above an abandoned field.',
 Peace:'The hush that follows feels sheltered and complete, like a garden after the wind has fallen still.',
 Fear:'The shadows seem to listen, carrying the familiar unease of a sound heard just beyond the light.',
 Wrath:'A fierce warmth remains beneath the Spirimon\'s outline, slow to settle back into silence.',
 Love:'A gentle warmth lingers like the comfort of a familiar presence returning after a long absence.',
 Hope:'The last glimmer holds like a distant light on a dark road, small but difficult to overlook.',
 Despair:'The fading light carries the heavy stillness of a place waiting for a voice that never comes.',
 Sorrow:'A soft, distant echo remains, gentle as a song remembered for someone no longer near.',
 Fate:'The lingering traces cross like threads in an unfinished tapestry, suggesting a pattern just beyond sight.',
 Dreams:'The glow fades slowly, leaving the pleasant uncertainty of a dream remembered upon waking.',
 Nightmares:'A dark shape seems to remain at the edge of sight, vanishing whenever the gaze turns toward it.'
};
const DOMAIN_ESSENCE={Air:'wind',Earth:'earthlight',Fire:'flame',Water:'waterlight',Light:'radiance',Dark:'shadow',Sun:'sunlight',Moon:'moonlight',Lightning:'lightning',Ice:'frost',Metal:'silver light',Chaos:'shifting color',Law:'ordered light',Good:'warm radiance',Evil:'dark fire',Creation:'newborn light',Destruction:'ashen light',War:'crimson radiance',Peace:'gentle light',Fear:'deep shadow',Wrath:'fierce flame',Love:'rose-colored light',Hope:'dawnlight',Despair:'fading light',Sorrow:'pale mist',Fate:'woven light',Dreams:'dreamlight',Nightmares:'night mist'};
const DOMAIN_STORIES=[
 essence=>'A narrow thread of '+essence+' gathers beneath the Spirimon\'s markings and flies outward, leaving a delicate trail in the air.',
 essence=>'The Spirimon draws '+essence+' into a winding pattern, its luminous strands drifting close like the folds of a half-remembered dream.',
 essence=>'A deep shimmer of '+essence+' opens around the Spirimon and pours outward in a broad, sweeping tide.',
 essence=>'The Spirimon folds '+essence+' around its outline, weaving a quiet mantle whose edges move as though stirred by an unseen breeze.'
];
const SPECIAL_NARRATIVES={
 'Tempest Chorus':'The Spirimon raises its voice into a rolling choir of wind, and every distant echo answers beneath a darkening sky.',
 'Bramble Sweep':'A crescent of living briars sweeps across the clearing, scattering silver leaves and the scent of crushed stems.',
 'Shattered Horizon':'The far horizon fractures into violet panes, each reflecting a different sliver of an impossible night.',
 'Lantern Chorus':'Small lanterns kindle around the gathered Spirimon, their warm light pulsing with the rhythm of a familiar song.',
 'Sheltering Constellation':'A quiet constellation unfolds above the gathering, drawing luminous threads between every waiting silhouette.',
 'Tandem Spark':'Bright sparks leap between the Spirimon’s markings, then race outward like restless fireflies in a summer storm.',
 'Shared Resolve':'The Spirimon’s companions answer its call, their mingled voices carrying the darkness away on a clear, steady note.',
 'Frostbound Field':'A pale breath settles over the clearing, and intricate frost flowers bloom wherever the moonlight touches.',

 'Prismatic Lance':'Colors gather beneath the Spirimon’s markings and draw into a gleaming lance, its edge splitting the light into delicate rainbows.',
 'Meteor Hammer':'A dark, star-shaped weight forms above the Spirimon and swings through a trail of molten light, echoing like thunder beyond the hills.',
 'Solar Lance':'A narrow spear of sunlight gathers over the Spirimon, blazing with the clear, golden brilliance of a summer noon.',
 'Abyssal Claw':'A great claw-shaped shadow reaches from the Spirimon’s outline, its edges flickering with the cold light of unfamiliar depths.',
 'Judgment Spiral':'A solemn spiral of radiance opens above the Spirimon, its interwoven rings descending like light through the dome of an ancient hall.',
 'Wildcat Blitz':'The Spirimon becomes a streak of tawny light, its movement carrying the sudden, fierce grace of a wildcat springing from cover.',
 'Ghostly Swarm':'A pale host rises from the Spirimon’s shadow, drifting together in a murmuring tide of half-remembered faces and silver mist.',
 'Spirimon Strike':'The Spirimon steps into a clean, instinctive motion, leaving the bright echo of its own silhouette across the air.',
 'Binding Lash':'A shining lash uncoils from the Spirimon, its fine threads clinging to the surrounding light like silk caught in the branches of a tree.',
 'Soul Surge':'A deep radiance gathers beneath the Spirimon’s markings and pours outward, carrying the resonant echo of a voice heard from far away.',
 'Quiet Renewal':'The Spirimon turns inward as a soft glow rises beneath its markings, warm and familiar as the first light reaching a sheltered hollow.',
 'Bitter Thorn':'A dark thorn glimmers beside the Spirimon, carrying the green scent of crushed leaves and the bitter sweetness of an unfamiliar blossom.',
 'Spirimon Ward':'A luminous veil settles around the Spirimon, its overlapping folds carrying the quiet comfort of a lantern-lit doorway.',
 'Drowsing Whisper':'The Spirimon releases a wandering whisper that curls through the air, soft as a lullaby heard from the far side of a dream.',
 'Wild Rush':'The Spirimon flings itself into a wild, sweeping motion, trailing scattered sparks and the untamed echo of its own cry.'
};
const NAMED_NARRATIVES=new Map();
for(const [type,names]of Object.entries(NAMES))names.forEach((name,index)=>NAMED_NARRATIVES.set(name,TYPE_NARRATIVES[type][index]));
const MECHANICAL_FLAVOR=/\b(?:HP|DMG|Stanima|stamina|Willpower|accuracy|damage|recoil|cooldown|stat|buff|debuff|physical|energy|status|cost|chance|percent|boost|heal|heals|healing|recover|restore|restores|reduce|increase|turns?|rounds?|maximum|quarter)\b|\d|%/i;
function customMoveNarrative(move){const text=String(move.desc||'').trim();return text.length>=80&&!MECHANICAL_FLAVOR.test(text)&&!/^A (?:powerful combat|specific expression|technique shaped|[a-z]+) technique\.|^(?:Special )?Technique:|^An advanced technique\.|^This lineage/i.test(text)?text:null;}
export function moveLore(move={}){
 const name=String(move.name||'').replace(/\bspirits?\b/gi,'Spirimon'),kind=String(move.kind||move.category||'').toLowerCase();
 const theme=move.domain||(move.visual==='leaf'?'Plant':move.visual==='fire'?'Fire':move.visual==='water'?'Water':move.type),effect=Array.isArray(move.effect)?move.effect[0]:move.effect;
 let description=NAMED_NARRATIVES.get(name)||SPECIAL_NARRATIVES[name];
 if(!description&&String(move.id||'').startsWith('domain-')){const index=Number(String(move.id).match(/-(\d+)$/)?.[1]||0)%4;description=DOMAIN_STORIES[index](DOMAIN_ESSENCE[move.domain]||'shimmering light');}
 description??=customMoveNarrative(move)||EFFECT_NARRATIVES[effect]||STAGE_NARRATIVES[effect];
 description??=move.id==='signature'?'An unmistakable pattern glows beneath the Spirimon\'s markings, unfolding into a fleeting shape that belongs to its lineage alone.':kind==='physical'?'The Spirimon gathers itself into a flowing, instinctive motion, leaving a bright trace across the air as its silhouette surges forward.':'A luminous current gathers beneath the Spirimon\'s markings and spills into the air, unfolding in a pattern as individual as its own voice.';
 const context=DOMAIN_CONTEXT[theme]||TYPE_CONTEXT[theme]||'The glow fades slowly, leaving the quiet impression of a presence that is difficult to mistake for any other.';
 return {description,context};
}
for(const move of [...Object.values(TYPE_MOVES).flat(),...EXTRA_MOVES,...ENVIRONMENT_MOVES,...ADVANCED_MOVES,...CORE_STATUS_MOVES]){if(move.domain==='Plant')move.domain='Nature';move.desc=moveLore(move).description;}

// Includes original, Domain, anatomy, environmental, team and legacy template Moves.
export function allMoveTemplates(){const byId=new Map();for(const m of [...Object.values(TYPE_MOVES).flat(),...['Air','Earth','Fire','Water','Light','Dark','Sun','Moon','Lightning','Ice','Metal','Chaos','Law','Good','Evil','Creation','Destruction','War','Peace','Fear','Wrath','Love','Hope','Despair','Sorrow','Fate','Dreams','Nightmares','Life','Death','Spirit','Psionic','Nature','Void','Storm','Magic'].flatMap(d=>domainMoves(d,'Elemental')),...ANATOMICAL_MOVES,...CORE_STATUS_MOVES,...ADVANCED_MOVES,...ENVIRONMENT_MOVES,...EXTRA_MOVES])byId.set(m.id,{...m,domain:m.domain==='Plant'?'Nature':m.domain});return [...byId.values()];}
