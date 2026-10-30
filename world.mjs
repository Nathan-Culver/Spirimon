import {TOWN_LAYOUT,TOWN_FEATURES} from './towns.mjs';
export const ROOM_W=15,ROOM_H=11;
export function buildings(cx,cy){return TOWN_LAYOUT.map(b=>({...b,id:b.kind+'-'+cx+','+cy,footX:cx*48+b.x,footY:cy*36+b.y,doorX:cx*48+b.x+b.dx,doorY:cy*36+b.y+b.h-1}));}
export function makeInterior(building){return{...building,x:7,y:9,face:'up',outside:{x:building.doorX,y:building.doorY+1}};}
export function roomNPCs(room){const suffix=room.id.replace(/^[^-]+-/,'');if(room.kind==='forge')return[{id:'smith-'+suffix,name:'Smith Raku',role:'merchant',x:5,y:3}];if(room.kind==='herbalist')return[{id:'herbalist-'+suffix,name:'Herbalist Mei',role:'merchant',x:5,y:3}];if(room.kind==='archive')return[{id:'archivist-'+suffix,name:'Archivist Yun',role:'scholar',x:7,y:3}];return room.kind==='hall'?[{id:'keeper-'+suffix,name:'Keeper Iona',role:'keeper',x:7,y:3},{id:'scholar-'+suffix,name:'Scholar Elin',role:'scholar',x:11,y:5}]:room.kind==='inn'?[{id:'merchant-'+suffix,name:'Tavi',role:'merchant',x:4,y:3}]:[{id:'resident-'+suffix,name:'Housekeeper Sumi',role:'resident',x:5,y:4}];}
export function roomTile(kind,x,y){kind=kind==='archive'?'hall':kind==='forge'?'inn':kind==='herbalist'?'home':kind;if(x===7&&y===10)return'exit';if(x<1||x>13||y<1||y>9)return'wall';if(y===1)return'wall-art';if(kind==='hall'){if(y===2&&x>=5&&x<=9)return'altar';if((x===3||x===11)&&y>=2&&y<=4)return'shelf';if(y===6&&[3,4,10,11].includes(x))return'cushion';if(y>=3&&y<=8&&x>=6&&x<=8)return'rug';}
if(kind==='inn'){if([9,12].includes(x)&&[2,3,5,6].includes(y))return'bed';if(y===3&&x>=2&&x<=6)return'counter';if(x>=3&&x<=5&&y>=6&&y<=7)return'table';}
if(kind==='home'){if(x>=10&&x<=12&&y>=2&&y<=3)return'bed';if(x>=3&&x<=5&&y>=6&&y<=7)return'table';if(y===2&&x>=2&&x<=5)return'shelf';if(x>=7&&x<=9&&y>=4&&y<=7)return'tatami';}
return'floor';}
export function roomWalkable(kind,x,y){return['exit','floor','rug','tatami','cushion'].includes(roomTile(kind,x,y));}

// Physical bases of decorative props, measured in town-grid tiles. Upper artwork is canopy/height, not a walkable floor.
export function featureFootprintBlocked(lx,ly){
 // Props extend above their ground anchors; collide only with their grounded bases.
 for(const f of TOWN_FEATURES){
  const left=f.x+(f.w-1)/2,centerY=f.y+f.h-1;
  const radius=f.cell===8?1.55:f.cell===5?.85:f.w===2?.9:.65;
  if(Math.abs(lx-left)<=radius&&ly>=centerY-(f.cell===8?1:0)&&ly<=centerY+.55)return true;
 }
 // Central well and decorative plaza monument are rendered independently of TOWN_FEATURES.
 if(Math.abs(lx-27)<=1&&Math.abs(ly-18)<=1)return true;
 if(Math.abs(lx-33)<=1&&Math.abs(ly-14)<=1)return true;
 return false;
}
