import {spiritualHash,spiritualRandom,clamp} from './spiritual-core.mjs';
export const SUPPORT_EFFECTS={
 shield:{name:'Ward',work:85,gcd:false},heal:{name:'Mend',work:120,gcd:true},calm:{name:'Concord',work:65,gcd:false},willpower:{name:'Conduit',work:100,gcd:true},
 empower:{name:'Resonance',work:90,gcd:true},recall:{name:'Recall',work:90,gcd:false},cleanse:{name:'Purification',work:90,gcd:false},immunity:{name:'Sanctuary',work:100,gcd:false},
 haste:{name:'Quickening',work:100,gcd:true},cooldown:{name:'Reprise',work:160,gcd:true},link:{name:'Soulbridge',work:100,gcd:false},revive:{name:'Reawakening',work:260,gcd:true},guard:{name:'Mantle',work:90,gcd:false}
};
const COMPATIBLE={shield:['immunity','guard','calm'],heal:['cleanse','guard','calm'],calm:['immunity','shield'],willpower:['guard','calm'],empower:['haste','guard'],recall:['shield','cleanse'],cleanse:['immunity','heal'],immunity:['shield','guard'],haste:['empower','shield'],cooldown:['haste','guard'],link:['guard','shield'],revive:['guard','cleanse'],guard:['shield','immunity','calm']};
const PREFIX=['Amber','Jade','Silver','Verdant','Carmine','Azure','Ivory','Violet','Golden','Ashen','Opal','Moonlit','Dawn','Silent','Resolute','Harmonic'];
const SUFFIX=['Thread','Seal','Prayer','Accord','Weave','Vow','Circle','Invocation','Echo','Pattern','Sutra','Promise'];
export function generateSupport(seed,{level=1,primary=null,basic=false}={}){
 const r=spiritualRandom(seed),keys=Object.keys(SUPPORT_EFFECTS),kind=primary&&SUPPORT_EFFECTS[primary]?primary:keys[Math.floor(r()*keys.length)],tier=basic?0:clamp(Math.floor(level/15),0,5),potency=.85+r()*.3;
 const effects=[{kind,amount:Number(((kind==='revive'?.2:kind==='heal'?.18:kind==='willpower'?.16:kind==='shield'?.16:kind==='cooldown'?.2:kind==='link'?.25:.15)*potency*(1+tier*.06)).toFixed(4))}];
 if(!basic&&r()<.6){const pool=COMPATIBLE[kind],secondary=pool[Math.floor(r()*pool.length)];effects.push({kind:secondary,amount:Number((.065+r()*.04).toFixed(4))});if(tier>=2&&r()<.25){const third=pool.find(k=>!effects.some(e=>e.kind===k));if(third)effects.push({kind:third,amount:.06});}}
 const durationMs=Math.round((6000+r()*5000)*(1+tier*.05)),target=kind!=='recall'&&kind!=='link'&&kind!=='revive'&&!basic&&r()<.2?'team':'single';
 const sacrifice=!basic&&kind!=='revive'&&r()<.22?{kind:r()<.55?'hp':'defense',amount:r()<.5?.08:.12}:null;
 let work=effects.reduce((sum,e,n)=>sum+SUPPORT_EFFECTS[e.kind].work*(n?.55:1)*(e.amount/.16),0)*(target==='team'?2.15:1)*(1+(effects.length-1)*.18);
 if(effects.some(e=>['guard','immunity','empower','haste','link','shield'].includes(e.kind)))work*=.85+durationMs/35000;
 const cooldownMs=Math.round(clamp(work*175,8000,180000)/1000)*1000,energyCost=Math.max(target==='team'||kind==='revive'?10:3,Math.round(work/48*(sacrifice?.7:1)));
 let requires=null;if(!basic&&r()<.2){const pool=[{domain:['Spirit','Life','Metal','Nature','Psionic','War'][Math.floor(r()*6)]},{trait:['armor','wings','hands','psionic'][Math.floor(r()*4)]},{type:['Beast','Construct','Celestial','Elemental','Undead','Plant'][Math.floor(r()*6)]},{ability:['Steadfast','Wildheart','Soulweave','Second Wind','Pressure'][Math.floor(r()*5)]}];requires=pool[Math.floor(r()*pool.length)];}
 for(const effect of effects)if(effect.kind==='guard'&&!basic){if(r()<.45)effect.domain=['Fire','Water','Ice','Lightning','Spirit','Void','Nature','Metal'][Math.floor(r()*8)];else if(r()<.4)effect.category=r()<.5?'Physical':'Energy';}
 const canonical={version:1,effects,target,durationMs,cooldownMs,energyCost,sacrifice,requires,tier},id='support-'+spiritualHash(JSON.stringify(canonical)).toString(36),name=PREFIX[Math.floor(r()*PREFIX.length)]+' '+SUPPORT_EFFECTS[kind].name+' '+SUFFIX[Math.floor(r()*SUFFIX.length)];
 return {id,name,...canonical,timing:effects.some(e=>SUPPORT_EFFECTS[e.kind].gcd)?'gcd':'lcd',work:Math.round(work),source:basic?'Starting instruction':'Spiritual discovery'};
}
export function validateSupport(t){
 if(!t||!Array.isArray(t.effects)||t.effects.length<1||t.effects.length>3)return false;
 const kinds=t.effects.map(e=>e.kind);if(new Set(kinds).size!==kinds.length||!kinds.every(k=>k in SUPPORT_EFFECTS))return false;
 if(t.effects.some(e=>!Number.isFinite(e.amount)||e.amount<=0||e.amount>.6))return false;
 if(t.effects.slice(1).some(e=>!COMPATIBLE[kinds[0]].includes(e.kind)))return false;
 return Number.isFinite(t.energyCost)&&t.energyCost>=1&&t.energyCost<=100&&Number.isFinite(t.cooldownMs)&&t.cooldownMs>=8000&&t.cooldownMs<=180000&&['single','team'].includes(t.target)&&['gcd','lcd'].includes(t.timing);
}
export function supportFits(t,ind,sp,domains=sp.domains||[]){const req=t.requires;return !req||(!req.type||[sp.base,sp.alter].includes(req.type))&&(!req.domain||domains.includes(req.domain))&&(!req.trait||sp.anatomy?.traits?.includes(req.trait))&&(!req.ability||sp.ability===req.ability);}
export function startingSupport(seed){return ['shield','heal','calm','willpower','empower','recall','cleanse','guard','immunity'].map((primary,n)=>generateSupport(seed+'|starting|'+n,{primary,basic:true}));}
export function supportDescription(t){return t.effects.map(e=>({shield:'Shield '+Math.round(e.amount*100)+'% of maximum HP',heal:'Restore '+Math.round(e.amount*100)+'% HP',calm:'Shorten mental conditions and halve damage-induced cast delay',willpower:'Restore '+Math.round(e.amount*100)+'% Willpower',empower:'Strengthen offense and defense by '+Math.round(Math.min(.3,e.amount)*100)+'%',recall:'Protect withdrawal to the seal',cleanse:'Remove physical afflictions'+(t.empowermentExtra>=5?' and up to '+Math.floor(t.empowermentExtra/5)+' eligible mental or binding conditions':''),immunity:'Resist afflictions, interruption, cast pushback and explicit cooldown disruption',haste:'Accelerate casts and Technique cooldowns by '+Math.round(Math.min(.3,e.amount)*100)+'%',cooldown:'Reduce remaining Technique GCD/LCD timers by '+Math.round(Math.min(.5,e.amount)*100)+'%',link:'Share '+Math.round(Math.min(.4,e.amount)*100)+'% of incoming damage with another active ally',revive:'Revive within the seal at '+Math.round(e.amount*100)+'% HP',guard:'Reduce incoming damage by '+Math.round(Math.min(.3,e.amount)*100)+'%'})[e.kind]+(e.domain?' against '+e.domain:e.category?' against '+e.category:'' )).join('; ')+(t.target==='team'?' · All manifested allies':'')+(t.sacrifice?' · Sacrifice '+Math.round(t.sacrifice.amount*100)+'% '+t.sacrifice.kind:'');}
