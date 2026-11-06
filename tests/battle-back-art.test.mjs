import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {BATTLE_BACK_ART,battleBackSource,rearReferenceAtlas} from '../battle-art.mjs';
import {ROSTER} from '../roster.mjs';
import {BATTLE_BACK_FRAMES} from '../battle-back-frames.mjs';

const source=readFileSync(new URL('../sprites.mjs',import.meta.url),'utf8').replace(/^import .*;\s*$/gm,'').replace(/\bexport\s+(?=(?:function|const|let|class)\b)/g,'');
function harness(){
 const images=new Map(),draws=[],scales=[];
 const ctx={save(){},restore(){},translate(){},scale(...args){scales.push(args);},drawImage(...args){draws.push(args);}};
 const h=vm.createContext({battleBackSource,readyImage:path=>images.get(path)||null,MYSTERY_STATIC:'mystery.webp',MYSTERY_WALK:'walk.webp'});
 vm.runInContext(source,h);return {images,draws,scales,ctx,draw:h.drawBattleSpirit,portrait:h.drawSpirit};
}
test('all 150 rear atlases select their audited form rectangle and preserve aspect ratio',()=>{
 assert.equal(ROSTER.length,150);assert.equal(Object.keys(BATTLE_BACK_ART).length,150);
 assert.equal(new Set(Object.values(BATTLE_BACK_ART)).size,150);
 const h=harness();let forms=0;
 for(const sp of ROSTER){
  const rear={width:768,height:256};h.images.set(BATTLE_BACK_ART[sp.id],rear);
  for(let form=0;form<sp.forms.length;form++){
   h.draw(h.ctx,{...sp,atlas:rearReferenceAtlas(sp.id)},form,10,20,160,'a');
   const [x,y,w,height]=BATTLE_BACK_FRAMES[sp.id][form],scale=160/Math.max(256,w,height),dw=w*scale,dh=height*scale,expected=[rear,x,y,w,height,10+(160-dw)/2,180-dh,dw,dh];
   assert.deepEqual(h.draws.at(-1),expected,sp.id+' / '+form);forms++;
   h.draw(h.ctx,{...sp,id:'roster-'+sp.id,atlas:rearReferenceAtlas(sp.id)},form,10,20,160,'a');
   assert.deepEqual(h.draws.at(-1),expected,'saved roster ID: '+sp.id+' / '+form);
  }
 }
 assert.equal(forms,450);assert.deepEqual(h.scales,[],'Rear artwork must not be mirrored');
});
test('opponents and menu art retain the front atlas after an ally rear view is drawn',()=>{
 const h=harness(),sp=ROSTER[0],rear={width:768,height:256},front={width:768,height:256};
 h.images.set(BATTLE_BACK_ART[sp.id],rear);h.images.set(sp.atlas,front);
 h.draw(h.ctx,sp,2,0,0,100,'a');assert.equal(h.draws.at(-1)[0],rear);
 h.draw(h.ctx,sp,1,0,0,100,'b');assert.equal(h.draws.at(-1)[0],front);assert.equal(h.draws.at(-1)[1],256);
 h.portrait(h.ctx,sp,0,0,0,100);assert.equal(h.draws.at(-1)[0],front);
});
test('pending and missing rear images show the north-facing mystery until actual art arrives',()=>{
 const h=harness(),sp=ROSTER[0],walk={width:320,height:320};h.images.set('walk.webp',walk);
 h.draw(h.ctx,sp,0,5,6,96,'a');assert.deepEqual(h.draws.at(-1),[walk,0,0,80,80,5,6,96,96]);
 const actual={width:768,height:256};h.images.set(BATTLE_BACK_ART[sp.id],actual);
 h.draw(h.ctx,sp,0,5,6,96,'a');assert.equal(h.draws.at(-1)[0],actual);
 h.draw(h.ctx,{id:'generated-without-rear'},0,5,6,96,'a');assert.equal(h.draws.at(-1)[0],walk);
});
test('authored rear sprites support generated species, atlas overrides and safe form indexes',()=>{
 assert.deepEqual(battleBackSource({id:'custom',battleBackSprites:['a.png','b.png']},1),{source:'b.png',atlas:false,form:0});
 assert.deepEqual(battleBackSource({id:'custom',battleBackAtlas:'custom.webp'},99),{source:'custom.webp',atlas:true,form:2});
 assert.equal(battleBackSource({id:'unknown'}),null);
 assert.equal(battleBackSource(null),null);
});
test('single, double and triple battle stages route every unit and appearance through the battle renderer',()=>{
 const app=readFileSync(new URL('../app.mjs',import.meta.url),'utf8');
 const start=app.indexOf('function drawBattle('),end=app.indexOf('\nfunction battleTeams(',start),body=app.slice(start,end);
 for(const count of [1,2,3]){
  const calls=[],allies=ROSTER.slice(0,count).map((sp,n)=>({id:'a'+n,species:sp.id,appearance:n})),enemies=ROSTER.slice(3,3+count).map((sp,n)=>({id:'b'+n,species:sp.id,appearance:2-n}));
  const points=units=>units.map((u,n)=>({slot:n,x:100+n*100,ground:300,size:96,rx:40,ry:12}));
  const ctx={fillRect(){},beginPath(){},ellipse(){},fill(){}},canvas={height:550,getBoundingClientRect:()=>({height:550,width:1000}),getContext:()=>ctx};
  const h=vm.createContext({$:()=>canvas,battle:{ally:allies[0].id,enemy:enemies[0],...(count>1?{multi:{allies:allies.map(u=>u.id),enemies}}:{})},s:{spirits:allies},currentRegion:()=>({biome:{kind:'forest'}}),E:{rng:()=>()=>.5,hash:()=>0},currentBattleLayout:()=>({a:points(allies),b:points(enemies)}),positionBattleHUDs(){},drawAspectAura(){},spOf:u=>({id:u.species}),drawBattleSpirit:(c,sp,form,x,y,size,side)=>calls.push({sp:sp.id,form,side})});
  vm.runInContext(body,h);h.drawBattle();assert.equal(calls.length,count*2);
  assert.deepEqual(calls.filter(c=>c.side==='a').map(c=>c.form),allies.map(u=>u.appearance));
  assert.deepEqual(calls.filter(c=>c.side==='b').map(c=>c.form),enemies.map(u=>u.appearance));
 }
});
test('all shipped rear atlas files exist',()=>{
 const hashes=new Set();
 for(const asset of Object.values(BATTLE_BACK_ART)){
  const bytes=readFileSync(new URL('../'+asset.slice(2),import.meta.url));
  assert.ok(bytes.length>100,asset);assert.equal(bytes.toString('ascii',0,4),'RIFF',asset);assert.equal(bytes.toString('ascii',8,12),'WEBP',asset);
  const hash=createHash('sha256').update(bytes).digest('hex');assert.ok(!hashes.has(hash),'Duplicate rear atlas: '+asset);hashes.add(hash);
 }
});
test('the local server serves rear artwork and its browser module',async()=>{
 const {createServer}=await import('../companion.mjs'),server=createServer();
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
  const base='http://127.0.0.1:'+server.address().port;
  for(const asset of ['/battle-art.mjs','/assets/battle-back/kilnscale.webp','/assets/battle-back/zodiacplume.webp']){
   const response=await fetch(base+asset);assert.equal(response.status,200,asset);assert.ok((await response.arrayBuffer()).byteLength>100);
  }
 }finally{await new Promise(resolve=>server.close(resolve));}
});

