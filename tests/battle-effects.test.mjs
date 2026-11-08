import test from 'node:test';
import assert from 'node:assert/strict';
import {battlePose,battleMeshPoint,drawAnimatedBattleSprite,BATTLE_EFFECT_MS} from '../battle-sprite-animation.mjs';
import {screenEffects,particleEmitter,effectArtwork,drawIllustratedEffect,drawEmitter,prepareBattleEvents} from '../battle-effects.mjs';
import {allMoveTemplates} from '../moves.mjs';
import {MOVE_CATALOG} from '../engine.mjs';
const from={x:100,y:330},to={x:760,y:160};
const ctx=()=>{const calls=[];return {calls,c:new Proxy({},{
 get:(_,name)=>(...args)=>{assert.ok(args.every(v=>typeof v!=='number'||Number.isFinite(v)),String(name));calls.push([name,...args]);},
 set:(_,key,value)=>{calls.push([key,value]);return true;}
})};};
test('every catalog technique has valid artwork, finite layered effects, and bounded deterministic particles',()=>{
 const moves=[...new Map([...allMoveTemplates(),...MOVE_CATALOG].map(m=>[m.id,m])).values()];
 assert.ok(moves.length>300);
 for(const move of moves){
  const art=effectArtwork(move);assert.ok(art.atlas===0||art.atlas===1);assert.ok(art.cell>=0&&art.cell<64);
  for(const age of [0,100,300,500,750,900]){
   const particles=particleEmitter(move,age,from,to);assert.ok(particles.length<=40);
   assert.deepEqual(particles,particleEmitter(move,age,from,to));
   assert.ok(particles.every(p=>Number.isFinite(p.x+p.y+p.alpha+p.radius)&&p.alpha>=0&&p.alpha<=1));
   const {c}=ctx();drawIllustratedEffect(c,move,age,from,to,1000,550,{image:{width:1254,height:1254}});drawEmitter(c,move,age,from,to,1000,550);
  }
 }
});
test('screen effects remain bounded under overlapping attacks and reset completely',()=>{
 const events=Array.from({length:30},(_,n)=>({move:{id:'quake'+n,name:'Fault Quake',power:120,category:'Physical'},at:0,flashAllowed:n===0}));
 const frame=screenEffects(events,360);assert.ok(Math.abs(frame.x)<=7&&Math.abs(frame.y)<=5);assert.ok(frame.dim<=.28&&frame.flash<=.16);
 assert.deepEqual(screenEffects(events,BATTLE_EFFECT_MS),{x:0,y:0,dim:0,flash:0,invert:0,color:'#ffffff'});
 const reduced=screenEffects(events,360,{reduced:true});assert.equal(reduced.x,0);assert.equal(reduced.y,0);assert.equal(reduced.flash,0);assert.equal(reduced.invert,0);
});
test('a strong portal attack can invert and flash once, while ineligible events cannot',()=>{
 const event={move:{name:'Void Beam',power:100,domain:'Void'},at:0,flashAllowed:true};
 const peak=screenEffects([event],370);assert.ok(peak.invert>0&&peak.flash>0);
 assert.equal(screenEffects([{...event,flashAllowed:false}],370).flash,0);
 assert.equal(screenEffects([{...event,flashAllowed:false}],370).invert,0);
});
test('poses interpolate locally, deform body parts, return home, and respect reduced motion',()=>{
 const move={name:'Talon Slash',power:60},p=battlePose(move,200,{time:0});
 assert.ok(p.lean>0&&p.reach>0);assert.ok(battlePose(move,200,{side:'b'}).lean<0);
 assert.ok(battlePose({power:0},200).lean<0);
 assert.equal(battlePose(move,600).lean,0);assert.equal(battlePose(move,600).reach,0);
 const rig={kind:'biped',arms:2},top=battleMeshPoint(.5,.1,p,rig),foot=battleMeshPoint(.5,1,p,rig);assert.notEqual(top.x,.5);assert.equal(foot.x,.5);assert.equal(foot.y,1);
 const idle=battlePose(null,-1,{time:500});assert.notEqual(idle.breath,0);
 assert.equal(battlePose(move,215,{reduced:true}).lean,0);
 assert.ok(battlePose({name:'Rolling Strike',power:40},215).flip<0);
});
test('mesh rendering isolates each atlas frame and balances canvas state',()=>{
 const {c,calls}=ctx(),image={width:768,height:256};
 drawAnimatedBattleSprite(c,image,[256,0,256,256],{id:'custom',anatomy:{bodyPlan:'biped',limbs:{arms:2}}},1,10,20,96,96,battlePose({power:40},220));
 assert.equal(calls.filter(c=>c[0]==='save').length,calls.filter(c=>c[0]==='restore').length);
 assert.equal(calls.filter(c=>c[0]==='transform').length,32);
});
test('effect snapshots preserve the original target through fainting, switching and all-target techniques',()=>{
 const layout={a:[{id:'a',effect:{x:100,y:300}},{id:'ally',effect:{x:200,y:300}}],b:[{id:'b',effect:{x:800,y:100}},{id:'other',effect:{x:900,y:100}}]};
 const move={name:'Void Beam',power:90,target:'opponent'};
 const prepared=prepareBattleEvents([{actor:'a',target:'b',side:'a',move,at:100}],layout);
 layout.b[0].effect.x=500;layout.b.splice(0,1);
 assert.equal(prepared.events[0].visualTargets[0].x,800);
 const support=prepareBattleEvents([{actor:'a',target:'a',side:'a',move:{target:'allAllies'},at:100}],layout);
 assert.equal(support.events[0].visualTargets.length,2);
 const self=prepareBattleEvents([{actor:'a',target:'b',side:'a',move:{target:'self'},at:100}],layout);
 assert.equal(self.events[0].visualTargets[0].x,100);
});
test('repeat events sort by time and flashes are gated across frames without weak moves consuming the gate',()=>{
 const beam={name:'Solar Beam',power:100},weak={name:'Gentle Touch',power:10};
 const first=prepareBattleEvents([{move:beam,at:100},{move:weak,at:0},{move:beam,at:55}],null);
 assert.deepEqual(first.events.map(e=>e.at),[0,55,100]);
 assert.deepEqual(first.events.map(e=>e.flashAllowed),[false,true,false]);
 const second=prepareBattleEvents([{move:beam,at:800},{move:beam,at:960}],null,first.lastFlashAt);
 assert.deepEqual(second.events.map(e=>e.flashAllowed),[false,true]);
});
