import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../engine.mjs';
import * as RT from '../realtime-combat.mjs';
import {newSealer} from '../spiritual-core.mjs';
const attack={id:'attack',name:'Attack',power:40,category:'Physical',kind:'physical',accuracy:1,type:'Beast',timing:'gcd',castMs:2000};
function fixture(move=attack){
 const sp={id:'test',forms:['Test'],base:'Beast',alter:'Fey',domains:[],health:500,power:45,speed:40,physicalRes:1,spiritualRes:1,moves:[move],learnset:[move]};
 const unit=id=>({...E.heal(E.makeIndividual(sp,25,0,E.rng(id)),sp),id,nature:'Hardy'});
 const a=unit('a'),b=unit('b'),c=unit('c'),state=RT.createRealTimeState(),q=newSealer(a.id);
 const context={teams:{a:[a],b:[b,c]},active:{a:[a],b:[b]},speciesOf:u=>u===c?{...sp,ability:'Pressure'}:sp,sealers:{a:q}};
 E.bindBattlefield(context.teams.a,context.teams.b);
 return {a,b,c,sp,state,q,context,step:ms=>RT.advanceRealTime(state,ms,context,()=>.5),schedule:()=>RT.scheduleAction(state,context,a,{type:'move',move})};
}
test('explicit individual recasts work for both light and heavy GCD Moves without changing their GCD',()=>{
 for(const power of [20,80]){
  const f=fixture(),short=RT.moveTiming({...attack,power,cooldownMs:1000},f.a,f.sp),long=RT.moveTiming({...attack,power,cooldownMs:60000},f.a,f.sp);
  assert.equal(long.gcdMs,short.gcdMs);assert.ok(long.localCooldownMs>short.localCooldownMs*59);
  f.sp.moves=f.sp.learnset=[{...attack,power,cooldownMs:60000}];
  const r=RT.scheduleAction(f.state,f.context,f.a,{type:'move',move:f.sp.moves[0]});assert.ok(r.ok);
  assert.equal(RT.unitClock(f.state,f.a).cooldowns.attack,r.profile.localCooldownMs);
  assert.equal(RT.moveTiming({...attack,power,cooldownMs:0},f.a,f.sp).localCooldownMs,0);
 }
});
test('Pressure arriving during a spread cast rejects the entire underfunded attack without draining resources',()=>{
 const f=fixture({...attack,target:'allOpponents'});f.a.pp=1;f.a.willpower=0;assert.ok(f.schedule().ok);
 f.context.active.b.push(f.c);const hp=[f.b.hp,f.c.hp],r=f.step(3000);
 assert.deepEqual([f.b.hp,f.c.hp],hp);assert.equal(f.a.pp,1);assert.equal(f.a.willpower,0);assert.match(r.log.join(' '),/cannot fund/);
});
test('a spread attack pays the full Pressure cost once using cross-pool conversion',()=>{
 const f=fixture({...attack,target:'allOpponents'});f.a.pp=1;f.a.willpower=2;assert.ok(f.schedule().ok);f.context.active.b.push(f.c);
 const hp=[f.b.hp,f.c.hp];f.step(3000);assert.ok(f.b.hp<hp[0]&&f.c.hp<hp[1]);assert.equal(f.a.pp,0);assert.equal(f.a.willpower,0);
});
test('a shield absorbing three of four hits leaves exactly one damage-delay hit',()=>{
 const move={...attack,castMs:0,effect:'multiHit'},f=fixture(move),baseline=fixture(move),events=[];
 E.executeAction(baseline.a,baseline.sp,baseline.b,baseline.sp,move,'normal',0,()=>.5,1,{realTime:true});
 const total=E.stats(baseline.b,baseline.sp).hp-baseline.b.hp;
 f.b.spiritualShields=[{hp:Math.floor(total*3/4),until:10000}];
 E.executeAction(f.a,f.sp,f.b,f.sp,move,'normal',0,()=>.5,1,{realTime:true,onDamage:(u,options)=>events.push(options)});
 assert.equal(events.length,1);assert.equal(events[0].hits,1);assert.equal(f.b.spiritualShields.length,0);
 const g=fixture(move);g.b.spiritualShields=[{hp:total,until:10000}];let count=0;
 E.executeAction(g.a,g.sp,g.b,g.sp,move,'normal',0,()=>.5,1,{realTime:true,onDamage:()=>count++});assert.equal(count,0);
});
test('delayed attacks check current Ward and shields at impact and only HP damage adds delay',()=>{
 for(const protection of ['ward','shield','partial','expired']){
  const f=fixture(),hp=f.b.hp,clock=RT.unitClock(f.state,f.b);clock.gcdReadyAt=10000;
  f.b.delayedDamage={amount:40,turns:2,source:f.a.id};RT.synchronizeTimers(f.state,f.context);
  if(protection==='ward'){f.b.ward=true;clock.buffs.ward=10000;f.b.spiritualShields=[{hp:50,until:10000}];}
  else f.b.spiritualShields=[{hp:protection==='partial'?25:50,until:protection==='expired'?3000:10000}];
  f.step(4100);
  const loss=protection==='partial'?15:protection==='expired'?40:0;
  assert.equal(f.b.hp,hp-loss,protection);assert.equal(clock.gcdReadyAt,10000+(loss?100:0),protection);assert.equal(f.b.delayedDamage,undefined);
  if(protection==='ward')assert.equal(f.b.spiritualShields[0].hp,50);
 }
});
test('delayed placement leaves an existing Ward untouched until the omen lands',()=>{
 const move={...attack,effect:'delayedStrike'},f=fixture(move);f.b.ward=true;RT.unitClock(f.state,f.b).buffs.ward=10000;
 assert.ok(f.schedule().ok);f.step(3000);assert.ok(f.b.delayedDamage);assert.equal(f.b.ward,true);
});
test('new defensive support mitigates an already scheduled delayed attack',()=>{
 const f=fixture();f.b.delayedDamage={amount:40,source:f.a.id};f.b.spiritualBuffs=[{kind:'guard',amount:.25,until:10000}];
 E.resolveDelayedDamage(f.b,f.sp);assert.equal(E.stats(f.b,f.sp).hp-f.b.hp,30);
});
test('Quickening immediately accelerates only the remaining cast and respects the stacking cap',()=>{
 const f=fixture({...attack,castMs:10000});assert.ok(f.schedule().ok);f.step(500);
 const clock=RT.unitClock(f.state,f.a),pending=clock.pending,remaining=pending.resolveAt-f.state.elapsedMs,initialGcd=clock.gcdReadyAt;
 const quick={id:'quick',name:'Quickening',effects:[{kind:'haste',amount:.3}],timing:'lcd',target:'single',energyCost:1,cooldownMs:8000,durationMs:20000};
 for(const id of ['quick','quick2','quick3']){f.q.known[id]={...quick,id};f.q.assignments[f.a.id]=[id];assert.ok(RT.usePlayerSupport(f.state,f.context,'a',id,f.a.id).ok);}
 assert.equal(clock.pending,pending);assert.ok(Math.abs(pending.resolveAt-(f.state.elapsedMs+remaining/1.45))<.01);assert.equal(clock.gcdReadyAt,initialGcd);
});
test('Quickening expiration restores the unfinished cast rate without replaying elapsed work',()=>{
 const f=fixture({...attack,castMs:10000});f.a.spiritualBuffs=[{kind:'haste',amount:.3,until:500}];assert.ok(f.schedule().ok);
 const pending=RT.unitClock(f.state,f.a).pending,original=pending.resolveAt;f.step(500);
 assert.ok(Math.abs(pending.resolveAt-(500+(original-500)*1.3))<.01);
});
