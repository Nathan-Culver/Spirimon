import {balancedTechnique,expectedTechniqueHits,secondaryEffectWork,TECHNIQUE_HEALING} from './technique-balance.mjs';
import {passiveEffects} from './classification-passives.mjs';
import {heldEquipment,itemHasHook} from './equipment.mjs';
import {stats} from './engine.mjs';
import {exhaustion,spiritualMultiplier} from './spiritual-core.mjs';
// Balance is expressed as work/time, not a progression from obsolete to stronger moves.
export const MOVE_LEVEL_THRESHOLDS=[1,16,36,60,85,100];
export const STATUS_RULES={
 sleep:{label:'Sleeping',duration:4000,control:true},freeze:{label:'Frozen',duration:4500,control:true},
 confusion:{label:'Confused',duration:8000},burn:{label:'Burned',duration:16000},poison:{label:'Poisoned',duration:18000},
 toxic:{label:'Badly poisoned',duration:16000},paralysis:{label:'Paralyzed',duration:12000},frostbite:{label:'Frostbitten',duration:16000},
 infatuation:{label:'Infatuated',duration:6000},flinch:{label:'Staggered',duration:900,control:true},slow:{label:'Slowed',duration:6000},
 trap:{label:'Bound',duration:8000},leechSeed:{label:'Seeded',duration:14000},curse:{label:'Cursed',duration:12000},
 nightmare:{label:'Nightmare',duration:8000},perish:{label:'Doom',duration:20000},disable:{label:'Technique sealed',duration:8000},taunt:{label:'Silenced',duration:8000},
 regenerate:{label:'Regenerating',duration:10000},destinyBond:{label:'Destiny bond',duration:4000}
};
export const EFFECT_WORK={sleep:170,freeze:180,flinch:38,confusion:80,burn:65,poison:65,toxic:90,paralysis:95,frostbite:65,slow:45,infatuation:90,trap:55,leechSeed:100,curse:115,nightmare:50,perish:560,disable:110,taunt:80,heal:190,rest:420,fullheal:520,cleanse:90,partyCleanse:155,ward:90,protect:115,reflect:170,lightscreen:170,safeguard:145,regenerate:160,auroraVeil:250,focus:90,batonPass:55,bellyDrum:230,destinyBond:240,teamHeal:260,teamWard:165,haze:100,swapStats:100,invertStats:100,clearHazards:75,spikes:110,toxicSpikes:150,stealthRock:160,stickyWeb:120,counter:55,mirrorCoat:55,priority:0,sureHit:15,breakWard:30,drain:40,recoil:-15,recharge:-12,unburdened:45,critical:18,omniBoost:22,selfDebuff:-15,revenge:35,partyStrike:35,twoTurn:-20,chargeSun:-15,rampage:8,pivot:25,forceSwitch:45,sunStrike:12,weatherStrike:12,sandStrike:12,snowStrike:12,terrainStrike:12,electricStrike:12,psychicStrike:12,mistStrike:12,delayedStrike:10,sleepStrike:-12,hexStrike:18,venomStrike:18,itemResources:150};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function moveLevelTier(level=1){return Math.max(0,MOVE_LEVEL_THRESHOLDS.filter(n=>n<=level).length-1);}
export function effectWork(effect){if(!effect)return 0;if(effect in EFFECT_WORK)return EFFECT_WORK[effect];if(/^(boost|lower)/.test(effect))return 70;if(/^weather|^terrain/.test(effect))return 140;return 0;}
export function moveTiming(move,actor={},sp={},style='normal'){
 move=balancedTechnique(move);
 const tier=0,rawPower=move.power,hits=expectedTechniqueHits(move),totalPower=rawPower*hits;
 const accuracy=clamp(Number(move.accuracy??.9),.05,1),effect=move.effect||null,statusOnly=rawPower===0;
 let work=20+totalPower*accuracy+(statusOnly?effectWork(effect):secondaryEffectWork(effect));
 if(move.target==='allOpponents'||move.target==='allAllies')work*=1.8;
 if(effect==='unburdened')work+=totalPower*.15;if(effect==='struggle')work=70;
 const actual=stats({...actor,level:actor.level||1,form:actor.form||0},{...sp,health:sp.health||50,power:sp.power||50,speed:sp.speed||40,moves:sp.moves||[]});
 const speed=Math.max(1,actual.speed),equipment=heldEquipment(actor,sp);
 let haste=clamp(Math.pow((speed+40)/120,.25),.5,1.8);
 if(itemHasHook(equipment,'firstWind')&&actor.hp>=actual.hp)haste*=1.1;if(actor.aspect==='Swift'&&actor.entryAction)haste*=1.1;
 const speedStage=clamp(actor.stages?.speed||0,-6,6);haste*=clamp(1+speedStage*.08,.6,1.5);
 if(actor.status==='paralysis')haste*=.75;if(actor.conditions?.slow)haste*=.8;
 haste*=spiritualMultiplier(actor,'haste');
 const styleTime=style==='agile'?.9:style==='strong'?1.15:1,penalty=1+exhaustion(actor);
 const gcdMs=Math.max(1000,Math.round(3500/haste*styleTime*penalty));
 // Baseline attacks remain repeatable GCDs. Reactions, utility, spread bursts,
 // and large finishers are independent actions that can be woven between them.
 const reactions=['priority','protect','ward','cleanse','clearHazards','safeguard','counter','mirrorCoat','focus'];
 const timing=move.timing==='lcd'||move.timing==='gcd'?move.timing:reactions.includes(effect)||(move.unbalancedPower??totalPower)>=100&&!['twoTurn','chargeSun'].includes(effect)||move.target==='allOpponents'&&totalPower>=35?'lcd':'gcd';
 const burstWeight=statusOnly?1:1.15;
 const budgetSeconds=timing==='lcd'?clamp(work*.12*burstWeight,6,90):clamp(work/24,1.5,25);
 const healingMinimum=effect==='heal'?22000:effect==='teamHeal'?28000:effect==='fullheal'?45000:effect==='rest'?40000:effect==='regenerate'?24000:0;
 const effectMinimum=effect==='perish'?60000:effect==='destinyBond'?30000:effect==='bellyDrum'?30000:0;
 const localBase=Math.max(healingMinimum,effectMinimum,move.cooldownMs??Math.round(budgetSeconds*1000));
 const cooldownMs=timing==='lcd'?Math.max(2000,Math.round(localBase/haste*styleTime*penalty)):gcdMs;
 const traits=passiveEffects(sp,actor,{maxHp:actual.hp,move,weather:actor.battlefield?.weather});
 const charge=['twoTurn','chargeSun'].includes(effect)?1700:0;
 const baseCast=move.castMs??Math.round(clamp((totalPower-48)*24+charge,0,3000));
 const castMs=Math.round(baseCast/haste*styleTime*penalty/(1+(traits.castSpeed||0))),animationLockMs=move.animationLockMs??(timing==='lcd'?550:450);
 const recoveryMs=animationLockMs,power=rawPower,healingFraction=TECHNIQUE_HEALING[effect]??1;
 // Heavy GCDs need longer casts and/or their own recast to pay for burst strength.
 const gcdRecast= Math.max(healingMinimum,effectMinimum,move.cooldownMs??(statusOnly?work*110:work>60?3500*work/65:0));
 const localCooldownMs=timing==='gcd'?Math.round(gcdRecast/haste*styleTime*penalty):cooldownMs;
 return {tier,threshold:MOVE_LEVEL_THRESHOLDS[tier],nextThreshold:null,timing,power,basePower:rawPower,gcdMs,cooldownMs:timing==='lcd'?Math.max(2000,Math.round(cooldownMs*(1-(traits.recastReduction||0)))):cooldownMs,localCooldownMs:timing==='lcd'?Math.max(2000,Math.round(localCooldownMs*(1-(traits.recastReduction||0)))):Math.round(localCooldownMs*(1-(traits.recastReduction||0))),castMs,animationLockMs,recoveryMs,work:Math.round(work*10)/10,accuracy,effect,healingFraction,durationScale:1-exhaustion(actor)};
}
export function scaledMove(move,actor,sp,style='normal'){move=balancedTechnique(move);const profile=moveTiming(move,actor,sp,style);return {...move,power:profile.power,realTimeBasePower:profile.basePower,realTimeProfile:profile};}
