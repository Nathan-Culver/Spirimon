import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {companionRig,companionFrame,drawRigFrame} from '../companion-animation.mjs';
import {battleBackSource} from '../battle-art.mjs';
import {MYSTERY_STATIC,MYSTERY_WALK,PLACEHOLDER_ART} from '../placeholder-art.mjs';
import {createImageLoader,preloadImages} from '../asset-loader.mjs';

const source=readFileSync(new URL('../sprites.mjs',import.meta.url),'utf8').replace(/^import .*;\s*$/gm,'').replace(/\bexport\s+(?=(?:function|const|let|class)\b)/g,'');
const still={id:'mystery-still',width:256,height:171},walk={id:'mystery-walk',width:320,height:320};
function harness(){
 const images=new Map([[MYSTERY_STATIC,still],[MYSTERY_WALK,walk]]),draws=[],requests=[];
 let made=0;
 const ctx={save(){},restore(){},translate(){},scale(){},rotate(){},beginPath(){},rect(){},clip(){},moveTo(){},lineTo(){},closePath(){},transform(){},clearRect(){},drawImage(...args){draws.push(args);}};
 const context=vm.createContext({companionRig,companionFrame,drawRigFrame,battleBackSource,MYSTERY_STATIC,MYSTERY_WALK,readyImage(path){requests.push(path);return images.get(path)||null;},document:{createElement(){made++;return {width:0,height:0,getContext:()=>ctx};}}});
 vm.runInContext(source,context);return {context,ctx,draws,images,requests,created:()=>made,call:expression=>vm.runInContext(expression,context)};
}
test('every missing species and evolution uses the same supplied mystery creature',()=>{
 const h=harness();
 for(const sp of [{id:'one',atlas:'one.webp'},{id:'two',sprites:['a.png','b.png','c.png']},{id:'procedural',proceduralArt:true,anatomy:{bodyPlan:'quadruped',traits:['fur']}}])for(let form=0;form<3;form++)h.context.drawSpirit(h.ctx,sp,form,10,20,100);
 assert.equal(h.draws.length,9);assert.ok(h.draws.every(args=>args[0]===still));assert.equal(h.created(),0,'Do not generate basic-shape creature substitutes');
});
test('old saved procedural PNGs cannot bypass mystery art in menus, combat or walking',()=>{
 const h=harness(),png='data:image/png;base64,old-geometric-sprite';h.images.set(png,{width:128,height:128});
 for(const flags of [{proceduralArt:true},{visualValidation:{status:'procedural-verified'}},{visualValidation:{semanticSource:'renderer-geometry'}}]){
  const sp={id:'saved',...flags,anatomy:{bodyPlan:'quadruped',traits:['fur']},sprites:[png,png,png]};
  for(let form=0;form<3;form++){
   h.context.drawSpirit(h.ctx,sp,form,0,0,96);assert.equal(h.draws.at(-1)[0],still);
   h.context.drawSpirit(h.ctx,sp,form,0,0,58,false,{face:'down',moving:true,progress:.5});assert.equal(h.draws.at(-1)[0],walk);
   h.context.drawCompanion(h.ctx,sp,form,0,0,36,'left',true,.25);assert.equal(h.draws.at(-1)[0],walk);
  }
 }
 assert(!h.requests.includes(png));assert.equal(h.created(),0);
});
test('finished artwork replaces mystery after generation without changing the species identity',()=>{
 const h=harness(),sp={id:'saved',proceduralArt:true,sprites:['old.png']};h.context.drawCompanion(h.ctx,sp,0,0,0);assert.equal(h.draws.at(-1)[0],walk);
 sp.proceduralArt=false;sp.visualValidation={status:'vision-verified'};sp.sprites=['finished.png'];const real={width:256,height:256};h.images.set('finished.png',real);
 h.context.drawSpirit(h.ctx,sp,0,0,0);assert.equal(h.draws.at(-1)[0],real);
 h.context.drawCompanion(h.ctx,sp,0,0,0);assert(h.draws.some(args=>args[0]===real));assert.equal(h.created(),1);
});
test('real art replaces the placeholder on the next draw without a stale placeholder cache',()=>{
 const h=harness(),sp={id:'roster-test',atlas:'actual.webp'};
 h.context.drawSpirit(h.ctx,sp,2,0,0,96);assert.equal(h.draws.at(-1)[0],still);
 const real={width:768,height:256};h.images.set(sp.atlas,real);h.context.drawSpirit(h.ctx,sp,2,0,0,96);assert.equal(h.draws.at(-1)[0],real);assert.equal(h.draws.at(-1)[1],512);
});
test('mystery walking has four correctly mapped directions and four looping frames',()=>{
 const h=harness();
 for(const [row,face]of ['up','down','left','right'].entries())for(const [phase,frame]of [[0,0],[.25,1],[.5,2],[.75,3],[1,0],[1.25,1]]){
  const got=h.context.mysteryFrame(face,true,phase);assert.equal(got.row,row);assert.equal(got.frame,frame);
 }
 assert.equal(h.context.mysteryFrame('left',false,.75).frame,0);assert.equal(h.context.mysteryFrame('down',true,Infinity).frame,0);
});
test('a companion waiting for its image uses the authored mystery walk instead of a generated shape',()=>{
 const h=harness(),sp={id:'unloaded',atlas:'pending.webp'};
 h.context.drawCompanion(h.ctx,sp,0,4,8,36,'right',true,.5);
 assert.deepEqual(h.draws.at(-1),[walk,160,240,80,80,4,8,36,36]);assert.equal(h.created(),0);
 const real={width:768,height:256};h.images.set(sp.atlas,real);h.context.drawCompanion(h.ctx,sp,0,4,8,36,'right',true,.5);
 assert.equal(h.created(),1);assert.ok(h.draws.some(args=>args[0]===real),'Late real image must replace mystery walking');
});
test('explicit companion sheets also use mystery walking while their download is pending',()=>{
 const h=harness(),sp={id:'authored',companionSheets:['pending-walk.webp']};
 h.context.drawCompanion(h.ctx,sp,0,0,0,36,'left',true,.25);assert.equal(h.draws.at(-1)[0],walk);assert.equal(h.draws.at(-1)[2],160);
 const real={width:256,height:256};h.images.set(sp.companionSheets[0],real);h.context.drawCompanion(h.ctx,sp,0,0,0,36,'left',true,.25);assert.equal(h.draws.at(-1)[0],real);
});
test('roaming mystery Spirimon animate using movement direction and step progress',()=>{
 const h=harness();h.context.drawSpirit(h.ctx,{id:'wild',atlas:'pending.webp'},1,0,0,58,true,{face:'left',moving:true,progress:.75});assert.deepEqual(h.draws.at(-1),[walk,240,160,80,80,0,0,58,58]);
});
test('collection canvases redraw from mystery to the real image as soon as it is available',()=>{
 const h=harness(),sp={id:'one',sprites:['one.png']},canvas={dataset:{species:sp.id,form:'0'},width:128,height:128,getContext:()=>h.ctx};h.context.spirimonSpecies={[sp.id]:sp};const root={querySelectorAll:()=>[canvas]};
 h.context.renderSpiritCanvases(root);assert.equal(h.draws.at(-1)[0],still);const real={width:512,height:512};h.images.set(sp.sprites[0],real);h.context.renderSpiritCanvases(root);assert.equal(h.draws.at(-1)[0],real);
});
test('mystery images are embedded and decode even when every external image request is blocked',async()=>{
 const urls=[];class Image{set src(url){urls.push(url);queueMicrotask(()=>{if(!url.startsWith('data:'))return this.onerror();this.naturalWidth=this.naturalHeight=320;this.onload();});}}
 const loader=createImageLoader({ImageClass:Image,notify:()=>{}});await preloadImages([MYSTERY_STATIC,MYSTERY_WALK],()=>{},loader);assert.equal(urls.length,2);assert.ok(urls.every(url=>url.startsWith('data:image/webp;base64,')));
 for(const path of [MYSTERY_STATIC,MYSTERY_WALK])assert.deepEqual(Buffer.from(PLACEHOLDER_ART[path].split(',')[1],'base64'),readFileSync(new URL('../'+path.slice(2),import.meta.url)));
});
