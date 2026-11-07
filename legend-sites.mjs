import * as E from './engine.mjs';
import * as W from './world.mjs';
const cache=new Map();
// Disturbances have their own reachable position, independent of shrine density.
export function regionalLegendSite(seed,cx,cy){
 const key=seed+'|'+cx+','+cy;if(cache.has(key))return cache.get(key);
 const reg=E.region(seed,cx,cy),buildings=reg.town?W.buildings(cx,cy):[];
 const open=(lx,ly)=>{const x=cx*48+lx,y=cy*36+ly;return E.walkable(E.tile(seed,x,y))&&!buildings.some(b=>W.buildingFootprintBlocked(b,x,y))&&(!reg.town||!W.featureFootprintBlocked(lx,ly,cx,cy));};
 for(let radius=0;radius<25;radius++)for(let dy=-radius;dy<=radius;dy++)for(let dx=-radius;dx<=radius;dx++){
  if(Math.max(Math.abs(dx),Math.abs(dy))!==radius)continue;const lx=24+dx,ly=18+dy;
  if(lx<1||lx>46||ly<1||ly>34||!open(lx,ly)||!open(lx,ly+1))continue;
  const site={id:'legend-site-'+cx+','+cy,x:cx*48+lx,y:cy*36+ly};cache.set(key,site);return site;
 }
 throw Error('No accessible legendary site in '+cx+','+cy);
}
