import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
import {buildPage} from '../build.mjs';
import {encodePNG} from '../creature-png.mjs';
for(const target of ['web','app'])test('compiled '+target+' boot populates encounters from finished artwork without AI or deleted types',{timeout:30000},async()=>{
const errors=[],events=[],imageURLs=[],stored={saves:new Map(),library:new Map()},nodes=new Map();
function node(key){if(nodes.has(key))return nodes.get(key);let pixels;const ctx={imageSmoothingEnabled:false,clearRect(){},drawImage(){},fillRect(){},save(){},restore(){},translate(){},scale(){},rotate(){},createImageData(w,h){return {width:w,height:h,data:new Uint8ClampedArray(w*h*4)};},putImageData(p){pixels=p;},getImageData(){return pixels;},createRadialGradient(){return {addColorStop(){}};},beginPath(){},arc(){},fill(){},stroke(){},moveTo(){},lineTo(){}};
const n={width:128,height:128,value:'',innerHTML:'',textContent:'',style:{},dataset:{},classList:{add(){},remove(){},toggle(){},contains(){return false;}},querySelector(){return null;},querySelectorAll(){return [];},addEventListener(){},appendChild(){},remove(){},focus(){},getContext:()=>ctx,getBoundingClientRect:()=>({width:915,height:412,left:0,top:0}),toDataURL:()=> 'data:image/png;base64,'+encodePNG(pixels||{width:128,height:128,data:new Uint8ClampedArray(128*128*4)}).toString('base64')};nodes.set(key,n);return n;}
const indexedDB={open(){const req={};queueMicrotask(()=>{req.result={transaction(name,mode){const tx={};tx.objectStore=()=>({get(key){const r={};queueMicrotask(()=>{r.result=stored[name].get(key);r.onsuccess?.();});return r;},getAll(){const r={};queueMicrotask(()=>{r.result=[...stored[name].values()];r.onsuccess?.();});return r;},put(value,key){stored[name].set(key??value.id,structuredClone(value));queueMicrotask(()=>tx.oncomplete?.());},clear(){stored[name].clear();},delete(key){stored[name].delete(key);}});return tx;}};req.onsuccess?.();});return req;}};
class Image{set src(value){imageURLs.push(value);this.width=this.naturalWidth=768;this.height=this.naturalHeight=256;queueMicrotask(()=>this.onload?.());}}
const timers=new Map();let nextTimer=0;
const context=vm.createContext({console:{log(){},warn(...x){errors.push(x.join(' '));},error(...x){errors.push(x.map(y=>y?.stack||String(y)).join(' '));}},URL,URLSearchParams,Date,Math,Uint8ClampedArray,Uint8Array,Int32Array,Set,Map,Image,structuredClone,indexedDB,performance,AbortSignal,fetch,navigator:{userAgent:'Android Chrome',maxTouchPoints:5},location:{search:'?playtest=boot-qa',protocol:'http:',href:'http://127.0.0.1:4317/?playtest=boot-qa'},innerWidth:915,innerHeight:412,devicePixelRatio:1,matchMedia:()=>({matches:false,addEventListener(){}}),requestAnimationFrame(){return 1;},cancelAnimationFrame(){},setInterval(){return 1;},setTimeout(fn,ms){const id=++nextTimer;timers.set(id,{fn,ms});return id;},clearTimeout(id){timers.delete(id);},CustomEvent:class{constructor(type,detail){this.type=type;this.detail=detail?.detail;}},Event:class{constructor(type){this.type=type;}},document:{baseURI:target==='app'?'file:///games/Spirimon/index.html':'http://127.0.0.1:4317/',querySelector:node,querySelectorAll:()=>[],getElementById:node,createElement:()=>node('canvas-'+Math.random()),addEventListener(){},documentElement:node('html'),body:node('body')},addEventListener(){},dispatchEvent(event){events.push(event);},localStorage:{getItem(){return null;},setItem(){}}});
context.window=context;context.__spirimonPackaged=target==='app';const built=await buildPage(undefined,{standalone:false});const start=performance.now();vm.runInContext(target==='app'?built.packagedScript:built.pageScript,context,{timeout:45000});for(let n=0;n<100;n++)await new Promise(r=>setImmediate(r));
const species=Object.values(context.spirimonSpecies||{});
assert.ok(events.some(x=>x.type==='spirimon-ready'),errors.join('\n'));
assert.equal(errors.length,0,errors.join('\n'));if(target==='app')assert.ok(imageURLs.length>=6&&imageURLs.every(url=>url.startsWith('file:///games/Spirimon/assets/')),imageURLs.join('\n')); assert.equal(species.length,150);assert.ok(species.every(sp=>sp.atlas&&!sp.proceduralArt));
assert.ok(species.every(x=>x.domains?.length&&x.capabilities?.revision===1));
assert.ok(species.every(x=>![x.base,x.alter].includes('Humanoid')));
for(const pending of [...timers.values()])if(pending.ms===350)pending.fn();
for(let n=0;n<100;n++)await new Promise(r=>setImmediate(r));
assert.ok(stored.saves.get('main'));assert.ok(stored.library.size>=species.length);
const save=stored.saves.get('main');for(const roamer of Object.values(save.roamers).flat())assert.ok(save.species[roamer.ind.species].atlas,'every initial encounter has finished artwork');
});
