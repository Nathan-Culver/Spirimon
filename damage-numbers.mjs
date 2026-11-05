export const DAMAGE_NUMBER_MS=2600;
export function damageNumberFrame(number,now,width,height){
 const age=now-number.at;if(age<0||age>=DAMAGE_NUMBER_MS)return null;
 const t=age/DAMAGE_NUMBER_MS,scale=1-.65*t,size=Math.max(18,number.headSize)*scale*width/number.width;
 const fade=Math.max(0,(t-.65)/.35);
 return {size,x:number.x*width/number.width+Math.sin(age/520)*number.headSize*.16*width/number.width,
  y:number.y*height/number.height-number.headSize*(.25+1.15*t)*height/number.height,
  alpha:1-fade,dissolve:fade};
}
export function drawDamageNumbers(c,numbers,now,width,height){
 for(const number of numbers||[]){
  const f=damageNumberFrame(number,now,width,height);if(!f)continue;
  c.save();c.font='900 '+f.size+'px sans-serif';c.textAlign='center';c.textBaseline='bottom';c.lineJoin='round';
  const text=String(number.amount),w=c.measureText(text).width,pad=Math.max(3,f.size*.09);
  const x=Math.max(w/2+pad,Math.min(width-w/2-pad,f.x)),y=Math.max(f.size+pad,f.y);
  // Stable, disappearing text fragments produce a dissolve without a new canvas per hit.
  c.globalAlpha=f.alpha;c.lineWidth=pad;c.strokeStyle='#000';c.fillStyle='#ff3030';
  if(!f.dissolve){c.strokeText(text,x,y);c.fillText(text,x,y);}
  else{
   const cell=Math.max(3,f.size/7),left=x-w/2-pad,top=y-f.size-pad;
   c.beginPath();for(let row=0;row<9;row++)for(let col=0;col<Math.ceil((w+pad*2)/cell);col++){
    const noise=(Math.imul(Math.imul(row+1,73856093)^Math.imul(col+1,19349663),2654435761)>>>0)/4294967296;
    if(noise>=f.dissolve)c.rect(left+col*cell,top+row*cell,cell,cell);
   }
   c.clip();c.strokeText(text,x,y);c.fillText(text,x,y);
  }
  c.restore();
 }
}
