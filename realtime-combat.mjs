import * as E from './engine.mjs';
import * as SE from './spiritual-energy.mjs';
import {bondEfficiency,clamp,spiritualBonus} from './spiritual-core.mjs';
import {supportFits,supportDescription} from './support-techniques.mjs';
import {heldEquipment,heldItemActivation,hasHook} from './equipment.mjs';
import {moveTiming,scaledMove,STATUS_RULES} from './realtime-moves.mjs';
import {passiveEffects} from './classification-passives.mjs';
import {statusDuration,periodicDamage,rebaseStatusTimer} from './classification-status.mjs';
export {moveTiming,STATUS_RULES};
export const EFFECT_PULSE_MS=2000;
const timedFields={ward:6000,reflect:10000,lightscreen:10000,safeguard:10000,focused:8000};
const name=(u,sp)=>sp.forms[u.appearance]||sp.forms[0];
export function createRealTimeState(now=0){return {version:2,elapsedMs:now,nextPulseAt:now+EFFECT_PULSE_MS,paused:false,units:{},fieldTimers:{},sequence:0,actionCount:0};}
export function migrateRealTimeState(legacy,now,units=[]){
 if(legacy?.version===2)return legacy;const state=createRealTimeState(now);if(!legacy)return state;
 const shift=at=>now+Math.max(0,(at||0)-(legacy.elapsedMs||0));state.paused=!!legacy.paused;
 for(const u of units){const old=legacy.units?.[u.id];if(!old)continue;const clock=unitClock(state,u);clock.readyAt=shift(old.readyAt);clock.gcdReadyAt=shift(old.readyAt);
  for(const [id,at]of Object.entries(old.cooldowns||{}))clock.cooldowns[id]=shift(at);
  if(old.pending)clock.pending={...old.pending,resolveAt:shift(old.pending.resolveAt)};
  clock.status=old.status?{...old.status,until:shift(old.status.until)}:null;clock.conditions=Object.fromEntries(Object.entries(old.conditions||{}).map(([k,v])=>[k,shift(v)]));clock.buffs=Object.fromEntries(Object.entries(old.buffs||{}).map(([k,v])=>[k,shift(v)]));clock.controlImmuneUntil=shift(old.controlImmuneUntil);
 }
 state.fieldTimers=Object.fromEntries(Object.entries(legacy.fieldTimers||{}).map(([k,v])=>[k,{...v,until:shift(v.until)}]));return state;
}
export function unitClock(state,ind){const c=state.units[ind.id]??={readyAt:ind.animationReadyAt||0,gcdReadyAt:ind.gcdReadyAt||0,cooldowns:{},pending:null,conditions:{},buffs:{},status:null,itemReadyAt:ind.itemReadyAt||0,controlImmuneUntil:0,aiAt:state.elapsedMs+400};c.gcdReadyAt??=0;ind.moveCooldowns??={};if(c.cooldowns!==ind.moveCooldowns){for(const [id,at]of Object.entries(c.cooldowns))ind.moveCooldowns[id]=Math.max(ind.moveCooldowns[id]||0,at);c.cooldowns=ind.moveCooldowns;}return c;}
function allUnits(context){return [...new Map([...context.teams.a,...context.teams.b].map(u=>[u.id,u])).values()];}
function activeUnits(context){return [...context.active.a,...context.active.b].filter(u=>u?.hp>0);}
function sideOf(context,ind){return context.active.a.some(u=>u.id===ind.id)?'a':context.active.b.some(u=>u.id===ind.id)?'b':null;}
export function synchronizeTimers(state,context){
 const now=state.elapsedMs;
 E.bindBattlefield(context.teams.a,context.teams.b);
 for(const u of allUnits(context)){
  const clock=unitClock(state,u);const side=context.teams.a.includes(u)?'a':'b';SE.setExhaustion(u,context.sealers?.[side]);u.realtimeNow=now;u.controlImmuneUntil=clock.controlImmuneUntil;
  const species=context.speciesOf(u);u.maxHp=E.stats(u,species).hp;delete u.acquiredDomains;clock.conditionMeta??={};
  if(clock.status?.effect===u.status&&clock.status?.appliedAt!=null)clock.status=rebaseStatusTimer(clock.status,now,u.status,species,u);
  if(u.status){if(clock.status?.effect!==u.status){const rule=STATUS_RULES[u.status];const saved=u.afflictions?.status?.effect===u.status?u.afflictions.status:null;clock.status=rebaseStatusTimer({effect:u.status,appliedAt:now-(saved?.elapsedMs||0),baseDuration:saved?.baseDuration??(rule?.duration||12000)*(context.durationScale||1),durationFactor:saved?.durationFactor??1},now,u.status,species,u);if(rule?.control){clock.controlImmuneUntil=clock.status.until+4000;if(clock.pending){clock.interrupted=clock.pending.choice.move?.name||'action';clock.pending=null;}}}}
  else{clock.status=null;if(u.afflictions)u.afflictions.status=null;}
  for(const [effect,rule]of Object.entries(STATUS_RULES)){
   if(u.conditions?.[effect]){
    const fresh=!clock.conditions[effect],saved=u.afflictions?.conditions?.[effect];
    if(!clock.conditionMeta[effect])clock.conditionMeta[effect]={effect,appliedAt:now-(fresh?saved?.elapsedMs||0:0),baseDuration:fresh?saved?.baseDuration??rule.duration*(context.durationScale||1):Math.max(0,clock.conditions[effect]-now),durationFactor:saved?.durationFactor??1};
    clock.conditionMeta[effect]=rebaseStatusTimer(clock.conditionMeta[effect],now,effect,species,u);clock.conditions[effect]=clock.conditionMeta[effect].until;
    if(fresh&&rule.control){clock.controlImmuneUntil=Math.max(clock.controlImmuneUntil,clock.conditions[effect]+4000);if(clock.pending){clock.interrupted=clock.pending.choice.move?.name||'action';clock.pending=null;}}
   }else{delete clock.conditions[effect];delete clock.conditionMeta[effect];if(u.afflictions?.conditions)delete u.afflictions.conditions[effect];}
  }
  for(const [field,duration]of Object.entries(timedFields)){if(u[field])clock.buffs[field]??=now+duration;else delete clock.buffs[field];}
  if(u.delayedDamage&&!clock.delayedAt)clock.delayedAt=now+4000;if(!u.delayedDamage)delete clock.delayedAt;
  if(u.itemCooldowns&&Object.keys(u.itemCooldowns).length&&clock.itemReadyAt<=now)clock.itemReadyAt=now+Math.max(...Object.values(u.itemCooldowns))*EFFECT_PULSE_MS;
 }
 const field=context.active.a[0]?.battlefield||context.active.b[0]?.battlefield;
 if(field){for(const key of ['weather','terrain']){const value=field[key];if(value){if(key==='weather'&&field.ambientWeather===value&&field.weatherTurns==null){delete state.fieldTimers[key];continue;}if(state.fieldTimers[key]?.value!==value)state.fieldTimers[key]={value,until:now+(field[key+'Turns']||5)*EFFECT_PULSE_MS};}else delete state.fieldTimers[key];}
 for(const side of ['a','b'])for(const key of ['reflect','lightscreen','safeguard']){const timerKey=side+'-'+key;if(field.sides?.[side]?.screens?.[key])state.fieldTimers[timerKey]??={value:key,until:now+field.sides[side].screens[key]*EFFECT_PULSE_MS};else delete state.fieldTimers[timerKey];}}
}
export function statusBadges(state,ind){const clock=unitClock(state,ind),now=state.elapsedMs;return [clock.status,...Object.entries(clock.conditions).map(([effect,until])=>({effect,until})),...(ind.spiritualBuffs||[]).map(b=>({effect:'support-'+(b.kind==='guard'&&b.amount<0?'exposed':b.kind),until:b.until})),...(ind.spiritualShields||[]).filter(b=>b.hp>0).map(b=>({effect:'shield',until:b.until}))].filter(s=>s&&s.until>now).map(s=>({effect:s.effect,label:STATUS_RULES[s.effect]?.label||({shield:'Shielded','support-haste':'Quickened','support-guard':'Protected','support-empower':'Resonating','support-immunity':'Sanctuary','support-exposed':'Exposed'}[s.effect]||s.effect),remainingMs:s.until-now}));}
export function actionAvailability(state,actor,sp,choice={},targetSp=null){
 const clock=unitClock(state,actor),now=state.elapsedMs;
 if(state.paused)return {ok:false,reason:'Battle paused',remainingMs:0};if(actor.hp<=0)return {ok:false,reason:'Fainted',remainingMs:0};
 const locked=statusBadges(state,actor).find(s=>STATUS_RULES[s.effect]?.control);if(locked)return {ok:false,reason:locked.label,remainingMs:locked.remainingMs};
 const requested=choice.cooldownKey||choice.move?.id;if(choice.move&&choice.type!=='heldItem'&&((actor.lockedMove&&requested!=='struggle'&&E.canUseMove(actor,sp,actor.lockedMove,targetSp)&&actor.lockedMove.id!==requested)||(actor.pendingMove&&actor.pendingMove.id!==requested)))return {ok:false,reason:'This Spirimon is committed to another Move',remainingMs:0};
 if(clock.pending)return {ok:false,reason:'Casting',remainingMs:Math.max(0,clock.pending.resolveAt-now)};
 if(clock.readyAt>now)return {ok:false,reason:'Animation lock',remainingMs:clock.readyAt-now};
 const p=choice.move?moveTiming(choice.move,actor,sp,choice.style):null;if((p?.timing==='gcd'||!p)&&clock.gcdReadyAt>now)return {ok:false,reason:'GCD',remainingMs:clock.gcdReadyAt-now};
 if(choice.type==='heldItem'&&clock.itemReadyAt>now)return {ok:false,reason:'Item cooldown',remainingMs:clock.itemReadyAt-now};
 const key=choice.cooldownKey||choice.move?.id,remaining=(clock.cooldowns[key]||0)-now;if(remaining>0)return {ok:false,reason:'Move cooldown',remainingMs:remaining};
 if(choice.move&&choice.type!=='heldItem'&&choice.move.id!=='struggle'&&!E.canUseMove(actor,sp,choice.move,targetSp))return {ok:false,reason:'Unavailable or insufficient resources',remainingMs:0};
 if(choice.move?.id==='struggle'&&targetSp&&E.equippedMoves(actor,sp).some(m=>E.canUseMove(actor,sp,m,targetSp)))return {ok:false,reason:'An equipped Move can still be funded',remainingMs:0};
 return {ok:true,remainingMs:0};
}
export function scheduleAction(state,context,actor,choice){
 synchronizeTimers(state,context);const side=sideOf(context,actor);if(!side)return {ok:false,reason:'This Spirimon is not active'};
 if(context.rules?.noItems&&['item','heldItem'].includes(choice.type))return {ok:false,reason:'Items are restricted in this challenge'};
 const sp=context.speciesOf(actor),check=actionAvailability(state,actor,sp,choice);if(!check.ok)return check;
 if(!choice.type)choice={...choice,type:'move'};
 let move=choice.move;
 if(choice.type==='heldItem'){const item=heldItemActivation(actor,sp);if(!item.ok)return item;move=item.move;choice={...choice,move,itemId:item.item.id};}
 if(choice.type==='move'){
  const known=E.equippedMoves(actor,sp),valid=known.find(m=>m.id===move?.id||choice.cooldownKey===m.id);
  if(!valid&&move?.id!=='struggle'&&!actor.pendingMove&&!actor.lockedMove)return {ok:false,reason:'Move is not equipped'};
  if(actor.itemMoveLock&&actor.itemMoveLock!==move.id&&hasHook(actor,'choiceLock',sp))return {ok:false,reason:'Equipment locks the previous Move'};
 }
 if(choice.type==='switch'){
  if(Object.values(state.units).some(c=>c.pending?.side===side&&c.pending?.choice?.type==='switch'&&c.pending.choice.switchId===choice.switchId))return {ok:false,reason:'That reserve is already entering'};
  if(actor.conditions?.trap&&!choice.forced)return {ok:false,reason:'Binding prevents switching'};
  const incoming=context.teams[side].find(u=>u.id===choice.switchId&&u.hp>0);if(!incoming||context.active[side].some(u=>u.id===incoming.id))return {ok:false,reason:'No healthy reserve selected'};
 }
 if(choice.type==='switch'){const incoming=context.teams[side].find(u=>u.id===choice.switchId),q=context.sealers?.[side];if(q&&q.energy<SE.manifestationCost(q,incoming,context.speciesOf(incoming)))return {ok:false,reason:'Not enough Spiritual Energy to release this Spirimon.'};}
 const profile=move?moveTiming(move,actor,sp,choice.style):{timing:'gcd',castMs:350,gcdMs:3500,cooldownMs:3500,localCooldownMs:0,animationLockMs:550,recoveryMs:550};
 const clock=unitClock(state,actor),key=choice.cooldownKey||move?.id||choice.type;
 const friendlyAction=['item','support','switch'].includes(choice.type)||move&&['self','ally','allAllies'].includes(E.moveTarget(move));
 const targetSide=friendlyAction?side:side==='a'?'b':'a';
 const target=E.moveTarget(move||{})==='self'?actor:context.active[targetSide][choice.targetIndex||0];
 const targetSp=target?context.speciesOf(target):null,spreadPressure=move&&E.moveTarget(move)==='allOpponents'&&context.active[targetSide].some(u=>u.hp>0&&context.speciesOf(u).ability==='Pressure');
 const fundedCheck=actionAvailability(state,actor,sp,{...choice,move},spreadPressure?{ability:'Pressure'}:targetSp);if(!fundedCheck.ok)return fundedCheck;

 choice={...choice,extraMoves:choice.type==='move'?Math.max(0,Math.min(2,Math.floor(Number(choice.extraMoves)||0))):0};
 clock.pending={choice:{...choice,move},resolveAt:state.elapsedMs+profile.castMs,side,targetId:target?.id,targetSide,sequence:state.sequence++};
 if(profile.localCooldownMs)clock.cooldowns[key]=state.elapsedMs+profile.localCooldownMs;if(profile.timing==='gcd')clock.gcdReadyAt=state.elapsedMs+profile.gcdMs;clock.readyAt=state.elapsedMs+profile.animationLockMs;actor.gcdReadyAt=clock.gcdReadyAt;actor.animationReadyAt=clock.readyAt;
 return {ok:true,profile};
}
function expireTimers(state,context,log){
 const now=state.elapsedMs,field=context.active.a[0]?.battlefield||context.active.b[0]?.battlefield;
 for(const u of allUnits(context)){const c=unitClock(state,u);if(c.status&&c.status.until<=now){if(u.status===c.status.effect){log.push(name(u,context.speciesOf(u))+' recovers from '+c.status.effect+'.');u.status=null;u.statusTurns=0;}c.status=null;}
 for(const [effect,until]of Object.entries(c.conditions))if(until<=now){if(effect==='perish'&&u.conditions?.perish){u.hp=0;log.push(name(u,context.speciesOf(u))+' falls to the doom omen.');}else if(u.conditions?.[effect])log.push(name(u,context.speciesOf(u))+' recovers from '+effect+'.');delete u.conditions?.[effect];delete c.conditions[effect];delete c.conditionMeta?.[effect];}
 for(const [key,until]of Object.entries(c.buffs))if(until<=now){u[key]=false;delete c.buffs[key];}
 if(c.delayedAt&&c.delayedAt<=now){u.hp=Math.max(0,u.hp-(u.delayedDamage?.amount||0));delete u.delayedDamage;delete c.delayedAt;log.push(name(u,context.speciesOf(u))+' is struck by delayed energy.');}
 if(c.itemReadyAt<=now)u.itemCooldowns={};u.controlImmuneUntil=c.controlImmuneUntil;
 }
 for(const [key,timer]of Object.entries(state.fieldTimers))if(timer.until<=now){if(key==='weather'||key==='terrain'){if(field?.[key]===timer.value){field[key]=key==='weather'?field.ambientWeather||null:null;if(key==='weather')delete field.weatherTurns;}}else{const [side,effect]=key.split('-');if(field?.sides?.[side])delete field.sides[side].screens[effect];}delete state.fieldTimers[key];}
}
function pulseEffects(state,context,log){
 const live=activeUnits(context);
 for(const u of live){const sp=context.speciesOf(u),max=E.stats(u,sp).hp,c=u.conditions||{},field=u.battlefield||{};let loss=0;
 if(['poison','burn','frostbite'].includes(u.status))loss+=periodicDamage(max/32,u.status,sp,u);
 if(u.status==='toxic'){u.toxicTurns=(u.toxicTurns||0)+1;loss+=periodicDamage(max*Math.min(6,u.toxicTurns)/96,'toxic',sp,u);}
 if(c.leechSeed){const amount=periodicDamage(max/32,'leechSeed',sp,u);loss+=amount;const source=live.find(a=>a.id===u.conditionSources?.leechSeed);if(source)source.hp=Math.min(E.stats(source,context.speciesOf(source)).hp,source.hp+Math.min(amount,u.hp));}
 if(c.curse)loss+=periodicDamage(max/48,'curse',sp,u);if(c.trap)loss+=periodicDamage(max/48,'trap',sp,u);if(c.nightmare&&u.status==='sleep')loss+=periodicDamage(max/24,'nightmare',sp,u);
 const domains=E.activeDomains(sp,u);if(u.aspect!=='Stormbound'&&(field.weather==='snow'&&!domains.includes('Ice')||field.weather==='sand'&&![sp.base,sp.alter].some(t=>['Construct','Giant','Elemental'].includes(t))&&!domains.some(d=>['Earth','Metal'].includes(d))))loss+=Math.max(1,Math.floor(max/32));
 if(loss){u.hp=Math.max(0,u.hp-loss);log.push(name(u,sp)+' suffers '+loss+' ongoing damage.');}
 if(u.hp>0){const healing=(passiveEffects(sp,u,{maxHp:max,weather:field.weather}).regeneration||0)+(c.regenerate?(1-(u.spiritualEnergyEmpty?.value||0))/20:0)+(field.terrain==='grass'?1/48:0)+(u.aspect==='Verdant'&&field.terrain==='grass'?1/32:0)+(hasHook(u,'leftovers',sp)?1/32:0);if(healing)u.hp=Math.min(max,u.hp+Math.max(1,Math.floor(max*healing)));
 u.itemRounds=(u.itemRounds||0)+1;if(hasHook(u,'resourceSustain',sp)&&u.itemRounds%3===0){const caps=E.resourceMaximums(u,sp);u.pp=Math.min(caps.pp,(u.pp||0)+1);u.willpower=Math.min(caps.willpower,(u.willpower||0)+1);}
 if(sp.ability==='Second Wind'&&!u.secondWindUsed&&u.hp<max*.3){u.hp=Math.min(max,u.hp+Math.floor(max*.15));u.secondWindUsed=true;}
 E.refreshCombatEquipment(u,sp,log);
 }
 }
}
function resolvePending(state,context,actor,clock,log,events,r){
 const pending=clock.pending;clock.pending=null;clock.readyAt=Math.max(clock.readyAt,state.elapsedMs+450);actor.animationReadyAt=clock.readyAt;const {choice,side}=pending,sp=context.speciesOf(actor),before=actor.hp;
 if(!context.active[side].some(u=>u.id===actor.id)||actor.hp<=0)return;
 if(statusBadges(state,actor).some(s=>STATUS_RULES[s.effect]?.control)){log.push(name(actor,sp)+' is interrupted.');return;}
 const other=side==='a'?'b':'a',allies=context.active[side],opponents=context.active[other];
 let target=[...allies,...opponents].find(u=>u.id===pending.targetId&&u.hp>0);
 if(!target)target=(pending.targetSide===side?allies:opponents).find(u=>u.hp>0);if(!target)return;
 const ctx={realTime:true,speciesOf:context.speciesOf,actorTeam:context.teams[side],alliedActive:allies,targetActive:opponents,activeUnits:activeUnits(context),targetTeam:context.teams[other],funded:false};
 if(actor.lastHit&&state.elapsedMs-(actor.lastHit.at??state.elapsedMs)>8000)actor.lastHit=null;
 if(choice.type==='switch'){
  const incoming=context.teams[side].find(u=>u.id===choice.switchId&&u.hp>0),index=allies.findIndex(u=>u.id===actor.id);if(!incoming||allies.includes(incoming))return;
  const q=context.sealers?.[side],cost=q?SE.manifestationCost(q,incoming,context.speciesOf(incoming)):0;if(q&&q.energy<cost){log.push('Insufficient Spiritual Energy to complete the release.');return;}const result=E.switchUnits(actor,incoming,context.speciesOf(incoming),{outSpecies:sp,forced:choice.forced});if(result.ok&&q)SE.spendEnergy(q,cost);log.push(...result.log);if(result.ok){allies[index]=incoming;const entry=unitClock(state,incoming);entry.readyAt=Math.max(entry.readyAt,state.elapsedMs+1800);entry.pending=null;}
 }else if(choice.type==='item'){
  const key=choice.item==='tonic'?'tonics':'ethers',inventory=context.inventory?.[side];if(!inventory?.[key]){log.push('No supplies remaining.');return;}
  const caps=E.stats(target,context.speciesOf(target));if(choice.item==='tonic'){if(target.hp>=caps.hp)return;target.hp=Math.min(caps.hp,target.hp+Math.ceil(caps.hp/2));}else{if(target.pp>=caps.pp&&target.willpower>=caps.willpower)return;target.pp=Math.min(caps.pp,(target.pp||0)+Math.ceil(caps.pp*.6));target.willpower=Math.min(caps.willpower,(target.willpower||0)+Math.ceil(caps.willpower*.6));}
  inventory[key]--;log.push(name(actor,sp)+' uses '+(key==='tonics'?'a tonic.':'a soul draught.'));
 }else if(choice.type==='support'){actor.ward=true;actor.wardTurns=3;log.push('The Sealer raises a ward.');}
 else{
  const move=scaledMove(choice.move,actor,sp,choice.style);if(choice.type!=='heldItem'&&move.id!=='struggle'&&!E.canUseMove(actor,sp,move,context.speciesOf(target))){log.push(name(actor,sp)+' cannot complete the technique.');return;}ctx.healingFraction=move.realTimeProfile.healingFraction;ctx.friendly=['self','ally','allAllies'].includes(E.moveTarget(move));
  actor.realtimeNow=state.elapsedMs;
  if(choice.type==='heldItem'){ctx.moveOverride=move;const result=E.resolveHeldItemAction(actor,sp,target,context.speciesOf(target),{...choice,commit:choice.commit},r,ctx);log.push(...result.log);if(result.ok){clock.itemReadyAt=state.elapsedMs+(heldEquipment(actor)?.cooldown||4)*EFFECT_PULSE_MS;actor.itemReadyAt=clock.itemReadyAt;}}
  else{
   const targets=E.moveTarget(move)==='allOpponents'?opponents.filter(u=>u.hp>0):[target];ctx.pressure=targets.some(u=>context.speciesOf(u).ability==='Pressure');
   for(let n=0;n<targets.length;n++){const victim=targets[n],hp=victim.hp;log.push(...E.executeAction(actor,sp,victim,context.speciesOf(victim),move,choice.style||'normal',choice.commit??.5,r,1,n?{...ctx,prepaid:true}:ctx));if(victim.lastHit&&victim.hp<hp)victim.lastHit.at=state.elapsedMs;if(n===0&&!ctx.funded)break;}
  }
  // Repeat the selected Move immediately; each additional use pays its normal resource cost.
  // The existing Move cooldown and GCD are charged once for the entire committed sequence.
  const repeats=Math.max(0,Math.min(2,choice.extraMoves||0));
  if(choice.type==='move'&&ctx.funded&&repeats){
   for(let repeat=0;repeat<repeats;repeat++){
    if(actor.hp<=0||!context.active[side].includes(actor))break;
    const victims=E.moveTarget(move)==='allOpponents'?opponents.filter(u=>u.hp>0):[target].filter(u=>u.hp>0);
    if(!victims.length)break;
    if(move.id!=='struggle'&&!E.canUseMove(actor,sp,move,context.speciesOf(victims[0])))break;
    for(let n=0;n<victims.length;n++){
     const victim=victims[n],hp=victim.hp,repeatCtx={...ctx,funded:false,prepaid:n>0,pressure:ctx.pressure};
     log.push(...E.executeAction(actor,sp,victim,context.speciesOf(victim),move,choice.style||'normal',choice.commit??0,r,1,repeatCtx));
     if(victim.lastHit&&victim.hp<hp)victim.lastHit.at=state.elapsedMs;
     if(n===0&&!repeatCtx.funded)break;
    }
    events.push({actor:actor.id,target:target.id,side,move,at:state.elapsedMs+repeat*55+55});
   }
   // Retaliation is free and ignores the ordinary GCD/LCD, but cannot act while incapacitated.
   // In multi-ally encounters only enemies currently targeting this Spirimon qualify.
   for(const enemy of opponents.filter(u=>u.hp>0)){
    const enemyClock=unitClock(state,enemy);
    const designated=enemyClock.pending?.targetId||enemy.targetId||enemy.preferredTargetId;
    if(designated&&designated!==actor.id)continue;
    if(!designated&&allies.filter(u=>u.hp>0).length!==1)continue;
    if(statusBadges(state,enemy).some(s=>STATUS_RULES[s.effect]?.control))continue;
    const enemySp=context.speciesOf(enemy),moves=E.equippedMoves(enemy,enemySp);
    const retaliate=moves.find(m=>m.id===enemy.lastMove)||moves.find(m=>E.canUseMove(enemy,enemySp,m,sp));
    if(!retaliate)continue;
    const freeMove=scaledMove(retaliate,enemy,enemySp,enemy.battleStyle||'normal');
    for(let counter=0;counter<2&&enemy.hp>0&&actor.hp>0;counter++){
     const counterCtx={...ctx,actorTeam:context.teams[other],alliedActive:opponents,targetActive:allies,targetTeam:context.teams[side],prepaid:true,funded:false,friendly:false,pressure:false};
     log.push(...E.executeAction(enemy,enemySp,actor,sp,freeMove,enemy.battleStyle||'normal',0,r,1,counterCtx));
     events.push({actor:enemy.id,target:actor.id,side:other,move:freeMove,at:state.elapsedMs+counter*55+120});
    }
   }
  }
  if(actor.recharging){clock.readyAt+=2000;delete actor.recharging;}
  if(choice.move?.omega&&ctx.funded)actor.omegaUsed=true;
  events.push({actor:actor.id,target:target.id,side,move,at:state.elapsedMs});
 }
 actor.tookDamageThisRound=false;if(actor.hp<before&&actor.hp<=0)clock.pending=null;
 if(choice.move&&ctx.funded){
  const effect=choice.move.effect,recipient=ctx.friendly?target:actor,c=unitClock(state,recipient);
  if(effect==='ward'||effect==='protect')c.buffs.ward=state.elapsedMs+(effect==='protect'?2500:6000)*moveTiming(choice.move,actor,sp,choice.style).durationScale;
  if(effect==='regenerate')c.conditions.regenerate=state.elapsedMs+10000*moveTiming(choice.move,actor,sp,choice.style).durationScale;
  const field=actor.battlefield;
  if(effect?.startsWith('weather')&&choice.move.power===0)state.fieldTimers.weather={value:field.weather,until:state.elapsedMs+(field.weatherTurns||5)*EFFECT_PULSE_MS*moveTiming(choice.move,actor,sp,choice.style).durationScale};
  if(effect?.startsWith('terrain')&&choice.move.power===0)state.fieldTimers.terrain={value:field.terrain,until:state.elapsedMs+(field.terrainTurns||5)*EFFECT_PULSE_MS*moveTiming(choice.move,actor,sp,choice.style).durationScale};
  for(const key of effect==='auroraVeil'?['reflect','lightscreen']:['reflect','lightscreen','safeguard'].includes(effect)?[effect]:[])state.fieldTimers[side+'-'+key]={value:key,until:state.elapsedMs+(field.sides?.[side]?.screens?.[key]||5)*EFFECT_PULSE_MS*moveTiming(choice.move,actor,sp,choice.style).durationScale};
 }
 if(actor.recallAfterCast){delete actor.recallAfterCast;const index=context.active[side].indexOf(actor);if(index>=0)context.active[side].splice(index,1);}
 state.actionCount++;synchronizeTimers(state,{...context,durationScale:choice.move?moveTiming(choice.move,actor,sp,choice.style).durationScale:1});
}
export function advanceRealTime(state,deltaMs,context,r=Math.random){
 const log=[],events=[];if(state.paused||!Number.isFinite(deltaMs)||deltaMs<=0)return {log,events};
 synchronizeTimers(state,context);for(const u of allUnits(context)){const clock=unitClock(state,u);if(clock.interrupted){log.push(name(u,context.speciesOf(u))+' is interrupted while casting '+clock.interrupted+'.');delete clock.interrupted;}}let remaining=Math.min(5000,deltaMs);
 while(remaining>0){const step=Math.min(50,remaining);state.elapsedMs+=step;remaining-=step;pauseSealedAfflictions(state,context,step);for(const side of ['a','b'])for(const u of [...context.active[side]])if(u.recallAfterCast&&!unitClock(state,u).pending){delete u.recallAfterCast;context.active[side]=context.active[side].filter(v=>v!==u);}expireTimers(state,context,log);
 const due=activeUnits(context).map(actor=>({actor,clock:unitClock(state,actor)})).filter(x=>x.clock.pending&&x.clock.pending.resolveAt<=state.elapsedMs).sort((a,b)=>a.clock.pending.resolveAt-b.clock.pending.resolveAt||a.clock.pending.sequence-b.clock.pending.sequence);
 for(const {actor,clock}of due)if(clock.pending)resolvePending(state,context,actor,clock,log,events,r);
 if(state.elapsedMs>=state.nextPulseAt){pulseEffects(state,context,log);state.nextPulseAt+=EFFECT_PULSE_MS;synchronizeTimers(state,context);}
 for(const side of ['a','b'])if(!context.active[side].some(u=>u.hp>0))state['undefended'+side]=(state['undefended'+side]||0)+step;else state['undefended'+side]=0;
 }
 return {log,events};
}

