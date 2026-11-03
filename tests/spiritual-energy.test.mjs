import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../engine.mjs';
import * as SE from '../spiritual-energy.mjs';
import * as ST from '../support-techniques.mjs';
import * as RT from '../realtime-combat.mjs';
import * as CO from '../cooperative-techniques.mjs';
import * as SW from '../spiritual-world.mjs';
import {newSealer,setExhaustion,calendarPhase,CYCLE_MS,DAY_MS,PASSIVE_RECOVERY_MS} from '../spiritual-core.mjs';
const hit={id:'ordinary',name:'Strike',power:40,accuracy:1,kind:'physical',type:'Beast',timing:'gcd'},lcd={...hit,id:'independent',timing:'lcd',castMs:0,cooldownMs:10000},long={...hit,id:'casting',power:75,castMs:2400};
function fixture(size=3){
 const sp={id:'sp',forms:['Test'],base:'Beast',alter:'Elemental',domains:['Spirit','Life'],health:120,power:50,speed:40,moves:[hit,lcd,long,{...hit,id:'mend',power:0,effect:'heal',target:'self'}],learnset:[hit,lcd,long],ability:'Steadfast',anatomy:{traits:['hands','armor']}};
 const make=(prefix,n)=>({...E.heal(E.makeIndividual(sp,10,0,E.rng(prefix+n)),sp),id:prefix+n,bond:0});
 const a=Array.from({length:6},(_,n)=>make('a',n)),b=[make('b',0)],s=E.newGame('energy-tests');s.species={sp};s.spirits=a;s.party=a.map(u=>u.id);SE.ensureSealer(s);
 const state=RT.createRealTimeState(),context={teams:{a,b},active:{a:a.slice(0,size),b},speciesOf:()=>sp,sealers:{a:s.sealer,b:null},inventory:{a:s.inventory}};E.bindBattlefield(a,b);
 const step=ms=>{for(let left=ms;left>0;left-=1000)RT.advanceRealTime(state,Math.min(left,1000),context,()=>.5);};
 return {s,a,b,sp,state,context,step};
}
function learn(f,kind,options={}){const t={...ST.generateSupport('test-'+kind,{primary:kind,basic:true}),...options};f.s.sealer.known[t.id]=t;f.s.sealer.assignments[f.a[0].id]=[t.id];return t;}

