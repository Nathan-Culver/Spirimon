import * as TUTORIAL from '../tutorials.mjs';
import {restoreDomainRegistry,discoverCustomDomain} from '../domains.mjs';
import {enemySpeech} from '../npc-dialogue.mjs';
import {battleRewards} from '../battle-rewards.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import * as E from '../engine.mjs';
const source=readFileSync(new URL('../app.mjs',import.meta.url),'utf8');
const extract=name=>{const start=source.indexOf('function '+name+'('),end=source.slice(start+1).search(/\n(?:async )?function /);return source.slice(start,end<0?source.length:start+1+end);};
function harness(){
 const state=E.newGame('level-dialog'),species=[0,1,2].map(n=>E.makeSpecies('level-dialog-'+n,'Beast','Fey'));
 for(const sp of species){sp.evolution='level';state.species[sp.id]=sp;}
 const units=species.map((sp,n)=>({...E.heal(E.makeIndividual(sp,4,0,E.rng(n)),sp),id:'ally-'+n,xp:71}));state.spirits=units;state.party=units.map(u=>u.id);
 const dialogs=[],toasts=[],details=[],transforms=[];let saves=0;
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const h=vm.createContext({battleClosingDialogue:()=>false,cloneScene:()=>null,queueBattleIntroduction(){},requestStartupFullscreen(){},sceneFadeUntil:0,performance,TUTORIAL,restoreDomainRegistry,discoverCustomDomain,enemySpeech,encounterAftermath:()=>'',E,battleRewards,s:state,battle:{ally:units[0].id,enemy:{level:10},participants:units.map(u=>u.id),trainer:false},SE:{gainSealerXP(){},bondRecovery(){}},esc,spOf:ind=>state.species[ind.species],sprite:(sp,form)=>'<canvas data-species="'+sp.id+'" data-form="'+form+'"></canvas>',action:(type,text,value='')=>'<button data-action="'+type+'" data-value="'+value+'">'+text+'</button>',safe:()=>true,showModal:(title,html,options)=>dialogs.push({title,html,options}),toast:text=>toasts.push(text),detail:id=>details.push(id),transformSpirit:(...args)=>transforms.push(args),save:()=>saves++,render(){},endCombatState(){},questState:()=>({}),renown(){},awardBattleEquipment(){},removeRoamer(){},ensurePlayerOnPath(){},note(){}});
 vm.runInContext(['gainSpirimonXP','levelUpHTML','showTrainingAdvancement','training','shareOffering','recordBattleQuestProgress','winBattle'].map(extract).join('\n'),h);
 return {h,state,species,units,dialogs,toasts,details,transforms,saves:()=>saves,eval:code=>vm.runInContext(code,h)};
}
test('battle level-up dialog includes teammates even when the lead does not level',()=>{
 const t=harness();t.units[0].level=20;t.units[0].form=t.units[0].appearance=1;t.units[0].xp=0;t.eval('winBattle()');
 const dialog=t.dialogs.at(-1);assert.equal(dialog.title,'Level up!');assert.equal((dialog.html.match(/class="level-up-card"/g)||[]).length,2);
 for(const n of [1,2]){assert.match(dialog.html,new RegExp(t.species[n].forms[0]));assert.equal(t.units[n].level,5);}assert.match(dialog.html,/Level 4 → 5/);assert.equal(t.units[0].level,20);assert.match(dialog.html,/60 experience/);assert.match(dialog.html,/Continue exploring/);assert.equal(t.h.battle,null);
});
test('training shows a persistent level-up dialog instead of only a toast',()=>{
 const t=harness(),coins=t.state.inventory.coins;t.eval("training('ally-0')");const dialog=t.dialogs.at(-1);
 assert.equal(dialog.title,'Level up!');assert.equal(dialog.options.kind,'level-up');assert.match(dialog.html,/Level 4 → 5/);assert.match(dialog.html,/data-action="detail" data-value="ally-0"/);assert.equal(t.toasts.length,0);assert.equal(t.state.inventory.coins,coins-25);assert.equal(t.saves(),1);
});
test('multiple levels, transformations and learned Techniques appear in the same advancement card',()=>{
 const t=harness(),ind=t.units[0],sp=t.species[0];ind.level=15;ind.xp=269;ind.bond=80;sp.learnset.push({...sp.moves[0],id:'new-dialog-move',name:'Dawn <Lance>',learnLevel:16});
 t.eval("training('ally-0')");const dialog=t.dialogs.at(-1);assert.equal(dialog.title,'Level up!');assert.match(dialog.html,/Level 15 → 16/);assert.match(dialog.html,/Transformed:/);assert.ok(dialog.html.includes(sp.forms[0])&&dialog.html.includes(sp.forms[1]));assert.match(dialog.html,/Dawn &lt;Lance&gt;/);assert.equal(ind.form,1);assert.equal(t.transforms.length,1);
 const fresh=harness();fresh.h.amount=4*18+5*18+6*18+1;fresh.units[0].xp=0;const change=fresh.eval('gainSpirimonXP(s.spirits[0],spOf(s.spirits[0]),amount)');fresh.h.change=change;assert.equal(change.levels,3);assert.match(fresh.eval('levelUpHTML([change])'),/Level 4 → 7/);
});
test('ordinary XP gains keep normal results and never announce a false level-up',()=>{
 const t=harness();for(const unit of t.units){unit.level=20;unit.form=unit.appearance=1;unit.xp=0;}t.eval('winBattle()');assert.equal(t.dialogs.at(-1).title,'A bond grows stronger.');assert.doesNotMatch(t.dialogs.at(-1).html,/level-up-card/);
 const train=harness();train.units[0].xp=0;train.eval("training('ally-0')");assert.equal(train.dialogs.length,0);assert.deepEqual(train.details,['ally-0']);assert.equal(train.toasts.length,1);
});
test('a bond transformation also shows its new form without claiming a level was gained',()=>{
 const t=harness(),ind=t.units[0],sp=t.species[0];t.h.battle=null;sp.evolution='bond';ind.level=16;ind.xp=0;ind.bond=55;t.eval("shareOffering('ally-0')");assert.equal(t.dialogs.at(-1).title,'A new form awakens.');assert.match(t.dialogs.at(-1).html,/Transformed:/);assert.doesNotMatch(t.dialogs.at(-1).html,/Level 16 → 16/);assert.equal(ind.level,16);
});

