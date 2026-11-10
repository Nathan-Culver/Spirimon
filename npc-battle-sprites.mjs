import {readyImage} from './asset-loader.mjs';

export const NPC_BATTLE_ASSETS={maleBase:'./assets/npc-battle/male-natural-base.webp',maleDressed:'./assets/npc-battle/male-natural-dressed.webp',femaleBase:'./assets/npc-battle/female-natural-base.webp',femaleDressed:'./assets/npc-battle/female-natural-dressed.webp',equipment:'./assets/npc-battle/equipment-ancient.webp'};
export const NPC_BATTLE_PARTS=['hat','head','shirt','gloves','item','pants','boots'];
export const NPC_OPTIONAL_PARTS=['hat','shirt','gloves','boots'];
export const NPC_ITEM_NAMES=['Staff','Katana','Book','Talisman','Lantern','Fan','Spear','Orb','Scroll','Wand','Dagger','Ritual brush'];
export const NPC_POSE_NAMES=['Watchful guard','Casting reach','Reading the signs','Staff bearer','High guard','Low ward','Kneeling ward','Raised invocation','Traveling step','Quiet resolve'];
const counts={hat:4,head:4,shirt:2,gloves:2,item:12,pants:2,boots:2};
function hash(value){let n=2166136261;for(const ch of String(value))n=Math.imul(n^ch.charCodeAt(0),16777619);n^=n>>>16;n=Math.imul(n,2246822507);return (n^(n>>>13))>>>0;}
function toneColor(hue,s,l){const h=hue/60,c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs(h%2-1)),m=l-c/2,rgb=h<1?[c,x,0]:h<2?[x,c,0]:h<3?[0,c,x]:h<4?[0,x,c]:h<5?[x,0,c]:[c,0,x];return '#'+rgb.map(v=>Math.round((v+m)*255).toString(16).padStart(2,'0')).join('');}
export function npcBattleAppearance(seed,identity={}){
 const key=String(identity.id||identity.name||'opposing-sealer'),fixed=identity.battleAppearance||{},roll=part=>hash(seed+'|'+key+'|npc-v2|'+part);
 const gender=['male','female'].includes(fixed.gender)?fixed.gender:['male','female'].includes(identity.gender)?identity.gender:roll('gender')%2?'female':'male';
 const appearance={version:3,facing:'left',gender,pose:roll('pose')%10,colors:{}};
 if(Number.isInteger(fixed.pose)&&fixed.pose>=0&&fixed.pose<10)appearance.pose=fixed.pose;
 for(const part of NPC_BATTLE_PARTS){
  appearance[part]=roll(part)%counts[part];
  if(NPC_OPTIONAL_PARTS.includes(part)&&roll(part+'-absent')%100<({hat:30,shirt:12,gloves:40,boots:18}[part]))appearance[part]=-1;
  if(part==='item'&&roll('empty-hand')%12===0)appearance.item=-1;
  const v=fixed[part]??(part==='pants'?fixed.trousers:undefined);
  if(Number.isInteger(v)&&v>=((NPC_OPTIONAL_PARTS.includes(part)||part==='item')?-1:0)&&v<counts[part])appearance[part]=v;
  const selected=fixed.colors?.[part],hue=roll('wardrobe-hue')%360,offset=part==='pants'?170:part==='hat'?8:part==='gloves'?-12:part==='boots'?25:0,tone=(hue+offset+360)%360;appearance.colors[part]=typeof selected==='string'&&/^#[0-9a-f]{6}$/i.test(selected)?selected:toneColor(part==='boots'?24+roll('leather')%16:tone,part==='shirt'?.37:part==='item'?.35:part==='boots'?.24:.23,part==='shirt'?.35+(roll('shirt-light')%9)/100:part==='pants'?.25:part==='boots'?.28:part==='hat'?.30:.29);
 }
 if(!NPC_POSE_ITEMS[appearance.pose].includes(appearance.item))appearance.item=NPC_POSE_ITEMS[appearance.pose][0];
 return appearance;
}
// These anchors place accessories on complete painted figures. They never
// determine or transform a limb: every body is a single authored raster frame.
const anchors=(head,hand,other,waist,feet,grip='closed')=>({head,hand,other,waist,feet,grip});
const MALE_ANCHORS=[
 anchors([225,53],[158,228],[256,180],165,[[165,351],[274,359]]),
 anchors([243,77],[106,136],[305,185],185,[[130,352],[308,345]],'palm'),
 anchors([231,49],[125,127],[225,137],158,[[191,354],[268,354]],'palm'),
 anchors([234,48],[133,109],[293,174],181,[[125,352],[284,354]]),
 anchors([219,75],[231,199],[258,188],203,[[128,352],[333,350]]),
 anchors([225,91],[74,143],[246,168],219,[[110,370],[302,362]],'palm'),
 anchors([249,129],[112,215],[278,300],264,[[294,361]],'palm'),
 anchors([234,72],[106,51],[281,172],184,[[194,369],[270,369]],'palm'),
 anchors([216,54],[126,189],[301,206],175,[[150,370],[315,340]]),
 anchors([250,57],[207,117],[237,135],151,[[174,365],[282,365]],'folded')
];
const FEMALE_ANCHORS=[
 anchors([223,52],[156,231],[250,172],166,[[178,361],[271,365]]),
 anchors([245,61],[86,113],[275,184],176,[[128,362],[283,365]],'palm'),
 anchors([231,56],[118,116],[218,134],175,[[195,365],[270,363]],'palm'),
 anchors([226,48],[128,111],[292,235],180,[[163,366],[279,365]]),
 anchors([220,77],[200,214],[301,205],209,[[129,371],[309,371]]),
 anchors([213,83],[67,139],[254,160],223,[[103,371],[305,361]],'palm'),
 anchors([242,135],[108,201],[258,301],269,[[286,351]],'palm'),
 anchors([234,73],[103,38],[278,173],196,[[199,370],[269,370]],'palm'),
 anchors([219,54],[120,179],[303,204],180,[[145,370],[314,344]]),
 anchors([246,57],[206,127],[242,132],159,[[174,369],[283,370]],'folded')
];
export const NPC_POSE_ITEMS=[[0,10,4,6,-1],[7,3,5,-1],[2,8,7,-1],[0,6,4,-1],[1,9,10,-1],[3,7,-1],[4,11,2,8,-1],[7,5,3,-1],[6,4,0,-1],[-1]];
export const NPC_BATTLE_POSES=['male','female'].flatMap(gender=>(gender==='male'?MALE_ANCHORS:FEMALE_ANCHORS).map((anchor,index)=>({id:gender+'-'+(index+1),gender,index,name:NPC_POSE_NAMES[index],...anchor})));
// Accessory attachments placed directly on the authored figure drawings.
const PAINTED_ATTACHMENTS={"male-1":{"head":[223,58],"hand":[160,223]},"male-2":{"head":[225,79],"hand":[103,131]},"male-3":{"head":[201,55],"hand":[103,120]},"male-4":{"head":[191,52],"hand":[99,98]},"male-5":{"head":[164,78],"hand":[191,191]},"male-6":{"head":[221,92],"hand":[68,131]},"male-7":{"head":[220,104],"hand":[93,210]},"male-8":{"head":[211,39],"hand":[73,34]},"male-9":{"head":[171,35],"hand":[93,188]},"male-10":{"head":[189,31],"hand":[156,95]},"female-1":{"head":[207,58],"hand":[149,223]},"female-2":{"head":[212,70],"hand":[83,108]},"female-3":{"head":[197,59],"hand":[107,110]},"female-4":{"head":[172,46],"hand":[88,108]},"female-5":{"head":[181,86],"hand":[148,202]},"female-6":{"head":[209,92],"hand":[40,127]},"female-7":{"head":[199,118],"hand":[107,190]},"female-8":{"head":[195,47],"hand":[88,22]},"female-9":{"head":[176,42],"hand":[88,191]},"female-10":{"head":[168,50],"hand":[137,127]}};
for(const pose of NPC_BATTLE_POSES)Object.assign(pose,PAINTED_ATTACHMENTS[pose.id]);
export function npcBattlePose(a){return NPC_BATTLE_POSES[(a.gender==='female'?10:0)+(Number.isInteger(a.pose)&&a.pose>=0&&a.pose<10?a.pose:0)];}
export function npcPoseSourceRect(image,index){return [index%5*image.width/5,Math.floor(index/5)*image.height/2,image.width/5,image.height/2];}
export function npcBattleLayers(a){return ['pants','boots','shirt','head','hat','item','gloves'].filter(p=>a[p]!==-1).map(part=>({part,variant:a[part],color:a.colors?.[part]}));}
const canvasOf=(w=400,h=400)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
const frames=new WeakMap(),parts=new WeakMap(),composites=new Map();
function remember(map,key,value,max=24){map.set(key,value);while(map.size>max)map.delete(map.keys().next().value);return value;}
function rgbInfo(r,g,b){r/=255;g/=255;b/=255;const hi=Math.max(r,g,b),lo=Math.min(r,g,b),d=hi-lo;let h=!d?0:hi===r?((g-b)/d+6)%6:hi===g?(b-r)/d+2:(r-g)/d+4;return {h:h*60,s:hi?d/hi:0,v:hi,l:(hi+lo)/2};}
function near(point,x,y,rx=39,ry=43){return Math.abs(point[0]-x)<rx&&Math.abs(point[1]-y)<ry;}
export function npcMaterialLabels(pixels,width,height,pose,{dressed=true}={}){
 const labels=new Uint8Array(width*height),distance=new Uint8Array(width*height),queue=new Int32Array(width*height);let tail=0;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const n=y*width+x,p=n*4;if(pixels[p+3]<64)continue;const {h,s,v}=rgbInfo(pixels[p],pixels[p+1],pixels[p+2]);let label=0;
  if(s>.18&&h>202&&h<275&&y>pose.waist-12)label=2;
  if(dressed){
   if(s>.27&&(h<12||h>340)&&v>.13)label=1;
   if(s>.20&&h>66&&h<170&&(near(pose.hand,x,y,65,55)||near(pose.other,x,y,65,55))&&!(y<pose.head[1]+40&&Math.abs(x-pose.head[0])<65))label=3;
   if(s>.27&&h>29&&h<67&&y>(pose.index===6?330:296))label=4;
  }
  if(label){labels[n]=label;distance[n]=1;queue[tail++]=n;}
 }
 // Carry garment outlines, ivory collars and rope ties along with their cloth.
 // Exposed skin is a barrier, and expansion is bounded to avoid swallowing hair.
 for(let head=0;head<tail;head++){
  const n=queue[head];if(distance[n]>=11)continue;const x=n%width,y=Math.floor(n/width);
  for(const p of [x>0?n-1:-1,x+1<width?n+1:-1,y>0?n-width:-1,y+1<height?n+width:-1]){
   if(p<0||labels[p]||pixels[p*4+3]<64)continue;
   const xx=p%width,yy=Math.floor(p/width),{h,s,v}=rgbInfo(pixels[p*4],pixels[p*4+1],pixels[p*4+2]);
   if(yy<pose.head[1]+46&&Math.abs(xx-pose.head[0])<70)continue;
   if(s>.23&&h>=12&&h<55&&v>.28)continue;
   if(s>.25&&v>.24)continue;
   labels[p]=labels[n];distance[p]=distance[n]+1;queue[tail++]=p;
  }
 }
 return labels;
}
function rawFrame(image,index,pose,dressed){
 let map=frames.get(image);if(!map){map=new Map();frames.set(image,map);}if(map.has(index))return map.get(index);
 const canvas=canvasOf(),c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.drawImage(image,...npcPoseSourceRect(image,index),0,0,400,400);
 const data=c.getImageData(0,0,400,400);for(let n=3;n<data.data.length;n+=4)if(data.data[n]<64)data.data[n]=0;c.putImageData(data,0,0);
 const seen=new Uint8Array(160000),stack=[];for(let n=0;n<160000;n++){if(seen[n]||data.data[n*4+3]<64)continue;const component=[];stack.push(n);seen[n]=1;while(stack.length){const p=stack.pop();component.push(p);const x=p%400,y=Math.floor(p/400);for(const k of [x?p-1:-1,x<399?p+1:-1,y?p-400:-1,y<399?p+400:-1])if(k>=0&&!seen[k]&&data.data[k*4+3]>=64){seen[k]=1;stack.push(k);}}if(component.length<20)for(const p of component)data.data[p*4+3]=0;}c.putImageData(data,0,0);
 const frame={canvas,pixels:data.data,labels:npcMaterialLabels(data.data,400,400,pose,{dressed})};remember(map,index,frame,6);return frame;
}
function tintPixel(pixels,n,hex,{accent=false}={}){
 const r=pixels[n],g=pixels[n+1],b=pixels[n+2],l=.2126*r+.7152*g+.0722*b;if(l<40)return;
 if(accent&&!(g>r*1.08&&b>r*1.08||Math.max(r,g,b)-Math.min(r,g,b)<23&&l<180))return;
 const target=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)),max=Math.max(...target),scale=(.25+.75*Math.max(r,g,b)/205)*Math.min(1.2,180/Math.max(70,max));
 for(let k=0;k<3;k++)pixels[n+k]=Math.min(255,target[k]*scale+(l>210?(l-210)*.9:0));
}
function paintFrame(frame,a,{base=false}={}){
 const canvas=canvasOf(),c=canvas.getContext('2d'),data=c.createImageData(400,400);data.data.set(frame.pixels);const names={1:'shirt',2:'pants',3:'gloves',4:'boots'};
 for(let i=0;i<frame.labels.length;i++){
  const n=i*4,label=frame.labels[i],name=names[label];
  if(base){if(label===2&&a.colors?.pants)tintPixel(data.data,n,a.colors.pants);continue;}
  if(!name||label===2||a[name]<0){data.data[n+3]=0;continue;}
  // Keep ivory decoration and outlines; recolor the dyed material itself.
  const {s}=rgbInfo(data.data[n],data.data[n+1],data.data[n+2]);if(s>.2&&a.colors?.[name])tintPixel(data.data,n,a.colors[name]);
 }
 c.putImageData(data,0,0);return canvas;
}
function paintedBody(base,dressed,a,pose){
 const canvas=canvasOf(),c=canvas.getContext('2d'),data=c.createImageData(400,400),source=a.shirt>=0?dressed:base;data.data.set(source.pixels);
 const names={1:'shirt',2:'pants',3:'gloves',4:'boots'};
 for(let i=0;i<source.labels.length;i++){const name=names[source.labels[i]],n=i*4;if(!name||!a.colors?.[name])continue;const {s}=rgbInfo(data.data[n],data.data[n+1],data.data[n+2]);if(s>.2)tintPixel(data.data,n,a.colors[name]);}
 c.putImageData(data,0,0);
 if(a.shirt>=0){
  const under=paintFrame(base,a,{base:true}).getContext('2d').getImageData(0,0,400,400).data,mask=new Uint8Array(160000);
  for(let n=0;n<mask.length;n++)if(a.gloves<0&&dressed.labels[n]===3||a.boots<0&&dressed.labels[n]===4){const x=n%400,y=Math.floor(n/400);for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)if(x+dx>=0&&x+dx<400&&y+dy>=0&&y+dy<400)mask[n+dy*400+dx]=1;}
  for(let n=0;n<mask.length;n++)if(mask[n])data.data.set(under.subarray(n*4,n*4+4),n*4);c.putImageData(data,0,0);
 }else c.drawImage(paintFrame(dressed,{...a,shirt:-1}),0,0);
 return canvas;
}
function equipmentPart(image,index,hex,{accent=false}={}){
 let map=parts.get(image);if(!map){map=new Map();parts.set(image,map);}const key=index+'|'+hex+'|'+accent;if(map.has(key))return map.get(key);
 const size=image.width/4,c=canvasOf(Math.ceil(size),Math.ceil(image.height/4)),g=c.getContext('2d');g.drawImage(image,index%4*size,Math.floor(index/4)*image.height/4,size,image.height/4,0,0,c.width,c.height);
 const d=g.getImageData(0,0,c.width,c.height);let x1=c.width,y1=c.height,x2=0,y2=0;
 for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){const n=(y*c.width+x)*4;if(d.data[n+3]<64){d.data[n+3]=0;continue;}x1=Math.min(x1,x);x2=Math.max(x2,x);y1=Math.min(y1,y);y2=Math.max(y2,y);if(hex)tintPixel(d.data,n,hex,{accent});}
 g.putImageData(d,0,0);const out=canvasOf(x2-x1+1,y2-y1+1);out.getContext('2d').drawImage(c,x1,y1,out.width,out.height,0,0,out.width,out.height);return remember(map,key,out,24);
}
const ITEM_SPECS=[{h:350,grip:[.5,.65]},{h:146,grip:[.5,.83]},{h:65,grip:[.5,.96]},{h:70,grip:[.5,.1]},{h:91,grip:[.5,.08]},{h:81,grip:[.5,.86]},{h:360,grip:[.5,.67]},{h:63,grip:[.5,.96]},{h:72,grip:[.5,.75]},{h:96,grip:[.5,.8]},{h:82,grip:[.5,.8]},{h:109,grip:[.5,.8]}];
export function drawNPCBattleSprite(ctx,images,a,{x=0,y=0,width=320,height=400}={}){
 const key=JSON.stringify(a);let sprite=composites.get(key);
 if(!sprite){
  const pose=npcBattlePose(a),base=rawFrame(images[a.gender+'Base'],a.pose,pose,false),dressed=rawFrame(images[a.gender+'Dressed'],a.pose,pose,true),stage=canvasOf(520,520),c=stage.getContext('2d'),colors=a.colors||{};c.translate(60,65);c.imageSmoothingEnabled=false;
  let hat;const [hx,hy]=pose.head;
  const drawHat=(front=false)=>{if(!hat)return;const w=a.hat===0?109:a.hat===1?90:97,h=w*hat.height/hat.width,f=[.72,.62,.50,.42][a.hat],top=hy-11-h*f;if(front)c.drawImage(hat,0,0,hat.width,hat.height*f,hx-w*.5,top,w,h*f);else c.drawImage(hat,hx-w*.5,top,w,h);};
  if(a.hat>=0){hat=equipmentPart(images.equipment,a.hat,colors.hat);drawHat();}
  const body=paintedBody(base,dressed,a,pose);c.drawImage(body,0,0);
  // Alter existing hair color without cutting or replacing the painted head.
  if(a.head>0){const hair=canvasOf(),g=hair.getContext('2d'),d=g.createImageData(400,400);d.data.set(base.pixels);const hairColors=['#292729','#614236','#363c59','#73645a'];
   for(let yy=0;yy<400;yy++)for(let xx=0;xx<400;xx++){const n=(yy*400+xx)*4,{h,s,v}=rgbInfo(d.data[n],d.data[n+1],d.data[n+2]);if(!(Math.abs(xx-hx)<68&&yy>hy-65&&yy<hy+32&&v>.1&&v<.35&&(s<.32||h>200)))d.data[n+3]=0;else tintPixel(d.data,n,hairColors[a.head]);}
   g.putImageData(d,0,0);c.drawImage(hair,0,0);
  }
  if(hat)drawHat(true);
  if(a.item>=0&&NPC_POSE_ITEMS[a.pose].includes(a.item)){
   const part=equipmentPart(images.equipment,4+a.item,colors.item,{accent:true}),spec=ITEM_SPECS[a.item],hand=pose.hand,h=spec.h,w=h*part.width/part.height*(a.item===0?.48:a.item===6?.8:1);let grip=[...spec.grip],angle=0;
   if(a.item===0||a.item===6){const bottom=pose.feet[0][1]+8;grip[1]=(pose.hand[1]-(bottom-h))/h;if(a.item===6)grip[0]=.25;if(a.item===0){grip[0]=.29;angle=-.20;}}
   if(a.item===1||a.item===10)angle=a.pose===4?-.65:-.1;
   if(a.item===11&&pose.grip==='palm')angle=-1.15;
   if(a.item===0){
    // A continuous shaft can be held at any height without moving the hand.
    const ground=pose.feet[0][1]+8,top=Math.min(pose.head[1]-62,hand[1]-90),scan=part.getContext('2d').getImageData(0,Math.floor(part.height*.82),part.width,1).data;let left=part.width,right=0;
    for(let x=0;x<part.width;x++)if(scan[x*4+3]>128){left=Math.min(left,x);right=Math.max(right,x);}
    c.drawImage(part,left,part.height*.65,Math.max(1,right-left+1),part.height*.30,hand[0]-4,top+25,8,ground-top-25);
    const headHeight=83,headWidth=headHeight*part.width/(part.height*.55);c.drawImage(part,0,0,part.width,part.height*.55,hand[0]-headWidth*.26,top-25,headWidth,headHeight);
   }else{c.save();c.translate(...hand);c.rotate(angle);c.drawImage(part,-w*grip[0],-h*grip[1],w,h);c.restore();}
   // Real painted fingers sit in front of the held object at the grip.
   const front=canvasOf(),g=front.getContext('2d');g.save();g.beginPath();g.ellipse(hand[0],hand[1],16,13,0,0,Math.PI*2);g.clip();g.drawImage(body,0,0);g.restore();c.drawImage(front,0,0);
  }
  c.setTransform(1,0,0,1,0,0);const d=c.getImageData(0,0,520,520).data;let l=520,t=520,r=0,b=0;for(let yy=0;yy<520;yy++)for(let xx=0;xx<520;xx++)if(d[(yy*520+xx)*4+3]>64){l=Math.min(l,xx);r=Math.max(r,xx);t=Math.min(t,yy);b=Math.max(b,yy);}
  const sw=r-l+5,sh=b-t+5,scale=Math.min(1,340/sw,430/sh),baked=canvasOf(Math.ceil(sw*scale),Math.ceil(sh*scale));baked.getContext('2d').drawImage(stage,l-2,t-2,sw,sh,0,0,baked.width,baked.height);sprite=remember(composites,key,baked,28);
 }
 const scale=Math.min((width-8)/sprite.width,(height-8)/sprite.height),w=sprite.width*scale,h=sprite.height*scale;ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(sprite,x+(width-w)/2,y+height-h-4,w,h);ctx.restore();
}
export function renderNPCBattleSprites(root=document){
 const entries=[];for(const canvas of root.querySelectorAll('canvas[data-npc-battle]')){try{const a=JSON.parse(canvas.dataset.npcBattle);if(a.version===3)entries.push({canvas,a});}catch{}}
 if(!entries.length)return;const keys=new Set(['equipment']);for(const {a} of entries){keys.add(a.gender+'Base');keys.add(a.gender+'Dressed');}
 const images=Object.fromEntries([...keys].map(key=>[key,readyImage(NPC_BATTLE_ASSETS[key])]));if(Object.values(images).some(i=>!i))return;
 for(const {canvas,a} of entries){const c=canvas.getContext('2d');c.clearRect(0,0,canvas.width,canvas.height);drawNPCBattleSprite(c,images,a,{width:canvas.width,height:canvas.height});canvas.dataset.npcReady='true';}
}

