import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import * as E from '../engine.mjs';
const source=readFileSync(new URL('../app.mjs',import.meta.url),'utf8');
const extract=name=>{const start=source.search(new RegExp('(?:async )?function '+name+'\\(')),end=source.slice(start+1).search(/\n(?:async )?function /);return source.slice(start,end<0?source.length:start+1+end);};
function harness({enabled=true,route={type:'companion',status:{imageReady:true,models:['text'],visionModels:['vision']}},data={forms:['Different','Unrelated','Other'],description:'Wrong replacement description',moves:[],sprites:['a','b','c'],visualValidation:{status:'vision-verified'}}}={}){
 const sp=E.makeSpecies('owned-artwork','Beast','Elemental');sp.forms=['Talonflowkit','Talonflow','Talonflow Regent'];sp.sprites=['diagram-a','diagram-b','diagram-c'];sp.visualValidation={status:'procedural-verified'};
 const ind=E.makeIndividual(sp,7);ind.xp=19;ind.bond=62;ind.heldItem={id:'keepsake'};
 const state={species:{[sp.id]:sp},spirits:[ind],settings:{aiEnabled:enabled},generationPlans:{},seed:'artwork'};
 let calls=0,accepted=0,chosen=0;const messages=[],requests=[];
 const h=vm.createContext({E,s:state,library:{[sp.id]:sp},queue:[],busy:false,activeGenerationId:null,aiSessionKey:'',COMPANION:'http://127.0.0.1:4317',structuredClone,AbortSignal,Date,console,modal:null,globalThis:{},document:{querySelectorAll:()=>[]},esc:String,
 save:()=>calls++,note:text=>messages.push(text),toast:text=>messages.push(text),AI:{choose:async()=>{chosen++;return route;}},
 fetch:async(_url,options)=>{requests.push(JSON.parse(options.body));return {ok:true,json:async()=>data};},
 acceptGeneratedArtwork:async(target,result,existing)=>{accepted++;assert.ok(existing.every(p=>p.id!==target.id));target.sprites=[...result.sprites];target.proceduralArt=false;target.visualValidation=result.visualValidation;},
 register:next=>{state.species[next.id]=next;h.library[next.id]=next;return next;}});
 vm.runInContext(['hasFinishedArtwork','artworkStatusText','artworkStatusHTML','refreshArtworkStatus','queueOwnedArtwork','queueFresh','processQueue'].map(extract).join('\n'),h);
 return {h,sp,ind,state,requests,messages,run:()=>vm.runInContext('processQueue()',h),eval:code=>vm.runInContext(code,h),accepted:()=>accepted,chosen:()=>chosen};
}
test('a missing-art prototype queues its own species ID and design, without inventing another lineage',()=>{
 const t=harness();t.eval('queueFresh(null,Math.random,false,s.species[Object.keys(s.species)[0]])');
 assert.deepEqual(Array.from(t.h.queue),[t.sp.id]);assert.deepEqual(t.state.generationPlans[t.sp.id],t.sp);
 t.eval('queueFresh(null,Math.random,true,s.species[Object.keys(s.species)[0]])');assert.equal(t.h.queue.length,1);
});
test('owned artwork repairs preserve species identity, names, moves, stats and every individual',async()=>{
 const t=harness(),before=structuredClone(t.sp),unit=structuredClone(t.ind);await t.run();
 assert.equal(t.requests.length,1);assert.equal(t.requests[0].species.id,t.sp.id);assert.equal(t.accepted(),1);
 const after=t.state.species[t.sp.id];for(const key of ['id','seed','forms','description','design','moves','learnset','power','health','speed','ability','domains'])assert.deepEqual(after[key],before[key],key);
 assert.deepEqual(t.ind,unit);assert.deepEqual(Object.keys(t.state.species),[t.sp.id]);assert.equal(t.h.queue.length,0);assert.equal(after.artworkJob.state,'ready');assert.equal(t.eval('hasFinishedArtwork(s.species[Object.keys(s.species)[0]])'),true);
});
test('text-only and offline fallback cannot claim an owned Spirimon has finished artwork',async()=>{
 for(const route of [{type:'procedural',status:{models:['built-in']}},{type:'ollama',status:{models:['text']}},{type:'companion',status:{models:['text'],imageReady:false,visionModels:['vision']}},{type:'companion',status:{models:['text'],imageReady:true,visionModels:[]}}]){
  const t=harness({route});await t.run();assert.equal(t.accepted(),0);assert.equal(t.requests.length,0);assert.equal(t.sp.proceduralArt,true);assert.equal(t.sp.artworkJob.state,'unavailable');assert.match(t.sp.artworkJob.message,/image companion and a vision model/);assert.equal(t.h.queue[0],t.sp.id);
  assert.ok(t.sp.artworkJob.retryAfter>Date.now());await t.run();assert.equal(t.chosen(),1,'blocked providers must not retry every five seconds');assert.ok(!t.messages.some(m=>/artwork is ready|completed for/i.test(m)));
 }
});
test('a companion procedural fallback leaves owned artwork pending, rather than reporting completion',async()=>{
 const t=harness({data:{visualValidation:{status:'procedural-verified',reason:'Image validation failed'}}});await t.run();assert.equal(t.accepted(),0);assert.equal(t.sp.proceduralArt,true);assert.match(t.sp.artworkJob.message,/Image validation failed/);assert.equal(t.h.queue[0],t.sp.id);
});
test('existing owned lineages take priority over a full queue of future discoveries',async()=>{
 const t=harness();t.h.queue.push('future-a','future-b','future-c');await t.run();assert.equal(t.requests[0].species.id,t.sp.id);assert.deepEqual(Array.from(t.h.queue),['future-a','future-b','future-c']);
});
test('disabled generation reports missing images honestly and performs no background work',async()=>{
 const t=harness({enabled:false});assert.match(t.eval('artworkStatusText(s.species[Object.keys(s.species)[0]])'),/no finished images.*Waiting will not load/);await t.run();assert.equal(t.chosen(),0);assert.equal(t.h.queue.length,0);
});
test('finished roster and generated artwork are not requeued for repair',async()=>{
 const t=harness();t.sp.atlas='./assets/roster/talonplume-v4.webp';await t.run();assert.equal(t.requests.length,0);assert.equal(t.h.queue.length,0);assert.equal(t.eval('artworkStatusText(s.species[Object.keys(s.species)[0]])'),'');
});
