import {createCompanionJobs} from './companion-jobs.mjs';
import {completeGenerationDesign,plannedFormAnatomy,generationPrompt,imageFormPrompt,imageGenerationParameters,assertLineageReview,assertNovelGeneration,GENERATION_RULES} from './generation-policy.mjs';
import {createOpenAIProvider} from './openai-generation.mjs';
import {timingSafeEqual} from 'node:crypto';
import {lineageDesign,observationPrompt} from './generation-prompts.mjs';
import {decodePNG,encodePNG} from './creature-png.mjs';
import {renderCreaturePixels,validateLineageImages,validateCreatureImage,certifyRenderedAnatomy} from './creature-visuals.mjs';
import {applyVisualObservation,applyLineageObservations,migrateSpecies} from './anatomy.mjs';
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {TYPES,validateSpecies,hash} from './engine.mjs';
const ROOT=path.dirname(fileURLToPath(import.meta.url)),PORT=Number(process.env.SPIRIMON_PORT)||4317;
const OLLAMA=process.env.SPIRIMON_OLLAMA||'http://127.0.0.1:11434';
const IMAGE=process.env.SPIRIMON_IMAGE||'http://127.0.0.1:7860';
for(const target of[OLLAMA,IMAGE]){const u=new URL(target);if(!['127.0.0.1','localhost','[::1]'].includes(u.hostname))throw Error('Model endpoints must run on this computer.');}
const ALLOWED=new Set(['http://127.0.0.1:'+PORT,'http://localhost:'+PORT,'https://nathan-culver.github.io']);
for(const v of(process.env.SPIRIMON_ORIGINS||'').split(',').filter(Boolean))ALLOWED.add(new URL(v).origin);
// Only serve browser modules reachable from app.mjs, never arbitrary server files.
const FILES={'/':'index.html','/index.html':'index.html','/style.css':'style.css','/assets/placeholder/preview.html':'assets/placeholder/preview.html'};
const browserModules=['app.mjs'];
for(let n=0;n<browserModules.length;n++){
 const id=browserModules[n];if(FILES['/'+id])continue;
 if(id.startsWith('../')||path.isAbsolute(id)||!id.endsWith('.mjs'))throw Error('Unsafe browser module: '+id);
 const source=await readFile(path.join(ROOT,id),'utf8');FILES['/'+id]=id;
 for(const match of source.matchAll(/^import\s+.+?\s+from\s+['"](.+?)['"];?\s*$/gm)){
  if(!match[1].startsWith('./'))throw Error('External browser import: '+match[1]);
  browserModules.push(path.posix.normalize(path.posix.join(path.posix.dirname(id),match[1])));
 }
}
function respond(res,status,data){res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));}
async function jsonRequest(url,body,timeout=3000){const response=await fetch(url,{...(body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(timeout)});if(!response.ok)throw Error('Local model returned HTTP '+response.status);return response.json();}
async function readJSON(req){let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>24000000)throw Error('Request is too large.');}try{return JSON.parse(raw);}catch{throw Object.assign(Error('Invalid JSON request.'),{status:400});}}
async function visionModels(models){const checks=await Promise.allSettled(models.slice(0,30).map(async model=>{const info=await jsonRequest(OLLAMA+'/api/show',{model},2000);return info.capabilities?.includes('vision')?model:null;}));return checks.filter(r=>r.status==='fulfilled'&&r.value).map(r=>r.value);}
export async function observeCreatureImage(sprite,sp,model,form=0){
 if(typeof model!=='string'||!model||model.length>160)throw Error('A local vision model is required to inspect external artwork.');
 const prompt='Independently inspect this image, not its requested design. Return JSON: base, alter (two ordered Types: '+TYPES.join(', ')+'), bodyPlan (biped, quadruped, winged, aquatic, serpentine, tentacled, radial, rooted, amorphous, many-legged), traits (only visible anatomical features), limbs (integer legs, arms, wings, tentacles), manipulators (visible grasping appendages), nonhuman, confidence, referenceConfidence (0–1). Also report booleans personhoodVisible, anatomySound, plannedSurrealism, typeIntegration, domainIntegration; quality scores style, readability and materialClarity (0–1); issues (specific errors). Personhood means a readable face, prominent eyes, mouth or face-mask. Distinguish the planned surreal features from accidental anatomy. Rendered tips must be complete, materials clear and silhouettes readable at 64px. Never infer hands from upright posture or wings from a halo. Ambiguity requires confidence below .8. Anatomical reference: '+JSON.stringify(sp.design?.reference||sp.body)+'. Expected Form '+(form+1)+': '+JSON.stringify(sp.design?.formPlans?.[form]||sp.formAnatomy?.[form]||sp.anatomy)+'. Assigned Domains: '+JSON.stringify(sp.domains)+'. Style: '+(sp.design?.style||'approved General roster style');
 const response=await jsonRequest(OLLAMA+'/api/generate',{model,images:[sprite.replace(/^data:image\/png;base64,/, '')],stream:false,format:'json',keep_alive:0,options:{temperature:0,num_predict:1200},prompt},300000);
 const observation=JSON.parse(response.response);applyVisualObservation({...sp},observation,form);return observation;
}
export async function observeCreatureImages(sprites,sp,model){
 const observations=[];for(let n=0;n<sprites.length;n++)observations.push(await observeCreatureImage(sprites[n],sp,model,n));return observations;
}
export async function reviewGeneratedLineage(sprites,sp,model,existing=[]){
 const prompt='Independently compare all THREE Form images as one family. Return JSON: confidence (0–1), familyContinuity (boolean), structuralProgression (boolean), originalIdentity (boolean), repairForms (array of zero-based Form indices needing repair), issues (specific reasons). Adjacent Forms must change at least two of silhouette, proportions, posture, body architecture, appendage function and spirit manifestation. Increased size, ornament count or added texture alone is insufficient. Planned body-plan changes are allowed; identity, motif and materials must remain recognizable. Reject copied identities or generic decorative clutter. '+JSON.stringify({plan:sp.design?.formPlans,identity:sp.design?.identity,recentIdentities:existing.slice(-8).map(p=>({forms:p.forms,description:p.description}))});
 const response=await jsonRequest(OLLAMA+'/api/generate',{model,images:sprites.map(s=>s.replace(/^data:image\/png;base64,/,'')),stream:false,format:'json',keep_alive:0,options:{temperature:0,num_predict:1000},prompt},300000);
 return assertLineageReview(JSON.parse(response.response));
}

