import {writeFile} from 'node:fs/promises';
import {allMoveTemplates,moveBaseValue} from '../moves.mjs';
import {MOVE_LEVEL_THRESHOLDS,moveTiming,STATUS_RULES} from '../realtime-moves.mjs';
import {MOVE_CATALOG,STRUGGLE} from '../engine.mjs';
const catalog=[...new Map([...allMoveTemplates(),...MOVE_CATALOG,STRUGGLE].map(m=>[m.id,m])).values()];
const quote=value=>'"'+String(value??'').replaceAll('"','""')+'"';
const columns=['id','name','category','type','domain','effect','role','accuracy','expected_hits','cooldown_seconds_at_level_50','cast_seconds_at_level_50','recovery_seconds_at_level_50','resource_contribution','base_effect_duration_seconds',...MOVE_LEVEL_THRESHOLDS.map(n=>'power_at_level_'+n)];
const rows=[columns];
for(const m of catalog){const effect=m.effect||'',p=moveTiming(m,{level:50},{speed:40}),role=STATUS_RULES[effect]?.control?'control':m.power?(['counter','mirrorCoat','sleepStrike','hexStrike','venomStrike','weatherStrike','sunStrike','terrainStrike','snowStrike','sandStrike','unburdened','revenge'].includes(effect)?'conditional damage':m.target==='allOpponents'?'spread damage':m.power>=90?'burst damage':'quick or sustained damage'):/heal|rest|regenerate|cleanse/i.test(effect)?'recovery':/^weather|^terrain/.test(effect)?'battlefield setup':'support or disruption';
 rows.push([m.id,m.name,m.category||(m.power?m.kind==='physical'?'Physical':'Energy':'Status'),m.type,m.domain,effect,role,p.accuracy,m.effect==='multiHit'?3.5:m.effect==='doubleHit'?2:1,(p.cooldownMs/1000).toFixed(3),(p.castMs/1000).toFixed(3),(p.recoveryMs/1000).toFixed(3),moveBaseValue(m),(STATUS_RULES[effect]?.duration||0)/1000,...MOVE_LEVEL_THRESHOLDS.map(level=>moveTiming(m,{level},{speed:40}).power)]);
}
await writeFile(new URL('../docs/move-balance-audit.csv',import.meta.url),rows.map(row=>row.map(quote).join(',')).join('\n')+'\n');
console.log('Audited '+catalog.length+' Move templates at '+MOVE_LEVEL_THRESHOLDS.length+' level thresholds.');
