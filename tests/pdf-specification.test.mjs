import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../engine.mjs';
import * as CP from '../classification-passives.mjs';
import * as CS from '../classification-status.mjs';
import * as RT from '../realtime-combat.mjs';
import * as SE from '../spiritual-energy.mjs';
import * as A from '../adventure-systems.mjs';
import * as EP from '../environment-puzzles.mjs';
import {effectiveFieldDomains,fieldCapabilityAvailable} from '../anatomy.mjs';

const hit={id:'hit',name:'Strike',type:'Beast',power:30,category:'Physical',accuracy:1,baseUses:30};
function fixture(types=['Beast','Giant'],domains=[]){
 const sp={id:'pdf-rules',forms:['Test','Elder','Ancient'],base:types[0],alter:types[1],domains,health:150,power:50,speed:40,physicalRes:1,spiritualRes:1,moves:[hit],learnset:[hit]};
 const unit=n=>{const u=E.heal(E.makeIndividual(sp,20,0,E.rng(n)),sp);u.id='unit-'+n;for(const key of Object.keys(u.passives))u.passives[key]=CP.passivePool(key).find(p=>p.kind==='physicalDamage'&&!p.condition).id;u.hp=E.stats(u,sp).hp;return u;};
 const a=unit(1),b=unit(2),reserve=unit(3),save={...E.newGame('pdf-spec'),species:{[sp.id]:sp},spirits:[a,reserve],party:[a.id,reserve.id]},q=SE.ensureSealer(save),state=RT.createRealTimeState();
 const context={teams:{a:[a,reserve],b:[b]},active:{a:[a],b:[b]},speciesOf:()=>sp,sealers:{a:q},inventory:{a:save.inventory}};
 const step=ms=>{while(ms>0){const delta=Math.min(ms,1000);RT.advanceRealTime(state,delta,context,()=>.5);ms-=delta;}};
 return {sp,a,b,reserve,save,q,state,context,step};
}

