import {renderCreaturePixels} from '../creature-visuals.mjs';
import {encodePNG} from '../creature-png.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {makeSpecies} from '../engine.mjs';
const requests=[];
let activeSpecies=makeSpecies(9,'Beast','Plant',[]),imageCount=0,visionConfidence=.95,failFormOnce=null,formFailureUsed=false;
const png='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==';
const models=http.createServer(async(req,res)=>{let data='';for await(const c of req)data+=c;const body=data?JSON.parse(data):null;requests.push({url:req.url,body});res.setHeader('Content-Type','application/json');if(req.url==='/api/tags')return res.end(JSON.stringify({models:[{name:'test-local-model'}]}));if(req.url==='/sdapi/v1/sd-models')return res.end('[]');if(req.url==='/api/show')return res.end(JSON.stringify({capabilities:['vision']}));
if(req.url==='/api/generate'&&body.images?.length===3)return res.end(JSON.stringify({response:JSON.stringify({confidence:.95,familyContinuity:true,structuralProgression:true,originalIdentity:true,repairForms:[],issues:[]})}));
if(req.url==='/api/generate'&&body.images){const form=Number(body.prompt.match(/Expected Form (\d)/)?.[1]||1)-1;const personhood=!(form===failFormOnce&&!formFailureUsed);if(!personhood)formFailureUsed=true;return res.end(JSON.stringify({response:JSON.stringify({base:activeSpecies.base,alter:activeSpecies.alter,bodyPlan:(activeSpecies.design?.formPlans?.[Number(body.prompt.match(/Expected Form (\d)/)?.[1]||1)-1]?.anatomy||activeSpecies.anatomy).bodyPlan,traits:activeSpecies.anatomy.traits,limbs:activeSpecies.anatomy.limbs,manipulators:activeSpecies.anatomy.manipulators,nonhuman:true,confidence:visionConfidence,referenceConfidence:.95,personhoodVisible:personhood,anatomySound:true,plannedSurrealism:true,typeIntegration:true,domainIntegration:true,quality:{style:.95,readability:.95,materialClarity:.95}})}));}
if(req.url==='/api/generate')return res.end(JSON.stringify({response:JSON.stringify({forms:['Mosskit','Mossfang','Mosswarden'],description:'A moss-covered fox with thorn antlers.',visualPrompts:['small moss fox','large moss fox','elder moss fox'],moveNames:['Claw','Thorn','Pulse','Ward']})}));imageCount++;return res.end(JSON.stringify({images:[encodePNG(renderCreaturePixels(activeSpecies,Number(body?.prompt?.match(/ Form (\d) of /)?.[1]||1)-1)).toString('base64')]}));});
await new Promise(r=>models.listen(0,'127.0.0.1',r));
process.env.SPIRIMON_OLLAMA='http://127.0.0.1:'+models.address().port;
process.env.SPIRIMON_IMAGE=process.env.SPIRIMON_OLLAMA;
const {createServer}=await import('../companion.mjs');
const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url='http://127.0.0.1:'+server.address().port;
test.after(()=>{server.close();models.close();});
test('companion serves the game without exposing arbitrary project files',async()=>{const response=await fetch(url+'/');assert.equal(response.status,200);assert((await response.text()).includes('SPIRIMON'));assert.equal((await fetch(url+'/companion.mjs')).status,404);assert.equal((await fetch(url+'/../package.json')).status,404);});
test('companion refuses untrusted origins',async()=>{const response=await fetch(url+'/api/status',{headers:{Origin:'https://untrusted.example'}});assert.equal(response.status,403);});
test('companion detects local text and image providers',async()=>{const response=await fetch(url+'/api/status',{headers:{Origin:'https://nathan-culver.github.io'}});assert.equal(response.headers.get('access-control-allow-origin'),'https://nathan-culver.github.io');const body=await response.json();assert.deepEqual(body.models,['test-local-model']);assert.equal(body.imageReady,true);});
test('full local generation adapter validates text and creates three sequential reference sprites',async()=>{const original=activeSpecies=makeSpecies(9,'Beast','Plant',[]);imageCount=0;const response=await fetch(url+'/api/generate',{method:'POST',headers:{Origin:'https://nathan-culver.github.io','Content-Type':'application/json'},body:JSON.stringify({species:original,model:'test-local-model',visionModel:'test-vision-model',existing:[]})});assert.equal(response.status,200);const data=await response.json();assert.equal(data.forms.length,3);assert.equal(data.sprites.length,3);const gen=requests.find(r=>r.url==='/api/generate');assert.equal(gen.body.keep_alive,0);assert.equal(gen.body.format.type,'object');const img=requests.filter(r=>r.url.startsWith('/sdapi/v1/')&&r.body);assert.deepEqual(img.map(r=>r.url),['/sdapi/v1/txt2img','/sdapi/v1/img2img','/sdapi/v1/img2img']);assert.equal(img[1].body.init_images[0],encodePNG(renderCreaturePixels(original,0)).toString('base64'));assert.equal(img[2].body.init_images[0],encodePNG(renderCreaturePixels(original,1)).toString('base64'));assert.equal(data.visualValidation.status,'vision-verified');assert.equal(data.visualValidation.lineageReview.structuralProgression,true);});

