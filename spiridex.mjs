// Journey-owned field records. Preloaded species and nearby unseen roamers are
// deliberately excluded: having artwork available is not a discovery.
const forms=values=>[...new Set((Array.isArray(values)?values:[]).filter(n=>Number.isInteger(n)&&n>=0&&n<3))].sort();
const formNumber=value=>Number.isInteger(value)&&value>=0&&value<3?value:0;
function archive(state){
 if(!state.spiridex||typeof state.spiridex!=='object'||Array.isArray(state.spiridex))state.spiridex={version:1,entries:{}};
 const dex=state.spiridex;dex.version=1;
 if(!dex.entries||typeof dex.entries!=='object'||Array.isArray(dex.entries))dex.entries={};
 return dex.entries;
}
function record(entries,id){
 if(!Object.hasOwn(entries,id)||!entries[id]||typeof entries[id]!=='object'||Array.isArray(entries[id]))Object.defineProperty(entries,id,{value:{seenForms:[],sealedForms:[],places:[]},enumerable:true,writable:true,configurable:true});
 const value=entries[id];value.seenForms=forms(value.seenForms);value.sealedForms=forms(value.sealedForms);
 value.places=[...new Set((Array.isArray(value.places)?value.places:[]).filter(x=>typeof x==='string'&&x.trim()).map(x=>x.slice(0,120)))].slice(0,8);
 return value;
}
export function recordSpiridexEncounter(state,species,form=0,place=''){
 const id=species?.id;if(typeof id!=='string'||!id)return false;
 const row=record(archive(state),id),n=formNumber(form);let changed=false;
 if(!row.seenForms.includes(n)){row.seenForms.push(n);row.seenForms.sort();changed=true;}
 if(typeof place==='string'&&place.trim()&&!row.places.includes(place.slice(0,120))&&row.places.length<8){row.places.push(place.slice(0,120));changed=true;}
 if(!Array.isArray(state.seen))state.seen=[];
 if(!state.seen.includes(id)){state.seen.push(id);changed=true;}
 return changed;
}
export function hasSpiridexForm(state,id,form=0){
 const entries=state.spiridex?.entries,row=entries&&Object.hasOwn(entries,id)?entries[id]:null;
 return !!row?.seenForms?.includes(formNumber(form));
}
export function syncSpiridex(state){
 const entries=archive(state);
 // Old saves retain species discoveries, but did not record encounter forms.
 for(const id of state.seen||[])if(typeof id==='string'&&id&&!Object.hasOwn(entries,id))record(entries,id).seenForms=[0];
 for(const individual of state.spirits||[]){
  const id=individual.species;if(typeof id!=='string'||!id)continue;
  const row=record(entries,id),unlocked=Math.max(formNumber(individual.form),formNumber(individual.appearance));
  for(let n=0;n<=unlocked;n++){if(!row.seenForms.includes(n))row.seenForms.push(n);if(!row.sealedForms.includes(n))row.sealedForms.push(n);}
  row.seenForms.sort();row.sealedForms.sort();
 }
 return state.spiridex;
}
export function spiridexEntries(state,roster){
 syncSpiridex(state);const records=state.spiridex.entries,seen=new Set(state.seen||[]),owned=state.spirits||[],ids=new Set();
 function entry(species,number,aliases){
  const rows=aliases.filter(id=>Object.hasOwn(records,id)).map(id=>record(records,id));
  const sealedForms=forms(rows.flatMap(r=>r.sealedForms)),seenForms=forms([...rows.flatMap(r=>r.seenForms),...sealedForms]);
  return {id:species.id,number,species,seen:seenForms.length>0||aliases.some(id=>seen.has(id)),sealed:sealedForms.length>0,seenForms,sealedForms,owned:owned.filter(u=>aliases.includes(u.species)).length,places:[...new Set(rows.flatMap(r=>r.places))]};
 }
 const result=roster.map((row,index)=>{
  const id='roster-'+row.id;ids.add(id);ids.add(row.id);
  return entry({...row,...(state.species?.[id]||state.species?.[row.id]||{}),id},index+1,[id,row.id]);
 });
 const extraIds=new Set([...(state.seen||[]),...Object.keys(records),...owned.map(u=>u.species)]);
 for(const id of extraIds){if(ids.has(id)||!state.species?.[id])continue;const value=entry(state.species[id],null,[id]);if(value.seen||value.sealed)result.push(value);}
 return result;
}
export function spiridexSummary(entries){
 const roster=entries.filter(e=>e.number!==null);
 return {total:roster.length,seen:roster.filter(e=>e.seen).length,sealed:roster.filter(e=>e.sealed).length,forms:roster.reduce((n,e)=>n+e.seenForms.length,0),totalForms:roster.length*3,additional:entries.length-roster.length};
}
export function filterSpiridex(entries,{search='',status='all',type='all'}={}){
 const query=String(search).trim().toLowerCase().replace(/^#\s*/,'');
 return entries.filter(e=>{
  if(status==='seen'&&!e.seen||status==='sealed'&&!e.sealed||status==='unseen'&&e.seen)return false;
  if(type!=='all'&&(!e.seen||e.species.base!==type&&e.species.alter!==type))return false;
  const number=e.number===null?'':String(e.number).padStart(3,'0');
  // Do not expose undiscovered names or forms through search or Type filters.
  const names=e.seenForms.map(n=>e.species.forms?.[n]||'');
  const text=[number,...(e.seen?[...names,e.species.base,e.species.alter,...(e.species.domains||[])]:[])].join(' ').toLowerCase();
  return !query||text.includes(query);
 });
}
