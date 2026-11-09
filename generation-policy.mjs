import {GENERATION_REFERENCES} from './generation-references.mjs';
export const GENERATION_REVISION=2;
export const GENERATION_STYLE='Detailed painterly pixel-art-inspired JRPG creature sprites; deliberate clustered material shading, clear silhouettes at 64px, restrained highlights and clean readable surfaces. Match the approved General roster.';
export const GENERATION_RULES=[
 'Keep each Type recognizable: Beast retains a real living or extinct animal reference; Plant is dangerous or carnivorous; Monstrosity draws on myth; Giant is colossal; Ooze retains an amorphous body. Humanoid is anatomical status, never a Type.',
 'Both distinct ordered Types form one cohesive nonhuman identity. The first anchors the creature; the second transforms its materials, anatomy or manifestation. Never substitute an ordinary human.',
 'Every Form visibly expresses personhood through a face, prominent eyes, prominent mouth or face-depicting mask.',
 'Restrained abstract spirit motifs must serve the concept: floating masks, disembodied eyes, ribbons, separated pieces or object/place/emotion essences. Record intentional surreal anatomy explicitly.',
 'Each adjacent Form changes at least two structural axes: silhouette, proportions, posture, body architecture, appendage function or spiritual manifestation. Bigger size and more ornament alone do not qualify.',
 'Keep lineage identity, signature motif and materials while following each planned Form. A planned body-plan change is valid. Accidental missing, fused, unattached or duplicate appendages are errors.',
 'Full body facing left, one creature per image, transparent alpha, at least 6% clear margins around every tip and effect, no scenery, platforms, text, watermark, grid or ground shadow.',
 'Use current approved reference artwork and corrections. Older descriptions and rejected versions must not reintroduce obsolete anatomy. References guide quality and material handling; invent a distinct creature.',
 'Anatomy governs physical Techniques and Field Capabilities. No minimum animal mass; dimensions must fit the chosen creature, material and Form.'
];
const keys=['health','might','defense','energyPower','resistance','speed'];
const roles={Striker:[56,76,50,35,45,58],Mystic:[50,35,44,78,57,56],Guardian:[76,44,76,37,67,30],Skirmisher:[45,64,40,53,40,78],Support:[61,37,54,58,68,42],Balanced:[55,55,55,55,55,55]};
const hash=(...args)=>{let h=2166136261;for(const c of args.join('|'))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;};
const pick=(xs,...seed)=>xs[hash(...seed)%xs.length];
const clone=v=>structuredClone(v);
const clean=(v,max=900)=>typeof v==='string'?v.replace(/[<>\x00-\x1f]/g,'').trim().slice(0,max):'';
export function selectGenerationReferences(sp,limit=3){
 const traits=new Set(sp.anatomy?.traits||[]),domains=new Set(sp.domains||[]);
 return GENERATION_REFERENCES.filter(r=>r.id!==sp.id&&'roster-'+r.id!==sp.id).map(r=>({r,score:(r.base===sp.base?12:0)+(r.alter===sp.alter?8:0)+r.domains.filter(d=>domains.has(d)).length*4+r.tags.filter(t=>traits.has(t)).length+(r.formAnatomy.some(a=>a.bodyPlan===sp.anatomy?.bodyPlan)?3:0)})).sort((a,b)=>b.score-a.score||a.r.id.localeCompare(b.r.id)).slice(0,Math.max(0,Math.min(5,limit))).map(({r})=>clone(r));
}
export function plannedFormAnatomy(sp,form=0){return sp.design?.formPlans?.[form]?.anatomy||sp.formAnatomy?.[form]||sp.design?.anatomy||sp.anatomy;}
const structures={
 quadruped:[['compact low body','short tucked limbs','curled resting posture'],['long low torso','extended working forelimbs','forward hunting stance'],['high braced shoulders','broad weight-bearing limbs','raised sentinel posture']],
 biped:[['rounded crouching trunk','short grasping arms','low tucked head'],['lean forward-leaning torso','long articulated forearms','active stalking stance'],['broad arched upper body','braced powerful arms','upright watchful silhouette']],
 winged:[['compact grounded body','folded short wings','low rounded profile'],['stretched aerodynamic torso','swept functional wings','forward diving posture'],['arched aerial body','broad layered flight surfaces','high hovering silhouette']],
 rooted:[['closed seed capsule','short cupped traps','compact root knot'],['coiling upright stalk','hinged lateral traps','narrow leaning silhouette'],['open branching crown','buttress-root supports','broad radial canopy']],
 amorphous:[['compact sealed droplet','rounded internal nucleus','low pooled silhouette'],['arched hollow mantle','flowing lateral lobes','asymmetric lifted profile'],['branching suspended canopy','connected ribbonlike lobes','wide hollow silhouette']],
 serpentine:[['tight rounded coil','short raised neck','tucked head crest'],['long sweeping S-curve','braced lower coil','extended neck architecture'],['vertical spiral body','broad anchored coil','raised crown-like head structure']],
 aquatic:[['rounded streamlined juvenile','short paired fins','compact tail fan'],['long flexible trunk','swept steering fins','arched swimming posture'],['deep powerful forebody','broad stabilizing fins','long rudderlike tail']],
 tentacled:[['compact closed mantle','short folded tentacles','tucked radial profile'],['elongated lifted mantle','extended working tentacles','asymmetric reaching posture'],['open belllike mantle','arched load-bearing tentacles','broad suspended profile']],
 radial:[['closed central capsule','tucked radial appendages','compact circular outline'],['opened central ring','articulated radial spans','offset suspended outline'],['layered hollow central body','arched radial supports','broad rotating silhouette']],
 'many-legged':[['compact curled segments','short supporting legs','low rounded profile'],['elongated articulated trunk','long reaching front legs','forward stalking profile'],['high armored forebody','broad braced rear legs','arched guardian profile']]
};
function domainExpression(domain){
 const cues={Nature:'living growth, leaf veins and organic material behavior',Water:'clear currents, droplet refraction and fluid motion',Ice:'frost seams, crystalline edges and frozen breath',Fire:'banked embers, heat vents and charred material transitions',Metal:'articulated metal seams, patina and load-bearing joints',Spirit:'ancestral lantern light, spectral gaps and hovering masks',Void:'hollow apertures, folded space and separated coherent pieces',Magic:'controlled rune geometry, prismatic joints and ritual patterns',Dreams:'softly displaced outlines, suspended ribbons and dreamlike apertures',Fear:'watchful eyes, tense silhouettes and predatory negative space',Light:'clear luminous cores, refraction and restrained radiance',Storm:'charged currents, wind tension and branching arcs'};
 return cues[domain]||domain+' expressed through one clear thematic motif and its material behavior';
}
export function completeGenerationDesign(sp){
 if(!sp.design)return sp;if(sp.generationRevision===GENERATION_REVISION&&sp.design.formPlans?.length===3)return sp;
 const d=sp.design,a=d.anatomy||sp.anatomy,seed=sp.seed||sp.id;
 const personhood=pick(['prominent amber eyes','a clearly readable face-mask','a prominent expressive mouth'],seed,'personhood');
 const motif=pick(['a suspended face-mask','paired disembodied watching eyes','a single ribbon passing through separated body pieces','a small hovering geometric heart'],seed,'spirit-motif');
 d.identity={reference:d.reference.name,modifier:d.modifier.description,personhood,motif,materials:[d.modifier.description,pick(['aged ivory and muted copper','deep teal and warm amber','slate blue and pearl','moss green and dark bronze'],seed,'materials')],temperament:sp.temperament,domainExpressions:(sp.domains||[]).map(domain=>({domain,expression:domainExpression(domain)}))};
 let rows=clone(structures[a.bodyPlan]||structures.radial);
 if(hash(seed,'structural-path')%3===1)rows=rows.map((r,n)=>[r[0],['short tightly folded working appendages','long extended load-bearing appendages','broad braced appendages around a hollow central outline'][n],r[2]]);
 if(hash(seed,'structural-path')%3===2)rows=rows.map((r,n)=>[r[0],r[1],['tucked rounded resting silhouette','forward reaching open silhouette','arched sweeping guardian silhouette'][n]]);
 d.formPlans=rows.map((parts,form)=>({form,name:sp.forms[form],anatomy:clone(a),personhood,structure:parts[0],proportions:parts[1],posture:parts[2],manifestation:["spirit motif held within the body","spirit motif visibly emerging through the body's architecture","spirit motif fully manifesting around the reorganized body"][form],intentionalSurrealism:[motif],description:parts.join('; ')+'. '+d.reference.name+' identity retained; '+personhood+'; '+motif+'.',dimensions:null}));
 // A plant can unfold from a rooted seed into a coiling vine, then anchor a mature crown.
 if(sp.base==='Plant'&&a.bodyPlan==='rooted'&&hash(seed,'metamorphosis')%2===0){d.formPlans[1].anatomy.bodyPlan='serpentine';d.formPlans[1].anatomy.limbs={...a.limbs,legs:0};}
 if(a.bodyPlan==='quadruped'&&/bear|sloth|pangolin|anteater|raccoon|kangaroo/i.test(d.reference.name)&&hash(seed,'upright-form')%3===0){const final=d.formPlans[2];final.anatomy.bodyPlan='biped';final.anatomy.limbs={...a.limbs,legs:2,arms:2};final.posture='upright nonhuman sentinel posture retaining the reference animal’s head, spine and feet';final.description=final.structure+'; '+final.proportions+'; '+final.posture+'. '+personhood+'; '+motif+'.';}
 d.referenceIds=selectGenerationReferences(sp).map(r=>r.id);d.style=GENERATION_STYLE;
 sp.generationRevision=GENERATION_REVISION;return sp;
}
export function applyGeneratedGameplay(sp){
 completeGenerationDesign(sp);const seed=sp.seed||sp.id,a=sp.anatomy||{},traits=a.traits||[],roleNames=Object.keys(roles);
 const favored=traits.includes('psionic')?'Mystic':a.bodyPlan==='rooted'?'Guardian':traits.includes('wings')?'Skirmisher':traits.includes('armor')?'Guardian':traits.includes('fangs')?'Striker':null;
 const role=favored&&hash(seed,'role-bias')%2?favored:pick(roleNames,seed,'role'),target=306+hash(seed,'stat-budget')%31,weights=roles[role].map((v,n)=>v+hash(seed,n,'spread')%9-4),total=weights.reduce((x,y)=>x+y,0),values=weights.map(w=>Math.floor(w/total*target));
 for(let left=target-values.reduce((x,y)=>x+y,0),n=0;left>0;left--,n++)values[n%6]++;
 keys.forEach((key,n)=>sp[key]=values[n]);sp.power=sp.energyPower;
 const text=(sp.design.reference.name+' '+traits.join(' ')).toLowerCase();
 let adult=/colossal|titan|giant|whale|elephant|sauropod/.test(text)?{heightMeters:4,lengthMeters:8,weightKg:6000}:/hummingbird|mouse|moth|beetle|tiny/.test(text)?{heightMeters:.15,lengthMeters:.22,weightKg:.09}:/large|strong|bear|lion|horse/.test(text)?{heightMeters:1.8,lengthMeters:2.8,weightKg:240}:{heightMeters:.8,lengthMeters:1.2,weightKg:22};
 if(sp.base==='Giant')adult={heightMeters:8,lengthMeters:5,weightKg:18000};
 sp.formDimensions=[.45,.72,1].map(f=>Object.fromEntries(Object.entries(adult).map(([k,v])=>[k,Math.round(v*(k==='weightKg'?f**3:f)*1000)/1000])));
 sp.dimensions=clone(adult);sp.height=adult.heightMeters+' m';sp.weight=adult.weightKg+' kg';
 sp.design.formPlans.forEach((p,n)=>p.dimensions=clone(sp.formDimensions[n]));
 sp.generationProfile={revision:GENERATION_REVISION,role,baseStatTotal:target,dimensionsEstimated:true,learning:{classificationTolerance:.10,roleSpecialization:.10,eligibility:'strict',multiclassCounting:'one source per Technique'}};
 return sp;
}
export function validateGenerationPlan(sp,raw={}){
 completeGenerationDesign(sp);if(!sp.design)return sp;const originals=sp.design.formPlans;
 if(raw.formPlans!==undefined){
  if(!Array.isArray(raw.formPlans)||raw.formPlans.length!==3)throw Error('Three explicit Form plans are required.');
  sp.design={...sp.design,formPlans:raw.formPlans.map((p,n)=>{
   if(!p||typeof p!=='object')throw Error('Invalid Form plan.');const base=originals[n],anatomy=clone(base.anatomy);
   // The model articulates the authorized anatomy; it cannot invent unplanned limbs or body-plan changes.
   if(p.bodyPlan&&p.bodyPlan!==anatomy.bodyPlan)throw Error('Unplanned body-plan change in Form '+(n+1));
   const out={...base,name:sp.forms[n]};for(const key of ['personhood','structure','proportions','posture','manifestation','description']){const value=clean(p[key]);if(!value)throw Error('Missing '+key+' in Form '+(n+1));out[key]=value;}
   if(!/eye|face|mouth|mask/i.test(out.personhood))throw Error('Every Form needs readable personhood.');
   out.intentionalSurrealism=Array.isArray(p.intentionalSurrealism)?p.intentionalSurrealism.map(x=>clean(x,200)).filter(Boolean).slice(0,4):base.intentionalSurrealism;
   return out;
  })};
 }
 const plans=sp.design.formPlans;for(let n=1;n<3;n++){
  const sizeOnly=v=>/^(?:(?:a )?(?:bigger|larger|smaller|more|extra|elder|adult|same|unchanged)\b[ a-z-]*)$/i.test(clean(v));
  const axes=['structure','proportions','posture','manifestation'].filter(k=>clean(plans[n][k]).toLowerCase()!==clean(plans[n-1][k]).toLowerCase()&&!sizeOnly(plans[n][k]));
  if(axes.length<2)throw Error('Adjacent Forms must change at least two structural axes.');
  const joined=axes.map(k=>plans[n][k]).join(' ');if(/^(bigger|larger|more (?:armor|ornament|feathers|detail)|elder|adult)[ .,!]*$/i.test(joined))throw Error('Size and ornament alone do not define a new Form.');
 }
 sp.design.formPlans=plans.map((p,n)=>({...p,name:sp.forms[n]}));return sp;
}
export function assertGenerationObservation(sp,observation,form=0){
 if(sp.generationRevision!==GENERATION_REVISION)return;
 for(const key of ['personhoodVisible','anatomySound','plannedSurrealism','typeIntegration','domainIntegration'])if(observation[key]!==true)throw Object.assign(Error('Form '+(form+1)+' failed '+key+' verification.'),{repairForms:[form]});
 for(const key of ['style','readability','materialClarity'])if(!Number.isFinite(observation.quality?.[key])||observation.quality[key]<.8||observation.quality[key]>1)throw Object.assign(Error('Form '+(form+1)+' has insufficient '+key+'.'),{repairForms:[form]});
}
export function assertLineageReview(review){
 if(!review||!Number.isFinite(review.confidence)||review.confidence<.8||review.confidence>1||['familyContinuity','structuralProgression','originalIdentity'].some(k=>review[k]!==true))throw Object.assign(Error('Lineage review failed: '+(review?.issues?.join('; ')||'identity or structural progression is unverified')),{repairForms:Array.isArray(review?.repairForms)?review.repairForms.filter(n=>Number.isInteger(n)&&n>=0&&n<3):[1,2]});
 return review;
}
export function assertNovelGeneration(sp,existing=[]){
 const words=text=>new Set(clean(text,1600).toLowerCase().replace(/[^a-z ]/g,' ').split(/\s+/).filter(w=>w.length>3&&!['with','from','this','that','their','three','forms','spirit','spirimon','creature'].includes(w)));
 const own=words(sp.description),identity=sp.design?.identity;
 for(const other of [...existing,...GENERATION_REFERENCES]){
  if(other.id===sp.id||'roster-'+other.id===sp.id)continue;
  const peer=words(other.description),overlap=[...own].filter(w=>peer.has(w)).length,union=new Set([...own,...peer]).size;
  const sameIdentity=identity&&other.design?.identity&&identity.reference===other.design.identity.reference&&identity.modifier===other.design.identity.modifier&&identity.motif===other.design.identity.motif;
  if(sameIdentity||own.size>=8&&peer.size>=8&&overlap/Math.max(1,union)>.88)throw Error('The proposed identity is too similar to existing lineage '+(other.forms?.[1]||other.id)+'.');
 }
 return sp;
}
export function generationPrompt(sp,existing=[],{compact=false}={}){
 if(compact)return 'Name and describe this original nonhuman Spirimon. Return JSON forms (3 distinct names), description, visualPrompts (3 short Form briefs), moveNames (4 names). Preserve this code-planned anatomy, identity, Types, Domains and structural progression. Every Form needs readable eyes, mouth, face or face-mask. Keep intentional spirit motifs restrained and coherent. Physical Techniques need actual anatomy; do not propose mechanics or stats. ' +JSON.stringify({base:sp.base,alter:sp.alter,domains:sp.domains,identity:sp.design?.identity,forms:sp.design?.formPlans?.map(p=>({body:p.anatomy.bodyPlan,brief:p.description})),style:GENERATION_STYLE});
 const references=selectGenerationReferences(sp).map(({id,base,alter,description,formDescriptions,approvedCorrection})=>({id,base,alter,description,formDescriptions,approvedCorrection}));
 return 'Design an original three-form Spirimon lineage. Return JSON with forms (3 distinct names), description, visualPrompts (3 precise Form briefs), formPlans (3 objects with personhood, structure, proportions, posture, manifestation, description, intentionalSurrealism, bodyPlan), moveNames (4 names), and optionally moves (4 supported bounded move proposals). Follow the supplied Form plan and anatomy exactly. '+GENERATION_RULES.join('\n')+'\n'+GENERATION_STYLE+'\nPhysical Techniques require actual anatomical weapons; Energy manifestations may be spectral. Keep Types, Domains, role and code-generated base stats fixed. Move power 0–100, accuracy .65–1, kind physical/spiritual/status, target opponent/self/ally/allOpponents; use only supported effects from supplied moves or null, slow, poison, burn, paralysis, confusion, heal, ward, boostMight, boostPower, boostDefense, boostResistance, boostSpeed, lowerMight, lowerPower, lowerDefense, lowerResistance, lowerSpeed, breakWard, doubleHit, drain, recoil, critical, priority, protect, cleanse. Power, hits, accuracy, targeting and effects share the existing 120-point budget. Healing and wards have zero power and friendly targets. No Move Speed field.\n'+JSON.stringify({base:sp.base,modifier:sp.alter,domains:sp.domains,design:sp.design,gameplay:sp.generationProfile,startingMoves:sp.moves,approvedReferences:references,recentLineages:existing.slice(-8).map(p=>({forms:p.forms,description:p.description,identity:p.design?.identity}))});
}
export function imageGenerationParameters(settings={}){
 const int=(v,f,min,max)=>Number.isFinite(v)?Math.max(min,Math.min(max,Math.round(v))):f;
 const edge=Math.round(int(settings.size,768,512,1024)/64)*64;
 return {width:edge,height:edge,steps:int(settings.steps,28,20,45),cfg_scale:Number.isFinite(settings.guidance)?Math.max(4,Math.min(8,settings.guidance)):6,sampler_name:['Euler a','DPM++ 2M','DPM++ 2M Karras'].includes(settings.sampler)?settings.sampler:'Euler a'};
}
export function imageFormPrompt(sp,form,correction=''){
 const plan=sp.design?.formPlans?.[form];return GENERATION_STYLE+' '+GENERATION_RULES.join(' ')+' Form '+(form+1)+' of '+sp.forms.join(' → ')+'. '+JSON.stringify({identity:sp.design?.identity,plan,visualBrief:sp.visualPrompts?.[form],reference:sp.design?.reference,modifier:sp.design?.modifier})+(correction?' Repair only the reported issue: '+correction:'');
}
