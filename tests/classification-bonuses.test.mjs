import test from 'node:test';
import assert from 'node:assert/strict';
import {effectiveness,matchingClassificationBonus} from '../engine.mjs';
test('matching Type bonuses are 10% plus 5%, capped together with Domains',()=>{
 const sp={base:'Beast',alter:'Fey',domains:['Nature','Spirit'],moves:[]};
 const ind={moveIds:[]};
 assert.equal(matchingClassificationBonus({type:'Beast'},ind,sp),1.1);
 assert.equal(matchingClassificationBonus({type:'Beast',types:['Fey'],domain:'Nature',domains:['Spirit']},ind,sp),1.25);
});
test('distinct classifications combine additively and cap at 2x',()=>{
 const defender={base:'Plant',alter:'Beast',domains:[],moves:[]};
 assert.ok(effectiveness({type:'Elemental',domain:'Fire'},defender)<=2);
 assert.ok(effectiveness({type:'Elemental',domain:'Fire'},defender)>=.5);
});
