import {WORLD_ART} from './world-art.mjs';
// One image cache for terrain, characters, buildings and creature artwork.
// Retry transient failures rather than caching an invisible sprite forever.
export const ASSET_VERSION=new URL(import.meta.url).searchParams.get('v')||'20261031-art-bundle-6';
export function createImageLoader({ImageClass=globalThis.Image,setTimer=setTimeout,clearTimer=clearTimeout,now=Date.now,notify=()=>globalThis.spirimonArtLoaded?.(),version=ASSET_VERSION,timeout=15000,maxAttempts=3,bundledSources=WORLD_ART}={}){
 const entries=new Map();
 function imageURL(source,attempt){
  if(bundledSources[source])return bundledSources[source];
  if(/^(data:|blob:)/i.test(source))return source;
  const url=new URL(source,import.meta.url),base=new URL(import.meta.url);
  if(url.origin===base.origin){url.searchParams.set('v',version);if(attempt)url.searchParams.set('retry',attempt+'-'+now());}
  return url.href;
 }
 function request(source){
  let entry=entries.get(source);
  if(entry?.state==='failed'&&now()>=entry.retryAfter){entries.delete(source);entry=null;}
  if(entry)return entry;
  let finish;entry={state:'loading',image:null,attempts:0,promise:new Promise(resolve=>{finish=resolve;})};entries.set(source,entry);
  function attempt(){
   entry.attempts++;entry.state='loading';let settled=false,timer;
   const image=new ImageClass();entry.image=image;
   function cleanup(){clearTimer(timer);image.onload=null;image.onerror=null;}
   function fail(){
    if(settled)return;settled=true;cleanup();
    if(entry.attempts<maxAttempts){entry.state='retrying';setTimer(attempt,entry.attempts*500);}
    else{entry.state='failed';entry.retryAfter=now()+30000;finish(false);}
   }
   image.onload=()=>{if(settled)return;if(!image.naturalWidth||!image.naturalHeight){fail();return;}settled=true;cleanup();entry.state='ready';finish(true);notify();};
   image.onerror=fail;timer=setTimer(fail,timeout);image.src=imageURL(source,entry.attempts-1);
  }
  attempt();return entry;
 }
 return {
  readyImage(source){if(!source)return null;const entry=request(source);return entry.state==='ready'?entry.image:null;},
  async loadImage(source){const entry=request(source);if(!await entry.promise){const filename=String(source).split('/').pop().split('?')[0];throw new Error('Artwork could not load: '+filename+'. Check your connection and retry.');}return entry.image;},
  status(source){const e=entries.get(source);return e?{state:e.state,attempts:e.attempts}:null;}
 };
}
export const imageLoader=createImageLoader();
export function readyImage(source){return imageLoader.readyImage(source);}
export async function preloadImages(sources,onProgress=()=>{},loader=imageLoader){const unique=[...new Set(sources)],total=unique.length;let complete=0;return Promise.all(unique.map(async source=>{const image=await loader.loadImage(source);onProgress(++complete,total);return image;}));}
