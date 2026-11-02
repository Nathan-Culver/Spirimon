// Long-form world progression and persistent strategic equipment.
export const CLANS=[
 ['Verdant Circle','Plant',6],['Ember Covenant','Elemental',12],['Stoneward Clan','Giant',18],['Moonlit Court','Fey',25],['Iron Concord','Construct',32],['Duskbound Order','Undead',40],['Astral Synod','Celestial',50],['Abyssal Watch','Aberration',60]
].map(([name,type,level],index)=>({id:'clan-'+index,name,type,level,crest:name.split(' ')[0]+' Crest',index}));
export const FACTIONS=[
 {id:'ashen-hand',name:'The Ashen Hand',leader:'Marshal Veyra',motive:'Bind wild Spirimon into weapons',level:22},
 {id:'hollow-choir',name:'The Hollow Choir',leader:'Cantor Morcant',motive:'Awaken the buried voices beneath the world',level:38},
 {id:'veil-conclave',name:'The Veil Conclave',leader:'Archon Sable',motive:'Unravel the ancient seals',level:56}
];
export const CHARMS=[
 {id:'oak-heart',name:'Oak Heart',cost:80,bonus:'hp',amount:12,desc:'Increases maximum health by 12%.'},
 {id:'keen-eye',name:'Keen Eye',cost:100,bonus:'power',amount:10,desc:'Increases attack power by 10%.'},
 {id:'swift-feather',name:'Swift Feather',cost:100,bonus:'speed',amount:12,desc:'Increases speed by 12%.'},
 {id:'iron-shell',name:'Iron Shell',cost:110,bonus:'defense',amount:12,desc:'Increases defense by 12%.'},
 {id:'spirit-lens',name:'Spirimon Lens',cost:130,bonus:'resistance',amount:12,desc:'Increases resistance by 12%.'}
];
export function clanForRegion(cx,cy){if(cx===0&&cy===0)return CLANS[0];const d=Math.max(Math.abs(cx),Math.abs(cy));return CLANS[Math.min(CLANs.length-1,Math.max(0,d-1))];}
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
 return {...clan,id:'temple-'+cx+','+cy,originClan:clan.id,region:{cx,cy},philosophy:TEMPLE_PHILOSOPHIES[(h>>>5)%TEMPLE_PHILOSOPHIES.length],level:Math.min(95,Math.max(6,6+tier*5)),crest:clan.name.split(' ')[0]+' Crest of '+cx+','+cy,seed:h};
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
 return {...facility,round,level:Math.min(95,12+round*3+(h>>>0)%5),modifier:modifiers[(h>>>4)%modifiers.length],reward:25+Math.min(250,round*12)};
}
