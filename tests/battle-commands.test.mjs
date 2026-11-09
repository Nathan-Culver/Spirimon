import test from 'node:test';
import assert from 'node:assert/strict';
import {commandMetrics,actorCommandSlots,commandIdentity,commandPosition,cooperativeCommandKey,cooperativeCommandSlots,reserveCommandCells} from '../battle-commands.mjs';
import {createBattleView} from '../battle-view.mjs';
import * as E from '../engine.mjs';
import * as ST from '../support-techniques.mjs';
import * as SE from '../spiritual-energy.mjs';
import * as RT from '../realtime-combat.mjs';
function fixture(){const s=E.newGame('command-layout'),sp=E.makeSpecies('command-sp','Beast','Fey'),units=[0,1,2,3,4,5].map(n=>({...E.heal(E.makeIndividual(sp,40,2,E.rng(n)),sp),id:'ally-'+n})),enemy={...structuredClone(units[0]),id:'enemy'};s.party=units.map(u=>u.id);s.spirits=units;s.species[sp.id]=sp;SE.ensureSealer(s);const battle={rt:RT.createRealTimeState(),multi:{allies:units.slice(0,3).map(u=>u.id),enemies:[enemy]},enemy,log:[]},ctx={active:{a:units.slice(0,3),b:[enemy]},teams:{a:units,b:[enemy]},rules:{},sealers:{a:s.sealer},speciesOf:()=>sp};const view=createBattleView({getBattle:()=>battle,getState:()=>s,getMode:()=>battle.mode||'main',realTimeContext:()=>ctx,spOf:()=>sp,battleMoves:()=>sp.moves,sealButtonHTML:()=>'',xpHTML:()=>'',party:()=>units,activeBattleAlly:()=>units[0],esc:String,action:(a,label)=>'<button data-action="'+a+'">'+label+'</button>'});return {s,sp,units,battle,ctx,view};}
test('the complete dock fits a bounded grid at phone and desktop sizes without pages',()=>{
 for(const [width,height]of [[640,280],[740,320],[768,337],[915,412],[1536,674],[280,640],[390,844],[1920,1080]])for(const scale of [1,1.35])for(const slots of [1,9,18,35,54,72]){
  const m=commandMetrics(width,height,scale,slots);assert.ok(m.capacity>=slots);assert.equal(commandPosition(slots-1,m.columns).row,m.rows);
  assert.ok(m.rows<=2,'two rows at '+width+'x'+height);
  assert.ok(m.rows*m.cellHeight+(m.rows-1)*m.gap+m.chromeHeight<=height/3,'third-height dock at '+width+'x'+height);
 }
});
test('consumed and cooling commands retain their reserved cells',()=>{const initial=reserveCommandCells([],['move','support','tonic','run']);assert.deepEqual(reserveCommandCells(initial,['move','support','run']),initial);});
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
test('a solo party does not reserve nonexistent allies, held equipment or cooperative families',()=>{
 const t=fixture();t.ctx.teams.a=t.ctx.active.a=[t.units[0]];t.battle.multi.allies=[t.units[0].id];t.s.spirits=[t.units[0]];t.view.unifiedBattleActionsHTML();
 assert.equal(t.battle.commandCells.filter(key=>key.startsWith('unified-move|')).length,4);
 assert.equal(t.battle.commandCells.filter(key=>key.startsWith('cooperative-use|')||key.startsWith('unified-held|')).length,0);
 assert.ok(t.battle.commandLayout.rows<=2);
});
test('release, recall and member replacement retain the same dock geometry and surviving cells',()=>{
 const t=fixture(),positions=html=>new Map([...html.matchAll(/<button\b([^>]*)>/g)].map(m=>[m[1].match(/data-action="([^"]+)"/)?.[1]+'|'+m[1].match(/data-value="([^"]+)"/)?.[1],m[1].match(/style="([^"]+)"/)?.[1]]));
 const before=positions(t.view.unifiedBattleActionsHTML()),columns=t.battle.commandLayout.columns;
 t.ctx.active.a=[t.units[1],t.units[2]];t.battle.multi.allies=t.ctx.active.a.map(u=>u.id);const recalled=positions(t.view.unifiedBattleActionsHTML());assert.equal(t.battle.commandLayout.columns,columns);
 t.ctx.active.a.unshift(t.units[3]);t.battle.multi.allies=t.ctx.active.a.map(u=>u.id);const replaced=positions(t.view.unifiedBattleActionsHTML());assert.equal(t.battle.commandLayout.columns,columns);
 for(const [key,position]of before)if(recalled.has(key)&&replaced.has(key)){assert.equal(recalled.get(key),position,key);assert.equal(replaced.get(key),position,key);}
 assert.equal(replaced.get('unified-move|ally-3|0'),before.get('unified-move|ally-0|0'));
});
test('deployment and secondary choices fit the same two-row policy with one header Back action',()=>{
 const t=fixture();for(const mode of ['deploy','support','coop','bag']){t.battle.mode=mode;const html=t.view.realTimeBattleHTML(),rows=Number(html.match(/--command-rows:(\d+)/)?.[1]);assert.ok(rows>=1&&rows<=2,mode);assert.equal((html.match(/data-action="battle-main"/g)||[]).length,1,mode);assert.match(html,/battle-command-header[\s\S]*data-action="battle-main"/);}
 t.battle.mode='deploy';const html=t.view.realTimeBattleHTML();for(const u of t.units)assert.ok(html.includes('data-value="'+u.id+'"'),u.id);
});
