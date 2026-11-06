import {installBattleBoundaries} from './helpers/battle-boundaries.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import * as E from '../engine.mjs';
import * as SE from '../spiritual-energy.mjs';
import * as RT from '../realtime-combat.mjs';
import * as BAI from '../battle-ai.mjs';
import * as CO from '../cooperative-techniques.mjs';
import * as A from '../adventure-systems.mjs';
import * as CP from '../classification-passives.mjs';
import {individualSpecies} from '../anatomy.mjs';
const app=readFileSync(new URL('../app.mjs',import.meta.url),'utf8');
function extract(name){const start=app.indexOf('function '+name+'('),next=app.slice(start+1).search(/\n(?:async )?function /);assert.ok(start>=0,name);return app.slice(start,next<0?app.length:start+1+next);}
function harness(){
 const state=E.newGame('integration');for(let n=0;n<6;n++){const sp=E.makeSpecies('integrated-'+n,E.TYPES[n],E.TYPES[(n+4)%12]);state.species[sp.id]=sp;const u=E.heal(E.makeIndividual(sp,20,0,E.rng(n)),sp);u.id='party'+n;state.spirits.push(u);state.party.push(u.id);}SE.ensureSealer(state);
 const h=vm.createContext({E,SE,RT,BAI,CO,A,CP,individualSpecies,mapWeather:()=>({kind:'rain'}),currentRegion:()=>({minLevel:1}),speciesFor:()=>Object.values(state.species)[0],encounterState:()=>({}),showModal(){},safe:()=>true,note(){},esc:String,action:()=>'',structuredClone,s:state,battle:null,closeModal(){},save(){},render(){},toast(){},discover(){},equipWildItem:u=>u,commit:.5,style:'normal',selectedMove:0,movePreviewKey:null,battleMode:'main',view:'explore'});
 vm.runInContext(['party','lead','spOf','battleTeams','realTimeContext','applyRealTimeContext','ensureRealTimeBattle','persistentEnemySealer','configureEnemyRoster','startBattle','runEnemySealer','finishRealTimeEncounter','adventureState','competitionPartyLevel','prepareCompetitionBattle','startGuildTrial','startChampionshipMatch','recordCompetitionDefeat','passiveMenu','studyPassive','equipPassive','selectRealTimeTarget'].map(extract).join('\n'),h);return installBattleBoundaries(h);
}
test('actual encounter entry gives only the designated lead a free release and creates manual three-creature combat',()=>{
 const h=harness(),sp=Object.values(h.s.species)[0],enemy=E.heal(E.makeIndividual(sp,10,0,E.rng('foe')),sp);h.enemy=enemy;vm.runInContext('startBattle(enemy)',h);assert.equal(h.battle.multi.allies.length,1);assert.equal(h.battle.multi.allies[0],h.s.sealer.leadId);assert.equal(h.s.sealer.energy,h.s.sealer.maxEnergy);assert.equal(h.battle.rt.version,2);assert.deepEqual(Object.keys(h.battle.autoAllies),[]);
});
test('changing an NPC roster keeps active objects in that roster and pays for additional manifestations',()=>{
 const h=harness(),sp=Object.values(h.s.species)[0],team=Array.from({length:6},(_,n)=>E.heal(E.makeIndividual(sp,12,0,E.rng('npc'+n)),sp));h.team=team;
 vm.runInContext("startBattle(team[0],null,true,{sealerId:'test-opponent'});configureEnemyRoster(team)",h);assert.ok(h.battle.enemyRoster.includes(h.battle.multi.enemies[0]));const q=h.battle.enemySealer,before=q.energy;
 vm.runInContext('runEnemySealer(realTimeContext())',h);const ctx=vm.runInContext('realTimeContext()',h);assert.ok(q.energy<before);assert.ok(ctx.active.b.length<=3);assert.ok(ctx.active.b.every(u=>ctx.teams.b.includes(u)));
});
test('named opponent rematches preserve Energy, shared support timers, and creature Technique timers',()=>{
 const h=harness(),sp=Object.values(h.s.species)[0];h.team=[E.heal(E.makeIndividual(sp,10),sp)];const q=vm.runInContext("persistentEnemySealer('rowan',team)",h);q.energy=25;q.supportCooldowns.example=60000;h.team[0].moveCooldowns.example=70000;h.s.sealer.clockMs=1000;h.next=[E.heal(E.makeIndividual(sp,10),sp)];const again=vm.runInContext("persistentEnemySealer('rowan',next)",h);assert.equal(again,q);assert.equal(again.energy,25);assert.equal(again.supportCooldowns.example,60000);assert.equal(h.next[0].moveCooldowns.example,70000);assert.equal(h.next[0].id,h.team[0].id);
});
test('offering plan commits Energy and supplies exactly once, with no payment when unaffordable',async()=>{
 const text=readFileSync(new URL('../offerings.mjs',import.meta.url),'utf8'),start=text.indexOf('async function choosePlan('),end=text.indexOf('\nfunction ',start),code=text.slice(start,end);let energy=0,paid=0,trials=0;
 const session={stage:'prepare',config:{sp:{},roamer:{id:'one'},inventory:{offerings:5},notice(){},commitEnergy(){if(energy<3)return false;energy-=3;paid++;return true;},async persist(){}}};const h=vm.createContext({session,offeringPlans:()=>[{id:'one',cost:{offerings:2}}],showTrial(){trials++;}});vm.runInContext(code,h);await vm.runInContext("choosePlan('one')",h);assert.equal(session.config.inventory.offerings,5);assert.equal(paid,0);energy=10;await vm.runInContext("choosePlan('one')",h);assert.equal(energy,7);assert.equal(paid,1);assert.equal(session.config.inventory.offerings,3);await vm.runInContext("choosePlan('one')",h);assert.equal(paid,1);assert.equal(trials,1);
});

