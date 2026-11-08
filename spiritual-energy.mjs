import {difficultyFactor} from './difficulty.mjs';
import {PHILOSOPHY_SUPPORT} from './temple-philosophies.mjs';
import {canonicalDomain} from './domains.mjs';
import * as SD from './sealer-disciplines.mjs';
export const {ATTRIBUTES,VOWS,attribute,earnedPoints,ensureDisciplines,allocateAttribute,retrainingCost,retrainAttributes,awardAttribute,availableVows,selectVow,activeVow,vowViolation,breakVow,beginSealerBattle,endSealerBattle,controlReduction,energyCost,outputLimit,empowerment,supportQuote,perceptionProfile,concealmentProfile,encounterMultiplier,toggleSense,drainSenses,recoveryMultiplier,ritualQuote}=SD;
import * as E from './engine.mjs';
import {moveTiming} from './realtime-moves.mjs';
import {newSealer,clamp,bondEfficiency,calendarPhase,DAY_MS,CYCLE_MS,PASSIVE_RECOVERY_MS,spiritualHash,setExhaustion} from './spiritual-core.mjs';
import {startingSupport,generateSupport,validateSupport,supportFits} from './support-techniques.mjs';
export {calendarPhase,setExhaustion};

export function maximumEnergy(sealer,spirits=[]){
 const bonds=Math.min(45,Math.floor(Math.sqrt(spirits.reduce((sum,u)=>sum+Math.max(0,(u.bond||0)-30)/70,0))*8));
 return 100+5*SD.attribute(sealer,'reserve')+bonds;
}
export function ensureSealer(save){
 const first=!save.sealer,base=newSealer(save.party?.[0]||null);if(first)save.sealer=base;else for(const [key,value]of Object.entries(base))if(save.sealer[key]===undefined)save.sealer[key]=value;const q=save.sealer;
 for(const key of ['known','assignments','supportCooldowns','cooperativeCooldowns','recoveryUses','bondRewards','discoveries'])if(!q[key]||typeof q[key]!=='object'||Array.isArray(q[key]))q[key]={};
 if(first&&(save.wins||0)>0){q.xp=Math.min(100000,(save.wins||0)*42);while(q.xp>=80+q.level*20){q.xp-=80+q.level*20;q.level++;}}
 q.level=Math.max(1,Math.floor(Number(q.level)||1));q.clockMs=Number.isFinite(q.clockMs)?Math.max(0,q.clockMs):0;q.xp=Number.isFinite(q.xp)?Math.max(0,q.xp):0;q.training=clamp(Number(q.training)||0,0,20);
 q.advanced=Array.isArray(q.advanced)?q.advanced:[];q.rituals=Array.isArray(q.rituals)?q.rituals:[];
 if(!save.party?.includes(q.leadId))q.leadId=save.party?.[0]||null;
 SD.ensureDisciplines(q);q.maxEnergy=maximumEnergy(q,save.spirits||[]);q.energy=first?q.maxEnergy:clamp(Number(q.energy)||0,0,q.maxEnergy);
 if(!Array.isArray(q.startingChosen))q.startingChosen=[];for(const [id,list]of Object.entries(q.assignments))if(!Array.isArray(list))delete q.assignments[id];
 if(!Array.isArray(q.startingChoices)||!q.startingChoices.every(validateSupport))q.startingChoices=startingSupport(save.seed||'Sealer');
 for(const [id,t]of Object.entries(q.known))if(!validateSupport(t)||t.id!==id)delete q.known[id];
 for(const t of [...Object.values(q.known),...(q.startingChoices||[])]){if(t.requires?.domain)t.requires.domain=canonicalDomain(t.requires.domain);for(const e of t.effects||[])if(e.domain)e.domain=canonicalDomain(e.domain);}
 save.inventory??={};save.inventory.spiritDraughts??=3;
 return q;
}
export function restoreEnergy(sealer,amount){const before=sealer.energy;sealer.energy=clamp(before+Math.max(0,Math.round(amount*SD.recoveryMultiplier(sealer))),0,sealer.maxEnergy);return sealer.energy-before;}
export function spendEnergy(sealer,amount){if(!Number.isFinite(amount)||amount<0||sealer.energy+1e-6<amount)return false;sealer.energy=Math.max(0,sealer.energy-amount);return true;}
export function advanceSpiritualClock(save,ms,{exploring=false,paused=false}={}){const q=save.sealer||ensureSealer(save);if(paused||!Number.isFinite(ms)||ms<=0)return 0;const delta=Math.min(ms,1000);q.clockMs+=delta;if(exploring){SD.drainSenses(q,delta);passiveRecovery(q,delta);}return delta;}
export function passiveRecovery(q,ms){if(q.energy>=q.maxEnergy){q.passiveEnergy=0;return 0;}q.passiveEnergy=(q.passiveEnergy||0)+q.maxEnergy*Math.max(0,ms)/PASSIVE_RECOVERY_MS;const whole=Math.floor(q.passiveEnergy+1e-9);q.passiveEnergy-=whole;return whole?restoreEnergy(q,whole):0;}
export function gainSealerXP(save,amount,eventId=null){const q=save.sealer||ensureSealer(save);if(eventId&&q.discoveries['xp:'+eventId])return 0;if(eventId)q.discoveries['xp:'+eventId]=true;q.xp+=Math.max(0,amount);let gained=0;while(q.xp>=80+q.level*20){q.xp-=80+q.level*20;q.level++;gained++;}SD.ensureDisciplines(q);q.maxEnergy=maximumEnergy(q,save.spirits||[]);return gained;}
export function trainSealer(save,eventId,{ritual=false}={}){const q=save.sealer||ensureSealer(save);const key='training:'+eventId;if(q.discoveries[key])return false;q.discoveries[key]=true;if(ritual)q.rituals.push(eventId);else q.training=Math.min(20,q.training+1);SD.awardAttribute(q,key,{attribute:ritual?'output':'reserve',points:ritual?2:1});gainSealerXP(save,30);q.maxEnergy=maximumEnergy(q,save.spirits||[]);return true;}
export function bondRecovery(save,ind){const q=save.sealer||ensureSealer(save),key=ind.id+':'+calendarPhase(save.playTime).key;if(q.bondRewards[key])return 0;q.bondRewards[key]=true;gainSealerXP(save,5);return restoreEnergy(q,q.maxEnergy*.04);}
export function combatStrength(ind,sp){
 // Difficulty changes survivability, not the spiritual price of the same lineage.
 const st=E.stats(ind,sp),moves=E.equippedMoves(ind,sp),durability=Math.sqrt(st.hp/difficultyFactor(ind,'health')*.5*Math.sqrt(st.defense*st.resistance));
 const offense=Math.max(1,...moves.filter(m=>m.power>0).map(m=>{const p=moveTiming(m,ind,sp),hits=m.effect==='multiHit'?3.5:m.effect==='doubleHit'?2:1,stat=E.moveCategory(m)==='Energy'?st.power:st.might;return ((2*ind.level/5+2)*p.power*(stat/Math.max(50,45+ind.level*2.2))/24+2)*hits*(m.accuracy??.9)/(Math.max(p.castMs,p.timing==='gcd'?p.gcdMs:p.cooldownMs)/1000); }));
 const utility=moves.reduce((sum,m)=>sum+(moveTiming(m,ind,sp).work-Math.max(0,m.power||0))*.03,0);
 const passive=sp.ability==='Pressure'?1.12:sp.ability==='Second Wind'?1.08:1.05;
 return Math.max(10,Math.sqrt(durability*(offense*8+utility))*passive*(sp.physicalRes<1||sp.spiritualRes<1?1.06:1));
}
export function manifestationCost(sealer,ind,sp,{ignoreLead=false}={}){if(!ignoreLead&&ind.id===sealer.leadId)return 0;const raw=6*Math.pow(combatStrength(ind,sp)/70,.8)*(1+Math.max(0,ind.level-15)*.004)/(1+(Math.max(1,sealer.level)-1)*.018);return Math.max(1,Math.ceil(SD.energyCost(sealer,raw,{kind:'manifest',bond:bondEfficiency(ind)})));}
export function changeLead(save,id,{safe=false,battle=false}={}){const q=ensureSealer(save);if(battle||!safe)return {ok:false,reason:'Change your lead at a safe place.'};if(!save.party.includes(id))return {ok:false,reason:'The lead must be in your active traveling team.'};q.leadId=id;return {ok:true};}
export function chooseStartingSupport(save,id){const q=ensureSealer(save);if(q.startingChosen.length>=3)return {ok:false,reason:'Three starting techniques have already been chosen.'};const t=q.startingChoices.find(t=>t.id===id);if(!t||q.startingChosen.includes(id))return {ok:false,reason:'Choose a different starting technique.'};q.startingChosen.push(id);q.known[id]=t;if(q.startingChosen.length===3)autoAssignSupport(save);return {ok:true,complete:q.startingChosen.length===3};}
export function autoAssignSupport(save){
 const q=save.sealer||ensureSealer(save),known=Object.values(q.known),ids=save.party||[];if(!known.length)return;
 for(const id of Object.keys(q.assignments))if(!ids.includes(id))delete q.assignments[id];
 if(!q.floating||!q.known[q.floating])q.floating=known.at(-1).id;
 for(const id of ids){const u=save.spirits.find(u=>u.id===id),sp=u&&save.species[u.species];q.assignments[id]=(q.assignments[id]||[]).filter((v,n,a)=>v!==q.floating&&q.known[v]&&a.indexOf(v)===n&&(!sp||supportFits(q.known[v],u,sp,E.activeDomains(sp,u))));}
 for(const id of ids)if(!q.assignments[id].length){const u=save.spirits.find(u=>u.id===id),sp=save.species[u.species],t=known.find(t=>t.id!==q.floating&&supportFits(t,u,sp,E.activeDomains(sp,u)));if(t){let total=Object.values(q.assignments).reduce((n,a)=>n+a.length,0);if(total>=6){const extra=ids.find(other=>q.assignments[other].length>1);if(extra)q.assignments[extra].pop();}q.assignments[id]=[t.id];}}

}
export function assignSupport(save,memberId,techniqueId,{remove=false,floating=false,battle=false,replaceId=null}={}){
 const q=ensureSealer(save);if(battle)return {ok:false,reason:'Change support assignments outside battle.'};const t=q.known[techniqueId];if(!t)return {ok:false,reason:'Learn this technique first.'};
 const all=Object.values(q.assignments).flat();if(floating){if(all.includes(techniqueId))return {ok:false,reason:'The free-floating technique must differ from all assigned techniques.'};q.floating=techniqueId;return {ok:true};}
 const u=save.spirits.find(u=>u.id===memberId),sp=u&&save.species[u.species];if(!save.party.includes(memberId)||!u||!supportFits(t,u,sp,E.activeDomains(sp,u)))return {ok:false,reason:'This team member is not compatible.'};
 const list=q.assignments[memberId]??=[];if(remove){if(list.length<=1)return {ok:false,reason:'Each team member needs at least one assignment.'};q.assignments[memberId]=list.filter(id=>id!==techniqueId);return {ok:true};}
 if(replaceId&&list.includes(replaceId)&&techniqueId!==q.floating&&!list.includes(techniqueId)){q.assignments[memberId]=list.map(id=>id===replaceId?techniqueId:id);return {ok:true};}
 if(q.floating===techniqueId)return {ok:false,reason:'Change the free-floating selection before assigning this technique.'};if(all.length>=6)return {ok:false,reason:'All six assigned slots are occupied. Remove an extra assignment first.'};if(list.includes(techniqueId))return {ok:false,reason:'This technique is already assigned to this member.'};list.push(techniqueId);return {ok:true};
}
export function learnSupport(save,key,source,{primary=null}={}){const q=ensureSealer(save),event='learn:'+key;if(q.discoveries[event])return null;const t=generateSupport(save.seed+'|'+key,{level:q.level,primary});if(!validateSupport(t))throw Error('Invalid generated support technique');t.source=source;q.known[t.id]=t;q.discoveries[event]=true;return t;}
export function recoveryAvailable(save,kind,shrineId=null){
 const q=save.sealer||ensureSealer(save),phase=calendarPhase(save.playTime).key,key='shrine:'+shrineId+':'+phase;
 const valid=['restore','meditate','commune'].includes(kind)&&!!shrineId;
 return {ok:valid&&!q.recoveryUses[key],key};
}
export function beginRecovery(save,kind,{shrineId=null,safe=false,random=Math.random}={}){
 const q=ensureSealer(save);if(!shrineId)return {ok:false,reason:'Approach a Shrine to Restore, Meditate, or Commune.'};
 if(!['restore','meditate','commune'].includes(kind))return {ok:false,reason:'Unknown Shrine action.'};
 const check=recoveryAvailable(save,kind,shrineId);if(!check.ok)return {ok:false,reason:'This Shrine has been used. It resets at the next day/night transition.'};
 q.recoveryUses[check.key]=kind;
 if(kind==='restore'){
  for(const id of save.party){const u=save.spirits.find(u=>u.id===id);if(u)E.heal(u,save.species[u.species]);}
  const amount=restoreEnergy(q,q.maxEnergy);delete q.fieldTask;return {ok:true,amount,interrupted:false,key:check.key};
 }
 const fraction=kind==='commune'?.5:.25,interrupted=!safe&&random()<.25;save.playTime=(save.playTime||0)+(kind==='commune'?90000:180000);
 const amount=restoreEnergy(q,q.maxEnergy*fraction*(interrupted?.5:1));q.meditations=(q.meditations||0)+1;
 if([4,12,24,48].includes(q.meditations))trainSealer(save,'meditation-'+Math.floor(q.meditations/4));
 return {ok:true,amount,interrupted,key:check.key};
}
export function blackoutRecovery(save,shrineId){
 if(!shrineId)return {ok:false,reason:'A Shrine is required for blackout recovery.'};
 const before=save.playTime||0;
 if(!recoveryAvailable(save,'restore',shrineId).ok){
  const phase=calendarPhase(before);save.playTime=phase.cycle*CYCLE_MS+(phase.night?CYCLE_MS:DAY_MS);
 }
 return {...beginRecovery(save,'restore',{shrineId,safe:true}),waitedMs:(save.playTime||0)-before};
}
export function sealInvestment(sealer,ind,sp,quality=1,extra=0){const rawBase=4,base=Math.ceil(SD.energyCost(sealer,rawBase,{kind:'seal'})),additional=SD.empowerment(sealer,extra).extra,cost=Math.ceil(SD.energyCost(sealer,rawBase+additional,{kind:'seal'})),trust=clamp(ind.trust??ind.bond??0,0,100)/100;
 return {base,extra:additional,cost,chance:clamp(E.sealChance(ind,sp,quality)+trust*.12+.28*(1-Math.exp(-additional/Math.max(1,rawBase*2)))+(additional===0?SD.activeVow(sealer)?.seal||0:0),.03,.98),ok:sealer.energy>=cost};}
