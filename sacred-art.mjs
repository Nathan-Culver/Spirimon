import {readyImage} from './asset-loader.mjs';

export const SACRED_ASSETS=['./assets/shrine-atlas.png','./assets/cave-entrance-atlas.png'];

// Equal atlas cells preserve transparent margins and the painted ground baseline.
// Both props are anchored to the existing interaction tile, whose center is x+16.
function drawCell(c,image,index,columns,rows,x,y,width,height){
 const column=index%columns,row=Math.floor(index/columns);
 const sx=Math.round(column*image.naturalWidth/columns),sy=Math.round(row*image.naturalHeight/rows);
 const right=Math.round((column+1)*image.naturalWidth/columns),bottom=Math.round((row+1)*image.naturalHeight/rows);
 c.save();c.imageSmoothingEnabled=false;
 c.drawImage(image,sx,sy,right-sx,bottom-sy,Math.round(x+16-width/2),Math.round(y+32-height),width,height);
 c.restore();
}

export function drawShrineArtwork(c,x,y,kind=0,used=false){
 const image=readyImage(SACRED_ASSETS[0]);if(!image)return false;
 drawCell(c,image,((kind%8)+8)%8,4,2,x,y,112,128);
 // A small spent-communion seal leaves the authored material colors intact.
 if(used){c.save();c.fillStyle='#9daab5';c.fillRect(Math.round(x+12),Math.round(y+24),8,2);c.restore();}
 return true;
}

export function caveArtworkKind(biome){return biome==='ash'?1:biome==='fen'?2:biome==='highland'?3:0;}

export function drawCaveEntrance(c,x,y,biome){
 const image=readyImage(SACRED_ASSETS[1]);if(!image)return false;
 drawCell(c,image,caveArtworkKind(biome),2,2,x,y,144,132);
 return true;
}
