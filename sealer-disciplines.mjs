// Sealer progression, cost shaping and vows. No battle-engine dependency.
import {clamp,spiritualHash} from './spiritual-core.mjs';
export const ATTRIBUTES=['reserve','control','output'];
export const VOWS=[
 {id:'solitary',name:'Solitary Bond',rule:'Manifest only one Spirimon at once in battle.',benefit:'Support costs 15% less.',costKind:'support',discount:.15},
 {id:'open-hand',name:'Open Hand',rule:'Use no offensive Sealer support, Omega or attacking cooperative Techniques.',benefit:'Healing and protective support effects improve by 10%.',power:.1},
 {id:'circle',name:'Unbroken Circle',rule:'Form your opening team before your first Technique; then do not voluntarily recall, switch or replace its members.',benefit:'Cooperative Techniques cost 15% less.',costKind:'cooperative',discount:.15},
 {id:'patient',name:'Patient Seal',unlock:3,rule:'Do not empower sealing attempts.',benefit:'Unempowered sealing gains 5 percentage points of success.',seal:.05},
 {id:'pilgrim',name:'Quiet Pilgrim',unlock:5,rule:'Use neither concealment nor spiritual perception.',benefit:'Energy recovery outside battle improves by 10%.',recovery:.1},
 {id:'concentrated',name:'Concentrated Release',unlock:12,rule:'Perform no exploration rituals.',benefit:'Optional empowerment permits 20 additional base Energy.',output:20},
 {id:'ritualist',name:'Ritual Keeper',unlock:8,rule:'Spend no extra Energy empowering support Techniques or sealing attempts.',benefit:'Rituals cost 20% less and their scalable effects improve by 10%.',costKind:'ritual',discount:.2,ritual:.1}
];
const whole=v=>Number.isFinite(Number(v))?Math.max(0,Math.floor(Number(v))):0;
export function attribute(q,key){return whole(q.attributes?.[key])+whole(q.attributeTraining?.[key]);}
export function earnedPoints(q){return 6+3*(Math.max(1,whole(q.level))-1);}
export function ensureDisciplines(q){
 if(q.disciplineVersion!==1){q.attributes={reserve:0,control:0,output:0};q.attributeTraining={reserve:0,control:0,output:0};q.trainingAwards={};
  // Only recorded, distinct milestones are migrated. Old counters are not repeatable rewards.
  for(const key of Object.keys(q.discoveries||{}).filter(k=>k.startsWith('training:'))){const a=ATTRIBUTES[spiritualHash(key)%3];q.attributeTraining[a]+=key.includes('ritual')?2:1;q.trainingAwards[key]=true;}
  q.disciplineVersion=1;
 }
 for(const key of ['attributes','attributeTraining','trainingAwards'])if(!q[key]||typeof q[key]!=='object'||Array.isArray(q[key]))q[key]={};
 let remaining=earnedPoints(q);for(const key of ATTRIBUTES){q.attributes[key]=Math.min(remaining,whole(q.attributes[key]));remaining-=q.attributes[key];q.attributeTraining[key]=whole(q.attributeTraining[key]);}
 q.unspentPoints=remaining;q.vow??=null;if(!VOWS.some(v=>v.id===q.vow))q.vow=null;
 q.perceptionTraining=whole(q.perceptionTraining);q.concealmentTraining=whole(q.concealmentTraining);q.senses??={perception:false,concealment:false};
 return q;
}
export function allocateAttribute(q,key){ensureDisciplines(q);if(!ATTRIBUTES.includes(key)||q.unspentPoints<1)return {ok:false,reason:'No attribute point available.'};q.attributes[key]++;q.unspentPoints--;return {ok:true};}
export function retrainingCost(q){return 100+25*q.level;}
export function retrainAttributes(q,inventory,{safe=false,battle=false}={}){ensureDisciplines(q);const cost=retrainingCost(q);if(!safe||battle)return {ok:false,reason:'Retrain at a safe place outside battle.'};if(!Object.values(q.attributes).some(Boolean))return {ok:false,reason:'No allocated points to retrain.'};if((inventory.coins||0)<cost)return {ok:false,reason:'Not enough Coin.'};inventory.coins-=cost;q.attributes={reserve:0,control:0,output:0};ensureDisciplines(q);return {ok:true,cost};}
export function awardAttribute(q,eventId,{attribute:key='control',points=1}={}){ensureDisciplines(q);if(!ATTRIBUTES.includes(key)||q.trainingAwards[eventId])return false;q.trainingAwards[eventId]=true;q.attributeTraining[key]+=clamp(whole(points),1,3);return true;}
export function availableVows(q){return VOWS.filter(v=>!v.unlock||q.level>=v.unlock||Object.keys(q.trainingAwards||{}).length>=v.unlock);}
export function selectVow(q,id,{safe=false,battle=false}={}){if(!safe||battle)return {ok:false,reason:'Choose a vow at a safe place outside battle.'};if(id&&!availableVows(q).some(v=>v.id===id))return {ok:false,reason:'Unlock this vow through progression.'};if(q.vow===id)return {ok:true};if(q.vowBroken)return {ok:false,reason:'Your broken vow must recover after battle before changing it.'};q.vow=id||null;return {ok:true};}
export function activeVow(q){return q&&!q.vowBroken?VOWS.find(v=>v.id===q.vow):null;}
export function vowViolation(q,action,{activeCount=0,initial=[],memberId=null,offensive=false,extra=0}={}){
 const v=activeVow(q);if(!v)return null;
 const violates=v.id==='solitary'&&action==='manifest'&&activeCount>=1||v.id==='open-hand'&&offensive||v.id==='circle'&&(['withdraw','switch','recall'].includes(action)||action==='manifest'&&q.vowFormationClosed&&initial.length>0&&!initial.includes(memberId))||v.id==='patient'&&action==='seal'&&extra>0||v.id==='concentrated'&&action==='ritual'||v.id==='pilgrim'&&['perception','concealment'].includes(action)||v.id==='ritualist'&&['seal','support'].includes(action)&&extra>0;
 return violates?v:null;
}
export function breakVow(q,inBattle=false){if(!activeVow(q))return false;q.vowBroken=inBattle?'battle':'outside';return true;}
export function beginSealerBattle(q){q.senses={perception:false,concealment:false};q.inBattle=true;q.initialManifested=[];q.vowFormationClosed=false;}
export function endSealerBattle(q){q.inBattle=false;q.vowBroken=null;delete q.initialManifested;}
export function controlReduction(q){const c=attribute(q,'control');return .4*c/(c+40);}
export function energyCost(q,base,{kind='',bond=1}={}){const vow=activeVow(q),discount=vow?.costKind===kind?vow.discount:0;return Math.max(base*.4,base*(1-controlReduction(q))*bond*(1-discount));}
export function outputLimit(q){return 10+attribute(q,'output')+(activeVow(q)?.output||0);}
export function empowerment(q,extra=0){const investment=clamp(whole(extra),0,outputLimit(q));return {extra:investment,bonus:.5*investment/(investment+10)};}
export function supportQuote(q,t,recipient,extra=0){
 const e=empowerment(q,extra),v=activeVow(q),protective=t.effects.some(e=>['heal','shield','guard','immunity','revive'].includes(e.kind)),offensive=t.effects.some(e=>['empower','haste','cooldown'].includes(e.kind));
 const base=Math.max(t.target==='team'||t.effects.some(e=>e.kind==='revive')?10:3,t.energyCost)*(1+Math.max(0,q.level-1)*.02),cost=Math.ceil(energyCost(q,base+e.extra,{kind:'support',bond:1-clamp((recipient.bond||0)/100,0,1)*.15}));
 // Each family explicitly selects its timing tradeoff. All ordinary taps stay instant.
 const primary=t.effects[0]?.kind,castFamily=['heal','willpower','revive'].includes(primary),castMs=e.extra&&castFamily?Math.round(1500*e.bonus):0,cooldownMs=Math.round(t.cooldownMs*(e.extra&&!castFamily?1+e.bonus*.5:1));
 const multiplier=1+e.bonus+(protective?(v?.power||0):0);
 return {...e,cost,castMs,cooldownMs,offensive,technique:{...t,empowermentExtra:e.extra,castMs,cooldownMs,effects:t.effects.map(effect=>({...effect,amount:effect.amount*multiplier}))}};
}
export function perceptionProfile(q){const o=attribute(q,'output'),trained=q.perceptionTraining||0;return {range:6+Math.floor(6*o/(o+40))+trained,drain:energyCost(q,2/(1+trained*.05),{kind:'perception'})};}
export function concealmentProfile(q,enemyLevel=q.level){const o=attribute(q,'output'),trained=q.concealmentTraining||0,strength=clamp(.25+.25*o/(o+40)+.1*trained/(trained+4),0,.6),resistance=Math.max(1,enemyLevel/Math.max(1,q.level));return {strength:strength/resistance,drain:energyCost(q,3/(1+trained*.05),{kind:'concealment'})};}
export function encounterMultiplier(q,enemyLevel){return q.senses?.concealment?1-concealmentProfile(q,enemyLevel).strength:1;}
export function toggleSense(q,kind,{breakVow:approved=false}={}){if(!['perception','concealment'].includes(kind)||q.inBattle)return {ok:false,reason:'Use spiritual senses outside battle.'};if(!q.senses?.[kind]&&q.energy<=0)return {ok:false,reason:'Restore Spiritual Energy first.'};if(!q.senses?.[kind]&&vowViolation(q,kind)){if(!approved)return {ok:false,reason:'This breaks your vow.',requiresVowBreak:true};breakVow(q,false);}
 q.senses??={};q.senses[kind]=!q.senses[kind];return {ok:true};}
export function drainSenses(q,ms){if(q.inBattle||!q.senses)return 0;const rate=(q.senses.perception?perceptionProfile(q).drain:0)+(q.senses.concealment?concealmentProfile(q).drain:0),cost=Math.min(q.energy,rate*Math.max(0,ms)/60000);q.energy=Math.max(0,q.energy-cost);if(q.energy<=0)q.senses={perception:false,concealment:false};return cost;}
export function recoveryMultiplier(q){return !q.inBattle?1+(activeVow(q)?.recovery||0):1;}
export function ritualQuote(q,ritual,extra=0){const e=empowerment(q,extra);return {...e,cost:Math.ceil(energyCost(q,ritual.cost+e.extra,{kind:'ritual'})),multiplier:1+e.bonus+(activeVow(q)?.ritual||0)};}
