import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import * as E from '../engine.mjs';
import * as RT from '../realtime-combat.mjs';
import * as SE from '../spiritual-energy.mjs';
import {individualSpecies} from '../anatomy.mjs';
import {installBattleBoundaries} from './helpers/battle-boundaries.mjs';

const source=readFileSync(new URL('../app.mjs',import.meta.url),'utf8');
const extract=name=>{const start=source.indexOf('function '+name+'('),next=source.slice(start+1).search(/\n(?:async )?function /);assert.ok(start>=0,name);return source.slice(start,next<0?source.length:start+1+next);};
function harness(){
 const hit={id:'test-hit',name:'Test Strike',kind:'physical',type:'Beast',power:32,accuracy:1,baseUses:5};
 const sp={...E.makeSpecies('resource-ui','Beast','Elemental',[]),forms:['Test','Second','Third'],moves:[hit],learnset:[hit],ability:'None'};
 const units=['one','two','three','foe'].map((id,n)=>({...E.heal(E.makeIndividual(sp,20,0,E.rng(n)),sp),id})),allies=units.slice(0,3),enemy=units[3];
 const s=E.newGame('resource-ui');Object.assign(s,{spirits:allies,party:allies.map(u=>u.id),species:{[sp.id]:sp},inventory:{tonics:2,ethers:2,seals:0}});SE.ensureSealer(s);
 const battle={ally:allies[0].id,controlledAlly:allies[0].id,enemy,enemyRoster:[enemy],multi:{allies:allies.map(u=>u.id),enemies:[enemy],reserves:[],orders:{}},rt:RT.createRealTimeState(),log:[],rules:{}};
 const h=vm.createContext({E,RT,SE,individualSpecies,s,battle,battleMode:'main',esc:String,action:(name,label)=>'<button data-action="'+name+'">'+label+'</button>'});
 vm.runInContext(['party','spOf','activeBattleAlly','battleMoves','battleTeams','realTimeContext','ensureRealTimeBattle','realTimeBattleHTML','battleHTML'].map(extract).join('\n'),h);installBattleBoundaries(h);
 return {h,s,battle,sp,hit,allies,enemy,html:()=>h.battleView.realTimeBattleHTML(),actions:()=>h.battleView.unifiedBattleActionsHTML()};
}
test('the current action dock exposes every ready ally without queuing turn orders',()=>{
 const t=harness(),html=t.actions();for(const u of t.allies)assert.match(html,new RegExp('data-unified-move="'+u.id+'\\|0"'));
 assert.deepEqual(Object.keys(t.battle.multi.orders),[]);assert.doesNotMatch(t.html(),/USE Test Strike|ROUND |YOUR BONUS/);
});
test('one ally cooling down does not hide another ally’s available Technique',()=>{
 const t=harness();RT.unitClock(t.battle.rt,t.allies[0]).gcdReadyAt=4000;const html=t.actions();assert.doesNotMatch(html,/data-unified-move="one\|0"/);assert.match(html,/data-unified-move="two\|0"/);
});
test('exhausted allies receive Struggle instead of an unfunded equipped Technique',()=>{
 const t=harness();t.allies[0].pp=t.allies[0].willpower=0;assert.match(t.actions(),/<b>Struggle<\/b>/);assert.equal(t.h.battleMoves(t.allies[0])[0].id,'struggle');
});
test('the selected enemy’s Pressure changes the displayed and required resource cost',()=>{
 const t=harness();t.sp.ability='Pressure';t.allies[0].pp=1;t.allies[0].willpower=2;const html=t.actions();assert.match(html,/STA 2/);
 t.allies[0].willpower=0;assert.equal(t.h.battleMoves(t.allies[0])[0].id,'struggle');assert.match(t.actions(),/<b>Struggle<\/b>/);
});
test('rendering the battle does not spend resources or advance the simulation',()=>{
 const t=harness(),before=JSON.stringify({hp:t.allies.map(u=>u.hp),pp:t.allies.map(u=>u.pp),time:t.battle.rt.elapsedMs});
 t.html();t.actions();assert.equal(JSON.stringify({hp:t.allies.map(u=>u.hp),pp:t.allies.map(u=>u.pp),time:t.battle.rt.elapsedMs}),before);
});
test('casting blocks only that actor and the HUD reports its remaining cast',()=>{
 const t=harness(),clock=RT.unitClock(t.battle.rt,t.allies[0]);clock.pending={resolveAt:2000,choice:{type:'move',move:t.hit}};
 assert.doesNotMatch(t.actions(),/data-unified-move="one\|0"/);assert.match(t.actions(),/data-unified-move="two\|0"/);assert.match(t.html(),/CAST 2\.0s/);
});
test('item restrictions hide consumables without disabling ready attacks',()=>{
 const t=harness();t.allies[0].hp-=5;assert.match(t.actions(),/Tonic ×2/);t.battle.rules.noItems=true;assert.doesNotMatch(t.actions(),/Tonic ×2/);assert.match(t.actions(),/data-unified-move=/);
});
test('Technique action tooltips keep the narrative description',()=>{
 const t=harness();assert.ok(t.actions().includes(E.moveLore(t.hit).description+'"'));assert.match(t.actions(),/50% attack/);
});
test('legacy battles migrate to the current view and never expose the old round UI',()=>{
 const t=harness();delete t.battle.rt;t.battle.credits={a:2,b:1};t.battle.multi.orders={one:{move:t.hit}};
 const html=vm.runInContext('battleHTML()',t.h);assert.equal(t.battle.rt.version,2);assert.equal(t.battle.credits,undefined);assert.deepEqual(Object.keys(t.battle.multi.orders),[]);assert.match(html,/unified-action-grid/);assert.doesNotMatch(html,/ROUND |YOUR BONUS|USE Test Strike/);
});

test('guided practice keeps time paused while exposing a real Technique command, with other lessons disabled',()=>{
 const t=harness();t.battle.rt.paused=true;t.battle.lesson={stage:5,practice:true};assert.match(t.actions(),/data-unified-move/);assert.doesNotMatch(t.actions(),/<button disabled class="unified-action ua-move/);assert.equal(t.battle.rt.paused,true);
 t.battle.lesson={stage:2,practice:false};assert.match(t.actions(),/<button disabled class="unified-action ua-move/);assert.equal(t.battle.rt.paused,true);
});
