import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,readdir,rm,stat,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {buildPage,writeRelease} from '../build.mjs';
import {ROSTER} from '../roster.mjs';
import {BATTLE_BACK_ART} from '../battle-art.mjs';
import {EFFECT_ATLASES} from '../battle-effects.mjs';

test('release inventory includes every current front and rear atlas and excludes superseded art',async()=>{
 const built=await buildPage(undefined,{standalone:false}),files=new Set(built.assets.map(a=>a.path));
 for(const sp of ROSTER){assert.ok(files.has(sp.atlas),sp.id+' front');assert.ok(files.has(BATTLE_BACK_ART[sp.id]),sp.id+' rear');}
 assert.ok(files.has('./assets/shrine-atlas.png'));assert.ok(files.has('./assets/cave-entrance-atlas.png'));
 for(const atlas of EFFECT_ATLASES)assert.ok(files.has(atlas),'Battle artwork must ship in every release');
 assert.ok(!files.has('./assets/roster/kilnscale.webp'),'Obsolete revisions must not inflate releases');
 assert.ok(built.assets.reduce((sum,a)=>sum+a.bytes,0)<40*1024*1024,'Investigate asset growth beyond the 40 MiB budget');
});
test('packaged file URLs resolve artwork locally while downloaded HTML retains its hosted fallback',async()=>{
 const built=await buildPage(undefined,{standalone:false}),expression=built.pageScript.match(/const __moduleURL=([^;]+);/)[1];
 for(const baseURI of ['file:///games/Spirimon/index.html','content://games/local/index.html']){
  const local=vm.runInNewContext(expression,{URL,document:{baseURI},window:{__spirimonPackaged:true}});
  assert.equal(local('asset-loader.mjs'),new URL('asset-loader.mjs',baseURI).href);
  const downloaded=vm.runInNewContext(expression,{URL,document:{baseURI},window:{}});
  assert.equal(downloaded('asset-loader.mjs'),'https://nathan-culver.github.io/Spirimon/asset-loader.mjs');
 }
 assert.match(built.packagedHtml,/window\.__spirimonPackaged=true;window\.spirimonLoadGame/);
 assert.ok(built.packagedHtml.includes(built.packagedBundleName));assert.doesNotMatch(built.packagedScript,/data:image\/webp;base64,/);
 assert.equal(built.standaloneHtml,null);assert.deepEqual(built.offlineArt,{});
});
test('installer output contains one copy of current assets and replaces stale generated payloads',async()=>{
 const output=await mkdtemp(path.join(tmpdir(),'spirimon-release-'));
 try{
  await writeFile(path.join(output,'Spirimon.html'),'obsolete embedded copy');
  await writeFile(path.join(output,'game-000000000000.js'),'old bundle');
  await writeFile(path.join(output,'notes.txt'),'preserve unrelated files');
  const {built,report}=await writeRelease(output,{target:'app'}),names=await readdir(output);
  assert.ok(!names.includes('Spirimon.html'));assert.ok(!names.includes('game-000000000000.js'));assert.ok(names.includes('notes.txt'));
  assert.equal(await readFile(path.join(output,'index.html'),'utf8'),built.packagedHtml);
  assert.equal(report.singleFileBytes,0);assert.ok(report.codeBytes<1024*1024);
  for(const asset of report.assets)assert.equal((await stat(path.join(output,asset.path))).size,asset.bytes,asset.path);
  assert.equal(JSON.parse(await readFile(path.join(output,'asset-manifest.json'),'utf8')).assetBytes,report.assetBytes);
 }finally{await rm(output,{recursive:true,force:true});}
});
test('web releases retain a fully embedded download within its size budget',async()=>{
 const built=await buildPage();assert.ok(Buffer.byteLength(built.standaloneHtml)<55*1024*1024);
 for(const rear of Object.values(BATTLE_BACK_ART))assert.ok(built.offlineArt[rear]?.startsWith('data:image/webp;base64,'),rear);
 for(const atlas of EFFECT_ATLASES)assert.equal(Buffer.from(built.offlineArt[atlas].split(',')[1],'base64').compare(await readFile(new URL('../'+atlas.slice(2),import.meta.url))),0,atlas);
 assert.doesNotMatch(built.html,/__spirimonPackaged=true/);
});
test('one Pages workflow deploys and standalone filters cover gameplay, styling and artwork',async()=>{
 const dir=new URL('../.github/workflows/',import.meta.url),workflows=await Promise.all((await readdir(dir)).filter(f=>/\.ya?ml$/.test(f)).map(f=>readFile(new URL(f,dir),'utf8')));
 assert.equal(workflows.filter(s=>s.includes('actions/deploy-pages@')).length,1);
 const native=await readFile(new URL('standalone.yml',dir),'utf8');
 for(const ext of ['mjs','js','css','html'])assert.ok(native.includes("'**."+ext+"'"));
 assert.match(native,/'assets\/\*\*'/);assert.match(native,/needs: validate/);assert.match(native,/--target app --out-dir desktop\/game/);assert.match(native,/--target app --out-dir _site/);
 assert.doesNotMatch(native,/cp _site\/Spirimon\.html/);
});
