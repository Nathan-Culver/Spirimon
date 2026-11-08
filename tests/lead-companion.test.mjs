import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import * as E from '../engine.mjs';
import * as SE from '../spiritual-energy.mjs';
import * as W from '../world.mjs';
import {individualSpecies} from '../anatomy.mjs';
import {sceneryDepth,caveFootprint} from '../scenery.mjs';
const source=readFileSync(new URL('../app.mjs',import.meta.url),'utf8');
function extract(name){const start=source.indexOf('function '+name+'('),end=source.slice(start+1).search(/\n(?:async )?function /);assert.ok(start>=0);return source.slice(start,end<0?source.length:start+1+end);}

for(const scene of ['world','cave','interior'])test(scene+' draws the promoted Lead and hides all defeated followers',()=>{
 const s=E.newGame('opening'),drawn=[],noop=()=>{};
 for(let n=0;n<3;n++){
  const sp=E.makeSpecies('follower-'+n,E.TYPES[n],E.TYPES[n+3]);s.species[sp.id]=sp;
  const u=E.heal(E.makeIndividual(sp,10,0,E.rng(n)),sp);u.id='companion-'+n;s.spirits.push(u);s.party.push(u.id);
 }
 SE.ensureSealer(s);s.spirits[0].hp=0;s.spirits[1].hp=0;
 const trail=Array.from({length:4},(_,n)=>({x:s.player.x-3+n,y:s.player.y,face:'right'}));
 const context={fillRect:noop},canvas={width:480,height:320,getBoundingClientRect:()=>({width:960,height:640}),getContext:()=>context};
 const h=vm.createContext({s,E,SE,W:{...W,roomNPCs:()=>[]},individualSpecies,sceneryDepth,caveFootprint,canvas,
  view:'explore',battle:null,walkAnim:null,mapCamera:null,companionTrail:trail,challengerApproach:null,fieldAnimation:null,
  document:{body:{classList:{contains:()=>false}}},$:id=>id==='#world'?canvas:null,
  ART:{terrain:'terrain',world:'world',sealer:'sealer'},TOWN_ATLAS:'town',INTERIOR_ATLAS:'interior',MATERIAL_ATLAS:'material',readyImage:()=>true,
  updateMapCamera:()=>({left:(s.player.x-3)*32,top:(s.player.y-2)*32}),townNPCs:()=>[],
  FC:{knownSites:()=>[]},SW:{shrinesForRegion:()=>[]},swimmingAt:()=>false,
  drawTile:noop,drawTallGrass:noop,drawTree:noop,drawCaveEntrance:noop,drawTownFeatures:noop,drawWell:noop,drawTownDecor:noop,drawTownBuilding:noop,
  drawPerson:noop,drawAspectAura:noop,companionSize:()=>({size:32}),drawCompanion:(c,sp)=>drawn.push(sp.id),
  drawSpiritualPerception:noop,drawAtmosphere:noop,drawAdventureWaypoint:noop,adventureState:()=>({appearance:{}}),
  drawInteriorScene:(c,room,ox,oy,time,actors)=>actors.forEach(a=>a.draw()),currentRegion:()=>({name:'Test'}),
  dungeonArtworkReady:()=>true,dungeonMap:()=>({width:1,height:1,grid:[['floor']],exits:[]}),
  caveObjects:()=>[],currentDungeonFeatures:()=>[],dungeonState:()=>({}),dungeonDecoration:()=>null,
  drawDungeonAtlasTile:noop,drawDungeonProp:noop,drawDungeonLight:noop,dungeonInfo:()=>({})});
 if(scene==='cave')s.cave={id:'test-cave',level:0,x:s.player.x,y:s.player.y};
 if(scene==='interior')s.interior={kind:'inn',x:s.player.x,y:s.player.y,face:'right',trail};
 const renderer=scene==='world'?'drawWorld':scene==='cave'?'drawCave':'drawInterior';
 vm.runInContext(['party','lead','spOf',renderer].map(extract).join('\n'),h);
 const render=()=>vm.runInContext(renderer+(scene==='world'?'(100)':'(canvas,100)'),h);
 render();assert.deepEqual(drawn,[s.spirits[2].species]);assert.equal(s.sealer.leadId,s.spirits[2].id);
 s.spirits[0].hp=10;drawn.length=0;render();assert.deepEqual(drawn,[s.spirits[2].species]);
 for(const u of s.spirits)u.hp=0;drawn.length=0;render();assert.deepEqual(drawn,[]);
});
