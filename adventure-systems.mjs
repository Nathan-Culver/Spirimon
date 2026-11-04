// Long-form world progression and persistent strategic equipment.
export const CLANS=[
 ['Verdant Circle','Plant',6],['Ember Covenant','Elemental',12],['Stoneward Clan','Giant',18],['Moonlit Court','Fey',25],['Iron Concord','Construct',32],['Duskbound Order','Undead',40],['Astral Synod','Celestial',50],['Abyssal Watch','Aberration',60]
].map(([name,type,level],index)=>({id:'clan-'+index,name,type,level,domain:['Nature','Fire','Earth','Moon','Metal','Death','Light','Void'][index],crest:name.split(' ')[0]+' Crest',index}));
export const FACTIONS=[
 {id:'ashen-hand',name:'The Ashen Hand',leader:'Marshal Veyra',motive:'Bind wild Spirimon into weapons',level:22},
 {id:'hollow-choir',name:'The Hollow Choir',leader:'Cantor Morcant',motive:'Awaken the buried voices beneath the world',level:38},
 {id:'veil-conclave',name:'The Veil Conclave',leader:'Archon Sable',motive:'Unravel the ancient seals',level:56}
];
import {CHARMS as ALL_CHARMS} from './equipment.mjs';
export const CHARMS=ALL_CHARMS;
export function clanForRegion(cx,cy){if(cx===0&&cy===0)return CLANS[0];const d=Math.max(Math.abs(cx),Math.abs(cy));return CLANS[Math.min(CLANS.length-1,Math.max(0,d-1))];}
export function nextClan(crests=[]){return CLANS.find(c=>!crests.includes(c.id))||null;}
export function eligibleForChampionship(crests=[]){return CLANS.every(c=>crests.includes(c.id));}
export function equipmentMultiplier(item,stat){const charm=CHARMS.find(c=>c.id===item);return charm?.bonus===stat?1+charm.amount/100:1;}
export function legendAt(seed,cx,cy,night,weather){const n=Math.abs(cx)+Math.abs(cy);if(n<3)return null;const h=(cx*73856093^cy*19349663^String(seed).length*83492791)>>>0;if(h%11!==0)return null;return {id:'legend-'+cx+','+cy,title:['The Starved Star','The Sleeping Crown','The Last Dawn','The Deep Listener'][h%4],requiresNight:h%2===0,requiresWeather:h%3===0?'rain':null,level:Math.min(85,35+n*3),available:(h%2!==0||night)&&(h%3!==0||weather==='rain')};}
export function playerLooks(){return {colors:['#7f4a36','#d4a57a','#e9c8a3','#655047'],outfits:['#406e78','#954b55','#6c5b91','#477354'],hair:['#322723','#ac743b','#e2c779','#272b36']};}


/** Deterministic, save-safe procedural temple identity and validated puzzle sequence. */
export const TEMPLE_PHILOSOPHIES=['Attrition','Counterplay','Tempo','Resilience','Control','Transformation','Synergy','Prediction'];
export function templeAt(seed,cx,cy){
 const n=String(seed)+'|'+cx+'|'+cy;
 let h=2166136261;for(const ch of n){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}h>>>=0;
 const tier=Math.max(Math.abs(cx),Math.abs(cy));
 const clan=CLANS[h%CLANS.length];
 return {...clan,id:'temple-'+cx+','+cy,originClan:clan.id,region:{cx,cy},philosophy:TEMPLE_PHILOSOPHIES[(h>>>5)%TEMPLE_PHILOSOPHIES.length],level:Math.max(6,6+tier*5),crest:clan.name.split(' ')[0]+' Crest of '+cx+','+cy,seed:h};
}
export function templeTrial(temple){
 const seed=temple.seed>>>0,shift=seed%4;
 const symbols=['Sun','Moon','Star','Wave','Root','Flame','Stone','Wind'];
 const solution=[symbols[shift],symbols[(shift+3)%8],symbols[(shift+6)%8]];
 const chambers=['Entrance','Hall of Signs','Ward Chamber','Hidden Reliquary','Master Arena'];
 const edges=[[0,1],[1,2],[2,3],[3,4],[1,3]];
 return {chambers,edges,solution,clues:['First: '+solution[0],'Second: '+solution[1],'Third: '+solution[2]],requiredBattles:2};
}
export function validateTempleTrial(trial){
 if(!trial||!Array.isArray(trial.chambers)||!Array.isArray(trial.edges)||trial.solution?.length!==3)return false;
 const seen=new Set([0]),queue=[0];
 while(queue.length){const n=queue.shift();for(const [a,b] of trial.edges){const other=a===n?b:b===n?a:-1;if(other>=0&&!seen.has(other)){seen.add(other);queue.push(other);}}}
 return seen.size===trial.chambers.length&&trial.solution.every(v=>typeof v==='string'&&v.length>0);
}
export const FACILITY_TYPES=[
 {id:'arena',name:'Arena',rounds:3,rule:'Standard consecutive matches'},
 {id:'tower',name:'Tower',rounds:7,rule:'Ascending difficulty'},
 {id:'gauntlet',name:'Gauntlet',rounds:5,rule:'Consecutive challengers'},
 {id:'survival',name:'Survival',rounds:10,rule:'Endurance streak'},
 {id:'draft',name:'Draft',rounds:4,rule:'Team preparation challenge'},
 {id:'challenge',name:'Challenge Hall',rounds:6,rule:'Rotating tactical objectives'}
];
export function facilityChallenge(type,streak=0,seed='spirimon'){
 const facility=FACILITY_TYPES.find(f=>f.id===type);
 if(!facility)throw Error('Unknown facility '+type);
 const round=Math.max(0,Math.floor(streak));
 let h=2166136261;for(const ch of String(seed)+'|'+type+'|'+round){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}
 const modifiers=['No restriction','Swift opponents','Defensive opponents','Transforming opponents','Mixed-domain opponents'];
 return {...facility,round,level:12+round*3+(h>>>0)%5,modifier:modifiers[(h>>>4)%modifiers.length],reward:25+Math.min(250,round*12)};
}


