import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import * as E from '../engine.mjs';
import * as A from '../adventure-systems.mjs';
import * as RT from '../realtime-combat.mjs';
import * as SE from '../spiritual-energy.mjs';
import {newSealer} from '../spiritual-core.mjs';
import {battleRewards} from '../battle-rewards.mjs';
import {decodeSavePayload,readLinkedSave,writeLinkedSave,selectStartupSave} from '../save-files.mjs';
import {regionalLegendSite} from '../legend-sites.mjs';
const source=readFileSync(new URL('../app.mjs',import.meta.url),'utf8');
const extract=name=>{const a=source.indexOf('function '+name+'('),n=source.slice(a+1).search(/\n(?:async )?function /);return source.slice(a,n<0?source.length:a+1+n);};
function payload(seed='file-journey'){
 const save=E.newGame(seed),sp=E.makeSpecies(seed,'Beast','Fey',[]),u=E.heal(E.makeIndividual(sp,3,0,E.rng(seed)),sp);save.species[sp.id]=sp;save.spirits=[u];save.party=[u.id];return {format:'spirimon-backup',version:1,save,library:[sp]};
}
function handle(data,{permission='granted',failWrite=false}={}){
 let text=typeof data==='string'?data:JSON.stringify(data),writes=0,aborts=0;
 const file={kind:'file',queryPermission:async()=>permission,getFile:async()=>({size:text.length,text:async()=>text}),createWritable:async()=>({write:async data=>{writes++;if(failWrite)throw Error('Disk full');text=data;},close:async()=>{},abort:async()=>{aborts++;}})};
 return {file,text:()=>text,writes:()=>writes,aborts:()=>aborts};
}
test('one, three and six level-20 enemies award proportional trainer XP and Coin',()=>{
 for(const n of [1,3,6]){const r=battleRewards({trainer:true,enemyRoster:Array.from({length:n},(_,i)=>({id:'foe'+i,level:20,hp:0}))},1);assert.equal(r.xp,175*n);assert.equal(r.sealerXP,110*n);assert.equal(r.coins,47*n);}
});
test('surviving reserves and duplicate references never inflate rewards; wild Coin remains zero',()=>{
 const defeated={id:'down',level:10,hp:0},alive={id:'reserve',level:90,hp:10};
 assert.deepEqual(battleRewards({enemyRoster:[defeated,defeated,alive]}),{xp:60,sealerXP:70,coins:0,defeated:1});
 assert.equal(battleRewards({trainer:true,enemyRoster:[alive]}).xp,0);
});
test('linked files are authoritative even when browser recovery contains a different journey',async()=>{
 const h=handle(payload()),browser=payload('browser-journey');let browserReads=0;
 const result=await selectStartupSave({handle:h.file,readBrowser:async()=>{browserReads++;return {save:browser.save};}});
 assert.equal(result.save.seed,'file-journey');assert.equal(result.source,'file');assert.equal(browserReads,0);assert.equal(h.writes(),0);
});
test('file loading includes its own library and does not depend on the browser library opening',async()=>{
 const h=handle(payload());const result=await selectStartupSave({handle:h.file,readBrowser:async()=>{throw Error('IndexedDB library unavailable');}});assert.equal(result.library.length,1);
});
test('corrupt and permission-blocked files open existing recovery with writing paused',async()=>{
 for(const h of [handle('{broken'),handle(payload(),{permission:'prompt'})]){
  const browser=payload('recovery');const result=await selectStartupSave({handle:h.file,browserSave:browser.save,browserLibrary:browser.library});
  assert.equal(result.source,'recovery');assert.equal(result.save.seed,'recovery');assert.equal(result.writeBlocked,true);assert.equal(h.writes(),0);
 }
});
test('a linked file failure without recovery stops loading instead of starting a new world',async()=>{
 await assert.rejects(selectStartupSave({handle:handle('{broken').file}),/JSON|property|position|Expected/);
 await assert.rejects(readLinkedSave(handle(payload(),{permission:'denied'}).file),/Reconnect/);
});
test('validation rejects missing party members and leaves the original payload unchanged',()=>{
 const data=payload();data.save.party=['missing'];const before=JSON.stringify(data);assert.throws(()=>decodeSavePayload(data),/missing/);assert.equal(JSON.stringify(data),before);
});
test('linked writes round-trip complete progress; failed writes abort without reporting success',async()=>{
 const h=handle(payload());const next=payload('new-progress');next.save.wins=14;assert.equal(await writeLinkedSave(h.file,next),true);assert.equal((await readLinkedSave(h.file)).save.wins,14);
 const failed=handle(payload(),{failWrite:true});await assert.rejects(writeLinkedSave(failed.file,next),/Disk full/);assert.equal(failed.aborts(),1);
});
test('practice offers show real cooldowns and omit the retired Speed property',()=>{
 const data=payload(),u=data.save.spirits[0],sp=data.save.species[u.species];let html='';
 const h=vm.createContext({s:data.save,E,RT,safe:()=>true,spOf:()=>sp,seconds:ms=>(ms/1000).toFixed(1)+'s',esc:String,action:(a,label)=>label,showModal:(title,body)=>html=body});
 vm.runInContext(extract('learnMenu'),h);h.learnMenu(u.id,0);assert.doesNotMatch(html,/undefined|Speed/);assert.match(html,/GCD|LCD/);assert.match(html,/CD/);
});
test('perception reveals a regional legendary presence without any shrine',()=>{
 const seed='SP-461998',cx=-7,cy=-4,point=regionalLegendSite(seed,cx,cy),sealer=newSealer();sealer.senses={perception:true};
 const h=vm.createContext({s:{seed,player:point,sealer,roamers:{},drops:[]},E,A,SE,SW:{shrinesForRegion:()=>[]},legendSite:(x,y)=>regionalLegendSite(seed,x,y),isNight:()=>true,mapWeather:()=>({kind:'rain'}),townNPCs:()=>[],npcWander:new Map(),challengerApproach:null});
 vm.runInContext(extract('spiritualDiscoveries'),h);const discoveries=h.spiritualDiscoveries();assert.ok(discoveries.some(d=>d.kind==='rare'&&d.label.includes('The Last Dawn')));
});

