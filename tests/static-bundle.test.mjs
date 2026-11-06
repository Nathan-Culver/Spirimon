import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {buildPage} from '../build.mjs';

test('Pages entry is small and references one content-versioned classic bundle',async()=>{
 const built=await buildPage(),published=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert.equal(built.html,published,'Run npm run build before publishing');
 assert.ok(Buffer.byteLength(published)<12000);assert.ok(Buffer.byteLength(built.pageScript)<1000000,'Keep the guide and complete game below the 1 MB bundle budget, including Sealer disciplines');
 assert.ok(built.modules.includes('spiridex.mjs'));assert.ok(built.modules.includes('spiridex-view.mjs'));
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
 assert.match(built.script,/download="Spirimon.html"/);assert.ok(built.script.includes('https://nathan-culver.github.io/Spirimon/Spirimon.html'));
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

test('standalone download embeds every built-in creature portrait without inflating the online game bundle',async()=>{
 const built=await buildPage();const {ROSTER}=await import('../roster.mjs');
 const portraits=ROSTER.filter(sp=>sp.atlas);assert.ok(portraits.length>40);
 for(const sp of portraits){const data=built.offlineArt[sp.atlas];assert.ok(data?.startsWith('data:image/webp;base64,'),sp.atlas);assert.equal(Buffer.from(data.split(',')[1],'base64').compare(readFileSync(new URL('../'+sp.atlas.slice(2),import.meta.url))),0);}
 assert.match(built.standaloneHtml,/window\.__spirimonOfflineArt=/);assert.doesNotMatch(built.pageScript,/window\.__spirimonOfflineArt=/);
});

test('packed roster anatomy preserves every form and independent mutable records',async()=>{
 const {pageScript}=await buildPage(),{ROSTER}=await import('../roster.mjs'),anatomy=await import('../anatomy.mjs');
 const begin=pageScript.indexOf('__modules["roster.mjs"]='),end=pageScript.indexOf('\n__modules[',begin+1);
 const context={__modules:{'anatomy.mjs':anatomy},structuredClone};
 vm.runInNewContext(pageScript.slice(begin,end),context);
 const packed=context.__modules['roster.mjs'].ROSTER;
 assert.deepEqual(JSON.parse(JSON.stringify(packed)),JSON.parse(JSON.stringify(ROSTER)));
 const creature=packed.find(r=>r.id==='silkclasp');
 assert.ok(creature.formAnatomy.every(a=>a.limbs.arms===4));
 assert.notEqual(creature.formAnatomy[0],creature.formAnatomy[1]);
 creature.formAnatomy[0].limbs.arms=0;
 assert.equal(creature.formAnatomy[1].limbs.arms,4);
});