function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
export function npcBattleSpriteHTML(seed,identity={},escape=escapeHTML){const a=npcBattleAppearance(seed,identity),name=identity.name||'Opposing Sealer';return '<div class="npc-battle-portrait"><canvas width="320" height="400" data-npc-battle="'+escape(JSON.stringify(a))+'" role="img" aria-label="'+escape(name+' · '+a.gender+' pose '+(a.pose+1)+' · facing left')+'"></canvas></div>';}
const REVIEW_ITEMS=[[0,10],[7,3],[2,8],[0,6],[1,9],[3,7],[4,11],[7,5],[6,4],[-1,-1]];
export const NPC_REVIEW_IDENTITIES=['male','female'].flatMap(gender=>NPC_POSE_NAMES.flatMap((name,pose)=>[0,1].map(variant=>({id:'natural-review-'+gender+'-'+pose+'-'+variant,name:(gender==='male'?'M':'F')+String(pose+1).padStart(2,'0')+' · '+(variant?'B':'A'),battleAppearance:{gender,pose,head:variant,hat:variant&&pose%2?-1:(pose+variant)%4,shirt:variant&&pose%5===0?-1:(pose+variant)%2,gloves:variant&&pose%3===0?-1:(pose+variant)%2,boots:variant&&pose%4===0?-1:(pose+variant)%2,item:REVIEW_ITEMS[pose][variant]}}))));
