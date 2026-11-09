import {imageFormPrompt,assertNovelGeneration,assertLineageReview} from './generation-policy.mjs';
// Server-only adapter. Never import this module into the browser bundle.
import {TYPES,validateSpecies} from './engine.mjs';
import {lineageDesign,observationPrompt,lineageReviewPrompt,prepareLineageDesign} from './generation-prompts.mjs';
import {applyVisualObservation,applyLineageObservations,migrateSpecies} from './anatomy.mjs';
import {decodePNG,encodePNG} from './creature-png.mjs';
import {validateLineageImages} from './creature-visuals.mjs';

export const OPENAI_DEFAULTS={textModel:'gpt-4.1-mini',visionModel:'gpt-4.1-mini',imageModel:'gpt-image-1.5'};
const object=properties=>({type:'object',properties,required:Object.keys(properties),additionalProperties:false});
const string={type:'string'},integer={type:'integer',minimum:0,maximum:24};
const moveSchema=object({name:string,power:{type:'integer',minimum:0,maximum:100},accuracy:{type:'number',minimum:.65,maximum:1},kind:{enum:['physical','spiritual','status'],type:'string'},effect:{type:['string','null']},target:{type:'string',enum:['opponent','self','ally','allOpponents']}});
const observationSchema=object({base:{type:'string',enum:TYPES},alter:{type:'string',enum:TYPES},bodyPlan:{type:'string',enum:['biped','quadruped','winged','aquatic','serpentine','tentacled','radial','rooted','amorphous','many-legged']},traits:{type:'array',items:string},limbs:object({legs:integer,arms:integer,wings:integer,tentacles:integer}),manipulators:{type:'integer',minimum:0,maximum:16},nonhuman:{type:'boolean'},confidence:{type:'number',minimum:0,maximum:1},referenceConfidence:{type:'number',minimum:0,maximum:1},personhoodVisible:{type:'boolean'},anatomySound:{type:'boolean'},plannedSurrealism:{type:'boolean'},typeIntegration:{type:'boolean'},domainIntegration:{type:'boolean'},quality:object({style:{type:'number',minimum:0,maximum:1},readability:{type:'number',minimum:0,maximum:1},materialClarity:{type:'number',minimum:0,maximum:1}})});

const reviewSchema=object({confidence:{type:'number',minimum:0,maximum:1},familyContinuity:{type:'boolean'},structuralProgression:{type:'boolean'},originalIdentity:{type:'boolean'},repairForms:{type:'array',items:{type:'integer',minimum:0,maximum:2}},issues:{type:'array',items:string}});
const planSchema=object({bodyPlan:string,personhood:string,structure:string,proportions:string,posture:string,manifestation:string,description:string,intentionalSurrealism:{type:'array',items:string}});

export class OpenAIError extends Error{
 constructor(message,{status=502,code='openai_error',retryable=false}={}){super(message);this.status=status;this.code=code;this.retryable=retryable;}
}
function outputJSON(response){
 if(response.status!=='completed')throw new OpenAIError('OpenAI did not finish the response. Try again with a sufficient output limit.');
 const content=(response.output||[]).flatMap(item=>item.content||[]);
 if(content.some(item=>item.type==='refusal'))throw new OpenAIError('OpenAI declined this creature design. Queue a different design.');
 const text=content.filter(item=>item.type==='output_text').map(item=>item.text).join('');
 try{return JSON.parse(text);}catch{throw new OpenAIError('OpenAI returned an incomplete creature record.');}
}
function boundedSprites(sprites){
 if(!Array.isArray(sprites)||sprites.length!==3||sprites.some(s=>typeof s!=='string'||!s.startsWith('data:image/png;base64,')||s.length>20e6))throw new OpenAIError('Three bounded PNG images are required.',{status:400});
 return sprites.map(decodePNG);
}
function spritePNG(encoded){
 if(typeof encoded!=='string'||encoded.length>20e6)throw new OpenAIError('OpenAI did not return a bounded PNG image.');
 const image=decodePNG(encoded),size=256;
 // Keep phone saves small, retaining the full creature and transparent margins.
 if(image.width<=size&&image.height<=size)return 'data:image/png;base64,'+encodePNG(image).toString('base64');
 const scale=Math.min(size/image.width,size/image.height),width=Math.max(16,Math.round(image.width*scale)),height=Math.max(16,Math.round(image.height*scale)),data=new Uint8ClampedArray(width*height*4);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){const p=(Math.min(image.height-1,Math.floor((y+.5)/scale))*image.width+Math.min(image.width-1,Math.floor((x+.5)/scale)))*4;data.set(image.data.subarray(p,p+4),(y*width+x)*4);}
 return 'data:image/png;base64,'+encodePNG({width,height,data}).toString('base64');
}

