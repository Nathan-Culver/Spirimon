import {DOMAIN_DEFINITIONS} from './domains.mjs';
import {spiritualHash} from './spiritual-core.mjs';
import {innateClassifications,activeTypes,domainSources,canonicalDomain} from './classifications.mjs';
import {CURATED_PASSIVES} from './passive-catalog.mjs';
const LABELS={physicalDamage:'physical damage',energyDamage:'Energy damage',damageReduction:'damage reduction',accuracy:'accuracy',evasion:'evasion',speed:'Speed',maxHp:'maximum Health',regeneration:'maximum Health restored every two seconds',thorns:'damage returned once per direct attack',drain:'direct damage restored as Health',criticalChance:'critical chance',criticalDamage:'critical damage',castSpeed:'cast speed',recastReduction:'Technique recast reduction',healingReceived:'healing received',statusResistance:'status resistance',periodicResistance:'periodic damage resistance'};
const WHEN={low:'below half Health',healthy:'at or above 75% Health',full:'at full Health',hurtTarget:'against targets below half Health',freshTarget:'against targets at or above 75% Health',sickTarget:'against afflicted targets',guarded:'while warded or screened',afflicted:'while afflicted',clean:'while free of afflictions',affinity:'with matching classification Techniques',offAffinity:'with nonmatching classification Techniques',incomingPhysical:'against physical attacks',incomingEnergy:'against Energy attacks',physical:'with physical Techniques',energy:'with Energy Techniques',quick:'with attacks of 45 power or less',heavy:'with attacks of 85 power or more',wardedTarget:'against a warded target',changed:'when changing Techniques (evasion persists until the next action)',repeat:'when repeating the previous Technique',rain:'in rain',sun:'in sunny weather',snow:'in snow',fog:'in fog',wind:'in wind',grass:'on grassy terrain',mental:'against mental afflictions',toxin:'against toxins',control:'against control afflictions',heat:'against heat afflictions',cold:'against cold afflictions',shock:'against shock afflictions',spirit:'against spiritual afflictions',nature:'against natural bindings'};
const POOLS=new Map();
export function passivePool(classification){
 classification=classification==='Plant'?'Plant':canonicalDomain(classification);
 if(POOLS.has(classification))return POOLS.get(classification);
 let rows=CURATED_PASSIVES[classification];if(!rows){const family={Air:'Fey',Earth:'Giant',Fire:'Elemental',Water:'Ooze',Light:'Celestial',Dark:'Undead',Sun:'Life',Moon:'Spirit',Lightning:'Storm',Ice:'Construct',Metal:'Construct',Chaos:'Aberration',Law:'Fate',Good:'Life',Evil:'Fiend',Creation:'Life',Destruction:'Void',War:'Monstrosity',Peace:'Spirit',Fear:'Psionic',Wrath:'Fiend',Love:'Fey',Hope:'Celestial',Despair:'Death',Sorrow:'Spirit',Dreams:'Psionic',Nightmares:'Aberration'},affinity=DOMAIN_DEFINITIONS.get(classification)?.affinity,base=family[classification]||family[affinity]||affinity||'Magic';if(!DOMAIN_DEFINITIONS.has(classification))return [];rows=(CURATED_PASSIVES[base]||CURATED_PASSIVES.Magic).map((p,i)=>({...p,name:classification+' '+p.name,amount:Math.max(.01,Math.min(.25,p.amount+((spiritualHash(classification,i)%3)-1)*.01))}));}
 const pool=rows.map((row,index)=>({...row,id:classification.toLowerCase()+'-'+row.name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/-$/,''),classification,index,description:'Provides '+Math.round(row.amount*100)+'% '+LABELS[row.kind]+(row.condition?' '+WHEN[row.condition]:''),revision:2}));
 POOLS.set(classification,pool);return pool;
}
const LEGACY={resolve:'statusResistance',fortitude:'periodicResistance',focus:'accuracy',vigor:'physicalDamage',attunement:'energyDamage',guard:'damageReduction',swiftness:'speed',endurance:'maxHp',warding:'statusResistance',tenacity:'periodicResistance',clarity:'accuracy',fury:'physicalDamage',resonance:'energyDamage',bulwark:'damageReduction',agility:'speed',vitality:'regeneration'};
function migrateId(classification,id){
 const pool=passivePool(classification);if(!pool.length)return null;if(pool.some(p=>p.id===id))return id;
 const kind=LEGACY[String(id).split('-').slice(1).join('-')],matches=pool.filter(p=>p.kind===kind),choices=matches.length?matches:pool;
 return choices[spiritualHash(String(id),classification)%choices.length].id;
}
const keyFor=(key,sp)=>key==='Plant'&&[sp.base,sp.alter].includes('Plant')?'Plant':canonicalDomain(key);
function migrateSelections(record,sp){
 const out={};for(const [key,id]of Object.entries(record||{}).sort(([a],[b])=>Number(keyFor(a,sp)!==a)-Number(keyFor(b,sp)!==b)||a.localeCompare(b))){const next=keyFor(key,sp),mapped=migrateId(next,id);if(mapped)out[next]??=mapped;}return out;
}
export function ensurePassives(sp){
 const classifications=innateClassifications(sp);if(sp.passiveRevision===2&&Object.keys(sp.passives||{}).length===classifications.length&&classifications.every(c=>passivePool(c).some(p=>p.id===sp.passives[c])))return sp.passives;sp.passives=migrateSelections(sp.passives,sp);
 for(const classification of classifications){const pool=passivePool(classification);if(!pool.some(p=>p.id===sp.passives[classification]))sp.passives[classification]=pool[spiritualHash(sp.id||sp.seed||'',classification)%pool.length].id;}
 for(const key of Object.keys(sp.passives))if(!classifications.includes(key))delete sp.passives[key];sp.passiveRevision=2;return sp.passives;
}
export function ensureIndividualPassives(sp,ind){
 ensurePassives(sp);const classifications=innateClassifications(sp);if(ind.passiveRevision===2&&Array.isArray(ind.unlockedPassives)&&Object.keys(ind.passives||{}).length===classifications.length&&classifications.every(c=>passivePool(c).some(p=>p.id===ind.passives[c])&&ind.unlockedPassives.includes(ind.passives[c])))return ind.passives;ind.passives=migrateSelections(ind.passives,sp);const unlocked=[];
 for(const id of Array.isArray(ind.unlockedPassives)?ind.unlockedPassives:[]){const prefix=String(id).split('-')[0],raw=prefix[0]?.toUpperCase()+prefix.slice(1),classification=keyFor(raw,sp),mapped=migrateId(classification,id);if(mapped)unlocked.push(mapped);}
 ind.unlockedPassives=[...new Set(unlocked)];
 for(const classification of innateClassifications(sp)){const pool=passivePool(classification);if(!pool.some(p=>p.id===ind.passives[classification]))ind.passives[classification]=sp.passives[classification];if(!ind.unlockedPassives.includes(ind.passives[classification]))ind.unlockedPassives.push(ind.passives[classification]);}
 for(const key of Object.keys(ind.passives))if(!innateClassifications(sp).includes(key))delete ind.passives[key];ind.passiveRevision=2;return ind.passives;
}
export function unlockPassive(sp,ind,classification,id){classification=keyFor(classification,sp);if(!innateClassifications(sp).includes(classification)||!passivePool(classification).some(p=>p.id===id))return false;ensureIndividualPassives(sp,ind);if(!ind.unlockedPassives.includes(id))ind.unlockedPassives.push(id);return true;}
const affinity=(move,p)=>!!move&&([move.type,...(move.types||[])].includes(p.classification)||[move.domain,...(move.domains||[])].map(canonicalDomain).includes(p.classification));
const afflicted=u=>!!(u?.status||Object.values(u?.conditions||{}).some(Boolean));
const physical=m=>!!m&&m.power>0&&(m.category==='Physical'||m.kind==='physical'||!m.category&&!['spiritual','energy','status'].includes(m.kind));
function applies(p,ind,c){
 const hp=ind.hp,max=c.maxHp,move=c.move,prior=Object.hasOwn(ind,'passivePreviousMove')?ind.passivePreviousMove:ind.lastMove;
 const ratio=max>0?hp/max:null,field=ind.battlefield||{},targetRatio=c.targetMaxHp>0?c.target?.hp/c.targetMaxHp:null;
 switch(p.condition){
 case null:return true;case 'low':return hp>0&&ratio!==null&&ratio<.5;case 'healthy':return ratio!==null&&ratio>=.75;case 'full':return ratio!==null&&ratio>=1;
 case 'hurtTarget':return c.target?.hp>0&&targetRatio!==null&&targetRatio<.5;case 'freshTarget':return targetRatio!==null&&targetRatio>=.75;
 case 'sickTarget':return afflicted(c.target);case 'afflicted':return afflicted(ind);case 'clean':return !afflicted(ind);
 case 'guarded':return !!(ind.ward||Object.values(field.sides?.[ind.battleSide]?.screens||{}).some(Boolean));
 case 'affinity':return affinity(move,p);case 'offAffinity':return !!move&&!affinity(move,p);
 case 'physical':return physical(move);case 'energy':return !!move&&move.power>0&&!physical(move);
 case 'incomingPhysical':return physical(c.incomingMove);case 'incomingEnergy':return !!c.incomingMove&&c.incomingMove.power>0&&!physical(c.incomingMove);
 case 'quick':return move?.power>0&&move.power<=45;case 'heavy':return move?.power>=85;
 case 'wardedTarget':return !!c.target?.ward;
 case 'changed':return move?!!prior&&prior!==move.id:!!ind.lastTechniqueChanged;case 'repeat':return !!move&&move.id===prior;
 case 'rain':case 'sun':case 'snow':case 'fog':case 'wind':return (c.weather||field.weather)===p.condition;
 case 'grass':return (c.terrain||field.terrain)==='grass';
 default:return c.statusGroup===p.condition;
 }
}
export function passiveEffects(sp,ind={},context={}){
 ensurePassives(sp);const out={},types=activeTypes(sp,ind),domains=domainSources(sp,ind).innate,selected=ind.passives||sp.passives;
 for(const classification of innateClassifications(sp)){
  if(!types.includes(classification)&&!domains.includes(classification))continue;
  const p=passivePool(classification).find(p=>p.id===(selected[classification]||sp.passives[classification]));if(p&&applies(p,ind,context))out[p.kind]=Math.max(-.25,Math.min(.25,(out[p.kind]||0)+p.amount));
 }return out;
}
export function retrainPassive(sp,classification,id,unlocked=[],ind=null){classification=keyFor(classification,sp);if(!innateClassifications(sp).includes(classification)||!unlocked.includes(id)||!passivePool(classification).some(p=>p.id===id))return false;if(ind){ensureIndividualPassives(sp,ind);ind.passives[classification]=id;}else{ensurePassives(sp);sp.passives[classification]=id;}return true;}
