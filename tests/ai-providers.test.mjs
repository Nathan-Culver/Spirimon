import test from 'node:test';
import assert from 'node:assert/strict';
import * as AI from '../ai-providers.mjs';
test('remote companions require HTTPS and cannot embed credentials or redirect paths',()=>{
 for(const companionUrl of ['http://192.168.1.2:4317','https://user:pass@relay.example','https://relay.example/path','https://relay.example?key=secret'])assert.throws(()=>AI.companionURL({companionUrl}));
 assert.equal(AI.companionURL({companionUrl:'https://relay.example/'}),'https://relay.example');assert.equal(AI.companionURL(), 'http://127.0.0.1:4317');
});
test('OpenAI and local companion operations use the configured phone relay and a session bearer token',async()=>{
 const original=globalThis.fetch,requests=[];globalThis.fetch=async(url,options)=>{requests.push({url,options});return Response.json({models:['text'],visionModels:['vision'],imageReady:true});};
 try{const settings={companionUrl:'https://relay.example'};await AI.probe('openai',settings,{companionToken:'session-pairing-token'});await AI.probe('companion',settings,{companionToken:'session-pairing-token'});await AI.companionRequest(settings,'/api/openai/generate',{token:'session-pairing-token',body:{species:{id:'test'}}});assert.deepEqual(requests.map(r=>r.url),['https://relay.example/api/openai/status','https://relay.example/api/status','https://relay.example/api/openai/generate']);assert.ok(requests.every(r=>r.options.headers.Authorization==='Bearer session-pairing-token'));assert.equal(settings.companionToken,undefined);
 }finally{globalThis.fetch=original;}
});
test('automatic selection keeps the existing free-provider order and requires opting into OpenAI',async()=>{
 const original=globalThis.fetch;let calls=0;globalThis.fetch=async url=>{calls++;if(String(url).includes('/openai/'))assert.fail('automatic selection must not select a paid provider without configuration');throw Error('offline');};
 try{const result=await AI.choose({aiProvider:'auto',aiOrder:['companion','procedural']});assert.equal(result.type,'procedural');assert.equal(calls,1);}finally{globalThis.fetch=original;}
});
test('OpenAI errors retain their pause status for the generation queue',async()=>{
 const original=globalThis.fetch;globalThis.fetch=async()=>Response.json({error:'API quota exhausted',code:'insufficient_quota',retryable:false},{status:429});
 try{await assert.rejects(AI.companionRequest({},'/api/openai/generate',{body:{species:{}}}),error=>error.code==='insufficient_quota'&&error.retryable===false);}finally{globalThis.fetch=original;}
});
