// Save keys remain stable so existing creatures, equipment and combat stages keep working.
export const STAT_KEYS=['hp','might','defense','power','resistance','speed'];
export const STAT_LABELS={hp:'Health',might:'Physical Attack (PA)',defense:'Physical Defense (PD)',power:'Spiritual Attack (SA)',resistance:'Spiritual Defense (SD)',speed:'Speed'};
export const STAT_SHORT={hp:'HP',might:'PA',defense:'PD',power:'SA',resistance:'SD',speed:'Speed'};
export const EV_STAT_LIMIT=252,EV_TOTAL_LIMIT=510,STAT_REVISION=2;
const integer=(v,max,fallback=0)=>Number.isFinite(v)?Math.max(0,Math.min(max,Math.floor(v))):fallback;
function legacyIV(ind,key){let h=2166136261;for(const c of [ind.id,ind.species,ind.personalityValue,key].join('|'))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>27;}
export function geneticProfile(ind){
 let remaining=EV_TOTAL_LIMIT;
 const ivs={},evs={};
 for(const key of STAT_KEYS){ivs[key]=integer(ind.ivs?.[key],31,legacyIV(ind,key));evs[key]=Math.min(remaining,integer(ind.evs?.[key],EV_STAT_LIMIT));remaining-=evs[key];}
 return {ivs,evs,total:EV_TOTAL_LIMIT-remaining};
}
export function normalizeGenetics(ind){const profile=geneticProfile(ind);ind.ivs=profile.ivs;ind.evs=profile.evs;return ind;}
export function speciesBaseStats(sp,form=0){
 // Transformations improve species bases, before individual genetics and level scaling.
 const factor=1+Math.max(0,Math.min(2,form))*.25,pa=sp.might??sp.power??50,sa=sp.energyPower??sp.power??50;
 const raw={hp:sp.health??50,might:pa,defense:sp.defense??pa,power:sa,resistance:sp.resistance??sa,speed:sp.speed??50};
 return Object.fromEntries(STAT_KEYS.map(key=>[key,Math.max(1,Math.floor(raw[key]*(key==='speed'?1:factor)))]));
}
export function formulaStats(ind,sp,nature=[null,null]){
 const base=speciesBaseStats(sp,ind.form),{ivs,evs}=geneticProfile(ind),level=Math.max(1,Math.floor(ind.level||1));
 return Object.fromEntries(STAT_KEYS.map(key=>{
  const scaled=Math.floor((2*base[key]+ivs[key]+Math.floor(evs[key]/4))*level/100);
  const value=key==='hp'?scaled+level+10:Math.floor((scaled+5)*(nature[0]===key?1.1:nature[1]===key?.9:1));
  return [key,Math.max(1,value)];
 }));
}
export function addEffort(ind,yieldStats){
 normalizeGenetics(ind);let room=EV_TOTAL_LIMIT-Object.values(ind.evs).reduce((a,b)=>a+b,0);const gained={};
 for(const key of STAT_KEYS){const amount=Math.min(room,EV_STAT_LIMIT-ind.evs[key],integer(yieldStats?.[key],EV_STAT_LIMIT));if(amount){ind.evs[key]+=amount;room-=amount;gained[key]=amount;}}
 return gained;
}
export function effortYield(sp,form=0){
 if(sp.evYield)return Object.fromEntries(STAT_KEYS.map(k=>[k,integer(sp.evYield[k],3)]));
 // Each species consistently trains its strongest base stat; mature forms give 2 or 3 EVs.
 const bases=speciesBaseStats(sp),key=STAT_KEYS.reduce((best,k)=>bases[k]>bases[best]?k:best,'hp');
 return {[key]:1+Math.max(0,Math.min(2,Math.floor(form)))};
}
