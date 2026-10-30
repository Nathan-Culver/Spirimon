import {TOWN_FEATURES} from './towns.mjs';
import {groundCell,terrainCell,connectedEdges} from './terrain.mjs';
import {ART} from './roster.mjs';
import {COLORS,hash,rng} from './engine.mjs';
const cache=new Map(),images=new Map();
export function shade(hex,n){const v=parseInt(hex.slice(1),16);return'#'+[v>>16,(v>>8)&255,v&255].map(x=>Math.max(0,Math.min(255,x+n)).toString(16).padStart(2,'0')).join('');}
function ellipse(c,x,y,rx,ry,color){c.fillStyle=color;for(let yy=-ry;yy<=ry;yy++){const w=Math.round(rx*Math.sqrt(Math.max(0,1-yy*yy/(ry*ry))));c.fillRect(Math.round(x-w),Math.round(y+yy),w*2+1,1);}}
function poly(c,pts,color){c.fillStyle=color;c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
export function spiritSprite(sp,form=0){const key=sp.id+':'+form;if(cache.has(key))return cache.get(key);const c=document.createElement('canvas');c.width=c.height=64;const p=c.getContext('2d');p.imageSmoothingEnabled=false;const r=rng(sp.identity),main=COLORS[sp.base],accent=COLORS[sp.alter],dark=shade(main,-65),light=shade(main,35);const growth=form*2+(sp.identity%3);const body=(x,y,rx,ry)=>{ellipse(p,x,y,rx+1,ry+1,'#152927');ellipse(p,x,y,rx,ry,dark);ellipse(p,x-1,y-2,rx-1,ry-2,main);ellipse(p,x-3,y-4,Math.max(2,rx-5),Math.max(2,ry-5),light);};const rect=(x,y,w,h,col)=>{p.fillStyle=col;p.fillRect(x,y,w,h);};const eye=(x,y)=>{rect(x,y,4,4,'#142a29');rect(x+1,y,3,2,'#f0e9ae');rect(x+2,y,1,2,'#fffbe1');};
ellipse(p,32,57,20+growth,3,'#162d2a');
if(['Beast','Monstrosity'].includes(sp.base)){
poly(p,[[39,37],[53,31],[58,16],[59,38],[51,46],[39,47]],dark);poly(p,[[45,36],[53,33],[56,23],[55,39],[48,43]],accent);
body(31,40,16+growth,10+growth);rect(19-growth,44,7,10,dark);rect(37+growth,44,7,10,dark);rect(17-growth,52,10,3,main);rect(36+growth,52,10,3,main);body(21,28,12+growth,11+growth);
poly(p,[[10,21],[12,7-growth],[22,19]],dark);poly(p,[[26,19],[34,10-growth],[32,28]],dark);poly(p,[[13,18],[14,12-growth],[19,19]],accent);poly(p,[[27,19],[31,15],[30,24]],accent);body(13,34,8,5);eye(17,25);rect(6,33,3,3,'#122321');rect(13,38,8,1,dark);
if(sp.body.includes('stag')||form>0){poly(p,[[15,13],[13,3],[11,3],[13,10],[8,7],[7,9],[14,15]],accent);poly(p,[[29,14],[34,3],[36,3],[34,10],[41,7],[41,10],[31,17]],accent);}
if(sp.base==='Monstrosity')poly(p,[[31,35],[39,12],[54,9],[45,26],[57,22],[46,38]],accent);
}else if(['Humanoid','Giant','Construct','Fiend'].includes(sp.base)){
const broad=sp.base==='Giant'?5:0;body(32,35,11+broad+growth,14);rect(21-broad,43,8,12,dark);rect(35+broad,43,8,12,dark);rect(18-broad,53,12,4,main);rect(34+broad,53,12,4,main);body(17-broad-growth,35,5,12);body(47+broad+growth,35,5,12);body(32,16,10+growth,10);eye(25,15);eye(35,15);
if(sp.base==='Construct'){rect(23,12,18,3,accent);rect(25,28,14,13,dark);rect(29,31,6,7,accent);rect(26,47,2,5,accent);rect(38,47,2,5,accent);}
if(sp.base==='Fiend'){poly(p,[[22,13],[18,1],[28,10]],accent);poly(p,[[37,9],[46,1],[43,17]],accent);poly(p,[[46,43],[57,44],[58,31],[62,35],[60,48],[46,48]],main);}
if(sp.base==='Giant'){rect(22,7,20,6,'#d6d2b3');rect(26,23,12,7,'#d6d2b3');rect(25,26,14,1,dark);}
}else if(sp.base==='Plant'){
poly(p,[[26,53],[23,40],[14,35],[12,29],[21,33],[28,40],[29,25],[36,24],[35,42],[46,33],[52,32],[49,40],[35,48],[37,56]],dark);
poly(p,[[15,48],[4,37],[17,35],[27,46]],accent);poly(p,[[38,47],[49,32],[61,34],[49,49]],main);body(32,23,17+growth,16+growth);ellipse(p,32,22,13+growth,9,dark);ellipse(p,32,22,10+growth,6,'#432e3f');for(let i=0;i<5;i++)poly(p,[[22+i*5,15],[24+i*5,21],[26+i*5,15]],'#e8dcb6');ellipse(p,24,13,4,3,light);eye(23,28);eye(37,28);rect(26,52,13,4,dark);
}else if(sp.base==='Ooze'){
body(32,44,23+growth,12+growth);body(30,32,17+growth,15);body(33,21,11,10);ellipse(p,23,28,6,7,light);eye(25,33);eye(38,34);rect(30,42,7,2,dark);ellipse(p,45,46,4,3,accent);ellipse(p,17,46,3,2,accent);
}else if(sp.base==='Aberration'){
for(let i=0;i<6;i++){const x=11+i*8;poly(p,[[x,35],[x-3,49],[x+1,55],[x+6,50],[x+4,46],[x+1,49],[x+2,35]],i%2?accent:dark);}
body(32,28,21+growth,17+growth);eye(19,23);eye(31,19);eye(42,28);eye(28,33);ellipse(p,39,16,4,3,accent);
}else if(sp.base==='Elemental'){
for(let i=0;i<5;i++){const x=14+i*8;poly(p,[[x-5,44],[x-1,18-Math.floor(r()*12)],[x+4,29],[x+8,7+i*2],[x+11,43]],i%2?accent:main);}
body(32,40,18+growth,12);ellipse(p,31,37,11,10,light);eye(23,34);eye(36,34);poly(p,[[26,51],[33,58],[40,50]],accent);
}else{
const isUndead=sp.base==='Undead';const wing=sp.base==='Celestial'?'#e6d8a0':accent;
for(const side of[-1,1]){poly(p,[[32+side*5,25],[32+side*24,10],[32+side*27,25],[32+side*12,39]],shade(wing,-30));poly(p,[[32+side*7,27],[32+side*23,17],[32+side*21,29],[32+side*10,36]],wing);}
body(32,36,12+growth,15+growth);body(32,21,11,10);eye(25,20);eye(35,20);if(isUndead){rect(27,27,10,4,dark);for(let i=0;i<3;i++)rect(28+i*3,27,1,4,light);poly(p,[[21,42],[16,55],[28,51],[32,58],[38,51],[48,54],[43,42]],main);}else{rect(27,48,4,7,dark);rect(35,48,4,7,dark);}if(sp.base==='Celestial'){ellipse(p,32,6,12+growth,3,accent);ellipse(p,32,6,9+growth,1,'#19372f');}
}
if(sp.alter==='Plant'){for(const[x,y]of[[19,20],[39,32],[45,42]]){poly(p,[[x,y],[x-7,y-7],[x+3,y-6],[x+5,y+2]],'#5e9b68');rect(x-2,y-5,2,4,'#a8cc80');}}
if(sp.alter==='Construct'){rect(18,33,10,5,accent);rect(37,42,7,7,accent);rect(19,34,2,2,'#d3e0cf');}
if(sp.alter==='Celestial'){ellipse(p,32,5,12,2,accent);}
if(sp.alter==='Fiend'||sp.alter==='Monstrosity'){poly(p,[[18,19],[15,6],[24,17]],accent);poly(p,[[39,16],[46,4],[44,23]],accent);}
if(sp.alter==='Undead'){rect(25,40,14,2,'#ddd9bc');rect(29,37,2,9,'#ddd9bc');}
if(sp.alter==='Fey'){poly(p,[[41,34],[55,18],[58,31],[45,42]],accent);rect(53,14,2,2,'#f9e3a3');}
if(sp.alter==='Elemental'){for(let i=0;i<5;i++){const x=13+Math.floor(r()*40),y=8+Math.floor(r()*36);rect(x,y,2,3,accent);}}
if(sp.alter==='Aberration'){eye(40,38);poly(p,[[45,42],[58,44],[60,52],[55,54],[54,50],[57,48],[45,47]],accent);}
if(sp.alter==='Ooze'){rect(18,44,3,9,accent);rect(42,42,4,10,accent);}
if(sp.alter==='Beast'){poly(p,[[14,21],[14,12],[20,19]],accent);}
if(sp.alter==='Humanoid'){rect(13,34,4,9,accent);rect(11,40,8,3,accent);}
if(sp.alter==='Giant'){rect(36,45,9,7,accent);}
if(form>0){rect(30,32,5,5,'#e6d492');rect(31,33,3,3,'#fff0b9');}
if(form===2){for(const[x,y]of[[8,20],[51,8],[54,43],[10,46]]){rect(x,y-2,1,5,accent);rect(x-2,y,5,1,accent);}}
if(sp.domains.length){ellipse(p,51,13,5,5,'#d7bb75');rect(50,9,2,8,'#fff1c0');rect(47,12,8,2,'#fff1c0');}
cache.set(key,c);return c;}
function readyImage(url){if(!url)return null;if(!images.has(url)){const img=new Image();img.onload=()=>globalThis.spirimonArtLoaded?.();img.src=url;images.set(url,img);}const image=images.get(url);return image.complete&&image.naturalWidth?image:null;}
export function drawSpirit(ctx,sp,form,x,y,size=96,flip=false){if(!sp)return;const image=readyImage(sp.atlas||sp.sprites?.[form]);if(!image){ctx.save();ctx.translate(x,y);ctx.fillStyle='#294b46';ctx.beginPath();ctx.ellipse(size*.5,size*.86,size*.32,size*.1,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=({Beast:'#9eaa64',Elemental:'#78b8cf',Fey:'#c2a1da',Plant:'#70ad79',Undead:'#b4b4cb',Construct:'#c2a77d'})[sp.base]||'#b99cba';ctx.beginPath();ctx.ellipse(size*.5,size*.47,size*.33,size*.36,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#f9f1d4';ctx.beginPath();ctx.arc(size*.4,size*.41,size*.055,0,Math.PI*2);ctx.arc(size*.6,size*.41,size*.055,0,Math.PI*2);ctx.fill();ctx.fillStyle='#24332f';ctx.beginPath();ctx.arc(size*.4,size*.41,size*.024,0,Math.PI*2);ctx.arc(size*.6,size*.41,size*.024,0,Math.PI*2);ctx.fill();ctx.restore();return;}ctx.save();ctx.imageSmoothingEnabled=false;if(flip){ctx.translate(x+size,y);ctx.scale(-1,1);}else ctx.translate(x,y);if(sp.atlas)ctx.drawImage(image,form*256,0,256,256,0,0,size,size);if(sp.id==='lacquertor'&&form>0){/* Replace the stone castle silhouette on the rear shoulder with irregular boulders. Draw in native 256px atlas coordinates. */ctx.save();ctx.scale(size/256,size/256);const ox=form===1?165:166,oy=form===1?79:64;ctx.translate(ox,oy);const rock=(pts,color)=>{ctx.fillStyle=color;ctx.beginPath();pts.forEach(([a,b],i)=>i?ctx.lineTo(a,b):ctx.moveTo(a,b));ctx.closePath();ctx.fill();};rock([[-36,17],[-37,-18],[-24,-39],[-4,-48],[21,-40],[36,-16],[34,21],[20,39],[-12,38]],'#302e2a');rock([[-33,12],[-32,-18],[-22,-35],[-3,-44],[19,-37],[32,-15],[29,18],[16,34],[-12,34]],'#777064');rock([[-29,-16],[-20,-33],[-3,-41],[10,-30],[-1,-12],[-19,-8]],'#aaa08a');rock([[10,-30],[23,-27],[30,-13],[27,12],[15,22],[2,12]],'#58544e');rock([[-26,14],[-14,3],[2,12],[15,26],[5,32],[-13,29]],'#696258');rock([[-13,-8],[-4,-18],[1,-9],[-5,5]],'#3e3b38');rock([[11,18],[18,9],[23,17],[17,26]],'#403c38');ctx.restore();}else{const h=size*image.height/image.width;ctx.drawImage(image,0,size-Math.min(size,h),size,Math.min(size,h));}ctx.restore();}
function prop(ctx,index,x,y,w,h){const image=readyImage(ART.world);if(!image)return;ctx.imageSmoothingEnabled=false;ctx.drawImage(image,(index%3)*256,Math.floor(index/3)*256,256,256,Math.round(x),Math.round(y),w,h);}
export function renderSpiritCanvases(root=document){root.querySelectorAll('canvas[data-species]').forEach(c=>{const sp=globalThis.spirimonSpecies?.[c.dataset.species];if(!sp)return;const ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);drawSpirit(ctx,sp,Number(c.dataset.form)||0,0,0,c.width);});}
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
export function drawPerson(ctx,x,y,role='player',tick=0,face='down',moving=false){const image=readyImage(ART.sealer);if(!image)return;const row={down:0,left:1,right:2,up:3}[face]??0;/* The sealer atlas is 192x320: THREE 64px columns, four 80px direction rows. */const frame=moving?[0,1,2,1][Math.floor(Math.max(0,tick)/55)%4]:1;ctx.save();ctx.imageSmoothingEnabled=false;if(role!=='player')ctx.filter='hue-rotate('+({keeper:130,merchant:45,rival:220,scholar:280,resident:80}[role]||90)+'deg)';if(face==='left'){/* Mirror the verified right-facing animation: the left atlas row is not a usable walk cycle. */ctx.translate(Math.round(x)+32,Math.round(y)-12);ctx.scale(-1,1);ctx.drawImage(image,frame*64,2*80,64,80,0,0,32,40);}else ctx.drawImage(image,frame*64,row*80,64,80,Math.round(x),Math.round(y)-12,32,40);ctx.restore();}
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
 if(type==='cliff'&&!(edges&1)){p.drawImage(image,0,0,64,12,0,0,32,6);p.fillStyle='#28342580';p.fillRect(0,6,32,2);}
 if(type==='grass'){const r=rng(seed);for(let n=0;n<12;n++){const xx=2+Math.floor(r()*28),yy=4+Math.floor(r()*26);p.fillStyle=biome==='ash'?'#5e6444':'#2e4932';p.fillRect(xx,yy,1,4);p.fillRect(xx-1,yy+1,3,1);p.fillStyle=biome==='ash'?'#ada371':'#a5af62';p.fillRect(xx,yy-1,1,3);}}
 if(type==='rock'){p.fillStyle='#15251e66';p.beginPath();p.ellipse(17,25,13,4,0,0,Math.PI*2);p.fill();p.save();p.beginPath();p.moveTo(4,24);p.lineTo(6,14);p.lineTo(13,8);p.lineTo(23,10);p.lineTo(29,19);p.lineTo(26,27);p.lineTo(10,28);p.closePath();p.clip();p.drawImage(image,6%4*64,Math.floor(6/4)*64,64,64,4,8,25,21);p.restore();p.fillStyle='#c4bd9866';p.fillRect(9,9,13,2);}
 cache.set(key,tile);
 }ctx.imageSmoothingEnabled=false;ctx.drawImage(tile,Math.round(x),Math.round(y));
}
export function drawWell(ctx,x,y){prop(ctx,7,x-16,y-32,64,64);}

function expandedProp(ctx,index,x,y,w,h){const image=readyImage(ART.towns);if(!image)return;ctx.imageSmoothingEnabled=false;ctx.drawImage(image,index%3*256,Math.floor(index/3)*256,256,256,Math.round(x),Math.round(y),w,h);}
export function drawTownBuilding(ctx,b,x,y){if(['hall','inn','home'].includes(b.kind))return drawBuilding(ctx,x,y,b.kind==='hall',b.kind);const index={forge:0,herbalist:1,archive:2}[b.kind];if(b.kind==='archive')expandedProp(ctx,index,x+24,y-40,176,168);else expandedProp(ctx,index,x+8,y-16,144,144);}
export function drawTownFeatures(ctx,cx,cy,px,py,only=null){for(const f of (only?[only]:TOWN_FEATURES)){const x=px(cx*48+f.x),y=py(cy*36+f.y);const width=f.cell===8?112:f.w===2?72:64,height=f.cell===8?104:f.cell===5?88:64;expandedProp(ctx,f.cell,x+(f.w*32-width)/2,y+f.h*32-height,width,height);}}
