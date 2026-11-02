import {heldEquipment,itemHasHook} from './equipment.mjs';
import {stats} from './engine.mjs';
// Balance is expressed as work/time, not a progression from obsolete to stronger moves.
export const MOVE_LEVEL_THRESHOLDS=[1,16,36,60,85,100];
export const STATUS_RULES={
 sleep:{label:'Sleeping',duration:4000,control:true},freeze:{label:'Frozen',duration:4500,control:true},
 confusion:{label:'Confused',duration:8000},burn:{label:'Burned',duration:16000},poison:{label:'Poisoned',duration:18000},
 toxic:{label:'Badly poisoned',duration:16000},paralysis:{label:'Paralyzed',duration:12000},frostbite:{label:'Frostbitten',duration:16000},
 infatuation:{label:'Infatuated',duration:6000},flinch:{label:'Staggered',duration:900,control:true},slow:{label:'Slowed',duration:6000},
 trap:{label:'Bound',duration:8000},leechSeed:{label:'Seeded',duration:14000},curse:{label:'Cursed',duration:12000},
 nightmare:{label:'Nightmare',duration:8000},perish:{label:'Doom',duration:20000},disable:{label:'Move sealed',duration:8000},taunt:{label:'Silenced',duration:8000},
 regenerate:{label:'Regenerating',duration:10000},destinyBond:{label:'Destiny bond',duration:4000}
};
export const EFFECT_WORK={sleep:170,freeze:180,flinch:38,confusion:80,burn:65,poison:65,toxic:90,paralysis:95,frostbite:65,slow:45,infatuation:90,trap:55,leechSeed:100,curse:115,nightmare:50,perish:560,disable:110,taunt:80,heal:190,rest:420,fullheal:520,cleanse:90,partyCleanse:155,ward:90,protect:115,reflect:170,lightscreen:170,safeguard:145,regenerate:160,auroraVeil:250,focus:90,batonPass:55,bellyDrum:230,destinyBond:240,teamHeal:260,teamWard:165,haze:100,swapStats:100,invertStats:100,clearHazards:75,spikes:110,toxicSpikes:150,stealthRock:160,stickyWeb:120,counter:55,mirrorCoat:55,priority:0,sureHit:15,breakWard:30,drain:40,recoil:-15,recharge:-12,unburdened:45,critical:18,omniBoost:22,selfDebuff:-15,revenge:35,partyStrike:35,twoTurn:-20,chargeSun:-15,rampage:8,pivot:25,forceSwitch:45,sunStrike:12,weatherStrike:12,sandStrike:12,snowStrike:12,terrainStrike:12,electricStrike:12,psychicStrike:12,mistStrike:12,delayedStrike:10,sleepStrike:-12,hexStrike:18,venomStrike:18,itemResources:150};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function moveLevelTier(level=1){return Math.max(0,MOVE_LEVEL_THRESHOLDS.filter(n=>n<=level).length-1);}
export function effectWork(effect){if(!effect)return 0;if(effect in EFFECT_WORK)return EFFECT_WORK[effect];if(/^(boost|lower)/.test(effect))return 70;if(/^weather|^terrain/.test(effect))return 140;return 0;}
export function moveTiming(move,actor={},sp={},style='normal'){
 const tier=moveLevelTier(actor.level),rawPower=Math.max(0,Number(move.realTimeBasePower??move.power)||0),hits=move.effect==='multiHit'?3.5:move.effect==='doubleHit'?2:1;
 const accuracy=clamp(Number(move.accuracy??.9),.05,1),effect=move.effect||null,scale=1+tier*.05;
 const statusOnly=rawPower===0,utility=effectWork(effect)*(statusOnly?1:.30);
 let work=20+rawPower*hits*accuracy+utility;
 if(move.target==='allOpponents'||move.target==='allAllies')work*=1.45;
 if(effect==='unburdened')work+=rawPower*.35;if(effect==='struggle')work=70;
 // Both individual and species speed matter, with diminishing returns and a hard cap.
 const actual=stats({...actor,level:actor.level||1,form:actor.form||0},{...sp,health:sp.health||50,power:sp.power||50,speed:sp.speed||40,moves:sp.moves||[]});
 const speed=Math.max(1,actual.speed),equipment=heldEquipment(actor,sp);
 let haste=clamp(1+Math.log2(speed/80)*.08,.8,1.2);
 if(itemHasHook(equipment,'firstWind')&&actor.hp>=actual.hp)haste*=1.1;if(actor.aspect==='Swift'&&actor.entryAction)haste*=1.1;
 const speedStage=clamp(actor.stages?.speed||0,-6,6);haste*=clamp(1+speedStage*.055,.7,1.3);
 if(actor.status==='paralysis')haste*=.75;if(actor.conditions?.slow)haste*=.8;
 haste*=clamp(1+(move.speed||0)/150,.8,1.2);if(effect==='priority')haste*=1.18;
 const styleTime=style==='agile'?.83:style==='strong'?1.30:1;
 const cooldownMs=Math.round(clamp(work/22,1.4,28)*1000/haste*styleTime);
 const charge=['twoTurn','chargeSun'].includes(effect)?1700:0;
 const castMs=Math.round(clamp(180+rawPower*5+charge+Math.max(0,-(move.speed||0))*8,120,3000)/haste*styleTime);
 const recoveryMs=Math.round(Math.max(800,cooldownMs*.82));
 const power=Math.round(rawPower*scale),healingFraction=effect==='teamHeal'?.18+tier*.01:effect==='heal'?.22+tier*.012:effect==='fullheal'?.65+tier*.01:effect==='rest'?.8+tier*.01:1;
 return {tier,threshold:MOVE_LEVEL_THRESHOLDS[tier],nextThreshold:MOVE_LEVEL_THRESHOLDS[tier+1]||null,power,basePower:rawPower,cooldownMs,castMs,recoveryMs,work:Math.round(work*10)/10,accuracy,effect,healingFraction,durationScale:1+tier*.035};
}
export function scaledMove(move,actor,sp,style='normal'){const profile=moveTiming(move,actor,sp,style);return {...move,power:profile.power,realTimeBasePower:profile.basePower,realTimeProfile:profile};}
