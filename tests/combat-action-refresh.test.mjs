import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import * as E from '../engine.mjs';
import * as RT from '../realtime-combat.mjs';
import * as SE from '../spiritual-energy.mjs';
import * as ST from '../support-techniques.mjs';
import * as CO from '../cooperative-techniques.mjs';
import * as Q from '../equipment.mjs';
import {individualSpecies} from '../anatomy.mjs';
const source=readFileSync(new URL('../app.mjs',import.meta.url),'utf8');
const extract=name=>{const start=source.indexOf('function '+name+'(');if(start<0)return '';const next=source.slice(start+1).search(/\n(?:async )?function /);return source.slice(start,next<0?source.length:start+1+next);};
function harness(){
 const move={id:'strike',name:'Strike',kind:'physical',type:'Beast',power:35,accuracy:1,baseUses:1},sp={...E.makeSpecies('refresh','Beast','Fey',[]),forms:['Test','Test II','Test III'],moves:[move],learnset:[move]};
 const units=['a0','a1','a2','foe'].map((id,n)=>({...E.heal(E.makeIndividual(sp,20,0,E.rng(n)),sp),id})),allies=units.slice(0,3),enemy=units[3];
 const state=RT.createRealTimeState(0),battle={ally:allies[0].id,enemy,multi:{allies:allies.map(u=>u.id),enemies:[enemy]},rt:state,utilityReadyAt:3500,rules:{noSupport:true,noItems:true,maxActive:3}};
 const s={spirits:allies,party:allies.map(u=>u.id),species:{[sp.id]:sp},inventory:{},seed:'refresh'};SE.ensureSealer(s);
 const grid={innerHTML:'<p class="ua-wait">Waiting for an available action…</p>',dataset:{},contains:node=>node?.isConnected===true};let preserved=null;
 const h=vm.createContext({E,RT,SE,ST,CO,Q,individualSpecies,s,battle,grid,unifiedGesture:null,unifiedTap:null,unifiedSuppressClick:false,clearTimeout,document:{querySelector:()=>grid,querySelectorAll:()=>[]},esc:String,seconds:n=>n/1000+'s',refreshUnifiedActions:(el,html,held)=>{preserved=held;el.innerHTML=html;}});
 vm.runInContext(['party','spOf','battleMoves','battleTeams','realTimeContext','unifiedBattleActionsHTML','clearUnifiedGesture','refreshRealTimeUI'].map(extract).join('\n'),h);
 const ctx=vm.runInContext('realTimeContext()',h);for(const u of allies){const c=RT.unitClock(state,u);c.gcdReadyAt=4000;c.readyAt=3500;}
 return {h,state,ctx,grid,allies,setGesture:g=>{h.inputGesture=g;vm.runInContext('unifiedGesture=inputGesture',h);},gesture:()=>vm.runInContext('unifiedGesture',h),preserved:()=>preserved,refresh:()=>vm.runInContext('refreshRealTimeUI()',h),advance:ms=>RT.advanceRealTime(state,ms,ctx,()=>.5)};
}
test('a failed-escape utility cooldown returns Run, then ready Moves, without a full render',()=>{
 const t=harness();t.refresh();assert.match(t.grid.innerHTML,/Waiting/);
 t.advance(3500);t.refresh();assert.match(t.grid.innerHTML,/data-action="flee"/);assert.doesNotMatch(t.grid.innerHTML,/data-unified-move/);
 t.advance(500);t.refresh();assert.match(t.grid.innerHTML,/data-unified-move="a0\|0"/);assert.match(t.grid.innerHTML,/data-unified-move="a1\|0"/);assert.match(t.grid.innerHTML,/data-unified-move="a2\|0"/);
});
test('a detached touch target cannot leave combat options stuck on Waiting',()=>{
 const t=harness();t.setGesture({button:{isConnected:false,dataset:{gesturePreview:'STRONG'},style:{removeProperty(){}}},pointerId:7});
 t.advance(4000);t.refresh();assert.match(t.grid.innerHTML,/data-action="flee"/);assert.match(t.grid.innerHTML,/data-unified-move/);assert.equal(t.gesture(),null);
});
test('cooldowns still refresh other options during a live move gesture',()=>{
 const t=harness(),button={isConnected:true};t.setGesture({button,pointerId:7});
 t.advance(4000);t.refresh();assert.match(t.grid.innerHTML,/data-action="flee"/);assert.match(t.grid.innerHTML,/data-unified-move/);assert.equal(t.preserved(),button);assert.equal(t.gesture().button,button);
});
