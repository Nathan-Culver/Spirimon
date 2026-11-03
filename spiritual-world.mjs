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
  const kind=E.hash(seed,cx,cy,n)%8;out.push({id:'shrine-'+cx+','+cy+'-'+n,x,y,kind,name:['Lantern','River','Wind','Stone','Dawn','Moon','Grove','Crystal'][kind]+' Shrine'});break;
 }
 cache.set(key,out);return out;
}
export function nearbyShrine(save){if(save.cave||save.interior)return null;const p=E.coord(save.player.x,save.player.y);return shrinesForRegion(save.seed,p.cx,p.cy).find(t=>Math.abs(t.x-save.player.x)+Math.abs(t.y-save.player.y)<=2)||null;}
// Detailed, cached pixel-art shrine sprites. Each variant is painted once onto its
// own offscreen atlas, then reused without allocating geometry during world frames.
const shrineSprites=new Map();
const SHRINE_THEMES=[
 {roof:'#42515b',trim:'#d5a45f',wood:'#76513f',glow:'#f7cc72',stone:'#8e968c'},
 {roof:'#3c7277',trim:'#c4e6d5',wood:'#536e70',glow:'#79d9e6',stone:'#8caaa3'},
 {roof:'#6a7187',trim:'#d9c5a1',wood:'#796e70',glow:'#b5d4f7',stone:'#a4a8aa'},
 {roof:'#62615e',trim:'#d1bb85',wood:'#68645d',glow:'#e7cb8b',stone:'#989b91'},
 {roof:'#a15c4e',trim:'#eac57a',wood:'#8e5948',glow:'#ffde94',stone:'#a8a49a'},
 {roof:'#4e4c75',trim:'#d7c3ed',wood:'#5c5273',glow:'#d6b3ff',stone:'#a3a0b6'},
 {roof:'#47705a',trim:'#b3d89b',wood:'#6d5d40',glow:'#b4f2a1',stone:'#929c86'},
 {roof:'#62558a',trim:'#c5b4eb',wood:'#675c80',glow:'#a8baff',stone:'#a6a2bc'}
];
function shrineSprite(kind,used){
 const key=kind+':'+used;if(shrineSprites.has(key))return shrineSprites.get(key);
 const canvas=document.createElement('canvas');canvas.width=112;canvas.height=128;
 const g=canvas.getContext('2d'),p=SHRINE_THEMES[kind%8],rect=(x,y,w,h,color)=>{g.fillStyle=color;g.fillRect(x,y,w,h);};
 const line=(x,y,w,h,color)=>rect(x,y,w,h,color);
 const poly=(points,color)=>{g.fillStyle=color;g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fill();};
 const glow=used?'#777a7c':p.glow;
 const stone=(x,y,w,h)=>{rect(x+2,y+2,w,h,'#454b4a');rect(x,y,w,h,p.stone);line(x,y,w,2,'#c5c5ae');for(let a=4;a<w-3;a+=12)rect(x+a,y+Math.floor(a/12)%2*4+5,5,2,'#747d76');};
 const lamp=(x,y)=>{stone(x-5,y+14,10,5);rect(x-2,y+2,4,13,'#737b75');rect(x-7,y,14,3,'#3c4a4d');rect(x-5,y-10,10,11,'#4e5554');rect(x-3,y-8,6,7,glow);rect(x-7,y-12,14,3,p.trim);rect(x-3,y-16,6,4,p.roof);};
 const banner=(x,y)=>{rect(x,y,2,27,p.trim);rect(x+2,y+3,11,23,p.roof);poly([[x+2,y+26],[x+7,y+22],[x+13,y+26]],p.roof);rect(x+6,y+10,4,4,p.trim);};
 // Mossy stepped plaza and stone path.
 stone(18,105,76,9);stone(25,114,62,7);stone(34,121,44,5);
 for(let i=0;i<10;i++){const x=14+(i*23)%83,y=106+(i*7)%18;rect(x,y,3+(i%3),2,i%2?'#5b9167':'#b6c1a4');}
 if(kind===1||kind===7){ // River / Crystal: spring or crystal sanctuary.
  stone(20,58,72,45);rect(25,78,62,22,kind===1?'#397d87':'#66638d');
  rect(29,82,54,15,kind===1?'#61c7d2':'#7d9ee4');
  for(let i=0;i<8;i++)rect(31+i*6,86+(i%3)*3,4,2,'#b5e9f0');
  for(let i=0;i<3;i++){const x=39+i*15;poly([[x,79],[x-6,66-i*3],[x,46-i*3],[x+7,66-i*3]],i===1?glow:p.trim);line(x-2,57-i*3,3,12,'#eef4f2');}
  stone(14,55,10,45);stone(88,55,10,45);
 }else if(kind===3){ // Ancient standing-stone shrine.
  stone(24,44,18,58);stone(70,44,18,58);stone(35,27,42,17);
  rect(48,59,16,32,'#4c5355');rect(51,66,10,16,glow);
  for(const x of [28,74]){rect(x+4,53,4,4,'#cbd6c2');rect(x+4,65,4,4,'#627e6d');}
 }else if(kind===6){ // Living tree sanctuary.
  rect(46,42,20,60,'#594c38');rect(51,48,5,52,'#a58c5c');
  for(const [x,y,w,h] of [[19,35,40,28],[48,21,44,32],[28,15,47,27],[60,37,31,25]]){rect(x+2,y+4,w,h,'#2d5544');rect(x,y,w,h,'#5e9d67');rect(x+4,y+4,w-8,5,'#9ac87b');}
  rect(47,71,19,27,'#2b3b34');rect(52,77,9,12,glow);
  for(const x of [21,88])lamp(x,83);
 }else{ // Timber-and-stone sanctuaries with detailed layered roofs.
  stone(23,76,66,27);rect(28,50,56,48,p.wood);
  for(let i=0;i<6;i++)rect(31+i*9,54,3,39,'#ad8c68');
  rect(44,65,24,33,'#342e33');rect(49,73,14,19,glow);
  rect(53,76,6,10,used?'#4f5962':'#fff1be');
  poly([[15,49],[31,31],[81,31],[98,49],[95,55],[17,55]],p.roof);
  poly([[23,37],[38,22],[74,22],[89,37]],p.trim);
  poly([[26,34],[41,17],[71,17],[86,34]],p.roof);
  rect(39,34,34,5,p.trim);rect(44,27,24,7,'#303b42');
  rect(52,24,8,7,p.trim);
  for(let i=0;i<9;i++)rect(20+i*9,48+(i%2)*2,6,2,'#b1b8ad');
  for(const x of [17,95])lamp(x,83);
 }
 if(kind===0||kind===4){banner(14,42);banner(86,42);}
 if(kind===2){ // Wind bells and prayer ribbons.
  for(let i=0;i<4;i++){let x=31+i*16;rect(x,51,1,10,p.trim);rect(x-3,61,7,5,glow);rect(x,66,1,7,'#e8d9b5');}
 }
 if(kind===5){ // Moon shrine's crescent emblem.
  g.fillStyle=p.trim;g.beginPath();g.arc(56,42,9,0,Math.PI*2);g.fill();
  g.fillStyle=p.roof;g.beginPath();g.arc(60,38,8,0,Math.PI*2);g.fill();
 }
 if(kind===7){for(const x of [19,93])lamp(x,78);}
 if(kind===1){for(const x of [16,96])lamp(x,77);}
 // Small ground details and flowers tie the sprite to the landscape.
 for(let i=0;i<12;i++){let x=8+(i*37)%98,y=103+(i*11)%20;rect(x,y,3,2,i%3?'#4b8855':'#b6d6a4');if(i%4===0)rect(x+1,y-2,2,2,kind===5?'#d4b2ec':'#f0c3d3');}
 shrineSprites.set(key,canvas);return canvas;
}
export function drawShrine(c,x,y,used=false,kind=0){
 const sprite=shrineSprite(kind,used);
 c.save();c.imageSmoothingEnabled=false;
 // Shrine's ground contact remains at its original 32px interaction tile.
 c.drawImage(sprite,Math.round(x-40),Math.round(y-96),112,128);
 c.restore();
}
