import {exhaustion,spiritualMultiplier,spiritualDefense,spiritualBonus,shieldDamage} from './spiritual-core.mjs';
import {buildDesign,assignDomains,migrateSpecies,migrateSaveCreatures,syncCapabilities} from './anatomy.mjs';
import {CREATURE_TYPES,CREATURE_DOMAINS} from './creature-catalog.mjs';
import {ensurePassives,ensureIndividualPassives,passiveEffects} from './classification-passives.mjs';
import {DOMAIN_ALIASES,canonicalDomain,activeTypes,domainSources} from './classifications.mjs';
export {DOMAIN_ALIASES,canonicalDomain,activeTypes,ensureIndividualPassives};
import {statusChance} from './classification-status.mjs';
import {equipment,hasHook,ASPECTS,heldEquipment,itemHasHook,itemOnceUsed,markItemUsed,consumeHeldItem,heldItemActivation} from './equipment.mjs';
import {townLayout,townFeatures,townPath,townGround} from './towns.mjs';
import {sceneryBaseRow} from './scenery.mjs';
import {buildLearnset,startingMoves,validateGeneratedMoves,moveBaseValue as baseMoveValue,moveLore as narrativeLore,moveCooldownDisruption} from './moves.mjs';
export function moveBaseValue(move){return baseMoveValue(move);}
export function moveLore(move){return narrativeLore(move);}
export const VERSION=1;
export const TYPES=CREATURE_TYPES;
export const DOMAINS=CREATURE_DOMAINS;

