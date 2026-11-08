import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import * as E from '../engine.mjs';
import * as D from '../difficulty.mjs';
import * as SW from '../spiritual-world.mjs';
import * as SE from '../spiritual-energy.mjs';
import * as RT from '../realtime-combat.mjs';
import * as CP from '../classification-passives.mjs';
import * as T from '../tutorials.mjs';
import * as FC from '../faction-campaigns.mjs';
import {registerDomain,DOMAINS,BASE_DOMAINS,discoverCustomDomain,normalizeSpeciesDomains,normalizeMoveDomains,DOMAIN_DEFINITIONS} from '../domains.mjs';
import {npcOpening,enemySpeech,lineOfSight,guardPosition} from '../npc-dialogue.mjs';
import {waitingEnemies} from '../npc-world.mjs';
import {decodeSavePayload} from '../save-files.mjs';
const app=readFileSync(new URL('../app.mjs',import.meta.url),'utf8');
function fixture(mode='normal'){
 const s=E.newGame('mode-'+mode),sp=E.makeSpecies('mode-species','Beast','Fey',[]);s.species[sp.id]=sp;const a=E.heal(E.makeIndividual(sp,20,0,E.rng('allied')),sp),b=E.heal(E.makeIndividual(sp,20,0,E.rng('enemy')),sp);s.spirits=[a];s.party=[a.id];s.roamers.one=[{ind:b}];E.applyWorldDifficulty(s,mode);return {s,sp,a,b};
}
const hit={id:'test-hit',name:'Test',power:40,kind:'physical'};
test('new journeys and unconfigured unit formulas default to Normal',()=>{const f=fixture();assert.equal(f.s.settings.difficulty,'normal');const copy={...f.a};delete copy.difficulty;assert.equal(E.stats(copy,f.sp).hp,E.stats(f.a,f.sp).hp);assert.equal(E.damage(copy,f.sp,f.b,f.sp,hit,'normal',()=>.5),E.damage(f.a,f.sp,f.b,f.sp,hit,'normal',()=>.5));});
test('Hard affects both sides equally; Easy benefits only owned Spirimon',()=>{
 const f=fixture(),a=E.stats(f.a,f.sp).hp,b=E.stats(f.b,f.sp).hp,damageA=E.damage(f.a,f.sp,f.b,f.sp,hit,'normal',()=>.5),damageB=E.damage(f.b,f.sp,f.a,f.sp,hit,'normal',()=>.5);
 E.applyWorldDifficulty(f.s,'hard');assert.ok(Math.abs(E.stats(f.a,f.sp).hp-a*.5)<=1);assert.ok(Math.abs(E.stats(f.b,f.sp).hp-b*.5)<=1);assert.ok(Math.abs(E.damage(f.a,f.sp,f.b,f.sp,hit,'normal',()=>.5)-damageA*1.25)<=1);assert.ok(Math.abs(E.damage(f.b,f.sp,f.a,f.sp,hit,'normal',()=>.5)-damageB*1.25)<=1);
 E.applyWorldDifficulty(f.s,'easy');assert.ok(Math.abs(E.stats(f.a,f.sp).hp-a*2)<=1);assert.ok(Math.abs(E.stats(f.b,f.sp).hp-b*.5)<=1);assert.ok(Math.abs(E.damage(f.b,f.sp,f.a,f.sp,hit,'normal',()=>.5)-damageB*.75)<=1);
});
test('mode changes preserve Health fractions, fainting, resources and running timers through saves',()=>{
 const f=fixture();f.a.hp=Math.floor(E.stats(f.a,f.sp).hp*.4);f.b.hp=0;f.a.pp=3;f.a.moveCooldowns={x:12345};const ratio=f.a.hp/E.stats(f.a,f.sp).hp;
 for(const mode of ['hard','easy','normal']){E.applyWorldDifficulty(f.s,mode);assert.ok(Math.abs(f.a.hp/E.stats(f.a,f.sp).hp-ratio)<.015);assert.equal(f.b.hp,0);assert.equal(f.a.pp,3);assert.equal(f.a.moveCooldowns.x,12345);}
 const s=decodeSavePayload({format:'spirimon-backup',version:1,save:f.s,library:[]}).save;assert.equal(s.settings.difficulty,'normal');assert.deepEqual(s.spirits[0].moveCooldowns,{x:12345});
});
test('legacy hard-scale saves open in Normal at the same Health percentage',()=>{
 const f=fixture('hard'),max=E.stats(f.a,f.sp).hp;f.a.hp=Math.floor(max*.5);const ratio=f.a.hp/max;delete f.s.settings.difficulty;for(const u of [f.a,f.b]){delete u.difficulty;delete u.difficultySide;}E.migrateSaveCreatures(f.s);assert.equal(f.s.settings.difficulty,'normal');assert.ok(Math.abs(f.a.hp/E.stats(f.a,f.sp).hp-ratio)<.01);
});
test('Shrine density is mode-aware, deterministic and Easy respects the city-wide cap',()=>{
 let hard=0,normal=0,easy=0;
 for(let x=-2;x<=2;x++)for(let y=-2;y<=2;y++){const h=SW.shrinesForRegion('mode-shrines',x,y,'hard'),n=SW.shrinesForRegion('mode-shrines',x,y,'normal'),e=SW.shrinesForRegion('mode-shrines',x,y,'easy'),r=E.region('mode-shrines',x,y);assert.ok(h.length<=1);assert.ok(e.length<=1);if(!r.city||r.cityKey===r.key)assert.equal(e.length,1);else assert.equal(e.length,0);hard+=h.length;normal+=n.length;easy+=e.length;assert.deepEqual(SW.shrinesForRegion('mode-shrines',x,y,'normal'),n);for(const p of [...h,...n,...e])assert.ok(E.walkable(E.tile('mode-shrines',p.x,p.y+1)));}assert.ok(normal>easy&&easy>hard);
});
test('mode changes do not refresh a consumed shared Shrine and percentage healing follows current maximum',()=>{
 const f=fixture('hard'),q=SE.ensureSealer(f.s),shrine=SW.shrinesForRegion(f.s.seed,0,0,'hard')[0]||SW.shrinesForRegion(f.s.seed,0,0,'easy')[0];SE.beginRecovery(f.s,'restore',{shrineId:shrine.id,safe:true});E.applyWorldDifficulty(f.s,'easy');assert.equal(SE.recoveryAvailable(f.s,'restore',shrine.id).ok,false);assert.equal(SE.recoveryAvailable(f.s,'meditate',shrine.id).ok,false);assert.equal(q.energy,q.maxEnergy);
});
test('cave encounter budgets preserve Hard and lower Normal and Easy pressure',()=>{for(const [mode,rate]of [['hard',.13],['normal',.065],['easy',.04]]){D.setWorldDifficulty(mode);assert.equal(E.encounterChance('cave'),rate);}D.setWorldDifficulty('normal');});
test('the 36 Domains remain distinct, and prior merged motifs recover their original identities',()=>{
 assert.equal(BASE_DOMAINS.length,36);assert.notEqual(E.canonicalDomain('Fire'),E.canonicalDomain('Water'));const sp={domains:['Nature','Spirit','Fate'],domainThemes:['Fire','Water','Moon'],domainRevision:2,moves:[],learnset:[]};normalizeSpeciesDomains(sp);assert.deepEqual(sp.domains,['Fate','Fire','Water','Moon']);const m={domain:'Nature',domainTheme:'Fire',id:'old-fire',name:'Kept'};normalizeMoveDomains(m);assert.equal(m.domain,'Fire');assert.equal(m.id,'old-fire');
});
test('custom Domains participate in classification, learned Techniques, passives and backup restoration',()=>{
 const name=registerDomain('Starlace',{affinity:'Spirit',description:'Fine threads of remembered light.'});assert.equal(name,'Starlace');assert.equal(registerDomain('<bad>'),null);const f=fixture();f.sp.domains.push(name);f.sp.customDomains=[{name,affinity:'Spirit'}];f.s.customDomains=[{name,affinity:'Spirit'}];E.refreshTechniques(f.sp);assert.ok(E.activeDomains(f.sp,f.a).includes(name));assert.equal(CP.passivePool(name).length,16);assert.ok(f.sp.learnset.some(m=>m.domain===name));const restored=decodeSavePayload({format:'spirimon-backup',version:1,save:f.s,library:[]});assert.ok(restored.save.species[f.sp.id].domains.includes(name));assert.equal(DOMAIN_DEFINITIONS.get(name).affinity,'Spirit');
});
test('a first discovery has a two-percent custom-Domain roll and cannot reroll by revisiting',()=>{const f=fixture();assert.equal(discoverCustomDomain(f.s,f.sp,()=>.5),null);assert.equal(discoverCustomDomain(f.s,f.sp,()=>0),null);const sp=E.makeSpecies('discovery','Elemental','Plant');const d=discoverCustomDomain(f.s,sp,()=>0);assert.ok(d&&sp.domains.includes(d.name));assert.equal(discoverCustomDomain(f.s,sp,()=>0),null);assert.ok(f.s.customDomains.some(v=>v.name===d.name));});
test('first-battle lesson pauses only its first encounter, rehearses a real command and resumes timers',()=>{
 const f=fixture(),battle={rt:RT.createRealTimeState()};assert.ok(T.beginBattleLesson(f.s,battle));assert.equal(battle.rt.paused,true);for(let i=0;i<5;i++)assert.ok(T.advanceBattleLesson(f.s,battle));assert.equal(T.BATTLE_LESSON[battle.lesson.stage].practice,true);assert.equal(battle.rt.paused,true);assert.equal(T.advanceBattleLesson(f.s,battle),false);assert.ok(T.advanceBattleLesson(f.s,battle,{action:true}));assert.equal(battle.rt.paused,true);while(battle.lesson)T.advanceBattleLesson(f.s,battle);assert.equal(battle.rt.paused,false);assert.equal(battle.lesson,undefined);assert.equal(T.beginBattleLesson(f.s,{rt:RT.createRealTimeState()}),false);
});
test('skipping, losing, and saving the first lesson cannot trigger a second guided battle',()=>{for(const skip of [true,false]){const f=fixture(),b={rt:RT.createRealTimeState()};T.beginBattleLesson(f.s,b);const snapshot=structuredClone(b);assert.equal(snapshot.lesson.stage,0);if(skip)T.advanceBattleLesson(f.s,b,{skip:true});else T.endBattleLesson(f.s,b);assert.equal(f.s.tutorial.battleComplete,true);assert.equal(T.beginBattleLesson(f.s,{rt:RT.createRealTimeState()}),false);}});
test('ordinary and unconfigured double taps submit equal commitment; a saved zero preset remains defensive',()=>{
 const a=app.indexOf("case'unified-move':{"),b=app.indexOf('\ncase',a+1),body=app.slice(a,b),calls=[],timers=[];let now=0;
 const h=vm.createContext({s:{settings:{}},unifiedSuppressClick:false,unifiedTap:null,useUnifiedMove:(...args)=>calls.push(args),setTimeout:fn=>{timers.push(fn);return timers.length;},clearTimeout(){},performance:{now:()=>now}});vm.runInContext('function click(v){switch("unified-move"){'+body+'}}',h);h.click('a|0');timers.pop()();assert.equal(calls[0][2],.5);
 h.click('a|0');now=100;h.click('a|0');assert.equal(calls.at(-1)[2],.5);h.s.settings.movePresets={'a|0':{commit:0,style:'agile'}};now=1000;h.click('a|0');now=1100;h.click('a|0');assert.equal(calls.at(-1)[2],0);
});
test('role introductions mix concrete gameplay advice with world and Spirimon lore',()=>{for(const role of ['keeper','merchant','scholar','rival','resident']){const s={},lines=new Set();for(let n=0;n<3;n++){const opening=npcOpening(s,{id:'npc-'+role,role});assert.equal(opening.length,2);opening.forEach(l=>lines.add(l));}assert.ok(lines.size>=6);}});
test('enemy dialogue chains retain faction identity and different before/after outcomes',()=>{for(const faction of ['ashen-hand','hollow-choir','veil-conclave']){const s={},n={id:'lookout-'+faction,faction};const before=enemySpeech(s,n),after=enemySpeech(s,n,'after','won');assert.equal(before.length,3);assert.equal(after.length,3);assert.notDeepEqual(before,after);assert.notDeepEqual(after,enemySpeech(s,n,'after','lost'));assert.notDeepEqual(before,enemySpeech(s,n));}});
test('hostiles see only a forward unobstructed cardinal line and have stable saved positions',()=>{
 const n={x:10,y:10,face:'right'};assert.equal(lineOfSight(n,{x:15,y:10},()=>false),true);assert.equal(lineOfSight(n,{x:9,y:10},()=>false),false);assert.equal(lineOfSight(n,{x:15,y:11},()=>false),false);assert.equal(lineOfSight(n,{x:17,y:10},()=>false),false);assert.equal(lineOfSight(n,{x:15,y:10},x=>x===12),false);
 const s=E.newGame('lookouts');let count=0;for(let x=-3;x<=3;x++)for(let y=-3;y<=3;y++){const group=waitingEnemies(s,x,y);count+=group.length;assert.deepEqual(waitingEnemies(structuredClone(s),x,y),group);for(const e of group)assert.ok(E.walkable(E.tile(s.seed,e.x,e.y)));}assert.ok(count>0);assert.deepEqual(waitingEnemies(s,0,0),[]);
});
test('approached faction guards resolve at their saved position without bypassing clue prerequisites',()=>{
 const s=E.newGame('moving-guards'),id='ashen-hand',room=s.cave={id:'faction-'+id,faction:id,level:0,x:20,y:6},guard=FC.layout(s.seed,id,0).features.find(f=>f.kind==='faction-guard');s.dungeonGuards={[room.id+'|0']:{[guard.id]:{x:20,y:7,face:'up'}}};assert.equal(guardPosition(s,room,guard).y,7);assert.equal(FC.interact(s,id,0,guard).battle,undefined);FC.floorState(s,id,0).clues=[0,1,2];assert.ok(FC.interact(s,id,0,guard).battle);room.x=1;room.y=1;assert.equal(FC.interact(s,id,0,guard).battle,undefined);
});

