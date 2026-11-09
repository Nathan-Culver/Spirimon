import {commandMetrics,actorCommandSlots,commandIdentity,commandGroup,commandPosition,cooperativeCommandKey,cooperativeCommandSlots,reserveCommandCells} from './battle-commands.mjs';
import * as QOL from './qol.mjs';
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
 battle.commandActorSlots=actorCommandSlots(battle.commandActorSlots,active.map(u=>u.id));
 const actorCapacity=Math.min(ctx.rules?.maxActive||3,ctx.teams.a.length),catalogs={moves:[],support:[],items:[],utility:['battle-switch||switch','flee||']};
 for(let slot=0;slot<actorCapacity;slot++)for(let n=0;n<4;n++)catalogs.moves.push('unified-move|'+slot+'|'+n+'|');
 if(!ctx.rules?.noSupport)for(const u of ctx.teams.a)for(const id of [...(s.sealer.assignments[u.id]||[]),s.sealer.floating].filter(id=>id&&s.sealer.known[id]&&!s.sealer.known[id].effects.some(e=>e.kind==='seal'))){const key='support-use|'+esc(id)+'|'+esc(u.id)+'|';if(!catalogs.support.includes(key))catalogs.support.push(key);}
 if(!ctx.rules?.noItems){
  if(ctx.teams.a.some(u=>Q.heldEquipment(u,spOf(u))?.active))catalogs.items.push(...Array.from({length:actorCapacity},(_,slot)=>'unified-held|'+slot+'|'));
  for(const [key,command]of [['tonics','tonic||'],['ethers','ether||'],['spiritDraughts','spiritual-draught||'],['purifiers','purifier||'],['revivalDraughts','revival||'],...(!battle.trainer?[['seals','item-seal']]:[])])if(s.inventory[key]>0)catalogs.items.push(command);
 }
 if(ctx.teams.a.length>1)catalogs.utility.unshift('battle-switch||release');
 if(battle.trainer&&!battle.encounterNPC&&battle.challenger!=='villain'&&!String(battle.adventure?.kind||'').startsWith('faction'))catalogs.utility.push('yield||');
 for(const u of active){const sp=spOf(u);battleMoves(u).forEach((m,index)=>{
  const friendly=['self','ally','allAllies'].includes(E.moveTarget(m)),target=friendly?(ctx.active.a[battle.allyTargetSelection??ctx.active.a.indexOf(u)]||u):(battle.multi.enemies[battle.enemyTargetSelection||0]||battle.enemy);if(!RT.actionAvailability(quoteState,u,sp,{type:'move',move:m,style:'normal'},spOf(target)).ok)return;
  const p=RT.moveTiming(m,u,sp,'normal');
  items.push('<button '+(battle.lesson&&!battle.lesson.practice?'disabled ':'')+'class="unified-action ua-move ua-actor-'+battle.commandActorSlots.indexOf(u.id)+'" data-action="unified-move" data-value="'+esc(u.id)+'|'+index+'" data-unified-move="'+esc(u.id)+'|'+index+'" title="Tap: Normal, 50% attack / 50% defense. Drag to trade offense for defense. '+esc(E.moveLore(m).description)+'"><span class="ua-icon">✦</span><span class="ua-kind">Technique</span><b>'+esc(m.name)+'</b><small>'+esc(sp.forms[u.appearance])+' · '+p.timing.toUpperCase()+' · '+seconds(p.localCooldownMs||p.gcdMs)+' CD</small><small>Target: '+esc(E.moveTarget(m)==='self'?sp.forms[u.appearance]:['allAllies','allOpponents','field'].includes(E.moveTarget(m))?E.moveTarget(m)==='allAllies'?'All allies':E.moveTarget(m)==='allOpponents'?'All opponents':'Battlefield':spOf(target).forms[target.appearance])+'</small><small>'+(E.moveCategory(m)==='Physical'?'STA ':'WIL ')+E.moveCost(m,spOf(target))+' · '+(E.moveCategory(m)==='Status'?'Support':E.effectiveness(m,spOf(target),target).toFixed(2)+'×')+' · '+esc(m.effect||'Direct damage')+'</small></button>');
 });}
 if(!ctx.rules?.noSupport){
  if(!battle.trainer)catalogs.support.push('seal');
  // Reserve only cooperative families this party can form, including revived
  // members. Their cells survive cooldowns, recalls and actor replacements.
  const possible=CO.cooperativePlans(ctx.teams.a.map(u=>({...u,hp:Math.max(1,u.hp)})),spOf,s.sealer),families=new Set(possible.map(p=>p.id.split(':')[0]));
  if(actorCapacity>=3&&s.sealer.advanced.includes('triune'))families.add('triune');
  catalogs.support.push(...cooperativeCommandSlots(s.sealer.advanced).filter(key=>{const [family,...slots]=key.split('|')[1].split(':');return families.has(family)&&(family==='triune'||slots.every(n=>Number(n)<actorCapacity));}));
 }
 const plans=active.length>1&&!ctx.rules?.noSupport?CO.cooperativePlans(active,spOf,s.sealer):[];
 for(const plan of plans){if(plan.cost>s.sealer.energy)continue;
  const ready=plan.participants.every(p=>{const u=active.find(u=>u.id===p.id);return u&&RT.actionAvailability(quoteState,u,spOf(u),{type:'move',move:p.move}).ok;});
  if(ready)items.push('<button class="unified-action ua-coop" data-action="cooperative-use" data-value="'+esc(plan.id)+'"><span class="ua-icon">✧</span><b>'+esc(plan.name)+'</b><small>'+plan.cost+' SE · Cooperation</small></button>');
 }
 const supportSeen=new Set();
 for(const u of ctx.rules?.noSupport?[]:ctx.teams.a){const ids=[...(s.sealer.assignments[u.id]||[]),s.sealer.floating].filter(Boolean);
  for(const id of ids){const t=s.sealer.known[id];if(!t||t.effects.some(e=>e.kind==='seal')||supportSeen.has(id+'|'+u.id))continue;supportSeen.add(id+'|'+u.id);
   const availability=RT.supportAvailability(quoteState,ctx,'a',id,u.id);if(!availability.ok&&!availability.requiresVowBreak)continue;
   items.push('<button '+(battle.lesson?'disabled ':'')+'class="unified-action ua-support" data-energy-gesture="support" data-action="support-use" data-value="'+esc(id)+'|'+esc(u.id)+'" title="'+esc(ST.supportDescription(t))+' · Tap for normal strength; drag right to empower; drag up to cancel."><span class="ua-icon">✚</span><b>'+esc(t.name)+'</b><small>Recipient: '+esc(spOf(u).forms[u.appearance])+' · '+(availability.cost??t.energyCost)+' SE · '+t.timing.toUpperCase()+' · '+(availability.castMs?seconds(availability.castMs)+' cast':'Instant')+'</small><small>'+esc(ST.supportDescription(availability.technique||t))+' · '+seconds(availability.cooldownMs||t.cooldownMs)+' recast</small></button>');
  }
 }
 for(const u of active){const item=Q.heldItemActivation(u,spOf(u));if(!ctx.rules?.noItems&&item.ok&&RT.actionAvailability(quoteState,u,spOf(u),{type:'heldItem',move:item.move}).ok)items.push('<button class="unified-action ua-item" data-action="unified-held" data-value="'+esc(u.id)+'"><b>'+esc(item.item.name)+'</b><small>'+esc(spOf(u).forms[u.appearance])+' · '+esc(item.move.name)+'</small></button>');}

 const utilityReady=!battle.rt.paused&&(battle.utilityReadyAt||0)<=now;
 if(utilityReady&&!ctx.rules?.noItems){
  for(const [kind,key,label] of [['purifier','purifiers','Purifying salve'],['revival','revivalDraughts','Revival draught']])if((s.inventory[key]||0)>0&&(kind==='revival'?ctx.teams.a:active).some(u=>QOL.itemPreview(u,spOf(u),kind).ok))items.push('<button class="unified-action ua-item" data-action="'+kind+'"><b>'+label+' ×'+s.inventory[key]+'</b><small>0 SE</small></button>');
  if((s.inventory.tonics||0)>0&&active.some(u=>u.hp<E.stats(u,spOf(u)).hp&&RT.actionAvailability(quoteState,u,spOf(u),{type:'item'}).ok))items.push('<button class="unified-action ua-item" data-action="tonic"><span class="ua-icon">♥</span><b>Tonic ×'+s.inventory.tonics+'</b></button>');
  if((s.inventory.ethers||0)>0&&active.some(u=>{const max=E.stats(u,spOf(u));return (u.pp<max.pp||u.willpower<max.willpower)&&RT.actionAvailability(quoteState,u,spOf(u),{type:'item'}).ok;}))items.push('<button class="unified-action ua-item" data-action="ether"><span class="ua-icon">◈</span><b>Soul Draught ×'+s.inventory.ethers+'</b></button>');
  if((s.inventory.spiritDraughts||0)>0&&s.sealer.energy<s.sealer.maxEnergy)items.push('<button class="unified-action ua-item" data-action="spiritual-draught"><span class="ua-icon">◉</span><b>Spiritual Draught ×'+s.inventory.spiritDraughts+'</b></button>');
 }
 const reserves=ctx.teams.a.filter(u=>u.hp>0&&!active.some(a=>a.id===u.id));
 if(active.length<(ctx.rules?.maxActive||3)&&reserves.some(u=>SE.manifestationCost(s.sealer,u,spOf(u))<=s.sealer.energy))
  items.push('<button class="unified-action ua-utility" data-action="battle-switch" data-slot-key="release"><span class="ua-icon">✧</span><b>Release</b></button>');
 if(active.some(u=>!u.conditions?.trap&&RT.actionAvailability(quoteState,u,spOf(u),{type:'switch'}).ok))
  items.push('<button class="unified-action ua-utility" data-action="battle-switch" data-slot-key="switch"><span class="ua-icon">↻</span><b>Switch / Recall</b></button>');
 if(!battle.trainer&&utilityReady&&!battle.lesson){if(!ctx.rules?.noSupport)items.push(sealButtonHTML());const target=battle.multi.enemies[battle.enemyTargetSelection||0];if(!ctx.rules?.noItems&&(s.inventory.seals||0)>0&&target?.hp>0)items.push('<button class="unified-action ua-item" data-action="item-seal" data-value="'+esc(target.id)+'"><b>Seal catalyst ×'+s.inventory.seals+'</b><small>'+Math.round(QOL.itemSealQuote(target,spOf(target),s.inventory.quality).chance*100)+'% · 0 SE</small></button>');}
 if(!battle.rt.paused&&(battle.utilityReadyAt||0)<=now)items.push('<button class="unified-action ua-run" data-action="flee"><span class="ua-icon">➜</span><b>Run</b></button>');
 if(battle.trainer&&!battle.encounterNPC&&battle.challenger!=='villain'&&!String(battle.adventure?.kind||'').startsWith('faction'))items.push('<button class="unified-action ua-run" data-action="yield"><b>Concede</b></button>');
 // Every possible action owns a cell for the encounter. Availability only changes visibility.
 const catalog=battle.commandCells=reserveCommandCells(battle.commandCells,[...catalogs.moves,...catalogs.support,...catalogs.items,...catalogs.utility]);
 const metrics=commandMetrics(globalThis.visualViewport?.width||globalThis.innerWidth||1000,globalThis.visualViewport?.height||globalThis.innerHeight||700,s.settings?.textScale||1,catalog.length),counts={moves:0,support:0,items:0,utility:0};
 const html=items.join('').replace(/<button\b([^>]*)>/g,(tag,attrs)=>{
  const a=attrs.match(/data-action="([^"]+)"/)?.[1]||'',value=attrs.match(/data-value="([^"]*)"/)?.[1]||'',group=commandGroup(a);let key=commandIdentity(attrs);
  if(a==='cooperative-use'){const plan=plans.find(p=>esc(p.id)===value);key=cooperativeCommandKey(plan,battle.commandActorSlots);}
  if(a==='unified-held')key='unified-held|'+battle.commandActorSlots.findIndex(id=>esc(id)===value)+'|';
  if(a==='unified-move'){const [id,index]=value.split('|');key='unified-move|'+battle.commandActorSlots.findIndex(actor=>esc(actor)===id)+'|'+index+'|';}
  const index=catalog.indexOf(key);if(index<0)throw Error('Missing command cell: '+key);
  const p=commandPosition(index,metrics.columns);counts[group]++;
  return '<button'+attrs+' data-command-group="'+group+'" style="grid-row:'+p.row+';grid-column:'+p.column+'">';
 });
 battle.commandLayout={...metrics,counts};
 return '<div class="command-deck" role="group" aria-label="Battle actions" style="--command-columns:'+metrics.columns+';--command-rows:'+metrics.rows+';--command-cell:'+metrics.cellHeight+'px" data-compact="'+(metrics.cellHeight<36||metrics.cellWidth<74)+'" data-tiny="'+(metrics.cellHeight<24)+'">'+html+(!items.some(Boolean)?'<p class="ua-wait">Waiting for actions to recover.</p>':'')+'</div>';
}
function commandHeaderActionsHTML(){const battle=getBattle(),s=getState();return s.settings?.instantTap?'<button class="preset-toggle" data-action="preset-mode" aria-pressed="'+!!battle.useSavedPreset+'">'+(battle.useSavedPreset?'★ Preset':'Normal')+'</button>':'';}
function realTimeBattleHTML(){
 const battle=getBattle(),s=getState(),battleMode=getMode();
 const state=battle.rt,ctx=realTimeContext(),emergency=!ctx.active.a.some(u=>u.hp>0);
 const speech=battle.message?esc(battle.message):'Select an available action. Each Spirimon acts independently.';
 let controls=battleMode==='deploy'?deploymentHTML():battleMode==='support'?battleSupportHTML():battleMode==='coop'?cooperativeBattleHTML():battleMode==='bag'?'<div class="spiritual-options">'+action('tonic','TONIC ×'+s.inventory.tonics)+action('ether','SOUL DRAUGHT ×'+s.inventory.ethers)+action('spiritual-draught','SPIRITUAL DRAUGHT ×'+s.inventory.spiritDraughts)+(!battle.trainer?sealButtonHTML():'')+action('battle-main','BACK')+'</div>':'<div class="unified-action-grid" id="unified-action-grid">'+unifiedBattleActionsHTML()+'</div>';
 if(!['main','moves'].includes(battleMode)){
  controls=controls.replace(/<button\b(?=[^>]*data-action="battle-main")[^>]*>[\s\S]*?<\/button>/g,'');
  const cells=(controls.match(/<button\b|<label\b|<p\b|class="deployment-unavailable"/g)||[]).length;
  const metrics=commandMetrics(globalThis.visualViewport?.width||globalThis.innerWidth||1000,globalThis.visualViewport?.height||globalThis.innerHeight||700,s.settings?.textScale||1,cells);
  controls=controls.replace(/class="spiritual-options(?:[^"]*)"/,'class="spiritual-options compact-secondary" style="--command-columns:'+metrics.columns+';--command-rows:'+metrics.rows+';--command-cell:'+metrics.cellHeight+'px"');
 }
 return '<section class="classic-battle realtime-battle unified-battle triple-battle double-battle"><div class="battle-sealers">'+spiritualEnergyHTML(s.sealer)+(battle.enemySealer?spiritualEnergyHTML(battle.enemySealer,'Enemy'):'')+'</div><div class="classic-stage"><canvas id="battle-canvas" width="1000" height="550" aria-label="Real-time Spirimon battle"></canvas>'+doubleHUDsHTML()+'<div class="battle-corner">'+action('battle-record','LOG')+'</div>'+(state.paused&&!battle.damageEnding?'<div class="rt-paused">PAUSED</div>':'')+'</div><div class="classic-bottom"><div class="classic-dialogue"><p id="battle-speech" role="status">'+speech+'</p><p class="energy-emergency" data-emergency>'+(emergency?'Emergency recovery · '+seconds(6000-(state.undefendeda||0)):'')+'</p></div><div class="classic-control"><div class="battle-command-header"><p id="target-feedback" class="target-feedback" role="status"></p>'+commandHeaderActionsHTML()+(!['main','moves'].includes(battleMode)?action('battle-main','Back','','btn battle-dock-back'):'')+'</div>'+controls+'</div></div></section>';
}
function spiritualEnergyHTML(q,label='Sealer'){
 const battle=getBattle(),s=getState(),battleMode=getMode();
 if(!q)return '';return '<div class="spiritual-meter" data-sealer-meter="'+(label==='Enemy'?'b':'a')+'"><span>'+esc(label)+' · Lv. '+q.level+' <b data-energy-number>'+Math.floor(q.energy)+' / '+q.maxEnergy+'</b> SE</span><small class="sealer-vow-label">'+esc(q.vowBroken?'Vow broken':SE.activeVow(q)?.name||'')+'</small><div><i data-energy-fill style="width:'+Math.max(0,q.energy/q.maxEnergy*100)+'%"></i></div></div>';
}
function compactBattleHUD(u,side){
 const battle=getBattle(),s=getState(),battleMode=getMode();const sp=spOf(u),st=E.stats(u,sp),c=RT.unitClock(battle.rt,u),now=battle.rt.elapsedMs;return '<div class="hud-name"><span>'+esc(sp.forms[u.appearance])+'</span><small>Lv.'+u.level+'</small></div><div class="health"><i style="width:'+Math.max(0,u.hp/st.hp*100)+'%"></i></div><div class="health-label"><span>'+(u.status?esc(u.status.toUpperCase()):'HP')+'</span><span>'+(side==='ally'?u.hp+' / '+st.hp:Math.round(u.hp/st.hp*100)+'%')+'</span></div><div class="compact-resources">STA '+(u.pp||0)+' / '+st.pp+' · WIL '+(u.willpower||0)+' / '+st.willpower+'</div>'+combatTagsHTML(u)+'<small>'+(c.pending?'CAST '+seconds(c.pending.resolveAt-now):c.gcdReadyAt>now?'GCD '+seconds(c.gcdReadyAt-now):'READY')+'</small>'+(side==='ally'?xpHTML(u):'');}
