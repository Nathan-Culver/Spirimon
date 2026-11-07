import {runEnemyTactics} from '../enemy-tactics.mjs';
import * as E from '../engine.mjs';
import * as RT from '../realtime-combat.mjs';
import * as SE from '../spiritual-energy.mjs';
import * as BAI from '../battle-ai.mjs';
import * as Q from '../equipment.mjs';
import {supportFits} from '../support-techniques.mjs';
import * as A from '../adventure-systems.mjs';
import * as TP from '../temple-philosophies.mjs';
import {solveTempleFloor,approachFaction,walkTo} from './physical-playtest.mjs';
import * as FC from '../faction-campaigns.mjs';
import {LEGENDS,applyLegendArtwork} from '../legendary-roster.mjs';
import * as SW from '../spiritual-world.mjs';
import * as EP from '../environment-puzzles.mjs';
import {ROSTER} from '../roster.mjs';
import {individualSpecies} from '../anatomy.mjs';
import {battleRewards} from '../battle-rewards.mjs';
import {decodeSavePayload} from '../save-files.mjs';
import {fileURLToPath} from 'node:url';
import {writeFile} from 'node:fs/promises';
import path from 'node:path';

export function simulateProgression(seed='progression-1',{expanded=false}={}){
 let save=E.newGame(seed),serial=0;const random=E.rng(seed),matches=[],recoveries=[],templeTrials=[];
 const catalog=ROSTER.map(row=>{const sp={...E.makeSpecies('roster-'+row.id,row.base,row.alter,row.domains),...row,id:'roster-'+row.id};sp.learnset=[];sp.moveRevision=0;E.refreshTechniques(sp);return sp;});
 for(const sp of catalog)save.species[sp.id]=sp;
 // Six early level-3 bonds are the preparation assumption; at most three manifest. All later levels come from XP.
 const picks=[catalog.find(s=>s.base==='Beast'&&s.alter==='Construct'),catalog.find(s=>s.base==='Plant'&&s.alter==='Fey'),catalog.find(s=>s.base==='Elemental'&&s.alter==='Plant'),catalog.find(s=>s.base==='Undead'&&s.alter==='Elemental'),catalog.find(s=>s.base==='Fey'&&s.alter==='Elemental'),catalog.find(s=>s.base==='Celestial'&&s.alter==='Undead')];
 save.spirits=picks.map(sp=>({...E.heal(E.makeIndividual(sp,3,0,random),sp),id:'player-'+serial++,bond:25}));save.party=save.spirits.map(u=>u.id);save.starter=true;save.inventory.tonics=5;save.inventory.ethers=3;
 const sealer=()=>SE.ensureSealer(save),party=()=>save.party.map(id=>save.spirits.find(u=>u.id===id));
 const speciesOf=u=>{const sp=individualSpecies(save.species[u.species],u);E.ensureIndividualPassives(sp,u);E.migrateResources(u,sp);return sp;};
 const allocate=()=>{const q=sealer();let n=0;while(q.unspentPoints)SE.allocateAttribute(q,['reserve','control','output'][n++%3]);SE.ensureSealer(save);};
 allocate();for(const t of [sealer().startingChoices[0],sealer().startingChoices[1],sealer().startingChoices[4]])SE.chooseStartingSupport(save,t.id);
 const level=()=>Math.floor(party().reduce((n,u)=>n+u.level,0)/party().length);
 const travel=()=>{const ms=60000;save.playTime+=ms;sealer().clockMs+=ms;SE.passiveRecovery(sealer(),ms);};
 function restore(reason){
  const shrine=SW.recoveryShrine(save,t=>SE.recoveryAvailable(save,'restore',t.id).ok),before=sealer().energy;
  save.player.x=shrine.x;save.player.y=shrine.y+1;
  const result=SE.beginRecovery(save,'restore',{shrineId:shrine.id,safe:true});if(!result.ok)throw Error('Recovery failed: '+result.reason);
  if(SE.recoveryAvailable(save,'meditate',shrine.id).ok||SE.recoveryAvailable(save,'commune',shrine.id).ok)throw Error('Shrine granted a second action');
  recoveries.push({reason,shrine:shrine.id,phase:SE.calendarPhase(save.playTime).key,energyBefore:Math.floor(before)});
 }
 function prepare(){
  allocate();travel();
  const held=Q.heldItemState(save);for(const u of party()){if(!u.specialty&&save.inventory.coins>=100){save.inventory.coins-=100;u.specialty='Guardian';}if(!Q.heldEquipment(u)){const record=Object.values(held.inventory).find(r=>r.count>0&&!r.item.consumable&&Q.canEquipHeldItem(r.item,speciesOf(u)).ok);if(record)Q.equipOwnedHeldItem(u,record.item.id,held,speciesOf(u));}}
  if(party().some(u=>u.hp<E.stats(u,speciesOf(u)).hp*.7)||sealer().energy<30||party().some(u=>(u.pp||0)+(u.willpower||0)<5))restore('preparation');
  for(const u of party()){
   const sp=speciesOf(u),learned=E.availableTechniques(u,sp),attacks=learned.filter(m=>m.power>0).sort((a,b)=>b.power-a.power),selected=[];
   const add=m=>{if(m&&!selected.some(x=>x.id===m.id))selected.push(m);};add(attacks.find(m=>m.target==='allOpponents')||attacks[0]);add(learned.find(m=>['heal','regenerate','ward','reflect','lightscreen'].includes(m.effect)));add(attacks.find(m=>E.moveCategory(m)!==E.moveCategory(selected[0]||{}))||attacks[1]);for(const m of learned)add(m);
   u.moveIds=selected.slice(0,4).map(m=>m.id);E.normalizeResources(u,sp);
   if(!u.aspect&&u.level>=16&&u.bond>=40&&save.inventory.coins>=150){save.inventory.coins-=150;u.aspect='Titan';u.hp=Math.min(u.hp,E.stats(u,speciesOf(u)).hp);}
  }
  const known=Object.values(sealer().known);sealer().floating=(known.find(t=>t.effects.some(e=>e.kind==='revive'))||known.at(-1)).id;
  const assigned=new Set();for(const u of party()){
   const fits=known.filter(t=>t.id!==sealer().floating&&supportFits(t,u,speciesOf(u),E.activeDomains(speciesOf(u),u)));
   const healing=fits.find(t=>!assigned.has(t.id)&&t.effects.some(e=>e.kind==='heal'))||fits.find(t=>t.effects.some(e=>e.kind==='heal')),shield=fits.find(t=>!assigned.has(t.id)&&t.effects.some(e=>e.kind==='shield'||e.kind==='guard'))||fits.find(t=>t.effects.some(e=>e.kind==='shield'||e.kind==='guard'));
   const chosen=healing||shield||fits[0];sealer().assignments[u.id]=chosen?[chosen.id]:[];if(chosen)assigned.add(chosen.id);
  }
  // Replenishment spends real trainer Coin; no free consumables are inserted.
  while(save.inventory.tonics<5&&save.inventory.coins>=10){save.inventory.coins-=10;save.inventory.tonics++;}
  while(save.inventory.spiritDraughts<3&&save.inventory.coins>=20){save.inventory.coins-=20;save.inventory.spiritDraughts++;}
  while(save.inventory.ethers<3&&save.inventory.coins>=16){save.inventory.coins-=16;save.inventory.ethers++;}
 }
 function battle({name,enemyLevel,count=2,maxActive=3,trainer=true,kind=null,eventId=name,opponentSpecies=null,types=null,philosophy=null}){
  prepare();const q=sealer(),initialEnergy=q.energy,enemies=Array.from({length:count},()=>{const pool=types?catalog.filter(sp=>types.some(t=>sp.base===t||sp.alter===t)):catalog,sp=opponentSpecies||pool[Math.floor(random()*pool.length)],u=E.heal(E.makeIndividual(sp,enemyLevel,philosophy==='Transformation'?0:enemyLevel>=36?2:enemyLevel>=16?1:0,random),sp);u.id='enemy-'+serial++;if(philosophy)u.battlePhilosophy=philosophy;if(trainer)BAI.prepareOpponent(u,sp,save.rank,random);return u;});
  const foe=trainer?SE.enemySealer(seed+'|'+serial,enemies,speciesOf):null,state=RT.createRealTimeState(q.clockMs),ctx={active:{a:[],b:[]},teams:{a:[...party()].sort((a,b)=>name==='Preparation'?a.level-b.level:b.level-a.level),b:enemies},speciesOf,sealers:{a:q,b:foe},inventory:{a:save.inventory,b:{}},rules:{maxActive}};
  SE.beginSealerBattle(q);if(foe){SE.configureEnemyVow(foe,/clan|faction|championship/.test(kind||''));foe.clockMs=state.elapsedMs;SE.beginSealerBattle(foe);}E.bindBattlefield(ctx.teams.a,enemies);
  const start=state.elapsedMs,log=[],participants=new Set();let ticks=0,bossPhase=0,philosophyActions=0,enemySupports=0,enemyCooperatives=0,enemyTransformations=0;
  function deploy(side){
   ctx.active[side]=ctx.active[side].filter(u=>u.hp>0);for(const u of ctx.teams[side])if(ctx.active[side].length<maxActive&&u.hp>0&&!ctx.active[side].includes(u)){
    const result=RT.deploySpirimon(state,ctx,side,u);if(result.ok&&side==='a')participants.add(u.id);
   }
  }
  function support(side){
   const q=ctx.sealers[side];if(!q)return;
   for(const u of [...ctx.teams[side]].sort((a,b)=>a.hp-b.hp))for(const id of [...(q.assignments[u.id]||[]),q.floating].filter(Boolean)){
    const t=q.known[id];if(!t)continue;const hp=u.hp/E.stats(u,speciesOf(u)).hp,kinds=t.effects.map(e=>e.kind);
    const useful=kinds.includes('revive')?u.hp<=0:kinds.includes('heal')?u.hp>0&&hp<.6:kinds.includes('shield')?hp<.85&&!(u.spiritualShields||[]).some(s=>s.hp>0&&s.until>state.elapsedMs):kinds.includes('empower')?ctx.active[side].length>1&&!(u.spiritualBuffs||[]).some(s=>s.kind==='empower'&&s.until>state.elapsedMs):false;
    if(useful&&RT.usePlayerSupport(state,ctx,side,id,u.id).ok)return;
   }
  }
  while(ticks++<1800){
   if(q.energy<q.maxEnergy*.2&&save.inventory.spiritDraughts>0&&(state.utilityReadyAt||0)<=state.elapsedMs){save.inventory.spiritDraughts--;SE.restoreEnergy(q,q.maxEnergy*.35);state.utilityReadyAt=state.elapsedMs+3500;}
   deploy('a');const tactics=runEnemyTactics(state,ctx);log.push(...tactics.log);if(tactics.kind==='support')enemySupports++;if(tactics.kind==='cooperative')enemyCooperatives++;
   for(const side of ['a','b']){
    const opponents=ctx.active[side==='a'?'b':'a'].filter(u=>u.hp>0);if(!opponents.length)continue;
    if(side==='a'&&ticks%6===0)support(side);
    for(const actor of ctx.active[side]){
     if(side==='b'&&tactics.hold?.includes(actor.id))continue;
     const sp=speciesOf(actor),clock=RT.unitClock(state,actor);if(clock.aiAt>state.elapsedMs)continue;clock.aiAt=state.elapsedMs+200;
     if(side==='a'&&actor.hp<E.stats(actor,sp).hp*.35&&save.inventory.tonics>0&&RT.scheduleAction(state,ctx,actor,{type:'item',item:'tonic',targetIndex:ctx.active.a.indexOf(actor)}).ok)continue;
     const decision=BAI.chooseBattleAction(actor,{realTime:true,speciesOf,opponents,allies:ctx.active[side],team:ctx.teams[side],reserves:[],enemyReserves:[],canUse:c=>RT.actionAvailability(state,actor,sp,c,speciesOf(opponents[0])).ok},random);
     if(decision){const scheduled=RT.scheduleAction(state,ctx,actor,decision);if(scheduled.ok&&side==='b'&&philosophy&&TP.philosophyMoveWeight(philosophy,decision.move||{},{actor,style:decision.style,allies:ctx.active.b,target:opponents[decision.targetIndex]})>0)philosophyActions++;}
    }
   }
   const result=RT.advanceRealTime(state,200,ctx,random);enemyTransformations+=result.log.filter(l=>l.includes('changes form, preserving')).length;if((['clan','temple-trainer','legend','faction'].includes(kind)||kind==='championship'&&name==='Final')&&enemies[0].hp>0){const u=enemies[0],max=E.stats(u,speciesOf(u)),ratio=u.hp/max.hp;if(bossPhase===0&&ratio<=.65){bossPhase=1;u.ward=true;u.pp=Math.min(max.pp,u.pp+15);}else if(bossPhase===1&&ratio<=.3){bossPhase=2;u.battleStyle='strong';u.status=null;}}log.push(...result.log);if(log.length>20)log.splice(0,log.length-20);
   if(!enemies.some(u=>u.hp>0)||!party().some(u=>u.hp>0)||(state.undefendedb||0)>6000||(state.undefendeda||0)>6000)break;
  }
  const victory=enemies.every(u=>u.hp<=0)||(state.undefendedb||0)>6000,record={name,enemySupports,enemyCooperatives,enemyTransformations,...(philosophy?{philosophy,philosophyActions}:{}),partyLevel:level(),enemyLevel,enemies:count,victory,seconds:Math.round((state.elapsedMs-start)/1000),energySpent:Math.round(initialEnergy-q.energy),survivors:party().filter(u=>u.hp>0).length};
  q.clockMs=state.elapsedMs;save.playTime+=state.elapsedMs-start;SE.endSealerBattle(q);if(foe)SE.endSealerBattle(foe);
  for(const u of [...party(),...enemies])RT.preserveAfflictions(state,u);
  if(!victory){const items={};for(const key of ['seals','offerings','tonics','ethers','spiritDraughts']){items[key]=Math.floor((save.inventory[key]||0)/3);save.inventory[key]=(save.inventory[key]||0)-items[key];}save.drops.push({x:save.player.x,y:save.player.y,items});save.inventory.coins-=Math.min(save.inventory.coins,20+save.rank*5);record.log=log;matches.push(record);return false;}
  const rewards=battleRewards({trainer,enemyRoster:enemies},save.rank);for(const u of party())if(participants.has(u.id)){E.gainXP(u,speciesOf(u),rewards.xp);u.bond=Math.min(100,u.bond+4);}SE.gainSealerXP(save,rewards.sealerXP);save.inventory.coins+=rewards.coins;save.wins++;if(kind){SE.trainSealer(save,'victory:'+kind+':'+eventId,{ritual:true});SE.learnSupport(save,'victory:'+kind+':'+eventId,'Encounter discovery');}save.rankXP+=trainer?45:12;while(save.rank<6&&save.rankXP>=save.rank*100){save.rankXP-=save.rank*100;save.rank++;}
  matches.push(record);return true;
 }
 function train(target){let attempts=0;while(level()<target){if(attempts++>180)throw Error('Training did not advance to '+target);if(!battle({name:'Preparation',enemyLevel:Math.max(1,level()-1),count:1,trainer:true})){restore('training defeat');if(attempts>6)return false;}}return true;}
 let adventure=save.adventure={crests:[],bosses:[],legends:[],guildTrials:[],champion:false};A.competitionState(adventure);
 function challenge(profile){for(let attempt=0;attempt<3;attempt++){if(battle(profile))return true;restore('challenge defeat');if(!train(profile.enemyLevel+8+attempt*3))return false;}return false;}
 for(let crest=0;crest<8;crest++){
  const templeLevel=()=>Math.max(6+crest*7,save.rank*3+crest*5+5);let target=templeLevel();for(let n=0;n<4&&level()<templeLevel()+3;n++){if(!train(templeLevel()+3))break;target=templeLevel();}if(level()<target+3)return {seed,complete:false,stage:'preparation-'+crest,matches,recoveries};
  const temple=A.templeAt(seed,crest+1,0),trial=A.templeTrial(temple);if(!A.validateTempleTrial(trial))throw Error('Unsolvable temple');
  const room={id:'temple-clan-'+crest,temple:'clan-'+crest,philosophy:temple.philosophy,templeSeed:temple.seed,depth:6,level:0,x:1,y:1};
  for(let floor=0;floor<6;floor++){
   room.level=floor;room.x=room.y=1;save.cave=room;
   if(floor<3){const before=save.steps;solveTempleFloor(save,room);templeTrials.push({crest:crest+1,floor:floor+1,philosophy:room.philosophy,steps:save.steps-before});continue;}
   const layout=TP.trialLayout(room),feature=layout.features[0];walkTo(save,room,feature,TP.trialMap(save,room));if(!TP.interactTrial(save,room,feature).battle)throw Error('Physical Temple defender inaccessible');
   const kind=floor===5?'clan':'temple-trainer',eventId=floor===5?room.temple:room.temple+'|'+floor;
   if(!challenge({name:'Temple '+(crest+1)+' '+(floor===5?'Master':'Sealer'),enemyLevel:floor===5?templeLevel():Math.max(3,templeLevel()-3),count:floor===5?Math.min(6,3+Math.floor(crest/3)):2,maxActive:3,kind,eventId,philosophy:room.philosophy}))return {seed,complete:false,stage:'temple-'+crest,matches,recoveries};
   TP.recordTrialVictory(save,kind,eventId);if(!TP.canAdvanceTrial(save,room))throw Error('Temple battle did not open the physical stairs');
  }
  delete save.cave;
  adventure.crests.push(A.CLANS[crest].id);Q.awardHeldItem(Q.heldItemState(save),seed+'|boss-item-clan-'+crest,'boss-item-clan-'+crest,{source:'clan victory',level:target,rarity:'Epic'});
  if(expanded)for(const faction of A.FACTIONS)if(adventure.crests.length>=Math.floor(faction.level/14)&&!adventure.bosses.includes(faction.id)){
   if(!train(faction.level+3))return {seed,complete:false,stage:'faction-preparation',matches,recoveries};
   FC.site(save,faction.id);
   for(let floor=0;floor<4;floor++){
    save.cave={id:'faction-'+faction.id,faction:faction.id,level:floor,x:1,y:1};const features=FC.layout(seed,faction.id,floor).features;
    for(const feature of features.filter(f=>!['faction-guard','faction-leader'].includes(f.kind)))approachFaction(save,faction.id,floor,feature);
    const feature=features.find(f=>['faction-guard','faction-leader'].includes(f.kind)),profile=approachFaction(save,faction.id,floor,feature).battle;
    if(!profile)throw Error('Physical faction objective did not unlock the guard');
    const types={'ashen-hand':['Fiend','Construct','Elemental'],'hollow-choir':['Undead','Fey'],'veil-conclave':['Aberration','Ooze','Celestial']}[faction.id];
    if(!challenge({name:faction.name+' · '+FC.CHAPTERS[floor],enemyLevel:profile.level,count:profile.teamSize,maxActive:profile.maxActive,kind:profile.kind,eventId:profile.id,types}))return {seed,complete:false,stage:faction.id+'-'+floor,matches,recoveries};
    FC.recordVictory(save,profile.kind,profile.id);if(!FC.canAdvance(save,faction.id,floor))throw Error('Faction stair remained sealed');FC.campaign(save,faction.id).furthest=Math.min(3,floor+1);
   }
   delete save.cave;adventure.bosses.push(faction.id);save.inventory.coins+=200;
  }
  // Round-trip the same format used by device files at every Crest milestone.
  save=decodeSavePayload(JSON.stringify({format:'spirimon-backup',version:1,save,library:[]})).save;adventure=save.adventure;
 }
 if(expanded){
  const presences=[];for(let radius=3;radius<12&&presences.length<4;radius++)for(let cy=-radius;cy<=radius;cy++)for(let cx=-radius;cx<=radius;cx++){
   if(Math.abs(cx)+Math.abs(cy)!==radius)continue;const legend=A.legendAt(seed,cx,cy,true,'rain');if(legend&&!presences.some(l=>l.title===legend.title))presences.push({...legend,cx,cy});
  }
  if(presences.length!==4)throw Error('All legendary profiles were not located');
  for(const legend of presences){
   if(!train(legend.level+3))return {seed,complete:false,stage:'legend-preparation',matches,recoveries};prepare();
   for(let stage=0;stage<3;stage++){const cost=Math.ceil(SE.energyCost(sealer(),5+stage*3,{kind:'ritual'}));if(sealer().energy<cost)restore('legendary ritual preparation');if(!SE.spendEnergy(sealer(),cost))throw Error('Ritual unfunded');SE.trainSealer(save,'ritual-'+legend.id+':'+stage,{ritual:true});}
   SE.learnSupport(save,'ritual-'+legend.id,'Legendary ritual discovery');
   const profile=LEGENDS.find(p=>p.name===legend.title),sp=applyLegendArtwork(E.makeSpecies(seed+'|'+legend.id,profile.base,profile.alter,profile.domains),profile);sp.id='legendary-'+legend.id;save.species[sp.id]=sp;
   if(!challenge({name:legend.title,enemyLevel:legend.level,count:1,maxActive:3,trainer:false,kind:'legend',eventId:legend.id,opponentSpecies:sp}))return {seed,complete:false,stage:legend.id,matches,recoveries};adventure.legends.push(legend.id);
  }
 }
 for(const trial of A.GUILD_TRIALS){if(!train(trial.level+3))return {seed,complete:false,stage:'guild-training',matches,recoveries};if(!challenge({name:trial.name,enemyLevel:Math.max(trial.level,level()),count:Math.max(2,trial.maxActive),maxActive:trial.maxActive,kind:'guild-trial',eventId:trial.id}))return {seed,complete:false,stage:'guild-'+trial.id,matches,recoveries};save.adventure.guildTrials.push(trial.id);}
 if(!train(77))return {seed,complete:false,stage:'championship-preparation',matches,recoveries};
 let attempts=1;const check=A.beginChampionship(save.adventure,{rank:save.rank,seed});if(!check.ok)throw Error(check.reason);
 while(save.adventure.championship.status==='active'){
  const match=A.championshipMatch(save.adventure,level(),1);if(!battle({name:match.name,enemyLevel:match.level,count:match.teamSize,maxActive:match.maxActive,kind:'championship',eventId:match.id})){A.recordChampionshipResult(save.adventure,false);if(attempts++>=8||!train(match.level+6))return {seed,complete:false,stage:'championship-'+match.stage,matches,recoveries};restore('championship defeat');A.beginChampionship(save.adventure,{rank:save.rank,seed});}else A.recordChampionshipResult(save.adventure,true);
 }
 return {seed,complete:save.adventure.champion,finalLevel:level(),battles:matches.length,crests:save.adventure.crests.length,guildTrials:save.adventure.guildTrials.length,championshipWins:save.adventure.championship.wins,championshipAttempts:attempts,factions:save.adventure.bosses.length,legends:save.adventure.legends.length,expanded,templeTrials,physicalSteps:save.steps,restorations:recoveries.length,matches,recoveries};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const expanded=process.argv.includes('--expanded'),seeds=process.argv.slice(2).filter(v=>v!=='--expanded'),reports=[];for(const seed of seeds.length?seeds:['progression-1']){const r=simulateProgression(seed,{expanded});reports.push(r);console.log(JSON.stringify({seed:r.seed,complete:r.complete,stage:r.stage,battles:r.battles||r.matches.length,last:r.matches.at(-1)}));}
 await writeFile(new URL(expanded?'../docs/expanded-progression-audit.json':'../docs/progression-audit.json',import.meta.url),JSON.stringify(reports,null,2)+'\n');
 if(reports.some(r=>!r.complete))process.exitCode=1;
}
