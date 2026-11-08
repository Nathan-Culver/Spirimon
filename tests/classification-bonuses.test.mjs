import test from 'node:test';
import assert from 'node:assert/strict';
import {effectiveness,matchingClassificationBonus} from '../engine.mjs';
test('matching Type grants 50% plus capped supplemental Type and Domain bonuses',()=>{
 const sp={base:'Beast',alter:'Fey',domains:['Nature','Spirit'],moves:[]};
 const ind={moveIds:[]};
 assert.equal(matchingClassificationBonus({type:'Beast'},ind,sp),1.5);
 assert.equal(matchingClassificationBonus({type:'Beast',types:['Fey'],domain:'Nature',domains:['Spirit']},ind,sp),1.7);
});
test('distinct classifications combine additively and cap at 2x',()=>{
 const defender={base:'Plant',alter:'Beast',domains:[],moves:[]};
 assert.ok(effectiveness({type:'Elemental',domain:'Fire'},defender)<=2);
 assert.ok(effectiveness({type:'Elemental',domain:'Fire'},defender)>=.5);
});
test('one vulnerability and two independent resistances combine additively',()=>{
 const defender={base:'Aberration',alter:'Aberration',domains:['Earth','Chaos','Law'],moves:[]};
 assert.equal(effectiveness({domain:'Air'},defender),1.5);
});
test('multiple classifications reach the shared caps without duplicate stacking',()=>{
 const target=domains=>({base:'Aberration',alter:'Aberration',domains,moves:[]});
 assert.equal(effectiveness({domains:['Life','Void']},target(['Death','Creation'])),2);
 assert.equal(effectiveness({domain:'Air'},target(['Chaos','Law'])),.5);
 assert.equal(effectiveness({domain:'Life',domains:['Life']},target(['Death','Death'])),2);
});

test('same-Type bonus deduplicates matches and respects suppression',()=>{
 const sp={base:'Beast',alter:'Beast',domains:[],moves:[]};
 assert.equal(matchingClassificationBonus({type:'Beast',types:['Beast']},{moveIds:[]},sp),1.5);
 assert.equal(matchingClassificationBonus({type:'Beast'},{moveIds:[],suppressedTypes:['Beast']},sp),1);
});
test('Domain-only bonuses retain diminishing returns and supplemental cap',()=>{
 const domains=['Nature','Spirit','Life','Fate','Void','Magic'];
 const sp={base:'Beast',alter:'Fey',domains,moves:[]},ind={moveIds:[]};
 assert.equal(matchingClassificationBonus({domain:'Nature'},ind,sp),1.1);
 assert.equal(matchingClassificationBonus({type:'Beast',domain:'Nature'},ind,sp),1.6);
 assert.equal(matchingClassificationBonus({type:'Beast',types:['Fey'],domains},ind,sp),1.746875);
});
test('Fire against Plant uses the same 2x advantage',()=>{
 assert.equal(effectiveness({domain:'Fire'},{base:'Plant',alter:'Plant',domains:[],moves:[]}),2);
});
