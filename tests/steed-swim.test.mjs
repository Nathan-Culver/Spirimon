import test from 'node:test';
import {encounterChance} from '../engine.mjs';
import assert from 'node:assert/strict';
import {companionSize,canSteed,canWaterMount} from '../steed.mjs';
import {readFileSync} from 'node:fs';
test('physical dimensions and transformations control follower size',()=>{
 const small={base:'Beast',anatomy:{bodyPlan:'quadruped'},dimensions:{heightMeters:.4}};
 const large={...small,dimensions:{heightMeters:4}};
 assert.ok(companionSize(large,0).size>companionSize(small,0).size);
 const form={...small,formData:[{scaleMultiplier:1},{scaleMultiplier:2}]};
 assert.ok(companionSize(form,1).size>companionSize(form,0).size);
});
test('rideability requires stable anatomy and carrying capacity',()=>{
 const horse={base:'Beast',anatomy:{bodyPlan:'quadruped'},dimensions:{heightMeters:1.7}};
 const tiny={...horse,dimensions:{heightMeters:.4}};
 assert.equal(canSteed(horse),true);
 assert.equal(canSteed(tiny),false);
 assert.equal(canSteed({...horse,anatomy:{bodyPlan:'amorphous'}}),false);
});
test('aquatic forms can carry a swimmer without a land steed',()=>{
 const fish={base:'Beast',anatomy:{bodyPlan:'aquatic',traits:['swim']},dimensions:{lengthMeters:3}};
 assert.equal(canWaterMount(fish),true);
 assert.equal(canSteed(fish),false);
});
test('water travel is independent of learned battle Moves and cannot run',()=>{
 const source=readFileSync(new URL('../app.mjs',import.meta.url),'utf8');
 assert.match(source,/targetTile!=='water'&&!E\.walkable/);
 assert.ok(source.includes("water?(waterMount?(running||keys.has('shift')?95:170):680)"));
 for(const night of [false,true])assert.equal(encounterChance('water',night,true),2*encounterChance('water',night,false));
 assert.match(source,/drawSwimming\(/);
 assert.match(source,/drawWaterMount\(/);
});