export function commitSeal(sealer,ind,sp,quality,extra,r=Math.random,{breakVow:approved=false}={}){const p=sealInvestment(sealer,ind,sp,quality,extra);if(sealer.energy<p.cost)return {...p,ok:false,reason:'Not enough Spiritual Energy for this sealing attempt.'};if(SD.vowViolation(sealer,'seal',{extra:p.extra})){if(!approved)return {...p,ok:false,reason:'This investment breaks your vow.',requiresVowBreak:true};SD.breakVow(sealer,!!sealer.inBattle);}if(!spendEnergy(sealer,p.cost))return {...p,ok:false,reason:'Not enough Spiritual Energy for this sealing attempt.'};return {...p,ok:true,success:r()<p.chance};}
// Old notable NPCs all received Open Hand. Offensive Temple doctrines must not
// receive a default vow that forbids their defining support and cooperation.
export function configureEnemyVow(q,notable=false){
 if(!notable)return q.vow;
 const offensiveDoctrine=!!PHILOSOPHY_SUPPORT[q.philosophy]&&!['Attrition','Resilience'].includes(q.philosophy);
 if(offensiveDoctrine&&q.vow==='open-hand'&&q.enemyVowRevision!==1)q.vow=null;
 if(!q.vow&&!offensiveDoctrine)q.vow='open-hand';q.enemyVowRevision=1;return q.vow;
}
export function enemySealer(seed,team,speciesOf){const level=Math.max(1,Math.round(team.reduce((n,u)=>n+u.level,0)/Math.max(1,team.length))),q=newSealer(team[0]?.id);q.level=level;q.advanced=level>=25?['triune','united']:level>=12?['united']:[];SD.ensureDisciplines(q);const points=q.unspentPoints;for(const [n,key] of SD.ATTRIBUTES.entries())q.attributes[key]=Math.floor(points/3)+(n<points%3?1:0);SD.ensureDisciplines(q);q.maxEnergy=maximumEnergy(q,team);q.energy=q.maxEnergy;q.philosophy=team.find(u=>PHILOSOPHY_SUPPORT[u.battlePhilosophy])?.battlePhilosophy;const families=PHILOSOPHY_SUPPORT[q.philosophy]||['shield','heal','calm','cleanse','empower','guard','revive'];for(let n=0;n<7;n++){let t;for(let attempt=0;attempt<8;attempt++){t=generateSupport(seed+'|npc|'+n+(attempt?'|fit|'+attempt:''),{level,primary:families[n]});if(!q.philosophy||team.some(u=>supportFits(t,u,speciesOf(u),E.activeDomains(speciesOf(u),u))))break;}q.known[t.id]=t;}const techs=Object.values(q.known);q.floating=techs.at(-1).id;let left=6;for(const [index,u] of team.slice(0,6).entries()){q.assignments[u.id]=[];const matches=techs.slice(0,-1).filter(t=>supportFits(t,u,speciesOf(u),E.activeDomains(speciesOf(u),u)));if(matches.length&&left){q.assignments[u.id].push(matches[(q.philosophy?index:spiritualHash(u.id))%matches.length].id);left--;}}for(const u of team.slice(0,6)){for(const t of techs.slice(0,-1)){if(!left)break;if(!q.assignments[u.id].includes(t.id)&&supportFits(t,u,speciesOf(u),E.activeDomains(speciesOf(u),u))){q.assignments[u.id].push(t.id);left--;}}}return q;}

