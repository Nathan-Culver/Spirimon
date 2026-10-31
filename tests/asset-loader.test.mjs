import test from 'node:test';
import assert from 'node:assert/strict';
import {createImageLoader,preloadImages} from '../asset-loader.mjs';

function harness(outcomes=[]){
 const urls=[],timers=[];let clock=1000,notifications=0;
 class FakeImage{
  set src(url){this.url=url;urls.push(url);const result=outcomes.shift()||'load';queueMicrotask(()=>{if(result==='hang')return;if(result==='error')return this.onerror?.();this.naturalWidth=result==='empty'?0:768;this.naturalHeight=result==='empty'?0:768;this.onload?.();});}
 }
 const loader=createImageLoader({bundledSources:{},ImageClass:FakeImage,version:'test-release',now:()=>clock,notify:()=>notifications++,setTimer(fn,ms){const timer={fn,ms};timers.push(timer);return timer;},clearTimer(timer){if(timer)timer.cleared=true;}});
 return {loader,urls,run(ms){const timer=timers.find(t=>t.ms===ms&&!t.cleared&&!t.used);assert.ok(timer,'Expected timer '+ms);timer.used=true;timer.fn();},advance(ms){clock+=ms;},notifications:()=>notifications};
}
test('sprites share one decoded image and use the current release URL',async()=>{
 const h=harness(),path='./assets/sealer-walk.webp';assert.equal(h.loader.readyImage(path),null);assert.equal(h.loader.readyImage(path),null);
 const image=await h.loader.loadImage(path);assert.equal(h.urls.length,1);assert.equal(new URL(h.urls[0]).searchParams.get('v'),'test-release');assert.equal(h.loader.readyImage(path),image);assert.equal(h.notifications(),1);
});
test('a failed image retries with a fresh URL and becomes available to the renderer',async()=>{
 const h=harness(['error','load']),path='./assets/world-props.webp',promise=h.loader.loadImage(path);await Promise.resolve();assert.equal(h.loader.status(path).state,'retrying');h.run(500);
 const image=await promise;assert.ok(image.naturalWidth);assert.equal(h.urls.length,2);assert.notEqual(h.urls[0],h.urls[1]);assert.equal(new URL(h.urls[1]).searchParams.get('retry'),'1-1000');assert.equal(h.loader.readyImage(path),image);
});
test('stalled downloads time out and retry instead of leaving invisible sprites permanently',async()=>{
 const h=harness(['hang','load']),promise=h.loader.loadImage('./assets/terrain-v2.webp');h.run(15000);h.run(500);assert.ok((await promise).naturalWidth);assert.equal(h.urls.length,2);
});
test('invalid image data retries instead of being treated as loaded artwork',async()=>{
 const h=harness(['empty','load']),promise=h.loader.loadImage('./assets/sealer-walk.webp');await Promise.resolve();h.run(500);assert.ok((await promise).naturalWidth);
});
test('exhausted retries report the missing filename and allow later recovery',async()=>{
 const h=harness(['error','error','error','load']),path='./assets/town-expansion.webp',failure=assert.rejects(h.loader.loadImage(path),/Artwork could not load: town-expansion.webp/);
 await Promise.resolve();h.run(500);await Promise.resolve();h.run(1000);await failure;assert.equal(h.loader.status(path).state,'failed');assert.equal(h.loader.readyImage(path),null);assert.equal(h.urls.length,3);
 h.advance(30001);assert.ok((await h.loader.loadImage(path)).naturalWidth);assert.equal(h.urls.length,4);
});
test('embedded and blob artwork keeps its original URL',async()=>{
 const h=harness();for(const url of ['data:image/png;base64,example','blob:https://example.test/id']){await h.loader.loadImage(url);assert.equal(h.urls.at(-1),url);}
});
test('world-art preload waits for every unique image and reports completion',async()=>{
 const h=harness(),progress=[];const images=await preloadImages(['./assets/sealer-walk.webp','./assets/world-props.webp','./assets/sealer-walk.webp'],(done,total)=>progress.push([done,total]),h.loader);
 assert.equal(images.length,2);assert.equal(h.urls.length,2);assert.deepEqual(progress,[[1,2],[2,2]]);
});
