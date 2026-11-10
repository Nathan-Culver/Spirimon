// Server-only configuration; never import into the browser bundle.
import {mkdir,readFile,writeFile,rename,chmod} from 'node:fs/promises';
import {homedir} from 'node:os';
import path from 'node:path';
import {randomBytes} from 'node:crypto';
export const HOME_SERVER_DIRECTORY=path.join(homedir(),'.spirimon');
export function validateHomeServerConfig(value={}){
 let publicUrl=String(value.publicUrl||'').trim();
 if(publicUrl){const u=new URL(publicUrl);if(u.protocol!=='https:'||u.username||u.password||u.pathname!=='/'||u.search||u.hash)throw Error('Use your tunnel’s HTTPS address, without a path or credentials.');publicUrl=u.origin;}
 const token=value.token||randomBytes(32).toString('hex');if(typeof token!=='string'||token.length<24||token.length>512||/\s/.test(token))throw Error('Invalid companion pairing token.');
 const apiKey=value.apiKey||'';if(typeof apiKey!=='string'||apiKey&&(apiKey.length<16||apiKey.length>512||/\s/.test(apiKey)))throw Error('Invalid OpenAI API key.');
 return {version:1,publicUrl,token,apiKey};
}
export async function loadHomeServerConfig(directory=HOME_SERVER_DIRECTORY){
 try{return validateHomeServerConfig(JSON.parse(await readFile(path.join(directory,'home-server.json'),'utf8')));}catch(error){if(error.code==='ENOENT')return null;throw error;}
}
async function privateJSON(directory,name,value){
 const file=path.join(directory,name),temp=file+'.'+randomBytes(8).toString('hex')+'.tmp';
 await writeFile(temp,JSON.stringify(value,null,2)+'\n',{mode:0o600,flag:'wx'});await rename(temp,file);if(process.platform!=='win32')await chmod(file,0o600);return file;
}
export async function saveHomeServerConfig(value,directory=HOME_SERVER_DIRECTORY){
 const config=validateHomeServerConfig(value);await mkdir(directory,{recursive:true,mode:0o700});if(process.platform!=='win32')await chmod(directory,0o700);
 const configFile=await privateJSON(directory,'home-server.json',config);
 const pairingFile=await privateJSON(directory,'phone-connection.json',{format:'spirimon-connection',version:1,url:config.publicUrl||'http://127.0.0.1:4317',token:config.token});
 return {config,configFile,pairingFile};
}
