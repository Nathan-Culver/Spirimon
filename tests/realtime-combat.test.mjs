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
test('fast and heavy Techniques trade damage for time and independent individual cooldown records',()=>{
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
test('AI filters cooling Techniques instead of using Struggle while funded Techniques are cooling',()=>{
 const f=fixture();const decision=chooseBattleAction(f.b[0],{realTime:true,speciesOf:()=>f.sp,opponents:[f.a[0]],allies:[f.b[0]],team:[f.b[0]],canUse:()=>false},()=>.5);assert.equal(decision,null);
 const ready=chooseBattleAction(f.b[0],{realTime:true,speciesOf:()=>f.sp,opponents:[f.a[0]],allies:[f.b[0]],team:[f.b[0]],canUse:c=>c.move?.id==='fast'},()=>.5);assert.equal(ready.move.id,'fast');assert.equal(ready.borrow,0);
});
test('all catalog Techniques have bounded cooldowns and scale at each level threshold',()=>{
 const all=allMoveTemplates();assert.ok(all.length>400);for(const m of all){let previous=-1;for(const level of MOVE_LEVEL_THRESHOLDS){const p=moveTiming(m,{level},{speed:40});assert.ok(p.cooldownMs>=1000&&p.cooldownMs<=180000,m.name);assert.ok(p.castMs>=0&&p.castMs<6000,m.name);assert.ok(p.power>=previous,m.name);previous=p.power;}if(m.power>0)assert.ok(moveTiming(m,{level:100},{speed:40}).power>moveTiming(m,{level:1},{speed:40}).power,m.name);}
});
test('major afflictions all have actual catalog Techniques and appropriate early learnset access',()=>{
 const all=allMoveTemplates();for(const effect of ['confusion','sleep','freeze','burn','poison','toxic','paralysis','frostbite'])assert.ok(all.some(m=>m.effect===effect),effect);
 for(const m of CORE_STATUS_MOVES){const base=m.eligibleTypes[0],alter=base==='Fey'?'Beast':'Fey',pool=buildLearnset(base,alter,[]);assert.ok(pool.some(p=>p.id===m.id));const sp={...E.makeSpecies('status-'+m.id,base,alter),learnset:pool};const ind={level:m.learnLevel,form:0};assert.ok(E.availableTechniques(ind,sp).some(p=>p.id===m.id),m.name);}
});
test('real-time controls expose cooldown timers and readiness without turn or borrowing controls',()=>{
 const f=fixture();f.schedule(f.a[0],hit);const html=realTimeMoveHTML(f.state,f.a[0],f.sp,[hit]);assert.match(html,/GCD|LCD/);assert.match(html,/Casting/);assert.match(html,/disabled/);assert.doesNotMatch(html,/borrow|ROUND /);
});

test('re-evaluating a locked or charged Technique never compounds its level-scaled power',()=>{
 const base={...hit,effect:'rampage'},u={level:100},sp={speed:40};const first=scaledMove(base,u,sp),second=scaledMove(first,u,sp),third=scaledMove(second,u,sp);assert.equal(first.power,50);assert.equal(second.power,first.power);assert.equal(third.power,first.power);assert.equal(moveTiming(third,u,sp).cooldownMs,moveTiming(base,u,sp).cooldownMs);
});
test('every catalog Technique executes through the live scheduler without an unsupported-effect failure',()=>{
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

test('damage delays each active GCD and LCD with independent direct and periodic caps',()=>{
 const f=fixture(),u=f.a[0],c=RT.unitClock(f.state,u);c.gcdReadyAt=10000;c.cooldowns={one:12000,two:14000,ready:0};u.moveCooldowns=c.cooldowns;
 for(let n=0;n<12;n++)RT.applyDamageDelay(f.state,u);
 assert.equal(c.gcdReadyAt,10500);assert.equal(c.cooldowns.one,12500);assert.equal(c.cooldowns.two,14500);assert.equal(c.cooldowns.ready,0);
 for(let n=0;n<12;n++)RT.applyDamageDelay(f.state,u,{periodic:true});
 assert.equal(c.gcdReadyAt,10750);assert.equal(c.cooldowns.one,12750);assert.equal(u.gcdReadyAt,10750);
 assert.equal(RT.unitClock(f.state,f.b[0]).gcdReadyAt,0);
});
test('cast pushback is throttled, capped per cast, and excludes ongoing damage',()=>{
 const f=fixture(),u=f.a[0],c=RT.unitClock(f.state,u);c.pending={choice:{move:heavy},resolveAt:10000};
 RT.applyDamageDelay(f.state,u);assert.equal(c.pending.resolveAt,10250);
 RT.applyDamageDelay(f.state,u);assert.equal(c.pending.resolveAt,10250);
 f.state.elapsedMs=500;RT.applyDamageDelay(f.state,u,{periodic:true});assert.equal(c.pending.resolveAt,10250);
 RT.applyDamageDelay(f.state,u);f.state.elapsedMs=1000;RT.applyDamageDelay(f.state,u);f.state.elapsedMs=1500;RT.applyDamageDelay(f.state,u);
 assert.equal(c.pending.resolveAt,10500);
});
test('concentration halves pushback and sanctuary prevents cast and explicit disruption',()=>{
 const f=fixture(),u=f.a[0],c=RT.unitClock(f.state,u);c.pending={choice:{move:heavy},resolveAt:10000};c.gcdReadyAt=5000;
 u.spiritualBuffs=[{kind:'concentration',amount:.5,until:5000}];RT.applyDamageDelay(f.state,u);assert.equal(c.pending.resolveAt,10125);
 f.state.elapsedMs=500;u.spiritualBuffs=[{kind:'immunity',amount:.2,until:5000}];RT.applyDamageDelay(f.state,u,{disruption:{gcdMs:500}});
 assert.equal(c.pending.resolveAt,10125);assert.equal(c.gcdReadyAt,5200);
});
test('explicit cooldown disruption cannot lock ready actions and has a shared resistance window',()=>{
 const f=fixture(),u=f.a[0],c=RT.unitClock(f.state,u);c.gcdReadyAt=10000;c.cooldowns.hit=10000;
 const disruption={gcdMs:400,moveId:'hit',lcdMs:500};RT.applyDamageDelay(f.state,u,{disruption});assert.equal(c.gcdReadyAt,10500);assert.equal(c.cooldowns.hit,10500);
 RT.applyDamageDelay(f.state,u,{disruption});assert.equal(c.gcdReadyAt,10500);assert.equal(c.cooldowns.hit,10500);
 c.gcdReadyAt=0;c.cooldowns.hit=0;f.state.elapsedMs=2500;RT.applyDamageDelay(f.state,u,{disruption});assert.equal(c.gcdReadyAt,0);assert.equal(c.cooldowns.hit,0);
});
test('actual attacks push casts and cooldowns but fully absorbed hits do neither',()=>{
 const f=fixture();f.schedule(f.b[0],heavy);const c=RT.unitClock(f.state,f.b[0]),at=c.pending.resolveAt,gcd=c.gcdReadyAt;
 f.schedule(f.a[0],fast);f.step(50);assert.equal(c.pending.resolveAt,at+250);assert.equal(c.gcdReadyAt,gcd+100);
 const g=fixture();g.b[0].spiritualShields=[{hp:99999,until:10000}];g.schedule(g.b[0],heavy);const shielded=RT.unitClock(g.state,g.b[0]),before=shielded.pending.resolveAt;
 g.schedule(g.a[0],fast);g.step(50);assert.equal(shielded.pending.resolveAt,before);
});
test('a new GCD gets a fresh damage budget and periodic pulses use the smaller delay',()=>{
 const f=fixture(),u=f.a[0],c=RT.unitClock(f.state,u);c.gcdReadyAt=500;for(let n=0;n<5;n++)RT.applyDamageDelay(f.state,u);
 f.step(1100);assert.ok(f.schedule(u,heavy).ok);const at=c.gcdReadyAt;RT.applyDamageDelay(f.state,u);assert.equal(c.gcdReadyAt,at+100);
 u.status='poison';c.pending=null;const old=c.gcdReadyAt;f.step(950);assert.equal(c.gcdReadyAt,old+50);
});

test('each simultaneous ongoing damage source adds its own delay',()=>{
 const f=fixture(),u=f.a[0],c=RT.unitClock(f.state,u);c.gcdReadyAt=20000;c.cooldowns.heavy=20000;u.status='poison';u.conditions={curse:1};
 f.step(2000);assert.equal(c.gcdReadyAt,20100);assert.equal(c.cooldowns.heavy,20100);assert.equal(c.pending,null);
 f.step(4000);assert.equal(c.gcdReadyAt,20250);
});
test('delay allowances survive battle end and independent state/save restoration',()=>{
 const f=fixture(),u=f.a[0],c=RT.unitClock(f.state,u);c.gcdReadyAt=20000;c.cooldowns.heavy=20000;
 for(let i=0;i<5;i++)RT.applyDamageDelay(f.state,u);
 RT.preserveAfflictions(f.state,u);const saved=JSON.parse(JSON.stringify(u)),state=RT.createRealTimeState(1000),restored=RT.unitClock(state,saved);
 assert.equal(restored.gcdReadyAt,20500);RT.applyDamageDelay(state,saved);assert.equal(restored.gcdReadyAt,20500);assert.equal(restored.cooldowns.heavy,20500);
 RT.applyDamageDelay(state,saved,{periodic:true});assert.equal(restored.gcdReadyAt,20550);
});
test('multi-hit damage counts each impact but only pushes a cast once in the throttle window',()=>{
 const f=fixture(),u=f.b[0],c=RT.unitClock(f.state,u);c.gcdReadyAt=10000;c.pending={choice:{move:heavy},resolveAt:10000};
 RT.applyDamageDelay(f.state,u,{hits:3});assert.equal(c.gcdReadyAt,10300);assert.equal(c.pending.resolveAt,10250);
 RT.applyDamageDelay(f.state,u,{hits:3});assert.equal(c.gcdReadyAt,10500);assert.equal(c.pending.resolveAt,10250);
});
test('selected existing Techniques expose their disruption rules and affect actual timers',()=>{
 const templates=allMoveTemplates();for(const name of ['Spirit Break','Fatebreaker']){
  const f=fixture(),attack=templates.find(m=>m.name===name);assert.ok(attack.cooldownDisruption);assert.match(E.moveLore(attack).disruptionText,/2 seconds/);
  f.sp.moves=[attack];f.sp.learnset=[attack];f.a[0].equippedMoves=[attack.id];f.a[0].learnedMoves=[attack.id];
  const c=RT.unitClock(f.state,f.b[0]);c.gcdReadyAt=10000;c.cooldowns.heavy=12000;f.b[0].lastMove='heavy';
  assert.ok(f.schedule(f.a[0],attack).ok);f.step(1500);assert.equal(c.gcdReadyAt,10100+attack.cooldownDisruption.gcdMs);assert.equal(c.cooldowns.heavy,name==='Fatebreaker'?12500:12100);
 }
});

test('cast pushback and damage-induced GCD delay share a 750ms cap during each cast',()=>{
 const f=fixture(),u=f.a[0],c=RT.unitClock(f.state,u);c.gcdReadyAt=10000;c.cooldowns.heavy=10000;c.pending={choice:{move:heavy},resolveAt:10000};
 RT.applyDamageDelay(f.state,u);f.state.elapsedMs=500;RT.applyDamageDelay(f.state,u);
 for(let n=0;n<8;n++)RT.applyDamageDelay(f.state,u,{periodic:true});
 for(let n=0;n<8;n++)RT.applyDamageDelay(f.state,u);
 assert.equal(c.pending.pushbackMs+c.pending.damageGcdDelayMs,750);assert.equal(c.pending.resolveAt,10500);assert.equal(c.gcdReadyAt,10250);
 assert.equal(c.cooldowns.heavy,10750,'LCD budgets remain independent');
 c.pending=null;RT.applyDamageDelay(f.state,u);assert.equal(c.gcdReadyAt,10350,'cooldown allowance is still usable after casting');
});
test('explicit disruption uses the ordinary allowance and preserves the separate periodic allowance',()=>{
 const f=fixture(),u=f.a[0],c=RT.unitClock(f.state,u);c.gcdReadyAt=10000;c.cooldowns.heavy=10000;
 RT.applyDamageDelay(f.state,u,{disruption:{gcdMs:500,moveId:'heavy',lcdMs:500}});
 assert.equal(c.gcdReadyAt,10500);assert.equal(c.cooldowns.heavy,10500);
 f.state.elapsedMs=2500;RT.applyDamageDelay(f.state,u,{disruption:{gcdMs:500,moveId:'heavy',lcdMs:500}});assert.equal(c.gcdReadyAt,10500);
 for(let n=0;n<5;n++)RT.applyDamageDelay(f.state,u,{periodic:true});assert.equal(c.gcdReadyAt,10750);assert.equal(c.cooldowns.heavy,10750);
});
test('simultaneous delay notices aggregate applied amounts and do not refresh when caps block damage delays',async()=>{
 const {damageDelayLabels}=await import('../realtime-ui.mjs');
 const f=fixture(),u=f.a[0],c=RT.unitClock(f.state,u);c.gcdReadyAt=10000;c.cooldowns.heavy=10000;
 RT.applyDamageDelay(f.state,u,{periodic:true});RT.applyDamageDelay(f.state,u,{periodic:true});
 assert.deepEqual(damageDelayLabels(c,0),['Cooldowns delayed +0.1s']);
 for(let n=0;n<10;n++)RT.applyDamageDelay(f.state,u,{periodic:true});assert.deepEqual(damageDelayLabels(c,0),['Cooldowns delayed +0.25s']);
 const until=c.delayNotice.until;f.state.elapsedMs=500;RT.applyDamageDelay(f.state,u,{periodic:true});assert.equal(c.delayNotice.until,until);assert.deepEqual(damageDelayLabels(c,until),[]);
});
test('combined cast allowance survives save/load without resurrecting ready GCDs',()=>{
 const f=fixture(),u=f.a[0],c=RT.unitClock(f.state,u);c.pending={choice:{move:heavy},resolveAt:10000};c.gcdReadyAt=10000;
 RT.applyDamageDelay(f.state,u,{hits:5});const restored=JSON.parse(JSON.stringify(f.state));restored.elapsedMs=500;
 RT.applyDamageDelay(restored,u);assert.equal(restored.units[u.id].pending.pushbackMs+restored.units[u.id].pending.damageGcdDelayMs,750);
 restored.units[u.id].gcdReadyAt=0;RT.applyDamageDelay(restored,u,{periodic:true});assert.equal(restored.units[u.id].gcdReadyAt,0);
});

test('short cooldown damage caps scale from their recorded starting duration',()=>{
 for(const [duration,direct,periodic]of [[1500,225,112.5],[2000,300,150],[3500,500,250],[10000,500,250]]){
  const f=fixture(),u=f.a[0],c=RT.unitClock(f.state,u);c.gcdReadyAt=duration;c.cooldowns.hit=duration;
  c.damageDelays.gcd={durationMs:duration,direct:0,periodic:0};c.damageDelays['move:hit']={durationMs:duration,direct:0,periodic:0};
  for(let n=0;n<10;n++)RT.applyDamageDelay(f.state,u);
  assert.equal(c.gcdReadyAt,duration+direct);assert.equal(c.cooldowns.hit,duration+direct);
  for(let n=0;n<10;n++)RT.applyDamageDelay(f.state,u,{periodic:true});
  assert.equal(c.gcdReadyAt,duration+direct+periodic);assert.equal(c.cooldowns.hit,duration+direct+periodic);
 }
});
test('scheduling records modified cooldown durations and later haste or timer reduction cannot change caps',()=>{
 const f=fixture(),u=f.a[0];const result=f.schedule(u,heavy,{style:'agile'}),c=RT.unitClock(f.state,u);
 assert.ok(result.ok);assert.equal(c.damageDelays.gcd.durationMs,result.profile.gcdMs);assert.equal(c.damageDelays['move:heavy'].durationMs,result.profile.localCooldownMs);
 const duration=c.damageDelays.gcd.durationMs;c.pending=null;f.state.elapsedMs=1000;c.gcdReadyAt=1500;u.stages={speed:6};
 for(let n=0;n<10;n++)RT.applyDamageDelay(f.state,u);
 assert.equal(c.gcdReadyAt,1500+Math.min(500,duration*.15));assert.equal(c.damageDelays.gcd.durationMs,duration);
});
test('proportional allowances persist across save/load and also bound explicit disruption',()=>{
 const f=fixture(),u=f.a[0],c=RT.unitClock(f.state,u);c.gcdReadyAt=2000;c.damageDelays.gcd={durationMs:2000,direct:0,periodic:0};
 RT.applyDamageDelay(f.state,u,{disruption:{gcdMs:500}});assert.equal(c.gcdReadyAt,2300);
 RT.preserveAfflictions(f.state,u);const saved=JSON.parse(JSON.stringify(u)),state=RT.createRealTimeState(1000),restored=RT.unitClock(state,saved);
 assert.equal(restored.damageDelays.gcd.durationMs,2000);RT.applyDamageDelay(state,saved);assert.equal(restored.gcdReadyAt,2300);
 for(let n=0;n<10;n++)RT.applyDamageDelay(state,saved,{periodic:true});assert.equal(restored.gcdReadyAt,2450);
});

test('incoming direct, periodic and disruptive damage cannot extend instant Technique timers',()=>{
 const f=fixture(),u=f.a[0],instant={...hit,castMs:0,cooldownMs:12000};
 assert.ok(f.schedule(u,instant).ok);const c=RT.unitClock(f.state,u),gcd=c.gcdReadyAt,local=c.cooldowns.hit;
 f.step(100);assert.equal(c.pending,null);
 for(const options of [{hits:4},{periodic:true},{disruption:{gcdMs:500,moveId:'hit',lcdMs:500}}])RT.applyDamageDelay(f.state,u,options);
 assert.equal(c.gcdReadyAt,gcd);assert.equal(c.cooldowns.hit,local);
});
test('instant local cooldown remains protected while another Technique is being cast',()=>{
 const f=fixture(),u=f.a[0];f.schedule(u,{...hit,timing:'lcd',castMs:0,cooldownMs:20000});f.step(1000);
 const c=RT.unitClock(f.state,u),local=c.cooldowns.hit;assert.ok(f.schedule(u,heavy).ok);
 const gcd=c.gcdReadyAt,cast=c.pending.resolveAt;RT.applyDamageDelay(f.state,u);
 assert.equal(c.cooldowns.hit,local);assert.ok(c.gcdReadyAt>gcd);assert.ok(c.pending.resolveAt>cast);
});
