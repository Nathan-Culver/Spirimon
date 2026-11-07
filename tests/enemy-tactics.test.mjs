import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../engine.mjs';
import * as RT from '../realtime-combat.mjs';
import * as SE from '../spiritual-energy.mjs';
import * as BAI from '../battle-ai.mjs';
import * as TP from '../temple-philosophies.mjs';
import {chooseEnemySupport,runEnemyTactics} from '../enemy-tactics.mjs';
import {generateSupport,validateSupport,supportFits} from '../support-techniques.mjs';
const strike={id:'tactic-strike',name:'Strike',type:'Beast',category:'Physical',power:35,accuracy:1,baseUses:35,castMs:0},counter={...strike,id:'counter',name:'Counterstroke',power:60,effect:'counter',timing:'lcd',castMs:0};
function fixture(count=1){
 const sp={id:'tactic-creature',base:'Beast',alter:'Giant',domains:[],forms:['First','Second','Third'],health:400,power:50,speed:40,moves:[strike,counter],learnset:[strike,counter]};
 const create=id=>{const u=E.heal(E.makeIndividual(sp,20,0,E.rng(id)),sp);u.id=id;u.moveIds=[strike.id,counter.id];E.normalizeResources(u,sp);return u;};
 const a=create('a'),team=Array.from({length:count},(_,n)=>create('b'+n)),q=SE.enemySealer('tactics',team,()=>sp),state=RT.createRealTimeState(),context={active:{a:[a],b:[...team]},teams:{a:[a],b:team},speciesOf:()=>sp,sealers:{b:q},rules:{maxActive:3}};
 q.known={};q.assignments=Object.fromEntries(team.map(u=>[u.id,[]]));q.floating=null;q.energy=q.maxEnergy=200;q.advanced=[];RT.synchronizeTimers(state,context);return {sp,a,team,q,state,context};
}
function resolveSupport(f){while((f.state.supportCasts||[]).length)RT.advanceRealTime(f.state,250,f.context,()=>.5);}
function teach(f,kind,extra={}){const t={...generateSupport('tactic-'+kind,{primary:kind,basic:true}),...extra};f.q.known[t.id]=t;for(const u of f.team)f.q.assignments[u.id].push(t.id);return t;}
test('real-time counters reject absent, stale, wrong-category and wrong-source hits, including in actual damage resolution',()=>{
 for(const hit of [null,{amount:40,category:'Energy',source:'a',at:100},{amount:40,category:'Physical',source:'other',at:100},{amount:40,category:'Physical',source:'a',at:0},{amount:40,category:'Physical',source:'a'},{amount:40,category:'Physical',source:'a',at:10000}]){
  const f=fixture(),u=f.team[0];f.state.elapsedMs=9000;u.realtimeNow=9000;u.lastHit=hit;const ctx={realTime:true,speciesOf:()=>f.sp,opponents:[f.a],allies:[u],team:[u]};
  assert.equal(E.counterDamage(u,f.a,counter),0);assert.equal(BAI.expectedDamage(u,f.sp,f.a,f.sp,counter),0);assert.notEqual(BAI.chooseBattleAction(u,ctx,()=>.5)?.move.id,'counter');
  const hp=f.a.hp,log=E.executeAction(u,f.sp,f.a,f.sp,counter,'normal',.5,()=>.5,1,{realTime:true,prepaid:true});assert.equal(f.a.hp,hp);assert.ok(log.some(l=>l.includes('nothing to retaliate')));
 }
});
test('a matching recent hit produces a legal counter; a fresh attack cannot refresh another unit’s old hit through a shared-damage link',()=>{
 const f=fixture(2),u=f.team[0],partner=f.team[1];u.lastHit={amount:40,category:'Physical',source:f.a.id,at:2000};u.realtimeNow=10000;
 assert.equal(E.counterDamage(u,f.a,counter),80);u.realtimeNow++;assert.equal(E.counterDamage(u,f.a,counter),0);
 f.state.elapsedMs=10000;RT.synchronizeTimers(f.state,f.context);partner.lastHit={amount:40,category:'Physical',source:f.a.id,at:1};u.spiritualLinks=[{partner:partner.id,amount:.2,until:20000}];
 assert.ok(RT.scheduleAction(f.state,f.context,f.a,{type:'move',move:strike,targetIndex:0}).ok);RT.advanceRealTime(f.state,50,f.context,()=>.5);assert.equal(u.lastHit.at,f.state.elapsedMs);assert.equal(partner.lastHit.at,1);assert.equal(E.counterDamage(partner,f.a,counter),0);
});
test('counter AI chooses a matching received hit over a weak ordinary strike and honors target identity',()=>{
 const f=fixture(),u=f.team[0];u.battlePhilosophy='Counterplay';u.lastHit={amount:80,category:'Physical',source:f.a.id,at:0};u.realtimeNow=100;
 const ctx={realTime:true,speciesOf:()=>f.sp,opponents:[f.a],allies:[u],team:[u]};assert.equal(BAI.chooseBattleAction(u,ctx,()=>.5).move.id,counter.id);u.lastHit.category='Energy';assert.notEqual(BAI.chooseBattleAction(u,ctx,()=>.5).move.id,counter.id);
});
test('Prediction exposes wounded targets by Health fraction instead of comparing differently sized creatures',()=>{
 const precise={...strike,effect:'sureHit'},actor={hp:1000},target={hp:100};const full=TP.philosophyMoveWeight('Prediction',precise,{actor,target,targetMaxHp:100}),wounded=TP.philosophyMoveWeight('Prediction',precise,{actor,target:{hp:30},targetMaxHp:100});assert.ok(wounded>full);assert.equal(TP.philosophyMoveWeight('Prediction',precise,{actor:{hp:1},target,targetMaxHp:100}),full);
});
test('Transformation works in the scheduler without a boss UI, across save/load, without changing pending casts or cooldowns',()=>{
 let f=fixture(2),u=f.team[0],reserve=f.team[1];u.battlePhilosophy=reserve.battlePhilosophy='Transformation';f.context.active.b=[u];u.hp=Math.floor(E.stats(u,f.sp).hp*.7);reserve.hp=Math.floor(E.stats(reserve,f.sp).hp*.2);
 const clock=RT.unitClock(f.state,u);clock.pending={side:'b',targetSide:'a',targetId:f.a.id,resolveAt:5000,choice:{type:'move',move:strike}};clock.cooldowns.held=9000;u.moveCooldowns.held=9000;const hpRatio=u.hp/E.stats(u,f.sp).hp;
 const result=RT.advanceRealTime(f.state,100,f.context,()=>.5);assert.equal(u.form,1);assert.equal(reserve.form,0,'sealed reserves do not transform');assert.equal(clock.pending.resolveAt,5000);assert.equal(clock.cooldowns.held,9000);assert.ok(Math.abs(u.hp/E.stats(u,f.sp).hp-hpRatio)<.02);assert.ok(result.log.some(l=>l.includes('changes form')));
 const loaded=JSON.parse(JSON.stringify({state:f.state,a:f.a,team:f.team}));u=loaded.team[0];f.context={...f.context,teams:{a:[loaded.a],b:loaded.team},active:{a:[loaded.a],b:[u]}};u.hp=Math.floor(E.stats(u,f.sp).hp*.3);RT.advanceRealTime(loaded.state,50,f.context,()=>.5);assert.equal(u.form,2);assert.equal(RT.unitClock(loaded.state,u).pending.resolveAt,5000);assert.equal(u.moveCooldowns.held,9000);
});
test('Transformation resolves between simultaneous actions and paused combat does not advance it',()=>{
 const f=fixture(),u=f.team[0];u.battlePhilosophy='Transformation';u.hp=Math.ceil(E.stats(u,f.sp).hp*.76);f.state.paused=true;RT.advanceRealTime(f.state,100,f.context);assert.equal(u.form,0);f.state.paused=false;
 assert.ok(RT.scheduleAction(f.state,f.context,f.a,{type:'move',move:strike,targetIndex:0}).ok);RT.advanceRealTime(f.state,50,f.context,()=>.5);assert.equal(u.form,1);assert.ok(u.hp>0);
});
for(const philosophy of TP.TEMPLE_PHILOSOPHIES)test(philosophy+' Sealer prepares its own compatible support families within the ordinary slot rules',()=>{
 const f=fixture(3);for(const u of f.team)u.battlePhilosophy=philosophy;const q=SE.enemySealer('doctrine-'+philosophy,f.team,()=>f.sp);assert.equal(q.philosophy,philosophy);assert.deepEqual(Object.values(q.known).map(t=>t.effects[0].kind),TP.PHILOSOPHY_SUPPORT[philosophy]);assert.ok(Object.values(q.known).every(validateSupport));assert.ok(Object.values(q.assignments).reduce((n,ids)=>n+ids.length,0)<=6);
 for(const u of f.team){assert.ok(q.assignments[u.id].length>=1);for(const id of q.assignments[u.id]){assert.notEqual(id,q.floating);assert.ok(supportFits(q.known[id],u,f.sp,E.activeDomains(f.sp,u)));}}
});
test('a useful secondary cleanse is selected when its primary heal is unnecessary, and the actual shared cooldown is paid',()=>{
 const f=fixture(),u=f.team[0],t=teach(f,'heal');t.effects.push({kind:'cleanse',amount:.1});u.status='poison';const energy=f.q.energy,choice=chooseEnemySupport(f.state,f.context);assert.equal(choice.techniqueId,t.id);const result=runEnemyTactics(f.state,f.context);assert.equal(result.kind,'support');resolveSupport(f);assert.equal(u.status,null);assert.ok(f.q.energy<energy);assert.ok(f.q.supportCooldowns[t.id]>f.state.elapsedMs);
 f.state.elapsedMs+=1200;u.status='poison';const after=f.q.energy;runEnemyTactics(f.state,f.context);assert.equal(f.q.energy,after);assert.equal(u.status,'poison');
});
test('unnecessary healing is skipped; disabled support, insufficient Energy, channel locks and vow restrictions remain enforced',()=>{
 const f=fixture(),t=teach(f,'heal');assert.equal(chooseEnemySupport(f.state,f.context),null);f.team[0].hp=1;assert.ok(chooseEnemySupport(f.state,f.context));
 f.context.rules.noSupport=true;assert.equal(chooseEnemySupport(f.state,f.context),null);f.context.rules.noSupport=false;f.q.energy=0;assert.equal(chooseEnemySupport(f.state,f.context),null);f.q.energy=100;f.state.supportCasts=[{side:'b',resolveAt:5000}];assert.equal(chooseEnemySupport(f.state,f.context),null);f.state.supportCasts=[];f.state.paused=true;assert.equal(runEnemyTactics(f.state,f.context).kind,undefined);assert.equal(f.q.supportCooldowns[t.id],undefined);
});
test('Sealers preserve enough Energy for a sealed reserve unless urgent healing can prevent a knockout',()=>{
 const f=fixture(2);f.context.active.b=[f.team[0]];f.context.rules.maxActive=1;const cost=SE.manifestationCost(f.q,f.team[1],f.sp);f.q.energy=cost;teach(f,'shield');assert.equal(chooseEnemySupport(f.state,f.context),null);
 f.team[0].hp=1;const heal=teach(f,'heal',{energyCost:1});assert.equal(chooseEnemySupport(f.state,f.context).techniqueId,heal.id);
});
test('Synergy coordinates actual cooperative actions, but urgent recovery takes precedence',()=>{
 const f=fixture(2);f.q.philosophy='Synergy';teach(f,'heal');const before=f.q.energy,coordinated=runEnemyTactics(f.state,f.context);assert.equal(coordinated.kind,'cooperative');assert.ok(f.q.energy<before);assert.ok(f.team.every(u=>RT.unitClock(f.state,u).pending));
 const urgent=fixture(2);urgent.q.philosophy='Synergy';teach(urgent,'heal');urgent.team[0].hp=1;const result=runEnemyTactics(urgent.state,urgent.context);assert.equal(result.kind,'support');resolveSupport(urgent);assert.ok(urgent.team[0].hp>1);
});
test('Tempo expiration resets immediately in the visible objective and only records one timeout',()=>{
 const save=E.newGame('timeout'),room={id:'tempo',philosophy:'Tempo',level:0},state=TP.trialState(save,room);save.sealer={clockMs:60000};Object.assign(state,{observed:true,progress:2,deadline:60000});assert.match(TP.trialObjective(save,room),/Beat window expired/);assert.equal(state.progress,0);assert.equal(state.deadline,0);assert.equal(state.timeouts,1);TP.trialObjective(save,room);assert.equal(state.timeouts,1);
});

