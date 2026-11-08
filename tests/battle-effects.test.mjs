import test from 'node:test';
import assert from 'node:assert/strict';
import {battlePose,battleMeshPoint,drawAnimatedBattleSprite,BATTLE_EFFECT_MS} from '../battle-sprite-animation.mjs';
import {screenEffects,particleEmitter,effectArtwork,artworkFrame,drawIllustratedEffect,drawEmitter,prepareBattleEvents,warmTechniqueArtwork} from '../battle-effects.mjs';
import {EFFECT_ATLASES,EFFECT_ART_COUNTS,TECHNIQUE_ARTWORK} from '../technique-artwork.mjs';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {allMoveTemplates} from '../moves.mjs';
import {MOVE_CATALOG,STRUGGLE} from '../engine.mjs';
const from={x:100,y:330},to={x:760,y:160};
const ctx=()=>{const calls=[];return {calls,c:new Proxy({},{
 get:(_,name)=>(...args)=>{assert.ok(args.every(v=>typeof v!=='number'||Number.isFinite(v)),String(name));calls.push([name,...args]);},
 set:(_,key,value)=>{calls.push([key,value]);return true;}
})};};
test('every catalog technique has valid artwork, finite layered effects, and bounded deterministic particles',()=>{
 const moves=[...new Map([...allMoveTemplates(),...MOVE_CATALOG,STRUGGLE].map(m=>[m.id,m])).values()];
 assert.ok(moves.length>300);
 for(const move of moves){
  const art=effectArtwork(move);assert.ok(art.atlas>=0&&art.atlas<EFFECT_ATLASES.length);assert.ok(art.cell>=0&&art.cell<EFFECT_ART_COUNTS[art.atlas]);
  for(const age of [0,100,300,500,750,900]){
   const particles=particleEmitter(move,age,from,to);assert.ok(particles.length<=40);
   assert.deepEqual(particles,particleEmitter(move,age,from,to));
   assert.ok(particles.every(p=>Number.isFinite(p.x+p.y+p.alpha+p.radius)&&p.alpha>=0&&p.alpha<=1));
   const {c}=ctx();drawIllustratedEffect(c,move,age,from,to,1000,550,{image:{width:1254,height:1254}});drawEmitter(c,move,age,from,to,1000,550);
  }
 }
});
test('all 1046 established techniques have a distinct authored cell with no unused drawings',()=>{
 const moves=[...new Map([...allMoveTemplates(),...MOVE_CATALOG,STRUGGLE].map(m=>[m.id,m])).values()];
 const used=new Set(moves.map(m=>{const a=effectArtwork(m);return a.atlas+':'+a.cell;}));
 assert.equal(moves.length,1046);assert.equal(used.size,1046);assert.equal(Object.keys(TECHNIQUE_ARTWORK).length,1046);
 assert.equal(EFFECT_ATLASES.length,17);
 EFFECT_ART_COUNTS.forEach((count,atlas)=>{for(let cell=0;cell<count;cell++)assert.ok(used.has(atlas+':'+cell));});
 for(const [id,expected]of [['aberration-0',[0,0]],['themed-type-fey-1',[1,0]],['themed-lineage-truffleroot-2',[16,0]],['strike',[16,13]],['struggle',[16,21]]]){
  assert.deepEqual(effectArtwork({id}),{atlas:expected[0],cell:expected[1]});
 }
});
test('the frozen source manifest agrees with every shipped technique assignment',()=>{
 const source=JSON.parse(readFileSync(new URL('../docs/technique-art-sources.json',import.meta.url)));
 source.atlases.forEach((a,atlas)=>a.techniqueIds.forEach((id,cell)=>assert.deepEqual(effectArtwork({id}),{atlas,cell})));
});
test('the complete pixel audit matches the exact shipped atlas bytes and registry',()=>{
 const audit=JSON.parse(readFileSync(new URL('../docs/technique-art-audit.json',import.meta.url)));
 const sha=path=>createHash('sha256').update(readFileSync(new URL('../'+path,import.meta.url))).digest('hex');
 assert.equal(audit.assignedPieces,1046);assert.equal(audit.distinctPieceHashes,1046);assert.equal(audit.emptyAssignments,0);assert.ok(audit.minimumVisiblePixels>=50);
 assert.equal(audit.registrySHA256,sha('technique-artwork.mjs'));
 for(const path of EFFECT_ATLASES)assert.equal(audit.assetSHA256[path],sha(path));
});
test('the final partial sheet uses its actual row boundaries and never samples blank cells',()=>{
 const image={width:768,height:768};
 for(let cell=0;cell<22;cell++){const [x,y,w,h]=artworkFrame({atlas:16,cell},image);assert.ok(x>=0&&y>=0&&x+w<=768&&y+h<=314);}
 assert.equal(artworkFrame({atlas:16,cell:22},image),null);
 assert.equal(artworkFrame({atlas:17,cell:0},image),null);
 assert.deepEqual(artworkFrame({atlas:0,cell:63},image),[672,672,96,96]);
 assert.ok(artworkFrame({atlas:16,cell:8},image)[1]>96,'Second row must not include a strip of the first drawing');
});
test('uncatalogued support and generated techniques retain deterministic thematic artwork',()=>{
 for(const m of [{id:'toString',name:'New Manifest',power:55},{name:'Cinder Hex',domain:'Fire',power:40},{name:'Silver Antenna',domain:'Fate',power:60},{name:'Custom Healing',power:0,effect:'heal'},{name:'New Guard',power:0,effect:'ward'},{name:'Unwritten Manifest',power:55}]){
  const a=effectArtwork(m);assert.ok(a&&a.cell<EFFECT_ART_COUNTS[a.atlas]);assert.deepEqual(a,effectArtwork(m));
 }
});
test('battle warmup requests only the active units’ required atlases once',()=>{
 const requested=[],battle={},load=path=>requested.push(path),moves=[{id:'aberration-0'},{id:'beast-0'},{id:'struggle'}];
 warmTechniqueArtwork(battle,'first',()=>moves,load);assert.deepEqual(requested,[EFFECT_ATLASES[0],EFFECT_ATLASES[16]]);
 warmTechniqueArtwork(battle,'first',()=>{throw Error('Do not recompute moves every frame');},load);assert.equal(requested.length,2);
 warmTechniqueArtwork(battle,'reserve',()=>[{id:'themed-type-fey-1'}],load);assert.equal(requested.at(-1),EFFECT_ATLASES[1]);
});
test('screen effects remain bounded under overlapping attacks and reset completely',()=>{
 const events=Array.from({length:30},(_,n)=>({move:{id:'quake'+n,name:'Fault Quake',power:120,category:'Physical'},at:0,flashAllowed:n===0}));
 const frame=screenEffects(events,360);assert.ok(Math.abs(frame.x)<=7&&Math.abs(frame.y)<=5);assert.ok(frame.dim<=.28&&frame.flash<=.16);
 assert.deepEqual(screenEffects(events,BATTLE_EFFECT_MS),{x:0,y:0,dim:0,flash:0,invert:0,color:'#ffffff'});
 const reduced=screenEffects(events,360,{reduced:true});assert.equal(reduced.x,0);assert.equal(reduced.y,0);assert.equal(reduced.flash,0);assert.equal(reduced.invert,0);
});
test('a strong portal attack can invert and flash once, while ineligible events cannot',()=>{
 const event={move:{name:'Void Beam',power:100,domain:'Void'},at:0,flashAllowed:true};
 const peak=screenEffects([event],370);assert.ok(peak.invert>0&&peak.flash>0);
 assert.equal(screenEffects([{...event,flashAllowed:false}],370).flash,0);
 assert.equal(screenEffects([{...event,flashAllowed:false}],370).invert,0);
});
test('poses interpolate locally, deform body parts, return home, and respect reduced motion',()=>{
 const move={name:'Talon Slash',power:60},p=battlePose(move,200,{time:0});
 assert.ok(p.lean>0&&p.reach>0);assert.ok(battlePose(move,200,{side:'b'}).lean<0);
 assert.ok(battlePose({power:0},200).lean<0);
 assert.equal(battlePose(move,600).lean,0);assert.equal(battlePose(move,600).reach,0);
 const rig={kind:'biped',arms:2},top=battleMeshPoint(.5,.1,p,rig),foot=battleMeshPoint(.5,1,p,rig);assert.notEqual(top.x,.5);assert.equal(foot.x,.5);assert.equal(foot.y,1);
 const idle=battlePose(null,-1,{time:500});assert.notEqual(idle.breath,0);
 assert.equal(battlePose(move,215,{reduced:true}).lean,0);
 assert.ok(battlePose({name:'Rolling Strike',power:40},215).flip<0);
});
test('mesh rendering isolates each atlas frame and balances canvas state',()=>{
 const {c,calls}=ctx(),image={width:768,height:256};
 drawAnimatedBattleSprite(c,image,[256,0,256,256],{id:'custom',anatomy:{bodyPlan:'biped',limbs:{arms:2}}},1,10,20,96,96,battlePose({power:40},220));
 assert.equal(calls.filter(c=>c[0]==='save').length,calls.filter(c=>c[0]==='restore').length);
 assert.equal(calls.filter(c=>c[0]==='transform').length,32);
});
test('effect snapshots preserve the original target through fainting, switching and all-target techniques',()=>{
 const layout={a:[{id:'a',effect:{x:100,y:300}},{id:'ally',effect:{x:200,y:300}}],b:[{id:'b',effect:{x:800,y:100}},{id:'other',effect:{x:900,y:100}}]};
 const move={name:'Void Beam',power:90,target:'opponent'};
 const prepared=prepareBattleEvents([{actor:'a',target:'b',side:'a',move,at:100}],layout);
 layout.b[0].effect.x=500;layout.b.splice(0,1);
 assert.equal(prepared.events[0].visualTargets[0].x,800);
 const support=prepareBattleEvents([{actor:'a',target:'a',side:'a',move:{target:'allAllies'},at:100}],layout);
 assert.equal(support.events[0].visualTargets.length,2);
 const self=prepareBattleEvents([{actor:'a',target:'b',side:'a',move:{target:'self'},at:100}],layout);
 assert.equal(self.events[0].visualTargets[0].x,100);
});
test('repeat events sort by time and flashes are gated across frames without weak moves consuming the gate',()=>{
 const beam={name:'Solar Beam',power:100},weak={name:'Gentle Touch',power:10};
 const first=prepareBattleEvents([{move:beam,at:100},{move:weak,at:0},{move:beam,at:55}],null);
 assert.deepEqual(first.events.map(e=>e.at),[0,55,100]);
 assert.deepEqual(first.events.map(e=>e.flashAllowed),[false,true,false]);
 const second=prepareBattleEvents([{move:beam,at:800},{move:beam,at:960}],null,first.lastFlashAt);
 assert.deepEqual(second.events.map(e=>e.flashAllowed),[false,true]);
});