function deploymentHTML(){
 const battle=getBattle(),s=getState(),ctx=realTimeContext();
 return '<div class="spiritual-options" role="group" aria-label="Manifested '+ctx.active.a.filter(u=>u.hp>0).length+' / 3. No Energy refunds on recall">'+party().map(u=>{
  const present=ctx.active.a.includes(u)&&u.hp>0,check=RT.deploymentAvailability(battle.rt,ctx,'a',u),cost=SE.manifestationCost(s.sealer,u,spOf(u)),name=esc(spOf(u).forms[u.appearance]);
  if(u.hp<=0)return '<div class="deployment-unavailable"><b>'+name+'</b><small>Defeated · use revival support</small></div>';
  return '<button data-action="'+(present?'rt-withdraw':'rt-release')+'" data-value="'+esc(u.id)+'" '+(!present&&!check.ok&&!check.requiresVowBreak?'disabled ':'')+'title="'+name+' · Lv.'+u.level+' · HP '+u.hp+(present?' · No Energy refund on recall':' · Release '+cost+' SE')+'"><b>'+name+'</b><small>'+(present?'Recall':'Release · '+cost+' SE'+(u.id===s.sealer.leadId?' · Lead':''))+' · HP '+u.hp+'</small></button>';
 }).join('')+'</div>';
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
 return {commandHeaderActionsHTML,combatTagsHTML,doubleHUDsHTML,unifiedBattleActionsHTML,realTimeBattleHTML,spiritualEnergyHTML,compactBattleHUD,deploymentHTML,battleSupportHTML,cooperativeBattleHTML};
}
