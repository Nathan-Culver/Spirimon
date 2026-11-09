import {applyItem} from './consumables.mjs';
import {transformTempleCombatant} from './temple-philosophies.mjs';
import {fieldAffinities} from './domains.mjs';
import * as E from './engine.mjs';
import * as SE from './spiritual-energy.mjs';
import {bondEfficiency,clamp,spiritualBonus,spiritualMultiplier} from './spiritual-core.mjs';
import {supportFits,fieldSupport,clearConditions,supportDescription} from './support-techniques.mjs';
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
export function unitClock(state,ind){const c=state.units[ind.id]??={readyAt:ind.animationReadyAt||0,gcdReadyAt:ind.gcdReadyAt||0,cooldowns:{},pending:null,conditions:{},buffs:{},status:null,itemReadyAt:ind.itemReadyAt||0,controlImmuneUntil:0,aiAt:state.elapsedMs+400};c.gcdReadyAt??=0;ind.moveCooldowns??={};if(c.cooldowns!==ind.moveCooldowns){for(const [id,at]of Object.entries(c.cooldowns))ind.moveCooldowns[id]=Math.max(ind.moveCooldowns[id]||0,at);c.cooldowns=ind.moveCooldowns;}c.damageDelays??=ind.cooldownDelayBudgets||{};ind.cooldownDelayBudgets=c.damageDelays;return c;}
// Delay budgets belong to each running timer; direct and ongoing damage have separate caps.
function reportDamage(state,context,unit,options={}){
 applyDamageDelay(state,unit,options);
 if(!(options.amount>0))return;
 const side=context.teams.a.includes(unit)?'a':'b';
 state.damageEvents=(state.damageEvents||[]).filter(e=>state.elapsedMs-e.at<2600).slice(-63);
 state.damageEvents.push({target:unit.id,side,amount:options.amount,at:state.elapsedMs});
}
export function applyDamageDelay(state,ind,{periodic=false,hits=1,disruption=null}={}){
 const c=unitClock(state,ind),now=state.elapsedMs;if(ind.hp<=0)return;
 const kind=periodic?'periodic':'direct',step=periodic?50:100;
 const pending=c.pending?.choice?.move&&c.pending.resolveAt>now?c.pending:null;
 const castRoom=()=>pending?Math.max(0,750-(pending.pushbackMs||0)-(pending.damageGcdDelayMs||0)):Infinity;
 const changes={castMs:0,timers:{}};c.damageDelays??={};
 const delay=(key,at,requested,source=kind)=>{
  if(!(at>now)){delete c.damageDelays[key];return at;}
  const budget=c.damageDelays[key]??={direct:0,periodic:0};
  if(budget.instantCast)return at;
  // Older saves without a recorded starting duration keep their existing absolute caps
  // until this timer starts again; never infer a duration from remaining time.
  const duration=Number.isFinite(budget.durationMs)?Math.max(0,budget.durationMs):Infinity;
  const cap=source==='periodic'?Math.min(250,duration*.075):Math.min(500,duration*.15);
  const added=Math.min(Math.max(0,cap-(budget[source]||0)),requested,key==='gcd'?castRoom():Infinity);
  budget[source]=(budget[source]||0)+added;
  if(key==='gcd'&&pending)pending.damageGcdDelayMs=(pending.damageGcdDelayMs||0)+added;
  if(added>0)changes.timers[key]=(changes.timers[key]||0)+added;
  return at+added;
 };
 c.gcdReadyAt=delay('gcd',c.gcdReadyAt,step*Math.max(1,hits));
 for(const key of Object.keys(c.cooldowns))c.cooldowns[key]=delay('move:'+key,c.cooldowns[key],step*Math.max(1,hits));
 const protection=Math.max(0,...spiritualBonus(ind,'concentration',now).map(b=>b.amount));
 const immune=spiritualBonus(ind,'immunity',now).length>0;
 if(!periodic&&pending&&now>=(c.nextPushbackAt||0)&&!immune){
  const added=Math.min(Math.max(0,500-(pending.pushbackMs||0)),250*(1-clamp(protection,0,1)),castRoom());
  if(added>0){pending.resolveAt+=added;pending.pushbackMs=(pending.pushbackMs||0)+added;c.nextPushbackAt=now+500;changes.castMs=added;}
 }
 // Explicit disruption spends the same per-timer allowance as ordinary hits.
 if(disruption&&!periodic&&!immune&&now>=(c.disruptionImmuneUntil||0)){
  c.gcdReadyAt=delay('gcd',c.gcdReadyAt,clamp(Number(disruption.gcdMs)||0,0,500),'direct');
  const moveId=disruption.moveId==='lastUsed'?ind.lastMove:disruption.moveId;
  if(moveId)c.cooldowns[moveId]=delay('move:'+moveId,c.cooldowns[moveId]||0,clamp(Number(disruption.lcdMs)||0,0,500),'direct');
  c.disruptionImmuneUntil=now+2000;
 }
 if(changes.castMs||Object.keys(changes.timers).length){
  if(!c.delayNotice||now-c.delayNotice.at>150)c.delayNotice={at:now,until:now+1200,castMs:0,timers:{}};
  const notice=c.delayNotice;notice.castMs+=changes.castMs;notice.until=now+1200;
  for(const [key,added]of Object.entries(changes.timers))notice.timers[key]=(notice.timers[key]||0)+added;
 }
 ind.gcdReadyAt=c.gcdReadyAt;
}
function resetDamageBudget(clock,key,durationMs,instantCast=false){clock.damageDelays??={};clock.damageDelays[key]={direct:0,periodic:0,durationMs,instantCast};}
function syncCastHaste(state,ind){
 const pending=unitClock(state,ind).pending;if(!pending?.choice?.move)return;
 const haste=spiritualMultiplier(ind,'haste',state.elapsedMs),previous=pending.castHaste??haste;
 if(pending.resolveAt>state.elapsedMs&&haste!==previous)pending.resolveAt=state.elapsedMs+(pending.resolveAt-state.elapsedMs)*previous/haste;
 pending.castHaste=haste;
}
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
 const requested=choice.cooldownKey||choice.move?.id;if(choice.move&&choice.type!=='heldItem'&&((actor.lockedMove&&requested!=='struggle'&&E.canUseMove(actor,sp,actor.lockedMove,targetSp)&&actor.lockedMove.id!==requested)||(actor.pendingMove&&actor.pendingMove.id!==requested)))return {ok:false,reason:'This Spirimon is committed to another Technique',remainingMs:0};
 if(clock.pending)return {ok:false,reason:'Casting',remainingMs:Math.max(0,clock.pending.resolveAt-now)};
 if(clock.readyAt>now)return {ok:false,reason:'Animation lock',remainingMs:clock.readyAt-now};
 const p=choice.move?moveTiming(choice.move,actor,sp,choice.style):null;if((p?.timing==='gcd'||!p)&&clock.gcdReadyAt>now)return {ok:false,reason:'GCD',remainingMs:clock.gcdReadyAt-now};
 if(choice.type==='heldItem'&&clock.itemReadyAt>now)return {ok:false,reason:'Item cooldown',remainingMs:clock.itemReadyAt-now};
 const key=choice.cooldownKey||choice.move?.id,remaining=(clock.cooldowns[key]||0)-now;if(remaining>0)return {ok:false,reason:'Technique cooldown',remainingMs:remaining};
 if(choice.move&&choice.type!=='heldItem'&&choice.move.id!=='struggle'&&!E.canUseMove(actor,sp,choice.move,targetSp))return {ok:false,reason:'Unavailable or insufficient resources',remainingMs:0};
 if(choice.move?.id==='struggle'&&targetSp&&E.equippedMoves(actor,sp).some(m=>E.canUseMove(actor,sp,m,targetSp)))return {ok:false,reason:'An equipped Technique can still be funded',remainingMs:0};
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
  if(!valid&&move?.id!=='struggle'&&!actor.pendingMove&&!actor.lockedMove)return {ok:false,reason:'Technique is not equipped'};
  if(actor.itemMoveLock&&actor.itemMoveLock!==move.id&&hasHook(actor,'choiceLock',sp))return {ok:false,reason:'Equipment locks the previous Technique'};
 }
 if(choice.type==='switch'){
  if(Object.values(state.units).some(c=>c.pending?.side===side&&c.pending?.choice?.type==='switch'&&c.pending.choice.switchId===choice.switchId))return {ok:false,reason:'That reserve is already entering'};
  if(actor.conditions?.trap&&!choice.forced)return {ok:false,reason:'Binding prevents switching'};
  const incoming=context.teams[side].find(u=>u.id===choice.switchId&&u.hp>0);if(!incoming||context.active[side].some(u=>u.id===incoming.id))return {ok:false,reason:'No healthy reserve selected'};
 }
 if(choice.type==='switch'){const q=context.sealers?.[side],v=q&&SE.vowViolation(q,'switch');if(v&&!choice.breakVow)return {ok:false,reason:'This switch breaks '+v.name,requiresVowBreak:true};const incoming=context.teams[side].find(u=>u.id===choice.switchId);if(q&&q.energy<SE.manifestationCost(q,incoming,context.speciesOf(incoming)))return {ok:false,reason:'Not enough Spiritual Energy to release this Spirimon.'};}
 const profile=move?moveTiming(move,actor,sp,choice.style):{timing:'gcd',castMs:350,gcdMs:3500,cooldownMs:3500,localCooldownMs:0,animationLockMs:550,recoveryMs:550};
 const clock=unitClock(state,actor),key=choice.cooldownKey||move?.id||choice.type;
 const friendlyAction=['item','support','switch'].includes(choice.type)||move&&['self','ally','allAllies'].includes(E.moveTarget(move));
 const targetSide=friendlyAction?side:side==='a'?'b':'a';
 const target=E.moveTarget(move||{})==='self'?actor:context.active[targetSide][choice.targetIndex||0];
 const targetSp=target?context.speciesOf(target):null,spreadPressure=move&&E.moveTarget(move)==='allOpponents'&&context.active[targetSide].some(u=>u.hp>0&&context.speciesOf(u).ability==='Pressure');
 const fundedCheck=actionAvailability(state,actor,sp,{...choice,move},spreadPressure?{ability:'Pressure'}:targetSp);if(!fundedCheck.ok)return fundedCheck;

 choice={...choice,extraMoves:choice.type==='move'?Math.max(0,Math.min(2,Math.floor(Number(choice.extraMoves)||0))):0};
 if(choice.type==='move'&&context.sealers?.[side])context.sealers[side].vowFormationClosed=true;
 if(choice.type==='switch'&&choice.breakVow)SE.breakVow(context.sealers[side],true);
 clock.pending={choice:{...choice,move},resolveAt:state.elapsedMs+profile.castMs,castHaste:spiritualMultiplier(actor,'haste',state.elapsedMs),side,targetId:target?.id,targetSide,sequence:state.sequence++};
 if(profile.localCooldownMs){clock.cooldowns[key]=state.elapsedMs+profile.localCooldownMs;resetDamageBudget(clock,'move:'+key,profile.localCooldownMs,profile.castMs===0);}if(profile.timing==='gcd'){clock.gcdReadyAt=state.elapsedMs+profile.gcdMs;resetDamageBudget(clock,'gcd',profile.gcdMs,profile.castMs===0);}clock.readyAt=state.elapsedMs+profile.animationLockMs;actor.gcdReadyAt=clock.gcdReadyAt;actor.animationReadyAt=clock.readyAt;
 return {ok:true,profile};
}
function expireTimers(state,context,log){
 const now=state.elapsedMs,field=context.active.a[0]?.battlefield||context.active.b[0]?.battlefield;
 for(const u of allUnits(context)){const c=unitClock(state,u);if(c.status&&c.status.until<=now){if(u.status===c.status.effect){log.push(name(u,context.speciesOf(u))+' recovers from '+c.status.effect+'.');u.status=null;u.statusTurns=0;}c.status=null;}
 for(const [effect,until]of Object.entries(c.conditions))if(until<=now){if(effect==='perish'&&u.conditions?.perish){u.hp=0;log.push(name(u,context.speciesOf(u))+' falls to the doom omen.');}else if(u.conditions?.[effect])log.push(name(u,context.speciesOf(u))+' recovers from '+effect+'.');delete u.conditions?.[effect];delete c.conditions[effect];delete c.conditionMeta?.[effect];}
 for(const [key,until]of Object.entries(c.buffs))if(until<=now){u[key]=false;delete c.buffs[key];}
 u.realtimeNow=now;syncCastHaste(state,u);
 if(c.delayedAt&&c.delayedAt<=now){log.push(...E.resolveDelayedDamage(u,context.speciesOf(u),{activeUnits:activeUnits(context),onDamage:(unit,options)=>reportDamage(state,context,unit,options)}));delete c.delayedAt;}
 if(c.itemReadyAt<=now)u.itemCooldowns={};u.controlImmuneUntil=c.controlImmuneUntil;
 }
 for(const [key,timer]of Object.entries(state.fieldTimers))if(timer.until<=now){if(key==='weather'||key==='terrain'){if(field?.[key]===timer.value){field[key]=key==='weather'?field.ambientWeather||null:null;if(key==='weather')delete field.weatherTurns;}}else{const [side,effect]=key.split('-');if(field?.sides?.[side])delete field.sides[side].screens[effect];}delete state.fieldTimers[key];}
}
function pulseEffects(state,context,log){
 const live=activeUnits(context);
 for(const u of live){const sp=context.speciesOf(u),max=E.stats(u,sp).hp,c=u.conditions||{},field=u.battlefield||{};let loss=0;
 const suffer=amount=>{if(amount<=0||u.hp<=0)return;const hp=u.hp;u.hp=Math.max(0,u.hp-amount);loss+=hp-u.hp;reportDamage(state,context,u,{amount:hp-u.hp,periodic:true});};
 if(['poison','burn','frostbite'].includes(u.status))suffer(periodicDamage(max/32,u.status,sp,u));
 if(u.status==='toxic'){u.toxicTurns=(u.toxicTurns||0)+1;suffer(periodicDamage(max*Math.min(6,u.toxicTurns)/96,'toxic',sp,u));}
 if(c.leechSeed){const amount=periodicDamage(max/32,'leechSeed',sp,u),hp=u.hp;suffer(amount);const source=live.find(a=>a.id===u.conditionSources?.leechSeed);if(source)E.healHP(source,context.speciesOf(source),Math.min(amount,hp));}
 if(c.curse)suffer(periodicDamage(max/48,'curse',sp,u));if(c.trap)suffer(periodicDamage(max/48,'trap',sp,u));if(c.nightmare&&u.status==='sleep')suffer(periodicDamage(max/24,'nightmare',sp,u));
 const domains=E.activeDomains(sp,u);if(u.aspect!=='Stormbound'&&(field.weather==='snow'&&!fieldAffinities(sp,u).includes('ice')||field.weather==='sand'&&![sp.base,sp.alter].some(t=>['Construct','Giant','Elemental'].includes(t))&&!fieldAffinities(sp,u).some(e=>['earth','metal'].includes(e))))suffer(Math.max(1,Math.floor(max/32)));
 if(loss)log.push(name(u,sp)+' suffers '+loss+' ongoing damage.');
 if(u.hp>0){const healing=(passiveEffects(sp,u,{maxHp:max,weather:field.weather}).regeneration||0)+(c.regenerate?(1-(u.spiritualEnergyEmpty?.value||0))/20:0)+(field.terrain==='grass'?1/48:0)+(u.aspect==='Verdant'&&field.terrain==='grass'?1/32:0)+(hasHook(u,'leftovers',sp)?1/32:0);if(healing)E.healHP(u,sp,Math.max(1,Math.floor(max*healing)));
 u.itemRounds=(u.itemRounds||0)+1;if(hasHook(u,'resourceSustain',sp)&&u.itemRounds%3===0){const caps=E.resourceMaximums(u,sp);u.pp=Math.min(caps.pp,(u.pp||0)+1);u.willpower=Math.min(caps.willpower,(u.willpower||0)+1);}
 if(sp.ability==='Second Wind'&&!u.secondWindUsed&&u.hp<max*.3){E.healHP(u,sp,Math.floor(max*.15));u.secondWindUsed=true;}
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
 if(!target&&choice.type==='item'){log.push('The selected recipient is unavailable; no item was spent.');return;}
 if(!target)target=(pending.targetSide===side?allies:opponents).find(u=>u.hp>0);if(!target)return;
 const ctx={passiveChain:new Set(),onDamage:(unit,options)=>reportDamage(state,context,unit,options),realTime:true,speciesOf:context.speciesOf,actorTeam:context.teams[side],alliedActive:allies,targetActive:opponents,activeUnits:activeUnits(context),targetTeam:context.teams[other],funded:false};
 if(actor.lastHit&&state.elapsedMs-(actor.lastHit.at??state.elapsedMs)>8000)actor.lastHit=null;
 if(choice.type==='switch'){
  const incoming=context.teams[side].find(u=>u.id===choice.switchId&&u.hp>0),index=allies.findIndex(u=>u.id===actor.id);if(!incoming||allies.includes(incoming))return;
  const q=context.sealers?.[side],cost=q?SE.manifestationCost(q,incoming,context.speciesOf(incoming)):0;if(q&&q.energy<cost){log.push('Insufficient Spiritual Energy to complete the release.');return;}const result=E.switchUnits(actor,incoming,context.speciesOf(incoming),{outSpecies:sp,forced:choice.forced,onDamage:ctx.onDamage});if(result.ok&&q)SE.spendEnergy(q,cost);log.push(...result.log);if(result.ok){allies[index]=incoming;const entry=unitClock(state,incoming);entry.readyAt=Math.max(entry.readyAt,state.elapsedMs+1800);entry.pending=null;}
 }else if(choice.type==='item'){
  const key=choice.item==='tonic'?'tonics':'ethers',inventory=context.inventory?.[side];if(!inventory?.[key]){log.push('No supplies remaining.');return;}
  if(!applyItem(target,context.speciesOf(target),choice.item,unitClock(state,target)).ok)return;
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
  // Repeat the selected Technique immediately; each additional use pays its normal resource cost.
  // The existing Technique cooldown and GCD are charged once for the entire committed sequence.
  const repeats=Math.max(0,Math.min(2,choice.extraMoves||0));
  if(choice.type==='move'&&ctx.funded&&repeats){
   for(let repeat=0;repeat<repeats;repeat++){
    if(actor.hp<=0||!context.active[side].includes(actor))break;
    const victims=E.moveTarget(move)==='allOpponents'?opponents.filter(u=>u.hp>0):[target].filter(u=>u.hp>0);
    if(!victims.length)break;const repeatChain=new Set();
    if(move.id!=='struggle'&&!E.canUseMove(actor,sp,move,context.speciesOf(victims[0])))break;
    for(let n=0;n<victims.length;n++){
     const victim=victims[n],hp=victim.hp,repeatCtx={...ctx,passiveChain:repeatChain,funded:false,prepaid:n>0,pressure:ctx.pressure};
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
     const counterCtx={...ctx,passiveChain:new Set(),actorTeam:context.teams[other],alliedActive:opponents,targetActive:allies,targetTeam:context.teams[side],prepaid:true,funded:false,friendly:false,pressure:false};
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
function updateTransformations(context,log){
 for(const u of activeUnits(context)){if(u.battlePhilosophy!=='Transformation')continue;const sp=context.speciesOf(u);if(transformTempleCombatant(u,sp,E.stats,E.normalizeResources))log.push(name(u,sp)+' changes form, preserving Health, resources and running Technique timers.');}
}
export function advanceRealTime(state,deltaMs,context,r=Math.random){
 const log=[],events=[];if(state.paused||!Number.isFinite(deltaMs)||deltaMs<=0)return {log,events};
 synchronizeTimers(state,context);updateTransformations(context,log);for(const u of allUnits(context)){const clock=unitClock(state,u);if(clock.interrupted){log.push(name(u,context.speciesOf(u))+' is interrupted while casting '+clock.interrupted+'.');delete clock.interrupted;}}let remaining=Math.min(5000,deltaMs);
 while(remaining>0){const step=Math.min(50,remaining);state.elapsedMs+=step;remaining-=step;pauseSealedAfflictions(state,context,step);for(const side of ['a','b'])for(const u of [...context.active[side]])if(u.recallAfterCast&&!unitClock(state,u).pending){delete u.recallAfterCast;context.active[side]=context.active[side].filter(v=>v!==u);}expireTimers(state,context,log);
 for(const pending of (state.supportCasts||[]).filter(p=>p.resolveAt<=state.elapsedMs)){state.supportCasts=state.supportCasts.filter(p=>p!==pending);const team=context.teams[pending.side],targets=pending.targets.map(id=>team.find(u=>u.id===id)).filter(Boolean),recipient=team.find(u=>u.id===pending.recipient);if(recipient){const resolved=applySupportEffects(state,context,pending.side,{technique:pending.technique,targets,recipient,cost:pending.cost,gcdStarted:true});log.push(...resolved.log);}}
 const due=activeUnits(context).map(actor=>({actor,clock:unitClock(state,actor)})).filter(x=>x.clock.pending&&x.clock.pending.resolveAt<=state.elapsedMs).sort((a,b)=>a.clock.pending.resolveAt-b.clock.pending.resolveAt||a.clock.pending.sequence-b.clock.pending.sequence);
 for(const {actor,clock}of due)if(clock.pending&&clock.pending.resolveAt<=state.elapsedMs){resolvePending(state,context,actor,clock,log,events,r);updateTransformations(context,log);}
 if(state.elapsedMs>=state.nextPulseAt){pulseEffects(state,context,log);state.nextPulseAt+=EFFECT_PULSE_MS;synchronizeTimers(state,context);updateTransformations(context,log);}
 for(const side of ['a','b'])if(!context.active[side].some(u=>u.hp>0))state['undefended'+side]=(state['undefended'+side]||0)+step;else state['undefended'+side]=0;
 }
 events.push(...(state.techniqueEvents||[]));state.techniqueEvents=[];
 return {log,events};
}

export function deploymentAvailability(state,context,side,ind,{breakVow=false}={}){
 const team=context.teams[side],active=context.active[side].filter(u=>u.hp>0),q=context.sealers?.[side];
 if(state.paused)return {ok:false,reason:'Battle paused'};
 if(!team.includes(ind)||!ind||ind.hp<=0)return {ok:false,reason:'No healthy team member selected'};
 if(active.includes(ind))return {ok:false,reason:'Already manifested'};
 if(active.length>=(context.rules?.maxActive||3))return {ok:false,reason:'The active Spirimon limit has been reached'};
 const vow=q&&SE.vowViolation(q,'manifest',{activeCount:active.length,initial:q.initialManifested||[],memberId:ind.id});if(vow&&!breakVow)return {ok:false,reason:'This release breaks '+vow.name,requiresVowBreak:true};
 const cost=q?SE.manifestationCost(q,ind,context.speciesOf(ind)):0;
 return {ok:!q||q.energy>=cost,cost,reason:q&&q.energy<cost?'Not enough Spiritual Energy':''};
}
export function deploySpirimon(state,context,side,ind,options={}){
 const check=deploymentAvailability(state,context,side,ind,options);if(!check.ok)return check;
 const q=context.sealers?.[side],field=context.active[side][0]?.battlefield||context.active[side==='a'?'b':'a'][0]?.battlefield;
 if(options.breakVow&&q)SE.breakVow(q,true);
 if(q&&!SE.spendEnergy(q,check.cost))return {ok:false,reason:'Not enough Spiritual Energy'};
 const from={id:'sealed-'+ind.id,hp:0,battlefield:field,battleSide:side},result=E.switchUnits(from,ind,context.speciesOf(ind),{forced:true,onDamage:(unit,options)=>reportDamage(state,context,unit,options)});
 if(!result.ok){if(q)SE.restoreEnergy(q,check.cost);return {ok:false,reason:result.log.join(' ')};}
 context.active[side]=context.active[side].filter(u=>u.hp>0);context.active[side].push(ind);if(q&&!q.vowFormationClosed){q.initialManifested??=[];if(!q.initialManifested.includes(ind.id))q.initialManifested.push(ind.id);}
 const clock=unitClock(state,ind);clock.pending=null;clock.readyAt=state.elapsedMs+650;SE.setExhaustion(ind,q);
 return {ok:true,cost:check.cost,log:result.log};
}
export function supportAvailability(state,context,side,techniqueId,recipientId,{extra=0,breakVow=false}={}){
 if(context.rules?.noSupport)return {ok:false,reason:'Support is restricted in this challenge'};
 const q=context.sealers?.[side],t=q?.known[techniqueId],u=context.teams[side].find(u=>u.id===recipientId);
 if(state.paused)return {ok:false,reason:'Battle paused'};if((state.supportCasts||[]).some(p=>p.side===side))return {ok:false,reason:'Sealer is channeling support'};if(!t||!u)return {ok:false,reason:'Select a learned technique and a team member'};
 if(t.effects.some(e=>e.kind==='seal'))return {ok:false,reason:'Use Spirit Sealing on a wild Spirimon'};
 if(!context.field&&!(q.assignments[u.id]||[]).includes(t.id)&&q.floating!==t.id)return {ok:false,reason:'Technique is not assigned to this Spirimon'};
 if(!supportFits(t,u,context.speciesOf(u),E.activeDomains(context.speciesOf(u),u)))return {ok:false,reason:'This Spirimon is not compatible'};
 if(context.field&&!fieldSupport(t))return {ok:false,reason:'This support technique needs a battle'};
 const revive=t.effects.some(e=>e.kind==='revive');if(revive?u.hp>0:u.hp<=0||!context.active[side].includes(u))return {ok:false,reason:revive?'Choose a defeated team member':'The recipient must be manifested'};
 if((q.supportCooldowns[t.id]||0)>state.elapsedMs)return {ok:false,reason:'Shared technique cooldown',remainingMs:q.supportCooldowns[t.id]-state.elapsedMs};
 const targets=t.target==='team'?context.active[side].filter(u=>u.hp>0):[u];
 if(context.field&&!targets.some(v=>t.effects.some(e=>{const max=E.stats(v,context.speciesOf(v));return e.kind==='revive'?v.hp<=0:e.kind==='cleanse'?!!v.status||Object.keys(v.conditions||{}).length>0:e.kind==='heal'?v.hp<max.hp:e.kind==='stamina'?(v.pp??max.pp)<max.pp:e.kind==='willpower'?(v.willpower??max.willpower)<max.willpower:false;})))return {ok:false,reason:'This Spirimon does not need that recovery technique'};
 if(t.timing==='gcd'){const waiting=targets.reduce((m,v)=>Math.max(m,unitClock(state,v).gcdReadyAt-state.elapsedMs),0);if(waiting>0)return {ok:false,reason:'Every recipient GCD must be ready',remainingMs:waiting};}
 if(t.effects.some(e=>e.kind==='link')&&!context.active[side].some(v=>v!==u&&v.hp>0))return {ok:false,reason:'Damage sharing needs another manifested ally'};
 if(t.effects.some(e=>e.kind==='recall')&&u.conditions?.trap)return {ok:false,reason:'This binding prevents protected recall'};
 if(t.sacrifice?.kind==='hp'&&targets.some(v=>v.hp<=Math.ceil(E.stats(v,context.speciesOf(v)).hp*t.sacrifice.amount)))return {ok:false,reason:'Not enough HP to make this sacrifice safely'};
 const quote=SE.supportQuote(q,t,u,extra),vow=SE.vowViolation(q,t.effects.some(e=>e.kind==='recall')?'recall':'support',{offensive:quote.offensive,extra:quote.extra});
 if(vow&&!breakVow)return {ok:false,reason:'This Technique breaks '+vow.name,requiresVowBreak:true};
 const actual=vow&&breakVow?SE.supportQuote({...q,vowBroken:'battle'},t,u,extra):quote;
 return {ok:q.energy>=actual.cost,reason:q.energy<actual.cost?'Not enough Spiritual Energy':'',...actual,targets,recipient:u};
}
export function usePlayerSupport(state,context,side,techniqueId,recipientId,options={}){
 const result=supportAvailability(state,context,side,techniqueId,recipientId,options);if(!result.ok)return result;
 const q=context.sealers[side],t=result.technique;if(options.breakVow)SE.breakVow(q,!context.field);
 if(!SE.spendEnergy(q,result.cost))return {ok:false,reason:'Not enough Spiritual Energy'};
 q.vowFormationClosed=true;q.supportCooldowns[t.id]=state.elapsedMs+t.cooldownMs;
 if(t.castMs>0&&!context.field){
  for(const u of result.targets)if(t.timing==='gcd'){const c=unitClock(state,u);c.gcdReadyAt=state.elapsedMs+moveTiming({id:'support-gcd',timing:'gcd',power:0},u,context.speciesOf(u)).gcdMs;u.gcdReadyAt=c.gcdReadyAt;resetDamageBudget(c,'gcd',c.gcdReadyAt-state.elapsedMs,false);}
  state.supportCasts??=[];state.supportCasts.push({side,technique:t,targets:result.targets.map(u=>u.id),recipient:result.recipient.id,cost:result.cost,resolveAt:state.elapsedMs+t.castMs});
  return {ok:true,cost:result.cost,log:[(side==='a'?'Your Sealer':'Enemy Sealer')+' channels '+t.name+' for '+(t.castMs/1000).toFixed(2)+'s ('+result.cost+' Energy).'],targets:result.targets.map(u=>u.id)};
 }
 return applySupportEffects(state,context,side,result);
}
function applySupportEffects(state,context,side,result){
 const {technique:t,targets,recipient}=result,q=context.sealers[side],now=state.elapsedMs,log=[];
 for(const u of targets){if(u.hp<=0&&!t.effects.some(e=>e.kind==='revive')||u.hp>0&&t.effects.some(e=>e.kind==='revive'))continue;
  if(u.hp>0&&!context.active[side].includes(u))continue;
  state.techniqueEvents??=[];const visualEffect=t.effects.some(e=>['heal','revive','willpower','cleanse'].includes(e.kind))?'heal':t.effects.some(e=>['shield','guard','immunity'].includes(e.kind))?'ward':'boostPower';
  state.techniqueEvents.push({actor:u.id,target:u.id,side,move:{id:t.id,name:t.name,power:0,category:'Status',effect:visualEffect,target:'ally',domain:t.domain||'Spirit'},at:now});state.techniqueEvents=state.techniqueEvents.slice(-24);
  const sp=context.speciesOf(u),max=E.stats(u,sp),clock=unitClock(state,u),efficiency=(1+Math.min(.1,(u.bond||0)/1000))*(1-SE.setExhaustion(u,q)),until=now+t.durationMs;
  if(t.sacrifice?.kind==='hp'&&u.hp<=Math.ceil(max.hp*t.sacrifice.amount))continue;
  if(t.timing==='gcd'&&!result.gcdStarted){clock.gcdReadyAt=now+moveTiming({id:'support-gcd',timing:'gcd',power:0},u,sp).gcdMs;resetDamageBudget(clock,'gcd',clock.gcdReadyAt-now,!t.castMs);}u.gcdReadyAt=clock.gcdReadyAt;
  if(t.sacrifice?.kind==='hp')u.hp-=Math.ceil(max.hp*t.sacrifice.amount);
  if(t.sacrifice?.kind==='defense'){u.spiritualBuffs??=[];u.spiritualBuffs.push({kind:'guard',amount:-t.sacrifice.amount,until});}
  for(const effect of t.effects){const amount=effect.amount*efficiency;
   if(effect.kind==='heal')u.hp=Math.min(max.hp,u.hp+Math.ceil(max.hp*amount*(1+(passiveEffects(sp,u,{maxHp:max.hp,weather:u.battlefield?.weather}).healingReceived||0))));
   if(effect.kind==='stamina')u.pp=Math.min(max.pp,(u.pp||0)+Math.max(1,Math.ceil(max.pp*amount)));
   if(effect.kind==='willpower')u.willpower=Math.min(max.willpower,(u.willpower||0)+Math.max(1,Math.ceil(max.willpower*amount)));
   if(effect.kind==='shield'){u.spiritualShields??=[];const existing=u.spiritualShields.filter(s=>s.until>now).reduce((n,s)=>n+s.hp,0);u.spiritualShields.push({hp:Math.max(0,Math.min(Math.ceil(max.hp*amount),Math.ceil(max.hp*.45)-existing)),until});}
   if(effect.kind==='cleanse')clearConditions(u,1+Math.floor((t.empowermentExtra||0)/5),clock);
   if(effect.kind==='calm'){
    u.spiritualBuffs??=[];u.spiritualBuffs.push({kind:'concentration',amount:.5,until});
    if(clock.status?.effect==='sleep')shortenAffliction(clock.status,now,.4);
    for(const key of ['confusion','infatuation','nightmare','taunt','disable','flinch'])if(clock.conditions[key]){const timer=clock.conditionMeta[key];if(timer){shortenAffliction(timer,now,.4);clock.conditions[key]=timer.until;}else clock.conditions[key]=now+(clock.conditions[key]-now)*.4;}
   }
   if(['empower','haste','immunity','guard'].includes(effect.kind)){syncCastHaste(state,u);u.spiritualBuffs??=[];u.spiritualBuffs.push({kind:effect.kind,amount:Math.min(.3,amount),until,domain:effect.domain,category:effect.category});if(effect.kind==='haste')syncCastHaste(state,u);}
   if(effect.kind==='cooldown'){clock.gcdReadyAt=now+Math.max(0,clock.gcdReadyAt-now)*(1-Math.min(.5,amount));for(const key of Object.keys(clock.cooldowns))clock.cooldowns[key]=now+Math.max(0,clock.cooldowns[key]-now)*(1-Math.min(.5,amount));u.gcdReadyAt=clock.gcdReadyAt;}
   if(effect.kind==='link'){const partner=context.active[side].filter(v=>v!==u&&v.hp>0).sort((a,b)=>b.hp-a.hp)[0];if(partner){u.spiritualLinks??=[];u.spiritualLinks.push({partner:partner.id,amount:Math.min(.4,amount),until});}}
   if(effect.kind==='revive'){E.resetCombat(u);u.hp=Math.max(1,Math.floor(max.hp*amount));u.status=null;u.conditions={};delete u.afflictions;clock.pending=null;clock.status=null;clock.conditions={};clock.conditionMeta={};log.push(name(u,sp)+' revives within its seal. Release it separately to fight.');}
   if(effect.kind==='recall'){
    if(clock.pending)u.recallAfterCast=true;
    else context.active[side]=context.active[side].filter(v=>v!==u);
   }
  }
 }
 synchronizeTimers(state,context);log.unshift((side==='a'?'Your Sealer':'Enemy Sealer')+' uses '+t.name+' ('+result.cost+' Energy): '+supportDescription(t)+'.');
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

export function useFieldSupport(save,techniqueId,recipientId,options={}){
 const q=SE.ensureSealer(save),state=createRealTimeState(q.clockMs),context={field:true,teams:{a:save.spirits,b:[]},active:{a:save.spirits.filter(u=>u.hp>0),b:[]},sealers:{a:q},speciesOf:u=>save.species[u.species]};
 synchronizeTimers(state,context);
 const result=usePlayerSupport(state,context,'a',techniqueId,recipientId,options);
 if(result.ok)SE.setExhaustion(context.teams.a.find(u=>u.id===recipientId),q);return result;
}