test('notable Temple defaults allow signature support while preserving defensive and custom vows',()=>{
 for(const philosophy of TP.TEMPLE_PHILOSOPHIES){const f=fixture();f.q.philosophy=philosophy;f.q.vow='open-hand';SE.configureEnemyVow(f.q,true);assert.equal(f.q.vow,['Attrition','Resilience'].includes(philosophy)?'open-hand':null);const once=JSON.stringify(f.q);SE.configureEnemyVow(f.q,true);assert.equal(JSON.stringify(f.q),once);}
 const f=fixture();f.q.philosophy='Tempo';f.q.vow='solitary';SE.configureEnemyVow(f.q,true);assert.equal(f.q.vow,'solitary');
 f.q.vow='open-hand';teach(f,'haste');assert.equal(chooseEnemySupport(f.state,f.context),null);assert.equal(f.q.vow,'open-hand');assert.equal(f.q.vowBroken??null,null);
 f.q.vow='ritualist';const choice=chooseEnemySupport(f.state,f.context);assert.ok(choice);assert.deepEqual(choice.options,{});
});

test('Synergy catches shared ready windows between Sealer decisions before ordinary actions can consume them',()=>{
 const f=fixture(2);f.q.philosophy='Synergy';f.q.tacticsAt=1200;for(const u of f.team)RT.unitClock(f.state,u).readyAt=650;f.state.elapsedMs=600;assert.equal(runEnemyTactics(f.state,f.context).kind,undefined);f.state.elapsedMs=650;const r=runEnemyTactics(f.state,f.context);assert.equal(r.kind,'cooperative');assert.ok(r.log[0].startsWith('Enemy Sealer'));assert.ok(f.team.every(u=>RT.unitClock(f.state,u).pending));
 const recovering=fixture(2);recovering.q.philosophy='Synergy';recovering.q.tacticsAt=1200;recovering.team[0].hp=1;assert.equal(runEnemyTactics(recovering.state,recovering.context).kind,undefined);
});

