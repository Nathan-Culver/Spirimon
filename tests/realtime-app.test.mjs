import {installBattleBoundaries} from './helpers/battle-boundaries.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import * as E from '../engine.mjs';
import * as RT from '../realtime-combat.mjs';
import * as BAI from '../battle-ai.mjs';
import * as SE from '../spiritual-energy.mjs';
import {individualSpecies} from '../anatomy.mjs';
const source=readFileSync(new URL('../app.mjs',import.meta.url),'utf8');
const extract=name=>{const start=source.indexOf('function '+name+'(');assert.ok(start>=0,name);const next=source.slice(start+1).search(/\n(?:async )?function /);return source.slice(start,next<0?source.length:start+1+next);};
function harness(double=false){
 const hit={id:'hit',name:'Strike',kind:'physical',type:'Beast',power:35,accuracy:1,speed:0},sp={id:'test',forms:['Test'],base:'Beast',alter:'Fey',domains:[],health:130,power:40,speed:40,moves:[hit],learnset:[hit]};
 const team=side=>[0,1].map(n=>({...E.heal(E.makeIndividual(sp,20,0,E.rng(n)),sp),id:side+n})),allies=team('a'),enemies=team('b');
 const battle={ally:allies[0].id,enemy:enemies[0],enemyTeam:[enemies[1]],round:7,log:[],credits:{a:2,b:1},...(double?{multi:{allies:allies.map(u=>u.id),enemies,reserves:[],orders:{[allies[0].id]:{move:hit}},credits:{a:{0:1}}}}:{})};
 const h=vm.createContext({battleClosingDialogue:()=>false,cloneScene:()=>null,queueBattleIntroduction(){},requestStartupFullscreen(){},sceneFadeUntil:0,performance,E,RT,BAI,SE,individualSpecies,s:{seed:'qa',playTime:0,spirits:allies,party:allies.map(u=>u.id),species:{test:sp},inventory:{tonics:2,ethers:2}},battle,modal:null,document:{hidden:false},lastRealTimeUi:0,lastRealTimeDraw:0,save(){},render(){},collectDamageNumbers(){},refreshSpiritualBattleUI(){},refreshRealTimeUI(){},finishRealTimeEncounter(){},drawBattle(){},drawRealTimeEffects(){},finishRound(){},seconds:x=>x/1000+'s'});
 vm.runInContext(['party','spOf','activeBattleAlly','battleMoves','battleTeams','realTimeContext','ensureRealTimeBattle','applyRealTimeContext','runEnemySealer','advanceRealTimeBattle'].map(extract).join('\n'),h);
 installBattleBoundaries(h);vm.runInContext('ensureRealTimeBattle()',h);return {h,allies,enemies,sp,frame:ms=>vm.runInContext('advanceRealTimeBattle(100,'+ms+')',h)};
}
test('legacy single battles migrate to a real-time clock and the enemy attacks an idle player',()=>{
 const t=harness(),hp=t.allies[0].hp;assert.equal(t.h.battle.credits,undefined);assert.equal(t.h.battle.rt.version,2);
 for(let n=1;n<=40;n++)t.frame(n*100);assert.ok(t.allies[0].hp<hp);assert.equal(t.h.battle.round,7,'No rounds should be advanced');
});
test('double battles discard queued turn orders and independently command both enemy slots',()=>{
 const t=harness(true);assert.equal(Object.keys(t.h.battle.multi.orders).length,0);assert.equal(t.h.battle.multi.credits,undefined);
 for(let n=1;n<=30;n++)t.frame(n*100);
 assert.ok(t.h.battle.rt.units.b0.gcdReadyAt>0||t.h.battle.rt.units.b0.cooldowns.hit>0);assert.ok(t.h.battle.rt.units.b1.gcdReadyAt>0||t.h.battle.rt.units.b1.cooldowns.hit>0);assert.ok(t.h.battle.rt.actionCount>=2);
});
test('hidden tabs freeze the battle, but deployment choices do not pause real-time combat',()=>{
 const t=harness();t.h.document.hidden=true;for(let n=1;n<=20;n++)t.frame(n*100);assert.equal(t.h.battle.rt.elapsedMs,0);
 t.h.document.hidden=false;t.h.battle.pendingSwitch={out:'a0'};t.frame(2100);assert.equal(t.h.battle.rt.elapsedMs,100);delete t.h.battle.pendingSwitch;t.frame(2200);assert.equal(t.h.battle.rt.elapsedMs,200);
});
test('player allies remain manually controlled even when a legacy Auto flag is present',()=>{
 const t=harness(true);t.h.battle.autoAllies={a0:true,a1:true};for(let n=1;n<=30;n++)t.frame(n*100);
 assert.equal(t.h.battle.rt.units.a0.pending,null);assert.equal(t.h.battle.rt.units.a1.pending,null);assert.equal(t.h.battle.rt.units.a0.gcdReadyAt,0);assert.equal(t.h.battle.rt.units.a1.gcdReadyAt,0);
});
