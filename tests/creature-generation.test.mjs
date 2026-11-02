import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../engine.mjs';
import {ANATOMY_CATALOG,MODIFIER_CATALOG} from '../creature-catalog.mjs';
import {buildDesign,assignDomains,anatomyRecord,applyVisualObservation,applyLineageObservations,individualSpecies,capabilitiesFromAnatomy,migrateSaveCreatures,syncCapabilities} from '../anatomy.mjs';
import {renderCreaturePixels,validateLineageImages,removeWhiteBackground,visualMetrics,certifyRenderedAnatomy} from '../creature-visuals.mjs';
import {encodePNG,decodePNG} from '../creature-png.mjs';
import {moveFitsAnatomy,validateGeneratedMoves,generatedMoveBudget} from '../moves.mjs';
import {canEquipHeldItem,heldEquipment,generateHeldItem} from '../equipment.mjs';
import {ROSTER} from '../roster.mjs';

test('all twelve type catalogs are populated and animal references have no mass cutoff',()=>{
 assert.equal(E.TYPES.length,12);assert.ok(!E.TYPES.includes('Humanoid'));assert.ok(ANATOMY_CATALOG.Beast.length>450);
 for(const type of E.TYPES){assert.ok(ANATOMY_CATALOG[type].length>=12,type);assert.ok(MODIFIER_CATALOG[type].length>=4,type);assert.equal(new Set(ANATOMY_CATALOG[type].map(r=>r.id)).size,ANATOMY_CATALOG[type].length);}
 assert.ok(ANATOMY_CATALOG.Beast.some(r=>r.name==='hummingbird'));assert.ok(ANATOMY_CATALOG.Beast.some(r=>r.name==='blue whale'));
 for(const row of ROSTER){assert.ok(E.TYPES.includes(row.base)&&E.TYPES.includes(row.alter));assert.notEqual(row.base,row.alter);assert.ok(row.domains.length>=1);}
});
test('all 132 ordered pairs deterministically create distinct forms, appropriate Domains and usable anatomical learnsets',()=>{
 let checked=0;for(const base of E.TYPES)for(const alter of E.TYPES)if(base!==alter){
 const sp=E.makeSpecies('pairs-'+base+alter,base,alter),again=E.makeSpecies('pairs-'+base+alter,base,alter);assert.deepEqual(sp,again);
 assert.equal(new Set(sp.forms).size,3);assert.ok(sp.domains.length>=1);assert.equal(new Set(sp.domains).size,sp.domains.length);
 assert.equal(sp.moves.length,4);assert.equal(new Set(sp.moves.map(m=>m.id)).size,4);assert.ok(sp.moves.every(m=>moveFitsAnatomy(m,sp.anatomy)));assert.ok(sp.moves.every(m=>sp.learnset.some(p=>p.id===m.id)));
 assert.equal(sp.design.reference.type,base);assert.equal(sp.design.modifier.type,alter);
 const valid=validateLineageImages([0,1,2].map(n=>renderCreaturePixels(sp,n)));assert.equal(valid.report.metrics.length,3);checked++;
 }assert.equal(checked,132);
});
test('one baseline Domain is followed by repeated independent 1% checks without duplicates or reload rerolls',()=>{
 const sp={id:'fire-creature',base:'Elemental',description:'A living flame with ember vents.',domains:[]};const rolls=[.005,.1,.006,.2,.9];assignDomains(sp,()=>rolls.shift());assert.equal(sp.domains.length,3);assert.equal(new Set(sp.domains).size,3);const before=[...sp.domains];assignDomains(sp,()=>0);assert.deepEqual(sp.domains,before);
 const noExtra={base:'Plant',description:'A carnivorous root snare.',domains:[]};assignDomains(noExtra,()=>.01);assert.equal(noExtra.domains.length,1);
});
test('all assigned Domains survive migration; old empty species gain one without changing identity or stats',()=>{
 const sp=E.makeSpecies('legacy','Beast','Construct',[]);delete sp.domainRevision;sp.domains=[];const old={id:sp.id,forms:sp.forms,power:sp.power,health:sp.health,speed:sp.speed,moves:structuredClone(sp.moves)};E.migrateSpecies(sp);assert.ok(sp.domains.length);for(const [k,v]of Object.entries(old))assert.deepEqual(sp[k],v);const once=structuredClone(sp);E.migrateSpecies(sp);assert.deepEqual(sp,once);
});
test('anatomical equipment benefits require visual evidence rather than the deleted type or a description',()=>{
 const a=anatomyRecord('biped',['hands'],{source:'legacy-concept',confidence:.5});const sp={base:'Construct',alter:'Fey',anatomy:a,domains:['Metal']};syncCapabilities(sp);
 const item=generateHeldItem('blade',{templateId:'sabre'});assert.equal(canEquipHeldItem(item,sp).ok,false);certifyRenderedAnatomy(sp);assert.equal(sp.capabilities.humanoid,true);assert.equal(canEquipHeldItem(item,sp).ok,true);
 sp.anatomy=anatomyRecord('biped',['feathers'],{source:'image-analysis',confidence:.95});syncCapabilities(sp);assert.equal(sp.capabilities.humanoid,true);assert.equal(sp.capabilities.equipment.available,false);assert.equal(canEquipHeldItem(item,sp).ok,false);
});
test('structured capabilities support natural and supernatural alternatives without type or name shortcuts',()=>{
 const claws=capabilitiesFromAnatomy(anatomyRecord('quadruped',['claws','dig'],{source:'procedural-render',confidence:1}),[]);assert.equal(claws.cleave.available,true);assert.equal(claws.dig.available,true);assert.equal(claws.push.available,false);
 const psychic=capabilitiesFromAnatomy(anatomyRecord('amorphous',['gel'],{source:'procedural-render',confidence:1}),['Psionic']);assert.equal(psychic.push.method,'telekinesis');assert.equal(psychic.crush.available,true);assert.equal(psychic.teleport.available,true);
});
test('visual observations must match ordered types, body plan, transformation, reference and nonhuman status',()=>{
 const sp=E.makeSpecies('observed','Construct','Plant'),observation={base:sp.base,alter:sp.alter,bodyPlan:sp.anatomy.bodyPlan,traits:sp.anatomy.traits,manipulators:sp.anatomy.manipulators,confidence:.95,referenceConfidence:.95,nonhuman:true};
 applyVisualObservation(sp,observation);assert.equal(sp.anatomy.source,'image-analysis');assert.equal(sp.capabilities.verified,true);
 for(const bad of [{confidence:.5},{base:'Beast'},{bodyPlan:'aquatic'},{nonhuman:false},{referenceConfidence:.5},{traits:['fur']}])assert.throws(()=>applyVisualObservation(sp,{...observation,...bad}));
});
test('AI can change supported mechanics but cannot exceed budgets or add unsupported behavior',()=>{
 const sp=E.makeSpecies('moves','Construct','Plant');const proposals=sp.moves.map(()=>({name:'Resonant Pulse',power:50,speed:5,accuracy:.9,kind:'spiritual',effect:'slow',target:'opponent'}));
 const accepted=validateGeneratedMoves(proposals,sp);assert.ok(accepted.report.every(r=>r.status==='accepted'));assert.ok(accepted.moves.every(m=>m.power===50&&m.baseUses>0&&generatedMoveBudget(m)<=120));
 const validated=E.validateSpecies({forms:['First','Second','Third'],description:'A distinct creature.',moves:proposals},sp);assert.equal(validated.power,sp.power);assert.equal(validated.base,sp.base);for(const m of validated.moves)assert.deepEqual(validated.learnset.find(p=>p.id===m.id),m);
 for(const change of [{power:100,effect:'doubleHit'},{effect:'executeCode'},{speed:99},{power:0,effect:'heal',target:'opponent'},{accuracy:NaN}]){const bad=validateGeneratedMoves([{...proposals[0],...change}],sp);assert.equal(bad.report[0].status,'fallback');assert.deepEqual(bad.moves[0],sp.moves[0]);}
 assert.throws(()=>E.validateSpecies({forms:['Same','Same','Third'],description:'test'},sp));
});
test('physical move anatomy requirements are enforced but energy manifestations remain possible',()=>{
 const anatomy=anatomyRecord('amorphous',['gel']);assert.equal(moveFitsAnatomy({name:'Raking Claw',kind:'physical'},anatomy),false);assert.equal(moveFitsAnatomy({name:'Spectral Claw',kind:'spiritual'},anatomy),true);
});
test('PNG round trips preserve alpha and colors; corrupt or oversized data is rejected',()=>{
 const image=renderCreaturePixels(E.makeSpecies('png','Beast','Fey'),1),encoded=encodePNG(image),decoded=decodePNG(encoded);assert.deepEqual(decoded.data,image.data);assert.equal(decoded.width,image.width);const broken=Buffer.from(encoded);broken[40]^=1;assert.throws(()=>decodePNG(broken));assert.throws(()=>decodePNG('not png'));
});
test('background removal is border-connected and preserves enclosed white creature markings',()=>{
 const width=32,height=32,data=new Uint8ClampedArray(width*height*4).fill(255);for(let y=8;y<24;y++)for(let x=8;x<24;x++){const n=(y*width+x)*4;data.set([40,90,150,255],n);}data.set([255,255,255,255],(16*width+16)*4);
 const cleaned=removeWhiteBackground({width,height,data});assert.equal(cleaned.data[3],0);assert.equal(cleaned.data[(16*width+16)*4+3],255);assert.equal(data[3],255);
});
test('framing, distinct evolution images and duplicate lineages are enforced',()=>{
 const sp=E.makeSpecies('image-gates','Giant','Construct'),images=[0,1,2].map(n=>renderCreaturePixels(sp,n)),valid=validateLineageImages(images);assert.throws(()=>validateLineageImages([images[0],images[0],images[0]]),/distinct/);
 assert.throws(()=>validateLineageImages(images,{existing:[{visualValidation:valid.report}]}),/duplicates/);
 const clipped=structuredClone(images[0]);for(let x=0;x<clipped.width;x++)clipped.data.set([10,10,10,255],x*4);assert.throws(()=>validateLineageImages([clipped,...images.slice(1)]),/cropped/);
 const empty={width:32,height:32,data:new Uint8ClampedArray(4096)};assert.throws(()=>validateLineageImages([empty,empty,empty]),/empty/);assert.equal(visualMetrics(images[0]).bounds.length,4);
});
test('legacy Humanoid migration preserves owned and wild individuals, equipment, progress and learned moves',()=>{
 const old=E.makeSpecies('saved','Beast','Fey');old.base='Humanoid';old.alter='Plant';old.description='A nonhuman moth-headed biped with four grasping hands.';old.moves[0].type='Humanoid';delete old.taxonomyRevision;delete old.anatomy;delete old.capabilities;
 const item=generateHeldItem('saved-sabre',{templateId:'sabre'});item.requires={types:['Humanoid']};item.active.type='Humanoid';
 const ind={id:'owned',species:old.id,level:42,xp:123,bond:77,form:2,appearance:1,ivs:{hp:31},evs:{might:120},moveIds:['humanoid-1','beast-2'],unlockedMoves:['humanoid-7'],heldItem:item,hp:10};
 const save={species:{[old.id]:old},spirits:[ind],roamers:{'0,0':[{id:'wild',ind:{...ind,id:'wild',heldItem:null}}]},inventory:{coins:999},rank:5},before=structuredClone(save);
 migrateSaveCreatures(save);assert.ok(E.TYPES.includes(old.base)&&E.TYPES.includes(old.alter));assert.ok(old.domains.length);assert.equal(old.moves[0].type,old.base);assert.ok(heldEquipment(ind,old));assert.equal(canEquipHeldItem(item,old).ok,false);
 for(const key of ['id','species','level','xp','bond','form','appearance','ivs','evs','moveIds','unlockedMoves','hp'])assert.deepEqual(ind[key],before.spirits[0][key]);assert.deepEqual(save.inventory,before.inventory);assert.equal(save.roamers['0,0'][0].ind.species,old.id);
 const once=structuredClone(save);migrateSaveCreatures(save);assert.deepEqual(save,once);
});

test('verified per-form anatomy grants equipment benefits only to the appropriate permanent form',()=>{
 const sp=E.makeSpecies('per-form','Construct','Plant'),traits=[...new Set([...sp.anatomy.traits,'hands'])];
 const observed={base:sp.base,alter:sp.alter,bodyPlan:sp.anatomy.bodyPlan,traits,limbs:{...sp.anatomy.limbs,arms:2},manipulators:2,confidence:.95,referenceConfidence:.95,nonhuman:true};
 const juvenile={...observed,traits:traits.filter(t=>t!=='hands'&&t!=='grasp'&&t!=='tentacles'),limbs:{...observed.limbs,arms:0},manipulators:0};
 applyLineageObservations(sp,[juvenile,observed,observed]);
 assert.equal(individualSpecies(sp,{form:0,appearance:2}).capabilities.equipment.available,false);
 assert.equal(individualSpecies(sp,{form:2,appearance:0}).capabilities.equipment.available,true);
});
