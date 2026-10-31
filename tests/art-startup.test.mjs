import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import * as E from '../engine.mjs';
const source=readFileSync(new URL('../app.mjs',import.meta.url),'utf8'),start=source.indexOf('async function boot('),end=source.indexOf('\nboot();',start),boot=source.slice(start,end);
function harness(){
 let resolveArt,rejectArt,entered;const atArt=new Promise(resolve=>entered=resolve),art=new Promise((resolve,reject)=>{resolveArt=resolve;rejectArt=reject;}),events=[],renders=[];
 const noop=()=>{},state={...E.newGame('saved-graphics-test'),starter:true};
 class DetailEvent extends Event{constructor(name,{detail}){super(name);this.detail=detail;}}
 const context=vm.createContext({E,ART:{world:'./assets/world-props.webp',sealer:'./assets/sealer-walk.webp',terrain:'./assets/terrain-v2.webp',towns:'./assets/town-expansion.webp'},startupStatus:noop,openDB:async()=>({}),dbAll:async()=>[],dbGet:async()=>state,library:{},s:null,db:null,battle:null,queue:[],loaded:false,audio:{setEnabled:noop},restoreDeviceSaveHandle:async()=>{},installRoster:noop,normalizeWildPopulation:noop,upgradeWildLevels:noop,discoverRegion:noop,introduceFirstEncounter:noop,ensurePlayerOnPath:noop,render:()=>renders.push('world'),starters:noop,preloadImages:()=>{entered();return art;},renderSpiritCanvases:noop,drawBattle:noop,requestAnimationFrame:noop,tick:noop,setInterval:noop,persist:noop,processQueue:noop,window:{dispatchEvent:event=>events.push(event)},Event,CustomEvent:DetailEvent,console:{error:noop}});
 const done=vm.runInContext(boot+'\nboot();',context);return {context,done,atArt,resolveArt,rejectArt,renders,events};
}
test('saved journeys wait for terrain, character and building artwork before opening the world',async()=>{
 const h=harness();await h.atArt;assert.equal(h.context.loaded,false);assert.deepEqual(h.renders,[]);assert.equal(h.context.s.seed,'saved-graphics-test');
 h.resolveArt([]);await h.done;assert.equal(h.context.loaded,true);assert.deepEqual(h.renders,['world']);assert.ok(h.events.some(e=>e.type==='spirimon-ready'));
});
test('artwork failures preserve the saved journey and prevent entry into an invisible world',async()=>{
 const h=harness();await h.atArt;h.rejectArt(new Error('Artwork could not load: sealer-walk.webp'));await h.done;assert.equal(h.context.loaded,false);assert.deepEqual(h.renders,[]);assert.equal(h.context.s.seed,'saved-graphics-test');assert.ok(h.events.some(e=>e.type==='spirimon-startup-error'&&e.detail.includes('sealer-walk.webp')));
});
