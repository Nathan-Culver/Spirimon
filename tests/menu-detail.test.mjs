import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import * as E from '../engine.mjs';
import * as RT from '../realtime-combat.mjs';
import {opaqueBounds} from '../sprites.mjs';
const source=readFileSync(new URL('../app.mjs',import.meta.url),'utf8');
const extract=name=>{const start=source.indexOf('function '+name+'('),end=source.slice(start+1).search(/\n(?:async )?function /);return source.slice(start,end<0?source.length:start+1+end);};
function harness(){
 const sp=E.makeSpecies('menu-detail','Construct','Ooze'),unit=E.heal(E.makeIndividual(sp,21,1),sp),state={spirits:[unit]};unit.moveIds=E.equippedMoves(unit,sp).map(move=>move.id);const dialogs=[],focus=[];let backId=null;
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const rows=E.equippedMoves(unit,sp).map((m,index)=>({dataset:{value:unit.id+'|'+index},focus:()=>focus.push(index)}));for(const m of E.equippedMoves(unit,sp))RT.moveTiming(m,unit,sp);
 const dialog={scrollTop:321,querySelectorAll:()=>rows};
 const h=vm.createContext({E,RT,s:state,battle:null,spiritMoveReturn:null,esc,seconds:ms=>(ms/1000).toFixed(1)+'s',spOf:()=>sp,$:()=>dialog,showModal:(title,html,options)=>{dialogs.push({title,html,options});dialog.scrollTop=0;},action:(name,text,value)=>'<button data-action="'+name+'" data-value="'+value+'">'+text+'</button>',detail:id=>{backId=id;h.spiritMoveReturn=null;dialog.scrollTop=0;}});
 vm.runInContext(['spiritMovesHTML','spiritMoveInfo','spiritMoveBack'].map(extract).join('\n'),h);
 return {h,sp,unit,state,dialog,dialogs,focus,backId:()=>backId,eval:code=>vm.runInContext(code,h)};
}
test('transparent portrait margins are excluded while narrow extremities remain in frame',()=>{
 const image={width:256,height:256,data:new Uint8ClampedArray(256*256*4)};for(let y=180;y<235;y++)for(let x=90;x<160;x++)image.data[(y*256+x)*4+3]=255;
 image.data[(160*256+175)*4+3]=40;assert.deepEqual(opaqueBounds(image),{x:90,y:160,width:86,height:75});
 assert.deepEqual(opaqueBounds({width:16,height:16,data:new Uint8ClampedArray(16*16*4)}),{x:0,y:0,width:16,height:16});
});
test('every equipped Move is an accessible details button with the matching individual and slot',()=>{
 const t=harness();t.h.unit=t.unit;t.h.species=t.sp;const html=t.eval('spiritMovesHTML(unit,species)');assert.equal((html.match(/data-action="spirit-move-info"/g)||[]).length,4);
 for(const [index,m]of E.equippedMoves(t.unit,t.sp).entries()){assert.ok(html.includes(t.unit.id+'|'+index));assert.ok(html.includes(m.name));assert.ok(html.includes('View details for '+m.name));}
});
test('Move inspection shows its description, current timing and resources without using it',()=>{
 const t=harness(),before=structuredClone(t.unit),moves=E.equippedMoves(t.unit,t.sp);
 for(let index=0;index<moves.length;index++){const move=moves[index],timing=RT.moveTiming(move,t.unit,t.sp);t.eval('spiritMoveInfo('+JSON.stringify(t.unit.id+'|'+index)+')');const dialog=t.dialogs.at(-1);assert.equal(dialog.title,move.name);assert.equal(dialog.options.kind,'move-info');assert.ok(dialog.html.includes(t.h.esc(E.moveLore(move).description)));assert.ok(dialog.html.includes((timing.cooldownMs/1000).toFixed(1)+'s'));assert.match(dialog.html,/Accuracy/);assert.match(dialog.html,/Resource cost/);assert.match(dialog.html,/Cast time/);assert.match(dialog.html,/Target/);assert.match(dialog.html,/Back to Spirimon/);}
 assert.deepEqual(t.unit,before);
});
test('the Back button restores the previous Move list position and focused row',()=>{
 const t=harness();t.eval('spiritMoveInfo('+JSON.stringify(t.unit.id+'|2')+')');assert.equal(t.dialog.scrollTop,0);t.eval('spiritMoveBack('+JSON.stringify(t.unit.id)+')');assert.equal(t.backId(),t.unit.id);assert.equal(t.dialog.scrollTop,321);assert.deepEqual(t.focus,[2]);
});
test('invalid Move links are ignored and text is escaped in the details view',()=>{
 const t=harness();for(const value of ['missing|0',t.unit.id+'|-1',t.unit.id+'|99',t.unit.id+'|not-a-slot'])t.eval('spiritMoveInfo('+JSON.stringify(value)+')');assert.equal(t.dialogs.length,0);
 const move=E.equippedMoves(t.unit,t.sp)[0],stored=t.sp.learnset.find(m=>m.id===move.id);stored.name='<script>move</script>';stored.effect='ward<script>';t.eval('spiritMoveInfo('+JSON.stringify(t.unit.id+'|0')+')');assert.doesNotMatch(t.dialogs.at(-1).html,/<script>/);assert.match(t.dialogs.at(-1).html,/ward&lt;script&gt;/);
});
