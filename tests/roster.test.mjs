import {GENERATION_REFERENCES} from '../generation-references.mjs';
import * as TUTORIAL from '../tutorials.mjs';
import {restoreDomainRegistry,discoverCustomDomain} from '../domains.mjs';
import {enemySpeech} from '../npc-dialogue.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {ROSTER} from '../roster.mjs';
import {TYPES,makeSpecies} from '../engine.mjs';
test('expanded roster has 150 unique Spirimon and three named forms each',()=>{assert.equal(ROSTER.length,150);assert.equal(new Set(ROSTER.map(r=>r.id)).size,150);assert(new Set(ROSTER.map(r=>r.base+'>'+r.alter)).size>=50);for(const r of ROSTER){assert(TYPES.includes(r.base));assert(TYPES.includes(r.alter));assert.notEqual(r.base,r.alter);assert.equal(new Set(r.forms).size,3);assert.equal(makeSpecies(r.id,r.base,r.alter,[]).moves.length,4);}});
test('all 150 roster lineages have distinct transparent strips with three 256px form cells',async()=>{
 assert.equal(ROSTER.length,150);const digests=new Set();
 for(const r of ROSTER){
  assert.ok(r.atlas,'dedicated atlas: '+r.id);assert.notEqual(r.proceduralArt,true,r.id);
  const b=await readFile(new URL('../'+r.atlas,import.meta.url));assert.equal(b.toString('ascii',0,4),'RIFF',r.id);assert.equal(b.toString('ascii',8,12),'WEBP',r.id);
  if(b.toString('ascii',12,16)==='VP8L'){
   assert.equal(b[20],0x2f,r.id);const bits=b.readUInt32LE(21);assert.ok(bits&0x10000000,'lossless alpha: '+r.id);assert.equal((bits&0x3fff)+1,768,r.id);assert.equal(((bits>>>14)&0x3fff)+1,256,r.id);
  }else{assert.equal(b.toString('ascii',12,16),'VP8X',r.id);assert.ok(b[20]&16,'alpha channel: '+r.id);assert.equal(b.readUIntLE(24,3)+1,768,r.id);assert.equal(b.readUIntLE(27,3)+1,256,r.id);}
  const digest=createHash('sha256').update(b).digest('hex');assert.ok(!digests.has(digest),'borrowed lineage artwork: '+r.id);digests.add(digest);
 }
});


import vm from 'node:vm';
import * as E from '../engine.mjs';
import {creatureArtworkSource} from '../sprites.mjs';
import {LEGENDS} from '../legendary-roster.mjs';
test('existing journeys receive completed roster artwork without replacing individual progress',async()=>{
 const source=await readFile(new URL('../app.mjs',import.meta.url),'utf8');
 const begin=source.indexOf('function installRoster(){'),end=source.indexOf('\nfunction gameMenu',begin);
 const rows=ROSTER.filter(r=>r.artRevision>=2),state=E.newGame('art-migration'),library={};state.species={};
 for(const row of rows){const id='roster-'+row.id;state.species[id]={...E.makeSpecies(id,row.base,row.alter,row.domains),id,proceduralArt:true,sprites:['legacy-0','legacy-1','legacy-2'],artRevision:1};}
 state.species['roster-lacquertor'].atlas='./assets/roster/lacquertor.webp';
 state.spirits=rows.map((r,i)=>({id:'owned-'+i,species:'roster-'+r.id,form:i%3,level:37,hp:21,stamina:14,willpower:18,bond:23,cooldowns:{move:72},heldItem:'keepsake'}));
 const before=structuredClone(state.spirits),moves=structuredClone(state.species['roster-aetherling'].moves);
 for(const profile of LEGENDS){const id='legendary-'+profile.key;state.species[id]={...E.makeSpecies(id,profile.base,profile.alter,profile.domains),id,legendary:true,legendaryProfile:profile.key,name:profile.legacyName,forms:[profile.legacyName+' Echo',profile.legacyName+' Awakened',profile.legacyName]};}
 const context=vm.createContext({GENERATION_REFERENCES,TUTORIAL,restoreDomainRegistry,discoverCustomDomain,enemySpeech,encounterAftermath:()=>'',s:state,library,E,ROSTER,LEGENDS,structuredClone,syncCapabilities:()=>{},certifyRenderedAnatomy:()=>{},register:sp=>{state.species[sp.id]=sp;library[sp.id]=sp;}});
 vm.runInContext(source.slice(source.indexOf('function hasFinishedArtwork('),source.indexOf('\nfunction artworkStatusText('))+'\n'+source.slice(begin,end)+'\ninstallRoster();',context);
 assert.deepEqual(state.spirits.map(({difficulty,difficultySide,lastMaxHp,...u})=>u),before);assert.deepEqual(state.species['roster-aetherling'].moves,moves);
 for(const row of rows){const sp=state.species['roster-'+row.id];assert.deepEqual(Array.from(sp.forms),row.forms);assert.equal(sp.name,row.forms[1]);assert.equal(sp.atlas,row.atlas);assert.equal(sp.artRevision,row.artRevision);assert.equal(sp.proceduralArt,false);assert.equal(sp.sprites,undefined);if(row.formAnatomy)assert.deepEqual(JSON.parse(JSON.stringify(sp.formAnatomy)),row.formAnatomy);for(let form=0;form<3;form++)assert.equal(creatureArtworkSource(sp,form),row.atlas);}
 vm.runInContext('installRoster();',context);assert.deepEqual(state.spirits.map(({difficulty,difficultySide,lastMaxHp,...u})=>u),before);
 for(const profile of LEGENDS){const sp=state.species['legendary-'+profile.key];assert.equal(sp.name,profile.name);assert.deepEqual(Array.from(sp.forms),profile.forms);}
});

test('finished artwork descriptions preserve the planned canonical creature Types',async()=>{
 const production=JSON.parse(await readFile(new URL('../docs/roster-art-prompts.json',import.meta.url),'utf8'));
 for(const art of production.lineages.filter(a=>a.runtimeReady)){const row=ROSTER.find(r=>r.id===art.id);assert.equal(row.base,art.base,art.id);assert.equal(row.alter,art.alter,art.id);}
});
