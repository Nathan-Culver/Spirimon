import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../engine.mjs';
import * as SE from '../spiritual-energy.mjs';
import * as RT from '../realtime-combat.mjs';
import * as ST from '../support-techniques.mjs';
const attack={id:'strike',name:'Strike',power:40,accuracy:1,type:'Beast',kind:'physical',timing:'gcd'};
function fixture(){const sp={id:'s',forms:['Test'],base:'Beast',alter:'Fey',domains:['Spirit'],health:100,power:50,speed:40,ability:'None',moves:[attack],learnset:[attack]},save=E.newGame('disciplines'),units=Array.from({length:3},(_,n)=>({...E.heal(E.makeIndividual(sp,12),sp),id:'a'+n,bond:0})),enemy={...E.heal(E.makeIndividual(sp,12),sp),id:'enemy'};save.species={s:sp};save.spirits=units;save.party=units.map(u=>u.id);SE.ensureSealer(save);const state=RT.createRealTimeState(),context={active:{a:[units[0]],b:[enemy]},teams:{a:units,b:[enemy]},speciesOf:()=>sp,sealers:{a:save.sealer,b:null},inventory:{a:save.inventory}};E.bindBattlefield(units,[enemy]);return {save,q:save.sealer,units,enemy,sp,state,context};}
function support(f,primary,extra={}){const t={...ST.generateSupport('new-'+primary,{primary,basic:true}),...extra};f.q.known[t.id]=t;f.q.assignments[f.units[0].id]=[t.id];return t;}