test('actual victory grants every participant the full defeated-team XP total and reports it in the dialog',()=>{
 const t=harness();for(const u of t.units){u.level=20;u.form=u.appearance=1;u.xp=0;}
 const foes=[10,20,30].map((level,n)=>({id:'defeated-'+n,level,hp:0}));t.h.battle.trainer=true;t.h.battle.enemyRoster=foes;t.h.battle.enemy=foes[2];
 const reward=battleRewards(t.h.battle,t.state.rank),expected=t.units.map((u,n)=>{const copy=structuredClone(u);E.gainXP(copy,t.species[n],reward.xp);return copy;}),coins=t.state.inventory.coins;let sealerXP=0;t.h.SE.gainSealerXP=(_s,xp)=>sealerXP=xp;
 t.eval('winBattle()');for(const [n,u]of t.units.entries()){assert.equal(u.level,expected[n].level);assert.equal(u.xp,expected[n].xp);}assert.equal(t.state.inventory.coins,coins+reward.coins);assert.equal(sealerXP,330);assert.match(t.dialogs.at(-1).html,/524 experience/);
});

test('unrelated trainer wins cannot complete Rowan’s quest or award his friendship',()=>{
 for(const sealerKey of ['trainer:ordinary','faction:ashen-hand','clan:verdant-circle','facility:arena']){
  const t=harness();Object.assign(t.h.battle,{trainer:true,sealerKey});t.eval('winBattle()');
  assert.equal(t.state.quests.rival,false);assert.equal(t.state.friendships['rival-0,0'],undefined);assert.equal(t.state.challengers,undefined);
 }
});
test('guild and approaching Rowan victories update rival objectives before quest advancement and award friendship once',()=>{
 for(const identity of [{sealerKey:'rowan'},{sealerKey:'challenger:rival'},{challenger:'rival'}]){
  const t=harness(),quest=E.questTemplates().find(q=>q.id==='rival-training');t.state.questLog={[quest.id]:{stage:1,baseline:0}};
  t.h.questState=()=>t.state.questLog;t.h.challengerState=()=>t.state.challengers??={};Object.assign(t.h.battle,{trainer:true,...identity});const match=structuredClone(t.h.battle);
  t.eval('winBattle()');assert.equal(t.state.challengers.rivalWins,1);assert.equal(t.state.questLog[quest.id].stage,quest.steps.length);assert.equal(t.state.quests.rival,true);assert.equal(t.state.friendships['rival-0,0'],8);
  t.h.battle=match;t.eval('winBattle()');assert.equal(t.state.challengers.rivalWins,2);assert.equal(t.state.friendships['rival-0,0'],8);
 }
});
test('hostile agent victory completes an accepted quest immediately without counting as Rowan',()=>{
 const t=harness(),quest=E.questTemplates().find(q=>q.id==='safe-trails');t.state.questLog={[quest.id]:{stage:0,baseline:0}};t.h.questState=()=>t.state.questLog;t.h.challengerState=()=>t.state.challengers??={};Object.assign(t.h.battle,{trainer:true,challenger:'villain'});
 t.eval('winBattle()');assert.equal(t.state.challengers.villainWins,1);assert.equal(t.state.questLog[quest.id].stage,1);assert.equal(t.state.quests.rival,false);
});
test('rival journal shows Rowan progress rather than unrelated total wins and retains earned legacy completion',()=>{
 const t=harness();t.state.wins=57;t.h.challengerState=()=>t.state.challengers??={};vm.runInContext(extract('journalHTML'),t.h);
 assert.match(t.eval('journalHTML()'),/0 Rowan victories/);assert.doesNotMatch(t.eval('journalHTML()'),/57 victories/);t.state.quests.rival=true;assert.match(t.eval('journalHTML()'),/quest-complete[^]*A friendly rivalry[^]*Completed/);
});
