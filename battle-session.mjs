import * as E from './engine.mjs';
import * as RT from './realtime-combat.mjs';
import * as SE from './spiritual-energy.mjs';
import {runEnemyTactics} from './enemy-tactics.mjs';
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
 if(!battle)return;SE.ensureSealer(s);battle.multi.allies=ctx.active.a.map(u=>u.id);battle.multi.enemies=ctx.active.b;battle.multi.reserves=ctx.teams.b.filter(u=>!ctx.active.b.includes(u));
 battle.ally=ctx.active.a.find(u=>u.hp>0)?.id||battle.ally;battle.enemy=ctx.active.b.find(u=>u.hp>0)||battle.enemy;
 if(!battle.multi.allies.includes(battle.controlledAlly))battle.controlledAlly=ctx.active.a.find(u=>u.hp>0)?.id||battle.ally;
}
function configureEnemyRoster(team){
 const battle=getBattle(),s=getState();
 if(!battle)return;battle.enemyRoster=[...new Map(team.map(u=>[u.id,u])).values()].slice(0,6);for(const u of battle.enemyRoster){E.applyUnitDifficulty(u,spOf(u),s.settings?.difficulty||'normal','enemy');BAI.prepareOpponent(u,spOf(u),s.rank,E.rng(E.hash(s.seed,u.id,'loadout')));}
 battle.enemySealer=persistentEnemySealer(battle.sealerKey,battle.enemyRoster);battle.enemySealer.clockMs=battle.rt.elapsedMs;
 const ids=battle.multi.enemies.map(u=>u.id);battle.multi.enemies=battle.enemyRoster.filter(u=>ids.includes(u.id)&&u.hp>0).slice(0,3);if(!battle.multi.enemies.length&&battle.enemyRoster[0])battle.multi.enemies=[battle.enemyRoster[0]];battle.enemy=battle.multi.enemies[0]||battle.enemy;battle.multi.reserves=battle.enemyRoster.filter(u=>!battle.multi.enemies.includes(u));E.bindBattlefield(party(),battle.enemyRoster);
}
function runEnemySealer(ctx){
 const battle=getBattle();if(!battle?.rt)return;if(battle.introductoryRival)return {log:[],hold:[]};const result=runEnemyTactics(battle.rt,ctx);battle.log.push(...result.log);return result;
}

 return {battleTeams,realTimeContext,ensureRealTimeBattle,applyRealTimeContext,configureEnemyRoster,runEnemySealer};
}