test('Guild trial menu actions launch the restricted format in the actual encounter',()=>{
 const h=harness();vm.runInContext("startGuildTrial('discipline')",h);assert.equal(h.battle.adventure.kind,'guild-trial');assert.equal(h.battle.rules.maxActive,1);assert.equal(h.battle.enemyRoster.length,2);
 vm.runInContext('runEnemySealer(realTimeContext())',h);assert.equal(h.battle.multi.enemies.length,1);
});
test('championship gameplay uses its current stage and retreat records elimination',()=>{
 const h=harness();h.s.rank=4;const a=vm.runInContext('adventureState()',h);a.crests=A.CLANS.map(c=>c.id);a.guildTrials=A.GUILD_TRIALS.map(t=>t.id);A.beginChampionship(a,{rank:4});
 vm.runInContext('startChampionshipMatch()',h);assert.equal(h.battle.rules.maxActive,1);assert.equal(h.battle.adventure.kind,'championship');assert.equal(h.battle.enemyRoster.length,3);
 vm.runInContext('recordCompetitionDefeat()',h);assert.equal(a.championship.status,'eliminated');assert.equal(a.champion,false);
});
test('preparing an individual passive through the actual UI preserves HP percentage and sibling choices',()=>{
 const h=harness(),u=h.s.spirits[0],sp=h.s.species[u.species],selected=CP.passivePool(sp.base).find(p=>p.kind==='maxHp');u.hp=Math.floor(E.stats(u,sp).hp/2);h.selection=u.id+'|'+sp.base+'|'+selected.id;
 const percent=u.hp/E.stats(u,sp).hp;vm.runInContext('studyPassive(selection);equipPassive(selection)',h);
 assert.equal(u.passives[sp.base],selected.id);assert.ok(Math.abs(u.hp/E.stats(u,sp).hp-percent)<.01);
});

test('clicking battle HUD targets selects a real opponent or allied recipient without pausing combat',()=>{
 const h=harness(),sp=Object.values(h.s.species)[0];h.enemy=E.heal(E.makeIndividual(sp,10),sp);vm.runInContext('startBattle(enemy)',h);
 h.battle.multi.enemies.push(E.heal(E.makeIndividual(sp,11),sp));vm.runInContext("selectRealTimeTarget('enemy|1')",h);assert.equal(h.battle.enemyTargetSelection,1);assert.equal(h.battle.rt.paused,false);
 vm.runInContext("selectRealTimeTarget('enemy|9')",h);assert.equal(h.battle.enemyTargetSelection,1);
});

test('full restoration rejects towns, interiors and battle and succeeds beside a Shrine',()=>{
 const h=harness();let nearby=null;h.SW={nearbyShrine:()=>nearby};h.questEvent=()=>{};vm.runInContext(extract('rest'),h);
 const u=h.s.spirits[0];u.hp=1;h.s.sealer.energy=0;
 vm.runInContext('rest()',h);assert.equal(u.hp,1);assert.equal(h.s.sealer.energy,0);
 h.s.interior={kind:'inn'};vm.runInContext('rest()',h);assert.equal(u.hp,1);
 delete h.s.interior;nearby={id:'shrine-test'};h.battle={};vm.runInContext('rest()',h);assert.equal(u.hp,1);
 h.battle=null;vm.runInContext('rest()',h);assert.equal(u.hp,E.stats(u,h.s.species[u.species]).hp);assert.equal(h.s.sealer.energy,h.s.sealer.maxEnergy);
});
