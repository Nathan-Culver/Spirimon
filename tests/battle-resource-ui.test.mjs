import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import * as E from '../engine.mjs';
import * as BAI from '../battle-ai.mjs';
import * as Q from '../equipment.mjs';

const source=readFileSync(new URL('../app.mjs',import.meta.url),'utf8');
// Exercise the actual battle rendering/selection functions without booting storage or canvas.
const functions=['battleTeams','battleTargetHTML','doubleStatusHTML','combatTagsHTML','doubleHUDsHTML','party','spOf','activeBattleAlly','battleMoves','moveEligibility','moveDetails','battleMovePreviewKey','openBattleMoves','selectBattleMove','movePreviewHTML','battleHTML','totalActionCost','battleMoveCost','speedHint','enemyChoice'];
const extract=name=>{const start=source.indexOf('function '+name+'('),next=source.slice(start+1).search(/\n(?:async )?function /);return source.slice(start,next<0?source.length:start+1+next);};
const move=n=>({id:'move-'+n,name:'Technique '+n,kind:'physical',power:30,speed:0,baseUses:35,desc:'A test technique.'});
const species=(id,moves)=>({id,forms:['Test Spirimon'],base:'Beast',alter:'Elemental',domains:[],health:100,power:50,speed:40,moves,ability:'None'});
const individual=(s,id)=>({...E.heal(E.makeIndividual(s,10,0,()=>.5),s),id});
function ui(allies,enemy,speciesList,extra={}){
 const context=vm.createContext({E,BAI,Q,s:{spirits:allies,species:Object.fromEntries(speciesList.map(s=>[s.id,s])),party:allies.map(i=>i.id),rank:1},battle:{ally:allies[0].id,enemy,round:1,credits:{a:0,b:0}},selectedMove:0,borrow:0,style:'normal',commit:.5,battleMode:'moves',movePreviewKey:null,actionBusy:false,render:()=>{},$:()=>null,hpHTML:()=>'',esc:String,action:(name,label)=>'<button>'+label+'</button>',...extra});
 vm.runInContext(functions.map(extract).join('\n'),context);return context;
}
test('double-battle previews use the next acting Spirimon, including its fourth move',()=>{
 const firstSp=species('first',[move(0)]),secondSp=species('second',[move(1),move(2),move(3),move(4)]),enemySp=species('enemy',[move(5)]),a=individual(firstSp,'first-unit'),b=individual(secondSp,'second-unit'),enemy=individual(enemySp,'enemy-unit');a.pp=a.willpower=0;
 const context=ui([a,b],enemy,[firstSp,secondSp,enemySp],{selectedMove:3,battleMode:'tactics'});context.battle.multi={allies:[a.id,b.id],enemies:[enemy],orders:{[a.id]:{move:E.STRUGGLE}}};
 assert.equal(vm.runInContext('activeBattleAlly().id',context),b.id);
 const html=vm.runInContext('battleHTML()',context);assert.match(html,/USE Technique 4/);assert.match(html,/1 STA/);
});
test('a paid charged move remains selectable at 0/0 and previews no additional cost',()=>{
 const charge={...move(0),effect:'twoTurn'},s=species('charge',[charge]),enemySp=species('enemy',[move(1)]),a=individual(s,'actor'),enemy=individual(enemySp,'enemy');a.pp=1;
 E.executeAction(a,s,enemy,enemySp,charge,'normal',.5,()=>.5);assert.equal(a.pp,0);assert.equal(a.willpower,0);
 const context=ui([a],enemy,[s,enemySp]);const html=vm.runInContext('battleHTML()',context);
 assert.doesNotMatch(html,/disabled/);assert.match(html,/STA <strong>0<\/strong>/);assert.equal(vm.runInContext('totalActionCost()',context),0);
});
test('enemy AI retains its paid charged move after exhausting both shared pools',()=>{
 const charge={...move(0),effect:'twoTurn'},s=species('charge',[charge]),other=species('other',[move(1)]),a=individual(other,'ally'),enemy=individual(s,'enemy');enemy.pp=1;
 E.executeAction(enemy,s,a,other,charge,'normal',.5,()=>.5);
 const context=ui([a],enemy,[s,other]);assert.equal(vm.runInContext('enemyChoice().move.id',context),charge.id);
});

