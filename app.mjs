import {nativeSaveAPI,readNativeJourney} from './native-save.mjs';
import {regionalLegendSite} from './legend-sites.mjs';
import {battleRewards} from './battle-rewards.mjs';
import {decodeSavePayload,readLinkedSave,writeLinkedSave,selectStartupSave} from './save-files.mjs';
import {createBattleSession} from './battle-session.mjs';
import {createBattleView} from './battle-view.mjs';
import {DAMAGE_NUMBER_MS,drawDamageNumbers} from './damage-numbers.mjs';
import {SACRED_ASSETS,drawCaveEntrance} from './sacred-art.mjs';
import {battleStageLayout} from './battle-layout.mjs';
import {drawDungeonAtlasTile,drawDungeonProp,dungeonArtworkReady,dungeonFeatureSprite,dungeonDecoration,drawDungeonLight} from './dungeon-atlas.mjs';
import {updateMapCamera,movementProgress} from './map-camera.mjs';
import {sceneryDepth,caveFootprint,caveRimBlocked} from './scenery.mjs';
import * as SE from './spiritual-energy.mjs';
import * as ST from './support-techniques.mjs';
import * as SW from './spiritual-world.mjs';
import * as CO from './cooperative-techniques.mjs';
import * as RT from './realtime-combat.mjs';
import {sealingGestureChoice} from './sealing-gesture.mjs';
import * as CP from './classification-passives.mjs';
import {realTimeStatusHTML,seconds,damageDelayLabels} from './realtime-ui.mjs';
import {completeProceduralSpecies,acceptGeneratedArtwork,atlasSprites} from './creature-browser.mjs';
import {syncCapabilities,applyVisualObservation,applyLineageObservations,individualSpecies,fieldCapabilityAvailable} from './anatomy.mjs';
import {certifyRenderedAnatomy} from './creature-visuals.mjs';
import * as BAI from './battle-ai.mjs';
import {companionSize,canSteed,canWaterMount,drawMounted} from './steed.mjs';
import {drawFieldAnimation,drawSwimming,drawWaterMount} from './field-animations.mjs';
import * as Q from './equipment.mjs';
import * as AI from './ai-providers.mjs';
import {transformSpirit} from './transformation.mjs';
import * as O from './offerings.mjs';
import {audio} from './audio.mjs';
import {ROSTER,ART} from './roster.mjs';
import * as DEX from './spiridex.mjs';
import {spiridexPage,spiridexDetail} from './spiridex-view.mjs';
import {preloadImages,readyImage} from './asset-loader.mjs';
import {MYSTERY_STATIC,MYSTERY_WALK} from './placeholder-art.mjs';
import * as W from './world.mjs';
import * as E from './engine.mjs';
import * as A from './adventure-systems.mjs';
import * as EP from './environment-puzzles.mjs';
import {periodicDamage} from './classification-status.mjs';
import {drawInteriorScene,INTERIOR_ATLAS,MATERIAL_ATLAS,TOWN_ATLAS} from './interior-assets.mjs';
import {drawTechnique} from './move-animations.mjs';
import {creatureArtworkSource,damageNumberAnchor,drawSpirit,drawBattleSpirit,drawCompanion,drawAspectAura,drawPerson,drawTile,drawBuilding,drawTownDecor,drawTree,drawWell,drawTownBuilding,drawTownFeatures,renderSpiritCanvases} from './sprites.mjs';
const $=q=>document.querySelector(q);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const action=(name,label,value='',cls='btn')=>'<button class="'+cls+'" data-action="'+name+'" data-value="'+esc(value)+'">'+label+'</button>';
const chip=type=>'<span class="chip type-chip" style="--type:'+E.COLORS[type]+'">'+esc(type)+'</span>';
const sprite=(sp,form=0,size=128,individual=null)=>'<canvas width="'+size+'" height="'+size+'" data-species="'+esc(sp.id)+'" data-form="'+form+'" data-aspect="'+esc(individual?.aspect||'Natural')+'" data-radiant="'+(individual?.rareVariant?'true':'false')+'" role="img" aria-label="'+esc(sp.forms[form])+'"></canvas>';
const libraryDirty=new Set();
let fieldAnimation=null,spiritMoveReturn=null;
const dexView={search:'',status:'all',type:'all',page:0};let dexReturnId=null;
function animateField(kind,x,y,duration=620){fieldAnimation={kind,x,y,start:performance.now(),duration};}
let db,s,library={},view='explore',battle=null,selectedMove=0,movePreviewKey=null,style='normal',commit=.5,modal=null,toastTimer,saveTimer,keys=new Set(),lastStep=0,lastTime=performance.now(),ritual=null,queue=[],busy=false,aiStatus=null,starterChoices=[],starterBase='Beast',search='',filter='all',loaded=false,mapCamera=null,walkAnim=null,companionTrail=[],queuedStep=null,running=false,actionBusy=false,battleMode='main';
const battleSession=createBattleSession({getBattle:()=>battle,getState:()=>s,party,spOf,persistentEnemySealer});
const battleView=createBattleView({getBattle:()=>battle,getState:()=>s,getMode:()=>battleMode,realTimeContext,spOf,battleMoves,sealButtonHTML,xpHTML,party,activeBattleAlly,esc,action});
const PLAYTEST=new URLSearchParams(location.search).has('playtest');
const PLAYTEST_KEY=(new URLSearchParams(location.search).get('playtest')||'').replace(/[^a-z0-9-]/gi,'').slice(0,40);
const DB_NAME=PLAYTEST?'spirimon-playtest-v1'+(PLAYTEST_KEY?'-'+PLAYTEST_KEY:''):'spirimon-v1',COMPANION='http://127.0.0.1:4317';
function openDB(){return new Promise((resolve,reject)=>{
 let settled=false,req;
 const finish=(error,value)=>{if(settled){if(value)value.close();return;}settled=true;clearTimeout(timer);error?reject(error):resolve(value);};
 const timer=setTimeout(()=>finish(new Error('Browser save storage did not respond. Close other Spirimon tabs, then retry. Your save has not been changed.')),10000);
 try{req=indexedDB.open(DB_NAME,1);}catch(error){finish(error);return;}
 req.onupgradeneeded=()=>{if(settled){req.transaction.abort();return;}req.result.createObjectStore('saves');req.result.createObjectStore('library',{keyPath:'id'});};
 req.onsuccess=()=>finish(null,req.result);
 req.onerror=()=>finish(req.error||new Error('Browser save storage could not open.'));
 req.onblocked=()=>startupStatus('Waiting for another Spirimon tab to release save storage…');
});}
function dbRead(store,method,key){return new Promise((resolve,reject)=>{
 let settled=false;
 const finish=(error,value)=>{if(settled)return;settled=true;clearTimeout(timer);error?reject(error):resolve(value);};
 const timer=setTimeout(()=>finish(new Error('Reading your saved journey timed out. Close other Spirimon tabs, then retry. Your save has not been changed.')),10000);
 try{const tx=db.transaction(store),os=tx.objectStore(store),req=method==='getAll'?os.getAll():os.get(key);
 req.onsuccess=()=>finish(null,req.result);req.onerror=()=>finish(req.error||new Error('Saved journey could not be read.'));
 tx.onabort=()=>finish(tx.error||new Error('Saved journey read was interrupted.'));tx.onerror=()=>finish(tx.error||new Error('Saved journey could not be read.'));
 }catch(error){finish(error);}
});}
function dbGet(store,key){return db?dbRead(store,'get',key):Promise.resolve(volatileStores[store].get(key));}
function dbAll(store){return db?dbRead(store,'getAll'):Promise.resolve([...volatileStores[store].values()]);}
function dbPut(store,value,key){if(!db){volatileStores[store].set(key??value.id,value);return Promise.resolve();}return new Promise((resolve,reject)=>{const tx=db.transaction(store,'readwrite'),os=tx.objectStore(store);key===undefined?os.put(value):os.put(value,key);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}
let deviceSaveHandle=null,deviceWriteBusy=false,deviceWritePending=false,deviceSaveBlocked=false,startupSaveWarning=null,nativeSaveLinked=false;
const volatileStores={saves:new Map(),library:new Map()};
function savePayload(){return{format:'spirimon-backup',version:E.VERSION,exportedAt:new Date().toISOString(),save:{...s,battle,generationQueue:queue},library:Object.values(library)};}
async function writeDeviceSave(){
 if((!deviceSaveHandle&&!nativeSaveLinked)||deviceSaveBlocked||deviceWriteBusy){if(deviceWriteBusy)deviceWritePending=true;return false;}
 deviceWriteBusy=true;
 try{if(nativeSaveLinked)return !!(await nativeSaveAPI().write({text:JSON.stringify(savePayload())})).saved;return await writeLinkedSave(deviceSaveHandle,savePayload());}
 catch(error){console.warn('Device save failed',error);return false;}
 finally{deviceWriteBusy=false;if(deviceWritePending){deviceWritePending=false;void writeDeviceSave();}}
}
async function chooseDeviceSave(){
 const native=nativeSaveAPI();
 if(native){
  const previousBlock=deviceSaveBlocked;deviceSaveBlocked=true;
  try{const selected=await native.choose();if(selected.cancelled){deviceSaveBlocked=previousBlock;return;}
   const existing=await native.read();if(existing.exists){const data=decodeSavePayload(existing.text);if(s)await dbPut('saves',structuredClone(s),'before-device-load');await applySavePayload(data);}
   if(!s)throw Error('This folder has no saved journey. Choose the folder containing your save.');
   nativeSaveLinked=true;deviceSaveBlocked=false;await writeDeviceSave();toast('Device folder linked. Your journey loads from this file and saves automatically.');
  }catch(error){toast('Device file paused: '+error.message);}
  return;
 }
 if(!('showSaveFilePicker'in window)&&!('showDirectoryPicker'in window)){toast('This browser cannot link a folder for automatic saving. Use Export backup to save a file on your device.');return;}
 try{
  const handle='showDirectoryPicker'in window?await window.showDirectoryPicker({mode:'readwrite'}):await window.showSaveFilePicker({suggestedName:'spirimon-save.json',types:[{description:'Spirimon save',accept:{'application/json':['.json']}}]});
  if(await handle.requestPermission({mode:'readwrite'})!=='granted')return;
  let existing=null;
  try{const file=handle.kind==='directory'?await handle.getFileHandle('spirimon-save.json'):handle,contents=await file.getFile();if(contents.size)existing=decodeSavePayload(await contents.text());}
  catch(error){if(error.name!=='NotFoundError')throw error;}
  if(existing){await dbPut('saves',structuredClone(s),'before-device-load');await applySavePayload(existing);}
  deviceSaveHandle=handle;deviceSaveBlocked=false;await dbPut('saves',handle,'device-file-handle');
  if(await writeDeviceSave())toast(existing?'Existing device journey loaded. Automatic file saving enabled.':'Device save linked. Automatic file saving enabled.');
  else toast('File selected, but writing failed. Browser recovery remains available.');
 }catch(error){if(error.name!=='AbortError')toast('Cannot link save file: '+error.message);}
}
async function restoreDeviceSaveHandle(){try{const handle=await dbGet('saves','device-file-handle');if(handle?.kind==='file'||handle?.kind==='directory')deviceSaveHandle=handle;}catch(err){console.warn('Cannot restore file permission',err);}}
async function loadInitialJourney(){
 const native=nativeSaveAPI();window.spirimonCanReconnectSave=!!native;let nativeInitial=null,nativeError=null;
 if(native){try{nativeSaveLinked=!!(await native.status()).linked;if(nativeSaveLinked)nativeInitial=await readNativeJourney(native);}catch(error){nativeError=error;}}
 try{db=await openDB();}catch(error){if(!nativeInitial)throw error;db=null;}
 if(nativeInitial)return {...nativeInitial.payload,source:nativeInitial.source,warning:nativeInitial.warning};
 await restoreDeviceSaveHandle();window.spirimonCanReconnectSave=!!deviceSaveHandle||!!native;
 const initial=await selectStartupSave({handle:deviceSaveHandle,readBrowser:async()=>({save:await dbGet('saves','main'),library:await dbAll('library')})});
 if(nativeError){if(!initial.save)throw nativeError;return {...initial,source:'recovery',writeBlocked:true,warning:'Device file could not load: '+nativeError.message+' Browser recovery opened; file writing is paused.'};}
 return initial;
}
window.spirimonReconnectSave=async()=>{try{if(nativeSaveAPI()){await chooseDeviceSave();if(nativeSaveLinked&&!deviceSaveBlocked)location.reload();}else if(deviceSaveHandle&&await deviceSaveHandle.requestPermission({mode:'readwrite'})==='granted')location.reload();}catch(error){toast(error.message);}};
async function persist(){if(!loaded)return;try{DEX.syncSpiridex(s);s.lastSave=Date.now();s.battle=battle;s.generationQueue=queue;const wrote=await writeDeviceSave();await dbPut('saves',structuredClone(s),'main');for(const id of [...libraryDirty]){await dbPut('library',structuredClone(library[id]));libraryDirty.delete(id);}$('#save-status').innerHTML='<i></i> '+(wrote?'Saved to device file':deviceSaveBlocked?'Browser recovery · device file paused':deviceSaveHandle||nativeSaveLinked?'Browser fallback · file permission needed':PLAYTEST?'Playtest browser recovery':'Browser recovery saved');}catch(err){$('#save-status').textContent='Save failed · export a backup';console.error(err);}}
function save(){DEX.syncSpiridex(s);clearTimeout(saveTimer);const status=$('#save-status');if(status)status.textContent='Saving…';saveTimer=setTimeout(persist,350);}
function register(sp){E.refreshTechniques(sp);s.species[sp.id]=sp;library[sp.id]=sp;libraryDirty.add(sp.id);globalThis.spirimonSpecies=s.species;return sp;}
function toast(msg){clearTimeout(toastTimer);$('#toast').textContent=msg;$('#toast').classList.add('show');toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3500);}
function note(msg){s.notes.unshift(msg);s.notes=s.notes.slice(0,100);save();}
const DAY_MS=35*60000,NIGHT_MS=25*60000,DAY_CYCLE_MS=DAY_MS+NIGHT_MS;
function isNight(){return !!s.cave||(s.playTime||0)%DAY_CYCLE_MS>=DAY_MS;}
function mapWeather(){
 const reg=currentRegion(),phase=Math.floor((s.playTime||0)/(7*60000)),v=E.hash(s.seed,'weather',reg.key,phase)%1000;
 const kind=v<330?'rain':v<405?'snow':v<505?'wind':v<560?'heat':v<670?'fog':'clear';
 const h=E.hash(s.seed,'weather-options',reg.key,phase);
 return {kind,wind:kind==='wind'||((kind==='rain'||kind==='snow')&&h%3===0),lightning:(kind==='rain'||kind==='snow')&&Math.floor(h/7)%6===0,hail:kind==='rain'&&Math.floor(h/19)%8===0,heavy:kind==='snow'&&Math.floor(h/31)%3===0,phase};
}
function drawAtmosphere(ctx,width,height,time){
 const weather=mapWeather(),night=isNight();
 ctx.save();
 if(weather.kind==='snow'&&weather.heavy){ctx.fillStyle='#e8f2f54d';ctx.fillRect(0,0,width,height);}
 if(night){ctx.fillStyle='#06152c99';ctx.fillRect(0,0,width,height);}else{const cycle=(s.playTime||0)%DAY_CYCLE_MS;if(cycle>DAY_MS-180000){ctx.fillStyle='#c86e3629';ctx.fillRect(0,0,width,height);}}
 if(weather.kind==='heat'){ctx.fillStyle='#e9923326';ctx.fillRect(0,0,width,height);}
 if(weather.kind==='fog'){ctx.fillStyle='#cbd8d2a0';ctx.fillRect(0,0,width,height);for(let i=0;i<9;i++){ctx.fillStyle='#edf3e936';ctx.fillRect((i*127+time*.009)%(width+120)-120,(i*71)%height,140,24);}}
 if(weather.kind==='rain'||weather.kind==='snow'){
 const snow=weather.kind==='snow',count=snow?(weather.heavy?165:85):180;
 ctx.strokeStyle=snow?'#f8fcffcc':'#a8d4ed99';ctx.fillStyle='#f5faffdf';ctx.lineWidth=1;
 for(let i=0;i<count;i++){const x=(i*71+time*(snow?.012:(weather.wind?.15:.05)))%width,y=(i*131+time*(snow?.025:.16))%height;if(snow)ctx.fillRect(x,y,weather.heavy?3:2,weather.heavy?3:2);else{ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+(weather.wind?9:3),y+11);ctx.stroke();}}
 if(weather.hail){ctx.fillStyle='#f7fcff';for(let i=0;i<55;i++)ctx.fillRect((i*97+time*.12)%width,(i*79+time*.22)%height,3,3);}
 }
 if(weather.kind==='wind'||weather.wind){ctx.strokeStyle='#dbece76b';for(let i=0;i<18;i++){const x=(i*113+time*.12)%width,y=(i*57)%height;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+25,y-3);ctx.stroke();}}
 if(weather.lightning&&time%11000<110){audio.thunder?.(Math.floor(time/11000));ctx.fillStyle='#e9f5ffae';ctx.fillRect(0,0,width,height);}
 ctx.restore();
 const badge=document.querySelector('#map-atmosphere')||document.createElement('div');
 if(!badge.id){badge.id='map-atmosphere';badge.className='map-atmosphere';document.querySelector('.map-location')?.appendChild(badge);}
 const label={rain:'Rain',snow:weather.heavy?'Heavy snow':'Snow',wind:'High winds',heat:'Heat wave',fog:'Heavy fog',clear:'Clear'}[weather.kind];
 const text=(night?'🌙 Night':'☀ Day')+' · '+label+(weather.lightning?' ⚡':'')+(weather.hail?' Hail':'')+(weather.wind&&weather.kind!=='wind'?' Gusts':'');
 if(badge.textContent!==text)badge.textContent=text;
}
function currentRegion(){const c=E.coord(s.player.x,s.player.y);return s.regions[c.cx+','+c.cy]||E.region(s.seed,c.cx,c.cy);}
function safe(){if(battle||s.cave)return false;if(s.interior||SW.nearbyShrine(s))return true;const c=E.coord(s.player.x,s.player.y);return currentRegion().town&&Math.abs(c.lx-24)<10&&Math.abs(c.ly-18)<8;}
function party(){return (battle?.allowedAllies||s.party).map(id=>s.spirits.find(i=>i.id===id)).filter(Boolean);}
function lead(){const q=SE.ensureSealer(s);return party().find(i=>i.id===q.leadId&&i.hp>0)||party().find(i=>i.hp>0);}
function spOf(i){E.ensureIndividualPassives(s.species[i.species],i);const sp=individualSpecies(s.species[i.species],i),equipped=i.moveIds?{...sp,moves:E.equippedMoves(i,sp)}:sp;E.migrateResources(i,equipped);return equipped;}
function activeBattleAlly(){const ids=battle?.multi?.allies||[battle?.ally];return s.spirits.find(i=>i.id===(battle?.controlledAlly||battle?.ally)&&i.hp>0&&ids.includes(i.id))||s.spirits.find(i=>ids.includes(i.id)&&i.hp>0)||s.spirits.find(i=>i.id===battle?.ally);}
function battleMoves(i){const sp=spOf(i);if(i.pendingMove)return [i.pendingMove];if(i.lockedMove&&E.canUseMove(i,sp,i.lockedMove))return [i.lockedMove];const moves=E.equippedMoves(i,sp);return moves.some(m=>E.canUseMove(i,sp,m,battle?(['self','ally','allAllies'].includes(E.moveTarget(m))?sp:spOf(battle.multi?.enemies?.[battle.enemyTargetSelection||0]||battle.enemy)):null))?moves:[{...E.STRUGGLE,type:sp.base}];}
function leadSwimmer(){const unit=party().find(i=>i.id===s.sealer?.leadId&&i.hp>0);return unit&&fieldCapabilityAvailable(spOf(unit),'swim',unit)&&canWaterMount(spOf(unit),unit.appearance)?unit:null;}
function swimmingAt(x,y){return !s.cave&&!s.interior&&E.tile(s.seed,Math.round(x),Math.round(y))==='water';}
function leadSteed(){const unit=party().find(i=>i.id===s.sealer?.leadId&&i.hp>0);return unit&&fieldCapabilityAvailable(spOf(unit),'steed',unit)?unit:null;}
function toggleSteed(){if(battle||modal||s.cave||s.interior||view!=='explore'||swimmingAt(s.player.x,s.player.y))return;
 if(s.mountedSteed){s.mountedSteed=null;companionTrail.length=0;save();render();return;}
 const unit=leadSteed();if(!unit)return toast('Your lead Spirimon cannot safely carry a rider in this form.');
 if(!fieldRelease('steed','traverse:steed'))return toast('Not enough Spiritual Energy to manifest your mount.');s.mountedSteed=unit.id;animateField('steed',s.player.x,s.player.y);companionTrail.length=0;walkAnim=null;queuedStep=null;save();render();
}
function validSteed(){const unit=leadSteed();if(!unit||s.mountedSteed!==unit.id){s.mountedSteed=null;return null;}return unit;}
function fieldCapability(kind){if(kind==='steed')return !!leadSteed();return party().filter(i=>i.hp>0).some(i=>fieldCapabilityAvailable(spOf(i),kind,i));}
function fieldSkill(kind){return fieldCapability(kind);}
function abilityReady(kind){return fieldCapability(kind);}
function fieldTravel(kind,key){
 if(battle||s.interior)return toast('Field travel is unavailable here.');
 if(s.cave&&kind!=='dig')return toast('Reach the surface before using this travel capability.');
 if(!fieldSkill(kind))return toast('No attuned Spirimon can use '+kind+'.');
 const towns=Object.values(s.regions).filter(r=>r.visited&&r.town),destination=kind==='dig'?(towns.find(r=>r.key===s.lastTown)||towns[0]):s.regions[key];
 if(!destination?.visited||!destination.town)return toast('Choose a previously visited town.');
 if(!fieldRelease(kind,'travel:'+kind))return toast('Not enough Energy to release a capable Spirimon.');
 if(s.cave)delete s.cave;s.player.x=destination.cx*48+24;s.player.y=destination.cy*36+18;
 walkAnim=null;queuedStep=null;companionTrail.length=0;animateField(kind,s.player.x,s.player.y,850);discoverRegion();save();render();toast('Your Spirimon carries you to '+destination.name+'.');
}
function fieldMenu(){const options=['fly','teleport','dig','swim','push','cleave','crush','steed'].map(k=>'<p><b>'+k.toUpperCase()+'</b> · '+((['push','cleave','crush'].includes(k)?fieldCapability(k):fieldSkill(k))?'Ready':'No eligible Spirimon')+'</p>');const towns=Object.values(s.regions).filter(x=>x.visited&&x.town);showModal('Spirimon field abilities.',options.join('')+action('field-ritual-menu','Cooperative field rituals')+'<div class="btn-row">'+(fieldSkill('dig')?action('field-use','Dig · Return to town','dig'):'')+'<span>Swim · Enter water to swim yourself (one-quarter walking speed; double encounters), or ride your capable lead Spirimon.</span>'+(leadSteed()?action('steed-toggle',s.mountedSteed?'Dismount':'Mount lead Spirimon','','btn primary'):'')+'</div><p>Fly or Teleport to a visited town:</p><div class="btn-row">'+towns.flatMap(t=>['fly','teleport'].filter(fieldSkill).map(k=>action('field-use',k.toUpperCase()+' · '+esc(t.name),k+':'+t.key))).join('')+'</div>');}
function speciesFor(reg,r){
 const base=E.pick(reg.biome.types,r),alter=E.pick(E.TYPES.filter(t=>t!==base),r);
 const finished=Object.values(library).filter(p=>!p.legendary&&hasFinishedArtwork(p));
 const pair=finished.filter(p=>p.base===base&&p.alter===alter),sameBase=finished.filter(p=>p.base===base),biome=finished.filter(p=>reg.biome.types.includes(p.base));
 const pool=pair.length?pair:sameBase.length?sameBase:biome.length?biome:finished;
 if(!pool.length)throw Error('No completed Spirimon artwork is available.');
 const known=pool.filter(p=>s.seen.includes(p.id)),familiar=known.length&&r()<.9;
 // New designs stay in the generation queue until all three images are finished.
 if(s.settings.aiEnabled&&(!pair.length||!familiar))queueFresh(reg,r);
 const undiscovered=pool.filter(p=>!s.seen.includes(p.id));return register(E.pick(familiar?known:undiscovered.length?undiscovered:pool,r));
}
function roamerArtworkReady(roamer){return !!(roamer?.active&&hasFinishedArtwork(s.species[roamer.ind?.species]));}

function equipWildItem(ind,sp){if(!Q.heldEquipment(ind)&&E.hash(ind.id,'wild-held')%100<12){ind.heldItem=Q.generateHeldItem(s.seed+'|wild-item|'+ind.id,{level:ind.level,eligibleFor:sp,source:'Wild Spirimon'});E.heal(ind,sp);}return ind;}
function ensureRegion(cx,cy){const reg=E.region(s.seed,cx,cy);if(s.regions[reg.key])return s.regions[reg.key];Object.assign(reg,E.encounterRange(s.seed,cx,cy,s.townsVisited?.length||0));reg.danger=reg.minLevel;const r=E.rng(E.hash(s.seed,'ecosystem',cx,cy));s.regions[reg.key]={...reg,visited:false};const roam=[];for(let n=0;n<7;n++){const sp=speciesFor(reg,r);let x,y;for(let k=0;k<100;k++){x=cx*48+4+Math.floor(r()*40);y=cy*36+4+Math.floor(r()*28);const c=E.coord(x,y);if(E.walkable(E.tile(s.seed,x,y))&&(!reg.town||Math.abs(c.lx-24)>10||Math.abs(c.ly-18)>8))break;}const form=E.rollForm(r),level=E.encounterLevel(reg,r);const ind=equipWildItem(E.heal(E.makeIndividual(sp,level,form,r),sp),sp);roam.push({id:'r-'+reg.key+'-'+n,x,y,ind,active:true});}if(cx===0&&cy===0&&roam.length){roam[0].x=34;roam[0].y=18;}s.roamers[reg.key]=roam;return reg;}
function spawnRegionLoot(reg){s.drops??=[];const key='loot-'+reg.key;s.regionLoot??={};if(s.regionLoot[key])return;s.regionLoot[key]=true;if(E.hash(s.seed,'region-loot-roll',reg.key)%100>=5)return;const r=E.rng(E.hash(s.seed,'region-loot-position',reg.key));for(let attempt=0;attempt<90;attempt++){const x=reg.cx*48+3+Math.floor(r()*42),y=reg.cy*36+3+Math.floor(r()*30),tile=E.tile(s.seed,x,y),c=E.coord(x,y);if(!E.walkable(tile)||reg.town&&Math.abs(c.lx-24)<12&&Math.abs(c.ly-18)<10)continue;const items={};const choices=['seals','offerings','tonics','ethers'];items[choices[Math.floor(r()*choices.length)]]=1+Math.floor(r()*2);s.drops.push({x,y,items,worldLoot:true,heldSeed:s.seed+'|cache|'+reg.key,heldEvent:'cache-item-'+reg.key,heldLevel:reg.danger});note('A hidden supply cache can be found somewhere in '+reg.name+'.');break;}}
function discoverRegion(){const c=E.coord(s.player.x,s.player.y);for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++)ensureRegion(c.cx+dx,c.cy+dy);const reg=s.regions[c.cx+','+c.cy];if(!reg.visited){reg.visited=true;SE.gainSealerXP(s,20,'region:'+reg.key);spawnRegionLoot(reg);if(reg.town&&reg.key!=='0,0'){s.townsVisited??=[];if(!s.townsVisited.includes(reg.key))s.townsVisited.push(reg.key);}note('Discovered '+reg.name+' in '+reg.biome.name+'.');for(const q of E.questTemplates()){const record=questState()[q.id];if(record&&typeof record==='object')s.questLog[q.id]=E.advanceQuest(s,q,record);}toast(reg.name+' · '+reg.biome.name);}save();}
function discover(sp,form=0){const first=!(s.seen||[]).includes(sp.id),changed=DEX.recordSpiridexEncounter(s,sp,form,currentRegion().name);if(first){const pair=sp.base+'>'+sp.alter;s.history??={};s.history[pair]??=[];if(!s.history[pair].includes(sp.id))s.history[pair].push(sp.id);note('Encountered '+sp.forms[form]+' ('+sp.base+' → '+sp.alter+').');}else if(changed)save();}
const npcWander=new Map();
function townNPCs(cx,cy){return E.npcs(s.seed,cx,cy).map(n=>{const state=npcWander.get(n.id);return state?{...n,x:state.x,y:state.y,face:state.face||'down',walk:state.walk}:n;});}
function wanderNPCs(now){if(s.interior||s.cave||modal||battle||view!=='explore')return;const p=E.coord(s.player.x,s.player.y),camera=document.querySelector('#world'),cw=camera?.width||480,ch=camera?.height||320,halfX=Math.ceil(cw/64)+6,halfY=Math.ceil(ch/64)+6;for(let cy=Math.floor((s.player.y-halfY)/36);cy<=Math.floor((s.player.y+halfY)/36);cy++)for(let cx=Math.floor((s.player.x-halfX)/48);cx<=Math.floor((s.player.x+halfX)/48);cx++){if(!E.region(s.seed,cx,cy).town)continue;const group=townNPCs(cx,cy);for(const n of group){if(Math.abs(n.x-s.player.x)>halfX+3||Math.abs(n.y-s.player.y)>halfY+3)continue;let state=npcWander.get(n.id);if(!state){state={x:n.x,y:n.y,homeX:n.x,homeY:n.y,face:'down',next:now+4500+Math.random()*6000,walk:null};npcWander.set(n.id,state);}if(now<state.next)continue;state.next=now+6000+Math.random()*9000;if(Math.random()<.35)continue;const dirs=[[0,1],[1,0],[-1,0],[0,-1]],d=dirs[Math.floor(Math.random()*dirs.length)],nx=state.x+d[0],ny=state.y+d[1];if(Math.abs(nx-state.homeX)>3||Math.abs(ny-state.homeY)>3||!E.walkable(E.tile(s.seed,nx,ny))||buildingSpriteBlocked(nx,ny)||(nx===s.player.x&&ny===s.player.y)||group.some(other=>other.id!==n.id&&other.x===nx&&other.y===ny)||(s.roamers[cx+','+cy]||[]).some(r=>r.active&&r.x===nx&&r.y===ny)||W.buildings(cx,cy).some(b=>b.doorX===nx&&b.doorY===ny))continue;state.walk={x:state.x,y:state.y,start:now,duration:450};state.face=d[0]<0?'left':d[0]>0?'right':d[1]<0?'up':'down';state.x=nx;state.y=ny;}}}
function nearbyNPC(){if(s.interior)return W.roomNPCs(s.interior).find(n=>Math.abs(n.x-s.interior.x)+Math.abs(n.y-s.interior.y)<=1);const c=E.coord(s.player.x,s.player.y);return [c,[{cx:c.cx-1,cy:c.cy},{cx:c.cx+1,cy:c.cy},{cx:c.cx,cy:c.cy-1},{cx:c.cx,cy:c.cy+1}]].flatMap(v=>Array.isArray(v)?v:[v]).flatMap(region=>townNPCs(region.cx,region.cy)).find(n=>Math.abs(n.x-s.player.x)+Math.abs(n.y-s.player.y)===1);}
function nearbyRoamer(){if(s.interior)return null;const c=E.coord(s.player.x,s.player.y);return(s.roamers[c.cx+','+c.cy]||[]).filter(n=>roamerArtworkReady(n)&&Math.abs(n.x-s.player.x)+Math.abs(n.y-s.player.y)<=2).sort((a,b)=>(Math.abs(a.x-s.player.x)+Math.abs(a.y-s.player.y))-(Math.abs(b.x-s.player.x)+Math.abs(b.y-s.player.y)))[0];}
function removeRoamer(id){for(const group of Object.values(s.roamers)){const r=group.find(x=>x.id===id);if(r)r.active=false;}}
function hint(){if(!battle&&SW.nearbyShrine(s))return 'E · Shrine communion · Spiritual instruction';if(s.cave)return 'Night · Explore the cave and locate its exits';if(caveEntranceHere())return 'E · Enter cave';if(!s.starter)return'Your first bond awaits at the guild';const n=nearbyNPC();if(n)return'E · Talk to '+n.name;const r=nearbyRoamer();if(r)return'E · Approach '+spOf(r.ind).forms[r.ind.appearance];if(s.drops.some(d=>d.x===s.player.x&&d.y===s.player.y))return'E · Retrieve your dropped supplies';return safe()?'A safe place · Rest, train, and attune':'The wild is calling · Follow a trail';}
function xpHTML(ind){if(!ind||!s.spirits.some(i=>i.id===ind.id))return '';const max=Math.max(1,ind.level*18),xp=Math.max(0,ind.xp||0),pct=Math.min(100,xp/max*100);return '<div class="xp-meter" role="progressbar" aria-label="Experience to next level" aria-valuemin="0" aria-valuemax="'+max+'" aria-valuenow="'+Math.min(xp,max)+'"><i style="width:'+pct+'%"></i></div><div class="health-label xp-label"><span>XP'+('')+'</span><span>'+(xp+' / '+max)+'</span></div>';}
function hpHTML(ind,sp){const st=E.stats(ind,sp),max=st.hp,pct=Math.max(0,ind.hp/max*100),stamina=ind.pp??st.pp,willpower=ind.willpower??st.willpower;return '<div class="health '+(pct<25?'critical':pct<50?'low':'')+'"><i style="width:'+pct+'%"></i></div><div class="health-label"><span>'+(ind.status?esc(ind.status.toUpperCase()):'HP')+'</span><span>'+ind.hp+' / '+max+'</span></div><div class="pp-meter"><i style="width:'+Math.min(100,(st.pp?stamina/st.pp*100:0))+'%"></i></div><div class="health-label"><span>STAMINA</span><span>'+stamina+' / '+st.pp+'</span></div><div class="willpower-meter"><i style="width:'+Math.min(100,(st.willpower?willpower/st.willpower*100:0))+'%"></i></div><div class="health-label willpower-label"><span>WILLPOWER</span><span>'+willpower+' / '+st.willpower+'</span></div>'+xpHTML(ind);}

