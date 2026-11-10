import test from 'node:test';
import vm from 'node:vm';
import {buildPage} from '../build.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {npcBattleAppearance,npcBattleLayers,npcBattlePose,npcPoseSourceRect,npcMaterialLabels,NPC_POSE_ITEMS,npcBattleSpriteHTML,NPC_BATTLE_ASSETS,NPC_BATTLE_POSES,NPC_OPTIONAL_PARTS,NPC_REVIEW_IDENTITIES} from '../npc-battle-sprites.mjs';
test('NPC identity, gender, pose, outfit and colors survive movement, rematches and save reloads',()=>{
 const n={id:'rival:rowan',name:'Rowan',x:1,y:2},a=npcBattleAppearance('world-one',n);
 assert.deepEqual(npcBattleAppearance('world-one',JSON.parse(JSON.stringify({...n,x:95,y:-5,battles:12}))),a);
 assert.notDeepEqual(npcBattleAppearance('world-two',n),a);assert.equal(a.facing,'left');
});
test('all twenty poses use separate complete authored figure frames',()=>{
 assert.equal(NPC_BATTLE_POSES.length,20);
 const image={width:1983,height:793};
 for(const gender of ['male','female']){const poses=NPC_BATTLE_POSES.filter(p=>p.gender===gender);assert.equal(poses.length,10);assert.equal(new Set(poses.map(p=>JSON.stringify(npcPoseSourceRect(image,p.index)))).size,10);for(const p of poses){assert.equal(npcBattlePose({gender,pose:p.index}).id,p.id);const [x,y,w,h]=npcPoseSourceRect(image,p.index);assert.ok(x>=0&&y>=0&&x+w<=image.width+.001&&y+h<=image.height+.001);assert.equal(w,image.width/5);assert.equal(h,image.height/2);}}
 assert.equal(npcBattlePose({gender:'male',pose:100}).index,0);
});
test('random wardrobes include every required omission while pants and heads remain present',()=>{
 const seen=Object.fromEntries(NPC_OPTIONAL_PARTS.map(p=>[p,new Set()])),genders=new Set(),poses=new Set(),colors=new Set(),items=new Set();
 for(let n=0;n<2000;n++){const a=npcBattleAppearance('world',{id:'npc-'+n});genders.add(a.gender);poses.add(a.gender+':'+a.pose);items.add(a.item);for(const p in seen)seen[p].add(a[p]);assert.ok(a.head>=0&&a.head<4);assert.ok(a.pants>=0&&a.pants<2);for(const color of Object.values(a.colors)){assert.match(color,/^#[0-9a-f]{6}$/i);colors.add(color);}}
 assert.equal(genders.size,2);assert.equal(poses.size,20);assert.equal(items.size,13);for(const s of Object.values(seen)){assert.ok(s.has(-1));assert.ok(s.has(0));}assert.ok(colors.size>1000,'Colors must not be restricted to a short palette');
});
test('authored gender, pose, attire omissions, items and any RGB color are respected and bounded',()=>{
 const a=npcBattleAppearance('world',{id:'fixed',battleAppearance:{gender:'female',pose:9,head:3,hat:-1,shirt:-1,gloves:-1,boots:-1,item:11,pants:1,colors:{shirt:'#ff00bb',boots:'#123456',hat:'url(evil)'}}});
 assert.equal(a.gender,'female');assert.equal(a.pose,9);assert.equal(a.item,-1);assert.equal(a.pants,1);for(const p of NPC_OPTIONAL_PARTS)assert.equal(a[p],-1);assert.equal(a.colors.shirt,'#ff00bb');assert.equal(a.colors.boots,'#123456');assert.match(a.colors.hat,/^#[0-9a-f]{6}$/i);
 const b=npcBattleAppearance('world',{id:'fixed',battleAppearance:{pose:20,pants:-1,head:99,item:30}});assert.ok(b.pose<10);assert.ok(b.pants>=0);assert.ok(b.head<4);assert.ok(b.item<12);
});
test('absent garments are omitted from the wardrobe layers rather than recolored or painted over',()=>{
 const a=npcBattleAppearance('world',{id:'bare',battleAppearance:{hat:-1,shirt:-1,gloves:-1,boots:-1,item:-1}}),parts=npcBattleLayers(a).map(p=>p.part);
 assert.deepEqual(parts,['pants','head']);
});
test('the inspection set contains two different complete NPCs for every male and female pose',()=>{
 assert.equal(NPC_REVIEW_IDENTITIES.length,40);const choices=NPC_REVIEW_IDENTITIES.map(n=>npcBattleAppearance('wardrobe-review-02',n));assert.equal(new Set(choices.map(JSON.stringify)).size,40);
 for(const gender of ['male','female'])for(let pose=0;pose<10;pose++){const pair=choices.filter(a=>a.gender===gender&&a.pose===pose);assert.equal(pair.length,2);assert.notDeepEqual(pair[0],pair[1]);}
 for(const p of NPC_OPTIONAL_PARTS)assert.ok(choices.some(a=>a[p]===-1),p);
});
test('all modular artwork is included as compact WebP source assets',()=>{
 let total=0;for(const file of Object.values(NPC_BATTLE_ASSETS)){const bytes=readFileSync(new URL('../'+file,import.meta.url));assert.equal(bytes.toString('ascii',8,12),'WEBP');total+=bytes.length;}assert.ok(total<1700000);
});
test('sprite HTML announces left-facing gender and pose and escapes save-controlled names',()=>{
 const html=npcBattleSpriteHTML('world',{id:'npc',name:'<Ari "the sealer">',battleAppearance:{gender:'female',pose:4}});
 assert.match(html,/data-npc-battle="\{&quot;version/);assert.match(html,/&lt;Ari &quot;the sealer&quot;&gt;/);assert.match(html,/female pose 5 · facing left/);assert.doesNotMatch(html,/<Ari/);
});

test('the shipped review bundles the actual renderer without browser module dependencies or duplicate names',async()=>{
 const built=await buildPage(),scripts=[...built.npcReviewHtml.matchAll(/<script(?: type="module")?>([\s\S]*?)<\/script>/g)];assert.ok(scripts.length);for(const script of scripts){assert.doesNotMatch(script[1],/^import /m);assert.doesNotThrow(()=>new vm.Script(script[1]));}for(const path of Object.values(NPC_BATTLE_ASSETS)){assert.ok(built.assets.some(a=>a.path===path));assert.ok(built.npcReviewHtml.includes(path),'Review must use current production assets');}
});

test('garment masking separates dyed cloth, exposed skin, outlines and optional accessories',()=>{
 const pixels=new Uint8ClampedArray(400*400*4),put=(x,y,rgb)=>pixels.set([...rgb,255],(y*400+x)*4),pose=npcBattlePose({gender:'male',pose:0});
 put(200,150,[150,35,45]);put(201,150,[30,22,24]);put(202,150,[235,229,211]);put(180,150,[204,146,102]);put(210,250,[38,49,91]);put(158,228,[51,98,57]);put(165,351,[154,119,50]);
 const dressed=npcMaterialLabels(pixels,400,400,pose),base=npcMaterialLabels(pixels,400,400,pose,{dressed:false});
 assert.equal(dressed[150*400+200],1);assert.equal(dressed[150*400+201],1);assert.equal(dressed[150*400+202],1);assert.equal(dressed[150*400+180],0,'Exposed skin must remain separate from clothing');assert.equal(dressed[250*400+210],2);assert.equal(dressed[228*400+158],3);assert.equal(dressed[351*400+165],4);assert.equal(base[150*400+200],0);assert.equal(base[228*400+158],0);assert.equal(base[351*400+165],0);
});
test('held-item choices respect the painted grip and folded-arm figures keep empty hands',()=>{
 for(let n=0;n<500;n++){const a=npcBattleAppearance('grips',{id:String(n)});assert.ok(NPC_POSE_ITEMS[a.pose].includes(a.item));if(a.pose===9)assert.equal(a.item,-1);}
});
