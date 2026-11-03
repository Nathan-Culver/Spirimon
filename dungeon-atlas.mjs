// Pixel-aligned 32x32 authored dungeon atlas. Tiles are painted once, then blitted.
// Layout: 8 columns x 8 rows. Four biome palettes, 16 individually detailed tiles each.
export const DUNGEON_TILE=32;
const palettes=[
 ['#343638','#575653','#858178','#b6aa94','#25292c','#49604a','#bda66b'],
 ['#323b36','#586655','#85927a','#c0b99b','#202c28','#56764b','#c1a36b'],
 ['#2c3742','#506578','#839baa','#b6cad0','#1b2836','#456d76','#b5a78e'],
 ['#40352f','#69554a','#9b806c','#d0b49a','#30252a','#6c6548','#c8a36e']
];
const rnd=(seed)=>{let n=seed>>>0;return()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;}};
function paint(c,x,y,kind,p,seed){
 const r=rnd(seed),[dark,mid,light,shine,shadow,moss,ochre]=p;
 const rect=(color,a,b,w,h)=>{c.fillStyle=color;c.fillRect(x+a,y+b,w,h);};
 const line=(color,pts)=>{c.strokeStyle=color;c.lineWidth=1;c.beginPath();c.moveTo(x+pts[0],y+pts[1]);for(let i=2;i<pts.length;i+=2)c.lineTo(x+pts[i],y+pts[i+1]);c.stroke();};
 rect(dark,0,0,32,32);
 if(kind<6||kind===12||kind===13){
  // Offset slabs with broken edges and mineral noise, no identical four-square grids.
  rect(mid,0,0,32,32);
  for(let i=0;i<17;i++){let a=Math.floor(r()*31),b=Math.floor(r()*31),w=2+Math.floor(r()*12),h=1+Math.floor(r()*6);rect(i%4===0?light:i%3===0?dark:mid,a,b,Math.min(w,32-a),Math.min(h,32-b));}
  for(let i=0;i<45;i++){let a=Math.floor(r()*32),b=Math.floor(r()*32);rect(i%4===0?shine:i%3===0?shadow:dark,a,b,1,1);}
  if(kind===1||kind===3){line(shadow,[3,8,12,11,16,17,13,24]);line(light,[4,7,13,10]);}
  if(kind===2||kind===3){for(let i=0;i<20;i++)rect(moss,Math.floor(r()*32),Math.floor(r()*32),1+Math.floor(r()*3),1+Math.floor(r()*2));}
  if(kind===4){for(let i=0;i<14;i++)rect(ochre,Math.floor(r()*32),Math.floor(r()*32),1+Math.floor(r()*3),1);}
  if(kind===5){rect(shadow,5,18,21,9);rect('#24494e',6,18,19,7);rect('#3d7781',8,19,13,2);}
 }else if(kind>=6&&kind<=11){
  // Rough wall faces with organic silhouette; corners and edges are distinct atlas tiles.
  rect(shadow,0,0,32,32);
  for(let i=0;i<20;i++){let a=Math.floor(r()*32),b=Math.floor(r()*32),w=5+Math.floor(r()*12),h=3+Math.floor(r()*8);rect(i%4===0?light:i%3===0?dark:mid,a,b,Math.min(w,32-a),Math.min(h,32-b));}
  for(let i=0;i<24;i++)rect(i%3===0?shine:dark,Math.floor(r()*32),Math.floor(r()*32),1+Math.floor(r()*4),1);
  if(kind===6||kind===8||kind===10){rect(shadow,0,24,32,8);rect(light,1,20,29,2);}
  if(kind===7||kind===9){rect(shadow,0,0,6,32);rect(light,6,2,2,25);}
  if(kind===10||kind===11){for(let i=0;i<16;i++)rect(moss,Math.floor(r()*30),Math.floor(r()*30),2,1+Math.floor(r()*4));}
 }else if(kind===14){
  rect(shadow,2,2,28,28);rect(light,3,3,4,26);rect(light,25,3,4,26);
  for(let i=0;i<6;i++){rect(i%2?mid:light,7,4+i*4,18,3);rect(shadow,7,7+i*4,18,1);}
 }else if(kind===15){
  rect(mid,0,0,32,32);rect(shadow,2,4,28,26);
  for(let i=0;i<6;i++){rect(i%2?light:shine,5,6+i*4,22,3);rect(dark,5,9+i*4,22,1);}
  rect(ochre,13,1,6,3);
 }
 if(kind===12){ // crystalline outcrop
  rect(shadow,5,23,24,5);rect('#354d62',9,12,7,14);rect('#72c9d4',11,5,7,20);rect('#b2f3ec',13,7,2,14);rect('#547bb6',20,13,6,14);rect('#b3dbf1',22,14,2,10);
 }
 if(kind===13){ // vegetation, ruins and fallen stones
  rect(shadow,3,21,27,7);rect(light,4,16,12,10);rect(shine,5,16,10,2);rect(dark,16,21,12,6);
  for(let i=0;i<14;i++)rect(moss,Math.floor(r()*29),12+Math.floor(r()*17),2+Math.floor(r()*3),1+Math.floor(r()*3));
 }
}
let atlas=null;
export function dungeonAtlas(){
 if(atlas)return atlas;
 const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;
 const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;
 for(let biome=0;biome<4;biome++)for(let kind=0;kind<16;kind++){
  const index=biome*16+kind;paint(c,(index%8)*32,Math.floor(index/8)*32,kind,palettes[biome],(biome+1)*982451653+kind*7919);
 }
 atlas=canvas;return atlas;
}
export function drawDungeonAtlasTile(ctx,biome,kind,x,y){
 const atlas=dungeonAtlas(),index=(biome%4)*16+(kind%16);
 ctx.drawImage(atlas,index%8*32,Math.floor(index/8)*32,32,32,Math.round(x),Math.round(y),32,32);
}