test('difficulty Health bonuses do not increase manifestation Energy costs',()=>{const f=fixture(),q=SE.ensureSealer(f.s);let costs=[];for(const mode of ['hard','normal','easy']){E.applyWorldDifficulty(f.s,mode);costs.push(SE.manifestationCost(q,f.a,f.sp,{ignoreLead:true}));}assert.equal(new Set(costs).size,1);});

test('a saved map challenge resumes its approach without rerolling the team or dialogue',()=>{const start=app.indexOf('function resumePendingChallenger('),end=app.indexOf('\nfunction ',start+1),pending={kind:'villain',npc:{id:'saved-lookout'},team:[{id:'retained'}],dialogue:'Retained words'},state={player:{x:10,y:10},waitingEnemies:{one:[{id:'saved-lookout',x:10,y:6,face:'down'}]}},h=vm.createContext({s:state,battle:null,modal:null,view:'explore',challengerApproach:null,queuedStep:[1,0],keys:new Set(['down']),challengerState:()=>({pending}),challengerPath:()=>[{x:10,y:7},{x:10,y:8},{x:10,y:9}],approachEntry:()=>{throw Error('Should retain the existing lookout');}});vm.runInContext(app.slice(start,end),h);h.resumePendingChallenger(500);assert.equal(h.challengerApproach.npcId,'saved-lookout');assert.equal(h.challengerApproach.x,10);assert.equal(h.challengerApproach.y,6);assert.equal(h.challengerApproach.path.length,3);assert.equal(pending.team[0].id,'retained');assert.equal(pending.dialogue,'Retained words');assert.equal(h.keys.size,0);});

