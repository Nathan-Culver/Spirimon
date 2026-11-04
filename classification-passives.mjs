import {spiritualHash} from './spiritual-core.mjs';
import {innateClassifications,activeTypes,domainSources,canonicalDomain} from './classifications.mjs';
// Shared training disciplines have classification-specific affinities and triggers.
// Stable IDs preserve previous species assignments and individually retrained choices.
const DISCIPLINES=[
 ['resolve','statusResistance',.10,'belowHalfHp'],['fortitude','periodicResistance',.10,null],
 ['focus','accuracy',.05,null],['vigor','physicalDamage',.05,null],
 ['attunement','energyDamage',.05,'belowHalfHp'],['guard','damageReduction',.05,null],
 ['swiftness','speed',.05,null],['endurance','maxHp',.05,null],
 ['warding','statusResistance',.16,'afflicted'],['tenacity','periodicResistance',.20,'belowHalfHp'],
 ['clarity','accuracy',.12,'affinity'],['fury','physicalDamage',.12,'woundedTarget'],
 ['resonance','energyDamage',.12,'affinity'],['bulwark','damageReduction',.12,'incomingAffinity'],
 ['agility','speed',.12,'weather'],['vitality','regeneration',.02,'belowHalfHp']
];
const THEMES={
 Aberration:['Psionic','mental','fog'],Beast:['Nature','nature','clear'],Celestial:['Light','spirit','sun'],Construct:['Metal','toxin','sand'],Elemental:['Fire','heat','sun'],Fey:['Dreams','mental','fog'],Fiend:['Dark','heat','sun'],Giant:['Earth','control','sand'],Monstrosity:['War','control','clear'],Ooze:['Water','toxin','rain'],Plant:['Nature','nature','rain'],Undead:['Death','spirit','snow'],
 Air:['Air','control','wind'],Earth:['Earth','shock','sand'],Fire:['Fire','heat','sun'],Water:['Water','heat','rain'],Light:['Light','spirit','sun'],Dark:['Dark','mental','fog'],Sun:['Sun','heat','sun'],Moon:['Moon','mental','fog'],Lightning:['Lightning','shock','rain'],Ice:['Ice','cold','snow'],Metal:['Metal','control','sand'],Chaos:['Chaos','mental','wind'],Law:['Law','control','clear'],Good:['Good','spirit','clear'],Evil:['Evil','toxin','fog'],Creation:['Creation','nature','rain'],Destruction:['Destruction','control','heat'],War:['War','control','clear'],Peace:['Peace','mental','clear'],Fear:['Fear','mental','fog'],Wrath:['Wrath','control','heat'],Love:['Love','mental','clear'],Hope:['Hope','spirit','sun'],Despair:['Despair','spirit','fog'],Sorrow:['Sorrow','mental','rain'],Fate:['Fate','control','clear'],Dreams:['Dreams','mental','fog'],Nightmares:['Nightmares','mental','fog'],Life:['Life','toxin','rain'],Death:['Death','spirit','snow'],Spirit:['Spirit','spirit','fog'],Psionic:['Psionic','mental','clear'],Nature:['Nature','nature','rain'],Void:['Void','spirit','fog'],Storm:['Storm','shock','rain'],Magic:['Magic','control','clear']
};
const POOLS=new Map();
export function passivePool(classification){
 classification=classification==='Plant'?'Plant':canonicalDomain(classification);
 if(POOLS.has(classification))return POOLS.get(classification);
 const [domain,group,weather]=THEMES[classification]||['Magic','control','clear'];
 const pool=DISCIPLINES.map(([name,kind,amount,condition],index)=>({
  id:classification.toLowerCase()+'-'+name,name:classification+' '+name[0].toUpperCase()+name.slice(1),classification,kind,amount,condition,domain,group,weather,index,
  description:Math.round(amount*100)+'% '+({physicalDamage:'physical damage',energyDamage:'Energy damage',damageReduction:'damage reduction',statusResistance:'status resistance',periodicResistance:'periodic resistance',accuracy:'accuracy',speed:'Speed',maxHp:'maximum HP',regeneration:'HP recovery every two seconds'}[kind])+({belowHalfHp:' below half HP',afflicted:' while afflicted',affinity:' with '+domain+' or '+classification+' attacks',woundedTarget:' against targets below half HP',incomingAffinity:' against '+domain+' or '+classification+' attacks',weather:' in '+weather+' weather'}[condition]||'')+(index<8?' · '+(index<2?'Additional '+group+' resistance':index<6?domain+' affinity synergy':index===6?weather+' weather synergy':'Stable vitality'):'')
 }));
 POOLS.set(classification,pool);return pool;
}
export function ensurePassives(sp){
 sp.passives??={};const classifications=innateClassifications(sp);
 // Canonicalize saved keys and IDs without rerolling their discipline.
 for(const [key,id]of Object.entries(sp.passives)){const canonical=key==='Plant'&&(sp.base==='Plant'||sp.alter==='Plant')?'Plant':canonicalDomain(key);if(canonical!==key){sp.passives[canonical]??=canonical.toLowerCase()+String(id).slice(String(key).length);delete sp.passives[key];}}
 for(const classification of classifications){const pool=passivePool(classification);if(!pool.some(p=>p.id===sp.passives[classification]))sp.passives[classification]=pool[spiritualHash(sp.id||sp.seed||'',classification)%pool.length].id;}
 for(const key of Object.keys(sp.passives))if(!classifications.includes(key))delete sp.passives[key];return sp.passives;
}
export function ensureIndividualPassives(sp,ind){
 ensurePassives(sp);ind.passives??={};ind.unlockedPassives??=[];
 for(const [key,id]of Object.entries(ind.passives)){const canonical=key==='Plant'&&(sp.base==='Plant'||sp.alter==='Plant')?'Plant':canonicalDomain(key);if(canonical!==key){ind.passives[canonical]??=canonical.toLowerCase()+String(id).slice(String(key).length);delete ind.passives[key];}}
 ind.unlockedPassives=[...new Set(ind.unlockedPassives.map(id=>String(id).replace(/^(time|space|mind)-/,prefix=>({ 'time-':'fate-','space-':'void-','mind-':'psionic-' })[prefix])))];
 for(const classification of innateClassifications(sp)){
  const pool=passivePool(classification),id=ind.passives[classification];
  if(!pool.some(p=>p.id===id))ind.passives[classification]=sp.passives[classification];
  const assigned=ind.passives[classification];if(!ind.unlockedPassives.includes(assigned))ind.unlockedPassives.push(assigned);
 }
 for(const key of Object.keys(ind.passives))if(!innateClassifications(sp).includes(key))delete ind.passives[key];
 return ind.passives;
}
export function unlockPassive(sp,ind,classification,id){
 classification=classification==='Plant'?'Plant':canonicalDomain(classification);if(!innateClassifications(sp).includes(classification)||!passivePool(classification).some(p=>p.id===id))return false;
 ensureIndividualPassives(sp,ind);if(!ind.unlockedPassives.includes(id))ind.unlockedPassives.push(id);return true;
}
const affinity=(move,p)=>move&&([move.type,...(move.types||[])].includes(p.classification)||[move.domain,...(move.domains||[])].map(canonicalDomain).includes(p.domain));
export function passiveEffects(sp,ind={},context={}){
 ensurePassives(sp);const out={},types=activeTypes(sp,ind),domains=domainSources(sp,ind).innate,selected=ind.passives||sp.passives;
 const add=(kind,amount)=>out[kind]=(out[kind]||0)+amount;
 for(const classification of innateClassifications(sp)){
  if(!types.includes(classification)&&!domains.includes(classification))continue;
  const p=passivePool(classification).find(p=>p.id===(selected[classification]||sp.passives[classification]));if(!p)continue;
  const low=ind.hp>0&&Number.isFinite(context.maxHp)&&ind.hp<context.maxHp/2;
  if(p.condition==='belowHalfHp'&&!low||p.condition==='afflicted'&&!(ind.status||Object.values(ind.conditions||{}).some(Boolean))||p.condition==='affinity'&&!affinity(context.move,p)||p.condition==='incomingAffinity'&&!affinity(context.incomingMove,p)||p.condition==='woundedTarget'&&!(context.target?.hp>0&&context.target.hp<context.targetMaxHp/2)||p.condition==='weather'&&context.weather!==p.weather)continue;
  add(p.kind,p.amount);
  if(p.index<2&&context.statusGroup===p.group)add(p.kind,.05);
  if(p.index>=2&&p.index<=4&&affinity(context.move,p))add(p.kind,.03);
  if(p.index===5&&affinity(context.incomingMove,p))add(p.kind,.03);
  if(p.index===6&&context.weather===p.weather)add('speed',.05);
 }
 return out;
}
export function retrainPassive(sp,classification,id,unlocked=[],ind=null){
 classification=classification==='Plant'?'Plant':canonicalDomain(classification);
 if(!innateClassifications(sp).includes(classification)||!unlocked.includes(id)||!passivePool(classification).some(p=>p.id===id))return false;
 if(ind){ensureIndividualPassives(sp,ind);ind.passives[classification]=id;}else{ensurePassives(sp);sp.passives[classification]=id;}return true;
}
