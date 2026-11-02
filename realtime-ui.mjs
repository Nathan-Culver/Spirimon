import {moveTiming,actionAvailability,unitClock,statusBadges} from './realtime-combat.mjs';
import {moveLore,moveCategory} from './engine.mjs';
export function seconds(ms){return Math.max(0,ms/1000).toFixed(1)+'s';}
export function realTimeStatusHTML(state,ind,escape=String){return statusBadges(state,ind).map(s=>'<span class="rt-status status-'+s.effect+'" data-status-unit="'+escape(ind.id)+'" data-status-effect="'+s.effect+'">'+escape(s.label)+' '+seconds(s.remainingMs)+'</span>').join('');}
export function realTimeMoveHTML(state,actor,sp,moves,escape=String,style='normal'){
 return '<div class="classic-moves rt-moves">'+moves.map((m,index)=>{
 const profile=moveTiming(m,actor,sp,style),availability=actionAvailability(state,actor,sp,{type:'move',move:m}),clock=unitClock(state,actor),cd=Math.max(0,(clock.cooldowns[m.id]||0)-state.elapsedMs),lore=moveLore(m);
 return '<button class="classic-move rt-move" data-action="move-select" data-value="'+index+'" data-rt-move="'+escape(m.id)+'" '+(availability.ok?'':'disabled ')+'title="'+escape(lore.description)+'"><span class="move-name">'+escape(m.name)+'</span><span class="rt-move-info">'+moveCategory(m)+(profile.power?' · Power '+profile.power:'')+' · CD '+seconds(profile.cooldownMs)+'</span><span class="rt-cooldown" data-rt-label="'+escape(m.id)+'">'+(availability.ok?'READY':escape(availability.reason)+(availability.remainingMs?' '+seconds(availability.remainingMs):''))+'</span><span class="rt-cooldown-track"><i data-rt-bar="'+escape(m.id)+'" style="width:'+Math.min(100,cd/profile.cooldownMs*100)+'%"></i></span></button>';
 }).join('')+'</div>';
}
