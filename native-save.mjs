import {decodeSavePayload} from './save-files.mjs';
export function nativeSaveAPI(){return globalThis.spirimonDeviceSave||null;}
export async function readNativeJourney(api=nativeSaveAPI()){
 if(!api||!(await api.status()).linked)return null;
 const primary=await api.read();
 if(primary.exists){try{return {payload:decodeSavePayload(primary.text),source:'file'};}catch(error){const backup=await api.read({backup:true});if(backup.exists)return {payload:decodeSavePayload(backup.text),source:'backup',warning:'The device save was damaged. Its previous complete save was recovered.'};throw error;}}
 const backup=await api.read({backup:true});if(backup.exists)return {payload:decodeSavePayload(backup.text),source:'backup',warning:'The interrupted device save was recovered from its previous copy.'};
 throw Error('The linked device save is missing. Choose a save folder or load browser recovery.');
}
