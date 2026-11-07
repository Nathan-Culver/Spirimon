import * as E from './engine.mjs';
import {validateHeldItems} from './equipment.mjs';

export function decodeSavePayload(input){
 const data=typeof input==='string'?JSON.parse(input):structuredClone(input),next=data?.save;
 if(data?.format!=='spirimon-backup'||data.version!==E.VERSION||!next?.player||!Array.isArray(next.spirits)||!next.species||typeof next.seed!=='string')throw Error('Not a Spirimon backup.');
 if(!Number.isInteger(next.player.x)||!Number.isInteger(next.player.y)||!Array.isArray(next.party)||next.party.length>6||new Set(next.party).size!==next.party.length)throw Error('Invalid player or party data.');
 const ids=new Set();
 for(const u of next.spirits){if(!u?.id||ids.has(u.id)||!next.species[u.species]||!Number.isFinite(u.hp)||!Number.isInteger(u.level)||u.level<1||!Number.isInteger(u.form)||u.form<0||u.form>2)throw Error('Invalid Spirimon data.');ids.add(u.id);}
 if(next.party.some(id=>!ids.has(id)))throw Error('A party member is missing from this backup.');
 validateHeldItems(next);E.migrateSaveCreatures(next);
 for(const sp of Object.values(next.species))if(!E.TYPES.includes(sp.base)||!E.TYPES.includes(sp.alter)||sp.base===sp.alter||sp.forms?.length!==3||sp.moves?.length!==4)throw Error('Invalid species data.');
 if(data.library!==undefined&&!Array.isArray(data.library))throw Error('Invalid species library.');
 return {...data,save:next,library:data.library||[]};
}

export async function readLinkedSave(handle){
 if(!handle)return null;
 const permission=await handle.queryPermission({mode:'read'});
 if(permission!=='granted')throw Object.assign(Error('Reconnect your device save to grant file access. The linked file has not been changed.'),{code:'SAVE_PERMISSION'});
 const file=handle.kind==='directory'?await handle.getFileHandle('spirimon-save.json'):handle;
 const contents=await file.getFile();if(contents.size>150*1024*1024)throw Error('The linked save is too large.');
 return decodeSavePayload(await contents.text());
}

export async function writeLinkedSave(handle,payload){
 const permission=await handle.queryPermission({mode:'readwrite'});if(permission!=='granted')return false;
 const file=handle.kind==='directory'?await handle.getFileHandle('spirimon-save.json',{create:true}):handle;
 const writer=await file.createWritable();
 try{await writer.write(JSON.stringify(payload));await writer.close();return true;}
 catch(error){await writer.abort?.().catch(()=>{});throw error;}
}

// A linked file is authoritative. Never silently replace it with a new journey.
export async function selectStartupSave({handle,browserSave,browserLibrary=[],readFile=readLinkedSave,readBrowser=async()=>({save:browserSave,library:browserLibrary})}){
 if(!handle)return {...await readBrowser(),source:'browser'};
 let payload;
 try{payload=await readFile(handle);}
 catch(error){
  const recovery=await readBrowser();if(!recovery.save)throw error;
  return {...recovery,source:'recovery',warning:'The linked file could not load: '+error.message+' Browser recovery was opened; file writing is paused.',writeBlocked:true,error};
 }
 // Reading an authoritative file does not require permission to overwrite it.
 // A failed write-permission check must never switch to a different journey.
 let writable=false;try{writable=await handle.queryPermission({mode:'readwrite'})==='granted';}catch{}
 return {...payload,source:'file',...(!writable?{writeBlocked:true,warning:'Your linked device file was loaded. Reconnect the file to enable automatic saving; writing is paused.'}:{})};
}
