import test from 'node:test';import assert from 'node:assert/strict';import {animationProfile,drawTechnique} from '../move-animations.mjs';import {TYPE_MOVES,ADVANCED_MOVES,EXTRA_MOVES,ENVIRONMENT_MOVES,buildLearnset} from '../moves.mjs';
test('every technique receives deterministic choreography',()=>{
 const moves=[...Object.values(TYPE_MOVES).flat(),...buildLearnset('Beast','Plant',['Fire']),...ADVANCED_MOVES,...EXTRA_MOVES,...ENVIRONMENT_MOVES].filter(m=>m&&typeof m==='object'&&!Array.isArray(m));
 assert.ok(moves.length>40);
 for(const m of moves){const a=animationProfile(m);assert.ok(a.family&&a.color&&a.count>0);assert.deepEqual(a,animationProfile(m));}
});
test('all animation families render without relying on browser globals',()=>{
 const ctx={save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},arc(){},ellipse(){},fillRect(){},fill(){}};
 for(const name of ['Healing Remedy','Shield Barrier','Thunder Storm','Sleep Curse','War Dance','Solar Beam','Swarm Barrage','Fault Quake','Vine Snare','Talon Slash','Heavy Impact','Astral Bolt'])assert.doesNotThrow(()=>drawTechnique(ctx,{id:name,name,type:'Fire',kind:'energy',power:50},.5,{x:100,y:200},{x:400,y:100},800,400));
});
