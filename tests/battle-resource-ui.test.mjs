import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import * as E from '../engine.mjs';

const source=readFileSync(new URL('../app.mjs',import.meta.url),'utf8');
// Exercise the actual battle rendering/selection functions without booting storage or canvas.
const functions=['spOf','activeBattleAlly','battleMoves','moveEligibility','moveDetails','battleHTML','totalActionCost','speedHint','enemyChoice'];
const extract=name=>{const start=source.indexOf('function '+name+'('),next=source.slice(start+1).search(/\n(?:async )?function /);return source.slice(start,next<0?source.length:start+1+next);};
const move=n=>({id:'move-'+n,name:'Technique '+n,kind:'physical',power:30,speed:0,baseUses:35,desc:'A test technique.'});
const species=(id,moves)=>({id,forms:['Test Spirimon'],base:'Beast',alter:'Elemental',domains:[],health:100,power:50,speed:40,moves,ability:'None'});
const individual=(s,id)=>({...E.heal(E.makeIndividual(s,10,0,()=>.5),s),id});
function ui(allies,enemy,speciesList,extra={}){
 const context=vm.createContext({E,s:{spirits:allies,species:Object.fromEntries(speciesList.map(s=>[s.id,s])),rank:1},battle:{ally:allies[0].id,enemy,round:1,credits:{a:0,b:0}},selectedMove:0,borrow:0,style:'normal',commit:.5,battleMode:'moves',hpHTML:()=>'',esc:String,action:(name,label)=>'<button>'+label+'</button>',...extra});
 vm.runInContext(functions.map(extract).join('\n'),context);return context;
}
test('double-battle previews use the next acting Spirimon, including its fourth move',()=>{
 const firstSp=species('first',[move(0)]),secondSp=species('second',[move(1),move(2),move(3),move(4)]),enemySp=species('enemy',[move(5)]),a=individual(firstSp,'first-unit'),b=individual(secondSp,'second-unit'),enemy=individual(enemySp,'enemy-unit');a.pp=a.willpower=0;
 const context=ui([a,b],enemy,[firstSp,secondSp,enemySp],{selectedMove:3,battleMode:'tactics'});context.battle.multi={allies:[a.id,b.id],orders:{[a.id]:{move:E.STRUGGLE}}};
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
