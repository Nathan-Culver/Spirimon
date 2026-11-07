// Offline QA controller: walks the real collision maps and interacts at reachable tiles.
import * as E from '../engine.mjs';
import * as FC from '../faction-campaigns.mjs';
import * as TP from '../temple-philosophies.mjs';
export function walkTo(save,room,feature,map,objects=[],step=()=>{}){
 const blocked=new Set(objects.map(o=>o.x+','+o.y)),queue=[[room.x,room.y]],parents=new Map([[room.x+','+room.y,null]]);let end;
 for(let i=0;i<queue.length;i++){
  const [x,y]=queue[i],key=x+','+y;if(Math.abs(x-feature.x)+Math.abs(y-feature.y)<=1){end=key;break;}
  for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=nx+','+ny;if(!parents.has(k)&&E.caveWalkable(map,nx,ny)&&!blocked.has(k)){parents.set(k,key);queue.push([nx,ny]);}}
 }
 if(!end)throw Error('Unreachable physical objective: '+feature.name);
 const path=[];for(let k=end;parents.get(k)!==null;k=parents.get(k))path.push(k.split(',').map(Number));
 for(const [x,y]of path.reverse()){room.x=x;room.y=y;save.steps=(save.steps||0)+1;if(save.sealer)save.sealer.clockMs+=170;step();}
 return path.length;
}
export function approachFaction(save,id,floor,feature){
 const room=save.cave,layout=FC.layout(save.seed,id,floor);if(!room||room.faction!==id||room.level!==floor)throw Error('Wrong physical faction floor');
 walkTo(save,room,feature,layout.map,[...layout.objects,...layout.features.filter(f=>['faction-guard','faction-leader'].includes(f.kind))],()=>FC.step(save));
 return FC.interact(save,id,floor,feature);
}
export function solveTempleFloor(save,room){
 save.cave=room;const layout=TP.trialLayout(room),nodes=layout.features.filter(f=>f.id.startsWith('temple-node-')),interact=feature=>{
  walkTo(save,room,feature,TP.trialMap(save,room),layout.objects,()=>TP.trialStep(save,room,null,0));const r=TP.interactTrial(save,room,feature);if(!r.ok)throw Error(r.message);return r;
 };
 interact(layout.features.find(f=>f.kind==='temple-inscription'));
 const p=room.philosophy,clue=TP.trialClue(save,room),symbols=['Root','Moon','Star'];
 if(['Attrition','Resilience'].includes(p))for(const f of nodes)interact(f);
 if(p==='Counterplay')for(let n=0;n<3;n++){const attack=TP.trialClue(save,room).match(/3: (Flame|Wave|Wind)/)[1];interact(nodes[['Flame','Wave','Wind'].indexOf(attack)]);}
 if(p==='Tempo')for(const symbol of clue.match(/Beat order: ([^.]+)\./)[1].split(' → '))interact(nodes[symbols.indexOf(symbol)]);
 if(p==='Control'){
  const target=clue.match(/Star: (ON|OFF) \/ (ON|OFF) \/ (ON|OFF)/).slice(1).reduce((n,v,i)=>n+(v==='ON'?1<<i:0),0),masks=[3,6,4];
  const solution=Array.from({length:8},(_,n)=>n).find(bits=>masks.reduce((mask,v,i)=>mask^(bits&(1<<i)?v:0),0)===target);
  for(let i=0;i<3;i++)if(solution&(1<<i))interact(nodes[i]);
 }
 if(p==='Transformation')for(let i=0;i<3;i++){if(i)interact(layout.features.find(f=>f.kind==='temple-phase'));interact(nodes[i]);}
 if(p==='Synergy')for(const i of [0,1,1,2,2,0])interact(nodes[i]);
 if(p==='Prediction')for(let n=0;n<3;n++){const sequence=TP.trialClue(save,room).match(/3: (.+) → \?/)[1].split(' → ');interact(nodes[symbols.indexOf(sequence[2])]);}
 if(!TP.canAdvanceTrial(save,room))throw Error('Physical '+p+' trial remained sealed');
 walkTo(save,room,{x:23,y:17,name:'Exit stairs'},TP.trialMap(save,room),layout.objects);
 return TP.trialState(save,room);
}
