// Long-form world progression and persistent strategic equipment.
export const CLANS=[
 ['Verdant Circle','Plant',6],['Ember Covenant','Elemental',12],['Stoneward Clan','Giant',18],['Moonlit Court','Fey',25],['Iron Concord','Construct',32],['Duskbound Order','Undead',40],['Astral Synod','Celestial',50],['Abyssal Watch','Aberration',60]
].map(([name,type,level],index)=>({id:'clan-'+index,name,type,level,crest:name.split(' ')[0]+' Crest',index}));
export const FACTIONS=[
 {id:'ashen-hand',name:'The Ashen Hand',leader:'Marshal Veyra',motive:'Bind wild Spirits into weapons',level:22},
 {id:'hollow-choir',name:'The Hollow Choir',leader:'Cantor Morcant',motive:'Awaken the buried voices beneath the world',level:38},
 {id:'veil-conclave',name:'The Veil Conclave',leader:'Archon Sable',motive:'Unravel the ancient seals',level:56}
];
export const CHARMS=[
 {id:'oak-heart',name:'Oak Heart',cost:80,bonus:'hp',amount:12,desc:'Increases maximum health by 12%.'},
 {id:'keen-eye',name:'Keen Eye',cost:100,bonus:'power',amount:10,desc:'Increases attack power by 10%.'},
 {id:'swift-feather',name:'Swift Feather',cost:100,bonus:'speed',amount:12,desc:'Increases speed by 12%.'},
 {id:'iron-shell',name:'Iron Shell',cost:110,bonus:'defense',amount:12,desc:'Increases defense by 12%.'},
 {id:'spirit-lens',name:'Spirit Lens',cost:130,bonus:'resistance',amount:12,desc:'Increases resistance by 12%.'}
];
export function clanForRegion(cx,cy){if(cx===0&&cy===0)return CLANS[0];const d=Math.max(Math.abs(cx),Math.abs(cy));return CLANS[Math.min(CLANs.length-1,Math.max(0,d-1))];}
export function nextClan(crests=[]){return CLANS.find(c=>!crests.includes(c.id))||null;}
export function eligibleForChampionship(crests=[]){return CLANS.every(c=>crests.includes(c.id));}
export function equipmentMultiplier(item,stat){const charm=CHARMS.find(c=>c.id===item);return charm?.bonus===stat?1+charm.amount/100:1;}
export function legendAt(seed,cx,cy,night,weather){const n=Math.abs(cx)+Math.abs(cy);if(n<3)return null;const h=(cx*73856093^cy*19349663^String(seed).length*83492791)>>>0;if(h%11!==0)return null;return {id:'legend-'+cx+','+cy,title:['The Starved Star','The Sleeping Crown','The Last Dawn','The Deep Listener'][h%4],requiresNight:h%2===0,requiresWeather:h%3===0?'rain':null,level:Math.min(85,35+n*3),available:(h%2!==0||night)&&(h%3!==0||weather==='rain')};}
export function playerLooks(){return {colors:['#7f4a36','#d4a57a','#e9c8a3','#655047'],outfits:['#406e78','#954b55','#6c5b91','#477354'],hair:['#322723','#ac743b','#e2c779','#272b36']};}