test('actual browser startup selects the linked file without reading a conflicting browser journey',async()=>{
 const linked=handle(payload('authoritative-file'));let recoveryReads=0;let h;
 h=vm.createContext({window:{},nativeSaveAPI:()=>null,db:null,openDB:async()=>({}),nativeSaveLinked:false,deviceSaveHandle:null,restoreDeviceSaveHandle:async()=>h.deviceSaveHandle=linked.file,selectStartupSave,dbGet:async()=>{recoveryReads++;return payload('stale-browser').save;},dbAll:async()=>{recoveryReads++;return [];}});
 const a=source.indexOf('async function loadInitialJourney('),b=source.indexOf('\nwindow.spirimonReconnectSave=',a);vm.runInContext(source.slice(a,b),h);
 const result=await h.loadInitialJourney();assert.equal(result.save.seed,'authoritative-file');assert.equal(recoveryReads,0);assert.equal(result.source,'file');assert.equal(linked.writes(),0);
});
test('perception still reveals a legendary disturbance before its required time or weather',()=>{
 const seed='SP-461998',cx=-7,cy=-4,point=regionalLegendSite(seed,cx,cy),q=newSealer();q.senses={perception:true};
 const h=vm.createContext({s:{seed,player:point,sealer:q,roamers:{},drops:[]},E,A,SE,SW:{shrinesForRegion:()=>[]},legendSite:(x,y)=>regionalLegendSite(seed,x,y),isNight:()=>false,mapWeather:()=>({kind:'clear'}),townNPCs:()=>[],npcWander:new Map(),challengerApproach:null});
 vm.runInContext(extract('spiritualDiscoveries'),h);assert.ok(h.spiritualDiscoveries().some(d=>d.kind==='rare'&&d.x===point.x&&d.y===point.y));
});

test('a readable linked file stays authoritative when only write permission has expired',async()=>{
 for(const writeFailure of ['prompt','throw']){
  const h=handle(payload('readable-primary'));h.file.queryPermission=async({mode})=>{if(mode==='read')return 'granted';if(writeFailure==='throw')throw Error('Write permission unavailable');return 'prompt';};let browserReads=0;
  const result=await selectStartupSave({handle:h.file,readBrowser:async()=>{browserReads++;return {save:payload('stale-recovery').save};}});
  assert.equal(result.save.seed,'readable-primary');assert.equal(result.source,'file');assert.equal(result.writeBlocked,true);assert.match(result.warning,/loaded/);assert.equal(browserReads,0);assert.equal(h.writes(),0);
 }
});
