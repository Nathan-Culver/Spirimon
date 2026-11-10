import {createInterface} from 'node:readline/promises';
import {Writable} from 'node:stream';
import {readFile,access} from 'node:fs/promises';
import {stdin,stdout} from 'node:process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {HOME_SERVER_DIRECTORY,loadHomeServerConfig,saveHomeServerConfig,validateHomeServerConfig} from '../home-server-config.mjs';
import {createOpenAIProvider} from '../openai-generation.mjs';
import {createServer} from '../companion.mjs';
export async function configureHomeServer({directory=HOME_SERVER_DIRECTORY,ask}={}){
 const previous=await loadHomeServerConfig(directory)||{};
 const publicUrl=(await ask('HTTPS tunnel address (blank keeps the current address, or desktop-only on first setup): ')).trim()||previous.publicUrl||'';
 const apiKey=(await ask('OpenAI API key (hidden; blank keeps the current key or OPENAI_API_KEY): ',true)).trim()||previous.apiKey||'';
 return saveHomeServerConfig({...previous,publicUrl,apiKey},directory);
}
export async function launchHomeServer({directory=HOME_SERVER_DIRECTORY,env=process.env,listen=true}={}){
 const stored=await loadHomeServerConfig(directory);if(!stored)throw Error('Run npm run server:setup first.');
 const config=validateHomeServerConfig({...stored,publicUrl:env.SPIRIMON_PUBLIC_URL||stored.publicUrl,token:env.SPIRIMON_TOKEN||stored.token,apiKey:env.OPENAI_API_KEY||env.SPIRIMON_OPENAI_KEY||stored.apiKey});
 const bind=env.SPIRIMON_BIND||'127.0.0.1',port=Number(env.SPIRIMON_PORT)||4317;
 if(!['127.0.0.1','localhost','::1'].includes(bind)&&!config.publicUrl)throw Error('Set the HTTPS tunnel address before listening outside this computer.');
 if(listen){const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),html=await readFile(path.join(root,'index.html'),'utf8'),bundle=html.match(/game-[a-f0-9]{12}\.js/)?.[0];try{if(!bundle)throw Error();await access(path.join(root,bundle));}catch{const {writeRelease}=await import('../build.mjs');await writeRelease(root,{target:'web'});}}
 const server=createServer({openai:createOpenAIProvider({apiKey:config.apiKey}),publicUrl:config.publicUrl,token:config.token});server.requestTimeout=0;
 if(listen)await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,bind,resolve);});
 return {server,publicUrl:config.publicUrl,localUrl:'http://127.0.0.1:'+port};
}
async function terminalQuestion(prompt,hidden=false){
 stdout.write(prompt);const output=hidden?new Writable({write(_chunk,_encoding,done){done();}}):stdout;
 const rl=createInterface({input:stdin,output,terminal:!!stdin.isTTY});
 try{return await rl.question('');}finally{rl.close();if(hidden)stdout.write('\n');}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))try{
 if(process.argv.includes('--setup')){
  console.log('Spirimon home server setup\nThe key is stored only in your private user folder: '+HOME_SERVER_DIRECTORY+'\nKeep this folder private. It is outside your game save and source repository.');
  const result=await configureHomeServer({ask:terminalQuestion});console.log('Setup saved. Import this PRIVATE pairing file in Options → Home AI server on each device:\n'+result.pairingFile+'\nThe pairing file contains server access, not your OpenAI key.\nStart with: npm run server:home');
 }else{
  const {server,publicUrl,localUrl}=await launchHomeServer();console.log('Spirimon home server is running.\nOn this computer: '+localUrl+'\nPhone address: '+(publicUrl||'Not configured. Run npm run server:setup after creating your HTTPS tunnel.')+'\nKeep this computer awake, this process running, and the tunnel connected. No router port forwarding is needed for a tunnel.');
  for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>{server.closeAllConnections();server.close(()=>process.exit(0));});
 }
}catch(error){console.error('Home server: '+error.message);process.exitCode=1;}
