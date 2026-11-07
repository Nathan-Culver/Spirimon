import {CREATURE_TYPES,CREATURE_DOMAINS} from './creature-catalog.mjs';

import {DOMAIN_ALIASES,canonicalDomain} from './domains.mjs';
export {DOMAIN_ALIASES,canonicalDomain};
const unique=values=>[...new Set(values)];
export function innateClassifications(sp={}){return unique([sp.base,sp.alter,...(sp.domains||[]).map(canonicalDomain)].filter(v=>CREATURE_TYPES.includes(v)||CREATURE_DOMAINS.includes(v)));}
export function activeTypes(sp={},ind={}){
 const blocked=new Set([...(sp.suppressedTypes||[]),...(ind?.suppressedTypes||[])]);
 return unique([sp.base,sp.alter].filter(t=>CREATURE_TYPES.includes(t)&&!blocked.has(t)));
}
export function domainSources(sp={},ind=null,now=ind?.realtimeNow??0){
 const blocked=new Set([...(sp.suppressedDomains||[]),...(ind?.suppressedDomains||[])].map(canonicalDomain));
 const clean=values=>unique(values.map(canonicalDomain).filter(d=>CREATURE_DOMAINS.includes(d)&&!blocked.has(d)));
 const innate=clean(sp.domains||[]);
 const moves=Array.isArray(ind?.moveIds)?ind.moveIds.map(id=>sp.learnset?.find(m=>m.id===id)||sp.moves?.find(m=>m.id===id)).filter(Boolean):sp.moves||[];
 const equipped=clean(moves.flatMap(m=>[m.domain,...(m.domains||[])].filter(Boolean)));
 const temporary=clean([...(sp.temporaryDomains||[]),...(ind?.temporaryDomains||[])].filter(v=>typeof v==='string'||v&&(!Number.isFinite(v.until)||v.until>now)).map(v=>typeof v==='string'?v:v.domain));
 return {innate,equipped,temporary,all:clean([...innate,...equipped,...temporary])};
}
