import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as E from '../engine.mjs';

test('town candidates retain their seeded odds at doubled world coordinates, including negative regions',()=>{
 E.useRegionHistory(null,null);assert.equal(E.SETTLEMENT_SPACING,2);let checked=0;
 for(const seed of ['spacing-one','spacing-two','spacing-three'])for(let x=-16;x<=16;x++)for(let y=-16;y<=16;y++){
  const row=E.region(seed,x,y);if(row.city||x===0&&y===0)continue;
  const sx=Math.floor(x/2),sy=Math.floor(y/2),corridor=2+E.hash(seed,'wilderness-span',Math.floor(sx/5),Math.floor(sy/5))%5;
  const previousCandidate=E.hash(seed,'settlement',sx,sy)%100<Math.floor(30/corridor);
  assert.equal(row.town,x%2===0&&y%2===0&&previousCandidate,seed+' '+x+','+y);checked++;
 }
 assert.ok(checked>1000);
});
test('city anchors are doubled while city identity and 4-16 chunk size remain coherent',()=>{
 let cities=0;
 for(let x=-15;x<=15;x++)for(let y=-15;y<=15;y++){
  const row=E.region('city-spacing',x,y);if(!row.city)continue;
  const [ax,ay]=row.cityKey.split(',').map(Number);assert.equal(Math.abs(ax%2),0);assert.equal(Math.abs(ay%2),0);
  assert.equal(E.hash('city-spacing','city-anchor',ax/2,ay/2)%20,0);
  assert.ok(row.cityWidth>=2&&row.cityWidth<=4);assert.ok(row.cityHeight>=2&&row.cityHeight<=4);
  assert.ok(x>=ax&&x<ax+row.cityWidth&&y>=ay&&y<ay+row.cityHeight);cities++;
 }
 assert.ok(cities>0);assert.equal(E.region('city-spacing',0,0).name,'Mossveil Crossing');assert.equal(E.region('city-spacing',0,0).town,true);
});
test('saved areas keep their town and terrain identity, and newly generated areas use the new layout',()=>{
 const seed='saved-town-spacing',regions={},base=E.region(seed,1,1);
 const old={...base,town:true,city:false,name:'Remembered Haven',visited:true};regions['1,1']=old;
 E.useRegionHistory(seed,regions);
 try{
  assert.equal(E.region(seed,1,1),old);assert.equal(E.npcs(seed,1,1).length,4);
  assert.equal(E.tile(seed,48+27,36+18),'well');
  const next=E.region(seed,21,21);assert.equal(next.town&&!next.city,false,'No ordinary town on an unaligned new anchor');
  assert.notEqual(E.region('another-world',1,1).name,'Remembered Haven');
  regions['21,21']=next;assert.equal(E.region(seed,21,21),next,'Newly recorded chunks remain stable too');
 }finally{E.useRegionHistory(null,null);}
 assert.match(readFileSync(new URL('../app.mjs',import.meta.url),'utf8'),/E\.useRegionHistory\(s\.seed,s\.regions/);
});