test('all classification pools offer sixteen distinct disciplines and Type Plant keeps its own identity',()=>{
 for(const classification of [...E.TYPES,...E.DOMAINS]){
  const pool=CP.passivePool(classification);assert.equal(pool.length,16);assert.equal(new Set(pool.map(p=>p.id)).size,16);
  assert.equal(new Set(pool.map(p=>[p.kind,p.amount,p.condition].join('|'))).size,16);
  assert.ok(pool.every(p=>p.classification===classification&&p.description.length>20));
 }
 assert.ok(CP.passivePool('Plant').every(p=>p.id.startsWith('plant-')));
 assert.notEqual(CP.passivePool('Life')[0].group,CP.passivePool('Fire')[0].group);
});
test('individual passive retraining persists without modifying another member of the species',()=>{
 const f=fixture(),spBefore=structuredClone(f.sp.passives),otherBefore=structuredClone(f.reserve.passives),selected=CP.passivePool('Beast').find(p=>p.kind==='maxHp');
 assert.equal(CP.retrainPassive(f.sp,'Beast',selected.id,[],f.a),false);
 assert.ok(CP.unlockPassive(f.sp,f.a,'Beast',selected.id));
 assert.ok(CP.retrainPassive(f.sp,'Beast',selected.id,f.a.unlockedPassives,f.a));
 assert.deepEqual(f.sp.passives,spBefore);assert.deepEqual(f.reserve.passives,otherBefore);
 const restored=JSON.parse(JSON.stringify(f.a));CP.ensureIndividualPassives(f.sp,restored);assert.equal(restored.passives.Beast,selected.id);
});
test('maximum HP and Speed passives change actual health and Move cooldowns',()=>{
 const f=fixture();f.a.passives.Beast=CP.passivePool('Beast').find(p=>p.kind==='maxHp').id;f.a.passives.Giant=CP.passivePool('Giant').find(p=>p.kind==='speed'&&!p.condition).id;
 const suppressed={...f.a,suppressedTypes:['Beast','Giant']},before=E.stats(suppressed,f.sp),after=E.stats(f.a,f.sp);
 assert.equal(after.hp,Math.floor(before.hp*1.05));assert.equal(after.speed,Math.floor(before.speed*1.05));
 assert.ok(RT.moveTiming(hit,f.a,f.sp).gcdMs<RT.moveTiming(hit,suppressed,f.sp).gcdMs);
});
test('aliases, duplicate sources, expiry and suppression agree for combat and field Domains',()=>{
 const f=fixture(['Beast','Giant'],['Mind','Psionic']);f.sp.anatomy={bodyPlan:'quadruped',traits:[],strength:1};
 f.sp.learnset=[hit,{...hit,id:'fate',domain:'Time'}];f.a.moveIds=['hit','fate','unknown'];f.a.temporaryDomains=[{domain:'Space',until:500}];f.a.realtimeNow=100;
 assert.deepEqual(E.activeDomains(f.sp,f.a),['Psionic','Fate','Void']);assert.deepEqual(effectiveFieldDomains(f.sp,f.a),E.activeDomains(f.sp,f.a));
 f.a.realtimeNow=501;assert.deepEqual(E.activeDomains(f.sp,f.a),['Psionic','Fate']);
 f.a.suppressedDomains=['Mind'];assert.deepEqual(E.activeDomains(f.sp,f.a),['Fate']);assert.equal(fieldCapabilityAvailable(f.sp,'push',f.a),false);
 f.a.moveIds=['hit'];assert.deepEqual(E.activeDomains(f.sp,f.a),[]);
});
test('suppressed Types stop contributing to matching damage and defensive effectiveness',()=>{
 const f=fixture(['Celestial','Beast']);f.a.moveIds=[];
 assert.equal(E.matchingClassificationBonus({type:'Celestial'},f.a,f.sp),1.1);
 f.a.suppressedTypes=['Celestial'];assert.equal(E.matchingClassificationBonus({type:'Celestial'},f.a,f.sp),1);
 assert.equal(E.effectiveness({type:'Fiend'},f.sp),1.5);assert.equal(E.effectiveness({type:'Fiend'},f.sp,f.a),1);
});
test('status resistance uses equipped Domains immediately and does not retain an unequipped affinity',()=>{
 const f=fixture();f.sp.learnset=[hit,{...hit,id:'psychic',domain:'Psionic'}];f.a.moveIds=['hit'];
 const plain=CS.statusChance(1,'sleep',f.sp,f.a);f.a.moveIds=['psychic'];const withAffinity=CS.statusChance(1,'sleep',f.sp,f.a);
 assert.ok(withAffinity<plain);f.a.moveIds=['hit'];assert.equal(CS.statusChance(1,'sleep',f.sp,f.a),plain);
});
test('status duration uses a relative modifier once and is independent of applied elapsed time',()=>{
 const f=fixture(['Construct','Fey']);assert.equal(CS.statusDuration(4000,'sleep',f.sp,f.a),1000);
 f.a.status='sleep';RT.synchronizeTimers(f.state,f.context);f.step(400);
 f.a.suppressedTypes=['Construct'];RT.synchronizeTimers(f.state,f.context);
 const clock=RT.unitClock(f.state,f.a);assert.equal(clock.status.appliedAt,0);assert.equal(clock.status.until,3000);
 f.step(2600);assert.equal(f.a.status,null);
});
test('mental relief remains shortened after timer reassessment',()=>{
 const f=fixture(['Construct','Fey']);f.a.status='sleep';RT.synchronizeTimers(f.state,f.context);f.step(200);
 const technique={id:'calm',name:'Steady Bond',timing:'lcd',target:'single',energyCost:1,cooldownMs:10000,durationMs:5000,effects:[{kind:'calm',amount:.5}]};f.q.known.calm=technique;f.q.assignments[f.a.id]=['calm'];
 assert.ok(RT.usePlayerSupport(f.state,f.context,'a','calm',f.a.id).ok);const until=RT.unitClock(f.state,f.a).status.until;
 RT.synchronizeTimers(f.state,f.context);assert.equal(RT.unitClock(f.state,f.a).status.until,until);assert.ok(until<1000);
 f.step(until-f.state.elapsedMs);assert.equal(f.a.status,null);
});
test('persistent status elapsed time survives encounter exit, save/load and a new battle',()=>{
 const f=fixture();f.a.status='poison';RT.synchronizeTimers(f.state,f.context);f.step(1000);RT.preserveAfflictions(f.state,f.a);
 assert.equal(f.a.afflictions.status.elapsedMs,1000);const restored=JSON.parse(JSON.stringify(f.a));
 RT.advanceExplorationAfflictions(restored,f.sp,1000);assert.equal(restored.afflictions.status.elapsedMs,2000);
 const next=RT.createRealTimeState(50000);f.context.teams.a=[restored];f.context.active.a=[restored];RT.synchronizeTimers(next,f.context);
 assert.equal(RT.unitClock(next,restored).status.appliedAt,48000);assert.equal(RT.unitClock(next,restored).status.until,66000);
 E.heal(restored,f.sp);assert.equal(restored.afflictions,undefined);assert.equal(restored.status,null);
});
test('sealed reserves pause status elapsed time while their cooldowns continue',()=>{
 const f=fixture();f.reserve.status='sleep';f.reserve.moveCooldowns={hit:5000};RT.synchronizeTimers(f.state,f.context);f.step(3000);
 assert.equal(f.reserve.status,'sleep');assert.equal(RT.unitClock(f.state,f.reserve).status.until-f.state.elapsedMs,CS.statusDuration(4000,'sleep',f.sp,f.reserve));
 assert.equal(f.reserve.moveCooldowns.hit,5000);
});
test('time-based exploration afflictions affect only the following creature',()=>{
 const f=fixture();f.a.status=f.reserve.status='poison';const otherHP=f.reserve.hp,hp=f.a.hp;
 RT.advanceExplorationAfflictions(f.a,f.sp,1000);RT.advanceExplorationAfflictions(f.a,f.sp,1000);
 assert.ok(f.a.hp<hp);assert.equal(f.reserve.hp,otherHP);assert.equal(f.reserve.afflictions,undefined);
});
test('challenge restrictions apply in the engine and active limits apply to both sides',()=>{
 const f=fixture();f.context.rules={noItems:true,noSupport:true,maxActive:1};
 assert.equal(RT.scheduleAction(f.state,f.context,f.a,{type:'item',item:'tonic'}).ok,false);
 assert.equal(RT.supportAvailability(f.state,f.context,'a','unknown',f.a.id).ok,false);
 assert.equal(RT.deploymentAvailability(f.state,f.context,'a',f.reserve).ok,false);
});
test('night doubles the grass encounter chance and water doubles the relevant base',()=>{
 assert.equal(E.encounterChance('grass',true),2*E.encounterChance('grass',false));
 assert.equal(E.encounterChance('water',true,true),4*E.encounterChance('water',false,false));
 assert.equal(E.encounterChance('path',false),0);assert.ok(E.encounterChance('path',true)>0);
});
test('championship requires eight Crests, Guild rank and the three trials',()=>{
 const crests=A.CLANS.map(c=>c.id),trials=A.GUILD_TRIALS.map(t=>t.id);
 assert.equal(A.championshipEligibility(crests,3,trials).ok,false);assert.equal(A.championshipEligibility(crests,4,[]).ok,false);
 assert.ok(A.championshipEligibility(crests,4,trials).ok);
});
test('championship only awards a title after all stages and supports later defense',()=>{
 const a={crests:A.CLANS.map(c=>c.id),guildTrials:A.GUILD_TRIALS.map(t=>t.id)};assert.ok(A.beginChampionship(a,{rank:4}).ok);
 const stages=[];for(let n=0;n<8;n++){const match=A.championshipMatch(a,120,130);stages.push(match.name);assert.ok(match.level>=130);if(n<7)assert.ok(!a.champion);A.recordChampionshipResult(a,true);}
 assert.equal(a.champion,true);assert.deepEqual([...new Set(stages)],A.CHAMPIONSHIP_STAGES.map(s=>s.name));assert.equal(a.titleDefenses,0);
 A.beginChampionship(a,{rank:4});for(let n=0;n<8;n++)A.recordChampionshipResult(a,true);assert.equal(a.titleDefenses,1);
});
test('elimination persists and a new championship attempt does not reuse previous victories',()=>{
 const a={crests:[],champion:true};A.beginChampionship(a);A.recordChampionshipResult(a,true);A.recordChampionshipResult(a,false);
 assert.equal(a.championship.status,'eliminated');assert.equal(A.championshipMatch(a),null);A.beginChampionship(a);assert.equal(a.championship.wins,0);assert.equal(a.championship.attempt,2);assert.equal(a.champion,true);
});
test('every facility has a persistent multi-match circuit and progressively scaled opponents',()=>{
 for(const facility of A.FACILITY_TYPES){const a={};A.beginFacilityRun(a,facility.id,'test',4);for(let n=0;n<facility.rounds;n++){const match=A.facilityMatch(a,facility.id,150);assert.ok(match.level>=150);assert.equal(match.round,n);A.recordFacilityResult(a,facility.id,true);}assert.equal(a.facilityRuns[facility.id].status,'complete');assert.equal(a.facilityBest[facility.id],facility.rounds);}
});
test('facility rules rotate deterministically and a defeat ends the current circuit',()=>{
 const a={};A.beginFacilityRun(a,'challenge','test',3);assert.ok(A.facilityMatch(a,'challenge').rules.noItems);A.recordFacilityResult(a,'challenge',false);assert.equal(A.facilityMatch(a,'challenge'),null);
 A.beginFacilityRun(a,'challenge','test',4);assert.ok(A.facilityMatch(a,'challenge').rules.noSupport);assert.equal(a.facilityRuns.challenge.attempt,2);
});
test('procedural dungeon mechanisms are reachable, deterministic and include a solvable physical sequence',()=>{
 for(let n=0;n<40;n++){const map=E.caveMap(n,'pdf',n%4),features=EP.dungeonFeatures(map,n,'pdf|'+n,E.hash);assert.ok(EP.validateDungeonMechanisms(map,features));assert.deepEqual(features,EP.dungeonFeatures(map,n,'pdf|'+n,E.hash));
 const state={};const runes=features.filter(f=>f.kind==='rune');EP.visitDungeonRune(state,runes[1]);assert.equal(state.runeStep,0);for(const rune of runes)EP.visitDungeonRune(state,rune);assert.ok(state.solved);
 const objects=EP.puzzleObjects(map,n,'pdf|'+n,E.hash);assert.ok(EP.reachableExits(map,objects));
 const secret=EP.secretPassage(map,n,'pdf|'+n,E.hash);if(secret){assert.equal(map.grid[secret.y][secret.x],'wall');assert.ok(EP.DIRECTIONS.some(([dx,dy])=>map.grid[secret.y+dy]?.[secret.x+dx]!=='wall'));}
 }
});
test('Sealer development continues beyond level 100 without resetting Energy or cooldowns',()=>{
 const f=fixture();f.q.level=100;f.q.energy=12;f.q.supportCooldowns.shared=50000;
 SE.gainSealerXP(f.save,10000);assert.ok(f.q.level>100);assert.equal(f.q.energy,12);assert.equal(f.q.supportCooldowns.shared,50000);
});

