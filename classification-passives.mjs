import {spiritualHash} from './spiritual-core.mjs';
const EFFECTS=[
 ['resolve','statusResistance',.10],['fortitude','periodicResistance',.10],
 ['focus','accuracy',.05],['vigor','physicalDamage',.05],
 ['attunement','energyDamage',.05],['guard','damageReduction',.05],
 ['swiftness','speed',.05],['endurance','maxHp',.05],
 ['warding','statusResistance',.10],['tenacity','periodicResistance',.10],
 ['clarity','accuracy',.05],['fury','physicalDamage',.05],
 ['resonance','energyDamage',.05],['bulwark','damageReduction',.05],
 ['agility','speed',.05],['vitality','maxHp',.05]
];
export function passivePool(classification){
 return EFFECTS.map(([name,kind,amount],i)=>({
  id:classification.toLowerCase()+'-'+name,
  name:classification+' '+name[0].toUpperCase()+name.slice(1),
  classification,kind,amount,
  condition:i%4===0?'belowHalfHp':null
 }));
}
export function ensurePassives(sp){
 sp.passives??={};
 const classifications=[sp.base,sp.alter,...new Set(sp.domains||[])].filter(Boolean);
 const existing=new Set();
 for(const classification of classifications){
  const pool=passivePool(classification);
  const previous=sp.passives[classification];
  if(previous&&pool.some(p=>p.id===previous)&&!existing.has(previous)){existing.add(previous);continue;}
  const candidate=pool[spiritualHash(sp.id||sp.seed||'',classification)%pool.length];
  sp.passives[classification]=candidate.id;existing.add(candidate.id);
 }
 for(const key of Object.keys(sp.passives))if(!classifications.includes(key))delete sp.passives[key];
 return sp.passives;
}
export function passiveEffects(sp,ind={},context={}){
 ensurePassives(sp);
 const out={};
 for(const id of Object.values(sp.passives)){
  const classification=id.split('-')[0],passive=passivePool([sp.base,sp.alter,...(sp.domains||[])].find(x=>x.toLowerCase()===classification)||classification).find(p=>p.id===id);
  if(!passive)continue;
  if(passive.condition==='belowHalfHp'&&!(ind.hp>0&&Number.isFinite(context.maxHp)&&ind.hp<context.maxHp/2))continue;
  out[passive.kind]=(out[passive.kind]||0)+passive.amount;
 }
 return out;
}
export function retrainPassive(sp,classification,id,unlocked=[]){
 const eligible=[sp.base,sp.alter,...(sp.domains||[])].includes(classification);
 if(!eligible||!unlocked.includes(id)||!passivePool(classification).some(p=>p.id===id))return false;
 ensurePassives(sp);sp.passives[classification]=id;return true;
}
