// The nine agreed classifications. Elemental/astral motifs are not extra Domains.
export const DOMAINS=Object.freeze(['Life','Death','Fate','Void','Spirit','Psionic','Nature','Storm','Magic']);
export const DOMAIN_ALIASES=Object.freeze({
 Time:'Fate',Space:'Void',Mind:'Psionic',Plant:'Nature',
 Air:'Storm',Earth:'Nature',Fire:'Nature',Water:'Nature',Ice:'Nature',Metal:'Nature',Lightning:'Storm',
 Light:'Spirit',Dark:'Void',Sun:'Spirit',Moon:'Spirit',Chaos:'Fate',Law:'Fate',Good:'Spirit',Evil:'Spirit',
 Creation:'Life',Destruction:'Void',War:'Magic',Peace:'Spirit',Fear:'Psionic',Wrath:'Psionic',Love:'Psionic',Hope:'Psionic',Despair:'Psionic',Sorrow:'Psionic',Dreams:'Psionic',Nightmares:'Psionic'
});
export const canonicalDomain=value=>DOMAIN_ALIASES[value]||value;
export const canonicalDomains=values=>[...new Set((values||[]).map(canonicalDomain).filter(d=>DOMAINS.includes(d)))];
const ELEMENTS=new Set(['air','earth','fire','water','ice','metal','lightning','light','dark','sun','moon']);
export function elementOf(move={}){const v=String(move.element||move.domainTheme||move.domain||'').toLowerCase();return ELEMENTS.has(v)?v:null;}
export function normalizeMoveDomains(move){
 if(!move||typeof move!=='object')return move;
 if(move.domain){const old=move.domain,next=canonicalDomain(old);if(next!==old){move.domainTheme??=old;move.element??=elementOf({domain:old})||undefined;}if(DOMAINS.includes(next))move.domain=next;else delete move.domain;}
 if(move.domains)move.domains=canonicalDomains(move.domains);
 if(move.requires?.domain)move.requires.domain=canonicalDomain(move.requires.domain);
 if(move.requires?.domains)move.requires.domains=canonicalDomains(move.requires.domains);
 return move;
}
export function normalizeSpeciesDomains(sp){
 const old=sp.domains||[],themes=old.filter(d=>canonicalDomain(d)!==d);
 if(themes.length)sp.domainThemes=[...new Set([...(sp.domainThemes||[]),...themes])];
 sp.elementalAffinities=[...new Set([...(sp.elementalAffinities||[]),...old.map(d=>elementOf({domain:d})).filter(Boolean)])];
 sp.domains=canonicalDomains(old);
 for(const key of ['suppressedDomains','temporaryDomains'])if(Array.isArray(sp[key]))sp[key]=sp[key].map(v=>typeof v==='string'?canonicalDomain(v):{...v,domain:canonicalDomain(v.domain),domainTheme:v.domainTheme||v.domain});
 for(const move of [...(sp.moves||[]),...(sp.learnset||[])])normalizeMoveDomains(move);
 sp.domainRevision=2;return sp;
}
export function fieldAffinities(sp={},ind=null){
 const blocked=new Set([...(sp.suppressedDomains||[]),...(ind?.suppressedDomains||[])].map(canonicalDomain));
 const out=[...(sp.elementalAffinities||[]),...(sp.domains||[]).map(d=>elementOf({domain:d})).filter(Boolean)];
 const moves=Array.isArray(ind?.moveIds)?ind.moveIds.map(id=>sp.learnset?.find(m=>m.id===id)||sp.moves?.find(m=>m.id===id)).filter(Boolean):sp.moves||[];
 for(const m of moves)if(!blocked.has(canonicalDomain(m.domain)))out.push(elementOf(m));
 for(const v of [...(sp.temporaryDomains||[]),...(ind?.temporaryDomains||[])])if(typeof v==='string'||v&&(!Number.isFinite(v.until)||v.until>(ind?.realtimeNow||0)))out.push(elementOf({domain:typeof v==='string'?v:v.domainTheme||v.domain}));
 return [...new Set(out.filter(e=>e&&!blocked.has(['air','lightning'].includes(e)?'Storm':['light','sun','moon'].includes(e)?'Spirit':e==='dark'?'Void':'Nature')))];
}
