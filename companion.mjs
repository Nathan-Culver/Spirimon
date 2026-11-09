import {createOpenAIProvider} from './openai-generation.mjs';
import {timingSafeEqual} from 'node:crypto';
import {lineageDesign,observationPrompt} from './generation-prompts.mjs';
import {decodePNG,encodePNG} from './creature-png.mjs';
import {renderCreaturePixels,validateLineageImages,certifyRenderedAnatomy} from './creature-visuals.mjs';
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
async function readJSON(req){let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>24000000)throw Error('Request is too large.');}return JSON.parse(raw);}
async function visionModels(models){const checks=await Promise.allSettled(models.slice(0,30).map(async model=>{const info=await jsonRequest(OLLAMA+'/api/show',{model},2000);return info.capabilities?.includes('vision')?model:null;}));return checks.filter(r=>r.status==='fulfilled'&&r.value).map(r=>r.value);}
export async function observeCreatureImages(sprites,sp,model){
 if(typeof model!=='string'||!model||model.length>160)throw Error('A local vision model is required to inspect external artwork.');
 const observations=[];
 for(const sprite of sprites){const response=await jsonRequest(OLLAMA+'/api/generate',{model,images:[sprite.replace(/^data:image\/png;base64,/, '')],stream:false,format:'json',keep_alive:0,options:{temperature:0,num_predict:650},prompt:observationPrompt(sp)},300000);const observation=JSON.parse(response.response);applyVisualObservation({...sp},observation);observations.push(observation);}
 if(observations.some(o=>o.bodyPlan!==observations[0].bodyPlan))throw Error('The three images have inconsistent body plans.');
 return observations;
}
export function proceduralLineage(species,reason='Offline generator'){
 const sp=migrateSpecies(structuredClone(species));const checked=validateLineageImages([0,1,2].map(n=>renderCreaturePixels(sp,n)));
 certifyRenderedAnatomy(sp);return {...sp,sprites:checked.images.map(img=>'data:image/png;base64,'+encodePNG(img).toString('base64')),visualValidation:{...checked.report,status:'procedural-verified',semanticSource:'renderer-geometry',reason}};
}
export async function generateLineage({species,model,visionModel,existing=[]}){
 if(!species||!TYPES.includes(species.base)||!TYPES.includes(species.alter)||species.base===species.alter)throw Error('Invalid ordered types.');
 if(typeof model!=='string'||!model||model.length>160)throw Error('Select an installed text model.');
 const {schema,prompt}=lineageDesign(species,existing);
 const generated=await jsonRequest(OLLAMA+'/api/generate',{model,prompt,format:schema,stream:false,keep_alive:0,options:{temperature:.8,num_predict:2200,num_ctx:6000}},600000);
 const raw=JSON.parse(generated.response),validated=validateSpecies(raw,species);
 if(!Array.isArray(raw.visualPrompts)||raw.visualPrompts.length!==3)throw Error('The model did not produce three visual briefs.');
 if(!visionModel)return {...proceduralLineage(validated,'No vision model: generated geometry used instead of unverified image-model art'),moveValidation:validated.moveValidation};
 let lastError;
 for(let attempt=0;attempt<2;attempt++)try{
  const sprites=[];
  for(let n=0;n<3;n++){
   const payload={prompt:'Detailed pixel art fantasy creature, full body, one creature only, facing left, centered with generous transparent or white margins, crisp clustered shading, no text. '+raw.visualPrompts[n]+'. Exact anatomical reference: '+JSON.stringify(species.design||species.anatomy)+(n?' Evolved form of: '+raw.visualPrompts[0]:'')+(lastError?' Correct previous validation issue: '+lastError.message:''),negative_prompt:'text, watermark, grid, cropped, multiple creatures, blurry, human, scenery',width:512,height:512,steps:20,cfg_scale:7,sampler_name:'Euler a',seed:hash(species.id,n,attempt),batch_size:1,n_iter:1,...(n?{init_images:[sprites[0].split(',')[1]],denoising_strength:.45}:{})};
   const img=await jsonRequest(IMAGE+'/sdapi/v1/'+(n?'img2img':'txt2img'),payload,600000),b64=img.images?.[0]?.replace(/^data:image\/png;base64,/,'');if(typeof b64!=='string'||b64.length>20000000)throw Error('Image model did not return a bounded PNG.');decodePNG(b64);sprites.push('data:image/png;base64,'+b64);
  }
  const checked=validateLineageImages(sprites.map(decodePNG),{existing});const cleaned=checked.images.map(img=>'data:image/png;base64,'+encodePNG(img).toString('base64'));
  const observations=await observeCreatureImages(cleaned,species,visionModel);applyLineageObservations(validated,observations);
  return {...raw,anatomy:validated.anatomy,formAnatomy:validated.formAnatomy,capabilities:validated.capabilities,sprites:cleaned,visualValidation:{...checked.report,status:'vision-verified',semanticSource:'local-vision-model',model:visionModel,observations}};
 }catch(error){lastError=error;}
 return {...proceduralLineage(validated,'Image validation fallback: '+lastError.message),moveValidation:validated.moveValidation};
}
export function createServer({openai=createOpenAIProvider(),openaiFactory=createOpenAIProvider,publicUrl=process.env.SPIRIMON_PUBLIC_URL||'',token=process.env.SPIRIMON_TOKEN||''}={}){
 const publicOrigin=publicUrl?new URL(publicUrl):null;
 if(publicOrigin&&(publicOrigin.protocol!=='https:'||publicOrigin.username||publicOrigin.password||publicOrigin.pathname!=='/'||publicOrigin.search||publicOrigin.hash||token.length<24))throw Error('Remote access requires an HTTPS origin and SPIRIMON_TOKEN of at least 24 characters.');
 let generating=false;
 return http.createServer(async(req,res)=>{const origin=req.headers.origin,host=req.headers.host;
 const localHosts=['127.0.0.1:'+req.socket.localPort,'localhost:'+req.socket.localPort];
 if(!localHosts.includes(host)&&host!==publicOrigin?.host)return respond(res,403,{error:'Unexpected host.'});
 if(origin&&!ALLOWED.has(origin)&&origin!==publicOrigin?.origin)return respond(res,403,{error:'This origin is not paired with Spirimon.'});
 if(origin){res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');res.setHeader('Access-Control-Allow-Private-Network','true');}
if(req.method==='OPTIONS'){res.writeHead(204);res.end();return;}
const url=new URL(req.url,'http://127.0.0.1:'+PORT);
 if(url.pathname.startsWith('/api/')&&token){const supplied=Buffer.from(req.headers.authorization||''),expected=Buffer.from('Bearer '+token);if(supplied.length!==expected.length||!timingSafeEqual(supplied,expected))return respond(res,401,{error:'Enter the companion pairing token for this session.'});}
 const controller=new AbortController();res.on('close',()=>{if(!res.writableEnded)controller.abort();});
 try{
 if(url.pathname.startsWith('/api/openai/')){
  if(!origin)return respond(res,403,{error:'A paired browser origin is required.'});
  if(url.pathname==='/api/openai/connect'&&req.method==='POST'){
   if(token.length<24)return respond(res,403,{error:'Set a companion pairing token of at least 24 characters before entering an API key from the game.',retryable:false});
   if(generating)return respond(res,409,{error:'Wait for the current generation to finish before changing the API key.'});
   const data=await readJSON(req);if(typeof data.apiKey!=='string'||data.apiKey.length<16||data.apiKey.length>512||/\s/.test(data.apiKey))return respond(res,400,{error:'Enter a valid OpenAI API key.',retryable:false});
   const candidate=openaiFactory({apiKey:data.apiKey}),status=await candidate.status({signal:controller.signal});openai=candidate;return respond(res,200,{...status,message:status.message+' Key connected for this companion process; never saved to disk.'});
  }
  if(url.pathname==='/api/openai/status'&&req.method==='GET')return respond(res,200,await openai.status({signal:controller.signal}));
  if(['/api/openai/generate','/api/openai/analyze'].includes(url.pathname)&&req.method==='POST'){
   if(generating)return respond(res,409,{error:'A lineage is already being generated. Please wait.'});
   generating=true;
   try{const data=await readJSON(req);return respond(res,200,await openai[url.pathname.endsWith('/generate')?'generate':'analyze']({...data,signal:controller.signal}));}finally{generating=false;}
  }
  return respond(res,404,{error:'Unknown OpenAI operation.'});
 }

if(url.pathname==='/api/status'&&req.method==='GET'){const [text,image]=await Promise.allSettled([jsonRequest(OLLAMA+'/api/tags'),jsonRequest(IMAGE+'/sdapi/v1/sd-models')]);const models=text.status==='fulfilled'?(text.value.models||[]).map(m=>m.name):[];respond(res,200,{name:'Spirimon local companion',version:'0.2.0',models,visionModels:await visionModels(models),imageReady:image.status==='fulfilled',generationBusy:generating});return;}
if(url.pathname==='/api/analyze'&&req.method==='POST'){if(!origin)return respond(res,403,{error:'A paired browser origin is required.'});const data=await readJSON(req);if(!Array.isArray(data.sprites)||data.sprites.length!==3)return respond(res,400,{error:'Three PNG images required.'});const sp=migrateSpecies(data.species),checked=validateLineageImages(data.sprites.map(decodePNG),{allowExactFamily:true}),observations=await observeCreatureImages(data.sprites,sp,data.visionModel);applyLineageObservations(sp,observations);respond(res,200,{anatomy:sp.anatomy,formAnatomy:sp.formAnatomy,capabilities:sp.capabilities,visualValidation:{...checked.report,status:'vision-verified',semanticSource:'local-vision-model',observations}});return;}
if(url.pathname==='/api/generate'&&req.method==='POST'){if(!origin)return respond(res,403,{error:'A paired browser origin is required.'});if(generating)return respond(res,409,{error:'A lineage is already being generated. Please wait.'});generating=true;try{const data=await readJSON(req);respond(res,200,await generateLineage(data));}finally{generating=false;}return;}
if(req.method!=='GET')return respond(res,405,{error:'Method not allowed.'});const asset=/^\/assets\/(?:shrine-atlas|cave-entrance-atlas)\.png$/.test(url.pathname)?url.pathname.slice(1):/^\/assets\/interiors\/[a-z-]+\.svg$/.test(url.pathname)?url.pathname.slice(1):url.pathname==='/assets/spirimon-pixel.ttf'?'assets/spirimon-pixel.ttf':/^\/assets\/(?:(?:roster|placeholder|companions|battle-back)\/)?[a-z0-9-]+\.webp$/.test(url.pathname)?url.pathname.slice(1):null;const generated=/^\/(?:game-[a-f0-9]{12}\.js|style-[a-f0-9]{12}\.css|Spirimon\.html)$/.test(url.pathname)?url.pathname.slice(1):null;const file=FILES[url.pathname]||asset||generated;if(!file)return respond(res,404,{error:'Not found.'});const body=await readFile(path.join(ROOT,file));const type=file.endsWith('.png')?'image/png':file.endsWith('.svg')?'image/svg+xml':file.endsWith('.ttf')?'font/ttf':file.endsWith('.webp')?'image/webp':file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.css')?'text/css; charset=utf-8':'text/javascript; charset=utf-8';res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin'});res.end(body);
}catch(e){if(!res.destroyed)respond(res,e.status||500,{error:e.message,code:e.code,retryable:e.retryable});}});}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){const server=createServer();server.requestTimeout=0;const bind=process.env.SPIRIMON_BIND||'127.0.0.1';if(bind!=='127.0.0.1'&&!process.env.SPIRIMON_PUBLIC_URL)throw Error('Set SPIRIMON_PUBLIC_URL and SPIRIMON_TOKEN before enabling remote access.');server.listen(PORT,bind,()=>console.log('Spirimon is ready: http://127.0.0.1:'+PORT+'\nKeep this window open while playing. Press Ctrl+C to stop.\nLocal AI remains optional. OpenAI is opt-in and uses paid API requests when selected.'));server.on('error',e=>{console.error(e.code==='EADDRINUSE'?'Spirimon is already running, or port '+PORT+' is in use.':e);process.exitCode=1;});}

