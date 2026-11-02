// Deterministic environmental puzzles. Critical routes never require a particular Spirimon.
export const DIRECTIONS=[[1,0],[-1,0],[0,1],[0,-1]];
export function puzzleObjects(map,seed,key,hash){
 const objects=[];for(let y=2;y<map.height-2;y++)for(let x=2;x<map.width-2;x++){
 if(map.grid[y][x]!=='floor')continue;
 const neighbors=DIRECTIONS.filter(([dx,dy])=>map.grid[y+dy]?.[x+dx]!=='wall'&&map.grid[y+dy]?.[x+dx]!==undefined);
 if(neighbors.length<2)continue;
 const n=hash(seed,'environment',key,x,y);if(n%11!==0)continue;
 const kind=['push','cleave','crush'][n%3];
 // Movable boulders require space behind them; all objects have an alternative inspection solution.
 if(kind==='push'&&!DIRECTIONS.some(([dx,dy])=>map.grid[y+dy]?.[x+dx]==='floor'&&map.grid[y-dy]?.[x-dx]==='floor'))continue;
 objects.push({id:x+','+y,x,y,kind});
 }return objects;
}
export function resolvedObjects(base,changes={}){
 return base.filter(o=>changes[o.id]!==null).map(o=>({...o,...(changes[o.id]||{})}));
}
export function reachable(map,objects,start={x:1,y:1}){
 const blocked=new Set(objects.map(o=>o.x+','+o.y)),seen=new Set([start.x+','+start.y]),queue=[start];
 while(queue.length){const {x,y}=queue.shift();for(const [dx,dy] of DIRECTIONS){const nx=x+dx,ny=y+dy,k=nx+','+ny;if(!seen.has(k)&&!blocked.has(k)&&map.grid[ny]?.[nx]&&map.grid[ny][nx]!=='wall'){seen.add(k);queue.push({x:nx,y:ny});}}}
 return seen;
}
export function reachableExits(map,objects,start){const seen=reachable(map,objects,start);return map.exits.every(e=>seen.has(e.x+','+e.y));}
