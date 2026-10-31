import {TOWN_LAYOUT,TOWN_FEATURES,townPath} from './towns.mjs';
import {buildLearnset,startingMoves} from './moves.mjs';
export const VERSION=1;
export const TYPES=['Aberration','Beast','Celestial','Construct','Elemental','Fey','Fiend','Giant','Humanoid','Monstrosity','Ooze','Plant','Undead'];
export const DOMAINS=['Air','Earth','Fire','Water','Light','Dark','Sun','Moon','Lightning','Ice','Metal','Chaos','Law','Good','Evil','Creation','Destruction','War','Peace','Fear','Wrath','Love','Hope','Despair','Sorrow','Fate','Dreams','Nightmares'];
export const COLORS={Aberration:'#ac82d5',Beast:'#d0a267',Celestial:'#f0d889',Construct:'#87a3ae',Elemental:'#f48b63',Fey:'#b4a0e6',Fiend:'#d97570',Giant:'#b2a48c',Humanoid:'#88b8d0',Monstrosity:'#b2c588',Ooze:'#a1ca73',Plant:'#7abd8d',Undead:'#8ebbb4'};
export const BIOMES=[{name:'Briarwild',kind:'forest',types:['Beast','Plant','Fey'],color:'#376f51',desc:'Old roots. New footprints.'},{name:'Ashen Reach',kind:'ash',types:['Elemental','Fiend','Construct'],color:'#84644c',desc:'Something stirs beneath the cinders.'},{name:'Moonfen',kind:'fen',types:['Undead','Ooze','Aberration'],color:'#466c79',desc:'Follow the lights. Not their whispers.'},{name:'Sunfall Highlands',kind:'highland',types:['Celestial','Giant','Monstrosity'],color:'#7e875b',desc:'Where the sky comes down to earth.'},{name:'Wanderer’s Vale',kind:'vale',types:['Humanoid','Beast','Fey'],color:'#597d61',desc:'Every trail has a story.'}];
export function hash(...args){let h=2166136261;for(const c of args.join('|')){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
export function rng(seed){let a=typeof seed==='number'?seed:hash(seed);return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
export const pick=(a,r)=>a[Math.floor(r()*a.length)];
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function rollDomains(r=Math.random){const out=[];while(out.length<DOMAINS.length&&r()<.01)out.push(pick(DOMAINS.filter(d=>!out.includes(d)),r));return out;}
export function rollForm(r=Math.random){const v=r();return v<.01?2:v<.06?1:0;}
const SYLLABLES={Aberration:['Vex','Ocul','Nyth'],Beast:['Fang','Vulp','Lyn'],Celestial:['Auri','Ser','Halo'],Construct:['Ferr','Cog','Bron'],Elemental:['Cinder','Ember','Gale'],Fey:['Wisp','Lumi','Syl'],Fiend:['Dread','Ash','Mal'],Giant:['Tor','Crag','Gron'],Humanoid:['Veil','Rune','Mask'],Monstrosity:['Drak','Griff','Chim'],Ooze:['Gloop','Mire','Dropl'],Plant:['Briar','Thorn','Moss'],Undead:['Wraith','Hush','Crypt']};
const ANATOMY={Aberration:['a floating many-eyed mantle','a spiral-shelled tentacled creature','a translucent six-legged stalker'],Beast:['a fox','a saber-toothed cat','a giant ground sloth','a feathered raptor','a stag','a pangolin','a dire wolf'],Celestial:['a winged guardian','a many-winged luminous creature','a halo-crowned sentinel'],Construct:['a bronze automaton','a carved stone guardian','an articulated porcelain creature'],Elemental:['a living flame','a swirling storm creature','a creature of flowing stone'],Fey:['a moth-winged woodland spirit','a mischievous antlered sprite','a flowering faerie creature'],Fiend:['a horned infernal prowler','a barbed winged imp','an ember-eyed fiend'],Giant:['a colossal stone-skinned giant','a towering frost-haired giant','a mountainous broad-shouldered giant'],Humanoid:['a masked four-armed wanderer','a slender insect-faced biped','a feather-headed two-legged spirit'],Monstrosity:['a griffin','a manticore','a basilisk','a chimera','a wyvern'],Ooze:['an amorphous translucent jelly','a creeping viscous ooze','a gelatinous many-lobed blob'],Plant:['a walking pitcher plant','a thorned strangler vine','a giant carnivorous sundew'],Undead:['a spectral hound','a skeletal revenant','a wrapped ancient mummy','a headless wraith']};
const MODIFIERS={Aberration:'watchful eyes and curling tendrils',Beast:'fur, claws, and a predatory gait',Celestial:'luminous markings and feathered wings',Construct:'articulated armor and metallic seams',Elemental:'living elemental currents',Fey:'delicate wings and enchanting lights',Fiend:'swept horns and ember-cracked hide',Giant:'massive limbs and craggy features',Humanoid:'grasping hands and expressive posture',Monstrosity:'mythic horns and a barbed tail',Ooze:'translucent gel and dripping edges',Plant:'living moss, vines, and flowering thorns',Undead:'exposed bone and spectral wisps'};
export const MOVE_CATALOG=[
{id:'strike',name:'Spirit Strike',power:38,speed:8,kind:'physical',effect:null,desc:'A quick, reliable strike.'},
{id:'lash',name:'Binding Lash',power:29,speed:4,kind:'spiritual',effect:'slow',desc:'Spirit threads hinder the foe’s next action.'},
{id:'surge',name:'Soul Surge',power:64,speed:-18,kind:'spiritual',effect:null,desc:'Gather power for a heavy spiritual hit.'},
{id:'mend',name:'Quiet Renewal',power:0,speed:-8,kind:'spiritual',effect:'heal',desc:'Recover a quarter of maximum health.'},
{id:'venom',name:'Bitter Thorn',power:24,speed:2,kind:'physical',effect:'poison',desc:'A barbed strike that leaves lingering poison.'},
{id:'ward',name:'Spirit Ward',power:0,speed:12,kind:'spiritual',effect:'ward',desc:'Raise a ward that softens the next hit.'},
{id:'sleep',name:'Drowsing Whisper',power:15,speed:-5,kind:'spiritual',effect:'sleep',desc:'A hypnotic whisper may briefly lull the foe.'},
{id:'rush',name:'Wild Rush',power:45,speed:15,kind:'physical',effect:'recoil',desc:'Rush forward; the impact also hurts the user.'}];
export function makeSpecies(seed,base,alter,domains){const r=rng(seed);base??=pick(TYPES,r);alter??=pick(TYPES.filter(t=>t!==base),r);if(!TYPES.includes(base)||!TYPES.includes(alter)||base===alter)throw Error('Two distinct valid types required.');const name=pick(SYLLABLES[base],r)+pick(SYLLABLES[alter],r).toLowerCase(),body=pick(ANATOMY[base],r);domains??=rollDomains(r);const signature={id:'signature',name:pick(SYLLABLES[alter],r)+' '+pick(['Bloom','Rend','Pulse','Dance','Fang'],r),power:48,speed:(Math.floor(r()*17)-8)||1,kind:r()<.5?'physical':'spiritual',effect:pick([null,'slow','poison'],r),type:alter,desc:'This lineage’s distinctive technique.'};return{id:'sp-'+hash(seed,base,alter).toString(36),seed,base,alter,domains:domains??rollDomains(r),name,forms:[name+pick(['ling','en','ix','or','a'],r),name,name+' '+pick(['Ascendant','Elder','Sovereign'],r)],description:body[0].toUpperCase()+body.slice(1)+' altered by '+MODIFIERS[alter]+'. Its markings brighten when it trusts its sealer.',body,identity:hash(seed,'identity'),power:48+Math.floor(r()*18),health:43+Math.floor(r()*18),speed:30+Math.floor(r()*35),physicalRes:r()<.4?.85:1,spiritualRes:r()<.4?.85:1,ability:pick(['Steadfast','Wildheart','Second Wind','Soulweave'],r),temperament:pick(['Watchful','Curious','Proud','Gentle','Restless'],r),evolution:r()<.18?'bond':'level',learnset:buildLearnset(base,alter,domains),moves:startingMoves(base,alter,domains,hash(seed)),moveRevision:2,source:'procedural',sprites:[]};}
export const NATURES={Hardy:[null,null],Lonely:['might','defense'],Brave:['might','speed'],Adamant:['might','power'],Naughty:['might','resistance'],Bold:['defense','might'],Docile:[null,null],Relaxed:['defense','speed'],Impish:['defense','power'],Lax:['defense','resistance'],Timid:['speed','might'],Hasty:['speed','defense'],Serious:[null,null],Jolly:['speed','power'],Naive:['speed','resistance'],Modest:['power','might'],Mild:['power','defense'],Quiet:['power','speed'],Bashful:[null,null],Rash:['power','resistance'],Calm:['resistance','might'],Gentle:['resistance','defense'],Sassy:['resistance','speed'],Careful:['resistance','power'],Quirky:[null,null]};
export const moveCategory=move=>move.effect==='heal'||move.effect==='ward'||move.power===0||move.category==='Status'||move.kind==='status'?'Status':move.category==='Energy'||move.kind==='spiritual'||move.kind==='energy'?'Energy':'Physical';
function genetics(ind,key){return Math.max(0,Math.min(31,ind.ivs?.[key]??ind.potential??0));}
function effort(ind,key){return Math.max(0,Math.min(252,ind.evs?.[key]??0));}
function natureFactor(ind,key){const pair=NATURES[ind.nature]||NATURES.Hardy;return pair[0]===key?1.1:pair[1]===key?.9:1;}
export function makeIndividual(species,level=5,form=0,r=Math.random){const ivs=Object.fromEntries(['hp','might','defense','power','resistance','speed'].map(k=>[k,Math.floor(r()*32)]));return{id:'i-'+Math.floor(r()*1e12).toString(36),species:species.id,level,form,appearance:form,xp:0,bond:10,potential:ivs.might,nature:pick(Object.keys(NATURES),r),trained:0,ivs,evs:{hp:0,might:0,defense:0,power:0,resistance:0,speed:0},personalityValue:Math.floor(r()*4294967296),catchRate:species.catchRate??Math.max(35,Math.min(245,210-Math.floor((species.power||50)/2))),hp:0,status:null,commit:.5,ward:false,omegaUsed:false};}
export function stats(ind,sp){const f=1+ind.form*.25,lv=ind.level;const baseMight=sp.might??sp.power??50,basePower=sp.energyPower??sp.power??50;const calc=(base,key,growth)=>Math.floor((base+lv*growth+genetics(ind,key)+Math.floor(effort(ind,key)/4)+(key==='might'?(ind.trained||0):0))*f*natureFactor(ind,key));const might=calc(baseMight,'might',3);return{hp:Math.floor((sp.health+lv*5+genetics(ind,'hp')+Math.floor(effort(ind,'hp')/4))*f),might,defense:calc(sp.defense??baseMight,'defense',3),power:calc(basePower,'power',3),resistance:calc(sp.resistance??basePower,'resistance',3),pp:50+Math.floor(lv/2)+ind.form*8,speed:Math.floor((sp.speed+lv*2+genetics(ind,'speed')+Math.floor(effort(ind,'speed')/4))*natureFactor(ind,'speed'))};}
export function heal(ind,sp){ind.hp=stats(ind,sp).hp;ind.pp=stats(ind,sp).pp;ind.status=null;ind.ward=false;ind.secondWindUsed=false;return ind;}
// Unlisted matchups stay neutral. No moral alignment is inferred from a type.
const ADVANTAGE={Celestial:['Fiend','Undead'],Elemental:['Plant','Construct'],Fey:['Giant'],Fiend:['Fey'],Giant:['Construct'],Monstrosity:['Beast'],Ooze:['Construct'],Plant:['Ooze'],Undead:['Humanoid'],Aberration:['Humanoid']};
const RESIST={Construct:['Beast','Plant'],Celestial:['Celestial'],Undead:['Undead'],Elemental:['Elemental']};
export function effectiveness(move,defender){let m=1;for(const t of[defender.base,defender.alter]){if(ADVANTAGE[move.type]?.includes(t))m*=1.25;if(RESIST[t]?.includes(move.type))m*=.8;}const type=move.domain||'';if(type==='Fire'&&(defender.domains.includes('Ice')||defender.base==='Plant'))m*=1.25;if(type==='Water'&&defender.domains.includes('Fire'))m*=1.25;if(type==='Light'&&defender.domains.includes('Dark'))m*=1.25;return clamp(m,.5,2);}
export const STYLES={normal:{damage:1,speed:0},agile:{damage:.8,speed:22},strong:{damage:1.25,speed:-22}};
export function priority(ind,sp,move,style='normal'){return stats(ind,sp).speed+move.speed+STYLES[style].speed-(ind.status==='slow'?18:0);}
export function damage(attacker,asp,defender,dsp,move,style,r=Math.random){const a=stats(attacker,asp),d=stats(defender,dsp),energy=moveCategory(move)==='Energy';const offense=(energy?a.power:a.might)*(.25+attacker.commit*1.5),defense=(energy?d.resistance:d.defense)*(.25+(1-defender.commit)*1.5);const resistance=energy?dsp.spiritualRes:dsp.physicalRes,same=[asp.base,asp.alter].includes(move.type)?1.15:1;return Math.max(1,Math.floor(((2*attacker.level/5+2)*move.power*(offense/Math.max(1,defense))/24+2)*STYLES[style].damage*effectiveness(move,dsp)*(resistance??1)*same*(.9+r()*.1)*(defender.ward?.55:1)*(asp.ability==='Wildheart'&&!energy?1.12:1)*(asp.ability==='Soulweave'&&energy?1.12:1)*(dsp.ability==='Steadfast'&&defender.commit<=.4?.9:1)));}
export const STATUS_EFFECTS=['burn','freeze','paralysis','poison','toxic','sleep','confusion','infatuation','flinch','frostbite','nightmare','trap','leechSeed','curse','perish','disable','taunt'];
const MAJOR=new Set(['burn','freeze','paralysis','poison','toxic','sleep','frostbite']);
const STAGE_KEYS={boostMight:['might',1],boostPower:['power',1],boostDefense:['defense',1],boostResistance:['resistance',1],boostSpeed:['speed',1],boostAccuracy:['accuracy',1],boostEvasion:['evasion',1],lowerMight:['might',-1],lowerPower:['power',-1],lowerDefense:['defense',-1],lowerResistance:['resistance',-1],lowerSpeed:['speed',-1],lowerAccuracy:['accuracy',-1]};
function stage(ind,key){return ind.stages?.[key]||0;}
function stageFactor(n){return n>=0?(2+n)/2:2/(2-n);}
function applyCondition(target,effect,r=Math.random){if(target.safeguard||target.ward)return false;if(MAJOR.has(effect)){if(target.status)return false;target.status=effect;target.statusTurns=effect==='sleep'?2+Math.floor(r()*2):effect==='freeze'?2:0;target.toxicTurns=0;return true;}target.conditions??={};target.conditions[effect]=effect==='confusion'?2+Math.floor(r()*3):effect==='trap'?3:effect==='perish'?3:effect==='flinch'?1:effect==='infatuation'?3:3;return true;}
function statusTick(ind,sp,log){if(ind.hp<=0)return;if(ind.delayedDamage){ind.hp=Math.max(0,ind.hp-ind.delayedDamage);log.push(sp.forms[ind.appearance]+' is struck by delayed energy.');ind.delayedDamage=0;}const hp=stats(ind,sp).hp;let loss=0;if(ind.status==='poison'||ind.status==='burn'||ind.status==='frostbite')loss=Math.max(1,Math.floor(hp*(ind.status==='poison'?.0625:.0625)));if(ind.status==='toxic'){ind.toxicTurns=(ind.toxicTurns||0)+1;loss=Math.max(1,Math.floor(hp*Math.min(15,ind.toxicTurns)/16));}if(ind.conditions?.regenerate){ind.hp=Math.min(hp,ind.hp+Math.max(1,Math.floor(hp/16)));ind.conditions.regenerate--;if(!ind.conditions.regenerate)delete ind.conditions.regenerate;}if(ind.conditions?.leechSeed){loss+=Math.max(1,Math.floor(hp/8));}if(ind.conditions?.curse)loss+=Math.max(1,Math.floor(hp/4));if(ind.conditions?.trap)loss+=Math.max(1,Math.floor(hp/16));if(ind.conditions?.nightmare&&ind.status==='sleep')loss+=Math.max(1,Math.floor(hp/8));if(loss){ind.hp=Math.max(0,ind.hp-loss);log.push(sp.forms[ind.appearance]+' suffers '+loss+' ongoing damage.');}if(ind.conditions?.perish){ind.conditions.perish--;if(ind.conditions.perish<=0){ind.hp=0;log.push(sp.forms[ind.appearance]+' falls to its doom omen.');}}for(const k of ['trap','infatuation','disable','taunt'])if(ind.conditions?.[k]>0){ind.conditions[k]--;if(!ind.conditions[k])delete ind.conditions[k];}}
export function executeAction(actor,asp,target,tsp,move,style,commit,r=Math.random,costScale=1){
 const log=[],name=asp.forms[actor.appearance],targetName=tsp.forms[target.appearance];if(actor.hp<=0||target.hp<=0)return log;
 actor.commit=clamp(commit,0,1);actor.battleStyle??=style;actor.conditions??={};target.conditions??={};
 if(actor.status==='sleep'||actor.status==='freeze'){actor.statusTurns=(actor.statusTurns||1)-1;if(actor.statusTurns>0){log.push(name+' cannot act while '+actor.status+'.');return log;}actor.status=null;log.push(name+' recovers.');}
 if(actor.pendingMove&&actor.pendingMove.id!==move.id){move=actor.pendingMove;}if(actor.conditions.flinch){delete actor.conditions.flinch;log.push(name+' flinches.');return log;}
 if(actor.recharging){actor.recharging=false;log.push(name+' recharges.');return log;}if((actor.status==='paralysis'&&r()<.25)||(actor.conditions.infatuation&&r()<.5)||(actor.conditions.confusion&&r()<.33)){log.push(name+' is unable to act.');return log;}
 if(actor.conditions.confusion){actor.conditions.confusion--;if(!actor.conditions.confusion)delete actor.conditions.confusion;}
 if(actor.status==='slow')actor.status=null;
 if(asp.ability==='Second Wind'&&!actor.secondWindUsed&&actor.hp<stats(actor,asp).hp*.3){actor.hp=Math.min(stats(actor,asp).hp,actor.hp+Math.ceil(stats(actor,asp).hp*.15));actor.secondWindUsed=true;log.push(name+' catches its Second Wind.');}
 actor.pp??=stats(actor,asp).pp;const cost=Math.ceil(moveCost(move)*costScale);
 if(actor.pp<cost){move={id:'struggle',name:'Desperate Strike',power:20,speed:0,kind:'physical',type:asp.base,effect:'recoil'};log.push(name+' lacks PP and makes a desperate strike.');}else actor.pp-=cost;
 const effect=move.effect,category=moveCategory(move);const field=actor.battlefield||target.battlefield||{weather:null,terrain:null,weatherTurns:0,terrainTurns:0};actor.battlefield=field;target.battlefield=field;
 if(actor.conditions.taunt&&category==='Status'){log.push(name+' cannot use a support technique while silenced.');return log;}
 if(actor.conditions.disable&&actor.disabledMove===move.id){log.push(name+' cannot use the sealed technique.');return log;}
 const accuracy=clamp((move.accuracy??.9)+(style==='agile'?.15:0)-(target.battleStyle==='agile'?.15:0),.05,.99);
 if(category==='Status'){
  if(effect?.startsWith('weather')){field.weather=effect.slice(7).toLowerCase();field.weatherTurns=5;log.push(name+' summons '+field.weather+' weather.');return log;}
  if(effect?.startsWith('terrain')){field.terrain=effect.slice(7).toLowerCase();field.terrainTurns=5;log.push(name+' creates '+field.terrain+' terrain.');return log;}
  if(effect==='focus'){actor.focused=true;log.push(name+' gathers focus.');return log;}
  if(['heal','rest','fullheal'].includes(effect)){const amount=effect==='heal'?.25:1;actor.hp=Math.min(stats(actor,asp).hp,actor.hp+Math.ceil(stats(actor,asp).hp*amount));if(effect!=='heal'){actor.status=effect==='rest'?'sleep':null;actor.statusTurns=effect==='rest'?2:0;}log.push(name+' restores its vitality.');return log;}
  if(effect==='cleanse'){actor.status=null;actor.conditions={};log.push(name+' cleanses its afflictions.');return log;}
  if(effect==='ward'||effect==='protect'){actor.ward=true;log.push(name+' raises a protective ward.');return log;}
  if(['reflect','lightscreen','safeguard'].includes(effect)){actor[effect]=true;log.push(name+' raises '+move.name+'.');return log;}
  if(effect==='partyCleanse'){actor.status=null;actor.conditions={};log.push(name+' purifies its allies.');return log;}if(effect==='regenerate'){actor.conditions.regenerate=5;log.push(name+' begins recovering each turn.');return log;}if(effect==='auroraVeil'){if(field.weather!=='snow'){log.push('A snowstorm is required.');return log;}actor.reflect=true;actor.lightscreen=true;log.push(name+' raises an aurora veil.');return log;}if(effect==='bellyDrum'){const sacrifice=Math.floor(stats(actor,asp).hp/2);if(actor.hp<=sacrifice){log.push(name+' lacks the strength for the rite.');return log;}actor.hp-=sacrifice;actor.stages??={};actor.stages.might=6;log.push(name+' sacrifices vitality for maximum Might.');return log;}if(effect==='batonPass'){actor.switchRequested=true;actor.passStages=true;log.push(name+' prepares to pass its strength to an ally.');return log;}if(effect==='haze'){actor.stages={};target.stages={};log.push('All stat changes are dispelled.');return log;}
  if(effect==='swapStats'){[actor.stages,target.stages]=[target.stages||{},actor.stages||{}];log.push('Combat modifiers are exchanged.');return log;}
  if(effect==='invertStats'){for(const u of [actor,target])for(const k of Object.keys(u.stages||{}))u.stages[k]*=-1;log.push('Combat modifiers are inverted.');return log;}
  if(effect==='clearHazards'){actor.hazards={};log.push(name+' clears hazards.');return log;}
  if(['spikes','toxicSpikes','stealthRock','stickyWeb'].includes(effect)){target.hazards??={};target.hazards[effect]=true;log.push(name+' sets '+move.name+'.');return log;}
  const change=STAGE_KEYS[effect];if(change){const recipient=change[1]>0?actor:target;if(recipient===target&&r()>=accuracy){log.push(name+' misses.');return log;}recipient.stages??={};recipient.stages[change[0]]=clamp((recipient.stages[change[0]]||0)+change[1],-6,6);log.push(name+' changes '+(recipient===actor?'its ':'the foe’s ')+change[0]+'.');return log;}
  if(STATUS_EFFECTS.includes(effect)){if(r()<accuracy&&applyCondition(target,effect,r))log.push(targetName+' is affected by '+effect+'.');else log.push(name+' fails to inflict '+effect+'.');return log;}
  log.push(name+' uses '+move.name+'.');return log;
 }
 
 if(['twoTurn','chargeSun'].includes(effect)&&!actor.pendingMove&&!(effect==='chargeSun'&&field.weather==='sun')){actor.pendingMove={...move};log.push(name+' prepares '+move.name+'.');return log;}if(actor.pendingMove)actor.pendingMove=null;
 if(r()>=accuracy&&effect!=='sureHit'){log.push(name+' uses '+move.name+' but misses.');return log;}
 if(target.ward&&effect!=='breakWard'){target.ward=false;log.push(targetName+' blocks the attack with a ward.');return log;}
 const critical=r()<(effect==='critical'?.25:style==='strong'?.15:.05);
 const hits=effect==='multiHit'?2+Math.floor(r()*4):effect==='doubleHit'?2:1;
 let amount=0;for(let n=0;n<hits;n++)amount+=Math.max(1,Math.floor(damage(actor,asp,target,tsp,move,style,r)*(critical?1.5:1)*stageFactor(stage(actor,category==='Energy'?'power':'might'))/stageFactor(stage(target,category==='Energy'?'resistance':'defense'))));
 const weather=field.weather,terrain=field.terrain;if((weather==='rain'&&move.domain==='Water')||(weather==='sun'&&move.domain==='Fire'))amount=Math.floor(amount*1.5);if((weather==='rain'&&move.domain==='Fire')||(weather==='sun'&&move.domain==='Water'))amount=Math.max(1,Math.floor(amount*.5));if(effect==='weatherStrike'&&weather==='rain'||effect==='sunStrike'&&weather==='sun'||effect==='sandStrike'&&weather==='sand'||effect==='snowStrike'&&weather==='snow')amount=Math.floor(amount*1.5);if(effect==='terrainStrike'&&terrain==='grass'||effect==='electricStrike'&&terrain==='electric'||effect==='psychicStrike'&&terrain==='psychic'||effect==='mistStrike'&&terrain==='misty')amount=Math.floor(amount*1.5);if(effect==='venomStrike'&&['poison','toxic'].includes(target.status)||effect==='hexStrike'&&target.status)amount=Math.floor(amount*1.5);if(actor.focused){amount=Math.floor(amount*1.5);actor.focused=false;}
 if(effect==='unburdened'&&!actor.heldItem)amount=Math.floor(amount*2);if(effect==='revenge'&&actor.tookDamageThisRound)amount=Math.floor(amount*2);if(effect==='partyStrike')amount=Math.floor(amount*1.3);if(effect==='omniBoost'&&r()<.1){actor.stages??={};for(const k of ['might','power','defense','resistance','speed'])actor.stages[k]=clamp((actor.stages[k]||0)+1,-6,6);}if(effect==='selfDebuff'){actor.stages??={};for(const k of ['defense','resistance'])actor.stages[k]=clamp((actor.stages[k]||0)-1,-6,6);}
 if(actor.status==='burn'&&category==='Physical')amount=Math.max(1,Math.floor(amount*.5));
 if(actor.status==='frostbite'&&category==='Energy')amount=Math.max(1,Math.floor(amount*.5));
 if((target.reflect&&category==='Physical')||(target.lightscreen&&category==='Energy'))amount=Math.max(1,Math.floor(amount*.5));
 target.hp=Math.max(0,target.hp-amount);target.tookDamageThisRound=true;target.ward=false;log.push(name+' uses '+move.name+': '+amount+' damage'+(critical?' — critical hit!':'')+(hits>1?' ('+hits+' hits)':'')+'.');
 if(effect==='pivot'||effect==='forceSwitch'){(effect==='pivot'?actor:target).switchRequested=true;log.push((effect==='pivot'?name:targetName)+' must switch Spirits.');}if(effect==='rampage'){actor.rampage=(actor.rampage||0)+1;if(actor.rampage>=3){actor.rampage=0;applyCondition(actor,'confusion',r);}}if(effect==='delayedStrike'){target.delayedDamage=Math.max(1,Math.floor(amount/2));}if(effect==='drain')actor.hp=Math.min(stats(actor,asp).hp,actor.hp+Math.floor(amount/2));
 if(effect==='recoil')actor.hp=Math.max(0,actor.hp-Math.max(1,Math.ceil(amount*.15)));
 if(effect==='recharge')actor.recharging=true;
 if(effect==='breakWard')target.ward=false;
 if(effect==='disable'){target.conditions.disable=3;target.disabledMove=target.lastMove;}
 if(effect==='taunt')target.conditions.taunt=3;
 if(STAGE_KEYS[effect]){const [key,delta]=STAGE_KEYS[effect],recipient=delta>0?actor:target;recipient.stages??={};recipient.stages[key]=clamp((recipient.stages[key]||0)+delta,-6,6);}
 if(STATUS_EFFECTS.includes(effect)&&target.hp>0&&r()<.3&&applyCondition(target,effect,r))log.push(targetName+' is affected by '+effect+'.');
 actor.lastMove=move.id;return log;
}
export function resolveRound(a,asp,b,bsp,aChoice,bChoice,r=Math.random){a.battleStyle=aChoice.style;b.battleStyle=bChoice.style;const first=priority(a,asp,aChoice.move,aChoice.style)>=priority(b,bsp,bChoice.move,bChoice.style);const actors=first?[[a,asp,b,bsp,aChoice],[b,bsp,a,asp,bChoice]]:[[b,bsp,a,asp,bChoice],[a,asp,b,bsp,aChoice]];const log=[];for(const[u,us,v,vs,c]of actors)log.push(...executeAction(u,us,v,vs,c.move,c.style,c.commit,r));for(const[u,s]of[[a,asp],[b,bsp]])statusTick(u,s,log);return log;}
export function sealChance(ind,sp,quality=1){return clamp((ind.catchRate??sp.catchRate??150)/150*.12+(1-ind.hp/stats(ind,sp).hp)*.55+(ind.status?.15:0)+(quality-1)*.12-ind.form*.1,.05,.92);}
export function techniqueMilestones(sp){const pool=sp.learnset||buildLearnset(sp.base,sp.alter,sp.domains||[]);const original=new Set(startingMoves(sp.base,sp.alter,sp.domains||[],hash(sp.seed||sp.id)).map(m=>m.id));const extra=pool.filter(m=>!original.has(m.id));return extra.map((m,n)=>({id:m.id,level:6+n*2,form:n<5?0:n<12?1:2}));}
export function availableTechniques(ind,sp){
 const pool=sp.learnset||buildLearnset(sp.base,sp.alter,sp.domains||[]);
 const initial=startingMoves(sp.base,sp.alter,sp.domains||[],hash(sp.seed||sp.id)).map(m=>m.id);
 const unlocked=new Set([...initial,...(ind.moveIds||[]),...(ind.unlockedMoves||[])]);
 for(const milestone of techniqueMilestones(sp))if(milestone.level<=ind.level&&milestone.form<=ind.form)unlocked.add(milestone.id);
 return pool.filter(m=>unlocked.has(m.id));
}
export function learnProgression(ind,sp,previousLevel=ind.level,previousForm=ind.form){
 const pool=sp.learnset||buildLearnset(sp.base,sp.alter,sp.domains||[]);
 const byId=new Map(pool.map(m=>[m.id,m]));
 const start=startingMoves(sp.base,sp.alter,sp.domains||[],hash(sp.seed||sp.id)).map(m=>m.id);
 ind.moveIds??=start;
 ind.unlockedMoves??=[];
 const owned=new Set([...ind.moveIds,...ind.unlockedMoves]);
 const earned=[];
 for(const m of techniqueMilestones(sp)){
   if(m.level>ind.level||m.form>ind.form||owned.has(m.id))continue;
   if(m.level<=previousLevel&&m.form<=previousForm)continue;
   owned.add(m.id);ind.unlockedMoves.push(m.id);earned.push(byId.get(m.id));
 }
 // Unlocked moves are remembered permanently. Equip newly learned moves without erasing custom selections.
 for(const m of earned){if(ind.moveIds.length<4)ind.moveIds.push(m.id);else {const replace=ind.moveIds.findIndex(id=>!byId.has(id));if(replace>=0)ind.moveIds[replace]=m.id;}}
 return earned;
}
export function gainXP(ind,sp,amount){const previousLevel=ind.level,previousForm=ind.form;ind.xp+=amount;let levels=0;while(ind.level<100&&ind.xp>=ind.level*18){ind.xp-=ind.level*18;ind.level++;levels++;}const required=ind.form===0?16:36;let evolved=false;if(ind.form<2&&ind.level>=required&&(sp.evolution!=='bond'||ind.bond>=60)){ind.form++;ind.appearance=ind.form;evolved=true;}const learned=learnProgression(ind,sp,previousLevel,previousForm);if(levels||evolved)heal(ind,sp);return{levels,evolved,learned};}
export function region(seed,cx,cy){const r=rng(hash(seed,cx,cy)),biome=cx===0&&cy===0?BIOMES[0]:pick(BIOMES,r);return{cx,cy,biome,town:cx===0&&cy===0||r()<.27,name:cx===0&&cy===0?'Mossveil Crossing':pick(['Elder','Willow','Hollow','Amber','Thistle','Silver','Quiet'],r)+pick(['watch','mere','grove','rest','reach','fall'],r),danger:Math.max(Math.abs(cx),Math.abs(cy))===0?1:6,key:cx+','+cy};}
export const CHUNK_W=48,CHUNK_H=36;
export function coord(x,y){return{cx:Math.floor(x/48),cy:Math.floor(y/36),lx:((x%48)+48)%48,ly:((y%36)+36)%36};}
function rawTile(seed,x,y){const{cx,cy,lx,ly}=coord(x,y),reg=region(seed,cx,cy),h=hash(seed,x,y)%100,inTown=reg.town&&Math.abs(lx-24)<10&&Math.abs(ly-18)<8,path=ly===18||ly===19||lx===24||lx===25;if(reg.town){for(const b of TOWN_LAYOUT)if(lx>=b.x&&lx<b.x+b.w&&ly>=b.y&&ly<b.y+b.h)return ly===b.y?'path':b.kind==='hall'?'guild':'house';if(TOWN_FEATURES.some(f=>lx>=f.x&&lx<f.x+f.w&&ly>=f.y&&ly<f.y+f.h))return'feature';if(lx===27&&ly===18)return'well';if(townPath(lx,ly))return'path';}if(path)return'path';if(inTown)return h<12?'flower':'lawn';const rx=5+(hash(seed,cx,cy,'terrace')%2)*27,ry=4;if(lx>=rx&&lx<=rx+10&&ly>=ry&&ly<=ry+8){if(ly===ry+8&&lx===rx+5)return'stairs';if(lx===rx||lx===rx+10||ly===ry+8)return'cliff';if(h<22)return'grass';return'lawn';}const coarse=hash(seed,Math.floor(x/5),Math.floor(y/5));if(coarse%13===0&&lx%5>0&&ly%5>0)return'water';if(hash(seed,Math.floor(x/4),Math.floor(y/4),'woods')%100<38)return(x%2===0&&y%2===0)?'tree':'forest';if(h<5)return'rock';if(hash(seed,Math.floor(x/3),Math.floor(y/3),'grass')%100<33)return'grass';if(h<50)return'flower';return'lawn';}
export function walkable(t,canSwim=false,canClimb=false){return!['guild','house','well','tree','cliff'].includes(t)&&(t!=='water'||canSwim)&&(t!=='rock'||canClimb);}
export function npcs(seed,cx,cy){if(!region(seed,cx,cy).town)return[];return[{id:'keeper-'+cx+','+cy,name:'Keeper Iona',role:'keeper',x:cx*48+22,y:cy*36+16},{id:'merchant-'+cx+','+cy,name:'Tavi',role:'merchant',x:cx*48+29,y:cy*36+17},{id:'rival-'+cx+','+cy,name:'Rowan',role:'rival',x:cx*48+19,y:cy*36+20},{id:'scholar-'+cx+','+cy,name:'Scholar Elin',role:'scholar',x:cx*48+26,y:cy*36+23}];}
export function newGame(seed='SP-'+Math.floor(Math.random()*999999)){return{version:VERSION,seed,player:{name:'Sealer',x:24,y:19,face:'down'},safe:{x:24,y:19},spirits:[],party:[],species:{},regions:{},roamers:{},seen:[],history:{},inventory:{seals:8,offerings:5,tonics:5,ethers:3,coins:120,quality:1},rank:1,rankXP:0,steps:0,wins:0,captured:0,friendships:{},quests:{discovery:false,rival:false,explorer:false},drops:[],lastSave:Date.now(),playTime:0,settings:{timing:'normal'},starter:false,notes:['Arrived at Mossveil Crossing. Keeper Iona is waiting beside the guild.']};}
export function validateSpecies(raw,original){if(!raw||typeof raw!=='object')throw Error('Model returned no spirit design.');const clean=(v,n)=>typeof v==='string'?v.replace(/[<>\x00-\x1f]/g,'').trim().slice(0,n):'';const forms=Array.isArray(raw.forms)?raw.forms.map(s=>clean(s,45)):[];if(forms.length!==3||forms.some(s=>!s))throw Error('A lineage must have three named forms.');const description=clean(raw.description,700);if(!description)throw Error('Missing spirit description.');const next={...original,name:forms[1],forms,description,source:'local-llm'};if(Array.isArray(raw.visualPrompts)&&raw.visualPrompts.length===3)next.visualPrompts=raw.visualPrompts.map(p=>clean(p,1400));if(Array.isArray(raw.moveNames))next.moves=original.moves.map((m,i)=>({...m,name:clean(raw.moveNames[i],40)||m.name}));return next;}

export function moveCost(move){return move.ppCost??Math.max(3,Math.ceil(move.power/12)+2);}
export function actionCost(move,index=0){return Math.ceil(moveCost(move)*(1+index*.5));}
// Bonus actions repay last round. Only voluntarily borrowed actions create debt.
export function resolveTempoRound(a,asp,b,bsp,aChoice,bChoice,credits={a:0,b:0},r=Math.random){
 a.battleStyle=aChoice.style;b.battleStyle=bChoice.style;const borrowA=clamp(Math.floor(aChoice.borrow||0),0,2),borrowB=clamp(Math.floor(bChoice.borrow||0),0,2),entries=[];
 for(const[who,u,us,v,vs,c,bonus,borrow]of[["a",a,asp,b,bsp,aChoice,credits.a||0,borrowA],["b",b,bsp,a,asp,bChoice,credits.b||0,borrowB]]){
  for(let index=0;index<1+bonus+borrow;index++)entries.push({who,u,us,v,vs,c,index,borrowed:index>=1+bonus,priority:priority(u,us,c.move,c.style)-index*18});
 }
 entries.sort((x,y)=>y.priority-x.priority||(x.who==="a"?-1:1));
 a.tookDamageThisRound=false;b.tookDamageThisRound=false;const nextCredits={a:0,b:0},actions={a:0,b:0},log=[],events=[];
 for(const e of entries){if(e.u.hp<=0||e.v.hp<=0)continue;
  const pp=e.u.pp??stats(e.u,e.us).pp;
  if(e.index>0&&pp<actionCost(e.c.move,e.index)){log.push(e.us.forms[e.u.appearance]+" cannot fund another action with its remaining PP.");continue;}
  log.push(...executeAction(e.u,e.us,e.v,e.vs,e.c.move,e.c.style,e.c.commit,r,1+e.index*.5));actions[e.who]++;events.push({side:e.who,move:{...e.c.move},style:e.c.style,aHP:a.hp,bHP:b.hp,aPP:a.pp,bPP:b.pp});
  if(e.borrowed)nextCredits[e.who==="a"?"b":"a"]++;
 }
 for(const[u,sp]of[[a,asp],[b,bsp]])statusTick(u,sp,log);const field=a.battlefield;if(field){if(field.weatherTurns>0&&!--field.weatherTurns)field.weather=null;if(field.terrainTurns>0&&!--field.terrainTurns)field.terrain=null;}
 return{log,nextCredits,actions,events};
}

const terrainMemo=new Map();export function tile(seed,x,y){const key=seed+'|'+x+'|'+y;if(terrainMemo.has(key))return terrainMemo.get(key);const value=rawTile(seed,x,y);if(terrainMemo.size>100000)terrainMemo.clear();terrainMemo.set(key,value);return value;}

export function encounterRange(seed,cx,cy,towns=0){const distance=Math.max(Math.abs(cx),Math.abs(cy));if(distance===0)return{minLevel:1,maxLevel:5};if(distance===1)return{minLevel:6,maxLevel:8};let min=6,left=Math.max(0,towns),tier=0;while(left>0){const span=1+hash(seed,'town-span',tier)%3;if(left<span)break;left-=span;min+=1+hash(seed,'town-rise',tier)%3;tier++;}return{minLevel:Math.min(98,min),maxLevel:Math.min(100,min+2)};}
export function encounterLevel(reg,r=Math.random){const min=reg.minLevel??reg.danger??1,max=reg.maxLevel??min+2;return min+Math.floor(r()*(max-min+1));}
export function refreshTechniques(sp){if(sp.moveRevision===2&&sp.learnset)return sp;sp.learnset=buildLearnset(sp.base,sp.alter,sp.domains||[]);sp.moves=startingMoves(sp.base,sp.alter,sp.domains||[],hash(sp.seed||sp.id));sp.moveRevision=2;return sp;}

export const CHALLENGER_DIALOGUE={
 rival:['You have grown. So have I. Let us see whose bonds run deeper.','I followed the same trail, but our stories are taking different turns.','Your last victory taught me something. This time I have an answer.','The guild speaks highly of you. I intend to give them another name to remember.','A good rival never lets you grow comfortable.','I have crossed two valleys to test this new formation.','No shortcuts, no excuses. Show me what your Spirits can do.','You always find a way to surprise me.','A battle between friends is still a battle worth winning.','I trained through the storm. Did you?','My Spirits chose to fight beside me. I hope yours feel the same.','I was hoping our paths would cross here.','This is not about the score. It is about who we become.','I remember our first match. Everything has changed since then.','I will not underestimate your team again.','Another town, another chance to measure our strength.'],
 villain:['The wilds belong to those strong enough to seize them.','Your bonds make you predictable. We prefer obedience.','You have wandered into our territory, Sealer.','We will take the power you refuse to use.','Your guild cannot protect every road.','Our order has watched your progress with interest.','Your Spirits will make excellent additions to our cause.','Compassion is a weakness the world will punish.','The old covenants are broken. We intend to write new ones.','You stand between us and something ancient.','I have no interest in your reputation. Only your defeat.','The shadows between settlements answer to us.','Your victory would merely delay our plans.','We will meet again, and next time we will be ready.','You cannot protect what you have not yet discovered.','This road is closed. Turn back or be taught why.']
};
export function challengerLevel(average,area,previous=0){return Math.max(1,Math.min(100,Math.max(Math.round(average),area||1,previous||0)));}
export function challengerRoll(seed,steps,transition,count=0){const r=rng(hash(seed,'challenger',steps,transition,count));return r()<.05?r()<.55?'rival':'villain':null;}
export const QUEST_DIFFICULTIES=['Novice','Skilled','Veteran','Elite','Legendary'];
const Q=(id,title,role,difficulty,steps,reward,description,requirements={})=>({id,title,role,difficulty,steps,target:steps.length,goal:steps[0].goal,reward,description,requirements});
export function questTemplates(){return [
 Q('first-bond','A Promise Kept','keeper','Novice',[{goal:'capture',count:2}],{coins:35,seals:2},'Form bonds with two Spirits.'),
 Q('field-study','Living Field Notes','scholar','Novice',[{goal:'seen',count:5}],{coins:60,ethers:1},'Record five distinct species.'),
 Q('open-roads','Beyond the Lanterns','resident','Novice',[{goal:'regions',count:3}],{coins:50,offerings:2},'Explore three regions.'),
 Q('guild-trials','The Trial of Resolve','rival','Skilled',[{goal:'wins',count:3}],{coins:85,tonics:2},'Win three battles.',{rank:2}),
 Q('safe-trails','Clear the Roads','keeper','Skilled',[{goal:'villains',count:1}],{coins:120,seals:3},'Defeat a hostile agent.',{rank:2}),
 Q('healers-hand','A Healer’s Hands','keeper','Novice',[{goal:'heal',count:3}],{coins:65,tonics:3},'Restore your team three times.'),
 Q('friendly-gesture','Trust Is Earned','resident','Novice',[{goal:'offerings',count:3}],{coins:55,offerings:2},'Offer gifts to Spirits three times.'),
 Q('trail-scout','Scout the Frontier','resident','Skilled',[{goal:'regions',count:5},{goal:'wins',count:2}],{coins:150,seals:3},'Chart five regions, then win two battles.',{rank:2}),
 Q('sealers-art','The Sealer’s Art','keeper','Skilled',[{goal:'capture',count:4},{goal:'heal',count:2}],{coins:160,seals:4,ethers:1},'Seal four Spirits, then restore your team twice.',{rank:2}),
 Q('rival-training','Lessons in Defeat','rival','Veteran',[{goal:'wins',count:5},{goal:'rivals',count:1}],{coins:260,tonics:4},'Win five battles, then defeat Rowan.',{rank:3}),
 Q('specimen-archive','The Grand Archive','scholar','Veteran',[{goal:'seen',count:15},{goal:'regions',count:7}],{coins:300,ethers:3},'Document fifteen species, then explore seven regions.',{rank:3}),
 Q('supply-run','The Long Supply Road','merchant','Novice',[{goal:'steps',count:80},{goal:'regions',count:3}],{coins:90,seals:2,tonics:1},'Travel eighty steps and visit three regions.'),
 Q('merchant-protection','Caravan Escort','merchant','Veteran',[{goal:'steps',count:180},{goal:'villains',count:1}],{coins:320,tonics:3,seals:4},'Travel the road, then defeat a hostile agent.',{rank:3}),
 Q('shadow-trail','Shadows at the Crossing','resident','Veteran',[{goal:'villains',count:2},{goal:'regions',count:9}],{coins:380,ethers:3},'Defeat two agents, then chart nine regions.',{rank:3}),
 Q('bond-mastery','The Unbroken Covenant','keeper','Elite',[{goal:'capture',count:8},{goal:'rivals',count:2},{goal:'villains',count:2}],{coins:650,seals:6,ethers:4},'Seal eight Spirits and overcome two rivals and two agents.',{rank:4}),
 Q('frontier-legend','Legend of the Far Roads','scholar','Legendary',[{goal:'regions',count:20},{goal:'seen',count:35},{goal:'wins',count:20}],{coins:1200,seals:10,ethers:6,tonics:6},'Explore twenty regions, catalogue thirty-five species and win twenty battles.',{rank:5}),
 Q('guild-champion','The Guild’s Champion','rival','Legendary',[{goal:'rivals',count:4},{goal:'villains',count:4},{goal:'wins',count:25}],{coins:1500,seals:10,tonics:8},'Defeat four rivals and four agents, then earn twenty-five victories.',{rank:5})
];}
export function questMetric(s,goal){switch(goal){
 case'capture':return s.captured||0;case'seen':return s.seen?.length||0;
 case'regions':return Object.values(s.regions||{}).filter(r=>r.visited).length;
 case'wins':return s.wins||0;case'villains':return s.challengers?.villainWins||0;
 case'rivals':return s.challengers?.rivalWins||0;
 case'heal':return s.questCounters?.heal||0;case'offerings':return s.questCounters?.offerings||0;
 case'steps':return s.steps||0;default:return 0;
}}
export function questEligible(s,q){return (s.rank||1)>=(q.requirements?.rank||1);}
export function questStage(s,q,record){if(!record||record==='available')return {index:0,progress:0,complete:false};if(record==='completed')return {index:q.steps.length,progress:0,complete:true};
 const steps=q.steps||[{goal:q.goal,count:q.target}];
 const index=Math.min(record.stage||0,steps.length);
 if(index===steps.length)return {index,progress:0,complete:true};
 const step=steps[index],base=record.baseline??0;
 return {index,progress:Math.min(step.count,Math.max(0,questMetric(s,step.goal)-base)),complete:false};
}
export function advanceQuest(s,q,record){if(!record||record==='completed'||record==='available')return record;
 const steps=q.steps||[{goal:q.goal,count:q.target}];
 let stage=record.stage||0,baseline=record.baseline??0;
 while(stage<steps.length&&questMetric(s,steps[stage].goal)-baseline>=steps[stage].count){
  stage++;baseline=stage<steps.length?questMetric(s,steps[stage].goal):0;
 }
 return {...record,stage,baseline};
}
export function questProgress(s,q){return questMetric(s,q.goal);}

export function challengerTeamSize(matches,level){return Math.min(6,1+Math.floor(matches/2)+(level>=20?1:0)+(level>=40?1:0));}

export function caveEntrance(seed,cx,cy){
 if(cx===0&&cy===0)return null;
 if(hash(seed,'cave',cx,cy)%3!==0)return null;
 const x=cx*48+12,y=cy*36+19;
 return {x,y,cx,cy,id:cx+','+cy,depth:2+hash(seed,'cave-depth',cx,cy)%4};
}
export function caveMap(seed,id,level){
 const width=25,height=19,grid=Array.from({length:height},()=>Array(width).fill('wall'));
 const random=rng(hash(seed,'cave-layout',id,level));
 const stack=[[1,1]];grid[1][1]='floor';
 while(stack.length){
  const [x,y]=stack[stack.length-1],dirs=[[2,0],[-2,0],[0,2],[0,-2]].sort(()=>random()-.5);
  const choices=dirs.filter(([dx,dy])=>x+dx>0&&y+dy>0&&x+dx<width-1&&y+dy<height-1&&grid[y+dy][x+dx]==='wall');
  if(!choices.length){stack.pop();continue;}
  const [dx,dy]=choices[Math.floor(random()*choices.length)];
  grid[y+dy/2][x+dx/2]='floor';grid[y+dy][x+dx]='floor';stack.push([x+dx,y+dy]);
 }
 const floors=[];for(let y=1;y<height-1;y++)for(let x=1;x<width-1;x++)if(grid[y][x]==='floor')floors.push({x,y});
 const far=floors.reduce((a,b)=>Math.abs(b.x-1)+Math.abs(b.y-1)>Math.abs(a.x-1)+Math.abs(a.y-1)?b:a,{x:1,y:1});
 grid[1][1]='up';grid[far.y][far.x]='down';
 const exits=[{x:1,y:1,kind:'up'},{...far,kind:'down'}];
 if(level===0&&hash(seed,'extra-cave-exit',id)%2===0){const other=floors.find(p=>Math.abs(p.x-1)+Math.abs(p.y-1)>18&&Math.abs(p.x-far.x)+Math.abs(p.y-far.y)>10);if(other){grid[other.y][other.x]='exit';exits.push({...other,kind:'exit'});}}
 return {width,height,grid,exits};
}
export function caveWalkable(map,x,y){return !!map.grid[y]&&['floor','up','down','exit'].includes(map.grid[y][x]);}
