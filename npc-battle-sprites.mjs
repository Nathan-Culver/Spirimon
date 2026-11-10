import {readyImage} from './asset-loader.mjs';

export const NPC_BATTLE_ASSETS={anatomy:'./assets/npc-battle/anatomy-ancient.webp',clothing:'./assets/npc-battle/clothing-ancient.webp',equipment:'./assets/npc-battle/equipment-ancient.webp'};
export const NPC_BATTLE_PARTS=['hat','head','shirt','gloves','item','pants','boots'];
export const NPC_OPTIONAL_PARTS=['hat','shirt','gloves','boots'];
export const NPC_ITEM_NAMES=['Staff','Katana','Book','Talisman','Lantern','Fan','Spear','Orb','Scroll','Wand','Dagger','Ritual brush'];
export const NPC_POSE_NAMES=['Watchful guard','Casting reach','Reading the signs','Staff bearer','High guard','Forward lunge','Kneeling ward','Raised invocation','Quick advance','Quiet resolve'];
const counts={hat:4,head:4,shirt:2,gloves:2,item:12,pants:2,boots:2};
function hash(value){let n=2166136261;for(const ch of String(value))n=Math.imul(n^ch.charCodeAt(0),16777619);n^=n>>>16;n=Math.imul(n,2246822507);return (n^(n>>>13))>>>0;}
function color(n){const h=(n%360)/60,s=.28+((n>>>12)%32)/100,l=.23+((n>>>20)%31)/100,c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs(h%2-1)),m=l-c/2,rgb=h<1?[c,x,0]:h<2?[x,c,0]:h<3?[0,c,x]:h<4?[0,x,c]:h<5?[x,0,c]:[c,0,x];return '#'+rgb.map(v=>Math.round((v+m)*255).toString(16).padStart(2,'0')).join('');}
export function npcBattleAppearance(seed,identity={}){
 const key=String(identity.id||identity.name||'opposing-sealer'),fixed=identity.battleAppearance||{},roll=part=>hash(seed+'|'+key+'|npc-v2|'+part);
 const gender=['male','female'].includes(fixed.gender)?fixed.gender:['male','female'].includes(identity.gender)?identity.gender:roll('gender')%2?'female':'male';
 const appearance={version:2,facing:'left',gender,pose:roll('pose')%10,colors:{}};
 if(Number.isInteger(fixed.pose)&&fixed.pose>=0&&fixed.pose<10)appearance.pose=fixed.pose;
 for(const part of NPC_BATTLE_PARTS){
  appearance[part]=roll(part)%counts[part];
  if(NPC_OPTIONAL_PARTS.includes(part)&&roll(part+'-absent')%100<({hat:30,shirt:12,gloves:40,boots:18}[part]))appearance[part]=-1;
  if(part==='item'&&roll('empty-hand')%12===0)appearance.item=-1;
  const v=fixed[part]??(part==='pants'?fixed.trousers:undefined);
  if(Number.isInteger(v)&&v>=((NPC_OPTIONAL_PARTS.includes(part)||part==='item')?-1:0)&&v<counts[part])appearance[part]=v;
  const selected=fixed.colors?.[part];appearance.colors[part]=typeof selected==='string'&&/^#[0-9a-f]{6}$/i.test(selected)?selected:color(roll(part+'-color'));
 }
 return appearance;
}
const rig=(shoulder,hip,nearElbow,nearHand,farElbow,farHand,nearKnee,nearAnkle,farKnee,farAnkle,itemAngle=0)=>({shoulder,hip,nearElbow,nearHand,farElbow,farHand,nearKnee,nearAnkle,farKnee,farAnkle,itemAngle});
const MALE_RIGS=[
 rig([132,109],[137,181],[94,147],[78,189],[174,145],[184,184],[115,234],[97,282],[158,232],[172,282],-8),
 rig([140,111],[145,183],[98,112],[57,95],[177,144],[162,179],[116,230],[99,282],[171,230],[185,282],-28),
 rig([135,110],[139,183],[99,150],[110,135],[171,148],[137,134],[122,232],[112,282],[157,234],[169,282],-12),
 rig([142,108],[146,180],[102,143],[72,135],[178,144],[184,187],[126,231],[114,282],[160,231],[179,282],0),
 rig([145,115],[150,187],[104,151],[80,121],[179,147],[117,126],[117,235],[96,282],[174,231],[195,282],-35),
 rig([146,128],[160,198],[106,145],[62,165],[183,157],[195,190],[105,235],[64,282],[185,230],[215,279],-55),
 rig([143,153],[154,222],[108,187],[83,172],[181,186],[182,218],[104,257],[65,282],[193,276],[165,289],-10),
 rig([135,116],[140,188],[93,81],[86,41],[172,151],[182,190],[121,238],[105,284],[162,238],[179,284],-12),
 rig([139,113],[155,183],[101,136],[78,168],[174,143],[187,106],[106,222],[100,282],[193,229],[216,269],-35),
 rig([136,111],[141,183],[104,147],[104,188],[172,149],[153,189],[127,234],[116,283],[155,234],[168,283],8)
];
// Separate female rigs adjust balance, elbows, hands and stance, not just scale.
const FEMALE_RIGS=MALE_RIGS.map((r,n)=>({...r,shoulder:[r.shoulder[0]-2,r.shoulder[1]+3],hip:[r.hip[0]+2,r.hip[1]],nearElbow:[r.nearElbow[0]+(n%2?-3:4),r.nearElbow[1]+2],nearHand:[r.nearHand[0]+(n%2?-4:3),r.nearHand[1]-3],farElbow:[r.farElbow[0]-4,r.farElbow[1]+3],farHand:[r.farHand[0]-5,r.farHand[1]+2],nearKnee:[r.nearKnee[0]+4,r.nearKnee[1]],nearAnkle:[r.nearAnkle[0]+5,r.nearAnkle[1]],farKnee:[r.farKnee[0]-3,r.farKnee[1]+2],farAnkle:[r.farAnkle[0]-4,r.farAnkle[1]]}));
export const NPC_BATTLE_POSES=['male','female'].flatMap(gender=>(gender==='male'?MALE_RIGS:FEMALE_RIGS).map((joints,index)=>({id:gender+'-'+(index+1),gender,index,name:NPC_POSE_NAMES[index],...joints})));
export function npcBattlePose(appearance){return NPC_BATTLE_POSES[(appearance.gender==='female'?10:0)+(Number.isInteger(appearance.pose)&&appearance.pose>=0&&appearance.pose<10?appearance.pose:0)];}
export function npcBattleLayers(appearance){return ['pants','boots','shirt','head','hat','item','gloves'].filter(part=>appearance[part]!==-1).map(part=>({part,variant:appearance[part],color:appearance.colors?.[part]}));}