test('Synergy waits at most 750ms for a legal pair and releases the actors if the window is missed',()=>{
 const f=fixture(2);f.q.philosophy='Synergy';for(const u of f.team)RT.unitClock(f.state,u).readyAt=650;const energy=f.q.energy;const waiting=runEnemyTactics(f.state,f.context);assert.equal(waiting.kind,'coordination');assert.equal(waiting.hold.length,2);assert.equal(f.q.energy,energy);assert.ok(f.team.every(u=>!RT.unitClock(f.state,u).pending));
 f.state.elapsedMs=650;const together=runEnemyTactics(f.state,f.context);assert.equal(together.kind,'cooperative');assert.ok(f.q.energy<energy);
 const late=fixture(2);late.q.philosophy='Synergy';for(const u of late.team)RT.unitClock(late.state,u).readyAt=650;runEnemyTactics(late.state,late.context);late.state.elapsedMs=750;for(const u of late.team)RT.unitClock(late.state,u).readyAt=1000;assert.equal(runEnemyTactics(late.state,late.context).hold,undefined);assert.equal(late.q.coordinationUntil,undefined);assert.equal(late.q.energy,200);
});

test('a Sealer channeling support cannot commit a cooperative action or spend its Energy twice',()=>{
 const f=fixture(2);f.q.philosophy='Synergy';f.state.supportCasts=[{side:'b',resolveAt:5000}];const energy=f.q.energy;assert.equal(runEnemyTactics(f.state,f.context).kind,undefined);assert.equal(f.q.energy,energy);assert.ok(f.team.every(u=>!RT.unitClock(f.state,u).pending));
});

