import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../engine.mjs';
import * as RT from '../realtime-combat.mjs';
import {STATUS_RULES,moveTiming,scaledMove,MOVE_LEVEL_THRESHOLDS} from '../realtime-moves.mjs';
import {allMoveTemplates,CORE_STATUS_MOVES,buildLearnset} from '../moves.mjs';
import {chooseBattleAction} from '../battle-ai.mjs';
import {generateHeldItem} from '../equipment.mjs';
import {realTimeMoveHTML,realTimeStatusHTML} from '../realtime-ui.mjs';
const move=(id,power=40,effect=null)=>({id,name:id,power,effect,kind:power?'physical':'status',category:power?'Physical':'Status',type:'Beast',accuracy:1,timing:'gcd'});
const hit=move('hit'),fast=move('fast',20),heavy=move('heavy',100),sleep=move('sleep',0,'sleep'),freeze=move('freeze',0,'freeze'),poison=move('poison',0,'poison'),confuse=move('confuse',0,'confusion'),heal={...move('heal',0,'heal'),target:'self'};
function fixture(size=1){const sp={id:'test',forms:['Test'],base:'Beast',alter:'Fey',domains:[],health:160,power:45,speed:40,physicalRes:1,spiritualRes:1,moves:[hit,fast,heavy,sleep,freeze,poison,confuse,heal],learnset:[hit,fast,heavy,sleep,freeze,poison,confuse,heal]};
 const team=side=>Array.from({length:Math.max(size,2)},(_,n)=>({...E.heal(E.makeIndividual(sp,25,0,E.rng(n+1)),sp),id:side+n,nature:'Hardy'}));const a=team('a'),b=team('b'),context={active:{a:a.slice(0,size),b:b.slice(0,size)},teams:{a,b},speciesOf:()=>sp,inventory:{a:{tonics:2,ethers:2}}};E.bindBattlefield(a,b);const state=RT.createRealTimeState();
 const step=ms=>{const result={log:[],events:[]};while(ms>0){const r=RT.advanceRealTime(state,Math.min(ms,1000),context,()=>.5);result.log.push(...r.log);result.events.push(...r.events);ms-=1000;}return result;};
 return {sp,a,b,context,state,step,schedule:(actor,m,extra={})=>RT.scheduleAction(state,context,actor,{type:'move',move:m,...extra})};}

