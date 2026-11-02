import test from 'node:test';
import assert from 'node:assert/strict';
import {caveMap,hash} from '../engine.mjs';
import {puzzleObjects,resolvedObjects,reachableExits} from '../environment-puzzles.mjs';
test('procedural obstacles are deterministic and each admits non-Spirimon removal',()=>{
 for(let seed=0;seed<30;seed++)for(let level=0;level<4;level++){
 const map=caveMap(seed,'test-cave',level),key='test-cave|'+level;
 const original=puzzleObjects(map,seed,key,hash);
 assert.deepEqual(original,puzzleObjects(map,seed,key,hash));
 const cleared=resolvedObjects(original,Object.fromEntries(original.map(o=>[o.id,null])));
 assert.equal(cleared.length,0);
 assert.equal(reachableExits(map,cleared),true);
 }
});
test('boulder displacement can be rejected when it disconnects exits',()=>{
 const map={width:5,height:3,grid:[['wall','wall','wall','wall','wall'],['wall','up','floor','down','wall'],['wall','wall','wall','wall','wall']],exits:[{x:1,y:1},{x:3,y:1}]};
 assert.equal(reachableExits(map,[],{x:1,y:1}),true);
 assert.equal(reachableExits(map,[{x:2,y:1}],{x:1,y:1}),false);
});
