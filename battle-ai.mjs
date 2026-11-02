import {moveTiming,scaledMove} from './realtime-moves.mjs';
import * as E from './engine.mjs';
import {hasHook,heldEquipment,heldItemActivation,generateHeldItem} from './equipment.mjs';

// Decision tree -> legal candidates -> scored outcomes. It uses current public
// battle state, never the player's submitted action or an AI network service.
const ratio=(u,sp)=>u.hp/Math.max(1,E.stats(u,sp).hp);
const choices=(u,sp)=>u.pendingMove?[u.pendingMove]:u.lockedMove?[u.lockedMove]:E.equippedMoves(u,sp).filter(m=>E.canUseMove(u,sp,m));
export function expectedDamage(actor,asp,target,tsp,move,style='normal',commit=.55){
 if(!move?.power)return 0;
 const copy={...actor,commit},hits=move.effect==='multiHit'?3:move.effect==='doubleHit'?2:1;
 let damage=E.damage(copy,asp,target,tsp,move,style,()=>.5)*hits;
 const f=actor.battlefield||{};if(f.weather==='rain'&&move.domain==='Water'||f.weather==='sun'&&move.domain==='Fire')damage*=1.5;if(f.weather==='rain'&&move.domain==='Fire'||f.weather==='sun'&&move.domain==='Water')damage*=.5;
 if(move.effect==='hexStrike'&&target.status||move.effect==='venomStrike'&&['poison','toxic'].includes(target.status))damage*=1.5;
 if(move.effect==='sleepStrike'&&target.status!=='sleep')return 0;
 if(move.effect==='counter'||move.effect==='mirrorCoat')return actor.lastHit?.source===target.id?actor.lastHit.amount*2:0;
 if(target.ward&&!['breakWard','struggle'].includes(move.effect))return 0;
 return damage*E.hitChance(actor,target,move,style,asp);
}
function incomingThreat(actor,asp,opponents,speciesOf){return opponents.reduce((sum,u)=>sum+Math.max(0,...choices(u,speciesOf(u)).map(m=>expectedDamage(u,speciesOf(u),actor,asp,m))),0);}
export function replacementScore(candidate,opponents,speciesOf){
 const sp=speciesOf(candidate),max=E.stats(candidate,sp).hp,offense=Math.max(0,...opponents.flatMap(t=>choices(candidate,sp).map(m=>expectedDamage(candidate,sp,t,speciesOf(t),m)/Math.max(1,t.hp)))),threat=incomingThreat(candidate,sp,opponents,speciesOf)/Math.max(1,candidate.hp);
 const field=opponents[0]?.battlefield,side=candidate.battleSide||'b',hazards=field?.sides?.[side]?.hazards||{},entry=hasHook(candidate,'boots')?0:(hazards.spikes||0)/8+(hazards.stealthRock?1/8:0);
 return offense*45-threat*35+candidate.hp/max*20-entry*100;
}
export function chooseReplacement(reserves,opponents,speciesOf){return reserves.filter(u=>u.hp>0).sort((a,b)=>replacementScore(b,opponents,speciesOf)-replacementScore(a,opponents,speciesOf)||a.id.localeCompare(b.id))[0]||null;}
function supportScore(actor,asp,target,tsp,move,context){
 const effect=move.effect,hp=E.stats(target,tsp).hp,missing=hp-target.hp,threat=incomingThreat(actor,asp,context.opponents,context.speciesOf),screens=actor.battlefield?.sides?.[actor.battleSide]?.screens||{};
 if(['heal','fullheal','rest'].includes(effect)){if(missing<=0)return -100;return Math.min(missing,hp*(effect==='heal'?(move.itemRecovery||.25):1))/hp*100+(ratio(target,tsp)<.4?35:0)-(effect==='rest'?18:0);}
 if(effect==='itemResources'){const caps=E.stats(target,tsp),missing=Math.max(0,caps.pp-(target.pp||0))+Math.max(0,caps.willpower-(target.willpower||0));return missing?Math.min(60,missing)+((target.pp||0)+(target.willpower||0)<3?40:0):-100;}
 if(effect==='cleanse')return target.status?55:Object.keys(target.conditions||{}).length?30:-80;
 if(effect==='teamHeal')return context.allies.reduce((sum,u)=>sum+(1-ratio(u,context.speciesOf(u)))*45,0);
 if(effect==='teamWard')return context.allies.filter(u=>!u.ward).length*24;
 if(effect==='partyCleanse')return context.team.reduce((sum,u)=>sum+(u.status?40:0)+Object.keys(u.conditions||{}).length*8,0)-10;
 if(effect==='ward'||effect==='protect')return target.ward?-90:threat/Math.max(1,actor.hp)*45+(actor.status&&['poison','toxic','burn'].includes(actor.status)?-20:0)-8;
 if(effect==='reflect'||effect==='lightscreen'||effect==='safeguard')return screens[effect]?-90:25+context.allies.length*7;
 if(effect==='auroraVeil')return actor.battlefield?.weather!=='snow'?-100:screens.reflect&&screens.lightscreen?-80:55;
 if(effect==='regenerate')return target.conditions?.regenerate?-80:missing/hp*30+12;
 if(effect==='focus')return actor.focused?-100:18;
 if(effect==='bellyDrum')return actor.hp<hp*.65||actor.stages?.might>=6?-100:threat<actor.hp/3?45:-30;
 if(effect==='batonPass')return context.reserves.length&&Object.values(actor.stages||{}).some(n=>n>0)?32:-80;
 if(effect==='destinyBond')return ratio(actor,asp)<.3&&threat>=actor.hp?65:-45;
 if(effect?.startsWith('boost')){const key={boostMight:'might',boostPower:'power',boostDefense:'defense',boostResistance:'resistance',boostSpeed:'speed',boostAccuracy:'accuracy',boostEvasion:'evasion'}[effect],stage=actor.stages?.[key]||0;return stage>=6?-100:20-stage*8-(threat>actor.hp*.5?35:0);}
 return 0;
}
function effectScore(actor,asp,target,tsp,move,context){
 const e=move.effect,field=actor.battlefield||{},conditions=target.conditions||{},h=field.sides?.[target.battleSide]?.hazards||{};
 if(context.realTime&&['sleep','freeze','flinch'].includes(e)&&(target.controlImmuneUntil||0)>(actor.realtimeNow||0))return -100;
 if(E.STATUS_EFFECTS.includes(e))return target.status&&['poison','toxic','burn','sleep','paralysis','freeze','frostbite'].includes(e)||conditions[e]?-60:e==='perish'&&context.reserves.length===0?-15:e==='disable'&&!target.lastMove?-80:e==='nightmare'&&target.status!=='sleep'?-80:24;
 if(e?.startsWith('lower'))return 18;
 if(['spikes','toxicSpikes','stealthRock','stickyWeb'].includes(e))return context.enemyReserves.length?18+context.enemyReserves.length*5-(h[e]||0)*20:-80;
 if(e==='clearHazards')return Object.values(field.sides?.[actor.battleSide]?.hazards||{}).some(Boolean)?45:-100;
 if(e?.startsWith('weather')){const kind=e.slice(7).toLowerCase();if(field.weather===kind)return -100;return E.equippedMoves(actor,asp).some(m=>kind==='rain'&&m.domain==='Water'||kind==='sun'&&m.domain==='Fire'||kind==='snow'&&m.effect==='auroraVeil')?30:8;}
 if(e?.startsWith('terrain')&&move.power===0){const kind=e.slice(7).toLowerCase();if(field.terrain===kind)return -100;return context.allies.length>1?24:15;}
 if(e==='haze')return Object.values(target.stages||{}).reduce((n,x)=>n+Math.max(0,x),0)*16-Object.values(actor.stages||{}).reduce((n,x)=>n+Math.max(0,x),0)*16-10;
 if(e==='invertStats')return Object.values(target.stages||{}).reduce((n,x)=>n+x,0)*12-Object.values(actor.stages||{}).reduce((n,x)=>n+x,0)*12-10;
 if(e==='swapStats')return Object.values(target.stages||{}).reduce((n,x)=>n+x,0)*10-Object.values(actor.stages||{}).reduce((n,x)=>n+x,0)*10-10;
 if(e==='forceSwitch')return context.enemyReserves.length?(Object.values(target.stages||{}).some(n=>n>0)?30:8):-10;
 if(e==='counter'||e==='mirrorCoat'){const category=e==='counter'?'Physical':'Energy';const predicted=Math.max(0,...choices(target,tsp).filter(m=>E.moveCategory(m)===category).map(m=>expectedDamage(target,tsp,actor,asp,m)));return predicted?Math.min(60,predicted*2/Math.max(1,target.hp)*100):-60;}
 if(e==='pivot')return context.reserves.length&&ratio(actor,asp)<.4?20:-8;
 return e==='drain'&&ratio(actor,asp)<.7?20:e==='recharge'?-22:e==='twoTurn'?-14:e==='delayedStrike'?-12:e==='recoil'?-8:0;
}
export function chooseBattleAction(actor,context,r=Math.random){
 const {speciesOf,opponents}=context,asp=speciesOf(actor),team=context.team||[actor],allies=context.allies||[actor],reserves=context.reserves||[],enemyReserves=context.enemyReserves||[];
 context={...context,team,allies,reserves,enemyReserves};const threat=incomingThreat(actor,asp,opponents,speciesOf),hpRatio=ratio(actor,asp);
 const branch=actor.pendingMove?'release':hpRatio<.35?'survive':opponents.some(t=>ratio(t,speciesOf(t))<.3)?'finish':'develop';
 const moves=choices(actor,asp).filter(m=>!context.realTime||(['self','ally','allAllies'].includes(E.moveTarget(m))?allies:opponents).some(t=>E.canUseMove(actor,asp,m,speciesOf(t)))),usable=moves.length?moves:[{...E.STRUGGLE,type:asp.base}],candidates=[];
 const activation=heldItemActivation(actor,asp),sources=usable.filter(move=>!context.canUse||context.canUse({move,type:'move'})).map(move=>({move,type:'move'}));if(activation.ok&&(activation.consumable||E.canUseMove(actor,asp,activation.move))&&(!context.canUse||context.canUse({type:'heldItem',move:activation.move})))sources.push({move:activation.move,type:'heldItem',itemId:activation.item.id});
 for(const source of sources){const {move}=source;const kind=E.moveTarget(move),friendly=['ally','self','allAllies'].includes(kind),targets=kind==='ally'?allies:kind==='self'||kind==='allAllies'?[actor]:opponents;
  for(const target of targets){if(target.hp<=0||context.realTime&&move.id!=='struggle'&&!source.itemId&&!E.canUseMove(actor,asp,move,speciesOf(target)))continue;const tsp=speciesOf(target),targetIndex=(friendly?allies:opponents).indexOf(target);
   for(const style of source.type==='heldItem'?['normal']:['normal','agile','strong']){const commit=branch==='survive'?.35:branch==='finish'?.7:.55,expected=expectedDamage(actor,asp,target,tsp,context.realTime?scaledMove(move,actor,asp,style):move,style,commit),support=friendly?supportScore(actor,asp,target,tsp,move,context):0;
    let score=move.power?Math.min(expected,target.hp)/Math.max(1,E.stats(target,tsp).hp)*100:support;
    if(!friendly)score+=effectScore(actor,asp,target,tsp,move,context);
    if(expected>=target.hp&&move.power){score+=65;if(E.priority(actor,asp,move,style)>E.stats(target,tsp).speed)score+=22;}
    if(move.power&&expected===0&&!['counter','mirrorCoat'].includes(move.effect))score-=20;
    if(move.target==='allOpponents')score+=opponents.filter(t=>t!==target).reduce((sum,t)=>sum+expectedDamage(actor,asp,t,speciesOf(t),move,style,commit)/Math.max(1,E.stats(t,speciesOf(t)).hp)*70,0);
    if(branch==='survive'&&friendly&&['heal','fullheal','ward','protect'].includes(move.effect))score+=20;
    score-=(context.claimedDamage?.[target.id]||0)>=target.hp?70:0;
    if(style==='strong'&&threat>=actor.hp)score-=20;if(style==='agile'&&move.power===0)score-=2;
    const borrow=source.type!=='heldItem'&&!friendly&&move.power>0&&expected<target.hp&&expected*2>=target.hp&&threat<actor.hp*.7&&Math.max(actor.pp||0,actor.willpower||0)>4?1:0;
    if(context.realTime)score/=Math.max(1,moveTiming(move,actor,asp,style).cooldownMs/1000)**.6;
    candidates.push({...source,move,style,commit,borrow:context.realTime?0:borrow,targetIndex:Math.max(0,targetIndex),score:score+(borrow?8:0),reason:branch});
   }
  }
 }
 if(!actor.pendingMove&&!actor.lockedMove&&!actor.conditions?.trap&&reserves.length&&(!context.canUse||context.canUse({type:'switch'}))){const incoming=chooseReplacement(reserves,opponents,speciesOf);if(incoming){const difference=replacementScore(incoming,opponents,speciesOf)-replacementScore(actor,opponents,speciesOf),score=(hpRatio<.3&&threat>=actor.hp?70:0)+difference*.7-20;candidates.push({type:'switch',switchId:incoming.id,score,reason:'preserve and counter'});}}
 candidates.sort((a,b)=>b.score-a.score);const best=candidates[0];if(!best&&context.realTime)return null;if(!best)return {move:{...E.STRUGGLE,type:asp.base},style:'normal',commit:.5,borrow:0,targetIndex:0,reason:'exhausted'};
 const tied=candidates.filter(c=>Math.abs(c.score-best.score)<.01);return {...tied[Math.min(tied.length-1,Math.floor(r()*tied.length))]};
}
export function chooseTeamOrders(allies,opponents,speciesOf,options={},r=Math.random){const claimedDamage={},reserved=new Set();return allies.map(actor=>{const choice=chooseBattleAction(actor,{speciesOf,opponents,allies,team:options.team||allies,reserves:(options.reserves||[]).filter(u=>!reserved.has(u.id)),enemyReserves:options.enemyReserves||[],claimedDamage},r);if(choice.switchId)reserved.add(choice.switchId);else if(choice.move?.power){const t=opponents[choice.targetIndex];if(t)claimedDamage[t.id]=(claimedDamage[t.id]||0)+expectedDamage(actor,speciesOf(actor),t,speciesOf(t),choice.move,choice.style,choice.commit);}return choice;});}

