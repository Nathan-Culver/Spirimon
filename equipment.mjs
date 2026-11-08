import {DOMAINS,canonicalDomain,canonicalDomains,normalizeMoveDomains} from './domains.mjs';
import {individualSpecies} from './anatomy.mjs';
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
export const hasHook=(ind,hook,sp=null)=>itemHasHook(heldEquipment(ind,sp),hook);
export function aspectEligibility(ind,name){const a=ASPECTS[name];if(!a)return {ok:false,reason:'Unknown aspect.'};if(name==='Natural'||ind.aspect===name||ind.aspectUnlocks?.includes(name))return {ok:true,cost:0};if(ind.level<a.level||ind.bond<a.bond)return {ok:false,reason:'Requires level '+a.level+' and bond '+a.bond+'.'};return {ok:true,cost:a.cost};}
export function unlockAspect(ind,name,inventory){const allowed=aspectEligibility(ind,name);if(!allowed.ok)return allowed;if((inventory.coins||0)<allowed.cost)return {ok:false,reason:'Requires '+allowed.cost+' Coin.'};inventory.coins-=allowed.cost;ind.aspectUnlocks=[...new Set([...(ind.aspectUnlocks||[]),ind.aspect||'Natural',name])];ind.aspect=name;return {ok:true,cost:allowed.cost};}
export function equipItem(ind,id,inventory){if(ind.heldItem)return {ok:false,reason:'Use the Held Item inventory to replace procedural equipment.'};if(id!==null&&!equipment(id))return {ok:false,reason:'Unknown charm.'};if(ind.heldCharm===id)return {ok:true};if(id&&(inventory[id]||0)<1)return {ok:false,reason:'Charm not owned.'};if(ind.heldCharm)inventory[ind.heldCharm]=(inventory[ind.heldCharm]||0)+1;if(id){inventory[id]--;ind.heldCharm=id;}else delete ind.heldCharm;return {ok:true};}