export function proceduralLineage(species,reason='Offline generator'){
 const sp=migrateSpecies(structuredClone(species));const checked=validateLineageImages([0,1,2].map(n=>renderCreaturePixels(sp,n)),{plannedChanges:sp.generationRevision===2});
 certifyRenderedAnatomy(sp);return {...sp,sprites:checked.images.map(img=>'data:image/png;base64,'+encodePNG(img).toString('base64')),visualValidation:{...checked.report,status:'procedural-verified',semanticSource:'renderer-geometry',reason}};
}
export async function generateLineage({species,model,visionModel,existing=[],imageSettings={},repair=false}){
 if(!species||!TYPES.includes(species.base)||!TYPES.includes(species.alter)||species.base===species.alter)throw Error('Invalid ordered types.');
 if(typeof model!=='string'||!model||model.length>160)throw Error('Select an installed text model.');
 const prepared=structuredClone(species);
 prepared.design??={reference:{id:prepared.id,name:prepared.body||prepared.description,type:prepared.base},modifier:{type:prepared.alter,description:prepared.alter+' spiritual transformation',traits:[]},anatomy:prepared.anatomy};
 completeGenerationDesign(prepared);
 const schema={type:'object',properties:{forms:{type:'array',items:{type:'string'},minItems:3,maxItems:3},description:{type:'string'},visualPrompts:{type:'array',items:{type:'string'},minItems:3,maxItems:3},formPlans:{type:'array',items:{type:'object'},minItems:3,maxItems:3},moveNames:{type:'array',items:{type:'string'},minItems:4,maxItems:4},moves:{type:'array',items:{type:'object'},minItems:4,maxItems:4}},required:['forms','description','visualPrompts','moveNames'],additionalProperties:false};
 const generated=await jsonRequest(OLLAMA+'/api/generate',{model,prompt:generationPrompt(prepared,existing),format:schema,stream:false,keep_alive:0,options:{temperature:.65,num_predict:4800,num_ctx:14000}},600000);
 const raw=JSON.parse(generated.response);if(repair){raw.forms=[...species.forms];raw.description=species.description;}
 const validated=validateSpecies(raw,prepared);if(!repair)assertNovelGeneration(validated,existing);
 if(!Array.isArray(raw.visualPrompts)||raw.visualPrompts.length!==3||raw.visualPrompts.some(p=>typeof p!=='string'||!p.trim()))throw Error('The model did not produce three visual briefs.');
 if(!visionModel)return {...proceduralLineage(validated,'No vision model: design data only; finished image artwork remains unavailable'),moveValidation:validated.moveValidation};
 const sprites=[],observations=[],repairs=[];let lastError;
 async function renderForm(form,correction=''){
  for(let attempt=0;attempt<2;attempt++)try{
   const reference=form?sprites[form-1]:sprites[form];
   const payload={...imageGenerationParameters(imageSettings),prompt:imageFormPrompt(validated,form,correction),negative_prompt:'text, watermark, grid, cropped tips, multiple creatures, blurry, human face, accidental fused joints, incoherent materials, excessive unrelated ornament, scenery',seed:hash(species.id,form,attempt,correction),batch_size:1,n_iter:1,...(reference?{init_images:[reference.split(',')[1]],denoising_strength:form?.58:.38}:{})};
   const img=await jsonRequest(IMAGE+'/sdapi/v1/'+(reference?'img2img':'txt2img'),payload,600000),b64=img.images?.[0]?.replace(/^data:image\/png;base64,/,'');if(typeof b64!=='string'||b64.length>20000000)throw Error('Image model did not return a bounded PNG.');
   const checked=validateCreatureImage(decodePNG(b64)),sprite='data:image/png;base64,'+encodePNG(checked.image).toString('base64'),observation=await observeCreatureImage(sprite,validated,visionModel,form);
   sprites[form]=sprite;observations[form]=observation;return;
  }catch(error){lastError=error;correction=error.message;repairs.push({form,attempt,reason:error.message});}
  throw lastError;
 }
 try{
  for(let form=0;form<3;form++)await renderForm(form);
  let lineageReview;
  for(let pass=0;pass<2;pass++)try{
   validateLineageImages(sprites.map(decodePNG),{existing,plannedChanges:true});
   lineageReview=await reviewGeneratedLineage(sprites,validated,visionModel,existing);break;
  }catch(error){if(pass)throw error;lastError=error;const forms=error.repairForms?.length?error.repairForms:[1,2];for(const form of new Set(forms))await renderForm(form,error.message);}
  const checked=validateLineageImages(sprites.map(decodePNG),{existing,plannedChanges:true});applyLineageObservations(validated,observations);
  return {...validated,formPlans:validated.design.formPlans,sprites,visualValidation:{...checked.report,status:'vision-verified',policyRevision:2,semanticSource:'local-vision-model',model:visionModel,observations,lineageReview,repairs}};
 }catch(error){return {...proceduralLineage(validated,'Image validation fallback: '+error.message),moveValidation:validated.moveValidation,artworkRepairs:repairs};}
}