export const COLORS={Aberration:'#ac82d5',Beast:'#d0a267',Celestial:'#f0d889',Construct:'#87a3ae',Elemental:'#f48b63',Fey:'#b4a0e6',Fiend:'#d97570',Giant:'#b2a48c',Monstrosity:'#b2c588',Ooze:'#a1ca73',Plant:'#7abd8d',Undead:'#8ebbb4'};
export const BIOMES=[{name:'Briarwild',kind:'forest',types:['Beast','Plant','Fey'],color:'#376f51',desc:'Old roots. New footprints.'},{name:'Ashen Reach',kind:'ash',types:['Elemental','Fiend','Construct'],color:'#84644c',desc:'Something stirs beneath the cinders.'},{name:'Moonfen',kind:'fen',types:['Undead','Ooze','Aberration'],color:'#466c79',desc:'Follow the lights. Not their whispers.'},{name:'Sunfall Highlands',kind:'highland',types:['Celestial','Giant','Monstrosity'],color:'#7e875b',desc:'Where the sky comes down to earth.'},{name:'Wanderer’s Vale',kind:'vale',types:['Construct','Beast','Fey'],color:'#597d61',desc:'Every trail has a story.'}];
export function hash(...args){let h=2166136261;for(const c of args.join('|')){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
export function rng(seed){let a=typeof seed==='number'?seed:hash(seed);return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
export const pick=(a,r)=>a[Math.floor(r()*a.length)];
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function rollDomains(r=Math.random){const out=[];while(out.length<DOMAINS.length&&r()<.01)out.push(pick(DOMAINS.filter(d=>!out.includes(d)),r));return out;}
export function rollForm(r=Math.random){const v=r();return v<.01?2:v<.06?1:0;}
export const MOVE_CATALOG=[
{id:'strike',name:'Spirit Strike',power:38,kind:'physical',effect:null,desc:'A quick, reliable strike.'},
{id:'lash',name:'Binding Lash',power:29,kind:'spiritual',effect:'slow',desc:'Spirimon threads hinder the foe’s next action.'},
{id:'surge',name:'Soul Surge',power:64,kind:'spiritual',effect:null,desc:'Gather power for a heavy spiritual hit.'},
{id:'mend',name:'Quiet Renewal',power:0,kind:'spiritual',effect:'heal',desc:'Recover a quarter of maximum health.'},
{id:'venom',name:'Bitter Thorn',power:24,kind:'physical',effect:'poison',desc:'A barbed strike that leaves lingering poison.'},
{id:'ward',name:'Spirit Ward',power:0,kind:'spiritual',effect:'ward',desc:'Raise a ward that softens the next hit.'},
{id:'sleep',name:'Drowsing Whisper',power:15,kind:'spiritual',effect:'sleep',desc:'A hypnotic whisper may briefly lull the foe.'},
{id:'rush',name:'Wild Rush',power:45,kind:'physical',effect:'recoil',desc:'Rush forward; the impact also hurts the user.'}];
export function makeSpecies(seed,base,alter,domains){
 const r=rng(seed);base??=pick(TYPES,r);alter??=pick(TYPES.filter(t=>t!==base),r);
 if(!TYPES.includes(base)||!TYPES.includes(alter)||base===alter)throw Error('Two distinct valid types required.');
 const design=buildDesign(seed,base,alter),anatomy=design.anatomy;
 const sp={id:'sp-'+hash(seed,base,alter).toString(36),seed,base,alter,domains:domains||[],name:design.name,forms:design.forms,description:design.description,body:design.reference.name,identity:hash(seed,'identity'),design,anatomy,power:45+Math.floor(r()*18)+anatomy.strength*3,health:43+Math.floor(r()*18)+(anatomy.strength-1)*5,speed:30+Math.floor(r()*35)-(anatomy.strength-1)*3,physicalRes:r()<.4?.85:1,spiritualRes:r()<.4?.85:1,ability:pick(['Steadfast','Wildheart','Second Wind','Soulweave','Pressure'],r),temperament:pick(['Watchful','Curious','Proud','Gentle','Restless'],r),evolution:r()<.18?'bond':'level',moveRevision:3,source:'procedural',proceduralArt:true,sprites:[],taxonomyRevision:2};
 assignDomains(sp,r);ensurePassives(sp);syncCapabilities(sp);sp.learnset=buildLearnset(base,alter,sp.domains,anatomy);sp.moves=startingMoves(base,alter,sp.domains,hash(seed),anatomy);return sp;
}
export {migrateSpecies,migrateSaveCreatures};
export const NATURES={Hardy:[null,null],Lonely:['might','defense'],Brave:['might','speed'],Adamant:['might','power'],Naughty:['might','resistance'],Bold:['defense','might'],Docile:[null,null],Relaxed:['defense','speed'],Impish:['defense','power'],Lax:['defense','resistance'],Timid:['speed','might'],Hasty:['speed','defense'],Serious:[null,null],Jolly:['speed','power'],Naive:['speed','resistance'],Modest:['power','might'],Mild:['power','defense'],Quiet:['power','speed'],Bashful:[null,null],Rash:['power','resistance'],Calm:['resistance','might'],Gentle:['resistance','defense'],Sassy:['resistance','speed'],Careful:['resistance','power'],Quirky:[null,null]};
export const moveCategory=move=>move.effect==='heal'||move.effect==='ward'||move.power===0||move.category==='Status'||move.kind==='status'?'Status':move.category==='Energy'||move.kind==='spiritual'||move.kind==='energy'?'Energy':'Physical';

export function equippedMoves(ind,sp){
 if(!Array.isArray(ind?.moveIds))return sp.moves||[];
 return ind.moveIds.map(id=>sp.learnset?.find(m=>m.id===id)||sp.moves?.find(m=>m.id===id)).filter(Boolean);
}
export function resourceMaximums(ind,sp){const max={pp:0,willpower:0};for(const move of equippedMoves(ind,sp))max[moveCategory(move)==='Physical'?'pp':'willpower']+=moveBaseValue(move);return max;}
export function normalizeResources(ind,sp){
 const max=resourceMaximums(ind,sp);
 for(const key of ['pp','willpower']){
  const old=ind.resourceCaps?.[key];
  if(ind[key]==null||!Number.isFinite(ind[key]))ind[key]=max[key];
  else if(old!==undefined&&old!==max[key])ind[key]=Math.max(0,max[key]-Math.max(0,old-ind[key]));
  ind[key]=clamp(Math.floor(ind[key]),0,max[key]);
 }
 ind.resourceCaps=max;return ind;
}
export function migrateResources(ind,sp){
 if(ind.resourceRevision!==1){
  const old=50+Math.floor(ind.level/2)+ind.form*8,max=resourceMaximums(ind,sp);
  for(const key of ['pp','willpower'])ind[key]=ind[key]==null?max[key]:Math.floor(max[key]*clamp(ind[key]/Math.floor(old*(key==='pp'&&ind.specialty==='Mystic'?1.1:1)),0,1));
  ind.resourceRevision=1;ind.resourceCaps=max;
 }
 return normalizeResources(ind,sp);
}
export const STRUGGLE={id:'struggle',name:'Struggle',power:50,kind:'physical',category:'Physical',effect:'struggle',accuracy:1,desc:'An exhausted physical attack. Recoil costs one quarter of maximum HP.'};
export function canUseMove(ind,sp,move,targetSp){
 if(ind.pendingMove?.id===move.id)return true;
 if(ind.itemMoveLock&&hasHook(ind,'choiceLock',sp)&&ind.itemMoveLock!==move.id)return false;
 if(ind.conditions?.taunt&&moveCategory(move)==='Status'||ind.conditions?.disable&&ind.disabledMove===move.id)return false;
 if(move.id==='struggle')return false;
 const key=moveCategory(move)==='Physical'?'pp':'willpower',other=key==='pp'?'willpower':'pp',max=resourceMaximums(ind,sp);
 return (ind[key]??max[key])+Math.floor((ind[other]??max[other])/2)>=moveCost(move,targetSp);
}
export function battleMove(ind,sp,requested,targetSp){
 if(ind.pendingMove)return ind.pendingMove;
 if(ind.lockedMove&&canUseMove(ind,sp,ind.lockedMove,targetSp))return ind.lockedMove;
 const usable=equippedMoves(ind,sp).filter(m=>canUseMove(ind,sp,m,targetSp));
 if(!usable.length)return {...STRUGGLE,type:sp.base};
 return requested?.id!=='struggle'&&canUseMove(ind,sp,requested,targetSp)?requested:null;
}

function genetics(ind,key){return Math.max(0,Math.min(31,ind.ivs?.[key]??ind.potential??0));}
function effort(ind,key){return Math.max(0,Math.min(252,ind.evs?.[key]??0));}
function natureFactor(ind,key){const pair=NATURES[ind.nature]||NATURES.Hardy;return pair[0]===key?1.1:pair[1]===key?.9:1;}
export function makeIndividual(species,level=5,form=0,r=Math.random){const ivs=Object.fromEntries(['hp','might','defense','power','resistance','speed'].map(k=>[k,Math.floor(r()*32)]));return{id:'i-'+Math.floor(r()*1e12).toString(36),species:species.id,level,form,appearance:form,xp:0,bond:10,potential:ivs.might,nature:pick(Object.keys(NATURES),r),trained:0,ivs,evs:{hp:0,might:0,defense:0,power:0,resistance:0,speed:0},personalityValue:Math.floor(r()*4294967296),rareVariant:r()<1/128,catchRate:species.catchRate??Math.max(35,Math.min(245,210-Math.floor((species.power||50)/2))),hp:0,status:null,commit:.5,ward:false,omegaUsed:false};}
export function stats(ind,sp){const f=1+ind.form*.25,lv=ind.level;const baseMight=sp.might??sp.power??50,basePower=sp.energyPower??sp.power??50;const calc=(base,key,growth)=>Math.floor((base+lv*growth+genetics(ind,key)+Math.floor(effort(ind,key)/4)+(key==='might'?(ind.trained||0):0))*f*natureFactor(ind,key));const might=calc(baseMight,'might',3);const item=heldEquipment(ind,sp),bonus=item?.bonus?[item.bonus,1+item.amount/100]:null;const result={hp:Math.floor((sp.health+lv*5+genetics(ind,'hp')+Math.floor(effort(ind,'hp')/4))*f),might,defense:calc(sp.defense??baseMight,'defense',3),power:calc(basePower,'power',3),resistance:calc(sp.resistance??basePower,'resistance',3),...resourceMaximums(ind,sp),speed:Math.floor((sp.speed+lv*2+genetics(ind,'speed')+Math.floor(effort(ind,'speed')/4))*natureFactor(ind,'speed'))};if(bonus)result[bonus[0]]=Math.floor(result[bonus[0]]*bonus[1]);for(const [stat,percent]of Object.entries(item?.stats||{}))if(Number.isFinite(percent)&&stat in result&&stat!=='pp'&&stat!=='willpower')result[stat]=Math.floor(result[stat]*(1+clamp(percent,-30,35)/100));const focus={Guardian:['defense','resistance'],Striker:['might','power'],Mystic:['power'],Sprinter:['speed','speed']}[ind.specialty];if(focus)for(const stat of new Set(focus))result[stat]=Math.floor(result[stat]*1.1);if(ind.rareVariant)result.hp=Math.floor(result.hp*1.04);for(const [stat,multiplier]of ASPECTS[ind.aspect]?.stats||[])result[stat]=Math.floor(result[stat]*multiplier);const vitality=passiveEffects(sp,ind,{maxHp:result.hp,weather:ind.battlefield?.weather});result.hp=Math.floor(result.hp*(1+Math.min(.5,vitality.maxHp||0)));const mobility=passiveEffects(sp,ind,{maxHp:result.hp,weather:ind.battlefield?.weather});result.speed=Math.max(1,Math.floor(result.speed*(1+Math.min(.5,mobility.speed||0))));return result;}
export function heal(ind,sp){ensureIndividualPassives(sp,ind);delete ind.afflictions;resetCombat(ind);ind.hp=stats(ind,sp).hp;ind.pp=stats(ind,sp).pp;ind.willpower=stats(ind,sp).willpower;ind.status=null;ind.statusTurns=0;ind.resourceRevision=1;ind.resourceCaps=resourceMaximums(ind,sp);return ind;}
// Unlisted matchups stay neutral. No moral alignment is inferred from a type.
export const ADVANTAGE={"Aberration":["Celestial"],"Beast":["Fey"],"Celestial":["Fiend","Undead"],"Construct":["Beast","Undead"],"Elemental":["Plant","Construct"],"Fey":["Giant","Aberration"],"Fiend":["Fey","Celestial"],"Giant":["Construct","Monstrosity"],"Monstrosity":["Beast"],"Ooze":["Construct","Giant"],"Plant":["Ooze","Elemental"],"Undead":["Plant"]};
export const RESIST={"Aberration":["Fey"],"Beast":["Plant","Ooze"],"Celestial":["Celestial","Undead"],"Construct":["Beast","Plant"],"Elemental":["Elemental","Construct"],"Fey":["Beast","Giant"],"Fiend":["Undead","Aberration"],"Giant":["Beast","Ooze"],"Monstrosity":["Giant","Fiend"],"Ooze":["Plant","Fiend"],"Plant":["Ooze","Elemental"],"Undead":["Undead"]};
// Curated lore-driven relationships. Resistance is indexed by defending domain.
export const DOMAIN_ADVANTAGE={"Air":["Earth","Sorrow"],"Earth":["Lightning","Metal"],"Fire":["Ice","Despair"],"Water":["Fire","Earth"],"Light":["Dark","Nightmares"],"Dark":["Hope","Dreams"],"Sun":["Dark","Nightmares"],"Moon":["Sun","Fear"],"Lightning":["Water","Metal"],"Ice":["Air","Water"],"Metal":["Ice","War"],"Chaos":["Law","Fate"],"Law":["Chaos","Wrath"],"Good":["Evil","Fear"],"Evil":["Love","Hope"],"Creation":["Destruction","Despair"],"Destruction":["Metal","Creation"],"War":["Peace","Creation"],"Peace":["Wrath","Fear"],"Fear":["Hope","Love"],"Wrath":["Peace","Sorrow"],"Love":["Sorrow","Evil"],"Hope":["Despair","Nightmares"],"Despair":["Dreams","Love"],"Sorrow":["Wrath","Hope"],"Fate":["Chaos","Dreams"],"Dreams":["Nightmares","Law"],"Nightmares":["Peace","Fear"],"Life":["Death","Despair"],"Death":["Life","Hope"],"Spirit":["Nightmares","Evil"],"Psionic":["Fear","Chaos"],"Nature":["Earth","Water"],"Void":["Creation","Magic"],"Storm":["Air","Water"],"Magic":["Law","Void"]};
export const DOMAIN_RESIST={"Air":["Earth","Sorrow"],"Earth":["Lightning","Metal"],"Fire":["Ice","Despair"],"Water":["Earth","Fire"],"Light":["Dark","Nightmares"],"Dark":["Hope","Dreams"],"Sun":["Dark","Nightmares"],"Moon":["Sun","Fear"],"Lightning":["Water","Metal"],"Ice":["Air","Water"],"Metal":["Ice","War"],"Chaos":["Air","Earth"],"Law":["Wrath","Air"],"Good":["Evil","Fear"],"Evil":["Hope","Air"],"Creation":["Despair","Air"],"Destruction":["Metal","Air"],"War":["Creation","Peace"],"Peace":["Fear","Air"],"Fear":["Love","Hope"],"Wrath":["Air","Earth"],"Love":["Sorrow","Air"],"Hope":["Despair","Nightmares"],"Despair":["Love","Dreams"],"Sorrow":["Hope","Earth"],"Fate":["Dreams","Air"],"Dreams":["Law","Nightmares"],"Nightmares":["Peace","Fear"],"Life":["Earth","Sorrow"],"Death":["Earth","Love"],"Spirit":["Fear","Nightmares"],"Psionic":["Fear","Dreams"],"Nature":["Water","Earth"],"Void":["Creation","Law"],"Storm":["Air","Lightning"],"Magic":["Chaos","Law"]};
export const DOMAIN_IDENTITY={"Air":"Mobility and evasion","Earth":"Defense and stability","Fire":"Burning and sustained damage","Water":"Cleansing and recovery","Light":"Revelation and protection","Dark":"Concealment and weakening","Sun":"Empowerment and purification","Moon":"Illusion and transformation","Lightning":"Speed and interruption","Ice":"Slowing and freezing","Metal":"Armor and resilience","Chaos":"Unpredictable transformations","Law":"Restriction and suppression","Good":"Protection and restoration","Evil":"Corruption and draining","Creation":"Summoning and regeneration","Destruction":"Breaking defenses","War":"Offensive momentum","Peace":"Prevention and pacification","Fear":"Intimidation and disruption","Wrath":"Escalating aggression","Love":"Bonding and support","Hope":"Recovery and perseverance","Despair":"Weakening and attrition","Sorrow":"Exhaustion and lingering effects","Fate":"Destiny and temporal control","Dreams":"Sleep and altered perception","Nightmares":"Terror and confusion","Life":"Regeneration and vitality","Death":"Decay and mortality","Spirit":"Soul attunement and exorcism","Psionic":"Psychic influence and telekinesis","Nature":"Primal adaptation","Void":"Nullification and dimensional control","Storm":"Weather escalation","Magic":"Arcane manipulation and spell disruption"};
export function activeDomains(sp,ind=null){return domainSources(sp,ind).all;}
export function effectiveness(move,defender,ind=null){
 // Independent classifications contribute additively, with one global cap.
 let modifier=0;
 const attackTypes=new Set([move.type,...(move.types||[])].filter(t=>TYPES.includes(t)));
 const attackDomains=new Set([move.domain,...(move.domains||[])].filter(Boolean).map(canonicalDomain));
 const defenseTypes=new Set(activeTypes(defender,ind));
 const defenseDomains=new Set(activeDomains(defender,ind));
 for(const attackType of attackTypes)for(const t of defenseTypes){
  if(ADVANTAGE[attackType]?.includes(t))modifier+=.5;
  if(RESIST[t]?.includes(attackType))modifier-=.25;
 }
 for(const domain of attackDomains)for(const d of defenseDomains){
  if(DOMAIN_ADVANTAGE[domain]?.includes(d))modifier+=.5;
  if(DOMAIN_RESIST[d]?.includes(domain))modifier-=.25;
 }
 if(attackDomains.has('Fire')&&defenseTypes.has('Plant'))modifier+=.5;
 return clamp(1+modifier,.5,2);
}
export function matchingClassificationBonus(move,attacker,sp){
 const types=new Set([move.type,...(move.types||[])].filter(Boolean));
 const domains=new Set([move.domain,...(move.domains||[])].filter(Boolean).map(canonicalDomain));
 const matchedTypes=activeTypes(sp,attacker).filter(t=>types.has(t)).length;
 const matchedDomains=[...domains].filter(d=>activeDomains(sp,attacker).includes(d)).length;
 let bonus=(matchedTypes>=1?.10:0)+(matchedTypes>=2?.05:0);
 for(let i=0;i<matchedDomains;i++)bonus+=.10/(2**i);
 return 1+Math.min(.25,bonus);
}
export const STYLES={normal:{damage:1,speed:0},agile:{damage:.8,speed:22},strong:{damage:1.25,speed:-22}};
export const STATUS_EFFECTS=['burn','freeze','paralysis','poison','toxic','sleep','confusion','infatuation','flinch','frostbite','nightmare','trap','leechSeed','curse','perish','disable','taunt','slow'];
const MAJOR=new Set(['burn','freeze','paralysis','poison','toxic','sleep','frostbite']);
const STAGE_KEYS={boostMight:['might',1],boostPower:['power',1],boostDefense:['defense',1],boostResistance:['resistance',1],boostSpeed:['speed',1],boostAccuracy:['accuracy',1],boostEvasion:['evasion',1],lowerMight:['might',-1],lowerPower:['power',-1],lowerDefense:['defense',-1],lowerResistance:['resistance',-1],lowerSpeed:['speed',-1],lowerAccuracy:['accuracy',-1]};
const SUPPORT=new Set(['heal','rest','fullheal','cleanse','protect','ward','reflect','lightscreen','safeguard','regenerate','auroraVeil','focus','batonPass','bellyDrum','destinyBond','teamHeal','teamWard']);
const VOLATILES=['itemMoveLock','conditions','conditionSources','stages','ward','wardTurns','wardStrength','reflect','lightscreen','safeguard','screens','hazards','realtimeNow','controlImmuneUntil','pendingMove','lockedMove','rampageTurns','recharging','focused','disabledMove','lastMove','lastHit','switchRequested','passStages','tookDamageThisRound','forcedDisplacement','delayedDamage','battleStyle','battlefield','battleSide','entryAction','protect','destinyBond','toxicTurns','spiritualBuffs','spiritualShields','spiritualLinks','spiritualEnergyEmpty'];
export const SUPPORTED_EFFECTS=[null,...STATUS_EFFECTS,...Object.keys(STAGE_KEYS),...SUPPORT,'partyCleanse','haze','swapStats','invertStats','clearHazards','spikes','toxicSpikes','stealthRock','stickyWeb','counter','mirrorCoat','priority','sureHit','breakWard','multiHit','doubleHit','drain','recoil','struggle','recharge','unburdened','critical','omniBoost','selfDebuff','revenge','partyStrike','twoTurn','chargeSun','rampage','pivot','forceSwitch','sunStrike','weatherStrike','sandStrike','snowStrike','weatherRain','weatherSun','weatherSand','weatherSnow','terrainGrass','terrainElectric','terrainPsychic','terrainMisty','terrainStrike','electricStrike','psychicStrike','mistStrike','delayedStrike','sleepStrike','hexStrike','venomStrike'];
function stage(ind,key){return ind.stages?.[key]||0;}
export function stageFactor(n){return n>=0?(2+n)/2:2/(2-n);}
const nameOf=(u,sp)=>sp.forms[u.appearance]||sp.forms[0];
const screenState=(u)=>u.battlefield?.sides?.[u.battleSide]?.screens||u.screens||{};
const hazardState=(u)=>u.battlefield?.sides?.[u.battleSide]?.hazards||u.hazards||{};
const living=team=>(team||[]).filter(u=>u.hp>0);
function healHP(u,sp,amount){const before=u.hp;u.hp=Math.min(stats(u,sp).hp,u.hp+Math.max(0,Math.floor(amount)));return u.hp-before;}
export function resetCombat(ind){for(const key of VOLATILES)delete ind[key];for(const effect of Object.keys(ind.afflictions?.conditions||{})){ind.conditions??={};ind.conditions[effect]=1;}ind.secondWindUsed=false;ind.omegaUsed=false;ind.itemTriggered=false;ind.aspectEntryUsed=false;delete ind.itemCooldowns;delete ind.itemFlags;ind.itemRounds=0;return ind;}
export function bindBattlefield(allies,enemies,field=null){
 field??=allies.find(u=>u.battlefield)?.battlefield||enemies.find(u=>u.battlefield)?.battlefield||{};
 field.sides??={};for(const [side,team] of [['a',allies],['b',enemies]]){field.sides[side]??={hazards:{},screens:{}};for(const u of team){u.battleSide=side;u.battlefield=field;for(const key of ['reflect','lightscreen','safeguard'])if(u[key]){field.sides[side].screens[key]??=5;delete u[key];}for(const [key,value]of Object.entries(u.hazards||{}))field.sides[side].hazards[key]=Math.max(field.sides[side].hazards[key]||0,Number(value)||0);delete u.hazards;}}
 return field;
}
export function enterBattle(ind,sp,field,side,log=[]){ind.battlefield=field;ind.battleSide=side;ind.entryAction=true;
 if(ind.aspect==='Astral'&&!ind.aspectEntryUsed&&ind.status){ind.status=null;ind.statusTurns=0;ind.aspectEntryUsed=true;log.push(nameOf(ind,sp)+' sheds its affliction in astral light.');}
 triggerEquipment(ind,sp,log);return log;
}
export function switchUnits(out,incoming,sp,options={}){
 const forced=!!options.forced,log=[];
 if(!incoming||incoming.hp<=0||incoming.id===out.id)return {ok:false,log:['No eligible reserve Spirimon.']};
 if(!forced&&out.hp>0&&out.conditions?.trap&&!out.passStages)return {ok:false,log:['The binding prevents a voluntary switch.']};
 if(forced&&out.hp>0&&(out.aspect==='Titan'||hasHook(out,'anchor',options.outSpecies||sp)))return {ok:false,log:[nameOf(out,options.outSpecies||sp)+' holds its ground.']};
 const field=out.battlefield,side=out.battleSide,stages=out.passStages?{...(out.stages||{})}:null;
 if(out.hp>0&&hasHook(out,'regenerator',options.outSpecies||sp))healHP(out,options.outSpecies||sp,stats(out,options.outSpecies||sp).hp/5);
 const once={itemTriggered:out.itemTriggered,secondWindUsed:out.secondWindUsed,omegaUsed:out.omegaUsed,aspectEntryUsed:out.aspectEntryUsed,itemFlags:out.itemFlags,itemCooldowns:out.itemCooldowns,itemRounds:out.itemRounds};resetCombat(out);Object.assign(out,once);
 const incomingOnce={itemTriggered:incoming.itemTriggered,secondWindUsed:incoming.secondWindUsed,omegaUsed:incoming.omegaUsed,aspectEntryUsed:incoming.aspectEntryUsed,itemFlags:incoming.itemFlags,itemCooldowns:incoming.itemCooldowns,itemRounds:incoming.itemRounds};resetCombat(incoming);Object.assign(incoming,incomingOnce);if(stages)incoming.stages=stages;
 enterBattle(incoming,sp,field,side,log);log.push(nameOf(incoming,sp)+' enters the battle.');
 const h=hazardState(incoming),max=stats(incoming,sp).hp;
 if(!hasHook(incoming,'boots',sp)){
  let loss=0;if(h.spikes)loss+=Math.floor(max*[0,1/8,1/6,1/4][Math.min(3,h.spikes)]);if(h.stealthRock)loss+=Math.floor(max/8);
  if(loss){const before=incoming.hp;incoming.hp=Math.max(0,incoming.hp-Math.max(1,loss));options.onDamage?.(incoming,{amount:Math.min(before,Math.max(1,loss)),periodic:true,hits:(h.spikes?1:0)+(h.stealthRock?1:0)});log.push('Entry hazards deal '+loss+' damage.');}
  if(incoming.hp>0&&h.toxicSpikes)applyCondition(incoming,h.toxicSpikes>=2?'toxic':'poison',()=>0,sp,log);
  if(h.stickyWeb&&incoming.aspect!=='Swift'){incoming.stages??={};incoming.stages.speed=clamp(stage(incoming,'speed')-1,-6,6);log.push('The sticky web slows '+nameOf(incoming,sp)+'.');}
 }
 triggerEquipment(incoming,sp,log);return {ok:true,log};
}
export function priority(ind,sp,move,style='normal'){
 const slowed=ind.status==='slow'||ind.conditions?.slow;
 return Math.floor(stats(ind,sp).speed*stageFactor(stage(ind,'speed'))*(ind.status==='paralysis'?.5:1))+(STYLES[style]||STYLES.normal).speed-(slowed?18:0)+(hasHook(ind,'firstWind',sp)&&ind.hp>=stats(ind,sp).hp?12:0)+(ind.aspect==='Swift'&&ind.entryAction?12:0)+(move.effect==='priority'?100000:['counter','mirrorCoat'].includes(move.effect)?-100000:0);
}
export function hitChance(actor,target,move,style='normal',asp=null){
 if(['sureHit','struggle'].includes(move.effect))return 1;
 const accuracy=move.accuracy??.9,net=stage(actor,'accuracy')-stage(target,'evasion');
 return clamp(accuracy*(net>=0?(3+net)/3:3/(3-net))+(style==='agile'?.15:0)-(target.battleStyle==='agile'?.15:0)+(hasHook(actor,'accuracy',asp)?.1:0)+(asp?passiveEffects(asp,actor,{maxHp:stats(actor,asp).hp,move,weather:actor.battlefield?.weather}).accuracy||0:0),.05,1);
}
export function damage(attacker,asp,defender,dsp,move,style='normal',r=Math.random){
 const a=stats(attacker,asp),d=stats(defender,dsp),energy=moveCategory(move)==='Energy';
 const offense=(energy?a.power:a.might)*(.25+(attacker.commit??.5)*1.5)*stageFactor(stage(attacker,energy?'power':'might'));
 const defense=(energy?d.resistance:d.defense)*(.25+(1-(defender.commit??.5))*1.5)*stageFactor(stage(defender,energy?'resistance':'defense'));
 const same=matchingClassificationBonus(move,attacker,asp);
 const attackPassives=passiveEffects(asp,attacker,{maxHp:a.hp,move,target:defender,targetMaxHp:d.hp,weather:attacker.battlefield?.weather}),defensePassives=passiveEffects(dsp,defender,{maxHp:d.hp,incomingMove:move,weather:defender.battlefield?.weather});
 const passiveDamage=(1+(attackPassives[energy?'energyDamage':'physicalDamage']||0))*(1-Math.min(.5,defensePassives.damageReduction||0));
 let amount=((2*attacker.level/5+2)*move.power*(offense/Math.max(1,defense))/24+2)*(STYLES[style]||STYLES.normal).damage*effectiveness(move,dsp,defender)*(energy?dsp.spiritualRes??1:dsp.physicalRes??1)*same*passiveDamage*(.9+r()*.1)*(defender.ward?1-.45*(defender.wardStrength??1):1);
 if(asp.ability==='Wildheart'&&!energy||asp.ability==='Soulweave'&&energy)amount*=1.12;
 if(dsp.ability==='Steadfast'&&(defender.commit??.5)<=.4)amount*=.9;
 if(attacker.status==='burn'&&!energy||attacker.status==='frostbite'&&energy)amount*=.5;
 const screens=screenState(defender);if(energy&&(screens.lightscreen||defender.lightscreen)||!energy&&(screens.reflect||defender.reflect))amount*=.5;
 if(hasHook(attacker,'physicalEdge',asp)&&!energy)amount*=1.15;if(hasHook(defender,'energyGuard',dsp)&&energy)amount*=.85;if(hasHook(attacker,'domainBoost',asp)&&move.domain===heldEquipment(attacker,asp)?.domain)amount*=1.2;if(hasHook(attacker,'lifeOrb',asp))amount*=1.2;if(hasHook(defender,'anchor',dsp)&&!energy)amount*=.9;
 if(attacker.aspect==='Primal'&&!energy&&attacker.hp<a.hp/2)amount*=1.15;
 if(attacker.aspect==='Umbral'&&(defender.status||Object.keys(defender.conditions||{}).length))amount*=1.15;
 const field=attacker.battlefield||{};
 if(attacker.aspect==='Stormbound'&&['rain','snow'].includes(field.weather)&&['Water','Storm','Lightning','Ice'].includes(move.domain))amount*=1.15;
 amount*=(1-exhaustion(attacker))*(1+exhaustion(defender))*spiritualMultiplier(attacker,'empower')/spiritualMultiplier(defender,'empower')*spiritualDefense(defender,move,energy?'Energy':'Physical');
 return Math.max(1,Math.floor(amount));
}
function applyCondition(target,effect,r=Math.random,sp=null,log=[],source=null){
 if(spiritualBonus(target,'immunity').length){log.push('Spiritual sanctuary prevents '+effect+'.');return false;}
 if(source?.realtimeNow!=null&&['sleep','freeze','flinch'].includes(effect)&&(target.controlImmuneUntil||0)>source.realtimeNow)return false;
 const field=target.battlefield||{},screens=screenState(target);if(effect==='nightmare'&&target.status!=='sleep'||effect==='disable'&&!target.lastMove)return false;
 if(target.safeguard||screens.safeguard||target.ward||field.terrain==='misty'||effect==='sleep'&&field.terrain==='electric')return false;
 if(hasHook(target,'statusGuard',sp)&&!itemOnceUsed(target,'statusGuard')){markItemUsed(target,'statusGuard');log.push('Warding Bell turns aside the affliction.');return false;}
 if(r()>=statusChance(1,effect,sp||{},{...target,maxHp:sp?stats(target,sp).hp:target.maxHp}))return false;
 if(effect==='slow'){target.conditions??={};target.conditions.slow=2;return true;}
 if(MAJOR.has(effect)){if(target.status&&target.status!==effect)return false;target.status=effect;target.statusTurns=effect==='sleep'?2+Math.floor(r()*2):effect==='freeze'?3:0;target.toxicTurns=0;}
 else{target.conditions??={};target.conditions[effect]=effect==='confusion'?2+Math.floor(r()*3):effect==='trap'?4:effect==='perish'?3:effect==='flinch'?1:effect==='leechSeed'||effect==='curse'?99:3;target.conditionSources??={};if(source)target.conditionSources[effect]=source.id;}
 if(sp)triggerEquipment(target,sp,log);return true;
}
export function refreshCombatEquipment(ind,sp,log=[]){triggerEquipment(ind,sp,log);}
function triggerEquipment(ind,sp,log){
 const item=heldEquipment(ind,sp);if(!item||ind.hp<=0)return;
 let triggered=false;
 if(itemHasHook(item,'healBerry')&&ind.hp<=stats(ind,sp).hp/3){healHP(ind,sp,stats(ind,sp).hp*(item.recovery||1/3));triggered=true;}
 if(itemHasHook(item,'resourceBerry')){const caps=resourceMaximums(ind,sp);if((ind.pp||0)<=caps.pp/4&&(ind.willpower||0)<=caps.willpower/4){ind.pp=Math.min(caps.pp,(ind.pp||0)+(item.resourceRecovery||10));ind.willpower=Math.min(caps.willpower,(ind.willpower||0)+(item.resourceRecovery||10));triggered=true;}}
 if(itemHasHook(item,'cleanseBerry')&&(ind.status||Object.keys(ind.conditions||{}).length)){ind.status=null;ind.statusTurns=0;ind.conditions={};triggered=true;}
 if(ind.hp<=stats(ind,sp).hp/3){if(itemHasHook(item,'pinchWard')&&!ind.ward){ind.ward=true;ind.wardTurns=3;triggered=true;}if(itemHasHook(item,'pinchMight')&&stage(ind,'might')<6){ind.stages??={};ind.stages.might=clamp(stage(ind,'might')+(item.stageRecovery||1),-6,6);triggered=true;}if(itemHasHook(item,'pinchPower')&&!ind.focused){ind.focused=true;triggered=true;}}
 if(triggered){log.push(nameOf(ind,sp)+' consumes '+item.name+'.');consumeHeldItem(ind);}
}
export function moveTarget(move){
 if(move.target)return move.target;
 if(['partyCleanse','teamHeal','teamWard'].includes(move.effect))return 'allAllies';
 if(['heal','cleanse','ward','protect','regenerate'].includes(move.effect))return 'ally';
 if(SUPPORT.has(move.effect)||STAGE_KEYS[move.effect]?.[1]>0)return 'self';
 if(move.power===0&&(move.effect?.startsWith('weather')||move.effect?.startsWith('terrain'))||['haze','invertStats'].includes(move.effect))return 'field';
 return 'opponent';
}
export function executeAction(actor,asp,target,tsp,move,style='normal',commit=.5,r=Math.random,costScale=1,context={}){
 const log=[],name=nameOf(actor,asp);if(actor.hp<=0||!target||target.hp<=0)return log;
 actor.conditions??={};target.conditions??={};actor.commit=clamp(commit??.5,0,1);actor.battleStyle=style;
 if(actor.status==='sleep'&&actor.statusTurns>0){log.push(name+' is asleep.');return log;}
 if(actor.status==='freeze'){if(r()<.2||actor.statusTurns<=0){actor.status=null;log.push(name+' thaws.');}else{log.push(name+' is frozen.');return log;}}
 if(actor.conditions.flinch){delete actor.conditions.flinch;log.push(name+' flinches.');return log;}
 if(actor.recharging){actor.recharging=false;log.push(name+' recharges.');return log;}
 if(actor.status==='paralysis'&&r()<.25||actor.conditions.infatuation&&r()<.5){log.push(name+' cannot act.');return log;}
 if(actor.conditions.confusion&&r()<.33){const loss=Math.max(1,Math.floor(stats(actor,asp).hp/12));const hpBefore=actor.hp;actor.hp=Math.max(0,actor.hp-loss);context.onDamage?.(actor,{amount:hpBefore-actor.hp,periodic:true});log.push(name+' hurts itself in confusion for '+loss+'.');return log;}
 const releasing=!!actor.pendingMove;move=context.realTime||context.prepaid||context.heldAction?move:battleMove(actor,asp,move,tsp);
 if(!move){log.push(name+' cannot use that exhausted technique. Choose another move.');return log;}
 const effect=move.effect,category=moveCategory(move),field=actor.battlefield||target.battlefield||{};actor.battlefield=target.battlefield=field;
 if(actor.conditions.taunt&&category==='Status'){log.push(name+' cannot use a support technique while silenced.');return log;}
 if(actor.conditions.disable&&actor.disabledMove===move.id){log.push(name+' cannot use the sealed technique.');return log;}
 if(!releasing&&!context.prepaid&&move.id!=='struggle'&&!canUseMove(actor,asp,move,context.pressure?{ability:'Pressure'}:tsp)){log.push(name+' cannot fund the technique.');return log;}
 if(move.id==='struggle')log.push(name+' is forced to use Struggle.');
 else if(!releasing&&!context.prepaid){const key=category==='Physical'?'pp':'willpower',other=key==='pp'?'willpower':'pp';normalizeResources(actor,asp);const cost=moveCost(move,context.pressure?{ability:'Pressure'}:tsp),native=Math.min(actor[key],cost);actor[key]-=native;const needed=cost-native;if(needed&&actor[other]>=2){const used=Math.min(actor[other],needed*2);actor[other]-=used;log.push(name+' converts '+used+' '+(other==='pp'?'Stanima':'Willpower')+'.');}}
 actor.lastMove=move.id;actor.entryAction=false;context.funded=true;if(hasHook(actor,'choiceLock',asp))actor.itemMoveLock??=move.id;
 const targetName=nameOf(target,tsp),accuracy=hitChance(actor,target,move,style,asp),friendly=context.friendly===true;
 const support=friendly?target:actor,supportSp=friendly?tsp:asp;
 if(category==='Status'){
  if(effect==='itemResources'){const caps=stats(support,supportSp),amount=context.heldItem?.resourceRecovery||10;support.pp=Math.min(caps.pp,(support.pp||0)+amount);support.willpower=Math.min(caps.willpower,(support.willpower||0)+amount);log.push(name+' restores '+nameOf(support,supportSp)+'’s Stanima and Willpower.');return log;}
  if(effect==='teamHeal'||effect==='teamWard'){for(const u of living(context.alliedActive||[actor])){if(effect==='teamHeal')healHP(u,context.speciesOf?context.speciesOf(u):asp,stats(u,context.speciesOf?context.speciesOf(u):asp).hp*(context.healingFraction||.2)*(1-exhaustion(actor)));else{u.ward=true;u.wardTurns=1;u.wardStrength=1-exhaustion(actor);}}log.push(name+' surrounds its allies with '+(effect==='teamHeal'?'renewing light.':'a shared ward.'));return log;}
  if(effect?.startsWith('weather')){field.weather=effect.slice(7).toLowerCase();field.weatherTurns=hasHook(actor,'weather',asp)?8:5;log.push(name+' summons '+field.weather+' weather.');return log;}
  if(effect?.startsWith('terrain')){field.terrain=effect.slice(7).toLowerCase();field.terrainTurns=hasHook(actor,'weather',asp)?8:5;log.push(name+' creates '+field.terrain+' terrain.');return log;}
  if(['heal','rest','fullheal'].includes(effect)){healHP(support,supportSp,stats(support,supportSp).hp*(1-exhaustion(actor))*(effect==='heal'?(context.heldItem?.recovery||context.healingFraction||.25):context.realTime?(context.healingFraction||1):1));if(effect!=='heal'){support.status=effect==='rest'?'sleep':null;support.statusTurns=effect==='rest'?2:0;}log.push(name+' restores '+nameOf(support,supportSp)+'’s vitality.');return log;}
  if(effect==='cleanse'||effect==='partyCleanse'){for(const u of effect==='partyCleanse'?(context.actorTeam||[actor]):[support]){u.status=null;u.statusTurns=0;u.conditions={};u.conditionSources={};}log.push(name+' cleanses '+(effect==='partyCleanse'?'the whole team':'its ally')+'.');return log;}
  if(effect==='ward'||effect==='protect'){support.ward=true;support.wardTurns=effect==='protect'?1:3;support.wardStrength=1-exhaustion(actor);log.push(name+' raises a protective ward.');return log;}
  if(['reflect','lightscreen','safeguard','auroraVeil'].includes(effect)){
   if(effect==='auroraVeil'&&field.weather!=='snow'){log.push('A snowstorm is required.');return log;}
   const screens=field.sides?.[actor.battleSide]?.screens||(actor.screens??={}),duration=hasHook(actor,'screens',asp)?8:5;
   for(const key of effect==='auroraVeil'?['reflect','lightscreen']:[effect])screens[key]=duration;
   log.push(name+' raises '+move.name+'.');return log;
  }
  if(effect==='regenerate'){support.conditions??={};support.conditions.regenerate=5;log.push(name+' begins a renewing current.');return log;}
  if(effect==='focus'){actor.focused=true;log.push(name+' gathers focus.');return log;}
  if(effect==='bellyDrum'){const sacrifice=Math.floor(stats(actor,asp).hp/2);if(actor.hp<=sacrifice){log.push(name+' lacks the vitality for the rite.');return log;}actor.hp-=sacrifice;actor.stages??={};actor.stages.might=6;log.push(name+' sacrifices vitality for maximum Might.');triggerEquipment(actor,asp,log);return log;}
  if(effect==='batonPass'){actor.switchRequested=true;actor.passStages=true;log.push(name+' prepares to pass its strength.');return log;}
  if(effect==='destinyBond'){actor.conditions.destinyBond=2;log.push(name+' binds its fate to its attacker.');return log;}
  if(effect==='haze'){for(const u of context.activeUnits||[actor,target])u.stages={};log.push('All combat modifiers are dispelled.');return log;}
  if(effect==='swapStats'){[actor.stages,target.stages]=[target.stages||{},actor.stages||{}];log.push('Combat modifiers are exchanged.');return log;}
  if(effect==='invertStats'){for(const u of context.activeUnits||[actor,target])for(const key of Object.keys(u.stages||{}))u.stages[key]*=-1;log.push('Combat modifiers are inverted.');return log;}
  if(effect==='clearHazards'){const side=field.sides?.[actor.battleSide];if(side)side.hazards={};actor.hazards={};log.push(name+' clears its side’s entry hazards.');return log;}
  if(['spikes','toxicSpikes','stealthRock','stickyWeb'].includes(effect)){const h=field.sides?.[target.battleSide]?.hazards||(target.hazards??={});h[effect]=Math.min(effect==='spikes'?3:effect==='toxicSpikes'?2:1,(h[effect]||0)+1);log.push(name+' sets '+move.name+'.');return log;}
  const change=STAGE_KEYS[effect];if(change){const recipient=change[1]>0?support:target;if(recipient===target&&!friendly&&change[1]<0&&r()>=accuracy){log.push(name+' misses.');return log;}recipient.stages??={};recipient.stages[change[0]]=clamp(stage(recipient,change[0])+change[1],-6,6);log.push(name+' changes '+(recipient===actor?'its':nameOf(recipient,recipient===target?tsp:asp)+'’s')+' '+change[0]+'.');return log;}
  if(STATUS_EFFECTS.includes(effect)){if(r()<accuracy&&applyCondition(target,effect,r,tsp,log,actor)){if(effect==='disable')target.disabledMove=target.lastMove;log.push(targetName+' is affected by '+effect+'.');}else log.push(name+' fails to inflict '+effect+'.');return log;}
  throw Error('Unimplemented move effect: '+effect);
 }
 if(effect==='sleepStrike'&&target.status!=='sleep'){log.push('The target must be asleep.');return log;}
 if(field.terrain==='psychic'&&effect==='priority'){log.push('Psychic terrain turns aside the priority attack.');return log;}
 if(!context.realTime&&['twoTurn','chargeSun'].includes(effect)&&!actor.pendingMove&&!(effect==='chargeSun'&&field.weather==='sun')){actor.pendingMove={...move};log.push(name+' prepares '+move.name+'.');return log;}
 if(actor.pendingMove)actor.pendingMove=null;
 if(r()>=accuracy&&effect!=='sureHit'&&effect!=='struggle'){log.push(name+' uses '+move.name+' but misses.');return log;}
 let partialWard=1;if(target.ward&&!['breakWard','struggle','delayedStrike'].includes(effect)){const strength=target.wardStrength??1;target.ward=false;if(strength>=1){log.push(targetName+' blocks the attack with a ward.');return log;}partialWard=Math.max(0,1-strength);log.push(targetName+' softens the attack with an exhausted ward.');}
 if(effect==='breakWard'){target.ward=false;const screens=screenState(target);delete screens.reflect;delete screens.lightscreen;target.reflect=target.lightscreen=false;}
 const critical=r()<Math.min(1,(effect==='critical'?.25:style==='strong'?.15:.05)+(style==='agile'?.10:0)+(hasHook(actor,'critical',asp)?.125:0)),hits=effect==='multiHit'?2+Math.floor(r()*4):effect==='doubleHit'?2:1;
 const damageTarget=effect==='delayedStrike'?{...target,ward:false}:target;
 const hitAmounts=[];for(let n=0;n<hits;n++)hitAmounts.push(Math.max(1,Math.floor(damage(actor,asp,damageTarget,tsp,move,style,r)*(critical?1.5:1))));
 let amount=hitAmounts.reduce((sum,n)=>sum+n,0);
 const weather=field.weather,terrain=field.terrain;
 if(weather==='rain'&&move.domain==='Water'||weather==='sun'&&move.domain==='Fire')amount=Math.floor(amount*1.5);
 if(weather==='rain'&&move.domain==='Fire'||weather==='sun'&&move.domain==='Water')amount=Math.max(1,Math.floor(amount*.5));
 if(effect==='weatherStrike'&&weather==='rain'||effect==='sunStrike'&&weather==='sun'||effect==='sandStrike'&&weather==='sand'||effect==='snowStrike'&&weather==='snow'||effect==='terrainStrike'&&terrain==='grass'||effect==='electricStrike'&&terrain==='electric'||effect==='psychicStrike'&&terrain==='psychic'||effect==='mistStrike'&&terrain==='misty'||effect==='venomStrike'&&['poison','toxic'].includes(target.status)||effect==='hexStrike'&&target.status)amount=Math.floor(amount*1.5);
 if(effect==='unburdened'&&!heldEquipment(actor,asp))amount*=2;
 if(effect==='revenge'&&actor.tookDamageThisRound)amount*=2;
 if(effect==='partyStrike')amount=Math.floor(amount*(1+.15*Math.min(5,living(context.actorTeam||[actor]).length-1)));
 if(effect==='counter'||effect==='mirrorCoat'){const hit=actor.lastHit;if(!hit||hit.source!==target.id||hit.category!==(effect==='counter'?'Physical':'Energy')){log.push(name+' has nothing to retaliate against.');return log;}amount=hit.amount*2;}
 if(actor.focused){amount=Math.floor(amount*1.5);actor.focused=false;}
 if(effect==='delayedStrike'){target.delayedDamage={amount:amount/directProtection(target,move,category),turns:2,category,source:actor.id,move:{id:move.id,domain:move.domain}};log.push(name+' sets a delayed thunder omen.');return log;}
 amount=Math.max(1,Math.floor(amount*partialWard));const before=target.hp;if(hasHook(target,'survive',tsp)&&!itemOnceUsed(target,'survive')&&before>=stats(target,tsp).hp&&amount>=before){amount=before-1;markItemUsed(target,'survive');log.push('Last-light Band holds '+targetName+' at 1 HP.');}
 const total=hitAmounts.reduce((sum,n)=>sum+n,0);let cumulative=0,allocated=0,damagingHits=0,remaining=0;
 for(const hitAmount of hitAmounts){cumulative+=hitAmount;const boundary=Math.floor(amount*cumulative/total),hit=shieldDamage(target,boundary-allocated);allocated=boundary;if(hit>0&&remaining<before)damagingHits++;remaining+=hit;}
 amount=remaining;
 const link=(target.spiritualLinks||[]).find(l=>l.until>(target.realtimeNow||0));
 if(link&&context.activeUnits){const partner=context.activeUnits.find(u=>u.id===link.partner&&u.hp>0&&u!==target);if(partner){const shared=Math.min(Math.floor(amount*link.amount),Math.max(0,partner.hp-1));partner.hp-=shared;amount-=shared;if(shared>0)context.onDamage?.(partner,{amount:shared,hits:Math.min(damagingHits,shared)});}}
 target.hp=Math.max(0,target.hp-amount);const dealt=before-target.hp;target.tookDamageThisRound=true;target.lastHit={amount:dealt,category,source:actor.id};target.ward=false;
 if(dealt>0)context.onDamage?.(target,{amount:dealt,hits:Math.min(damagingHits,dealt),disruption:moveCooldownDisruption(move)});
 log.push(name+' uses '+move.name+': '+dealt+' damage'+(critical?' — critical hit!':'')+(hits>1?' ('+hits+' hits)':'')+'.');
 if(effect==='drain'||hasHook(actor,'drain',asp))healHP(actor,asp,dealt*(effect==='drain'?.5:.125)*(1-exhaustion(actor)));
 if(hasHook(target,'thorns',tsp)&&category==='Physical'){const hpBefore=actor.hp;actor.hp=Math.max(0,actor.hp-Math.max(1,Math.floor(stats(actor,asp).hp/10)));context.onDamage?.(actor,{amount:hpBefore-actor.hp,periodic:true});}
 if(hasHook(actor,'lifeOrb',asp)){const hpBefore=actor.hp;actor.hp=Math.max(0,actor.hp-Math.max(1,Math.floor(stats(actor,asp).hp/10)));context.onDamage?.(actor,{amount:hpBefore-actor.hp,periodic:true});}
 if(effect==='recoil'||effect==='struggle'){const loss=Math.max(1,Math.ceil(effect==='struggle'?stats(actor,asp).hp/4:dealt*.15));const hpBefore=actor.hp;actor.hp=Math.max(0,actor.hp-loss);context.onDamage?.(actor,{amount:hpBefore-actor.hp,periodic:true});log.push(name+' takes '+loss+' recoil damage.');}
 if(effect==='recharge')actor.recharging=true;
 if(effect==='pivot')actor.switchRequested=true;
 if(effect==='forceSwitch'&&target.hp>0){target.switchRequested=true;target.forcedDisplacement=true;}
 if(effect==='rampage'){if(!actor.rampageTurns){actor.rampageTurns=2+Math.floor(r()*2);actor.lockedMove={...move};}actor.rampageTurns--;if(actor.rampageTurns<=0){delete actor.lockedMove;applyCondition(actor,'confusion',r,asp,log,actor);}}
 if(effect==='selfDebuff'){actor.stages??={};for(const k of ['defense','resistance'])actor.stages[k]=clamp(stage(actor,k)-1,-6,6);}
 if(effect==='omniBoost'&&r()<.1){actor.stages??={};for(const k of ['might','power','defense','resistance','speed'])actor.stages[k]=clamp(stage(actor,k)+1,-6,6);}
 if(STAGE_KEYS[effect]){const [key,delta]=STAGE_KEYS[effect],u=delta>0?actor:target;u.stages??={};u.stages[key]=clamp(stage(u,key)+delta,-6,6);}
 if(STATUS_EFFECTS.includes(effect)&&target.hp>0&&r()<.3&&applyCondition(target,effect,r,tsp,log,actor)){if(effect==='disable')target.disabledMove=target.lastMove;log.push(targetName+' is affected by '+effect+'.');}
 if(target.hp<=0&&target.conditions.destinyBond&&actor.hp>0){actor.hp=0;log.push(name+' falls with its destiny-bound opponent.');}
 triggerEquipment(actor,asp,log);triggerEquipment(target,tsp,log);return log;
}
function directProtection(ind,move,category){const screens=screenState(ind),screen=category==='Energy'?(screens.lightscreen||ind.lightscreen):(screens.reflect||ind.reflect);return (screen?.5:1)*spiritualDefense(ind,move,category)/spiritualMultiplier(ind,'empower');}
export function resolveDelayedDamage(ind,sp,context={}){
 const delayed=typeof ind.delayedDamage==='number'?{amount:ind.delayedDamage}:ind.delayedDamage;delete ind.delayedDamage;
 if(!delayed||ind.hp<=0)return [];
 const log=[],name=nameOf(ind,sp),category=delayed.category||'Energy';let amount=delayed.amount||0;
 if(ind.ward){const strength=ind.wardStrength??1;ind.ward=false;if(strength>=1)return [name+' blocks the delayed attack with a ward.'];amount*=Math.max(0,1-strength);}
 amount=Math.max(0,Math.floor(amount*directProtection(ind,delayed.move||{},category)));
 if(hasHook(ind,'survive',sp)&&!itemOnceUsed(ind,'survive')&&ind.hp>=stats(ind,sp).hp&&amount>=ind.hp){amount=ind.hp-1;markItemUsed(ind,'survive');log.push('Last-light Band holds '+name+' at 1 HP.');}
 amount=shieldDamage(ind,amount);
 const link=(ind.spiritualLinks||[]).find(l=>l.until>(ind.realtimeNow||0)),partner=link&&(context.activeUnits||[]).find(u=>u.id===link.partner&&u.hp>0&&u!==ind);
 if(partner){const shared=Math.min(Math.floor(amount*link.amount),Math.max(0,partner.hp-1));partner.hp-=shared;amount-=shared;if(shared>0)context.onDamage?.(partner,{amount:shared,hits:1});}
 const dealt=Math.min(ind.hp,amount);ind.hp-=dealt;
 if(dealt>0){ind.tookDamageThisRound=true;ind.lastHit={amount:dealt,category,source:delayed.source,at:ind.realtimeNow};context.onDamage?.(ind,{amount:dealt,hits:1});}
 log.push(name+' is struck by delayed energy: '+dealt+' damage.');triggerEquipment(ind,sp,log);return log;
}
function statusTick(ind,sp,log,context={}){
 if(ind.hp<=0)return;const max=stats(ind,sp).hp,c=ind.conditions||{},field=ind.battlefield||{};let loss=0;
 if(ind.delayedDamage){const delayed=typeof ind.delayedDamage==='number'?{amount:ind.delayedDamage,turns:1}:ind.delayedDamage;if(--delayed.turns<=0)log.push(...resolveDelayedDamage(ind,sp,context));}
 if(['poison','burn','frostbite'].includes(ind.status))loss+=Math.max(1,Math.floor(max/16));
 if(ind.status==='toxic'){ind.toxicTurns=(ind.toxicTurns||0)+1;loss+=Math.max(1,Math.floor(max*Math.min(15,ind.toxicTurns)/16));}
 if(c.leechSeed){const seed=Math.max(1,Math.floor(max/8));loss+=seed;const source=(context.activeUnits||[]).find(u=>u.id===ind.conditionSources?.leechSeed&&u.hp>0);if(source)healHP(source,context.speciesOf(source),Math.min(seed,ind.hp));}
 if(c.curse)loss+=Math.max(1,Math.floor(max/4));if(c.trap)loss+=Math.max(1,Math.floor(max/16));if(c.nightmare&&ind.status!=='sleep')delete c.nightmare;if(c.nightmare&&ind.status==='sleep')loss+=Math.max(1,Math.floor(max/8));
 const domains=activeDomains(sp,ind),immune=ind.aspect==='Stormbound';
 if(!immune&&(field.weather==='sand'&&![sp.base,sp.alter].some(t=>['Construct','Giant','Elemental'].includes(t))&&!domains.some(d=>['Earth','Metal'].includes(d))||field.weather==='snow'&&!domains.includes('Ice')))loss+=Math.max(1,Math.floor(max/16));
 if(loss){ind.hp=Math.max(0,ind.hp-loss);log.push(nameOf(ind,sp)+' suffers '+loss+' ongoing damage.');}
 if(ind.hp>0&&(c.regenerate||field.terrain==='grass'))healHP(ind,sp,max/16);
 if(ind.hp>0&&ind.aspect==='Verdant'&&field.terrain==='grass')healHP(ind,sp,max/16);
 if(c.perish&&--c.perish<=0){ind.hp=0;delete c.perish;log.push(nameOf(ind,sp)+' falls to its doom omen.');}
 for(const key of ['trap','infatuation','confusion','disable','taunt','regenerate','slow','destinyBond'])if(c[key]>0&&!--c[key])delete c[key];delete c.flinch;
 if(['sleep','freeze'].includes(ind.status)&&ind.statusTurns>0&&!--ind.statusTurns){ind.status=null;log.push(nameOf(ind,sp)+' recovers.');}
 if(ind.wardTurns>0&&!--ind.wardTurns)ind.ward=false;
 if(ind.hp>0&&hasHook(ind,'leftovers',sp)){const recovered=healHP(ind,sp,max/16);if(recovered)log.push(nameOf(ind,sp)+' recovers '+recovered+' HP from its Held Item.');}
 ind.itemRounds=(ind.itemRounds||0)+1;if(ind.hp>0&&hasHook(ind,'resourceSustain',sp)&&ind.itemRounds%3===0){const caps=resourceMaximums(ind,sp);ind.pp=Math.min(caps.pp,(ind.pp||0)+1);ind.willpower=Math.min(caps.willpower,(ind.willpower||0)+1);}
 triggerEquipment(ind,sp,log);
 if(sp.ability==='Second Wind'&&!ind.secondWindUsed&&ind.hp>0&&ind.hp<max*.3){healHP(ind,sp,max*.15);ind.secondWindUsed=true;log.push(nameOf(ind,sp)+' catches its Second Wind.');}
}
export function endBattleRound(units,speciesOf,log=[],teams=units){for(const u of new Set(teams))for(const id of Object.keys(u.itemCooldowns||{}))if(u.itemCooldowns[id]>0&&!--u.itemCooldowns[id])delete u.itemCooldowns[id];
 const context={activeUnits:units,speciesOf};for(const u of units){statusTick(u,speciesOf(u),log,context);for(const key of Object.keys(u.screens||{}))if(u.screens[key]>0&&!--u.screens[key])delete u.screens[key];}
 const fields=new Set(units.map(u=>u.battlefield).filter(Boolean));for(const field of fields){for(const key of ['weather','terrain'])if(field[key+'Turns']>0&&!--field[key+'Turns'])field[key]=null;for(const side of Object.values(field.sides||{}))for(const key of Object.keys(side.screens||{}))if(side.screens[key]>0&&!--side.screens[key])delete side.screens[key];}
 return log;
}
export function resolveRound(a,asp,b,bsp,aChoice,bChoice,r=Math.random){return resolveTempoRound(a,asp,b,bsp,{...aChoice,borrow:0},{...bChoice,borrow:0},{a:0,b:0},r).log;}
export function sealChance(ind,sp,quality=1){return clamp((ind.catchRate??sp.catchRate??150)/150*.12+(1-ind.hp/stats(ind,sp).hp)*.55+(ind.status?.15:0)+(quality-1)*.12-ind.form*.1,.05,.92);}
export function techniqueMilestones(sp){const pool=sp.learnset||buildLearnset(sp.base,sp.alter,sp.domains||[],sp.anatomy);const original=new Set(startingMoves(sp.base,sp.alter,sp.domains||[],hash(sp.seed||sp.id),sp.anatomy).map(m=>m.id));const extra=pool.filter(m=>!original.has(m.id));return extra.map((m,n)=>({id:m.id,level:m.learnLevel??Math.min(90,6+n*2),form:m.learnLevel?0:n<5?0:n<12?1:2}));}
export function availableTechniques(ind,sp){
 const pool=sp.learnset||buildLearnset(sp.base,sp.alter,sp.domains||[],sp.anatomy);
 const initial=startingMoves(sp.base,sp.alter,sp.domains||[],hash(sp.seed||sp.id),sp.anatomy).map(m=>m.id);
 const unlocked=new Set([...initial,...(ind.moveIds||[]),...(ind.unlockedMoves||[])]);
 for(const milestone of techniqueMilestones(sp))if(milestone.level<=ind.level&&milestone.form<=ind.form)unlocked.add(milestone.id);
 return pool.filter(m=>unlocked.has(m.id));
}
export function learnProgression(ind,sp,previousLevel=ind.level,previousForm=ind.form){
 const pool=sp.learnset||buildLearnset(sp.base,sp.alter,sp.domains||[],sp.anatomy);
 const byId=new Map(pool.map(m=>[m.id,m]));
 const start=startingMoves(sp.base,sp.alter,sp.domains||[],hash(sp.seed||sp.id),sp.anatomy).map(m=>m.id);
 ind.moveIds??=(sp.moves||[]).map(m=>m.id);
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
export function gainXP(ind,sp,amount){const previousLevel=ind.level,previousForm=ind.form,oldMaxHp=Math.max(1,stats(ind,sp).hp);ind.xp+=amount;let levels=0;while(ind.xp>=ind.level*18){ind.xp-=ind.level*18;ind.level++;levels++;}const required=ind.form===0?16:36;let evolved=false;if(ind.form<2&&ind.level>=required&&(sp.evolution!=='bond'||ind.bond>=60)){ind.form++;ind.appearance=ind.form;evolved=true;}const learned=learnProgression(ind,sp,previousLevel,previousForm);if(levels||evolved){
 const newMax=stats(ind,sp).hp;
 const oldMax=oldMaxHp;
 ind.hp=clamp(Math.round(newMax*(ind.hp/oldMax)),0,newMax);
 ind.lastMaxHp=newMax;
 // Do not clear status, equipped Moves, resource pools, or cooldowns on advancement.
 normalizeResources(ind,sp);
}
return{levels,evolved,learned};}
export function region(seed,cx,cy){
 const r=rng(hash(seed,cx,cy)),biome=cx===0&&cy===0?BIOMES[0]:pick(BIOMES,r);
 // A seeded 5% of settlement anchors become multi-chunk cities (2-4 by 2-4).
 // Check neighboring anchors so every chunk in a city shares one identity.
 let city=null;
 for(let ax=cx-3;ax<=cx;ax++)for(let ay=cy-3;ay<=cy;ay++){
  if(ax===0&&ay===0)continue;
  if(hash(seed,'city-anchor',ax,ay)%20!==0)continue;
  const width=2+hash(seed,'city-width',ax,ay)%3,height=2+hash(seed,'city-height',ax,ay)%3;
  if(cx>=ax&&cx<ax+width&&cy>=ay&&cy<ay+height&&(!city||hash(seed,'city-rank',ax,ay)<city.rank))city={ax,ay,width,height,rank:hash(seed,'city-rank',ax,ay)};
 }
 const cityKey=city?city.ax+','+city.ay:null;
 // Long wilderness stretches are generated by deterministic 2-6 chunk corridors.
 const corridor=2+hash(seed,'wilderness-span',Math.floor(cx/5),Math.floor(cy/5))%5;
 const town=cx===0&&cy===0||!!city||hash(seed,'settlement',cx,cy)%100<Math.floor(30/corridor);
 const name=cx===0&&cy===0?'Mossveil Crossing':city?'City of '+pick(['Elder','Willow','Amber','Silver','Astral'],rng(hash(seed,'city-name',city.ax,city.ay))):pick(['Elder','Willow','Hollow','Amber','Thistle','Silver','Quiet'],r)+pick(['watch','mere','grove','rest','reach','fall'],r);
 return{cx,cy,biome,town,city:!!city,cityKey,cityWidth:city?.width||1,cityHeight:city?.height||1,name,danger:Math.max(Math.abs(cx),Math.abs(cy))===0?1:6,key:cx+','+cy};
}
export const CHUNK_W=48,CHUNK_H=36;
export function coord(x,y){return{cx:Math.floor(x/48),cy:Math.floor(y/36),lx:((x%48)+48)%48,ly:((y%36)+36)%36};}
// Continuous, seed-stable geography: neighboring chunks sample the same world-space fields.
function terrainNoise(seed,x,y,scale,salt){
 const gx=Math.floor(x/scale),gy=Math.floor(y/scale),fx=x/scale-gx,fy=y/scale-gy;
 const smooth=t=>t*t*(3-2*t),u=smooth(fx),v=smooth(fy);
 const n=(a,b)=>hash(seed,'landscape',salt,a,b)/4294967295;
 const a=n(gx,gy)*(1-u)+n(gx+1,gy)*u,b=n(gx,gy+1)*(1-u)+n(gx+1,gy+1)*u;
 return a*(1-v)+b*v;
}
export function geography(seed,x,y){
 // Broad seas with bays and peninsulas, plus offshore islands and inland lakes.
 const continental=terrainNoise(seed,x,y,260,'continent')*.72+terrainNoise(seed,x,y,92,'coast')*.28;
 const coastDetail=(terrainNoise(seed,x,y,29,'shore')-.5)*.12;
 const offshore=terrainNoise(seed,x,y,53,'archipelago')*.68+terrainNoise(seed,x,y,18,'islets')*.32;
 const ocean=continental+coastDetail<.405;
 const island=ocean&&continental>.26&&offshore>.69;
 const lakeField=terrainNoise(seed,x,y,58,'lake')*.7+terrainNoise(seed,x,y,19,'lake-edge')*.3;
 const lake=!ocean&&lakeField>.735&&continental<.72;
 // Keep the starter village and its immediate approaches reliably accessible.
 const start=Math.max(Math.abs(x-24)/45,Math.abs(y-19)/35);
 const protectedStart=start<1;
 const water=!protectedStart&&((ocean&&!island)||lake);
 const forestField=terrainNoise(seed,x,y,47,'forest')*.7+terrainNoise(seed,x,y,13,'grove')*.3;
 return {water,ocean:water&&ocean,lake:water&&lake,island:island&&!water,forest:forestField>.51,forestDensity:forestField};
}
function rawTile(seed,x,y){const{cx,cy,lx,ly}=coord(x,y),reg=region(seed,cx,cy),h=hash(seed,x,y)%100,inTown=reg.town&&Math.abs(lx-24)<10&&Math.abs(ly-18)<8,path=ly===18||ly===19||lx===24||lx===25;if(reg.town){for(const b of townLayout(cx,cy))if(lx>=b.x&&lx<b.x+b.w&&ly>=b.y&&ly<b.y+b.h)return ly<sceneryBaseRow(b)?'path':b.kind==='hall'?'guild':'house';if(townFeatures(cx,cy).some(f=>lx>=f.x&&lx<f.x+f.w&&ly>=f.y&&ly<f.y+f.h))return'feature';if(lx===27&&ly===18)return'well';if(townPath(lx,ly,cx,cy))return'path';}if(path)return'path';if(!reg.town){const geo=geography(seed,x,y);if(geo.water)return'water';const nearWater=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]].some(([dx,dy])=>geography(seed,x+dx,y+dy).water);if(nearWater)return geo.forestDensity>.66&&hash(seed,'coastal-rock',x,y)%5===0?'coast-cliff':'beach';}if(path)return'path';if(reg.town&&townGround(lx,ly,cx,cy))return h<9?'flower':'lawn';if(inTown)return h<12?'flower':'lawn';const rx=5+(hash(seed,cx,cy,'terrace')%2)*27,ry=4;if(lx>=rx&&lx<=rx+10&&ly>=ry&&ly<=ry+8){if(ly===ry+8&&lx===rx+5)return'stairs';if(lx===rx||lx===rx+10||ly===ry+8)return'cliff';if(h<22)return'grass';return'lawn';}const landscape=geography(seed,x,y);if(landscape.water)return'water';if(landscape.forest){const density=landscape.forestDensity;return hash(seed,'tree',x,y)%100<(density>.65?53:32)?'tree':'forest';}if(h<5)return'rock';if(hash(seed,Math.floor(x/3),Math.floor(y/3),'grass')%100<33)return'grass';if(h<50)return'flower';return'lawn';}
export function walkable(t,canSwim=false,canClimb=false){return!['guild','house','well','tree','cliff'].includes(t)&&(t!=='water'||canSwim)&&(t!=='rock'||canClimb);}
export function npcs(seed,cx,cy){if(!region(seed,cx,cy).town)return[];return[{id:'keeper-'+cx+','+cy,name:'Keeper Iona',role:'keeper',x:cx*48+22,y:cy*36+16},{id:'merchant-'+cx+','+cy,name:'Tavi',role:'merchant',x:cx*48+29,y:cy*36+17},{id:'rival-'+cx+','+cy,name:'Rowan',role:'rival',x:cx*48+19,y:cy*36+20},{id:'scholar-'+cx+','+cy,name:'Scholar Elin',role:'scholar',x:cx*48+26,y:cy*36+23}];}
export function newGame(seed='SP-'+Math.floor(Math.random()*999999)){return{version:VERSION,seed,player:{name:'Sealer',x:24,y:19,face:'down'},safe:{x:24,y:19},spirits:[],party:[],species:{},regions:{},roamers:{},seen:[],history:{},inventory:{seals:8,offerings:5,tonics:5,ethers:3,coins:120,quality:1},rank:1,rankXP:0,steps:0,wins:0,captured:0,friendships:{},quests:{discovery:false,rival:false,explorer:false},drops:[],lastSave:Date.now(),playTime:0,settings:{timing:'normal'},starter:false,notes:['Arrived at Mossveil Crossing. Keeper Iona is waiting beside the guild.']};}
export function validateSpecies(raw,original){
 if(!raw||typeof raw!=='object')throw Error('Model returned no Spirimon design.');
 const clean=(v,n)=>typeof v==='string'?v.replace(/[<>\x00-\x1f]/g,'').trim().slice(0,n):'';
 const forms=Array.isArray(raw.forms)?raw.forms.map(s=>clean(s,45)):[];
 if(forms.length!==3||forms.some(s=>!s)||new Set(forms.map(s=>s.toLowerCase())).size!==3)throw Error('A lineage must have three distinct named forms.');
 const description=clean(raw.description,700);if(!description)throw Error('Missing Spirimon description.');
 const next={...original,name:forms[1],forms,description,source:'local-llm'};
 if(Array.isArray(raw.visualPrompts)&&raw.visualPrompts.length===3)next.visualPrompts=raw.visualPrompts.map(p=>clean(p,1400));
 const checked=validateGeneratedMoves(raw.moves,original);next.moves=checked.moves.map((m,i)=>({...m,name:clean(raw.moveNames?.[i],40)||m.name}));next.moveValidation=checked.report;
 const overrides=new Map(next.moves.map(m=>[m.id,m]));next.learnset=(original.learnset||[]).map(m=>overrides.has(m.id)?{...overrides.get(m.id)}:{...m});
 return next;
}


export function moveCost(move,targetSp){return move.id==='struggle'?0:targetSp?.ability==='Pressure'?2:1;}
export function actionCost(move,index=0,targetSp){return moveCost(move,targetSp);}
export function resolveHeldItemAction(actor,asp,target,tsp,choice={},r=Math.random,context={}){
 const activation=heldItemActivation(actor,asp),log=[];if(!activation.ok)return {ok:false,log:[activation.reason]};
 const {item}=activation,move=context.realTime&&context.moveOverride?{...activation.move,...context.moveOverride}:activation.move;if(choice.itemId&&choice.itemId!==item.id)return {ok:false,log:['The declared Held Item is no longer equipped.']};
 if(!target||target.hp<=0)return {ok:false,log:['No living target is available.']};
 if(!activation.consumable&&!canUseMove(actor,asp,move,tsp))return {ok:false,log:['The item ability cannot be funded or is restricted.']};
 const friendly=['self','ally','allAllies'].includes(moveTarget(move)),recipient=friendly?target:actor,recipientSp=friendly?tsp:asp;
 if(move.effect==='heal'&&recipient.hp>=stats(recipient,recipientSp).hp)return {ok:false,log:['The target is already at full HP.']};
 if(move.effect==='cleanse'&&!recipient.status&&!Object.keys(recipient.conditions||{}).length)return {ok:false,log:['The target has no affliction to cleanse.']};
 if(move.effect==='itemResources'){const caps=resourceMaximums(recipient,recipientSp);if((recipient.pp||0)>=caps.pp&&(recipient.willpower||0)>=caps.willpower)return {ok:false,log:['The target’s resource pools are full.']};}
 const ctx={...context,heldAction:true,heldItem:item,prepaid:!!activation.consumable,funded:false,friendly};
 const targets=moveTarget(move)==='allOpponents'?(context.targetActive||[target]).filter(t=>t.hp>0):[target];ctx.pressure=targets.some(t=>(context.speciesOf?context.speciesOf(t):tsp).ability==='Pressure');
 for(let n=0;n<targets.length;n++){const victim=targets[n];log.push(...executeAction(actor,asp,victim,context.speciesOf?context.speciesOf(victim):tsp,move,'normal',choice.commit??.5,r,1,n?{...ctx,prepaid:true}:ctx));if(n===0&&!ctx.funded)break;}
 if(ctx.funded){log.unshift(nameOf(actor,asp)+' activates '+item.name+'.');if(activation.consumable){consumeHeldItem(actor);log.push(item.name+' is consumed permanently.');}else{actor.itemCooldowns??={};actor.itemCooldowns[item.id]=item.cooldown;}return {ok:true,log,move};}
 return {ok:false,log,move};
}
// One resolver for single and double battles. Field state stores no unit references,
// so autosaves remain JSON serializable; live team references are only in context.
export function resolveBattleRound(allies,enemies,allyChoices,enemyChoices,options={},r=Math.random){
 const speciesOf=options.speciesOf||((u)=>u.speciesData),teams={a:options.alliesTeam||allies,b:options.enemiesTeam||enemies},active={a:allies,b:enemies};
 const field=bindBattlefield(teams.a,teams.b,options.field),credits=options.credits||{a:{},b:{}},nextCredits={a:{},b:{}},actions={a:0,b:0},entries=[],log=[],events=[];
 for(const side of ['a','b']){const first=active[side].findIndex(u=>u.hp>0);if(first>=0)for(const [slot,count]of Object.entries(credits[side]||{}))if(!active[side][slot]||active[side][slot].hp<=0){credits[side][first]=(credits[side][first]||0)+count;delete credits[side][slot];}}
 for(const [side,units,choices]of [['a',allies,allyChoices],['b',enemies,enemyChoices]])units.forEach((u,slot)=>{
  if(u.hp<=0)return;u.battleStyle=choices[slot]?.style||'normal';u.tookDamageThisRound=false;u.lastHit=null;
  const choice=choices[slot];if(!choice)return;const move=(choice.type==='heldItem'?heldItemActivation(u,speciesOf(u)).move:null)||choice.move||equippedMoves(u,speciesOf(u))[0]||STRUGGLE;
  const borrowed=choice.type&&choice.type!=='move'?0:clamp(Math.floor(choice.borrow||0),0,2),bonus=Number(credits[side]?.[slot]||0),count=choice.type&&choice.type!=='move'?1:1+bonus+borrowed;
  for(let index=0;index<count;index++)entries.push({side,slot,u,choice,index,borrowed:index>=1+bonus,priority:choice.type==='switch'?1000000:priority(u,speciesOf(u),move,choice.style||'normal')-index*18});
 });
 entries.sort((a,b)=>b.priority-a.priority||a.side.localeCompare(b.side)||a.slot-b.slot);
 const allUnits=()=>[...active.a,...active.b],allTeam=()=>[...teams.a,...teams.b];
 let n=0;while(n<entries.length){let j=n+1;while(j<entries.length&&entries[j].priority===entries[n].priority)j++;
  const group=entries.slice(n,j),snapshot=new Map(allTeam().map(u=>[u,u.hp])),deltas=new Map();
  for(const e of group){const {side,slot,u,choice}=e,foe=side==='a'?'b':'a',sp=speciesOf(u);if((snapshot.get(u)||0)<=0||active[side][slot]!==u||e.index>0&&u.switchRequested)continue;
   if(choice.type==='switch'){
    const incoming=teams[side].find(x=>x.id===choice.switchId&&x.hp>0&&!active[side].includes(x));
    const switched=switchUnits(u,incoming,incoming?speciesOf(incoming):sp,{outSpecies:sp});log.push(...switched.log);if(switched.ok){active[side][slot]=incoming;actions[side]++;}continue;
   }
   for(const [unit,hp]of snapshot)unit.hp=hp;
   const targetKind=moveTarget((choice.type==='heldItem'?heldItemActivation(u,sp).move:null)||choice.move||STRUGGLE),friendly=targetKind==='ally'||targetKind==='self'||targetKind==='allAllies';
   let target=friendly?(targetKind==='self'?u:active[side][choice.targetIndex??slot]):active[foe][choice.targetIndex??0];
   if(!target||snapshot.get(target)<=0)target=friendly?u:active[foe].find(x=>(snapshot.get(x)||0)>0);
   if(!target)continue;
   const ctx={targetActive:active[foe],alliedActive:active[side],actorTeam:teams[side],targetTeam:teams[foe],activeUnits:allUnits(),friendly,speciesOf,funded:false};let actual=choice.move;
   if(choice.type==='heldItem'){const activation=resolveHeldItemAction(u,sp,target,speciesOf(target),choice,r,ctx);log.push(...activation.log);if(!activation.ok&&!activation.move)continue;actual=activation.move;}else if(choice.type==='item'){
    const inventory=options.inventory?.[side],item=choice.item,key=item==='tonic'?'tonics':'ethers',amount=inventory?.[key]||0;
    if(!amount){log.push('No '+key+' remaining.');continue;}const recipient=active[side][choice.targetIndex??slot]||u,caps=stats(recipient,speciesOf(recipient));
    if(item==='tonic')healHP(recipient,speciesOf(recipient),Math.ceil(caps.hp/2));else{recipient.pp=Math.min(caps.pp,(recipient.pp||0)+Math.ceil(caps.pp*.6));recipient.willpower=Math.min(caps.willpower,(recipient.willpower||0)+Math.ceil(caps.willpower*.6));}
    inventory[key]--;actual={name:item==='tonic'?'Tonic':'Soul Draught',effect:'heal',power:0};log.push(nameOf(u,sp)+' uses '+actual.name+'.');
   }else if(choice.type==='support'){target=u;u.ward=true;u.wardTurns=1;u.wardStrength=1-exhaustion(actor);actual={name:'Sealer’s Ward',effect:'ward',power:0};log.push('The Sealer raises a protective ward.');}
   else{
    actual=battleMove(u,sp,choice.move,speciesOf(target));if(!actual||e.index>0&&actual.id==='struggle')continue;
    const targets=targetKind==='allOpponents'?active[foe].filter(t=>snapshot.get(t)>0):[target];ctx.pressure=targets.some(t=>speciesOf(t).ability==='Pressure');for(let ti=0;ti<targets.length;ti++){const victim=targets[ti];log.push(...executeAction(u,sp,victim,speciesOf(victim),actual,choice.style||'normal',choice.commit??.5,r,1,ti>0?{...ctx,prepaid:true}:ctx));}
   }
   for(const [unit,hp]of snapshot){deltas.set(unit,(deltas.get(unit)||0)+unit.hp-hp);unit.hp=hp;}
   actions[side]++;if(e.borrowed&&ctx.funded){nextCredits[foe][slot]=(nextCredits[foe][slot]||0)+1;}
   events.push({side,actor:slot,targetIndex:choice.targetIndex??0,move:actual,style:choice.style||'normal',aHP:active.a[0]?.hp,bHP:active.b[0]?.hp,aPP:active.a[0]?.pp,bPP:active.b[0]?.pp,aWillpower:active.a[0]?.willpower,bWillpower:active.b[0]?.willpower});
  }
  for(const [u,delta]of deltas)u.hp=clamp((snapshot.get(u)||0)+delta,0,Math.max(snapshot.get(u)||0,stats(u,speciesOf(u)).hp));
  // Preserve switch-out recovery and entry hazards from the high-priority switch group.
  for(const event of events.slice(-group.length)){event.aHP=active.a[0]?.hp;event.bHP=active.b[0]?.hp;}
  n=j;
 }
 endBattleRound(allUnits(),speciesOf,log,allTeam());
 return {log,events,allies:active.a,enemies:active.b,nextCredits,actions,field};
}
export function resolveTempoRound(a,asp,b,bsp,aChoice,bChoice,credits={a:0,b:0},r=Math.random,options={}){
 const speciesOf=options.speciesOf||((u)=>u===a?asp:bsp);
 const result=resolveBattleRound([a],[b],[aChoice],[bChoice],{...options,speciesOf,credits:{a:{0:credits.a||0},b:{0:credits.b||0}}},r);
 return {...result,nextCredits:{a:result.nextCredits.a[0]||0,b:result.nextCredits.b[0]||0}};
}
export function resolveMultiSpiritRound(allies,enemies,allyChoices,enemyChoices,r=Math.random,options={}){
 return resolveBattleRound(allies,enemies,allyChoices,enemyChoices,options,r);
}

const terrainMemo=new Map();export function tile(seed,x,y){const key=seed+'|'+x+'|'+y;if(terrainMemo.has(key))return terrainMemo.get(key);const value=rawTile(seed,x,y);if(terrainMemo.size>100000)terrainMemo.clear();terrainMemo.set(key,value);return value;}

export function encounterRange(seed,cx,cy,towns=0){const distance=Math.max(Math.abs(cx),Math.abs(cy));if(distance===0)return{minLevel:1,maxLevel:5};if(distance===1)return{minLevel:6,maxLevel:8};let min=6,left=Math.max(0,towns),tier=0;while(left>0){const span=1+hash(seed,'town-span',tier)%3;if(left<span)break;left-=span;min+=1+hash(seed,'town-rise',tier)%3;tier++;}return{minLevel:min,maxLevel:min+2};}
export function encounterLevel(reg,r=Math.random){const min=reg.minLevel??reg.danger??1,max=reg.maxLevel??min+2;return min+Math.floor(r()*(max-min+1));}
export function refreshTechniques(sp){
 migrateSpecies(sp);
 const rename=value=>typeof value==='string'?value.replace(/\bspirits?\b/gi,'Spirimon'):value;
 for(const key of ['name','description','body'])sp[key]=rename(sp[key]);if(sp.forms)sp.forms=sp.forms.map(rename);
 if(![2,3,4,5].includes(sp.moveRevision))sp.moves=startingMoves(sp.base,sp.alter,sp.domains||[],hash(sp.seed||sp.id),sp.anatomy);
 if(sp.moveRevision!==5){const current=buildLearnset(sp.base,sp.alter,sp.domains||[],sp.anatomy),old=[...(sp.learnset||[]),...(sp.moves||[]).filter(m=>!(sp.learnset||[]).some(known=>known.id===m.id))],seen=new Set(old.map(m=>m.id));sp.learnset=[...old,...current.filter(m=>!seen.has(m.id))];sp.moves??=startingMoves(sp.base,sp.alter,sp.domains||[],hash(sp.seed||sp.id),sp.anatomy);sp.moveRevision=5;}
 for(const move of [...(sp.moves||[]),...(sp.learnset||[])]){delete move.speed;move.name=rename(move.name);if(move.domain)move.domain=canonicalDomain(move.domain);if(moveCooldownDisruption(move))move.cooldownDisruption=moveCooldownDisruption(move);move.desc=moveLore(move).description;move.baseUses=moveBaseValue(move);}return sp;
}

export const CHALLENGER_DIALOGUE={
 rival:['You have grown. So have I. Let us see whose bonds run deeper.','I followed the same trail, but our stories are taking different turns.','Your last victory taught me something. This time I have an answer.','The guild speaks highly of you. I intend to give them another name to remember.','A good rival never lets you grow comfortable.','I have crossed two valleys to test this new formation.','No shortcuts, no excuses. Show me what your Spirimon can do.','You always find a way to surprise me.','A battle between friends is still a battle worth winning.','I trained through the storm. Did you?','My Spirimon chose to fight beside me. I hope yours feel the same.','I was hoping our paths would cross here.','This is not about the score. It is about who we become.','I remember our first match. Everything has changed since then.','I will not underestimate your team again.','Another town, another chance to measure our strength.'],
 villain:['The wilds belong to those strong enough to seize them.','Your bonds make you predictable. We prefer obedience.','You have wandered into our territory, Sealer.','We will take the power you refuse to use.','Your guild cannot protect every road.','Our order has watched your progress with interest.','Your Spirimon will make excellent additions to our cause.','Compassion is a weakness the world will punish.','The old covenants are broken. We intend to write new ones.','You stand between us and something ancient.','I have no interest in your reputation. Only your defeat.','The shadows between settlements answer to us.','Your victory would merely delay our plans.','We will meet again, and next time we will be ready.','You cannot protect what you have not yet discovered.','This road is closed. Turn back or be taught why.']
};
export function challengerLevel(average,area,previous=0){return Math.max(1,Math.round(average),area||1,previous||0);}
export function challengerRoll(seed,steps,transition,count=0){const r=rng(hash(seed,'challenger',steps,transition,count));return r()<.05?r()<.55?'rival':'villain':null;}
export const QUEST_DIFFICULTIES=['Novice','Skilled','Veteran','Elite','Legendary'];
const Q=(id,title,role,difficulty,steps,reward,description,requirements={})=>({id,title,role,difficulty,steps,target:steps.length,goal:steps[0].goal,reward,description,requirements});
export function questTemplates(){return [
 Q('first-bond','A Promise Kept','keeper','Novice',[{goal:'capture',count:2}],{coins:35,seals:2},'Form bonds with two Spirimon.'),
 Q('field-study','Living Field Notes','scholar','Novice',[{goal:'seen',count:5}],{coins:60,ethers:1},'Record five distinct species.'),
 Q('open-roads','Beyond the Lanterns','resident','Novice',[{goal:'regions',count:3}],{coins:50,offerings:2},'Explore three regions.'),
 Q('guild-trials','The Trial of Resolve','rival','Skilled',[{goal:'wins',count:3}],{coins:85,tonics:2},'Win three battles.',{rank:2}),
 Q('safe-trails','Clear the Roads','keeper','Skilled',[{goal:'villains',count:1}],{coins:120,seals:3},'Defeat a hostile agent.',{rank:2}),
 Q('healers-hand','A Healer’s Hands','keeper','Novice',[{goal:'heal',count:3}],{coins:65,tonics:3},'Restore your team three times.'),
 Q('friendly-gesture','Trust Is Earned','resident','Novice',[{goal:'offerings',count:3}],{coins:55,offerings:2},'Offer gifts to Spirimon three times.'),
 Q('trail-scout','Scout the Frontier','resident','Skilled',[{goal:'regions',count:5},{goal:'wins',count:2}],{coins:150,seals:3},'Chart five regions, then win two battles.',{rank:2}),
 Q('sealers-art','The Sealer’s Art','keeper','Skilled',[{goal:'capture',count:4},{goal:'heal',count:2}],{coins:160,seals:4,ethers:1},'Seal four Spirimon, then restore your team twice.',{rank:2}),
 Q('rival-training','Lessons in Defeat','rival','Veteran',[{goal:'wins',count:5},{goal:'rivals',count:1}],{coins:260,tonics:4},'Win five battles, then defeat Rowan.',{rank:3}),
 Q('specimen-archive','The Grand Archive','scholar','Veteran',[{goal:'seen',count:15},{goal:'regions',count:7}],{coins:300,ethers:3},'Document fifteen species, then explore seven regions.',{rank:3}),
 Q('supply-run','The Long Supply Road','merchant','Novice',[{goal:'steps',count:80},{goal:'regions',count:3}],{coins:90,seals:2,tonics:1},'Travel eighty steps and visit three regions.'),
 Q('merchant-protection','Caravan Escort','merchant','Veteran',[{goal:'steps',count:180},{goal:'villains',count:1}],{coins:320,tonics:3,seals:4},'Travel the road, then defeat a hostile agent.',{rank:3}),
 Q('shadow-trail','Shadows at the Crossing','resident','Veteran',[{goal:'villains',count:2},{goal:'regions',count:9}],{coins:380,ethers:3},'Defeat two agents, then chart nine regions.',{rank:3}),
 Q('bond-mastery','The Unbroken Covenant','keeper','Elite',[{goal:'capture',count:8},{goal:'rivals',count:2},{goal:'villains',count:2}],{coins:650,seals:6,ethers:4},'Seal eight Spirimon and overcome two rivals and two agents.',{rank:4}),
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
export function caveEntranceAt(seed,x,y){
 const {cx,cy}=coord(x,y),entrance=caveEntrance(seed,cx,cy);
 return entrance&&entrance.x===x&&entrance.y===y?entrance:null;
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

for(const move of MOVE_CATALOG)move.baseUses=moveBaseValue(move);

export function encounterChance(tile,night=false,water=false){
 if(tile==='cave')return .13;
 const base=tile==='grass'?.055:tile==='water'?.0175:night?.0175:0;
 return Math.min(1,base*(night?2:1)*(water?2:1));
}
