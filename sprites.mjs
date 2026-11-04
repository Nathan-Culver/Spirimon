import {readyImage} from './asset-loader.mjs';
import {MYSTERY_STATIC,MYSTERY_WALK} from './placeholder-art.mjs';
import {townFeatures} from './towns.mjs';
import {drawAtlasAsset,TOWN_ATLAS} from './interior-assets.mjs';
import {groundCell,terrainCell,connectedEdges} from './terrain.mjs';
import {ART} from './roster.mjs';
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
// Companion sheets use four rows (north,south,west,east), four frames each,
// and one sheet per evolution form. Missing sheets fall back to roster artwork.
// Each species and evolution has its own cached 4x4 walking atlas.
// Source art remains the authoritative creature image. Dedicated authored
// direction sheets in assets/companions take precedence when supplied.
const companionSheets=new Map();
function generatedCompanionSheet(sp,form){
 const artwork=creatureArtworkSource(sp,form);if(!artwork)return null;
 const key=sp.id+':'+form+':'+artwork;
 const existing=companionSheets.get(key);
 if(existing)return existing;
 const source=readyImage(artwork);
 if(!source)return null;
 const cell=64,canvas=document.createElement('canvas');
 canvas.width=cell*4;canvas.height=cell*4;
 const g=canvas.getContext('2d');g.imageSmoothingEnabled=false;
 const srcX=sp.atlas?Math.max(0,Math.min(2,form))*256:0;
 const srcW=sp.atlas?256:source.naturalWidth||source.width;
 const srcH=sp.atlas?256:source.naturalHeight||source.height;
 for(let direction=0;direction<4;direction++)for(let frame=0;frame<4;frame++){
  const cx=frame*cell+cell/2,cy=direction*cell+cell/2;
  const step=[0,-2,0,2][frame],stride=[0,1,0,-1][frame];
  g.save();g.translate(cx,cy+step);
  // Preserve the original creature design; the horizontal directions
  // use mirrored source art, while vertical directions use foreshortening.
  if(direction===2)g.scale(-1,1);
  if(direction===0||direction===1){
   g.scale(direction===0?.84:.94,direction===0?.88:1);
  }
  g.rotate(stride*.035);
  g.drawImage(source,srcX,0,srcW,srcH,-cell/2,-cell/2,cell,cell);
  g.restore();
 }
 companionSheets.set(key,canvas);
 return canvas;
}
export function drawCompanion(ctx,sp,form,x,y,size=36,face='down',moving=false,progress=0){
 if(!sp)return;
 const row={up:0,down:1,left:3,right:2}[face]??1;
 const frame=moving?Math.min(3,Math.floor(Math.max(0,progress)*4)):0;
 // Avoid requesting hundreds of nonexistent files: explicit authored
 // sheets are opt-in; generated sheets cover all existing roster forms.
 const authored=sp.companionSheets?.[form];
 const sheet=authored?readyImage(authored):generatedCompanionSheet(sp,form);
 if(sheet){
  const sw=sheet.width/4,sh=sheet.height/4;
  ctx.save();ctx.imageSmoothingEnabled=false;
  ctx.drawImage(sheet,frame*sw,row*sh,sw,sh,x,y,size,size);
  ctx.restore();return;
 }
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
function prop(ctx,index,x,y,w,h){const image=readyImage(ART.world);if(!image)return;ctx.imageSmoothingEnabled=false;ctx.drawImage(image,(index%3)*256,Math.floor(index/3)*256,256,256,Math.round(x),Math.round(y),w,h);}
export function drawAspectAura(ctx,ind,x,y,size){
 const color={Primal:'#ef8d53',Astral:'#ad9cef',Titan:'#d0b477',Swift:'#a1e7d7',Verdant:'#8fce72',Umbral:'#a682be',Stormbound:'#78cceb'}[ind.aspect];if(!color&&!ind.rareVariant)return;
 ctx.save();const glow=ctx.createRadialGradient(x+size/2,y+size*.6,size*.05,x+size/2,y+size*.6,size*.48);glow.addColorStop(0,(color||'#f9e3a0')+'55');glow.addColorStop(1,(color||'#f9e3a0')+'00');ctx.fillStyle=glow;ctx.fillRect(x,y,size,size);
 if(ind.rareVariant){ctx.fillStyle='#fff4a2';for(const [dx,dy]of [[.2,.2],[.8,.35],[.65,.1]]){const xx=x+size*dx,yy=y+size*dy;ctx.fillRect(xx-1,yy-4,3,9);ctx.fillRect(xx-4,yy-1,9,3);}}
 ctx.restore();
}
export function renderSpiritCanvases(root=document){root.querySelectorAll('canvas[data-species]').forEach(c=>{const sp=globalThis.spirimonSpecies?.[c.dataset.species];if(!sp)return;const ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);drawAspectAura(ctx,{aspect:c.dataset.aspect,rareVariant:c.dataset.radiant==='true'},0,0,c.width);drawSpirit(ctx,sp,Number(c.dataset.form)||0,0,0,c.width);});}
function paintPerson(ctx,x,y,role='player',tick=0,face='down',moving=false){
 ctx.save();ctx.translate(Math.round(x),Math.round(y));const q=(a,b,w,h,col)=>{ctx.fillStyle=col;ctx.fillRect(a,b,w,h);};
 const step=moving?Math.round(Math.sin(tick/1000*Math.PI*4)*2):0;
 ellipse(ctx,16,29,9,3,'#355f4455');
 const coat={player:'#b94535',keeper:'#eee2bb',merchant:'#ba914f',rival:'#537994',scholar:'#8b7399'}[role],ink='#423e35';
 q(10,22,5,7+Math.max(0,step),'#424c52');q(18,22,5,7+Math.max(0,-step),'#424c52');q(9,28+step,7,3,ink);q(18,28-step,7,3,ink);
 q(9,13,15,11,ink);q(10,13,13,10,coat);q(7,15+step,4,9,coat);q(23,15-step,3,9,coat);
 q(10,23,13,2,'#d6be83');q(15,16,3,7,'#e8d9b4');q(17,14,2,6,'#e8d9b4');
 q(11,4,11,10,'#ecc99b');q(10,2,13,5,'#443b31');q(8,6,5,7,'#443b31');q(21,6,3,7,'#443b31');
 if(face!=='up'){if(face!=='right')q(14,9,2,2,ink);if(face!=='left')q(20,9,2,2,ink);}else q(12,6,10,6,'#443b31');
 if(role==='player'){q(9,4,15,3,'#a63d32');q(20,5,6,2,'#e0aa60');q(23,7,4,3,'#c64e36');q(23,20-step,3,2,'#6c8b78');}
 if(role==='merchant'){poly(ctx,[[2,8],[16,-1],[29,8]],'#b8995b');q(3,8,26,2,'#7b623d');}
 if(role==='keeper'){q(9,3,15,4,'#ded9b4');q(7,7,5,6,'#d8d1b1');}
 ctx.restore();
}
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
function oldDrawTree(ctx,x,y,seed,biome='forest'){
 const variant=seed%12,key='tree-detail-'+variant+'-'+biome;let tree=cache.get(key);
 if(!tree){tree=document.createElement('canvas');tree.width=64;tree.height=80;const c=tree.getContext('2d'),r=rng(variant);const q=(a,b,w,h,col)=>{c.fillStyle=col;c.fillRect(a,b,w,h);};
 ellipse(c,32,74,25,5,'#244f354d');q(25,43,15,29,'#514a32');q(28,43,5,28,'#91764a');q(34,46,4,26,'#6c5938');q(20,69,11,5,'#665636');q(36,68,10,6,'#665636');q(27,70,3,5,'#b2965d');
 const palette=variant===2?['#734b5c','#a9617e','#c77b96','#e19ab3','#f4b6c8','#ffd6dc']:biome==='ash'?['#4f5832','#626e3a','#7f8e42','#99a451','#b3ba64','#c7ca79']:['#234d2c','#316638','#477e3c','#5c9745','#78af4e','#95c45d'];
 const lobes=[[18,26,17,20],[44,27,18,20],[31,16,21,15],[31,37,25,19]];
 const inside=(xx,yy)=>lobes.some(([cx,cy,rx,ry])=>((xx-cx)/rx)**2+((yy-cy)/ry)**2<1);
 for(let yy=0;yy<61;yy++)for(let xx=0;xx<64;xx++){if(!inside(xx,yy))continue;let light=(1-yy/65)*3+(1-xx/70)*1.5;const cluster=hash(Math.floor(xx/3),Math.floor(yy/3),variant)%5;light+=(cluster-2)*.45;if(!inside(xx-1,yy)||!inside(xx+1,yy)||!inside(xx,yy+1))light=0;const color=palette[Math.max(0,Math.min(5,Math.floor(light)))];q(xx,yy,1,1,color);}
 for(let n=0;n<20;n++){const xx=10+Math.floor(r()*42),yy=8+Math.floor(r()*36);if(inside(xx,yy))q(xx,yy,2,1,palette[3+Math.floor(r()*3)]);}
 if(variant===7){c.clearRect(0,0,64,67);for(let n=0;n<5;n++){const xx=10+n*10,top=5+(n%2)*8;q(xx,top,4,66-top,'#3c7a39');q(xx+1,top,1,66-top,'#a0c766');for(let yy=top+4;yy<64;yy+=10){q(xx-1,yy,6,2,'#315e30');poly(c,[[xx,yy],[xx-12,yy-7],[xx-5,yy+2]],'#4b9346');poly(c,[[xx+4,yy+2],[xx+13,yy-6],[xx+9,yy+5]],'#6aaa4c');}}}
 cache.set(key,tree);}
 ctx.drawImage(tree,Math.round(x)-16,Math.round(y)-48);
}
function oldDrawBuilding(ctx,x,y,guild=false){
 const q=(a,b,w,h,col)=>{ctx.fillStyle=col;ctx.fillRect(Math.round(x+a),Math.round(y+b),w,h);};
 const w=guild?160:128,roof=guild?'#476f77':'#a84c3d',roofLight=guild?'#739397':'#cf7050',timber='#633e2e';
 q(-2,94,w+4,11,'#8d8a73');q(2,47,w-4,48,'#f0dfb5');q(4,85,w-8,10,'#b99972');q(7,48,6,45,timber);q(w-13,48,6,45,timber);q(5,58,w-10,4,timber);q(5,91,w-10,4,timber);
 // Swept tiled eaves, timber rafters and layered ridge caps.
 poly(ctx,[[x-9,y+50],[x+4,y+46],[x+22,y+21],[x+w-22,y+21],[x+w-4,y+46],[x+w+9,y+50],[x+w+5,y+55],[x-5,y+55]],timber);
 poly(ctx,[[x-12,y+45],[x+3,y+45],[x+25,y+15],[x+w-25,y+15],[x+w-3,y+45],[x+w+12,y+45],[x+w+8,y+50],[x-8,y+50]],roof);
 q(24,12,w-48,5,roofLight);q(20,16,w-40,3,timber);
 for(let row=0;row<5;row++){const inset=22-row*5,yy=22+row*5;q(inset,yy,w-inset*2,2,roofLight);for(let col=inset+4;col<w-inset;col+=12)q(col,yy-3,1,4,'#253f433f');}
 q(-12,42,10,3,roofLight);q(w+2,42,10,3,roofLight);q(-14,37,4,8,roof);q(w+10,37,4,8,roof);
 if(guild){poly(ctx,[[x+34,y+23],[x+48,y+3],[x+w-48,y+3],[x+w-34,y+23]],roof);q(47,0,w-94,4,roofLight);q(36,23,w-72,4,timber);q(44,18,w-88,2,roofLight);q(w/2-12,30,24,18,'#e5c878');q(w/2-10,32,20,14,'#794534');q(w/2-2,35,4,8,'#e6c17c');}
 q(w/2-14,63,28,32,timber);q(w/2-11,66,22,29,'#3d4b3b');q(w/2-1,66,2,29,'#b88b55');
 for(const xx of[22,w-44]){q(xx,65,22,19,timber);q(xx+2,67,18,15,'#e6c581');q(xx+9,66,2,18,timber);q(xx,74,22,2,timber);}
 for(const xx of[12,w-23]){q(xx+4,54,2,9,timber);q(xx,62,11,14,'#a43f32');q(xx+2,64,7,10,'#dc6c43');q(xx+4,62,3,14,'#e6a75e');q(xx+4,76,2,6,'#b45435');}
 q(w/2-22,96,44,4,'#b7ac8c');q(w/2-27,100,54,4,'#d8c5a0');
}
function oldDrawTownDecor(ctx,x,y){
 const q=(a,b,w,h,col)=>{ctx.fillStyle=col;ctx.fillRect(Math.round(x+a),Math.round(y+b),w,h);};
 // Vermilion shrine gate, with upturned crossbeam ends.
 q(2,6,7,49,'#8b3c2c');q(54,6,7,49,'#8b3c2c');q(4,7,3,46,'#d36d45');q(56,7,3,46,'#d36d45');q(-4,6,72,6,'#b74b32');q(6,21,51,5,'#b74b32');q(-8,1,80,6,'#3f4d43');q(-10,-2,8,5,'#3f4d43');q(66,-2,8,5,'#3f4d43');q(29,11,6,10,'#e1c486');q(0,54,12,4,'#797d68');q(52,54,12,4,'#797d68');
}