test('migration is idempotent, preserves zero Energy and never resets learned/support/Move cooldowns',()=>{
 const f=fixture(),q=f.s.sealer;q.energy=0;q.supportCooldowns.example=50000;f.a[0].moveCooldowns={example:70000};assert.equal(SE.ensureSealer(f.s),q);const save=JSON.parse(JSON.stringify(f.s));SE.ensureSealer(save);assert.equal(save.sealer.energy,0);assert.equal(save.sealer.supportCooldowns.example,50000);assert.equal(save.spirits[0].moveCooldowns.example,70000);
});
test('a designated lead is free even at zero; other creatures need a paid release and only three can fight',()=>{
 const f=fixture(0),q=f.s.sealer;q.energy=0;assert.equal(SE.manifestationCost(q,f.a[0],f.sp),0);assert.ok(RT.deploySpirimon(f.state,f.context,'a',f.a[0]).ok);assert.equal(RT.deploySpirimon(f.state,f.context,'a',f.a[1]).ok,false);assert.ok(f.a[0].spiritualEnergyEmpty.value>0);
 q.energy=100;const before=q.energy,first=RT.deploySpirimon(f.state,f.context,'a',f.a[1]);assert.ok(first.ok);assert.equal(q.energy,before-first.cost);assert.ok(RT.deploySpirimon(f.state,f.context,'a',f.a[2]).ok);assert.equal(RT.deploySpirimon(f.state,f.context,'a',f.a[3]).ok,false);
 f.context.active.a=f.context.active.a.filter(u=>u!==f.a[1]);const after=q.energy;assert.ok(RT.deploySpirimon(f.state,f.context,'a',f.a[1]).ok);assert.equal(q.energy,after-first.cost,'A repeated release is charged again, with no recall refund');
});
test('release strength uses healthy loadouts, rises with combat strength and benefits from bond',()=>{
 const f=fixture(),q=f.s.sealer,u=f.a[1],normal=SE.manifestationCost(q,u,f.sp);u.hp=1;assert.equal(SE.manifestationCost(q,u,f.sp),normal);u.level=80;assert.ok(SE.manifestationCost(q,u,f.sp)>normal);u.bond=100;assert.ok(SE.manifestationCost(q,u,f.sp)<SE.manifestationCost(q,{...u,bond:0},f.sp));
});
test('lead changes require safe places and never become free through party reordering',()=>{
 const f=fixture();assert.equal(SE.changeLead(f.s,f.a[1].id).ok,false);assert.equal(SE.changeLead(f.s,f.a[1].id,{safe:true,battle:true}).ok,false);assert.ok(SE.changeLead(f.s,f.a[1].id,{safe:true}).ok);assert.equal(SE.manifestationCost(f.s.sealer,f.a[1],f.sp),0);assert.ok(SE.manifestationCost(f.s.sealer,f.a[0],f.sp)>0);
});
test('exhaustion lowers outgoing damage, raises incoming damage and lengthens casts/CDs; any positive Energy clears it',()=>{
 const f=fixture(),a=f.a[0],b=f.b[0],normal=E.damage(a,f.sp,b,f.sp,hit,'normal',()=>.5),timing=RT.moveTiming(long,a,f.sp),incoming=E.damage(b,f.sp,a,f.sp,hit,'normal',()=>.5);f.s.sealer.energy=0;RT.synchronizeTimers(f.state,f.context);assert.ok(E.damage(a,f.sp,b,f.sp,hit,'normal',()=>.5)<normal);assert.ok(E.damage(b,f.sp,a,f.sp,hit,'normal',()=>.5)>incoming);assert.ok(RT.moveTiming(long,a,f.sp).castMs>timing.castMs);assert.ok(RT.moveTiming(long,a,f.sp).gcdMs>timing.gcdMs);a.bond=100;setExhaustion(a,f.s.sealer);assert.equal(a.spiritualEnergyEmpty.value,.075);f.s.sealer.energy=.01;RT.synchronizeTimers(f.state,f.context);assert.equal(a.spiritualEnergyEmpty.value,0);
});
test('automatic recovery takes two hours and pauses do not advance clocks or refill Energy',()=>{
 const f=fixture(),q=f.s.sealer;q.energy=0;for(let n=0;n<PASSIVE_RECOVERY_MS/1000;n++)SE.advanceSpiritualClock(f.s,1000,{exploring:true});assert.ok(Math.abs(q.energy-q.maxEnergy)<.001);assert.equal(q.clockMs,PASSIVE_RECOVERY_MS);q.energy=0;SE.advanceSpiritualClock(f.s,1000,{paused:true,exploring:true});assert.equal(q.energy,0);SE.advanceSpiritualClock(f.s,1000,{exploring:false});assert.equal(q.energy,0);
});
test('shrines have independent day/night allowances; meditation is separate and dangerous interruptions are recorded',()=>{
 const f=fixture(),q=f.s.sealer;q.energy=0;assert.equal(SE.beginRecovery(f.s,'commune',{shrineId:'one',safe:true}).amount,50);assert.equal(SE.beginRecovery(f.s,'commune',{shrineId:'one',safe:true}).ok,false);assert.ok(SE.beginRecovery(f.s,'commune',{shrineId:'two',safe:true}).ok);assert.ok(SE.beginRecovery(f.s,'meditate',{safe:true}).ok);assert.equal(SE.beginRecovery(f.s,'meditate',{safe:true}).ok,false);f.s.playTime=DAY_MS;assert.ok(SE.beginRecovery(f.s,'commune',{shrineId:'one',safe:true}).ok);f.s.playTime=CYCLE_MS;q.energy=0;const maxBefore=q.maxEnergy,interrupted=SE.beginRecovery(f.s,'meditate',{safe:false,random:()=>0});assert.ok(interrupted.interrupted);assert.equal(interrupted.amount,Math.round(maxBefore*.125));assert.equal(SE.beginRecovery(f.s,'meditate',{safe:false}).ok,false);
});
test('bonding rewards cannot be repeatedly farmed in the same day/night period',()=>{
 const f=fixture();f.s.sealer.energy=0;assert.ok(SE.bondRecovery(f.s,f.a[0])>0);assert.equal(SE.bondRecovery(f.s,f.a[0]),0);f.s.playTime=DAY_MS;assert.ok(SE.bondRecovery(f.s,f.a[0])>0);
});
test('Sealer levels, unique training, rituals, and individual bonds increase capacity without repeat-event farming',()=>{
 const f=fixture(),q=f.s.sealer,base=q.maxEnergy;SE.gainSealerXP(f.s,300,'discovery');const lv=q.level;assert.ok(lv>1);SE.gainSealerXP(f.s,300,'discovery');assert.equal(q.level,lv);SE.trainSealer(f.s,'lesson');const training=q.training;SE.trainSealer(f.s,'lesson');assert.equal(q.training,training);SE.trainSealer(f.s,'ritual',{ritual:true});assert.ok(q.maxEnergy>base);const before=q.maxEnergy;f.a[0].bond=100;SE.ensureSealer(f.s);assert.ok(q.maxEnergy>before);
});
test('choose three of nine starting techniques; six assignments cover the traveling team and floating is distinct',()=>{
 const f=fixture(),q=f.s.sealer;for(const t of q.startingChoices.slice(0,3))assert.ok(SE.chooseStartingSupport(f.s,t.id).ok);assert.equal(Object.keys(q.known).length,3);assert.equal(SE.chooseStartingSupport(f.s,q.startingChoices[3].id).ok,false);assert.equal(Object.values(q.assignments).flat().length,6);assert.ok(f.s.party.every(id=>q.assignments[id].length>=1));assert.ok(!Object.values(q.assignments).flat().includes(q.floating));assert.equal(SE.assignSupport(f.s,f.a[0].id,q.floating).ok,false);assert.equal(SE.assignSupport(f.s,f.a[0].id,q.assignments[f.a[0].id][0],{remove:true}).ok,false);
 const replacement=Object.keys(q.known).find(id=>id!==q.floating&&!q.assignments[f.a[0].id].includes(id));assert.ok(SE.assignSupport(f.s,f.a[0].id,replacement,{replaceId:q.assignments[f.a[0].id][0]}).ok);
});
test('procedural support generation is reproducible, validates every family and admits compatible multi-effect techniques only',()=>{
 const coverage=new Set(),requirements=new Set();let multi=0,team=0,sacrifice=0;for(let n=0;n<1500;n++){const t=ST.generateSupport('coverage-'+n,{level:n%100});assert.ok(ST.validateSupport(t),JSON.stringify(t));assert.deepEqual(ST.generateSupport('coverage-'+n,{level:n%100}),t);coverage.add(t.effects[0].kind);if(t.requires)requirements.add(Object.keys(t.requires)[0]);if(t.effects.length>1)multi++;if(t.target==='team')team++;if(t.sacrifice)sacrifice++;}assert.equal(coverage.size,Object.keys(ST.SUPPORT_EFFECTS).length);assert.equal(requirements.size,4);assert.ok(multi>100&&team>50&&sacrifice>50);assert.equal(ST.validateSupport({effects:[{kind:'executeCode',amount:1}]}),false);
});
test('specialized support validates actual Domains, Type, anatomy, and abilities',()=>{
 const f=fixture(),t=ST.generateSupport('special',{primary:'shield',basic:true});for(const requires of [{domain:'Void'},{trait:'wings'},{type:'Undead'},{ability:'Pressure'}])assert.equal(ST.supportFits({...t,requires},f.a[0],f.sp,E.activeDomains(f.sp,f.a[0])),false);assert.ok(ST.supportFits({...t,requires:{trait:'hands'}},f.a[0],f.sp));
});
test('exact support copies share a team cooldown while distinct generated variants remain independent',()=>{
 const f=fixture(),t=learn(f,'shield');f.s.sealer.assignments[f.a[1].id]=[t.id];assert.ok(RT.usePlayerSupport(f.state,f.context,'a',t.id,f.a[0].id).ok);assert.equal(RT.supportAvailability(f.state,f.context,'a',t.id,f.a[1].id).ok,false);const variant=ST.generateSupport('other-shield',{primary:'shield',basic:true});f.s.sealer.known[variant.id]=variant;f.s.sealer.assignments[f.a[1].id].push(variant.id);assert.ok(RT.usePlayerSupport(f.state,f.context,'a',variant.id,f.a[1].id).ok);
});
test('support does not cancel pending casts; GCD support restarts the recipient timer',()=>{
 const f=fixture(),t=learn(f,'heal');f.a[0].hp-=50;assert.ok(RT.scheduleAction(f.state,f.context,f.a[0],{move:long,type:'move'}).ok);const pending=RT.unitClock(f.state,f.a[0]).pending;assert.equal(RT.supportAvailability(f.state,f.context,'a',t.id,f.a[0].id).ok,false);RT.unitClock(f.state,f.a[0]).gcdReadyAt=0;assert.ok(RT.usePlayerSupport(f.state,f.context,'a',t.id,f.a[0].id).ok);assert.equal(RT.unitClock(f.state,f.a[0]).pending,pending);assert.ok(RT.unitClock(f.state,f.a[0]).gcdReadyAt>0);
});
test('team-wide GCD support requires all recipient GCDs ready and restarts all without canceling casts',()=>{
 const f=fixture(),t=learn(f,'heal',{target:'team'});RT.unitClock(f.state,f.a[1]).gcdReadyAt=1000;const energy=f.s.sealer.energy;assert.equal(RT.usePlayerSupport(f.state,f.context,'a',t.id,f.a[0].id).ok,false);assert.equal(f.s.sealer.energy,energy);RT.unitClock(f.state,f.a[1]).gcdReadyAt=0;assert.ok(RT.usePlayerSupport(f.state,f.context,'a',t.id,f.a[0].id).ok);assert.ok(f.a.slice(0,3).every(u=>RT.unitClock(f.state,u).gcdReadyAt>0));
});
test('LCD weaving is legal during GCD recovery, animation locks cause clipping, and inputs never queue',()=>{
 const f=fixture();assert.ok(RT.scheduleAction(f.state,f.context,f.a[0],{type:'move',move:hit}).ok);f.step(600);const gcd=RT.unitClock(f.state,f.a[0]).gcdReadyAt;assert.ok(gcd>f.state.elapsedMs);assert.ok(RT.scheduleAction(f.state,f.context,f.a[0],{type:'move',move:lcd}).ok);assert.equal(RT.scheduleAction(f.state,f.context,f.a[0],{type:'move',move:hit}).ok,false);f.step(100);assert.equal(RT.unitClock(f.state,f.a[0]).pending,null);assert.equal(RT.unitClock(f.state,f.a[0]).gcdReadyAt,gcd);assert.ok(RT.unitClock(f.state,f.a[0]).readyAt>f.state.elapsedMs);
});
test('GCD starts at cast initiation and has a 1.5-second haste floor; retired Move Speed has no effect',()=>{
 const f=fixture(),u=f.a[0],p=RT.moveTiming(long,u,f.sp);RT.scheduleAction(f.state,f.context,u,{type:'move',move:long});assert.equal(RT.unitClock(f.state,u).gcdReadyAt,p.gcdMs);assert.deepEqual(RT.moveTiming({...long,speed:999},u,f.sp),p);u.stages={speed:6};u.spiritualBuffs=[{kind:'haste',amount:5,until:100000}];assert.ok(RT.moveTiming(long,u,{...f.sp,speed:100000}).gcdMs>=1500);assert.ok(RT.moveTiming(lcd,u,{...f.sp,speed:100000}).cooldownMs<RT.moveTiming(lcd,{...u,stages:{},spiritualBuffs:[]},f.sp).cooldownMs);
});
test('cooldown manipulation affects Move GCDs/LCDs but never player support timers',()=>{
 const f=fixture(),t=learn(f,'cooldown'),clock=RT.unitClock(f.state,f.a[0]);clock.cooldowns.independent=10000;clock.gcdReadyAt=0;f.s.sealer.supportCooldowns.other=12000;assert.ok(RT.usePlayerSupport(f.state,f.context,'a',t.id,f.a[0].id).ok);assert.ok(clock.cooldowns.independent<10000);assert.equal(f.s.sealer.supportCooldowns.other,12000);assert.ok(f.s.sealer.supportCooldowns[t.id]>0);
});
test('revival restores a defeated creature within its seal, permits later repeats and requires another paid release',()=>{
 const f=fixture(),t=learn(f,'revive');f.a[0].hp=0;f.context.active.a=f.context.active.a.filter(u=>u!==f.a[0]);assert.ok(RT.usePlayerSupport(f.state,f.context,'a',t.id,f.a[0].id).ok);assert.ok(f.a[0].hp>0);assert.ok(!f.context.active.a.includes(f.a[0]));assert.equal(SE.manifestationCost(f.s.sealer,f.a[0],f.sp),0,'The designated lead keeps its explicit free-release exception');f.step(t.cooldownMs);f.a[0].hp=0;RT.unitClock(f.state,f.a[0]).gcdReadyAt=0;assert.ok(RT.usePlayerSupport(f.state,f.context,'a',t.id,f.a[0].id).ok);
});
test('sacrificial support always spends Energy and rejects lethal HP payment',()=>{
 const f=fixture(),t=learn(f,'empower',{sacrifice:{kind:'hp',amount:.1}});f.s.sealer.energy=0;assert.equal(RT.usePlayerSupport(f.state,f.context,'a',t.id,f.a[0].id).ok,false);f.s.sealer.energy=100;f.a[0].hp=1;assert.equal(RT.usePlayerSupport(f.state,f.context,'a',t.id,f.a[0].id).ok,false);f.a[0].hp=E.stats(f.a[0],f.sp).hp;const hp=f.a[0].hp;assert.ok(RT.usePlayerSupport(f.state,f.context,'a',t.id,f.a[0].id).ok);assert.ok(f.a[0].hp<hp&&f.s.sealer.energy<100);
});
test('physical cleansing, shielding, interruption resistance and damage sharing have actual engine effects',()=>{
 const f=fixture(),u=f.a[0],v=f.a[1],enemy=f.b[0];u.status='poison';const cleanse=learn(f,'cleanse');assert.ok(RT.usePlayerSupport(f.state,f.context,'a',cleanse.id,u.id).ok);assert.equal(u.status,null);const shield=learn(f,'shield');RT.usePlayerSupport(f.state,f.context,'a',shield.id,u.id);const hp=u.hp;E.executeAction(enemy,f.sp,u,f.sp,hit,'normal',.5,()=>.5,1,{realTime:true,activeUnits:[...f.a,enemy]});assert.ok(hp-u.hp<E.damage(enemy,f.sp,u,f.sp,hit,'normal',()=>.5));
 const link=learn(f,'link');RT.usePlayerSupport(f.state,f.context,'a',link.id,u.id);const before=v.hp;E.executeAction(enemy,f.sp,u,f.sp,{...hit,power:200},'normal',.5,()=>.5,1,{realTime:true,activeUnits:[...f.a,enemy]});assert.ok(v.hp<before);
});
test('fixed seal costs and diminishing extra investment spend everything on failure',()=>{
 const f=fixture(),q=f.s.sealer,u=f.b[0],a=SE.sealInvestment(q,u,f.sp,1,0),b=SE.sealInvestment(q,u,f.sp,1,10),c=SE.sealInvestment(q,u,f.sp,1,20);assert.ok(b.chance>a.chance&&c.chance>b.chance);assert.ok(b.chance-a.chance>c.chance-b.chance);const before=q.energy,r=SE.commitSeal(q,u,f.sp,1,10,()=>1);assert.ok(r.ok&&!r.success);assert.equal(q.energy,before-r.cost);
});
test('cooperative recognition uses equipped Moves and Domains and commits participants with Energy',()=>{
 const f=fixture(2),plans=CO.cooperativePlans(f.context.active.a,()=>f.sp,f.s.sealer),plan=plans.find(p=>p.id.startsWith('pack:'));assert.ok(plan);const before=f.s.sealer.energy,r=CO.commitCooperative(plan,f.state,f.context,'a',RT.actionAvailability,RT.scheduleAction);assert.ok(r.ok);assert.equal(f.s.sealer.energy,before-plan.cost);assert.ok(f.a.slice(0,2).every(u=>RT.unitClock(f.state,u).pending));assert.equal(CO.commitCooperative(plan,f.state,f.context,'a',RT.actionAvailability,RT.scheduleAction).ok,false);
});
test('advanced cooperation is discovered rather than granted by level, and field rituals require suitable Domains',()=>{
 const f=fixture();assert.ok(!CO.cooperativePlans(f.context.active.a,()=>f.sp,f.s.sealer).some(p=>p.advanced));f.s.sealer.advanced=['triune','united'];assert.ok(CO.cooperativePlans(f.context.active.a,()=>f.sp,f.s.sealer).some(p=>p.id==='triune'));assert.equal(CO.fieldRitualTeam(CO.FIELD_RITUALS[0],f.a,()=>f.sp).length,6);assert.equal(CO.fieldRitualTeam(CO.FIELD_RITUALS[0],f.a,()=>({...f.sp,domains:[],moves:[]})).length,0);
});
test('enemy Sealers use the same release, exhaustion and support rules without boss exceptions',()=>{
 const f=fixture(0),q=SE.enemySealer('enemy',f.a,()=>f.sp);f.context.teams.b=f.a;f.context.active.b=[];f.context.sealers.b=q;q.energy=0;assert.ok(RT.deploySpirimon(f.state,f.context,'b',f.a[0]).ok);assert.equal(RT.deploySpirimon(f.state,f.context,'b',f.a[1]).ok,false);assert.ok(f.a[0].spiritualEnergyEmpty.value>0);assert.ok(Object.values(q.assignments).flat().length<=6);
});
test('shrine placement is deterministic, traversable, distributed and has nearby restoration opportunities',()=>{
 let total=0,clustered=0;for(let x=-2;x<=2;x++)for(let y=-2;y<=2;y++){const list=SW.shrinesForRegion('shrines',x,y);assert.deepEqual(SW.shrinesForRegion('shrines',x,y),list);assert.ok(list.length>=2);for(const t of list){assert.ok(E.walkable(E.tile('shrines',t.x,t.y)));assert.equal(E.coord(t.x,t.y).cx,x);assert.equal(E.coord(t.x,t.y).cy,y);}total+=list.length;if(list.length>2)clustered++;}assert.ok(total>=50&&clustered>0);assert.notEqual(calendarPhase(0).key,calendarPhase(DAY_MS).key);
});
test('long Move, GCD and support timers survive healing, save/load, and a new encounter',()=>{
 const f=fixture(),u=f.a[0],t=learn(f,'shield');RT.scheduleAction(f.state,f.context,u,{type:'move',move:hit});f.step(600);RT.scheduleAction(f.state,f.context,u,{type:'move',move:lcd});f.step(600);RT.usePlayerSupport(f.state,f.context,'a',t.id,u.id);const gcd=u.gcdReadyAt,local=u.moveCooldowns.independent,shared=f.s.sealer.supportCooldowns[t.id];
 E.heal(u,f.sp);SE.restoreEnergy(f.s.sealer,f.s.sealer.maxEnergy);const next=RT.createRealTimeState(f.state.elapsedMs),clock=RT.unitClock(next,u);assert.equal(clock.gcdReadyAt,gcd);assert.equal(clock.cooldowns.independent,local);assert.equal(f.s.sealer.supportCooldowns[t.id],shared);assert.equal(RT.actionAvailability(next,u,f.sp,{type:'move',move:lcd}).ok,false);
});
test('legacy battle migration preserves remaining timers and pending casts on the saved global clock',()=>{
 const f=fixture(),legacy={version:1,elapsedMs:2000,units:{a0:{readyAt:5000,cooldowns:{independent:12000},pending:{choice:{type:'move',move:long},resolveAt:3000,side:'a',targetSide:'b',targetId:'b0',sequence:0},conditions:{confusion:9000},buffs:{ward:7000},status:null}},fieldTimers:{weather:{value:'rain',until:8000}}};
 const next=RT.migrateRealTimeState(legacy,50000,[f.a[0]]);assert.equal(next.units.a0.cooldowns.independent,60000);assert.equal(next.units.a0.pending.resolveAt,51000);assert.equal(next.units.a0.conditions.confusion,57000);assert.equal(next.fieldTimers.weather.until,56000);assert.equal(next.version,2);
});
test('passive recovery uses visible whole points rather than hidden fractions that bypass exhaustion',()=>{
 const f=fixture(),q=f.s.sealer;q.energy=0;SE.advanceSpiritualClock(f.s,1000,{exploring:true});assert.equal(q.energy,0);assert.ok(q.passiveEnergy>0);for(let n=0;n<72;n++)SE.advanceSpiritualClock(f.s,1000,{exploring:true});assert.ok(q.energy>=1);const saved=JSON.parse(JSON.stringify(f.s));assert.equal(SE.ensureSealer(saved).energy,q.energy);
});
test('an exhausted creature has weaker actual healing and a shorter support duration',()=>{
 const f=fixture(),u=f.a[0],m={...hit,id:'healing',power:0,effect:'heal',target:'self'},max=E.stats(u,f.sp).hp;u.hp=1;E.executeAction(u,f.sp,u,f.sp,m,'normal',.5,()=>.5,1,{realTime:true});const healed=u.hp-1;u.hp=1;f.s.sealer.energy=0;setExhaustion(u,f.s.sealer);E.executeAction(u,f.sp,u,f.sp,m,'normal',.5,()=>.5,1,{realTime:true});assert.ok(u.hp-1<healed);assert.ok(RT.moveTiming(m,u,f.sp).durationScale<RT.moveTiming(m,{...u,spiritualEnergyEmpty:{value:0}},f.sp).durationScale);assert.ok(max>u.hp);
});
test('cooperation rejects unfundable Pressure costs before spending Energy or starting any participant',()=>{
 const f=fixture(2);f.sp.ability='Pressure';for(const u of f.a.slice(0,2)){u.pp=1;u.willpower=0;}const p=CO.cooperativePlans(f.context.active.a,()=>f.sp,f.s.sealer).find(p=>p.id.startsWith('pack:')),energy=f.s.sealer.energy;assert.ok(p);assert.equal(CO.commitCooperative(p,f.state,f.context,'a',RT.actionAvailability,RT.scheduleAction).ok,false);assert.equal(f.s.sealer.energy,energy);assert.ok(f.a.slice(0,2).every(u=>!RT.unitClock(f.state,u).pending));
});
test('a funded rampage blocks unrelated Moves, but exhausted locked Moves do not block Struggle',()=>{
 const f=fixture(),u=f.a[0];u.lockedMove={...hit,effect:'rampage'};assert.equal(RT.actionAvailability(f.state,u,f.sp,{type:'move',move:lcd}).ok,false);u.pp=0;u.willpower=0;assert.ok(RT.scheduleAction(f.state,f.context,u,{type:'move',move:{...E.STRUGGLE,type:'Beast'}}).ok);
});
test('exhausted wards allow a weakened portion of damage through instead of blocking it fully',()=>{
 const f=fixture(),u=f.a[0],enemy=f.b[0],ward={...hit,id:'ward',power:0,effect:'ward',target:'self'};u.hp=E.stats(u,f.sp).hp;E.executeAction(u,f.sp,u,f.sp,ward,'normal',.5,()=>.5,1,{realTime:true});const full=u.hp;E.executeAction(enemy,f.sp,u,f.sp,hit,'normal',.5,()=>.5,1,{realTime:true});assert.equal(u.hp,full);f.s.sealer.energy=0;setExhaustion(u,f.s.sealer);E.executeAction(u,f.sp,u,f.sp,ward,'normal',.5,()=>.5,1,{realTime:true});E.executeAction(enemy,f.sp,u,f.sp,hit,'normal',.5,()=>.5,1,{realTime:true});assert.ok(u.hp<full);
});
