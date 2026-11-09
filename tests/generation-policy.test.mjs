import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as E from '../engine.mjs';
import * as G from '../generation-policy.mjs';
import {GENERATION_REFERENCES} from '../generation-references.mjs';
import {GENERATION_REVIEW} from '../generation-review.mjs';
import {ROSTER} from '../roster.mjs';
import {applyLineageObservations} from '../anatomy.mjs';
const positive={nonhuman:true,confidence:.95,referenceConfidence:.95,personhoodVisible:true,anatomySound:true,plannedSurrealism:true,typeIntegration:true,domainIntegration:true,quality:{style:.95,readability:.95,materialClarity:.95}};
test('all 132 new Type pairs have explicit balanced bases, strict learning sources and three structural plans',()=>{
 for(const base of E.TYPES)for(const alter of E.TYPES)if(base!==alter){
  const sp=E.makeSpecies('policy-'+base+'-'+alter,base,alter);assert.equal(sp.generationRevision,2);assert.equal(sp.design.formPlans.length,3);
  const sum=['health','might','defense','energyPower','resistance','speed'].reduce((n,k)=>{assert.ok(Number.isInteger(sp[k])&&sp[k]>=20&&sp[k]<=100,k);return n+sp[k];},0);assert.equal(sum,sp.generationProfile.baseStatTotal);assert.ok(sum>=306&&sum<=336);
  assert.ok(sp.formDimensions.every(d=>d.heightMeters>0&&d.weightKg>0));assert.doesNotThrow(()=>G.validateGenerationPlan(sp));
  const counts={};for(const m of sp.learnset)if(m.learningSource)counts[m.learningSource]=(counts[m.learningSource]||0)+1;
  assert.equal(Object.keys(counts).length,2+sp.domains.length);assert.equal(new Set(Object.values(counts)).size,1);
  assert.ok(sp.moves.every(m=>sp.learnset.some(p=>p.id===m.id)));
 }
});
test('reference selection uses current approved atlas versions and corrected anatomy language',()=>{
 assert.equal(GENERATION_REFERENCES.length,150);for(const r of GENERATION_REFERENCES)assert.equal(r.atlas,ROSTER.find(s=>s.id===r.id).atlas);
 const mistral=GENERATION_REFERENCES.find(s=>s.id==='mistralwisp');assert.match(mistral.description,/two-armed/);assert.doesNotMatch(mistral.description,/four-armed/);
 assert.match(GENERATION_REFERENCES.find(s=>s.id==='bronzewade').approvedCorrection,/vertical eye/);
 const sp=E.makeSpecies('reference-selection','Beast','Construct');assert.equal(G.selectGenerationReferences(sp).length,3);assert.equal(G.selectGenerationReferences(sp,99).length,5);
 const prompt=G.generationPrompt(sp);assert.match(prompt,/approvedReferences/);assert.match(prompt,/No Move Speed field/);assert.match(G.generationPrompt(sp,[],{compact:true}),/code-planned anatomy/);
});
test('plans reject missing personhood, resize-only changes and unplanned body plans without changing the source',()=>{
 const original=E.makeSpecies('plan-rejections','Construct','Plant'),raw={forms:['One','Two','Three'],description:'A distinct rooted clockwork spirit.',formPlans:structuredClone(original.design.formPlans)},before=JSON.stringify(original);
 raw.formPlans[1].personhood='';assert.throws(()=>E.validateSpecies(raw,original),/personhood/);assert.equal(JSON.stringify(original),before);
 raw.formPlans=structuredClone(original.design.formPlans);Object.assign(raw.formPlans[1],{structure:'larger body',proportions:'more feathers',posture:'same posture',manifestation:'more ornament'});assert.throws(()=>E.validateSpecies(raw,original),/structural axes/);
 raw.formPlans=structuredClone(original.design.formPlans);raw.formPlans[1].bodyPlan='unplanned';assert.throws(()=>E.validateSpecies(raw,original),/Unplanned/);
});
test('planned body-plan transitions survive independent per-Form anatomy inspection',()=>{
 let sp;for(let n=0;n<100;n++){sp=E.makeSpecies('planned-transition-'+n,'Plant','Fey');if(new Set(sp.design.formPlans.map(p=>p.anatomy.bodyPlan)).size>1)break;}
 assert.ok(new Set(sp.design.formPlans.map(p=>p.anatomy.bodyPlan)).size>1);
 const observations=sp.design.formPlans.map(p=>({...positive,base:sp.base,alter:sp.alter,bodyPlan:p.anatomy.bodyPlan,traits:p.anatomy.traits,limbs:p.anatomy.limbs,manipulators:p.anatomy.manipulators}));
 applyLineageObservations(sp,observations);assert.equal(sp.formAnatomy[1].bodyPlan,sp.design.formPlans[1].anatomy.bodyPlan);
});
test('semantic checks fail closed on missing confidence, weak readability, personhood and family progression',()=>{
 const sp=E.makeSpecies('semantic-policy','Ooze','Celestial');assert.doesNotThrow(()=>G.assertGenerationObservation(sp,positive));
 for(const key of ['personhoodVisible','anatomySound','plannedSurrealism','typeIntegration','domainIntegration'])assert.throws(()=>G.assertGenerationObservation(sp,{...positive,[key]:false}));
 assert.throws(()=>G.assertGenerationObservation(sp,{...positive,quality:{...positive.quality,readability:.4}}));
 const good={confidence:.95,familyContinuity:true,structuralProgression:true,originalIdentity:true};assert.doesNotThrow(()=>G.assertLineageReview(good));assert.throws(()=>G.assertLineageReview({...good,confidence:undefined}));assert.throws(()=>G.assertLineageReview({...good,structuralProgression:false}));
});
test('renaming an existing concept cannot evade novelty checks, while repairing the same identity is allowed',()=>{
 const sp=E.makeSpecies('novelty','Beast','Fey');sp.description='An ancestral river otter carries an ivory ritual lantern through copper reeds beneath a drifting storm.';
 const peer={...structuredClone(sp),id:'different-id',forms:['Other','Renamed','Different']};assert.throws(()=>G.assertNovelGeneration(sp,[peer]),/too similar/);assert.doesNotThrow(()=>G.assertNovelGeneration(sp,[sp]));
});
test('old saved species retain combat data and individual progression through generation upgrades',()=>{
 const sp=E.makeSpecies('generation-legacy','Beast','Fey');delete sp.generationRevision;delete sp.generationProfile;delete sp.design;
 const u=E.heal(E.makeIndividual(sp,25,1,E.rng('legacy-ind')),sp);u.evs.might=64;u.moveCooldowns={x:12345};u.bond=77;const before=JSON.stringify({u,stats:E.stats(u,sp),bases:[sp.health,sp.might,sp.energyPower,sp.defense,sp.resistance,sp.speed]});
 E.migrateSpecies(sp);assert.equal(JSON.stringify({u,stats:E.stats(u,sp),bases:[sp.health,sp.might,sp.energyPower,sp.defense,sp.resistance,sp.speed]}),before);
});
test('six review lineages provide eighteen packaged Forms without entering the General roster',()=>{
 assert.equal(GENERATION_REVIEW.length,6);for(const row of GENERATION_REVIEW){assert.equal(row.forms.length,3);assert.equal(row.formDescriptions.length,3);assert.ok(!ROSTER.some(s=>s.id===row.id));const bytes=readFileSync(new URL('../'+row.atlas,import.meta.url));assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.readUIntLE(24,3)+1,768);assert.equal(bytes.readUIntLE(27,3)+1,256);}
});
test('image generation parameters stay bounded and support controlled model settings',()=>{
 assert.deepEqual(G.imageGenerationParameters(),{width:768,height:768,steps:28,cfg_scale:6,sampler_name:'Euler a'});const p=G.imageGenerationParameters({size:9000,steps:1000,guidance:100,sampler:'unsupported'});assert.equal(p.width,1024);assert.equal(p.steps,45);assert.equal(p.cfg_scale,8);assert.equal(p.sampler_name,'Euler a');
});
