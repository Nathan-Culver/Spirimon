import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {ART} from '../roster.mjs';
import {WORLD_ART} from '../world-art.mjs';
import {createImageLoader,preloadImages} from '../asset-loader.mjs';

test('bundled artwork contains the exact original files for all four required atlases',()=>{
 assert.deepEqual(Object.keys(WORLD_ART).sort(),Object.values(ART).sort());
 const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
 for(const path of Object.values(ART)){assert.ok(WORLD_ART[path].startsWith('data:image/webp;base64,'));const embedded=Buffer.from(WORLD_ART[path].split(',')[1],'base64'),original=readFileSync(new URL('../'+path.slice(2),import.meta.url));assert.equal(hash(embedded),hash(original),path);}
});
test('world startup succeeds when every separate image download is blocked',async()=>{
 const requests=[];
 class BlockedNetworkImage{
  set src(value){requests.push(value);queueMicrotask(()=>{if(!value.startsWith('data:image/'))return this.onerror?.(new Error('Image downloads blocked'));this.naturalWidth=768;this.naturalHeight=768;this.onload?.();});}
 }
 const loader=createImageLoader({ImageClass:BlockedNetworkImage,notify:()=>{}}),progress=[];
 const images=await preloadImages(Object.values(ART),(done,total)=>progress.push([done,total]),loader);
 assert.equal(images.length,4);assert.equal(requests.length,4);assert.ok(requests.every(url=>url.startsWith('data:image/webp;base64,')));assert.deepEqual(progress.at(-1),[4,4]);
 for(const path of Object.values(ART))assert.ok(loader.readyImage(path)?.naturalWidth,path);
});