test('an enemy action resolves without a player action and only its own resources/cooldowns are spent',()=>{
 const f=fixture(),hp=f.a[0].hp,pp=f.b[0].pp;assert.ok(f.schedule(f.b[0],hit).ok);f.step(1000);assert.ok(f.a[0].hp<hp);assert.equal(f.b[0].pp,pp-1);assert.equal(f.state.actionCount,1);assert.equal(RT.unitClock(f.state,f.a[0]).readyAt,0);
});
test('move cooldown and actor recovery prevent immediate repeats, then expire by elapsed time',()=>{
 const f=fixture();const first=f.schedule(f.a[0],hit);assert.ok(first.ok);assert.equal(f.schedule(f.a[0],hit).ok,false);f.step(1000);assert.equal(f.schedule(f.a[0],hit).ok,false);f.step(first.profile.cooldownMs+first.profile.recoveryMs);assert.ok(f.schedule(f.a[0],hit).ok);
});
test('fast and heavy Moves trade damage for time and independent individual cooldown records',()=>{
 const f=fixture(2),a=moveTiming(fast,f.a[0],f.sp),b=moveTiming(heavy,f.a[0],f.sp);assert.ok(b.localCooldownMs>a.localCooldownMs||b.work>a.work);assert.ok(a.castMs<b.castMs);f.schedule(f.a[0],heavy);assert.ok(f.schedule(f.a[1],heavy).ok);assert.notEqual(RT.unitClock(f.state,f.a[0]),RT.unitClock(f.state,f.a[1]));
});
test('pause freezes casts, cooldowns and afflictions without a resume burst',()=>{
 const f=fixture();f.b[0].status='poison';f.schedule(f.a[0],hit);const before=structuredClone(f.state),hp=f.b[0].hp;f.state.paused=true;f.step(20000);assert.equal(f.state.elapsedMs,before.elapsedMs);assert.equal(f.b[0].hp,hp);f.state.paused=false;f.step(1000);assert.ok(f.b[0].hp<hp);
});
test('real-time state round trips preserve remaining cooldowns and casts',()=>{
 const f=fixture();f.schedule(f.a[0],heavy);f.step(200);const saved=JSON.parse(JSON.stringify(f.state));assert.deepEqual(saved,f.state);const result=RT.advanceRealTime(saved,1000,f.context,()=>.5);assert.equal(result.events.length,1);assert.equal(RT.actionAvailability(saved,f.a[0],f.sp,{move:heavy}).ok,false);
});
test('sleep blocks action initiation and ends at an absolute deadline without input',()=>{
 const f=fixture();f.schedule(f.a[0],sleep);f.step(500);assert.equal(f.b[0].status,'sleep');assert.equal(f.schedule(f.b[0],hit).ok,false);const until=RT.unitClock(f.state,f.b[0]).status.until;f.step(until-f.state.elapsedMs+100);assert.equal(f.b[0].status,null);assert.ok(f.schedule(f.b[0],hit).ok);
});
test('freezing interrupts a pending cast, and death also cancels a scheduled attack',()=>{
 const f=fixture();f.schedule(f.b[0],heavy);f.schedule(f.a[0],freeze);const hp=f.a[0].hp;f.step(1200);assert.equal(f.b[0].status,'freeze');assert.equal(f.a[0].hp,hp);assert.equal(RT.unitClock(f.state,f.b[0]).pending,null);
 const g=fixture();g.schedule(g.b[0],heavy);g.b[0].hp=0;g.step(1000);assert.equal(g.state.actionCount,0);
});
test('hard-control recovery protection prevents successive attackers from permanently locking a target',()=>{
 const f=fixture(2);f.schedule(f.a[0],sleep);f.step(5500);assert.equal(f.b[0].status,null);f.schedule(f.a[1],freeze);f.step(500);assert.equal(f.b[0].status,null);assert.ok(RT.unitClock(f.state,f.b[0]).controlImmuneUntil>f.state.elapsedMs);
});
test('confusion is a timed independent affliction and its failed actions cause self-damage',()=>{
 const f=fixture();f.schedule(f.a[0],confuse);f.step(500);assert.ok(f.b[0].conditions.confusion);const hp=f.b[0].hp,resources=f.b[0].pp;f.schedule(f.b[0],hit);RT.advanceRealTime(f.state,1000,f.context,()=>0);assert.ok(f.b[0].hp<hp);assert.equal(f.b[0].pp,resources);f.step(9000);assert.equal(f.b[0].conditions.confusion,undefined);
});
test('burn, poison, toxic and frostbite tick without commands and expire',()=>{
 for(const status of ['burn','poison','toxic','frostbite']){const f=fixture();f.b[0].status=status;RT.synchronizeTimers(f.state,f.context);const hp=f.b[0].hp;f.step(2200);assert.ok(f.b[0].hp<hp,status);f.step(STATUS_RULES[status].duration);assert.equal(f.b[0].status,null,status);}
});
test('poison and confusion can coexist and both are shown with remaining seconds',()=>{
 const f=fixture();f.b[0].status='poison';f.b[0].conditions={confusion:3};RT.synchronizeTimers(f.state,f.context);const html=realTimeStatusHTML(f.state,f.b[0]);assert.match(html,/Poisoned/);assert.match(html,/Confused/);assert.match(html,/s<\/span>/);
});
test('paralysis and slow lengthen cooldowns, and Speed has a bounded benefit',()=>{
 const f=fixture(),normal=moveTiming(hit,f.a[0],f.sp).cooldownMs;f.a[0].status='paralysis';assert.ok(moveTiming(hit,f.a[0],f.sp).cooldownMs>normal);f.a[0].status=null;f.a[0].conditions={slow:3};assert.ok(moveTiming(hit,f.a[0],f.sp).cooldownMs>normal);f.a[0].conditions={};assert.ok(moveTiming(hit,f.a[0],{...f.sp,speed:400}).cooldownMs<normal);
});
test('switches preserve per-individual cooldowns and apply entry recovery',()=>{
 const f=fixture();const original=f.a[0];f.schedule(original,heavy);f.step(1000);const ready=RT.unitClock(f.state,original).cooldowns.heavy;f.step(9000);assert.ok(RT.scheduleAction(f.state,f.context,original,{type:'switch',switchId:f.a[1].id}).ok);f.step(500);assert.equal(f.context.active.a[0],f.a[1]);assert.equal(RT.unitClock(f.state,original).cooldowns.heavy,ready);assert.ok(RT.unitClock(f.state,f.a[1]).readyAt>f.state.elapsedMs);
});
test('Bag supplies use the actor timeline, heal allies, and do not spend a forced enemy turn',()=>{
 const f=fixture(2);f.a[1].hp-=90;const hp=f.a[1].hp;assert.ok(RT.scheduleAction(f.state,f.context,f.a[0],{type:'item',item:'tonic',targetIndex:1}).ok);f.step(500);assert.ok(f.a[1].hp>hp);assert.equal(f.context.inventory.a.tonics,1);assert.equal(f.state.actionCount,1);assert.equal(RT.unitClock(f.state,f.b[0]).readyAt,0);
});
test('held abilities participate in the same timeline and retain cooldowns',()=>{
 const f=fixture();f.a[0].heldItem=generateHeldItem('rt-item',{templateId:'edge'});assert.ok(RT.scheduleAction(f.state,f.context,f.a[0],{type:'heldItem'}).ok);const hp=f.b[0].hp;f.step(1000);assert.ok(f.b[0].hp<hp);assert.ok(RT.unitClock(f.state,f.a[0]).itemReadyAt>f.state.elapsedMs);
});
test('AI filters cooling Moves instead of using Struggle while funded Moves are cooling',()=>{
 const f=fixture();const decision=chooseBattleAction(f.b[0],{realTime:true,speciesOf:()=>f.sp,opponents:[f.a[0]],allies:[f.b[0]],team:[f.b[0]],canUse:()=>false},()=>.5);assert.equal(decision,null);
 const ready=chooseBattleAction(f.b[0],{realTime:true,speciesOf:()=>f.sp,opponents:[f.a[0]],allies:[f.b[0]],team:[f.b[0]],canUse:c=>c.move?.id==='fast'},()=>.5);assert.equal(ready.move.id,'fast');assert.equal(ready.borrow,0);
});
test('all catalog Moves have bounded cooldowns and scale at each level threshold',()=>{
 const all=allMoveTemplates();assert.ok(all.length>400);for(const m of all){let previous=-1;for(const level of MOVE_LEVEL_THRESHOLDS){const p=moveTiming(m,{level},{speed:40});assert.ok(p.cooldownMs>=1000&&p.cooldownMs<=180000,m.name);assert.ok(p.castMs>=0&&p.castMs<6000,m.name);assert.ok(p.power>=previous,m.name);previous=p.power;}if(m.power>0)assert.ok(moveTiming(m,{level:100},{speed:40}).power>moveTiming(m,{level:1},{speed:40}).power,m.name);}
});
test('major afflictions all have actual catalog Moves and appropriate early learnset access',()=>{
 const all=allMoveTemplates();for(const effect of ['confusion','sleep','freeze','burn','poison','toxic','paralysis','frostbite'])assert.ok(all.some(m=>m.effect===effect),effect);
 for(const m of CORE_STATUS_MOVES){const base=m.eligibleTypes[0],alter=base==='Fey'?'Beast':'Fey',pool=buildLearnset(base,alter,[]);assert.ok(pool.some(p=>p.id===m.id));const sp={...E.makeSpecies('status-'+m.id,base,alter),learnset:pool};const ind={level:m.learnLevel,form:0};assert.ok(E.availableTechniques(ind,sp).some(p=>p.id===m.id),m.name);}
});
test('real-time controls expose cooldown timers and readiness without turn or borrowing controls',()=>{
 const f=fixture();f.schedule(f.a[0],hit);const html=realTimeMoveHTML(f.state,f.a[0],f.sp,[hit]);assert.match(html,/GCD|LCD/);assert.match(html,/Casting/);assert.match(html,/disabled/);assert.doesNotMatch(html,/borrow|ROUND /);
});

