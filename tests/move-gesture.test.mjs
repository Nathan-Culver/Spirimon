import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../app.mjs',import.meta.url),'utf8');
function extract(name){const start=source.indexOf('function '+name+'('),next=source.slice(start+1).search(/\n(?:async )?function /);return source.slice(start,next<0?source.length:start+1+next).split("\ndocument.addEventListener(")[0];}
function harness(){
 const handlers={},properties={},calls=[],button={dataset:{unifiedMove:'ally|0'},style:{setProperty:(k,v)=>properties[k]=v,removeProperty:k=>delete properties[k]},setPointerCapture(){},hasPointerCapture:()=>false};
 const h=vm.createContext({unifiedGesture:null,unifiedSuppressClick:false,unifiedTap:null,clearTimeout,button,
  document:{addEventListener:(name,fn)=>(handlers[name]??=[]).push(fn)},window:{addEventListener:(name,fn)=>(handlers[name]??=[]).push(fn)},useUnifiedMove:(...args)=>calls.push(args)});
 const start=source.indexOf("document.addEventListener('pointerdown',ev=>{",source.indexOf('function previewSeal')),end=source.indexOf('\nfunction advanceRealTimeBattle',start);
 vm.runInContext(['unifiedGestureChoice','previewUnifiedMove','clearUnifiedGesture'].map(extract).join('\n')+'\n'+source.slice(start,end),h);
 const emit=(name,extra={})=>{const ev={target:{closest:()=>button},clientX:0,clientY:0,pointerId:1,button:0,isPrimary:true,preventDefault(){},...extra};for(const fn of handlers[name]||[])fn(ev);};
 return {button,properties,calls,emit};
}
const directions=[
 ['left',-60,0,'←','agile',60/110,0,'ATK 55%'],['right',60,0,'→','strong',60/110,0,'ATK 55%'],
 ['up',0,-60,'↑','strong',0,0,'No commitment'],['down',0,60,'↓','agile',0,0,'No commitment'],
 ['up-left',-60,-60,'↖','agile',0,1,'+1 extra Move'],['up-right',60,-60,'↗','strong',0,1,'+1 extra Move'],
 ['down-left',-60,60,'↙','agile',0,0,'No extra Moves'],['down-right',60,60,'↘','strong',0,0,'No extra Moves']
];
for(const [name,dx,dy,arrow,style,commit,extra,detail] of directions)test(name+' previews and submits the same gesture',()=>{
 const f=harness();f.emit('pointerdown');f.emit('pointermove',{clientX:dx,clientY:dy});
 assert.equal(f.button.dataset.gesturePreview,arrow+' '+style.toUpperCase()+'\n'+detail);
 assert.equal(f.properties['--commit-progress'],Math.round(commit*100)+'%');assert.equal(f.calls.length,0);
 f.emit('pointerup',{clientX:dx,clientY:dy});assert.deepEqual(f.calls,[['ally|0',style,commit,extra]]);
 assert.equal(f.button.dataset.gesturePreview,undefined);assert.equal(f.properties['--commit-progress'],undefined);
});
test('upward diagonal preview shows two extra Moves for a longer drag',()=>{
 const f=harness();f.emit('pointerdown');f.emit('pointermove',{clientX:125,clientY:-125});assert.match(f.button.dataset.gesturePreview,/\+2 extra Moves/);
 f.emit('pointerup',{clientX:125,clientY:-125});assert.equal(f.calls[0][3],2);
});
test('small movements and a return to the tap zone leave no misleading swipe preview',()=>{
 const f=harness();f.emit('pointerdown');f.emit('pointermove',{clientX:3,clientY:4});assert.equal(f.button.dataset.gesturePreview,undefined);
 f.emit('pointermove',{clientY:-60});assert.match(f.button.dataset.gesturePreview,/STRONG/);
 f.emit('pointermove',{clientX:3,clientY:4});assert.equal(f.button.dataset.gesturePreview,undefined);assert.equal(f.properties['--commit-progress'],undefined);
 f.emit('pointerup',{clientX:3,clientY:4});assert.equal(f.calls.length,0);
});
test('pointer cancellation, lost capture and focus loss remove every direction preview without submitting',()=>{
 for(const cancel of ['pointercancel','lostpointercapture','blur'])for(const [,dx,dy] of directions){
  const f=harness();f.emit('pointerdown');f.emit('pointermove',{clientX:dx,clientY:dy});f.emit(cancel);
  assert.equal(f.button.dataset.gesturePreview,undefined,cancel);assert.equal(f.properties['--commit-progress'],undefined);assert.equal(f.calls.length,0);
 }
});
