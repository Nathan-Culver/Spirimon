import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {npcBattleAppearance,npcBattleLayers,drawNPCBattleSprite,npcBattleSpriteHTML,NPC_BATTLE_ATLAS,NPC_REVIEW_IDENTITIES} from '../npc-battle-sprites.mjs';
test('NPC appearance survives dialogue, movement, rematches and save reloads',()=>{
 const identity={id:'rival:rowan',name:'Rowan',x:1,y:2};
 const expected=npcBattleAppearance('world-one',identity);
 assert.deepEqual(npcBattleAppearance('world-one',JSON.parse(JSON.stringify({...identity,x:95,y:-5,battles:12}))),expected);
 assert.notDeepEqual(npcBattleAppearance('world-two',identity),expected);
});
test('every wardrobe part varies independently and explicit authored choices are bounded',()=>{
 const sets=Object.fromEntries(['head','hat','shirt','trousers'].map(p=>[p,new Set()]));const combinations=new Set();
 for(let n=0;n<1000;n++){const a=npcBattleAppearance('world',{id:'npc-'+n});combinations.add(JSON.stringify(a));for(const p in sets){assert.ok(a[p]>=0&&a[p]<5);sets[p].add(a[p]);}}
 for(const set of Object.values(sets))assert.equal(set.size,5);
 assert.ok(combinations.size>300);
 const a=npcBattleAppearance('world',{id:'fixed',battleAppearance:{head:4,hat:1,shirt:-1,trousers:100}});
 assert.equal(a.head,4);assert.equal(a.hat,1);assert.ok(a.shirt>=0&&a.shirt<5);assert.ok(a.trousers>=0&&a.trousers<5);
});
test('renderer composes all selected parts and masks hems, faces and wardrobe overlap',()=>{
 const a={trousers:0,shirt:1,head:2,hat:3},calls=[],clips=[];
 const ctx={save(){},restore(){},translate(){},scale(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},rect(){},clip(){clips.push(true);},drawImage(...args){calls.push(args);}};
 drawNPCBattleSprite(ctx,{width:1983,height:793},a,{x:10,y:20,width:200,height:400});
 assert.equal(calls.length,4);assert.equal(clips.length,2);
 for(const [n,part] of [[0,'trousers'],[1,'shirt'],[2,'hat'],[3,'head']])assert.ok(Math.abs(calls[n][1]-a[part]*1983/5)<1e-9);
 assert.equal(ctx.imageSmoothingEnabled,false);
});
test('five review NPCs are real deterministic mixer results and the atlas has alpha',()=>{
 assert.equal(NPC_REVIEW_IDENTITIES.length,5);
 const choices=NPC_REVIEW_IDENTITIES.map(n=>npcBattleAppearance('wardrobe-review-01',n));
 assert.equal(new Set(choices.map(JSON.stringify)).size,5);
 assert.ok(choices.every(a=>new Set(Object.values(a).slice(1)).size>1));
 const bytes=readFileSync(new URL('../'+NPC_BATTLE_ATLAS,import.meta.url));assert.equal(bytes.toString('ascii',8,12),'WEBP');assert.ok(bytes.length<700000,'Atlas must fit offline release budget');
});
test('sprite HTML uses the supplied name and escapes save-controlled values',()=>{
 const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
 const html=npcBattleSpriteHTML('world',{id:'npc',name:'<Ari "the sealer">'},escape);
 assert.match(html,/data-npc-battle="\{&quot;version/);assert.match(html,/aria-label="&lt;Ari &quot;the sealer&quot;/);assert.doesNotMatch(html,/<Ari/);
});
