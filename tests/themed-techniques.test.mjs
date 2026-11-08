import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../engine.mjs';
import * as RT from '../realtime-combat.mjs';
import {ROSTER} from '../roster.mjs';
import {TYPES} from '../engine.mjs';
import {BASE_DOMAINS,registerDomain} from '../domains.mjs';
import {allMoveTemplates,lineageMoves,domainMoves,TYPE_MOVES} from '../moves.mjs';
import {LINEAGE_TECHNIQUE_DATA,allThemedTemplates,domainSignatureMoves} from '../themed-techniques.mjs';
import {animationProfile} from '../move-animations.mjs';
function species(row){const sp={...E.makeSpecies('roster-'+row.id,row.base,row.alter,row.domains),...row,id:'roster-'+row.id,learnset:[],moveRevision:0};E.refreshTechniques(sp);return sp;}

test('all 150 roster lineages, 12 Types and 36 Domains receive exactly three distinct additional techniques',()=>{
 assert.equal(Object.keys(LINEAGE_TECHNIQUE_DATA).length,ROSTER.length);
 const additions=allThemedTemplates();assert.equal(additions.length,594);assert.equal(new Set(additions.map(m=>m.id)).size,594);assert.equal(new Set(additions.map(m=>m.name)).size,594);
 const templates=new Set(allMoveTemplates().map(m=>m.id));
 for(const row of ROSTER){const sp=species(row),moves=sp.learnset.filter(m=>m.techniqueSource?.scope==='lineage');assert.equal(moves.length,3,row.id);for(const m of moves){assert.equal(m.techniqueSource.key,row.id);assert.ok(templates.has(m.id));}}
 for(const type of TYPES)assert.equal(TYPE_MOVES[type].filter(m=>m.techniqueSource?.scope==='type').length,3,type);
 for(const domain of BASE_DOMAINS)assert.equal(domainMoves(domain,'Beast').filter(m=>m.techniqueSource?.scope==='domain').length,3,domain);
});
test('lineage and classification eligibility respect levels and forms, with no unrelated signatures',()=>{
 const sp=species(ROSTER[0]),u=E.makeIndividual(sp,1,0,E.rng(1));
 assert.equal(E.availableTechniques(u,sp).filter(m=>m.techniqueSource).length,0);
 for(const [level,form,index]of [[6,0,0],[18,1,1],[36,2,2]]){u.level=level;u.form=form;assert.ok(E.availableTechniques(u,sp).some(m=>m.id==='themed-lineage-kilnscale-'+index));}
 u.level=100;u.form=0;assert.equal(E.availableTechniques(u,sp).filter(m=>m.techniqueSource?.scope==='lineage').length,1);
 for(const move of sp.learnset.filter(m=>m.techniqueSource)){const {scope,key}=move.techniqueSource;if(scope==='type')assert.ok([sp.base,sp.alter].includes(key));if(scope==='domain')assert.ok(sp.domains.includes(key));assert.ok(!move.id.includes('dewveil'));}
});
test('legacy migration is idempotent and preserves equipment, learned moves, cooldowns and current resources',()=>{
 const sp=species(ROSTER[0]),u=E.heal(E.makeIndividual(sp,20,1,E.rng(2)),sp);sp.learnset=sp.learnset.filter(m=>!m.techniqueSource);sp.moveRevision=6;u.unlockedMoves=[sp.moves[0].id];u.moveIds=sp.moves.map(m=>m.id);u.moveCooldowns={[u.moveIds[0]]:45000};u.hp=17;u.pp=3;u.willpower=4;const before=structuredClone(u);
 E.refreshTechniques(sp);const once=JSON.stringify(sp);E.refreshTechniques(sp);assert.equal(JSON.stringify(sp),once);assert.deepEqual(u,before);assert.equal(sp.learnset.filter(m=>m.techniqueSource?.scope==='lineage').length,3);
});
test('new custom Domains gain three affinity-based techniques even on an already-current species',()=>{
 const sp=species(ROSTER[0]);registerDomain('Lantern Echo',{affinity:'Spirit'});sp.domains.push('Lantern Echo');E.refreshTechniques(sp);
 const moves=domainSignatureMoves('Lantern Echo',sp.alter);assert.equal(moves.length,3);for(const m of moves){assert.equal(m.domain,'Lantern Echo');assert.ok(sp.learnset.some(x=>x.id===m.id));}
});
test('every new technique resolves supported combat mechanics, has real timers and a unique animation',()=>{
 const row=ROSTER[0],sp=species(row),signatures=new Set();
 for(const move of allThemedTemplates()){
  const a=E.heal(E.makeIndividual(sp,50,2,E.rng(4)),sp),b=E.heal(E.makeIndividual(sp,50,2,E.rng(5)),sp);a.hp=Math.floor(a.hp/2);a.moveIds=undefined;sp.moves=[move];sp.learnset=[move];a.pp=a.willpower=500;b.pp=b.willpower=500;E.bindBattlefield([a],[b]);
  const profile=RT.moveTiming(move,a,sp);assert.ok(profile.cooldownMs>=1000,move.name);assert.ok(profile.castMs>=0);assert.ok(E.moveBaseValue(move)>0);const hp=b.hp;
  assert.doesNotThrow(()=>E.executeAction(a,sp,b,sp,move,'normal',.5,()=>.1),move.name);
  if(move.power>0)assert.ok(b.hp<hp,move.name);else if(move.target==='self')assert.ok(move.effect,move.name);
  const animation=animationProfile(move);assert.ok(animation.motif);assert.ok(!signatures.has(animation.signature),move.name);signatures.add(animation.signature);
 }
});
