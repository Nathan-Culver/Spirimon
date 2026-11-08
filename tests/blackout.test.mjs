import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import * as E from '../engine.mjs';
import * as SW from '../spiritual-world.mjs';
import * as SE from '../spiritual-energy.mjs';
import * as W from '../world.mjs';
import {DAY_MS,CYCLE_MS} from '../spiritual-core.mjs';
const source=readFileSync(new URL('../app.mjs',import.meta.url),'utf8');
const extract=name=>{const a=source.indexOf('function '+name+'('),n=source.slice(a+1).search(/\n(?:async )?function /);assert.ok(a>=0,name);return source.slice(a,n<0?source.length:a+1+n);};
function fixture(){
 const s=E.newGame('blackout'),sp=E.makeSpecies('blackout-party','Beast','Fey');s.species[sp.id]=sp;
 const u=E.heal(E.makeIndividual(sp,5,0,E.rng('blackout')),sp);s.spirits=[u];s.party=[u.id];s.starter=true;SE.ensureSealer(s);return {s,sp,u};
}
function remoteShrines(s){const out=[];for(let cx=-4;cx<=4&&out.length<2;cx++)for(let cy=-4;cy<=4&&out.length<2;cy++)if(cx||cy)out.push(...SW.shrinesForRegion(s.seed,cx,cy));assert.equal(out.length,2);return out;}
test('every starting town has exactly one reachable Shrine, including worlds previously without one',()=>{
 for(let n=0;n<70;n++){
  const seed='starting-shrine-'+n,[shrine,...extra]=SW.shrinesForRegion(seed,0,0,'hard');assert.ok(shrine,seed);assert.equal(extra.length,0);
  const buildings=W.buildings(0,0),seen=new Set(),q=[[24,19]],target=shrine.x+','+(shrine.y+1);
  for(let k=0;k<q.length;k++){
   const [x,y]=q[k],key=x+','+y;if(seen.has(key)||x<0||y<0||x>=48||y>=36||x===shrine.x&&y===shrine.y||!E.walkable(E.tile(seed,x,y))||buildings.some(b=>W.buildingFootprintBlocked(b,x,y))||W.featureFootprintBlocked(x,y))continue;
   seen.add(key);for(const [dx,dy]of [[0,1],[0,-1],[1,0],[-1,0]])q.push([x+dx,y+dy]);
  }
  assert.ok(seen.has(target),seed+' Shrine landing is reachable');
 }
});
test('approaching a Shrine updates the persisted visit without consuming its action; indoors and caves do not',()=>{
 const {s}=fixture(),[a,b]=remoteShrines(s);
 for(const shrine of [a,b]){s.player={...s.player,x:shrine.x,y:shrine.y+1};assert.equal(SW.rememberShrineVisit(s).id,shrine.id);assert.equal(SE.recoveryAvailable(s,'restore',shrine.id).ok,true);}
 s.player={...s.player,x:a.x,y:a.y+1};s.cave={x:1,y:1};assert.equal(SW.rememberShrineVisit(s),null);delete s.cave;s.interior={kind:'inn'};assert.equal(SW.rememberShrineVisit(s),null);delete s.interior;
 const loaded=JSON.parse(JSON.stringify(s));assert.equal(SW.blackoutShrine(loaded).id,b.id);
});
test('normal region discovery records a nearby Shrine before saving, without requiring interaction',()=>{
 const {s}=fixture(),[shrine]=remoteShrines(s);s.player={...s.player,x:shrine.x,y:shrine.y+1};let saved;
 const h=vm.createContext({battleClosingDialogue:()=>false,cloneScene:()=>null,queueBattleIntroduction(){},requestStartupFullscreen(){},sceneFadeUntil:0,performance,encounterAftermath:()=>'',s,E,SW,ensureRegion(cx,cy){s.regions[cx+','+cy]={...E.region(s.seed,cx,cy),visited:true};},save(){saved=JSON.parse(JSON.stringify(s));}});
 vm.runInContext(extract('discoverRegion'),h);h.discoverRegion();assert.equal(saved.lastShrine.id,shrine.id);
});
test('blackout uses the last visited Shrine even when spent and a closer unused Shrine exists',()=>{
 const {s}=fixture(),[a,b]=remoteShrines(s);s.player={...s.player,x:a.x,y:a.y+1};SW.rememberShrineVisit(s);SE.beginRecovery(s,'commune',{shrineId:a.id,safe:true});s.player={...s.player,x:b.x,y:b.y+1};
 assert.equal(SE.recoveryAvailable(s,'restore',a.id).ok,false);assert.equal(SE.recoveryAvailable(s,'restore',b.id).ok,true);assert.equal(SW.blackoutShrine(s).id,a.id);
});
test('no prior visit and stale checkpoints return to the starting Shrine; older valid rest points migrate',()=>{
 const {s}=fixture(),starter=SW.shrinesForRegion(s.seed,0,0)[0],[a]=remoteShrines(s);s.player={...s.player,x:a.x,y:a.y+1};assert.equal(SW.blackoutShrine(s).id,starter.id);
 s.safe={x:a.x,y:a.y+1};assert.equal(SW.blackoutShrine(s).id,a.id);
 s.lastShrine={id:'missing',x:a.x,y:a.y};assert.equal(SW.blackoutShrine(s).id,starter.id);
 s.lastShrine={id:'corrupt',x:null,y:Infinity};assert.equal(SW.blackoutShrine(s).id,starter.id);
});
test('spent Shrine blackouts wait for the next reset, restore the party, and preserve long cooldowns',()=>{
 for(const start of [12345,DAY_MS+12345,CYCLE_MS+12345]){
  const {s,sp,u}=fixture(),shrine=SW.blackoutShrine(s);s.playTime=start;SE.beginRecovery(s,'meditate',{shrineId:shrine.id,safe:true});const before=s.playTime,oldKey=SE.calendarPhase(before).key;
  u.hp=0;u.pp=0;u.willpower=0;u.status='poison';u.moveCooldowns={long:9900000};s.sealer.energy=0;s.sealer.supportCooldowns.long=9900000;const clock=s.sealer.clockMs;
  const result=SE.blackoutRecovery(s,shrine.id);assert.ok(result.ok);assert.ok(result.waitedMs>0);assert.notEqual(SE.calendarPhase(s.playTime).key,oldKey);assert.equal(s.playTime,result.waitedMs+before);
  assert.equal(u.hp,E.stats(u,sp).hp);assert.equal(u.pp,E.stats(u,sp).pp);assert.equal(u.willpower,E.stats(u,sp).willpower);assert.equal(u.status,null);assert.equal(s.sealer.energy,s.sealer.maxEnergy);assert.equal(s.sealer.clockMs,clock);assert.equal(u.moveCooldowns.long,9900000);assert.equal(s.sealer.supportCooldowns.long,9900000);
  for(const kind of ['restore','meditate','commune'])assert.equal(SE.recoveryAvailable(s,kind,shrine.id).ok,false);
  assert.ok(s.sealer.recoveryUses['shrine:'+shrine.id+':'+oldKey]);
 }
 const {s}=fixture(),shrine=SW.blackoutShrine(s);s.playTime=12345;assert.equal(SE.blackoutRecovery(s,shrine.id).waitedMs,0);assert.equal(s.playTime,12345);
});
test('the actual defeat handler restores at the last Shrine and preserves defeat costs and dropped supplies',()=>{
 const {s,sp,u}=fixture(),[shrine]=remoteShrines(s);s.player={...s.player,x:shrine.x,y:shrine.y+1};SW.rememberShrineVisit(s);SE.beginRecovery(s,'restore',{shrineId:shrine.id,safe:true});
 s.player={...s.player,x:400,y:-90};s.interior={kind:'inn'};s.cave={id:'temple',x:5,y:5};s.mountedSteed=u.id;u.hp=0;const coins=s.inventory.coins,clock=s.sealer.clockMs;let title,saved;
 const h=vm.createContext({battleClosingDialogue:()=>false,cloneScene:()=>null,queueBattleIntroduction(){},requestStartupFullscreen(){},sceneFadeUntil:0,performance,encounterAftermath:()=>'',s,E,SE,SW,battle:{},view:'spirits',challengerApproach:{},resetExplorationMotion(){},recordCompetitionDefeat(){},endCombatState(){},save(){saved=JSON.parse(JSON.stringify(s));},render(){},showModal(t){title=t;},esc:String,action:()=>''});
 vm.runInContext(['recoverAtShrine','loseBattle'].map(extract).join('\n'),h);h.loseBattle();assert.equal(h.battle,null);assert.equal(h.view,'explore');assert.equal(h.challengerApproach,null);assert.equal(title,'You blacked out.');assert.equal(saved.lastShrine.id,shrine.id);assert.equal(SW.nearbyShrine(s).id,shrine.id);assert.equal(s.cave,undefined);assert.equal(s.interior,undefined);assert.equal(s.mountedSteed,null);assert.equal(u.hp,E.stats(u,sp).hp);assert.equal(s.sealer.clockMs,clock);assert.equal(s.inventory.coins,coins-25);assert.deepEqual([s.drops[0].x,s.drops[0].y],[400,-90]);assert.equal(s.drops[0].items.seals,2);
});
test('battle wipeout blacks out immediately, while a conscious reserve keeps deployment available and a tie stays a draw',()=>{
 for(const mode of ['wipeout','reserve','draw']){
  let losses=0,draws=0;const team=[{id:'a',hp:0},...(mode==='reserve'?[{id:'reserve',hp:2}]:[])],enemy={id:'enemy',hp:mode==='draw'?0:3};
  const ctx={active:{a:[],b:enemy.hp?[enemy]:[]},teams:{a:team,b:[enemy]}};
  const h=vm.createContext({battleClosingDialogue:()=>false,cloneScene:()=>null,queueBattleIntroduction(){},requestStartupFullscreen(){},sceneFadeUntil:0,performance,encounterAftermath:()=>'',battle:{rt:{elapsedMs:1,undefendeda:0},multi:{allies:[],enemies:[enemy]},damageNumbers:[]},realTimeContext:()=>ctx,applyRealTimeContext(){},loseBattle:()=>losses++,drawnBattle:()=>draws++,winBattle(){throw Error('Unexpected victory');},save(){},render(){},DAMAGE_NUMBER_MS:1000});
  vm.runInContext(extract('finishRealTimeEncounter'),h);h.finishRealTimeEncounter();assert.equal(losses,mode==='wipeout'?1:0);assert.equal(draws,mode==='draw'?1:0);if(mode==='reserve')assert.equal(h.battleMode,'deploy');
 }
});
test('the last conscious Spirimon falling to an exploration affliction triggers blackout; an empty starting roster does not',()=>{
 for(const size of [0,1,2]){
  let losses=0;const team=Array.from({length:size},()=>({hp:1}));
  const h=vm.createContext({battleClosingDialogue:()=>false,cloneScene:()=>null,queueBattleIntroduction(){},requestStartupFullscreen(){},sceneFadeUntil:0,performance,encounterAftermath:()=>'',s:{sealer:{clockMs:10}},party:()=>team,lead:()=>team[0],spOf:()=>({}),RT:{advanceExplorationAfflictions(u){u.hp=0;return {damage:1};}},loseBattle:()=>losses++,toast(){}});
  vm.runInContext(extract('explorationStatusPulse'),h);h.explorationStatusPulse(1000);assert.equal(losses,size===1?1:0);
 }
});
