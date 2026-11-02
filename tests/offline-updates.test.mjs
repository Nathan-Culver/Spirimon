import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../service-worker.js',import.meta.url),'utf8');
function harness({offline=false,cached=null}={}){
 const handlers={},calls=[],stored=[],preloaded=[];const response={ok:true,clone(){return this;},version:'current'};
 const cache={async match(){return cached;},async put(request,value){stored.push([request,value]);},async addAll(requests){preloaded.push(...requests);}};
 class WorkerRequest{constructor(url,options){this.url=new URL(url,'https://nathan-culver.github.io/Spirimon/').href;Object.assign(this,options);}}
 vm.runInNewContext(source,{URL,Request:WorkerRequest,caches:{open:async()=>cache,keys:async()=>[],delete:async()=>true},self:{location:{origin:'https://nathan-culver.github.io'},addEventListener:(name,fn)=>handlers[name]=fn,skipWaiting:()=>{},clients:{claim:()=>{}}},fetch:async(request,options)=>{calls.push([request,options]);if(offline)throw Error('offline');return response;}});
 return {calls,stored,preloaded,response,async install(){let promise;handlers.install({waitUntil:p=>promise=p});await promise;},async request(path,mode='navigate'){let result;handlers.fetch({request:{method:'GET',url:'https://nathan-culver.github.io/Spirimon/'+path,mode},respondWith:p=>result=p});return await result;}};
}
test('online navigation bypasses the HTTP cache even when an older offline HTML copy exists',async()=>{const h=harness({cached:{version:'old'}}),response=await h.request('');assert.equal(response.version,'current');assert.equal(h.calls[0][1].cache,'no-store');assert.equal(h.stored.length,1);});
test('offline navigation keeps the saved HTML fallback and immutable game bundles remain cacheable',async()=>{const fallback={version:'offline'};const offline=harness({offline:true,cached:fallback});assert.equal(await offline.request(''),fallback);const immutable=harness({cached:fallback});assert.equal(await immutable.request('game-0123456789ab.js','cors'),fallback);assert.equal(immutable.calls.length,0);});
test('worker installation refreshes core HTML instead of populating the new cache from stale HTTP responses',async()=>{const h=harness();await h.install();assert.equal(h.preloaded.length,4);assert.ok(h.preloaded.every(r=>r.cache==='reload'));});
