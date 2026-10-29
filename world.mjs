export const ROOM_W=15,ROOM_H=11;
export function buildings(cx,cy){return[
{id:'hall-'+cx+','+cy,kind:'hall',name:'Sealer Hall',doorX:cx*48+22,doorY:cy*36+14},
{id:'inn-'+cx+','+cy,kind:'inn',name:'Lantern Inn',doorX:cx*48+30,doorY:cy*36+14},
{id:'home-'+cx+','+cy,kind:'home',name:'Village House',doorX:cx*48+31,doorY:cy*36+24}
];}
export function makeInterior(building){return{...building,x:7,y:9,face:'up',outside:{x:building.doorX,y:building.doorY+1}};}
export function roomNPCs(room){const suffix=room.id.replace(/^[^-]+-/,'');return room.kind==='hall'?[{id:'keeper-'+suffix,name:'Keeper Iona',role:'keeper',x:7,y:3},{id:'scholar-'+suffix,name:'Scholar Elin',role:'scholar',x:11,y:5}]:room.kind==='inn'?[{id:'merchant-'+suffix,name:'Tavi',role:'merchant',x:4,y:3}]:[{id:'resident-'+suffix,name:'Housekeeper Sumi',role:'resident',x:5,y:4}];}
export function roomTile(kind,x,y){if(x===7&&y===10)return'exit';if(x<1||x>13||y<1||y>9)return'wall';if(y===1)return'wall-art';if(kind==='hall'){if(y===2&&x>=5&&x<=9)return'altar';if((x===3||x===11)&&y>=2&&y<=4)return'shelf';if(y===6&&[3,4,10,11].includes(x))return'cushion';if(y>=3&&y<=8&&x>=6&&x<=8)return'rug';}
if(kind==='inn'){if([9,12].includes(x)&&[2,3,5,6].includes(y))return'bed';if(y===3&&x>=2&&x<=6)return'counter';if(x>=3&&x<=5&&y>=6&&y<=7)return'table';}
if(kind==='home'){if(x>=10&&x<=12&&y>=2&&y<=3)return'bed';if(x>=3&&x<=5&&y>=6&&y<=7)return'table';if(y===2&&x>=2&&x<=5)return'shelf';if(x>=7&&x<=9&&y>=4&&y<=7)return'tatami';}
return'floor';}
export function roomWalkable(kind,x,y){return['exit','floor','rug','tatami','cushion'].includes(roomTile(kind,x,y));}
