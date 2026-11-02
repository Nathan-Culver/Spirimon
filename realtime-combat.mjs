import * as E from './engine.mjs';
import {heldEquipment,heldItemActivation,hasHook} from './equipment.mjs';
import {moveTiming,scaledMove,STATUS_RULES} from './realtime-moves.mjs';
export {moveTiming,STATUS_RULES};
export const EFFECT_PULSE_MS=2000;
const timedFields={ward:6000,reflect:10000,lightscreen:10000,safeguard:10000,focused:8000};
const name=(u,sp)=>sp.forms[u.appearance]||sp.forms[0];
export function createRealTimeState(){return {version:1,elapsedMs:0,nextPulseAt:EFFECT_PULSE_MS,paused:false,units:{},fieldTimers:{},sequence:0,actionCount:0};}
export function unitClock(state,ind){return state.units[ind.id]??={readyAt:0,cooldowns:{},pending:null,conditions:{},buffs:{},status:null,itemReadyAt:0,controlImmuneUntil:0,aiAt:400};}
function allUnits(context){return [...new Map([...context.teams.a,...context.teams.b].map(u=>[u.id,u])).values()];}
function activeUnits(context){return [...context.active.a,...context.active.b].filter(u=>u?.hp>0);}
function sideOf(context,ind){return context.active.a.some(u=>u.id===ind.id)?'a':context.active.b.some(u=>u.id===ind.id)?'b':null;}
export function synchronizeTimers(state,context){
 const now=state.elapsedMs;
 E.bindBattlefield(context.teams.a,context.teams.b);
 for(const u of allUnits(context)){
  const clock=unitClock(state,u);u.realtimeNow=now;u.controlImmuneUntil=clock.controlImmuneUntil;
  if(u.status){if(clock.status?.effect!==u.status){const rule=STATUS_RULES[u.status];clock.status={effect:u.status,until:now+(rule?.duration||12000)*(context.durationScale||1)};if(rule?.control){clock.controlImmuneUntil=clock.status.until+4000;if(clock.pending){clock.interrupted=clock.pending.choice.move?.name||'action';clock.pending=null;}}}}
  else clock.status=null;
  for(const [effect,rule]of Object.entries(STATUS_RULES)){if(u.conditions?.[effect]){if(!clock.conditions[effect]){clock.conditions[effect]=now+rule.duration*(context.durationScale||1);if(rule.control){clock.controlImmuneUntil=Math.max(clock.controlImmuneUntil,clock.conditions[effect]+4000);if(clock.pending){clock.interrupted=clock.pending.choice.move?.name||'action';clock.pending=null;}}}}else delete clock.conditions[effect];}
  for(const [field,duration]of Object.entries(timedFields)){if(u[field])clock.buffs[field]??=now+duration;else delete clock.buffs[field];}
  if(u.delayedDamage&&!clock.delayedAt)clock.delayedAt=now+4000;if(!u.delayedDamage)delete clock.delayedAt;
  if(u.itemCooldowns&&Object.keys(u.itemCooldowns).length&&clock.itemReadyAt<=now)clock.itemReadyAt=now+Math.max(...Object.values(u.itemCooldowns))*EFFECT_PULSE_MS;
 }
 const field=context.active.a[0]?.battlefield||context.active.b[0]?.battlefield;
 if(field){for(const key of ['weather','terrain']){const value=field[key];if(value){if(state.fieldTimers[key]?.value!==value)state.fieldTimers[key]={value,until:now+(field[key+'Turns']||5)*EFFECT_PULSE_MS};}else delete state.fieldTimers[key];}
 for(const side of ['a','b'])for(const key of ['reflect','lightscreen','safeguard']){const timerKey=side+'-'+key;if(field.sides?.[side]?.screens?.[key])state.fieldTimers[timerKey]??={value:key,until:now+field.sides[side].screens[key]*EFFECT_PULSE_MS};else delete state.fieldTimers[timerKey];}}
}
export function statusBadges(state,ind){const clock=unitClock(state,ind),now=state.elapsedMs;return [clock.status,...Object.entries(clock.conditions).map(([effect,until])=>({effect,until}))].filter(s=>s&&s.until>now).map(s=>({effect:s.effect,label:STATUS_RULES[s.effect]?.label||s.effect,remainingMs:s.until-now}));}
export function actionAvailability(state,actor,sp,choice={},targetSp=null){
 const clock=unitClock(state,actor),now=state.elapsedMs;
 if(state.paused)return {ok:false,reason:'Battle paused',remainingMs:0};if(actor.hp<=0)return {ok:false,reason:'Fainted',remainingMs:0};
 const locked=statusBadges(state,actor).find(s=>STATUS_RULES[s.effect]?.control);if(locked)return {ok:false,reason:locked.label,remainingMs:locked.remainingMs};
 if(clock.pending)return {ok:false,reason:'Casting',remainingMs:Math.max(0,clock.pending.resolveAt-now)};
 if(clock.readyAt>now)return {ok:false,reason:'Recovering',remainingMs:clock.readyAt-now};
 if(choice.type==='heldItem'&&clock.itemReadyAt>now)return {ok:false,reason:'Item cooldown',remainingMs:clock.itemReadyAt-now};
 const key=choice.cooldownKey||choice.move?.id,remaining=(clock.cooldowns[key]||0)-now;if(remaining>0)return {ok:false,reason:'Move cooldown',remainingMs:remaining};
 if(choice.move&&choice.type!=='heldItem'&&choice.move.id!=='struggle'&&!E.canUseMove(actor,sp,choice.move,targetSp))return {ok:false,reason:'Unavailable or insufficient resources',remainingMs:0};
 if(choice.move?.id==='struggle'&&targetSp&&E.equippedMoves(actor,sp).some(m=>E.canUseMove(actor,sp,m,targetSp)))return {ok:false,reason:'An equipped Move can still be funded',remainingMs:0};
 return {ok:true,remainingMs:0};
}
export function scheduleAction(state,context,actor,choice){
 synchronizeTimers(state,context);const side=sideOf(context,actor);if(!side)return {ok:false,reason:'This Spirimon is not active'};
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
 const profile=move?moveTiming(move,actor,sp,choice.style):{castMs:350,cooldownMs:3500,recoveryMs:2500};
 const clock=unitClock(state,actor),key=choice.cooldownKey||move?.id||choice.type;
 const friendlyAction=['item','support','switch'].includes(choice.type)||move&&['self','ally','allAllies'].includes(E.moveTarget(move));
 const targetSide=friendlyAction?side:side==='a'?'b':'a';
 const target=E.moveTarget(move||{})==='self'?actor:context.active[targetSide][choice.targetIndex||0];
 const targetSp=target?context.speciesOf(target):null,spreadPressure=move&&E.moveTarget(move)==='allOpponents'&&context.active[targetSide].some(u=>u.hp>0&&context.speciesOf(u).ability==='Pressure');
 const fundedCheck=actionAvailability(state,actor,sp,{...choice,move},spreadPressure?{ability:'Pressure'}:targetSp);if(!fundedCheck.ok)return fundedCheck;

 clock.pending={choice:{...choice,move},resolveAt:state.elapsedMs+profile.castMs,side,targetId:target?.id,targetSide,sequence:state.sequence++};
 clock.cooldowns[key]=state.elapsedMs+profile.cooldownMs;clock.readyAt=state.elapsedMs+profile.castMs+profile.recoveryMs;
 return {ok:true,profile};
}
function expireTimers(state,context,log){
 const now=state.elapsedMs,field=context.active.a[0]?.battlefield||context.active.b[0]?.battlefield;
 for(const u of allUnits(context)){const c=unitClock(state,u);if(c.status&&c.status.until<=now){if(u.status===c.status.effect){log.push(name(u,context.speciesOf(u))+' recovers from '+c.status.effect+'.');u.status=null;u.statusTurns=0;}c.status=null;}
 for(const [effect,until]of Object.entries(c.conditions))if(until<=now){if(effect==='perish'&&u.conditions?.perish){u.hp=0;log.push(name(u,context.speciesOf(u))+' falls to the doom omen.');}else if(u.conditions?.[effect])log.push(name(u,context.speciesOf(u))+' recovers from '+effect+'.');delete u.conditions?.[effect];delete c.conditions[effect];}
 for(const [key,until]of Object.entries(c.buffs))if(until<=now){u[key]=false;delete c.buffs[key];}
 if(c.delayedAt&&c.delayedAt<=now){u.hp=Math.max(0,u.hp-(u.delayedDamage?.amount||0));delete u.delayedDamage;delete c.delayedAt;log.push(name(u,context.speciesOf(u))+' is struck by delayed energy.');}
 if(c.itemReadyAt<=now)u.itemCooldowns={};u.controlImmuneUntil=c.controlImmuneUntil;
 }
 for(const [key,timer]of Object.entries(state.fieldTimers))if(timer.until<=now){if(key==='weather'||key==='terrain'){if(field?.[key]===timer.value)field[key]=null;}else{const [side,effect]=key.split('-');if(field?.sides?.[side])delete field.sides[side].screens[effect];}delete state.fieldTimers[key];}
}
function pulseEffects(state,context,log){
 const live=activeUnits(context);
 for(const u of live){const sp=context.speciesOf(u),max=E.stats(u,sp).hp,c=u.conditions||{},field=u.battlefield||{};let loss=0;
 if(['poison','burn','frostbite'].includes(u.status))loss+=Math.max(1,Math.floor(max/32));
 if(u.status==='toxic'){u.toxicTurns=(u.toxicTurns||0)+1;loss+=Math.max(1,Math.floor(max*Math.min(6,u.toxicTurns)/96));}
 if(c.leechSeed){const amount=Math.max(1,Math.floor(max/32));loss+=amount;const source=live.find(a=>a.id===u.conditionSources?.leechSeed);if(source)source.hp=Math.min(E.stats(source,context.speciesOf(source)).hp,source.hp+Math.min(amount,u.hp));}
 if(c.curse||c.trap)loss+=Math.max(1,Math.floor(max/48));if(c.nightmare&&u.status==='sleep')loss+=Math.max(1,Math.floor(max/24));
 const domains=E.activeDomains(sp,u);if(u.aspect!=='Stormbound'&&(field.weather==='snow'&&!domains.includes('Ice')||field.weather==='sand'&&![sp.base,sp.alter].some(t=>['Construct','Giant','Elemental'].includes(t))&&!domains.some(d=>['Earth','Metal'].includes(d))))loss+=Math.max(1,Math.floor(max/32));
 if(loss){u.hp=Math.max(0,u.hp-loss);log.push(name(u,sp)+' suffers '+loss+' ongoing damage.');}
 if(u.hp>0){const healing=(c.regenerate?1/20:0)+(field.terrain==='grass'?1/48:0)+(u.aspect==='Verdant'&&field.terrain==='grass'?1/32:0)+(hasHook(u,'leftovers',sp)?1/32:0);if(healing)u.hp=Math.min(max,u.hp+Math.max(1,Math.floor(max*healing)));
 u.itemRounds=(u.itemRounds||0)+1;if(hasHook(u,'resourceSustain',sp)&&u.itemRounds%3===0){const caps=E.resourceMaximums(u,sp);u.pp=Math.min(caps.pp,(u.pp||0)+1);u.willpower=Math.min(caps.willpower,(u.willpower||0)+1);}
 if(sp.ability==='Second Wind'&&!u.secondWindUsed&&u.hp<max*.3){u.hp=Math.min(max,u.hp+Math.floor(max*.15));u.secondWindUsed=true;}
 E.refreshCombatEquipment(u,sp,log);
 }
 }
}
function resolvePending(state,context,actor,clock,log,events,r){
 const pending=clock.pending;clock.pending=null;const {choice,side}=pending,sp=context.speciesOf(actor),before=actor.hp;
 if(!context.active[side].some(u=>u.id===actor.id)||actor.hp<=0)return;
 if(statusBadges(state,actor).some(s=>STATUS_RULES[s.effect]?.control)){log.push(name(actor,sp)+' is interrupted.');return;}
 const other=side==='a'?'b':'a',allies=context.active[side],opponents=context.active[other];
 let target=[...allies,...opponents].find(u=>u.id===pending.targetId&&u.hp>0);
 if(!target)target=(pending.targetSide===side?allies:opponents).find(u=>u.hp>0);if(!target)return;
 const ctx={realTime:true,speciesOf:context.speciesOf,actorTeam:context.teams[side],alliedActive:allies,targetActive:opponents,activeUnits:activeUnits(context),targetTeam:context.teams[other],funded:false};
 if(actor.lastHit&&state.elapsedMs-(actor.lastHit.at??state.elapsedMs)>8000)actor.lastHit=null;
 if(choice.type==='switch'){
  const incoming=context.teams[side].find(u=>u.id===choice.switchId&&u.hp>0),index=allies.findIndex(u=>u.id===actor.id);if(!incoming||allies.includes(incoming))return;
  const result=E.switchUnits(actor,incoming,context.speciesOf(incoming),{outSpecies:sp,forced:choice.forced});log.push(...result.log);if(result.ok){allies[index]=incoming;const entry=unitClock(state,incoming);entry.readyAt=Math.max(entry.readyAt,state.elapsedMs+1800);entry.pending=null;}
 }else if(choice.type==='item'){
  const key=choice.item==='tonic'?'tonics':'ethers',inventory=context.inventory?.[side];if(!inventory?.[key]){log.push('No supplies remaining.');return;}
  const caps=E.stats(target,context.speciesOf(target));if(choice.item==='tonic'){if(target.hp>=caps.hp)return;target.hp=Math.min(caps.hp,target.hp+Math.ceil(caps.hp/2));}else{if(target.pp>=caps.pp&&target.willpower>=caps.willpower)return;target.pp=Math.min(caps.pp,(target.pp||0)+Math.ceil(caps.pp*.6));target.willpower=Math.min(caps.willpower,(target.willpower||0)+Math.ceil(caps.willpower*.6));}
  inventory[key]--;log.push(name(actor,sp)+' uses '+(key==='tonics'?'a tonic.':'a soul draught.'));
 }else if(choice.type==='support'){actor.ward=true;actor.wardTurns=3;log.push('The Sealer raises a ward.');}
 else{
  const move=scaledMove(choice.move,actor,sp,choice.style);if(choice.type!=='heldItem'&&move.id!=='struggle'&&!E.canUseMove(actor,sp,move,context.speciesOf(target))){log.push(name(actor,sp)+' cannot complete the technique.');return;}ctx.healingFraction=move.realTimeProfile.healingFraction;ctx.friendly=['self','ally','allAllies'].includes(E.moveTarget(move));
  actor.realtimeNow=state.elapsedMs;
  if(choice.type==='heldItem'){ctx.moveOverride=move;const result=E.resolveHeldItemAction(actor,sp,target,context.speciesOf(target),{...choice,commit:choice.commit},r,ctx);log.push(...result.log);if(result.ok)clock.itemReadyAt=state.elapsedMs+(heldEquipment(actor)?.cooldown||4)*EFFECT_PULSE_MS;}
  else{
   const targets=E.moveTarget(move)==='allOpponents'?opponents.filter(u=>u.hp>0):[target];ctx.pressure=targets.some(u=>context.speciesOf(u).ability==='Pressure');
   for(let n=0;n<targets.length;n++){const victim=targets[n],hp=victim.hp;log.push(...E.executeAction(actor,sp,victim,context.speciesOf(victim),move,choice.style||'normal',choice.commit??.5,r,1,n?{...ctx,prepaid:true}:ctx));if(victim.lastHit&&victim.hp<hp)victim.lastHit.at=state.elapsedMs;if(n===0&&!ctx.funded)break;}
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
 state.actionCount++;synchronizeTimers(state,{...context,durationScale:choice.move?moveTiming(choice.move,actor,sp,choice.style).durationScale:1});
}
export function advanceRealTime(state,deltaMs,context,r=Math.random){
 const log=[],events=[];if(state.paused||!Number.isFinite(deltaMs)||deltaMs<=0)return {log,events};
 synchronizeTimers(state,context);for(const u of allUnits(context)){const clock=unitClock(state,u);if(clock.interrupted){log.push(name(u,context.speciesOf(u))+' is interrupted while casting '+clock.interrupted+'.');delete clock.interrupted;}}let remaining=Math.min(5000,deltaMs);
 while(remaining>0){const step=Math.min(50,remaining);state.elapsedMs+=step;remaining-=step;expireTimers(state,context,log);
 const due=activeUnits(context).map(actor=>({actor,clock:unitClock(state,actor)})).filter(x=>x.clock.pending&&x.clock.pending.resolveAt<=state.elapsedMs).sort((a,b)=>a.clock.pending.resolveAt-b.clock.pending.resolveAt||a.clock.pending.sequence-b.clock.pending.sequence);
 for(const {actor,clock}of due)if(clock.pending)resolvePending(state,context,actor,clock,log,events,r);
 if(state.elapsedMs>=state.nextPulseAt){pulseEffects(state,context,log);state.nextPulseAt+=EFFECT_PULSE_MS;synchronizeTimers(state,context);}
 if(!context.active.a.some(u=>u.hp>0)||!context.active.b.some(u=>u.hp>0))break;
 }
 return {log,events};
}
