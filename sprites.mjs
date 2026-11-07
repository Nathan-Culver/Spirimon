import {companionRig,companionFrame,drawRigFrame} from './companion-animation.mjs';
import {readyImage} from './asset-loader.mjs';
import {MYSTERY_STATIC,MYSTERY_WALK} from './placeholder-art.mjs';
import {townFeatures} from './towns.mjs';
import {drawAtlasAsset,TOWN_ATLAS} from './interior-assets.mjs';
import {groundCell,terrainCell,connectedEdges} from './terrain.mjs';
import {ART} from './roster.mjs';
import {battleBackSource} from './battle-art.mjs';
import {COLORS,hash,rng} from './engine.mjs';
const cache=new Map();
// Generated anatomy diagrams and their legacy cached PNGs are design data,
// not finished artwork. Keep the supplied mystery creature until real art loads.
export function creatureArtworkSource(sp,form=0){
 if(!sp)return null;
 if(sp.atlas)return sp.atlas;
 if(sp.proceduralArt||sp.visualValidation?.status==='procedural-verified'||sp.visualValidation?.semanticSource==='renderer-geometry')return null;
 return sp.sprites?.[form]||null;
}
export function shade(hex,n){const v=parseInt(hex.slice(1),16);return'#'+[v>>16,(v>>8)&255,v&255].map(x=>Math.max(0,Math.min(255,x+n)).toString(16).padStart(2,'0')).join('');}
function ellipse(c,x,y,rx,ry,color){c.fillStyle=color;for(let yy=-ry;yy<=ry;yy++){const w=Math.round(rx*Math.sqrt(Math.max(0,1-yy*yy/(ry*ry))));c.fillRect(Math.round(x-w),Math.round(y+yy),w*2+1,1);}}
function poly(c,pts,color){c.fillStyle=color;c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
// Four directions, four articulated poses per form. Keep at most 24 baked
// canvases (6 MiB), including mounts and followers in caves and interiors.
const companionSheets=new Map(),COMPANION_CACHE_LIMIT=24;
export function companionCacheSize(){return companionSheets.size;}
function generatedCompanionSheet(sp,form){
 const artwork=creatureArtworkSource(sp,form);if(!artwork)return null;
 const rear=battleBackSource(sp,form),key=[sp.id,form,artwork,rear?.source,JSON.stringify(rear?.frame),sp.artRevision].join(':');
 const existing=companionSheets.get(key);if(existing){companionSheets.delete(key);companionSheets.set(key,existing);return existing;}
 const front=readyImage(artwork),back=rear&&readyImage(rear.source);if(!front||rear&&!back)return null;
 const cell=64,canvas=document.createElement('canvas');canvas.width=canvas.height=cell*4;
 const g=canvas.getContext('2d');g.imageSmoothingEnabled=false;
 const fw=front.naturalWidth||front.width,fh=front.naturalHeight||front.height,frontRect=sp.atlas?[Math.max(0,Math.min(2,form))*256,0,256,256]:[0,0,fw,fh];
 const bw=back&&(back.naturalWidth||back.width),bh=back&&(back.naturalHeight||back.height),backRect=rear&&(rear.frame||[rear.atlas?rear.form*bw/3:0,0,rear.atlas?bw/3:bw,bh]);
 const rig=companionRig(sp,form);
 for(let direction=0;direction<4;direction++)for(let frame=0;frame<4;frame++){
  const image=direction===0&&back?back:front,rect=direction===0&&back?backRect:frontRect;
  g.save();g.translate(frame*cell,direction*cell);g.beginPath();g.rect(0,0,cell,cell);g.clip();drawRigFrame(g,image,rect,rig,frame,direction,cell);g.restore();
 }
 companionSheets.set(key,canvas);if(companionSheets.size>COMPANION_CACHE_LIMIT)companionSheets.delete(companionSheets.keys().next().value);
 return canvas;
}
export function drawCompanion(ctx,sp,form,x,y,size=36,face='down',moving=false,progress=0){
 if(!sp)return;const {row,frame}=companionFrame(face,moving,progress),authored=sp.companionSheets?.[form],sheet=authored?readyImage(authored):generatedCompanionSheet(sp,form);
 if(sheet){const sw=sheet.width/4,sh=sheet.height/4;ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(sheet,frame*sw,row*sh,sw,sh,x,y,size,size);ctx.restore();return;}
 drawMysteryPlaceholder(ctx,x,y,size,{face,moving,progress});
}
// Atlas rows are up, down, left, right; each contains one looping four-frame walk.
export function mysteryFrame(face='down',moving=false,progress=0){
 const row={up:0,down:1,left:2,right:3}[face]??1;
 const value=Number(progress),phase=Number.isFinite(value)?((value%1)+1)%1:0;
 return {row,frame:moving?Math.min(3,Math.floor(phase*4)):0};
}
export function drawMysteryPlaceholder(ctx,x,y,size=96,{face=null,moving=false,progress=0,flip=false}={}){
 const walking=face!==null,sheet=walking?readyImage(MYSTERY_WALK):null,image=sheet||readyImage(MYSTERY_STATIC);
 if(!image)return;
 ctx.save();ctx.imageSmoothingEnabled=false;
 if(sheet){const {row,frame}=mysteryFrame(face,moving,progress),sw=(sheet.naturalWidth||sheet.width)/4,sh=(sheet.naturalHeight||sheet.height)/4;ctx.drawImage(sheet,frame*sw,row*sh,sw,sh,x,y,size,size);}
 else{const w=image.naturalWidth||image.width,h=image.naturalHeight||image.height,scale=size/Math.max(w,h),dw=w*scale,dh=h*scale;
  ctx.translate(x+size/2,y+size);if(flip||face==='right')ctx.scale(-1,1);ctx.drawImage(image,-dw/2,-dh,dw,dh);
 }
 ctx.restore();
}
export function drawSpirit(ctx,sp,form,x,y,size=96,flip=false,motion=null){
 if(!sp)return;
 const artwork=creatureArtworkSource(sp,form),image=artwork?readyImage(artwork):null;
 if(!image){drawMysteryPlaceholder(ctx,x,y,size,motion?{...motion,flip}:{flip});return;}
 ctx.save();ctx.imageSmoothingEnabled=false;if(flip){ctx.translate(x+size,y);ctx.scale(-1,1);}else ctx.translate(x,y);if(sp.atlas){ctx.drawImage(image,form*256,0,256,256,0,0,size,size);}else{const h=size*image.height/image.width;ctx.drawImage(image,0,size-Math.min(size,h),size,Math.min(size,h));}ctx.restore();}
export function drawBattleSpirit(ctx,sp,form,x,y,size=96,side='a'){
 if(!sp)return;
 if(side!=='a'){drawSpirit(ctx,sp,form,x,y,size);return;}
 const rear=battleBackSource(sp,form),image=rear&&readyImage(rear.source);
 if(!image){drawMysteryPlaceholder(ctx,x,y,size,{face:'up'});return;}
 const width=image.naturalWidth||image.width,height=image.naturalHeight||image.height;
 const cell=rear.atlas?width/3:width,frame=rear.frame||[rear.atlas?rear.form*cell:0,0,cell,height];
 const [sx,sy,sw,sh]=frame;
 if(!frame.every(Number.isFinite)||sx<0||sy<0||sw<=0||sh<=0||sx+sw>width||sy+sh>height){drawMysteryPlaceholder(ctx,x,y,size,{face:'up'});return;}
 // Preserve authored form size and aspect ratio, center it, and ground its feet.
 // Wide final forms fit inside the slot without clipping or horizontal squeezing.
 const scale=size/Math.max(height,sw,sh),dw=sw*scale,dh=sh*scale;
 ctx.save();ctx.imageSmoothingEnabled=false;
 ctx.drawImage(image,sx,sy,sw,sh,x+(size-dw)/2,y+size-dh,dw,dh);
 ctx.restore();
}
function prop(ctx,index,x,y,w,h){const image=readyImage(ART.world);if(!image)return;ctx.imageSmoothingEnabled=false;ctx.drawImage(image,(index%3)*256,Math.floor(index/3)*256,256,256,Math.round(x),Math.round(y),w,h);}
export function drawAspectAura(ctx,ind,x,y,size){
 const color={Primal:'#ef8d53',Astral:'#ad9cef',Titan:'#d0b477',Swift:'#a1e7d7',Verdant:'#8fce72',Umbral:'#a682be',Stormbound:'#78cceb'}[ind.aspect];if(!color&&!ind.rareVariant)return;
 ctx.save();const glow=ctx.createRadialGradient(x+size/2,y+size*.6,size*.05,x+size/2,y+size*.6,size*.48);glow.addColorStop(0,(color||'#f9e3a0')+'55');glow.addColorStop(1,(color||'#f9e3a0')+'00');ctx.fillStyle=glow;ctx.fillRect(x,y,size,size);
 if(ind.rareVariant){ctx.fillStyle='#fff4a2';for(const [dx,dy]of [[.2,.2],[.8,.35],[.65,.1]]){const xx=x+size*dx,yy=y+size*dy;ctx.fillRect(xx-1,yy-4,3,9);ctx.fillRect(xx-4,yy-1,9,3);}}
 ctx.restore();
}
const portraitBoundsCache=new WeakMap();
export function opaqueBounds({width,height,data},threshold=8){
 let left=width,top=height,right=-1,bottom=-1;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(data[(y*width+x)*4+3]>threshold){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
 return right<left?{x:0,y:0,width,height}:{x:left,y:top,width:right-left+1,height:bottom-top+1};
}
function portraitSourceBounds(image,atlas,form){
 let frames=portraitBoundsCache.get(image);if(!frames){frames=new Map();portraitBoundsCache.set(image,frames);}
 const key=atlas?'form-'+form:'single';if(frames.has(key))return frames.get(key);
 const source={x:atlas?form*256:0,y:0,width:atlas?256:image.naturalWidth||image.width,height:atlas?256:image.naturalHeight||image.height};let bounds=source;
 try{const sample=document.createElement('canvas');sample.width=source.width;sample.height=source.height;const c=sample.getContext('2d',{willReadFrequently:true});c.drawImage(image,source.x,source.y,source.width,source.height,0,0,source.width,source.height);const content=opaqueBounds(c.getImageData(0,0,source.width,source.height));bounds={...content,x:source.x+content.x,y:source.y+content.y};}catch{}
 frames.set(key,bounds);return bounds;
}
export function damageNumberAnchor(sp,form,point){
 const artwork=creatureArtworkSource(sp,form),image=artwork&&readyImage(artwork),{x,ground,size}=point;
 if(!image)return {x,y:ground-size*.9,headSize:size*.24};
 const b=portraitSourceBounds(image,!!sp.atlas,form),sourceW=sp.atlas?256:image.naturalWidth||image.width,sourceH=sp.atlas?256:image.naturalHeight||image.height;
 const h=sp.atlas?size:Math.min(size,size*sourceH/sourceW),w=size;
 return {x:x-size/2+(b.x-(sp.atlas?form*256:0)+b.width/2)*w/sourceW,y:ground-h+b.y*h/sourceH,headSize:Math.min(b.width*w/sourceW,b.height*h/sourceH)*.27};
}
export function drawSpiritPortrait(ctx,sp,form,x,y,width,height=width){
 const artwork=creatureArtworkSource(sp,form),image=artwork?readyImage(artwork):null;
 if(!image){const size=Math.min(width,height);drawSpirit(ctx,sp,form,x+(width-size)/2,y+(height-size)/2,size);return;}
 const bounds=portraitSourceBounds(image,!!sp.atlas,Math.max(0,Math.min(2,Number(form)||0))),padding=Math.min(width,height)*.04;
 const scale=Math.min((width-padding*2)/bounds.width,(height-padding*2)/bounds.height),w=bounds.width*scale,h=bounds.height*scale;
 ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(image,bounds.x,bounds.y,bounds.width,bounds.height,x+(width-w)/2,y+(height-h)/2,w,h);ctx.restore();
}
export function renderSpiritCanvases(root=document){root.querySelectorAll('canvas[data-species]').forEach(c=>{const sp=globalThis.spirimonSpecies?.[c.dataset.species];if(!sp)return;const ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);drawAspectAura(ctx,{aspect:c.dataset.aspect,rareVariant:c.dataset.radiant==='true'},0,0,c.width);drawSpiritPortrait(ctx,sp,Number(c.dataset.form)||0,0,0,c.width,c.height);});}
function fallbackDrawTile(ctx,type,x,y,seed,biome){
 const key='tile-'+type+'-'+biome+'-'+seed%16;let tile=cache.get(key);
 if(!tile){tile=document.createElement('canvas');tile.width=tile.height=32;const c=tile.getContext('2d'),r=rng(seed%16);const q=(a,b,w,h,col)=>{c.fillStyle=col;c.fillRect(a,b,w,h);};
 const greens=biome==='ash'?['#a3b05b','#b8c36c','#8b9d48']:biome==='fen'?['#59a476','#75b88a','#41885e']:biome==='highland'?['#83bd50','#9bce66','#6ca13e']:['#67b64b','#7fc45b','#55a13c'];
 q(0,0,32,32,greens[0]);for(let n=0;n<40;n++){const xx=Math.floor(r()*16)*2,yy=Math.floor(r()*16)*2;q(xx,yy,2,1,n%2?greens[1]:greens[2]);}
 if(type==='forest'){q(0,0,32,32,greens[2]);for(let n=0;n<20;n++)q(Math.floor(r()*16)*2,Math.floor(r()*16)*2,2,2,greens[0]);}
 if(type==='path'||type==='stairs'){q(0,0,32,32,'#d5bb85');for(let n=0;n<35;n++)q(Math.floor(r()*16)*2,Math.floor(r()*16)*2,2,1,n%3?'#dfc994':'#c1a671');if(type==='stairs')for(let yy=1;yy<32;yy+=6){q(0,yy,32,2,'#8b765d');q(0,yy+2,32,2,'#e0d2aa');}}
 if(type==='grass'){for(let yy=4;yy<32;yy+=9)for(let xx=-2;xx<32;xx+=8){const dx=Math.floor(r()*3);poly(c,[[xx+dx,yy+7],[xx+dx-2,yy],[xx+dx+3,yy+4],[xx+dx+6,yy-3],[xx+dx+6,yy+7]],'#32732e');poly(c,[[xx+dx+1,yy+6],[xx+dx,yy+1],[xx+dx+4,yy+5],[xx+dx+5,yy],[xx+dx+5,yy+6]],'#75b13d');q(xx+dx+3,yy+1,1,5,'#a6ce60');}}
 if(type==='flower'){for(let n=0;n<5;n++){const xx=3+Math.floor(r()*12)*2,yy=3+Math.floor(r()*12)*2;q(xx,yy,2,7,'#3c863e');q(xx-2,yy,6,2,n%2?'#fff1c3':'#efb5cc');q(xx,yy-2,2,6,n%2?'#fff1c3':'#efb5cc');q(xx,yy,2,2,'#dcaa4e');}}
 if(type==='water'){q(0,0,32,32,'#499db9');for(let yy=0;yy<32;yy+=8){q(0,yy,32,3,'#59abc2');q(Math.floor(r()*16),yy+3,12,1,'#8cd6de');q(Math.floor(r()*16)+2,yy+5,9,1,'#378da8');}}
 if(type==='cliff'){q(0,0,32,32,'#98735b');q(0,0,32,3,greens[2]);q(0,3,32,4,greens[0]);q(0,7,32,2,'#d5b17f');q(0,9,32,3,'#6e5545');for(let yy=12;yy<32;yy+=7){q(0,yy,32,2,'#b58e69');for(let n=0;n<5;n++){const xx=Math.floor(r()*16)*2;q(xx,yy+2,2,5,'#725340');q(xx+2,yy+3,3,3,'#a78162');}}q(0,29,32,3,'#644f3f');}
 if(type==='rock'){ellipse(c,16,25,14,5,'#467439');poly(c,[[3,25],[5,14],[12,9],[23,10],[29,18],[28,26]],'#5d6c61');poly(c,[[6,14],[14,10],[22,12],[24,18],[14,20],[4,23]],'#9aa18a');q(12,13,8,2,'#c0bca0');q(21,22,6,3,'#74806e');}
 if(type==='well'){ellipse(c,16,27,14,4,'#4f773e');q(5,10,22,17,'#8b9982');q(8,12,16,8,'#376e7e');q(3,8,26,4,'#c5c5a3');q(4,22,24,5,'#b3ba97');q(12,4,8,5,'#a9b49b');}
 if(type==='guild'||type==='house')q(0,0,32,32,'#b2a27b');
 cache.set(key,tile);}
 ctx.imageSmoothingEnabled=false;ctx.drawImage(tile,Math.round(x),Math.round(y));
}
export function drawTree(ctx,x,y,seed,biome='forest'){prop(ctx,biome==='snow'?4:seed%7===0?5:3,x-16,y-48,64,80);}
export function drawBuilding(ctx,x,y,guild=false,kind='home'){prop(ctx,guild?2:kind==='inn'?1:0,x+(guild?24:8),y-40,guild?176:144,guild?168:136);}
export function drawTownDecor(ctx,x,y){prop(ctx,8,x-32,y-64,96,96);}
export function drawPerson(ctx,x,y,role='player',tick=0,face='down',moving=false,appearance=null){
 const image=readyImage(ART.sealer);if(!image)return;
 const row=face==='left'?2:({down:0,right:2,up:3}[face]??0);
 const frame=moving?[0,1,2,1][Math.floor(Math.max(0,tick)/70)%4]:1;
 ctx.save();ctx.imageSmoothingEnabled=false;
 if(role!=='player')ctx.filter='hue-rotate('+({keeper:130,merchant:45,rival:220,scholar:280,resident:80}[role]||90)+'deg)';
 if(face==='left'){ctx.translate(Math.round(x)+32,Math.round(y)-12);ctx.scale(-1,1);ctx.drawImage(image,frame*64,row*80,64,80,0,0,32,40);}
 else ctx.drawImage(image,frame*64,row*80,64,80,Math.round(x),Math.round(y)-12,32,40);
 ctx.restore();
}
export function drawTile(ctx,type,x,y,seed,biome,options={}){
 const image=readyImage(ART.terrain);if(!image){fallbackDrawTile(ctx,type,x,y,seed,biome);return;}
 const edges=connectedEdges(type,options.neighbors||[type,type,type,type]),town=!!options.town;
 const key='painted-'+type+'-'+biome+'-'+seed%8+'-'+edges+'-'+town;let tile=cache.get(key);
 if(!tile){tile=document.createElement('canvas');tile.width=tile.height=32;const p=tile.getContext('2d');p.imageSmoothingEnabled=true;
 const stamp=(c,index)=>c.drawImage(image,index%4*64,Math.floor(index/4)*64,64,64,0,0,32,32);
 stamp(p,groundCell(biome));const index=terrainCell(type,biome,seed,town);
 if(['path','water'].includes(type)){
  if(type==='water'&&edges!==15)stamp(p,10);
  const layer=document.createElement('canvas');layer.width=layer.height=32;const q=layer.getContext('2d');q.imageSmoothingEnabled=false;stamp(q,index);
  // Irregular pixel edges expose the ground below rather than drawing a square border.
  for(let side=0;side<4;side++){if(edges&(1<<side))continue;for(let n=0;n<32;n++){const inset=2+hash(seed,side,Math.floor(n/3))%3;for(let d=0;d<inset;d++){const xx=side===1?31-d:side===3?d:n,yy=side===0?d:side===2?31-d:n;q.clearRect(xx,yy,1,1);}}}
  p.drawImage(layer,0,0);
 }else{stamp(p,index);if(['lawn','flower'].includes(type)){p.fillStyle='#59784044';p.fillRect(0,0,32,32);}}
 // Seeded top-down coastal artwork matches the existing 32px terrain atlas.
 if(type==='beach'||type==='coast-cliff'){
  p.fillStyle='#c3ae82';p.fillRect(0,0,32,32);
  const r=rng(seed);for(let n=0;n<105;n++){const xx=Math.floor(r()*32),yy=Math.floor(r()*32);p.fillStyle=n%4===0?'#e3d3a5':n%4===1?'#887b64':'#ae9977';p.fillRect(xx,yy,1+(n%7===0?2:0),1);}
  if(type==='coast-cliff'){
   p.fillStyle='#373a36';p.fillRect(2,5,29,25);p.fillStyle='#67675c';p.fillRect(2,3,27,18);p.fillStyle='#a3a18b';p.fillRect(3,3,24,4);
   for(let n=0;n<16;n++){const xx=Math.floor(r()*26)+3,yy=Math.floor(r()*18)+7;p.fillStyle=n%2?'#4b4c43':'#868574';p.fillRect(xx,yy,2,2+Math.floor(r()*5));}
   p.fillStyle='#536c41';p.fillRect(3,1,24,3);p.fillStyle='#91a06a';p.fillRect(4,1,16,1);
  }else{
   for(let n=0;n<8;n++){const xx=Math.floor(r()*30),yy=Math.floor(r()*30);p.fillStyle=n%3===0?'#f0e3c2':'#756e60';p.fillRect(xx,yy,1+n%3,1);}
  }
  // Edge overlays are drawn from real adjacent water tiles, not square pools.
  const ns=options.neighbors||[];
  for(let side=0;side<4;side++)if(ns[side]==='water'){
   for(let i=0;i<32;i++){const jitter=hash(seed,'surf',side,Math.floor(i/4))%3,depth=3+jitter;
    for(let d=0;d<depth;d++){const xx=side===1?31-d:side===3?d:i,yy=side===0?d:side===2?31-d:i;
     p.fillStyle=d<2?'#d9e5d4':d<4?'#76b4af':'#367f8d';p.fillRect(xx,yy,1,1);
    }
   }
  }
 }
 if(type==='water'){
  const ns=options.neighbors||[];
  const nearLand=ns.some(t=>t&&t!=='water');
  if(!nearLand){p.fillStyle='#143f6466';p.fillRect(0,0,32,32);}
  const r=rng(seed);for(let n=0;n<(nearLand?8:4);n++){const xx=Math.floor(r()*29),yy=Math.floor(r()*30);p.fillStyle=nearLand?'#a8e1d4':'#5798b0';p.fillRect(xx,yy,2+n%3,1);}
  if(seed%23===0){p.fillStyle='#668d75';p.fillRect(9,19,4,3);p.fillRect(16,22,3,2);}
 }
 if(type==='cliff'&&!(edges&1)){p.drawImage(image,0,0,64,12,0,0,32,6);p.fillStyle='#28342580';p.fillRect(0,6,32,2);}
 if(type==='grass'){const r=rng(seed);for(let n=0;n<12;n++){const xx=2+Math.floor(r()*28),yy=4+Math.floor(r()*26);p.fillStyle=biome==='ash'?'#5e6444':'#2e4932';p.fillRect(xx,yy,1,4);p.fillRect(xx-1,yy+1,3,1);p.fillStyle=biome==='ash'?'#ada371':'#a5af62';p.fillRect(xx,yy-1,1,3);}}
 if(type==='rock'){p.fillStyle='#15251e66';p.beginPath();p.ellipse(17,25,13,4,0,0,Math.PI*2);p.fill();p.save();p.beginPath();p.moveTo(4,24);p.lineTo(6,14);p.lineTo(13,8);p.lineTo(23,10);p.lineTo(29,19);p.lineTo(26,27);p.lineTo(10,28);p.closePath();p.clip();p.drawImage(image,6%4*64,Math.floor(6/4)*64,64,64,4,8,25,21);p.restore();p.fillStyle='#c4bd9866';p.fillRect(9,9,13,2);}
 cache.set(key,tile);
 }ctx.imageSmoothingEnabled=false;ctx.drawImage(tile,Math.round(x),Math.round(y));
}
export function drawWell(ctx,x,y){prop(ctx,7,x-16,y-32,64,64);}

export function drawTownBuilding(ctx,b,x,y){
 const facade=b.facade!=null?b.facade:({forge:1,herbalist:2,archive:3}[b.kind]);
 if(facade!=null){
  const width=b.kind==='archive'?176:144,height=b.kind==='archive'?168:144;
  if(drawAtlasAsset(ctx,TOWN_ATLAS,facade,x+(b.dx+.5)*32-width/2,y+(b.h-.5)*32-height,width,height))return;
 }
 drawBuilding(ctx,x,y,b.kind==='hall',b.kind);
}
export function drawTownFeatures(ctx,cx,cy,px,py,only=null){for(const f of (only?[only]:townFeatures(cx,cy))){const x=px(cx*48+f.x),y=py(cy*36+f.y);if(f.asset!=null){drawAtlasAsset(ctx,TOWN_ATLAS,f.asset,x-4,y-12,f.w*32+8,f.h*32+12);continue;}const width=f.cell===8?112:f.w===2?72:64,height=f.cell===8?104:f.cell===5?88:64;drawAtlasAsset(ctx,TOWN_ATLAS,({3:9,4:10,5:7,6:11,7:12,8:14}[f.cell]??7),x+(f.w*32-width)/2,y+f.h*32-height,width,height);}}

