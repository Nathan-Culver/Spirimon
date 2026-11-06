import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import * as E from '../engine.mjs';
import * as W from '../world.mjs';
import {townLayout,townFeatures,townStyle,TOWN_LAYOUT} from '../towns.mjs';
import {INTERIOR_ASSET_NAMES,MATERIAL_NAMES,INTERIOR_ATLAS,TOWN_ATLAS,MATERIAL_ATLAS,roomPalette} from '../interior-assets.mjs';
import {SETTLEMENT_ART} from '../world-art.mjs';
import {createImageLoader,preloadImages} from '../asset-loader.mjs';
import {buildPage} from '../build.mjs';
const dirs=[[1,0],[-1,0],[0,1],[0,-1]];
test('three complete 1024px atlases remain byte-exact in the offline game',async()=>{
 assert.equal(INTERIOR_ASSET_NAMES.length,16);assert.equal(MATERIAL_NAMES.length,16);
 assert.deepEqual(Object.keys(SETTLEMENT_ART).sort(),[INTERIOR_ATLAS,TOWN_ATLAS,MATERIAL_ATLAS].sort());
 for(const [name,value]of Object.entries(SETTLEMENT_ART)){const bytes=readFileSync(new URL('../'+name.slice(2),import.meta.url));assert.equal(createHash('sha256').update(bytes).digest('hex'),createHash('sha256').update(Buffer.from(value.split(',')[1],'base64')).digest('hex'));assert.equal(bytes.toString('ascii',0,4),'RIFF');}
 const b=await buildPage();for(const value of Object.values(SETTLEMENT_ART)){assert(b.standaloneHtml.includes(value));assert(!b.pageScript.includes(value));}
});
test('all new atlases can load from embedded sources without extra network requests',async()=>{
 const urls=[];class Image{set src(value){urls.push(value);queueMicrotask(()=>{this.naturalWidth=1024;this.naturalHeight=1024;this.onload();});}}
 const loader=createImageLoader({ImageClass:Image,notify:()=>{}});await preloadImages(Object.keys(SETTLEMENT_ART),()=>{},loader);assert.equal(urls.length,3);assert(urls.every(x=>x.startsWith('data:image/webp;base64,')));
});
test('procedural settlements vary without moving the established six services',()=>{
 const signatures=new Set(),densities=new Set();for(let cy=-4;cy<=4;cy++)for(let cx=-4;cx<=4;cx++){const b=townLayout(cx,cy);assert.deepEqual(b,townLayout(cx,cy));assert.equal(new Set(W.buildings(cx,cy).map(x=>x.id)).size,b.length);assert(b.length>=8&&b.length<=10);for(let i=0;i<6;i++)assert.deepEqual([b[i].x,b[i].y,b[i].dx,b[i].kind],[TOWN_LAYOUT[i].x,TOWN_LAYOUT[i].y,TOWN_LAYOUT[i].dx,TOWN_LAYOUT[i].kind]);signatures.add(b.filter(x=>x.plot).map(x=>x.facade).join());densities.add(townStyle(cx,cy).density);}
 assert(signatures.size>=4);assert.equal(densities.size,3);
});
test('generated town buildings, streets and prop collisions keep every door reachable',()=>{
 let count=0;const radius=5*E.SETTLEMENT_SPACING;for(let cy=-radius;cy<=radius;cy++)for(let cx=-radius;cx<=radius;cx++){if(!E.region('opening',cx,cy).town)continue;count++;const bs=W.buildings(cx,cy),blocked=(x,y)=>W.featureFootprintBlocked(x,y,cx,cy)||bs.some(b=>x>=b.x&&x<b.x+b.w&&y>=b.y&&y<b.y+b.h&&!(x===b.x+b.dx&&y===b.y+b.h-1))||!E.walkable(E.tile('opening',cx*48+x,cy*36+y));const q=[[24,19]],seen=new Set();
 while(q.length){const [x,y]=q.shift(),key=x+','+y;if(x<0||x>47||y<0||y>35||seen.has(key)||blocked(x,y))continue;seen.add(key);for(const [dx,dy]of dirs)q.push([x+dx,y+dy]);}
 for(const b of bs)assert(seen.has((b.x+b.dx)+','+(b.y+b.h)),cx+','+cy+' '+b.name+' entrance unreachable');
 for(const n of E.npcs('opening',cx,cy)){assert(!W.featureFootprintBlocked(n.x-cx*48,n.y-cy*36,cx,cy),n.name+' inside prop');assert(dirs.some(([dx,dy])=>seen.has((n.x-cx*48+dx)+','+(n.y-cy*36+dy))),n.name+' unreachable');}
 }assert(count>15);
});
test('six furnished room types keep NPCs, floors and exits connected',()=>{
 const looks=new Set();for(const b of W.buildings(0,0)){const room=W.makeInterior(b),q=[[7,9]],seen=new Set();while(q.length){const[x,y]=q.shift(),k=x+','+y;if(seen.has(k)||!W.roomWalkable(b.kind,x,y))continue;seen.add(k);for(const[dx,dy]of dirs)q.push([x+dx,y+dy]);}assert(seen.has('7,10'));for(const n of W.roomNPCs(room)){assert(W.roomWalkable(b.kind,n.x,n.y));assert(dirs.some(([dx,dy])=>seen.has((n.x+dx)+','+(n.y+dy))));}for(const f of W.roomFurnishings(b.kind)){assert(INTERIOR_ASSET_NAMES.includes(f.asset));for(let y=Math.max(2,f.y+f.h-f.depth);y<f.y+f.h;y++)for(let x=f.x;x<f.x+f.w;x++)assert(!W.roomWalkable(b.kind,x,y));}looks.add(JSON.stringify(W.roomFurnishings(b.kind)));assert(Number.isInteger(roomPalette(room).floor));}assert.equal(looks.size,6);
});
test('older saved interior positions move to the nearest reachable floor without altering the journey',()=>{
 const room={...W.makeInterior(W.buildings(0,0)[0]),x:3,y:3},outside=structuredClone(room.outside);W.normalizeInteriorPosition(room);assert(W.roomWalkable(room.kind,room.x,room.y));assert.deepEqual(room.outside,outside);assert.equal(room.kind,'hall');const next=structuredClone(room);W.normalizeInteriorPosition(room);assert.deepEqual(room,next);
});
