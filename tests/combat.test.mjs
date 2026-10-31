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

test('level progression unlocks techniques without overwriting chosen moves',()=>{
 const sp={...species,base:'Beast',alter:'Plant',domains:['Air'],seed:12};
 E.refreshTechniques(sp);const i=spirit();i.level=5;i.form=0;
 const before=sp.moves.map(m=>m.id);i.moveIds=before.slice();
 const result=E.gainXP(i,sp,5*18);
 assert.equal(i.level,6);assert.ok(result.learned.length>0);
 assert.deepEqual(i.moveIds,before);
 assert.ok(i.unlockedMoves.includes(result.learned[0].id));
 const repeat=E.learnProgression(i,sp,5,0);
 assert.equal(repeat.length,0);
});
test('transformation can unlock gated techniques',()=>{
 const sp={...species,base:'Beast',alter:'Plant',domains:['Air'],seed:12};
 E.refreshTechniques(sp);const i=spirit();i.level=35;i.form=1;i.appearance=1;i.xp=35*18-1;
 const result=E.gainXP(i,sp,1);
 assert.equal(i.form,2);assert.ok(result.evolved);assert.ok(result.learned.some(m=>m));
});

test('practice eligibility excludes locked techniques and unlocks with progression',()=>{
 const sp={...species,base:'Beast',alter:'Plant',domains:['Air'],seed:12};
 E.refreshTechniques(sp);
 const i=spirit();i.level=5;i.form=0;
 const start=E.availableTechniques(i,sp);
 assert.equal(start.length,4);
 const all=sp.learnset;
 assert.ok(all.length>start.length);
 const locked=all.find(m=>!start.some(x=>x.id===m.id));
 assert.ok(locked);
 i.level=100;i.form=2;
 const grown=E.availableTechniques(i,sp);
 assert.ok(grown.some(m=>m.id===locked.id));
});
test('existing equipped techniques remain eligible after migration',()=>{
 const sp={...species,base:'Beast',alter:'Plant',domains:['Air'],seed:12};
 E.refreshTechniques(sp);const i=spirit();
 const extra=sp.learnset.find(m=>!sp.moves.some(x=>x.id===m.id));
 i.moveIds=[extra.id,...sp.moves.slice(1).map(m=>m.id)];
 assert.ok(E.availableTechniques(i,sp).some(m=>m.id===extra.id));
});
