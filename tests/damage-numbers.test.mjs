import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import * as E from '../engine.mjs';
import * as RT from '../realtime-combat.mjs';
import {DAMAGE_NUMBER_MS,damageNumberFrame,drawDamageNumbers} from '../damage-numbers.mjs';
import {damageNumberAnchor} from '../sprites.mjs';
const hit={id:'hit',name:'Strike',power:40,category:'Physical',kind:'physical',accuracy:1,type:'Beast',castMs:0,timing:'gcd'};
function fixture(move=hit,count=1){
 const sp={id:'numbers',forms:['Test'],base:'Beast',alter:'Fey',domains:[],health:160,power:45,speed:40,moves:[move],learnset:[move]};
 const make=id=>({...E.heal(E.makeIndividual(sp,25,0,E.rng(id)),sp),id,nature:'Hardy'}),a=make('a'),b=Array.from({length:count},(_,n)=>make('b'+n));
 const context={active:{a:[a],b},teams:{a:[a],b},speciesOf:()=>sp},state=RT.createRealTimeState();E.bindBattlefield([a],b);
 return {sp,a,b,context,state,cast:()=>RT.scheduleAction(state,context,a,{type:'move',move}),step:ms=>RT.advanceRealTime(state,ms,context,()=>.5)};
}
const sum=(f,id)=>f.state.damageEvents?.filter(e=>e.target===id).reduce((n,e)=>n+e.amount,0)||0;
test('display events contain final HP lost after shields, damage sharing, multi-hits and overkill',()=>{
 for(const protection of ['partial','full','link','overkill']){
  const f=fixture({...hit,power:12,effect:'multiHit'},2),[b,partner]=f.b,before=b.hp,partnerHP=partner.hp;
  if(protection==='partial')b.spiritualShields=[{hp:7,until:10000}];
  if(protection==='full')b.spiritualShields=[{hp:100000,until:10000}];
  if(protection==='link')b.spiritualLinks=[{partner:partner.id,amount:.5,until:10000}];
  if(protection==='overkill')b.hp=1;
  const hp=b.hp;assert.ok(f.cast().ok);f.step(100);
  assert.equal(sum(f,b.id),hp-b.hp,protection);assert.equal(sum(f,partner.id),partnerHP-partner.hp);
  if(protection==='full')assert.equal(f.state.damageEvents,undefined);
  if(protection==='overkill')assert.equal(sum(f,b.id),1);
  if(protection==='partial')assert.ok(sum(f,b.id)>0&&sum(f,b.id)<before);
 }
});
test('each spread target and recoil get their own correctly attributed amount',()=>{
 const f=fixture({...hit,target:'allOpponents',effect:'recoil'},2),hp=[f.a,...f.b].map(u=>u.hp);
 assert.ok(f.cast().ok);f.step(100);
 for(const [n,u]of [f.a,...f.b].entries())assert.equal(sum(f,u.id),hp[n]-u.hp);
 assert.ok(f.state.damageEvents.some(e=>e.side==='a'));assert.ok(f.b.every(u=>sum(f,u.id)>0));
});
test('ongoing damage is reported before regeneration, and delayed attacks report their protected final amount',()=>{
 const f=fixture(),b=f.b[0];b.status='poison';b.conditions={regenerate:5};b.hp-=50;
 const hp=b.hp;f.step(2000);assert.ok(sum(f,b.id)>0);assert.ok(b.hp>hp,'regeneration must not erase the damage number');
 const delayed=fixture(),v=delayed.b[0],before=v.hp;v.delayedDamage={amount:40,turns:2};v.spiritualShields=[{hp:10,until:10000}];
 delayed.step(4000);assert.equal(sum(delayed,v.id),before-v.hp);assert.equal(sum(delayed,v.id),30);
});
test('numbers rise slowly, wobble both ways, shrink, fade and expire after 2.6 seconds',()=>{
 const n={amount:42,at:0,x:500,y:150,headSize:60,width:1000,height:550};
 const start=damageNumberFrame(n,0,1000,550),right=damageNumberFrame(n,600,1000,550),left=damageNumberFrame(n,2200,1000,550);
 assert.equal(start.size,60);assert.ok(right.x>start.x&&left.x<start.x);assert.ok(left.y<right.y&&right.y<start.y);
 assert.ok(left.size<right.size&&right.size<start.size);assert.equal(start.alpha,1);assert.ok(left.alpha>0&&left.alpha<1&&left.dissolve>0);
 assert.equal(damageNumberFrame(n,-1,1000,550),null);assert.equal(damageNumberFrame(n,DAMAGE_NUMBER_MS,1000,550),null);
 const phone=damageNumberFrame(n,0,500,275);assert.equal(phone.size,30);assert.equal(phone.x,250);
});
test('drawing uses red text over a black outline and dissolves through a fragment mask',()=>{
 const calls=[],rects=[],c={save(){},restore(){},measureText:()=>({width:80}),strokeText(text,x,y){calls.push({text,x,y,ink:this.strokeStyle,width:this.lineWidth});},fillText(){calls.push({ink:this.fillStyle,alpha:this.globalAlpha});},beginPath(){},rect:(...a)=>rects.push(a),clip(){}};
 const n={amount:27,at:0,x:500,y:150,headSize:60,width:1000,height:550};
 drawDamageNumbers(c,[n],0,1000,550);assert.equal(calls[0].text,'27');assert.equal(calls[0].ink,'#000');assert.ok(calls[0].width>0);assert.equal(calls[1].ink,'#ff3030');assert.match(c.font,/900 60px/);
 drawDamageNumbers(c,[n],2200,1000,550);assert.ok(rects.length>0);const count=calls.length;drawDamageNumbers(c,[n],2600,1000,550);assert.equal(calls.length,count);
 const small=damageNumberAnchor({},0,{x:400,ground:300,size:100}),large=damageNumberAnchor({},0,{x:400,ground:300,size:300});assert.ok(large.headSize>small.headSize);assert.ok(large.y<small.y);
});

