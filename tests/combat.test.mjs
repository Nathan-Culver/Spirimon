import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../engine.mjs';
import {ADVANCED_MOVES,ENVIRONMENT_MOVES,EXTRA_MOVES,buildLearnset} from '../moves.mjs';
const species={id:'test',forms:['Test'],base:'Beast',alter:'Elemental',health:100,power:50,might:50,speed:50,physicalRes:1,spiritualRes:1,ability:''};
const spirit=()=>{const x=E.makeIndividual(species,25,0,()=>.5);E.heal(x,species);x.pp=1000;return x;};
const move=(effect,category='Status',power=0)=>({id:'test-'+effect,name:effect,effect,category,power,type:'Beast',speed:0,ppCost:1});
test('catalog move ids are unique and categories are valid',()=>{
 const all=[...ADVANCED_MOVES,...ENVIRONMENT_MOVES,...EXTRA_MOVES];
 assert.equal(new Set(all.map(x=>x.id)).size,all.length);
 for(const x of all){assert.ok(['Physical','Energy','Status'].includes(E.moveCategory(x)));assert.ok(Number.isFinite(x.power));}
});
test('all type learnsets build without undefined moves',()=>{
 for(const base of E.TYPES)for(const alter of E.TYPES){const a=buildLearnset(base,alter,['Air']);assert.ok(a.length>0);assert.ok(a.every(x=>x&&x.id&&x.name));}
});
test('burn applies and causes end-of-turn damage',()=>{
 const a=spirit(),b=spirit();E.executeAction(a,species,b,species,move('burn'),'normal',.5,()=>0);assert.equal(b.status,'burn');
 const hp=b.hp;E.resolveTempoRound(a,species,b,species,{move:move('ward'),style:'normal',commit:.5},{move:move('ward'),style:'normal',commit:.5},{a:0,b:0},()=>.5);assert.ok(b.hp<hp);
});
test('weather and terrain share the same battlefield state',()=>{
 const a=spirit(),b=spirit();E.executeAction(a,species,b,species,move('weatherRain'),'normal',.5,()=>.5);assert.equal(a.battlefield.weather,'rain');assert.equal(b.battlefield.weather,'rain');
 E.executeAction(a,species,b,species,move('terrainGrass'),'normal',.5,()=>.5);assert.equal(b.battlefield.terrain,'grass');
});
test('charge attacks prepare then execute',()=>{
 const a=spirit(),b=spirit(),m=move('twoTurn','Physical',90),hp=b.hp;
 E.executeAction(a,species,b,species,m,'normal',.5,()=>.5);assert.ok(a.pendingMove);assert.equal(b.hp,hp);
 E.executeAction(a,species,b,species,m,'normal',.5,()=>.5);assert.equal(a.pendingMove,null);assert.ok(b.hp<hp);
});
test('baton pass requests switch and preserves intent',()=>{
 const a=spirit(),b=spirit();a.stages={might:2};E.executeAction(a,species,b,species,move('batonPass'),'normal',.5,()=>.5);assert.equal(a.switchRequested,true);assert.equal(a.passStages,true);
});
