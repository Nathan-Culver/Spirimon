// AI provider discovery and connection checks. Keys are session-only and never stored in game saves.
const timeout=(ms=6500)=>AbortSignal.timeout(ms);
const json=async(url,options={})=>{const r=await fetch(url,{...options,signal:options.signal||timeout()});if(!r.ok)throw Error('HTTP '+r.status);return r.json();};
export const PROVIDERS=['companion','ollama','device','gemini','procedural'];
export const LABELS={companion:'Spirimon companion (text + images)',ollama:'Windows Ollama (text)',device:'Android browser AI (WebGPU)',gemini:'Gemini cloud (text)',procedural:'Procedural (offline)'};
let browserEngine=null,browserModel='';
export async function probe(type,settings={},secret=''){
 if(type==='procedural')return{models:['built-in'],message:'Ready offline'};
 if(type==='companion'){const r=await json('http://127.0.0.1:4317/api/status');return{models:r.models||[],imageReady:!!r.imageReady,message:r.imageReady?'Text and image companion available':'Companion found; image service unavailable'};}
 if(type==='ollama'){const base=(settings.ollamaUrl||'http://localhost:11434').replace(/\/$/,'');if(location.protocol==='https:'&&base.startsWith('http:')&&!['localhost','127.0.0.1'].includes(new URL(base).hostname))throw Error('HTTPS game cannot access insecure remote HTTP. Configure a private HTTPS relay.');const r=await json(base+'/api/tags');return{models:(r.models||[]).map(m=>m.name),message:'Ollama responding; text generation available'};}
 if(type==='device'){if(!navigator.gpu)throw Error('WebGPU unavailable in this browser');return{models:['SmolLM2-135M-Instruct-q0f16-MLC','Qwen2.5-0.5B-Instruct-q4f16_1-MLC'],message:'WebGPU available. First model load downloads model files.'};}
 if(type==='gemini'){if(!secret)throw Error('Enter a Gemini API key for this session');const r=await json('https://generativelanguage.googleapis.com/v1beta/models?key='+encodeURIComponent(secret));return{models:(r.models||[]).filter(m=>m.supportedGenerationMethods?.includes('generateContent')).map(m=>m.name.replace('models/','')),message:'Cloud API connected'};}
 throw Error('Unknown provider');
}
export async function choose(settings={},secret=''){
 const order=settings.aiProvider==='auto'?(settings.aiOrder||['companion','ollama','device','gemini','procedural']):[settings.aiProvider||'companion',settings.aiFallback||'procedural'];
 const errors=[];for(const type of [...new Set(order)]){try{const status=await probe(type,settings,secret);if(type!=='procedural'&&!status.models.length)throw Error('No models available');return{type,status,errors};}catch(e){errors.push(type+': '+e.message);}}return{type:'procedural',status:{models:['built-in'],message:'Ready offline'},errors};
}
export async function text(type,settings,prompt,secret=''){
 const model=settings.aiModels?.[type]||settings.model;
 if(type==='ollama'){const base=(settings.ollamaUrl||'http://localhost:11434').replace(/\/$/,'');const r=await json(base+'/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model,prompt,stream:false,format:'json'}),signal:timeout(180000)});return r.response;}
 if(type==='gemini'){if(!secret)throw Error('Cloud key required');const r=await json('https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(model||'gemini-2.5-flash')+':generateContent?key='+encodeURIComponent(secret),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{responseMimeType:'application/json'}}),signal:timeout(120000)});return r.candidates?.[0]?.content?.parts?.map(p=>p.text||'').join('')||'';}
 if(type==='device'){if(!navigator.gpu)throw Error('WebGPU unavailable');if(!browserEngine||browserModel!==model){const webllm=await import('https://esm.run/@mlc-ai/web-llm');browserEngine=await webllm.CreateMLCEngine(model||'SmolLM2-135M-Instruct-q0f16-MLC');browserModel=model;}const r=await browserEngine.chat.completions.create({messages:[{role:'user',content:prompt}],temperature:.6,max_tokens:900,response_format:{type:'json_object'}});return r.choices?.[0]?.message?.content||'';}
 throw Error('Provider does not support text generation');
}
