import {writeFile} from 'node:fs/promises';
import {allMoveTemplates,moveBaseValue,moveLore} from '../moves.mjs';
import {moveTiming,STATUS_RULES} from '../realtime-moves.mjs';
import * as E from '../engine.mjs';
import {expectedTechniqueHits} from '../technique-balance.mjs';
const levels=[1,2,3,5,10,16,36,60,100,200,1000];
const catalog=[...new Map([...allMoveTemplates(),...E.MOVE_CATALOG,E.STRUGGLE].map(m=>[m.id,m])).values()];
const sp={id:'reference',base:'Beast',alter:'Beast',domains:[],forms:['Reference'],health:55,might:55,defense:55,energyPower:55,resistance:55,speed:55,moves:[]};
const actor=level=>({level,form:0,appearance:0,nature:'Hardy',commit:.5,difficulty:'normal',difficultySide:'player',aspect:'Natural',ivs:Object.fromEntries(E.STAT_KEYS.map(k=>[k,15])),evs:{},hp:10000});
const quote=value=>'"'+String(value??'').replaceAll('"','""')+'"';
const columns=['id','name','category','type','domain','effect','role','old_power_per_hit','balanced_power_per_hit','expected_hits','expected_total_potency','accuracy','timing_class','gcd_seconds_at_level_50','local_cooldown_seconds_at_level_50','cast_seconds_at_level_50','resource_contribution','base_effect_duration_seconds','healing_fraction','effect_rules',...levels.map(n=>'reference_damage_percent_at_level_'+n)];
const rows=[columns];
for(const m of catalog){
 const effect=m.effect||'',p=moveTiming(m,actor(50),sp),hits=expectedTechniqueHits(m),role=STATUS_RULES[effect]?.control?'control':m.power?(['counter','mirrorCoat','sleepStrike','hexStrike','venomStrike','weatherStrike','sunStrike','terrainStrike','snowStrike','sandStrike','unburdened','revenge'].includes(effect)?'conditional damage':m.target==='allOpponents'?'spread damage':p.power*hits>=60?'burst damage':'quick or sustained damage'):/heal|rest|regenerate|cleanse/i.test(effect)?'recovery':/^weather|^terrain/.test(effect)?'battlefield setup':'support or disruption';
 rows.push([m.id,m.name,E.moveCategory(m),m.type,m.domain,effect,role,m.unbalancedPower,p.power,hits,(p.power*hits).toFixed(2),p.accuracy,p.timing,(p.gcdMs/1000).toFixed(3),(p.localCooldownMs/1000).toFixed(3),(p.castMs/1000).toFixed(3),moveBaseValue(m),(STATUS_RULES[effect]?.duration||0)/1000,p.healingFraction<1?p.healingFraction:'',moveLore(m).balanceText,...levels.map(level=>{
  if(!m.power)return '';const u=actor(level),reference={...m,type:'Beast',domain:undefined,domainTheme:undefined,element:undefined};
  return (100*E.damage(u,sp,u,sp,reference,'normal',()=>.5,true)*hits/E.stats(u,sp).hp).toFixed(2);
 })]);
}
await writeFile(new URL('../docs/move-balance-audit.csv',import.meta.url),rows.map(row=>row.map(quote).join(',')).join('\n')+'\n');
console.log('Audited '+catalog.length+' Technique templates at '+levels.length+' levels (1–1000). Reference damage assumes equal stats, neutral effectiveness, matching Type, Normal style, balanced commitment, no crit or conditional payoff.');
