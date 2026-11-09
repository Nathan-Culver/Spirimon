import test from 'node:test';
import assert from 'node:assert/strict';
import {createOpenAIProvider,OPENAI_DEFAULTS} from '../openai-generation.mjs';
import {makeSpecies} from '../engine.mjs';
import {renderCreaturePixels} from '../creature-visuals.mjs';
import {encodePNG} from '../creature-png.mjs';

function harness({deny,confidence=.95,duplicate=false}={}){
 const sp=makeSpecies(9,'Beast','Plant',[]),requests=[];let image=0;
 const provider=createOpenAIProvider({apiKey:'test-server-only-key',fetchImpl:async(url,options)=>{
  const body=options.body instanceof FormData?options.body:options.body?JSON.parse(options.body):null;requests.push({url,options,body});
  if(deny)return Response.json({error:{code:deny.code}},{status:deny.status});
  if(url.endsWith('/models'))return Response.json({data:[...new Set(Object.values(OPENAI_DEFAULTS))].map(id=>({id}))});
  if(url.includes('/images/'))return Response.json({data:[{b64_json:encodePNG(renderCreaturePixels(sp,duplicate?0:image++%3)).toString('base64')}]});
  const isVision=body.input[0].content.some(c=>c.type==='input_image');
  const imageCount=isVision?body.input[0].content.filter(c=>c.type==='input_image').length:0;
  const record=imageCount===3?{confidence:.95,familyContinuity:true,structuralProgression:true,originalIdentity:true,repairForms:[],issues:[]}:isVision?{base:sp.base,alter:sp.alter,bodyPlan:(sp.design?.formPlans?.[Number(body.input[0].content[0].text.match(/Expected Form (\d)/)?.[1]||1)-1]?.anatomy||sp.anatomy).bodyPlan,traits:sp.anatomy.traits,limbs:sp.anatomy.limbs,manipulators:sp.anatomy.manipulators,nonhuman:true,confidence,referenceConfidence:.95,personhoodVisible:true,anatomySound:true,plannedSurrealism:true,typeIntegration:true,domainIntegration:true,quality:{style:.95,readability:.95,materialClarity:.95}}:{forms:['Mosskit','Mossfang','Mosswarden'],description:'A moss-covered fox with thorn antlers.',visualPrompts:['small moss fox','mature thorn fox','elder moss fox with a branching crown'],moveNames:['Claw','Thorn','Pulse','Ward'],moves:null};
  return Response.json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(record)}]}]});
 }});
 return {sp,requests,provider};
}
test('OpenAI verifies the configured models without generating a paid image',async()=>{
 const {provider,requests}=harness(),status=await provider.status();assert.equal(status.imageReady,true);assert.deepEqual(status.models,[OPENAI_DEFAULTS.textModel]);assert.equal(requests.length,1);assert.ok(requests[0].url.endsWith('/models'));
});
test('OpenAI produces and independently inspects all three forms, using preceding accepted Forms as editing references',async()=>{
 const {sp,provider,requests}=harness(),result=await provider.generate({species:sp});
 assert.equal(result.sprites.length,3);assert.equal(result.visualValidation.status,'vision-verified');assert.equal(result.visualValidation.semanticSource,'openai-vision-model');assert.equal(result.visualValidation.observations.length,3);
 const design=requests[0].body;assert.equal(design.store,false);assert.equal(design.text.format.strict,true);assert.deepEqual(design.text.format.schema.required,Object.keys(design.text.format.schema.properties));
 const images=requests.filter(r=>r.url.includes('/images/'));assert.equal(images.length,3);assert.ok(images[0].url.endsWith('/generations'));assert.equal(images[0].body.background,'transparent');assert.equal(images[0].body.output_format,'png');
 for(const edit of images.slice(1)){assert.ok(edit.url.endsWith('/edits'));assert.ok(edit.body instanceof FormData);assert.equal(edit.body.get('image').type,'image/png');assert.equal(edit.options.headers['Content-Type'],undefined,'fetch must supply the multipart boundary');}
 assert.equal(requests.filter(r=>r.body?.input?.[0].content.some(c=>c.type==='input_image')).length,4);
 assert.ok(requests.every(r=>r.url.startsWith('https://api.openai.com/v1/')));
 assert.ok(!JSON.stringify(result).includes('test-server-only-key'));
});
test('artwork repair explicitly anchors prompts to the existing form names and identity',async()=>{
 const {sp,provider,requests}=harness();await provider.generate({species:sp,repair:true});const prompt=requests[0].body.input[0].content[0].text;assert.match(prompt,/Repair only the artwork/);for(const name of sp.forms)assert.ok(prompt.includes(name));
});
test('unverified images never become finished artwork, and semantic retries are bounded',async()=>{
 const {sp,provider,requests}=harness({confidence:.4});await assert.rejects(provider.generate({species:sp}),error=>error.code==='openai_artwork_invalid'&&error.retryable===false);assert.equal(requests.filter(r=>r.url.includes('/images/')).length,4);
});
test('identical evolution images are rejected by pixel checks before vision inspection',async()=>{
 const {sp,provider,requests}=harness({duplicate:true});await assert.rejects(provider.generate({species:sp}),/Evolution images must be distinct/);assert.equal(requests.filter(r=>r.body?.input?.[0].content.some(c=>c.type==='input_image')).length,0);
});
test('authentication and exhausted quota pause immediately without retrying or leaking provider messages',async()=>{
 for(const deny of [{status:401,code:'invalid_api_key'},{status:429,code:'insufficient_quota'}]){const {sp,provider,requests}=harness({deny});await assert.rejects(provider.generate({species:sp}),error=>error.status===deny.status&&error.retryable===false&&!error.message.includes('test-server-only-key'));assert.equal(requests.length,1);}
});
test('missing server key never makes an OpenAI request',async()=>{
 let requests=0;const provider=createOpenAIProvider({apiKey:'',fetchImpl:()=>requests++});await assert.rejects(provider.status(),/Set OPENAI_API_KEY/);assert.equal(requests,0);
});
test('model permission errors are detected before any paid generation',async()=>{
 const provider=createOpenAIProvider({apiKey:'test',fetchImpl:async()=>Response.json({data:[]})});await assert.rejects(provider.status(),error=>error.code==='openai_model_unavailable');
});
test('refused or incomplete structured responses never enter image generation',async()=>{
 for(const response of [{status:'incomplete',output:[]},{status:'completed',output:[{content:[{type:'refusal',refusal:'No'}]}]}]){let requests=0;const provider=createOpenAIProvider({apiKey:'test',fetchImpl:async()=>{requests++;return Response.json(response);}});await assert.rejects(provider.generate({species:makeSpecies('refusal','Plant','Fey')}));assert.equal(requests,1);}
});
