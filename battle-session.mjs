import * as E from './engine.mjs';
import * as RT from './realtime-combat.mjs';
import * as SE from './spiritual-energy.mjs';
import * as CO from './cooperative-techniques.mjs';
import * as BAI from './battle-ai.mjs';

// One combat session owns legacy-save migration, active rosters and enemy decisions.
// UI and persistence remain injected at the application boundary.
export function createBattleSession({getBattle,getState,party,spOf,persistentEnemySealer}){
function battleTeams(){
 const battle=getBattle(),s=getState();if(battle?.enemyRoster)return {allies:party(),enemies:battle.enemyRoster};const m=battle?.multi;return {allies:party(),enemies:m?[...m.enemies,...(m.reserves||[])]:[battle.enemy,...(battle.enemyTeam||[])]};}
function realTimeContext(){
 const battle=getBattle(),s=getState();
 const teams=battleTeams(),active={a:(battle.multi?.allies||[battle.ally]).map(id=>s.spirits.find(i=>i.id===id)).filter(Boolean),b:battle.multi?.enemies||[battle.enemy]};
 return {active,teams:{a:teams.allies,b:teams.enemies},speciesOf:spOf,inventory:{a:s.inventory},sealers:{a:SE.ensureSealer(s),b:battle.enemySealer},rules:battle.rules||{}};
}
function ensureRealTimeBattle(){
 const battle=getBattle(),s=getState();
 if(!battle)return;const q=SE.ensureSealer(s);q.inBattle=true;q.senses={perception:false,concealment:false};const legacy=!battle.rt||battle.rt.version!==2;
 battle.log??=[];battle.enemyRoster??=[...new Map([...(battle.multi?.enemies||[battle.enemy]),...(battle.multi?.reserves||battle.enemyTeam||[])].filter(Boolean).map(u=>[u.id,u])).values()];
 if(legacy){battle.rt=RT.migrateRealTimeState(battle.rt,q.clockMs,[...party(),...battle.enemyRoster]);battle.log.push('GCD/LCD combat: three manual allies, persistent Technique timers, and Spiritual Energy.');}
 battle.enemySealer??=battle.trainer?persistentEnemySealer(battle.sealerKey||'trainer:'+battle.enemy.species,battle.enemyRoster):null;
 if(battle.enemySealer)battle.enemySealer.clockMs=battle.rt.elapsedMs;
 battle.multi??={allies:battle.ally?[battle.ally]:[],enemies:[battle.enemy],reserves:[],orders:{}};
 battle.multi.allies=battle.multi.allies.slice(0,3);battle.multi.enemies=battle.multi.enemies.slice(0,3);battle.multi.orders={};delete battle.multi.credits;delete battle.credits;delete battle.pendingSwitch;
 battle.rtAnimations??=[];battle.autoAllies={};RT.synchronizeTimers(battle.rt,realTimeContext());
}
function applyRealTimeContext(ctx){
 const battle=getBattle(),s=getState();
 if(!battle)return;battle.multi.allies=ctx.active.a.map(u=>u.id);battle.multi.enemies=ctx.active.b;battle.multi.reserves=ctx.teams.b.filter(u=>!ctx.active.b.includes(u));
 battle.ally=ctx.active.a.find(u=>u.hp>0)?.id||battle.ally;battle.enemy=ctx.active.b.find(u=>u.hp>0)||battle.enemy;
 if(!battle.multi.allies.includes(battle.controlledAlly))battle.controlledAlly=ctx.active.a.find(u=>u.hp>0)?.id||battle.ally;
}
function configureEnemyRoster(team){
 const battle=getBattle(),s=getState();
 if(!battle)return;battle.enemyRoster=[...new Map(team.map(u=>[u.id,u])).values()].slice(0,6);for(const u of battle.enemyRoster)BAI.prepareOpponent(u,spOf(u),s.rank,E.rng(E.hash(s.seed,u.id,'loadout')));
 battle.enemySealer=persistentEnemySealer(battle.sealerKey,battle.enemyRoster);battle.enemySealer.clockMs=battle.rt.elapsedMs;
 const ids=battle.multi.enemies.map(u=>u.id);battle.multi.enemies=battle.enemyRoster.filter(u=>ids.includes(u.id)&&u.hp>0).slice(0,3);if(!battle.multi.enemies.length&&battle.enemyRoster[0])battle.multi.enemies=[battle.enemyRoster[0]];battle.enemy=battle.multi.enemies[0]||battle.enemy;battle.multi.reserves=battle.enemyRoster.filter(u=>!battle.multi.enemies.includes(u));E.bindBattlefield(party(),battle.enemyRoster);
}
function runEnemySealer(ctx){
 const battle=getBattle(),s=getState();
 const q=battle.enemySealer,now=battle.rt.elapsedMs;if(!q)return;
 if((battle.enemySealerAt||0)>now)return;battle.enemySealerAt=now+1200;
 ctx.active.b=ctx.active.b.filter(u=>u.hp>0);
 if(ctx.active.b.length<Math.min(ctx.rules?.maxActive||3,ctx.teams.b.filter(u=>u.hp>0).length)){
  const u=BAI.chooseReplacement(ctx.teams.b.filter(u=>u.hp>0&&!ctx.active.b.includes(u)&&q.energy>=SE.manifestationCost(q,u,spOf(u))),ctx.active.a.length?ctx.active.a:party().filter(u=>u.hp>0),spOf);
  if(u){const result=RT.deploySpirimon(battle.rt,ctx,'b',u);if(result.ok)battle.log.push(...result.log);}
 }
 for(const u of ctx.teams.b){const assigned=[...(q.assignments[u.id]||[]),q.floating].filter(Boolean);
  for(const id of assigned){const t=q.known[id],k=t.effects.map(e=>e.kind),max=E.stats(u,spOf(u));
   const useful=k.includes('revive')?u.hp<=0:k.includes('heal')?u.hp>0&&u.hp<max.hp*.5:k.includes('cleanse')?!!u.status:k.includes('calm')?!!u.conditions?.confusion||u.status==='sleep':k.includes('shield')?ctx.active.b.includes(u)&&!(u.spiritualShields||[]).some(s=>s.until>now&&s.hp>0):k.includes('empower')?ctx.active.b.includes(u)&&!(u.spiritualBuffs||[]).some(b=>b.kind==='empower'&&b.until>now):k.includes('guard')?ctx.active.b.includes(u)&&u.hp<max.hp*.8&&!(u.spiritualBuffs||[]).some(b=>b.kind==='guard'&&b.until>now):k.includes('willpower')?(u.willpower||0)<max.willpower*.3:k.includes('cooldown')?Object.values(RT.unitClock(battle.rt,u).cooldowns).some(at=>at-now>5000):k.includes('haste')?ctx.active.b.includes(u)&&!(u.spiritualBuffs||[]).some(b=>b.kind==='haste'&&b.until>now):false;
   if(useful){const extra=Math.min(SE.outputLimit(q),Math.floor(q.energy*.1)),options={extra},check=RT.supportAvailability(battle.rt,ctx,'b',id,u.id,options);const result=RT.usePlayerSupport(battle.rt,ctx,'b',id,u.id,check.ok?options:{});if(result.ok){battle.log.push(...result.log);return;}}
  }
 }
 if(ctx.active.b.length>=2&&ctx.active.a.some(u=>u.hp>0)&&q.energy>q.maxEnergy*.25){for(const plan of CO.cooperativePlans(ctx.active.b,spOf,q).sort((a,b)=>Number(!!b.advanced)-Number(!!a.advanced))){const result=CO.commitCooperative(plan,battle.rt,ctx,'b',RT.actionAvailability,RT.scheduleAction);if(result.ok){battle.log.push(...result.log);break;}}}
}
 return {battleTeams,realTimeContext,ensureRealTimeBattle,applyRealTimeContext,configureEnemyRoster,runEnemySealer};
}