test('migration recalculates earned points once, preserves Energy zero and all cooldowns',()=>{
 const f=fixture();f.q.level=8;f.q.energy=0;f.q.discoveries={'training:trial-one':true,'training:ritual-one':true};delete f.q.disciplineVersion;f.q.supportCooldowns.keep=1234;f.units[0].moveCooldowns={keep:5678};SE.ensureSealer(f.save);assert.equal(f.q.unspentPoints,27);assert.equal(Object.values(f.q.attributeTraining).reduce((a,b)=>a+b,0),3);assert.equal(f.q.maxEnergy,SE.maximumEnergy(f.q,f.units));const snapshot=JSON.stringify(f.save);SE.ensureSealer(f.save);assert.equal(JSON.stringify(f.save),snapshot);assert.equal(f.q.energy,0);assert.equal(f.q.supportCooldowns.keep,1234);assert.equal(f.units[0].moveCooldowns.keep,5678);
});
test('levels grant three spendable points; paid safe-place retraining preserves training and does not refill',()=>{
 const f=fixture();assert.equal(f.q.unspentPoints,6);SE.allocateAttribute(f.q,'reserve');SE.ensureSealer(f.save);assert.equal(f.q.maxEnergy,105);SE.awardAttribute(f.q,'trial',{attribute:'output',points:2});assert.equal(SE.awardAttribute(f.q,'trial',{attribute:'output',points:2}),false);SE.gainSealerXP(f.save,100);assert.equal(f.q.level,2);assert.equal(f.q.unspentPoints,8);f.save.inventory.coins=1000;f.q.energy=23.25;assert.equal(SE.retrainAttributes(f.q,f.save.inventory).ok,false);assert.equal(SE.retrainAttributes(f.q,f.save.inventory,{safe:true,battle:true}).ok,false);assert.ok(SE.retrainAttributes(f.q,f.save.inventory,{safe:true}).ok);assert.equal(f.save.inventory.coins,850);assert.equal(f.q.unspentPoints,9);assert.equal(SE.attribute(f.q,'output'),2);assert.equal(f.q.energy,23.25);
});
test('Control applies to every expenditure category with diminishing returns and a combined cost floor',()=>{
 const f=fixture();f.q.attributes.control=40;for(const kind of ['manifest','support','seal','ritual','field','perception','concealment'])assert.equal(SE.energyCost(f.q,100,{kind}),80);f.q.attributes.control=80;const first=.2,second=SE.controlReduction(f.q)-first;assert.ok(second<first);assert.equal(SE.energyCost(f.q,100,{bond:.01}),40);assert.equal(SE.manifestationCost(f.q,f.units[0],f.sp),0);
});
test('Output caps investment, supports unlimited progression, and empowered effects have diminishing returns',()=>{
 const f=fixture(),t=support(f,'heal');const a=SE.supportQuote(f.q,t,f.units[0],0),b=SE.supportQuote(f.q,t,f.units[0],5),c=SE.supportQuote(f.q,t,f.units[0],10);assert.equal(a.castMs,0);assert.ok(b.castMs>0);assert.equal(b.cooldownMs,a.cooldownMs);assert.ok(b.bonus>c.bonus-b.bonus);assert.equal(SE.supportQuote(f.q,t,f.units[0],999).extra,10);f.q.attributeTraining.output=100;assert.equal(SE.outputLimit(f.q),110);assert.equal(SE.supportQuote(f.q,t,f.units[0],100).extra,100);const shield=support(f,'shield');assert.equal(SE.supportQuote(f.q,shield,f.units[0],10).castMs,0);assert.ok(SE.supportQuote(f.q,shield,f.units[0],10).cooldownMs>shield.cooldownMs);
});
test('support empowerment quote matches payment, resolves once after cast, and survives save reload',()=>{
 const f=fixture(),t=support(f,'heal'),u=f.units[0];u.hp=1;SE.beginSealerBattle(f.q);const quote=SE.supportQuote(f.q,t,u,10),energy=f.q.energy,result=RT.usePlayerSupport(f.state,f.context,'a',t.id,u.id,{extra:10});assert.ok(result.ok);assert.equal(f.q.energy,energy-quote.cost);assert.equal(u.hp,1);assert.equal(f.state.supportCasts.length,1);assert.equal(RT.supportAvailability(f.state,f.context,'a',t.id,u.id).ok,false);const gcd=RT.unitClock(f.state,u).gcdReadyAt;const restored=JSON.parse(JSON.stringify(f.state));restored.paused=true;RT.advanceRealTime(restored,1000,f.context,()=>.5);assert.equal(u.hp,1);restored.paused=false;RT.advanceRealTime(restored,1000,f.context,()=>.5);assert.ok(u.hp>1);const hp=u.hp;RT.advanceRealTime(restored,50,f.context,()=>.5);assert.equal(u.hp,hp);assert.equal(RT.unitClock(restored,u).gcdReadyAt,gcd);assert.equal(f.q.supportCooldowns[t.id],quote.cooldownMs);
});
test('instant support GCD is immune to incoming damage cooldown extensions',()=>{
 const f=fixture(),t=support(f,'heal'),u=f.units[0];assert.ok(RT.usePlayerSupport(f.state,f.context,'a',t.id,u.id).ok);const c=RT.unitClock(f.state,u),gcd=c.gcdReadyAt;RT.applyDamageDelay(f.state,u,{hits:5});assert.equal(c.gcdReadyAt,gcd);
});
test('defeated or withdrawn support recipients do not receive delayed healing and cannot pay lethal sacrifices',()=>{
 for(const outcome of ['dead','withdraw','sacrifice']){const f=fixture(),u=f.units[0],t=support(f,'heal',{sacrifice:{kind:'hp',amount:.1}});RT.usePlayerSupport(f.state,f.context,'a',t.id,u.id,{extra:10});if(outcome==='dead')u.hp=0;if(outcome==='withdraw')f.context.active.a=[];if(outcome==='sacrifice')u.hp=1;const hp=u.hp;RT.advanceRealTime(f.state,1000,f.context,()=>.5);assert.equal(u.hp,hp);}
});
test('insufficient Energy prevents support empowerment with no payment or cast; there is no Overdraw',()=>{
 const f=fixture(),t=support(f,'heal');f.q.energy=1;RT.unitClock(f.state,f.units[0]);const before=JSON.stringify(f.state);assert.equal(RT.usePlayerSupport(f.state,f.context,'a',t.id,f.units[0].id,{extra:10}).ok,false);assert.equal(f.q.energy,1);assert.equal(JSON.stringify(f.state),before);
});
test('vow selection requires safety; breaks persist across saves and clear only at battle end',()=>{
 const f=fixture();assert.equal(SE.availableVows(f.q).length,3);assert.equal(SE.selectVow(f.q,'pilgrim',{safe:true}).ok,false);assert.equal(SE.selectVow(f.q,'solitary').ok,false);assert.ok(SE.selectVow(f.q,'solitary',{safe:true}).ok);SE.beginSealerBattle(f.q);assert.ok(SE.vowViolation(f.q,'manifest',{activeCount:1}));SE.breakVow(f.q,true);assert.equal(SE.activeVow(f.q),null);SE.endSealerBattle(f.q);assert.equal(SE.activeVow(f.q).id,'solitary');SE.breakVow(f.q,false);const saved=JSON.parse(JSON.stringify(f.q));SE.ensureDisciplines(saved);assert.equal(saved.vowBroken,'outside');assert.equal(SE.selectVow(saved,'',{safe:true}).ok,false);SE.beginSealerBattle(saved);assert.equal(SE.activeVow(saved),null);SE.endSealerBattle(saved);assert.equal(SE.activeVow(saved).id,'solitary');
});
test('vow-breaking deployment needs explicit override and applies the battle penalty',()=>{
 const f=fixture();SE.selectVow(f.q,'solitary',{safe:true});SE.beginSealerBattle(f.q);let r=RT.deploySpirimon(f.state,f.context,'a',f.units[1]);assert.equal(r.requiresVowBreak,true);assert.equal(f.context.active.a.length,1);const energy=f.q.energy;r=RT.deploySpirimon(f.state,f.context,'a',f.units[1],{breakVow:true});assert.ok(r.ok);assert.equal(f.context.active.a.length,2);assert.equal(f.q.vowBroken,'battle');assert.equal(f.q.energy,energy-r.cost);
});
test('Open Hand blocks offensive support and supports a validated override; Solitary discount is real',()=>{
 const f=fixture(),t=support(f,'empower');SE.selectVow(f.q,'open-hand',{safe:true});SE.beginSealerBattle(f.q);assert.equal(RT.usePlayerSupport(f.state,f.context,'a',t.id,f.units[0].id).requiresVowBreak,true);assert.ok(RT.usePlayerSupport(f.state,f.context,'a',t.id,f.units[0].id,{breakVow:true}).ok);assert.equal(f.q.vowBroken,'battle');SE.endSealerBattle(f.q);SE.selectVow(f.q,'solitary',{safe:true});const expensive={...t,energyCost:20};assert.equal(SE.supportQuote(f.q,expensive,f.units[0]).cost,17);
});
test('spiritual senses drain together smoothly, preserve fractions through normalization, pause, and turn off at depletion or battle',()=>{
 const f=fixture();SE.toggleSense(f.q,'perception');SE.toggleSense(f.q,'concealment');const before=f.q.energy;SE.advanceSpiritualClock(f.save,1000,{exploring:true});assert.ok(Math.abs(f.q.energy-(before-5/60))<1e-9);SE.ensureSealer(f.save);assert.ok(f.q.energy<100);const energy=f.q.energy;SE.advanceSpiritualClock(f.save,1000,{exploring:true,paused:true});assert.equal(f.q.energy,energy);f.q.energy=.0001;SE.drainSenses(f.q,1000);assert.equal(f.q.energy,0);assert.deepEqual(f.q.senses,{perception:false,concealment:false});f.q.energy=50;SE.toggleSense(f.q,'perception');SE.beginSealerBattle(f.q);assert.deepEqual(f.q.senses,{perception:false,concealment:false});assert.equal(SE.toggleSense(f.q,'perception').ok,false);
});
test('Output and training improve senses, Control reduces drain, and high-level enemies resist concealment',()=>{
 const f=fixture(),initial=SE.perceptionProfile(f.q);f.q.attributeTraining.output=80;f.q.perceptionTraining=2;f.q.concealmentTraining=2;f.q.attributeTraining.control=40;assert.ok(SE.perceptionProfile(f.q).range>initial.range);assert.ok(SE.perceptionProfile(f.q).drain<initial.drain);f.q.senses.concealment=true;assert.ok(SE.encounterMultiplier(f.q)<1);assert.ok(SE.encounterMultiplier(f.q,f.q.level*3)>SE.encounterMultiplier(f.q));
});
test('rituals share Output/Control rules, and percentage recovery scales with Reserve and recovery vows',()=>{
 const f=fixture();SE.allocateAttribute(f.q,'reserve');SE.ensureSealer(f.save);f.q.energy=0;assert.equal(SE.restoreEnergy(f.q,f.q.maxEnergy*.5),53);f.q.level=5;SE.ensureDisciplines(f.q);SE.selectVow(f.q,'pilgrim',{safe:true});f.q.energy=0;assert.equal(SE.restoreEnergy(f.q,50),55);SE.beginSealerBattle(f.q);f.q.energy=0;assert.equal(SE.restoreEnergy(f.q,50),50);const t={cost:10},a=SE.ritualQuote(f.q,t,0),b=SE.ritualQuote(f.q,t,20);assert.equal(b.extra,10);assert.ok(b.cost>a.cost&&b.multiplier>a.multiplier);
});
test('enemy Sealers allocate level points and follow player empowerment bounds',()=>{
 const f=fixture(),enemy=SE.enemySealer('npc',f.units,()=>f.sp);assert.equal(enemy.unspentPoints,0);assert.ok(SE.attribute(enemy,'reserve')>0);assert.ok(SE.attribute(enemy,'control')>0);assert.ok(SE.attribute(enemy,'output')>0);assert.equal(enemy.vow,null);const t=Object.values(enemy.known)[0];assert.equal(SE.supportQuote(enemy,t,f.units[0],100000).extra,SE.outputLimit(enemy));
});

