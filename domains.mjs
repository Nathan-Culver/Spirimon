export const BASE_DOMAINS=['Air','Earth','Fire','Water','Light','Dark','Sun','Moon','Lightning','Ice','Metal','Chaos','Law','Good','Evil','Creation','Destruction','War','Peace','Fear','Wrath','Love','Hope','Despair','Sorrow','Fate','Dreams','Nightmares','Life','Death','Spirit','Psionic','Nature','Void','Storm','Magic'];
export const DOMAINS=[...BASE_DOMAINS];
export const DOMAIN_ALIASES=Object.freeze({Time:'Fate',Space:'Void',Mind:'Psionic',Plant:'Nature'});
export const DOMAIN_DEFINITIONS=new Map(BASE_DOMAINS.map(name=>[name,{name,custom:false,affinity:name}]));
const NAMES=new Map(DOMAINS.map(name=>[name.toLowerCase(),name])),ALIASES=new Map(Object.entries(DOMAIN_ALIASES).map(([key,value])=>[key.toLowerCase(),value]));
const valid=value=>typeof value==='string'&&/^[A-Za-z][A-Za-z '-]{1,39}$/.test(value)&&!['constructor','prototype','__proto__','Beast','Fey','Plant','Undead','Construct','Elemental','Celestial','Fiend','Giant','Aberration','Monstrosity','Ooze'].includes(value);
export function canonicalDomain(value){if(typeof value!=='string')return value;const clean=value.trim().replace(/\s+/g,' ');return ALIASES.get(clean.toLowerCase())||NAMES.get(clean.toLowerCase())||clean;}
export function registerDomain(value,definition={}){const name=canonicalDomain(value);if(!valid(name))return null;if(DOMAIN_DEFINITIONS.get(name)?.custom&&BASE_DOMAINS.includes(definition.affinity))Object.assign(DOMAIN_DEFINITIONS.get(name),{affinity:definition.affinity});if(!DOMAIN_DEFINITIONS.has(name)){DOMAINS.push(name);NAMES.set(name.toLowerCase(),name);DOMAIN_DEFINITIONS.set(name,{name,custom:true,affinity:BASE_DOMAINS.includes(definition.affinity)?definition.affinity:'Magic',description:String(definition.description||'A newly documented spiritual resonance.').replace(/[<>]/g,'').slice(0,240)});}return name;}
export function canonicalDomains(values){return [...new Set((Array.isArray(values)?values:[]).map(v=>registerDomain(v)).filter(Boolean))];}
export function restoreDomainRegistry(save){for(const d of save.customDomains||[])if(d&&typeof d==='object')registerDomain(d.name,d);for(const sp of Object.values(save.species||{})){for(const d of sp.customDomains||[])registerDomain(d.name,d);canonicalDomains([...(sp.domains||[]),...(sp.domainThemes||[])]);}return save;}
const DISCOVERIES=[['Echo','Spirit'],['Glass','Magic'],['Memory','Psionic'],['Hunger','Death'],['Silence','Void'],['Mirrors','Light'],['Mist','Water'],['Gravity','Void'],['Embers','Fire'],['Thorns','Nature'],['Tides','Water'],['Rust','Metal'],['Reverie','Dreams'],['Oaths','Law'],['Dusk','Moon'],['Bloom','Life']];
export function discoverCustomDomain(save,sp,random=Math.random){if(sp.domainDiscoveryChecked)return null;sp.domainDiscoveryChecked=true;if(random()>=.02)return null;const candidates=DISCOVERIES.filter(([name])=>!DOMAINS.includes(name));const [root,affinity]=(candidates.length?candidates:DISCOVERIES)[Math.min((candidates.length||DISCOVERIES.length)-1,Math.floor(random()*(candidates.length||DISCOVERIES.length)))];let name=root;if(!candidates.length){const suffixes=['Weaving','Resonance','Vigil','Bloom','Hunger','Reverie','Current','Accord','Veil','Song'],available=DISCOVERIES.flatMap(([word])=>suffixes.map(suffix=>word+' '+suffix)).filter(v=>!DOMAINS.includes(v));if(!available.length)return null;name=available[Math.min(available.length-1,Math.floor(random()*available.length))];}const definition={name,affinity,description:'A '+root.toLowerCase()+' resonance first documented in '+(sp.forms?.[0]||'a newly encountered Spirimon')+'.'};registerDomain(name,definition);save.customDomains??=[];save.customDomains.push(definition);sp.customDomains??=[];sp.customDomains.push(definition);sp.domains=canonicalDomains([...(sp.domains||[]),name]);return definition;}
const ELEMENTS=new Set(['air','earth','fire','water','ice','metal','lightning','light','dark','sun','moon']);
export function elementOf(move={}){const v=String(move.element||move.domainTheme||move.domain||'').toLowerCase();return ELEMENTS.has(v)?v:null;}
export function normalizeMoveDomains(move){
 if(!move||typeof move!=='object')return move;
 if(move.domainTheme&&BASE_DOMAINS.includes(move.domainTheme))move.domain=move.domainTheme;
 if(move.domain){const old=move.domain,next=canonicalDomain(old);if(next!==old){move.domainTheme??=old;move.element??=elementOf({domain:old})||undefined;}if(DOMAINS.includes(next))move.domain=next;else delete move.domain;}
 if(move.domains)move.domains=canonicalDomains(move.domains);
 if(move.requires?.domain)move.requires.domain=canonicalDomain(move.requires.domain);
 if(move.requires?.domains)move.requires.domains=canonicalDomains(move.requires.domains);
 return move;
}
export function normalizeSpeciesDomains(sp){
 for(const d of sp.customDomains||[])if(d&&typeof d==='object')registerDomain(d.name,d);
 const oldMerged={Air:'Storm',Earth:'Nature',Fire:'Nature',Water:'Nature',Ice:'Nature',Metal:'Nature',Lightning:'Storm',Light:'Spirit',Dark:'Void',Sun:'Spirit',Moon:'Spirit',Chaos:'Fate',Law:'Fate',Good:'Spirit',Evil:'Spirit',Creation:'Life',Destruction:'Void',War:'Magic',Peace:'Spirit',Fear:'Psionic',Wrath:'Psionic',Love:'Psionic',Hope:'Psionic',Despair:'Psionic',Sorrow:'Psionic',Dreams:'Psionic',Nightmares:'Psionic'},derived=new Set((sp.domainThemes||[]).map(d=>oldMerged[d]).filter(Boolean));
 const old=[...(sp.domains||[]).filter(d=>sp.domainRevision!==2||!derived.has(d)),...(sp.domainThemes||[])],themes=old.filter(d=>canonicalDomain(d)!==d);
 if(themes.length)sp.domainThemes=[...new Set([...(sp.domainThemes||[]),...themes])];
 sp.elementalAffinities=[...new Set([...(sp.elementalAffinities||[]),...old.map(d=>elementOf({domain:d})).filter(Boolean)])];
 sp.domains=canonicalDomains(old);
 for(const key of ['suppressedDomains','temporaryDomains'])if(Array.isArray(sp[key]))sp[key]=sp[key].map(v=>typeof v==='string'?canonicalDomain(v):{...v,domain:canonicalDomain(v.domain),domainTheme:v.domainTheme||v.domain});
 for(const move of [...(sp.moves||[]),...(sp.learnset||[])])normalizeMoveDomains(move);
 sp.domainRevision=3;return sp;
}
export function fieldAffinities(sp={},ind=null){
 const blocked=new Set([...(sp.suppressedDomains||[]),...(ind?.suppressedDomains||[])].map(canonicalDomain));
 const out=[...(sp.elementalAffinities||[]),...(sp.domains||[]).map(d=>elementOf({domain:d})).filter(Boolean)];
 const moves=Array.isArray(ind?.moveIds)?ind.moveIds.map(id=>sp.learnset?.find(m=>m.id===id)||sp.moves?.find(m=>m.id===id)).filter(Boolean):sp.moves||[];
 for(const m of moves)if(!blocked.has(canonicalDomain(m.domain)))out.push(elementOf(m));
 for(const v of [...(sp.temporaryDomains||[]),...(ind?.temporaryDomains||[])])if(typeof v==='string'||v&&(!Number.isFinite(v.until)||v.until>(ind?.realtimeNow||0)))out.push(elementOf({domain:typeof v==='string'?v:v.domainTheme||v.domain}));
 return [...new Set(out.filter(e=>e&&!blocked.has(e[0].toUpperCase()+e.slice(1))))];
}
