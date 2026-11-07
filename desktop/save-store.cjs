const fs=require('node:fs/promises');
const path=require('node:path');
const LIMIT=150*1024*1024;
function createSaveStore(configPath){
 let writing=Promise.resolve();
 async function directory(){try{return JSON.parse(await fs.readFile(configPath,'utf8')).directory||null;}catch(error){if(error.code==='ENOENT')return null;throw error;}}
 async function status(){return {linked:!!await directory()};}
 async function choose(folder){await fs.mkdir(path.dirname(configPath),{recursive:true});await fs.writeFile(configPath,JSON.stringify({directory:folder}));return status();}
 async function read({backup=false}={}){
  const folder=await directory();if(!folder)return {exists:false};const file=path.join(folder,backup?'spirimon-save.previous.json':'spirimon-save.json');
  try{if((await fs.stat(file)).size>LIMIT)throw Error('Save file is too large.');return {exists:true,text:await fs.readFile(file,'utf8')};}catch(error){if(error.code==='ENOENT')return {exists:false};throw error;}
 }
 async function write({text}){
  if(typeof text!=='string'||Buffer.byteLength(text)>LIMIT)throw Error('Invalid save payload.');
  const data=JSON.parse(text);if(data.format!=='spirimon-backup'||data.version!==1||!data.save?.player||typeof data.save.seed!=='string')throw Error('Invalid save payload.');
  const operation=async()=>{
   const folder=await directory();if(!folder)throw Error('Choose a save folder first.');
   const file=path.join(folder,'spirimon-save.json'),pending=path.join(folder,'spirimon-save.pending.json');
   await fs.writeFile(pending,text,'utf8');
   const old=await read();if(old.exists){try{const previous=JSON.parse(old.text);if(previous.format==='spirimon-backup')await fs.writeFile(path.join(folder,'spirimon-save.previous.json'),old.text,'utf8');}catch(error){if(error instanceof SyntaxError){}else throw error;}}
   await fs.rename(pending,file);return {saved:true};
  };
  const result=writing.then(operation);writing=result.catch(()=>{});return result;
 }
 return {status,choose,read,write};
}
module.exports={createSaveStore};
