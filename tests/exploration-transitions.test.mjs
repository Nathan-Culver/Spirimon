import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import * as E from '../engine.mjs';
import * as A from '../adventure-systems.mjs';
import * as FC from '../faction-campaigns.mjs';
import * as TP from '../temple-philosophies.mjs';
import * as W from '../world.mjs';
const source=readFileSync(new URL('../app.mjs',import.meta.url),'utf8');
const extract=name=>{const a=source.indexOf('function '+name+'('),n=source.slice(a+1).search(/\n(?:async )?function /);assert.ok(a>=0,name);return source.slice(a,n<0?source.length:a+1+n);};
function harness(){
 const s=E.newGame('scene-transitions'),saves=[],messages=[];let renders=0;
 const h=vm.createContext({s,E,A,FC,TP,W,modal:null,battle:null,view:'explore',walkAnim:null,queuedStep:[1,0],companionTrail:[{x:900,y:-300}],keys:new Set(['arrowdown']),running:false,lastStep:0,performance:{now:()=>10000},save:()=>saves.push(structuredClone(s)),render:()=>renders++,toast:message=>messages.push(message),closeModal(){},currentDungeonFeatures:()=>[],caveObstacle:()=>false,dungeonTileEvent(){},party:()=>[],dungeonMap:room=>room.faction?FC.layout(s.seed,room.faction,room.level).map:TP.trialLayout(room).map});
 vm.runInContext(['resetExplorationMotion','caveEnter','caveLeave','caveMove','enterFactionCamp','enterBuilding','moveInside'].map(extract).join('\n'),h);
 return {h,s,saves,messages,renders:()=>renders};
}
function assertReset(t){assert.equal(t.h.walkAnim,null);assert.equal(t.h.queuedStep,null);assert.equal(t.h.companionTrail.length,0);assert.equal(t.h.keys.size,0);}
function oldMotion(t){Object.assign(t.h,{walkAnim:{x:900,y:900,start:0,duration:170},queuedStep:[0,1],companionTrail:[{x:900,y:-300}],keys:new Set(['arrowdown'])});}
test('entering and leaving a cave clears motion from both coordinate systems',()=>{
 const t=harness();oldMotion(t);t.h.caveEnter({id:'1,1',depth:3});assertReset(t);assert.equal(t.s.cave.x,1);oldMotion(t);t.h.caveLeave();assertReset(t);assert.equal(t.s.cave,undefined);assert.equal(t.s.player.x,24);assert.equal(t.s.player.y,19);assert.equal(t.saves.length,2);
});
test('entering a resumed faction floor preserves campaign progress and resets motion',()=>{
 const t=harness(),id=A.FACTIONS[0].id,site=FC.site(t.s,id);t.s.player={...t.s.player,x:site.x,y:site.y+1};FC.campaign(t.s,id).furthest=2;FC.floorState(t.s,id,0).clues=[0,1,2];t.h.adventureState=()=>({crests:A.CLANS.map(c=>c.id)});oldMotion(t);t.h.enterFactionCamp(id);assert.equal(t.s.cave.level,2);assert.equal(FC.floorState(t.s,id,0).clues.length,3);assertReset(t);
});
test('building transitions discard queued outdoor steps and follower positions',()=>{
 const t=harness();oldMotion(t);t.h.enterBuilding(W.buildings(0,0)[0]);assertReset(t);const outside={...t.s.interior.outside};Object.assign(t.s.interior,{x:7,y:9});oldMotion(t);t.h.moveInside(0,1);assertReset(t);assert.equal(t.s.interior,undefined);assert.equal(t.s.player.x,outside.x);assert.equal(t.s.player.y,outside.y);
});
test('sealed faction and Temple stairs save the actual step without opening the next floor',()=>{
 for(const kind of ['faction','temple']){
  const t=harness();t.s.cave=kind==='faction'?{id:'faction-ashen-hand',faction:'ashen-hand',level:0,depth:4,x:22,y:17}:{id:'temple-test',temple:'verdant-circle',philosophy:'Tempo',templeSeed:'transition',level:0,depth:6,x:22,y:17};t.h.caveMove(1,0);
  assert.equal(t.s.cave.level,0);assert.equal(t.s.cave.x,23);assert.equal(t.saves.length,1);assert.equal(t.saves[0].cave.x,23);assert.equal(t.renders(),1);assert.ok(t.messages.length);
 }
});
test('changing faction floors clears input while retaining unlocked objectives and return stairs',()=>{
 const t=harness(),id='ashen-hand',state=FC.floorState(t.s,id,0);Object.assign(state,{clues:[0,1,2],guard:true});t.s.cave={id:'faction-'+id,faction:id,level:0,depth:4,x:22,y:17};t.h.caveMove(1,0);assert.equal(t.s.cave.level,1);assert.equal(FC.campaign(t.s,id).furthest,1);assert.equal(t.s.cave.x,1);assertReset(t);
 oldMotion(t);Object.assign(t.s.cave,{x:2,y:1});t.h.caveMove(-1,0);assert.equal(t.s.cave.level,0);assert.equal(t.s.cave.x,23);assert.equal(t.s.cave.y,17);assertReset(t);assert.equal(FC.canAdvance(t.s,id,0),true);
});
test('Temple entry clears a previous mount, queued step, and companion trail',()=>{
 const t=harness(),start=source.indexOf("case'temple-map-enter':{"),end=source.indexOf('\n',start),body=source.slice(start,end).replace(/^case'temple-map-enter':\{/, '').replace(/break;}$/, '');
 t.s.mountedSteed='old-mount';t.h.currentTemple=()=>({id:'verdant-circle',philosophy:'Tempo',seed:'transition',region:{cx:0,cy:0}});oldMotion(t);vm.runInContext(body,t.h);assert.equal(t.s.cave.philosophy,'Tempo');assert.equal(t.s.mountedSteed,null);assertReset(t);
});

test('defeat recovery discards dungeon motion before returning to its consumed Shrine',()=>{
 const t=harness();t.s.cave={id:'faction-ashen-hand',faction:'ashen-hand',level:2,x:20,y:5};t.s.mountedSteed='old-mount';oldMotion(t);let recovery;
 t.h.SW={blackoutShrine:()=>({id:'recovery-shrine',x:75,y:56})};t.h.SE={blackoutRecovery:(_s,shrineId)=>{recovery={shrineId};return {ok:true};}};
 vm.runInContext(extract('recoverAtShrine'),t.h);assert.equal(t.h.recoverAtShrine().ok,true);assertReset(t);assert.equal(t.s.cave,undefined);assert.equal(t.s.mountedSteed,null);assert.equal(t.s.player.x,75);assert.equal(t.s.player.y,57);assert.deepEqual(recovery,{shrineId:'recovery-shrine'});assert.equal(t.s.lastShrine.id,'recovery-shrine');
});
