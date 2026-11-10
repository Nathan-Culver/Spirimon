import {randomUUID} from 'node:crypto';
// Bounded, process-local results keep each tunnel request short. Never retry an
// accepted generation automatically: polling and submission IDs are idempotent.
export function createCompanionJobs({busy=()=>false,setBusy=()=>{},limit=8,ttlMs=1200000,timeoutMs=900000}={}){
 const jobs=new Map();
 const view=job=>({id:job.id,status:job.status,...(job.status==='completed'?{result:job.result}:{}),...(job.error?{error:job.error}:{}),startedAt:job.startedAt});
 const clean=()=>{for(const [id,j]of jobs)if(j.status!=='running'&&Date.now()-j.finishedAt>ttlMs)jobs.delete(id);};
 return {
  start(id,run){
   if(typeof id!=='string'||!/^[a-zA-Z0-9_-]{16,80}$/.test(id))throw Object.assign(Error('Invalid generation request ID.'),{status:400});
   clean();if(jobs.has(id))return view(jobs.get(id));
   if(busy())throw Object.assign(Error('A lineage is already being generated. Please wait.'),{status:409});
   while(jobs.size>=limit){const oldest=[...jobs].find(([,j])=>j.status!=='running');if(!oldest)throw Object.assign(Error('Generation results are full. Please wait.'),{status:409});jobs.delete(oldest[0]);}
   const controller=new AbortController(),job={id,status:'running',startedAt:Date.now(),controller};jobs.set(id,job);setBusy(true);
   const timer=setTimeout(()=>controller.abort(),timeoutMs);timer.unref?.();
   const abort=new Promise((_,reject)=>controller.signal.addEventListener('abort',()=>reject(Object.assign(Error('Generation cancelled. An accepted API request may still be billed.'),{code:'cancelled',retryable:false})),{once:true}));
   Promise.race([Promise.resolve().then(()=>run(controller.signal)),abort]).then(result=>{job.result=result;job.status='completed';},error=>{job.status=controller.signal.aborted?'cancelled':'failed';job.error={message:error.message||'Generation failed.',status:error.status||502,code:error.code||'generation_failed',retryable:error.retryable===true};}).finally(()=>{clearTimeout(timer);job.finishedAt=Date.now();setBusy(false);});
   return view(job);
  },
  get(id){clean();const job=jobs.get(id);return job?view(job):null;},
  cancel(id){const job=jobs.get(id);if(!job)return null;if(job.status==='running')job.controller.abort();return {id,status:job.status==='running'?'cancelling':job.status};},
  close(){for(const j of jobs.values())if(j.status==='running')j.controller.abort();},
  instanceId:randomUUID()
 };
}