export function fieldReleaseCost(q,ind,sp){return Math.max(1,Math.ceil(SD.energyCost(q,Math.max(2,Math.min(6,combatStrength(ind,sp)/25)),{kind:'field',bond:bondEfficiency(ind)})));}

// Direct Sealer restoration is separate from Shrine recovery and learned support.
export function restorationQuote(sealer,unit,species,pool='all',fraction=.25){
 const weights={hp:.4,pp:.3,willpower:.3},keys=pool==='all'?Object.keys(weights):Object.hasOwn(weights,pool)?[pool]:[];
 if(!keys.length||![.25,.5,1].includes(fraction))return {ok:false,reason:'Choose a restoration amount.',cost:0,gains:{}};
 if(!unit||unit.hp<=0)return {ok:false,reason:'Defeated Spirimon need revival or Shrine recovery.',cost:0,gains:{}};
 const caps=E.stats(unit,species),gains={};let price=0;
 for(const key of keys){const cap=caps[key]||0,missing=Math.max(0,cap-(unit[key]??cap)),gain=Math.min(missing,Math.ceil(cap*fraction));if(gain>0){gains[key]=gain;price+=gain/cap*weights[key]*sealer.maxEnergy;}}
 const cost=Math.ceil(price-1e-9);
 return {ok:cost>0&&sealer.energy>=cost,cost,gains,reason:cost===0?'These resources are already full.':sealer.energy<cost?'Not enough Spiritual Energy.':''};
}
export function restoreSpirimon(sealer,unit,species,pool='all',fraction=.25){
 const quote=restorationQuote(sealer,unit,species,pool,fraction);if(!quote.ok)return quote;
 if(!spendEnergy(sealer,quote.cost))return {...quote,ok:false,reason:'Not enough Spiritual Energy.'};
 for(const [key,gain]of Object.entries(quote.gains))unit[key]=(unit[key]??E.stats(unit,species)[key])+gain;
 return quote;
}