export function createServer({openai=createOpenAIProvider(),openaiFactory=createOpenAIProvider,publicUrl=process.env.SPIRIMON_PUBLIC_URL||'',token=process.env.SPIRIMON_TOKEN||''}={}){
 const publicOrigin=publicUrl?new URL(publicUrl):null;
 if(publicOrigin&&(publicOrigin.protocol!=='https:'||publicOrigin.username||publicOrigin.password||publicOrigin.pathname!=='/'||publicOrigin.search||publicOrigin.hash||token.length<24))throw Error('Remote access requires an HTTPS origin and SPIRIMON_TOKEN of at least 24 characters.');
 let generating=false;
 const jobs=createCompanionJobs({busy:()=>generating,setBusy:value=>generating=value});
 const server=http.createServer(async(req,res)=>{const origin=req.headers.origin,host=req.headers.host;
 const localHosts=['127.0.0.1:'+req.socket.localPort,'localhost:'+req.socket.localPort,'[::1]:'+req.socket.localPort];
 if(!localHosts.includes(host)&&host!==publicOrigin?.host)return respond(res,403,{error:'Unexpected host.'});
 const nativeOrigin=token.length>=24&&['null','https://localhost','http://localhost','capacitor://localhost'].includes(origin);
 if(origin&&!nativeOrigin&&!ALLOWED.has(origin)&&origin!==publicOrigin?.origin)return respond(res,403,{error:'This origin is not paired with Spirimon.'});
 if(origin){res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');res.setHeader('Access-Control-Allow-Private-Network','true');}
if(req.method==='OPTIONS'){res.writeHead(204);res.end();return;}
const url=new URL(req.url,'http://127.0.0.1:'+PORT);
 if(url.pathname.startsWith('/api/')&&token){const supplied=Buffer.from(req.headers.authorization||''),expected=Buffer.from('Bearer '+token);if(supplied.length!==expected.length||!timingSafeEqual(supplied,expected))return respond(res,401,{error:'Enter the companion pairing token for this session.'});}
 let sameOriginBrowser=false;
 if(!origin&&req.headers['sec-fetch-site']==='same-origin'&&req.headers.referer)try{const referring=new URL(req.headers.referer).origin;sameOriginBrowser=referring===publicOrigin?.origin||localHosts.includes(host)&&referring==='http://'+host;}catch{}
 const controller=new AbortController();res.on('close',()=>{if(!res.writableEnded)controller.abort();});
 try{
 if(url.pathname==='/api/health'&&req.method==='GET')return respond(res,200,{name:'Spirimon home companion',version:'0.3.0',supportsJobs:true,instanceId:jobs.instanceId,remoteEnabled:!!publicOrigin,openaiConfigured:!!openai.configured,generationBusy:generating});
 if(url.pathname==='/api/jobs' || /^\/api\/jobs\/[a-zA-Z0-9_-]{16,80}$/.test(url.pathname)){
  if(!origin&&!sameOriginBrowser)return respond(res,403,{error:'A paired browser origin is required.'});
  if(url.pathname==='/api/jobs'&&req.method==='POST'){
   const data=await readJSON(req);if(!['openai/generate','openai/analyze'].includes(data.operation))return respond(res,400,{error:'Unsupported generation operation.'});
   return respond(res,202,jobs.start(data.id,signal=>openai[data.operation.endsWith('/generate')?'generate':'analyze']({...data.body,signal})));
  }
  const id=url.pathname.split('/').at(-1),result=req.method==='GET'?jobs.get(id):req.method==='DELETE'?jobs.cancel(id):null;
  return respond(res,result?200:404,result||{error:'This job is no longer on the server. It may have restarted. Check before retrying; an accepted API request may still be billed.',code:'job_missing',retryable:false});
 }
 if(url.pathname.startsWith('/api/openai/')){
  if(!origin&&!sameOriginBrowser)return respond(res,403,{error:'A paired browser origin is required.'});
  if(url.pathname==='/api/openai/connect'&&req.method==='POST'){
   if(token.length<24)return respond(res,403,{error:'Set a companion pairing token of at least 24 characters before entering an API key from the game.',retryable:false});
   if(generating)return respond(res,409,{error:'Wait for the current generation to finish before changing the API key.'});
   const data=await readJSON(req);if(typeof data.apiKey!=='string'||data.apiKey.length<16||data.apiKey.length>512||/\s/.test(data.apiKey))return respond(res,400,{error:'Enter a valid OpenAI API key.',retryable:false});
   const candidate=openaiFactory({apiKey:data.apiKey}),status=await candidate.status({signal:controller.signal});openai=candidate;return respond(res,200,{...status,message:status.message+' Key connected for this companion process; never saved to disk.'});
  }
  if(url.pathname==='/api/openai/status'&&req.method==='GET')return respond(res,200,{...await openai.status({signal:controller.signal}),supportsJobs:true});
  if(['/api/openai/generate','/api/openai/analyze'].includes(url.pathname)&&req.method==='POST'){
   if(generating)return respond(res,409,{error:'A lineage is already being generated. Please wait.'});
   generating=true;
   try{const data=await readJSON(req);return respond(res,200,await openai[url.pathname.endsWith('/generate')?'generate':'analyze']({...data,signal:controller.signal}));}finally{generating=false;}
  }
  return respond(res,404,{error:'Unknown OpenAI operation.'});
 }

if(url.pathname==='/api/status'&&req.method==='GET'){const [text,image]=await Promise.allSettled([jsonRequest(OLLAMA+'/api/tags'),jsonRequest(IMAGE+'/sdapi/v1/sd-models')]);const models=text.status==='fulfilled'?(text.value.models||[]).map(m=>m.name):[];respond(res,200,{name:'Spirimon local companion',version:'0.2.0',models,visionModels:await visionModels(models),imageReady:image.status==='fulfilled',generationBusy:generating});return;}
if(url.pathname==='/api/analyze'&&req.method==='POST'){if(!origin&&!sameOriginBrowser)return respond(res,403,{error:'A paired browser origin is required.'});const data=await readJSON(req);if(!Array.isArray(data.sprites)||data.sprites.length!==3)return respond(res,400,{error:'Three PNG images required.'});const sp=migrateSpecies(data.species),checked=validateLineageImages(data.sprites.map(decodePNG),{allowExactFamily:true}),observations=await observeCreatureImages(data.sprites,sp,data.visionModel);applyLineageObservations(sp,observations);respond(res,200,{anatomy:sp.anatomy,formAnatomy:sp.formAnatomy,capabilities:sp.capabilities,visualValidation:{...checked.report,status:'vision-verified',semanticSource:'local-vision-model',observations}});return;}
if(url.pathname==='/api/generate'&&req.method==='POST'){if(!origin&&!sameOriginBrowser)return respond(res,403,{error:'A paired browser origin is required.'});if(generating)return respond(res,409,{error:'A lineage is already being generated. Please wait.'});generating=true;try{const data=await readJSON(req);respond(res,200,await generateLineage(data));}finally{generating=false;}return;}
if(req.method!=='GET')return respond(res,405,{error:'Method not allowed.'});const asset=/^\/assets\/(?:shrine-atlas|cave-entrance-atlas)\.png$/.test(url.pathname)?url.pathname.slice(1):/^\/assets\/interiors\/[a-z-]+\.svg$/.test(url.pathname)?url.pathname.slice(1):url.pathname==='/assets/spirimon-pixel.ttf'?'assets/spirimon-pixel.ttf':/^\/assets\/(?:(?:roster|placeholder|companions|battle-back|generation-review)\/)?[a-z0-9-]+\.webp$/.test(url.pathname)?url.pathname.slice(1):null;const generated=/^\/(?:game-[a-f0-9]{12}\.js|style-[a-f0-9]{12}\.css|Spirimon\.html)$/.test(url.pathname)?url.pathname.slice(1):null;const file=FILES[url.pathname]||asset||generated;if(!file)return respond(res,404,{error:'Not found.'});const body=await readFile(path.join(ROOT,file));const type=file.endsWith('.png')?'image/png':file.endsWith('.svg')?'image/svg+xml':file.endsWith('.ttf')?'font/ttf':file.endsWith('.webp')?'image/webp':file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.css')?'text/css; charset=utf-8':'text/javascript; charset=utf-8';res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin'});res.end(body);
}catch(e){if(!res.destroyed)respond(res,e.status||500,{error:e.message,code:e.code,retryable:e.retryable});}});server.on('close',()=>jobs.close());return server;}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){const server=createServer();server.requestTimeout=0;const bind=process.env.SPIRIMON_BIND||'127.0.0.1';if(bind!=='127.0.0.1'&&!process.env.SPIRIMON_PUBLIC_URL)throw Error('Set SPIRIMON_PUBLIC_URL and SPIRIMON_TOKEN before enabling remote access.');server.listen(PORT,bind,()=>console.log('Spirimon is ready: http://127.0.0.1:'+PORT+'\nKeep this window open while playing. Press Ctrl+C to stop.\nLocal AI remains optional. OpenAI is opt-in and uses paid API requests when selected.'));server.on('error',e=>{console.error(e.code==='EADDRINUSE'?'Spirimon is already running, or port '+PORT+' is in use.':e);process.exitCode=1;});}