export function deploymentAvailability(state,context,side,ind){
 const team=context.teams[side],active=context.active[side].filter(u=>u.hp>0),q=context.sealers?.[side];
 if(state.paused)return {ok:false,reason:'Battle paused'};
 if(!team.includes(ind)||!ind||ind.hp<=0)return {ok:false,reason:'No healthy team member selected'};
 if(active.includes(ind))return {ok:false,reason:'Already manifested'};
 if(active.length>=(context.rules?.maxActive||3))return {ok:false,reason:'The active Spirimon limit has been reached'};
 const cost=q?SE.manifestationCost(q,ind,context.speciesOf(ind)):0;
 return {ok:!q||q.energy>=cost,cost,reason:q&&q.energy<cost?'Not enough Spiritual Energy':''};
}
export function deploySpirimon(state,context,side,ind){
 const check=deploymentAvailability(state,context,side,ind);if(!check.ok)return check;
 const q=context.sealers?.[side],field=context.active[side][0]?.battlefield||context.active[side==='a'?'b':'a'][0]?.battlefield;
 if(q&&!SE.spendEnergy(q,check.cost))return {ok:false,reason:'Not enough Spiritual Energy'};
 const from={id:'sealed-'+ind.id,hp:0,battlefield:field,battleSide:side},result=E.switchUnits(from,ind,context.speciesOf(ind),{forced:true});
 if(!result.ok){if(q)SE.restoreEnergy(q,check.cost);return {ok:false,reason:result.log.join(' ')};}
 context.active[side]=context.active[side].filter(u=>u.hp>0);context.active[side].push(ind);
 const clock=unitClock(state,ind);clock.pending=null;clock.readyAt=state.elapsedMs+650;SE.setExhaustion(ind,q);
 return {ok:true,cost:check.cost,log:result.log};
}
export function supportAvailability(state,context,side,techniqueId,recipientId){
 if(context.rules?.noSupport)return {ok:false,reason:'Support is restricted in this challenge'};
 const q=context.sealers?.[side],t=q?.known[techniqueId],u=context.teams[side].find(u=>u.id===recipientId);
 if(state.paused)return {ok:false,reason:'Battle paused'};if(!t||!u)return {ok:false,reason:'Select a learned technique and a team member'};
 if(!(q.assignments[u.id]||[]).includes(t.id)&&q.floating!==t.id)return {ok:false,reason:'Technique is not assigned to this Spirimon'};
 if(!supportFits(t,u,context.speciesOf(u),E.activeDomains(context.speciesOf(u),u)))return {ok:false,reason:'This Spirimon is not compatible'};
 const revive=t.effects.some(e=>e.kind==='revive');if(revive?u.hp>0:u.hp<=0||!context.active[side].includes(u))return {ok:false,reason:revive?'Choose a defeated team member':'The recipient must be manifested'};
 if((q.supportCooldowns[t.id]||0)>state.elapsedMs)return {ok:false,reason:'Shared technique cooldown',remainingMs:q.supportCooldowns[t.id]-state.elapsedMs};
 const targets=t.target==='team'?context.active[side].filter(u=>u.hp>0):[u];
 if(t.timing==='gcd'){const waiting=targets.reduce((m,v)=>Math.max(m,unitClock(state,v).gcdReadyAt-state.elapsedMs),0);if(waiting>0)return {ok:false,reason:'Every recipient GCD must be ready',remainingMs:waiting};}
 if(t.effects.some(e=>e.kind==='link')&&!context.active[side].some(v=>v!==u&&v.hp>0))return {ok:false,reason:'Damage sharing needs another manifested ally'};
 if(t.effects.some(e=>e.kind==='recall')&&u.conditions?.trap)return {ok:false,reason:'This binding prevents protected recall'};
 if(t.sacrifice?.kind==='hp'&&targets.some(v=>v.hp<=Math.ceil(E.stats(v,context.speciesOf(v)).hp*t.sacrifice.amount)))return {ok:false,reason:'Not enough HP to make this sacrifice safely'};
 const cost=Math.max(1,Math.ceil(t.energyCost*(1+(q.level-1)*.02)*bondEfficiency(u)));
 return {ok:q.energy>=cost,reason:q.energy<cost?'Not enough Spiritual Energy':'',cost,targets,technique:t,recipient:u};
}
export function usePlayerSupport(state,context,side,techniqueId,recipientId){
 const result=supportAvailability(state,context,side,techniqueId,recipientId);if(!result.ok)return result;
 const {technique:t,targets,recipient}=result,q=context.sealers[side],now=state.elapsedMs;
 if(!SE.spendEnergy(q,result.cost))return {ok:false,reason:'Not enough Spiritual Energy'};
 q.supportCooldowns[t.id]=now+t.cooldownMs;const log=[];
 for(const u of targets){const sp=context.speciesOf(u),max=E.stats(u,sp),clock=unitClock(state,u),efficiency=(1+Math.min(.1,(u.bond||0)/1000))*(1-SE.setExhaustion(u,q)),until=now+t.durationMs;
  if(t.timing==='gcd')clock.gcdReadyAt=now+moveTiming({id:'support-gcd',timing:'gcd',power:0},u,sp).gcdMs;u.gcdReadyAt=clock.gcdReadyAt;
  if(t.sacrifice?.kind==='hp')u.hp-=Math.ceil(max.hp*t.sacrifice.amount);
  if(t.sacrifice?.kind==='defense'){u.spiritualBuffs??=[];u.spiritualBuffs.push({kind:'guard',amount:-t.sacrifice.amount,until});}
  for(const effect of t.effects){const amount=effect.amount*efficiency;
   if(effect.kind==='heal')u.hp=Math.min(max.hp,u.hp+Math.ceil(max.hp*amount));
   if(effect.kind==='willpower')u.willpower=Math.min(max.willpower,(u.willpower||0)+Math.max(1,Math.ceil(max.willpower*amount)));
   if(effect.kind==='shield'){u.spiritualShields??=[];const existing=u.spiritualShields.filter(s=>s.until>now).reduce((n,s)=>n+s.hp,0);u.spiritualShields.push({hp:Math.max(0,Math.min(Math.ceil(max.hp*amount),Math.ceil(max.hp*.45)-existing)),until});}
   if(effect.kind==='cleanse'&&['poison','toxic','burn','freeze','frostbite','paralysis'].includes(u.status)){u.status=null;u.statusTurns=0;clock.status=null;}
   if(effect.kind==='calm'){
    if(clock.status?.effect==='sleep')shortenAffliction(clock.status,now,.4);
    for(const key of ['confusion','infatuation','nightmare','taunt','disable','flinch'])if(clock.conditions[key]){const timer=clock.conditionMeta[key];if(timer){shortenAffliction(timer,now,.4);clock.conditions[key]=timer.until;}else clock.conditions[key]=now+(clock.conditions[key]-now)*.4;}
   }
   if(['empower','haste','immunity','guard'].includes(effect.kind)){u.spiritualBuffs??=[];u.spiritualBuffs.push({kind:effect.kind,amount:Math.min(.3,amount),until,domain:effect.domain,category:effect.category});}
   if(effect.kind==='cooldown'){clock.gcdReadyAt=now+Math.max(0,clock.gcdReadyAt-now)*(1-Math.min(.5,amount));for(const key of Object.keys(clock.cooldowns))clock.cooldowns[key]=now+Math.max(0,clock.cooldowns[key]-now)*(1-Math.min(.5,amount));u.gcdReadyAt=clock.gcdReadyAt;}
   if(effect.kind==='link'){const partner=context.active[side].filter(v=>v!==u&&v.hp>0).sort((a,b)=>b.hp-a.hp)[0];if(partner){u.spiritualLinks??=[];u.spiritualLinks.push({partner:partner.id,amount:Math.min(.4,amount),until});}}
   if(effect.kind==='revive'){E.resetCombat(u);u.hp=Math.max(1,Math.floor(max.hp*amount));u.status=null;u.conditions={};delete u.afflictions;clock.pending=null;clock.status=null;clock.conditions={};log.push(name(u,sp)+' revives within its seal. Release it separately to fight.');}
   if(effect.kind==='recall'){
    if(clock.pending)u.recallAfterCast=true;
    else context.active[side]=context.active[side].filter(v=>v!==u);
   }
  }
 }
 synchronizeTimers(state,context);log.unshift('The Sealer uses '+t.name+' ('+result.cost+' Energy): '+supportDescription(t)+'.');
 return {ok:true,cost:result.cost,log,targets:targets.map(u=>u.id)};
}

