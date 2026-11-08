import {shrinesForRegion} from './spiritual-world.mjs';
import {calendarPhase} from './spiritual-core.mjs';
import * as E from './engine.mjs';
import * as W from './world.mjs';
const factions=['ashen-hand','hollow-choir','veil-conclave'];
const names={'ashen-hand':'Ashen Hand lookout','hollow-choir':'Hollow Choir cantor','veil-conclave':'Veil Conclave observer'};
export function waitingEnemies(save,cx,cy){
 if(!cx&&!cy)return [];
 save.waitingEnemies??={};save.waitingEnemyPhases??={};
 const key=cx+','+cy,currentPhase=calendarPhase(save.playTime||0).key;
 const cached=save.waitingEnemies[key],savedPhase=save.waitingEnemyPhases[key];
 // Finish an already accepted approach even if dusk or dawn arrives en route.
 const pendingId=save.challengers?.pending?.npc?.id;
 if(cached&&(savedPhase==='wilderness'||savedPhase===currentPhase||pendingId&&cached.some(n=>n.id===pendingId)))return cached;
 const town=E.region(save.seed,cx,cy).town,phase=town?currentPhase:'wilderness';
 const r=E.rng(E.hash(save.seed,'waiting-enemy',cx,cy,...(town?[phase]:[])));
 if(!town&&r()>.4){save.waitingEnemyPhases[key]=phase;return save.waitingEnemies[key]=[];}
 const count=town?1+Math.floor(r()*3):1,buildings=town?W.buildings(cx,cy):[];
 const reserved=[...shrinesForRegion(save.seed,cx,cy,'normal'),E.caveEntrance(save.seed,cx,cy),...Object.values(save.factionCampaigns||{}).map(c=>c.site)].filter(Boolean);
 const locals=E.npcs(save.seed,cx,cy),out=[],candidates=[];
 // Crossroad posts give clear sight lines. Other open plots are fallbacks.
 for(let offset=8;offset<=14;offset++)for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]])candidates.push({lx:24+dx*offset,ly:18+dy*offset,face:dx>0?'left':dx<0?'right':dy>0?'up':'down',order:r()});
 candidates.sort((a,b)=>a.order-b.order);
 if(town)for(let ly=3;ly<33;ly++)for(let lx=3;lx<45;lx++)candidates.push({lx,ly,face:['up','down','left','right'][E.hash(save.seed,key,phase,lx,ly)%4]});
 for(const {lx,ly,face}of candidates){
  const x=cx*48+lx,y=cy*36+ly;
  if(reserved.some(p=>Math.abs(p.x-x)+Math.abs(p.y-y)<4)||!E.walkable(E.tile(save.seed,x,y))||buildings.some(b=>W.buildingFootprintBlocked(b,x,y)||Math.abs(b.doorX-x)+Math.abs(b.doorY-y)<3)||town&&W.featureFootprintBlocked(lx,ly,cx,cy)||locals.some(n=>Math.abs(n.x-x)+Math.abs(n.y-y)<3)||out.some(n=>Math.abs(n.x-x)+Math.abs(n.y-y)<4)||save.player&&Math.abs(save.player.x-x)+Math.abs(save.player.y-y)<7)continue;
  const faction=factions[Math.floor(r()*factions.length)],id=town?'watcher-'+key+'-'+phase+'-'+out.length:'watcher-'+key;
  out.push({id,name:names[faction],role:'villain',faction,x,y,face});if(out.length===count)break;
 }
 // Retired patrol records must not prevent the new patrol from challenging.
 if(town)for(const n of cached||[]){if(save.npcBattles)delete save.npcBattles[n.id];if(save.enemyConversations)delete save.enemyConversations[n.id];}
 save.waitingEnemyPhases[key]=phase;return save.waitingEnemies[key]=out;
}
