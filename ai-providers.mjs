// AI provider discovery and connection checks. Keys are session-only and never stored in game saves.
const timeout=(ms=6500)=>AbortSignal.timeout(ms);
const json=async(url,options={})=>{const r=await fetch(url,{...options,signal:options.signal||timeout()});const data=await r.json();if(!r.ok){const error=Error(data.error||'HTTP '+r.status);error.code=data.code;error.retryable=data.retryable;error.status=r.status;throw error;}return data;};
export const PROVIDERS=['companion','openai','ollama','device','gemini','procedural'];
export const LABELS={companion:'Spirimon companion (text + images)',openai:'OpenAI (design + images + inspection)',ollama:'Windows Ollama (text)',device:'Android browser AI (WebGPU)',gemini:'Gemini cloud (text)',procedural:'Procedural (offline)'};
export function companionURL(settings={}){
 const value=(settings.companionUrl||'http://127.0.0.1:4317').trim(),url=new URL(value);
 if(url.username||url.password||url.search||url.hash||url.pathname!=='/'||!['https:','http:'].includes(url.protocol))throw Error('Use a companion HTTPS origin without a path or credentials.');
 if(url.protocol!=='https:'&&!['localhost','127.0.0.1','[::1]'].includes(url.hostname))throw Error('A remote companion must use HTTPS.');
 return url.origin;
}
export function companionHeaders(secret='') {return {'Content-Type':'application/json',...(secret?{Authorization:'Bearer '+secret}:{})};}
const jobServers=new Set();
const waitForPoll=(ms,signal)=>new Promise((resolve,reject)=>{
 if(signal.aborted)return reject(signal.reason);const done=()=>{clearTimeout(timer);signal.removeEventListener('abort',cancel);resolve();},cancel=()=>{clearTimeout(timer);signal.removeEventListener('abort',cancel);reject(signal.reason);};const timer=setTimeout(done,ms);signal.addEventListener('abort',cancel,{once:true});
});
export async function companionJob(settings,path,{token='',body,signal,timeoutMs=900000,pollMs=1500}={}){
 const base=companionURL(settings),headers=companionHeaders(token),operation=path.slice(5),id=crypto.randomUUID(),deadline=AbortSignal.timeout(timeoutMs),combined=signal?AbortSignal.any([signal,deadline]):deadline;
 const cancel=()=>{void fetch(base+'/api/jobs/'+id,{method:'DELETE',headers,signal:timeout(5000)}).catch(()=>{});};combined.addEventListener('abort',cancel,{once:true});
 try{
  if(combined.aborted)throw combined.reason;
  const payload=JSON.stringify({id,operation,body});let state;
  // Same ID on a lost submission response cannot create a second paid job.
  for(let attempt=0;attempt<2;attempt++)try{state=await json(base+'/api/jobs',{method:'POST',headers,body:payload,signal:AbortSignal.any([combined,timeout(15000)])});break;}catch(error){if(attempt||combined.aborted||error.code||!['TypeError','TimeoutError'].includes(error.name))throw error;}
  let failures=0;
  while(state?.status==='running'){
   await waitForPoll(pollMs,combined);
   try{state=await json(base+'/api/jobs/'+id,{headers,signal:AbortSignal.any([combined,timeout(15000)])});failures=0;}
   catch(error){if(combined.aborted||error.code||++failures>=3)throw error;}
  }
  if(state?.status==='completed')return state.result;
  const detail=state?.error||{};throw Object.assign(Error(detail.message||'Generation did not finish. Check the server before retrying.'),{code:detail.code||'generation_failed',retryable:false,status:detail.status});
 }catch(error){cancel();throw error;}finally{combined.removeEventListener('abort',cancel);}
}
export async function companionRequest(settings,path,{token='',body,signal,timeoutMs=900000}={}){
 if(!/^\/api\/(?:health|status|generate|analyze|openai\/(?:status|generate|analyze|connect))$/.test(path))throw Error('Unknown companion operation.');
 const base=companionURL(settings);
 if(body&&/^\/api\/openai\/(generate|analyze)$/.test(path)&&jobServers.has(base))return companionJob(settings,path,{token,body,signal,timeoutMs});
 const result=await json(base+path,{method:body?'POST':'GET',headers:companionHeaders(token),...(body?{body:JSON.stringify(body)}:{}),signal:signal?AbortSignal.any([signal,timeout(timeoutMs)]):timeout(timeoutMs)});
 if(result.supportsJobs)jobServers.add(base);return result;
}
let browserEngine=null,browserModel='';
export async function probe(type,settings={},secret=''){
 if(type==='procedural')return{models:['built-in'],message:'Ready offline'};
 if(type==='companion'){const r=await companionRequest(settings,'/api/status',{token:typeof secret==='object'?secret.companionToken:'',timeoutMs:15000});return{models:r.models||[],imageReady:!!r.imageReady,visionModels:r.visionModels||[],message:r.imageReady?'Text and image companion available':'Companion found; image service unavailable'};}
 if(type==='openai')return companionRequest(settings,'/api/openai/status',{token:typeof secret==='object'?secret.companionToken:'',timeoutMs:20000});
 if(type==='ollama'){const base=(settings.ollamaUrl||'http://localhost:11434').replace(/\/$/,'');if(location.protocol==='https:'&&base.startsWith('http:')&&!['localhost','127.0.0.1'].includes(new URL(base).hostname))throw Error('HTTPS game cannot access insecure remote HTTP. Configure a private HTTPS relay.');const r=await json(base+'/api/tags');return{models:(r.models||[]).map(m=>m.name),message:'Ollama responding; text generation available'};}
 if(type==='device'){if(!navigator.gpu)throw Error('WebGPU unavailable in this browser');return{models:['SmolLM2-135M-Instruct-q0f16-MLC','Qwen2.5-0.5B-Instruct-q4f16_1-MLC'],message:'WebGPU available. First model load downloads model files.'};}
 if(type==='gemini'){const key=typeof secret==='object'?secret.gemini:secret;if(!key)throw Error('Enter a Gemini API key for this session');const r=await json('https://generativelanguage.googleapis.com/v1beta/models?key='+encodeURIComponent(key));return{models:(r.models||[]).filter(m=>m.supportedGenerationMethods?.includes('generateContent')).map(m=>m.name.replace('models/','')),message:'Cloud API connected'};}
 throw Error('Unknown provider');
}
export async function choose(settings={},secret=''){
 const order=settings.aiProvider==='auto'?(settings.aiOrder||['companion','ollama','device','gemini','procedural']):[settings.aiProvider||'companion',settings.aiFallback||'procedural'];
 const errors=[];for(const type of [...new Set(order)]){try{const status=await probe(type,settings,secret);if(type!=='procedural'&&!status.models.length)throw Error('No models available');return{type,status,errors};}catch(e){errors.push(type+': '+e.message);}}return{type:'procedural',status:{models:['built-in'],message:'Ready offline'},errors};
}
export async function text(type,settings,prompt,secret=''){
 const model=settings.aiModels?.[type]||settings.model;
 if(type==='ollama'){const base=(settings.ollamaUrl||'http://localhost:11434').replace(/\/$/,'');const r=await json(base+'/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model,prompt,stream:false,format:'json',options:{temperature:.65,num_predict:4800,num_ctx:14000}}),signal:timeout(180000)});return r.response;}
 if(type==='gemini'){if(!secret)throw Error('Cloud key required');const r=await json('https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(model||'gemini-2.5-flash')+':generateContent?key='+encodeURIComponent(secret),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{responseMimeType:'application/json'}}),signal:timeout(120000)});return r.candidates?.[0]?.content?.parts?.map(p=>p.text||'').join('')||'';}
 if(type==='device'){if(!navigator.gpu)throw Error('WebGPU unavailable');if(!browserEngine||browserModel!==model){const webllm=await import('https://esm.run/@mlc-ai/web-llm');browserEngine=await webllm.CreateMLCEngine(model||'SmolLM2-135M-Instruct-q0f16-MLC');browserModel=model;}const r=await browserEngine.chat.completions.create({messages:[{role:'user',content:prompt}],temperature:.6,max_tokens:1600,response_format:{type:'json_object'}});return r.choices?.[0]?.message?.content||'';}
 throw Error('Provider does not support text generation');
}