// Persistent competition state. Every win advances one real match; a loss ends the run.
export const GUILD_TRIALS=[
 {id:'discipline',name:'Trial of Discipline',rank:1,level:12,maxActive:1},
 {id:'cooperation',name:'Trial of Cooperation',rank:2,level:24,maxActive:2},
 {id:'mastery',name:'Trial of Mastery',rank:3,level:40,maxActive:3}
];
export const CHAMPIONSHIP_STAGES=[
 {name:'Regional qualifiers',matches:2,maxActive:1},
 {name:'League',matches:3,maxActive:2},
 {name:'Playoffs',matches:2,maxActive:3},
 {name:'Final',matches:1,maxActive:3}
];
export function competitionState(adventure){
 adventure.guildTrials??=[];adventure.competitionHistory??=[];adventure.titleDefenses??=0;adventure.facilityRuns??={};adventure.facilityBest??={};return adventure;
}
export function championshipEligibility(crests,rank,trials=[],champion=false){
 if(champion)return {ok:true};
 if(!eligibleForChampionship(crests))return {ok:false,reason:'Earn all eight Clan Crests.'};
 if(rank<4)return {ok:false,reason:'Reach Guild rank 4.'};
 if(!GUILD_TRIALS.every(t=>trials.includes(t.id)))return {ok:false,reason:'Complete all three Guild trials.'};
 return {ok:true};
}
export function beginChampionship(adventure,{rank=1,seed='spirimon'}={}){
 competitionState(adventure);const check=championshipEligibility(adventure.crests||[],rank,adventure.guildTrials,adventure.champion);if(!check.ok)return check;
 if(adventure.championship?.status==='active')return {ok:true,run:adventure.championship};
 const attempt=(adventure.championship?.attempt||0)+1;
 adventure.championship={attempt,seed:seed+'|championship|'+attempt,stage:0,match:0,wins:0,status:'active',defense:!!adventure.champion};return {ok:true,run:adventure.championship};
}
export function championshipMatch(adventure,partyLevel=1,areaLevel=1){
 const run=adventure.championship;if(run?.status!=='active')return null;
 const stage=CHAMPIONSHIP_STAGES[run.stage];let h=2166136261;for(const ch of run.seed+'|'+run.stage+'|'+run.match)h=Math.imul(h^ch.charCodeAt(0),16777619);
 return {...stage,stage:run.stage,match:run.match,id:'championship-'+run.attempt+'-'+run.stage+'-'+run.match,opponent:run.stage===3?'Champion Seraphine':run.stage===2&&run.match===1?'Rowan':['Iona','Tamsin','Veylan','Mira','Corin','Lysander'][(h>>>0)%6],level:Math.max(50+run.stage*8+run.match*3,Math.ceil(partyLevel),areaLevel,run.lastLevel||0),teamSize:Math.min(6,3+run.stage)};
}
export function recordChampionshipResult(adventure,victory){
 competitionState(adventure);const run=adventure.championship;if(run?.status!=='active')return {ok:false};
 if(!victory)run.status='eliminated';
 else{run.wins++;run.match++;if(run.match>=CHAMPIONSHIP_STAGES[run.stage].matches){run.match=0;run.stage++;}if(run.stage>=CHAMPIONSHIP_STAGES.length){run.status='complete';adventure.champion=true;if(run.defense)adventure.titleDefenses++;}}
 if(run.status!=='active'){adventure.competitionHistory.unshift({kind:'championship',attempt:run.attempt,result:run.status,wins:run.wins,defense:run.defense});adventure.competitionHistory=adventure.competitionHistory.slice(0,50);}
 return {ok:true,complete:run.status==='complete',eliminated:run.status==='eliminated',run};
}
export function beginFacilityRun(adventure,type,seed='spirimon',season=0){
 competitionState(adventure);const facility=FACILITY_TYPES.find(f=>f.id===type);if(!facility)return {ok:false,reason:'Unknown facility.'};
 const previous=adventure.facilityRuns[type];if(previous?.status==='active')return {ok:true,run:previous};
 const run={id:type,round:0,wins:0,status:'active',season,seed:seed+'|'+type+'|'+season,attempt:(previous?.attempt||0)+1};adventure.facilityRuns[type]=run;return {ok:true,run};
}
export function facilityMatch(adventure,type,partyLevel=1){
 const run=adventure.facilityRuns?.[type];if(run?.status!=='active')return null;
 const challenge=facilityChallenge(type,run.round+(adventure.facilityBest?.[type]||0),run.seed),rotating=run.season%3;
 const rules={maxActive:type==='arena'?1:type==='draft'?3:Math.min(3,1+Math.floor(run.round/2)),noItems:type==='survival'||type==='challenge'&&rotating===0,noSupport:type==='challenge'&&rotating===1};
 return {...challenge,level:Math.max(challenge.level,Math.ceil(partyLevel)+run.round*2),teamSize:Math.min(6,2+run.round),rules,round:run.round,modifier:challenge.modifier};
}
export function recordFacilityResult(adventure,type,victory){
 competitionState(adventure);const run=adventure.facilityRuns[type],facility=FACILITY_TYPES.find(f=>f.id===type);if(!run||run.status!=='active'||!facility)return {ok:false};
 if(victory){run.wins++;run.round++;if(run.round>=facility.rounds)run.status='complete';}else run.status='eliminated';
 adventure.facilityBest[type]=Math.max(adventure.facilityBest[type]||0,run.wins);
 if(run.status!=='active'){adventure.competitionHistory.unshift({kind:type,result:run.status,wins:run.wins,season:run.season});adventure.competitionHistory=adventure.competitionHistory.slice(0,50);}
 return {ok:true,complete:run.status==='complete',eliminated:run.status==='eliminated',run};
}

