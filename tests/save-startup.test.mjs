import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../app.mjs',import.meta.url),'utf8'),code=source.slice(source.indexOf('function openDB()'),source.indexOf('function dbPut('));
function harness(){
 const timers=[],requests=[],phases=[];let closed=0;
 const db={close(){closed++;},transaction(){const tx={objectStore:()=>({get:()=>{const r={tx};requests.push(r);return r;},getAll:()=>{const r={tx};requests.push(r);return r;}})};return tx;}};
 const context=vm.createContext({db,DB_NAME:'existing-save',indexedDB:{open(name,version){const req={name,version};requests.push(req);return req;}},startupStatus:message=>phases.push(message),setTimeout(fn){const timer={fn};timers.push(timer);return timer;},clearTimeout(timer){timer.cleared=true;}});
 vm.runInContext(code,context);return{context,requests,timers,phases,closed:()=>closed,call:expression=>vm.runInContext(expression,context)};
}
test('blocked save storage times out and closes a late connection without touching the save',async()=>{
 const h=harness(),promise=h.call('openDB()'),failure=assert.rejects(promise,/storage did not respond/);h.requests[0].onblocked();assert.match(h.phases[0],/another Spirimon tab/);h.timers[0].fn();await failure;h.requests[0].result=h.context.db;h.requests[0].onsuccess();assert.equal(h.closed(),1);
});
test('successful open cancels its deadline and uses the original save database',async()=>{
 const h=harness(),promise=h.call('openDB()');assert.equal(h.requests[0].name,'existing-save');h.requests[0].result=h.context.db;h.requests[0].onsuccess();assert.equal(await promise,h.context.db);assert.equal(h.timers[0].cleared,true);
});
test('stalled main-save reads reject instead of returning an empty new game',async()=>{
 const h=harness(),promise=h.call("dbGet('saves','main')"),failure=assert.rejects(promise,/saved journey timed out/);h.timers[0].fn();await failure;h.requests[0].result=undefined;h.requests[0].onsuccess();
});
test('aborted library reads fail startup instead of silently dropping stored Spirimon',async()=>{
 const h=harness(),promise=h.call("dbAll('library')"),failure=assert.rejects(promise,/read was interrupted/);h.requests[0].tx.onabort();await failure;assert.equal(h.timers[0].cleared,true);
});
test('successful reads preserve the stored data and cancel their deadlines',async()=>{
 const h=harness(),promise=h.call("dbGet('saves','main')"),save={seed:'original',spirits:[{id:'bond'}]};h.requests[0].result=save;h.requests[0].onsuccess();assert.equal(await promise,save);assert.equal(h.timers[0].cleared,true);
});
