import * as E from './engine.mjs';
import * as RT from './realtime-combat.mjs';
import * as SE from './spiritual-energy.mjs';
import * as CO from './cooperative-techniques.mjs';
import * as BAI from './battle-ai.mjs';
import {PHILOSOPHY_SUPPORT} from './temple-philosophies.mjs';
const physicalAfflictions=['poison','toxic','burn','freeze','frostbite','paralysis'];
const mentalAfflictions=['confusion','infatuation','nightmare','taunt','disable','flinch'];
const hasBuff=(u,kind,now)=>(u.spiritualBuffs||[]).some(b=>b.kind===kind&&b.until>now&&b.amount>0);
const healthyReserve=(context,side)=>context.teams[side].filter(u=>u.hp>0&&!context.active[side].includes(u));
function reserveCost(context,side){const q=context.sealers[side],costs=healthyReserve(context,side).map(u=>SE.manifestationCost(q,u,context.speciesOf(u)));return costs.length?Math.min(...costs):0;}
// Scores only effective benefits on public, current state. Every candidate still
// passes the normal Energy, assignment, vow, cast, target and cooldown checks.
export function supportUtility(state,context,side,technique,recipient){
 const now=state.elapsedMs,active=context.active[side],other=side==='a'?'b':'a',targets=technique.target==='team'?active.filter(u=>u.hp>0):[recipient];
 let score=0;
 for(const u of targets){const sp=context.speciesOf(u),max=E.stats(u,sp),clock=RT.unitClock(state,u),ratio=u.hp/Math.max(1,max.hp),missing=1-ratio;
  for(const effect of technique.effects){let value=0;const amount=effect.amount;
   if(effect.kind==='revive'){if(u.hp<=0)value=75;}
   else if(u.hp<=0||!active.includes(u))continue;
   else if(effect.kind==='heal'&&missing>0)value=Math.min(missing,amount)*130+(ratio<.35?55:0);
   else if(effect.kind==='shield'){const shield=(u.spiritualShields||[]).filter(b=>b.until>now).reduce((n,b)=>n+Math.max(0,b.hp),0)/Math.max(1,max.hp);value=Math.max(0,Math.min(amount,.45-shield))*100*(ratio<.5?2:1);}
   else if(effect.kind==='cleanse'&&physicalAfflictions.includes(u.status))value=45;
   else if(effect.kind==='calm'&&(u.status==='sleep'&&(clock.status?.until||0)>now+500||mentalAfflictions.some(k=>(clock.conditions[k]||0)>now+500)))value=45;
   else if(effect.kind==='willpower'&&max.willpower>0&&(u.willpower||0)<max.willpower*.5)value=Math.min(1-(u.willpower||0)/max.willpower,amount)*100+((u.willpower||0)<2?25:0);
   else if(effect.kind==='empower'&&!hasBuff(u,'empower',now))value=amount*70;
   else if(effect.kind==='haste'&&!hasBuff(u,'haste',now))value=amount*(clock.pending?.resolveAt>now?160:80);
   else if(effect.kind==='cooldown'){const remaining=Math.max(0,clock.gcdReadyAt-now,...Object.values(clock.cooldowns).map(at=>at-now));value=Math.min(20,remaining/1000)*amount*5;}
   else if(effect.kind==='guard'&&!hasBuff(u,'guard',now)){
    const relevant=!effect.domain&&!effect.category||context.active[other].some(v=>E.equippedMoves(v,context.speciesOf(v)).some(m=>m.power>0&&(!effect.domain||effect.domain===m.domain)&&(!effect.category||effect.category===E.moveCategory(m))));
    if(relevant)value=amount*90*(ratio<.5?1.5:1);
   }
   else if(effect.kind==='immunity'&&!hasBuff(u,'immunity',now)&&context.active[other].some(v=>E.equippedMoves(v,context.speciesOf(v)).some(m=>E.STATUS_EFFECTS.includes(m.effect))))value=18;
   else if(effect.kind==='link'&&active.filter(v=>v.hp>0).length>=2&&!(u.spiritualLinks||[]).some(b=>b.until>now&&active.some(v=>v.id===b.partner&&v.hp>0)))value=amount*90;
   score+=value;
  }
 }
 return score;
}
export function chooseEnemySupport(state,context,side='b'){
 const q=context.sealers?.[side];if(!q||state.paused||context.rules?.noSupport)return null;
 const choices=[],reserve=reserveCost(context,side),priorities=PHILOSOPHY_SUPPORT[q.philosophy]||[];
 for(const u of context.teams[side])for(const id of new Set([...(q.assignments[u.id]||[]),q.floating].filter(Boolean))){
  if(!q.known[id])continue;let options={extra:Math.min(SE.outputLimit(q),Math.floor(q.energy*.1))},check=RT.supportAvailability(state,context,side,id,u.id,options);
  if(!check.ok||q.energy-check.cost<reserve){options={};check=RT.supportAvailability(state,context,side,id,u.id,options);}if(!check.ok)continue;
  const utility=supportUtility(state,context,side,check.technique,u);if(utility<=0||utility<60&&q.energy-check.cost<reserve)continue;
  const index=priorities.indexOf(q.known[id].effects[0].kind),score=utility+(index>=0?Math.max(0,7-index)*2:0);
  choices.push({techniqueId:id,recipientId:u.id,options,score,utility,cost:check.cost});
 }
 return choices.sort((a,b)=>b.score-a.score||a.cost-b.cost||a.techniqueId.localeCompare(b.techniqueId)||a.recipientId.localeCompare(b.recipientId))[0]||null;
}
const readyCooperators=(state,context,side)=>context.active[side].filter(u=>{const c=RT.unitClock(state,u);return u.hp>0&&!c.pending&&c.readyAt<=state.elapsedMs&&c.gcdReadyAt<=state.elapsedMs;});
function cooperate(state,context,side){
 const q=context.sealers[side],other=side==='a'?'b':'a',now=state.elapsedMs;
 if((state.supportCasts||[]).some(p=>p.side===side)||context.active[side].length<2||!context.active[other].some(u=>u.hp>0)||q.energy<=q.maxEnergy*.25)return null;
 if(q.coordinationUntil&&now>=q.coordinationUntil){delete q.coordinationUntil;delete q.coordinationPlan;q.coordinationRetryAt=now+1200;return null;}
 const plans=CO.cooperativePlans(context.active[side],context.speciesOf,q),synergy=q.philosophy==='Synergy';
 plans.sort((a,b)=>(synergy?b.participants.length-a.participants.length:0)||Number(!!b.advanced)-Number(!!a.advanced));
 for(const plan of plans){
  if(q.energy-plan.cost<reserveCost(context,side)||(q.cooperativeCooldowns[plan.id]||0)>now||SE.vowViolation(q,'cooperative',{offensive:plan.kind==='attack'}))continue;
  if(plan.kind==='attack'&&plan.participants.some(p=>['counter','mirrorCoat'].includes(p.move.effect)&&!E.counterDamage(context.active[side].find(u=>u.id===p.id),context.active[other].find(u=>u.hp>0),p.move,{realTime:true,now})))continue;
  const result=CO.commitCooperative(plan,state,context,side,RT.actionAvailability,RT.scheduleAction);if(result.ok){delete q.coordinationUntil;delete q.coordinationPlan;return {log:result.log,kind:'cooperative',planId:plan.id};}
  if(!synergy||(q.coordinationRetryAt||0)>now||q.coordinationPlan&&q.coordinationPlan!==plan.id)continue;
  const parts=plan.participants.map(p=>({p,u:context.active[side].find(u=>u.id===p.id)}));
  if(parts.some(({p,u})=>{const c=RT.unitClock(state,u);return c.pending||RT.statusBadges(state,u).some(s=>RT.STATUS_RULES[s.effect]?.control)||!E.canUseMove(u,context.speciesOf(u),p.move)||Math.max(c.readyAt,c.gcdReadyAt,c.cooldowns[p.move.id]||0)-now>750;}))continue;
  q.coordinationPlan=plan.id;q.coordinationUntil??=now+750;
  return {log:[],kind:'coordination',hold:parts.map(({u})=>u.id)};
 }
 delete q.coordinationUntil;delete q.coordinationPlan;return null;
}
export function runEnemyTactics(state,context,side='b'){
 const q=context.sealers?.[side],now=state.elapsedMs,log=[];if(!q||state.paused)return {log};
 // Synergy checks the shared ready window before ordinary NPC actions consume it.
 // This does not queue moves or waive their usual resource/recast checks.
 if((q.tacticsAt||0)>now){
  if(q.philosophy==='Synergy'&&(q.coordinationUntil||readyCooperators(state,context,side).length>=1)&&!context.active[side].some(u=>u.hp>0&&u.hp<E.stats(u,context.speciesOf(u)).hp*.35)&&!(state.supportCasts||[]).some(p=>p.side===side)){const result=cooperate(state,context,side);if(result)return result;}return {log};
 }
 q.tacticsAt=now+1200;const other=side==='a'?'b':'a';context.active[side]=context.active[side].filter(u=>u.hp>0);
 const deployLimit=q.philosophy==='Synergy'?3:1;for(let n=0;n<deployLimit&&context.active[side].length<Math.min(context.rules?.maxActive||3,context.teams[side].filter(u=>u.hp>0).length);n++){
  const opponents=context.active[other].filter(u=>u.hp>0),available=healthyReserve(context,side).filter(u=>RT.deploymentAvailability(state,context,side,u).ok),u=BAI.chooseReplacement(available,opponents.length?opponents:context.teams[other].filter(u=>u.hp>0),context.speciesOf);
  if(!u)break;const result=RT.deploySpirimon(state,context,side,u);if(!result.ok)break;log.push(...result.log);
 }
 const support=chooseEnemySupport(state,context,side);
 if(q.philosophy==='Synergy'&&(!support||support.utility<60)){const result=cooperate(state,context,side);if(result)return {...result,log:[...log,...result.log]};}
 if(support){const result=RT.usePlayerSupport(state,context,side,support.techniqueId,support.recipientId,support.options);if(result.ok){log.push(...result.log);return {log,kind:'support',...support};}}
 const result=cooperate(state,context,side);return result?{...result,log:[...log,...result.log]}:{log};
}
