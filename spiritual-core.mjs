import {canonicalDomain} from './domains.mjs';
// Pure shared rules. This module deliberately does not import the battle engine.
export const SPIRITUAL_VERSION=1;
export const PASSIVE_RECOVERY_MS=2*60*60*1000;
export const DAY_MS=35*60000,NIGHT_MS=25*60000,CYCLE_MS=DAY_MS+NIGHT_MS;
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function spiritualHash(...parts){let h=2166136261;for(const c of parts.join('|'))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
export function spiritualRandom(seed){let n=spiritualHash(seed);return()=>{n+=0x6D2B79F5;let t=Math.imul(n^n>>>15,1|n);t^=t+Math.imul(t^t>>>7,61|t);return((t^t>>>14)>>>0)/4294967296;};}
export function newSealer(leadId=null){return {version:SPIRITUAL_VERSION,level:1,xp:0,energy:100,maxEnergy:100,clockMs:0,leadId,training:0,rituals:[],meditations:0,known:{},assignments:{},floating:null,supportCooldowns:{},cooperativeCooldowns:{},advanced:[],recoveryUses:{},bondRewards:{},discoveries:{},startingChoices:null,startingChosen:[]};}
export function bondEfficiency(ind){return 1-clamp((ind?.bond||0)/100,0,1)*.15;}
export function exhaustion(ind){return ind?.spiritualEnergyEmpty?.value||0;}
export function setExhaustion(ind,sealer){const penalty=sealer&&sealer.energy<=0?.15*(1-clamp((ind.bond||0)/100,0,1)*.5):0;ind.spiritualEnergyEmpty={value:penalty};return penalty;}
export function spiritualBonus(ind,key,now=ind?.realtimeNow||0){return (ind?.spiritualBuffs||[]).filter(b=>b.until>now&&b.kind===key);}
export function spiritualMultiplier(ind,key,now){const bonuses=spiritualBonus(ind,key,now);return 1+Math.min(.45,bonuses.reduce((n,b)=>n+(b.amount||0),0));}
export function spiritualDefense(ind,move,category,now){const buffs=(ind.spiritualBuffs||[]).filter(b=>b.until>(now??ind.realtimeNow??0));return Math.max(.45,buffs.reduce((v,b)=>b.kind==='guard'&&(!b.domain||canonicalDomain(b.domain)===canonicalDomain(move.domain))&&(!b.category||b.category===category)?v*(1-b.amount):v,1));}
export function shieldDamage(ind,amount,now=ind?.realtimeNow||0){let remaining=Math.max(0,amount);for(const shield of (ind.spiritualShields||[]).filter(s=>s.until>now&&s.hp>0)){const absorbed=Math.min(shield.hp,remaining);shield.hp-=absorbed;remaining-=absorbed;}ind.spiritualShields=(ind.spiritualShields||[]).filter(s=>s.until>now&&s.hp>0);return remaining;}
export function calendarPhase(playTime=0){const cycle=Math.floor(playTime/CYCLE_MS),night=playTime%CYCLE_MS>=DAY_MS;return {cycle,night,key:cycle+':'+(night?'night':'day')};}