const rawParts=new WeakMap(),imageKeys=new WeakMap(),tintedParts=new Map(),composites=new Map();let nextImageKey=0;
const canvasOf=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
function cachePut(cache,key,value,max){cache.set(key,value);while(cache.size>max)cache.delete(cache.keys().next().value);return value;}
function partImage(image,index,tint,mode='all',half=null){
 let map=rawParts.get(image);if(!map){map=new Map();rawParts.set(image,map);}const partKey=index+'|'+half;let part=map.get(partKey);
 if(!part){
  const side=image.width/4,sh=image.height/4,scan=canvasOf(Math.ceil(side),Math.ceil(sh)),c=scan.getContext('2d');c.drawImage(image,index%4*side,Math.floor(index/4)*sh,side,sh,0,0,scan.width,scan.height);
  const pixels=c.getImageData(0,0,scan.width,scan.height);let left=scan.width,top=scan.height,right=0,bottom=0;
  for(let y=0;y<scan.height;y++)for(let x=0;x<scan.width;x++){const p=(y*scan.width+x)*4;if(pixels.data[p+3]<64){pixels.data[p+3]=0;continue;}left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
  c.putImageData(pixels,0,0);if(left>right)return null;
  let w=right-left+1;const h=bottom-top+1;if(half!==null){const split=Math.floor(w/2);if(half)left+=split;w=half?w-split:split;}const scale=Math.min(1,160/Math.max(w,h));part=canvasOf(Math.ceil(w*scale),Math.ceil(h*scale));part.getContext('2d').drawImage(scan,left,top,w,h,0,0,part.width,part.height);map.set(partKey,part);
 }
 if(!tint)return part;
 if(!imageKeys.has(image))imageKeys.set(image,++nextImageKey);const key=imageKeys.get(image)+'|'+index+'|'+tint+'|'+mode+'|'+half;
 if(tintedParts.has(key))return tintedParts.get(key);
 const out=canvasOf(part.width,part.height),c=out.getContext('2d');c.drawImage(part,0,0);const pixels=c.getImageData(0,0,out.width,out.height),rgb=[1,3,5].map(n=>parseInt(tint.slice(n,n+2),16));
 for(let n=0;n<pixels.data.length;n+=4){if(!pixels.data[n+3])continue;const l=.2126*pixels.data[n]+.7152*pixels.data[n+1]+.0722*pixels.data[n+2];if(l<42)continue;if(mode==='accent'){const rr=pixels.data[n],gg=pixels.data[n+1],bb=pixels.data[n+2],chroma=Math.max(rr,gg,bb)-Math.min(rr,gg,bb);if(!(gg>rr*1.1&&bb>rr*1.1||chroma<20&&l>60&&l<175))continue;}for(let k=0;k<3;k++)pixels.data[n+k]=Math.min(255,Math.round(rgb[k]*(l/155)+(l>200?(l-200)*.65:0)));}
 c.putImageData(pixels,0,0);return cachePut(tintedParts,key,out,96);
}
const PROPS=[{height:181,grip:[.5,.73]},{height:132,grip:[.5,.82]},{height:56,grip:[.5,.7]},{height:64,grip:[.5,.12]},{height:78,grip:[.5,.08]},{height:67,grip:[.5,.86]},{height:191,grip:[.5,.68]},{height:57,grip:[.5,.88]},{height:61,grip:[.5,.65]},{height:95,grip:[.5,.78]},{height:82,grip:[.5,.8]},{height:92,grip:[.5,.8]}];
export function drawNPCBattleSprite(ctx,images,appearance,{x=0,y=0,width=320,height=400}={}){
 const key=JSON.stringify(appearance);let sprite=composites.get(key);
 if(!sprite){
  const stage=canvasOf(512,640),c=stage.getContext('2d'),r=npcBattlePose(appearance),female=appearance.gender==='female',colors=appearance.colors||{};c.imageSmoothingEnabled=false;c.translate(120,150);
  const asset=(sheet,index,tint,mode,half)=>partImage(images[sheet],index,tint,mode,half),draw=(sheet,index,tint,x,y,w,h,half=null)=>{const p=asset(sheet,index,tint,'all',half);if(p)c.drawImage(p,x,y,w,h);};
  const bone=(sheet,index,tint,a,b,w,half=null)=>{const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy);c.save();c.translate(...a);c.rotate(Math.atan2(dy,dx)-Math.PI/2);draw(sheet,index,tint,-w/2,-4,w,length+8,half);c.restore();};
  const shoulders={near:[r.shoulder[0]-22,r.shoulder[1]+9],far:[r.shoulder[0]+20,r.shoulder[1]+8]},hips={near:[r.hip[0]-13,r.hip[1]],far:[r.hip[0]+13,r.hip[1]]};
  const hand=(point,fore)=>{c.save();c.translate(...point);c.rotate(Math.atan2(point[1]-fore[1],point[0]-fore[0])-Math.PI/2);draw('anatomy',14,null,-9,-3,18,24);if(appearance.gloves>=0)draw('clothing',6+appearance.gloves,colors.gloves,-11,-6,22,29);c.restore();};
  const arm=(side)=>{const elbow=r[side+'Elbow'],wrist=r[side+'Hand'];bone('anatomy',12,null,shoulders[side],elbow,female?16:19);bone('anatomy',13,null,elbow,wrist,female?13:16);if(appearance.shirt>=0){const end=appearance.shirt===0?shoulders[side].map((v,n)=>v+(elbow[n]-v)*.55):elbow;bone('clothing',appearance.shirt===0?4:5,colors.shirt,shoulders[side],end,female?21:24);if(appearance.shirt===1)bone('clothing',14,colors.shirt,elbow,wrist,female?17:20);}};
  const leg=side=>{const knee=r[side+'Knee'],ankle=r[side+'Ankle'];bone('clothing',8+appearance.pants,colors.pants,hips[side],knee,appearance.pants===0?(female?34:38):(female?29:32),side==='near'?0:1);bone('clothing',10+appearance.pants,colors.pants,knee,ankle,female?23:26,side==='near'?0:1);if(appearance.boots<0)draw('anatomy',11,null,ankle[0]-21,ankle[1]-4,32,19);else draw('clothing',12+appearance.boots,colors.boots,ankle[0]-23,ankle[1]-28,38,48);};
  arm('far');hand(r.farHand,r.farElbow);leg('far');leg('near');draw('anatomy',10,colors.pants,r.hip[0]-29,r.hip[1]-9,58,31);
  bone('anatomy',female?9:8,null,r.shoulder,r.hip,female?52:61);
  if(appearance.shirt>=0)bone('clothing',(female?2:0)+appearance.shirt,colors.shirt,r.shoulder,[r.hip[0],r.hip[1]+10],female?60:68);
  draw('clothing',15,colors.pants,r.hip[0]-32,r.hip[1]-6,64,27);
  const headX=r.shoulder[0]-37,headY=r.shoulder[1]-53;
  const hat=()=>{const type=appearance.hat,hood=type===3,w=type===0?90:type===1?73:76,h=type===0?56:type===1?47:hood?75:64;draw('equipment',type,colors.hat,headX-(w-65)/2,headY-(hood?5:type===1?6:type===2?8:13),w,h);};
  if(appearance.hat>=0)hat();
  draw('anatomy',(female?4:0)+appearance.head,null,headX,headY,65,62);
  // Layer the crown over hair while keeping eyes and face in front of hoods.
  if(appearance.hat>=0){c.save();c.beginPath();c.rect(headX-30,headY-50,130,67);c.clip();hat();c.restore();}
  arm('near');
  if(appearance.item>=0){const prop=asset('equipment',4+appearance.item,colors.item,'accent'),spec=PROPS[appearance.item],h=spec.height,w=h*prop.width/prop.height;c.save();c.translate(r.nearHand[0],r.nearHand[1]+10);c.rotate(r.itemAngle*Math.PI/180);c.drawImage(prop,-w*spec.grip[0],-h*spec.grip[1],w,h);c.restore();}
  hand(r.nearHand,r.nearElbow);
  // Fit the whole equipped silhouette; raised staffs and wide blades never crop.
  c.setTransform(1,0,0,1,0,0);const data=c.getImageData(0,0,stage.width,stage.height).data;let l=512,t=640,rr=0,bb=0;
  for(let yy=0;yy<640;yy++)for(let xx=0;xx<512;xx++)if(data[(yy*512+xx)*4+3]>32){l=Math.min(l,xx);t=Math.min(t,yy);rr=Math.max(rr,xx);bb=Math.max(bb,yy);}
  const sw=rr-l+5,sh=bb-t+5,scale=Math.min(1,320/sw,400/sh),baked=canvasOf(Math.ceil(sw*scale),Math.ceil(sh*scale)),b=baked.getContext('2d');b.imageSmoothingEnabled=false;b.drawImage(stage,Math.max(0,l-2),Math.max(0,t-2),sw,sh,0,0,baked.width,baked.height);sprite={canvas:baked,frame:[0,0,baked.width,baked.height]};cachePut(composites,key,sprite,32);
 }
 const [sx,sy,sw,sh]=sprite.frame,scale=Math.min((width-8)/sw,(height-8)/sh),dw=sw*scale,dh=sh*scale;
 ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(sprite.canvas,sx,sy,sw,sh,x+(width-dw)/2,y+height-dh-4,dw,dh);ctx.restore();
}
export function renderNPCBattleSprites(root=document){
 const canvases=root.querySelectorAll('canvas[data-npc-battle]');if(!canvases.length)return;
 const images=Object.fromEntries(Object.entries(NPC_BATTLE_ASSETS).map(([key,path])=>[key,readyImage(path)]));if(Object.values(images).some(image=>!image))return;
 for(const canvas of canvases){let a;try{a=JSON.parse(canvas.dataset.npcBattle);}catch{continue;}if(a.version!==2)continue;const c=canvas.getContext('2d');c.clearRect(0,0,canvas.width,canvas.height);drawNPCBattleSprite(c,images,a,{width:canvas.width,height:canvas.height});canvas.dataset.npcReady='true';}
}
function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
export function npcBattleSpriteHTML(seed,identity={},escape=escapeHTML){const a=npcBattleAppearance(seed,identity),name=identity.name||'Opposing Sealer';return '<div class="npc-battle-portrait"><canvas width="320" height="400" data-npc-battle="'+escape(JSON.stringify(a))+'" role="img" aria-label="'+escape(name+' · '+a.gender+' pose '+(a.pose+1)+' · facing left')+'"></canvas></div>';}
export const NPC_REVIEW_IDENTITIES=['male','female'].flatMap(gender=>NPC_POSE_NAMES.flatMap((name,pose)=>[0,1].map(variant=>({id:'npc-v2-review-'+gender+'-'+pose+'-'+variant,name:(gender==='male'?'M':'F')+String(pose+1).padStart(2,'0')+' · '+(variant?'B':'A'),battleAppearance:{gender,pose,head:(pose+variant)%4,hat:variant&&pose%2?-1:(pose+variant)%4,shirt:variant&&pose%5===0?-1:(pose+variant)%2,gloves:variant&&pose%3===0?-1:(pose+variant)%2,boots:variant&&pose%4===0?-1:(pose+variant)%2,item:(pose+variant*5)%12}}))));
