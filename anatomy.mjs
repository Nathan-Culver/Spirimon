import {ANATOMY_CATALOG,MODIFIER_CATALOG,NAME_FRAGMENTS,CREATURE_TYPES,CREATURE_DOMAINS} from './creature-catalog.mjs';
import {ensurePassives} from './classification-passives.mjs';
export function designHash(...parts){let h=2166136261;for(const c of parts.join('|')){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
const choose=(xs,seed)=>xs[designHash(seed)%xs.length];
const cleanTypes=(base,alter)=>CREATURE_TYPES.includes(base)&&CREATURE_TYPES.includes(alter)&&base!==alter;
export function buildDesign(seed,base,alter){
 if(!cleanTypes(base,alter))throw Error('Two distinct supported creature types are required.');
 const reference=choose(ANATOMY_CATALOG[base],seed+'|body'),modifier=choose(MODIFIER_CATALOG[alter],seed+'|modifier');
 const traits=[...new Set([...reference.traits,...modifier[1].split(' ')])];
 const stem=choose(NAME_FRAGMENTS[base],seed+'|name-a')+choose(NAME_FRAGMENTS[alter],seed+'|name-b').toLowerCase();
 const suffix=choose(['veil','scale','crest','stride','whorl','bloom','gaze','song','mantle','clasp'],reference.id+'|'+seed);
 const name=stem+suffix;
 const anatomy=anatomyRecord(reference.plan,traits,{source:'design',reference:reference.id,morphology:referenceMorphology(reference)});
 return {reference:{...reference},modifier:{type:alter,description:modifier[0],traits:modifier[1].split(' ')},anatomy,name,forms:[stem+choose(['kit','bud','mote','ling','wisp'],base+'|'+seed),name,name+' '+choose(['Regent','Sovereign','Ascendant','Elder','Warden'],seed+'|final')],description:'A '+reference.name+' transformed by '+modifier[0]+'. Its '+choose(['crest','markings','mantle','voice','footprints'],seed+'|motif')+' carries a distinctive '+choose(['spiral','lattice','crescent','branching','rippled'],seed+'|pattern')+' motif shared by all three forms.'};
}
export function referenceMorphology(reference){
 const text=(reference.family||reference.name||'').toLowerCase(),name=(reference.name||'').toLowerCase();
 const m={snout:4,ears:0,neck:0,tail:0,bulk:1,legLength:18};
 if(/fox|wolf|lion|otter|bear|capybara|koala/.test(text)){m.ears=/fox|wolf/.test(text)?9:4;m.snout=/fox|wolf|bear/.test(text)?9:4;m.tail=/fox|wolf|otter/.test(text)?18:8;m.bulk=/bear/.test(text)?1.15:1;}
 if(/bison|deer|horse|hippopotamus|rhinoceros|elephant/.test(text)){m.snout=9;m.ears=5;m.tail=10;m.bulk=/hippo|rhino|elephant|bison/.test(text)?1.15:.85;m.legLength=/deer|horse/.test(text)?24:17;}
 if(/giraffe|sauropod|brachio|diplo|apato|argentino|amara/.test(name))m.neck=15;
 if(/elephant|mammoth|mastodon|gomphothere|deinotherium/.test(name))m.trunk=true;
 if(/pangolin|anteater|aardvark|echidna|armadillo/.test(text)){m.snout=12;m.tail=20;m.bulk=.9;}
 if(/crocodile|chameleon|salamander/.test(text)){m.snout=/crocodile/.test(text)?14:6;m.tail=23;m.bulk=.8;m.legLength=10;}
 if(/tortoise/.test(text)){m.shell=true;m.snout=5;m.bulk=1.1;m.legLength=10;}
 if(/kangaroo/.test(text))m.tail=25;
 if(/tyranno/.test(text)){m.tail=23;m.snout=13;}
 if(/triceratops/.test(text)){m.tail=20;m.bulk=1.15;}
 if(reference.plan==='aquatic'){m.tail=20;m.snout=7;m.bulk=.9;}
 if(reference.plan==='serpentine'){m.tail=30;m.bulk=.6;}
 return m;
}
export function anatomyRecord(plan,traits,extra={}){
 const t=[...new Set(traits)],has=x=>t.includes(x),legs={quadruped:4,biped:2,winged:2,'many-legged':6,rooted:0}[plan]||0;
 const limbs={legs,arms:plan==='biped'?2:0,wings:has('wings')?2:0,tentacles:has('tentacles')?6:0};
 return {version:1,bodyPlan:plan,traits:t,limbs,manipulators:has('hands')?2:has('tentacles')?6:has('grasp')?2:0,strength:has('large')?3:has('strong')?2:1,scale:has('large')?'colossal':'ordinary',...extra};
}
const DOMAIN_CUES={Air:['air','wind','wing','gale','vortex'],Earth:['earth','stone','basalt','granite','sand','dig'],Fire:['fire','flame','ember','cinder','lava','furnace'],Water:['water','river','aquatic','swim','sea','ocean','fins'],Light:['light','luminous','radiant','halo'],Dark:['dark','shadow','ink','tar'],Sun:['solar','sun','dawn'],Moon:['moon','lunar'],Lightning:['lightning','volt','magnetic','electric'],Ice:['ice','frost','glacier','snow'],Metal:['metal','bronze','brass','iron','copper','armor'],Chaos:['recursive','fractal','asymmetric','paradox'],Law:['guardian','sentinel','keeper'],Creation:['woven','porcelain','origami'],Fear:['fangs','many-mouthed','horrific'],Dreams:['glamour','faerie','silk'],Life:['nectar','flower','regeneration'],Death:['bone','grave','mummy','revenant'],Spirit:['spectral','ancestral','ghost'],Psionic:['psionic','neural','nerve'],Nature:['roots','vines','fur','plant','feathers'],Void:['aperture','non-euclidean','tesseract'],Storm:['storm','thunder'],Magic:['prismatic','rune','crystal']};
const BASE_DOMAIN={Aberration:'Psionic',Beast:'Nature',Celestial:'Light',Construct:'Metal',Elemental:'Earth',Fey:'Dreams',Fiend:'Fear',Giant:'Earth',Monstrosity:'War',Ooze:'Water',Plant:'Nature',Undead:'Spirit'};
export function appropriateDomain(sp){
 const text=[sp.description,sp.body,sp.design?.reference?.name,...(sp.anatomy?.traits||[])].filter(Boolean).join(' ').toLowerCase(),score=new Map();
 for(const [domain,cues]of Object.entries(DOMAIN_CUES)){let n=0;for(const cue of cues)if(new RegExp('(^|[^a-z])'+cue.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'([^a-z]|$)').test(text))n+=2;if(n)score.set(domain,n);}
 score.set(BASE_DOMAIN[sp.base]||'Magic',(score.get(BASE_DOMAIN[sp.base])||0)+1);
 return [...score.keys()].sort((a,b)=>score.get(b)-score.get(a)||designHash(sp.id||sp.seed,a)-designHash(sp.id||sp.seed,b))[0];
}
export function assignDomains(sp,r=()=>.5,additional=true){
 const previous=[...new Set((sp.domains||[]).map(d=>({Time:'Fate',Space:'Void',Mind:'Psionic'})[d]||d).filter(d=>CREATURE_DOMAINS.includes(d)))];
 if(sp.domainRevision===1&&previous.length){sp.domains=previous;return sp.domains;}
 const primary=previous[0]||appropriateDomain(sp),domains=[primary,...previous.filter(d=>d!==primary)];
 if(additional)while(domains.length<CREATURE_DOMAINS.length&&r()<.01){const choices=CREATURE_DOMAINS.filter(d=>!domains.includes(d));domains.push(choices[Math.min(choices.length-1,Math.floor(r()*choices.length))]);}
 sp.domains=domains;sp.domainRevision=1;return domains;
}
export function capabilitiesFromAnatomy(anatomy,domains=[]){
 if(!anatomy)return {};const traits=new Set(anatomy.traits||[]),has=x=>traits.has(x),verified=['image-analysis','procedural-render'].includes(anatomy.source)&&anatomy.confidence>=.8;
 const hands=verified&&anatomy.manipulators>=2&&(has('hands')||has('grasp')||has('tentacles'));
 const psychic=domains.includes('Psionic')||has('psionic'),strength=anatomy.strength||1;
 const entry=(available,method,evidence)=>({available:!!available,method:available?method:null,evidence,confidence:verified?anatomy.confidence:.55});
 return {revision:1,verified,humanoid:verified&&anatomy.bodyPlan==='biped'&&anatomy.limbs?.arms>=2,
  equipment:entry(hands,'manipulators','Visible grasping appendages'),mechanisms:entry(hands||psychic,hands?'manipulators':'telekinesis','Grasping appendages or Psionic Domain'),
  push:entry(strength>=2||psychic||has('vines'),psychic?'telekinesis':has('vines')?'vine leverage':'body strength','Strength '+strength+'; detailed anatomical record'),
  crush:entry(strength>=2||psychic,psychic?'telekinesis':'impact','Strength '+strength+'; jaws, limbs or telekinetic force'),
  cleave:entry(['claws','talons','thorns','mandibles','fangs'].some(has)||psychic,psychic?'telekinetic edge':'natural cutting edge','Recorded cutting appendages'),
  steed:entry(['quadruped','serpentine','many-legged','winged'].includes(anatomy.bodyPlan)&&anatomy.scale==='colossal'||has('rideable'),'riding','Stable mount-capable body with sufficient size'),
  swim:entry(has('swim')||has('water')||domains.includes('Water'),'aquatic propulsion','Fins, swimming body or Water Domain'),
  fly:entry(has('fly')&&anatomy.limbs?.wings>=2||has('levitate')||domains.includes('Air'),has('levitate')?'levitation':'aerial lift','Wings, levitation or Air Domain'),
  dig:entry(has('dig')||domains.includes('Earth'),'excavation','Burrowing anatomy or Earth Domain'),
  teleport:entry(domains.some(d=>['Void','Psionic'].includes(d)),'spatial passage','Void or Psionic Domain'),
  climb:entry(has('climb')||has('claws')||hands,'grip','Grasping appendages, claws or climbing anatomy')};
}
// Field eligibility is binary: extra qualifying classifications do not increase effectiveness.
export function effectiveFieldDomains(sp,ind=null){
 const aliases={Time:'Fate',Space:'Void',Mind:'Psionic'};
 const domains=[...(sp?.domains||[])];
 const moves=ind?.moveIds
  ?ind.moveIds.map(id=>(sp.learnset||[]).find(m=>m.id===id)||(sp.moves||[]).find(m=>m.id===id)).filter(Boolean)
  :(sp?.moves||[]);
 for(const move of moves)for(const d of [move.domain,...(move.domains||[])].filter(Boolean))domains.push(aliases[d]||d);
 const suppressed=new Set([...(sp?.suppressedDomains||[]),...(ind?.suppressedDomains||[])]);
 const granted=[...(sp?.temporaryDomains||[]),...(ind?.temporaryDomains||[])];
 return [...new Set([...domains,...granted].map(d=>aliases[d]||d))].filter(d=>!suppressed.has(d));
}
export function syncCapabilities(sp,ind=null){
 const anatomy=sp.formAnatomy?.[ind?.form]||sp.anatomy;
 sp.capabilities=capabilitiesFromAnatomy(anatomy,effectiveFieldDomains(sp,ind));
 return sp;
}
export function fieldCapabilityAvailable(sp,capability,ind=null){
 const anatomy=sp.formAnatomy?.[ind?.form]||sp.anatomy;
 const result=capabilitiesFromAnatomy(anatomy,effectiveFieldDomains(sp,ind));
 const suppressed=new Set([...(sp?.suppressedCapabilities||[]),...(ind?.suppressedCapabilities||[])]);
 const blocked=new Set([...(ind?.fieldStatusRestrictions||[])]);
 return !!result[capability]?.available&&!suppressed.has(capability)&&!blocked.has(capability);
}
// Interpret independent image observations, never the requested prompt, as visual evidence.
export function applyVisualObservation(sp,observation){
 if(!observation||!Number.isFinite(observation.confidence)||observation.confidence<.8||!CREATURE_TYPES.includes(observation.base)||!CREATURE_TYPES.includes(observation.alter)||observation.base!==sp.base||observation.alter!==sp.alter)throw Error('Image anatomy or ordered type accuracy is unverified.');
 const allowedPlans=new Set(['biped','quadruped','winged','aquatic','serpentine','tentacled','radial','rooted','amorphous','many-legged']);
 if(!allowedPlans.has(observation.bodyPlan)||!Array.isArray(observation.traits)||observation.traits.length>30||observation.traits.some(t=>typeof t!=='string'||t.length>40))throw Error('Invalid image anatomy observations.');
 const expected=sp.design?.anatomy||sp.anatomy;
 if(expected?.bodyPlan&&expected.bodyPlan!==observation.bodyPlan)throw Error('Image body plan does not match the lineage reference.');
 const required=sp.design?.modifier?.traits||[];if(required.length&&!required.some(t=>observation.traits.includes(t)))throw Error('Second-type transformation is missing from the image.');
 if(typeof observation.nonhuman!=='boolean'||!observation.nonhuman)throw Error('Image must depict a nonhuman creature.');
 if(sp.design?.reference?.name&&(!Number.isFinite(observation.referenceConfidence)||observation.referenceConfidence<.8))throw Error('Image does not clearly match the anatomical reference.');
 const anatomy=anatomyRecord(observation.bodyPlan,observation.traits,{source:'image-analysis',confidence:observation.confidence,reference:sp.design?.reference?.id});
 if(observation.limbs!=null){const counts={};for(const key of ['legs','arms','wings','tentacles']){const value=observation.limbs[key];if(!Number.isInteger(value)||value<0||value>24)throw Error('Invalid visible limb count.');counts[key]=value;}anatomy.limbs=counts;}
 else if(!observation.traits.includes('hands'))anatomy.limbs.arms=0;

 if(observation.manipulators!=null){if(!Number.isInteger(observation.manipulators)||observation.manipulators<0||observation.manipulators>16)throw Error('Invalid visible manipulator count.');anatomy.manipulators=observation.manipulators;}
 sp.anatomy=anatomy;return syncCapabilities(sp);
}
export function applyLineageObservations(sp,observations){
 if(!Array.isArray(observations)||observations.length!==3)throw Error('Three image observations are required.');
 sp.formAnatomy=observations.map(o=>applyVisualObservation({...sp},o).anatomy);
 sp.anatomy=sp.formAnatomy[0];return syncCapabilities(sp);
}
export function individualSpecies(sp,ind){
 const anatomy=sp.formAnatomy?.[ind?.form||0]||sp.anatomy;
 return anatomy===sp.anatomy?sp:{...sp,anatomy,capabilities:capabilitiesFromAnatomy(anatomy,effectiveFieldDomains(sp,ind))};
}
export function legacyAnatomy(sp){
 const text=(sp.description||'').toLowerCase();let reference=Object.values(ANATOMY_CATALOG).flat().filter(r=>text.includes(r.name.toLowerCase())).sort((a,b)=>b.name.length-a.name.length)[0];
 const traits=reference?[...reference.traits]:[];for(const [pattern,trait]of [[/wing/,'wings'],[/claw/,'claws'],[/talon/,'talons'],[/hand|finger/,'hands'],[/tentacle/,'tentacles'],[/vine/,'vines'],[/bone|skelet/,'bone'],[/spectral|ghost/,'spectral'],[/massive|colossal|giant/,'strong'],[/colossal|towering/,'large'],[/aquatic|swim|river/,'swim']])if(pattern.test(text))traits.push(trait);
 const plan=reference?.plan||(/biped|two.leg|four.arm|humanoid|marionette|giant/.test(text)?'biped':/ooze|gel|amorphous/.test(text)?'amorphous':/vine|plant|sundew/.test(text)?'rooted':'quadruped');
 return anatomyRecord(plan,traits,{source:'legacy-concept',confidence:.5,reference:reference?.id});
}
export function migrateSpecies(sp){
 if(!sp||typeof sp!=='object')throw Error('Invalid saved species.');
 if(sp.base==='Humanoid'||sp.alter==='Humanoid'){
  sp.legacyTypes??={base:sp.base,alter:sp.alter};const text=(sp.description||'').toLowerCase();
  const candidates=/reed|wood|vine|plant|bamboo/.test(text)?['Plant','Construct']:/mirror|offset|asymmetr|four.arm/.test(text)?['Aberration','Construct']:/bird|avian|feather|moth|fur|insect/.test(text)?['Beast','Fey']:['Fey','Construct'];
  if(sp.base==='Humanoid')sp.base=candidates.find(t=>t!==sp.alter);if(sp.alter==='Humanoid')sp.alter=candidates.find(t=>t!==sp.base);
 }
 if(!cleanTypes(sp.base,sp.alter))throw Error('Invalid saved creature types.');
 sp.anatomy??=legacyAnatomy(sp);assignDomains(sp,()=>.5,false);ensurePassives(sp);
 for(const move of [...(sp.moves||[]),...(sp.learnset||[])])if(move.type==='Humanoid')move.type=sp.base;
 if(sp.capabilities?.revision!==1)syncCapabilities(sp);sp.taxonomyRevision=2;return sp;
}
export function migrateSaveCreatures(save){
 for(const sp of Object.values(save.species||{}))migrateSpecies(sp);
 const all=[...(save.spirits||[]),...Object.values(save.roamers||{}).flat().map(r=>r.ind),...(save.battle?.enemy?[save.battle.enemy]:[]),...(save.battle?.multi?.enemies||[]),...(save.battle?.multi?.reserves||[]),...(save.trade?.incoming?[save.trade.incoming]:[])];
 for(const ind of all){const sp=save.species?.[ind?.species];if(!sp)continue;const item=ind.heldItem;if(item?.requires?.types?.includes('Humanoid')){ind.legacyEquipmentIds=[...new Set([...(ind.legacyEquipmentIds||[]),item.id])];item.requires={...item.requires,types:item.requires.types.filter(t=>t!=='Humanoid'),capabilities:['equipment']};}if(item?.active?.type==='Humanoid')item.active.type=sp.base;}
 for(const plan of Object.values(save.generationPlans||{}))migrateSpecies(plan);
 save.taxonomyRevision=2;return save;
}