// Procedural Held Items. Generated records are saved in full, so later catalog
// changes do not reroll a discovered item. No crafting or extra equipment slots.
export const ITEM_CATEGORIES=['Weapons and shields','Armor and clothing','Magical foci and relics','Tools and utility gear','Charms and talismans','Consumables'];
export const ITEM_RARITIES=['Common','Uncommon','Rare','Epic','Relic'];
const itemHash=(...parts)=>{let h=2166136261;for(const c of parts.join('|')){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
const itemRng=seed=>{let a=itemHash(seed);return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};};
const choose=(xs,r)=>xs[Math.floor(r()*xs.length)];
const T=(id,name,category,stat,hook,active,extra={})=>({id,name,category:ITEM_CATEGORIES[category],stat,hook,active,...extra});
export const ITEM_TEMPLATES=[
 T('edge','Resonant Edge',0,'might','physicalEdge','strike'),
 T('shield','Returning Shield',0,'defense','anchor','ward'),
 T('lance','Piercing Lance',0,'might','critical','pierce'),
 T('sling','Storm Sling',0,'speed','accuracy','bolt'),
 T('sabre','Duelist’s Sabre',0,'might','physicalEdge','pierce',{requires:{capabilities:['equipment']}}),
 T('warfan','Court Warfan',0,'speed','firstWind','wind',{requires:{capabilities:['equipment']}}),
 T('shell','Thorned Shell',1,'defense','thorns','ward'),
 T('robe','Mistwoven Robe',1,'resistance','energyGuard','cleanse'),
 T('mantle','Vigilant Mantle',1,'hp','survive','ward'),
 T('cloak','Traveler’s Cloak',1,'speed','regenerator','retreat'),
 T('cuirass','Articulated Cuirass',1,'defense','anchor','reflect',{requires:{capabilities:['equipment']},drawback:'speed'}),
 T('lens','Prismatic Lens',2,'power','accuracy','bolt'),
 T('staff','Weather Staff',2,'power','weather','weather'),
 T('chalice','Renewing Chalice',2,'resistance','leftovers','heal'),
 T('focus','Attuned Focus',2,'power','domainBoost','bolt'),
 T('codex','Runic Codex',2,'power','energyGuard','screen',{requires:{capabilities:['equipment']}}),
 T('ember','Ember Reliquary',2,'power','domainBoost','flame',{requires:{domains:['Fire','Sun']},domain:'Fire'}),
 T('boots','Trailwarden Treads',3,'speed','boots','clearHazards'),
 T('anchor','Grounding Weight',3,'defense','anchor','ward'),
 T('bell','Warning Bell',3,'resistance','statusGuard','cleanse'),
 T('lantern','Surveyor’s Lantern',3,'power','resourceSustain','focus'),
 T('compass','Wayfinder Compass',3,'speed','firstWind','retreat'),
 T('device','Artificer’s Device',3,'power','resourceSustain','bolt',{requires:{capabilities:['equipment']}}),
 T('cog','Living Gear',3,'defense','thorns','reflect',{requires:{types:['Construct']}}),
 T('fang','Siphoning Fang',4,'might','drain','strike'),
 T('orb','Vitality Orb',4,'power','lifeOrb','bolt'),
 T('stone','Wardstone',4,'resistance','screens','screen'),
 T('knot','Patient Knot',4,'hp','leftovers','regenerate'),
 T('band','Vow Band',4,'might','choiceLock','strike',{drawback:'resistance'}),
 T('ribbon','Fleet Ribbon',4,'speed','choiceLock','wind',{drawback:'defense'}),
 T('primal','Primal Totem',4,'might','physicalEdge','strike',{requires:{types:['Beast','Monstrosity']}}),
 T('seed','Restoring Fruit',5,null,'healBerry','heal',{consumable:true}),
 T('nectar','Soul Nectar',5,null,'resourceBerry','resources',{consumable:true}),
 T('herb','Purifying Herb',5,null,'cleanseBerry','cleanse',{consumable:true}),
 T('pearl','Warding Pearl',5,null,'pinchWard','ward',{consumable:true}),
 T('pod','Resolute Pod',5,null,'pinchMight','might',{consumable:true}),
 T('crystal','Focusing Crystal',5,null,'pinchPower','focus',{consumable:true})
];
const ACTIVE={
 strike:['Echo Strike','Physical',55,null,'opponent'],pierce:['Sundering Arc','Physical',60,'breakWard','opponent'],bolt:['Prismatic Pulse','Energy',55,null,'opponent'],
 wind:['Gale Sweep','Energy',40,'slow','allOpponents'],flame:['Kindled Ray','Energy',60,'burn','opponent'],ward:['Sheltering Light','Status',0,'ward','ally'],
 reflect:['Iron Reflection','Status',0,'reflect','self'],screen:['Luminous Screen','Status',0,'lightscreen','self'],cleanse:['Purifying Chime','Status',0,'cleanse','ally'],
 heal:['Restoring Draught','Status',0,'heal','ally'],resources:['Soul Replenishment','Status',0,'itemResources','ally'],clearHazards:['Trail Clearing','Status',0,'clearHazards','self'],
 focus:['Gathered Focus','Status',0,'focus','self'],regenerate:['Patient Renewal','Status',0,'regenerate','ally'],retreat:['Returning Step','Status',0,'batonPass','self'],
 weather:['Weather Rite','Status',0,'weatherRain','field'],might:['Battle Resolve','Status',0,'boostMight','self']
};
export function generateHeldItem(seed,options={}){
 const r=itemRng(seed),level=Math.max(1,Math.min(100,Number(options.level)||1)),roll=r()*100;
 let rarity=options.rarity||(roll<Math.max(1,level/35)?'Relic':roll<8+level/12?'Epic':roll<27+level/7?'Rare':roll<62?'Uncommon':'Common');
 if(!ITEM_RARITIES.includes(rarity))rarity='Common';
 const templates=ITEM_TEMPLATES.filter(t=>(!options.category||t.category===options.category)&&(rarity!=='Relic'||!t.consumable||options.templateId===t.id)&&(!options.eligibleFor||canEquipHeldItem({requires:t.requires},options.eligibleFor).ok));
 const template=ITEM_TEMPLATES.find(t=>t.id===options.templateId)||choose(templates.length?templates:ITEM_TEMPLATES,r),tier=ITEM_RARITIES.indexOf(rarity),potency=[5,8,11,14,17][tier]+Math.floor(r()*3);
 const domain=canonicalDomain(template.domain)||choose(DOMAINS,r),stats=template.stat?{[template.stat]:potency}:{};
 if(template.hook==='choiceLock'&&template.stat)stats[template.stat]=25+tier*2;if(template.drawback)stats[template.drawback]=-5-Math.floor(tier/2);
 const hookList=[template.hook];if(!template.consumable&&(rarity==='Relic'||tier>=2&&r()<.45)){const secondary=choose(['accuracy','statusGuard','survive','regenerator','screens','resourceSustain'].filter(h=>!hookList.includes(h)),r);hookList.push(secondary);if(rarity!=='Relic'&&template.stat)stats[template.stat]=Math.max(5,stats[template.stat]-2);}
 const [abilityName,category,power,effect,target]=ACTIVE[template.active],active={id:'item-'+itemHash(seed).toString(36)+'-ability',name:abilityName,category,kind:category==='Physical'?'physical':category==='Energy'?'spiritual':'status',power:power?Math.min(95,power+tier*5):0,effect,type:options.eligibleFor?.base||'Construct',domain,target,accuracy:.95,speed:0,baseUses:0};
 normalizeMoveDomains(active);if(template.domain)active.element=String(template.domain).toLowerCase();
 if(template.active==='weather'){active.effect=choose(['weatherRain','weatherSun','weatherSand','weatherSnow'],r);active.name={weatherRain:'Rain Rite',weatherSun:'Sun Rite',weatherSand:'Sand Rite',weatherSnow:'Snow Rite'}[active.effect];}
 const material=choose(['Amber','Jade','Moonstone','Bronze','Willow','Obsidian','Silver','Pearl','Cloudglass','Dawnsteel'],r),epithet=choose(['of the Quiet Road','of Returning Dawn','of the Last Lantern','of Wandering Stars','of the Hidden Spring','of the First Oath'],r);
 const name=rarity==='Relic'?choose(['Covenant','Inheritance','Testament','Echo'],r)+' of '+choose(['the Unfallen','the Lost Sealer','the Silver Pilgrim','the First Flame','the Sleeping Sky'],r)+' '+itemHash(seed,'name').toString(36).slice(0,3).toUpperCase():material+' '+template.name+(tier>=2?' '+epithet:'');
 return {id:'held-v1-'+itemHash(seed,template.id,rarity,level).toString(36),generatorVersion:1,seed:String(seed),templateId:template.id,name,category:template.category,rarity,level,recovery:[.25,.30,.35,.40,.50][tier],resourceRecovery:[6,8,10,12,16][tier],stageRecovery:[1,1,2,2,3][tier],stats,hooks:hookList,active,cooldown:template.consumable?0:Math.max(2,4-Math.floor(tier/2)),consumable:!!template.consumable,requires:template.requires?{...template.requires,...(template.requires.domains?{domains:canonicalDomains(template.requires.domains)}:{})}:null,domain,cost:Math.round((template.consumable?28:65)*(1+tier*.75)),source:options.source||'Discovered',lore:rarity==='Relic'?'An unfamiliar sigil rests beneath its surface, preserving the story of a Sealer whose name has slipped from memory.':'Fine '+material.toLowerCase()+' markings trace a quiet pattern around the '+template.name.toLowerCase()+'.'};
}
export function canEquipHeldItem(item,sp){
 if(!item)return {ok:false,reason:'Unknown Held Item.'};const req=item.requires;if(!req)return {ok:true};if(!sp)return {ok:false,reason:'Choose a Spirimon.'};
 const typeRequirements=(req.types||[]).filter(t=>t!=='Humanoid');
 const required=[...(req.capabilities||[]),...((req.types||[]).includes('Humanoid')?['equipment']:[])];
 if(typeRequirements.length&&!typeRequirements.some(t=>[sp.base,sp.alter].includes(t)))return {ok:false,reason:'Requires '+typeRequirements.join(' or ')+' as either creature type.'};
 if(required.some(key=>!sp.capabilities?.[key]?.available))return {ok:false,reason:'Requires verified grasping anatomy for this equipment.'};
 if(req.domains?.length&&!req.domains.some(d=>canonicalDomains(sp.domains).includes(canonicalDomain(d))))return {ok:false,reason:'Requires the '+req.domains.join(' or ')+' Magical Domain.'};return {ok:true};
}
export function heldEquipment(ind,sp=null){if(sp)sp=individualSpecies(sp,ind);const item=ind?.heldItem||equipment(ind?.heldCharm);return item&&(!sp||ind.legacyEquipmentIds?.includes(item.id)||canEquipHeldItem(item,sp).ok)?item:null;}
export function itemHasHook(item,hook){return !!item&&(item.hook===hook||item.hooks?.includes(hook));}
export function itemOnceUsed(ind,hook){return ind.heldItem?!!ind.itemFlags?.[ind.heldItem.id+':'+hook]:!!ind.itemTriggered;}
export function markItemUsed(ind,hook){if(ind.heldItem){ind.itemFlags??={};ind.itemFlags[ind.heldItem.id+':'+hook]=true;}else ind.itemTriggered=true;}
export function consumeHeldItem(ind){const item=heldEquipment(ind);if(!item)return null;ind.consumedCharm=item.id;delete ind.heldItem;delete ind.heldCharm;return item;}
export function heldItemDescription(item){
 if(!item)return 'No Held Item.';if(!item.generatorVersion)return item.desc;
 const hooks={healBerry:'Consumed at one-third HP to restore '+Math.round((item.recovery||1/3)*100)+'% maximum HP',resourceBerry:'Consumed when pools are low to restore '+(item.resourceRecovery||10)+' to each pool',physicalEdge:'Physical damage +15%',energyGuard:'Energy damage received −15%',critical:'Critical-hit chance +12.5 percentage points',domainBoost:item.domain+' damage +20%',choiceLock:'First selected move is locked until switching',leftovers:'Recover 1/16 HP at round end',resourceSustain:'Restore 1 Stanima and 1 Willpower every six seconds',pinchWard:'Consumed below one-third HP to raise a ward',pinchMight:'Consumed below one-third HP to raise Might by '+(item.stageRecovery||1)+' stage(s)',pinchPower:'Consumed below one-third HP to gather focus'};
 const parts=Object.entries(item.stats||{}).map(([stat,value])=>stat+' '+(value>0?'+':'')+value+'%');
 for(const hook of item.hooks||[])parts.push(hooks[hook]||CHARMS.find(c=>c.hook===hook)?.desc||hook);
 if(item.active)parts.push('Bag: '+item.active.name+(item.active.effect==='heal'?' · restores '+Math.round((item.recovery||.25)*100)+'% HP':'')+(item.active.power?' · Power '+item.active.power:'')+' · '+(item.consumable?'consumed permanently':'uses normal move resources; '+(item.cooldown*2)+'-second cooldown'));
 const activeEffects={breakWard:'breaks wards and defensive screens',slow:'may slow its targets',burn:'may burn its target',ward:'blocks the next attack',reflect:'protects the whole side from Physical damage',lightscreen:'protects the whole side from Energy damage',cleanse:'cleanses major and volatile afflictions',clearHazards:'clears your side’s entry hazards',focus:'empowers the next damaging attack',regenerate:'restores vitality over subsequent rounds',batonPass:'switches freely between rounds and transfers combat stages',boostMight:'raises Might',itemResources:'restores '+(item.resourceRecovery||10)+' to each shared pool',weatherRain:'summons rain',weatherSun:'summons sunlight',weatherSand:'summons sand',weatherSnow:'summons snow'};if(item.active){parts.push('Ability: '+item.active.category+'; '+({self:'self',ally:'one ally',opponent:'one opponent',allOpponents:'both opponents',allAllies:'all allies',field:'battlefield'}[item.active.target]||'target'));if(activeEffects[item.active.effect])parts.push(activeEffects[item.active.effect]);}
 return parts.map(part=>String(part).replace(/[.\s]+$/,'')).filter(Boolean).join('. ')+'.';
}
export function heldItemActivation(ind,sp){
 const item=heldEquipment(ind,sp);if(!item)return {ok:false,reason:'No compatible Held Item is equipped.'};if(!item.active)return {ok:false,reason:'This item has automatic effects only.'};if(ind.itemMoveLock&&itemHasHook(item,'choiceLock')&&ind.itemMoveLock!==item.active.id)return {ok:false,reason:'This equipment locks the selected move until switching.'};if(ind.conditions?.taunt&&item.active.category==='Status')return {ok:false,reason:'Support abilities are silenced.'};if(ind.conditions?.disable&&ind.disabledMove===item.active.id)return {ok:false,reason:'This ability is disabled.'};const resource=item.active.category==='Physical'?'pp':'willpower',other=resource==='pp'?'willpower':'pp';if(!item.consumable&&(ind[resource]||0)<=0&&(ind[other]||0)<2)return {ok:false,reason:'Not enough Stanima or Willpower to activate this ability.'};
 if(ind.hp<=0)return {ok:false,reason:'A fainted Spirimon cannot activate an item.'};if(ind.pendingMove||ind.lockedMove)return {ok:false,reason:'Finish the committed technique before activating an item.'};if((ind.itemCooldowns?.[item.id]||0)>0)return {ok:false,reason:'Ready in '+ind.itemCooldowns[item.id]+' round(s).'};
 return {ok:true,item,move:{...item.active,type:sp.base,itemRecovery:item.recovery},consumable:item.consumable,cooldown:item.cooldown};
}
export function heldItemState(save){
 const state=save.heldItems??={version:1,inventory:{},claims:{},shops:{}};state.inventory??={};state.claims??={};state.shops??={};
 if(!state.legacyMigrated){for(const [id,count]of Object.entries(save.adventure?.charms||{})){const item=equipment(id);if(item&&count>0)addHeldItem(state,item,count);save.adventure.charms[id]=0;}state.legacyMigrated=true;}return state;
}
export function addHeldItem(state,item,count=1){if(!item?.id||!Number.isInteger(count)||count<=0)return false;const record=state.inventory[item.id]??={item:structuredClone(item),count:0};record.count+=count;return true;}
export function awardHeldItem(state,seed,eventId,options={}){if(state.claims[eventId])return null;const item=generateHeldItem(seed,options);state.claims[eventId]=item.id;addHeldItem(state,item);return item;}
export function equipOwnedHeldItem(ind,id,state,sp){
 if(heldEquipment(ind)?.id===id)return {ok:true};const record=id?state.inventory[id]:null;if(id&&(!record||record.count<1))return {ok:false,reason:'Item not owned.'};const valid=id?canEquipHeldItem(record.item,sp):{ok:true};if(!valid.ok)return valid;
 const old=heldEquipment(ind);if(old?.id===id)return {ok:true};if(old)addHeldItem(state,old);delete ind.heldItem;delete ind.heldCharm;
 if(record){record.count--;if(record.item.generatorVersion)ind.heldItem=structuredClone(record.item);else ind.heldCharm=record.item.id;}delete ind.itemCooldowns;return {ok:true};
}
export function heldShop(state,worldSeed,regionKey,rank=1,specialist='general'){
 const key=regionKey+'|'+specialist+'|'+Math.max(1,rank);if(state.shops[key])return state.shops[key];const category={forge:ITEM_CATEGORIES[0],herbalist:ITEM_CATEGORIES[5],archive:ITEM_CATEGORIES[2]}[specialist];
 const offers=Array.from({length:8},(_,n)=>{const item=generateHeldItem(worldSeed+'|shop|'+key+'|'+n,{level:Math.min(90,rank*12),rarity:n===7&&rank>=4?'Epic':n%3===0?'Rare':n%2?'Uncommon':'Common',category,source:specialist+' merchant in '+regionKey});return {item,remaining:item.consumable?3:1};});state.shops[key]=offers;return offers;
}
export function buyHeldItem(state,offers,id,purse){const offer=offers.find(o=>o.item.id===id);if(!offer||offer.remaining<1)return {ok:false,reason:'This offer is sold out.'};if(purse.coins<offer.item.cost)return {ok:false,reason:'Not enough Coin.'};purse.coins-=offer.item.cost;offer.remaining--;addHeldItem(state,offer.item);return {ok:true,item:offer.item};}
export function sellHeldItem(state,id,purse){if(state.favorites?.includes(id))return {ok:false,reason:'Unfavorite this item before selling it.'};const record=state.inventory[id];if(!record||record.count<1)return {ok:false,reason:'No unequipped copy to sell.'};record.count--;const value=Math.max(1,Math.floor((record.item.cost||50)*.35));purse.coins+=value;return {ok:true,value};}

// Imported item snapshots are validated before replacing an existing world.
export function validateHeldItems(save){
 const state=save.heldItems;if(state)for(const key of ['inventory','claims','shops'])if(!state[key]||typeof state[key]!=='object'||Array.isArray(state[key]))throw Error('Invalid Held Item save structure.');if(state&&state.version!==1)throw Error('Unsupported Held Item save version.');
 const valid=item=>{
  if(!item?.generatorVersion){if(!equipment(item?.id))throw Error('Unknown legacy Held Item.');return;}
  if(item.generatorVersion!==1||!/^held-v1-[a-z0-9]+$/.test(item.id)||!ITEM_RARITIES.includes(item.rarity)||!ITEM_CATEGORIES.includes(item.category)||typeof item.name!=='string'||item.name.length>160)throw Error('Invalid Held Item identity.');
  const hooks=new Set([...CHARMS.map(c=>c.hook).filter(Boolean),'physicalEdge','energyGuard','critical','domainBoost','choiceLock','leftovers','resourceSustain','pinchWard','pinchMight','pinchPower']);
  if(!Array.isArray(item.hooks)||item.hooks.length>2||item.hooks.some(h=>!hooks.has(h)))throw Error('Invalid Held Item effects.');
  for(const [stat,value]of Object.entries(item.stats||{}))if(!['hp','might','power','defense','resistance','speed'].includes(stat)||!Number.isFinite(value)||value< -30||value>35)throw Error('Invalid Held Item stat modifier.');
  const m=item.active,allowed=new Set([...Object.values(ACTIVE).map(v=>v[3]),'weatherSun','weatherSand','weatherSnow']);
  if(!m||!['Physical','Energy','Status'].includes(m.category)||!Number.isFinite(m.power)||m.power<0||m.power>95||!allowed.has(m.effect)||!Number.isFinite(m.speed)||Math.abs(m.speed)>100||!Number.isFinite(m.accuracy)||m.accuracy<0||m.accuracy>1||!['self','ally','allAllies','opponent','allOpponents','field'].includes(m.target))throw Error('Invalid Held Item ability.');
  if(typeof item.consumable!=='boolean')throw Error('Invalid Held Item consumption rule.');if(!Number.isInteger(item.cost)||item.cost<1||item.cost>10000||!Number.isInteger(item.cooldown)||item.cooldown<0||item.cooldown>8||item.recovery!=null&&(!Number.isFinite(item.recovery)||item.recovery<0||item.recovery>1)||item.resourceRecovery!=null&&(!Number.isFinite(item.resourceRecovery)||item.resourceRecovery<0||item.resourceRecovery>20))throw Error('Invalid Held Item values.');
  for(const list of [item.requires?.types,item.requires?.domains,item.requires?.capabilities])if(list!=null&&(!Array.isArray(list)||list.length>36||list.some(v=>typeof v!=='string')))throw Error('Invalid equipment requirement.');
 };
 if(state){for(const [id,record]of Object.entries(state.inventory||{})){if(record.item?.id!==id)throw Error('Mismatched Held Item inventory identity.');if(!Number.isInteger(record.count)||record.count<0||record.count>999999)throw Error('Invalid Held Item inventory count.');valid(record.item);}for(const offers of Object.values(state.shops||{})){if(!Array.isArray(offers))throw Error('Invalid Held Item merchant.');for(const offer of offers){valid(offer.item);if(!Number.isInteger(offer.remaining)||offer.remaining<0||offer.remaining>99)throw Error('Invalid merchant stock.');}}}
 for(const ind of [...(save.spirits||[]),...(save.battle?.multi?.enemies||[]),...(save.battle?.multi?.reserves||[]),...(save.battle?.enemy?[save.battle.enemy]:[])])if(ind.heldItem)valid(ind.heldItem);
 return true;
}