const source=readFileSync(new URL('../app.mjs',import.meta.url),'utf8');
function extract(name){const start=source.indexOf('function '+name+'('),next=source.slice(start+1).search(/\n(?:async )?function /);return source.slice(start,next<0?source.length:start+1+next);}
test('collection pins a knockout number to the damaged enemy, survives compaction and consumes each event once',()=>{
 const canvas={width:1000,height:550},enemy={id:'victim',hp:0,appearance:0},battle={rt:{elapsedMs:100,damageEvents:[{target:'victim',side:'b',amount:17,at:100}]}};
 const h=vm.createContext({battleClosingDialogue:()=>false,cloneScene:()=>null,queueBattleIntroduction(){},requestStartupFullscreen(){},sceneFadeUntil:0,performance,battle,DAMAGE_NUMBER_MS,document:{querySelector:()=>canvas},battleTeams:()=>({enemies:[enemy]}),spOf:()=>({}),damageNumberAnchor:(sp,f,p)=>({x:p.x,y:80,headSize:60})});
 vm.runInContext(extract('collectDamageNumbers'),h);h.layout={b:[{id:'other',x:200},{id:'victim',x:800}]};vm.runInContext('collectDamageNumbers(layout)',h);
 assert.equal(battle.damageNumbers[0].amount,17);assert.equal(battle.damageNumbers[0].x,800);assert.equal(battle.rt.damageEvents.length,0);
 h.layout={b:[{id:'other',x:500}]};vm.runInContext('collectDamageNumbers(layout)',h);assert.equal(battle.damageNumbers.length,1);assert.equal(battle.damageNumbers[0].x,800);
});
test('a final hit finishes its animation with combat frozen before awarding victory once',()=>{
 const f=fixture(),enemy=f.b[0];enemy.hp=0;f.state.elapsedMs=100;
 const battle={log:[],rt:f.state,multi:{allies:[f.a.id],enemies:[enemy]},damageNumbers:[{amount:1,at:100}],damageEnding:null};let wins=0,draws=0;
 const h=vm.createContext({battleClosingDialogue:()=>false,cloneScene:()=>null,queueBattleIntroduction(){},requestStartupFullscreen(){},sceneFadeUntil:0,performance,E,s:{spirits:[]},spOf:()=>null,battle,RT,DAMAGE_NUMBER_MS,document:{hidden:false},realTimeContext:()=>f.context,applyRealTimeContext(ctx){battle.multi.allies=ctx.active.a.map(u=>u.id);battle.multi.enemies=ctx.active.b;},drawBattle(){draws++;},drawRealTimeEffects(){},winBattle(){wins++;h.battle=null;},drawnBattle(){},render(){},save(){}});
 vm.runInContext(extract('finishRealTimeEncounter')+'\n'+extract('advanceRealTimeBattle'),h);vm.runInContext('finishRealTimeEncounter()',h);
 assert.equal(wins,0);assert.equal(battle.rt.paused,true);assert.equal(battle.damageEnding,2700);
 vm.runInContext('advanceRealTimeBattle(1300,0)',h);assert.equal(wins,0);assert.equal(battle.rt.elapsedMs,100);assert.ok(draws>0);
 vm.runInContext('advanceRealTimeBattle(1300,0)',h);assert.equal(wins,1);assert.equal(h.battle,null);
});
