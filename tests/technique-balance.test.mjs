import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../engine.mjs';
import * as RT from '../realtime-combat.mjs';
import {allMoveTemplates,validateGeneratedMoves} from '../moves.mjs';
import {moveTiming,scaledMove} from '../realtime-moves.mjs';
import {balancedTechnique,expectedTechniqueHits,TECHNIQUE_BALANCE_REVISION} from '../technique-balance.mjs';
import {accruedPeriodicDamage} from '../classification-status.mjs';
import {ROSTER} from '../roster.mjs';
const levels=[1,2,3,5,10,16,36,60,100,200,1000];
const sp={id:'balance-reference',base:'Beast',alter:'Beast',forms:['Reference'],domains:[],health:55,might:55,defense:55,energyPower:55,resistance:55,speed:55,moves:[]};
const unit=(level,id='a')=>({id,level,form:0,appearance:0,nature:'Hardy',commit:.5,difficulty:'normal',difficultySide:'player',aspect:'Natural',ivs:Object.fromEntries(E.STAT_KEYS.map(k=>[k,15])),evs:{},pp:200,willpower:200,hp:10000});
const attack=(power=40,effect=null)=>({id:'balance-'+effect,name:'Balance',type:'Beast',kind:power?'physical':'status',category:power?'Physical':'Status',power,effect,accuracy:1});
test('every authored Technique stays within a consistent equal-stat damage budget from level 1 to 1000',()=>{
 const catalog=allMoveTemplates();assert.ok(catalog.length>1000);
 for(const original of catalog){
  assert.equal(original.balanceRevision,TECHNIQUE_BALANCE_REVISION,original.id);
  if(!original.power)continue;
  const fractions=[];
  for(const level of levels){const u=unit(level),move={...original,type:'Beast',domain:undefined,domainTheme:undefined,element:undefined},p=scaledMove(move,u,sp);
   const fraction=E.damage(u,sp,unit(level,'b'),sp,p,'normal',()=>.5,true)*expectedTechniqueHits(move)/E.stats(u,sp).hp;
   assert.ok(fraction>=.06&&fraction<=.47,original.id+' @'+level+': '+fraction);fractions.push(fraction);
   assert.equal(moveTiming(move,u,sp).durationScale,1);assert.equal(p.power,original.power);
  }
  assert.ok(Math.max(...fractions)-Math.min(...fractions)<.03,original.id);
 }
});
test('quick and heavy ordinary attacks trade sustainable throughput for burst instead of obsoleting the quick attack',()=>{
 const u=unit(50),quick=attack(40),heavy=attack(68),q=moveTiming(quick,u,sp),h=moveTiming(heavy,u,sp);
 const rate=m=>{const p=moveTiming(m,u,sp);return E.damage(u,sp,u,sp,m,'normal',()=>.5,true)/Math.max(p.gcdMs,p.localCooldownMs,p.castMs+p.recoveryMs);};
 assert.ok(h.power>q.power);assert.ok(h.castMs>q.castMs);assert.ok(h.localCooldownMs>q.gcdMs);assert.ok(rate(heavy)/rate(quick)<1.3);assert.ok(rate(heavy)/rate(quick)>.7);
});
test('multi-hit Techniques round the combined damage budget, avoiding a free minimum HP for every strike',()=>{
 const a=unit(1),b=unit(1,'b'),move=attack(15,'multiHit');a.hp=b.hp=E.stats(a,sp).hp;
 const expected=E.damage(a,sp,b,sp,move,'normal',()=>.5,true)*4;
 const before=b.hp;E.executeAction(a,sp,b,sp,move,'normal',.5,()=>.5,1,{realTime:true,prepaid:true});
 assert.equal(before-b.hp,Math.max(1,Math.floor(expected)));assert.ok(before-b.hp<4);
});
test('fractional status damage and regeneration do useful proportional work at low levels and survive save/load',()=>{
 const u=unit(2);u.hp=1;const max=E.stats(u,sp).hp;
 let loss=0;for(let n=0;n<3;n++)loss+=accruedPeriodicDamage(max/32,'poison',{},u);
 const restored=JSON.parse(JSON.stringify(u));for(let n=0;n<5;n++)loss+=accruedPeriodicDamage(max/32,'poison',{},restored);
 assert.equal(loss,Math.floor(max*8/32));
 let gain=0;for(let n=0;n<5;n++)gain+=E.healHP(u,sp,max/20,true);assert.equal(gain,Math.floor(max/4));
});
test('healing fractions stay bounded and independent of level with a recovery recast',()=>{
 for(const level of levels)for(const [effect,fraction]of Object.entries({heal:.25,teamHeal:.18,rest:.65,fullheal:.60})){
  const u=unit(level),p=moveTiming(attack(0,effect),u,sp);assert.equal(p.healingFraction,fraction);assert.ok(p.localCooldownMs>=10000);
 }
});
test('Doom, retaliation and destiny effects cannot remove an arbitrarily stronger healthy enemy',()=>{
 const a=unit(2),b=unit(100,'b');a.hp=E.stats(a,sp).hp;b.hp=E.stats(b,sp).hp;
 a.lastHit={source:b.id,amount:9999,category:'Physical',at:0};a.realtimeNow=0;
 assert.equal(E.counterDamage(a,b,attack(60,'counter'),{maxHp:E.stats(a,sp).hp}),E.stats(a,sp).hp*.4);
 const before=b.hp;E.resolveDoom(b,sp);assert.equal(before-b.hp,Math.floor(before*.35));assert.ok(b.hp>0);
 b.hp=before;a.hp=1;a.conditions={destinyBond:1};E.executeAction(b,sp,a,sp,attack(),'normal',.5,()=>.5,1,{realTime:true,prepaid:true});assert.ok(b.hp>=before-E.stats(a,sp).hp*.5);
});
test('saved and AI-generated Techniques receive the same idempotent balance without changing equipped identities or timers',()=>{
 const old={...sp,alter:'Fey',moves:[attack(68)],learnset:[attack(68)],moveRevision:7},u=unit(20);u.moveIds=[old.moves[0].id];u.moveCooldowns={[u.moveIds[0]]:95000};
 E.refreshTechniques(old);const once=JSON.stringify(old.moves);E.refreshTechniques(old);assert.equal(JSON.stringify(old.moves),once);assert.equal(old.moves[0].unbalancedPower,68);assert.deepEqual(u.moveIds,['balance-null']);assert.equal(u.moveCooldowns['balance-null'],95000);
 const generated=validateGeneratedMoves([{power:50,accuracy:.9,kind:'physical',effect:'slow',target:'opponent'}],{...sp,moves:[attack()]});assert.equal(generated.report[0].status,'accepted');assert.equal(generated.moves[0].power,balancedTechnique(attack(50,'slow')).power);
 const scaled=scaledMove(old.moves[0],u,sp);assert.equal(scaledMove(scaled,u,sp).power,scaled.power);
});
test('damaging buffs attack opponents, then grant their one-stage benefit',()=>{
 const m={...attack(70,'boostSpeed'),target:'self'},a=unit(10),b=unit(10,'b');a.hp=b.hp=E.stats(a,sp).hp;const hp=b.hp;
 assert.equal(E.moveTarget(balancedTechnique(m)),'opponent');
 E.executeAction(a,sp,b,sp,m,'normal',.5,()=>.5,1,{realTime:true,prepaid:true});assert.ok(b.hp<hp);assert.equal(a.stages.speed,1);
});
test('every roster starter has a nonlethal equal-level neutral opener against level-2 Lotusling on Normal',()=>{
 const catalog=ROSTER.map(row=>{const id='roster-'+row.id,s={...E.makeSpecies(id,row.base,row.alter,row.domains),...row,id,source:'original-roster',moves:undefined,learnset:[],moveRevision:0};delete s.design;E.refreshTechniques(s);return s;});
 const lotus=catalog.find(s=>s.forms[0]==='Lotusling'),defender=unit(2,'lotus');defender.hp=E.stats(defender,lotus).hp;let checked=0;
 for(const species of catalog)for(const m of species.moves.filter(m=>m.power>0)){
  if(E.effectiveness(m,lotus,defender)!==1)continue;const a=unit(2);a.hp=E.stats(a,species).hp;
  assert.ok(E.damage(a,species,defender,lotus,scaledMove(m,a,species),'normal',()=>.5)<defender.hp,m.id);checked++;
 }
 assert.ok(checked>100);
});
test('Doom expiry uses the same bounded payoff in the battle scheduler',()=>{
 const a=unit(50),b=unit(50,'b');a.hp=b.hp=E.stats(a,sp).hp;E.bindBattlefield([a],[b]);b.conditions={perish:1};
 const ctx={active:{a:[a],b:[b]},teams:{a:[a],b:[b]},speciesOf:()=>sp},state=RT.createRealTimeState(),before=b.hp;
 for(let n=0;n<400;n++)RT.advanceRealTime(state,50,ctx,()=>.5);assert.equal(b.hp,before-Math.floor(before*.35));
});

test('focus cannot bypass the counter Health budget and a delayed hit retains its minimum damage',()=>{
 const a=unit(2),b=unit(2,'b');a.hp=b.hp=E.stats(a,sp).hp;a.lastHit={source:b.id,amount:9999,category:'Physical',at:0};a.realtimeNow=0;a.focused=true;const hp=b.hp;
 E.executeAction(a,sp,b,sp,attack(60,'counter'),'normal',.5,()=>.5,1,{realTime:true,prepaid:true});assert.ok(hp-b.hp<=E.stats(a,sp).hp*.4);
 b.delayedDamage={amount:.01,category:'Energy'};const before=b.hp;E.resolveDelayedDamage(b,sp);assert.equal(before-b.hp,1);
});

test('sleep-only attacks reward their setup requirement with greater burst potency',()=>{
 assert.ok(balancedTechnique(attack(70,'sleepStrike')).power>balancedTechnique(attack(70)).power*1.2);
});
