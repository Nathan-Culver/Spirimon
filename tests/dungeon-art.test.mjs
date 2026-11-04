import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {buildPage} from '../build.mjs';
import {DUNGEON_MATERIALS,DUNGEON_PROPS,DUNGEON_PROP_NAMES,dungeonFeatureSprite,dungeonDecoration} from '../dungeon-atlas.mjs';

test('dungeon artwork is included byte-for-byte in the offline build',async()=>{
 const build=await buildPage();
 for(const source of [DUNGEON_MATERIALS,DUNGEON_PROPS]){
  const data=readFileSync(new URL('../'+source.slice(2),import.meta.url));
  assert.equal(data.toString('ascii',0,4),'RIFF');
  assert.equal(build.offlineArt[source],'data:image/webp;base64,'+data.toString('base64'));
  assert(!build.pageScript.includes(data.toString('base64')));
 }
 assert.equal(DUNGEON_PROP_NAMES.length,24);assert.equal(new Set(DUNGEON_PROP_NAMES).size,24);
});
test('interacted mechanisms and repaired hazards use distinct authored sprites',()=>{
 for(const [kind,key,before,after]of [['lever','lever','lever-up','lever-down'],['treasure','treasure','chest-closed','chest-open'],['hazard','hazard','hazard','crossing']]){
  assert.equal(dungeonFeatureSprite({kind},{}),before);assert.equal(dungeonFeatureSprite({kind},{[key]:true}),after);
 }
 const sigils=[0,1,2].map(order=>dungeonFeatureSprite({kind:'rune',order}));assert.equal(new Set(sigils).size,3);
 for(const seed of [0,19,43,59,67,71,73,97]){assert.equal(dungeonDecoration(seed,{occupied:true}),null);assert.equal(dungeonDecoration(seed,{nearWall:true}),dungeonDecoration(seed,{nearWall:true}));}
});
test('all renderer samples stay inside their material family and sprite cell',()=>{
 const source=readFileSync(new URL('../dungeon-atlas.mjs',import.meta.url),'utf8').replace(/^import .*;\n/m,'').replaceAll('export ','');
 const samples=[],images={[DUNGEON_MATERIALS]:{name:'materials'},[DUNGEON_PROPS]:{name:'props'}};
 const context=vm.createContext({readyImage:path=>images[path],samples,ctx:{drawImage:(...args)=>samples.push(args),fillRect(){}}});vm.runInContext(source,context);
 for(let biome=0;biome<4;biome++)for(let tileX=-1;tileX<5;tileX++)for(const wall of [false,true]){
  samples.length=0;context.biome=biome;context.tileX=tileX;context.kind=wall?6:0;
  vm.runInContext('drawDungeonAtlasTile(ctx,biome,kind,.6,1.6,{tileX,tileY:-1,neighbors:{south:true}})',context);
  assert(samples.length>=1);
  for(const [,sx,sy,sw,sh,dx,dy]of samples){assert(sx>=biome*256&&sx+sw<=(biome+1)*256);assert(sy>=0&&sy+sh<=1024);assert(Number.isInteger(dx));assert(Number.isInteger(dy));}
 }
 for(const name of DUNGEON_PROP_NAMES){samples.length=0;context.name=name;vm.runInContext('drawDungeonProp(ctx,name,.6,1.6)',context);const [,sx,sy,sw,sh]=samples[0];assert(sx+sw<=1024);assert(sy+sh<=1536);}
});
