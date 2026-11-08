import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../app.mjs',import.meta.url),'utf8');
function extract(name){const start=source.indexOf('function '+name+'('),next=source.slice(start+1).search(/\n(?:async )?function /);return source.slice(start,next<0?source.length:start+1+next).split("\ndocument.addEventListener(")[0];}
function harness(){
 const handlers={},properties={},calls=[],lines=[],button={dataset:{unifiedMove:'ally|0'},style:{setProperty:(k,v)=>properties[k]=v,removeProperty:k=>delete properties[k]},setPointerCapture(){},hasPointerCapture:()=>false};
 const h=vm.createContext({s:{settings:{}},unifiedGesture:null,unifiedSuppressClick:false,unifiedTap:null,clearTimeout,button,
  document:{hidden:true,body:{append:node=>lines.push(node)},createElement:()=>({style:{},setAttribute(k,v){this[k]=v;},remove(){const i=lines.indexOf(this);if(i>=0)lines.splice(i,1);}}),addEventListener:(name,fn)=>(handlers[name]??=[]).push(fn)},window:{addEventListener:(name,fn)=>(handlers[name]??=[]).push(fn)},useUnifiedMove:(...args)=>calls.push(args)});
 const start=source.indexOf("document.addEventListener('pointerdown',ev=>{",source.indexOf('function previewSeal')),end=source.indexOf('\nfunction advanceRealTimeBattle',start);
 vm.runInContext(['unifiedGestureChoice','previewUnifiedMove','drawGestureLine','clearUnifiedGesture'].map(extract).join('\n')+'\n'+source.slice(start,end),h);
 const emit=(name,extra={})=>{const ev={target:{closest:()=>button},clientX:0,clientY:0,pointerId:1,button:0,isPrimary:true,preventDefault(){},...extra};for(const fn of handlers[name]||[])fn(ev);};
 return {button,properties,calls,lines,emit};
}
const directions=[
 ['left',-60,0,'←','agile',60/110,0,'ATK 55%'],['right',60,0,'→','strong',60/110,0,'ATK 55%'],
 ['up',0,-60,'↑','strong',0,0,'No commitment'],['down',0,60,'↓','agile',0,0,'No commitment'],
 ['up-left',-60,-60,'↖','agile',Math.hypot(60,60)/110,1,'+1 extra Technique · ATK 77%'],['up-right',60,-60,'↗','strong',Math.hypot(60,60)/110,1,'+1 extra Technique · ATK 77%'],
 ['down-left',-60,60,'↙','agile',0,1,'+1 extra Technique · No commitment'],['down-right',60,60,'↘','strong',0,1,'+1 extra Technique · No commitment']
];
for(const [name,dx,dy,arrow,style,commit,extra,detail] of directions)test(name+' previews and submits the same gesture',()=>{
 const f=harness();f.emit('pointerdown');f.emit('pointermove',{clientX:dx,clientY:dy});
 assert.ok(f.button.dataset.gesturePreview.startsWith(arrow+' '+style.toUpperCase()+'\n'));assert.ok(f.button.dataset.gesturePreview.includes('ATK '+Math.round(commit*100)+'% / DEF '+Math.round((1-commit)*100)+'%'));assert.match(f.button.dataset.gesturePreview,/stats [0-9.]+× \/ [0-9.]+×/);if(extra)assert.ok(f.button.dataset.gesturePreview.includes('+'+extra+' extra Technique'));
 assert.equal(f.lines.length,1);assert.equal(f.lines[0].style.width,Math.hypot(dx,dy)+'px');assert.equal(f.lines[0].style.transform,'rotate('+Math.atan2(dy,dx)+'rad)');assert.equal(f.calls.length,0);
 f.emit('pointerup',{clientX:dx,clientY:dy});assert.deepEqual(f.calls,[['ally|0',style,commit,extra]]);
 assert.equal(f.button.dataset.gesturePreview,undefined);assert.equal(f.lines.length,0);
});
test('upward diagonal preview shows two extra Techniques for a longer drag',()=>{
 const f=harness();f.emit('pointerdown');f.emit('pointermove',{clientX:125,clientY:-125});assert.match(f.button.dataset.gesturePreview,/\+2 extra Techniques/);
 f.emit('pointerup',{clientX:125,clientY:-125});assert.equal(f.calls[0][3],2);
});
test('small movements and a return to the tap zone leave no misleading swipe preview',()=>{
 const f=harness();f.emit('pointerdown');f.emit('pointermove',{clientX:3,clientY:4});assert.equal(f.button.dataset.gesturePreview,undefined);
 f.emit('pointermove',{clientY:-60});assert.match(f.button.dataset.gesturePreview,/STRONG/);
 f.emit('pointermove',{clientX:3,clientY:4});assert.equal(f.button.dataset.gesturePreview,undefined);assert.equal(f.lines[0].style.width,'5px');
 f.emit('pointerup',{clientX:3,clientY:4});assert.equal(f.calls.length,0);
});
test('pointer cancellation, lost capture and focus loss remove every direction preview without submitting',()=>{
 for(const cancel of ['pointercancel','lostpointercapture','blur','visibilitychange','keydown'])for(const [,dx,dy] of directions){
  const f=harness();f.emit('pointerdown');f.emit('pointermove',{clientX:dx,clientY:dy});f.emit(cancel,{key:'Escape'});
  assert.equal(f.button.dataset.gesturePreview,undefined,cancel);assert.equal(f.lines.length,0);assert.equal(f.calls.length,0);
 }
});

test('touch-down anchors the point at the actual viewport position and freely follows an arbitrary angle',()=>{
 const f=harness();f.emit('pointerdown',{clientX:127,clientY:420});const line=f.lines[0];
 assert.equal(line.className,'gesture-line');assert.equal(line['aria-hidden'],'true');
 assert.deepEqual(line.style,{left:'127px',top:'420px',width:'0px',transform:'rotate(0rad)'});
 f.emit('pointermove',{clientX:164,clientY:401});
 assert.equal(line.style.left,'127px');assert.equal(line.style.top,'420px');
 assert.equal(line.style.width,Math.hypot(37,-19)+'px');assert.equal(line.style.transform,'rotate('+Math.atan2(-19,37)+'rad)');
 f.emit('pointermove',{clientX:164,clientY:439});assert.equal(line.style.transform,'rotate('+Math.atan2(19,37)+'rad)');
 assert.equal(f.lines[0],line);f.emit('pointerup',{clientX:164,clientY:439});assert.equal(f.lines.length,0);
});
test('other pointers cannot move or remove the active touch line',()=>{
 const f=harness();f.emit('pointerdown',{clientX:127,clientY:420});
 f.emit('pointerdown',{pointerId:2,isPrimary:false});assert.equal(f.lines.length,1);
 f.emit('pointermove',{pointerId:2,clientX:999,clientY:999});assert.equal(f.lines[0].style.width,'0px');
 f.emit('pointerup',{pointerId:2});assert.equal(f.lines.length,1);assert.equal(f.calls.length,0);
 f.emit('pointercancel');assert.equal(f.lines.length,0);
});