test('the shared enemy profile grants the same advanced releases used by live named opponents',()=>{
 const f=fixture();for(const [level,expected]of [[5,[]],[12,['united']],[25,['triune','united']]]){f.team[0].level=level;assert.deepEqual(SE.enemySealer('advanced',f.team,()=>f.sp).advanced,expected);}
});

test('a transformed target immediately refreshes its accessible name without replacing the selected HUD',()=>{
 const source=readFileSync(new URL('../app.mjs',import.meta.url),'utf8'),start=source.indexOf('function refreshSpiritualBattleUI(){'),end=source.indexOf('\nfunction ',start+1),f=fixture(),u=f.team[0],attrs={},box={dataset:{spiritualHud:u.id},setAttribute:(k,v)=>attrs[k]=v};
 const h=vm.createContext({battle:{rt:f.state},realTimeContext:()=>f.context,document:{querySelector:()=>null,querySelectorAll:selector=>selector==='[data-spiritual-hud]'?[box]:[]},compactBattleHUD:u=>f.sp.forms[u.appearance],spOf:()=>f.sp,refreshExplorationEnergy(){}});vm.runInContext(source.slice(start,end),h);h.refreshSpiritualBattleUI();assert.equal(attrs['aria-label'],'Select enemy First');u.appearance=1;h.refreshSpiritualBattleUI();assert.equal(attrs['aria-label'],'Select enemy Second');assert.equal(box.innerHTML,'Second');
});
