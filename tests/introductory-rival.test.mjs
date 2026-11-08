import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import * as E from '../engine.mjs';
const app=readFileSync(new URL('../app.mjs',import.meta.url),'utf8');
const extract=name=>{const start=app.indexOf('function '+name+'('),end=app.indexOf('\nfunction ',start+1);return app.slice(start,end).replace(/\nlet challengerApproach=null;$/,'');};
const sp=E.makeSpecies(8,'Beast','Fey',[]);
function harness(){const s={seed:7,challengers:{rivalMatches:0}},h=vm.createContext({s,E,speciesFor:()=>sp,challengerState:()=>s.challengers});vm.runInContext(extract('firstRivalMatch')+'\n'+extract('challengerTeam'),h);return {s,h};}
test('first rival uses one level-one unevolved Spirimon even in a high-level area',()=>{
 const {h}=harness(),team=h.challengerTeam('rival',60,0,{minLevel:55});
 assert.equal(team.length,1);assert.equal(team[0].level,1);assert.equal(team[0].form,0);
});
test('subsequent rivals and hostile trainers retain normal scaling; legacy rivals are not reset',()=>{
 const {s,h}=harness();s.challengers.rivalMatches=1;
 assert.ok(h.challengerTeam('rival',30,1,{minLevel:25}).every(u=>u.level>=30));
 s.challengers.rivalMatches=0;s.npcSealers={rowan:{}};assert.equal(h.firstRivalMatch(),false);
 delete s.npcSealers;assert.ok(h.challengerTeam('villain',30,0,{minLevel:25}).every(u=>u.level>=30));
});
test('introductory opponent holds back and is easier to defeat without changing ordinary combat',()=>{
 const a=E.heal(E.makeIndividual(sp,1,0,E.rng(1)),sp),b=E.heal(E.makeIndividual(sp,1,0,E.rng(2)),sp),move={type:'Beast',power:50,category:'Physical'};
 const baseline=E.damage(a,sp,b,sp,move,'normal',()=>.5);
 a.introductoryRival=true;assert.ok(E.damage(a,sp,b,sp,move,'normal',()=>.5)<=Math.max(1,Math.floor(baseline*.15)));
 delete a.introductoryRival;b.introductoryRival=true;assert.ok(E.damage(a,sp,b,sp,move,'normal',()=>.5)>=baseline*3);
 delete b.introductoryRival;assert.equal(E.damage(a,sp,b,sp,move,'normal',()=>.5),baseline);
});
