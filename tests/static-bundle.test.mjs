import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {buildPage} from '../build.mjs';

test('published page contains current source, styles, font and core art without startup downloads',async()=>{
 const built=await buildPage(),published=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert.equal(built.html,published,'Run npm run build before publishing');
 assert.doesNotMatch(published,/<script[^>]+src=|<link rel="stylesheet"|type="importmap"|type="module"/);
 assert.ok(published.includes('data:font/ttf;base64,'));assert.ok(published.includes('data:image/webp;base64,'));assert.equal(built.modules.length,17);
 assert.doesNotThrow(()=>new vm.Script(built.script));assert.doesNotMatch(built.script,/(^|\n)import\s|import\.meta/);
});
test('bundle keeps all exported values, including multi-variable declarations',async()=>{
 const {script}=await buildPage();assert.match(script,/return \{[^}]*\bCHUNK_H\b[^}]*\bCHUNK_W\b[^}]*\}/);assert.match(script,/return \{[^}]*\bROOM_H\b[^}]*\bROOM_W\b[^}]*\}/);
});
