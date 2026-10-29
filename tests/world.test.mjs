import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../engine.mjs';
import * as W from '../world.mjs';
test('new journeys begin without a starter or an attuned Spirit',()=>{const s=E.newGame('opening');assert.equal(s.spirits.length,0);assert.equal(s.party.length,0);assert(s.inventory.offerings>0);assert(s.inventory.seals>0);});
test('every building has an accessible outside threshold and a connected interior exit',()=>{for(const b of W.buildings(0,0)){assert(E.walkable(E.tile('opening',b.doorX,b.doorY+1)));const room=W.makeInterior(b);const seen=new Set(),queue=[[room.x,room.y]];while(queue.length){const [x,y]=queue.shift(),key=x+','+y;if(seen.has(key)||!W.roomWalkable(b.kind,x,y))continue;seen.add(key);for(const [dx,dy]of [[0,1],[0,-1],[1,0],[-1,0]])queue.push([x+dx,y+dy]);}assert(seen.has('7,10'),b.kind+' exit blocked');for(const n of W.roomNPCs(room))assert([[0,1],[0,-1],[1,0],[-1,0]].some(([dx,dy])=>seen.has((n.x+dx)+','+(n.y+dy))),n.name+' unreachable');}});