function partyHTML(){const members=party();return'<section class="panel party-panel"><div class="section-label">ATTUNED SPIRIMON <small>'+members.length+' / 6</small></div><div class="party-list">'+members.map((i,n)=>{const sp=spOf(i);return'<button class="party-item" data-action="detail" data-value="'+i.id+'">'+sprite(sp,i.appearance,80,i)+'<div class="party-info"><div class="party-name"><span>'+esc(sp.forms[i.appearance])+'</span><small>Lv. '+i.level+'</small></div><div class="party-types">'+esc(sp.base)+' / '+esc(sp.alter)+(n===0?' · LEAD':'')+'</div>'+hpHTML(i,sp)+'</div></button><div class="party-order">'+(n?action('party-up','↑',i.id,'btn small'):'')+(n<members.length-1?action('party-down','↓',i.id,'btn small'):'')+'</div>';}).join('')+Array.from({length:6-members.length},()=>'<div class="empty-slot"><span>◇</span> An unspoken bond</div>').join('')+'</div>'+action('view','Manage tattoos →','spirits','btn ghost party-manage')+'</section>';}
function miniMapHTML(){const c=E.coord(s.player.x,s.player.y),cells=[];for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const key=(c.cx+dx)+','+(c.cy+dy),r=s.regions[key];cells.push('<button type="button" class="mini-cell '+(!dx&&!dy?'here':'')+'" data-action="mini-region" data-value="'+key+'" title="'+(r?.visited?esc(r.name):'Unexplored')+'" style="background:'+(r?.visited?r.biome.color:'#24312d')+'" '+(!r?.visited?'disabled':'')+'>'+(!dx&&!dy?'◆':r?.town&&r.visited?'⌂':'')+'</button>');}return '<div class="mini-map" aria-label="Explored regions"><div class="mini-grid">'+cells.join('')+'</div>'+action('view','Full map','atlas','btn small')+'</div>';}
function exploreHTML(){const reg=currentRegion(),visited=Object.values(s.regions).filter(r=>r.visited).length;return spiritualEnergyHTML(s.sealer,'Sealer')+'<div class="page-heading"><div><div class="eyebrow">YOUR JOURNEY, UNWRITTEN</div><h1>The wild is calling.</h1><p>Follow a trail. Find a Spirimon. Make a bond.</p></div><span class="pill gold">◇ &nbsp; Rank '+s.rank+' · '+rankName()+'</span></div><div class="explore-layout"><div><div class="world-frame"><canvas id="world" width="960" height="640" tabindex="0" aria-label="Explorable procedural world. Use arrow keys or WASD to move, E to interact."></canvas><div class="map-location"><small id="map-biome">'+esc((PLAYTEST?'PLAYTEST · ':'')+reg.biome.name.toUpperCase())+'</small><strong id="map-location">'+esc(reg.name)+'</strong></div><div class="map-controls">'+(leadSteed()?action('steed-toggle',s.mountedSteed?'DISMOUNT':'MOUNT','','btn small'):'')+' '+action('companion-interact','COMPANION','','btn small')+' '+action('adventure-menu','PATH','','btn small')+' '+action('game-menu','MENU','','btn small')+' '+action('bag','BAG','','btn small')+'</div><div class="map-compass"><small>N</small><b>✧</b></div>'+miniMapHTML()+'<div class="dpad">'+['up','left','right','down'].map((d,i)=>action('step',['↑','←','→','↓'][i],d,'')).join('')+'</div><div class="map-hint" id="map-hint">'+esc(hint())+'</div>'+'<div class="map-coords" id="map-coords"></div></div><div class="world-toolbar"><div class="controls"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> move <span>·</span><kbd>E</kbd> interact <span>·</span><kbd>B</kbd> bag</div><div>'+action('bag','Bag','','btn ghost small')+'</div></div><div class="stat-strip"><div class="stat-block"><span class="stat-icon">♧</span><div><strong>'+s.seen.length+'</strong><small>Spirimon discovered</small></div></div><div class="stat-block"><span class="stat-icon">◇</span><div><strong>'+s.spirits.length+'</strong><small>Bonds sealed</small></div></div><div class="stat-block"><span class="stat-icon">⌖</span><div><strong>'+visited+'</strong><small>Regions explored</small></div></div><div class="stat-block"><span class="stat-icon">◉</span><div><strong>'+s.inventory.coins+'</strong><small>Coin</small></div></div></div></div><aside class="right-column">'+partyHTML()+'<section class="field-note"><div class="eyebrow">A SEALER’S FIELD NOTE</div><h3>Not every bond begins in battle.</h3><p>Approach a roaming Spirimon with an offering. A little patience can turn a wary encounter into a willing companion.</p></section><section class="panel quest-preview"><div class="section-label">ON YOUR PATH <small>OPTIONAL</small></div><h3>'+(s.quests.discovery?'Beyond the familiar':'First impressions')+'</h3><p>'+(s.quests.discovery?'Visit three regions, then speak to Scholar Elin.':'Discover five Spirimon species, then visit Scholar Elin.')+'</p><div class="progress-line"><i style="width:'+Math.min(100,(s.quests.discovery?visited/3:s.seen.length/5)*100)+'%"></i></div></section></aside></div>';}
function rankName(){return['','Initiate','Wayfarer','Binder','Warden','Spiritkeeper','Elder'][Math.min(6,s.rank)];}
function render(){if(!loaded)return;DEX.syncSpiridex(s);for(const u of battle?.multi?.enemies||[])if(!DEX.hasSpiridexForm(s,u.species,u.appearance))discover(spOf(u),u.appearance);clearUnifiedGesture();audio.setScene(O.offeringActive()?'offering':battle?'battle':'map');globalThis.spirimonSpecies=s.species;$('#main').innerHTML=view==='explore'?(battle?battleHTML():exploreHTML()):view==='spirits'?collectionHTML():view==='spiridex'?spiridexHTML():view==='atlas'?atlasHTML():journalHTML();document.querySelectorAll('.nav-button[data-action="view"]').forEach(b=>b.classList.toggle('active',b.dataset.value===view));$('#footer-seed').textContent='WORLD '+s.seed+' · LOCAL FIRST';$('.player-avatar').textContent=s.player.name.slice(0,1).toUpperCase();applyLayout();renderSpiritCanvases();if(battle&&view==='explore')drawBattle();}
function showModal(title,body,options={}){keys.clear();modal=options.kind||'generic';document.body.classList.add('modal-open');$('#modal-root').innerHTML='<div class="modal-overlay"><section class="modal '+(options.wide?'wide':'')+'" role="dialog" aria-modal="true" aria-label="'+esc(title)+'">'+(options.lock?'':action('close','×','','modal-close'))+'<div class="eyebrow">SPIRIMON · '+esc(options.label||'THE SEALER’S FRONTIER')+'</div><h2>'+esc(title)+'</h2>'+body+'</section></div>';renderSpiritCanvases($('#modal-root'));$('#modal-root button:not(.modal-close),#modal-root input')?.focus({preventScroll:true});}
function closeModal(){const dexFocus=modal==='spiridex'?dexReturnId:null;O.cancelOffering();audio.setScene(battle?'battle':'map');queuedStep=null;ritual=null;modal=null;document.body.classList.remove('modal-open');$('#modal-root').innerHTML='';keys.clear();if(view==='explore')$('#world')?.focus({preventScroll:true});else if(dexFocus)[...document.querySelectorAll('[data-action="spiridex-entry"]')].find(b=>b.dataset.value===dexFocus)?.focus({preventScroll:true});}
function starters(){showModal('Your first seal awaits.','<p>Welcome to Mossveil Crossing. You begin with no Spirimon. Find a roaming Spirimon, earn its trust through patience or an offering, then stabilize its tattoo seal.</p><label for="sealer-name">Your sealer’s name</label><input id="sealer-name" maxlength="24" placeholder="Your name"><div class="btn-row">'+action('begin-journey','Begin exploring','','btn primary')+'</div>',{lock:true,kind:'welcome'});}
function chooseStarter(id){const sp=s.species[id];if(!sp||s.starter)return;s.player.name=$('#sealer-name')?.value.trim().slice(0,24)||'Sealer';const i=E.heal(E.makeIndividual(sp,5),sp);i.bond=25;s.spirits.push(i);s.party.push(i.id);SE.ensureSealer(s);SE.autoAssignSupport(s);s.starter=true;discover(sp,i.appearance);closeModal();save();render();toast(sp.forms[0]+' is now attuned. Walk with WASD; press E to interact.');note('Formed the first bond with '+sp.forms[0]+'.');}
function spiridexHTML(){return spiridexPage(s,ROSTER,dexView,{esc,action,sprite,types:E.TYPES});}
function spiridexEntry(id,form){
 const entry=DEX.spiridexEntries(s,ROSTER).find(row=>row.id===id);if(!entry)return;
 dexReturnId=id;const content=spiridexDetail(entry,form,{esc,action,sprite,chip});showModal(content.title,content.body,{wide:true,kind:'spiridex'});
 const buttons=[...document.querySelectorAll('[data-action="spiridex-form"]')];buttons.find(b=>b.getAttribute('aria-pressed')==='true')?.focus({preventScroll:true});
}
function collectionHTML(){const all=s.spirits.filter(i=>{const sp=spOf(i);return(!search||sp.forms.join(' ').toLowerCase().includes(search)||sp.base.toLowerCase().includes(search)||sp.alter.toLowerCase().includes(search))&&(filter!=='attuned'||s.party.includes(i.id));});return'<section class="tattoo-screen"><div class="tattoo-heading"><h1>SPIRIMON TATTOOS</h1><span>'+s.party.length+' / 6 attuned</span>'+action('view','Return','explore')+'</div><p class="notice">'+(safe()?'A safe place. Train and attune your bonds; visit a Shrine for restoration.':'Visit a safe place to change attunement.')+'</p><div class="collection-toolbar"><input id="spirit-search" aria-label="Search Spirimon" placeholder="Find a Spirimon" value="'+esc(search)+'"><select id="spirit-filter" aria-label="Filter Spirimon"><option value="all">All tattoos</option><option value="attuned" '+(filter==='attuned'?'selected':'')+'>Attuned</option></select>'+(SW.nearbyShrine(s)?action('rest','Restore team'):'')+'</div><div class="tattoo-list">'+all.map(i=>{const sp=spOf(i);return'<button class="tattoo-row '+(s.party.includes(i.id)?'attuned':'')+'" data-action="detail" data-value="'+i.id+'">'+sprite(sp,i.appearance,112,i)+'<div><strong>'+esc(sp.forms[i.appearance])+'</strong><p>'+esc(sp.base)+' / '+esc(sp.alter)+' · '+esc(i.nature)+'</p>'+hpHTML(i,sp)+'</div><span>Lv. '+i.level+'<small>'+(s.party.includes(i.id)?'ATTUNED':'RESERVE')+'</small></span></button>';}).join('')+(!all.length?'<p class="notice">No tattoos yet. Approach a roaming Spirimon to begin your first bond.</p>':'')+'</div></section>';}
function detail(id){const i=s.spirits.find(i=>i.id===id);if(!i)return;const sp=spOf(i),st=E.stats(i,sp);spiritMoveReturn=null;showModal(sp.forms[i.appearance],'<div class="detail-top spirit-detail-top"><div class="spirit-portrait">'+sprite(sp,i.appearance,320,i)+'</div><div><div class="pill gold">Level '+i.level+' · Form '+(i.form+1)+'</div><div style="margin:10px 0">'+chip(sp.base)+chip(sp.alter)+sp.domains.map(d=>'<span class="chip">'+esc(d)+'</span>').join('')+'</div><p>'+esc(i.nature)+' · '+esc(sp.temperament)+'</p><p>Ability: '+esc(sp.ability)+'<br><span class="tiny">'+esc(({Steadfast:'Reduce incoming damage while guarded.',Wildheart:'Stronger physical moves.',Soulweave:'Stronger spiritual moves.','Second Wind':'Recover health once per battle when badly hurt.',Pressure:'Opposing Techniques cost 1 additional Stamina or Willpower per use.'})[sp.ability])+'</span><br>Bond '+i.bond+' · '+(s.party.includes(id)?'Attuned':'Resting in a tattoo')+'</p></div></div>'+artworkStatusHTML(sp)+'<p>'+esc(sp.description)+'</p><div class="detail-stats"><div><strong>'+st.hp+'</strong><small>Health</small></div><div><strong>'+st.power+'</strong><small>Energy power</small></div><div><strong>'+st.speed+'</strong><small>Speed</small></div></div>'+hpHTML(i,sp)+'<p>Aspect: '+esc(i.aspect||'Natural')+' · Equipment: '+esc(Q.heldEquipment(i)?.name||'None')+'</p><p class="tiny" style="margin-top:10px">Physical resistance: '+(sp.physicalRes<1?'Resistant':'Normal')+' · Spiritual resistance: '+(sp.spiritualRes<1?'Resistant':'Normal')+'<br>Next transformation: '+(i.form===2?'Final form unlocked':'level '+(i.form===0?16:36)+(sp.evolution==='bond'?' and bond 60':''))+' · XP '+i.xp+' / '+i.level*18+'</p><div class="subheading">APPEARANCE · COSMETIC ONLY</div><div class="form-row">'+sp.forms.map((f,n)=>'<button data-action="appearance" data-value="'+id+':'+n+'" '+(n>i.form?'disabled':'')+' class="'+(i.appearance===n?'selected':'')+'">'+sprite(sp,n,192)+'<small>'+(n>i.form?'Locked':esc(f))+'</small></button>').join('')+'</div>'+spiritMovesHTML(i,sp)+'<div class="btn-row">'+action('attune',s.party.includes(id)?'Unattune':'Attune Spirimon',id)+action('lead','Make lead Spirimon',id)+action('train','Train · 25 Coin',id)+action('passive-menu','Innate passives',id)+action('bond','Share offering',id)+action('learn-menu','Practice techniques',id)+action('transformation-menu','Alternative form',id)+action('equipment-menu','Held equipment')+'</div><p class="help-line">Design: '+(sp.source==='local-llm'?'local AI model':sp.atlas?'original shared lineage':'validated local lineage')+' · Art: '+(sp.atlas?'original three-form sprite set':creatureArtworkSource(sp,i.appearance)?'completed creature artwork':'awaiting finished artwork · mystery form')+'</p>');}
function spiritMovesHTML(individual,sp){
 return '<div class="subheading">EQUIPPED TECHNIQUES</div><div class="move-list spirit-move-list">'+E.equippedMoves(individual,sp).map((move,index)=>{const timing=RT.moveTiming(move,individual,sp),resource=E.moveCategory(move)==='Physical'?'Stamina':'Willpower';return '<button type="button" data-action="spirit-move-info" data-value="'+esc(individual.id+'|'+index)+'" aria-label="'+esc('View details for '+move.name)+'"><span>'+esc(move.name)+'<small> · '+esc(E.moveCategory(move))+'</small></span><small>Power '+timing.power+' · '+resource+' +'+E.moveBaseValue(move)+' · '+resource+' / use '+E.moveCost(move)+' · '+timing.timing.toUpperCase()+' '+seconds(timing.cooldownMs)+'</small><span class="move-info-chevron" aria-hidden="true">›</span></button>';}).join('')+'</div>';
}
function spiritMoveInfo(value){
 const split=value.lastIndexOf('|'),id=value.slice(0,split),index=Number(value.slice(split+1)),individual=s.spirits.find(i=>i.id===id);if(split<0||!individual||!Number.isInteger(index)||index<0)return;
 const sp=spOf(individual),move=E.equippedMoves(individual,sp)[index];if(!move)return;
 const profile=RT.moveTiming(move,individual,sp),lore=E.moveLore(move),category=E.moveCategory(move),resource=category==='Physical'?'Stamina':'Willpower';
 const target={opponent:'One enemy',self:'Self',ally:'One ally',allOpponents:'All enemies',allAllies:'All allies',field:'Battlefield'}[E.moveTarget(move)]||'One enemy';
 const effects=(Array.isArray(move.effect)?move.effect:[move.effect]).filter(Boolean).map(effect=>String(effect).replace(/([a-z])([A-Z])/g,'$1 $2')).join(', ')||'None';
 spiritMoveReturn={id,index,scrollTop:$('.modal')?.scrollTop||0};
 const facts=[['Category',category],['Type',move.type||'—'],['Domain',move.domain||'None'],['Power',profile.power],['Accuracy',Math.round(profile.accuracy*100)+'%'],['Target',target],['Resource cost',E.moveCost(move)+' '+resource],['Pool bonus','+'+E.moveBaseValue(move)+' '+resource],['Cooldown',profile.timing.toUpperCase()+' · '+seconds(profile.cooldownMs)],['Cast time',profile.castMs?seconds(profile.castMs):'Instant'],['Effects',effects]];
 if(profile.timing==='gcd'&&profile.localCooldownMs>0)facts.push(['Technique recast',seconds(profile.localCooldownMs)]);
 showModal(move.name,'<p class="move-info-description">'+esc(lore.description)+'</p>'+(lore.disruptionText?'<p>'+esc(lore.disruptionText)+'</p>':'')+'<p>'+esc(lore.context)+'</p><p class="help-line">For '+esc(sp.forms[individual.appearance])+' · Level '+individual.level+' · Normal style</p><dl class="move-info-grid">'+facts.map(([label,text])=>'<div><dt>'+esc(label)+'</dt><dd>'+esc(text)+'</dd></div>').join('')+'</dl><div class="btn-row">'+action('spirit-move-back','Back to Spirimon',id,'btn primary')+'</div>',{kind:'move-info'});
}
function spiritMoveBack(id){
 const previous=spiritMoveReturn;detail(id);const dialog=$('.modal');if(previous?.id===id&&dialog){dialog.scrollTop=previous.scrollTop;[...dialog.querySelectorAll('[data-action="spirit-move-info"]')].find(button=>button.dataset.value===id+'|'+previous.index)?.focus({preventScroll:true});}
}

function attune(id){if(battle)return toast('Finish the battle first.');if(!safe())return toast('Change attunement at a town or guild.');if(s.party.includes(id)){if(id===s.sealer?.leadId)return toast('Choose a different lead before storing this Spirimon.');if(s.party.length===1)return toast('Keep at least one Spirimon attuned.');s.party=s.party.filter(x=>x!==id);}else{if(s.party.length>=6)return toast('Six Spirimon are already attuned.');s.party.push(id);}SE.ensureSealer(s);SE.autoAssignSupport(s);save();detail(id);render();}
function gainSpirimonXP(individual,species,amount){
 const previousLevel=individual.level,previousForm=individual.form;
 return {...E.gainXP(individual,species,amount),individual,species,previousLevel,previousForm};
}
function levelUpHTML(changes){
 const leveled=changes.filter(change=>change.levels||change.evolved);if(!leveled.length)return '';
 return '<div class="level-up-list">'+leveled.map(change=>{const {individual:i,species:sp}=change;return '<article class="level-up-card" aria-label="'+esc(sp.forms[i.appearance])+(change.levels?' leveled up':' transformed')+'">'+sprite(sp,i.appearance,96,i)+'<div><h3>'+esc(sp.forms[i.appearance])+'</h3><p class="level-up-level"><strong>Level '+change.previousLevel+(change.levels?' → '+i.level:'')+'</strong></p>'+(change.evolved?'<p>Transformed: '+esc(sp.forms[change.previousForm])+' → '+esc(sp.forms[i.form])+'.</p>':'')+(change.learned?.length?'<p>New techniques: '+change.learned.map(move=>esc(move.name)).join(', ')+'. Practice at a safe place to equip them.</p>':'')+'</div></article>';}).join('')+'</div>';
}
function showTrainingAdvancement(change){
 if(!change.levels&&!change.evolved)return false;
 showModal(change.levels?'Level up!':'A new form awakens.',levelUpHTML([change])+'<div class="btn-row">'+action('detail','Continue',change.individual.id,'btn primary')+'</div>',{kind:'level-up'});return true;
}
function training(id){if(!safe())return toast('Train at a town or guild.');if(s.inventory.coins<25)return toast('Training costs 25 Coin.');const i=s.spirits.find(x=>x.id===id);if(!i)return;s.inventory.coins-=25;i.trained=Math.min(60,i.trained+2);i.bond=Math.min(100,i.bond+3);const previous=i.appearance,result=gainSpirimonXP(i,spOf(i),Math.max(1,Math.floor(Math.max(70,i.level*10)/4)));if(result.evolved)transformSpirit(spOf(i),previous,i.appearance);save();render();if(showTrainingAdvancement(result))return;detail(id);toast(result.learned?.length?'Techniques unlocked: '+result.learned.map(m=>m.name).join(', '):result.evolved?'A new transformation awakens!':result.levels?'Training complete. Level '+i.level+'.':'Training strengthens your bond and power.');}
function shareOffering(id){if(battle)return;if(s.inventory.offerings<1)return toast('You need an offering.');const i=s.spirits.find(x=>x.id===id);if(!i)return;s.inventory.offerings--;i.bond=Math.min(100,i.bond+12);SE.bondRecovery(s,i);const result=gainSpirimonXP(i,spOf(i),0);save();render();if(showTrainingAdvancement(result))return;detail(id);toast(result.learned?.length?'Transformation techniques unlocked: '+result.learned.map(m=>m.name).join(', '):result.evolved?'Your bond awakens a new transformation.':'Your bond deepens.');}
function rest(){if(battle||!SW.nearbyShrine(s))return toast('Visit a Shrine to restore your team.');const result=SE.beginRecovery(s,'restore',{shrineId:SW.nearbyShrine(s).id,safe:true});if(!result.ok)return toast(result.reason);questEvent('heal');s.safe={x:s.player.x,y:s.player.y};save();render();toast('Your attuned Spirimon are fully restored. This is now your recovery point.');}
function atlasHTML(){const c=E.coord(s.player.x,s.player.y),cells=[],radius=innerWidth<560?2:3;for(let dy=-radius;dy<=radius;dy++)for(let dx=-radius;dx<=radius;dx++){const cx=c.cx+dx,cy=c.cy+dy,reg=s.regions[cx+','+cy];cells.push(reg?.visited?'<button class="atlas-cell '+(!dx&&!dy?'current':'')+'" data-action="region-info" data-value="'+reg.key+'" style="background:'+reg.biome.color+'55"><small>'+cx+', '+cy+(reg.town?' · GUILD':'')+'</small><strong>'+esc(reg.name)+'</strong><small>'+esc(reg.biome.name)+' · Lv. '+reg.danger+'+</small></button>':'<div class="atlas-cell unknown" aria-label="Unexplored region">·</div>');}return'<div class="page-heading"><div><div class="eyebrow">THERE IS ALWAYS ANOTHER TRAIL</div><h1>Your world, unfolding.</h1><p>Discovered places stay where you left them. Walk beyond the edge to find more.</p></div><span class="pill">'+Object.values(s.regions).filter(r=>r.visited).length+' regions mapped</span></div><div class="panel"><div class="atlas-grid">'+cells.join('')+'</div><p class="help-line" style="text-align:center">Your location is outlined in gold. Region danger stays fixed as your Spirimon grow.</p></div>';}
function journalHTML(){const visited=Object.values(s.regions).filter(r=>r.visited).length,quests=[['discovery','First impressions','Discover five different Spirimon species, then report to Scholar Elin.',s.seen.length+'/5 species · Reward: 50 renown'],['rival','A friendly rivalry','Defeat Rowan in an organized guild battle.',s.wins+' victories · Reward: guild rank progress'],['explorer','Beyond the familiar','Visit three regions and share your findings with Scholar Elin.',visited+'/3 regions · Reward: 50 renown']];return'<div class="page-heading"><div><div class="eyebrow">NO DESTINY REQUIRED</div><h1>A journey of your own.</h1><p>Small promises, familiar faces, and whatever lies around the next bend.</p></div><span class="pill">Rank '+s.rank+' · '+s.rankXP+' / '+s.rank*100+' renown</span></div><div class="journal-grid"><div class="panel"><div class="section-label">GUILD NOTICES <small>ALL OPTIONAL</small></div>'+quests.map(([id,title,desc,progress])=>'<div class="quest '+(s.quests[id]?'quest-complete':'')+'"><h3>'+(s.quests[id]?'✓ ':'')+title+'</h3><p>'+desc+'</p><small>'+(s.quests[id]?'Completed':progress)+'</small></div>').join('')+'<div class="subheading">PEOPLE YOU KNOW</div>'+['Keeper Iona','Tavi','Rowan','Scholar Elin'].map((name,n)=>{const role=['keeper','merchant','rival','scholar'][n],value=Object.entries(s.friendships).filter(([k])=>k.startsWith(role)).reduce((sum,[,v])=>sum+v,0);return'<div class="friend-row"><span>'+name+'</span><span class="muted">'+(value>15?'Friend':value>3?'Acquaintance':'New face')+' · '+value+'</span></div>';}).join('')+'</div><div class="panel"><div class="section-label">FIELD JOURNAL</div>'+s.notes.slice(0,18).map(n=>'<p class="journal-entry">'+esc(n)+'</p>').join('')+'</div></div>';}

