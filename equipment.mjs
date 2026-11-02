// Shared definitions: saved equipment IDs and aspects remain compatible with older worlds.
export const CHARMS=[
 {id:'oak-heart',name:'Oak Heart',cost:80,bonus:'hp',amount:12,desc:'Maximum HP +12%.'},
 {id:'keen-eye',name:'Keen Eye',cost:100,bonus:'power',amount:10,desc:'Energy power +10%.'},
 {id:'swift-feather',name:'Swift Feather',cost:100,bonus:'speed',amount:12,desc:'Speed +12%.'},
 {id:'iron-shell',name:'Iron Shell',cost:110,bonus:'defense',amount:12,desc:'Defense +12%.'},
 {id:'spirit-lens',name:'Spirimon Lens',cost:130,bonus:'resistance',amount:12,desc:'Resistance +12%.'},
 {id:'oracle-lens',name:'Oracle Lens',cost:180,hook:'accuracy',desc:'Improves move accuracy by 10 percentage points.'},
 {id:'thorn-mail',name:'Thorn Mail',cost:200,hook:'thorns',desc:'Physical attackers lose 1/10 of their maximum HP after landing a hit.'},
 {id:'drain-fang',name:'Drain Fang',cost:220,hook:'drain',desc:'Recovers HP equal to 1/8 of direct damage dealt.'},
 {id:'warding-bell',name:'Warding Bell',cost:180,hook:'statusGuard',desc:'Blocks the first affliction against its wearer each battle.'},
 {id:'renewal-seed',name:'Renewal Seed',cost:60,hook:'healBerry',consumable:true,desc:'Consumed at one-third HP or below to restore 1/3 maximum HP.'},
 {id:'soul-vessel',name:'Soul Vessel',cost:70,hook:'resourceBerry',consumable:true,desc:'Consumed when both resource pools are low; restores up to 10 to each pool.'},
 {id:'hazard-boots',name:'Trailwarden Boots',cost:240,hook:'boots',desc:'Prevents entry-hazard damage, poison and slowing.'},
 {id:'switch-ribbon',name:'Returning Ribbon',cost:230,hook:'regenerator',desc:'Restores 1/5 maximum HP when the wearer leaves battle alive.'},
 {id:'focus-band',name:'Last-light Band',cost:250,hook:'survive',desc:'Once per battle, survives a direct knockout hit at 1 HP when starting at full HP.'},
 {id:'vital-orb',name:'Vital Orb',cost:260,hook:'lifeOrb',desc:'Direct damage +20%; each damaging action costs 1/10 maximum HP.'},
 {id:'ward-stone',name:'Ward Stone',cost:210,hook:'screens',desc:'Reflect, energy screens and safeguards last three extra rounds.'},
 {id:'weather-orb',name:'Weather Orb',cost:210,hook:'weather',desc:'Weather and terrain summoned by the wearer last three extra rounds.'},
 {id:'wind-chime',name:'Wind Chime',cost:190,hook:'firstWind',desc:'Adds 12 turn priority while the wearer has full HP.'},
 {id:'grounding-anchor',name:'Grounding Anchor',cost:230,hook:'anchor',desc:'Prevents forced displacement and reduces physical damage by 10%.'},
 {id:'cleansing-knot',name:'Cleansing Knot',cost:160,hook:'cleanseBerry',consumable:true,desc:'Consumed to cleanse the wearer’s major status and volatile afflictions.'}
];
export const ASPECTS={
 Natural:{cost:0,bond:0,level:1,stats:[],desc:'The lineage’s natural balance.'},
 Primal:{cost:150,bond:40,level:16,stats:[['might',1.15],['resistance',.95]],desc:'Might +15%, resistance −5%; Physical attacks gain 15% damage below half HP.'},
 Astral:{cost:150,bond:40,level:16,stats:[['power',1.15],['defense',.95]],desc:'Power +15%, defense −5%; once per battle, cleanses a major status on entry.'},
 Titan:{cost:150,bond:40,level:16,stats:[['hp',1.18],['speed',.9]],desc:'HP +18%, speed −10%; resists forced switching.'},
 Swift:{cost:150,bond:40,level:16,stats:[['speed',1.18],['hp',.94]],desc:'Speed +18%, HP −6%; avoids Sticky Web and gains priority on its first action after entry.'},
 Verdant:{cost:220,bond:55,level:25,stats:[['resistance',1.1]],desc:'Resistance +10%; restores 1/16 maximum HP each round on grassy terrain.'},
 Umbral:{cost:220,bond:55,level:25,stats:[['might',1.08],['power',1.08]],desc:'Might and power +8%; attacks against afflicted foes gain 15% damage.'},
 Stormbound:{cost:250,bond:60,level:30,stats:[['speed',1.1]],desc:'Speed +10%; weather causes no chip damage and storm attacks gain 15% damage during rain or snow.'}
};
export const equipment=id=>CHARMS.find(c=>c.id===id)||null;
export const hasHook=(ind,hook)=>equipment(ind.heldCharm)?.hook===hook;
export function aspectEligibility(ind,name){const a=ASPECTS[name];if(!a)return {ok:false,reason:'Unknown aspect.'};if(name==='Natural'||ind.aspect===name||ind.aspectUnlocks?.includes(name))return {ok:true,cost:0};if(ind.level<a.level||ind.bond<a.bond)return {ok:false,reason:'Requires level '+a.level+' and bond '+a.bond+'.'};return {ok:true,cost:a.cost};}
export function unlockAspect(ind,name,inventory){const allowed=aspectEligibility(ind,name);if(!allowed.ok)return allowed;if((inventory.coins||0)<allowed.cost)return {ok:false,reason:'Requires '+allowed.cost+' Coin.'};inventory.coins-=allowed.cost;ind.aspectUnlocks=[...new Set([...(ind.aspectUnlocks||[]),ind.aspect||'Natural',name])];ind.aspect=name;return {ok:true,cost:allowed.cost};}
export function equipItem(ind,id,inventory){if(id!==null&&!equipment(id))return {ok:false,reason:'Unknown charm.'};if(ind.heldCharm===id)return {ok:true};if(id&&(inventory[id]||0)<1)return {ok:false,reason:'Charm not owned.'};if(ind.heldCharm)inventory[ind.heldCharm]=(inventory[ind.heldCharm]||0)+1;if(id){inventory[id]--;ind.heldCharm=id;}else delete ind.heldCharm;return {ok:true};}
