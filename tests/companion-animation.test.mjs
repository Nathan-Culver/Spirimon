import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {ROSTER} from '../roster.mjs';
import {battleBackSource} from '../battle-art.mjs';
import {AUTHORED_COMPANIONS} from '../companion-rigs.mjs';
import {companionRig,companionFrame,rigPoint,followingCompanionFacing,drawRigFrame} from '../companion-animation.mjs';
import {LEGENDS,applyLegendArtwork} from '../legendary-roster.mjs';
const source=readFileSync(new URL('../sprites.mjs',import.meta.url),'utf8').replace(/^import .*;\s*$/gm,'').replace(/\bexport\s+(?=(?:function|const|let|class)\b)/g,'');
function harness(){
 const images=new Map(),poses=[],draws=[];let made=0;const ctx={save(){},restore(){},translate(){},beginPath(){},rect(){},clip(){},drawImage:(...args)=>draws.push(args)};
 const h=vm.createContext({companionRig,companionFrame,battleBackSource,readyImage:path=>images.get(path),drawRigFrame:(g,image,rect,rig,frame,direction)=>poses.push({image,rect,rig,frame,direction}),document:{createElement(){made++;return {width:0,height:0,getContext:()=>ctx};}}});vm.runInContext(source,h);return {h,images,poses,draws,ctx,made:()=>made};
}
test('all 450 roster forms and twelve legendary forms have assigned rigs and real north-facing sources',()=>{
 assert.equal(Object.keys(AUTHORED_COMPANIONS).length,150);let count=0;
 for(const sp of [...ROSTER,...LEGENDS.map(p=>applyLegendArtwork({id:p.key},p))])for(let f=0;f<3;f++){
  const rig=companionRig(sp,f);assert.ok(rig.kind);assert.ok(battleBackSource(sp,f));
  for(let d=0;d<4;d++)for(let frame=0;frame<4;frame++)for(const [x,y]of [[0,0],[.5,.5],[1,1],[.2,.9]]){const p=rigPoint(rig,x,y,frame,d);assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));assert.ok(p.x>-.15&&p.x<1.15&&p.y>-.15&&p.y<1.15);}
  count++;
 }
 assert.equal(count,462);assert.deepEqual([0,1,2].map(f=>companionRig(ROSTER[144],f).kind),['biped','biped','biped'],'The upright Starling form does not flap phantom wings');
 assert.deepEqual([0,1,2].map(f=>companionRig(ROSTER[0],f).kind),['flow','quadruped','biped'],'A lineage can change locomotion on evolution');
});
test('leg poses alternate independently of the anchored torso; wings and flowing tendrils use different curves',()=>{
 const quad=companionRig(ROSTER[2],2),a=rigPoint(quad,.2,.95,1,2),b=rigPoint(quad,.8,.95,1,2);assert.ok(a.x<.2&&b.x>.8);assert.equal(rigPoint(quad,.5,.4,1,2).x,.5);
 const moth=companionRig(ROSTER[33],2),wing=rigPoint(moth,.1,.3,1,1);assert.notEqual(wing.y,.3);assert.equal(moth.arms,4);
 const flow=companionRig(ROSTER[116],2),tail=rigPoint(flow,.2,.9,1,1);assert.notEqual(tail.x,.2);
});
test('baking uses audited rear rectangles only for north and preserves distinct front artwork for other facings',()=>{
 const t=harness(),sp=ROSTER[0],rear=battleBackSource(sp,1),front={width:768,height:256,id:'front'},back={width:768,height:256,id:'rear'};t.images.set(sp.atlas,front);t.images.set(rear.source,back);
 t.h.drawCompanion(t.ctx,sp,1,0,0,36,'up',true,.25);assert.equal(t.poses.length,16);assert.ok(t.poses.filter(p=>p.direction===0).every(p=>p.image===back&&p.rect.join(',')===rear.frame.join(',')));assert.ok(t.poses.filter(p=>p.direction>0).every(p=>p.image===front));
 for(const [row,face] of ['up','down','left','right'].entries()){t.h.drawCompanion(t.ctx,sp,1,0,0,36,face,true,1.25);assert.equal(t.draws.at(-1)[1],64);assert.equal(t.draws.at(-1)[2],row*64);}assert.equal(t.made(),1);
});
test('walking atlas cache evicts old forms at 24 canvases and rebakes revised artwork',()=>{
 assert.equal(companionRig(ROSTER.find(sp=>sp.id==='truffleroot'),2).kind,'quadruped');
 const t=harness();for(const sp of ROSTER.slice(0,27)){t.images.set(sp.atlas,{width:768,height:256});t.images.set(battleBackSource(sp,0).source,{width:768,height:256});t.h.drawCompanion(t.ctx,sp,0,0,0);}
 assert.equal(t.h.companionCacheSize(),24);assert.equal(t.made(),27);t.h.drawCompanion(t.ctx,ROSTER[26],0,0,0);assert.equal(t.made(),27);t.h.drawCompanion(t.ctx,ROSTER[0],0,0,0);assert.equal(t.made(),28);
 t.h.drawCompanion(t.ctx,{...ROSTER[0],artRevision:999},0,0,0);assert.equal(t.made(),29);assert.equal(t.h.companionCacheSize(),24);
});
test('vertical following alternates left and right every full second, independent of tile progress',()=>{
 for(const face of ['up','down'])for(const [time,expected]of [[0,'left'],[500,'left'],[999,'left'],[1000,'right'],[1500,'right'],[1999,'right'],[2000,'left'],[2999,'left'],[3000,'right']])assert.equal(followingCompanionFacing(face,true,time),expected,face+' at '+time);
 for(const face of ['up','down','left','right'])for(const time of [0,1000,2000]){assert.equal(followingCompanionFacing(face,false,time),face,'idle');if(face==='left'||face==='right')assert.equal(followingCompanionFacing(face,true,time),face,'horizontal travel');}
});
test('the left and right companion poses use the same source image with a horizontal mirror',()=>{
 const image={id:'front'},rect=[0,0,256,256],rig=companionRig(ROSTER[0],0),flips=[],draws=[];
 const ctx={save(){},restore(){},translate:(...args)=>flips.push(['translate',...args]),scale:(...args)=>flips.push(['scale',...args]),drawImage:(...args)=>draws.push(args)};
 drawRigFrame(ctx,image,rect,rig,0,2);assert.deepEqual(flips,[]);
 drawRigFrame(ctx,image,rect,rig,0,3);assert.deepEqual(flips,[['translate',64,0],['scale',-1,1]]);assert.deepEqual(draws[0],draws[1]);
});