export function observationChallenge(seed,attempt=0){
 let h=2166136261;for(const c of String(seed)+'|observation|'+attempt)h=Math.imul(h^c.charCodeAt(0),16777619);
 const symbols=['Sun','Moon','Root','Wave','Star','Flame'],offset=(h>>>0)%symbols.length,cycle=[0,1,2].map(n=>symbols[(offset+n*2)%symbols.length]);
 const rotation=(h>>>5)%3;return {pattern:[...cycle,...cycle.slice(0,2)],choices:[0,1,2].map(n=>cycle[(rotation+n)%3]),answer:cycle[2]};
}
export function rhythmScore(elapsedMs){const phase=((elapsedMs%1600)+1600)%1600/1600;return Math.max(0,1-Math.abs(phase-.5)*4);}
export function recordSideActivity(adventure,kind,score,bonus=0){
 adventure.activityRecords??={};const record=adventure.activityRecords[kind]??={attempts:0,wins:0,best:0,milestones:0};score=Math.max(0,Math.min(1,Number(score)||0));record.attempts++;record.best=Math.max(record.best,score);if(score>=.6)record.wins++;
 const milestone=record.wins>0&&record.wins%5===0&&record.milestones<Math.floor(record.wins/5);if(milestone)record.milestones++;
 return {score,reward:score>=.6?Math.ceil((kind==='festival'?25:15)*score*(1+Math.max(0,Math.min(.2,bonus))))+(milestone?25:0):0,milestone,record};
}
