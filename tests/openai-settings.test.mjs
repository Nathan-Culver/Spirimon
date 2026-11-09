import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../app.mjs',import.meta.url),'utf8');
const extract=name=>{const start=source.search(new RegExp('(?:async )?function '+name+'\\(')),end=source.slice(start+1).search(/\n(?:async )?function /);return source.slice(start,end<0?source.length:start+1+end);};
test('connecting from Options clears the key field on success and failure without saving the key',async()=>{
 for(const fail of [false,true]){
  const field={value:'test-openai-key-not-saved'},nodes={'#ai-openai-key':field,'#ai-provider-status':{textContent:''},'#ai-provider':{value:'companion'},'#ai-provider-model':{innerHTML:''}},settings={},saved=[];let request;
  const h=vm.createContext({$:id=>nodes[id],s:{settings},currentCompanionToken:()=> 'paired-token',esc:String,aiProviderResult:null,toast(){},save:()=>saved.push(JSON.stringify(settings)),AI:{companionRequest:async(_settings,path,options)=>{request={path,options};if(fail)throw Error('Rejected key');return {models:['configured-text'],message:'OpenAI connected'};}}});
  vm.runInContext(extract('connectOpenAI'),h);await vm.runInContext('connectOpenAI()',h);assert.equal(request.path,'/api/openai/connect');assert.equal(request.options.body.apiKey,'test-openai-key-not-saved');assert.equal(field.value,'');assert.ok(!JSON.stringify(saved).includes('test-openai-key-not-saved'));
  if(fail)assert.match(nodes['#ai-provider-status'].textContent,/Rejected key/);else{assert.equal(settings.aiProvider,'openai');assert.equal(nodes['#ai-provider'].value,'openai');}
 }
});
test('a pairing token cannot follow an imported save to a different service',()=>{
 const h=vm.createContext({s:{settings:{companionUrl:'https://trusted.example'}},aiCompanionOrigin:'https://trusted.example',aiCompanionToken:'private-pairing-token',AI:{companionURL:s=>s.companionUrl}});vm.runInContext(extract('currentCompanionToken'),h);assert.equal(vm.runInContext('currentCompanionToken()',h),'private-pairing-token');h.s.settings.companionUrl='https://other.example';assert.equal(vm.runInContext('currentCompanionToken()',h),'');
});
