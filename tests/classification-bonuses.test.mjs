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
test('one vulnerability and two independent resistances cancel additively',()=>{
 const defender={base:'Aberration',alter:'Aberration',domains:['Fire','Ice','Nature'],moves:[]};
 assert.equal(effectiveness({domain:'Water'},defender),1);
});
test('multiple classifications reach the shared caps without duplicate stacking',()=>{
 assert.equal(effectiveness({domain:'Water'},{base:'Aberration',alter:'Aberration',domains:['Fire','Earth'],moves:[]}),2);
 assert.equal(effectiveness({domain:'Water'},{base:'Aberration',alter:'Aberration',domains:['Ice','Nature'],moves:[]}),.5);
 assert.equal(effectiveness({domain:'Water',domains:['Water']},{base:'Aberration',alter:'Aberration',domains:['Fire','Fire'],moves:[]}),1.5);
});
