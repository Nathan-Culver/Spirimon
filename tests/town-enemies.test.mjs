import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../engine.mjs';
import * as W from '../world.mjs';
import {DAY_MS,CYCLE_MS} from '../spiritual-core.mjs';
import {waitingEnemies} from '../npc-world.mjs';
function towns(seed){const result=[];for(let x=-12;x<=12;x++)for(let y=-12;y<=12;y++)if((x||y)&&E.region(seed,x,y).town)result.push([x,y]);return result;}
test('all nonstarting towns generate 1–3 legal, distinct hostile Sealers',()=>{
 const counts=new Set();for(const seed of ['town-patrols','second-world']){const s=E.newGame(seed),places=towns(seed);assert.ok(places.length>10);
  for(const [cx,cy]of places.slice(0,45)){
   const group=waitingEnemies(s,cx,cy);assert.ok(group.length>=1&&group.length<=3);counts.add(group.length);
   const buildings=W.buildings(cx,cy);assert.equal(new Set(group.map(n=>n.id)).size,group.length);
   for(const n of group){assert.equal(n.role,'villain');assert.ok(E.walkable(E.tile(seed,n.x,n.y)));assert.ok(!buildings.some(b=>W.buildingFootprintBlocked(b,n.x,n.y)));assert.ok(!W.featureFootprintBlocked(n.x-cx*48,n.y-cy*36,cx,cy));}
  }
 }assert.deepEqual([...counts].sort(),[1,2,3]);
});
test('patrols preserve positions and defeated state until dusk, then refresh at dusk and dawn',()=>{
 const s=E.newGame('patrol-clock'),[cx,cy]=towns(s.seed)[0],key=cx+','+cy;
 const day=waitingEnemies(s,cx,cy);day[0].x++;s.npcBattles={[day[0].id]:{defeated:true}};s.enemyConversations={[day[0].id]:{count:1}};
 s.playTime=DAY_MS-1;assert.equal(waitingEnemies(s,cx,cy),day);assert.deepEqual(waitingEnemies(structuredClone(s),cx,cy),day);assert.ok(s.npcBattles[day[0].id].defeated);
 s.playTime=DAY_MS;const night=waitingEnemies(s,cx,cy);assert.notDeepEqual(night.map(n=>n.id),day.map(n=>n.id));assert.equal(s.npcBattles[day[0].id],undefined);assert.equal(s.enemyConversations[day[0].id],undefined);assert.equal(s.waitingEnemyPhases[key],'0:night');
 s.playTime=CYCLE_MS;const next=waitingEnemies(s,cx,cy);assert.notDeepEqual(next.map(n=>n.id),night.map(n=>n.id));assert.equal(s.waitingEnemyPhases[key],'1:day');
});
test('old saves gain town patrols immediately without resetting the world',()=>{
 const s=E.newGame('old-patrol'),[cx,cy]=towns(s.seed)[0],key=cx+','+cy;s.waitingEnemies={[key]:[]};assert.ok(waitingEnemies(s,cx,cy).length>=1);assert.equal(s.waitingEnemyPhases[key],'0:day');assert.deepEqual(waitingEnemies(s,0,0),[]);
});
test('a patrol refresh waits for an existing approach to finish',()=>{
 const s=E.newGame('accepted-challenge'),[cx,cy]=towns(s.seed)[0],group=waitingEnemies(s,cx,cy);
 s.challengers={pending:{npc:{id:group[0].id},team:[{id:'preserved-team'}]}};s.playTime=DAY_MS;
 assert.equal(waitingEnemies(s,cx,cy),group);assert.equal(s.challengers.pending.team[0].id,'preserved-team');s.challengers.pending=null;assert.notEqual(waitingEnemies(s,cx,cy),group);
});
test('wilderness patrols keep their existing probability and do not refresh with town patrols',()=>{
 const s=E.newGame('wild-patrols'),groups=[];for(let x=1;x<16;x++)if(!E.region(s.seed,x,1).town){const group=waitingEnemies(s,x,1);assert.ok(group.length<=1);groups.push([x,group]);}
 s.playTime=DAY_MS;for(const [x,group]of groups)assert.equal(waitingEnemies(s,x,1),group);
});

test('hostile patrol members actually wander locally while defeated members stay put',async()=>{
 const {readFileSync}=await import('node:fs'),vm=await import('node:vm');
 const source=readFileSync(new URL('../app.mjs',import.meta.url),'utf8'),start=source.indexOf('function wanderNPCs('),end=source.indexOf('\nfunction ',start+1),npc={id:'watcher-test',role:'villain',x:26,y:20},walk=new Map([[npc.id,{x:26,y:20,homeX:26,homeY:20,next:0}]]),randomMath=Object.create(Math);randomMath.random=()=>.5;
 const save={seed:'walk',player:{x:24,y:10},roamers:{}},h=vm.createContext({s:save,npcWander:walk,Math:randomMath,modal:null,battle:null,challengerApproach:null,view:'explore',document:{querySelector:()=>({width:480,height:320})},E:{coord:E.coord,region:()=>({town:true}),tile:()=> 'path',walkable:()=>true},W:{buildings:()=>[]},buildingSpriteBlocked:()=>false,townNPCs:(x,y)=>!x&&!y?[npc]:[]});
 vm.runInContext(source.slice(start,end),h);h.wanderNPCs(10000);assert.equal(walk.get(npc.id).x,25);
 save.npcBattles={[npc.id]:{defeated:true}};h.wanderNPCs(30000);assert.equal(walk.get(npc.id).x,25);
});
