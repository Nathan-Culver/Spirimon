import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import * as E from '../engine.mjs';
import * as G from '../stat-system.mjs';
import * as T from '../tutorials.mjs';
const sp={id:'growth',base:'Beast',alter:'Fey',domains:[],health:80,might:90,defense:70,energyPower:110,resistance:85,speed:95,power:90,forms:['A','B','C'],moves:[],learnset:[],passives:{},evolution:'level'};
function unit(level=50){const u=E.makeIndividual(sp,level,0,E.rng('stat-growth'));u.rareVariant=false;u.nature='Hardy';u.ivs=Object.fromEntries(G.STAT_KEYS.map(k=>[k,31]));u.evs=Object.fromEntries(G.STAT_KEYS.map(k=>[k,0]));return E.heal(u,sp);}
test('all six stats follow the level-scaled formula with correct Nature rounding',()=>{
 const u=unit();u.evs={hp:252,power:252,speed:6};u.nature='Modest';const st=E.stats(u,sp);
 assert.equal(st.hp,187);assert.equal(st.might,99);assert.equal(st.defense,90);assert.equal(st.power,178);assert.equal(st.resistance,105);assert.equal(st.speed,116);
 u.level=100;assert.equal(E.stats(u,sp).power,350);u.level=120;assert.ok(E.stats(u,sp).power>350);
});
test('IVs stay independent and fixed, with level-scaled effects and zero EVs at creation',()=>{
 const u=E.makeIndividual(sp,1,0,E.rng(42));assert.deepEqual(Object.values(u.evs),[0,0,0,0,0,0]);assert.ok(new Set(Object.values(u.ivs)).size>1);assert.ok(Object.values(u.ivs).every(v=>Number.isInteger(v)&&v>=0&&v<=31));
 const low=unit(1);low.ivs.might=0;const high=structuredClone(low);high.ivs.might=31;assert.ok(E.stats(high,sp).might-E.stats(low,sp).might<=1);
 low.level=high.level=100;assert.equal(E.stats(high,sp).might-E.stats(low,sp).might,31);const before=structuredClone(high.ivs);E.gainXP(high,sp,100*18);assert.deepEqual(high.ivs,before);
});
test('EV awards clamp both limits, count remainders and recalculate immediately',()=>{
 const u=unit(100);u.evs.might=251;assert.deepEqual(E.awardEVs(u,sp,{might:8}),{might:1});assert.equal(u.evs.might,252);
 E.awardEVs(u,sp,{power:252,speed:8});assert.equal(u.evs.speed,6);assert.equal(G.geneticProfile(u).total,510);assert.deepEqual(E.awardEVs(u,sp,{hp:8}),{});
 const v=unit(100),original=E.stats(v,sp).might;E.awardEVs(v,sp,{might:3});assert.equal(E.stats(v,sp).might,original);E.awardEVs(v,sp,{might:1});assert.equal(E.stats(v,sp).might,original+1);
 const max=v.hp;E.awardEVs(v,sp,{hp:4});assert.equal(v.hp,max+1);v.hp=0;E.awardEVs(v,sp,{hp:4});assert.equal(v.hp,0);
});
test('invalid and overfull save genetics normalize deterministically within both limits',()=>{
 const u=unit();u.ivs={hp:99,might:-1,power:NaN,speed:3.8};u.evs={hp:999,might:252,defense:252,power:-1,speed:Infinity};
 E.migrateIndividualStats(u,sp);const first=JSON.stringify(u);E.migrateIndividualStats(u,sp);assert.equal(JSON.stringify(u),first);assert.equal(u.ivs.hp,31);assert.equal(u.ivs.might,0);assert.equal(u.ivs.speed,3);assert.equal(u.evs.defense,6);assert.equal(G.geneticProfile(u).total,510);
 assert.ok(Object.values(E.stats(u,sp)).every(Number.isFinite));
});
test('legacy migration preserves IVs, Health fraction, fainting and timers only once',()=>{
 const u=unit(20);delete u.statRevision;u.trained=10;u.hp=Math.floor(E.stats(u,sp,{legacy:true}).hp/2);const old=u.hp/E.stats(u,sp,{legacy:true}).hp,ivs=structuredClone(u.ivs);u.moveCooldowns={x:12345};u.status='burn';
 E.migrateIndividualStats(u,sp);assert.ok(Math.abs(u.hp/E.stats(u,sp).hp-old)<.03);assert.deepEqual(u.ivs,ivs);assert.equal(u.evs.might,40);assert.equal(u.moveCooldowns.x,12345);assert.equal(u.status,'burn');const first=JSON.stringify(u);E.migrateIndividualStats(u,sp);assert.equal(JSON.stringify(u),first);
 delete u.statRevision;u.hp=0;E.migrateIndividualStats(u,sp);assert.equal(u.hp,0);
});
test('battle EV rewards go to living participants once per defeated enemy and persist across reload',()=>{
 const a=unit(),b=unit(),c=unit();a.id='a';b.id='b';c.id='c';c.hp=0;const foe={id:'foe',species:sp.id,hp:0,form:2},alive={...foe,id:'alive',hp:10};const battle={participants:['a','a','c'],enemyRoster:[foe,foe,alive]};
 assert.deepEqual(E.awardBattleEVs(battle,[a,b,c],()=>sp),[{id:'a',gained:{power:3}}]);assert.equal(a.evs.power,3);assert.equal(b.evs.power,0);assert.equal(c.evs.power,0);
 assert.deepEqual(E.awardBattleEVs(JSON.parse(JSON.stringify(battle)),[a,b,c],()=>sp),[]);battle.participants.push('b');alive.hp=0;E.awardBattleEVs(battle,[a,b,c],()=>sp);assert.equal(a.evs.power,6);assert.equal(b.evs.power,3);
});
test('level gains recompute all stats while preserving resources, conditions, timers and IVs',()=>{
 const u=unit(10);u.form=2;u.pp=0;u.willpower=0;u.moveCooldowns={x:999};u.status='poison';u.hp=0;const ivs=structuredClone(u.ivs),before=E.stats(u,sp);E.gainXP(u,sp,10*18+11*18+12*18);
 const after=E.stats(u,sp);for(const key of G.STAT_KEYS)assert.ok(after[key]>before[key],key);assert.equal(u.hp,0);assert.equal(u.status,'poison');assert.equal(u.pp,0);assert.equal(u.willpower,0);assert.equal(u.moveCooldowns.x,999);assert.deepEqual(u.ivs,ivs);
});
test('all stat cards and growth fields have equal markup and both tutorials explain the system',()=>{
 const app=readFileSync(new URL('../app.mjs',import.meta.url),'utf8'),extract=name=>app.slice(app.indexOf('function '+name+'('),app.indexOf('\nfunction ',app.indexOf('function '+name+'(')+1));
 const ctx=vm.createContext({E,esc:String});vm.runInContext(extract('battleStatsHTML')+'\n'+extract('geneticsHTML'),ctx);ctx.u=unit();ctx.sp=sp;
 const html=vm.runInContext('battleStatsHTML(u,sp)+geneticsHTML(u,sp)',ctx);for(const key of G.STAT_KEYS)assert.ok(html.includes(G.STAT_LABELS[key]));assert.equal((html.match(/<strong>/g)||[]).length,6);assert.match(html,/IV \/ 31/);assert.match(html,/EV \/ 252/);assert.match(html,/0 \/ 510/);
 assert.match(T.TUTORIAL_TABS.find(t=>t[0]==='stats')[2],/Physical Attack \(PA\)/);assert.ok(T.BATTLE_LESSON.some(t=>t.text.includes('Spiritual Defense (SD)')));assert.ok(T.BATTLE_LESSON.some(t=>t.text.includes('510')));
});