function shortenAffliction(timer,now,factor){
 const elapsed=Math.max(0,now-timer.appliedAt),duration=Math.max(0,timer.until-timer.appliedAt),shortened=elapsed+Math.max(0,duration-elapsed)*factor;
 timer.durationFactor=(timer.durationFactor??1)*(duration?shortened/duration:1);timer.until=timer.appliedAt+shortened;
}
const PERSISTENT_CONDITIONS=new Set(['confusion','nightmare','trap','leechSeed','curse','slow','perish']);
export function preserveAfflictions(state,ind){
 const clock=unitClock(state,ind),snapshot=timer=>timer?{effect:timer.effect,elapsedMs:Math.max(0,state.elapsedMs-timer.appliedAt),baseDuration:timer.baseDuration,durationFactor:timer.durationFactor??1}:null;
 const conditions=Object.fromEntries(Object.entries(clock.conditionMeta||{}).filter(([effect])=>PERSISTENT_CONDITIONS.has(effect)&&ind.conditions?.[effect]).map(([effect,timer])=>[effect,snapshot(timer)]));
 ind.afflictions={status:ind.status?snapshot(clock.status):null,conditions,pulseMs:0};
 const values=Object.fromEntries(Object.keys(conditions).map(key=>[key,ind.conditions[key]])),sources={...ind.conditionSources},toxicTurns=ind.toxicTurns;
 E.resetCombat(ind);if(Object.keys(values).length){ind.conditions=values;ind.conditionSources=sources;}if(ind.status==='toxic')ind.toxicTurns=toxicTurns;
 return ind.afflictions;
}
export function advanceExplorationAfflictions(ind,sp,deltaMs){
 if(!ind||ind.hp<=0||!Number.isFinite(deltaMs)||deltaMs<=0)return {damage:0,expired:[]};
 const data=ind.afflictions??={status:null,conditions:{},pulseMs:0},expired=[],delta=Math.min(1000,deltaMs);data.conditions??={};
 ind.maxHp=E.stats(ind,sp).hp;
 if(ind.status&&data.status?.effect!==ind.status)data.status={effect:ind.status,elapsedMs:0,baseDuration:STATUS_RULES[ind.status]?.duration||12000,durationFactor:1};
 if(!ind.status)data.status=null;
 for(const effect of PERSISTENT_CONDITIONS)if(ind.conditions?.[effect]&&!data.conditions[effect])data.conditions[effect]={effect,elapsedMs:0,baseDuration:STATUS_RULES[effect].duration,durationFactor:1};
 const advance=(timer,effect)=>{timer.elapsedMs+=delta;return timer.elapsedMs>=statusDuration(timer.baseDuration,effect,sp,ind)*(timer.durationFactor??1);};
 if(data.status&&advance(data.status,ind.status)){expired.push(ind.status);ind.status=null;ind.statusTurns=0;data.status=null;}
 for(const [effect,timer]of Object.entries(data.conditions)){if(!ind.conditions?.[effect]||advance(timer,effect)){if(effect==='perish'&&ind.conditions?.perish)ind.hp=0;delete ind.conditions?.[effect];delete data.conditions[effect];expired.push(effect);}}
 data.pulseMs=(data.pulseMs||0)+delta;let damage=0;
 while(data.pulseMs>=EFFECT_PULSE_MS&&ind.hp>0){
  data.pulseMs-=EFFECT_PULSE_MS;const max=E.stats(ind,sp).hp;
  for(const effect of [ind.status,...Object.keys(ind.conditions||{}).filter(k=>ind.conditions[k])]){
   if(effect==='nightmare'&&ind.status!=='sleep')continue;
   const rates={burn:1/32,poison:1/32,frostbite:1/32,leechSeed:1/32,curse:1/48,trap:1/48,nightmare:1/24};
   const rate=effect==='toxic'?Math.min(6,ind.toxicTurns=(ind.toxicTurns||0)+1)/96:rates[effect];
   if(rate)damage+=periodicDamage(max*rate,effect,sp,ind);
  }
  const regen=passiveEffects(sp,ind,{maxHp:max,weather:ind.battlefield?.weather}).regeneration||0;
  ind.hp=Math.min(max,Math.max(0,ind.hp-damage)+(ind.hp>damage?Math.floor(max*regen):0));
 }
 return {damage,expired};
}

function pauseSealedAfflictions(state,context,step){
 const active=new Set(activeUnits(context).map(u=>u.id));
 for(const u of allUnits(context)){if(active.has(u.id))continue;const c=unitClock(state,u);
  if(c.status){c.status.appliedAt+=step;c.status.until+=step;}
  for(const [effect,timer]of Object.entries(c.conditionMeta||{})){timer.appliedAt+=step;timer.until+=step;c.conditions[effect]=timer.until;}
 }
}