// Build coherent, reproducible trainer loadouts instead of giving every opponent
// the same four starting techniques. Wild creatures retain their natural builds.
export function prepareOpponent(ind,sp,rank=1,r=Math.random){
 if(ind.npcPrepared)return ind;ind.npcPrepared=true;
 const learned=E.availableTechniques(ind,sp),attacks=learned.filter(m=>m.power>0).sort((a,b)=>b.power-a.power),support=learned.filter(m=>E.moveCategory(m)==='Status');
 const selected=[];const add=m=>{if(m&&!selected.some(x=>x.id===m.id))selected.push(m);};
 add(attacks.find(m=>m.target==='allOpponents')||attacks[0]);
 add(support.find(m=>['heal','regenerate','reflect','lightscreen','ward'].includes(m.effect)));
 add(attacks.find(m=>E.moveCategory(m)!==E.moveCategory(selected[0]||{})&&m.domain!==selected[0]?.domain)||attacks[1]);
 add(support.find(m=>['poison','burn','paralysis','boostSpeed','boostMight','boostPower','spikes','weatherRain'].includes(m.effect)));
 for(const m of E.equippedMoves(ind,sp))add(m);ind.moveIds=selected.slice(0,4).map(m=>m.id);
 if(ind.level>=12&&!heldEquipment(ind)){ind.heldItem=generateHeldItem(ind.id+'|trainer-item',{level:ind.level,rarity:rank>=4?'Epic':rank>=2?'Rare':'Uncommon',eligibleFor:sp,source:'Trainer equipment'});}
 if(ind.level>=25&&!ind.aspect)ind.aspect=['Primal','Astral','Titan','Swift'][Math.min(3,Math.floor(r()*4))];
 E.heal(ind,sp);return ind;
}