test('ambient world weather survives ordinary battle time and returns after a temporary weather Move',()=>{
 const f=fixture();const field=E.bindBattlefield(f.context.teams.a,f.context.teams.b,{weather:'rain',ambientWeather:'rain'});f.step(12000);assert.equal(field.weather,'rain');
 field.weather='snow';field.weatherTurns=1;RT.synchronizeTimers(f.state,f.context);f.step(2000);assert.equal(field.weather,'rain');f.step(10000);assert.equal(field.weather,'rain');
});
test('legacy derived Domain caches cannot keep an unequipped status resistance alive',()=>{
 const f=fixture();assert.equal(CS.statusChance(1,'sleep',f.sp,{...f.a,acquiredDomains:['Psionic']}),CS.statusChance(1,'sleep',f.sp,f.a));
});
test('canonicalizing saved individual passive choices preserves their discipline and unlock',()=>{
 const sp={id:'old-passives',base:'Beast',alter:'Fey',domains:['Time']},u={id:'old',passives:{Time:'time-clarity'},unlockedPassives:['time-clarity']};
 CP.ensureIndividualPassives(sp,u);assert.equal(u.passives.Fate,'fate-clarity');assert.ok(u.unlockedPassives.includes('fate-clarity'));assert.equal(u.passives.Time,undefined);
});
test('observation games have an inferable pattern and rhythm rewards depend on timing',()=>{
 const a=A.observationChallenge('skill',4);assert.deepEqual(a.pattern.slice(0,2),a.pattern.slice(3,5));assert.equal(a.answer,a.pattern[2]);assert.ok(a.choices.includes(a.answer));assert.equal(A.rhythmScore(800),1);assert.equal(A.rhythmScore(0),0);assert.equal(A.rhythmScore(2400),1);
});
test('side-activity records, milestones and companion rewards persist without entry costs',()=>{
 const a={};const miss=A.recordSideActivity(a,'observation',0,.2);assert.equal(miss.reward,0);for(let n=0;n<5;n++)A.recordSideActivity(a,'observation',1,.2);assert.equal(a.activityRecords.observation.wins,5);assert.equal(a.activityRecords.observation.milestones,1);const restored=JSON.parse(JSON.stringify(a));assert.equal(restored.activityRecords.observation.best,1);
});
test('dimension-qualified steeds use the same status and suppression checks as field releases',()=>{
 const sp={base:'Beast',alter:'Fey',domains:[],moves:[],anatomy:{bodyPlan:'quadruped',traits:[],strength:1},dimensions:{heightMeters:1.7}};
 assert.equal(fieldCapabilityAvailable(sp,'steed',{}),true);assert.equal(fieldCapabilityAvailable(sp,'steed',{status:'freeze'}),false);assert.equal(fieldCapabilityAvailable(sp,'steed',{conditions:{trap:1}}),false);assert.equal(fieldCapabilityAvailable(sp,'steed',{suppressedCapabilities:['steed']}),false);
});
