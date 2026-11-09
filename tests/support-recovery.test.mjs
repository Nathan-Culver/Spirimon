import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import * as E from '../engine.mjs';
import * as SE from '../spiritual-energy.mjs';
import * as ST from '../support-techniques.mjs';
import * as RT from '../realtime-combat.mjs';
import * as QOL from '../qol.mjs';
import {battleRewards,participantRewards} from '../battle-rewards.mjs';
function fixture(){
 const save=E.newGame('learned-recovery'),sp=E.makeSpecies('recovery','Beast','Fey'),unit=E.heal(E.makeIndividual(sp,10,0,E.rng(1)),sp);
 save.species={[sp.id]:sp};save.spirits=[unit];save.party=[unit.id];SE.ensureSealer(save);return {save,sp,unit,q:save.sealer};
}
function teach(f,kind){const t=ST.generateSupport('recovery-'+kind,{primary:kind,basic:true});f.q.known[t.id]=t;f.q.assignments[f.unit.id]=[t.id];return t;}
test('new Sealers choose exactly two techniques, and saves preserve previously learned instruction',()=>{
 const f=fixture();assert.equal(Object.keys(f.q.known).length,0);
 for(const kind of ['heal','stamina','willpower','cleanse','revive','seal'])assert.ok(f.q.startingChoices.some(t=>t.effects[0].kind===kind));
 for(const t of f.q.startingChoices.slice(0,2))assert.ok(SE.chooseStartingSupport(f.save,t.id).ok);
 assert.equal(SE.chooseStartingSupport(f.save,f.q.startingChoices[2].id).ok,false);assert.equal(Object.keys(f.q.known).length,2);
 const third=teach(f,'revive'),copy=JSON.parse(JSON.stringify(f.save));SE.ensureSealer(copy);assert.ok(copy.sealer.known[third.id]);assert.equal(Object.keys(copy.sealer.known).length,3);
});
test('Health, Stamina and Willpower recovery each require learning, spend Energy and retain shared cooldowns on reload',()=>{
 for(const [kind,pool]of [['heal','hp'],['stamina','pp'],['willpower','willpower']]){
  const f=fixture(),t=ST.generateSupport('recovery-'+kind,{primary:kind,basic:true});f.unit[pool]=1;
  const before=f.q.energy;assert.equal(RT.useFieldSupport(f.save,t.id,f.unit.id).ok,false);assert.equal(f.q.energy,before);assert.equal(f.unit[pool],1);
  teach(f,kind);const quote=SE.supportQuote(f.q,t,f.unit),result=RT.useFieldSupport(f.save,t.id,f.unit.id);assert.ok(result.ok,result.reason);assert.equal(f.q.energy,before-quote.cost);assert.ok(f.unit[pool]>1);
  const reload=JSON.parse(JSON.stringify(f.save));assert.equal(RT.useFieldSupport(reload,t.id,f.unit.id).ok,false);
  f.q.clockMs=t.cooldownMs+10000;f.unit[pool]=1;assert.ok(RT.useFieldSupport(f.save,t.id,f.unit.id).ok);
 }
});
test('Condition removal handles mental and binding Conditions and retains the rest until another use',()=>{
 const f=fixture(),t=teach(f,'cleanse');f.unit.status='sleep';f.unit.conditions={confusion:10000,trap:10000};
 assert.ok(RT.useFieldSupport(f.save,t.id,f.unit.id).ok);assert.equal(f.unit.status,null);assert.equal(Object.keys(f.unit.conditions).length,2);
 f.q.clockMs=t.cooldownMs+1;assert.ok(RT.useFieldSupport(f.save,t.id,f.unit.id).ok);assert.equal(Object.keys(f.unit.conditions).length,1);
 f.q.clockMs+=t.cooldownMs+1;assert.ok(RT.useFieldSupport(f.save,t.id,f.unit.id).ok);assert.equal(Object.keys(f.unit.conditions).length,0);
});
test('revival works outside battle at a learned percentage; insufficient Energy and healthy recipients spend nothing',()=>{
 const f=fixture(),t=teach(f,'revive');f.unit.hp=0;f.unit.status='poison';f.unit.conditions={trap:1000};f.q.energy=0;
 assert.equal(RT.useFieldSupport(f.save,t.id,f.unit.id).ok,false);assert.equal(f.unit.hp,0);f.q.energy=f.q.maxEnergy;
 assert.ok(RT.useFieldSupport(f.save,t.id,f.unit.id).ok);assert.ok(f.unit.hp>0&&f.unit.hp<E.stats(f.unit,f.sp).hp*.4);assert.equal(f.unit.status,null);assert.deepEqual(f.unit.conditions,{});
 const before=f.q.energy;assert.equal(RT.useFieldSupport(f.save,t.id,f.unit.id).ok,false);assert.equal(f.q.energy,before);
});
test('items recover more than basic techniques and never consume Energy or require learning',()=>{
 for(const [kind,item,pool]of [['heal','tonic','hp'],['stamina','ether','pp'],['willpower','ether','willpower'],['revive','revival','hp']]){
  const f=fixture();f.unit[pool]=kind==='revive'?0:1;const t=teach(f,kind);assert.ok(RT.useFieldSupport(f.save,t.id,f.unit.id).ok);const techniqueResult=f.unit[pool];
  f.unit[pool]=kind==='revive'?0:1;f.q.energy=0;f.q.known={};assert.ok(QOL.applyItem(f.unit,f.sp,item).ok);assert.ok(f.unit[pool]>techniqueResult);assert.equal(f.q.energy,0);
 }
 const f=fixture();f.q.energy=0;f.unit.status='poison';f.unit.conditions={confusion:1000,trap:1000};assert.ok(QOL.applyItem(f.unit,f.sp,'purifier').ok);assert.equal(f.unit.status,null);assert.deepEqual(f.unit.conditions,{});assert.equal(f.q.energy,0);
});
test('Spirit Sealing requires learning and spends only Energy, while catalysts improve chance with zero Energy cost',()=>{
 const f=fixture();let before=f.q.energy;assert.equal(SE.commitSeal(f.q,f.unit,f.sp,1,0,()=>1).ok,false);assert.equal(f.q.energy,before);
 const t=teach(f,'seal'),normal=SE.sealInvestment(f.q,f.unit,f.sp),item=QOL.itemSealQuote(f.unit,f.sp);assert.ok(item.chance>normal.chance);assert.equal(item.cost,0);
 const result=SE.commitSeal(f.q,f.unit,f.sp,1,0,()=>1);assert.ok(result.ok&&!result.success);assert.equal(f.q.energy,before-result.cost);assert.ok(f.q.supportCooldowns[t.id]>f.q.clockMs);assert.equal(SE.commitSeal(f.q,f.unit,f.sp,1,0,()=>0).ok,false);
 f.q.energy=0;assert.equal(QOL.itemSealQuote(f.unit,f.sp).ok,true);
});
test('battle catalyst action remains usable at zero Energy without learned sealing and spends only one item',()=>{
 const source=readFileSync(new URL('../app.mjs',import.meta.url),'utf8'),start=source.indexOf('function battleSeal('),end=source.indexOf('\nfunction ',start+1),f=fixture(),enemy={...f.unit,id:'enemy'},battle={multi:{enemies:[enemy]},rt:{paused:false},log:[]};f.q.energy=0;
 const random={random:()=>1},h=vm.createContext({s:f.save,battle,Math:random,QOL,SE,RT:{synchronizeTimers(){}},spOf:()=>f.sp,toast(){},claimRealTimeUtility:()=>true,realTimeContext:()=>({}),save(){},render(){}});
 const before=f.save.inventory.seals;vm.runInContext(source.slice(start,end),h);h.battleSeal(0,enemy.id,false,true);assert.equal(f.save.inventory.seals,before-1);assert.equal(f.q.energy,0);
});
test('XP rounds half-rate enemy rewards up, then splits one conserved reward across unique valid participants',()=>{
 const rewards=battleRewards({trainer:true,enemyRoster:[{id:'a',level:1,hp:0},{id:'b',level:3,hp:0}]});assert.equal(rewards.xp,18+53);
 const units=[{id:'one'},{id:'two'},{id:'three'}],shares=participantRewards({participants:['one','two','one','missing','three']},units,rewards.xp);
 assert.deepEqual(shares,[{id:'one',xp:24},{id:'two',xp:24},{id:'three',xp:23}]);assert.equal(shares.reduce((n,s)=>n+s.xp,0),rewards.xp);
 assert.deepEqual(participantRewards({participants:['three'],ally:'one'},units,1),[{id:'three',xp:1}]);
 assert.deepEqual(participantRewards({ally:'one'},units,1),[{id:'one',xp:1}]);
});
