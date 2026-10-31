import assert from 'node:assert/strict';
import {test} from 'node:test';
import {MOVE_CATALOG,moveCategory,moveCost,makeIndividual,heal,stats,executeAction,resolveTempoRound,resolveMultiSpiritRound} from '../engine.mjs';

const species={id:'resource-test',forms:['Test Spirit','Test Spirit II','Test Spirit III'],base:'Beast',alter:'Beast',domains:[],health:100,power:55,might:55,energyPower:55,defense:55,resistance:55,speed:40,physicalRes:1,spiritualRes:1,ability:'None',moves:MOVE_CATALOG};
const actor=()=>heal(makeIndividual(species,12,0),species);
const foe=()=>heal(makeIndividual(species,12,0),species);
const expectedResource=move=>moveCategory(move)==='Physical'?'pp':'willpower';

test('all catalog moves consume only their corresponding resource',()=>{
 for(const move of MOVE_CATALOG){
  const a=actor(),b=foe(),before={pp:a.pp,willpower:a.willpower},resource=expectedResource(move),other=resource==='pp'?'willpower':'pp';
  executeAction(a,species,b,species,move,'normal',.5,()=>.5);
  assert.equal(a[resource],before[resource]-moveCost(move),move.id+' uses '+resource);
  assert.equal(a[other],before[other],move.id+' does not consume '+other);
 }
});
test('all catalog moves fall back without spending the other resource',()=>{
 for(const move of MOVE_CATALOG){
  const a=actor(),b=foe(),resource=expectedResource(move),other=resource==='pp'?'willpower':'pp',previous=a[other];
  a[resource]=0;
  const logs=executeAction(a,species,b,species,move,'normal',.5,()=>.5);
  assert.equal(a[resource],0,move.id+' cannot spend exhausted '+resource);
  assert.equal(a[other],previous,move.id+' does not spend alternate pool');
  assert.ok(logs.some(line=>line.includes('lacks ')),move.id+' gives exhaustion feedback');
 }
});
test('legacy saves initialize Willpower on demand and healing refills both',()=>{
 const a=actor(),b=foe();delete a.willpower;
 const move=MOVE_CATALOG.find(m=>expectedResource(m)==='willpower');
 executeAction(a,species,b,species,move,'normal',.5,()=>.5);
 assert.equal(a.willpower,stats(a,species).willpower-moveCost(move));
 a.pp=0;a.willpower=0;heal(a,species);
 assert.equal(a.pp,stats(a,species).pp);assert.equal(a.willpower,stats(a,species).willpower);
});
test('tempo battles charge Physical and Energy moves independently',()=>{
 const physical=MOVE_CATALOG.find(m=>moveCategory(m)==='Physical');
 const energy=MOVE_CATALOG.find(m=>moveCategory(m)==='Energy');
 const a=actor(),b=foe(),beforeA=a.pp,beforeW=a.willpower;
 resolveTempoRound(a,species,b,species,{move:physical,style:'normal',commit:.5,borrow:0},{move:energy,style:'normal',commit:.5,borrow:0},{a:0,b:0},()=>.5);
 assert.equal(a.pp,beforeA-moveCost(physical));assert.equal(a.willpower,beforeW);
 assert.equal(b.willpower,stats(b,species).willpower-moveCost(energy));
});
test('multi-Spirit battles charge both pools independently',()=>{
 const physical=MOVE_CATALOG.find(m=>moveCategory(m)==='Physical');
 const energy=MOVE_CATALOG.find(m=>moveCategory(m)==='Energy');
 const a=actor(),b=foe();a.speciesData=species;b.speciesData=species;
 const p=a.pp,w=b.willpower;
 resolveMultiSpiritRound([a],[b],[{move:physical,style:'normal',commit:.5,targetIndex:0}],[{move:energy,style:'normal',commit:.5,targetIndex:0}],()=>.5);
 assert.equal(a.pp,p-moveCost(physical));assert.equal(b.willpower,w-moveCost(energy));
});