function oldDrawPerson(ctx,x,y,role='player',tick=0,face='down',moving=false){const frame=moving?Math.floor(tick/250)%4:0,key='person-'+role+'-'+face+'-'+frame;let p=cache.get(key);if(!p){p=document.createElement('canvas');p.width=32;p.height=36;paintPerson(p.getContext('2d'),0,0,role,[0,125,0,375][frame],face,moving);cache.set(key,p);}ctx.imageSmoothingEnabled=false;ctx.drawImage(p,Math.round(x)-5,Math.round(y)-15,42,47);}

export function drawTree(ctx,x,y,seed,biome='forest'){prop(ctx,biome==='snow'?4:seed%7===0?5:3,x-16,y-48,64,80);}
export function drawBuilding(ctx,x,y,guild=false,kind='home'){prop(ctx,guild?2:kind==='inn'?1:0,x+(guild?24:8),y-40,guild?176:144,guild?168:136);}
export function drawTownDecor(ctx,x,y){prop(ctx,8,x,y-25,96,96);}
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

function expandedProp(ctx,index,x,y,w,h){const image=readyImage(ART.towns);if(!image)return;ctx.imageSmoothingEnabled=false;ctx.drawImage(image,index%3*256,Math.floor(index/3)*256,256,256,Math.round(x),Math.round(y),w,h);}
export function drawTownBuilding(ctx,b,x,y){
 // The original service-specific ART.towns atlas contains visibly blocky,
 // prototype-quality facades. All service buildings now use the detailed
 // settlement facade atlas or the authored world-building sprites instead.
 const facade=b.facade!=null?b.facade:({forge:1,herbalist:2,archive:3}[b.kind]);
 if(facade!=null){
  const width=b.kind==='archive'?176:144,height=b.kind==='archive'?168:144;
  if(drawAtlasAsset(ctx,TOWN_ATLAS,facade,x+(b.dx+.5)*32-width/2,y+(b.h-.5)*32-height,width,height))return;
 }
 drawBuilding(ctx,x,y,b.kind==='hall',b.kind);
}
export function drawTownFeatures(ctx,cx,cy,px,py,only=null){for(const f of (only?[only]:townFeatures(cx,cy))){const x=px(cx*48+f.x),y=py(cy*36+f.y);if(f.asset!=null){drawAtlasAsset(ctx,TOWN_ATLAS,f.asset,x-4,y-12,f.w*32+8,f.h*32+12);continue;}const width=f.cell===8?112:f.w===2?72:64,height=f.cell===8?104:f.cell===5?88:64;drawAtlasAsset(ctx,TOWN_ATLAS,({3:9,4:10,5:7,6:11,7:12,8:14}[f.cell]??7),x+(f.w*32-width)/2,y+f.h*32-height,width,height);}}

