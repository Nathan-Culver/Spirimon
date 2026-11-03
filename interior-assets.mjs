import {readyImage} from './asset-loader.mjs';
import {roomTile,roomFurnishings} from './world.mjs';
export const INTERIOR_ATLAS='./assets/interior-furnishings-v1.webp';
export const TOWN_ATLAS='./assets/settlement-props-v1.webp';
export const MATERIAL_ATLAS='./assets/interior-materials-v1.webp';
export const INTERIOR_ASSET_NAMES=Object.freeze(['bookshelf','counter','tea-table','bed','chair','altar','forge','anvil','apothecary','writing-desk','crates','plant','window','lantern','vase','hearth']);
export const MATERIAL_NAMES=Object.freeze(['cedar','walnut','travertine','slate','tatami','jade','burgundy','indigo','plaster','brick','paneling','relief','cobble','sandstone','mosaic','terracotta']);
const aliases={desk:'writing-desk',orb:'altar',candle:'lantern',scroll:'writing-desk'};
export function drawAtlasAsset(ctx,source,index,x,y,w,h=w){const img=readyImage(source);if(!img||!img.complete||!img.naturalWidth)return false;ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(img,(index%4)*256,Math.floor(index/4)*256,256,256,Math.round(x),Math.round(y),Math.round(w),Math.round(h));ctx.restore();return true;}
export function drawInteriorAsset(ctx,name,x,y,size=32,height=size){const index=INTERIOR_ASSET_NAMES.indexOf(aliases[name]||name);if(index<0)return false;return drawAtlasAsset(ctx,INTERIOR_ATLAS,index,x,y,size,height);}
// Four-by-four material phases form a larger continuous texture, avoiding a repeated tile outline.
export function drawMaterial(ctx,index,x,y,size=32,phaseX=0,phaseY=0){const img=readyImage(MATERIAL_ATLAS);if(!img)return false;const phase=n=>((n%4)+4)%4;ctx.drawImage(img,index%4*256+phase(phaseX)*64,Math.floor(index/4)*256+phase(phaseY)*64,64,64,Math.round(x),Math.round(y),size,size);return true;}
function identity(room){let h=0;for(const c of room.id||room.kind)h=(Math.imul(h,31)+c.charCodeAt(0))>>>0;return h%3;}
export function roomPalette(room){const v=identity(room),kind=room.kind;return {floor:kind==='forge'?3:kind==='hall'?2:kind==='archive'?1:kind==='herbalist'?5:v===1?0:1,wall:kind==='forge'?9:kind==='hall'?11:8,rug:kind==='archive'||v===2?7:6,trim:kind==='forge'?'#8c715c':'#b39663',accent:kind==='herbalist'?'#6f9060':kind==='archive'?'#738eac':'#976c56',variant:v};}
export function drawInteriorScene(c,room,ox,oy,time,actors=[]){const unit=32,p=roomPalette(room),fill=(color,x,y,w,h)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
 // Warm plaster / timber walls and continuous, textured flooring.
 for(let y=0;y<11;y++)for(let x=0;x<15;x++){const px=ox+x*unit,py=oy+y*unit,t=roomTile(room.kind,x,y),wall=t==='wall'||t==='wall-art';fill(wall?'#25201c':'#6e5f4c',px,py,32,32);drawMaterial(c,wall?p.wall:room.kind==='hall'&&x>=5&&x<=9&&y<=3?14:(room.kind==='home'||room.kind==='inn')&&x<=4&&y>=3&&y<=5?15:p.floor,px,py,32,x,y);
  if(wall){fill('#201a16cc',px,py+27,32,5);fill(p.trim,px,py+26,32,1);}else if(t==='rug'||t==='tatami'){
   drawMaterial(c,t==='rug'?p.rug:4,px,py,32,x,y);
   for(const [dx,dy]of [[-1,0],[1,0],[0,-1],[0,1]])if(roomTile(room.kind,x+dx,y+dy)!==t){if(dx)fill('#bd9a60',px+(dx<0?0:30),py,2,32);else fill('#bd9a60',px,py+(dy<0?0:30),32,2);}
  }
 }
 // Room-depth shadows, wood cornice, and structural supports.
 fill('#17161055',ox+32,oy+64,13*32,8);fill('#443326',ox+28,oy+25,14*32-24,6);fill(p.trim,ox+30,oy+29,14*32-28,2);
 for(const x of [1,13]){fill('#35271e',ox+x*32,oy+52,6,9*32-20);fill('#bd9465',ox+x*32+1,oy+52,2,9*32-20);}
 for(const x of [3,10])drawInteriorAsset(c,'window',ox+x*32,oy+8,64,56);
 for(const x of [1,12]){drawInteriorAsset(c,'lantern',ox+x*32,oy+22,38,48);const glow=c.createRadialGradient(ox+x*32+20,oy+70,5,ox+x*32+20,oy+90,85);glow.addColorStop(0,'rgba(255,192,105,.16)');glow.addColorStop(1,'rgba(255,192,105,0)');c.fillStyle=glow;c.fillRect(ox+x*32-65,oy+5,170,170);}
 // Worn door threshold reads as an opening, rather than a door lying on the floor.
 fill('#1b1614',ox+7*32-3,oy+10*32-3,38,35);drawMaterial(c,0,ox+7*32,oy+10*32,32,0,0);fill('#ceae75',ox+7*32-3,oy+10*32,3,32);fill('#ceae75',ox+8*32,oy+10*32,3,32);
 const queue=roomFurnishings(room.kind).map(f=>({z:f.y+f.h-.08,draw:()=>{const px=ox+f.x*32,py=oy+f.y*32;c.fillStyle='#17120f44';c.beginPath();c.ellipse(px+f.w*16,py+f.h*32-5,f.w*13,5,0,0,Math.PI*2);c.fill();
   // Preserve full-detail artwork; the caller waits for the atlas to load.
   drawInteriorAsset(c,f.asset,px,py,f.w*32,f.h*32);
  }}));
 // Draw every character at the same ground-depth boundary as the furniture.
 queue.push(...actors);queue.sort((a,b)=>a.z-b.z);for(const item of queue)item.draw();
}
