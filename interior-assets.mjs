// Independent, reusable interior sprites. SVGs retain crisp edges at any display scale.
const names=['door','bookshelf','desk','chair','rug','stairs','candle','plant','scroll','orb','bed','forge','window','banner'];
const images=new Map();
for(const name of names){const img=new Image();img.src='./assets/interiors/'+name+'.svg';images.set(name,img);}
export function drawInteriorAsset(ctx,name,x,y,size=32){
 const img=images.get(name);
 if(!img||!img.complete||!img.naturalWidth)return false;
 ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(img,Math.round(x),Math.round(y),size,size);ctx.restore();return true;
}
export const INTERIOR_ASSET_NAMES=Object.freeze(names);