function buildingSpriteBlocked(x,y){
 const p=E.coord(x,y),entrance=E.caveEntrance(s.seed,p.cx,p.cy);
 if(entrance&&caveRimBlocked(entrance,x,y))return true;
 if(SW.shrinesForRegion(s.seed,p.cx,p.cy).some(shrine=>shrine.x===x&&shrine.y===y))return true;
 if(!E.region(s.seed,p.cx,p.cy).town)return false;
 return W.buildings(p.cx,p.cy).some(b=>W.buildingFootprintBlocked(b,x,y))||W.featureFootprintBlocked(p.lx,p.ly,p.cx,p.cy);
}
function caveEntranceHere(x=s.player.x,y=s.player.y){return E.caveEntranceAt(s.seed,x,y);}
const dungeonLayouts=new Map();
function dungeonLayout(room){const key=s.seed+'|'+room.id+'|'+room.level;if(!dungeonLayouts.has(key)){if(dungeonLayouts.size>=96)dungeonLayouts.delete(dungeonLayouts.keys().next().value);const map=E.caveMap(s.seed,room.id,room.level),floorKey=room.id+'|'+room.level;dungeonLayouts.set(key,{map,objects:EP.puzzleObjects(map,s.seed,floorKey,E.hash),features:EP.dungeonFeatures(map,s.seed,floorKey,E.hash,room.level),secret:EP.secretPassage(map,s.seed,floorKey,E.hash)});}return dungeonLayouts.get(key);}
function baseDungeonMap(room){return dungeonLayout(room).map;}
function dungeonMap(room){const layout=dungeonLayout(room),map=layout.map,state=s.dungeonState?.[room.id+'|'+room.level],passage=layout.secret;if(!state?.secretRevealed||!passage)return map;const grid=[...map.grid];grid[passage.y]=[...grid[passage.y]];grid[passage.y][passage.x]='floor';return {...map,grid};}
function caveObjects(room,map){s.caveChanges??={};const key=room.id+'|'+room.level,changes=s.caveChanges[key]||{};const base=dungeonLayout(room).objects;return EP.resolvedObjects(base,changes);}
function caveObstacle(x,y,dx,dy){const room=s.cave,map=dungeonMap(room),objects=caveObjects(room,map),obj=objects.find(o=>o.x===x&&o.y===y);if(!obj)return false;const key=room.id+'|'+room.level;s.caveChanges??={};s.caveChanges[key]??={};const changes=s.caveChanges[key];if(fieldCapability(obj.kind)&&fieldRelease(obj.kind,key+'|'+obj.id)){animateField(obj.kind,room.x,room.y);if(obj.kind==='push'){const nx=x+dx,ny=y+dy;if(E.caveWalkable(map,nx,ny)&&!objects.some(o=>o!==obj&&o.x===nx&&o.y===ny)&&!(nx===room.x&&ny===room.y)){const next=objects.map(o=>o===obj?{...o,x:nx,y:ny}:o);if(EP.reachableExits(map,next,{x:room.x,y:room.y})){changes[obj.id]={x:nx,y:ny};toast('Your Spirimon pushes the boulder.');}else{changes[obj.id]=null;toast('Your Spirimon shifts the boulder clear of the passage.');}}else{changes[obj.id]=null;toast('Your Spirimon moves the boulder off the trail.');}}else{changes[obj.id]=null;toast(obj.kind==='cleave'?'Your Spirimon cuts through the growth.':'Your Spirimon shatters the stone.');}}else{changes[obj.id]=null;toast(obj.kind==='push'?'You find a lever and roll the boulder aside.':obj.kind==='cleave'?'You untangle the roots using the old maintenance tools.':'You discover a fault line and dismantle the brittle barrier.');}if(room.temple&&room.level===0)dungeonState(room).solved=true;save();render();return true;}
function caveEnter(entrance){if(battle||modal||!entrance)return;s.mountedSteed=null;companionTrail.length=0;s.cave={id:entrance.id,depth:entrance.depth,level:0,x:1,y:1,outside:{x:s.player.x,y:s.player.y}};walkAnim=null;keys.clear();save();render();toast('You enter the cave. It is always night here.');}
function caveLeave(){const outside=s.cave.outside;delete s.cave;s.player.x=outside.x;s.player.y=outside.y;walkAnim=null;keys.clear();save();render();toast('You emerge into the open air.');}
function explorationStatusPulse(delta=0){
 const unit=lead();if(!unit||unit.hp<=0)return;
 unit.realtimeNow=s.sealer.clockMs;const result=RT.advanceExplorationAfflictions(unit,spOf(unit),delta);
 if(result.damage&&!unit.hp){s.mountedSteed=null;toast('Your following Spirimon collapses from its affliction. Use a recovery item.');}
}
function caveMove(dx,dy){if(modal||battle||view!=='explore')return;const room=s.cave,map=dungeonMap(room),x=room.x+dx,y=room.y+dy;if(walkAnim&&performance.now()-walkAnim.start<walkAnim.duration){queuedStep=[dx,dy];return;}if(!E.caveWalkable(map,x,y))return;if(caveObstacle(x,y,dx,dy))return;s.player.face=dx<0?'left':dx>0?'right':dy<0?'up':'down';companionTrail.push({x:room.x,y:room.y,face:s.player.face});if(companionTrail.length>24)companionTrail.shift();walkAnim={x:room.x,y:room.y,start:performance.now(),duration:running||keys.has('shift')?100:170};lastStep=performance.now();room.x=x;room.y=y;s.steps++;dungeonTileEvent();const tile=map.grid[y][x];if(tile==='up'){if(room.level===0)return caveLeave();room.level--;walkAnim=null;companionTrail.length=0;const above=E.caveMap(s.seed,room.id,room.level),entry=above.exits.find(e=>e.kind==='down');room.x=entry.x;room.y=entry.y;toast('You ascend to cave level '+(room.level+1));}else if(tile==='down'){if(room.temple&&room.level<3&&!dungeonState(room).solved)return toast('The stairway is sealed. '+(room.level===2?'Tablet: '+dungeonClue(room):'Inspect the counterweight or clear the physical trial.'));if(room.temple&&room.level<3){const e=encounterState(),key='temple-progress-'+room.temple;e[key]=Math.max(e[key]||0,room.level+1);}if(room.temple&&room.level>=3){const e=encounterState(),progressKey='temple-progress-'+room.temple,step=room.level;if((e[progressKey]||0)<=step){if(step===5){clanChallenge();return;}adventureBattle('temple-trainer',room.temple+'|'+step,Math.max(3,currentTemple().level-3));return;}}if(room.level+1>=room.depth)return caveLeave();room.level++;walkAnim=null;companionTrail.length=0;room.x=1;room.y=1;toast('You descend to cave level '+(room.level+1));}else if(tile==='exit')return caveLeave();else if(s.steps>(s.sanctuaryUntilStep||0)&&party().length&&s.steps>8&&Math.random()<.13*SE.encounterMultiplier(s.sealer,currentRegion().danger+s.cave.level*3)){const reg=currentRegion(),sp=speciesFor(reg,Math.random),ind=E.heal(E.makeIndividual(sp,E.encounterLevel(reg)+room.level*3,E.rollForm()),sp);startBattle(ind);}save();render();}
function drawCave(canvas,time){
 const rect=canvas.getBoundingClientRect(),width=Math.max(240,Math.round(rect.width/2)),height=Math.max(160,Math.round(rect.height/2));
 if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
 const ctx=canvas.getContext('2d'),room=s.cave,map=dungeonMap(room),size=32;
 const progress=walkAnim?movementProgress(time,walkAnim.start,walkAnim.duration):1;
 const moving=!!walkAnim&&progress<1;
 const vx=moving?walkAnim.x+(room.x-walkAnim.x)*progress:room.x,vy=moving?walkAnim.y+(room.y-walkAnim.y)*progress:room.y;
 mapCamera=updateMapCamera(mapCamera,{x:vx*size+16,y:vy*size+16,width,height,scene:'cave:'+room.id+':'+room.level,bounds:{width:map.width*size,height:map.height*size}});
 const ox=-mapCamera.left,oy=-mapCamera.top;
 ctx.imageSmoothingEnabled=false;ctx.fillStyle='#080b13';ctx.fillRect(0,0,width,height);
 if(!dungeonArtworkReady()){ctx.fillStyle='#d5ccb1';ctx.font='10px monospace';ctx.fillText('Preparing dungeon artwork…',12,24);return;}
 const atlasBiome=E.hash(s.seed,room.id,room.level)%4;
 const objects=caveObjects(room,map),features=currentDungeonFeatures(room),state=dungeonState(room),queue=[],lights=[];
 const occupied=new Set([...objects,...features,...map.exits].map(o=>o.x+','+o.y));
 const wallAt=(x,y)=>map.grid[y]?.[x]==='wall';
 const place=(name,px,py,w=32,h=w,z=py+31)=>queue.push({z,draw:()=>drawDungeonProp(ctx,name,px+(32-w)/2,py+32-h,w,h)});
 for(let y=0;y<map.height;y++)for(let x=0;x<map.width;x++){
  const t=map.grid[y][x],px=Math.round(ox+x*size),py=Math.round(oy+y*size);
  if(px<-size||py<-size||px>width||py>height)continue;
  const h=E.hash(s.seed,room.id,room.level,x,y),wall=t==='wall';
  let kind;
  if(t==='up'||t==='down'||t==='exit')kind=t==='exit'?15:14;
  else if(wall){
   const below=y+1<map.height&&map.grid[y+1][x]!=='wall';
   const left=x>0&&map.grid[y][x-1]!=='wall';
   const right=x+1<map.width&&map.grid[y][x+1]!=='wall';
   kind=below?(left?8:right?9:6):(left||right?7:10+h%2);
  }else kind=h%37===0?12:h%29===0?13:h%13===0?5:h%11===0?4:h%7===0?3:h%5===0?2:h%3===0?1:0;
  const neighbors={north:wall?map.grid[y-1]?.[x]&&!wallAt(x,y-1):wallAt(x,y-1),south:map.grid[y+1]?.[x]&&!wallAt(x,y+1),west:wall?map.grid[y]?.[x-1]&&!wallAt(x-1,y):wallAt(x-1,y),east:map.grid[y]?.[x+1]&&!wallAt(x+1,y)};
  drawDungeonAtlasTile(ctx,atlasBiome,kind,px,py,{tileX:x,tileY:y,temple:!!room.temple,neighbors});
  if(t==='up'||t==='down'||t==='exit')drawDungeonProp(ctx,t==='down'?'stairs-down':t==='exit'?'exit':'stairs-up',px,py,32,32);
  const nearWall=wall?!!neighbors.south:wallAt(x,y-1)||wallAt(x-1,y)||wallAt(x+1,y);
  const decor=dungeonDecoration(h,{wall,nearWall,temple:!!room.temple,occupied:occupied.has(x+','+y)||t!=='floor'&&!wall});
  if(decor){const small=['bones','rubble','mushrooms'].includes(decor),w=small?20:decor==='torch'?22:28;place(decor,px,py,w,decor==='stalagmites'?34:w);if(decor==='torch'||decor==='mushrooms')lights.push({x:px+16,y:py+20,cool:decor==='mushrooms',radius:decor==='torch'?40:24});}
 }
 for(const obj of objects){
  const px=ox+obj.x*size,py=oy+obj.y*size;if(px<-32||py<-32||px>width||py>height)continue;
  place(obj.kind==='push'?'boulder':obj.kind==='cleave'?'roots':'crystal',px,py,34,obj.kind==='crush'?40:34);
 }
 for(const f of features){
  const px=ox+f.x*size,py=oy+f.y*size;if(px<-32||py<-32||px>width||py>height)continue;
  const asset=dungeonFeatureSprite(f,state);
  if(f.kind==='rune'||f.kind==='hazard'){
   drawDungeonProp(ctx,asset,px,py,32,32);
   if(f.kind==='rune'&&(state.solved||f.order<state.runeStep))lights.push({x:px+16,y:py+16,cool:f.order!==0,radius:23});
  }else place(asset,px,py,32,f.kind==='inscription'||f.kind==='secret'?40:32);
 }
 const lead=party().find(u=>u.id===s.sealer?.leadId);
 if(lead&&companionTrail.length>=2){
  const step=companionTrail.length-2,from=companionTrail[step],to=companionTrail[step+1]||from;
  if(from&&to){const fx=from.x+(to.x-from.x)*(moving?progress:1),fy=from.y+(to.y-from.y)*(moving?progress:1);
   const face=to.x<from.x?'left':to.x>from.x?'right':to.y<from.y?'up':'down';
   const sp=spOf(lead),sz=companionSize(sp,lead.appearance).size;
   queue.push({z:oy+fy*size+30,draw:()=>{drawAspectAura(ctx,lead,ox+fx*size+16-sz/2,oy+fy*size+30-sz,sz);drawCompanion(ctx,sp,lead.appearance,ox+fx*size+16-sz/2,oy+fy*size+30-sz,sz,face,moving,progress);}});
  }
 }
 queue.push({z:oy+vy*size+30,draw:()=>drawPerson(ctx,ox+vx*size,oy+vy*size-5,'player',time,s.player.face,moving,adventureState().appearance)});
 queue.sort((a,b)=>a.z-b.z);for(const item of queue)item.draw();
 for(const light of lights)drawDungeonLight(ctx,light.x,light.y,time,light);
 if(fieldAnimation){const a=fieldAnimation,elapsed=time-a.start;if(elapsed<a.duration)drawFieldAnimation(ctx,a.kind,ox+a.x*size,oy+a.y*size,elapsed,a.duration);else fieldAnimation=null;}
 drawSpiritualPerception(ctx,x=>ox+x*size,y=>oy+y*size);
 const label=$('#map-location'),biome=$('#map-biome'),hint=$('#map-hint');
 if(label)label.textContent='Cave · Floor '+(room.level+1)+' / '+room.depth;
 if(biome)biome.textContent='NIGHT · UNDERGROUND';
 if(hint)hint.textContent=room.temple?'Temple floor '+(room.level+1)+'/6 · explore, clear obstacles, and reach the stairs':'Approach obstacles to use innate capabilities or alternative mechanisms';
}
function move(dx,dy){if(s.mountedSteed)validSteed();if(s.cave)return caveMove(dx,dy);if(s.interior)return moveInside(dx,dy);if(modal||battle||challengerApproach||view!=='explore'||!s.starter)return;if(walkAnim&&performance.now()-walkAnim.start<walkAnim.duration){queuedStep=[dx,dy];return;}const x=s.player.x+dx,y=s.player.y+dy;s.player.face=dx<0?'left':dx>0?'right':dy<0?'up':'down';const c=E.coord(x,y);const door=E.region(s.seed,c.cx,c.cy).town&&W.buildings(c.cx,c.cy).find(b=>b.doorX===x&&b.doorY===y);if(door&&dy===-1)return enterBuilding(door);const n=townNPCs(c.cx,c.cy).find(n=>n.x===x&&n.y===y);if(n)return;const caveEntry=caveEntranceHere(x,y);if(caveEntry)return caveEnter(caveEntry);const targetTile=E.tile(s.seed,x,y),terrainBlocked=targetTile!=='water'&&!E.walkable(targetTile,abilityReady('swim'),abilityReady('climb')),propBlocked=buildingSpriteBlocked(x,y);if(terrainBlocked||propBlocked)return;const water=targetTile==='water',wasWater=swimmingAt(s.player.x,s.player.y);if(water&&s.mountedSteed)s.mountedSteed=null;const waterMount=water?leadSwimmer():null;if(water&&!wasWater)animateField('swim',s.player.x,s.player.y);if(!water&&wasWater)animateField('swim',x,y);if(targetTile==='rock'&&!fieldRelease('climb','traverse:climb'))return toast('Not enough Energy to release a climber.');if(targetTile==='rock')animateField('climb',x,y);if(!['water','rock'].includes(targetTile)&&s.sealer.fieldTask?.key?.startsWith('traverse:'))delete s.sealer.fieldTask;companionTrail.push({x:s.player.x,y:s.player.y,face:s.player.face});if(companionTrail.length>24)companionTrail.shift();walkAnim={x:s.player.x,y:s.player.y,start:performance.now(),duration:water?(waterMount?(running||keys.has('shift')?95:170):680):s.mountedSteed?95:(running||keys.has('shift')?100:170)};lastStep=performance.now();const oldRegion=currentRegion();s.player.x=x;s.player.y=y;s.steps++;discoverRegion();if(E.coord(x,y).cx!==oldRegion.cx||E.coord(x,y).cy!==oldRegion.cy){if(challengeAtTransition(oldRegion,currentRegion()))return;}if(currentRegion().town)s.lastTown=currentRegion().key;const roamer=nearbyRoamer();if(roamer&&roamer.x===x&&roamer.y===y){approach(roamer);return;}if(!s.interior&&s.steps>(s.sanctuaryUntilStep||0)&&s.steps>8&&(targetTile==='grass'||isNight()||water)&&Math.random()<E.encounterChance(targetTile,isNight(),water)*SE.encounterMultiplier(s.sealer,currentRegion().danger)){const reg=currentRegion(),sp=speciesFor(reg,Math.random),form=E.rollForm();const ind=E.heal(E.makeIndividual(sp,E.encounterLevel(reg),form),sp);if(party().length)startBattle(ind);else{const encounter={id:'first-wild-'+s.steps,x,y,ind,active:true};(s.roamers[reg.key]||(s.roamers[reg.key]=[])).push(encounter);approach(encounter);}return;}$('#map-hint').textContent=hint();$('#map-location').textContent=currentRegion().name;$('#map-biome').textContent=(PLAYTEST?'PLAYTEST · ':'')+currentRegion().biome.name.toUpperCase();save();}
function interact(){if(modal||battle||!s.starter)return;if(s.cave){const t=E.caveMap(s.seed,s.cave.id,s.cave.level).grid[s.cave.y][s.cave.x];if(t==='up'&&s.cave.level===0||t==='exit')return caveLeave();return dungeonInteract();}const shrine=SW.nearbyShrine(s);if(shrine)return spiritualRecoveryMenu();const entrance=caveEntranceHere();if(entrance)return caveEnter(entrance);const pos=E.coord(s.player.x,s.player.y),door=!s.interior&&W.buildings(pos.cx,pos.cy).find(b=>b.doorX===s.player.x&&b.doorY===s.player.y-1);if(door)return enterBuilding(door);const drop=s.drops.find(d=>Math.abs(d.x-s.player.x)+Math.abs(d.y-s.player.y)<=1);if(drop){let found=null;if(drop.heldSeed){found=Q.awardHeldItem(heldState(),drop.heldSeed,drop.heldEvent,{level:drop.heldLevel||1,source:'Hidden supply cache'});if(found)note('Recovered Held Item: '+found.name);}for(const key of['seals','offerings','tonics','ethers','spiritDraughts'])s.inventory[key]+=drop.items[key]||0;s.drops=s.drops.filter(d=>d!==drop);save();render();toast(found?'Recovered '+found.name+' and supplies.':'Recovered your dropped supplies.');return;}const n=nearbyNPC();if(n)return talk(n);const r=nearbyRoamer();if(r)return approach(r);if(safe())return showModal('A moment to breathe.','<p>The guild lamps are lit. Adjust your tattoos or prepare for the next trail. Visit a Shrine to restore your Spirimon.</p><div class="btn-row">'+action('collection-close','Manage tattoos')+'</div>');toast('Move closer to a person or roaming Spirimon, then press E.');}
function approach(roamer){if(!roamerArtworkReady(roamer))return toast('This Spirimon’s artwork is not ready yet.');const sp=spOf(roamer.ind);discover(sp,roamer.ind.appearance);showModal('A Spirimon watches you.','<div class="detail-top">'+sprite(sp,roamer.ind.appearance,180)+'<div><h3>'+esc(sp.forms[roamer.ind.appearance])+'</h3>'+chip(sp.base)+chip(sp.alter)+'<p>Level '+roamer.ind.level+' · '+esc(sp.temperament)+'</p></div></div>'+artworkStatusHTML(sp)+'<p>'+esc(sp.description)+'</p><p style="margin-top:12px">You could challenge it, or give it a reason to trust you.</p><div class="btn-row">'+(lead()?action('wild-battle','Challenge',roamer.id,'btn primary'):'')+(s.spirits.length===0?action('free-first-seal','Seal as your first Spirimon · FREE',roamer.id,'btn primary'):'')+(!roamer.offeringAttempted?action('offer','Prepare an offering',roamer.id):'<p>Cooperation attempt already used.</p>')+action('close','Leave in peace','','btn ghost')+'</div>');save();}
function findRoamer(id){return Object.values(s.roamers).flat().find(r=>r.id===id);}
function cooperate(id){const r=findRoamer(id);if(!r?.active)return;const sp=spOf(r.ind),sealingEnergy=s.spirits.length?SE.sealInvestment(SE.ensureSealer(s),r.ind,sp,s.inventory.quality,0).base:0;audio.setScene('offering');O.prepareOffering({roamer:r,sp:{...sp,form:r.ind.form},energyCost:sealingEnergy,commitEnergy:()=>SE.spendEnergy(s.sealer,sealingEnergy),inventory:s.inventory,settings:s.settings,persist,notice:toast,open:(title,html)=>showModal(title,html,{kind:'offering'}),onSuccess:()=>{questEvent('offerings');capture(structuredClone(r.ind),id);closeModal();save();render();},onFailure:message=>{save();audio.setScene('map');showModal('The offering ends.','<p>'+esc(message)+' This individual cannot receive another offering. It remains available for battle and a battle seal.</p><div class="btn-row">'+(lead()?action('wild-battle','Challenge',id):'')+action('close','Leave')+'</div>');}});}
function sealPulse(){}
function newSealProfile(ind){const sp=spOf(ind),st=E.stats(ind,sp);const measurement=(v,unit)=>v==null?'Not yet recorded':esc(String(v))+' '+unit;showModal('New Spirimon discovered · '+sp.forms[ind.appearance],'<div class="detail-top">'+sprite(sp,ind.appearance,180)+'<div><h3>'+esc(sp.forms[ind.appearance])+'</h3>'+chip(sp.base)+chip(sp.alter)+'<p>Level '+ind.level+' · '+esc(ind.nature)+'</p><p>Height: '+measurement(sp.height,'')+'<br>Weight: '+measurement(sp.weight,'')+'</p></div></div><div class="detail-stats"><div><strong>'+st.hp+'</strong><small>HP</small></div><div><strong>'+st.power+'</strong><small>Power</small></div><div><strong>'+st.speed+'</strong><small>Speed</small></div><div><strong>'+st.pp+'</strong><small>Stamina</small></div><div><strong>'+st.willpower+'</strong><small>Willpower</small></div></div><div class="subheading">BEHAVIOR</div><p>Temperament: '+esc(sp.temperament||'Unknown')+' · Nature: '+esc(ind.nature)+'<br>Ability: '+esc(sp.ability||'Unknown')+'</p><div class="subheading">FIELD DESCRIPTION</div><p>'+esc(sp.description||'No field description recorded.')+'</p><p class="help-line">Height and weight will appear when recorded in the species field guide.</p><div class="btn-row">'+action('close','Continue exploring','','btn primary')+action('view','View Spirimon collection','spirits')+'</div>',{wide:true});}
function capture(ind,roamer){const sp=spOf(ind);if(s.spirits.some(i=>i.id===ind.id))return;const firstOfSpecies=!s.spirits.some(i=>i.species===ind.species);ind.bond=25;E.heal(ind,sp);s.spirits.push(ind);if(s.party.length<6)s.party.push(ind.id);SE.ensureSealer(s);SE.autoAssignSupport(s);s.captured++;discover(sp,ind.appearance);for(const q of E.questTemplates()){const record=questState()[q.id];if(record&&typeof record==='object')s.questLog[q.id]=E.advanceQuest(s,q,record);}if(roamer)removeRoamer(roamer);note('Sealed a bond with '+sp.forms[ind.appearance]+'.');renown(20);if(s.spirits.length===1&&!challengerState().firstTriggered){challengerState().firstTriggered=true;queueMicrotask(()=>{if(!battle&&!modal)startChallenger('rival');});}save();toast(sp.forms[ind.appearance]+' is sealed into a new tattoo.');if(firstOfSpecies)queueMicrotask(()=>newSealProfile(ind));}
function renown(value){s.rankXP+=value;while(s.rank<6&&s.rankXP>=s.rank*100){s.rankXP-=s.rank*100;s.rank++;note('Earned guild rank '+s.rank+': '+rankName()+'.');}}
function talk(n){s.friendships[n.id]??=0;const intro=s.friendships[n.id]>15?'It’s good to see you again, '+s.player.name+'. ':'';let body='';if(n.role==='resident')body='<p>Come in, traveler. Our doors are open to sealers. Spirimon respond to patience: offer food, watch their mood, and let trust grow before attempting a seal.</p><div class="btn-row">'+action('chat','Share a story',n.id)+'</div>';if(n.role==='keeper')body='<p>'+esc(intro)+'A seal is a promise, not a prison. There’s room for many bonds beneath your skin, but six can travel with you, and three can fight together.</p><div class="btn-row">'+action('collection-close','Attune tattoos')+action('chat','Share a story',n.id)+'</div>';
if(n.role==='merchant')body='<p>'+esc(intro)+'A full pack makes for a longer trail. What do you need?</p><p style="margin-top:10px;color:var(--gold)">'+s.inventory.coins+' Coin available</p><div class="btn-row">'+action('buy','Seal catalyst · 12 Coin','seals')+action('buy','Offering · 8 Coin','offerings')+action('buy','Tonic · 10 Coin','tonics')+action('buy','Soul draught · 16 Coin','ethers')+action('buy','Spiritual draught · 20 Coin','spiritDraughts')+action('buy','Herbs · 5 Coin','herbs')+action('buy','Incense · 8 Coin','incense')+action('buy','Ore · 6 Coin','ore')+action('buy','Improve seals · 100 Coin','quality')+'</div><div class="modal-section"><p>Bring three spare catalysts and I’ll trade you a tonic.</p><div class="btn-row">'+action('trade-items','Trade 3 catalysts → 1 tonic')+action('chat','Share a story',n.id)+'</div></div>';
if(n.role==='rival')body='<p>'+esc(intro)+'I’ve been training. Ready for a friendly match? Guild matches follow your rank, so neither of us gets too comfortable.</p><div class="btn-row">'+action('trainer','Battle Rowan','','btn primary')+action('npc-trade','Trade Spirimon')+action('chat','Share a story',n.id)+'</div>';
if(n.role==='scholar')body='<p>'+esc(intro)+'Each Spirimon is a question the world hasn’t answered yet. Bring me your discoveries; I’ll help fund the next expedition.</p><div class="btn-row">'+action('claim','Report five species','discovery')+action('claim','Report three regions','explorer')+action('chat','Share a story',n.id)+'</div>';if(['merchant','scholar'].includes(n.role))body+='<div class="btn-row">'+action('held-shop','Browse Held Items')+'</div>';if(['keeper','scholar','resident','rival','merchant'].includes(n.role))body+='<div class="modal-section">'+action('quest-board','View local requests',n.role)+'</div>';s.activeNPC=n;showModal(n.name,body+(['keeper','scholar'].includes(n.role)?'<div class="btn-row">'+action('support-trainer','Spiritual instruction',n.id)+action('support-prepare','Prepare support')+'</div>':''),{label:n.role==='merchant'?'TRAIL SUPPLIES':'A FAMILIAR FACE'});}
function chat(id){const last=s.chatSteps?.[id]??-100;if(s.steps-last<10)return toast('You’ve caught up for now. Come back after exploring.');s.chatSteps??={};s.chatSteps[id]=s.steps;s.friendships[id]=(s.friendships[id]||0)+4;renown(5);note('Shared a story with '+s.activeNPC.name+'.');save();toast('Your friendship with '+s.activeNPC.name+' grows.');}
function buy(item){const cost={seals:12,offerings:8,tonics:10,ethers:16,spiritDraughts:20,herbs:5,incense:8,ore:6,quality:100}[item];if(!cost)return;if(s.inventory.coins<cost)return toast('Not enough Coin.');if(item==='quality'&&s.inventory.quality>=3)return toast('Your seal catalysts are already masterwork quality.');s.inventory.coins-=cost;s.inventory[item]=(s.inventory[item]||0)+1;save();talk(s.activeNPC);render();toast(item==='quality'?'Seal quality improved.':'Supplies added to your bag.');}
function claim(which){const ready=which==='discovery'?s.seen.length>=5:Object.values(s.regions).filter(r=>r.visited).length>=3;if(s.quests[which])return toast('You’ve already received this reward.');if(!ready)return toast('Keep exploring. Your discoveries will be here when you return.');s.quests[which]=true;awardEquipment('report-item-'+which,'Scholar’s reward',s.rank*10,'Uncommon');renown(50);note('Completed '+(which==='discovery'?'First impressions':'Beyond the familiar')+'.');save();talk(s.activeNPC);render();toast('Report accepted. +50 renown.');}
function tradeSpirit(){if(battle||!safe())return;const spare=s.spirits.filter(i=>!s.party.includes(i.id));if(!spare.length)return toast('Keep a Spirimon in reserve to offer Rowan a trade.');const offer=spare[0],sp=speciesFor(currentRegion(),Math.random),incoming=E.heal(E.makeIndividual(sp,Math.max(3,offer.level)),sp);s.trade={out:offer.id,incoming};showModal('A fair exchange.','<p>Rowan offers '+esc(sp.forms[0])+' (Lv. '+incoming.level+') for your reserve '+esc(spOf(offer).forms[offer.appearance])+'.</p><div style="text-align:center">'+sprite(sp,0,160)+'</div><div class="btn-row">'+action('confirm-trade','Accept trade','','btn primary')+action('close','Keep my Spirimon','','btn ghost')+'</div>');}
function bag(){showModal('Ready for the trail.','<p>Your supplies travel with you. Tavi sells more in town.</p><div class="bag-grid"><div><strong>'+s.inventory.seals+'</strong><small>Seal catalysts</small></div><div><strong>'+s.inventory.offerings+'</strong><small>Offerings</small></div><div><strong>'+s.inventory.tonics+'</strong><small>Tonics</small></div></div><p style="margin-top:20px">Herbs: '+(s.inventory.herbs||0)+' · Incense: '+(s.inventory.incense||0)+' · Ore: '+(s.inventory.ore||0)+'<br>Coin: '+s.inventory.coins+' · Seal quality: '+['','Standard','Refined','Masterwork'][s.inventory.quality]+'</p><div class="btn-row">'+action('tonic','Use tonic on lead Spirimon')+action('ether','Restore Stamina and Willpower · '+(s.inventory.ethers||0))+action('spiritual-draught','Restore Sealer Energy · '+(s.inventory.spiritDraughts||0))+action('equipment-menu','Held Item inventory')+action('held-item-menu','Use Held Item')+action('export','Export save backup','','btn ghost')+'</div><p class="help-line">Tonics restore half a Spirimon’s maximum health. During battle, using one takes your action.</p>');}
function useTonic(){if(battle?.rt){const ctx=realTimeContext(),u=ctx.active.a.find(u=>u.hp<E.stats(u,spOf(u)).hp&&RT.actionAvailability(battle.rt,u,spOf(u),{type:'item'}).ok);if(!u)return toast('No ally can use a tonic now.');battle.controlledAlly=u.id;closeModal();return submitRealTimeAction({type:'item',item:'tonic',targetIndex:(battle.multi?.allies||[battle.ally]).indexOf(activeBattleAlly().id)});}if(!s.inventory.tonics)return toast('No tonics remaining.');const i=battle?s.spirits.find(x=>x.id===battle.ally):lead();if(!i)return toast('No active Spirimon can receive a tonic.');const max=E.stats(i,spOf(i)).hp;if(i.hp>=max)return toast('Your Spirimon is already healthy.');s.inventory.tonics--;i.hp=Math.min(max,i.hp+Math.ceil(max*.5));closeModal();if(battle)enemyOnly('You use a tonic.');else{save();render();toast('Your lead Spirimon recovers health.');}}

function questState(){s.questLog??={};return s.questLog;}
function adventureState(){s.adventure??={crests:[],bosses:[],legends:[],champion:false,charms:{},appearance:{skin:1,outfit:0,hair:0},arcade:0};A.competitionState(s.adventure);s.adventure.training??={};s.adventure.variants??={};return s.adventure;}
function adventureMenu(){const a=adventureState(),next=A.nextClan(a.crests),eligible=A.championshipEligibility(a.crests,s.rank,a.guildTrials,a.champion).ok;showModal('The Sealer’s Path','<p>Earn all eight Clan Crests, defeat the faction leaders and enter the Grand Championship.</p><p>Clan Crests: '+a.crests.length+'/8 · Faction leaders: '+a.bosses.length+'/3 · Legendary bonds: '+a.legends.length+' · '+(a.champion?'Champion of the Seals · '+a.titleDefenses+' title defenses':'Aspiring Sealer')+'</p><p>Next Clan: '+esc(next?.name||'All Crests earned')+'</p><div class="btn-row">'+action('guild-trials','Guild trials')+action('temple-rematches','Clan rematches')+action('temple-enter','Explore Clan Temple','','btn primary')+action('faction-story','Investigate hostile faction')+action('legend-ritual','Perform legendary ritual')+(eligible?action('championship','Grand Championship'):'')+action('equipment-menu','Spirimon charms')+action('appearance-menu','Appearance')+action('specialty-menu','Training specialties')+action('rare-variants','Rare variants')+action('interior-menu','Explore buildings')+action('multi-arena','Double Spirimon arena')+action('facility-menu','Battle facility')+action('arcade-menu','Side activities')+'</div>');}
function encounterState(){const a=adventureState();a.encounters??={};return a.encounters;}
function currentTemple(){const a=adventureState(),p=E.coord(s.player.x,s.player.y),base=A.templeAt(s.seed,p.cx,p.cy),slot=Math.min(7,a.crests.length);return {...base,id:'clan-'+slot,crest:A.CLANS[slot].crest,level:Math.max(6+slot*7,s.rank*3+slot*5+5),sequence:slot};}
function templeInterior(){const a=adventureState();if(a.crests.length>=8)return adventureMenu();const t=currentTemple();showModal(t.name+' · '+t.philosophy,'<p>Explore six physical dungeon floors, solve environmental obstacles with Spirimon capabilities or alternate mechanisms, defeat two Temple Sealers, and challenge the Master.</p><p>Regional Temple '+(t.sequence+1)+'/8 · Level '+t.level+' · Progress persists when you retreat.</p><div class="btn-row">'+action('temple-map-enter','Enter Temple Dungeon','','btn primary')+action('adventure-menu','Return')+'</div>');}
function factionCampaign(){const a=adventureState(),f=A.FACTIONS.find(x=>!a.bosses.includes(x.id));if(!f)return toast('All faction campaigns are complete.');const key='story-'+f.id,e=encounterState(),stage=e[key]||0;const scenes=['Follow the faction scouts','Infiltrate the supply outpost','Break the binding apparatus','Confront '+f.leader];showModal(f.name+' · Chapter '+(Math.min(stage,3)+1),'<p>'+scenes[Math.min(stage,3)]+'</p><p>'+esc(f.motive)+'. Your actions determine whether the faction can complete its plan.</p><div class="btn-row">'+(stage<3?action('faction-scene','Advance the investigation',key,'btn primary'):action('faction-boss','Enter the command arena',f.id,'btn primary'))+action('adventure-menu','Retreat')+'</div>');}
function legendaryRitual(){const p=E.coord(s.player.x,s.player.y),legend=A.legendAt(s.seed,p.cx,p.cy,isNight(),mapWeather().kind);if(!legend)return legendChallenge();if(!legend.available)return toast('The ritual requires the proper weather and hour.');const sp=legendarySpecies(legend.id);if(!hasFinishedArtwork(sp)){if(s.settings.aiEnabled)queueFresh(currentRegion(),Math.random,true,sp);save();return showModal(legend.title,artworkStatusHTML(sp)+'<p>The binding rite will be available when its finished artwork is ready. No ritual Energy has been spent.</p>');}const key='ritual-'+legend.id,e=encounterState(),stage=e[key]||0;const steps=['Trace the ancient seal','Offer your Spirimon bond','Align the celestial sigils','Face the awakened legend'];showModal(legend.title+' · Binding Rite','<p>'+steps[Math.min(stage,3)]+'</p><p>Ritual stage '+(Math.min(stage,3)+1)+' of 4. The seal remembers each completed stage.</p><div class="btn-row">'+(stage<3?action('ritual-stage','Complete ritual stage · '+(5+stage*3)+' SE',key,'btn primary'):action('ritual-boss','Enter the legendary arena',legend.id,'btn primary'))+action('adventure-menu','Withdraw')+'</div>');}
function battleFacility(){const a=adventureState();a.facilityWins??=0;a.facilityRecords??={};showModal('Competitive Battle Facilities','<p>Choose a circuit. Wins advance real matches; losses end the attempt. Health, resources and Energy carry between rounds. Draft selects three companions. Survival bans consumables; Challenge Hall rotates restrictions weekly.</p>'+A.FACILITY_TYPES.map(f=>{const c=A.facilityChallenge(f.id,a.facilityRecords[f.id]||0,s.seed);return '<div class="modal-section"><b>'+esc(f.name)+'</b> · '+esc(f.rule)+'<p>Victories: '+(a.facilityRecords[f.id]||0)+' · Next opponent level '+c.level+' · '+esc(c.modifier)+' · Circuit '+((a.facilityRuns[f.id]?.round||0)+1)+' / '+f.rounds+' · Best '+(a.facilityBest[f.id]||0)+'</p>'+action('facility-battle','Enter '+f.name,f.id,'btn primary')+'</div>';}).join('')+action('adventure-menu','Return'))}
function adventureBattle(kind,id,level){if(!party().length)return toast('Form a bond first.');const reg=currentRegion(),r=E.rng(E.hash(s.seed,'adventure',kind,id,s.wins)),sp=kind==='legend'?legendarySpecies(id):speciesFor(reg,r);if(!hasFinishedArtwork(sp)){if(s.settings.aiEnabled)queueFresh(reg,r,true,sp);save();return showModal(sp.forms[0],artworkStatusHTML(sp)+'<p>The encounter will be available when its finished artwork is ready.</p>');}const enemy=E.heal(E.makeIndividual(sp,level,level>=36?2:level>=16?1:0,r),sp);startBattle(enemy,null,kind!=='legend',{sealerId:'adventure:'+kind+':'+id});if(battle){battle.adventure={kind,id};if(kind!=='legend'){const count=kind==='faction'?4:kind==='clan'?Math.min(6,3+Math.floor(adventureState().crests.length/3)):2;const team=[battle.enemy,...Array.from({length:count-1},()=>{const other=speciesFor(reg,r);return E.heal(E.makeIndividual(other,level,level>=36?2:level>=16?1:0,r),other);})];configureEnemyRoster(team);}battle.boss={phase:0,shield:kind==='legend'?2:kind==='championship'?3:1,reinforcements:kind==='faction'?2:kind==='championship'?3:0};battle.log.unshift('A decisive '+kind+' challenge begins!');save();render();}}
function clanChallenge(){const a=adventureState();if(a.crests.length>=8)return adventureMenu();const t=currentTemple(),e=encounterState();if((e['temple-progress-'+t.id]||0)<5)return toast('Complete the prescribed Temple trials first.');adventureBattle('clan',t.id,t.level);}
function factionChallenge(){const a=adventureState(),f=A.FACTIONS.find(f=>!a.bosses.includes(f.id));if(!f)return toast('All known faction leaders have been defeated.');if(a.crests.length<Math.floor(f.level/10))return toast('Earn more Clan Crests before confronting this faction.');adventureBattle('faction',f.id,f.level);}
function legendChallenge(){const a=adventureState(),p=E.coord(s.player.x,s.player.y),legend=A.legendAt(s.seed,p.cx,p.cy,isNight(),mapWeather().kind);if(!legend)return toast('No legendary presence is known in this region. Explore distant wilds.');if(!legend.available)return toast('The ancient Spirimon waits for different weather or darkness.');if(a.legends.includes(legend.id))return toast('You have already overcome this legend.');adventureBattle('legend',legend.id,legend.level);}
function heldState(){return Q.heldItemState(s);}
function awardEquipment(eventId,source,level=1,rarity=null){const item=Q.awardHeldItem(heldState(),s.seed+'|'+eventId,eventId,{source,level,...(rarity?{rarity}:{})});if(item){if(battle){battle.itemFinds??=[];battle.itemFinds.push(item.name);}note('Found Held Item: '+item.name+' · '+item.rarity);toast('Held Item acquired: '+item.name);}return item;}
let heldRecipient='',heldCategory='all';
function itemIcon(item){return {'Weapons and shields':'⚔','Armor and clothing':'▣','Magical foci and relics':'✦','Tools and utility gear':'⚙','Charms and talismans':'◈','Consumables':'●'}[item.category]||'◈';}
function heldCard(item,buttons='',extra=''){return '<article class="held-card rarity-'+(Q.ITEM_RARITIES.includes(item.rarity)?item.rarity.toLowerCase():'legacy')+'"><div class="held-card-title"><span class="held-icon" aria-hidden="true">'+itemIcon(item)+'</span><div><b>'+esc(item.name)+'</b><small>'+esc(item.rarity||'Legacy')+' · '+esc(item.category||'Charms and talismans')+'</small></div></div>'+(item.lore?'<p class="held-lore">'+esc(item.lore)+'</p>':'')+'<p>'+esc(Q.heldItemDescription(item))+'</p><small>'+esc(item.requires?.types?.length?'Requires '+item.requires.types.join(' or ')+' in either type position':item.requires?.domains?.length?'Requires '+item.requires.domains.join(' or ')+' Domain':'Universal equipment')+'</small>'+extra+'<div class="btn-row">'+buttons+'</div></article>';}
function equipmentMenu(){
 const state=heldState(),ind=s.spirits.find(i=>i.id===heldRecipient)||party()[0]||s.spirits[0];heldRecipient=ind?.id||'';
 const current=ind?Q.heldEquipment(ind):null,stock=Object.values(state.inventory).filter(r=>r.count>0&&(heldCategory==='all'||r.item.category===heldCategory)).sort((a,b)=>Q.ITEM_RARITIES.indexOf(b.item.rarity)-Q.ITEM_RARITIES.indexOf(a.item.rarity)||a.item.name.localeCompare(b.item.name));
 showModal('Held Items','<p>One Held Item per Spirimon. Most are universal. Visible grasping anatomy unlocks specialized equipment without increasing item bonuses. Equip at safe places; activate through Bag during battle.</p><div class="held-toolbar"><label>Spirimon <select id="held-recipient">'+s.spirits.map(i=>'<option value="'+i.id+'" '+(i.id===heldRecipient?'selected':'')+'>'+esc(spOf(i).forms[i.appearance])+' · Lv.'+i.level+'</option>').join('')+'</select></label><label>Category <select id="held-category"><option value="all">All categories</option>'+Q.ITEM_CATEGORIES.map(c=>'<option '+(heldCategory===c?'selected':'')+'>'+esc(c)+'</option>').join('')+'</select></label></div>'+(current?'<h3>Equipped</h3>'+heldCard(current,action('held-equip','Unequip',heldRecipient+'|none')):'<p>No Held Item equipped.</p>')+'<h3>Inventory · '+stock.reduce((n,r)=>n+r.count,0)+' item(s)</h3><div class="held-catalog">'+stock.map(({item,count})=>{const eligibility=ind?Q.canEquipHeldItem(item,spOf(ind)):{ok:false,reason:'Choose a Spirimon.'};return heldCard(item,(eligibility.ok?action('held-equip','Equip',heldRecipient+'|'+item.id):'')+action('held-inspect','Details',item.id)+(safe()&&!battle?action('held-sell','Sell · '+Math.max(1,Math.floor((item.cost||50)*.35))+' Coin',item.id):''),'<p class="held-stock">Owned: '+count+(eligibility.ok?'':' · '+esc(eligibility.reason))+'</p>');}).join('')+'</div>'+(!stock.length?'<p>Find items in treasure, earn rewards, or visit a Held Item merchant.</p>':''),{wide:true});
}
function heldInspect(id){const record=heldState().inventory[id],item=record?.item||s.spirits.map(i=>Q.heldEquipment(i)).find(x=>x?.id===id);if(!item)return;showModal(item.name,heldCard(item,action('equipment-menu','Return to inventory'),'<p>Source: '+esc(item.source||'Original equipment')+'</p>'),{wide:true});}
function currentHeldShop(){const state=heldState(),specialist=['forge','herbalist','archive'].includes(s.interior?.kind)?s.interior.kind:'general';return Q.heldShop(state,s.seed,currentRegion().key,s.rank,specialist);}
function heldShopMenu(){if(battle||!safe())return toast('Visit a town merchant to purchase Held Items.');const offers=currentHeldShop();showModal('Held Item merchant','<p>'+s.inventory.coins+' Coin · Regional stock persists in your save. Guild advancement reveals new stock.</p><div class="held-catalog">'+offers.map(o=>heldCard(o.item,o.remaining>0?action('held-shop-buy','Buy · '+o.item.cost+' Coin',o.item.id):'<span>Sold out</span>','<p>In stock: '+o.remaining+'</p>')).join('')+'</div>'+action('equipment-menu','Your equipment'),{wide:true});save();}
function heldItemMenu(){
 if(!battle)return equipmentMenu();if(actionBusy||battle.pendingSwitch)return;const actor=activeBattleAlly(),item=Q.heldEquipment(actor,spOf(actor));if(!item)return toast('This Spirimon has no compatible Held Item.');
 const activation=Q.heldItemActivation(actor,spOf(actor));let controls='';
 if(activation.ok){const kind=E.moveTarget(activation.move),friendly=['self','ally','allAllies'].includes(kind),targets=battle.multi?(friendly?battle.multi.allies.map(id=>s.spirits.find(i=>i.id===id)):battle.multi.enemies):[friendly?actor:battle.enemy];
 controls=targets.map((target,n)=>({target,n})).filter(({target})=>target?.hp>0&&(kind!=='self'||target.id===actor.id)).map(({target,n})=>action('held-activate','Use on '+esc(spOf(target).forms[target.appearance]),actor.id+'|'+n)).join('');if(['self','field','allAllies','allOpponents'].includes(kind))controls=action('held-activate','Activate '+esc(activation.move.name),actor.id+'|'+(friendly&&battle.multi?battle.multi.allies.indexOf(actor.id):0));
 }
 showModal('Bag · '+spOf(actor).forms[actor.appearance],heldCard(item,controls,'<p>'+esc(activation.ok?'Activation uses this Spirimon’s normal action. Its four equipped techniques stay unchanged.':activation.reason)+'</p>')+action('close','Return to battle'),{wide:true});
}
function activateHeldFromBag(value){if(!battle?.rt)return;const [id,target]=value.split('|');if(activeBattleAlly()?.id!==id)return;closeModal();return submitRealTimeAction({type:'heldItem',targetIndex:Number(target)||0,commit});}
function awardBattleEquipment(won){
 const state=heldState(),kind=won.adventure?.kind,id=won.adventure?.id;
 if(['clan','faction','legend','championship'].includes(kind))awardEquipment('boss-item-'+kind+'-'+id,kind+' victory',won.enemy.level,kind==='legend'||kind==='championship'?'Relic':'Epic');
 else if(!won.trainer){const eventId='wild-item-'+won.enemy.id;if(E.hash(s.seed,eventId)%100<28)awardEquipment(eventId,'Wild battle spoils',won.enemy.level);const worn=Q.heldEquipment(won.enemy);if(worn&&!state.claims['dropped-'+won.enemy.id]){state.claims['dropped-'+won.enemy.id]=worn.id;Q.addHeldItem(state,worn);won.itemFinds??=[];won.itemFinds.push(worn.name);note('Recovered '+worn.name+' from the wild encounter.');}}
 else if(kind==='facility'){const wins=adventureState().facilityRecords?.[id]||0;if(wins%3===0)awardEquipment('facility-item-'+id+'-'+wins,'Facility milestone',won.enemy.level,'Rare');}
}

function appearanceMenu(){const a=adventureState();showModal('Customize your Sealer','<p>Choose your character’s appearance. Changes persist in your save.</p><div class="btn-row">'+['skin','outfit','hair'].map(k=>action('appearance-change','Change '+k,k)).join('')+'</div>');}
function interiorMenu(){const e=encounterState(),type=e['building-type']||'guild',room=e['building-room']||0;const rooms={guild:['Foyer','Training Hall','Healing Wing','Archive','Master Office','Roof Garden'],market:['Shopfront','Workshop','Storeroom','Cellar','Merchant Office','Hidden Vault'],inn:['Reception','Common Room','Kitchen','Guest Rooms','Attic','Secret Passage']};const names=rooms[type];showModal(type.toUpperCase()+' · '+names[room],'<p>Explore each connected chamber. Secrets and supplies are hidden within the buildings.</p><div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px">'+names.map((name,n)=>'<button data-action="interior-step" data-value="'+n+'" '+(Math.abs(n%3-room%3)+Math.abs(Math.floor(n/3)-Math.floor(room/3))>1?'disabled':'')+' style="min-height:75px;'+(n===room?'outline:3px solid gold;':'')+'">'+(n===room?'◆ ':'')+esc(name)+'</button>').join('')+'</div><div class="btn-row">'+['guild','market','inn'].map(k=>action('interior-type',k,k)).join('')+action('interior-search','Search room')+action('adventure-menu','Exit building')+'</div>');}
function multiArena(){if(!party().length)return toast('Form a bond first.');const r=E.rng(E.hash(s.seed,'multi-arena',s.wins)),foes=Array.from({length:6},(_,n)=>{const sp=speciesFor(currentRegion(),r);return BAI.prepareOpponent(E.heal(E.makeIndividual(sp,Math.max(5,s.rank*3+5+n),0,r),sp),sp,s.rank,r);});startBattle(foes[0],null,true,{sealerId:'facility:multi'});configureEnemyRoster(foes);battle.log.push('Up to three creatures per side. Release additional allies when you choose.');save();render();}
function transformationMenu(id){const i=s.spirits.find(x=>x.id===id);if(!i)return;showModal('Aspects · '+esc(spOf(i).forms[i.appearance]),'<p>Unlock an aspect once, then change freely at safe places. An aspect changes combat behavior and its aura; your lineage and chosen appearance remain yours.</p><div class="aspect-catalog">'+Object.entries(Q.ASPECTS).map(([name,a])=>{const eligible=Q.aspectEligibility(i,name);return '<article class="'+(i.aspect===name?'selected':'')+'"><b>'+esc(name)+(i.aspect===name?' · Active':'')+'</b><p>'+esc(a.desc)+'</p><small>'+(eligible.ok?(eligible.cost?'Unlock · '+eligible.cost+' Coin':'Unlocked'):esc(eligible.reason))+'</small>'+action('transform-aspect',i.aspect===name?'Active':eligible.cost?'Unlock and awaken':'Awaken',id+'|'+name)+'</article>';}).join('')+'</div>');}
function reconcileEquipmentStats(i,before){const now=E.stats(i,spOf(i));i.hp=Math.max(0,Math.min(i.hp,now.hp));E.normalizeResources(i,spOf(i));}

