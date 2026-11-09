import test from 'node:test';
import assert from 'node:assert/strict';
import {commandMetrics,actorCommandSlots,commandIdentity,commandPosition,cooperativeCommandKey,cooperativeCommandSlots} from '../battle-commands.mjs';
import {createBattleView} from '../battle-view.mjs';
import * as E from '../engine.mjs';
import * as ST from '../support-techniques.mjs';
import * as SE from '../spiritual-energy.mjs';
import * as RT from '../realtime-combat.mjs';
function fixture(){const s=E.newGame('command-layout'),sp=E.makeSpecies('command-sp','Beast','Fey'),units=[0,1,2,3,4,5].map(n=>({...E.heal(E.makeIndividual(sp,40,2,E.rng(n)),sp),id:'ally-'+n})),enemy={...structuredClone(units[0]),id:'enemy'};s.party=units.map(u=>u.id);s.spirits=units;s.species[sp.id]=sp;SE.ensureSealer(s);const battle={rt:RT.createRealTimeState(),multi:{allies:units.slice(0,3).map(u=>u.id),enemies:[enemy]},enemy,log:[]},ctx={active:{a:units.slice(0,3),b:[enemy]},teams:{a:units,b:[enemy]},rules:{},sealers:{a:s.sealer},speciesOf:()=>sp};const view=createBattleView({getBattle:()=>battle,getState:()=>s,getMode:()=> 'main',realTimeContext:()=>ctx,spOf:()=>sp,battleMoves:()=>sp.moves,sealButtonHTML:()=>'',xpHTML:()=>'',party:()=>units,activeBattleAlly:()=>units[0],esc:String,action:(a,label)=>'<button data-action="'+a+'">'+label+'</button>'});return {s,sp,units,battle,ctx,view};}
test('the complete dock fits a bounded grid at phone and desktop sizes without pages',()=>{
 for(const [width,height]of [[640,280],[740,320],[768,337],[1536,674],[280,640],[390,844]]){
  const m=commandMetrics(width,height,1,54);assert.ok(m.capacity>=54);assert.equal(commandPosition(53,m.columns).row,m.rows);
  assert.ok(m.rows*m.cellHeight+(m.rows-1)*3+75<height,'fit '+width+'x'+height);
 }
});
test('recalling and replacing a member reuses its four cells without moving the other two members',()=>{const initial=actorCommandSlots([],['a','b','c']),recalled=actorCommandSlots(initial,['b','c']),replacement=actorCommandSlots(recalled,['d','b','c']);assert.deepEqual(initial,['a','b','c']);assert.deepEqual(recalled,[null,'b','c']);assert.deepEqual(replacement,['d','b','c']);});
test('command keys distinguish the two team utilities and keep Seal stable while targets change',()=>{assert.notEqual(commandIdentity('data-action="battle-switch" data-slot-key="release"'),commandIdentity('data-action="battle-switch" data-slot-key="switch"'));assert.equal(commandIdentity('data-action="unified-seal" data-value="one"'),commandIdentity('data-action="unified-seal" data-value="two"'));});
test('cooperative slots follow actor positions when a participant is replaced',()=>{
 const a={id:'pack:one:two',participants:[{id:'one'},{id:'two'}]},b={id:'pack:replacement:two',participants:[{id:'replacement'},{id:'two'}]};
 assert.equal(cooperativeCommandKey(a,['one','two','three']),cooperativeCommandKey(b,['replacement','two','three']));
 assert.equal(new Set(cooperativeCommandSlots(['triune','united'])).size,16);
});
test('all ready Techniques, support, items and utilities are visible together in one box',()=>{
 const t=fixture(),shield=ST.generateSupport('all-buttons',{primary:'shield',basic:true});t.s.sealer.known[shield.id]=shield;t.s.sealer.assignments[t.units[0].id]=[shield.id];t.units[0].hp=1;
 const html=t.view.unifiedBattleActionsHTML(),buttons=[...html.matchAll(/<button\b[^>]*>/g)].map(m=>m[0]);
 assert.equal(buttons.filter(b=>b.includes('data-unified-move')).length,12);
 for(const group of ['moves','support','items','utility'])assert.ok(buttons.some(b=>b.includes('data-command-group="'+group+'"')),group);
 assert.ok(buttons.every(b=>!b.includes('hidden')));assert.equal((html.match(/class="command-deck"/g)||[]).length,1);
 assert.doesNotMatch(t.view.realTimeBattleHTML(),/role="tablist"|battle-command-tab|battle-command-page|command-utilities/);
});
test('cooldowns, item consumption, targeting and recall never move surviving actions',()=>{
 const t=fixture();t.units[0].hp=t.units[1].hp=1;
 const tag=(html,action,value)=>[...html.matchAll(/<button[^>]*>/g)].map(m=>m[0]).find(b=>b.includes('data-action="'+action+'"')&&(!value||b.includes('data-value="'+value+'"')));
 const before=t.view.unifiedBattleActionsHTML(),style=b=>b.match(/style="([^"]+)"/)[1],fixed=style(tag(before,'unified-move','ally-1|0')),tonic=style(tag(before,'tonic')),run=style(tag(before,'flee'));
 RT.unitClock(t.battle.rt,t.units[0]).readyAt=4000;let after=t.view.unifiedBattleActionsHTML();assert.equal(tag(after,'unified-move','ally-0|0'),undefined);assert.equal(style(tag(after,'unified-move','ally-1|0')),fixed);assert.equal(style(tag(after,'tonic')),tonic);assert.equal(style(tag(after,'flee')),run);
 t.ctx.active.a=t.ctx.active.a.slice(1);t.s.inventory.tonics=0;after=t.view.unifiedBattleActionsHTML();assert.equal(tag(after,'tonic'),undefined);assert.equal(style(tag(after,'unified-move','ally-1|0')),fixed);assert.equal(style(tag(after,'flee')),run);
 t.s.inventory.tonics=2;t.battle.enemyTargetSelection=0;after=t.view.unifiedBattleActionsHTML();assert.equal(style(tag(after,'tonic')),tonic);assert.equal(t.battle.rt.elapsedMs,0);
});
test('item sealing keeps its reserved cell when the enemy target changes',()=>{
 assert.equal(commandIdentity('data-action="item-seal" data-value="one"'),commandIdentity('data-action="item-seal" data-value="two"'));
});
