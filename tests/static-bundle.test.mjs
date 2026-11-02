import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {buildPage} from '../build.mjs';

test('Pages entry is small and references one content-versioned classic bundle',async()=>{
 const built=await buildPage(),published=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert.equal(built.html,published,'Run npm run build before publishing');
 assert.ok(Buffer.byteLength(published)<12000);assert.ok(Buffer.byteLength(built.pageScript)<800000);
 assert.ok(published.includes(built.bundleName));assert.ok(published.includes(built.styleName));
 assert.equal(built.bundleName,'game-'+createHash('sha256').update(built.pageScript).digest('hex').slice(0,12)+'.js');
 assert.ok(built.modules.includes('creature-browser.mjs'));assert.ok(built.modules.includes('anatomy.mjs'));assert.doesNotThrow(()=>new vm.Script(built.pageScript));
 assert.doesNotMatch(built.pageScript,/(^|\n)import\s|import\.meta/);
 assert.ok(built.pageScript.includes('data:image/webp;base64,'),'Mystery sprites must be available without extra downloads');
 assert.match(built.pageScript,/if\(window\.__spirimonStarted\)return/);
});
test('downloaded copy retains complete code, styles, font and exact core artwork',async()=>{
 const built=await buildPage();assert.doesNotMatch(built.standaloneHtml,/<script[^>]+src=|<link rel="stylesheet"|type="importmap"|type="module"/);
 assert.ok(built.standaloneHtml.includes('data:font/ttf;base64,'));assert.ok(built.standaloneHtml.includes('data:image/webp;base64,'));
 assert.ok(built.standaloneHtml.includes('id="spirimon-game"'));assert.doesNotThrow(()=>new vm.Script(built.script));
 assert.match(built.script,/href="\.\/Spirimon.html" download="Spirimon.html"/);
});
test('bundle keeps all exported values, including multi-variable declarations',async()=>{
 const {pageScript}=await buildPage();assert.match(pageScript,/return \{[^}]*\bCHUNK_H\b[^}]*\bCHUNK_W\b[^}]*\}/);assert.match(pageScript,/return \{[^}]*\bROOM_H\b[^}]*\bROOM_W\b[^}]*\}/);
});
test('downloaded game pages resolve optional artwork from the hosted game',async()=>{
 const {script}=await buildPage(),expression=script.match(/const __moduleURL=([^;]+);/)[1];
 for(const baseURI of ['file:///downloads/Spirimon.html','content://downloads/public/123']){
  const moduleURL=vm.runInNewContext(expression,{URL,document:{baseURI}});assert.equal(moduleURL('asset-loader.mjs'),'https://nathan-culver.github.io/Spirimon/asset-loader.mjs');
 }
 const previewURL=vm.runInNewContext(expression,{URL,document:{baseURI:'http://terminal.local:4173/?playtest=qa'}});assert.equal(previewURL('asset-loader.mjs'),'http://terminal.local:4173/asset-loader.mjs');
});
