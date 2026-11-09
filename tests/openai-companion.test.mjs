import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from '../companion.mjs';

const origin='https://nathan-culver.github.io',token='test-pairing-token-long-enough-for-remote';
async function start(options){const server=createServer(options);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));return {server,url:'http://127.0.0.1:'+server.address().port};}
test('remote mode refuses insecure addresses and missing pairing tokens',()=>{
 for(const options of [{publicUrl:'http://relay.example',token},{publicUrl:'https://relay.example',token:''},{publicUrl:'https://relay.example/path',token}])assert.throws(()=>createServer(options),/HTTPS origin/);
});
test('HTTPS relay hosts require pairing, enforce origins, and preserve OpenAI error status',async()=>{
 let calls=0;const {server,url}=await start({publicUrl:'https://relay.example',token,openai:{status:async()=>{calls++;return {models:['cloud-text'],imageReady:true};},generate:async()=>{throw Object.assign(Error('OpenAI API credits are exhausted.'),{status:429,code:'insufficient_quota',retryable:false});}}});
 try{
  const headers={Host:'relay.example',Origin:origin};
  assert.equal((await fetch(url+'/api/openai/status',{headers})).status,401);assert.equal(calls,0);
  assert.equal((await fetch(url+'/api/openai/status',{headers:{...headers,Authorization:'Bearer wrong'}})).status,401);
  const auth={...headers,Authorization:'Bearer '+token};const ok=await fetch(url+'/api/openai/status',{headers:auth});assert.equal(ok.status,200);assert.equal(ok.headers.get('access-control-allow-origin'),origin);assert.equal(calls,1);
  assert.equal((await fetch(url+'/api/openai/status',{headers:{...auth,Origin:'https://untrusted.example'}})).status,403);
  const preflight=await fetch(url+'/api/openai/generate',{method:'OPTIONS',headers});assert.equal(preflight.status,204);assert.match(preflight.headers.get('access-control-allow-headers'),/Authorization/);
  const failed=await fetch(url+'/api/openai/generate',{method:'POST',headers:auth,body:JSON.stringify({species:{id:'test'}})});assert.equal(failed.status,429);assert.deepEqual(await failed.json(),{error:'OpenAI API credits are exhausted.',code:'insufficient_quota',retryable:false});
  for(const path of ['/openai-generation.mjs','/generation-prompts.mjs','/.env','/companion.mjs'])assert.equal((await fetch(url+path,{headers})).status,404,path);
 }finally{await new Promise(resolve=>server.close(resolve));}
});
test('disconnecting a generation request cancels the server-side OpenAI work',async()=>{
 let started,aborted;const begin=new Promise(resolve=>started=resolve),ended=new Promise(resolve=>aborted=resolve);
 const {server,url}=await start({openai:{generate:({signal})=>new Promise((resolve,reject)=>{started();signal.addEventListener('abort',()=>{aborted();reject(Error('Cancelled'));},{once:true});})}});
 try{const controller=new AbortController(),response=fetch(url+'/api/openai/generate',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:'{}',signal:controller.signal}).catch(()=>{});await begin;controller.abort();await response;await ended;}finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
test('a paired client can connect a key in server memory without returning it to browsers',async()=>{
 let connected='';const {server,url}=await start({token,openai:{status:async()=>({models:['original']})},openaiFactory:({apiKey})=>({status:async()=>{if(apiKey==='invalid-key-for-test')throw Object.assign(Error('OpenAI rejected the API key.'),{status:401,retryable:false});connected=apiKey;return {models:['connected-model'],visionModels:['vision'],imageReady:true,message:'Connected.'};}})});
 const headers={Origin:origin,Authorization:'Bearer '+token,'Content-Type':'application/json'};
 try{
  const key='test-key-sent-once-to-server',response=await fetch(url+'/api/openai/connect',{method:'POST',headers,body:JSON.stringify({apiKey:key})}),body=await response.text();assert.equal(response.status,200);assert.equal(connected,key);assert.ok(!body.includes(key));
  const invalid=await fetch(url+'/api/openai/connect',{method:'POST',headers,body:JSON.stringify({apiKey:'invalid-key-for-test'})});assert.equal(invalid.status,401);assert.equal(connected,key);
  const status=await (await fetch(url+'/api/openai/status',{headers})).json();assert.deepEqual(status.models,['connected-model']);assert.ok(!JSON.stringify(status).includes(key));
 }finally{await new Promise(resolve=>server.close(resolve));}
});
test('an unpaired local companion refuses browser key configuration',async()=>{
 const {server,url}=await start({token:'',openaiFactory:()=>assert.fail('must not accept an unpaired key')});
 try{assert.equal((await fetch(url+'/api/openai/connect',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({apiKey:'test-key-not-accepted'})})).status,403);}finally{await new Promise(resolve=>server.close(resolve));}
});
test('a running generation blocks duplicate requests and key changes',async()=>{
 let started,finish;const begin=new Promise(resolve=>started=resolve),pending=new Promise(resolve=>finish=resolve);let calls=0;
 const {server,url}=await start({token,openai:{generate:async()=>{calls++;started();await pending;return {finished:true};}}}),headers={Origin:origin,Authorization:'Bearer '+token,'Content-Type':'application/json'};
 try{const first=fetch(url+'/api/openai/generate',{method:'POST',headers,body:'{}'});await begin;assert.equal((await fetch(url+'/api/openai/generate',{method:'POST',headers,body:'{}'})).status,409);assert.equal((await fetch(url+'/api/openai/connect',{method:'POST',headers,body:'{}'})).status,409);assert.equal(calls,1);finish();assert.equal((await first).status,200);}finally{finish();await new Promise(resolve=>server.close(resolve));}
});
