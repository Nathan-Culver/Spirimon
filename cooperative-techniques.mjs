import {canonicalDomains,elementOf} from './domains.mjs';
import * as E from './engine.mjs';
import {moveTiming} from './realtime-moves.mjs';
import {energyCost,vowViolation,breakVow,spendEnergy} from './spiritual-energy.mjs';
const attack=u=>u.moves.filter(m=>m.power>0),support=u=>u.moves.find(m=>['heal','ward','protect','teamHeal','teamWard','regenerate'].includes(m.effect));
export function cooperativePlans(active,speciesOf,sealer){
 const units=active.filter(u=>u.hp>0).map(u=>({u,sp:speciesOf(u),moves:E.equippedMoves(u,speciesOf(u)),domains:E.activeDomains(speciesOf(u),u)})),plans=[];
 for(let a=0;a<units.length;a++)for(let b=a+1;b<units.length;b++){
  const pair=[units[a],units[b]],physical=pair.map(p=>attack(p).find(m=>E.moveCategory(m)==='Physical'));
  if(physical.every(Boolean))plans.push({id:'pack:'+pair.map(p=>p.u.id).join(':'),name:'Coordinated Assault',kind:'attack',cost:8,participants:pair.map((p,n)=>({id:p.u.id,move:physical[n]})),multiplier:1.12});
  const shared=pair[0].domains.find(d=>pair[1].domains.includes(d)),moves=pair.map(p=>attack(p).find(m=>m.domain===shared));
  if(shared&&moves.every(Boolean))plans.push({id:'resonance:'+pair.map(p=>p.u.id).join(':'),name:shared+' Convergence',kind:'attack',cost:10,participants:pair.map((p,n)=>({id:p.u.id,move:moves[n]})),multiplier:1.18});
  const circuit=pair.map(p=>attack(p).find(m=>['water','lightning'].includes(elementOf(m))||m.domain==='Storm'));
  if(circuit.every(Boolean)&&(elementOf(circuit[0])||circuit[0].domain)!==(elementOf(circuit[1])||circuit[1].domain))plans.push({id:'circuit:'+pair.map(p=>p.u.id).join(':'),name:'Tidal Circuit',kind:'attack',cost:12,participants:pair.map((p,n)=>({id:p.u.id,move:circuit[n]})),multiplier:1.22});
  const restoring=pair.map(support);
  if(restoring.every(Boolean))plans.push({id:'shelter:'+pair.map(p=>p.u.id).join(':'),name:'Shared Sanctuary',kind:'shelter',cost:12,participants:pair.map((p,n)=>({id:p.u.id,move:restoring[n]})),multiplier:1});
 }
 if(units.length===3&&sealer.advanced.includes('triune')&&units.every(p=>attack(p).length))plans.push({id:'triune',name:'Triune Release',kind:'attack',cost:22,participants:units.map(p=>({id:p.u.id,move:attack(p)[0]})),multiplier:1.25,advanced:true});
 if(sealer.advanced.includes('united'))for(const p of units)if(attack(p).length)plans.push({id:'united:'+p.u.id,name:'United Release',kind:'attack',cost:14,participants:[{id:p.u.id,move:attack(p)[0]}],multiplier:1.45,advanced:true});
 return plans.map(p=>({...p,cost:Math.ceil(energyCost(sealer,p.cost,{kind:'cooperative'}))}));
}
export function commitCooperative(plan,state,context,side,availability,schedule,options={}){
 const q=context.sealers[side],current=cooperativePlans(context.active[side],context.speciesOf,q).find(p=>p.id===plan.id);if(!current)return {ok:false,reason:'The equipped Techniques, Domains, or participants no longer fit.'};
 if((q.cooperativeCooldowns[current.id]||0)>state.elapsedMs)return {ok:false,reason:'Cooperative technique is cooling down.'};
 for(const part of current.participants){const u=context.active[side].find(u=>u.id===part.id),friendly=['self','ally','allAllies'].includes(E.moveTarget(part.move)),target=friendly?u:context.active[side==='a'?'b':'a'].find(v=>v.hp>0),pressure=E.moveTarget(part.move)==='allOpponents'&&context.active[side==='a'?'b':'a'].some(v=>v.hp>0&&context.speciesOf(v).ability==='Pressure'),check=availability(state,u,context.speciesOf(u),{type:'move',move:part.move},pressure?{ability:'Pressure'}:target?context.speciesOf(target):null);if(!check.ok)return {ok:false,reason:context.speciesOf(u).forms[u.appearance]+': '+check.reason};}
 const violation=vowViolation(q,'cooperative',{offensive:current.kind==='attack'});if(violation&&!options.breakVow)return {ok:false,reason:'This breaks '+violation.name,requiresVowBreak:true};if(violation)breakVow(q,true);
 if(!spendEnergy(q,current.cost))return {ok:false,reason:'Not enough Spiritual Energy.'};
 const snapshots=current.participants.map(p=>({u:context.active[side].find(u=>u.id===p.id),move:p.move}));
 for(const {u,move}of snapshots){const boosted={...move,timing:moveTiming(move,u,context.speciesOf(u)).timing,name:current.name+' · '+move.name,power:Math.round(move.power*current.multiplier),realTimeBasePower:undefined};
  const result=schedule(state,context,u,{type:'move',move:boosted,cooldownKey:move.id,style:'normal',targetIndex:0});if(!result.ok)throw Error('Cooperative scheduling changed after validation: '+result.reason);
 }
 if(current.kind==='shelter')for(const u of context.active[side]){const max=E.stats(u,context.speciesOf(u)).hp;E.healHP(u,context.speciesOf(u),Math.ceil(max*.08));u.spiritualShields??=[];u.spiritualShields.push({hp:Math.ceil(max*.08),until:state.elapsedMs+6000});}
 q.cooperativeCooldowns[current.id]=state.elapsedMs+(current.advanced?90000:45000);return {ok:true,log:['The Sealer commits '+current.cost+' Energy to '+current.name+'.']};
}
export const FIELD_RITUALS=[
 {id:'purify',name:'Purification Circle',domains:['Light','Life','Good','Spirit','Water'],cost:8,description:'Cleanse physical afflictions from the traveling team.'},
 {id:'unseal',name:'Passage Unbinding',domains:['Magic','Psionic','Void','Spirit'],cost:10,description:'Unseal the nearest physical dungeon barrier; the map remembers the change.'},
 {id:'stabilize',name:'Sanctuary Threads',domains:['Earth','Law','Peace','Hope','Spirit'],cost:8,description:'Stabilize your surroundings, preventing random cave encounters for 30 steps.'}
];
for(const ritual of FIELD_RITUALS)ritual.domains=canonicalDomains(ritual.domains);
export function fieldRitualTeam(ritual,team,speciesOf){return team.filter(u=>u.hp>0&&E.activeDomains(speciesOf(u),u).some(d=>ritual.domains.includes(d)));}
