import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,stat,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {loadHomeServerConfig,saveHomeServerConfig} from '../home-server-config.mjs';
import {configureHomeServer,launchHomeServer} from '../tools/home-server.mjs';
import * as HOME from '../home-server-ui.mjs';
import * as AI from '../ai-providers.mjs';
import {createServer} from '../companion.mjs';
const origin='https://nathan-culver.github.io',token='test-private-home-pairing-token-123456';
async function start(openai){const server=createServer({openai,token,publicUrl:'https://home.example'});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));return {server,url:'http://127.0.0.1:'+server.address().port,headers:{Host:'home.example',Origin:origin,Authorization:'Bearer '+token,'Content-Type':'application/json'}};}
async function stop(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
async function eventual(fn){for(let n=0;n<50;n++){const value=await fn();if(value)return value;await new Promise(resolve=>setTimeout(resolve,5));}assert.fail('Timed out waiting for job');}
test('home server setup keeps its key in a private host file and exports only scoped pairing details',async()=>{
 const directory=await mkdtemp(path.join(tmpdir(),'spirimon-home-'));
 try{
  const answers=['https://home.example','test-server-secret-key-should-not-be-exported'];const result=await configureHomeServer({directory,ask:async()=>answers.shift()});
  const config=await loadHomeServerConfig(directory),pair=JSON.parse(await readFile(result.pairingFile,'utf8'));
  assert.equal(config.apiKey,'test-server-secret-key-should-not-be-exported');assert.equal(config.token.length,64);assert.equal(pair.url,'https://home.example');assert.equal(pair.token,config.token);assert.ok(!JSON.stringify(pair).includes(config.apiKey));
  if(process.platform!=='win32'){assert.equal((await stat(result.configFile)).mode&0o777,0o600);assert.equal((await stat(directory)).mode&0o777,0o700);}
  await configureHomeServer({directory,ask:async()=>''});assert.deepEqual(await loadHomeServerConfig(directory),config);
  const launched=await launchHomeServer({directory,env:{},listen:false});assert.equal(launched.publicUrl,'https://home.example');assert.equal(launched.localUrl,'http://127.0.0.1:4317');
  await assert.rejects(saveHomeServerConfig({...config,publicUrl:'http://192.168.1.2'},directory),/HTTPS/);
 }finally{await rm(directory,{recursive:true,force:true});}
});
test('desktop file and installed Android origins work only when paired, while arbitrary sites remain blocked',async()=>{
 const {server,url,headers}=await start({configured:true,status:async()=>({models:['text']})});
 try{
  for(const Origin of ['null','https://localhost','capacitor://localhost']){
   const response=await fetch(url+'/api/health',{headers:{...headers,Origin}});assert.equal(response.status,200);assert.equal(response.headers.get('access-control-allow-origin'),Origin);assert.equal((await response.json()).openaiConfigured,true);
   assert.equal((await fetch(url+'/api/health',{headers:{Host:'home.example',Origin}})).status,401);
  }
  assert.equal((await fetch(url+'/api/health',{headers:{...headers,Origin:'https://untrusted.example'}})).status,403);
  assert.equal((await fetch(url+'/home-server-config.mjs',{headers})).status,404);
 }finally{await stop(server);}
});
test('tunnel generation returns promptly, deduplicates submission, and polls one paid operation',async()=>{
 let finish,calls=0;const pending=new Promise(resolve=>finish=resolve),{server,url,headers}=await start({configured:true,generate:async()=>{calls++;await pending;return {sprites:['one','two','three']};}});
 const id='idempotent-request-123456789',body=JSON.stringify({id,operation:'openai/generate',body:{species:{id:'candidate'}}});
 try{
  const first=await fetch(url+'/api/jobs',{method:'POST',headers,body});assert.equal(first.status,202);assert.equal((await first.json()).status,'running');
  const repeated=await fetch(url+'/api/jobs',{method:'POST',headers,body});assert.equal(repeated.status,202);assert.equal(calls,1);
  assert.equal((await fetch(url+'/api/jobs/'+id,{headers:{Host:'home.example',Origin:origin}})).status,401);
  assert.equal((await fetch(url+'/api/jobs',{method:'POST',headers,body:JSON.stringify({id:'another-request-123456789',operation:'openai/generate',body:{}})})).status,409);
  finish();const result=await eventual(async()=>{const value=await (await fetch(url+'/api/jobs/'+id,{headers})).json();return value.status==='completed'?value:null;});assert.deepEqual(result.result.sprites,['one','two','three']);assert.equal(calls,1);
  await fetch(url+'/api/jobs',{method:'POST',headers,body});assert.equal(calls,1);
 }finally{finish();await stop(server);}
});
test('cancelling a polled job aborts subsequent provider work and errors do not spend again',async()=>{
 let started,wasAborted=false;const begin=new Promise(resolve=>started=resolve),{server,url,headers}=await start({configured:true,generate:({signal})=>new Promise((resolve,reject)=>{started();signal.addEventListener('abort',()=>{wasAborted=true;reject(Error('aborted'));},{once:true});})});
 const id='cancel-home-job-12345678';
 try{
  await fetch(url+'/api/jobs',{method:'POST',headers,body:JSON.stringify({id,operation:'openai/generate',body:{}})});await begin;
  await fetch(url+'/api/jobs/'+id,{method:'DELETE',headers});await eventual(()=>wasAborted);
  const result=await eventual(async()=>{const value=await (await fetch(url+'/api/jobs/'+id,{headers})).json();return value.status==='cancelled'?value:null;});assert.equal(result.error.retryable,false);
  const missing=await fetch(url+'/api/jobs/missing-request-12345678',{headers});assert.equal(missing.status,404);assert.equal((await missing.json()).code,'job_missing');
 }finally{await stop(server);}
});
test('browser job client polls after a temporary disconnect without submitting another operation',async()=>{
 const original=globalThis.fetch,seen=[];let polls=0;
 globalThis.fetch=async(url,options)=>{seen.push({url,method:options.method||'GET'});if(options.method==='POST')return Response.json({id:JSON.parse(options.body).id,status:'running'});if(++polls===1)throw TypeError('temporary tunnel outage');return Response.json({status:'completed',result:{accepted:true}});};
 try{assert.deepEqual(await AI.companionJob({companionUrl:'https://home.example'},'/api/openai/generate',{token,body:{},pollMs:1}),{accepted:true});assert.equal(seen.filter(r=>r.method==='POST').length,1);assert.equal(polls,2);}finally{globalThis.fetch=original;}
});
test('pairing imports reject unsafe URLs, never include API keys, and explain different connection failures',()=>{
 const pair={format:'spirimon-connection',version:1,url:'https://home.example',token};assert.equal(HOME.parseHomePairing(JSON.stringify(pair)).origin,pair.url);
 for(const url of ['http://192.168.1.2:4317','https://home.example/path','https://user:secret@home.example'])assert.throws(()=>HOME.parseHomePairing({...pair,url}));
 assert.ok(!HOME.homePairingFile(pair.url,token).includes('apiKey'));
 assert.match(HOME.homeConnectionHelp({code:'openai_not_configured'}),/key is missing/);assert.match(HOME.homeConnectionHelp({code:'invalid_api_key',status:401}),/OpenAI rejected/);assert.match(HOME.homeConnectionHelp({status:401}),/pairing token/);
});
const source=readFileSync(new URL('../app.mjs',import.meta.url),'utf8');
const extract=name=>{const start=source.search(new RegExp('(?:async )?function '+name+'\\(')),end=source.slice(start+1).search(/\n(?:async )?function /);return source.slice(start,end<0?source.length:start+1+end);};
test('remembered pairing restores outside the game save and cannot follow an imported save to another host',async()=>{
 const record={format:'spirimon-connection',version:1,url:'https://home.example',token},context=vm.createContext({HOME,AI,s:{settings:{}},dbGet:async()=>record,aiCompanionToken:'',aiCompanionOrigin:'',homePairingRemembered:false});
 vm.runInContext(extract('restoreHomeServerPairing'),context);vm.runInContext(extract('currentCompanionToken'),context);await vm.runInContext('restoreHomeServerPairing()',context);
 assert.equal(vm.runInContext('homePairingRemembered',context),true);assert.equal(vm.runInContext('currentCompanionToken()',context),token);assert.ok(!JSON.stringify(context.s).includes(token));
 context.s.settings.companionUrl='https://other.example';assert.equal(vm.runInContext('currentCompanionToken()',context),'');
});

test('same-origin desktop GET requests authenticate even when browsers omit Origin',async()=>{
 const {server,url,headers}=await start({configured:true,status:async()=>({models:['text']})});
 try{
  const own={Authorization:'Bearer '+token,'Sec-Fetch-Site':'same-origin',Referer:url+'/'};
  assert.equal((await fetch(url+'/api/openai/status',{headers:own})).status,200);
  assert.equal((await fetch(url+'/api/openai/status',{headers:{...own,Referer:'https://untrusted.example/'}})).status,403);
  assert.equal((await fetch(url+'/api/openai/status',{headers:{...own,Authorization:'wrong'}})).status,401);
 }finally{await stop(server);}
});
test('clients use short jobs only after that exact companion advertises support',async()=>{
 const original=globalThis.fetch,seen=[],settings={companionUrl:'https://jobs-only.home.example'};
 globalThis.fetch=async(url,options)=>{seen.push({url,method:options.method||'GET'});if(url.endsWith('/api/health'))return Response.json({supportsJobs:true});if(url.endsWith('/api/jobs')&&options.method==='POST')return Response.json({status:'completed',result:{finished:true}});throw Error('Unexpected synchronous request');};
 try{await AI.companionRequest(settings,'/api/health',{token});assert.deepEqual(await AI.companionRequest(settings,'/api/openai/generate',{token,body:{}}),{finished:true});assert.equal(seen[1].url,'https://jobs-only.home.example/api/jobs');}finally{globalThis.fetch=original;}
});

test('forgetting disconnects before storage completes, so queued work cannot reuse the token',async()=>{
 let finish;const waiting=new Promise(resolve=>finish=resolve),context=vm.createContext({HOME,s:{settings:{aiProvider:'openai',aiEnabled:true}},aiCompanionToken:token,aiCompanionOrigin:'https://home.example',homePairingRemembered:true,aiProviderResult:{},homeServerStatus:'',cancelArtworkGeneration(){},save(){},homeServerSetup(){},dbPut:()=>waiting});
 vm.runInContext(extract('forgetHomeServer'),context);const result=vm.runInContext('forgetHomeServer()',context);assert.equal(context.aiCompanionToken,'');assert.equal(context.s.settings.aiEnabled,false);finish();await result;assert.match(context.homeServerStatus,/Pairing forgotten/);
});