test('first selection previews narrative while keeping every move visible and spending nothing',()=>{
 const ward={...move(1),kind:'status',power:0,effect:'ward',desc:'Raise a protective ward.'},sp=species('preview',[move(0),ward]),foe=species('foe',[move(2)]),a=individual(sp,'actor'),enemy=individual(foe,'foe');
 const context=ui([a],enemy,[sp,foe]),before={hp:a.hp,pp:a.pp,willpower:a.willpower};
 vm.runInContext('selectBattleMove(1)',context);
 assert.equal(context.battleMode,'moves');assert.equal(context.selectedMove,1);assert.equal(context.battle.round,1);assert.deepEqual({hp:a.hp,pp:a.pp,willpower:a.willpower},before);
 const html=vm.runInContext('battleHTML()',context);assert.ok(html.includes(E.moveLore(ward).description));assert.ok(html.includes(E.moveLore(ward).context));assert.doesNotMatch(html,/Effects:<\/b>/);assert.match(html,/aria-pressed="true"/);assert.match(html,/move-preview/);assert.match(html,/Technique 0/);assert.match(html,/Technique 1/);assert.doesNotMatch(html,/USE Technique/);
});
test('a different move replaces the preview; selecting that same move again opens its tactics',()=>{
 const sp=species('preview',[move(0),move(1)]),foe=species('foe',[move(2)]),a=individual(sp,'actor'),enemy=individual(foe,'foe'),context=ui([a],enemy,[sp,foe]);
 vm.runInContext('selectBattleMove(0);selectBattleMove(1)',context);assert.equal(context.battleMode,'moves');assert.equal(context.selectedMove,1);
 vm.runInContext('selectBattleMove(1)',context);assert.equal(context.battleMode,'tactics');assert.match(vm.runInContext('battleHTML()',context),/USE Technique 1/);assert.equal(context.battle.round,1);
});
test('returning from tactics retains the preview but reopening Fight starts a fresh first selection',()=>{
 const sp=species('preview',[move(0)]),foe=species('foe',[move(1)]),a=individual(sp,'actor'),enemy=individual(foe,'foe'),context=ui([a],enemy,[sp,foe]);
 vm.runInContext('selectBattleMove(0);selectBattleMove(0);openBattleMoves()',context);assert.ok(vm.runInContext('battleHTML()',context).includes(E.moveLore(sp.moves[0]).description));
 vm.runInContext('selectBattleMove(0)',context);assert.equal(context.battleMode,'tactics');
 vm.runInContext('openBattleMoves(true);selectBattleMove(0)',context);assert.equal(context.battleMode,'moves');
});
test('a preview from another actor or round cannot skip the first selection',()=>{
 const sp=species('preview',[move(0)]),foe=species('foe',[move(1)]),a=individual(sp,'first'),b=individual(sp,'second'),enemy=individual(foe,'foe'),context=ui([a,b],enemy,[sp,foe]);
 context.battle.multi={allies:[a.id,b.id],orders:{}};vm.runInContext('selectBattleMove(0)',context);context.battle.multi.orders[a.id]={move:sp.moves[0]};
 vm.runInContext('selectBattleMove(0)',context);assert.equal(context.battleMode,'moves');assert.equal(vm.runInContext('activeBattleAlly().id',context),b.id);
 context.battle.round++;vm.runInContext('selectBattleMove(0)',context);assert.equal(context.battleMode,'moves');
});
test('unfunded and invalid selections cannot arm a preview',()=>{
 const energy={...move(1),kind:'spiritual',baseUses:10},sp=species('preview',[move(0),energy]),foe=species('foe',[move(2)]),a=individual(sp,'actor'),enemy=individual(foe,'foe');a.pp=0;a.willpower=1;
 const context=ui([a],enemy,[sp,foe]);vm.runInContext('selectBattleMove(0);selectBattleMove(-1);selectBattleMove(99)',context);assert.equal(context.movePreviewKey,null);assert.equal(context.battleMode,'moves');
 vm.runInContext('selectBattleMove(1)',context);assert.notEqual(context.movePreviewKey,null);assert.equal(a.willpower,1);
});
test('a paid charged move can be previewed and confirmed at 0/0 without spending again',()=>{
 const charge={...move(0),effect:'twoTurn'},sp=species('preview',[charge]),foe=species('foe',[move(1)]),a=individual(sp,'actor'),enemy=individual(foe,'foe');a.pp=1;
 E.executeAction(a,sp,enemy,foe,charge,'normal',.5,()=>.5);const context=ui([a],enemy,[sp,foe]);vm.runInContext('selectBattleMove(0);selectBattleMove(0)',context);
 assert.equal(context.battleMode,'tactics');assert.equal(a.pp,0);assert.equal(a.willpower,0);assert.equal(vm.runInContext('totalActionCost()',context),0);
});