test('rear assets are used only with the front design they were drawn from',()=>{
 const ready=ROSTER.filter(sp=>battleBackSource(sp));assert.equal(ready.length,150);assert.equal(ROSTER.length-ready.length,0);
 for(const sp of ready){assert.ok(battleBackSource({...sp,id:'roster-'+sp.id}));assert.equal(battleBackSource({...sp,atlas:sp.atlas+'-new-design'}),null);}

});

const audit=JSON.parse(readFileSync(new URL('../docs/rear-atlas-audit.json',import.meta.url),'utf8'));
test('every shipped atlas matches its pixel audit and all 450 frames contain only their intended silhouette',()=>{
 assert.equal(audit.atlases,150);assert.equal(audit.forms,450);assert.equal(audit.records.length,150);
 for(const record of audit.records){
  const bytes=readFileSync(new URL('../assets/battle-back/'+record.id+'.webp',import.meta.url));assert.equal(createHash('sha256').update(bytes).digest('hex'),record.sha256,'Reaudit changed artwork: '+record.id);
  assert.deepEqual(BATTLE_BACK_FRAMES[record.id],record.forms.map(f=>f.frame));
  for(const f of record.forms){const [x,y,w,h]=f.frame,[l,t,r,b]=f.bounds;
   assert.ok([x,y,w,h].every(Number.isInteger));assert.ok(x>=0&&y>=0&&w>0&&h>0&&x+w<=record.size[0]&&y+h<=record.size[1]);
   assert.ok(x<=l&&y<=t&&x+w>=r&&y+h>=b,record.id+' form '+f.form+' clipped');assert.ok(f.visible_pixels>0);assert.equal(f.captured_pixels,f.visible_pixels);
   for(const other of record.forms)if(other!==f)assert.ok(x+w<=other.bounds[0]||x>=other.bounds[2],record.id+' contains a neighboring form');
  }
 }
});
test('Quasarling uses its complete first silhouette without a slice of the second form',()=>{
 const record=audit.records.find(r=>r.id==='quasarshard'),frame=BATTLE_BACK_FRAMES.quasarshard[0];assert.ok(frame[0]+frame[2]<record.forms[1].bounds[0]);assert.ok(record.forms[1].bounds[0]<256,'Regression needs the original crossed boundary');
 const h=harness(),sp=ROSTER.find(sp=>sp.id==='quasarshard');h.images.set(BATTLE_BACK_ART[sp.id],{width:768,height:256});h.draw(h.ctx,sp,0,0,0,192,'a');assert.deepEqual(h.draws.at(-1).slice(1,5),frame);
});
test('wide frames fit the battle slot without squeezing, and malformed custom rectangles fail safely',()=>{
 const h=harness(),sp={id:'custom',battleBackAtlas:'wide.webp',battleBackFrames:[[0,0,300,240]]};h.images.set('wide.webp',{width:768,height:256});h.draw(h.ctx,sp,0,10,20,100,'a');const draw=h.draws.at(-1);assert.equal(draw[7],100);assert.equal(draw[8],80);assert.equal(draw[5],10);assert.equal(draw[6],40);
 const walk={width:320,height:320};h.images.set('walk.webp',walk);h.draw(h.ctx,{...sp,battleBackFrames:[[700,0,300,240]]},0,10,20,100,'a');assert.equal(h.draws.at(-1)[0],walk);
});
