import test from 'node:test';
import assert from 'node:assert/strict';
import {dialoguePages,dialoguePageAtOffset} from '../dialogue-pages.mjs';
const flatten=pages=>pages.flat().join(' ').replace(/\s+/g,' ').trim();
test('a conversation that fits remains on a single page with its paragraph breaks',()=>{
 const lines=['Ready? I want to see how your bonds have grown.','What brought yours here?'];assert.deepEqual(dialoguePages(lines,()=>true),[lines]);
});
test('phone pages keep complete paragraphs together without losing or duplicating dialogue',()=>{
 const lines=['Ready? I want to see how your bonds have grown.','I recognize the look of someone with a long road ahead.','My companion chose this road beside me. What brought yours here?'];
 const pages=dialoguePages(lines,trial=>trial.join(' ').length<=80);assert.equal(flatten(pages),lines.join(' '));assert.ok(pages.length>1);assert.ok(pages.every(p=>p.join(' ').length<=80));
});
test('long tutorial speeches split at words, preserve punctuation, and respect every page budget',()=>{
 const lines=['Before you continue: open MENU to manage your Spirimon, Bag, map, Spiritual Arts, saving and Options. The TUTORIAL submenu inside MENU lets you revisit the lessons and learn more whenever you need it.'];
 for(const budget of [12,30,55,90]){const pages=dialoguePages(lines,trial=>trial.join(' ').length<=budget);assert.equal(flatten(pages),lines[0]);assert.ok(pages.every(p=>p.join(' ').length<=budget));}
});
test('page wrapping accounts for paragraph spacing as well as text length',()=>{
 const lines=['First line.','Second line.','Third line.'];const fits=p=>p.join(' ').length+p.length*10<=48,pages=dialoguePages(lines,fits);assert.ok(pages.every(fits));assert.equal(flatten(pages),lines.join(' '));
});
test('resizing can preserve the current reading position across different page boundaries',()=>{
 const pages=[['First sentence.'],['Second sentence.'],['Third sentence.']];assert.equal(dialoguePageAtOffset(pages,0),0);assert.equal(dialoguePageAtOffset(pages,'First sentence.'.length+1),1);assert.equal(dialoguePageAtOffset(pages,10000),2);
});
test('empty dialogue and a single unbroken word cannot create an infinite pagination loop',()=>{
 assert.deepEqual(dialoguePages([],()=>false),[[]]);assert.deepEqual(dialoguePages(['Indivisible'],()=>false),[['Indivisible']]);
});
