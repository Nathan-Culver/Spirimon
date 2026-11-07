import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import * as TP from '../temple-philosophies.mjs';
import * as E from '../engine.mjs';
import * as BAI from '../battle-ai.mjs';
import {solveTempleFloor,walkTo} from '../tools/physical-playtest.mjs';
const source=readFileSync(new URL('../app.mjs',import.meta.url),'utf8');
const room=(p,n=0,seed=42)=>({id:'temple-qa-'+p,temple:'clan-0',philosophy:p,templeSeed:seed,level:n,x:1,y:1,depth:6});
for(const philosophy of TP.TEMPLE_PHILOSOPHIES)test(philosophy+' has reachable physical objectives and persistent progress on all trial floors',()=>{
 for(let seed=0;seed<8;seed++)for(let floor=0;floor<3;floor++){
  const save=E.newGame('physical-'+seed),r=room(philosophy,floor,seed);save.sealer={clockMs:0};save.cave=r;
  const before=save.steps;assert.equal(TP.canAdvanceTrial(save,r),false);const f=TP.trialLayout(r).features.find(f=>f.kind==='temple-inscription');assert.equal(TP.interactTrial(save,r,f).ok,false);
  const state=solveTempleFloor(save,r);assert.ok(state.solved);assert.equal(state.mistakes,0);assert.ok(save.steps>before);const loaded=JSON.parse(JSON.stringify(save));assert.ok(TP.canAdvanceTrial(loaded,loaded.cave));
  assert.equal(state.victory,false,'Trial completion must not fabricate a combat victory');
 }
});
test('all dynamic gate states retain a path to mechanisms, reset and stairs without field capabilities',()=>{
 for(const philosophy of ['Control','Transformation'])for(let mode=0;mode<8;mode++){
  const save=E.newGame('gates'),r=room(philosophy);save.cave=r;const layout=TP.trialLayout(r),state=TP.trialState(save,r);state.mask=mode;state.phase=mode%3;
  for(const f of [...layout.features,{x:23,y:17,name:'Stairs'}]){r.x=r.y=1;assert.doesNotThrow(()=>walkTo(save,r,f,TP.trialMap(save,r),layout.objects));}
 }
});
test('vent and tremor hazards affect resources and Health only until their paired mechanism is closed',()=>{
 for(const philosophy of ['Attrition','Resilience']){
  const save=E.newGame('hazards'),r=room(philosophy);save.cave=r;const state=TP.trialState(save,r),hazard=TP.trialLayout(r).features.find(f=>f.kind==='temple-hazard'),u={hp:100,pp:10,willpower:10};r.x=hazard.x;r.y=hazard.y;
  assert.ok(TP.trialStep(save,r,u,100));assert.equal(philosophy==='Attrition'?u.pp:u.hp,philosophy==='Attrition'?9:95);state.completed.push(hazard.order);const after=structuredClone(u);assert.equal(TP.trialStep(save,r,u,100),null);assert.deepEqual(u,after);
  u.hp=1;state.completed=[];TP.trialStep(save,r,u,100);assert.ok(u.hp>=1);
 }
});
test('misreads strengthen defenders; a Tempo deadline cannot be completed after the window',()=>{
 for(const philosophy of ['Counterplay','Prediction','Tempo','Transformation']){
  const save=E.newGame('errors'),r=room(philosophy);save.cave=r;save.sealer={clockMs:1};const layout=TP.trialLayout(r),state=TP.trialState(save,r);state.observed=true;
  // At least one of the three answers is wrong for every reactive trial.
  let found=false;for(const f of layout.features.filter(f=>f.id.startsWith('temple-node-'))){const snapshot=structuredClone(state);r.x=f.x;r.y=f.y;TP.interactTrial(save,r,f);if(state.mistakes){found=true;break;}Object.assign(state,snapshot);}
  assert.ok(found);assert.equal(TP.trialMistakes(save,r),1);
 }
 const save=E.newGame('tempo'),r=room('Tempo');save.cave=r;save.sealer={clockMs:100};const state=TP.trialState(save,r);state.observed=true;state.progress=2;state.deadline=99;
 const f=TP.trialLayout(r).features.find(f=>f.id==='temple-node-2');r.x=f.x;r.y=f.y;TP.interactTrial(save,r,f);assert.equal(state.solved,false);assert.ok(state.progress<=1);
});
test('disciples and Master require actual battle victories; legacy button progress and obstacle clearing cannot solve new trials',()=>{
 const save=E.newGame('guards');for(let floor=3;floor<6;floor++){const r=room('Control',floor);save.cave=r;assert.equal(TP.canAdvanceTrial(save,r),false);TP.recordTrialVictory(save,'temple-trainer','wrong|'+floor);assert.equal(TP.canAdvanceTrial(save,r),false);TP.recordTrialVictory(save,floor===5?'clan':'temple-trainer',floor===5?'clan-0':'clan-0|'+floor);assert.ok(TP.canAdvanceTrial(save,r));}
 const r=room('Tempo');save.dungeonState[r.id+'|0']={solved:true,runeStep:3};assert.equal(TP.trialState(save,r).solved,false);
 assert.doesNotMatch(source,/case'temple-(?:step|puzzle|obstacle|symbol|trainer|boss)'/);assert.doesNotMatch(source,/if\(room.temple&&room.level===0\)dungeonState\(room\).solved=true/);
});
test('philosophies alter actual AI action scores and legal prepared loadouts',()=>{
 const hit={id:'plain',name:'Strike',type:'Beast',category:'Physical',power:40,accuracy:1,baseUses:30},poison={...hit,id:'dot',name:'Attrition strike',power:35,effect:'poison'},sp={id:'ai',forms:['One','Two','Three'],base:'Beast',alter:'Giant',domains:[],health:150,power:50,speed:40,moves:[hit,poison],learnset:[hit,poison]},actor=E.heal(E.makeIndividual(sp,20,0,E.rng(1)),sp),target=E.heal(E.makeIndividual(sp,20,0,E.rng(2)),sp);
 actor.moveIds=['plain','dot'];const context={realTime:true,speciesOf:()=>sp,opponents:[target],allies:[actor],team:[actor]};
 const plain=BAI.chooseBattleAction(actor,context,()=>.5);actor.battlePhilosophy='Attrition';const attrition=BAI.chooseBattleAction(actor,context,()=>.5);assert.equal(attrition.move.id,'dot');assert.ok(attrition.score>plain.score);
 for(const philosophy of TP.TEMPLE_PHILOSOPHIES){const effect=TP.PHILOSOPHY_RULES[philosophy].effects[0],favored={...hit,id:'favored-'+philosophy,effect,power:35};const species={...sp,moves:[hit,favored],learnset:[hit,favored]},u=E.heal(E.makeIndividual(species,10,0,E.rng(3)),species);u.battlePhilosophy=philosophy;u.moveIds=['plain',favored.id];BAI.prepareOpponent(u,species);assert.ok(u.moveIds.includes(favored.id));assert.equal(u.specialty,TP.PHILOSOPHY_RULES[philosophy].specialty);assert.ok(TP.philosophyMoveWeight(philosophy,favored,{actor:u,target,allies:[u,target]})>TP.philosophyMoveWeight(philosophy,hit,{actor:u,target,allies:[u,target]}));}
});
test('Transformation changes form at Health thresholds while preserving percentages, equipped Techniques and running cooldowns',()=>{
 const sp=E.makeSpecies('transformation','Beast','Fey'),u=E.heal(E.makeIndividual(sp,40,0,E.rng(7)),sp);u.battlePhilosophy='Transformation';u.moveIds=sp.moves.map(m=>m.id);E.normalizeResources(u,sp);u.moveCooldowns={a:9000};const moves=[...u.moveIds],max=E.stats(u,sp);u.hp=Math.floor(max.hp*.7);u.pp=Math.floor(max.pp*.5);const ratio=u.hp/max.hp;
 assert.equal(TP.transformTempleCombatant(u,sp,E.stats,E.normalizeResources),true);assert.equal(u.form,1);assert.ok(Math.abs(u.hp/E.stats(u,sp).hp-ratio)<.02);assert.deepEqual(u.moveCooldowns,{a:9000});assert.deepEqual(u.moveIds,moves);assert.equal(TP.transformTempleCombatant(u,sp,E.stats,E.normalizeResources),false);
 u.hp=Math.floor(E.stats(u,sp).hp*.3);assert.ok(TP.transformTempleCombatant(u,sp,E.stats,E.normalizeResources));assert.equal(u.form,2);
});

test('Temple hints and initial labels immediately show live physical objectives between canvas frames',()=>{
 const s=E.newGame('immediate-hints'),r=room('Control');s.cave=r;TP.trialState(s,r).observed=true;
 const a=source.indexOf('function hint(){'),b=source.indexOf('\nfunction ',a+1),h=vm.createContext({s,TP});vm.runInContext(source.slice(a,b),h);assert.match(h.hint(),/Current lamps: OFF \/ OFF \/ OFF/);TP.trialState(s,r).mask=3;assert.match(h.hint(),/Current lamps: ON \/ ON \/ OFF/);
 const html=source.slice(source.indexOf('function exploreHTML(){'),source.indexOf('\nfunction ',source.indexOf('function exploreHTML(){')+1));assert.match(html,/s.cave\?dungeonInfo\(s.cave\)/);assert.match(html,/esc\(location.label\)/);
});