export function createOpenAIProvider({apiKey=process.env.OPENAI_API_KEY||process.env.SPIRIMON_OPENAI_KEY||'',textModel=process.env.SPIRIMON_OPENAI_TEXT_MODEL||OPENAI_DEFAULTS.textModel,visionModel=process.env.SPIRIMON_OPENAI_VISION_MODEL||OPENAI_DEFAULTS.visionModel,imageModel=process.env.SPIRIMON_OPENAI_IMAGE_MODEL||OPENAI_DEFAULTS.imageModel,fetchImpl=fetch}={}){
 const configured=!!apiKey;
 async function request(endpoint,body,{signal,timeout=180000}={}){
  if(!configured)throw new OpenAIError('Set OPENAI_API_KEY on the companion service, then restart it.',{status:503,code:'openai_not_configured'});
  const headers={Authorization:'Bearer '+apiKey};let payload=body;
  if(body&&!(body instanceof FormData)){headers['Content-Type']='application/json';payload=JSON.stringify(body);}
  let response;
  try{response=await fetchImpl('https://api.openai.com/v1/'+endpoint,{method:body?'POST':'GET',headers,body:payload,signal:signal?AbortSignal.any([signal,AbortSignal.timeout(timeout)]):AbortSignal.timeout(timeout)});}catch(error){if(signal?.aborted)throw error;throw new OpenAIError('OpenAI connection failed or timed out. Check the service connection before retrying.');}
  let result;try{result=await response.json();}catch{throw new OpenAIError('OpenAI returned an unreadable response.');}
  if(!response.ok){
   const code=result.error?.code||'openai_http_'+response.status;
   const message=response.status===401?'OpenAI rejected the API key. Update the key on the companion service.':code==='insufficient_quota'?'OpenAI API credits or quota are exhausted. Check API billing.':response.status===429?'OpenAI rate limit reached. Wait before resuming generation.':response.status===403?'OpenAI model access was denied. Check model permissions and organization verification.':response.status===404?'The configured OpenAI model is unavailable. Update the service model settings.':'OpenAI generation failed (HTTP '+response.status+'). Check the service configuration before retrying.';
   throw new OpenAIError(message,{status:response.status,code});
  }
  return result;
 }
 async function structured(model,prompt,schema,images=[],signal){
  return outputJSON(await request('responses',{model,store:false,input:[{role:'user',content:[{type:'input_text',text:prompt},...images.map(image_url=>({type:'input_image',image_url,detail:'high'}))]}],text:{format:{type:'json_schema',name:'spirimon_record',strict:true,schema}},max_output_tokens:4000},{signal}));
 }
 async function status({signal}={}){
  const result=await request('models',undefined,{signal,timeout:15000}),available=new Set((result.data||[]).map(m=>m.id));
  const missing=[...new Set([textModel,visionModel,imageModel])].filter(model=>!available.has(model));
  if(missing.length)throw new OpenAIError('Configured OpenAI models are not available to this key: '+missing.join(', '),{status:400,code:'openai_model_unavailable'});
  return {models:[textModel],visionModels:[visionModel],imageModel,imageReady:true,message:'OpenAI connected. Model access found; image generation uses paid API requests. A successful generation verifies image access.'};
 }
 async function inspectForm(sp,sprite,form,signal){
  const observation=await structured(visionModel,observationPrompt(sp,form),observationSchema,[sprite],signal);applyVisualObservation({...sp},observation,form);return observation;
 }
 async function inspectFamily(sp,sprites,existing,signal){return assertLineageReview(await structured(visionModel,lineageReviewPrompt(sp,existing),reviewSchema,sprites,signal));}
 async function analyze({species,sprites,signal}={}){
  const sp=migrateSpecies(structuredClone(species)),checked=validateLineageImages(boundedSprites(sprites),{allowExactFamily:true,plannedChanges:sp.generationRevision===2}),cleaned=checked.images.map(image=>'data:image/png;base64,'+encodePNG(image).toString('base64')),observations=[];
  for(let form=0;form<3;form++)observations.push(await inspectForm(sp,cleaned[form],form,signal));
  const lineageReview=sp.generationRevision===2?await inspectFamily(sp,cleaned,[],signal):null;applyLineageObservations(sp,observations);
  return {anatomy:sp.anatomy,formAnatomy:sp.formAnatomy,capabilities:sp.capabilities,visualValidation:{...checked.report,status:'vision-verified',...(lineageReview?{policyRevision:2,lineageReview}:{}),semanticSource:'openai-vision-model',model:visionModel,observations}};
 }
 async function generate({species,existing=[],repair=false,signal}={}){
  if(!species||!TYPES.includes(species.base)||!TYPES.includes(species.alter)||species.base===species.alter)throw new OpenAIError('Invalid ordered creature types.',{status:400});
  const prepared=prepareLineageDesign(species),{schema,prompt}=lineageDesign(prepared,existing);
  schema.properties.moves={anyOf:[{type:'null'},{type:'array',items:moveSchema,minItems:4,maxItems:4}]};
  schema.properties.formPlans={anyOf:[{type:'null'},{type:'array',items:planSchema,minItems:3,maxItems:3}]};schema.required=Object.keys(schema.properties);
  const raw=await structured(textModel,prompt+(repair?' Repair only the artwork. Preserve these exact existing form names and description: '+JSON.stringify({forms:species.forms,description:species.description}):'')+' Include moves and formPlans, or null to retain the supplied code-authored values.',schema,[],signal);
  if(raw.formPlans===null)delete raw.formPlans;if(repair){raw.forms=[...species.forms];raw.description=species.description;}
  const validated=validateSpecies(raw,prepared);if(!repair)assertNovelGeneration(validated,existing);
  if(!Array.isArray(raw.visualPrompts)||raw.visualPrompts.length!==3)throw new OpenAIError('OpenAI did not return three visual briefs.');
  const sprites=[],observations=[],repairs=[];let imageRequests=0;
  async function renderForm(form,correction=''){
   if(imageRequests>=6)throw new OpenAIError('The six-image request limit was reached. Generation is paused; review the reported issue before retrying.',{code:'openai_artwork_invalid'});
   imageRequests++;const reference=form?sprites[form-1]:sprites[0];
   const fields={model:imageModel,prompt:imageFormPrompt(validated,form,correction)+(reference?' Use the attached preceding accepted Form as the lineage reference.':''),n:1,size:'1024x1024',quality:'medium',background:'transparent',output_format:'png'};
   let body=fields;if(reference){body=new FormData();for(const [key,value]of Object.entries(fields))body.set(key,String(value));body.set('image',new Blob([Buffer.from(reference.split(',')[1],'base64')],{type:'image/png'}),'lineage-reference.png');}
   const image=await request(reference?'images/edits':'images/generations',body,{signal,timeout:600000});sprites[form]=spritePNG(image.data?.[0]?.b64_json);
  }
  try{
   for(let form=0;form<3;form++)await renderForm(form);
   // Reject duplicate/cropped images before spending on semantic inspection.
   validateLineageImages(sprites.map(decodePNG),{existing,plannedChanges:true});
   for(let form=0;form<3;form++){
    try{observations[form]=await inspectForm(validated,sprites[form],form,signal);}catch(error){if(error instanceof OpenAIError||signal?.aborted)throw error;repairs.push({form,reason:error.message});await renderForm(form,error.message);validateLineageImages(sprites.map(decodePNG),{existing,plannedChanges:true});observations[form]=await inspectForm(validated,sprites[form],form,signal);}
   }
   let lineageReview;
   try{lineageReview=await inspectFamily(validated,sprites,existing,signal);}catch(error){
    if(error instanceof OpenAIError||signal?.aborted)throw error;
    const forms=error.repairForms?.length?error.repairForms:[1,2];
    for(const form of new Set(forms)){repairs.push({form,reason:error.message});await renderForm(form,error.message);observations[form]=await inspectForm(validated,sprites[form],form,signal);}
    lineageReview=await inspectFamily(validated,sprites,existing,signal);
   }
   const checked=validateLineageImages(sprites.map(decodePNG),{existing,plannedChanges:true});applyLineageObservations(validated,observations);
   return {...validated,formPlans:validated.design.formPlans,sprites,visualValidation:{...checked.report,status:'vision-verified',policyRevision:2,semanticSource:'openai-vision-model',model:visionModel,observations,lineageReview,repairs,imageRequests}};
  }catch(error){if(error instanceof OpenAIError||signal?.aborted)throw error;throw new OpenAIError('Artwork validation failed after bounded repairs: '+error.message+'. Generation is paused; retry when ready.',{code:'openai_artwork_invalid'});}
 }

 return {configured,status,generate,analyze};
}
