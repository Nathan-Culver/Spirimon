import {ROSTER} from './roster.mjs';
import {LINEAGE_TECHNIQUE_DATA} from './lineage-techniques.mjs';
import {canonicalDomain,DOMAIN_DEFINITIONS} from './domains.mjs';
export {LINEAGE_TECHNIQUE_DATA};
// Opening, utility, culmination, utility effect, culmination effect, opening category, thematic material.
export const TYPE_TECHNIQUE_DATA={
 Aberration:['Impossible Angle','Unblinking Witness','Non-Euclidean Fold','focus','confusion','spiritual','asymmetric eyes and folded space'],
 Beast:['Trailbreaker','Territorial Resolve','Apex Pursuit','boostMight','critical','physical','feral motion and territorial instinct'],
 Celestial:['Guiding Starshot','Merciful Constellation','Firmament Verdict','heal','breakWard','spiritual','star trails and concentric halos'],
 Construct:['Calibrated Impact','Emergency Refit','Overclock Piledrive','heal','recoil','physical','articulated plates and precision gears'],
 Elemental:['Primal Spark','Elemental Recoil Shell','Confluence Break','ward','lowerResistance','spiritual','interweaving raw elemental currents'],
 Fey:['Glamour Needle','Borrowed Footstep','Fairy-Ring Misdirection','boostSpeed','confusion','spiritual','mischievous ribbons and faerie rings'],
 Fiend:['Malice Brand','Infernal Temper','Covenant Siphon','boostPower','drain','spiritual','ember seals and hooked shadow'],
 Giant:['Heavy Palmfall','Unmoving Mountain','Horizon Topple','boostDefense','lowerDefense','physical','broad descending force and rippling earth'],
 Monstrosity:['Predator Lunge','Hunting Trance','Ravenous Breakthrough','focus','breakWard','physical','exaggerated predatory motion and jagged silhouettes'],
 Ooze:['Viscous Glob','Fluid Reconstitution','Engulfing Flood','heal','trap','spiritual','flowing gel and enclosing liquid arcs'],
 Plant:['Seed Husk Shot','Rootwater Renewal','Strangler Canopy','regenerate','leechSeed','spiritual','sprouting roots and curling botanical fronds'],
 Undead:['Graveglow Touch','Ossuary Vigil','Unfinished Requiem','ward','curse','spiritual','ancestral lights and pale burial mist']
};
export const DOMAIN_TECHNIQUE_DATA={
 Air:['Pressure Needle','Slipstream Poise','Vacuum Shear','boostSpeed','lowerResistance','spiritual','spiraling air and compressed wind'],
 Earth:['Shale Skipper','Bedrock Stance','Tectonic Heave','boostDefense','lowerDefense','physical','shale fragments and rising stone'],
 Fire:['Cinder Spiral','Banked Furnace','Wildfire Exhalation','boostPower','burn','spiritual','curling cinders and spreading flame'],
 Water:['Current Needle','Stillpool Renewal','Undertow Vortex','heal','trap','spiritual','clear ripples and coiling undertow'],
 Light:['Prism Needle','Lucent Refraction','Spectrum Severance','boostResistance','lowerPower','spiritual','refracted prisms and divided radiance'],
 Dark:['Umbral Dart','Shadow Gathering','Lightless Reaving','boostPower','drain','spiritual','gathering shadows and fading silhouettes'],
 Sun:['Dawn Ember','Noon Benediction','Zenith Flare','heal','burn','spiritual','golden dawn rays and solar rings'],
 Moon:['Crescent Shard','Waxing Focus','Moonfall Reverie','focus','sleep','spiritual','silver crescents and drifting lunar dust'],
 Lightning:['Forked Spark','Grounding Circuit','Nerveflash Cascade','boostResistance','paralysis','spiritual','branching sparks and charged filaments'],
 Ice:['Rime Splinter','Glacial Casing','Whiteout Fracture','boostDefense','frostbite','spiritual','crystalline rime and splintered frost'],
 Metal:['Tempered Sliver','Annealed Shell','Alloy Guillotine','boostDefense','breakWard','physical','polished metal arcs and tempered filings'],
 Chaos:['Discord Spark','Unwritten Pattern','Probability Riot','boostSpeed','confusion','spiritual','shifting colors and unruly spirals'],
 Law:['Edict Seal','Ordered Bastion','Binding Verdict','ward','trap','spiritual','interlocking seals and orderly geometric rings'],
 Good:['Kindled Grace','Sheltering Mercy','Compassionate Rebuke','heal','lowerMight','spiritual','warm guiding lights and sheltering arcs'],
 Evil:['Spite Thorn','Covetous Resolve','Corrupting Covenant','boostPower','toxic','spiritual','dark thorn patterns and smoldering seals'],
 Creation:['First-Matter Seed','Genesis Renewal','Worldweaver Bloom','regenerate','lowerPower','spiritual','newly forming seeds and unfolding light'],
 Destruction:['Ruin Fragment','Unmaking Focus','Annihilation Fault','focus','breakWard','spiritual','crumbling fragments and ashen seams'],
 War:['Warcry Impact','Battle Standard','Siegebreaker','boostMight','breakWard','physical','crimson standards and surging fronts'],
 Peace:['Stillwater Ripple','Truce Sanctuary','Quieting Wave','ward','lowerMight','spiritual','settling ripples and gentle suspended light'],
 Fear:['Dread Glimmer','Panic Spiral','Terror Manifest','lowerMight','flinch','spiritual','looming silhouettes and narrowing shadow'],
 Wrath:['Fury Spark','Rising Temper','Grudge Detonation','boostMight','revenge','spiritual','fierce embers and tightly coiled crimson light'],
 Love:['Heartstring Glimmer','Tender Reassurance','Devoted Embrace','heal','lowerPower','spiritual','rose-colored threads and encircling ribbons'],
 Hope:['Beacon Dart','Second-Dawn Resolve','Horizon Promise','boostPower','lowerResistance','spiritual','dawnlit paths and steadfast beacon rings'],
 Despair:['Fading Glint','Withering Prospect','Last-Light Eclipse','lowerPower','hexStrike','spiritual','fading lanterns and descending gray light'],
 Sorrow:['Mourning Droplet','Shared Consolation','Elegy Rain','heal','lowerSpeed','spiritual','pale teardrops and drifting remembrance mist'],
 Fate:['Thread Prick','Foreseen Opening','Severed Destiny','focus','critical','spiritual','interwoven threads and converging paths'],
 Dreams:['Reverie Mote','Lucid Repose','Sleeper Tide','regenerate','sleep','spiritual','soft dream motes and slow floating images'],
 Nightmares:['Bad-Dream Shard','Waking Dread','Night-Terror Descent','lowerMight','hexStrike','spiritual','distorted dream shapes and dark falling veils'],
 Life:['Heartbeat Seed','Vital Reweaving','Blooming Lifedraw','heal','drain','spiritual','pulsing living threads and fresh blossoms'],
 Death:['Passing Whisper','Grave Silence','Final Toll','lowerResistance','curse','spiritual','pale extinguishing flames and funeral bells'],
 Spirit:['Soul-Lantern Dart','Ancestral Shelter','Procession of Echoes','ward','lowerResistance','spiritual','ancestral lanterns and translucent soul ribbons'],
 Psionic:['Cognition Needle','Thought Lattice','Synaptic Overload','boostResistance','confusion','spiritual','nested thought lattices and violet ripples'],
 Nature:['Burr Scatter','Wildroot Renewal','Briar Succession','regenerate','leechSeed','spiritual','wild roots and interwoven living branches'],
 Void:['Absence Pin','Hollow Interval','Event-Horizon Fold','ward','trap','spiritual','empty rings and inward-folding starlight'],
 Storm:['Squall Spark','Tempest Gathering','Thunderhead Break','boostPower','paralysis','spiritual','dark cloud curls and branching stormlight'],
 Magic:['Spellglass Dart','Counterspell Screen','Arcane Unraveling','lightscreen','breakWard','spiritual','interlaced sigils and shining spellglass']
};
const slug=value=>String(value).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const FRIENDLY=new Set(['heal','ward','regenerate','boostDefense','boostResistance','boostMight','boostPower','boostSpeed','focus','reflect','lightscreen']);
const MOTIONS={
 heal:'The image folds inward, stitching a gentle glow across the Spirimon before fading into renewed color.',
 regenerate:'A slow procession circles the Spirimon, shedding small renewing glimmers long after the first motion ends.',
 ward:'The image closes into a sheltering shell, its overlapping edges turning outward to meet an approaching blow.',
 reflect:'The image spreads into a rigid, angled screen that turns solid impacts along its shining surface.',
 lightscreen:'The image becomes a translucent lattice, scattering hostile radiance into thin harmless ribbons.',
 boostDefense:'The Spirimon settles into the image, locking its outline into a low, braced silhouette.',
 boostResistance:'The image circles in measured layers, quieting the turbulent light around the Spirimon.',
 boostMight:'The Spirimon draws the image close, then tightens its stance with a deep, forceful shudder.',
 boostPower:'The image contracts toward a bright center, gathering a concentrated glow beneath the Spirimon’s markings.',
 boostSpeed:'The image trails behind a sequence of light steps, leaving fleeting afterimages along the Spirimon’s path.',
 focus:'The image narrows to a still point as the Spirimon fixes its attention on an opening ahead.',
 trap:'Long arcs close around the opponent, crossing and tightening until their ends meet in a restraining knot.',
 drain:'A curling stream reaches the opponent, then returns along its own path as a warm glow around the Spirimon.',
 burn:'A hot trail bursts against the opponent and leaves small stubborn embers clinging to its outline.',
 poison:'Fine, unsettling motes settle across the opponent, their dim color lingering after the main trail disperses.',
 toxic:'Dense, dark motes sink into the opponent’s outline, gathering in an increasingly ominous haze.',
 frostbite:'A pale surge breaks over the opponent, leaving delicate crystals along its fading wake.',
 paralysis:'A branching pulse leaps across the opponent and flickers through its outline in short, arresting flashes.',
 sleep:'Slow, soft rings settle around the opponent as the surrounding scene dims into a drifting reverie.',
 confusion:'The image splits into contradictory paths around the opponent, each seeming to lead somewhere different.',
 curse:'A pale emblem settles over the opponent like an unfinished farewell, its edges refusing to fade.',
 leechSeed:'A living thread catches the opponent, sprouts branching filaments, and draws a returning current toward the Spirimon.',
 lowerMight:'The image presses across the opponent’s stance, leaving its next motion visibly hesitant.',
 lowerPower:'The image washes across the opponent, thinning the glow gathering beneath its markings.',
 lowerDefense:'A forceful seam cuts across the opponent’s outline, making its guarded stance buckle and open.',
 lowerResistance:'The image breaks into fine crossing rays that disturb the opponent’s surrounding aura.',
 lowerSpeed:'A dragging wake catches the opponent’s outline and pulls against each attempt to move.',
 breakWard:'A concentrated edge parts the opposing shelter before bursting through its separated fragments.',
 doubleHit:'Two clearly separated sweeps cross the opponent in a rapid, deliberate succession.',
 multiHit:'A quick volley arrives from staggered angles, each trace striking before the previous one has faded.',
 critical:'The Spirimon follows a narrow opening with a concentrated, unhesitating final stroke.',
 recoil:'The Spirimon surges through the opponent’s outline, then shudders as the force travels back through its own body.',
 revenge:'The Spirimon gathers the echoes of blows it has endured and drives them outward in a fierce answering surge.',
 hexStrike:'The image follows lingering disturbances around the opponent and closes around them in a dark, resonant flare.',
 flinch:'A sudden looming shape breaks across the opponent’s view with an abrupt, startling pulse.'
};
function trio(scope,key,data,type,domain){
 const [opening,utility,culmination,utilityEffect,finalEffect,kind,material=key.toLowerCase()+' resonance']=data;
 return [opening,utility,culmination].map((name,n)=>{
  const effect=n===0?null:n===1?utilityEffect:finalEffect,physical=n!==1&&kind==='physical',support=n===1;
  const power=support?0:n===0?36:finalEffect==='multiHit'?22:finalEffect==='doubleHit'?34:finalEffect==='drain'?65:78;
  const motion=MOTIONS[effect]||(physical?'The Spirimon follows the image with a precise forward sweep, then returns along its own fading trail.':'The image gathers into a narrow stream and darts toward the opponent before scattering into dim motes.');
  return {id:'themed-'+scope+'-'+slug(key)+'-'+n,name,type,...(domain?{domain}:{}),power,accuracy:support?1:n===0?1:.95,kind:support?'status':physical?'physical':'spiritual',category:support?'Status':physical?'Physical':'Energy',effect,target:support&&FRIENDLY.has(effect)?'self':'opponent',timing:n===1?'lcd':'gcd',cooldownMs:n===1?22000:n===2?14000:6000,castMs:n===1?0:n===2?1100:250,learnLevel:scope==='lineage'?[6,18,36][n]:scope==='type'?[5,13,25][n]:[8,20,32][n],learnForm:scope==='lineage'?n:0,techniqueSource:{scope,key},visual:domain||type,desc:'In '+name+', a fleeting image of '+material+' takes shape around the Spirimon. '+motion};
 });
}
export function typeSignatureMoves(type){const data=TYPE_TECHNIQUE_DATA[type];return data?trio('type',type,data,type):[];}
export function domainSignatureMoves(value,type='Elemental'){
 const domain=canonicalDomain(value),definition=DOMAIN_DEFINITIONS.get(domain),data=DOMAIN_TECHNIQUE_DATA[domain];
 if(data)return trio('domain',domain,data,type,domain);
 if(!definition?.custom)return [];
 // Newly discovered Domains inherit sensible mechanics from their registered affinity.
 const affinity=DOMAIN_TECHNIQUE_DATA[definition.affinity]||DOMAIN_TECHNIQUE_DATA.Magic;
 return trio('domain',domain,[domain+' Wisp',domain+' Attunement',domain+' Convergence',...affinity.slice(3,6),domain.toLowerCase()+' patterns interwoven with '+affinity[6]],type,domain);
}
export function lineageSignatureMoves(sp){
 const key=String(sp.lineageId||sp.rosterId||sp.id||sp.seed||sp.forms?.[0]||'unwritten').replace(/^roster-/,''),data=LINEAGE_TECHNIQUE_DATA[key];
 if(data){const material=String(sp.description||'').split(/ with | whose | modified by | altered by /i).slice(1).join(', ').replace(/\.$/,'')||data[0].toLowerCase()+' and '+data[1].toLowerCase()+' motifs';return trio('lineage',key,[...data,material],sp.base);}
 // Procedural lineages retain stable names and IDs through transformations.
 const root=String(sp.forms?.[0]||sp.name||'Unwritten').replace(/[^a-zA-Z '-]/g,'').slice(0,24)||'Unwritten';
 const theme=TYPE_TECHNIQUE_DATA[sp.base]||TYPE_TECHNIQUE_DATA.Elemental;
 return trio('lineage',key,[root+' Trace',root+' Reverence',root+' Awakening',theme[3],theme[4],theme[5],root.toLowerCase()+' markings and '+theme[6]],sp.base);
}
export function allThemedTemplates(){return [...Object.keys(TYPE_TECHNIQUE_DATA).flatMap(typeSignatureMoves),...Object.keys(DOMAIN_TECHNIQUE_DATA).flatMap(domain=>domainSignatureMoves(domain)),...ROSTER.flatMap(row=>lineageSignatureMoves(row))];}
