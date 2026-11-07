import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../engine.mjs';
import * as CP from '../classification-passives.mjs';
import * as RT from '../realtime-combat.mjs';
const hit={id:'test-hit',name:'Strike',type:'Beast',power:40,category:'Physical',accuracy:.7,baseUses:30};
function fixture(base='Beast',domains=[]){const sp={id:'passive-'+base,base,alter:base==='Fey'?'Beast':'Fey',domains,forms:['One','Two','Three'],health:400,power:50,speed:40,moves:[hit],learnset:[hit]};const u=E.heal(E.makeIndividual(sp,35,0,E.rng(4)),sp);u.id=sp.id;for(const c of Object.keys(u.passives))u.passives[c]=CP.passivePool(c).find(p=>p.kind==='maxHp').id;u.hp=E.stats(u,sp).hp;return {sp,u};}
function select(f,c,id){f.u.passives[c]=CP.passivePool(c).find(p=>p.id===id||p.kind===id).id;f.u.hp=E.stats(f.u,f.sp).hp;}
const rolling=crit=>{let n=0;return ()=>++n===2?crit:.5;};
test('all 21 curated pools have distinct mechanical profiles and identities rather than shared reskins',()=>{
 const profiles=new Set();for(const c of [...E.TYPES,...E.DOMAINS]){const pool=CP.passivePool(c);assert.equal(pool.length,16);assert.equal(new Set(pool.map(p=>p.name)).size,16);assert.ok(pool.every(p=>p.amount>0&&p.amount<=.25));const profile=pool.map(p=>[p.kind,p.amount,p.condition].join(':')).sort().join('|');assert.ok(!profiles.has(profile),c);profiles.add(profile);}
 assert.ok(CP.passivePool('Plant').some(p=>p.kind==='thorns'));assert.ok(CP.passivePool('Fate').some(p=>p.kind==='recastReduction'));assert.ok(CP.passivePool('Psionic').some(p=>p.kind==='castSpeed'));assert.ok(CP.passivePool('Beast').some(p=>p.condition==='hurtTarget'));
});
test('conditional accuracy and evasiveness alter real hit chance and suppression removes them immediately',()=>{
 const a=fixture(),b=fixture();select(a,'Beast','beast-hunter-s-eye');select(b,'Beast','beast-untamed-leap');b.u.hp=E.stats(b.u,b.sp).hp;const baseline=E.hitChance(a.u,{...b.u,suppressedTypes:['Beast']},hit,'normal',a.sp,b.sp);assert.ok(Math.abs(E.hitChance(a.u,b.u,hit,'normal',a.sp,b.sp)-(baseline-.08))<1e-9);
 b.u.hp=Math.floor(E.stats(b.u,b.sp).hp*.3);assert.ok(Math.abs(E.hitChance(a.u,b.u,hit,'normal',a.sp,b.sp)-(.7+.08))<1e-9);
 a.u.suppressedTypes=['Beast'];assert.equal(E.hitChance(a.u,b.u,hit,'normal',a.sp,b.sp),.7);
});
test('critical chance and critical damage affect the actual attack resolver',()=>{
 function strike(passive,critRoll){const a=fixture(),b=fixture();select(a,'Beast',passive);const before=b.u.hp,log=E.executeAction(a.u,a.sp,b.u,b.sp,{...hit,accuracy:1},'normal',.5,rolling(critRoll),1,{realTime:true,prepaid:true});return {damage:before-b.u.hp,critical:log.some(s=>s.includes('critical hit'))};}
 assert.equal(strike('beast-pounce',.1).critical,true);assert.equal(strike('beast-wild-vigil',.1).critical,false);
 const base=strike('beast-wild-vigil',.01),boost=strike('beast-raking-assault',.01);assert.ok(boost.damage>base.damage);assert.ok(Math.abs(boost.damage/base.damage-1.62/1.5)<.06);
});
test('multi-hit passive drain and thorns resolve once from actual Health lost and never recurse',()=>{
 const a=fixture(),b=fixture('Plant');select(a,'Beast','beast-blood-hunt');select(b,'Plant','plant-briar-retort');a.u.hp=100;b.u.hp=Math.floor(E.stats(b.u,b.sp).hp*.45);const before=b.u.hp,events=[];
 const log=E.executeAction(a.u,a.sp,b.u,b.sp,{...hit,accuracy:1,effect:'multiHit'},'normal',.5,()=>.5,1,{realTime:true,prepaid:true,onDamage:(u,event)=>events.push({id:u.id,...event})});const dealt=before-b.u.hp;
 assert.equal(events.filter(e=>e.periodic).length,1);assert.equal(log.filter(l=>l.includes('passive damage')).length,1);assert.equal(a.u.hp,100+Math.floor(dealt*.1)-Math.max(1,Math.floor(dealt*.15)));
});
test('spread targets share a chain so the same actor passive cannot retrigger on every target',()=>{
 const a=fixture(),b=fixture(),c=fixture();select(a,'Beast','beast-blood-hunt');a.u.hp=100;const chain=new Set();for(const f of [b,c])f.u.hp=Math.floor(E.stats(f.u,f.sp).hp*.45);
 const before=b.u.hp;E.executeAction(a.u,a.sp,b.u,b.sp,{...hit,accuracy:1},'normal',.5,()=>.5,1,{realTime:true,prepaid:true,passiveChain:chain});const after=a.u.hp;assert.equal(after,100+Math.floor((before-b.u.hp)*.1));
 E.executeAction(a.u,a.sp,c.u,c.sp,{...hit,accuracy:1},'normal',.5,()=>.5,1,{realTime:true,prepaid:true,passiveChain:chain});assert.equal(a.u.hp,after);
});
test('cast and recast passives change scheduled timing, preserve the GCD floor, and switching Techniques is evaluated before the action overwrites history',()=>{
 const f=fixture('Beast',['Psionic','Magic']);select(f,'Psionic','psionic-silent-casting');select(f,'Magic','magic-arcane-recast');f.u.lastMove='previous';const move={...hit,power:100,castMs:2000,timing:'lcd',cooldownMs:10000};
 const plain=RT.moveTiming(move,{...f.u,suppressedDomains:['Psionic','Magic']},f.sp),boosted=RT.moveTiming(move,f.u,f.sp);assert.ok(boosted.castMs<plain.castMs);assert.ok(boosted.cooldownMs<plain.cooldownMs);assert.ok(boosted.cooldownMs>=2000);assert.ok(boosted.gcdMs>=1000);
 const b=fixture();E.executeAction(f.u,f.sp,b.u,b.sp,{...move,accuracy:1},'normal',.5,()=>.5,1,{realTime:true,prepaid:true});assert.equal(f.u.lastTechniqueChanged,true);assert.equal(f.u.passivePreviousMove,undefined);
});
test('healing received changes actual healing and identical effect sums stay within 25 percent',()=>{
 const a=fixture(),b=fixture('Plant');select(b,'Plant','plant-last-seed');b.u.hp=1;const max=E.stats(b.u,b.sp).hp;
 E.executeAction(a.u,a.sp,b.u,b.sp,{id:'mend',name:'Mend',type:'Beast',effect:'heal',power:0,target:'ally'},'normal',.5,()=>.5,1,{realTime:true,prepaid:true,friendly:true,healingFraction:.25});assert.equal(b.u.hp,1+Math.floor(max*.25*1.2));
 const f=fixture('Plant',['Life','Spirit']);for(const c of Object.keys(f.u.passives)){const p=CP.passivePool(c).find(p=>p.kind==='healingReceived'&&p.condition==='low');if(p)f.u.passives[c]=p.id;}f.u.hp=1;assert.equal(CP.passiveEffects(f.sp,f.u,{maxHp:E.stats(f.u,f.sp).hp}).healingReceived,.25);
});
