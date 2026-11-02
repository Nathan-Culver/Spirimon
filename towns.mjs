export const TOWN_LAYOUT=[
{kind:'hall',name:'Sealer Hall',x:19,y:11,w:5,h:4,dx:3},
{kind:'inn',name:'Lantern Inn',x:28,y:12,w:4,h:3,dx:2},
{kind:'home',name:'Village House',x:29,y:22,w:4,h:3,dx:2},
{kind:'forge',name:'Ember Forge',x:12,y:21,w:4,h:4,dx:2},
{kind:'herbalist',name:'Willow Herbalist',x:14,y:5,w:4,h:4,dx:2},
{kind:'archive',name:'Jade Scroll Archive',x:32,y:5,w:5,h:4,dx:3}
];
export const TOWN_FEATURES=[
{x:11,y:23,cell:3,w:1,h:1},{x:18,y:22,cell:4,w:1,h:1},{x:26,y:15,cell:5,w:1,h:1},
{x:33,y:27,cell:6,w:2,h:1},{x:35,y:27,cell:6,w:2,h:1},{x:37,y:27,cell:6,w:2,h:1},
{x:16,y:28,cell:7,w:2,h:1},{x:18,y:28,cell:7,w:2,h:1},{x:20,y:28,cell:7,w:2,h:1},
{x:35,y:20,cell:8,w:3,h:2}
];
function legacyTownPath(x,y){return x===16&&y>=9&&y<=18||x===35&&y>=9&&y<=18||x===14&&y>=25&&y<=27||y===27&&x>=14&&x<=25;}

// Stable coordinate-based neighbourhoods; the original six services keep their doors.
function townHash(cx,cy,salt=0){let h=2166136261;for(const ch of [cx,cy,salt].join(':'))h=Math.imul(h^ch.charCodeAt(0),16777619);return h>>>0;}
export function townStyle(cx=0,cy=0){const n=townHash(cx,cy);return {district:['Jade','Canal','Lantern','Cedar'][n%4],density:cx===0&&cy===0?2:2+n%3,variant:n%4,paving:n%2?12:13};}
const layouts=new Map(),features=new Map();
export function townLayout(cx=0,cy=0){const key=cx+','+cy;if(layouts.has(key))return layouts.get(key);
 const style=townStyle(cx,cy),base=TOWN_LAYOUT.map((b,i)=>({...b,facade:b.kind==='home'?style.variant:b.kind==='inn'&&style.variant===2?1:b.kind==='herbalist'&&style.variant===1?2:b.kind==='forge'&&style.variant===3?3:null}));
 const plots=[{x:5,y:11},{x:39,y:23},{x:5,y:25},{x:39,y:11}];
 for(let n=0;n<style.density;n++){const p=plots[n];base.push({kind:'home',plot:n+1,name:['Canal Residence','Tea Merchant House','Cedar Cottage','Lantern Townhouse'][(style.variant+n)%4],...p,w:4,h:3,dx:2,facade:(style.variant+n)%4});}
 layouts.set(key,Object.freeze(base.map(Object.freeze)));return layouts.get(key);
}
export function townFeatures(cx=0,cy=0){const key=cx+','+cy;if(features.has(key))return features.get(key);
 const v=townStyle(cx,cy).variant,extra=[
 {x:16,y:19,asset:4,w:2,h:2},{x:31,y:17,asset:7,w:2,h:2},
 {x:18,y:16,asset:9,w:1,h:2},{x:31,y:19,asset:15,w:1,h:2},
 {x:20,y:25,asset:v%2?8:11,w:2,h:1},{x:33,y:16,asset:11,w:2,h:1},
 {x:9,y:16,asset:v%2?12:6,w:2,h:2},{x:38,y:16,asset:v%2?14:13,w:2,h:2},
 {x:9,y:21,asset:5,w:2,h:2},{x:9,y:27,asset:10,w:2,h:1},{x:39,y:27,asset:12,w:2,h:1}
 ];features.set(key,Object.freeze([...TOWN_FEATURES,...extra].map(f=>Object.freeze({...f}))));return features.get(key);
}
export function townPath(x,y,cx=0,cy=0){if(legacyTownPath(x,y))return true;
 // Clear a route from every added doorstep to the main east/west streets.
 for(const b of townLayout(cx,cy).filter(b=>b.plot)){const door=b.x+b.dx,front=b.y+b.h;
  if(x===door&&y>=Math.min(front,19)&&y<=Math.max(front,19))return true;
  if(y===19&&x>=Math.min(door,24)&&x<=Math.max(door,24))return true;
 }return false;
}
export function townGround(x,y,cx=0,cy=0){return townLayout(cx,cy).some(b=>x>=b.x-1&&x<=b.x+b.w&&y>=b.y-1&&y<=b.y+b.h+1)||townFeatures(cx,cy).some(f=>x>=f.x-1&&x<=f.x+f.w&&y>=f.y-1&&y<=f.y+f.h);}
