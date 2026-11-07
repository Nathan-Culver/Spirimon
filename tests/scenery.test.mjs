import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import * as E from '../engine.mjs';
import * as W from '../world.mjs';
import * as SW from '../spiritual-world.mjs';
import {sceneryBaseRow,sceneryFootprintBlocked,sceneryDepth,caveFootprint,caveRimBlocked} from '../scenery.mjs';

const source=readFileSync(new URL('../app.mjs',import.meta.url),'utf8');
function extract(name){const start=source.indexOf('function '+name+'('),end=source.slice(start+1).search(/\n(?:async )?function /);assert.ok(start>=0);return source.slice(start,end<0?source.length:start+1+end);}

test('all generated building upper rows are walkable; only the front row blocks and doors remain usable',()=>{
 for(let cy=-3;cy<=3;cy++)for(let cx=-3;cx<=3;cx++){
  if(!E.region('opening',cx,cy).town)continue;
  for(const b of W.buildings(cx,cy))for(let y=b.footY;y<b.footY+b.h;y++)for(let x=b.footX;x<b.footX+b.w;x++){
   const base=y===b.doorY,door=x===b.doorX&&base;
   assert.equal(W.buildingFootprintBlocked(b,x,y),base&&!door,b.id+' at '+x+','+y);
   assert.equal(E.walkable(E.tile('opening',x,y)),!base,b.id+' terrain at '+x+','+y);
  }
 }
});

test('every outdoor prop and plaza feature has exactly one blocked row, including monuments and wells',()=>{
 for(let cy=-2;cy<=2;cy++)for(let cx=-2;cx<=2;cx++)for(const f of [...W.townFeatures(cx,cy),...W.PLAZA_FEATURES]){
  const base=sceneryBaseRow(f);
  for(let y=f.y-4;y<=base+1;y++)for(let x=f.x-1;x<=f.x+f.w;x++){
   assert.equal(sceneryFootprintBlocked(f,x,y),y===base&&x>=f.x&&x<f.x+f.w);
   if(y===base&&x>=f.x&&x<f.x+f.w)assert.ok(W.featureFootprintBlocked(x,y,cx,cy));
  }
 }
 for(const [x,y] of [[27,17],[33,13],[36,20]])assert.equal(W.featureFootprintBlocked(x,y),false,'upper row '+x+','+y);
});

test('beds, forges and all other furniture allow movement behind every row above their base',()=>{
 for(const kind of new Set(W.buildings(0,0).map(b=>b.kind)))for(const f of W.roomFurnishings(kind)){
  const base=sceneryBaseRow(f);
  for(let y=Math.max(2,f.y);y<=base;y++)for(let x=f.x;x<f.x+f.w;x++){
   const blocked=W.roomFurnishings(kind).some(p=>sceneryFootprintBlocked(p,x,y));
   assert.equal(W.roomWalkable(kind,x,y),!blocked,kind+' '+f.asset+' '+x+','+y);
  }
 }
});

test('caves have exactly one mouth transition; every surrounding tile stays outside',()=>{
 let count=0;
 for(let cy=-4;cy<=4;cy++)for(let cx=-4;cx<=4;cx++){
  const e=E.caveEntrance('opening',cx,cy);if(!e)continue;count++;
  const footprint=caveFootprint(e);
  for(let y=e.y-4;y<=e.y+2;y++)for(let x=e.x-3;x<=e.x+3;x++){
   assert.equal(!!E.caveEntranceAt('opening',x,y),x===e.x&&y===e.y);
   assert.equal(caveRimBlocked(e,x,y),y===e.y&&x>=e.x-2&&x<=e.x+2&&x!==e.x);
  }
  assert.equal(sceneryBaseRow(footprint),e.y);
 }
 assert.ok(count>15);
});

test('the live movement collision uses one base row for buildings, props, shrines and cave rims',()=>{
 const s=E.newGame('opening'),h=vm.createContext({E,W,SW,s,caveRimBlocked});
 vm.runInContext(extract('buildingSpriteBlocked')+'\n'+extract('caveEntranceHere'),h);
 const blocked=(x,y)=>{h.x=x;h.y=y;return vm.runInContext('buildingSpriteBlocked(x,y)',h);};
 for(const b of W.buildings(0,0)){
  assert.equal(blocked(b.footX,b.footY),false,b.name+' roof');
  assert.equal(blocked(b.footX,b.doorY),true,b.name+' base');
 }
 const shrine=SW.recoveryShrine(s);assert.ok(blocked(shrine.x,shrine.y));
 let e;for(let cx=-5;cx<=5&&!e;cx++)e=E.caveEntrance(s.seed,cx,1);
 assert.ok(e);s.player={x:e.x,y:e.y};assert.equal(vm.runInContext('caveEntranceHere().id',h),e.id);
 s.player.x++;assert.equal(vm.runInContext('caveEntranceHere()',h),null);assert.equal(blocked(e.x+1,e.y),true);
 assert.equal(blocked(e.x,e.y),false);
});

test('world renderer covers actors behind each building and draws actors in front of its base',()=>{
 const s=E.newGame('opening'),order=[],canvas={width:240,height:160,getBoundingClientRect:()=>({width:480,height:320}),getContext:()=>({fillRect(){}})};
 const h=vm.createContext({E,W,FC:{knownSites:()=>[]},drawAdventureWaypoint(){},SW:{shrinesForRegion:()=>[]},s,view:'explore',battle:null,walkAnim:null,mapCamera:null,
  sceneryDepth,caveFootprint,document:{body:{classList:{contains:()=>false}}},$:id=>id==='#world'?canvas:null,
  ART:{terrain:'terrain',world:'world',sealer:'sealer'},TOWN_ATLAS:'town',readyImage:()=>true,
  updateMapCamera:()=>({left:(s.player.x-3)*32,top:(s.player.y-2)*32}),townNPCs:()=>[],drawTile(){},drawTallGrass(){},
  drawTree(){},drawCaveEntrance(){},drawTownFeatures(){},drawWell(){},drawTownDecor(){},
  drawTownBuilding:(c,b)=>order.push(b.id),drawPerson:()=>order.push('player'),swimmingAt:()=>false,
  companionTrail:[],challengerApproach:null,fieldAnimation:null,drawSpiritualPerception(){},drawAtmosphere(){},adventureState:()=>({appearance:{}})});
 vm.runInContext(extract('drawWorld'),h);
 for(const b of W.buildings(0,0)){
  s.player={x:b.footX+1,y:b.doorY-1};order.length=0;vm.runInContext('drawWorld(100)',h);
  assert.ok(order.indexOf('player')<order.indexOf(b.id),b.name+' must cover actor on upper row');
  s.player.y=b.doorY+1;order.length=0;vm.runInContext('drawWorld(100)',h);
  assert.ok(order.indexOf('player')>order.indexOf(b.id),b.name+' must be behind actor on front row');
 }
});
