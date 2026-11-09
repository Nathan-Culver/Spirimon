import * as E from './engine.mjs';
import {clearConditions} from './support-techniques.mjs';
export const ITEM_KEYS={tonic:'tonics',ether:'ethers',purifier:'purifiers',revival:'revivalDraughts'};
export function itemPreview(unit,species,kind){
 const max=E.stats(unit,species),pools=kind==='tonic'||kind==='revival'?['hp']:kind==='ether'?['pp','willpower']:[];
 const changes=pools.map(pool=>{const before=unit[pool]??max[pool],after=kind==='revival'?Math.ceil(max.hp*.75):kind==='tonic'?before+E.healHP(structuredClone(unit),species,Math.ceil(max.hp*.75)):Math.min(max[pool],before+Math.ceil(max[pool]*.85));return {pool,before,after,max:max[pool],gain:after-before};});
 const conditions=(unit.status?1:0)+Object.keys(unit.conditions||{}).length;
 return {ok:!!ITEM_KEYS[kind]&&(kind==='revival'?unit.hp<=0:unit.hp>0&&(kind==='purifier'?conditions>0:changes.some(c=>c.gain>0))),changes,conditions};
}
export function applyItem(unit,species,kind,clock=null){
 const preview=itemPreview(unit,species,kind);if(!preview.ok)return preview;
 if(kind==='revival'){E.resetCombat(unit);clearConditions(unit,Infinity,clock);if(clock){clock.pending=null;clock.conditions={};}}
 if(kind==='purifier')clearConditions(unit,Infinity,clock);
 for(const c of preview.changes)unit[c.pool]=c.after;
 return preview;
}
export function itemSealQuote(unit,species,quality=1){return {ok:unit.hp>0,cost:0,chance:Math.min(.99,E.sealChance(unit,species,quality)+Math.min(100,unit.trust??unit.bond??0)/100*.12+.3)};}
