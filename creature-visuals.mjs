import {designHash,anatomyRecord,syncCapabilities} from './anatomy.mjs';
const palette={Aberration:[131,81,174],Beast:[170,119,67],Celestial:[231,195,98],Construct:[108,139,148],Elemental:[217,111,63],Fey:[169,126,194],Fiend:[158,61,69],Giant:[150,134,103],Monstrosity:[117,151,103],Ooze:[103,177,142],Plant:[82,154,87],Undead:[132,159,174]};
// The same declarative geometry is used for rendering and the offline anatomy record.
// This proves what our renderer drew; it is not a classifier for arbitrary images.
export function renderCreaturePixels(sp,form=0,size=128){
 const a=sp.design?.anatomy||sp.anatomy;if(!a)throw Error('A structured anatomy is required to render a creature.');
 const width=size,height=size,data=new Uint8ClampedArray(size*size*4),scale=size/96,seed=designHash(sp.id,sp.seed),traits=new Set(a.traits||[]);
 const main=palette[sp.base]||palette.Beast,accent=palette[sp.alter]||palette.Fey,outline=main.map(x=>Math.max(12,x-68));
 const shades=new Map();
 const pixel=(x,y,c)=>{x=Math.floor(x*scale);y=Math.floor(y*scale);const endX=Math.min(size,x+Math.ceil(scale)),endY=Math.min(size,y+Math.ceil(scale));for(let yy=Math.max(0,y);yy<endY;yy++)for(let xx=Math.max(0,x);xx<endX;xx++){const p=(yy*size+xx)*4;data[p]=c[0];data[p+1]=c[1];data[p+2]=c[2];data[p+3]=255;}};
 const ellipse=(cx,cy,rx,ry,c)=>{if(!shades.has(c))shades.set(c,[c.map(v=>Math.min(255,v+20)),c.map(v=>Math.max(0,v-24))]);const [bright,dark]=shades.get(c);for(let y=Math.floor(cy-ry);y<=cy+ry;y++)for(let x=Math.floor(cx-rx);x<=cx+rx;x++)if(((x-cx)/rx)**2+((y-cy)/ry)**2<=1){const n=(x-cx)/rx+(y-cy)/ry;pixel(x,y,c===outline?c:n<-.3?bright:n>.6?dark:c);}};
 const line=(x1,y1,x2,y2,r,c)=>{const n=Math.ceil(Math.hypot(x2-x1,y2-y1)*2);for(let i=0;i<=n;i++)ellipse(x1+(x2-x1)*i/n,y1+(y2-y1)*i/n,r,r,c);};
 const blob=(x,y,rx,ry,c=main)=>{ellipse(x,y,rx+1,ry+1,outline);ellipse(x,y,rx,ry,c);};
 const biped=a.bodyPlan==='biped',m=a.morphology||{},nonAnimal=['rooted','amorphous','radial','tentacled'].includes(a.bodyPlan),headX=biped?47:31,headY=biped?29:39-(m.neck||0),growth=1+form*.11,rx=(biped?13:a.bodyPlan==='serpentine'?15:22)*(m.bulk||1)*growth,ry=(biped?19:a.bodyPlan==='aquatic'?10:a.bodyPlan==='serpentine'?9:15)*growth;
 if(traits.has('wings'))for(const sign of [-1,1]){line(49,43,49+sign*(27+form*3),22,7,outline);line(49,43,49+sign*(27+form*3),22,5,accent);for(let n=0;n<4;n++)line(49+sign*(12+n*4),30-n*2,49+sign*(17+n*4),47-n,2,accent);}
 const legs=a.limbs?.legs||0;for(let n=0;n<legs;n++){const x=legs===2?40+n*15:30+n*(35/Math.max(1,legs-1)),bottom=Math.min(84,58+(m.legLength||18));line(x,58,x+(n%2?4:-3),bottom,3+form,outline);line(x,58,x+(n%2?4:-3),bottom-2,2+form,main);}
 if(m.tail||a.bodyPlan==='aquatic'){const endX=Math.min(86,67+(m.tail||12)*.6);line(65,55,endX,41,4,outline);line(65,55,endX,41,3,main);}
 if(a.bodyPlan==='serpentine'){for(let n=0;n<6;n++)blob(34+n*7,55+Math.sin(n)*9,7+form,6+form);blob(31,46,9+form,6+form);}
 else if(a.bodyPlan==='rooted'){
  for(let n=0;n<5;n++)line(48,60,24+n*12,78+(n%2)*4,2,accent);
  line(48,68,48,36,5,outline);line(48,68,48,36,3,main);
  for(let n=0;n<4;n++){line(48,55-n*5,24+n%2*43,43-n*4,3,main);blob(30+n*11,29+(n%2)*9,6+form,10+form,accent);blob(30+n*11,25+(n%2)*9,3+form,3,outline);}
 }else if(a.bodyPlan==='amorphous'){
  for(let n=0;n<5;n++)blob(30+n*8,66-Math.sin(n)*13,9+form,9+form);
  blob(49,51,19*growth,18*growth);blob(41,44,4,3,[206,226,211]);
 }else if(a.bodyPlan==='tentacled'||a.bodyPlan==='radial'){
  for(let n=0;n<6;n++){const angle=n*1.047+.3;line(48,52,48+Math.cos(angle)*30,53+Math.sin(angle)*28,3,outline);line(48,52,48+Math.cos(angle)*30,53+Math.sin(angle)*28,2,accent);}
  blob(48,49,16*growth,17*growth);
 }else{
  blob(50,52,rx,ry);if(m.neck){line(37,48,headX,headY,5,outline);line(37,48,headX,headY,4,main);}
  blob(headX,headY,9+form*2,9+form*2);if(m.snout)blob(headX-Math.min(10,m.snout),headY+3,Math.max(3,m.snout*.6),4,main);
  if(m.ears)for(const sign of [-1,1])line(headX+sign*6,headY-5,headX+sign*7,Math.max(8,headY-5-m.ears),2,main);
  if(m.trunk){line(headX-9,headY+5,headX-13,headY+18,3,main);line(headX-13,headY+18,headX-18,headY+20,2,main);}
  if(m.shell)blob(51,47,18*growth,14*growth,accent);
 }
 if((traits.has('tentacles')||traits.has('vines'))&&!nonAnimal)for(let n=0;n<3;n++)line(58,55,67+n*7,67-n*7,2,accent);
 if(biped)for(const sign of [-1,1]){line(48+sign*11,44,48+sign*24,61,4,outline);line(48+sign*11,44,48+sign*24,61,3,main);if(a.manipulators>=2){blob(48+sign*24,62,4,4,accent);for(let n=0;n<3;n++)line(48+sign*25,62+n,48+sign*(29+n%2),63+n,1,accent);}}
 if(traits.has('fins'))for(const sign of [-1,1])line(53,53,65,53+sign*18,3,accent);
 if(traits.has('horns')||traits.has('antlers'))for(const sign of [-1,1])line(headX+sign*6,headY-5,headX+sign*10,headY-19,2,accent);
 if(traits.has('beak')||traits.has('fangs'))line(headX-7,headY+2,headX-16,headY+5,2,accent);
 if(traits.has('roots')||traits.has('traps')){for(let n=0;n<3;n++)blob(39+n*10,32-(n%2)*8,5,8,accent);}
 if(traits.has('armor')||traits.has('bone'))for(let n=0;n<4+form;n++)blob(40+n*5,50+n%2*5,3,5,accent);
 if(traits.has('gel'))for(let n=0;n<4;n++)blob(42+n*5,59,3,5,accent);
 if(traits.has('light')||traits.has('glamour'))for(let x=31;x<65;x++)if((x+seed)%3)pixel(x,15+(x%5===0?1:0),accent);
 if(traits.has('elemental')||traits.has('fire')||traits.has('water')||traits.has('air'))for(let n=0;n<5;n++)line(61+n*2,52,65+n*2,31+n%2*7,2,accent);
 if(traits.has('eyes'))for(let n=0;n<4;n++){blob(39+n*7,47+(n%2)*7,2,2,[238,218,138]);pixel(39+n*7,47+(n%2)*7,outline);}
 // Shared family markings vary with seed, not with evolution stage.
 for(let n=0;n<30;n++){const h=designHash(seed,n),x=39+h%24,y=40+Math.floor(h/24)%22;if(((x-50)/rx)**2+((y-52)/ry)**2<.8)pixel(x,y,accent);}
 const eyeX=nonAnimal?42:headX-4,eyeY=nonAnimal?47:headY-1;blob(eyeX,eyeY,2,2,[246,233,173]);pixel(eyeX-1,eyeY,outline);
 // Enforce a larger, more elaborate third form without changing the underlying body plan.
 for(let n=0;n<form*3;n++)line(57+n*2,37,58+n*2,30-n%3*3,1,accent);
 return {width,height,data,provenance:{kind:'procedural-render',version:1,base:sp.base,alter:sp.alter,anatomy:a,seed}};
}
export function certifyRenderedAnatomy(sp){sp.anatomy={...(sp.design?.anatomy||sp.anatomy),source:'procedural-render',confidence:1};return syncCapabilities(sp);}
// Remove only near-white pixels connected to the image border. Interior white markings survive.
export function removeWhiteBackground(image){
 const {width:w,height:h}=image,data=new Uint8ClampedArray(image.data),seen=new Uint8Array(w*h),queue=new Int32Array(w*h);let start=0,end=0;
 const eligible=n=>{const i=n*4;return data[i+3]===0||Math.min(data[i],data[i+1],data[i+2])>=242&&Math.max(data[i],data[i+1],data[i+2])-Math.min(data[i],data[i+1],data[i+2])<12;};
 const add=n=>{if(!seen[n]&&eligible(n)){seen[n]=1;queue[end++]=n;}};
 for(let x=0;x<w;x++){add(x);add((h-1)*w+x);}for(let y=0;y<h;y++){add(y*w);add(y*w+w-1);}
 while(start<end){const n=queue[start++],x=n%w,y=Math.floor(n/w);data[n*4+3]=0;if(x)add(n-1);if(x<w-1)add(n+1);if(y)add(n-w);if(y<h-1)add(n+w);}
 return {...image,data,backgroundRemoved:end>0};
}
export function visualMetrics(image){
 const {width:w,height:h,data}=image;if(!Number.isInteger(w)||!Number.isInteger(h)||w<16||h<16||w>2048||h>2048||data?.length!==w*h*4)throw Error('Unsupported creature image dimensions.');
 let count=0,minX=w,minY=h,maxX=-1,maxY=-1,edge=0;const colors=new Map(),mask=Array(256).fill(0);let fingerprint=2166136261;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;if(data[i+3]<32)continue;count++;minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);if(x<2||y<2||x>=w-2||y>=h-2)edge++;const key=[data[i]>>5,data[i+1]>>5,data[i+2]>>5].join(',');colors.set(key,(colors.get(key)||0)+1);for(let k=0;k<4;k++)fingerprint=Math.imul(fingerprint^data[i+k],16777619)>>>0;}
 if(count)for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++)if(data[(y*w+x)*4+3]>=32)mask[Math.min(15,Math.floor((y-minY)*16/(maxY-minY+1)))*16+Math.min(15,Math.floor((x-minX)*16/(maxX-minX+1)))]=1;
 const palette=[...colors].sort((a,b)=>b[1]-a[1]).slice(0,12).map(([color,n])=>({color,weight:n/Math.max(1,count)}));
 const appearance=[];if(count)for(let y=0;y<16;y++)for(let x=0;x<16;x++){const px=Math.min(w-1,Math.floor(minX+(x+.5)*(maxX-minX+1)/16)),py=Math.min(h-1,Math.floor(minY+(y+.5)*(maxY-minY+1)/16)),i=(py*w+px)*4;appearance.push(data[i+3]>=32?((data[i]>>5)*64+(data[i+1]>>5)*8+(data[i+2]>>5)).toString(36):'-');}
 return {appearance,width:w,height:h,occupancy:count/(w*h),bounds:count?[minX,minY,maxX,maxY]:null,edgeRatio:edge/Math.max(1,count),silhouette:mask.join(''),palette,fingerprint:fingerprint.toString(16)};
}
export function compareVisuals(a,b){
 let intersection=0,union=0;for(let n=0;n<256;n++){if(a.silhouette[n]==='1'||b.silhouette[n]==='1')union++;if(a.silhouette[n]==='1'&&b.silhouette[n]==='1')intersection++;}
 let overlap=0;for(const c of a.palette){const rgb=c.color.split(',').map(Number);const d=b.palette.find(p=>p.color.split(',').map(Number).every((v,n)=>Math.abs(v-rgb[n])<=1));if(d)overlap+=Math.min(c.weight,d.weight);}
 const texture=a.appearance&&b.appearance?a.appearance.filter((v,n)=>v!==b.appearance[n]).length/256:1;return {texture,silhouette:intersection/Math.max(1,union),palette:overlap,exact:a.fingerprint===b.fingerprint&&a.width===b.width&&a.height===b.height};
}
export function validateLineageImages(images,{existing=[],allowExactFamily=false}={}){
 if(!Array.isArray(images)||images.length!==3)throw Error('Three complete form images are required.');
 const cleaned=images.map(removeWhiteBackground),metrics=cleaned.map(visualMetrics);
 for(let n=0;n<3;n++){const m=metrics[n];if(m.occupancy<.025||m.occupancy>.87)throw Error('Creature image is empty or its framing is too tight.');if(m.edgeRatio>.002||m.bounds[0]<2||m.bounds[1]<2||m.bounds[2]>m.width-3||m.bounds[3]>m.height-3)throw Error('Creature image is cropped at its edge.');if(n){const c=compareVisuals(metrics[0],m);if(c.exact&&!allowExactFamily)throw Error('Evolution images must be distinct.');if(c.silhouette<.24||c.palette<.20)throw Error('Evolution images have inconsistent silhouettes or palettes.');}}
 for(const other of existing){const refs=other.visualValidation?.metrics||other.metrics||[];if(refs.length&&metrics.every((m,n)=>refs[n]&&((c)=>c.exact||c.silhouette>.985&&c.palette>.98&&c.texture<.015)(compareVisuals(m,refs[n]))))throw Error('This artwork duplicates an existing lineage.');}
 return {images:cleaned,report:{version:1,status:'geometry-verified',backgroundRemoved:cleaned.some(x=>x.backgroundRemoved),metrics}};
}
