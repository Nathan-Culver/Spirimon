import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../engine.mjs';
import {TYPE_MOVES,domainMoves,EXTRA_MOVES,ENVIRONMENT_MOVES,ADVANCED_MOVES} from '../moves.mjs';
const all=[...E.MOVE_CATALOG,...Object.values(TYPE_MOVES).flat(),...E.DOMAINS.flatMap(d=>domainMoves(d,'Elemental')),...EXTRA_MOVES,...ENVIRONMENT_MOVES,...ADVANCED_MOVES];
const physical={id:'test-physical',name:'Tap',kind:'physical',power:20,speed:0,baseUses:40};
const energy={id:'test-energy',name:'Blast',kind:'spiritual',power:110,speed:0,baseUses:5};
const sp=(moves=[physical,energy],ability='None')=>({id:'test',forms:['Test Spirimon'],base:'Beast',alter:'Elemental',domains:[],health:100,power:50,might:50,speed:40,defense:50,resistance:50,ability,moves});
const unit=s=>E.heal(E.makeIndividual(s,10,0,()=>.5),s);

test('every move family consumes exactly one point, or two against Pressure',()=>{
 for(const move of all)for(const ability of ['None','Pressure']){
  const actorSp=sp([move,physical,energy]),targetSp=sp(undefined,ability),a=unit(actorSp),b=unit(targetSp),key=E.moveCategory(move)==='Physical'?'pp':'willpower',other=key==='pp'?'willpower':'pp',before=a[key],otherBefore=a[other];
  E.executeAction(a,actorSp,b,targetSp,move,'normal',.5,()=>.5);
  assert.equal(before-a[key],ability==='Pressure'?2:1,move.id+' / '+ability);
  assert.equal(a[other],otherBefore,move.id+' preserves other pool');
 }
});
test('base values and equipped category totals determine maximum resources',()=>{
 for(const m of all){assert.ok(m.baseUses>=1&&m.baseUses<=40,m.id);assert.equal(m.baseUses%5,0,m.id);}
 assert.ok(E.moveBaseValue(physical)>E.moveBaseValue(energy));
 const s=sp(),a=unit(s);assert.equal(a.pp,40);assert.equal(a.willpower,5);
 a.level=10000;a.form=2;a.specialty='Mystic';assert.equal(E.stats(a,s).pp,40);assert.equal(E.stats(a,s).willpower,5);
 const equipped={...s,learnset:[physical,energy]};a.moveIds=[energy.id];assert.deepEqual(E.resourceMaximums(a,equipped),{pp:0,willpower:5});
});
test('Pressure drains remaining points without negative values and conversion retains 2-for-1',()=>{
 const s=sp(),pressure=sp(undefined,'Pressure'),a=unit(s),b=unit(pressure);a.pp=1;a.willpower=0;
 let hp=b.hp;E.executeAction(a,s,b,pressure,physical,'normal',.5,()=>.5);assert.equal(a.pp,0);assert.ok(b.hp<hp);
 E.heal(a,s);E.heal(b,pressure);a.pp=0;a.willpower=5;
 E.executeAction(a,s,b,pressure,physical,'normal',.5,()=>.5);assert.equal(a.willpower,1);assert.equal(a.pp,0);
});
test('exhaustion forces Struggle, applies recoil and reports the actual animation',()=>{
 const s=sp(),a=unit(s),b=unit(s);a.pp=a.willpower=0;b.hp=10000;
 const before=a.hp,out=E.resolveTempoRound(a,s,b,s,{move:energy,style:'normal',commit:.5,borrow:2},{move:{...energy,power:0,effect:'ward'},style:'normal',commit:.5},{a:0,b:0},()=>.5);
 assert.equal(out.events.find(e=>e.side==='a').move.id,'struggle');assert.equal(out.actions.a,1);assert.equal(out.nextCredits.b,0);
 assert.ok(b.hp<10000);assert.equal(before-a.hp,Math.ceil(E.stats(a,s).hp/4));assert.equal(a.pp,0);assert.equal(a.willpower,0);
 assert.ok(out.log.some(l=>l.includes('forced to use Struggle')));assert.ok(out.log.some(l=>l.includes('recoil')));
});
test('Struggle is unavailable while an equipped move can still be funded',()=>{
 const s=sp(),a=unit(s);a.pp=0;a.willpower=1;
 assert.equal(E.battleMove(a,s,physical,s),null);assert.equal(E.battleMove(a,s,energy,s).id,energy.id);
 assert.equal(E.battleMove(a,s,E.STRUGGLE,s),null);
});
test('bonus actions charge the matching resource at fixed Pressure cost',()=>{
 const s=sp(),pressure=sp(undefined,'Pressure'),a=unit(s),b=unit(pressure),before=a.willpower;b.hp=10000;
 const out=E.resolveTempoRound(a,s,b,pressure,{move:energy,style:'normal',commit:.5,borrow:1},{move:{...energy,power:0,effect:'ward'},style:'normal',commit:.5},{a:0,b:0},()=>.5);
 assert.equal(out.actions.a,2);assert.equal(before-a.willpower,4);assert.equal(a.pp,40);assert.equal(out.nextCredits.b,1);
});
test('two-turn moves pay once and complete after spending their final point',()=>{
 const move={...physical,effect:'twoTurn'},s=sp([move]),a=unit(s),b=unit(s);a.pp=1;
 E.executeAction(a,s,b,s,move,'normal',.5,()=>.5);assert.ok(a.pendingMove);assert.equal(a.pp,0);
 const hp=b.hp,out=E.resolveTempoRound(a,s,b,s,{move,style:'normal',commit:.5},{move:{...physical,power:0,effect:'ward'},style:'normal',commit:.5},{a:0,b:0},()=>.5);
 assert.equal(a.pendingMove,null);assert.ok(b.hp<hp);assert.equal(a.pp,0);assert.equal(out.events.find(e=>e.side==='a').move.id,move.id);
});
test('multi-Spirimon combat honors Pressure and forced Struggle for each actor',()=>{
 const s=sp(),pressure=sp(undefined,'Pressure'),a=unit(s),b=unit(pressure);a.speciesData=s;b.speciesData=pressure;const w=a.willpower;
 E.resolveMultiSpiritRound([a],[b],[{move:energy}],[{move:physical}],()=>.5);assert.equal(a.willpower,w-2);
 E.heal(a,s);E.heal(b,pressure);a.pp=a.willpower=0;const hp=a.hp;
 const out=E.resolveMultiSpiritRound([a],[b],[{move:energy}],[{move:{...physical,power:0,effect:'ward'}}],()=>.5);
 assert.equal(out.events.find(e=>e.side==='a').move.id,'struggle');assert.equal(hp-a.hp,Math.ceil(E.stats(a,s).hp/4));
});
test('legacy save migration preserves exhaustion and progress, then survives save/load',()=>{
 const s=sp(),a=unit(s);delete a.resourceRevision;delete a.resourceCaps;a.pp=27;a.willpower=0;const id=a.id,level=a.level;
 E.migrateResources(a,s);assert.equal(a.pp,Math.floor(40*27/55));assert.equal(a.willpower,0);assert.equal(a.id,id);assert.equal(a.level,level);
 const saved=JSON.parse(JSON.stringify(a));E.migrateResources(saved,s);assert.deepEqual(saved,a);
 E.heal(saved,s);assert.equal(saved.pp,40);assert.equal(saved.willpower,5);
});
test('changing equipped moves preserves points already spent in each pool',()=>{
 const s=sp(),a=unit(s);a.pp-=3;a.willpower-=2;
 E.normalizeResources(a,sp([{...physical,baseUses:20},{...energy,baseUses:10}]));assert.equal(a.pp,17);assert.equal(a.willpower,8);
});

test('fully rested legacy Mystic saves retain full move-based capacities',()=>{const s=sp(),a=unit(s);delete a.resourceRevision;delete a.resourceCaps;a.specialty='Mystic';a.pp=Math.floor(55*1.1);a.willpower=55;E.migrateResources(a,s);assert.equal(a.pp,40);assert.equal(a.willpower,5);});

test('alternating equipped moves draws from the same totaled category pool',()=>{
 const p1={...physical,id:'p1',baseUses:20},p2={...physical,id:'p2',baseUses:35},w1={...energy,id:'w1',power:20,baseUses:10},w2={...energy,id:'w2',power:20,baseUses:25},s=sp([p1,p2,w1,w2]),a=unit(s),b=unit(s);b.hp=10000;
 assert.equal(a.pp,55);assert.equal(a.willpower,35);
 for(const move of [p1,p2,w1,w2])E.executeAction(a,s,b,s,move,'normal',.5,()=>.5);
 assert.equal(a.pp,53);assert.equal(a.willpower,33);
 const restored=JSON.parse(JSON.stringify(a));E.migrateResources(restored,s);assert.equal(restored.pp,53);assert.equal(restored.willpower,33);
});
