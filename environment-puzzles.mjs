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
 }const accepted=[];for(const object of objects)if(reachableExits(map,[...accepted,object]))accepted.push(object);return accepted;
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

// All mechanisms occupy reachable floor cells. Clearing obstacles is always possible
// through the existing maintenance-tool alternatives, so no required anatomy is assumed.
export function dungeonFeatures(map,seed,key,hash,level=0){
 const floors=[];for(let y=1;y<map.height-1;y++)for(let x=1;x<map.width-1;x++)if(map.grid[y][x]==='floor')floors.push({x,y});
 floors.sort((a,b)=>hash(seed,key,'feature',a.x,a.y)-hash(seed,key,'feature',b.x,b.y));
 if(floors.length<7)return [];
 const symbols=['Sun','Moon','Star','Wave','Root','Flame','Stone','Wind'],shift=hash(seed,key,'rune-order')%symbols.length;
 return [{...floors[0],id:'lever',kind:'lever',name:'Ancient counterweight'},
  {...floors[1],id:'treasure',kind:'treasure',name:'Sealed reliquary'},
  {...floors[2],id:'hazard',kind:'hazard',name:'Unstable floor'},
  ...[0,1,2].map(n=>({...floors[3+n],id:'rune-'+n,kind:'rune',order:n,name:symbols[(shift+n*3)%symbols.length]})),
  {...floors[6],id:'inscription',kind:'inscription',name:'Inscribed tablet'}];
}
export function visitDungeonRune(state,rune){
 state.runeStep??=0;if(state.solved||rune.kind!=='rune')return false;
 if(rune.order===state.runeStep){state.runeStep++;if(state.runeStep===3)state.solved=true;return true;}
 state.runeStep=rune.order===0?1:0;return false;
}
export function validateDungeonMechanisms(map,features){
 const cells=reachable(map,[]);return reachableExits(map,[])&&features.every(f=>cells.has(f.x+','+f.y))&&new Set(features.map(f=>f.x+','+f.y)).size===features.length;
}
export function secretPassage(map,seed,key,hash){
 const cells=[];for(let y=1;y<map.height-1;y++)for(let x=1;x<map.width-1;x++)if(map.grid[y][x]==='wall'&&DIRECTIONS.filter(([dx,dy])=>map.grid[y+dy]?.[x+dx]&&map.grid[y+dy][x+dx]!=='wall').length>=2)cells.push({x,y});
 return cells.length?cells[hash(seed,key,'hidden-passage')%cells.length]:null;
}
