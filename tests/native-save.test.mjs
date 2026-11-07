import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import storeModule from '../desktop/save-store.cjs';
import * as E from '../engine.mjs';
import {readNativeJourney} from '../native-save.mjs';
const {createSaveStore}=storeModule;
function payload(seed='native-progress'){return {format:'spirimon-backup',version:1,save:E.newGame(seed),library:[]};}
test('desktop folder choice and progress survive restart independently of browser storage',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'spirimon-native-'));try{
  const folder=path.join(dir,'chosen');await mkdir(folder);const config=path.join(dir,'prefs','save-folder.json'),store=createSaveStore(config);
  assert.equal((await store.status()).linked,false);await store.choose(folder);const data=payload();data.save.wins=12;
  await store.write({text:JSON.stringify(data)});const restarted=createSaveStore(config),result=await readNativeJourney(restarted);
  assert.equal(result.payload.save.wins,12);assert.equal(result.payload.save.seed,'native-progress');assert.equal((await restarted.status()).linked,true);
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('interrupted or damaged primary files recover the previous complete native save',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'spirimon-recover-'));try{
  const store=createSaveStore(path.join(dir,'config.json'));await store.choose(dir);await store.write({text:JSON.stringify(payload('previous'))});await store.write({text:JSON.stringify(payload('latest'))});
  await writeFile(path.join(dir,'spirimon-save.json'),'{incomplete');const recovered=await readNativeJourney(store);assert.equal(recovered.payload.save.seed,'previous');assert.equal(recovered.source,'backup');
  await store.write({text:JSON.stringify(recovered.payload)});assert.equal(JSON.parse(await readFile(path.join(dir,'spirimon-save.previous.json'),'utf8')).save.seed,'previous');
  assert.equal((await readNativeJourney(store)).payload.save.seed,'previous');
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('native saves can boot when IndexedDB is unavailable',async()=>{
 const source=readFileSync(new URL('../app.mjs',import.meta.url),'utf8'),start=source.indexOf('async function loadInitialJourney('),end=source.indexOf('\nwindow.spirimonReconnectSave=',start);
 const native={status:async()=>({linked:true}),read:async()=>({exists:true,text:JSON.stringify(payload('file-only'))})};
 const h=vm.createContext({window:{},nativeSaveAPI:()=>native,readNativeJourney,openDB:async()=>{throw Error('Browser storage unavailable');},nativeSaveLinked:false,db:undefined});
 vm.runInContext(source.slice(start,end),h);const initial=await h.loadInitialJourney();assert.equal(initial.save.seed,'file-only');assert.equal(h.db,null);
});
test('native writes reject invalid payloads before touching an existing journey',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'spirimon-invalid-'));try{
  const store=createSaveStore(path.join(dir,'config.json'));await store.choose(dir);await store.write({text:JSON.stringify(payload())});await assert.rejects(store.write({text:'{"format":"other"}'}),/Invalid/);assert.equal((await readNativeJourney(store)).payload.save.seed,'native-progress');
 }finally{await rm(dir,{recursive:true,force:true});}
});