test('Unbroken Circle permits opening deployment and then locks replacements after a Technique',()=>{
 const f=fixture();SE.selectVow(f.q,'circle',{safe:true});SE.beginSealerBattle(f.q);f.q.initialManifested=[f.units[0].id];assert.ok(RT.deploySpirimon(f.state,f.context,'a',f.units[1]).ok);RT.unitClock(f.state,f.units[0]).readyAt=0;assert.ok(RT.scheduleAction(f.state,f.context,f.units[0],{type:'move',move:attack}).ok);assert.equal(RT.deploySpirimon(f.state,f.context,'a',f.units[2]).requiresVowBreak,true);assert.ok(SE.vowViolation(f.q,'withdraw'));
});
test('sealing and concealment enforce vow warnings before any expenditure',()=>{
 const f=fixture();f.q.level=8;SE.ensureDisciplines(f.q);SE.selectVow(f.q,'patient',{safe:true});SE.beginSealerBattle(f.q);const before=f.q.energy;assert.equal(SE.commitSeal(f.q,f.enemy,f.sp,1,10,()=>1).requiresVowBreak,true);assert.equal(f.q.energy,before);assert.equal(f.q.vowBroken,undefined);assert.ok(SE.commitSeal(f.q,f.enemy,f.sp,1,10,()=>1,{breakVow:true}).ok);assert.equal(f.q.vowBroken,'battle');SE.endSealerBattle(f.q);SE.selectVow(f.q,'pilgrim',{safe:true});assert.equal(SE.toggleSense(f.q,'concealment').requiresVowBreak,true);assert.equal(f.q.senses.concealment,false);assert.ok(SE.toggleSense(f.q,'concealment',{breakVow:true}).ok);assert.equal(f.q.vowBroken,'outside');
});
test('field release remains paid for the lead and benefits from Control without changing battle manifestation',()=>{
 const f=fixture(),normal=SE.fieldReleaseCost(f.q,f.units[0],f.sp);assert.ok(normal>=2&&normal<=6);f.q.attributeTraining.control=100;assert.ok(SE.fieldReleaseCost(f.q,f.units[0],f.sp)<=normal);assert.equal(SE.manifestationCost(f.q,f.units[0],f.sp),0);
});
