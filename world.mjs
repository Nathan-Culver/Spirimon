import {townLayout,townFeatures as generatedTownFeatures} from './towns.mjs';
import {sceneryFootprintBlocked} from './scenery.mjs';
export const ROOM_W=15,ROOM_H=11;
export function buildings(cx,cy){return townLayout(cx,cy).map(b=>({...b,id:b.kind+(b.plot?'-plot'+b.plot:'')+'-'+cx+','+cy,footX:cx*48+b.x,footY:cy*36+b.y,doorX:cx*48+b.x+b.dx,doorY:cy*36+b.y+b.h-1}));}
export function makeInterior(building){return{...building,x:7,y:9,face:'up',outside:{x:building.doorX,y:building.doorY+1}};}
export function roomNPCs(room){const suffix=room.id.replace(/^[^-]+-/,'');if(room.kind==='forge')return[{id:'smith-'+suffix,name:'Smith Raku',role:'merchant',x:5,y:3}];if(room.kind==='herbalist')return[{id:'herbalist-'+suffix,name:'Herbalist Mei',role:'merchant',x:5,y:3}];if(room.kind==='archive')return[{id:'archivist-'+suffix,name:'Archivist Yun',role:'scholar',x:7,y:3}];return room.kind==='hall'?[{id:'keeper-'+suffix,name:'Keeper Iona',role:'keeper',x:7,y:3},{id:'scholar-'+suffix,name:'Scholar Elin',role:'scholar',x:11,y:5}]:room.kind==='inn'?[{id:'merchant-'+suffix,name:'Tavi',role:'merchant',x:4,y:3}]:[{id:'resident-'+suffix,name:'Housekeeper Sumi',role:'resident',x:5,y:4}];}
// Furnishings have an explicit grounded footprint, shared by drawing and movement.
const f=(asset,x,y,w=2,h=2)=>({asset,x,y,w,h,depth:1});
const ROOM_PROPS={
 hall:[f('altar',6,1,3,2),f('bookshelf',2,2),f('bookshelf',10,2),f('chair',3,6,1,1),f('chair',10,6,1,1),f('vase',2,7,1,2),f('vase',12,7,1,2)],
 archive:[f('bookshelf',2,2),f('bookshelf',10,2),f('bookshelf',2,5),f('bookshelf',10,6),f('writing-desk',6,5,3,2),f('vase',12,7,1,2)],
 inn:[f('counter',2,1,4,2),f('bed',10,2,2,3),f('bed',10,6,2,3),f('tea-table',3,6,3,2),f('chair',2,7,1,1),f('plant',12,3,1,2),f('hearth',2,3,2,2)],
 home:[f('bed',10,2,2,3),f('bookshelf',2,1),f('tea-table',3,6,3,2),f('chair',2,7,1,1),f('hearth',2,3,2,2),f('plant',12,6,1,2),f('crates',10,7,2,2)],
 forge:[f('forge',10,1,3,3),f('counter',2,1,4,2),f('anvil',9,6,3,2),f('crates',2,6,2,2),f('crates',11,7,2,2)],
 herbalist:[f('apothecary',2,1,3,2),f('apothecary',10,1,3,2),f('counter',3,5,3,2),f('plant',10,6),f('plant',2,7),f('vase',12,7,1,2)]
};
export function roomFurnishings(kind){return ROOM_PROPS[kind]||ROOM_PROPS.home;}
export function roomTile(kind,x,y){if(x===7&&y===10)return'exit';if(x<1||x>13||y<1||y>9)return'wall';if(y===1)return'wall-art';
 for(const f of roomFurnishings(kind))if(sceneryFootprintBlocked(f,x,y))return'furniture';
 if((kind==='hall'||kind==='archive')&&x>=6&&x<=8&&y>=3&&y<=8)return'rug';
 if((kind==='home'||kind==='herbalist')&&x>=6&&x<=9&&y>=5&&y<=8)return'tatami';
 if(kind==='inn'&&x>=6&&x<=8&&y>=3&&y<=8)return'rug';return'floor';}
export function roomWalkable(kind,x,y){return['exit','floor','rug','tatami'].includes(roomTile(kind,x,y));}

// Only the bottom row blocks movement.
export function townFeatures(cx=0,cy=0){return generatedTownFeatures(cx,cy);}
export const PLAZA_FEATURES=Object.freeze([
 Object.freeze({kind:'well',x:26,y:17,w:3,h:2}),
 Object.freeze({kind:'monument',x:32,y:12,w:3,h:3})
]);
export function buildingFootprintBlocked(b,x,y){
 return !(x===b.doorX&&y===b.doorY)&&sceneryFootprintBlocked({...b,x:b.footX,y:b.footY},x,y);
}
export function featureFootprintBlocked(lx,ly,cx=0,cy=0){
 return [...townFeatures(cx,cy),...PLAZA_FEATURES].some(f=>sceneryFootprintBlocked(f,lx,ly));
}

export function normalizeInteriorPosition(room){const npcs=roomNPCs(room),seen=new Set(),q=[[7,9]],valid=[];while(q.length){const [x,y]=q.shift(),key=x+','+y;if(seen.has(key)||!roomWalkable(room.kind,x,y))continue;seen.add(key);if(!npcs.some(n=>n.x===x&&n.y===y))valid.push({x,y});for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]])q.push([x+dx,y+dy]);}
 if(!valid.some(p=>p.x===room.x&&p.y===room.y)){const next=valid.sort((a,b)=>(Math.abs(a.x-room.x)+Math.abs(a.y-room.y))-(Math.abs(b.x-room.x)+Math.abs(b.y-room.y)))[0]||{x:7,y:9};room.x=next.x;room.y=next.y;room.trail=[{...next,face:room.face||'down'}];delete room.walkStart;}return room;}
