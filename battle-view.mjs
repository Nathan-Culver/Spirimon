import * as E from './engine.mjs';
import * as RT from './realtime-combat.mjs';
import * as SE from './spiritual-energy.mjs';
import * as CO from './cooperative-techniques.mjs';
import * as ST from './support-techniques.mjs';
import * as Q from './equipment.mjs';
import {seconds,realTimeStatusHTML} from './realtime-ui.mjs';

// Rendering reads the current session through getters; it never schedules actions.
export function createBattleView({getBattle,getState,getMode,realTimeContext,spOf,battleMoves,sealButtonHTML,xpHTML,party,activeBattleAlly,esc,action}){
function combatTagsHTML(i){
 const battle=getBattle(),s=getState(),battleMode=getMode();if(battle?.rt)return '<div class="combat-tags">'+(i.spiritualEnergyEmpty?.value?'<span>Energy exhaustion</span>':'')+'<span data-rt-status-container="'+i.id+'">'+realTimeStatusHTML(battle.rt,i,esc)+'</span>'+(i.aspect&&i.aspect!=='Natural'?esc(i.aspect):'')+'</div>';return '<div class="combat-tags">'+[i.status,i.aspect&&i.aspect!=='Natural'?i.aspect:'',i.rareVariant?'✦ Radiant':'',Q.heldEquipment(i)?.name].filter(Boolean).map(t=>'<span>'+esc(t)+'</span>').join('')+'</div>';}
function doubleHUDsHTML(){
 const battle=getBattle(),s=getState(),battleMode=getMode();return ['enemy','ally'].map(side=>{const units=side==='enemy'?battle.multi.enemies:battle.multi.allies.map(id=>s.spirits.find(i=>i.id===id));return units.map((u,n)=>'<button type="button" data-action="rt-pick-target" data-value="'+side+'|'+n+'" data-spiritual-hud="'+u.id+'" aria-label="Select '+side+' '+esc(spOf(u).forms[u.appearance])+'" aria-pressed="'+(n===(side==='enemy'?battle.enemyTargetSelection||0:battle.allyTargetSelection??0))+'" class="classic-hud '+side+' slot-'+n+(side==='ally'&&u.id===battle.controlledAlly?' choosing':'')+'">'+(battle.rt?compactBattleHUD(u,side):'<div>'+esc(spOf(u).forms[u.appearance])+'</div>'+hpHTML(u,spOf(u)))+'</button>').join('');}).join('');}
function unifiedBattleActionsHTML(){
 const battle=getBattle(),s=getState(),battleMode=getMode();
 const ctx=realTimeContext(),now=battle.rt.elapsedMs,quoteState=battle.lesson?{...battle.rt,paused:false}:battle.rt,items=[],active=ctx.active.a.filter(u=>u?.hp>0);
 for(const u of active){const sp=spOf(u);battleMoves(u).forEach((m,index)=>{
  const friendly=['self','ally','allAllies'].includes(E.moveTarget(m)),target=friendly?(ctx.active.a[battle.allyTargetSelection??ctx.active.a.indexOf(u)]||u):(battle.multi.enemies[battle.enemyTargetSelection||0]||battle.enemy);if(!RT.actionAvailability(quoteState,u,sp,{type:'move',move:m,style:'normal'},spOf(target)).ok)return;
  const p=RT.moveTiming(m,u,sp,'normal');
  items.push('<button '+(battle.lesson&&!battle.lesson.practice?'disabled ':'')+'class="unified-action ua-move ua-actor-'+active.indexOf(u)+'" data-action="unified-move" data-value="'+esc(u.id)+'|'+index+'" data-unified-move="'+esc(u.id)+'|'+index+'" title="Tap: Normal, 50% attack / 50% defense. Drag to trade offense for defense. '+esc(E.moveLore(m).description)+'"><span class="ua-icon">✦</span><b>'+esc(m.name)+'</b><small>'+esc(sp.forms[u.appearance])+' · '+p.timing.toUpperCase()+' · '+seconds(p.localCooldownMs||p.gcdMs)+' CD</small><small>'+(E.moveCategory(m)==='Physical'?'STA ':'WIL ')+E.moveCost(m,spOf(target))+' · '+(E.moveCategory(m)==='Status'?'Support':E.effectiveness(m,spOf(target),target).toFixed(2)+'×')+' · '+esc(m.effect||'Direct damage')+'</small></button>');
 });}
 const plans=active.length>1&&!ctx.rules?.noSupport?CO.cooperativePlans(active,spOf,s.sealer):[];
 for(const plan of plans){if(plan.cost>s.sealer.energy)continue;
  const ready=plan.participants.every(p=>{const u=active.find(u=>u.id===p.id);return u&&RT.actionAvailability(quoteState,u,spOf(u),{type:'move',move:p.move}).ok;});
  if(ready)items.push('<button class="unified-action ua-coop" data-action="cooperative-use" data-value="'+esc(plan.id)+'"><span class="ua-icon">✧</span><b>'+esc(plan.name)+'</b><small>'+plan.cost+' SE · Cooperation</small></button>');
 }
 const supportSeen=new Set();
 for(const u of ctx.rules?.noSupport?[]:ctx.teams.a){const ids=[...(s.sealer.assignments[u.id]||[]),s.sealer.floating].filter(Boolean);
  for(const id of ids){const t=s.sealer.known[id];if(!t||supportSeen.has(id+'|'+u.id))continue;supportSeen.add(id+'|'+u.id);
   const availability=RT.supportAvailability(quoteState,ctx,'a',id,u.id);if(!availability.ok&&!availability.requiresVowBreak)continue;
   items.push('<button '+(battle.lesson?'disabled ':'')+'class="unified-action ua-support" data-energy-gesture="support" data-action="support-use" data-value="'+esc(id)+'|'+esc(u.id)+'" title="'+esc(ST.supportDescription(t))+' · Tap for normal strength; drag right to empower; drag up to cancel."><span class="ua-icon">✚</span><b>'+esc(t.name)+'</b><small>'+esc(spOf(u).forms[u.appearance])+' · '+(availability.cost??t.energyCost)+' SE · '+t.timing.toUpperCase()+' · '+(availability.castMs?seconds(availability.castMs)+' cast':'Instant')+'</small><small>'+esc(ST.supportDescription(availability.technique||t))+' · '+seconds(availability.cooldownMs||t.cooldownMs)+' recast</small></button>');
  }
 }
 for(const u of active){const item=Q.heldItemActivation(u,spOf(u));if(!ctx.rules?.noItems&&item.ok&&RT.actionAvailability(quoteState,u,spOf(u),{type:'heldItem',move:item.move}).ok)items.push('<button class="unified-action ua-item" data-action="unified-held" data-value="'+esc(u.id)+'"><b>'+esc(item.item.name)+'</b><small>'+esc(spOf(u).forms[u.appearance])+' · '+esc(item.move.name)+'</small></button>');}
 const utilityReady=!battle.rt.paused&&(battle.utilityReadyAt||0)<=now;
 if(utilityReady&&!ctx.rules?.noItems){
  if((s.inventory.tonics||0)>0&&active.some(u=>u.hp<E.stats(u,spOf(u)).hp&&RT.actionAvailability(quoteState,u,spOf(u),{type:'item'}).ok))items.push('<button class="unified-action ua-item" data-action="tonic"><span class="ua-icon">♥</span><b>Tonic ×'+s.inventory.tonics+'</b></button>');
  if((s.inventory.ethers||0)>0&&active.some(u=>{const max=E.stats(u,spOf(u));return (u.pp<max.pp||u.willpower<max.willpower)&&RT.actionAvailability(quoteState,u,spOf(u),{type:'item'}).ok;}))items.push('<button class="unified-action ua-item" data-action="ether"><span class="ua-icon">◈</span><b>Soul Draught ×'+s.inventory.ethers+'</b></button>');
  if((s.inventory.spiritDraughts||0)>0&&s.sealer.energy<s.sealer.maxEnergy)items.push('<button class="unified-action ua-item" data-action="spiritual-draught"><span class="ua-icon">◉</span><b>Spiritual Draught ×'+s.inventory.spiritDraughts+'</b></button>');
 }
 if(utilityReady&&!battle.lesson&&!ctx.rules?.noSupport&&ctx.teams.a.some(u=>u.hp>0&&['hp','pp','willpower'].some(pool=>SE.restorationQuote(s.sealer,u,spOf(u),pool,.25).ok)))items.push('<button class="unified-action ua-support" data-action="energy-restore-menu"><b>Restore with Energy</b><small>Health · Stamina · Willpower</small></button>');
 const reserves=ctx.teams.a.filter(u=>u.hp>0&&!active.some(a=>a.id===u.id));
 if(active.length<(ctx.rules?.maxActive||3)&&reserves.some(u=>SE.manifestationCost(s.sealer,u,spOf(u))<=s.sealer.energy))
  items.push('<button class="unified-action ua-utility" data-action="battle-switch"><span class="ua-icon">✧</span><b>Release</b></button>');
 if(active.some(u=>!u.conditions?.trap&&RT.actionAvailability(quoteState,u,spOf(u),{type:'switch'}).ok))
  items.push('<button class="unified-action ua-utility" data-action="battle-switch"><span class="ua-icon">↻</span><b>Switch / Recall</b></button>');
 if(!battle.trainer&&utilityReady&&(s.inventory.seals||0)>0)items.push(sealButtonHTML());
 if(!battle.rt.paused&&(battle.utilityReadyAt||0)<=now)items.push('<button class="unified-action ua-run" data-action="flee"><span class="ua-icon">➜</span><b>Run</b></button>');
 if(battle.trainer&&!battle.encounterNPC&&battle.challenger!=='villain'&&!String(battle.adventure?.kind||'').startsWith('faction'))items.push('<button class="unified-action ua-run" data-action="yield"><b>Concede</b></button>');
 return items.join('')||'<p class="ua-wait">Waiting for an available action…</p>';
}
function realTimeBattleHTML(){
 const battle=getBattle(),s=getState(),battleMode=getMode();
 const state=battle.rt,ctx=realTimeContext(),emergency=!ctx.active.a.some(u=>u.hp>0);
 const speech=battle.message?esc(battle.message):'Select an available action. Each Spirimon acts independently.';
 const controls=battleMode==='deploy'?deploymentHTML():battleMode==='support'?battleSupportHTML():battleMode==='coop'?cooperativeBattleHTML():battleMode==='bag'?'<div class="spiritual-options">'+action('tonic','TONIC ×'+s.inventory.tonics)+action('ether','SOUL DRAUGHT ×'+s.inventory.ethers)+action('spiritual-draught','SPIRITUAL DRAUGHT ×'+s.inventory.spiritDraughts)+(!battle.trainer?sealButtonHTML():'')+action('battle-main','BACK')+'</div>':'<div class="unified-action-grid" id="unified-action-grid">'+unifiedBattleActionsHTML()+'</div>';
 return '<section class="classic-battle realtime-battle unified-battle triple-battle double-battle"><div class="battle-sealers">'+spiritualEnergyHTML(s.sealer)+(battle.enemySealer?spiritualEnergyHTML(battle.enemySealer,'Enemy'):'')+'</div><div class="classic-stage"><canvas id="battle-canvas" width="1000" height="550" aria-label="Real-time Spirimon battle"></canvas>'+doubleHUDsHTML()+'<div class="battle-corner">'+action('battle-record','LOG')+'</div>'+(state.paused&&!battle.damageEnding?'<div class="rt-paused">PAUSED</div>':'')+'</div><div class="classic-bottom"><div class="classic-dialogue"><p id="battle-speech" role="status">'+speech+'</p><p class="energy-emergency" data-emergency>'+(emergency?'Emergency recovery · '+seconds(6000-(state.undefendeda||0)):'')+'</p></div><div class="classic-control"><h3 class="unified-title">Available Actions</h3><p class="commitment-help">Tap: 50% attack / 50% defense · Drag trades offense for defense · Menu → Tutorial</p>'+(!['main','moves'].includes(battleMode)?action('battle-main','Back','','btn battle-dock-back'):'')+controls+'</div></div></section>';
}
function spiritualEnergyHTML(q,label='Sealer'){
 const battle=getBattle(),s=getState(),battleMode=getMode();
 if(!q)return '';return '<div class="spiritual-meter" data-sealer-meter="'+(label==='Enemy'?'b':'a')+'"><span>'+esc(label)+' · Lv. '+q.level+' <b data-energy-number>'+Math.floor(q.energy)+' / '+q.maxEnergy+'</b> SE</span><small class="sealer-vow-label">'+esc(q.vowBroken?'Vow broken':SE.activeVow(q)?.name||'')+'</small><div><i data-energy-fill style="width:'+Math.max(0,q.energy/q.maxEnergy*100)+'%"></i></div></div>';
}
function compactBattleHUD(u,side){
 const battle=getBattle(),s=getState(),battleMode=getMode();const sp=spOf(u),st=E.stats(u,sp),c=RT.unitClock(battle.rt,u),now=battle.rt.elapsedMs;return '<div class="hud-name"><span>'+esc(sp.forms[u.appearance])+'</span><small>Lv.'+u.level+'</small></div><div class="health"><i style="width:'+Math.max(0,u.hp/st.hp*100)+'%"></i></div><div class="health-label"><span>'+(u.status?esc(u.status.toUpperCase()):'HP')+'</span><span>'+(side==='ally'?u.hp+' / '+st.hp:Math.round(u.hp/st.hp*100)+'%')+'</span></div><div class="compact-resources">STA '+(u.pp||0)+' / '+st.pp+' · WIL '+(u.willpower||0)+' / '+st.willpower+'</div>'+combatTagsHTML(u)+'<small>'+(c.pending?'CAST '+seconds(c.pending.resolveAt-now):c.gcdReadyAt>now?'GCD '+seconds(c.gcdReadyAt-now):'READY')+'</small>'+(side==='ally'?xpHTML(u):'');}
function deploymentHTML(){
 const battle=getBattle(),s=getState(),battleMode=getMode();
 const ctx=realTimeContext();return '<div class="spiritual-options"><p>Manifested '+ctx.active.a.filter(u=>u.hp>0).length+' / 3 · No Energy refunds on recall</p>'+party().map(u=>{const present=ctx.active.a.includes(u)&&u.hp>0,check=RT.deploymentAvailability(battle.rt,ctx,'a',u),cost=SE.manifestationCost(s.sealer,u,spOf(u));return '<article><b>'+esc(spOf(u).forms[u.appearance])+'</b> · Lv.'+u.level+' · HP '+u.hp+'<br>'+(present?action('rt-withdraw','Recall',u.id):u.hp<=0?'<span>Defeated · use revival support</span>':'<button data-action="rt-release" data-value="'+u.id+'" '+(check.ok||check.requiresVowBreak?'':'disabled')+'>Release · '+cost+' SE'+(u.id===s.sealer.leadId?' · LEAD':'')+'</button>')+'</article>';}).join('')+action('battle-main','Techniques')+'</div>';
}
function battleSupportHTML(){
 const battle=getBattle(),s=getState(),battleMode=getMode();
 const ctx=realTimeContext(),q=s.sealer,recipient=ctx.teams.a.find(u=>u.id===battle.supportTargetId)||activeBattleAlly()||party()[0],ids=[...(q.assignments[recipient.id]||[]),q.floating].filter((id,n,a)=>id&&a.indexOf(id)===n);
 return '<div class="spiritual-options"><label>Recipient <select id="support-target">'+ctx.teams.a.map(u=>'<option value="'+u.id+'" '+(u.id===recipient.id?'selected':'')+'>'+esc(spOf(u).forms[u.appearance])+(u.hp<=0?' · defeated':ctx.active.a.includes(u)?' · manifested':' · sealed')+'</option>').join('')+'</select></label>'+ids.map(id=>{const t=q.known[id],ready=RT.supportAvailability(battle.rt,ctx,'a',id,recipient.id);return '<button data-energy-gesture="support" data-action="support-use" data-value="'+id+'|'+recipient.id+'" data-support-button="'+id+'" data-support-recipient="'+recipient.id+'" '+(ready.ok||ready.requiresVowBreak?'':'disabled')+'><b>'+esc(t.name)+(id===q.floating?' · FLOATING':'')+'</b><br>'+t.timing.toUpperCase()+' · '+(ready.cost??t.energyCost)+' SE · <span data-support-state>'+(ready.ok?'READY':esc(ready.reason)+(ready.remainingMs?' '+seconds(ready.remainingMs):''))+'</span><small>'+esc(ST.supportDescription(t))+'</small></button>';}).join('')+(!ids.length?'<p>Choose starting techniques and make assignments outside battle.</p>':'')+action('battle-main','Techniques')+'</div>';
}
function cooperativeBattleHTML(){
 const battle=getBattle(),s=getState(),battleMode=getMode();
 const ctx=realTimeContext(),plans=CO.cooperativePlans(ctx.active.a,spOf,s.sealer);return '<div class="spiritual-options"><p>Compatible equipped Techniques form basic combinations. Learn advanced releases through instruction.</p>'+plans.map(p=>action('cooperative-use',esc(p.name)+' · '+p.cost+' SE',p.id)).join('')+(!plans.length?'<p>No compatible combination is currently manifested.</p>':'')+action('battle-main','Techniques')+'</div>';
}
 return {combatTagsHTML,doubleHUDsHTML,unifiedBattleActionsHTML,realTimeBattleHTML,spiritualEnergyHTML,compactBattleHUD,deploymentHTML,battleSupportHTML,cooperativeBattleHTML};
}
