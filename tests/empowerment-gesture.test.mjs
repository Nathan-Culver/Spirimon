import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';import * as SE from '../spiritual-energy.mjs';
const source=readFileSync(new URL('../app.mjs',import.meta.url),'utf8');
function harness(kind='support'){
 const handlers={},calls=[],q={energy:100,attributes:{output:0}},button={dataset:{energyGesture:kind,value:'id|ally'},setPointerCapture(){},setAttribute(){},removeAttribute(){}},battle={},h=vm.createContext({SE,s:{sealer:q},battle,performance:{now:()=>100},document:{hidden:false,addEventListener:(name,fn,capture)=>{(handlers[name]??=[]).push({fn,capture});}},window:{addEventListener(){}},useSupportAction:(...args)=>calls.push(args),performFieldRitual:(...args)=>calls.push(args)});
 const start=source.indexOf('function clearEnergyGesture('),end=source.indexOf('\nfunction spiritualDiscoveries',start);vm.runInContext('let energyGesture=null,energyClickUntil=0;function energyActionQuote(button,extra){return {text:extra+" extra Energy"};}\n'+source.slice(start,end),h);
 const emit=(name,opts={})=>{let stopped=false;const ev={target:{closest:()=>button},clientX:0,clientY:0,pointerId:1,isPrimary:true,button:0,preventDefault(){},stopImmediatePropagation(){stopped=true;},...opts};for(const {fn}of handlers[name]||[])fn(ev);return stopped;};return {button,calls,emit,h};
}
test('support tap and drag submit once, with no spending while previewing',()=>{
 const f=harness();f.emit('pointerdown');f.emit('pointermove',{clientX:41});assert.equal(f.calls.length,0);assert.equal(f.button.dataset.gesturePreview,'5 extra Energy');f.emit('pointerup',{clientX:41});assert.deepEqual(f.calls,[['id|ally',5]]);assert.equal(f.emit('click'),true);assert.equal(f.button.dataset.gesturePreview,undefined);
 const tap=harness();tap.emit('pointerdown');tap.emit('pointerup');assert.deepEqual(tap.calls,[['id|ally',0]]);
});
test('empowerment clamps to Output; upward cancellation, lost capture, Escape and blur submit nothing',()=>{
 for(const mode of ['up','pointercancel','lostpointercapture','escape']){const f=harness();f.emit('pointerdown');f.emit('pointermove',{clientX:1000});assert.equal(f.button.dataset.gesturePreview,'10 extra Energy');if(mode==='up')f.emit('pointermove',{clientX:1000,clientY:-80});else if(mode==='escape')f.emit('keydown',{key:'Escape'});else f.emit(mode);f.emit('pointerup');assert.equal(f.calls.length,0);}
});
test('ritual gestures use the same expenditure interaction and keyboard has bounded increments',()=>{
 const f=harness('ritual');f.emit('pointerdown');f.emit('pointermove',{clientX:31});f.emit('pointerup',{clientX:31});assert.deepEqual(f.calls,[['id|ally',3]]);f.emit('keydown',{key:'ArrowRight'});assert.equal(f.button.dataset.energyExtra,1);f.emit('keydown',{key:'Home'});assert.equal(f.button.dataset.energyExtra,0);
});
