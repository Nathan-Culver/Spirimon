import * as E from './engine.mjs';
import * as W from './world.mjs';
const cache=new Map();
export function shrinesForRegion(seed,cx,cy){
 const key=seed+'|'+cx+'|'+cy;if(cache.has(key))return cache.get(key);
 const reg=E.region(seed,cx,cy),r=E.rng(E.hash(seed,'shrines',cx,cy)),count=reg.town?2:2+(E.hash(seed,cx,cy,'pilgrimage')%3===0?1:0),out=[];
 const buildings=reg.town?W.buildings(cx,cy):[],reachable=new Set(),queue=[[24,18]];
 const accessible=(lx,ly)=>{const x=cx*48+lx,y=cy*36+ly;return E.walkable(E.tile(seed,x,y))&&!buildings.some(b=>x>=b.footX&&x<b.footX+b.w&&y>=b.footY&&y<b.footY+b.h&&!(x===b.doorX&&y===b.doorY))&&(!reg.town||!W.featureFootprintBlocked(lx,ly,cx,cy));};
 for(let n=0;n<queue.length;n++){const [x,y]=queue[n],k=x+','+y;if(x<0||y<0||x>=48||y>=36||reachable.has(k)||!accessible(x,y))continue;reachable.add(k);for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]])queue.push([x+dx,y+dy]);}
 for(let n=0;n<count;n++)for(let attempt=0;attempt<180;attempt++){
  let lx=n===0&&attempt===0&&reg.town?21:Math.floor(4+r()*40),ly=n===0&&attempt===0&&reg.town?20:Math.floor(4+r()*28);
  if(n===2&&attempt<70&&out.length){lx=Math.max(4,Math.min(43,out[0].x-cx*48+(r()<.5?-1:1)*(5+Math.floor(r()*4))));ly=Math.max(4,Math.min(31,out[0].y-cy*36+Math.floor(r()*5)-2));}
  const x=cx*48+lx,y=cy*36+ly;
  if(!reachable.has(lx+','+ly)||buildings.some(b=>x>=b.footX-1&&x<=b.footX+b.w&&y>=b.footY-1&&y<=b.footY+b.h)||out.some(p=>Math.abs(p.x-x)+Math.abs(p.y-y)<5))continue;
  out.push({id:'shrine-'+cx+','+cy+'-'+n,x,y,name:['Lantern','River','Wind','Stone','Dawn'][E.hash(seed,cx,cy,n)%5]+' Shrine'});break;
 }
 cache.set(key,out);return out;
}
export function nearbyShrine(save){if(save.cave||save.interior)return null;const p=E.coord(save.player.x,save.player.y);return shrinesForRegion(save.seed,p.cx,p.cy).find(t=>Math.abs(t.x-save.player.x)+Math.abs(t.y-save.player.y)<=2)||null;}
export function drawShrine(c,x,y,used=false){c.save();c.fillStyle='#68756b';c.fillRect(x+5,y+22,22,7);c.fillStyle='#9ca28b';c.fillRect(x+8,y+8,16,16);c.fillStyle='#513e48';c.fillRect(x+5,y+4,22,5);c.fillRect(x+2,y+7,28,3);c.fillStyle=used?'#89836f':'#ffe8a3';c.fillRect(x+13,y+12,6,8);c.fillStyle='#d1b77d';c.fillRect(x+11,y+23,10,3);c.restore();}