function specialtyMenu(){const a=adventureState();showModal('Spirimon Training Specialties','<p>Assign a permanent training focus to a bonded Spirimon for 100 Coin. Each focus strengthens a different approach.</p>'+party().map(i=>'<div class="modal-section"><b>'+esc(spOf(i).forms[i.appearance])+'</b> · '+esc(i.specialty||'Untrained')+'<div class="btn-row">'+['Guardian','Striker','Mystic','Sprinter'].map(k=>action('specialty-train',k,i.id+'|'+k)).join('')+'</div></div>').join(''));}
function rareVariantMenu(){const a=adventureState();showModal('Rare Spirimon Variants','<p>Each Spirimon has a persistent rare signature. Discover variants through exploration and training.</p>'+s.spirits.slice(0,30).map(i=>'<p>'+esc(spOf(i).forms[i.appearance])+' · '+(i.rareVariant?'✦ Radiant variant':'Standard')+'</p>').join(''));}
function arcadeMenu(){sideActivity=null;const a=adventureState(),records=a.activityRecords||{};showModal('Guild side activities','<p>Observation, rhythm practice, regional jobs and nighttime festivals. Participation is free; rewards follow skill and completed work.</p>'+Object.entries(records).map(([kind,r])=>'<p>'+esc(kind)+': '+r.wins+' successes / '+r.attempts+' attempts · Best '+Math.round(r.best*100)+'%</p>').join('')+'<div class="btn-row">'+action('activity-start','Sigil observation','observation')+action('activity-start','Rhythm practice','rhythm')+action('regional-jobs','Regional jobs')+(currentRegion().town&&isNight()?action('activity-start','Lantern Festival','festival'):'')+action('adventure-menu','Return')+'</div>');}

function questBoard(role){
 const quests=E.questTemplates().filter(q=>q.role===role),log=questState();
 for(const q of quests)if(log[q.id]&&typeof log[q.id]==='object')log[q.id]=E.advanceQuest(s,q,log[q.id]);
 showModal('Local requests','<p>Accept requests from locals, complete their objectives in order, then return for your reward. Higher-tier requests require guild rank.</p>'+quests.map(q=>{
 const record=log[q.id],completed=record==='completed',active=record&&typeof record==='object',eligible=E.questEligible(s,q),stage=E.questStage(s,q,record);
 const step=q.steps[Math.min(stage.index,q.steps.length-1)],requirements=q.requirements?.rank?' · Guild rank '+q.requirements.rank+' required':'';
 const progress=completed?'Completed':stage.complete?'Ready to claim':active?'Stage '+(stage.index+1)+'/'+q.steps.length+' · '+stage.progress+'/'+step.count+' '+step.goal:'Not accepted';
 return '<div class="modal-section"><b>'+esc(q.title)+'</b><p>'+esc(q.difficulty)+' · '+q.steps.length+' stage(s)'+esc(requirements)+'</p><p>'+esc(q.description)+'</p><p>'+esc(progress)+'</p><p>Reward: '+Object.entries(q.reward).map(([k,v])=>v+' '+esc(k)).join(' · ')+' · Procedural Held Item</p><div class="btn-row">'+(completed?'Completed':!record?(eligible?action('quest-accept','Accept request',q.id):'Locked · Reach rank '+q.requirements.rank):stage.complete?action('quest-claim','Claim reward',q.id):'In progress')+'</div></div>';
 }).join(''));save();
}
function questAction(id,claim=false){
 const q=E.questTemplates().find(x=>x.id===id);if(!q)return;
 const log=questState();
 if(claim){
  if(!log[id]||typeof log[id]!=='object')return;
  log[id]=E.advanceQuest(s,q,log[id]);
  if(!E.questStage(s,q,log[id]).complete)return;
  for(const [item,amount] of Object.entries(q.reward)){if(item==='coins')s.inventory.coins+=amount;else s.inventory[item]=(s.inventory[item]||0)+amount;}
  awardEquipment('quest-item-'+id,'Quest: '+q.title,Math.max(5,s.rank*10),q.requirements?.rank>=4?'Epic':q.requirements?.rank>=2?'Rare':'Uncommon');log[id]='completed';SE.gainSealerXP(s,40,'quest:'+id);SE.awardAttribute(s.sealer,'quest:'+id,{attribute:'control',points:1});const learnedSupport=SE.learnSupport(s,'quest:'+id,'Quest discovery');if(learnedSupport)note('Learned '+learnedSupport.name);note('Completed quest: '+q.title);save();questBoard(q.role);return;
 }
 if(log[id]||!E.questEligible(s,q))return;
 log[id]={stage:0,baseline:E.questMetric(s,q.steps[0].goal)};
 note('Accepted quest: '+q.title);save();questBoard(q.role);
}
function questEvent(goal){s.questCounters??={};s.questCounters[goal]=(s.questCounters[goal]||0)+1;for(const q of E.questTemplates()){const record=questState()[q.id];if(record&&typeof record==='object')s.questLog[q.id]=E.advanceQuest(s,q,record);}}
function challengerState(){s.challengers??={rivalMatches:0,villainMatches:0,rivalLevel:0,villainLevel:0,villainWins:0,firstTriggered:false,lastTransition:''};return s.challengers;}
function challengeAtTransition(oldRegion,newRegion){if(!s.spirits.length||battle||s.interior||modal)return false;const state=challengerState();const oldTown=oldRegion?.town,newTown=newRegion?.town;if(!oldTown&&!newTown)return false;const transition=oldRegion.key+'>'+newRegion.key;if(state.lastTransition===transition)return false;state.lastTransition=transition;const kind=E.challengerRoll(s.seed,s.steps,transition,state.rivalMatches+state.villainMatches);if(!kind)return false;if(kind==='villain'&&Math.random()>SE.encounterMultiplier(s.sealer,newRegion.danger))return false;startChallenger(kind);return true;}
function challengerTeam(kind,level,count,reg){
 const size=E.challengerTeamSize(count,level);
 const team=[];
 for(let n=0;n<size;n++){
  const r=E.rng(E.hash(s.seed,'challenger-team',kind,n,Math.floor(count/2)));
  const sp=speciesFor(reg,r);
  const lv=Math.max(reg.minLevel||reg.danger||1,level+(n%3===0?1:0));
  const form=lv>=36?2:lv>=16?1:0;
  team.push(E.heal(E.makeIndividual(sp,lv,form,r),sp));
 }
 return team;
}
let challengerApproach=null;
function approachEntry(kind){
 const x=s.player.x,y=s.player.y;
 const sides=[[x-7,y],[x+7,y],[x,y-5],[x,y+5]];
 const candidates=sides.flatMap(([sx,sy],side)=>{const a=[];for(let radius=0;radius<=4;radius++)for(const offset of radius===0?[0]:[-radius,radius]){
 const tx=side<2?sx: sx+offset,ty=side<2?sy+offset:sy;
 if(Math.abs(tx-x)+Math.abs(ty-y)<4)continue;
 if(E.walkable(E.tile(s.seed,tx,ty),true,true)&&!buildingSpriteBlocked(tx,ty))a.push({x:tx,y:ty,score:radius*3+Math.abs(tx-x)+Math.abs(ty-y)});
 }return a;});
 candidates.sort((a,b)=>a.score-b.score);
 return candidates[0]||{x:x-5,y};
}
function challengerPath(from,to){
 const queue=[from],visited=new Set([from.x+','+from.y]),previous=new Map(),dirs=[[0,1],[1,0],[-1,0],[0,-1]];
 const goal=p=>Math.abs(p.x-to.x)+Math.abs(p.y-to.y)<=1;
 let found=null;
 for(let head=0;head<queue.length&&head<450;head++){
  const p=queue[head];if(goal(p)){found=p;break;}
  for(const [dx,dy] of dirs){const x=p.x+dx,y=p.y+dy,key=x+','+y;if(visited.has(key)||Math.abs(x-from.x)>15||Math.abs(y-from.y)>12||!E.walkable(E.tile(s.seed,x,y),true,true)||buildingSpriteBlocked(x,y))continue;visited.add(key);previous.set(key,p);queue.push({x,y});}
 }
 if(!found)return [];
 const path=[];for(let p=found;p&&!(p.x===from.x&&p.y===from.y);p=previous.get(p.x+','+p.y))path.unshift(p);
 return path;
}
function startChallenger(kind){
 if(!lead()||battle||challengerApproach||challengerState().pending)return;
 const state=challengerState(),reg=currentRegion(),levels=party().map(i=>i.level),average=levels.reduce((a,b)=>a+b,0)/Math.max(1,levels.length),previous=state[kind+'Level']||0,level=E.challengerLevel(average,reg.minLevel||reg.danger||1,previous),count=state[kind+'Matches']||0,team=challengerTeam(kind,level,count,reg),dialogue=E.CHALLENGER_DIALOGUE[kind],speech=dialogue[E.hash(s.seed,kind,count,reg.key)%dialogue.length];
 state[kind+'Matches']=count+1;state[kind+'Level']=level;
 state.pending={kind,team,enemy:team[0],dialogue:speech};
 const entry=approachEntry(kind),path=challengerPath(entry,s.player);
 challengerApproach={kind,x:entry.x,y:entry.y,path,stepAt:performance.now()+350,started:performance.now(),face:'down'};
 queuedStep=null;keys.clear();save();render();
}
function advanceChallenger(time){
 const a=challengerApproach;if(!a||battle||modal)return;
 if(time<a.stepAt)return;
 if(a.path.length){const next=a.path.shift();a.face=next.x>a.x?'right':next.x<a.x?'left':next.y>a.y?'down':'up';a.x=next.x;a.y=next.y;a.stepAt=time+230;return;}
 if(Math.abs(a.x-s.player.x)+Math.abs(a.y-s.player.y)>2&&time-a.started<9000){a.path=challengerPath({x:a.x,y:a.y},s.player);a.stepAt=time+230;if(a.path.length)return;}
 challengerApproach=null;
 const pending=challengerState().pending;if(!pending)return;
 showModal(a.kind==='rival'?'Rowan challenges you!':'An enemy agent confronts you!','<p>'+esc(pending.dialogue)+'</p><p>'+pending.team.length+' Spirimon · Levels '+pending.team.map(i=>i.level).join(', ')+'</p><div class="btn-row">'+action('challenger-fight','Face the challenge','','btn primary')+'</div>');
}
function beginChallenger(){const pending=challengerState().pending;if(!pending)return;challengerState().pending=null;challengerApproach=null;startBattle(pending.team[0],null,true,{sealerId:'challenger:'+pending.kind});if(battle){battle.challenger=pending.kind;configureEnemyRoster(pending.team);battle.teamTotal=pending.team.length;battle.log=[pending.kind==='rival'?'Rowan challenges you!':'An enemy agent challenges you!',...battle.log];save();render();}}
function startBattle(enemy,roamer=null,trainer=false,options={}){
 s.mountedSteed=null;
 if(!party().length)return toast('Form your first bond before challenging a Spirimon.');
 closeModal();const q=SE.ensureSealer(s);SE.beginSealerBattle(q);SE.autoAssignSupport(s);delete q.fieldTask;party().forEach(i=>E.resetCombat(i));enemy=structuredClone(enemy);E.resetCombat(enemy);
 if(!trainer)equipWildItem(enemy,spOf(enemy));else BAI.prepareOpponent(enemy,spOf(enemy),s.rank,E.rng(E.hash(s.seed,enemy.id,'loadout')));
 discover(spOf(enemy),enemy.appearance);battle={enemy,enemyRoster:[enemy],ally:lead()?.id||s.party[0],roamer,trainer,round:1,log:[trainer?'A Sealer challenges you.':'A wild '+spOf(enemy).forms[enemy.appearance]+' draws near.'],rt:RT.createRealTimeState(q.clockMs),multi:{allies:[],enemies:[],reserves:[enemy],orders:{}},participants:[],rtAnimations:[]};
 battle.sealerKey=options.sealerId||'trainer:'+enemy.species;battle.enemySealer=trainer?persistentEnemySealer(battle.sealerKey,[enemy]):null;
 const ctx=realTimeContext(),climate=s.cave?null:mapWeather().kind,weather=climate==='heat'?'sun':climate==='clear'?null:climate;E.bindBattlefield(ctx.teams.a,ctx.teams.b,{weather,ambientWeather:weather});RT.deploySpirimon(battle.rt,ctx,'b',enemy);
 const first=party().find(i=>i.id===q.leadId&&i.hp>0)||party().filter(i=>i.hp>0).sort((a,b)=>SE.manifestationCost(q,a,spOf(a))-SE.manifestationCost(q,b,spOf(b)))[0];
 if(first){const result=RT.deploySpirimon(battle.rt,ctx,'a',first);if(result.ok)battle.participants.push(first.id);}
 applyRealTimeContext(ctx);ensureRealTimeBattle();commit=first?.commit??.5;style='normal';selectedMove=0;movePreviewKey=null;battleMode=ctx.active.a.length?'main':'deploy';view='explore';save();render();
}
function trainerBattle(){const r=E.rng(E.hash(s.seed,'rowan',s.rank,s.wins)),sp=speciesFor(currentRegion(),r);startBattle(E.heal(E.makeIndividual(sp,4+s.rank*3,0,r),sp),null,true,{sealerId:'rowan'});}

function combatTagsHTML(i){return battleView.combatTagsHTML(...arguments);}
function doubleHUDsHTML(){return battleView.doubleHUDsHTML(...arguments);}

function battleHTML(){if(!battle)return '';if(!battle.rt||battle.rt.version!==2)ensureRealTimeBattle();return realTimeBattleHTML();}


function currentBattleLayout(canvas=$('#battle-canvas')){
 return battleStageLayout({height:canvas?.height||550,compact:globalThis.matchMedia?.('(pointer:coarse), (max-width:1024px), (max-height:600px)').matches||false,multi:!!battle?.multi,
  allies:(battle?.multi?.allies||[battle?.ally]).map(id=>s.spirits.find(i=>i.id===id)),enemies:battle?.multi?.enemies||[battle?.enemy]});
}
function positionBattleHUDs(canvas,layout){
 const stage=canvas.parentElement;if(!stage)return;
 const signature=[layout.compact,canvas.height,...['a','b'].flatMap(side=>layout[side].map(p=>side+p.slot))].join('|');
 if(stage.dataset.battleLayout===signature)return;stage.dataset.battleLayout=signature;
 stage.classList.toggle('compact-battle-scene',layout.compact);
 for(const panel of stage.querySelectorAll('.classic-hud')){
  const side=panel.classList.contains('ally')?'a':'b',slot=Number(panel.className.match(/slot-(\d+)/)?.[1]||0),point=layout[side].find(p=>p.slot===slot);
  panel.hidden=!point;if(!point||!layout.compact)continue;panel.dataset.battleCount=layout[side].length;
  for(const [key,value]of Object.entries(point.hud))panel.style.setProperty('--battle-hud-'+key.replace(/[A-Z]/g,c=>'-'+c.toLowerCase()),value+'%');
 }
 stage.style.setProperty('--battle-log-top',layout.b.length===3?'40%':'3%');
 stage.style.setProperty('--battle-log-left',layout.b.length===3?'2%':'auto');
 stage.style.setProperty('--battle-log-right',layout.b.length===3?'auto':'2%');
}
function drawBattle(anim=null){
 const canvas=$('#battle-canvas');if(!canvas||!battle)return;const rect=canvas.getBoundingClientRect(),H=Math.max(240,Math.round(1000*rect.height/Math.max(1,rect.width)));if(canvas.height!==H)canvas.height=H;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;
 const reg=currentRegion(),ash=reg.biome.kind==='ash',fen=reg.biome.kind==='fen';
 const colors=ash?['#c4b77c','#b1a765','#9d9656','#8f8849']:fen?['#9bc6aa','#7bb797','#5c9c7c','#4d8968']:['#c1f49a','#a5e677','#89d461','#74c34e'];
 c.fillStyle=colors[0];c.fillRect(0,0,1000,H);
 for(let band=0;band<20;band++){c.fillStyle=colors[Math.min(3,Math.floor(band/6))];c.fillRect(0,Math.floor(band*H/20),1000,Math.ceil(H/20));for(let n=0;n<9;n++){c.fillStyle=band%2?'#d5e8a51c':'#285d2f14';c.fillRect((n*137+band*39)%1000,band*H/20+8,75+band*4,3);}}
 const platform=(x,y,rx,ry)=>{c.fillStyle=ash?'#8e7851':fen?'#47795d':'#5d8e42';c.beginPath();c.ellipse(x,y,rx,ry+6,0,0,Math.PI*2);c.fill();c.fillStyle=ash?'#c8b785':fen?'#97bd8e':'#b7c881';c.beginPath();c.ellipse(x,y-5,rx-4,ry,0,0,Math.PI*2);c.fill();c.fillStyle=ash?'#aa9a67':fen?'#5d9a70':'#82ae57';for(let n=0;n<70;n++){const r=E.rng(E.hash(x,n)),a=r()*Math.PI*2,d=Math.sqrt(r());c.fillRect(x+Math.cos(a)*d*(rx-12),y-5+Math.sin(a)*d*(ry-6),3+Math.floor(r()*6),2);}c.fillStyle='#477f3e';for(let n=0;n<32;n++){const a=n*Math.PI*2/32,xx=x+Math.cos(a)*(rx-4),yy=y-5+Math.sin(a)*ry;c.fillRect(xx,yy-3,2,6);}};
 const layout=currentBattleLayout(canvas);positionBattleHUDs(canvas,layout);
 for(const side of ['b','a'])for(const point of layout[side]){
  const unit=(side==='a'?(battle.multi?.allies||[battle.ally]).map(id=>s.spirits.find(i=>i.id===id)):battle.multi?.enemies||[battle.enemy])[point.slot];
  const {x,ground,size,rx,ry}=point,offset=anim?.side===side&&(anim.actor??0)===point.slot?anim.offset:0;
  platform(x,ground,rx,ry);drawAspectAura(c,unit,x-size/2,ground-size,size);
  drawBattleSpirit(c,spOf(unit),unit.appearance,x-size/2+offset,ground-size,size,side);
 }
}

function battleTeams(){return battleSession.battleTeams(...arguments);}

function enemyOnly(message){if(!battle)return;if(message)battle.log.push(message);battle.message=message||battle.message;save();render();}

function drawnBattle(){recordCompetitionDefeat();endCombatState();battle=null;party().forEach(i=>E.heal(i,spOf(i)));s.player.x=s.safe.x;s.player.y=s.safe.y;delete s.cave;delete s.interior;save();render();showModal('Both bonds fall quiet.','<p>Both teams were overcome together. The match ends in a draw. You return to safety without a victory reward or defeat penalty.</p>'+action('close','Continue'));}
function endCombatState(){if(!battle)return;SE.endSealerBattle(s.sealer);if(battle.enemySealer){SE.endSealerBattle(battle.enemySealer);battle.enemySealer.lastSeenClock=s.sealer.clockMs;}const teams=battleTeams();for(const u of [...teams.allies,...teams.enemies]){if(battle.rt)RT.preserveAfflictions(battle.rt,u);else E.resetCombat(u);}}

function advanceBossPhase(){if(!battle?.boss||battle.enemy.hp<=0)return;const boss=battle.boss,max=E.stats(battle.enemy,spOf(battle.enemy)).hp,ratio=battle.enemy.hp/max;if(boss.phase===0&&ratio<=.65){boss.phase=1;boss.shield=Math.max(0,boss.shield-1);battle.enemy.ward=true;battle.enemy.pp=Math.min(E.stats(battle.enemy,spOf(battle.enemy)).pp,(battle.enemy.pp||0)+15);battle.log.push('The arena seal erupts! The boss raises a ward and restores 15 Stamina.');}else if(boss.phase===1&&ratio<=.3){boss.phase=2;boss.shield=0;battle.enemy.battleStyle='strong';battle.enemy.status=null;battle.log.push('FINAL PHASE: the boss shatters its ward and fights without restraint!');}battle.message=battle.log.at(-1);}

function winBattle(){endCombatState();const won=battle,ally=s.spirits.find(i=>i.id===won.ally),sp=spOf(ally),rewards=battleRewards(won,s.rank),xp=rewards.xp,previous=ally.appearance,result=gainSpirimonXP(ally,sp,xp),advancements=[result];if(result.evolved)transformSpirit(sp,previous,ally.appearance);for(const id of won.participants||[])if(id!==ally.id){const member=s.spirits.find(i=>i.id===id);if(member){advancements.push(gainSpirimonXP(member,spOf(member),xp));member.bond=Math.min(100,member.bond+4);}}ally.bond=Math.min(100,ally.bond+4);s.wins++;SE.gainSealerXP(s,rewards.sealerXP);if(won.adventure){SE.trainSealer(s,'victory:'+won.adventure.kind+':'+won.adventure.id,{ritual:true});const learned=SE.learnSupport(s,'victory:'+won.adventure.kind+':'+won.adventure.id,'Encounter discovery');if(learned)note('Discovered support technique: '+learned.name);}if(won.adventure){const a=adventureState(),{kind,id}=won.adventure;if(kind==='temple-trainer'){const [templeId,step]=id.split('|'),e=encounterState(),key='temple-progress-'+templeId;if((e[key]||0)<=Number(step))e[key]=Number(step)+1;note('Temple Sealer defeated. The next trial opens!');}if(kind==='clan'&&!a.crests.includes(id)){if(s.cave?.temple===id)caveLeave();a.crests.push(id);note('Earned '+A.CLANS.find(c=>c.id===id)?.crest+'!');}if(kind==='faction'&&!a.bosses.includes(id)){a.bosses.push(id);s.inventory.coins+=200;note('Defeated a hostile faction leader!');}if(kind==='legend'&&!a.legends.includes(id)){a.legends.push(id);s.inventory.ethers=(s.inventory.ethers||0)+3;note('An ancient legend has been overcome!');}if(kind==='facility'){a.facilityWins=(a.facilityWins||0)+1;a.facilityRecords??={};const facilityId=A.FACILITY_TYPES.some(f=>f.id===id)?id:'arena';a.facilityRecords[facilityId]=(a.facilityRecords[facilityId]||0)+1;s.inventory.coins+=A.facilityChallenge(facilityId,a.facilityRecords[facilityId],s.seed).reward;note('Won ranked facility match '+a.facilityWins+'!');}if(kind==='guild-trial'&&!a.guildTrials.includes(id)){a.guildTrials.push(id);note('Completed Guild trial: '+id);}if(kind==='facility'){const progress=A.recordFacilityResult(a,id,true);const run=a.facilityRuns[id];if(run){run.vitality=Object.fromEntries(party().map(u=>[u.id,{hp:u.hp,pp:u.pp,willpower:u.willpower}]));run.energy=s.sealer.energy;}if(progress.complete)note('Facility circuit complete!');}if(kind==='championship'){const progress=A.recordChampionshipResult(a,true);if(progress.complete){s.inventory.coins+=1000;note('You are Champion of the Seals!');}else note('Championship match won. Continue to '+A.CHAMPIONSHIP_STAGES[a.championship.stage].name+'.');}}for(const q of E.questTemplates()){const record=questState()[q.id];if(record&&typeof record==='object')s.questLog[q.id]=E.advanceQuest(s,q,record);}const reward=rewards.coins;if(reward)s.inventory.coins+=reward;renown(won.trainer?45:12);if(won.trainer&&!s.quests.rival){s.quests.rival=true;s.friendships['rival-0,0']=(s.friendships['rival-0,0']||0)+8;}if(won.challenger==='villain')challengerState().villainWins=(challengerState().villainWins||0)+1;if(won.challenger==='rival')challengerState().rivalWins=(challengerState().rivalWins||0)+1;awardBattleEquipment(won);if(won.roamer)removeRoamer(won.roamer);battle=null;ensurePlayerOnPath();note('Won '+(won.trainer?'a guild match':'a wild battle')+' with '+sp.forms[ally.appearance]+'.');save();render();showModal(advancements.some(change=>change.levels)?'Level up!':advancements.some(change=>change.evolved)?'A new form awakens.':'A bond grows stronger.',levelUpHTML(advancements)+(advancements.some(change=>change.levels||change.evolved)?'':'<div style="text-align:center">'+sprite(sp,ally.appearance,180)+'</div>')+'<p>You earned '+(reward?reward+' Coin and ':'')+xp+' experience.'+(won.itemFinds?.length?' Held Items: '+won.itemFinds.map(esc).join(', ')+'.':'')+(result.evolved?' Previous forms remain available as cosmetic appearances.':'')+(!result.levels&&!result.evolved&&result.learned?.length?' New techniques unlocked: '+result.learned.map(m=>esc(m.name)).join(', ')+'. Practice at a safe place to equip them.':'')+'</p><div class="btn-row">'+(['facility','championship'].includes(won.adventure?.kind)?action('competition-continue','Continue competition',won.adventure.kind):'')+action('close','Continue exploring','','btn primary')+'</div>');}
function loseBattle(){recordCompetitionDefeat();endCombatState();const items={seals:Math.floor(s.inventory.seals/3),offerings:Math.floor(s.inventory.offerings/3),tonics:Math.floor(s.inventory.tonics/3),ethers:Math.floor((s.inventory.ethers||0)/3)};for(const k of Object.keys(items))s.inventory[k]-=items[k];items.spiritDraughts=Math.floor((s.inventory.spiritDraughts||0)/3);s.inventory.spiritDraughts-=items.spiritDraughts;s.drops.push({x:s.player.x,y:s.player.y,items});const cost=Math.min(s.inventory.coins,20+s.rank*5);s.inventory.coins-=cost;const sanctuary=SW.recoveryShrine(s,t=>SE.recoveryAvailable(s,'restore',t.id).ok);s.player.x=sanctuary.x;s.player.y=sanctuary.y+1;s.safe={x:s.player.x,y:s.player.y};delete s.interior;delete s.cave;SE.beginRecovery(s,'restore',{shrineId:sanctuary.id,safe:true});battle=null;save();render();showModal('Back at the Shrine.','<p>A passing sealer brought you to a Shrine for restoration. Recovery cost '+cost+' Coin. Your dropped supplies are waiting where you fell; press E nearby to retrieve them.</p><div class="btn-row">'+action('close','Continue your journey','','btn primary')+'</div>');}
function battleSeal(extra=battle?.sealExtra||0,targetId=null,approved=false){
 if(!battle||battle.trainer||battle.rt.paused)return;const target=targetId?battle.multi.enemies.find(u=>u.id===targetId):battle.multi.enemies[battle.enemyTargetSelection||0]||battle.enemy;if(!target||target.hp<=0)return toast('Select a living wild Spirimon.');
 if(s.inventory.seals<1)return toast('No seal catalysts remain.');const quote=SE.sealInvestment(s.sealer,target,spOf(target),s.inventory.quality,extra);if(!quote.ok)return toast('This attempt costs '+quote.cost+' Spiritual Energy.');if(SE.vowViolation(s.sealer,'seal',{extra:quote.extra})&&!approved)return warnVow(()=>battleSeal(extra,targetId,true));if(!claimRealTimeUtility(3500))return;if(approved)SE.breakVow(s.sealer,true);
 const result=SE.commitSeal(s.sealer,target,spOf(target),s.inventory.quality,extra);if(!result.ok)return toast(result.reason);s.inventory.seals--;battle.sealExtra=0;RT.synchronizeTimers(battle.rt,realTimeContext());
 if(result.success){if(battle.adventure?.kind==='legend'){const a=adventureState();if(!a.legends.includes(battle.adventure.id))a.legends.push(battle.adventure.id);}const roamer=battle.roamer;endCombatState();battle=null;capture(target,roamer);save();render();}else{battle.log.push('The seal breaks. '+result.cost+' Spiritual Energy and one catalyst were spent.');save();render();}
}

function profile(){const q=SE.ensureSealer(s);showModal(s.player.name+', '+rankName(),spiritualEnergyHTML(q)+'<p>Sealer level '+q.level+' · XP '+q.xp+' / '+(80+q.level*20)+'<br>Guild rank '+s.rank+' · '+s.wins+' victories<br>Lead: '+esc(s.spirits.find(u=>u.id===q.leadId)?spOf(s.spirits.find(u=>u.id===q.leadId)).forms[s.spirits.find(u=>u.id===q.leadId).appearance]:'None')+' · free manifestation<br>Training milestones '+q.training+' · Ritual discoveries '+q.rituals.length+'</p><p>At zero Energy: 15% base exhaustion, reduced by bond. Any positive Energy removes it. The lead can always be released.</p><div class="btn-row">'+action('support-prepare','Prepare support')+action('spiritual-recovery','Commune / Meditate')+action('field-ritual-menu','Cooperative rituals')+'</div><label for="rename">Sealer name</label><input id="rename" value="'+esc(s.player.name)+'" maxlength="24"><div class="btn-row">'+action('rename','Save name')+'</div>');}