test('re-evaluating a locked or charged Move never compounds its level-scaled power',()=>{
 const base={...hit,effect:'rampage'},u={level:100},sp={speed:40};const first=scaledMove(base,u,sp),second=scaledMove(first,u,sp),third=scaledMove(second,u,sp);assert.equal(first.power,50);assert.equal(second.power,first.power);assert.equal(third.power,first.power);assert.equal(moveTiming(third,u,sp).cooldownMs,moveTiming(base,u,sp).cooldownMs);
});
test('every catalog Move executes through the live scheduler without an unsupported-effect failure',()=>{
 for(const m of allMoveTemplates()){const f=fixture();f.sp.moves=[m];f.sp.learnset=[m];f.a[0].hp=Math.floor(E.stats(f.a[0],f.sp).hp*.6);f.a[0].lastHit={amount:20,category:m.effect==='mirrorCoat'?'Energy':'Physical',source:f.b[0].id,at:0};f.b[0].lastMove='hit';
 if(['sleepStrike','nightmare'].includes(m.effect)){f.b[0].status='sleep';f.b[0].statusTurns=3;}
 if(m.effect==='auroraVeil')f.a[0].battlefield.weather='snow';
 assert.ok(f.schedule(f.a[0],m).ok,m.id+' schedules');assert.doesNotThrow(()=>f.step(5000),m.id+' executes');}
});
test('two allies cannot reserve the same replacement at the same time',()=>{
 const f=fixture(2),reserve={...f.a[0],id:'reserve'};f.context.teams.a.push(reserve);
 assert.ok(RT.scheduleAction(f.state,f.context,f.a[0],{type:'switch',switchId:'reserve'}).ok);
 assert.equal(RT.scheduleAction(f.state,f.context,f.a[1],{type:'switch',switchId:'reserve'}).ok,false);
});
test('Pressure funding is checked before a cast starts and exhaustion permits Struggle',()=>{
 const f=fixture();f.sp.ability='Pressure';f.a[0].pp=1;f.a[0].willpower=0;
 assert.equal(f.schedule(f.a[0],hit).ok,false);assert.equal(RT.unitClock(f.state,f.a[0]).pending,null);assert.equal(f.a[0].pp,1);
 assert.ok(f.schedule(f.a[0],{...E.STRUGGLE,type:'Beast'}).ok);f.step(1000);assert.ok(f.a[0].hp<E.stats(f.a[0],f.sp).hp);assert.equal(f.a[0].pp,1);
});
