import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import * as E from '../engine.mjs';
import * as SE from '../spiritual-energy.mjs';
import {newSealer} from '../spiritual-core.mjs';
import {sealingGestureChoice} from '../sealing-gesture.mjs';
const source=readFileSync(new URL('../app.mjs',import.meta.url),'utf8');
function extract(name){const start=source.indexOf('function '+name+'('),next=source.slice(start+1).search(/\n(?:async )?function /);return source.slice(start,next<0?source.length:start+1+next);}
function harness(){
 const sp=E.makeSpecies('seal-gesture','Beast','Fey',[]),target=E.heal(E.makeIndividual(sp,15),sp);target.id='wild';
 const other={...target,id:'other'},q=newSealer('lead'),s={sealer:q,inventory:{seals:3,quality:1}};
 const battle={multi:{enemies:[target,other]},enemy:target,rt:{paused:false,elapsedMs:0},utilityReadyAt:0,log:[]};
 const handlers={},label={textContent:''},quote={textContent:''},button={dataset:{unifiedSeal:target.id},innerHTML:'Original',disabled:false,style:{setProperty(){},removeProperty(){}},querySelector:s=>s==='b'?label:quote,setPointerCapture(){},hasPointerCapture:()=>false};
 let count=0,claims=0;const errors=[];
 const h=vm.createContext({s,battle,SE:{...SE,commitSeal(...args){count++;return SE.commitSeal(...args,()=>1);}},RT:{synchronizeTimers(){}},spOf:()=>sp,sealingGestureChoice,esc:String,unifiedGesture:null,unifiedSuppressClick:false,unifiedTap:null,button,clearTimeout,
  document:{hidden:false,addEventListener:(name,fn)=>{(handlers[name]??=[]).push(fn);}},window:{addEventListener:(name,fn)=>{(handlers[name]??=[]).push(fn);}},
  toast:x=>errors.push(x),save(){},render(){},realTimeContext:()=>({}),claimRealTimeUtility(ms){if(battle.utilityReadyAt>battle.rt.elapsedMs)return false;battle.utilityReadyAt=battle.rt.elapsedMs+ms;claims++;return true;}
 });
 const start=source.indexOf("document.addEventListener('pointerdown',ev=>{",source.indexOf('function previewSeal'));
 const end=source.indexOf('\nfunction advanceRealTimeBattle',start);
 vm.runInContext(['sealQuote','battleSeal','clearUnifiedGesture','previewSeal','sealButtonHTML'].map(name=>extract(name).split("\ndocument.addEventListener(")[0]).join('\n')+'\n'+source.slice(start,end),h);
 const clickCase=source.slice(source.indexOf("case'unified-seal':"),source.indexOf("case'unified-move':"));
 vm.runInContext("function clickSeal(detail=1){const v=button.dataset.unifiedSeal,ev={detail};switch('unified-seal'){"+clickCase+'}}',h);
 const emit=(name,extra={})=>{const ev={target:{closest:()=>button},clientX:0,clientY:0,pointerId:1,button:0,isPrimary:true,preventDefault(){},...extra};for(const fn of handlers[name]||[])fn(ev);};
 return {h,s,battle,target,other,button,label,quote,errors,emit,count:()=>count,claims:()=>claims,click:detail=>h.clickSeal(detail),base:SE.sealInvestment(q,target,sp,1,0).base};
}
test('sealing slide maps rightward travel to bounded extra Energy and has an upward escape',()=>{
 assert.equal(sealingGestureChoice(0,0,90).extra,0);assert.equal(sealingGestureChoice(128,0,90).extra,90);assert.equal(sealingGestureChoice(10000,0,90).extra,90);
 assert.equal(sealingGestureChoice(128,-55,90).cancelled,true);assert.equal(sealingGestureChoice(-40,0,90).cancelled,true);
});
test('a seal tap commits base Energy immediately and its synthesized click cannot spend twice',()=>{
 const f=harness();f.emit('pointerdown');f.emit('pointerup');f.click();assert.equal(f.count(),1);assert.equal(f.s.sealer.energy,100-f.base);assert.equal(f.s.inventory.seals,2);assert.equal(f.claims(),1);
});
test('sliding previews total cost and chance without spending, then release commits the preview',()=>{
 const f=harness();f.emit('pointerdown');f.emit('pointermove',{clientX:73});assert.match(f.quote.textContent,/SE · \d+%/);assert.equal(f.count(),0);assert.equal(f.s.sealer.energy,100);
 const extra=sealingGestureChoice(73,0,100-f.base).extra;f.emit('pointerup',{clientX:73});assert.equal(f.s.sealer.energy,100-f.base-extra);assert.equal(f.count(),1);
});
test('upward cancel, touch cancellation, lost capture, Escape and focus loss spend nothing',()=>{
 for(const mode of ['up','pointercancel','lostpointercapture','blur','escape','hidden']){
  const f=harness();f.emit('pointerdown');f.emit('pointermove',{clientX:100});
  if(mode==='up')f.emit('pointerup',{clientX:100,clientY:-70});
  else if(mode==='escape')f.emit('keydown',{key:'Escape'});
  else if(mode==='hidden'){vm.runInContext('document.hidden=true',f.h);f.emit('visibilitychange');}
  else f.emit(mode);
  f.click();assert.equal(f.count(),0,mode);assert.equal(f.s.sealer.energy,100,mode);assert.equal(f.s.inventory.seals,3,mode);
 }
});
test('sealing retains the original gesture target and rejects a target defeated before release',()=>{
 const f=harness();f.emit('pointerdown');f.battle.enemyTargetSelection=1;f.target.hp=0;f.emit('pointerup');assert.equal(f.count(),0);assert.equal(f.claims(),0);assert.equal(f.s.inventory.seals,3);
});
test('Energy spent by other actions during the gesture cannot cause an overspend or a cheaper surprise attempt',()=>{
 const f=harness();f.emit('pointerdown');f.emit('pointermove',{clientX:128});f.s.sealer.energy=f.base;f.emit('pointerup',{clientX:128});assert.equal(f.count(),0);assert.equal(f.claims(),0);assert.equal(f.s.inventory.seals,3);assert.match(f.errors[0],/costs/);
});
test('keyboard arrows adjust investment and Enter click remains usable after a cancelled touch',()=>{
 const f=harness();f.emit('pointerdown');f.emit('pointercancel');f.emit('keydown',{key:'ArrowRight',shiftKey:true});assert.equal(f.battle.sealExtra,5);f.click(0);assert.equal(f.count(),1);assert.equal(f.s.sealer.energy,100-f.base-5);
});
