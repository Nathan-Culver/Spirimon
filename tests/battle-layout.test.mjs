import test from 'node:test';
import assert from 'node:assert/strict';
import {battleStageLayout} from '../battle-layout.mjs';
import {damageDelayLabels} from '../realtime-ui.mjs';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const team=count=>Array.from({length:count},(_,slot)=>({id:'unit-'+slot,hp:100}));
const mobile=(a,b,height=240)=>battleStageLayout({height,compact:true,multi:true,allies:team(a),enemies:team(b)});

test('phone sprites enlarge independently as either living team becomes smaller',()=>{
 for(const side of ['a','b']){
  const sizes=[1,2,3].map(count=>mobile(side==='a'?count:2,side==='b'?count:2)[side][0].size);
  assert.ok(sizes[0]>sizes[1]&&sizes[1]>sizes[2],side+' must grow with fewer combatants');
 }
});
test('phone single battles put allies in the center, enemies on the right, and ally stats beside the platform',()=>{
 const {a:[ally],b:[enemy]}=mobile(1,1);
 assert.ok(ally.x>=450&&ally.x<=550);assert.ok(enemy.x>=800);
 assert.ok((ally.hud.left+ally.hud.width)*10<ally.x-ally.size/2,'HUD must remain to the left of the sprite');
 assert.ok(ally.hud.top*2.4<ally.ground,'HUD sits beside the creature rather than below its platform');
});
test('fainting compacts the formation without changing target indices',()=>{
 const allies=team(3),enemies=team(3);allies[0].hp=0;enemies[1].hp=0;
 const layout=battleStageLayout({height:240,compact:true,multi:true,allies,enemies});
 assert.deepEqual(layout.a.map(p=>p.slot),[1,2]);assert.deepEqual(layout.b.map(p=>p.slot),[0,2]);
 assert.deepEqual(layout.a.map(p=>p.x),mobile(2,2).a.map(p=>p.x));
 assert.ok(layout.a[0].size>mobile(3,3).a[0].size);
});
test('every phone formation stays on canvas at landscape and portrait aspect ratios',()=>{
 for(const height of [240,360,550,1000])for(let a=1;a<=3;a++)for(let b=1;b<=3;b++){
  const layout=mobile(a,b,height);
  for(const point of [...layout.a,...layout.b]){
   assert.ok(point.x-point.size/2>=0&&point.x+point.size/2<=1000);
   assert.ok(point.ground-point.size>=0&&point.ground+point.ry+6<height);
   assert.ok(point.hud.left>=0&&point.hud.left+point.hud.width<=100);
   assert.equal(point.effect.x,point.x);assert.ok(point.effect.y>point.ground-point.size&&point.effect.y<point.ground);
  }
 }
});
test('desktop formations keep the existing platform positions',()=>{
 const multi=battleStageLayout({height:550,multi:true,allies:team(3),enemies:team(3)});
 assert.deepEqual(multi.a.map(p=>p.x),[120,280,440]);assert.deepEqual(multi.b.map(p=>p.x),[560,720,880]);
 const single=battleStageLayout({height:550,allies:team(1),enemies:team(1)});
 assert.equal(single.a[0].x,260);assert.equal(single.b[0].x,735);
});

test('app animations target the displayed slots after fainting compacts a phone formation',()=>{
 const allies=team(3),enemies=team(3).map(u=>({...u,id:'foe-'+u.id}));allies[0].hp=0;enemies[1].hp=0;
 const canvas={width:1000,height:240,getContext:()=>({save(){},restore(){},measureText:text=>({width:text.length*7}),strokeText(){},fillText:(text,x,y)=>notices.push({text,x,y})})},calls=[],notices=[];
 const battle={multi:{allies:allies.map(u=>u.id),enemies},rt:{elapsedMs:100,units:{[allies[1].id]:{delayNotice:{at:0,until:1200,castMs:250,timers:{gcd:100}}}}},rtAnimations:[{at:0,side:'a',actor:allies[1].id,target:enemies[2].id,move:{}}]};
 const h=vm.createContext({battleStageLayout,damageDelayLabels,battle,s:{spirits:allies},$:()=>canvas,matchMedia:()=>({matches:true}),E:{moveTarget:m=>m.target||'opponent'},realTimeContext:()=>({active:{a:allies,b:enemies}}),drawTechnique:(c,m,p,from,to)=>calls.push({from,to})});
 const source=readFileSync(new URL('../app.mjs',import.meta.url),'utf8');
 for(const name of ['currentBattleLayout','animationPositions','drawRealTimeEffects']){
  const start=source.indexOf('function '+name+'('),next=source.slice(start+1).search(/\n(?:async )?function /);
  vm.runInContext(source.slice(start,next<0?source.length:start+1+next),h);
 }
 const expected=battleStageLayout({height:240,compact:true,multi:true,allies,enemies});
 const animation=vm.runInContext("animationPositions('a',1,2,{})",h);vm.runInContext('drawRealTimeEffects()',h);
 assert.deepEqual(animation.from,expected.a[0].effect);assert.deepEqual(animation.to,expected.b[1].effect);
 assert.deepEqual(calls[0].from,animation.from);assert.deepEqual(calls[0].to,animation.to);
 assert.deepEqual(notices.map(n=>n.text),['Cast delayed +0.25s','GCD delayed +0.1s']);
 assert.equal(notices[0].x,expected.a[0].effect.x);
});
