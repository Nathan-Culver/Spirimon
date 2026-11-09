import {assertLineageReview,assertNovelGeneration,validateGenerationPlan} from './generation-policy.mjs';
import {renderCreaturePixels,validateLineageImages,certifyRenderedAnatomy} from './creature-visuals.mjs';
import {applyVisualObservation,applyLineageObservations} from './anatomy.mjs';
function pngData(image){const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const ctx=canvas.getContext('2d'),pixels=ctx.createImageData(image.width,image.height);pixels.data.set(image.data);ctx.putImageData(pixels,0,0);return canvas.toDataURL('image/png');}
export function completeProceduralSpecies(sp,existing=[]){
 if(existing.some(p=>p.id!==sp.id&&p.forms?.every((name,n)=>name.toLowerCase()===sp.forms[n]?.toLowerCase())))throw Error('This lineage duplicates existing names.');
 const checked=validateLineageImages([0,1,2].map(n=>renderCreaturePixels(sp,n)),{existing,plannedChanges:sp.generationRevision===2});
 certifyRenderedAnatomy(sp);sp.sprites=checked.images.map(pngData);sp.atlas=null;sp.proceduralArt=true;sp.visualValidation={...checked.report,status:'procedural-verified',semanticSource:'renderer-geometry'};return sp;
}
async function readPNG(url){
 if(typeof url!=='string'||url.length>20000000||!url.startsWith('data:image/png;base64,'))throw Error('Complete PNG sprite data is required.');
 return new Promise((resolve,reject)=>{const img=new Image(),timer=setTimeout(()=>reject(Error('Sprite decoding timed out.')),15000);img.onload=()=>{clearTimeout(timer);try{if(img.width>2048||img.height>2048)throw Error('Sprite image is too large.');const canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);resolve({width:img.width,height:img.height,data:ctx.getImageData(0,0,img.width,img.height).data});}catch(e){reject(e);}};img.onerror=()=>{clearTimeout(timer);reject(Error('Invalid creature PNG.'));};img.src=url;});
}
export async function acceptGeneratedArtwork(sp,data,existing=[]){
 if(data.visualValidation?.status==='procedural-verified')return completeProceduralSpecies(sp,existing);
 const observations=data.visualValidation?.observations;
 if(data.visualValidation?.status!=='vision-verified'||!Array.isArray(observations)||observations.length!==3)throw Error('External artwork requires three independently checked image observations.');
 const candidate=structuredClone(sp);assertNovelGeneration(candidate,existing);
 if(data.visualValidation.policyRevision===2){candidate.design=structuredClone(data.design||candidate.design);candidate.generationRevision=2;}
 if(candidate.generationRevision===2){if(data.visualValidation.policyRevision!==2)throw Error('Artwork was checked by an outdated generation policy.');validateGenerationPlan(candidate,data);assertLineageReview(data.visualValidation.lineageReview);}
 observations.forEach((observation,n)=>applyVisualObservation({...candidate},observation,n));
 const checked=validateLineageImages(await Promise.all(data.sprites.map(readPNG)),{existing,plannedChanges:candidate.generationRevision===2});
 applyLineageObservations(candidate,observations);
 Object.assign(sp,{anatomy:candidate.anatomy,formAnatomy:candidate.formAnatomy,capabilities:candidate.capabilities,...(candidate.design?{design:candidate.design,generationRevision:candidate.generationRevision}:{}),sprites:checked.images.map(pngData),atlas:null,proceduralArt:false,visualValidation:{...data.visualValidation,...checked.report,status:'vision-verified'}});return sp;
}

export async function atlasSprites(sp){
 if(sp.sprites?.length===3)return sp.sprites;
 if(!sp.atlas)throw Error('This lineage has no external artwork to inspect.');
 return new Promise((resolve,reject)=>{const img=new Image(),timer=setTimeout(()=>reject(Error('Atlas decoding timed out.')),15000);img.onload=()=>{clearTimeout(timer);try{const forms=[];for(let n=0;n<3;n++){const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;const ctx=canvas.getContext('2d');ctx.drawImage(img,n*256,0,256,256,0,0,256,256);forms.push(canvas.toDataURL('image/png'));}resolve(forms);}catch(e){reject(e);}};img.onerror=()=>{clearTimeout(timer);reject(Error('Atlas artwork could not load.'));};img.src=sp.atlas;});
}
