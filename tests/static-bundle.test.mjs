import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {buildPage} from '../build.mjs';

test('published page contains current source, styles, font and core art without startup downloads',async()=>{
 const built=await buildPage(),published=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const hash=text=>createHash('sha256').update(text).digest('hex');assert.equal(hash(built.html),hash(published),'Run npm run build before publishing');
 assert.doesNotMatch(published,/<script[^>]+src=|<link rel="stylesheet"|type="importmap"|type="module"/);
 assert.ok(published.includes('data:font/ttf;base64,'));assert.ok(published.includes('data:image/webp;base64,'));assert.equal(built.modules.length,17);
 assert.doesNotThrow(()=>new vm.Script(built.script));assert.doesNotMatch(built.script,/(^|\n)import\s|import\.meta/);
});
test('bundle keeps all exported values, including multi-variable declarations',async()=>{
 const {script}=await buildPage();assert.match(script,/return \{[^}]*\bCHUNK_H\b[^}]*\bCHUNK_W\b[^}]*\}/);assert.match(script,/return \{[^}]*\bROOM_H\b[^}]*\bROOM_W\b[^}]*\}/);
});

test('downloaded game pages resolve optional artwork from the hosted game',async()=>{
 const {script}=await buildPage(),expression=script.match(/const __moduleURL=([^;]+);/)[1];
 for(const baseURI of ['file:///downloads/Spirimon.html','content://downloads/public/123']){
  const moduleURL=vm.runInNewContext(expression,{URL,document:{baseURI}});assert.equal(moduleURL('asset-loader.mjs'),'https://nathan-culver.github.io/Spirimon/asset-loader.mjs');
 }
 const previewURL=vm.runInNewContext(expression,{URL,document:{baseURI:'http://terminal.local:4173/?playtest=qa'}});assert.equal(previewURL('asset-loader.mjs'),'http://terminal.local:4173/asset-loader.mjs');
});
