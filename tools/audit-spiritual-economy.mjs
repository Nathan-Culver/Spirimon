import {writeFile} from 'node:fs/promises';
import * as E from '../engine.mjs';
import * as SE from '../spiritual-energy.mjs';
import * as ST from '../support-techniques.mjs';
import {newSealer} from '../spiritual-core.mjs';
const rows=[['creature_level','sealer_level','maximum_energy','median_nonlead_release','reference_support_cost','estimated_routine_battles']];
for(const level of [5,20,40,70,100]){
 const q=newSealer();q.level=Math.max(1,Math.floor(level/2));q.maxEnergy=SE.maximumEnergy(q);const costs=[];
 for(let n=0;n<30;n++){const sp=E.makeSpecies('audit'+n,E.TYPES[n%12],E.TYPES[(n+5)%12]),u=E.heal(E.makeIndividual(sp,level,0,E.rng(n)),sp);u.id='nonlead';u.bond=10;costs.push(SE.manifestationCost(q,u,sp));}
 costs.sort((a,b)=>a-b);const cost=costs[15],support=Math.ceil(2*(1+q.level*.02)),battles=q.maxEnergy/(cost*2+support);
 if(battles<6||battles>10)throw Error('Routine economy outside the 6–10 target at level '+level+': '+battles);
 rows.push([level,q.level,q.maxEnergy,cost,support,battles.toFixed(2)]);
}
await writeFile(new URL('../docs/spiritual-economy-audit.csv',import.meta.url),rows.map(r=>r.join(',')).join('\n')+'\n');
const supports=[['id','name','primary','effects','timing','target','base_energy','cooldown_seconds','duration_seconds','requirement','sacrifice']];
for(let n=0;n<260;n++){const t=ST.generateSupport('reference-support-'+n,{level:n%100});if(!ST.validateSupport(t))throw Error('Support validation failed: '+t.id);supports.push([t.id,t.name,t.effects[0].kind,t.effects.map(e=>e.kind).join('+'),t.timing,t.target,t.energyCost,t.cooldownMs/1000,t.durationMs/1000,JSON.stringify(t.requires),JSON.stringify(t.sacrifice)]);}
const csv=r=>r.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',');await writeFile(new URL('../docs/support-generation-audit.csv',import.meta.url),supports.map(csv).join('\n')+'\n');
console.log('Energy economy: five progression benchmarks meet 6–10 routine battles. Validated 260 example support techniques.');
