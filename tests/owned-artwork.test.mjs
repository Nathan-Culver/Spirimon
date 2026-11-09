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
 const h=vm.createContext({E,s:state,battle:null,library:{[sp.id]:sp},queue:[],busy:false,activeGenerationId:null,aiSessionKey:'',aiCompanionToken:'',COMPANION:'http://127.0.0.1:4317',structuredClone,AbortSignal,AbortController,artworkAbort:null,Date,console,modal:null,globalThis:{},document:{querySelectorAll:()=>[]},esc:String,
 currentCompanionToken:()=>'',save:()=>calls++,note:text=>messages.push(text),toast:text=>messages.push(text),AI:{choose:async()=>{chosen++;return route;},companionRequest:async(_settings,_path,options)=>{requests.push(options.body);return data;}},
 fetch:async(_url,options)=>{requests.push(JSON.parse(options.body));return {ok:true,json:async()=>data};},
 acceptGeneratedArtwork:async(target,result,existing)=>{accepted++;assert.ok(existing.every(p=>p.id!==target.id));target.sprites=[...result.sprites];target.proceduralArt=false;target.visualValidation=result.visualValidation;},
 register:next=>{state.species[next.id]=next;h.library[next.id]=next;return next;}});
 vm.runInContext(['hasFinishedArtwork','artworkStatusText','artworkStatusHTML','refreshArtworkStatus','queueOwnedArtwork','queueFresh','cancelArtworkGeneration','resumeArtworkGeneration','processQueue'].map(extract).join('\n'),h);
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

test('unfinished battle, trade and roaming Spirimon are also queued for their own artwork',()=>{
 const t=harness();t.state.spirits=[];const refs=['enemy','trade','roamer'].map(seed=>E.makeSpecies(seed,'Beast','Fey'));
 for(const sp of refs){t.state.species[sp.id]=sp;t.h.library[sp.id]=sp;}
 t.h.battle={enemy:{species:refs[0].id}};t.state.trade={incoming:{species:refs[1].id}};t.state.roamers={'0,0':[{active:true,ind:{species:refs[2].id}}]};t.eval('queueOwnedArtwork()');
 assert.deepEqual(Array.from(t.h.queue),refs.map(sp=>sp.id));
});
test('canceling a job on save/world change prevents late results from changing the new world',async()=>{
 const t=harness();let resolve;t.h.AI.choose=()=>new Promise(r=>resolve=r);const job=t.run();assert.equal(t.h.busy,true);
 t.eval('cancelArtworkGeneration()');const next=E.newGame('other-world');t.h.s=next;t.h.queue=['new-world-job'];resolve({type:'companion',status:{imageReady:true,models:['text'],visionModels:['vision']}});await job;
 assert.equal(t.requests.length,0);assert.equal(t.h.busy,false);assert.deepEqual(Object.keys(next.species),[]);assert.deepEqual(Array.from(t.h.queue),['new-world-job']);
});
test('unseen future designs remain queued for artwork after a text-only fallback',()=>{
 const t=harness();t.state.spirits=[];const sp=E.makeSpecies('future-text-design','Plant','Fey');t.h.library[sp.id]=sp;t.eval('queueOwnedArtwork()');assert.ok(t.h.queue.includes(sp.id));assert.deepEqual(t.state.generationPlans[sp.id],sp);
});
test('referenced artwork repairs cannot be starved by a full queue of future designs',()=>{
 const t=harness();t.h.queue.push('future-a','future-b','future-c');const sp=E.makeSpecies('battle-pending','Plant','Fey');t.state.species[sp.id]=sp;t.h.library[sp.id]=sp;t.h.battle={enemy:{species:sp.id}};t.eval('queueOwnedArtwork()');assert.equal(t.h.queue[0],t.sp.id);assert.equal(t.h.queue[1],sp.id);
});

test('OpenAI repairs use the same identity-preserving artwork path as the local companion',async()=>{
 const t=harness({route:{type:'openai',status:{imageReady:true,models:['text'],visionModels:['vision']}}}),before=structuredClone(t.ind);await t.run();assert.equal(t.accepted(),1);assert.equal(t.requests[0].repair,true);assert.equal(t.requests[0].species.id,t.sp.id);assert.deepEqual(t.ind,before);
});
test('paid API failures stay paused until an explicit retry, instead of spending again every minute',async()=>{
 const t=harness({route:{type:'openai',status:{imageReady:true,models:['text'],visionModels:['vision']}}});let attempts=0;t.h.AI.companionRequest=async()=>{attempts++;throw Object.assign(Error('API quota exhausted'),{retryable:false});};await t.run();assert.equal(t.sp.artworkJob.paused,true);t.sp.artworkJob.retryAfter=0;await t.run();assert.equal(attempts,1);assert.match(t.sp.artworkJob.message,/quota/);
});

test('a fresh OpenAI lineage uses the full image provider rather than the text-only adapter',async()=>{
 const t=harness({route:{type:'openai',status:{imageReady:true,models:['text'],visionModels:['vision']}}});t.state.spirits=[];delete t.state.species[t.sp.id];delete t.h.library[t.sp.id];t.state.generationPlans[t.sp.id]=t.sp;t.h.queue.push(t.sp.id);await t.run();assert.equal(t.requests.length,1);assert.equal(t.accepted(),1);assert.ok(t.messages.some(message=>/complete lineage is ready/.test(message)));
});
test('explicit retry clears paused flags across saved and library references before retrying',async()=>{
 const t=harness({route:{type:'openai',status:{imageReady:true,models:['text'],visionModels:['vision']}}});t.sp.artworkJob={paused:true,retryAfter:Date.now()+60000};t.state.generationPlans[t.sp.id]=structuredClone(t.sp);t.h.queue.push(t.sp.id);await t.eval('resumeArtworkGeneration()');assert.equal(t.requests.length,1);assert.equal(t.accepted(),1);
});
test('disabling generation preserves the pending job and discards a late response',async()=>{
 const t=harness();let resolve;t.h.AI.choose=()=>new Promise(r=>resolve=r);const pending=t.run();t.eval('cancelArtworkGeneration({requeue:true})');assert.deepEqual(Array.from(t.h.queue),[t.sp.id]);resolve({type:'openai',status:{imageReady:true,models:['text'],visionModels:['vision']}});await pending;assert.equal(t.requests.length,0);assert.equal(t.accepted(),0);
});