test('guided practice releases only the initial deployment animation and preserves Technique recasts',()=>{const f=fixture(),b={rt:RT.createRealTimeState(),multi:{allies:[f.a.id]}};const c=RT.unitClock(b.rt,f.a);c.readyAt=f.a.animationReadyAt=650;c.cooldowns.protected=24000;c.gcdReadyAt=0;T.beginBattleLesson(f.s,b);for(let n=0;n<5;n++)T.advanceBattleLesson(f.s,b);assert.equal(b.rt.paused,true);assert.equal(c.readyAt,0);assert.equal(f.a.animationReadyAt,0);assert.equal(c.cooldowns.protected,24000);assert.equal(c.gcdReadyAt,0);assert.equal(RT.actionAvailability({...b.rt,paused:false},f.a,f.sp,{type:'move',move:hit}).ok,true);});

test('a resumed early-release practice save recovers its manifestation lock without replaying the lesson',()=>{const f=fixture(),b={rt:RT.createRealTimeState(),multi:{allies:[f.a.id]},lesson:{stage:5,practice:true}};const c=RT.unitClock(b.rt,f.a);c.readyAt=650;c.cooldowns.kept=50000;b.rt.paused=true;T.prepareBattlePractice(f.s,b);assert.equal(c.readyAt,0);assert.equal(c.cooldowns.kept,50000);assert.equal(b.lesson.stage,5);assert.equal(b.rt.paused,true);});

test('the first battle teaches Energy restoration before resuming, without spending Energy',()=>{
 const f=fixture(),battle={rt:RT.createRealTimeState()};f.s.sealer={energy:75};T.beginBattleLesson(f.s,battle);const energy=f.s.sealer.energy;let restoration=false;
 while(battle.lesson){const step=T.BATTLE_LESSON[battle.lesson.stage];if(step.title==='Restore with Energy'){restoration=true;assert.equal(battle.rt.paused,true);assert.equal(step.selector,'[data-sealer-meter="a"]');assert.match(step.text,/Health, Stamina, Willpower, or all three/);assert.match(step.text,/3.5-second/);assert.match(step.text,/cannot revive/);}T.advanceBattleLesson(f.s,battle,{action:!!step.practice});}
 assert.equal(restoration,true);assert.equal(f.s.sealer.energy,energy);assert.equal(battle.rt.paused,false);
 const page=T.TUTORIAL_TABS.find(t=>t[0]==='restoration');assert.ok(page);assert.match(page[2],/25%, 50%, and 100%/);assert.match(page[2],/40%/);assert.match(page[2],/30%/);assert.match(page[2],/rounded up/);
});
