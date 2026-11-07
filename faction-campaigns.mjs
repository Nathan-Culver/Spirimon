import * as E from './engine.mjs';
import * as A from './adventure-systems.mjs';
import * as W from './world.mjs';
import {shrinesForRegion} from './spiritual-world.mjs';
import {regionalLegendSite} from './legend-sites.mjs';

export const CHAPTERS=['Scout trail','Supply outpost','Binding array','Command sanctuary'];
export function campaign(save,id){
 const faction=A.FACTIONS.find(f=>f.id===id);if(!faction)throw Error('Unknown faction.');save.factionCampaigns??={};
 const state=save.factionCampaigns[id]??={id,floors:{},furthest:0};
 if(save.adventure?.bosses?.includes(id))state.complete=true;
 return state;
}
export function floorState(save,id,floor){const state=campaign(save,id);return state.floors[floor]??={clues:[],supplies:[],sigilStep:0};}
export function site(save,id){
 const state=campaign(save,id);if(state.site)return state.site;
 const p=E.coord(save.player.x,save.player.y),index=A.FACTIONS.findIndex(f=>f.id===id),reg=E.region(save.seed,p.cx,p.cy),buildings=reg.town?W.buildings(p.cx,p.cy):[],sx=12+index*11,sy=24-index*5;
 const reserved=[...shrinesForRegion(save.seed,p.cx,p.cy),regionalLegendSite(save.seed,p.cx,p.cy),...[E.caveEntrance(save.seed,p.cx,p.cy)].filter(Boolean)];
 const terrainOpen=(x,y)=>x>=0&&x<48&&y>=0&&y<36&&E.walkable(E.tile(save.seed,p.cx*48+x,p.cy*36+y))&&!buildings.some(b=>W.buildingFootprintBlocked(b,p.cx*48+x,p.cy*36+y))&&(!reg.town||!W.featureFootprintBlocked(x,y,p.cx,p.cy));
 const reachable=new Set(),queue=[[p.lx,p.ly],[24,18]];for(let i=0;i<queue.length;i++){const [x,y]=queue[i],key=x+','+y;if(reachable.has(key)||!terrainOpen(x,y))continue;reachable.add(key);for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]])queue.push([x+dx,y+dy]);}
 const open=(x,y)=>{const wx=p.cx*48+x,wy=p.cy*36+y;return reachable.has(x+','+y)&&!reserved.some(t=>Math.abs(t.x-wx)+Math.abs(t.y-wy)<5)&&x>2&&x<45&&y>2&&y<33&&E.walkable(E.tile(save.seed,wx,wy))&&!buildings.some(b=>W.buildingFootprintBlocked(b,wx,wy))&&(!reg.town||!W.featureFootprintBlocked(x,y,p.cx,p.cy));};
 for(let r=0;r<48;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){
  if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;const x=sx+dx,y=sy+dy;
  if(![-1,0,1].every(d=>open(x+d,y)&&open(x+d,y+1)))continue;
  const taken=Object.values(save.factionCampaigns).some(c=>c.site&&Math.abs(c.site.x-(p.cx*48+x))+Math.abs(c.site.y-(p.cy*36+y))<6);if(taken)continue;
  return state.site={x:p.cx*48+x,y:p.cy*36+y,cx:p.cx,cy:p.cy};
 }
 throw Error('No accessible faction camp could be placed.');
}
export function knownSites(save){return Object.values(save.factionCampaigns||{}).filter(c=>c.site).map(c=>({...c.site,id:c.id,complete:!!c.complete}));}
export function nearbySite(save){if(save.cave||save.interior)return null;return knownSites(save).find(s=>Math.abs(s.x-save.player.x)+Math.abs(s.y-save.player.y)<=2)||null;}
export function campFootprintBlocked(save,x,y){return knownSites(save).some(s=>y===s.y&&x>=s.x-1&&x<=s.x+1);}
export function layout(seed,id,floor){
 if(floor<0||floor>3)throw Error('Unknown faction floor.');
 const width=25,height=19,grid=Array.from({length:height},(_,y)=>Array.from({length:width},(_,x)=>!x||!y||x===width-1||y===height-1?'wall':'floor'));
 for(const x of [8,16])for(let y=2;y<17;y++)if(![5,13].includes(y))grid[y][x]='wall';
 if(floor===0){for(let x=2;x<23;x++)if(![5,12,20].includes(x))grid[9][x]='wall';}
 if(floor===2){for(let x=10;x<15;x++)grid[10][x]='wall';}
 grid[1][1]='up';grid[17][23]='down';const map={width,height,grid,exits:[{x:1,y:1,kind:'up'},{x:23,y:17,kind:'down'}]};
 const features=[];const add=(name,kind,x,y,extra={})=>features.push({id:name,kind,name,x,y,...extra});
 if(floor===0){add('Broken binding cord','faction-clue',4,4,{clue:0});add('Scouts’ route tablet','faction-clue',12,6,{clue:1});add('Supply-cart tracks','faction-clue',20,14,{clue:2});add('Faction scout','faction-guard',21,5);}
 if(floor===1){add('Gate counterweight','faction-control',5,14);for(const [n,[x,y]]of [[4,5],[12,5],[20,13]].entries())add('Supply cache '+(n+1),'faction-supply',x,y,{supply:n});add('Outpost quartermaster','faction-guard',20,5);}
 if(floor===2){add('Binding-array inscription','faction-inscription',4,4);for(const [n,[x,y]]of [[12,5],[20,13],[5,14]].entries())add(['Root sigil','Moon sigil','Star sigil'][n],'faction-sigil',x,y,{order:n});add('Array warden','faction-guard',20,5);}
 if(floor===3){add('Command archive','faction-clue',4,5,{clue:3});add(A.FACTIONS.find(f=>f.id===id).leader,'faction-leader',20,7);}
 const objects=floor===1?[{id:'outpost-boulder',x:8,y:5,kind:'push'},{id:'outpost-roots',x:16,y:13,kind:'cleave'}]:[];
 return {map,features,objects,secret:null};
}
export function objective(save,id,floor){
 const state=floorState(save,id,floor);
 if(floor===0)return 'Inspect three scout clues ('+state.clues.filter(n=>n<3).length+'/3), then defeat the scout.';
 if(floor===1)return 'Open the gate counterweight, recover three supply caches ('+state.supplies.length+'/3), and defeat the quartermaster.';
 if(floor===2)return 'Read the inscription, disable Root → Moon → Star, and defeat the array warden.';
 return campaign(save,id).complete?'The command sanctuary has been liberated.':'Confront the faction leader in the command sanctuary.';
}
export function canAdvance(save,id,floor){const s=floorState(save,id,floor);return floor===0?s.clues.filter(n=>n<3).length===3&&s.guard:floor===1?s.lever&&s.supplies.length===3&&s.guard:floor===2?s.arrayDisabled&&s.guard:campaign(save,id).complete;}
export function interact(save,id,floor,feature){
 const s=floorState(save,id,floor),faction=A.FACTIONS.find(f=>f.id===id);let message='';
 if(feature.kind==='faction-clue'){if(!s.clues.includes(feature.clue))s.clues.push(feature.clue);message=feature.clue===3?'The archive records the faction’s binding plans.':feature.name+' reveals a route toward '+faction.name+'’s inner compound.';}
 if(feature.kind==='faction-control'){s.lever=true;message='The counterweight opens the supply gate. Barriers can also be moved or cleared with field capabilities.';}
 if(feature.kind==='faction-supply'){
  if(!s.lever)return {message:'The cache is locked. Find the gate counterweight.'};
  if(s.supplies.includes(feature.supply))return {message:'This supply cache has already been recovered.'};
  s.supplies.push(feature.supply);save.inventory.tonics=(save.inventory.tonics||0)+1;save.inventory.coins=(save.inventory.coins||0)+15;message='Recovered a tonic, 15 Coin, and evidence of the binding apparatus.';
 }
 if(feature.kind==='faction-inscription'){s.inscription=true;message='Inscription: roots remember, the moon listens, the star releases. Activate Root → Moon → Star.';}
 if(feature.kind==='faction-sigil'){
  if(!s.inscription)return {message:'Study the binding inscription before touching the array.'};
  if(s.arrayDisabled)return {message:'The binding array is already disabled.'};
  s.sigilStep=feature.order===s.sigilStep?s.sigilStep+1:feature.order===0?1:0;s.arrayDisabled=s.sigilStep===3;message=s.arrayDisabled?'The binding apparatus falls silent. The warden’s protection fades.':'The array answers · '+s.sigilStep+'/3.';
 }
 if(feature.kind==='faction-guard'){
  if(s.guard)return {message:'This Sealer has already been defeated.'};
  if(floor===0&&s.clues.filter(n=>n<3).length<3)return {message:'Follow the scout trail and inspect all three clues before confronting the scout.'};
  if(floor===2&&!s.arrayDisabled)return {message:'The warden is protected by the binding array. Disable it first.'};
  return {battle:{kind:'faction-guard',id:id+'|'+floor,level:Math.max(5,faction.level-6+floor*3),teamSize:Math.min(3,2+floor),maxActive:Math.min(3,1+floor),opponent:feature.name}};
 }
 if(feature.kind==='faction-leader'){
  if(campaign(save,id).complete)return {message:faction.name+'’s leader has been overcome.'};
  return {battle:{kind:'faction',id,level:faction.level,teamSize:3,maxActive:3,opponent:faction.leader}};
 }
 return {message};
}
export function recordVictory(save,kind,id){
 if(kind==='faction-guard'){const [faction,floor]=id.split('|');floorState(save,faction,Number(floor)).guard=true;}
 if(kind==='faction')campaign(save,id).complete=true;
}
export function featureSprite(feature,state){
 if(feature.kind==='faction-control')return state.lever?'lever-down':'lever-up';
 if(feature.kind==='faction-supply')return state.supplies?.includes(feature.supply)?'chest-open':'chest-closed';
 if(feature.kind==='faction-sigil')return ['rune-amber','rune-blue','rune-violet'][feature.order];
 return 'tablet';
}