test('original roster artwork, pixel font and world module have working static routes',async()=>{const font=await fetch(url+'/assets/spirimon-pixel.ttf');assert.equal(font.status,200);assert.equal(font.headers.get('content-type'),'font/ttf');assert((await font.arrayBuffer()).byteLength>1000);const art=await fetch(url+'/assets/roster/kilnscale.webp');assert.equal(art.status,200);assert.equal(art.headers.get('content-type'),'image/webp');assert.equal((await fetch(url+'/roster.mjs')).status,200);});


test('every browser source module and interior asset has a working static route',async()=>{
 const html=await (await fetch(url+'/')).text(),modules=html.match(/<meta name="spirimon-modules" content="([^"]+)">/)[1].split(',');
 for(const path of modules){const response=await fetch(new URL(path,url+'/'));assert.equal(response.status,200,path);assert.match(response.headers.get('content-type'),/javascript/);}
 const interior=await fetch(url+'/assets/interiors/door.svg');assert.equal(interior.status,200);assert.equal(interior.headers.get('content-type'),'image/svg+xml');
});

test('local play serves both mystery assets and the animation preview',async()=>{
 for(const name of ['mystery.webp','mystery-walk.webp']){const response=await fetch(url+'/assets/placeholder/'+name);assert.equal(response.status,200);assert.equal(response.headers.get('content-type'),'image/webp');assert.ok((await response.arrayBuffer()).byteLength>1000);}
 const preview=await fetch(url+'/assets/placeholder/preview.html');assert.equal(preview.status,200);assert.match(await preview.text(),/Walking directions/);
});

test('without a vision model, text designs receive complete procedural sprites instead of unverified AI images',async()=>{
 const original=activeSpecies=makeSpecies('no-vision','Construct','Fey'),before=requests.filter(r=>r.url.startsWith('/sdapi/v1/')&&r.body).length;
 const response=await fetch(url+'/api/generate',{method:'POST',headers:{Origin:'https://nathan-culver.github.io','Content-Type':'application/json'},body:JSON.stringify({species:original,model:'test-local-model'})});
 assert.equal(response.status,200);const data=await response.json();assert.equal(data.visualValidation.status,'procedural-verified');assert.equal(data.sprites.length,3);assert.equal(requests.filter(r=>r.url.startsWith('/sdapi/v1/')&&r.body).length,before);assert.ok(data.capabilities.verified);
});
test('low-confidence semantic image checks retry once then use an explicitly labeled geometry fallback',async()=>{
 const original=activeSpecies=makeSpecies('uncertain-art','Construct','Plant');imageCount=0;visionConfidence=.4;
 try{const before=requests.filter(r=>r.url==='/sdapi/v1/txt2img').length;
 const response=await fetch(url+'/api/generate',{method:'POST',headers:{Origin:'https://nathan-culver.github.io','Content-Type':'application/json'},body:JSON.stringify({species:original,model:'test-local-model',visionModel:'test-vision-model'})});
 assert.equal(response.status,200);const data=await response.json();assert.equal(data.visualValidation.status,'procedural-verified');assert.match(data.visualValidation.reason,/unverified/);assert.equal(requests.filter(r=>r.url==='/sdapi/v1/txt2img').length-before,2);
 }finally{visionConfidence=.95;}
});

test('a failed middle Form is repaired without regenerating accepted Forms',async()=>{
 activeSpecies=makeSpecies('surgical-repair','Beast','Plant');imageCount=0;failFormOnce=1;formFailureUsed=false;
 try{const before=requests.length,response=await fetch(url+'/api/generate',{method:'POST',headers:{Origin:'https://nathan-culver.github.io','Content-Type':'application/json'},body:JSON.stringify({species:activeSpecies,model:'test-local-model',visionModel:'test-vision-model'})}),data=await response.json();
 assert.equal(data.visualValidation.status,'vision-verified');const imageRequests=requests.slice(before).filter(r=>r.url.startsWith('/sdapi/v1/')&&r.body),forms=imageRequests.map(r=>Number(r.body.prompt.match(/ Form (\d) of /)[1])-1);assert.deepEqual(forms,[0,1,1,2]);assert.equal(data.visualValidation.repairs.length,1);assert.equal(data.visualValidation.repairs[0].form,1);assert.match(imageRequests[2].body.prompt,/personhoodVisible/);
 }finally{failFormOnce=null;formFailureUsed=false;}
});