function exportSave(){const payload=savePayload(),blob=new Blob([JSON.stringify(payload)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='spirimon-'+s.seed+'-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Save backup exported.');}
async function applySavePayload(data){
 cancelArtworkGeneration();s=data.save;queue=s.generationQueue||[];SE.ensureSealer(s);heldState();
 library={};libraryDirty.clear();for(const sp of data.library||[])if(sp?.id){E.migrateSpecies(sp);library[sp.id]=sp;libraryDirty.add(sp.id);}
 if(s.interior)W.normalizeInteriorPosition(s.interior);installRoster();normalizeWildPopulation();battle=s.battle||null;
 if(battle)ensureRealTimeBattle();if(!battle&&!s.interior&&!s.cave)ensurePlayerOnPath();closeModal();discoverRegion();save();render();
}
async function importSave(file){
 if(!file)return;if(file.size>150*1024*1024)return toast('Backup is too large.');
 try{const data=decodeSavePayload(await file.text());await dbPut('saves',structuredClone(s),'before-import');await applySavePayload(data);await persist();toast('Backup restored. Your previous world was kept as a recovery save.');}
 catch(error){toast('Could not import: '+error.message);}
}
function settings(){showModal('Your world. Your device.','<p>Link a device folder for automatic saving and loading. Installed desktop and Android apps remember your selected folder independently of browser storage. Browsers without persistent file access can use Export backup. Browser recovery remains a safety copy.</p><label for="layout-setting">Play layout</label><select id="layout-setting"><option value="auto">Automatic · emulator controls on phones</option><option value="emulator">Emulator · landscape touch controls</option><option value="desktop">Desktop · full-window map</option></select><div class="btn-row">'+action('fullscreen','Fullscreen / landscape')+'</div><div class="btn-row">'+action('calibrate','Calibrate audio / input')+action('music-toggle',s.settings.musicEnabled===false?'Enable music':'Mute music')+'</div><p class="help-line">Saved input offset: '+(s.settings.inputOffsetMs||0)+'ms. Perfect ±45ms · Good ±90ms · Fair ±150ms.</p><div class="btn-row">'+action('choose-device-save','Link device save file')+action('export','Save file / Export backup')+'<label class="btn" style="margin:0;cursor:pointer">Import backup<input type="file" id="import-file" accept=".json" hidden></label>'+action('restore-backup','Restore previous world','','btn ghost')+'</div><div class="modal-section"><p><a class="btn ghost" href="'+(globalThis.__spirimonPackaged?'https://nathan-culver.github.io/Spirimon/Spirimon.html':'./Spirimon.html')+'" download="Spirimon.html">Download game page</a></p><p class="help-line">Includes game code, world artwork, fonts and built-in creature portraits for offline play.</p><p class="help-line">For the optional local AI companion, download the full source package from the project folder.</p></div><div class="modal-section"><h3>AI Provider · automatic switching</h3><p class="help-line">Test each connection, choose a model and fallback. Text and offline providers create creature designs. Finished images require a connected image companion and a vision model. Unfinished Spirimon keep the mystery sprite; waiting alone does not create images.</p><label for="ai-provider">Primary provider</label><select id="ai-provider"><option value="auto">Automatic · first available</option><option value="companion">Spirimon companion · text + sprites</option><option value="ollama">Windows Ollama · text</option><option value="device">Android on-device · WebGPU text</option><option value="gemini">Gemini cloud · text</option><option value="procedural">Procedural · offline</option></select><label for="ai-fallback">Fallback</label><select id="ai-fallback"><option value="procedural">Procedural · offline</option><option value="companion">Spirimon companion</option><option value="ollama">Windows Ollama</option><option value="device">Android on-device</option><option value="gemini">Gemini cloud</option></select><label for="ai-ollama-url">Ollama API URL (HTTPS relay required for a remote Windows PC)</label><input id="ai-ollama-url" placeholder="https://your-private-relay.example" value="'+esc(s.settings.ollamaUrl||'http://localhost:11434')+'"><label for="ai-cloud-key">Gemini API key (session only; never saved)</label><input id="ai-cloud-key" type="password" autocomplete="off" placeholder="Enter only when using Gemini"><label for="ai-provider-model">Model for selected provider</label><select id="ai-provider-model"><option value="">Test connection to discover models</option></select><div class="btn-row">'+action('ai-test-provider','Test provider')+action('ai-test-auto','Test automatic selection')+'</div><div id="ai-provider-status" class="settings-status">Not tested. Browser-based AI needs WebGPU; Windows Ollama needs a secure reachable URL.</div></div><div class="modal-section"><h3>Free local AI</h3><p style="margin-top:8px">The optional companion connects to Ollama for Spirimon designs and a local Stable Diffusion WebUI API for sprites. Without models, the completed original roster and your saved AI lineages keep the game playable.</p><label><input type="checkbox" id="ai-enabled" '+(s.settings.aiEnabled?'checked':'')+'> Generate future discoveries with local AI</label><label for="ai-model">Installed text model</label><select id="ai-model"><option value="">Detect installed models first</option></select><label for="ai-vision-model">Artwork inspection model</label><select id="ai-vision-model"><option value="">Automatic · detect a vision model</option></select><div class="btn-row">'+action('check-ai','Check companion')+action('generate-now','Queue a new lineage')+action('inspect-anatomy','Inspect collection anatomy')+'</div><div id="ai-status" class="settings-status">Companion: '+(aiStatus?esc(aiStatus.message):'not checked')+'<br>Queue: '+queue.length+' lineages'+(busy?' · generating':'')+'</div><p class="help-line">New lineages require three validated sprites. Existing species retain their identities. Artwork inspection can verify anatomical equipment eligibility.</p></div><div class="modal-section"><h3>Begin another world</h3><p>Your species library stays. Export your current save first; a recovery copy is also retained.</p><label for="new-seed">World seed (optional)</label><input id="new-seed" maxlength="40" placeholder="A word, number, or leave blank"><div class="btn-row">'+action('new-world','Prepare a new world','','btn danger')+'</div></div>',{kind:'settings'});if(aiStatus?.models)fillModels();$('#layout-setting').value=s.settings.layout||'auto';$('#ai-provider').value=s.settings.aiProvider||'auto';$('#ai-fallback').value=s.settings.aiFallback||'procedural';}
let aiSessionKey='';let aiProviderResult=null,activeGenerationId=null,artworkAbort=null;
async function testProvider(auto=false){const out=$('#ai-provider-status');if(out)out.textContent='Testing connections…';try{const selected=s.settings.aiProvider||'auto';const result=auto||selected==='auto'?await AI.choose(s.settings,aiSessionKey):{type:selected,status:await AI.probe(selected,s.settings,aiSessionKey),errors:[]};aiProviderResult=result;const models=result.status.models||[];if(out)out.textContent='Active: '+AI.LABELS[result.type]+' · '+result.status.message+(result.errors?.length?' · Unavailable: '+result.errors.join('; '):'');const select=$('#ai-provider-model');if(select){select.innerHTML=models.map(m=>'<option value="'+esc(m)+'">'+esc(m)+'</option>').join('')||'<option value="">No models found</option>';select.value=s.settings.aiModels?.[result.type]||models[0]||'';}return result;}catch(e){if(out)out.textContent='Connection failed: '+e.message;return null;}}
function fillModels(){const select=$('#ai-model');if(!select)return;select.innerHTML=(aiStatus.models||[]).map(m=>'<option '+(m===s.settings.model?'selected':'')+'>'+esc(m)+'</option>').join('')||'<option value="">No text models installed</option>';const vision=$('#ai-vision-model');if(vision){vision.innerHTML='<option value="">Automatic · detect a vision model</option>'+(aiStatus.visionModels||[]).map(m=>'<option value="'+esc(m)+'">'+esc(m)+'</option>').join('');vision.value=s.settings.visionModel||'';}}
async function checkAI(){const out=$('#ai-status');if(out)out.textContent='Checking local companion…';try{const response=await fetch(COMPANION+'/api/status',{signal:AbortSignal.timeout(5000)});if(!response.ok)throw Error('Companion returned '+response.status);aiStatus=await response.json();aiStatus.message=(aiStatus.models.length?'Text models ready':'No Ollama model found')+' · '+(aiStatus.imageReady?'Image API ready':'Image API not connected');fillModels();if(out)out.textContent=aiStatus.message+' · queue '+queue.length;}catch(err){aiStatus={message:'Companion offline. Run Start-Spirimon.cmd from the downloaded game.',models:[],imageReady:false};if(out){out.textContent=aiStatus.message;out.classList.add('error');}}}
function cancelArtworkGeneration(){artworkAbort?.abort();artworkAbort=null;activeGenerationId=null;busy=false;}
async function processQueue(){
 if(busy||!s.settings.aiEnabled)return;
 queueOwnedArtwork();
 const next=queue.findIndex(id=>{const sp=s.species[id]||library[id]||s.generationPlans?.[id];return !sp?.artworkJob?.retryAfter||sp.artworkJob.retryAfter<=Date.now();});
 if(next<0)return;
 const [id]=queue.splice(next,1),original=s.species[id]||library[id]||s.generationPlans?.[id],repair=!!(s.species[id]||library[id]);
 if(!original){save();return;}
 if(repair&&hasFinishedArtwork(original)){delete s.generationPlans?.[id];save();return;}
 const world=s,controller=new AbortController();artworkAbort=controller;busy=true;activeGenerationId=id;
 original.artworkJob={state:'generating',message:'Creating finished artwork for all three forms.'};refreshArtworkStatus();
 try{
  const route=await AI.choose(s.settings,aiSessionKey);if(s!==world||controller.signal.aborted)return;let sp;
  if(repair){
   const visionModel=s.settings.visionModel||route.status.visionModels?.[0];
   if(route.type!=='companion'||!route.status.imageReady||!visionModel)throw Error('Finished artwork needs a connected image companion and a vision model. Waiting alone will not create images.');
   const model=s.settings.aiModels?.companion||s.settings.model||route.status.models[0];if(!model)throw Error('Choose an installed text model in Settings.');
   const existing=Object.values(library).filter(p=>p.id!==id);
   const res=await fetch(COMPANION+'/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({species:original,model,visionModel,existing:existing.filter(p=>p.base===original.base&&p.alter===original.alter).slice(-8)}),signal:AbortSignal.any([AbortSignal.timeout(900000),controller.signal])}),data=await res.json();if(!res.ok)throw Error(data.error||'Artwork generation failed');
   if(data.visualValidation?.status!=='vision-verified')throw Error(data.visualValidation?.reason||'The image companion did not return finished, verified artwork.');
   // Artwork completion must retain the owned lineage and all its gameplay data.
   sp=structuredClone(s.species[id]||library[id]||original);await acceptGeneratedArtwork(sp,data,existing);
   if(!hasFinishedArtwork(sp))throw Error('All three finished form images are required.');
  }else if(route.type==='procedural')sp=completeProceduralSpecies({...original,id:'offline-'+original.id},Object.values(library));
  else if(route.type!=='companion'){
   const model=s.settings.aiModels?.[route.type]||route.status.models[0];if(!model)throw Error('No text model available');
   const prompt='Design a nonhuman three-form lineage. Preserve this exact anatomical reference, modifier and Domains: '+JSON.stringify({base:original.base,alter:original.alter,design:original.design,domains:original.domains,moves:original.moves})+'. Return JSON: forms (three distinct names), description, and optionally moveNames (4), moves (4 objects: name,power 0-100,accuracy .65-1,kind physical/spiritual/status,effect,target). Supported effects: null, slow, poison, burn, paralysis, heal, ward, boostMight, boostPower, boostDefense, boostResistance, boostSpeed, lowerMight, lowerPower, lowerDefense, lowerResistance, lowerSpeed, breakWard, drain, recoil, critical, priority, protect, cleanse. Damage, accuracy, cooldowns and effects share a strict balance budget. Healing/wards have zero power and target self/ally. Physical techniques must fit the anatomy.';
   const response=await AI.text(route.type,{...s.settings,model,aiModels:{...s.settings.aiModels,[route.type]:model}},prompt,aiSessionKey),data=JSON.parse(response.replace(/^\x60\x60\x60(?:json)?\s*|\s*\x60\x60\x60$/g,''));
   sp=E.validateSpecies(data,original);sp.id='ai-'+original.id+'-'+E.hash(data.forms.join(''));sp.source='ai-text-'+route.type;completeProceduralSpecies(sp,Object.values(library));
  }else{
   const model=s.settings.aiModels?.companion||s.settings.model||route.status.models[0];if(!model)throw Error('Choose an installed text model in Settings.');
   const existing=Object.values(library).filter(p=>p.base===original.base&&p.alter===original.alter).slice(-8).map(p=>({forms:p.forms,description:p.description,visualValidation:p.visualValidation}));
   const visionModel=s.settings.visionModel||route.status.visionModels?.[0];
   const res=await fetch(COMPANION+'/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({species:original,model,visionModel,existing}),signal:AbortSignal.any([AbortSignal.timeout(900000),controller.signal])}),data=await res.json();if(!res.ok)throw Error(data.error||'Local generation failed');
   sp=E.validateSpecies(data,original);sp.id='ai-'+original.id+'-'+E.hash(data.forms.join(''));await acceptGeneratedArtwork(sp,data,Object.values(library));
  }
  if(s!==world||controller.signal.aborted)return;
  sp.artworkJob={state:hasFinishedArtwork(sp)?'ready':'unavailable',message:hasFinishedArtwork(sp)?'Finished artwork ready.':'Design prepared; finished artwork is unavailable. The mystery sprite remains until images are supplied.'};
  register(sp);delete s.generationPlans[id];note((repair?'Artwork completed for ':'New lineage designed: ')+sp.forms[0]+'. '+sp.artworkJob.message);save();refreshArtworkStatus();globalThis.spirimonArtLoaded?.();toast(repair?'Your Spirimon’s artwork is ready.':hasFinishedArtwork(sp)?'A new complete lineage is ready.':'New design prepared; finished artwork is unavailable.');
 }catch(error){if(s!==world||controller.signal.aborted)return;original.artworkJob={state:'unavailable',message:error.message,retryAfter:Date.now()+60000};if(!queue.includes(id))queue.push(id);note('Artwork unavailable for '+original.forms[0]+': '+error.message);save();refreshArtworkStatus();}finally{if(artworkAbort===controller){artworkAbort=null;busy=false;activeGenerationId=null;if(modal==='settings')settings();}}
}
function drawTallGrass(c,x,y,seed,time,disturbance=0,foreground=false){
 const r=E.rng(seed),wind=Math.sin(time/650+seed%19)*1.2;
 for(let n=0;n<9;n++){
  const bx=x+3+Math.floor(r()*27),by=y+12+Math.floor(r()*18);
  const height=11+Math.floor(r()*11),sway=wind+Math.sin(time/190+n*2+seed%11)*disturbance*5;
  if(foreground&&by<y+20)continue;
  c.strokeStyle=n%3===0?'#a3c75a':n%3===1?'#568e38':'#36753b';
  c.lineWidth=n%4===0?3:2;c.beginPath();c.moveTo(bx,by);c.quadraticCurveTo(bx+sway*.45,by-height*.6,bx+sway+(n%3-1)*3,by-height);c.stroke();
  c.fillStyle='#b5d76b';c.fillRect(Math.round(bx+sway),Math.round(by-height),2,3);
 }
 c.lineWidth=1;
}
function wanderSpirits(now){if(s.interior||modal||battle||view!=='explore')return;const pos=E.coord(s.player.x,s.player.y),group=s.roamers[pos.cx+','+pos.cy]||[];for(const r of group){if(!roamerArtworkReady(r))continue;if(!r.wanderNext)r.wanderNext=now+3500+Math.random()*4500;if(now<r.wanderNext)continue;r.wanderNext=now+4500+Math.random()*6500;if(Math.random()<.3)continue;if(s.sealer.senses?.concealment&&Math.hypot(r.x-s.player.x,r.y-s.player.y)<6&&Math.random()>SE.encounterMultiplier(s.sealer,r.ind.level))continue;const dirs=[[1,0],[-1,0],[0,1],[0,-1]],d=dirs[Math.floor(Math.random()*dirs.length)],nx=r.x+d[0],ny=r.y+d[1],next=E.coord(nx,ny);if(next.cx!==pos.cx||next.cy!==pos.cy||!E.walkable(E.tile(s.seed,nx,ny))||buildingSpriteBlocked(nx,ny)||Math.abs(nx-s.player.x)+Math.abs(ny-s.player.y)<=1||townNPCs(pos.cx,pos.cy).some(n=>n.x===nx&&n.y===ny)||(E.region(s.seed,pos.cx,pos.cy).town&&W.buildings(pos.cx,pos.cy).some(b=>b.doorX===nx&&b.doorY===ny))||group.some(o=>o!==r&&roamerArtworkReady(o)&&o.x===nx&&o.y===ny))continue;r.wanderFrom={x:r.x,y:r.y,start:now,duration:420};r.face=d[0]<0?'left':d[0]>0?'right':d[1]<0?'up':'down';r.x=nx;r.y=ny;}}
function drawWorld(time){
 const canvas=$('#world');if(!canvas||view!=='explore'||battle)return;
 if(s.cave){drawCave(canvas,time);return;}if(s.interior){drawInterior(canvas,time);return;}
 if(!readyImage(ART.terrain)||!readyImage(ART.world)||!readyImage(ART.sealer)||!readyImage(TOWN_ATLAS))return;
 const rect=canvas.getBoundingClientRect(),scale=document.body.classList.contains('emulator-mode')?1.5:2;
 const width=Math.max(240,Math.round(rect.width/scale)),height=Math.max(160,Math.round(rect.height/scale));
 if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
 const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;
 const elapsed=walkAnim?movementProgress(time,walkAnim.start,walkAnim.duration):1;
 const vx=walkAnim?walkAnim.x+(s.player.x-walkAnim.x)*elapsed:s.player.x,vy=walkAnim?walkAnim.y+(s.player.y-walkAnim.y)*elapsed:s.player.y;
 mapCamera=updateMapCamera(mapCamera,{x:vx*32+16,y:vy*32+16,width,height,scene:'world:'+s.seed});
 const cols=width/32,rows=height/32,ox=mapCamera.left/32,oy=mapCamera.top/32;
 const px=x=>Math.round(x*32)-mapCamera.left,py=y=>Math.round(y*32)-mapCamera.top;
 for(let y=Math.floor(oy)-2;y<=Math.ceil(oy+rows)+1;y++)for(let x=Math.floor(ox)-2;x<=Math.ceil(ox+cols)+1;x++){
 const reg=E.region(s.seed,Math.floor(x/48),Math.floor(y/36)),terrain=E.tile(s.seed,x,y),local=E.coord(x,y);drawTile(c,terrain,px(x),py(y),E.hash(s.seed,x,y),reg.biome.kind,{neighbors:[[0,-1],[1,0],[0,1],[-1,0]].map(([dx,dy])=>E.tile(s.seed,x+dx,y+dy)),town:reg.town&&Math.abs(local.lx-24)<22&&Math.abs(local.ly-18)<15});if(terrain==='grass'){const distance=Math.hypot(x-vx,y-vy),disturbance=walkAnim&&elapsed<1?Math.max(0,1.8-distance):0;drawTallGrass(c,px(x),py(y),E.hash(s.seed,x,y),time,disturbance);}}


 const pc=E.coord(s.player.x,s.player.y),people=[];
 const visible=(x,y,w=32,h=32)=>x+w>=-48&&y+h>=-48&&x<=width+48&&y<=height+48;
 const nearRegions=[];for(let cy=Math.floor((oy-6)/36);cy<=Math.floor((oy+rows+6)/36);cy++)for(let cx=Math.floor((ox-6)/48);cx<=Math.floor((ox+cols+6)/48);cx++)nearRegions.push({cx,cy});
 for(const {cx,cy} of nearRegions){
  const reg=E.region(s.seed,cx,cy);
  if(reg.town){
   people.push(...townNPCs(cx,cy));
  }

 }
 const moving=!!walkAnim&&elapsed<1;
 const actors=[];
 for(let ty=Math.floor(oy)-3;ty<=Math.ceil(oy+rows)+3;ty++)for(let tx=Math.floor(ox)-3;tx<=Math.ceil(ox+cols)+3;tx++){
 if(E.tile(s.seed,tx,ty)!=='tree')continue;
 const x=px(tx),y=py(ty);if(!visible(x-16,y-48,64,80))continue;const seed=E.hash(s.seed,tx,ty),biome=E.region(s.seed,Math.floor(tx/48),Math.floor(ty/36)).biome.kind;
 actors.push({y:sceneryDepth({y:ty}),draw:()=>drawTree(c,x,y,seed,biome)});
 }
 for(const {cx,cy} of nearRegions){
 const entrance=E.caveEntrance(s.seed,cx,cy);
 if(entrance&&visible(px(entrance.x)-64,py(entrance.y)-112,160,144)){
 const biome=E.region(s.seed,cx,cy).biome.kind;
 actors.push({y:sceneryDepth(caveFootprint(entrance)),draw:()=>drawCaveEntrance(c,px(entrance.x),py(entrance.y),biome)});
 }
 for(const shrine of SW.shrinesForRegion(s.seed,cx,cy)){
 if(!visible(px(shrine.x)-96,py(shrine.y)-128,192,192))continue;
 actors.push({y:sceneryDepth(shrine),draw:()=>SW.drawShrine(c,px(shrine.x),py(shrine.y),!SE.recoveryAvailable(s,'commune',shrine.id).ok,shrine.kind||0)});
 }
 if(!E.region(s.seed,cx,cy).town)continue;
 for(const f of W.townFeatures(cx,cy)){
 if(!visible(px(cx*48+f.x)-96,py(cy*36+f.y)-128,Math.max(192,f.w*32+64),Math.max(192,f.h*32+64)))continue;
 actors.push({y:cy*36+sceneryDepth(f),draw:()=>drawTownFeatures(c,cx,cy,px,py,f)});
 }
 if(visible(px(cx*48+27)-64,py(cy*36+18)-64,160,160))actors.push({y:cy*36+sceneryDepth(W.PLAZA_FEATURES[0]),draw:()=>drawWell(c,px(cx*48+27),py(cy*36+18))});
 if(visible(px(cx*48+33)-64,py(cy*36+14)-64,192,192))actors.push({y:cy*36+sceneryDepth(W.PLAZA_FEATURES[1]),draw:()=>drawTownDecor(c,px(cx*48+33),py(cy*36+14))});
 }

 for(const {cx,cy} of nearRegions){
 if(!E.region(s.seed,cx,cy).town)continue;
 for(const b of W.buildings(cx,cy)){const x=px(b.footX),y=py(b.footY);
 if(!visible(x-96,y-180,Math.max(240,b.w*32+96),240))continue;
 actors.push({y:sceneryDepth({y:b.footY,h:b.h}),draw:()=>drawTownBuilding(c,b,x,y)});
 }}

 for(const n of people){const w=n.walk,progress=w?Math.min(1,(time-w.start)/w.duration):1,nx=w&&progress<1?w.x+(n.x-w.x)*progress:n.x,ny=w&&progress<1?w.y+(n.y-w.y)*progress:n.y;if(!visible(px(nx)-24,py(ny)-48,80,96))continue;actors.push({y:ny,draw:()=>{const x=px(nx),y=py(ny);drawPerson(c,x,y-5,n.role,time,n.face||'down',progress<1);if(Math.abs(n.x-s.player.x)+Math.abs(n.y-s.player.y)<=2){c.fillStyle='#fff5bd';c.strokeStyle='#4f4430';c.font='bold 10px monospace';c.textAlign='center';c.strokeText('!',x+16,y-8);c.fillText('!',x+16,y-8);}}});}
 if(!s.mountedSteed&&!swimmingAt(vx,vy)&&s.party.length&&s.spirits.length){const companion=party().find(u=>u.id===s.sealer?.leadId),step=companionTrail.length-3;if(companion&&step>=0){const from=companionTrail[step],to=companionTrail[step+1]||from;if(from&&to){const fx=from.x+(to.x-from.x)*(moving?elapsed:1),fy=from.y+(to.y-from.y)*(moving?elapsed:1),face=to.x<from.x?'left':to.x>from.x?'right':to.y<from.y?'up':'down';if(visible(px(fx)-32,py(fy)-48,96,96))actors.push({y:fy,draw:()=>{const dimensions=companionSize(spOf(companion),companion.appearance),size=dimensions.size;drawAspectAura(c,companion,px(fx)+16-size/2,py(fy)+30-size,size);drawCompanion(c,spOf(companion),companion.appearance,px(fx)+16-size/2,py(fy)+30-size,size,face,moving,elapsed);}});}}}
 for(let cy=pc.cy-1;cy<=pc.cy+1;cy++)for(let cx=pc.cx-1;cx<=pc.cx+1;cx++)for(const r of s.roamers[cx+','+cy]||[]){if(!roamerArtworkReady(r))continue;const a=r.wanderFrom,t=a?Math.min(1,(time-a.start)/a.duration):1,rx=a&&t<1?a.x+(r.x-a.x)*t:r.x,ry=a&&t<1?a.y+(r.y-a.y)*t:r.y,x=px(rx),y=py(ry);if(x<-70||x>width+50||y<-70||y>height+50)continue;actors.push({y:ry,draw:()=>{c.save();try{const sp=spOf(r.ind);drawSpirit(c,sp,r.ind.appearance,x-13,y-29+(t<1?-Math.abs(Math.sin(t*Math.PI))*4:0),58,r.face==='left',{face:r.face||'down',moving:t<1,progress:t});}catch(e){console.warn('Wild Spirimon drawing failed',r.id,e);}finally{c.restore();}}});}
 if(challengerApproach){const a=challengerApproach;actors.push({y:a.y,draw:()=>{drawPerson(c,px(a.x),py(a.y)-5,a.kind==='rival'?'rival':'villain',time,a.face,true);c.fillStyle='#fff5bd';c.font='bold 11px monospace';c.textAlign='center';c.fillText('!',px(a.x)+15,py(a.y)-15);}});}
 actors.push({y:vy,draw:()=>{const steed=s.mountedSteed&&validSteed(),water=swimmingAt(vx,vy)||swimmingAt(s.player.x,s.player.y),swimmer=water&&leadSwimmer();if(water&&swimmer)drawWaterMount(c,drawMounted,drawCompanion,drawPerson,spOf(swimmer),swimmer.appearance,px(vx),py(vy)-5,s.player.face,moving,elapsed,time,adventureState().appearance);else if(water)drawSwimming(c,drawPerson,px(vx),py(vy)-5,s.player.face,moving,time,adventureState().appearance);else if(steed)drawMounted(c,drawCompanion,drawPerson,spOf(steed),steed.appearance,px(vx),py(vy)-5,s.player.face,moving,elapsed,time,adventureState().appearance);else drawPerson(c,px(vx),py(vy)-5,'player',moving?elapsed*1000:0,s.player.face,moving,adventureState().appearance);}});
 actors.sort((a,b)=>a.y-b.y);for(const actor of actors)actor.draw();
 if(fieldAnimation){const a=fieldAnimation,elapsed=time-a.start;if(elapsed<a.duration)drawFieldAnimation(c,a.kind,px(a.x),py(a.y),elapsed,a.duration);else fieldAnimation=null;}
 if(E.tile(s.seed,Math.round(vx),Math.round(vy))==='grass')drawTallGrass(c,px(Math.round(vx)),py(Math.round(vy))+7,E.hash(s.seed,Math.round(vx),Math.round(vy),'front'),time,moving?1.5:0,true);
 drawAtmosphere(c,width,height,time);drawSpiritualPerception(c,px,py);
 for(let i=0;i<7;i++){c.globalAlpha=.22;c.fillStyle=i%2?'#ffdfd5':'#f9efb8';c.fillRect((i*137+time*.006)%width,(i*83+Math.sin(time/1400+i)*10)%height,2,1);}c.globalAlpha=1;
 const coords=$('#map-coords');if(coords)coords.textContent=s.player.x+' / '+s.player.y;const hintNode=$('#map-hint');if(hintNode){const nextHint=hint();if(hintNode.textContent!==nextHint)hintNode.textContent=nextHint;}
}
let lastWorldPaint=0,lastWorldSimulation=0;
function tick(time){const delta=Math.min(1000,time-lastTime);lastTime=time;if(loaded){if(!battle&&!document.hidden&&!modal&&view==='explore'){s.playTime+=delta;SE.advanceSpiritualClock(s,delta,{exploring:true});explorationStatusPulse(delta);refreshExplorationEnergy();}if(battle?.rt){try{advanceRealTimeBattle(Math.min(250,delta),time);}catch(error){battle.rt.paused=true;console.error('Real-time battle paused after an error',error);toast('Battle paused: '+error.message);}}if(!modal&&!battle&&!challengerApproach&&view==='explore'&&time-lastStep>=(walkAnim?.duration||(swimmingAt(s.player.x,s.player.y)?leadSwimmer()?(running||keys.has('shift')?95:170):680:s.mountedSteed?95:170))){const key=[...keys].find(k=>['w','a','s','d','arrowup','arrowleft','arrowdown','arrowright'].includes(k));if(!key&&queuedStep){const next=queuedStep;queuedStep=null;move(...next);}if(key){queuedStep=null;const dir={w:[0,-1],arrowup:[0,-1],a:[-1,0],arrowleft:[-1,0],s:[0,1],arrowdown:[0,1],d:[1,0],arrowright:[1,0]}[key];move(...dir);lastStep=time;}}if(sideActivity&&sideActivity.kind!=='observation'){const meter=$('#activity-meter');if(meter)meter.value=((time-sideActivity.start)%1600)/1600;}if(ritual){ritual.progress=(Math.sin((time-ritual.start)/(s.settings.timing==='slow'?1800:950)*Math.PI)+1)/2;const cursor=$('#ritual-cursor');if(cursor)cursor.style.left=ritual.progress*99+'%';}try{advanceChallenger(time);if(time-lastWorldSimulation>=120){lastWorldSimulation=time;wanderSpirits(time);try{wanderNPCs(time);}catch(npcErr){console.error('NPC wandering failed',npcErr);}}if(time-lastWorldPaint>=30||!lastWorldPaint){lastWorldPaint=time;drawWorld(time);}}catch(err){if(!window.lastWorldFrameError||time-window.lastWorldFrameError>5000){console.error('Spirimon world frame failed; preserving previous frame',err);window.lastWorldFrameError=time;}}}requestAnimationFrame(tick);}
document.addEventListener('click',async ev=>{if(ev.target.classList.contains('modal-overlay')){if(modal&&modal!=='welcome')closeModal();return;}const btn=ev.target.closest('[data-action]');if(!btn||btn.disabled||actionBusy)return;ev.preventDefault();const a=btn.dataset.action,v=btn.dataset.value;switch(a){

case'spiritual-arts':spiritualArtsMenu();break;
case'attribute-add':{if(battle)return;const r=SE.allocateAttribute(s.sealer,v);if(!r.ok)return toast(r.reason);SE.ensureSealer(s);save();spiritualArtsMenu();break;}
case'attribute-retrain':{const r=SE.retrainAttributes(s.sealer,s.inventory,{safe:safe(),battle:!!battle});if(!r.ok)return toast(r.reason);SE.ensureSealer(s);save();spiritualArtsMenu();break;}
case'vow-select':{const r=SE.selectVow(s.sealer,v,{safe:safe(),battle:!!battle});if(!r.ok)return toast(r.reason);save();spiritualArtsMenu();break;}
case'vow-confirm':{const next=vowContinuation;vowContinuation=null;closeModal();if(next)next();break;}
case'sense-toggle':toggleSpiritualSense(v);break;
case'sense-train':trainSpiritualSense(v);break;
case'support-start':{const result=SE.chooseStartingSupport(s,v);if(!result.ok)return toast(result.reason);save();if(result.complete){closeModal();render();toast('Three techniques learned. Open Support to prepare assignments.');}else startingSupportMenu();break;}
case'support-prepare':supportPreparation();break;
case'support-member':supportPreparation(v);break;
case'support-assign':case'support-remove':{const [member,id]=v.split('|'),result=SE.assignSupport(s,member,id,{remove:a==='support-remove',battle:!!battle});if(!result.ok)return toast(result.reason);save();supportPreparation(member);break;}
case'support-replace':{const [member,id]=v.split('|'),result=SE.assignSupport(s,member,id,{replaceId:s.sealer.assignments[member]?.[0],battle:!!battle});if(!result.ok)return toast(result.reason);save();supportPreparation(member);break;}
case'support-float':{const result=SE.assignSupport(s,null,v,{floating:true,battle:!!battle});if(!result.ok)return toast(result.reason);save();supportPreparation();break;}
case'support-trainer':supportTrainerMenu(v||'guild');break;
case'support-learn':{if(battle||!safe())return;const [source,n]=v.split('|'),q=s.sealer,key='trainer:'+source+':'+SE.calendarPhase(s.playTime).key+':'+n,cost=25+q.level*3;if(q.discoveries['learn:'+key])return toast('Already learned.');if(s.inventory.coins<cost)return toast('Not enough Coin.');const t=SE.learnSupport(s,key,'Spiritual instruction');if(t){s.inventory.coins-=cost;SE.trainSealer(s,key);save();supportTrainerMenu(source);}break;}
case'cooperative-learn':{if(battle||!safe())return;const cost=v==='triune'?90:60;if(!['triune','united'].includes(v)||s.sealer.advanced.includes(v))return toast('Already learned.');if(s.inventory.coins<cost)return toast('Not enough Coin.');s.inventory.coins-=cost;s.sealer.advanced.push(v);SE.trainSealer(s,'cooperative:'+v);save();supportTrainerMenu();break;}
case'spiritual-recovery':spiritualRecoveryMenu();break;
case'spiritual-meditate':performSpiritualRecovery('meditate');break;
case'spiritual-commune':performSpiritualRecovery('commune');break;
case'spiritual-draught':useSpiritualDraught();break;
case'field-ritual-menu':fieldRitualMenu();break;
case'field-ritual':performFieldRitual(v,Number(btn.dataset.energyExtra)||0);break;
case'rt-release':releaseBattleMember(v);break;
case'rt-withdraw':withdrawBattleMember(v);break;
case'support-use':useSupportAction(v,Number(btn.dataset.energyExtra)||0);break;
case'cooperative-menu':if(battle){battleMode='coop';closeModal();render();}break;
case'cooperative-use':useCooperativeAction(v);break;
case'free-first-seal':{const r=findRoamer(v);if(!r?.active||s.spirits.length!==0){toast('The free first seal is no longer available.');break;}capture(structuredClone(r.ind),r.id);closeModal();render();toast('Your first Spirimon is sealed and attuned — no offerings spent!');break;}
 case'begin-journey':s.player.name=$('#sealer-name')?.value.trim().slice(0,24)||'Sealer';s.starter=true;closeModal();save();render();startingSupportMenu();break;
case'emu-a':interact();break;
case'emu-b':if(modal)closeModal();break;
case'game-menu':gameMenu();break;
case'save-now':await persist();closeModal();toast(deviceSaveHandle||nativeSaveLinked?'Save requested. Check file permission if browser recovery is shown.':'Saved to browser recovery. Use Save file / Export backup for a device file.');break;
case'fullscreen':await enterFullscreen();break;
case'portrait-play':s.settings.portraitAllowed=true;applyLayout();save();break;
case'view':if(battle&&v!=='explore')return toast('Finish the encounter first.');closeModal();view=v;render();break;
case'spiridex-entry':spiridexEntry(v);break;
case'spiridex-form':{const split=v.lastIndexOf('|');spiridexEntry(v.slice(0,split),Number(v.slice(split+1)));break;}
case'spiridex-back':closeModal();[...document.querySelectorAll('[data-action="spiridex-entry"]')].find(b=>b.dataset.value===dexReturnId)?.focus({preventScroll:true});break;
case'spiridex-page':dexView.page=Math.max(0,dexView.page+Number(v||0));render();document.querySelector('.spiridex-results')?.scrollIntoView({block:'start'});break;
case'spiridex-reset':Object.assign(dexView,{search:'',status:'all',type:'all',page:0});render();$('#dex-search')?.focus();break;
case'close':closeModal();break;
case'starter':chooseStarter(v);break;
case'step':move(...{up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[v]);break;
case'interact':interact();break;
case'detail':detail(v);break;
case'spirit-move-info':spiritMoveInfo(v);break;
case'spirit-move-back':spiritMoveBack(v);break;
case'rt-pick-target':selectRealTimeTarget(v);break;
case'unified-held':battle.controlledAlly=v;submitRealTimeAction({type:'heldItem'});break;
case'passive-menu':passiveMenu(v);break;
case'passive-study':studyPassive(v);break;
case'passive-equip':equipPassive(v);break;
case'attune':attune(v);break;
case'lead':{const result=SE.changeLead(s,v,{safe:safe(),battle:!!battle});if(!result.ok)return toast(result.reason);s.party=[v,...s.party.filter(x=>x!==v)];save();detail(v);render();break;}
case'learn-menu':learnMenu(v);break;
case'learn-slot':{const[id,slot]=v.split(':');learnMenu(id,Number(slot));break;}
case'learn-move':{const[id,slot,moveId]=v.split('|');const i=s.spirits.find(x=>x.id===id),sp=spOf(i);if(!i||!safe()||!Number.isInteger(Number(slot))||Number(slot)<0||Number(slot)>=sp.moves.length||!E.availableTechniques(i,sp).some(m=>m.id===moveId))break;i.moveIds=E.equippedMoves(i,sp).map(m=>m.id);i.unlockedMoves??=[];for(const known of i.moveIds)if(!i.unlockedMoves.includes(known))i.unlockedMoves.push(known);i.moveIds[Number(slot)]=moveId;E.normalizeResources(i,sp);save();detail(id);break;}
case'appearance':{if(battle)return toast('Change appearance outside battle.');const[id,n]=v.split(':'),i=s.spirits.find(x=>x.id===id);if(i&&Number(n)<=i.form){const previous=i.appearance;i.appearance=Number(n);save();detail(id);render();transformSpirit(spOf(i),previous,i.appearance);}break;}
case'train':training(v);break;
case'bond':shareOffering(v);break;
case'rest':rest();break;
case'rest-close':closeModal();rest();break;
case'collection-close':closeModal();view='spirits';render();break;
case'bag':bag();break;
case'offer':cooperate(v,true);break;
case'observe':cooperate(v,false);break;
case'wild-battle':{const r=findRoamer(v);if(r?.active)startBattle(r.ind,v);break;}
case'seal-pulse':sealPulse();break;
case'chat':chat(v);break;
case'buy':buy(v);break;
case'claim':claim(v);break;
case'trainer':trainerBattle();break;
case'challenger-fight':beginChallenger();break;
case'steed-toggle':closeModal();toggleSteed();break;
case'companion-interact':{const i=lead();if(!i)return; const rewardKey=i.id+':'+SE.calendarPhase(s.playTime).key;if(!s.sealer.bondRewards[rewardKey]){i.bond=Math.min(100,(i.bond||0)+1);SE.bondRecovery(s,i);}save();showModal('A moment with your companion','<p>'+esc(spOf(i).forms[i.appearance])+' stays close and responds to your attention. Bond '+i.bond+'/100.</p>');break;}
case'adventure-menu':adventureMenu();break;
case'temple-enter':templeInterior();break;
case'temple-map-enter':{const t=currentTemple();closeModal();s.cave={id:'temple-'+t.id+'-'+t.region.cx+'-'+t.region.cy,temple:t.id,depth:6,level:0,x:1,y:1,outside:{x:s.player.x,y:s.player.y}};save();render();break;}
case'temple-step':{const [id,raw]=v.split('|'),next=Number(raw),e=encounterState(),prev=e[id+'-room']||0;if(Math.abs(next%3-prev%3)+Math.abs(Math.floor(next/3)-Math.floor(prev/3))!==1)return; e[id+'-room']=next;e[id]??=0;const required=[1,4,5][e[id]];if(next===required&&e[id]<3){e[id]++;toast('You uncovered a sealed passage!');}save();templeInterior();break;}
case'temple-puzzle':{const e=encounterState();e[v]=Math.min(3,(e[v]||0)+1);save();templeInterior();break;}
case'temple-obstacle':{const t=currentTemple(),e=encounterState(),key='temple-obstacle-'+t.id+'-'+(e['temple-progress-'+t.id]||0),needed=['push','cleave','crush'][e['temple-progress-'+t.id]||0];if(v!==needed||!fieldCapability(v))return toast('No eligible Spirimon can perform this task.');e[key]=true;save();toast('Your Spirimon clears the obstacle without using a battle move.');templeInterior();break;}
case'temple-symbol':{const t=currentTemple(),e=encounterState(),key='temple-progress-'+t.id,p=e[key]||0,trial=A.templeTrial(t);if(p>=3)return templeInterior();if(v===trial.solution[p]){e[key]=p+1;toast('The rune responds to your insight.');save();}else toast('The sigil fades. Study the inscription and try again.');templeInterior();break;}
case'temple-trainer':{const t=currentTemple(),e=encounterState(),p=e['temple-progress-'+t.id]||0;if(p<3||p>=5)return templeInterior();adventureBattle('temple-trainer',t.id+'|'+p,Math.max(3,t.level-3));break;}
case'temple-boss':clanChallenge();break;
case'faction-story':factionCampaign();break;
case'faction-scene':{const e=encounterState();e[v]=Math.min(3,(e[v]||0)+1);save();factionCampaign();break;}
case'faction-boss':factionChallenge();break;
case'legend-ritual':legendaryRitual();break;
case'ritual-stage':{if(SE.vowViolation(s.sealer,'ritual'))return warnVow(()=>performLegendaryRitualStage(v,true));performLegendaryRitualStage(v);break;}
case'ritual-boss':legendChallenge();break;
case'interior-menu':interiorMenu();break;
case'interior-type':{const e=encounterState();e['building-type']=v;e['building-room']=0;save();interiorMenu();break;}
case'interior-step':{const e=encounterState(),p=e['building-room']||0,n=Number(v);if(Math.abs(n%3-p%3)+Math.abs(Math.floor(n/3)-Math.floor(p/3))===1){e['building-room']=n;save();}interiorMenu();break;}
case'interior-search':{const e=encounterState(),key='searched-'+(e['building-type']||'guild')+'-'+(e['building-room']||0);if(e[key])toast('You already searched this chamber.');else{e[key]=true;s.inventory.coins+=10+E.hash(s.seed,key)%25;save();toast('You discovered a cache of Coin!');}interiorMenu();break;}
case'multi-arena':multiArena();break;
case'transformation-menu':transformationMenu(v);break;
case'transform-aspect':{const [id,name]=v.split('|'),i=s.spirits.find(x=>x.id===id);if(!i||battle||!safe())return toast('Awaken aspects at a safe place.');const before=E.stats(i,spOf(i)),result=Q.unlockAspect(i,name,s.inventory);if(!result.ok)return toast(result.reason);reconcileEquipmentStats(i,before);save();transformationMenu(id);renderSpiritCanvases();break;}
case'specialty-menu':specialtyMenu();break;
case'rare-variants':rareVariantMenu();break;
case'specialty-train':{const [id,k]=v.split('|'),i=s.spirits.find(x=>x.id===id);if(!i||s.inventory.coins<100)return toast('Training requires 100 Coin.');s.inventory.coins-=100;i.specialty=k;i.trained=Math.min(60,(i.trained||0)+4);save();specialtyMenu();break;}
case'facility-menu':battleFacility();break;
case'facility-battle':startFacilityMatch(v);break;
case'clan-challenge':clanChallenge();break;
case'faction-challenge':factionChallenge();break;
case'legend-challenge':legendChallenge();break;
case'championship':championshipMenu();break;
case'championship-fight':startChampionshipMatch();break;
case'guild-trials':guildTrialsMenu();break;
case'guild-trial':startGuildTrial(v);break;
case'temple-rematches':templeRematches();break;
case'temple-rematch':startTempleRematch(v);break;
case'competition-continue':if(v==='championship')championshipMenu();else battleFacility();break;
case'facility-draft':toggleDraftMember(v);break;
case'equipment-menu':equipmentMenu();break;
case'held-shop':heldShopMenu();break;
case'held-shop-buy':{if(battle||!safe())return;const result=Q.buyHeldItem(heldState(),currentHeldShop(),v,s.inventory);if(!result.ok)return toast(result.reason);save();heldShopMenu();toast('Purchased '+result.item.name);break;}
case'held-equip':{if(battle||!safe())return toast('Change Held Items at a safe place.');const [id,itemId]=v.split('|'),i=s.spirits.find(x=>x.id===id);if(!i)return;const before=E.stats(i,spOf(i)),result=Q.equipOwnedHeldItem(i,itemId==='none'?null:itemId,heldState(),spOf(i));if(!result.ok)return toast(result.reason);reconcileEquipmentStats(i,before);save();equipmentMenu();break;}
case'held-inspect':heldInspect(v);break;
case'held-sell':{if(battle||!safe())return toast('Sell equipment in town.');const result=Q.sellHeldItem(heldState(),v,s.inventory);if(!result.ok)return toast(result.reason);save();equipmentMenu();toast('Sold for '+result.value+' Coin.');break;}
case'held-item-menu':heldItemMenu();break;
case'held-activate':await activateHeldFromBag(v);break;
case'appearance-menu':appearanceMenu();break;
case'appearance-change':{const a=adventureState(),opts=A.playerLooks();a.appearance[v]=(a.appearance[v]+1)%opts[({skin:'colors',outfit:'outfits',hair:'hair'})[v]].length;save();appearanceMenu();break;}
case'arcade-menu':arcadeMenu();break;
case'activity-start':beginSideActivity(v);break;
case'activity-answer':finishSideActivity(v);break;
case'activity-tap':finishSideActivity();break;
case'regional-jobs':regionalJobMenu();break;
case'regional-job-accept':{const a=adventureState(),job=a.regionalJobOffer;if(job&&job.id===v&&!a.regionalJob&&!a.regionalJobClaims[v]){a.regionalJob={...job,baseline:regionalJobMetric(job.kind)};save();regionalJobMenu();}break;}
case'regional-job-claim':{const a=adventureState(),job=a.regionalJob;if(job&&regionalJobMetric(job.kind)-job.baseline>=job.target&&!a.regionalJobClaims[job.id]){a.regionalJobClaims[job.id]=true;s.inventory.coins+=job.reward;delete a.regionalJob;save();regionalJobMenu();toast('Regional work completed.');}break;}
case'regional-job-cancel':delete adventureState().regionalJob;save();regionalJobMenu();break;
case'quest-board':questBoard(v);break;
case'quest-accept':questAction(v,false);break;
case'quest-claim':questAction(v,true);break;
case'npc-trade':tradeSpirit();break;
case'confirm-trade':{if(!s.trade)return;const{out,incoming}=s.trade;if(s.party.includes(out))return;const outgoing=s.spirits.find(i=>i.id===out);if(outgoing&&Q.heldEquipment(outgoing))Q.equipOwnedHeldItem(outgoing,null,heldState(),spOf(outgoing));s.spirits=s.spirits.filter(i=>i.id!==out);s.spirits.push(incoming);discover(spOf(incoming),incoming.appearance);delete s.trade;save();closeModal();render();toast('The exchange is complete. A new Spirimon rests in your tattoos.');break;}
case'trade-items':if(s.inventory.seals<3)return toast('You need three seal catalysts.');s.inventory.seals-=3;s.inventory.tonics++;save();talk(s.activeNPC);render();toast('Trade complete.');break;
case'battle-main':movePreviewKey=null;battleMode='main';render();break;
case'battle-bag':movePreviewKey=null;battleMode='bag';render();break;
case'battle-record':showModal('Battle record.','<div class="battle-record-list">'+battle.log.slice(-25).map(t=>'<p>'+esc(t)+'</p>').join('')+'</div>');break;
case'yield':recordCompetitionDefeat();endCombatState();battle=null;save();render();toast('You concede the friendly match.');break;
case'style':style=v;render();break;
case'ether':useEther();break;
case'rt-pause':if(battle?.rt){battle.rt.paused=!battle.rt.paused;save();render();}break;
case'unified-seal':if(unifiedSuppressClick&&ev.detail!==0){unifiedSuppressClick=false;break;}unifiedSuppressClick=false;battleSeal(battle?.sealExtra||0,v);break;
case'unified-move':{if(unifiedSuppressClick){unifiedSuppressClick=false;break;}const now=performance.now();if(unifiedTap&&unifiedTap.value===v&&now-unifiedTap.at<330){clearTimeout(unifiedTap.timer);unifiedTap=null;const preset=s.settings?.movePresets?.[v]||{};useUnifiedMove(v,preset.style||'normal',preset.commit||0,preset.extraMoves||0);}else{if(unifiedTap){clearTimeout(unifiedTap.timer);useUnifiedMove(unifiedTap.value,'normal',0,0);}const pending={value:v,at:now};pending.timer=setTimeout(()=>{if(unifiedTap===pending){unifiedTap=null;useUnifiedMove(v,'normal',0,0);}},330);unifiedTap=pending;}break;}
case'rt-actor':if(battle?.rt&&(battle.multi?.allies||[battle.ally]).includes(v)){battle.controlledAlly=v;selectedMove=0;render();}break;
case'rt-auto':break;
case'rt-info':if(battle?.rt){const actor=activeBattleAlly(),move=battleMoves(actor)[Number(v)||0],p=RT.moveTiming(move,actor,spOf(actor),style);showModal(move.name,'<p>'+esc(E.moveLore(move).description)+'</p>'+(E.moveLore(move).disruptionText?'<p>'+esc(E.moveLore(move).disruptionText)+'</p>':'')+'<p>Power '+p.power+' · '+p.timing.toUpperCase()+' '+seconds(p.cooldownMs)+' · Local recast '+seconds(p.localCooldownMs)+' · Cast '+seconds(p.castMs)+' · Recovery '+seconds(p.recoveryMs)+'</p><p>Level threshold '+p.threshold+(p.nextThreshold?' · Next scaling threshold '+p.nextThreshold:' · Maximum scaling tier')+'.</p><p>Combat continues while this window is open.</p>');}break;
case'omega-act':useOmegaAction();break;
case'battle-seal':battleSeal();break;
case'battle-switch':if(battle?.rt){battleMode='deploy';closeModal();render();}break;
case'switch-to':releaseBattleMember(v);break;
case'tonic':useTonic();break;
case'support':if(battle?.rt){battleMode='support';closeModal();render();}break;
case'flee':if(!battle||actionBusy)return;if(battle.rt&&!claimRealTimeUtility(3500))return;{const ally=s.spirits.find(i=>i.id===battle.ally),enemy=battle.enemy;const aSpeed=ally?.hp>0?E.stats(ally,spOf(ally)).speed:20,eSpeed=E.stats(enemy,spOf(enemy)).speed;const chance=Math.max(.2,Math.min(.9,.55+(aSpeed-eSpeed)/Math.max(40,eSpeed)*.35+(battle.escapeAttempts||0)*.12));if(Math.random()<chance){recordCompetitionDefeat();endCombatState();battle=null;ensurePlayerOnPath();save();render();toast('You escaped the battle.');}else{battle.escapeAttempts=(battle.escapeAttempts||0)+1;await enemyOnly('Your attempt to escape failed!');}}break;
case'settings':settings();break;
case'profile':profile();break;
case'rename':s.player.name=$('#rename').value.trim().slice(0,24)||'Sealer';save();closeModal();render();break;
case'export':exportSave();break;
case'choose-device-save':await chooseDeviceSave();break;
case'calibrate':O.calibrateInput({settings:s.settings,persist,open:(title,html)=>showModal(title,html,{kind:'calibration'})});break;
case'music-toggle':s.settings.musicEnabled=s.settings.musicEnabled===false;audio.setEnabled(s.settings.musicEnabled);save();settings();break;
case'check-ai':await checkAI();break;
case'ai-test-provider':await testProvider(false);break;
case'ai-test-auto':await testProvider(true);break;
case'inspect-anatomy':{inspectCollectionAnatomy();break;}
case'generate-now':{if(!s.settings.aiEnabled)return toast('Enable local AI generation first.');queueFresh(currentRegion(),Math.random,true);toast('Lineage queued. All three forms must finish before entering the AI library.');processQueue();break;}
case'new-world':{if(battle)return toast('Finish the battle first.');s.pendingSeed=$('#new-seed').value.trim();showModal('Start a new journey?','<p>Your current world will be retained as a recovery copy. Export a backup too if you want to keep it permanently. Your shared Spirimon library stays available.</p><div class="btn-row">'+action('confirm-new','Start new world','','btn danger')+action('export','Export current world')+action('close','Cancel','','btn ghost')+'</div>');break;}
case'confirm-new':{await dbPut('saves',structuredClone(s),'before-import');const seed=s.pendingSeed;cancelArtworkGeneration();s=E.newGame(seed||undefined);installRoster();battle=null;queue=[];view='explore';closeModal();discoverRegion();introduceFirstEncounter();render();starters();save();break;}
case'restore-backup':{const backup=await dbGet('saves','before-import');if(!backup)return toast('No recovery world is stored yet.');const current=structuredClone(s);cancelArtworkGeneration();s=backup;queue=s.generationQueue||[];E.migrateSaveCreatures(s);installRoster();normalizeWildPopulation();battle=s.battle||null;if(battle)ensureRealTimeBattle();await dbPut('saves',current,'before-import');closeModal();discoverRegion();save();render();toast('Previous world restored.');break;}
case'interact':interact();break;
case'mini-region':{const r=s.regions[v];if(r?.visited)showModal(r.name,'<p>'+esc(r.biome.name)+' · Level '+r.danger+'+ · Region '+esc(v)+'</p><p>Explore this region from the world map.</p>');break;}
case'field-menu':fieldMenu();break;
case'field-use':{const [kind,key]=v.split(':');closeModal();fieldTravel(kind,key);break;}
case'party-up':{if(!safe())return toast('Reorder your team at a safe place.');const n=s.party.indexOf(v);if(n>0&&!battle){[s.party[n-1],s.party[n]]=[s.party[n],s.party[n-1]];save();render();}break;}
case'party-down':{if(!safe())return toast('Reorder your team at a safe place.');const n=s.party.indexOf(v);if(n>=0&&n<s.party.length-1&&!battle){[s.party[n+1],s.party[n]]=[s.party[n],s.party[n+1]];save();render();}break;}
case'region-info':{const r=s.regions[v];showModal(r.name,'<p>'+esc(r.biome.desc)+'<br>Biome: '+esc(r.biome.name)+'<br>Stable danger: level '+r.danger+' and above<br>'+(r.town?'A guild settlement offers supplies and familiar faces. Find a Shrine for restoration.':'Wilderness region. Follow the crossing trails to keep exploring.')+'</p>');break;}
}});
document.addEventListener('input',ev=>{if(ev.target.id==='dex-search'){const pos=ev.target.selectionStart;dexView.search=ev.target.value;dexView.page=0;render();$('#dex-search').focus();$('#dex-search').setSelectionRange(pos,pos);}if(ev.target.id==='commitment')commit=Number(ev.target.value)/100;if(ev.target.id==='spirit-search'){const pos=ev.target.selectionStart;search=ev.target.value.toLowerCase();render();$('#spirit-search').focus();$('#spirit-search').setSelectionRange(pos,pos);}});
document.addEventListener('change',ev=>{if(ev.target.id==='dex-status'||ev.target.id==='dex-type'){dexView[ev.target.id==='dex-status'?'status':'type']=ev.target.value;dexView.page=0;render();$('#'+ev.target.id)?.focus();}if(ev.target.id==='held-recipient'){heldRecipient=ev.target.value;equipmentMenu();}if(ev.target.id==='held-category'){heldCategory=ev.target.value;equipmentMenu();}if(ev.target.id==='battle-target'&&battle){battle.targetSelection=Number(ev.target.value);}if(ev.target.id==='rt-enemy-target'){battle.enemyTargetSelection=Number(ev.target.value);}if(ev.target.id==='rt-ally-target'){battle.allyTargetSelection=Number(ev.target.value);}if(ev.target.id==='support-target'&&battle){battle.supportTargetId=ev.target.value;render();}if(ev.target.id==='rt-style'){style=ev.target.value;render();}if(ev.target.id==='layout-setting'){s.settings.layout=ev.target.value;applyLayout();save();}if(ev.target.id==='starter-base'){s.player.name=$('#sealer-name').value||'Sealer';starterBase=ev.target.value;starters();}if(ev.target.id==='spirit-filter'){filter=ev.target.value;render();}if(ev.target.id==='timing-setting'){s.settings.timing=ev.target.value;save();}if(ev.target.id==='import-file')importSave(ev.target.files[0]);if(ev.target.id==='ai-provider'){s.settings.aiProvider=ev.target.value;save();}if(ev.target.id==='ai-fallback'){s.settings.aiFallback=ev.target.value;save();}if(ev.target.id==='ai-ollama-url'){s.settings.ollamaUrl=ev.target.value.trim();save();}if(ev.target.id==='ai-cloud-key'){aiSessionKey=ev.target.value;}if(ev.target.id==='ai-provider-model'&&aiProviderResult){s.settings.aiModels??={};s.settings.aiModels[aiProviderResult.type]=ev.target.value;save();}if(ev.target.id==='ai-enabled'){s.settings.aiEnabled=ev.target.checked;save();if(ev.target.checked)checkAI();}if(ev.target.id==='ai-model'){s.settings.model=ev.target.value;save();}if(ev.target.id==='ai-vision-model'){s.settings.visionModel=ev.target.value;save();}});
document.addEventListener('keydown',ev=>{const k=ev.key.toLowerCase();if(['INPUT','SELECT','TEXTAREA'].includes(ev.target.tagName)&&ev.target.type!=='range')return;if(k==='escape'){if(modal==='starter'||modal==='welcome'||modal==='replacement')return;closeModal();return;}if(modal){if(ritual&&(k===' '||k==='enter')){ev.preventDefault();sealPulse();}return;}if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))ev.preventDefault();keys.add(k);if(ev.repeat)return;const walkKeys={w:[0,-1],a:[-1,0],s:[0,1],d:[1,0],arrowup:[0,-1],arrowleft:[-1,0],arrowdown:[0,1],arrowright:[1,0]};if(walkKeys[k]){move(...walkKeys[k]);return;}if(k==='e'||k==='enter')interact();if(k==='b')bag();if(['1','2','3','4','5'].includes(k)&&!battle){view=['explore','spirits','atlas','journal','spiridex'][Number(k)-1];render();}});
document.addEventListener('keyup',ev=>keys.delete(ev.key.toLowerCase()));window.addEventListener('blur',()=>{keys.clear();running=false;queuedStep=null;});document.addEventListener('visibilitychange',()=>{keys.clear();persist();});window.addEventListener('pagehide',()=>persist());
function startupStatus(message){window.dispatchEvent(new CustomEvent('spirimon-startup',{detail:message}));}
async function boot(){try{startupStatus('Opening saved journey…');startupStatus('Reading saved Spirimon…');const initial=await loadInitialJourney();deviceSaveBlocked=!!initial.writeBlocked;startupSaveWarning=initial.warning||null;for(const sp of initial.library||[])library[sp.id]=sp;s=initial.save||E.newGame();s.species??={};s.spirits=Array.isArray(s.spirits)?s.spirits:[];s.roamers??={};for(const [key,group]of Object.entries(s.roamers))if(!Array.isArray(group))s.roamers[key]=[];s.regions??={};s.inventory??={};s.settings??={};E.migrateSaveCreatures(s);for(const sp of Object.values(library))E.migrateSpecies(sp);const rename=value=>typeof value==='string'?value.replace(/\bspirits?\b/gi,'Spirimon'):value;s.notes=(s.notes||[]).map(rename);battle=s.battle||null;if(battle){battle.log=(battle.log||[]).map(rename);battle.message=rename(battle.message);}queue=s.generationQueue||[];SE.ensureSealer(s);s.inventory.ethers??=3;s.inventory.herbs??=3;s.inventory.incense??=2;s.inventory.ore??=2;heldState();audio.setEnabled(s.settings.musicEnabled!==false);startupStatus('Preparing Spirimon and world…');installRoster();normalizeWildPopulation();for(const i of s.spirits){const sp=s.species[i.species];if(sp)i.pp??=E.stats(i,sp).pp;}upgradeWildLevels();globalThis.spirimonSpecies=s.species;discoverRegion();introduceFirstEncounter();if(!battle)ensurePlayerOnPath();if(s.interior)W.normalizeInteriorPosition(s.interior);startupStatus('Loading world and mystery artwork (0 / 6)…');await preloadImages([...Object.values(ART),MYSTERY_STATIC,MYSTERY_WALK,...SACRED_ASSETS],(done,total)=>startupStatus('Loading world and mystery artwork ('+done+' / '+total+')…'));loaded=true;if(battle)ensureRealTimeBattle();SE.autoAssignSupport(s);render();if(!s.starter)starters();else if(!battle&&s.sealer.startingChosen.length<3)startingSupportMenu();if(s.settings.aiEnabled){queueFresh(currentRegion(),Math.random,true);checkAI().then(()=>{processQueue();if(aiStatus?.visionModels?.length)inspectCollectionAnatomy();});}globalThis.spirimonArtLoaded=()=>{renderSpiritCanvases();if(battle)drawBattle();};requestAnimationFrame(tick);setInterval(persist,15000);setInterval(processQueue,5000);window.dispatchEvent(new Event('spirimon-ready'));if(startupSaveWarning)toast(startupSaveWarning);}catch(err){loaded=false;window.dispatchEvent(new CustomEvent('spirimon-startup-error',{detail:err.message||String(err)}));console.error(err);}}
boot();

function useEther(){if(battle?.rt){const ctx=realTimeContext(),u=ctx.active.a.find(u=>{const max=E.stats(u,spOf(u));return (u.pp<max.pp||u.willpower<max.willpower)&&RT.actionAvailability(battle.rt,u,spOf(u),{type:'item'}).ok;});if(!u)return toast('No ally can use a soul draught now.');battle.controlledAlly=u.id;closeModal();return submitRealTimeAction({type:'item',item:'ether',targetIndex:(battle.multi?.allies||[battle.ally]).indexOf(activeBattleAlly().id)});}if(!(s.inventory.ethers>0))return toast('Buy soul draughts from Tavi.');const i=battle?s.spirits.find(x=>x.id===battle.ally):lead();if(!i)return;const st=E.stats(i,spOf(i)),max=st.pp,willMax=st.willpower;i.pp??=max;i.willpower??=willMax;if(i.pp>=max&&i.willpower>=willMax)return toast('Your Spirimon’s Stamina and Willpower are full.');s.inventory.ethers--;i.pp=Math.min(max,i.pp+Math.ceil(max*.6));i.willpower=Math.min(willMax,i.willpower+Math.ceil(willMax*.6));closeModal();if(battle)enemyOnly('A soul draught restores your Stamina and Willpower.');else{save();render();toast('Your Spirimon’s Stamina and Willpower are restored.');}}

function applyLayout(){const mobile=s.settings.layout==='emulator'||s.settings.layout!=='desktop'&&(matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>0);document.body.classList.toggle('emulator-mode',mobile);document.body.classList.toggle('exploring',view==='explore'&&!battle);document.body.classList.toggle('battling',!!battle);document.body.classList.toggle('portrait-allowed',!!s.settings.portraitAllowed);if(!$('#emulator-shell')){const shell=document.createElement('div');shell.id='emulator-shell';shell.innerHTML='<div class="emulator-controls"><div class="emu-pad"><span class="emu-pad-center"></span><button data-hold="up" aria-label="Move up">▲</button><button data-hold="left" aria-label="Move left">◀</button><button data-hold="right" aria-label="Move right">▶</button><button data-hold="down" aria-label="Move down">▼</button></div><div class="emu-ab">'+'<button data-action="emu-b" data-run="true" aria-label="Run, hold B">B</button>'+action('emu-a','A','','')+'</div><div class="emu-menu">'+action('game-menu','MENU','','')+action('bag','BAG','','')+action('fullscreen','⛶','','')+'</div></div>'+action('view','← Return to game','explore','mobile-return')+'<div class="portrait-prompt"><div class="rotate-icon">▱ ↻</div><h2>A world worth turning for.</h2><p>Rotate your phone sideways for the full Spirimon experience, with emulator-style controls.</p>'+action('fullscreen','Play in landscape','','btn primary')+'<div style="margin-top:12px">'+action('portrait-play','Continue in portrait','','btn ghost')+'</div></div>';document.body.appendChild(shell);}}
async function enterFullscreen(){try{if(!document.fullscreenElement&&document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();if(screen.orientation?.lock)await screen.orientation.lock('landscape');}catch{toast('Rotate your phone sideways to play in landscape.');}}
document.addEventListener('pointerdown',ev=>{const button=ev.target.closest('[data-hold]');if(!button){if(ev.target.closest('[data-run]')){ev.preventDefault();running=true;}return;}ev.preventDefault();const dir=button.dataset.hold,key={up:'w',left:'a',right:'d',down:'s'}[dir];button.setPointerCapture?.(ev.pointerId);button.classList.add('held');move(...{up:[0,-1],left:[-1,0],right:[1,0],down:[0,1]}[dir]);keys.add(key);});
function releaseTouch(ev){if(ev.target.closest('[data-run]'))running=false;const button=ev.target.closest('[data-hold]');if(button){keys.delete({up:'w',left:'a',right:'d',down:'s'}[button.dataset.hold]);button.classList.remove('held');}}
document.addEventListener('pointerup',releaseTouch);document.addEventListener('pointercancel',()=>{keys.clear();running=false;document.querySelectorAll('.held').forEach(b=>b.classList.remove('held'));});window.addEventListener('resize',()=>{if(loaded)applyLayout();});

function installRoster(){
 E.useRegionHistory(s.seed,s.regions??={});
 s.rosterRevision=6;
 for(const row of ROSTER){const id='roster-'+row.id,old=s.species[id]||library[id];let sp;
  if(old)sp=E.migrateSpecies(old);
  else{sp={...E.makeSpecies(id,row.base,row.alter,row.domains),id,name:row.forms[1],forms:row.forms,description:row.description,body:row.description,anatomy:row.anatomy,legacyTypes:row.legacyTypes,atlas:row.atlas,proceduralArt:!!row.proceduralArt,source:'original-roster'};delete sp.design;sp.learnset=[];sp.moveRevision=0;syncCapabilities(sp);}
  // Refresh shared artwork for existing journeys without replacing progression.
  if(row.atlas){sp.atlas=row.atlas;sp.artRevision=row.artRevision||1;sp.proceduralArt=false;sp.description=row.description;sp.body=row.description;delete sp.sprites;}
  if(row.formAnatomy){sp.formAnatomy=structuredClone(row.formAnatomy);sp.anatomy=sp.formAnatomy[0];syncCapabilities(sp);}
  if(row.formData)sp.formData=structuredClone(row.formData);
  if(row.evolutionRevision)sp.evolutionRevision=row.evolutionRevision;
  if(!sp.atlas&&sp.sprites?.length!==3)sp.proceduralArt=true;
  if(sp.proceduralArt)certifyRenderedAnatomy(sp);register(sp);
 }
 for(const sp of Object.values(s.species)){
  E.migrateSpecies(sp);const stored=library[sp.id];
  if(!hasFinishedArtwork(sp)&&hasFinishedArtwork(stored)&&sp.base===stored.base&&sp.alter===stored.alter){for(const key of ['atlas','sprites','proceduralArt','visualValidation','artRevision','formAnatomy'])if(stored[key]!==undefined)sp[key]=structuredClone(stored[key]);}
  if(!sp.atlas&&sp.sprites?.length!==3)sp.proceduralArt=true;register(sp);
 }

}

function gameMenu(){showModal('Sealer’s satchel.','<p>'+esc(s.player.name)+' · '+rankName()+' · '+s.inventory.coins+' Coin</p><div class="menu-grid">'+action('view','SPIRIMON','spirits')+action('view','SPIRIDEX','spiridex')+action('bag','BAG')+action('view','MAP','atlas')+action('field-menu','FIELD SKILLS')+action('view','JOURNAL','journal')+action('profile','SEALER')+action('spiritual-arts','SPIRITUAL ARTS')+action('support-prepare','SUPPORT')+action('spiritual-recovery','COMMUNE / MEDITATE')+action('field-ritual-menu','RITUALS')+action('settings','OPTIONS')+action('save-now','SAVE')+action('close','RETURN','','btn primary')+'</div><p class="help-line">WASD / arrows: walk · Shift: run · E: interact<br>On touch: hold a direction; hold B to run.</p>');}


function normalizeWildPopulation(){
 if(!s.roamers||typeof s.roamers!=='object')s.roamers={};s.artworkBackfilled??={};
 for(const [key,group]of Object.entries(s.roamers)){
  if(!Array.isArray(group)){s.roamers[key]=[];continue;}
  const valid=group.filter(r=>r&&r.ind&&Number.isFinite(r.x)&&Number.isFinite(r.y)&&s.species[r.ind.species]),active=valid.filter(roamerArtworkReady);
  if(active.length>7){const keep=new Set(active.slice(0,7));for(const r of active)if(!keep.has(r))r.active=false;}
  s.roamers[key]=valid.filter(r=>r.active||!String(r.id).startsWith('nearby-')&&!String(r.id).startsWith('visible-'));
  // Retain unfinished saved individuals, but provide visible, finished encounters.
  if(s.artworkBackfilled[key]||!valid.some(r=>r.active&&!roamerArtworkReady(r)))continue;
  const [cx,cy]=key.split(',').map(Number);if(!Number.isInteger(cx)||!Number.isInteger(cy))continue;
  const reg=s.regions[key]||E.region(s.seed,cx,cy),r=E.rng(E.hash(s.seed,'artwork-backfill',key));
  for(let slot=active.length;slot<7;slot++){
   let position;for(let attempt=0;attempt<120;attempt++){const x=cx*48+4+Math.floor(r()*40),y=cy*36+4+Math.floor(r()*28);if(E.walkable(E.tile(s.seed,x,y))&&!buildingSpriteBlocked(x,y)&&Math.abs(x-s.player.x)+Math.abs(y-s.player.y)>2&&!s.roamers[key].some(o=>roamerArtworkReady(o)&&o.x===x&&o.y===y)){position={x,y};break;}}
   if(!position)continue;
   const sp=speciesFor(reg,r),ind=equipWildItem(E.heal(E.makeIndividual(sp,E.encounterLevel(reg,r),E.rollForm(r),r),sp),sp);
   s.roamers[key].push({id:'art-backfill-'+key+'-'+slot,...position,ind,active:true});
  }
  s.artworkBackfilled[key]=true;
 }
}

function introduceFirstEncounter(){if(s.spirits.length)return;const existing=(s.roamers['0,0']||[]).some(r=>roamerArtworkReady(r)&&Math.abs(r.x-s.player.x)<=5&&Math.abs(r.y-s.player.y)<=4);if(existing)return;const sp=speciesFor(currentRegion(),Math.random);s.roamers['0,0'].push({id:'first-bond',x:26,y:20,active:true,ind:E.heal(E.makeIndividual(sp,3),sp)});s.firstEncounterPlaced=true;save();}

function ensurePlayerOnPath(){if(E.walkable(E.tile(s.seed,s.player.x,s.player.y),abilityReady('swim'),abilityReady('climb'))&&!buildingSpriteBlocked(s.player.x,s.player.y))return;for(let radius=1;radius<18;radius++)for(let dy=-radius;dy<=radius;dy++)for(let dx=-radius;dx<=radius;dx++)if(E.walkable(E.tile(s.seed,s.player.x+dx,s.player.y+dy))&&!buildingSpriteBlocked(s.player.x+dx,s.player.y+dy)){s.player.x+=dx;s.player.y+=dy;walkAnim=null;return;}}

function enterBuilding(building){if(modal||battle)return;s.mountedSteed=null;s.interior=W.makeInterior(building);s.interior.trail=[{x:s.interior.x,y:s.interior.y,face:'down'}];walkAnim=null;keys.clear();save();render();toast(building.name);}
function moveInside(dx,dy){if(modal||battle||view!=='explore')return;const room=s.interior,x=room.x+dx,y=room.y+dy;room.face=dx<0?'left':dx>0?'right':dy<0?'up':'down';const npc=W.roomNPCs(room).find(n=>n.x===x&&n.y===y);if(npc)return;if(!W.roomWalkable(room.kind,x,y))return;if(y===10&&x===7){s.player.x=room.outside.x;s.player.y=room.outside.y;s.player.face='down';delete s.interior;keys.clear();save();render();return;}room.trail??=[];room.trail.push({x:room.x,y:room.y,face:room.face});if(room.trail.length>24)room.trail.shift();room.walkStart=performance.now();room.walkDuration=running||keys.has('shift')?100:170;room.x=x;room.y=y;s.steps++;lastStep=performance.now();save();$('#map-hint').textContent=hint();}
function drawInterior(canvas,time){
 if(!readyImage(INTERIOR_ATLAS)||!readyImage(MATERIAL_ATLAS)||!readyImage(ART.sealer))return;
 const rect=canvas.getBoundingClientRect(),width=Math.max(320,Math.round(rect.width/2)),height=Math.max(200,Math.round(rect.height/2));
 if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
 const c=canvas.getContext('2d'),room=s.interior,unit=32,roomWidth=W.ROOM_W*unit,roomHeight=W.ROOM_H*unit;
 c.imageSmoothingEnabled=false;c.fillStyle='#211d22';c.fillRect(0,0,width,height);
 const walking=Number.isFinite(room.walkStart)&&time-room.walkStart<room.walkDuration;
 const progress=walking?movementProgress(time,room.walkStart,room.walkDuration):1;
 const prev=room.trail?.at(-1),px=prev&&walking?prev.x+(room.x-prev.x)*progress:room.x,py=prev&&walking?prev.y+(room.y-prev.y)*progress:room.y;
 mapCamera=updateMapCamera(mapCamera,{x:px*unit+16,y:py*unit+16,width,height,scene:room,bounds:{width:roomWidth,height:roomHeight}});
 const ox=-mapCamera.left,oy=-mapCamera.top;
 const actors=W.roomNPCs(room).map(n=>({z:n.y+1,draw:()=>drawPerson(c,ox+n.x*unit,oy+n.y*unit,n.role,time)}));
 const follower=lead();
 if(follower){
  const trail=room.trail?.length?room.trail:[{x:room.x,y:room.y+1,face:room.face}];
  const step=Math.max(0,trail.length-3),from=trail[step],next=trail[step+1]||from;
  const fx=from.x+(next.x-from.x)*(walking?progress:1),fy=from.y+(next.y-from.y)*(walking?progress:1);
  const dx=next.x-from.x,dy=next.y-from.y,travelFace=dx<0?'left':dx>0?'right':dy<0?'up':dy>0?'down':room.face;
  const face=travelFace==='up'||travelFace==='down'?(Math.floor(time/500)%2?'right':'left'):travelFace;
  actors.push({z:fy+1,draw:()=>{const size=companionSize(spOf(follower),follower.appearance).size;drawAspectAura(c,follower,ox+fx*unit+16-size/2,oy+fy*unit+30-size,size);drawCompanion(c,spOf(follower),follower.appearance,ox+fx*unit+16-size/2,oy+fy*unit+30-size,size,face,walking,progress);}});
 }
 actors.push({z:py+1,draw:()=>drawPerson(c,ox+px*unit,oy+py*unit,'player',time,room.face,walking,adventureState().appearance)});
 drawInteriorScene(c,room,ox,oy,time,actors);drawSpiritualPerception(c,x=>ox+x*32,y=>oy+y*32);
 const location=$('#map-location'),biome=$('#map-biome');if(location)location.textContent=room.name;if(biome)biome.textContent=currentRegion().name.toUpperCase()+' · INTERIOR';
}

function hasFinishedArtwork(sp){const source=value=>typeof value==='string'&&value.trim().length>0;return !!(source(sp?.atlas)||sp&&!sp.proceduralArt&&sp.visualValidation?.status!=='procedural-verified'&&sp.visualValidation?.semanticSource!=='renderer-geometry'&&sp.sprites?.length===3&&[0,1,2].every(form=>source(sp.sprites[form])));}
function artworkStatusText(sp){
 if(hasFinishedArtwork(sp))return '';
 if(sp.artworkJob?.state==='generating'&&activeGenerationId===sp.id)return 'Artwork: creating finished images for all three forms.';
 if(sp.artworkJob?.state==='unavailable')return 'Artwork unavailable: '+sp.artworkJob.message;
 if(s.settings.aiEnabled&&queue.includes(sp.id))return 'Artwork queued for this Spirimon. A connected image companion and vision model are required.';
 return 'Artwork unavailable: this lineage has no finished images. Waiting will not load an image. Connect an image companion, or export your save for artwork repair.';
}
function artworkStatusHTML(sp){const text=artworkStatusText(sp);return text?'<p class="help-line" role="status" data-artwork-status="'+esc(sp.id)+'">'+esc(text)+'</p>':'';}
function refreshArtworkStatus(){for(const node of document.querySelectorAll('[data-artwork-status]')){const sp=s.species[node.dataset.artworkStatus];if(sp)node.textContent=artworkStatusText(sp);}}
function queueOwnedArtwork(){
 const owned=[...new Set(s.spirits.map(i=>i.species))],ownedIds=new Set(owned);
 const others=[...(battle?.multi?.enemies||[]),battle?.enemy,s.trade?.incoming,...Object.values(s.roamers||{}).flat().filter(r=>r?.active).map(r=>r.ind)].filter(Boolean).map(i=>i.species);
 for(const id of [...new Set([...others,...(s.seen||[])])].reverse()){const sp=s.species[id];if(sp&&!ownedIds.has(id)&&!hasFinishedArtwork(sp))queueFresh(null,Math.random,true,sp);}
 for(const id of owned.reverse()){const sp=s.species[id];if(sp&&!hasFinishedArtwork(sp))queueFresh(null,Math.random,true,sp);}
 // Text-only future designs remain repairable when an image provider connects later.
 for(const sp of Object.values(library))if(!hasFinishedArtwork(sp))queueFresh(null,Math.random,false,sp);
}

function queueFresh(reg,r=Math.random,force=false,prototype=null){
 s.generationPlans??={};
 if(prototype){
  const id=prototype.id;if(hasFinishedArtwork(prototype)||activeGenerationId===id)return false;
  if(queue.includes(id)){if(force){queue.splice(queue.indexOf(id),1);queue.unshift(id);}return false;}
  if(!force&&queue.length>=3)return false;
  s.generationPlans[id]=structuredClone(prototype);if(force)queue.unshift(id);else queue.push(id);save();return true;
 }
 if(queue.length>=3)return false;
 const base=E.pick(reg.biome.types,r),alter=E.pick(E.TYPES.filter(t=>t!==base),r),plan=E.makeSpecies(E.hash(s.seed,'ai-plan',Date.now(),r()),base,alter);s.generationPlans[plan.id]=plan;queue.push(plan.id);save();return true;
}

function learnMenu(id,slot=null){if(!safe())return toast('Practice at a safe place.');const i=s.spirits.find(x=>x.id===id);if(!i)return;const sp=spOf(i),available=E.availableTechniques(i,sp);showModal('Practice a technique.',slot===null?'<p>Choose the technique slot to replace.</p><div class="btn-row">'+E.equippedMoves(i,sp).map((m,n)=>action('learn-slot',esc(m.name),id+':'+n)).join('')+'</div>':'<p>Choose a technique learned through levels, transformation, or earlier practice.</p><div class="learn-grid">'+available.map(m=>action('learn-move',esc(m.name)+'<small>'+m.type+(m.domain?' · '+m.domain:'')+' · Power '+m.power+' · '+RT.moveTiming(m,i,sp).timing.toUpperCase()+' '+seconds(RT.moveTiming(m,i,sp).localCooldownMs||RT.moveTiming(m,i,sp).cooldownMs)+' CD'+'</small>',id+'|'+slot+'|'+m.id)).join('')+'</div>');}

function upgradeWildLevels(){if(s.levelRevision===2)return;s.townsVisited??=Object.values(s.regions).filter(r=>r.visited&&r.town&&r.key!=='0,0').map(r=>r.key);for(const reg of Object.values(s.regions)){Object.assign(reg,E.encounterRange(s.seed,reg.cx,reg.cy,s.townsVisited.length));reg.danger=reg.minLevel;for(const r of s.roamers[reg.key]||[]){r.ind.level=E.encounterLevel(reg,E.rng(E.hash(s.seed,r.id,'rebalance')));E.heal(r.ind,spOf(r.ind));}}s.levelRevision=2;}

document.addEventListener('pointerdown',()=>audio.unlock().catch(()=>{}),{once:true});document.addEventListener('keydown',()=>audio.unlock().catch(()=>{}),{once:true});

async function inspectCollectionAnatomy(){
 try{const status=await AI.probe('companion',s.settings),visionModel=s.settings.visionModel||status.visionModels?.[0];if(!visionModel)return toast('Install a vision-capable Ollama model, then check the companion.');
 const species=[...new Set(s.spirits.map(i=>i.species))].map(id=>s.species[id]).filter(sp=>sp.atlas&&!sp.capabilities?.verified);let checked=0;
 for(const sp of species){const sprites=await atlasSprites(sp),res=await fetch(COMPANION+'/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({species:sp,sprites,visionModel}),signal:AbortSignal.timeout(900000)}),data=await res.json();if(!res.ok){note('Anatomy remains unverified for '+sp.forms[0]+': '+(data.error||'Image inspection failed'));continue;}const observations=data.visualValidation?.observations;if(observations?.length!==3)throw Error('Incomplete anatomy inspection');applyLineageObservations(sp,observations);sp.visualValidation=data.visualValidation;register(sp);checked++;save();}
 toast('Verified anatomical records for '+checked+' lineages.');
 }catch(error){toast('Anatomy inspection: '+error.message);}
}

// Live battles use the saved simulation clock.
function realTimeContext(){return battleSession.realTimeContext(...arguments);}
function ensureRealTimeBattle(){return battleSession.ensureRealTimeBattle(...arguments);}
function submitRealTimeAction(choice){
 if(!battle?.rt)return {ok:false,reason:'No battle'};const actor=activeBattleAlly();if(!actor||!battle.multi.allies.includes(actor.id))return {ok:false,reason:'Release a Spirimon first'};
 const ctx=realTimeContext(),result=RT.scheduleAction(battle.rt,ctx,actor,choice);
 if(!result.ok){toast(result.reason+(result.remainingMs?' · '+seconds(result.remainingMs):''));return result;}
 battle.participants=[...new Set([...(battle.participants||[]),actor.id])];closeModal();save();render();return result;
}
function claimRealTimeUtility(duration){
 if(battle.rt.paused)return false;if((battle.utilityReadyAt||0)>battle.rt.elapsedMs){toast('Sealer action cooldown · '+seconds(battle.utilityReadyAt-battle.rt.elapsedMs));return false;}battle.utilityReadyAt=battle.rt.elapsedMs+duration;return true;
}

function unifiedBattleActionsHTML(){return battleView.unifiedBattleActionsHTML(...arguments);}
function realTimeBattleHTML(){return battleView.realTimeBattleHTML(...arguments);}

let lastRealTimeUi=0,lastRealTimeDraw=0;
function refreshRealTimeUI(){
 if(!battle?.rt)return;
 const grid=document.querySelector('#unified-action-grid');
 if(grid){
  if(unifiedGesture&&(!unifiedGesture.button.isConnected||!grid.contains(unifiedGesture.button)))clearUnifiedGesture();
  refreshUnifiedActions(grid,unifiedBattleActionsHTML(),unifiedGesture?.button);
 }
 for(const box of document.querySelectorAll('[data-rt-status-container]')){const ctx=realTimeContext(),u=[...ctx.teams.a,...ctx.teams.b].find(u=>u.id===box.dataset.rtStatusContainer);if(u)box.innerHTML=realTimeStatusHTML(battle.rt,u,esc);}
}
let unifiedGesture=null,unifiedSuppressClick=false,unifiedTap=null;
function refreshUnifiedActions(grid,html,held=null){
 if(!held&&grid.dataset.signature===html)return;
 const template=grid.ownerDocument.createElement('template');template.innerHTML=html;
 const key=node=>node.dataset.unifiedMove?'move:'+node.dataset.unifiedMove:node.dataset.unifiedSeal?'seal:'+node.dataset.unifiedSeal:[node.dataset.action||node.tagName,node.dataset.value||'',node.querySelector('b')?.textContent||''].join('|');
 const existing=new Map();for(const node of grid.children){const id=key(node);if(!existing.has(id))existing.set(id,[]);existing.get(id).push(node);}
 const desired=[];
 for(const incoming of template.content.children){
  const node=existing.get(key(incoming))?.shift()||incoming;
  if(node!==incoming&&node!==held&&node.outerHTML!==incoming.outerHTML){
   for(const attr of [...node.attributes])if(!incoming.hasAttribute(attr.name))node.removeAttribute(attr.name);
   for(const attr of incoming.attributes)if(node.getAttribute(attr.name)!==attr.value)node.setAttribute(attr.name,attr.value);
   if(node.innerHTML!==incoming.innerHTML)node.innerHTML=incoming.innerHTML;
  }
  desired.push(node);
 }
 const keep=new Set(desired);if(held)keep.add(held);
 for(const node of [...grid.children])if(!keep.has(node))node.remove();
 if(held){
  // Preserve capture while adding ready actions.
  for(const node of desired)if(node.parentElement!==grid)grid.append(node);
  if(grid.querySelector('button'))for(const node of grid.querySelectorAll('.ua-wait'))node.remove();
 }else{
  let cursor=grid.firstElementChild;for(const node of desired){if(node!==cursor)grid.insertBefore(node,cursor);cursor=node.nextElementSibling;}
 }
 // Reconcile after release.
 grid.dataset.signature=held?'':html;
}
function clearUnifiedGesture(){
 const g=unifiedGesture;unifiedGesture=null;if(!g)return;
 delete g.button.dataset.gesturePreview;g.line?.remove();
 if(g.kind==='seal'){unifiedSuppressClick=true;g.button.innerHTML=g.originalHTML;}
 try{if(g.button.hasPointerCapture?.(g.pointerId))g.button.releasePointerCapture(g.pointerId);}catch{}
}

function useUnifiedMove(value,gestureStyle='normal',gestureCommit=0,extraMoves=0){
 if(!battle?.rt||battle.rt.paused)return;
 const [id,index]=value.split('|'),actor=s.spirits.find(u=>u.id===id);
 if(!actor||!battle.multi.allies.includes(id))return;
 const move=battleMoves(actor)[Number(index)];if(!move)return;
 const previous=battle.controlledAlly;battle.controlledAlly=id;selectedMove=Number(index);
 const result=submitRealTimeAction({type:'move',move,style:gestureStyle,commit:gestureCommit,extraMoves:Math.max(0,Math.min(2,Math.floor(extraMoves))),targetIndex:realTimeTargetIndex(move,actor)});
 if(!result?.ok)battle.controlledAlly=previous;
}
function unifiedGestureChoice(dx,dy){
 const ax=Math.abs(dx),ay=Math.abs(dy),diagonal=ax>22&&ay>22&&Math.min(ax,ay)/Math.max(ax,ay)>.42;
 const style=diagonal?(dx<0?'agile':'strong'):ax>ay?(dx<0?'agile':'strong'):(dy<0?'strong':'agile');
 // All diagonals repeat; upward diagonals also scale attack commitment.
 const extraMoves=diagonal?Math.min(2,Math.max(1,Math.floor(Math.hypot(dx,dy)/85))):0;
 const commit=diagonal?(dy<0?Math.min(1,Math.hypot(dx,dy)/110):0):ax>ay?Math.min(1,ax/110):0;
 return {style,commit,moveCount:extraMoves,diagonal};
}
function drawGestureLine(g,dx=0,dy=0){
 if(!g.line){
  g.line=document.createElement('div');g.line.className='gesture-line';g.line.setAttribute('aria-hidden','true');
  Object.assign(g.line.style,{left:g.x+'px',top:g.y+'px'});document.body.append(g.line);
 }
 Object.assign(g.line.style,{width:Math.hypot(dx,dy)+'px',transform:'rotate('+Math.atan2(dy,dx)+'rad)'});
}
function previewUnifiedMove(button,dx,dy){
 if(Math.hypot(dx,dy)<18){delete button.dataset.gesturePreview;return;}
 const p=unifiedGestureChoice(dx,dy),arrow=p.diagonal?(dy<0?(dx<0?'↖':'↗'):(dx<0?'↙':'↘')):Math.abs(dx)>Math.abs(dy)?(dx<0?'←':'→'):(dy<0?'↑':'↓');
 button.dataset.gesturePreview=arrow+' '+p.style.toUpperCase()+'\n'+[p.moveCount?'+'+p.moveCount+' extra Technique'+(p.moveCount>1?'s':''):'',p.commit?'ATK '+Math.round(p.commit*100)+'%':'No commitment'].filter(Boolean).join(' · ');
}
function sealQuote(p){return p.base+' + '+p.extra+' = '+p.cost+' SE · '+Math.round(p.chance*100)+'%';}
function sealButtonHTML(){
 const target=battle.multi.enemies[battle.enemyTargetSelection||0]||battle.enemy;
 if(!target||target.hp<=0||battle.trainer||battle.rt.paused||(battle.utilityReadyAt||0)>battle.rt.elapsedMs||!(s.inventory.seals>0))return '';
 const base=SE.sealInvestment(s.sealer,target,spOf(target),s.inventory.quality,0);if(!base.ok)return '';
 const p=SE.sealInvestment(s.sealer,target,spOf(target),s.inventory.quality,battle.sealExtra||0);
 return '<button class="unified-action ua-seal" data-action="unified-seal" data-value="'+esc(target.id)+'" data-unified-seal="'+esc(target.id)+'" title="Tap to seal; slide right for Energy, up to cancel. Arrows adjust; Enter seals. Failure spends invested SE."><b>Seal ×'+s.inventory.seals+'</b><small data-seal-quote>'+sealQuote(p)+'</small><small>Tap · slide right +Energy · up cancel</small></button>';
}
function previewSeal(g,choice){
 const target=battle?.multi.enemies.find(u=>u.id===g.value&&u.hp>0);if(!target)return;
 const p=SE.sealInvestment(s.sealer,target,spOf(target),s.inventory.quality,choice.extra);
 g.button.querySelector('b').textContent=choice.cancelled?'Cancel seal':'Release to seal';
 g.button.querySelector('[data-seal-quote]').textContent=choice.cancelled?'No Energy or catalyst spent':sealQuote(p)+(p.ok?'':' · Insufficient Energy');
}
document.addEventListener('pointerdown',ev=>{
 const button=ev.target.closest?.('[data-unified-move], [data-unified-seal]');if(!button||button.disabled||unifiedGesture||ev.isPrimary===false||ev.button>0)return;
 unifiedSuppressClick=false;
 unifiedGesture={button,x:ev.clientX,y:ev.clientY,value:button.dataset.unifiedMove,pointerId:ev.pointerId};
 if(button.dataset.unifiedSeal){
  const target=battle?.multi.enemies.find(u=>u.id===button.dataset.unifiedSeal&&u.hp>0);if(!target){unifiedGesture=null;return;}
  const p=SE.sealInvestment(s.sealer,target,spOf(target),s.inventory.quality,0);
  Object.assign(unifiedGesture,{kind:'seal',value:target.id,battle,maximum:SE.outputLimit(s.sealer),originalHTML:button.innerHTML});
  ev.preventDefault();
 }
 drawGestureLine(unifiedGesture);
 try{button.setPointerCapture?.(ev.pointerId);}catch{clearUnifiedGesture();}
});
document.addEventListener('pointermove',ev=>{
 const g=unifiedGesture;if(!g||g.pointerId!==ev.pointerId)return;
 drawGestureLine(g,ev.clientX-g.x,ev.clientY-g.y);
 if(g.kind==='seal'){previewSeal(g,sealingGestureChoice(ev.clientX-g.x,ev.clientY-g.y,g.maximum));return;}
 previewUnifiedMove(g.button,ev.clientX-g.x,ev.clientY-g.y);
});
document.addEventListener('pointerup',ev=>{
 const g=unifiedGesture;if(!g||g.pointerId!==ev.pointerId)return;clearUnifiedGesture();
 const dx=ev.clientX-g.x,dy=ev.clientY-g.y;
 if(g.kind==='seal'){const choice=sealingGestureChoice(dx,dy,g.maximum);if(!choice.cancelled&&battle===g.battle)battleSeal(choice.extra,g.value);return;}
 delete g.button.dataset.gesturePreview;
 if(Math.hypot(dx,dy)<18)return;
 unifiedSuppressClick=true;
 const choice=unifiedGestureChoice(dx,dy);
 useUnifiedMove(g.value,choice.style,choice.commit,choice.moveCount);
});
document.addEventListener('pointercancel',ev=>{if(unifiedGesture?.pointerId===ev.pointerId)clearUnifiedGesture();});
document.addEventListener('lostpointercapture',ev=>{if(unifiedGesture?.pointerId===ev.pointerId)clearUnifiedGesture();});
window.addEventListener('blur',()=>{clearUnifiedGesture();if(unifiedTap){clearTimeout(unifiedTap.timer);unifiedTap=null;}});
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearUnifiedGesture();if(unifiedTap){clearTimeout(unifiedTap.timer);unifiedTap=null;}}});
document.addEventListener('keydown',ev=>{
 if(ev.key==='Escape'&&unifiedGesture){ev.preventDefault();clearUnifiedGesture();return;}
 const button=ev.target.closest?.('[data-unified-seal]');if(!button||!battle)return;
 if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Escape'].includes(ev.key))return;ev.preventDefault();
 const target=battle.multi.enemies.find(u=>u.id===button.dataset.unifiedSeal&&u.hp>0);if(!target)return;
 const base=SE.sealInvestment(s.sealer,target,spOf(target),s.inventory.quality,0),max=SE.outputLimit(s.sealer);
 battle.sealExtra=ev.key==='Escape'?0:Math.max(0,Math.min(max,(battle.sealExtra||0)+(['ArrowRight','ArrowUp'].includes(ev.key)?1:-1)*(ev.shiftKey?5:1)));
 const p=SE.sealInvestment(s.sealer,target,spOf(target),s.inventory.quality,battle.sealExtra);
 button.querySelector('[data-seal-quote]').textContent=sealQuote(p);
 unifiedSuppressClick=false;
});

function collectDamageNumbers(layout){
 const canvas=document.querySelector?.('#battle-canvas'),state=battle.rt,events=state.damageEvents||[];state.damageEvents=[];
 battle.damageNumbers=(battle.damageNumbers||[]).filter(n=>state.elapsedMs-n.at<DAMAGE_NUMBER_MS);
 if(!canvas||!layout)return;
 for(const event of events){
  if(event.side!=='b')continue;
  const point=layout.b.find(p=>p.id===event.target),unit=battleTeams().enemies.find(u=>u.id===event.target);
  if(!point||!unit)continue;
  const anchor=damageNumberAnchor(spOf(unit),unit.appearance,point),count=battle.damageNumbers.filter(n=>n.target===unit.id&&event.at-n.at<450).length;
  anchor.y-=count*anchor.headSize*.8;
  battle.damageNumbers.push({...event,...anchor,width:canvas.width,height:canvas.height});
 }
 battle.damageNumbers=battle.damageNumbers.slice(-64);
}
function advanceRealTimeBattle(delta,time){
 if(!battle?.rt||document.hidden)return;
 if(battle.damageEnding){
  battle.damageVisualMs+=delta;drawBattle();drawRealTimeEffects();
  if(battle.damageVisualMs>=battle.damageEnding){delete battle.damageEnding;delete battle.damageVisualMs;battle.damageNumbers=[];battle.rt.paused=false;finishRealTimeEncounter();}
  return;
 }
 if(battle.rt.paused)return;
 const canvas=document.querySelector?.('#battle-canvas'),damageLayout=canvas?currentBattleLayout(canvas):null;
 const original=battle,rosterBefore=battle.multi.allies.join('|')+';'+battle.multi.enemies.map(u=>u.id).join('|'),state=battle.rt,ctx=realTimeContext(),previous=state.elapsedMs,result=RT.advanceRealTime(state,delta,ctx);
 s.sealer.clockMs=state.elapsedMs;if(battle.enemySealer){battle.enemySealer.clockMs=state.elapsedMs;battle.enemySealer.lastSeenClock=state.elapsedMs;}s.playTime=(s.playTime||0)+(state.elapsedMs-previous);
 applyRealTimeContext(ctx);if(result.log.length){battle.log.push(...result.log);battle.log=battle.log.slice(-150);battle.message=battle.log.at(-1);}
 battle.rtAnimations.push(...result.events);battle.rtAnimations=battle.rtAnimations.filter(e=>state.elapsedMs-e.at<650);
 runEnemySealer(ctx);collectDamageNumbers(damageLayout);
 for(const actor of ctx.active.b){if(actor.hp<=0)continue;const clock=RT.unitClock(state,actor);if(state.elapsedMs<clock.aiAt)continue;clock.aiAt=state.elapsedMs+180;
  const opponents=ctx.active.a.filter(u=>u.hp>0);if(!opponents.length)continue;
  const decision=BAI.chooseBattleAction(actor,{realTime:true,speciesOf:spOf,opponents,allies:ctx.active.b,team:ctx.teams.b,reserves:[],enemyReserves:ctx.teams.a.filter(u=>u.hp>0&&!ctx.active.a.includes(u)),canUse:c=>RT.actionAvailability(state,actor,spOf(actor),c).ok});
  if(decision)RT.scheduleAction(state,ctx,actor,decision);
 }
 applyRealTimeContext(ctx);if(battle.boss)advanceBossPhase();finishRealTimeEncounter();if(battle!==original)return;if(rosterBefore!==battle.multi.allies.join('|')+';'+battle.multi.enemies.map(u=>u.id).join('|'))render();
 if(time-lastRealTimeUi>100){lastRealTimeUi=time;refreshRealTimeUI();refreshSpiritualBattleUI();}
 if(time-lastRealTimeDraw>33){lastRealTimeDraw=time;drawBattle();drawRealTimeEffects();}
}
function drawRealTimeEffects(){
 if(!battle?.rt)return;const canvas=$('#battle-canvas');if(!canvas)return;const c=canvas.getContext('2d'),ctx=realTimeContext();
 for(const event of battle.rtAnimations||[]){const age=(battle.damageVisualMs??battle.rt.elapsedMs)-event.at;if(age<0||age>600)continue;const side=event.side,index=Math.max(0,ctx.active[side].findIndex(u=>u.id===event.actor)),targetSide=ctx.active[side].some(u=>u.id===event.target)?side:side==='a'?'b':'a',targetIndex=Math.max(0,ctx.active[targetSide].findIndex(u=>u.id===event.target));
 const layout=currentBattleLayout(canvas),point=(team,n)=>layout[team].find(p=>p.slot===n)?.effect||layout[team][0]?.effect||{x:500,y:canvas.height/2};
 c.save();drawTechnique(c,event.move,Math.min(1,age/600),point(side,index),point(targetSide,targetIndex),canvas.width,canvas.height);c.restore();}
 drawDamageNumbers(c,battle.damageNumbers,battle.damageVisualMs??battle.rt.elapsedMs,canvas.width,canvas.height);
 const layout=currentBattleLayout(canvas),now=battle.rt.elapsedMs;
 for(const side of ['a','b'])for(const point of layout[side]){
  const unit=ctx.active[side].find(u=>u.id===point.id),clock=unit&&battle.rt.units?.[unit.id],labels=damageDelayLabels(clock,now);if(!labels.length)continue;
  c.save();const fontSize=Math.max(14,Math.min(19,canvas.height*.035));c.font='bold '+fontSize+'px sans-serif';c.textAlign='center';c.textBaseline='middle';
  const widest=Math.max(...labels.map(text=>c.measureText(text).width)),x=Math.max(widest/2+8,Math.min(canvas.width-widest/2-8,point.effect.x)),y=Math.max(20,Math.min(canvas.height-labels.length*(fontSize+5),point.effect.y-28));
  c.globalAlpha=Math.min(1,(clock.delayNotice.until-now)/250);c.lineWidth=4;c.strokeStyle='#17202c';c.fillStyle='#ffe3a1';
  labels.forEach((text,n)=>{c.strokeText(text,x,y+n*(fontSize+5));c.fillText(text,x,y+n*(fontSize+5));});c.restore();
 }
}

function realTimeTargetIndex(move,actor){
 if(['self','ally','allAllies'].includes(E.moveTarget(move)))return battle.allyTargetSelection??Math.max(0,(battle.multi?.allies||[battle.ally]).indexOf(actor.id));
 return battle.enemyTargetSelection||0;
}


function spiritualEnergyHTML(q,label='Sealer'){return battleView.spiritualEnergyHTML(...arguments);}
function refreshExplorationEnergy(){if(!s?.sealer)return;for(const box of document.querySelectorAll('[data-sealer-meter="a"]')){const label=box.querySelector('.sealer-vow-label');if(label)label.textContent=[s.sealer.vowBroken?'Vow broken':SE.activeVow(s.sealer)?.name,s.sealer.senses?.perception?'Sensing':'',s.sealer.senses?.concealment?'Concealed':''].filter(Boolean).join(' · ');const n=box.querySelector('[data-energy-number]'),fill=box.querySelector('[data-energy-fill]');if(n)n.textContent=Math.floor(s.sealer.energy)+' / '+s.sealer.maxEnergy;if(fill)fill.style.width=s.sealer.energy/s.sealer.maxEnergy*100+'%';}}
function startingSupportMenu(){
 const q=SE.ensureSealer(s);showModal('Choose your spiritual instruction · '+q.startingChosen.length+' / 3','<p>Choose three techniques. Six assigned slots are distributed across your traveling team, plus one different free-floating technique.</p>'+q.startingChoices.map(t=>supportTechniqueCard(t,q.startingChosen.includes(t.id)?'<b>Chosen</b>':action('support-start','Learn',t.id))).join(''),{kind:'support-start'});
}
function supportTechniqueCard(t,buttons=''){
 return '<article class="support-card"><b>'+esc(t.name)+'</b><small>'+t.timing.toUpperCase()+' · '+t.energyCost+' base SE · '+seconds(t.cooldownMs)+' CD</small><p>'+esc(ST.supportDescription(t))+'</p>'+(t.requires?'<p class="tiny">Requires '+esc(Object.values(t.requires).join(' / '))+'</p>':'')+'<div class="btn-row">'+buttons+'</div></article>';
}
function supportPreparation(memberId=null){
 if(battle)return toast('Prepare support outside battle.');const q=SE.ensureSealer(s);if(q.startingChosen.length<3)return startingSupportMenu();SE.autoAssignSupport(s);
 const member=party().find(u=>u.id===memberId)||party()[0],assigned=Object.values(q.assignments).flat(),rows=party().map(u=>'<div class="support-member"><b>'+esc(spOf(u).forms[u.appearance])+'</b><p>'+(q.assignments[u.id]||[]).map(id=>esc(q.known[id]?.name)).join(' · ')+'</p>'+action('support-member','Edit assignments',u.id)+'</div>').join('');
 const cards=Object.values(q.known).map(t=>{const isAssigned=member&&(q.assignments[member.id]||[]).includes(t.id);let buttons='';if(member&&!isAssigned&&assigned.length>=6&&t.id!==q.floating)buttons+=action('support-replace','Replace first assignment',member.id+'|'+t.id);if(member)buttons+=action(isAssigned?'support-remove':'support-assign',isAssigned?'Remove from '+spOf(member).forms[member.appearance]:'Assign to '+spOf(member).forms[member.appearance],member.id+'|'+t.id);if(q.floating===t.id)buttons+='<b>FREE-FLOATING</b>';else if(!assigned.includes(t.id))buttons+=action('support-float','Make free-floating',t.id);return supportTechniqueCard(t,buttons);}).join('');
 showModal('Support preparation','<p>'+assigned.length+' / 6 assigned · Every traveling team member needs at least one. Exact copies share cooldowns; generated variants do not. Changing preparation never resets timers.</p><p>Free-floating: <b>'+esc(q.known[q.floating]?.name||'Not chosen')+'</b></p>'+rows+'<p>Editing: '+esc(member?spOf(member).forms[member.appearance]:'Capture a Spirimon to make assignments')+'</p>'+cards,{kind:'support-prepare'});save();
}
function supportTrainerMenu(source='guild'){
 if(battle||!safe())return toast('Visit a safe place for spiritual instruction.');const q=SE.ensureSealer(s),phase=SE.calendarPhase(s.playTime).key;
 const offers=[0,1,2].map(n=>{const key='trainer:'+source+':'+phase+':'+n,t=ST.generateSupport(s.seed+'|'+key,{level:q.level}),cost=25+q.level*3;return supportTechniqueCard(t,q.discoveries['learn:'+key]?'<b>Learned</b>':action('support-learn','Learn · '+cost+' Coin',source+'|'+n));}).join('');
 showModal('Spiritual instruction','<p>Learn procedural techniques through training and discovery. '+s.inventory.coins+' Coin available. Instruction changes with each day/night period.</p>'+offers+'<div class="btn-row">'+action('support-prepare','Prepare techniques')+action('cooperative-learn','Learn United Release · 60 Coin','united')+action('cooperative-learn','Learn Triune Release · 90 Coin','triune')+'</div>');
}
function spiritualRecoveryMenu(){
 if(battle)return toast('Visit a Shrine outside battle.');const shrine=SW.nearbyShrine(s),q=SE.ensureSealer(s),available=shrine&&SE.recoveryAvailable(s,'restore',shrine.id).ok;
 showModal(shrine?shrine.name:'Spiritual recovery',spiritualEnergyHTML(q)+'<p>Each Shrine allows one action: Restore your team, Meditate for 25% Energy, or Commune for 50% Energy. Choosing any one uses that Shrine until the next day/night transition.</p><div class="btn-row">'+(available?action('rest-close','Restore team')+action('spiritual-meditate','Meditate · 25%')+action('spiritual-commune','Commune · 50%',shrine.id):'<span>'+(shrine?'This Shrine has been used until the next day/night transition.':'Approach a Shrine for restoration, meditation, or communion.')+'</span>')+action('spiritual-draught','Spiritual draught ×'+s.inventory.spiritDraughts)+(safe()?action('support-trainer','Spiritual instruction',shrine?.id||'guild'):'')+'</div>');
}
function performSpiritualRecovery(kind){
 if(battle)return;const shrine=SW.nearbyShrine(s),result=SE.beginRecovery(s,kind,{shrineId:shrine?.id,safe:safe()});if(!result.ok)return toast(result.reason);
 if(kind==='commune'){const learned=SE.learnSupport(s,'shrine:'+shrine.id,'Shrine discovery');if(learned)note('The shrine reveals '+learned.name+'.');SE.trainSealer(s,'shrine:'+shrine.id);}
 if(s.sealer.meditations>0&&s.sealer.meditations%4===0){const learned=SE.learnSupport(s,'meditation:'+s.sealer.meditations,'Meditation insight');if(learned)note('An insight reveals '+learned.name+'.');}
 closeModal();save();render();toast('Recovered '+Math.floor(result.amount)+' Spiritual Energy.'+(result.interrupted?' Your meditation was interrupted!':''));
 if(result.interrupted){const sp=speciesFor(currentRegion(),Math.random);startBattle(E.heal(E.makeIndividual(sp,E.encounterLevel(currentRegion())),sp));}
}
function useSpiritualDraught(){
 if(battle?.rules?.noItems)return toast('Consumables are restricted in this challenge.');const q=SE.ensureSealer(s);if(q.energy>=q.maxEnergy)return toast('Your Spiritual Energy is already full.');if(!s.inventory.spiritDraughts)return toast('No spiritual draughts remain.');if(battle&&(!claimRealTimeUtility(3500)||battle.rt.paused))return;
 s.inventory.spiritDraughts--;const amount=SE.restoreEnergy(q,q.maxEnergy*.35);if(battle)RT.synchronizeTimers(battle.rt,realTimeContext());closeModal();save();render();toast('Recovered '+Math.floor(amount)+' Spiritual Energy. Technique cooldowns are unchanged.');
}
function fieldRelease(kind,key='field:'+kind){
 const q=SE.ensureSealer(s),candidates=party().filter(u=>u.hp>0&&fieldCapabilityAvailable(spOf(u),kind,u)).sort((a,b)=>SE.fieldReleaseCost(q,a,spOf(a))-SE.fieldReleaseCost(q,b,spOf(b)));
 const u=candidates.find(u=>q.fieldTask?.memberId===u.id&&q.fieldTask?.key===key)||candidates.find(u=>q.energy>=SE.fieldReleaseCost(q,u,spOf(u)));if(!u)return false;
 if(q.fieldTask?.memberId===u.id&&q.fieldTask?.key===key)return true;
 const cost=SE.fieldReleaseCost(q,u,spOf(u));if(!SE.spendEnergy(q,cost))return false;q.fieldTask={memberId:u.id,key};if(cost)toast(spOf(u).forms[u.appearance]+' released · '+cost+' Spiritual Energy.');return true;
}
function fieldRitualMenu(){
 if(battle)return toast('Perform exploration rituals outside battle.');showModal('Cooperative field rituals',CO.FIELD_RITUALS.map(t=>'<article class="support-card"><b>'+t.name+'</b><p>'+t.description+'</p><p>Domains: '+t.domains.join(', ')+' · '+SE.ritualQuote(s.sealer,t,0).cost+' SE plus any release cost</p>'+'<button data-energy-gesture="ritual" data-action="field-ritual" data-value="'+t.id+'" '+(CO.fieldRitualTeam(t,party(),spOf).length?'':'disabled')+'>Perform ritual · tap or drag to empower</button>'+'</article>').join(''));
}
function performFieldRitual(id,extra=0,approved=false){
 if(battle)return;const t=CO.FIELD_RITUALS.find(t=>t.id===id);if(!t)return;const q=SE.ensureSealer(s),u=CO.fieldRitualTeam(t,party(),spOf).sort((a,b)=>SE.manifestationCost(q,a,spOf(a))-SE.manifestationCost(q,b,spOf(b)))[0];if(!u)return toast('A suitable Domain is required.');
 let object=null;if(id==='unseal'){if(!s.cave)return toast('Approach a dungeon barrier to unseal it.');object=caveObjects(s.cave,dungeonMap(s.cave)).filter(o=>Math.abs(o.x-s.cave.x)+Math.abs(o.y-s.cave.y)<=2+Math.floor(SE.ritualQuote(q,t,extra).bonus*10)).sort((a,b)=>Math.abs(a.x-s.cave.x)+Math.abs(a.y-s.cave.y)-Math.abs(b.x-s.cave.x)-Math.abs(b.y-s.cave.y))[0];if(!object)return toast('No nearby sealed barrier.');}
 if(SE.vowViolation(q,'ritual')&&!approved)return warnVow(()=>performFieldRitual(id,extra,true));if(approved)SE.breakVow(q,false);
 const quote=SE.ritualQuote(q,t,extra),cost=quote.cost+SE.manifestationCost(q,u,spOf(u));if(!SE.spendEnergy(q,cost))return toast('This ritual requires '+cost+' Spiritual Energy.');
 if(id==='purify')for(const i of party())if(['burn','poison','toxic','freeze','frostbite','paralysis'].includes(i.status)){i.status=null;i.statusTurns=0;}
 if(quote.extra&&id==='purify')for(const i of party())i.hp=Math.min(E.stats(i,spOf(i)).hp,i.hp+Math.ceil(E.stats(i,spOf(i)).hp*.1*quote.multiplier));
 if(id==='unseal'){const key=s.cave.id+'|'+s.cave.level;s.caveChanges??={};s.caveChanges[key]??={};s.caveChanges[key][object.id]=null;}
 if(id==='stabilize')s.sanctuaryUntilStep=s.steps+Math.round(30*quote.multiplier);
 const place=s.cave?s.cave.id+'|'+s.cave.level:currentRegion().key,key='field:'+id+':'+place;
 SE.trainSealer(s,key,{ritual:true});const learned=SE.learnSupport(s,key,'Ritual discovery');if(learned)note('Ritual insight: '+learned.name);closeModal();save();render();toast(t.name+' completed · '+cost+' Spiritual Energy.');
}
function applyRealTimeContext(ctx){return battleSession.applyRealTimeContext(...arguments);}
function configureEnemyRoster(team){return battleSession.configureEnemyRoster(...arguments);}
function persistentEnemySealer(key,team){
 s.npcSealers??={};const now=s.sealer.clockMs,previous=s.npcSealers[key];
 for(let n=0;n<team.length;n++){const u=team[n];u.id=previous?.teamIds?.[n]||'npc-'+E.hash(s.seed,key,n).toString(36);u.moveCooldowns={...(previous?.creatureCooldowns?.[u.id]||{}),...(u.moveCooldowns||{})};u.cooldownDelayBudgets??=previous?.creatureDelayBudgets?.[u.id]||{};}
 const profile=SE.enemySealer(s.seed+'|'+key,team,spOf),q=previous||profile;
 if(previous){const elapsed=Math.max(0,now-(q.lastSeenClock??now));q.maxEnergy=Math.max(q.maxEnergy,profile.maxEnergy);q.level=Math.max(q.level,profile.level);SE.passiveRecovery(q,elapsed);q.known={...profile.known,...q.known};q.assignments=profile.assignments;q.floating=profile.floating;q.leadId=team[0]?.id;}
 SE.ensureDisciplines(q);if(!q.inBattle)SE.beginSealerBattle(q);if(/rowan|challenger|clan|faction|champion/.test(key)&&!q.vow)q.vow='open-hand';
 q.teamIds=team.map(u=>u.id);q.creatureCooldowns=Object.fromEntries(team.map(u=>[u.id,u.moveCooldowns]));q.creatureDelayBudgets=Object.fromEntries(team.map(u=>[u.id,u.cooldownDelayBudgets]));q.clockMs=now;q.lastSeenClock=now;q.advanced=q.level>=25?['triune','united']:q.level>=12?['united']:[];s.npcSealers[key]=q;return q;
}
function releaseBattleMember(id,approved=false){
 if(!battle?.rt)return;const u=party().find(u=>u.id===id),ctx=realTimeContext(),result=RT.deploySpirimon(battle.rt,ctx,'a',u,{breakVow:approved});if(result.requiresVowBreak)return warnVow(()=>releaseBattleMember(id,true));if(!result.ok)return toast(result.reason);
 applyRealTimeContext(ctx);battle.participants=[...new Set([...battle.participants,u.id])];battle.controlledAlly=id;battle.log.push(...result.log,'Release cost: '+result.cost+' Spiritual Energy.');battleMode='main';closeModal();save();render();
}
function withdrawBattleMember(id,approved=false){
 if(!battle?.rt)return;const ctx=realTimeContext(),u=ctx.active.a.find(u=>u.id===id);if(!u)return;const ready=RT.actionAvailability(battle.rt,u,spOf(u),{type:'switch'});if(!ready.ok||u.conditions?.trap)return toast(ready.reason||'Binding prevents recall.');
 if(SE.vowViolation(s.sealer,'withdraw')&&!approved)return warnVow(()=>withdrawBattleMember(id,true));if(approved)SE.breakVow(s.sealer,true);
 RT.unitClock(battle.rt,u).pending=null;ctx.active.a=ctx.active.a.filter(v=>v!==u);applyRealTimeContext(ctx);battleMode=ctx.active.a.length?'main':'deploy';save();render();
}
function deploymentHTML(){return battleView.deploymentHTML(...arguments);}
function battleSupportHTML(){return battleView.battleSupportHTML(...arguments);}
function cooperativeBattleHTML(){return battleView.cooperativeBattleHTML(...arguments);}
function runEnemySealer(ctx){return battleSession.runEnemySealer(...arguments);}
function finishRealTimeEncounter(){
 if(!battle?.rt)return;const ctx=realTimeContext(),oldA=battle.multi.allies.join('|'),oldB=battle.multi.enemies.map(u=>u.id).join('|');
 for(const side of ['a','b']){for(const u of ctx.active[side])if(u.hp<=0){RT.unitClock(battle.rt,u).pending=null;}ctx.active[side]=ctx.active[side].filter(u=>u.hp>0);}
 applyRealTimeContext(ctx);
 if(!ctx.teams.b.some(u=>u.hp>0)){
  const until=Math.max(0,...(battle.damageNumbers||[]).map(n=>n.at+DAMAGE_NUMBER_MS));
  if(until>battle.rt.elapsedMs){battle.damageEnding=until;battle.damageVisualMs=battle.rt.elapsedMs;battle.rt.paused=true;return;}
  if(!ctx.teams.a.some(u=>u.hp>0))return drawnBattle();return winBattle();
 }
 if(!ctx.active.a.length){battleMode='deploy';if((battle.rt.undefendeda||0)>6000)return loseBattle();}
 if(!ctx.active.b.length&&battle.enemySealer&&(battle.rt.undefendedb||0)>6000)return winBattle();
 for(const side of ['a','b'])for(const u of ctx.active[side])if(u.switchRequested){if(u.conditions?.trap&&!u.forcedDisplacement){u.switchRequested=false;continue;}u.switchRequested=false;RT.unitClock(battle.rt,u).pending=null;ctx.active[side]=ctx.active[side].filter(v=>v!==u);}
 applyRealTimeContext(ctx);
 if(oldA!==battle.multi.allies.join('|')||oldB!==battle.multi.enemies.map(u=>u.id).join('|')){save();render();}
}
function refreshSpiritualBattleUI(){
 if(!battle?.rt)return;const ctx=realTimeContext();for(const box of document.querySelectorAll('[data-spiritual-hud]')){const u=[...ctx.teams.a,...ctx.teams.b].find(u=>u.id===box.dataset.spiritualHud);if(u)box.innerHTML=compactBattleHUD(u,ctx.teams.a.includes(u)?'ally':'enemy');}refreshExplorationEnergy();for(const box of document.querySelectorAll('[data-sealer-meter="b"]')){const q=battle.enemySealer,n=box.querySelector('[data-energy-number]'),fill=box.querySelector('[data-energy-fill]');if(q&&n)n.textContent=Math.floor(q.energy)+' / '+q.maxEnergy;if(q&&fill)fill.style.width=q.energy/q.maxEnergy*100+'%';}
 for(const button of document.querySelectorAll('[data-support-button]')){const result=RT.supportAvailability(battle.rt,ctx,'a',button.dataset.supportButton,button.dataset.supportRecipient);button.disabled=!result.ok&&!result.requiresVowBreak;const text=button.querySelector('[data-support-state]');if(text)text.textContent=result.ok?'READY':result.reason+(result.remainingMs?' '+seconds(result.remainingMs):'');}
 for(const text of document.querySelectorAll('[data-ally-gcd]')){const u=party().find(u=>u.id===text.dataset.allyGcd),clock=u&&RT.unitClock(battle.rt,u);if(clock)text.textContent=clock.pending?'CAST '+seconds(clock.pending.resolveAt-battle.rt.elapsedMs):clock.gcdReadyAt>battle.rt.elapsedMs?'GCD '+seconds(clock.gcdReadyAt-battle.rt.elapsedMs):'READY';}
 const emergency=document.querySelector('[data-emergency]');if(emergency)emergency.textContent=ctx.active.a.length?'':'No manifested ally! Restore, release, revive, or escape · '+seconds(6000-(battle.rt.undefendeda||0));
}


function compactBattleHUD(u,side){return battleView.compactBattleHUD(...arguments);}

function passiveMenu(id){
 const u=s.spirits.find(u=>u.id===id);if(!u||battle)return;
 const sp=spOf(u);CP.ensureIndividualPassives(sp,u);
 const sections=Object.keys(u.passives).map(classification=>'<section class="modal-section"><h3>'+esc(classification)+'</h3>'+CP.passivePool(classification).map(p=>'<article class="support-card"><b>'+esc(p.name)+'</b><p>'+esc(p.description)+'</p>'+(u.passives[classification]===p.id?'<strong>Prepared</strong>':u.unlockedPassives.includes(p.id)?action('passive-equip','Prepare',u.id+'|'+classification+'|'+p.id):action('passive-study','Study · 25 Coin',u.id+'|'+classification+'|'+p.id))+'</article>').join('')+'</section>').join('');
 showModal('Innate passive training · '+sp.forms[u.appearance],'<p>Each innate Type and Domain has sixteen disciplines. Study and prepare them at a safe place. Choices belong to this Spirimon and persist through saving and transformation.</p>'+sections+action('detail','Return to Spirimon',id));
}
function studyPassive(value){
 const [id,classification,passiveId]=value.split('|'),u=s.spirits.find(u=>u.id===id);if(!u||battle||!safe())return toast('Study passives at a safe place.');
 if(s.inventory.coins<25)return toast('Studying a passive costs 25 Coin.');
 if(u.unlockedPassives?.includes(passiveId))return passiveMenu(id);
 if(!CP.unlockPassive(spOf(u),u,classification,passiveId))return toast('This classification cannot be trained.');
 s.inventory.coins-=25;save();passiveMenu(id);
}
function equipPassive(value){
 const [id,classification,passiveId]=value.split('|'),u=s.spirits.find(u=>u.id===id);if(!u||battle||!safe())return toast('Prepare passives at a safe place.');
 const sp=spOf(u),max=E.stats(u,sp).hp,hp=u.hp;
 if(!CP.retrainPassive(sp,classification,passiveId,u.unlockedPassives,u))return toast('Study this passive first.');
 u.hp=hp<=0?0:Math.max(1,Math.round(hp/max*E.stats(u,sp).hp));save();passiveMenu(id);
}
function guildTrialsMenu(){
 const a=adventureState();showModal('Guild trials','<p>Complete the trials and reach Guild rank 4 to qualify for the championship after earning eight Crests.</p>'+A.GUILD_TRIALS.map(t=>'<article class="support-card"><b>'+esc(t.name)+'</b><p>Guild rank '+t.rank+' · '+t.maxActive+' active Spirimon · Level '+Math.max(t.level,Math.ceil(competitionPartyLevel()))+'</p>'+(a.guildTrials.includes(t.id)?'<strong>Completed</strong>':s.rank>=t.rank?action('guild-trial','Enter trial',t.id):'<span>Earn more Guild standing</span>')+'</article>').join('')+action('adventure-menu','Return'));
}
function competitionPartyLevel(){return party().reduce((n,u)=>n+u.level,0)/Math.max(1,party().length);}
function prepareCompetitionBattle(kind,id,profile){
 const r=E.rng(E.hash(s.seed,kind,id,s.wins)),team=Array.from({length:profile.teamSize||3},()=>{const sp=speciesFor(currentRegion(),r),u=E.heal(E.makeIndividual(sp,profile.level,profile.level>=36?2:profile.level>=16?1:0,r),sp);if(profile.modifier==='Swift opponents')u.specialty='Sprinter';if(profile.modifier==='Defensive opponents')u.specialty='Guardian';if(profile.modifier==='Transforming opponents')u.form=u.appearance=2;return u;});
 startBattle(team[0],null,true,{sealerId:kind+':'+id});if(!battle)return;
 battle.adventure={kind,id};battle.rules=profile.rules||{maxActive:profile.maxActive||3};configureEnemyRoster(team);battle.message=profile.opponent?profile.opponent+' · '+profile.name:profile.modifier||'Competition match';
 if(kind==='facility'&&id==='draft'){
  battle.allowedAllies=(adventureState().facilityDraft||[]).filter(id=>s.party.includes(id));
  const ctx=realTimeContext();ctx.active.a=ctx.active.a.filter(u=>battle.allowedAllies.includes(u.id));
  if(!ctx.active.a.length){const candidate=ctx.teams.a.find(u=>RT.deploymentAvailability(battle.rt,ctx,'a',u).ok);if(candidate)RT.deploySpirimon(battle.rt,ctx,'a',candidate);}
  applyRealTimeContext(ctx);
 }
 const ctx=realTimeContext();ctx.active.a=ctx.active.a.slice(0,battle.rules.maxActive);ctx.active.b=ctx.active.b.slice(0,battle.rules.maxActive);applyRealTimeContext(ctx);
 battle.boss=kind==='championship'&&profile.stage===3?{phase:0,shield:3}:null;save();render();
}
function startGuildTrial(id){const t=A.GUILD_TRIALS.find(t=>t.id===id);if(!t||s.rank<t.rank||adventureState().guildTrials.includes(id))return;prepareCompetitionBattle('guild-trial',id,{...t,level:Math.max(t.level,Math.ceil(competitionPartyLevel())),teamSize:Math.max(2,t.maxActive)});}
function championshipMenu(){
 const a=adventureState(),check=A.championshipEligibility(a.crests,s.rank,a.guildTrials,a.champion);
 if(!check.ok)return showModal('Championship qualification','<p>'+esc(check.reason)+'</p>'+action('guild-trials','Guild trials')+action('adventure-menu','Return'));
 const start=A.beginChampionship(a,{rank:s.rank,seed:s.seed}),match=start.ok&&A.championshipMatch(a,competitionPartyLevel(),currentRegion().minLevel||1);if(!match)return;
 save();showModal((a.championship.defense?'Title defense · ':'Grand Championship · ')+match.name,'<p>Match '+(match.match+1)+' / '+match.matches+' · '+match.maxActive+' active Spirimon</p><p>Opponent: '+esc(match.opponent)+' · Level '+match.level+' · Team of '+match.teamSize+'</p><p>Defeat or leaving a match eliminates this attempt. Victory advances through qualifiers, league, playoffs and the final.</p>'+action('championship-fight','Enter match','','btn primary')+action('adventure-menu','Prepare first'));
}
function startChampionshipMatch(){const a=adventureState(),match=A.championshipMatch(a,competitionPartyLevel(),currentRegion().minLevel||1);if(!match)return; a.championship.lastLevel=match.level;prepareCompetitionBattle('championship',match.id,match);}
function recordCompetitionDefeat(){
 if(!battle?.adventure||battle.competitionRecorded)return;const {kind,id}=battle.adventure,a=adventureState();
 if(kind==='championship')A.recordChampionshipResult(a,false);if(kind==='facility')A.recordFacilityResult(a,id,false);battle.competitionRecorded=true;
}
function startFacilityMatch(id){
 const a=adventureState(),facility=A.FACILITY_TYPES.find(f=>f.id===id);if(!facility||!party().some(u=>u.hp>0))return;
 if(id==='draft'&&(a.facilityDraft||[]).filter(id=>s.party.includes(id)).length!==Math.min(3,s.party.length))return draftPreparation();
 A.beginFacilityRun(a,id,s.seed,Math.floor(Date.now()/(7*24*60*60*1000)));
 const run=a.facilityRuns[id],profile=A.facilityMatch(a,id,competitionPartyLevel());if(!profile)return;
 if(run.round&&run.vitality){for(const u of party()){const old=run.vitality[u.id];if(old)for(const key of ['hp','pp','willpower'])u[key]=Math.min(u[key]||0,old[key]||0);}s.sealer.energy=Math.min(s.sealer.energy,run.energy??s.sealer.energy);}
 prepareCompetitionBattle('facility',id,profile);
}
function draftPreparation(){
 const a=adventureState();a.facilityDraft=(a.facilityDraft||[]).filter(id=>s.party.includes(id));
 showModal('Draft preparation','<p>Select '+Math.min(3,s.party.length)+' Spirimon for this circuit. Your other companions remain in their seals.</p>'+s.party.map(id=>{const u=s.spirits.find(u=>u.id===id);return action('facility-draft',(a.facilityDraft.includes(id)?'✓ ':'')+esc(spOf(u).forms[u.appearance]),id);}).join('')+action('facility-battle','Begin Draft','draft')+action('facility-menu','Return'));
}
function toggleDraftMember(id){const a=adventureState();if(!s.party.includes(id))return;a.facilityDraft??=[];if(a.facilityDraft.includes(id))a.facilityDraft=a.facilityDraft.filter(v=>v!==id);else if(a.facilityDraft.length<3)a.facilityDraft.push(id);save();draftPreparation();}
function templeRematches(){const a=adventureState();showModal('Clan Master rematches','<p>Rematch a defeated Master. Crests are awarded once; opponents scale with your current team.</p>'+A.CLANS.filter(c=>a.crests.includes(c.id)).map(c=>action('temple-rematch',esc(c.name)+' · '+esc(c.domain),c.id)).join('')+action('adventure-menu','Return'));}
function startTempleRematch(id){const a=adventureState(),clan=A.CLANS.find(c=>c.id===id);if(!clan||!a.crests.includes(id))return;prepareCompetitionBattle('clan-rematch',id,{name:clan.name,level:Math.max(clan.level,Math.ceil(competitionPartyLevel())),teamSize:Math.min(6,3+Math.floor(clan.index/3)),maxActive:3});}

function dungeonState(room=s.cave){s.dungeonState??={};return s.dungeonState[room.id+'|'+room.level]??={runeStep:0,solved:false,lever:false,treasure:false,hazard:false};}
function currentDungeonFeatures(room=s.cave){const layout=dungeonLayout(room),features=[...layout.features];if(dungeonState(room).secretRevealed&&layout.secret)features.push({...layout.secret,id:'secret',kind:'secret',name:'Hidden chamber'});return features;}
function dungeonClue(room=s.cave){return currentDungeonFeatures(room).filter(f=>f.kind==='rune').sort((a,b)=>a.order-b.order).map(f=>f.name+' ('+['amber triangle','blue crescent','violet diamond'][f.order]+')').join(' → ');}
function dungeonTileEvent(){
 const room=s.cave,state=dungeonState(),feature=currentDungeonFeatures().find(f=>f.x===room.x&&f.y===room.y);if(!feature)return;
 if(feature.kind==='rune'&&room.temple&&room.level===2&&!state.solved){const correct=EP.visitDungeonRune(state,feature);toast(correct?(state.solved?'The rune sequence opens the stairway.':'The rune answers · '+state.runeStep+'/3'):'The sequence fades. Tablet: '+dungeonClue());}
 if(feature.kind==='hazard'&&!state.hazard&&(state.lastHazardStep||-10)<s.steps-3){state.lastHazardStep=s.steps;const u=lead();if(u){u.hp=Math.max(1,u.hp-Math.max(1,Math.floor(E.stats(u,spOf(u)).hp/20)));toast('The unstable floor injures your companion. Inspect it to find a safe route.');}}
}
function dungeonInteract(){
 const room=s.cave,state=dungeonState(),feature=currentDungeonFeatures().filter(f=>Math.abs(f.x-room.x)+Math.abs(f.y-room.y)<=1).sort((a,b)=>Math.abs(a.x-room.x)+Math.abs(a.y-room.y)-Math.abs(b.x-room.x)-Math.abs(b.y-room.y))[0];
 if(!feature)return toast(room.temple&&room.level<3?'Study the tablet, inspect mechanisms, or clear obstacles.':'Search for stairs, counterweights, hidden reliquaries and inscriptions.');
 if(feature.kind==='lever'){
  state.lever=true;if(room.temple&&room.level<=1)state.solved=true;
  const map=dungeonMap(room),object=caveObjects(room,map).sort((a,b)=>Math.abs(a.x-feature.x)+Math.abs(a.y-feature.y)-Math.abs(b.x-feature.x)-Math.abs(b.y-feature.y))[0];
  if(object){const key=room.id+'|'+room.level;s.caveChanges??={};s.caveChanges[key]??={};s.caveChanges[key][object.id]=null;}
  animateField('push',room.x,room.y);toast('The counterweight shifts a barrier and unlocks the reliquary.');
 }else if(feature.kind==='treasure'){
  if(state.treasure)return toast('The reliquary is empty.');
  if(!state.lever)return toast('The reliquary is locked. Find the counterweight.');
  state.treasure=true;s.inventory.coins+=15+room.level*5;awardEquipment('dungeon-'+room.id+'-'+room.level,'Dungeon reliquary',E.encounterLevel(currentRegion())+room.level*3,room.temple?'Rare':null);toast('You recover Coin and equipment.');
 }else if(feature.kind==='secret'){if(state.secretLoot)return toast('You have explored this hidden chamber.');state.secretLoot=true;s.inventory.ore=(s.inventory.ore||0)+2;s.inventory.incense=(s.inventory.incense||0)+1;toast('The hidden chamber contains ritual supplies.');}else if(feature.kind==='hazard'){state.hazard=true;animateField('cleave',room.x,room.y);toast('You mark and stabilize a safe crossing.');}
 else{state.secretRevealed=true;toast('A hidden passage opens. Tablet: '+dungeonClue()+'. '+(room.level===0?'Clear a barrier by force or counterweight.':room.level===1?'Inspect the ancient counterweight.':'Walk across the three sigils in order.'));}
 save();render();
}

function legendarySpecies(id){
 const key='legendary-'+id;if(s.species[key])return s.species[key];
 const profiles=[['The Starved Star','Celestial','Undead','Void'],['The Sleeping Crown','Giant','Fey','Dreams'],['The Last Dawn','Celestial','Elemental','Sun'],['The Deep Listener','Aberration','Ooze','Psionic']],point=id.match(/legend-(-?\d+),(-?\d+)/),presence=point&&A.legendAt(s.seed,Number(point[1]),Number(point[2]),true,'rain'),profile=profiles.find(p=>p[0]===presence?.title)||profiles[E.hash(id)%profiles.length];
 const sp=E.makeSpecies(s.seed+'|'+id,profile[1],profile[2],[profile[3]]);sp.id=key;sp.forms=[profile[0]+' Echo',profile[0]+' Awakened',profile[0]];sp.name=profile[0];sp.catchRate=35;sp.legendary=true;sp.description+=' An ancient presence remembered as '+profile[0]+'.';completeProceduralSpecies(sp,Object.values(library));return register(sp);
}

let sideActivity=null;
function activityBonus(){const u=lead();if(!u)return 0;const sp=spOf(u),domains=E.activeDomains(sp,u),anatomy=sp.anatomy||{};return Math.min(.2,(domains.some(d=>['Psionic','Fate','Dreams'].includes(d))?.05:0)+(anatomy.manipulators>=2?.05:0)+(Q.heldEquipment(u)?.category==='Tools and utility gear'?.05:0)+(u.specialty||u.form>0?.05:0));}
function beginSideActivity(kind){
 if(battle)return;if(kind==='festival'&&(!currentRegion().town||!isNight()))return toast('The Lantern Festival opens in settlements at night.');
 const a=adventureState();sideActivity={kind,start:performance.now(),challenge:A.observationChallenge(s.seed,a.activityRecords?.observation?.attempts||0)};
 if(kind==='observation'){const c=sideActivity.challenge;showModal('Sigil observation','<p>Complete the repeating pattern: <strong>'+c.pattern.map(esc).join(' · ')+' · ?</strong></p><p>Your companion contributes '+Math.round(activityBonus()*100)+'% to earned rewards.</p>'+c.choices.map(value=>action('activity-answer',esc(value),value)).join('')+action('arcade-menu','Return'));}
 else showModal(kind==='festival'?'Lantern Festival':'Rhythm practice','<p>Tap when the light reaches the center. No wager or entry cost.</p><progress id="activity-meter" max="1" value="0" style="width:100%;height:24px"></progress><p>Target: center · Companion reward bonus '+Math.round(activityBonus()*100)+'%</p>'+action('activity-tap','Tap the lantern','','btn primary')+action('arcade-menu','Return'));
}
function finishSideActivity(answer=null){
 if(!sideActivity)return;const activity=sideActivity;sideActivity=null;
 const score=activity.kind==='observation'?(answer===activity.challenge.answer?1:0):A.rhythmScore(performance.now()-activity.start),result=A.recordSideActivity(adventureState(),activity.kind,score,activityBonus());
 s.inventory.coins+=result.reward;save();arcadeMenu();toast(Math.round(score*100)+'% · '+(result.reward?'Earned '+result.reward+' Coin':'Keep practicing')+(result.milestone?' · Activity milestone!':''));
}
function regionalJobMetric(kind){return kind==='travel'?s.steps:kind==='survey'?Object.values(s.regions).filter(r=>r.visited).length:Object.values(s.caveChanges||{}).reduce((n,f)=>n+Object.values(f).filter(v=>v===null).length,0);}
function regionalJobMenu(){
 const a=adventureState(),reg=currentRegion(),phase=SE.calendarPhase(s.playTime).key,key=reg.key+'|'+phase,kind=['travel','survey','maintenance'][E.hash(s.seed,key)%3];a.regionalJobClaims??={};
 const job=a.regionalJob||{id:key,kind,target:kind==='travel'?24:kind==='survey'?1:2,baseline:regionalJobMetric(kind),reward:25+s.rank*5};const progress=Math.min(job.target,Math.max(0,regionalJobMetric(job.kind)-job.baseline));
 showModal('Regional jobs','<p>'+({travel:'Map the local trails by traveling twenty-four tiles.',survey:'Survey one newly discovered region.',maintenance:'Clear two dungeon barriers.'}[job.kind])+'</p><p>Progress '+progress+' / '+job.target+' · Reward '+job.reward+' Coin</p>'+(a.regionalJob?(progress>=job.target?action('regional-job-claim','Report completed work'):action('close','Continue exploring')):a.regionalJobClaims[key]?'<p>This posting is complete for the current day/night period.</p>':action('regional-job-accept','Accept posting',key))+(a.regionalJob?action('regional-job-cancel','Abandon posting'):'')+action('arcade-menu','Return'));a.regionalJobOffer=job;
}

function selectRealTimeTarget(value){
 if(!battle?.rt)return;const [side,index]=value.split('|'),n=Number(index),units=side==='enemy'?battle.multi.enemies:side==='ally'?battle.multi.allies.map(id=>s.spirits.find(u=>u.id===id)):[];
 if(!Number.isInteger(n)||!units[n]||units[n].hp<=0)return;
 if(side==='enemy')battle.enemyTargetSelection=n;else{battle.allyTargetSelection=n;battle.controlledAlly=units[n].id;}
 save();render();
}

let vowContinuation=null,energyGesture=null,energyClickUntil=0;
function warnVow(next){
 const v=SE.activeVow(s.sealer);if(!v)return next();vowContinuation=next;
 showModal('Break '+v.name+'?', '<p>'+esc(v.rule)+'</p><p>This action removes the vow’s benefit '+(battle?'for the rest of this battle.':'until the next battle ends.')+'</p><div class="btn-row">'+action('vow-confirm','Break vow and continue','','btn primary')+action('close','Keep vow')+'</div>');
}
function spiritualArtsMenu(){
 const q=SE.ensureSealer(s),p=SE.perceptionProfile(q),c=SE.concealmentProfile(q),v=SE.activeVow(q);
 showModal('Spiritual Arts',spiritualEnergyHTML(q)+'<p>'+q.unspentPoints+' points available · 3 per level. Distinct trials and milestones grant permanent training gains.</p><div class="spiritual-attributes">'+SE.ATTRIBUTES.map(key=>'<article><b>'+key[0].toUpperCase()+key.slice(1)+' '+SE.attribute(q,key)+'</b><small>'+q.attributes[key]+' allocated + '+q.attributeTraining[key]+' trained</small>'+(!battle&&q.unspentPoints?action('attribute-add','+1',key):'')+'</article>').join('')+'</div><p>Maximum '+q.maxEnergy+' SE · Control saves '+Math.round(SE.controlReduction(q)*100)+'% · Empowerment limit +'+SE.outputLimit(q)+' base SE</p><p>Costs combine with bonds and vows, with a 40% minimum cost. Empowerment has diminishing returns.</p>'+(!battle&&safe()?action('attribute-retrain','Retrain · '+SE.retrainingCost(q)+' Coin'):'<p>Visit a safe place to retrain allocated points or change vows.</p>')+'<h3>Spiritual senses</h3><p>Toggle off at any time. Both can operate together. Passive recovery continues while exploring. Senses stop on battle entry or depletion.</p>'+['perception','concealment'].map(kind=>{const profile=kind==='perception'?p:c,active=q.senses?.[kind];return '<article class="support-card"><b>'+kind[0].toUpperCase()+kind.slice(1)+' · '+(active?'Active':'Off')+'</b><p>'+profile.drain.toFixed(2)+' SE / min · '+(kind==='perception'?p.range+' tile range; exact spiritual locations, not puzzle solutions':Math.round(c.strength*100)+'% encounter and detection reduction; powerful enemies may resist')+'</p>'+(!battle?action('sense-toggle',active?'Turn off':'Activate',kind):'Unavailable in battle')+(!battle&&safe()?action('sense-train','Advanced training',kind):'')+'</article>';}).join('')+'<h3>Vow · '+esc(v?.name||(q.vowBroken?'Broken until battle ends':'None'))+'</h3>'+SE.availableVows(q).map(vow=>'<article class="support-card"><b>'+esc(vow.name)+'</b><p>'+esc(vow.rule)+' '+esc(vow.benefit)+'</p>'+(q.vow===vow.id?'<b>Selected'+(q.vowBroken?' · benefit suspended':'')+'</b>':!battle&&safe()?action('vow-select','Choose vow',vow.id):'')+'</article>').join('')+(!battle&&safe()?action('vow-select','Remove vow',''):'')+'<p>Further vows unlock through Sealer levels or distinct training milestones.</p>',{wide:true});
}
function toggleSpiritualSense(kind,approved=false){
 if(battle)return;const q=SE.ensureSealer(s);if(!q.senses?.[kind]&&SE.vowViolation(q,kind)&&!approved)return warnVow(()=>toggleSpiritualSense(kind,true));
 if(approved)SE.breakVow(q,false);const r=SE.toggleSense(q,kind);if(!r.ok)return toast(r.reason);save();spiritualArtsMenu();
}
function trainSpiritualSense(kind){
 if(battle||!safe()||!['perception','concealment'].includes(kind))return;const q=SE.ensureSealer(s),key=kind+'Training',next=q[key]+1,cost=50+25*next;
 if(q.level<next*5&&Object.keys(q.trainingAwards).length<next*2)return toast('Next training requires Sealer level '+next*5+' or '+next*2+' distinct spiritual milestones.');
 if(s.inventory.coins<cost)return toast('Training costs '+cost+' Coin.');s.inventory.coins-=cost;q[key]=next;SE.awardAttribute(q,'sense:'+kind+':'+next,{attribute:'control'});save();spiritualArtsMenu();toast('Spiritual '+kind+' improved.');
}
function useSupportAction(value,extra=0,approved=false){
 if(!battle?.rt)return;const [id,recipient]=value.split('|'),ctx=realTimeContext(),result=RT.usePlayerSupport(battle.rt,ctx,'a',id,recipient,{extra,breakVow:approved});
 if(result.requiresVowBreak)return warnVow(()=>useSupportAction(value,extra,true));if(!result.ok)return toast(result.reason+(result.remainingMs?' '+seconds(result.remainingMs):''));battle.log.push(...result.log);applyRealTimeContext(ctx);save();render();
}
function useCooperativeAction(id,approved=false){
 if(!battle?.rt)return;const ctx=realTimeContext(),plan=CO.cooperativePlans(ctx.active.a,spOf,s.sealer).find(p=>p.id===id);if(!plan)return;
 const result=CO.commitCooperative(plan,battle.rt,ctx,'a',RT.actionAvailability,RT.scheduleAction,{breakVow:approved});if(result.requiresVowBreak)return warnVow(()=>useCooperativeAction(id,true));if(!result.ok)return toast(result.reason);battle.log.push(...result.log);battle.participants=[...new Set([...battle.participants,...plan.participants.map(p=>p.id)])];applyRealTimeContext(ctx);closeModal();save();render();
}
function energyActionQuote(button,extra){
 const q=s.sealer;if(button.dataset.energyGesture==='support'){const [id,recipient]=button.dataset.value.split('|'),u=s.spirits.find(u=>u.id===recipient),t=q.known[id];if(!u||!t)return null;const p=SE.supportQuote(SE.vowViolation(q,t.effects.some(e=>e.kind==='recall')?'recall':'support',{extra,offensive:SE.supportQuote(q,t,u,extra).offensive})?{...q,vowBroken:'battle'}:q,t,u,extra);return {...p,text:p.cost+' SE · '+(p.castMs/1000).toFixed(2)+'s cast · '+(p.cooldownMs/1000).toFixed(1)+'s CD · '+supportEffectPreview(q,p,u)};}
 const t=CO.FIELD_RITUALS.find(t=>t.id===button.dataset.value);if(!t)return null;const p=SE.ritualQuote(q,t,extra),unit=CO.fieldRitualTeam(t,party(),spOf).sort((a,b)=>SE.manifestationCost(q,a,spOf(a))-SE.manifestationCost(q,b,spOf(b)))[0],release=unit?SE.manifestationCost(q,unit,spOf(unit)):0;
 return {...p,text:(p.cost+release)+' SE total · instant · no cooldown · '+(t.id==='stabilize'?Math.round(30*p.multiplier)+' protected steps':t.id==='purify'&&p.extra?'Cleanse and heal '+Math.ceil(10*p.multiplier)+'% HP':t.id==='unseal'?'Unseal barrier; empowerment extends reach to '+(2+Math.floor(p.bonus*10))+' tiles':'Cleanse physical afflictions')};
}
function clearEnergyGesture(){const g=energyGesture;energyGesture=null;if(g){delete g.button.dataset.gesturePreview;g.button.removeAttribute('aria-description');}}
document.addEventListener('pointerdown',ev=>{
 const button=ev.target.closest?.('[data-energy-gesture]');if(!button||button.disabled||ev.isPrimary===false||ev.button>0)return;
 energyGesture={button,x:ev.clientX,y:ev.clientY,pointerId:ev.pointerId,extra:0,battle};try{button.setPointerCapture?.(ev.pointerId);}catch{clearEnergyGesture();}
});
document.addEventListener('pointermove',ev=>{
 const g=energyGesture;if(!g||g.pointerId!==ev.pointerId)return;const dx=ev.clientX-g.x,dy=ev.clientY-g.y;g.cancelled=dy< -60;g.extra=Math.min(SE.outputLimit(s.sealer),Math.max(0,Math.floor((dx-16)/5)));
 const p=energyActionQuote(g.button,g.extra);if(p){g.button.dataset.gesturePreview=g.cancelled?'Cancel · no Energy spent':p.text;g.button.setAttribute('aria-description',g.button.dataset.gesturePreview);}
});
document.addEventListener('pointerup',ev=>{
 const g=energyGesture;if(!g||g.pointerId!==ev.pointerId)return;clearEnergyGesture();energyClickUntil=performance.now()+500;if(g.cancelled||g.battle!==battle)return;
 if(g.button.dataset.energyGesture==='support')useSupportAction(g.button.dataset.value,g.extra);else performFieldRitual(g.button.dataset.value,g.extra);
});
document.addEventListener('click',ev=>{if(ev.target.closest?.('[data-energy-gesture]')&&performance.now()<energyClickUntil){ev.stopImmediatePropagation();ev.preventDefault();}},true);
document.addEventListener('keydown',ev=>{const b=ev.target.closest?.('[data-energy-gesture]');if(!b)return;if(['ArrowRight','ArrowLeft','Home'].includes(ev.key)){ev.preventDefault();b.dataset.energyExtra=ev.key==='Home'?0:Math.max(0,Math.min(SE.outputLimit(s.sealer),(Number(b.dataset.energyExtra)||0)+(ev.key==='ArrowRight'?1:-1)));const p=energyActionQuote(b,Number(b.dataset.energyExtra));if(p)b.dataset.gesturePreview=p.text;}});
document.addEventListener('pointercancel',clearEnergyGesture);document.addEventListener('lostpointercapture',ev=>{if(energyGesture?.pointerId===ev.pointerId)clearEnergyGesture();});document.addEventListener('keydown',ev=>{if(ev.key==='Escape')clearEnergyGesture();});window.addEventListener('blur',clearEnergyGesture);document.addEventListener('visibilitychange',()=>{if(document.hidden)clearEnergyGesture();});
function legendSite(cx,cy){return regionalLegendSite(s.seed,cx,cy);}
function spiritualDiscoveries(){
 const q=s.sealer;if(!q.senses?.perception||q.energy<=0)return [];const radius=SE.perceptionProfile(q).range,pos=s.cave||s.interior||s.player,found=[];
 const add=(x,y,label,kind='trace')=>{if(Number.isFinite(x)&&Number.isFinite(y)&&Math.hypot(x-pos.x,y-pos.y)<=radius)found.push({x,y,label,kind});};
 if(s.cave){const layout=dungeonLayout(s.cave);for(const f of layout.features)add(f.x,f.y,f.kind==='secret'?'Hidden chamber':f.kind==='tablet'?'Ritual inscription':f.kind);if(layout.secret)add(layout.secret.x,layout.secret.y,'Concealed passage');for(const o of caveObjects(s.cave,dungeonMap(s.cave)))add(o.x,o.y,'Spiritual barrier');return found;}
 if(s.interior){for(const n of W.roomNPCs(s.interior))add(n.x,n.y,n.role==='keeper'?'Sealer presence':'Spiritual presence');return found;}
 const a=E.coord(pos.x-radius,pos.y-radius),b=E.coord(pos.x+radius,pos.y+radius);
 for(let cy=a.cy;cy<=b.cy;cy++)for(let cx=a.cx;cx<=b.cx;cx++){
  for(const r of s.roamers[cx+','+cy]||[])if(roamerArtworkReady(r))add(r.x,r.y,spOf(r.ind).forms[r.ind.appearance]+' · Lv. '+r.ind.level,'spirit');
  for(const n of townNPCs(cx,cy))if(['rival','keeper','scholar','villain'].includes(n.role)){const walk=npcWander.get(n.id);add(walk?.x??n.x,walk?.y??n.y,n.name+' · Sealer presence','sealer');}
  for(const shrine of SW.shrinesForRegion(s.seed,cx,cy))add(shrine.x,shrine.y,shrine.name+' · Ritual trace');
  const legend=A.legendAt(s.seed,cx,cy,isNight(),mapWeather().kind);if(legend){const point=legendSite(cx,cy);add(point.x,point.y,legend.title+' · Regional disturbance','rare');}
 }
 for(const drop of s.drops||[])add(drop.x,drop.y,'Hidden cache');if(challengerApproach)add(challengerApproach.x,challengerApproach.y,'Hostile Sealer','sealer');return found;
}
let spiritualDiscoveryCache={at:0,key:'',items:[]};
function drawSpiritualPerception(ctx,px,py){
 if(!s.sealer.senses?.perception)return;const now=performance.now(),key=[s.cave?.id,s.cave?.level,s.interior?.kind,s.cave?.x??s.interior?.x??s.player.x,s.cave?.y??s.interior?.y??s.player.y,SE.perceptionProfile(s.sealer).range].join('|');
 if(key!==spiritualDiscoveryCache.key||now-spiritualDiscoveryCache.at>400)spiritualDiscoveryCache={at:now,key,items:spiritualDiscoveries()};
 ctx.save();ctx.font='bold 9px monospace';ctx.textAlign='center';for(const f of spiritualDiscoveryCache.items){const x=px(f.x)+16,y=py(f.y)+16;ctx.strokeStyle=f.kind==='rare'?'#f5cb74':'#99f3ef';ctx.lineWidth=2;ctx.strokeRect(x-12,y-12,24,24);ctx.fillStyle='#102328dd';const w=ctx.measureText(f.label).width+8;ctx.fillRect(x-w/2,y-26,w,12);ctx.fillStyle='#d9fffa';ctx.fillText(f.label,x,y-17);}ctx.restore();
}
function useOmegaAction(approved=false){
 if(!battle?.rt)return;const actor=activeBattleAlly(),base=actor&&battleMoves(actor)[selectedMove];if(!actor||actor.omegaUsed||!base||base.id==='struggle'||E.moveCategory(base)==='Status')return;
 if(SE.vowViolation(s.sealer,'support',{offensive:true})&&!approved)return warnVow(()=>useOmegaAction(true));
 const cost=Math.ceil(SE.energyCost(s.sealer,14,{kind:'support',bond:1-Math.min(100,actor.bond||0)*.0015}));if(s.sealer.energy<cost)return toast('Omega empowerment requires '+cost+' Spiritual Energy.');
 const choice={type:'move',move:{...base,id:'omega-'+base.id,name:'Omega '+base.name,realTimeBasePower:undefined,power:Math.max(90,Math.round(base.power*2.2)),omega:true},cooldownKey:base.id,style,commit,targetIndex:battle.enemyTargetSelection||0},check=RT.actionAvailability(battle.rt,actor,spOf(actor),choice);if(!check.ok)return toast(check.reason);
 if(approved)SE.breakVow(s.sealer,true);SE.spendEnergy(s.sealer,cost);const result=submitRealTimeAction(choice);if(!result?.ok)s.sealer.energy=Math.min(s.sealer.maxEnergy,s.sealer.energy+cost);
}
function performLegendaryRitualStage(id,approved=false){
 if(battle)return;const e=encounterState(),stage=e[id]||0;if(stage>=3||!party().some(u=>u.hp>0))return;
 const cost=Math.ceil(SE.energyCost(s.sealer,5+stage*3,{kind:'ritual'}));if(s.sealer.energy<cost)return toast('This ritual stage requires '+cost+' Spiritual Energy.');if(approved)SE.breakVow(s.sealer,false);if(!SE.spendEnergy(s.sealer,cost))return;e[id]=stage+1;SE.trainSealer(s,id+':'+stage,{ritual:true});if(e[id]===3){SE.learnSupport(s,id,'Legendary ritual discovery');if(!s.sealer.advanced.includes('united'))s.sealer.advanced.push('united');}save();legendaryRitual();
}
function supportEffectPreview(q,quote,u){
 const max=E.stats(u,spOf(u)),penalty=q.energy<=quote.cost?.15*(1-Math.min(100,u.bond||0)/200):0,efficiency=(1+Math.min(.1,(u.bond||0)/1000))*(1-penalty),t={...quote.technique,effects:quote.technique.effects.map(e=>({...e,amount:e.amount*efficiency}))};
 const text=t.effects.map(e=>e.kind==='heal'?'Restore '+Math.min(Math.max(0,max.hp-u.hp),Math.ceil(max.hp*e.amount))+' HP':e.kind==='willpower'?'Restore '+Math.min(Math.max(0,max.willpower-(u.willpower||0)),Math.max(1,Math.ceil(max.willpower*e.amount)))+' Willpower':e.kind==='revive'?'Revive at '+Math.max(1,Math.floor(max.hp*e.amount))+' HP':ST.supportDescription({...t,effects:[e],sacrifice:null,target:'single'}));
 return text.join('; ')+' · '+(t.durationMs/1000).toFixed(1)+'s duration'+(t.target==='team'?' · All manifested allies':'')+(t.sacrifice?' · Sacrifice '+Math.round(t.sacrifice.amount*100)+'% '+t.sacrifice.kind:'');
}
