import test from 'node:test';import assert from 'node:assert/strict';import {animationProfile,drawTechnique} from '../move-animations.mjs';import {TYPE_MOVES,ADVANCED_MOVES,EXTRA_MOVES,ENVIRONMENT_MOVES,buildLearnset} from '../moves.mjs';
test('every technique receives deterministic choreography',()=>{
 const moves=[...Object.values(TYPE_MOVES).flat(),...buildLearnset('Beast','Plant',['Fire']),...ADVANCED_MOVES,...EXTRA_MOVES,...ENVIRONMENT_MOVES].filter(m=>m&&typeof m==='object'&&!Array.isArray(m));
 assert.ok(moves.length>40);
 for(const m of moves){const a=animationProfile(m);assert.ok(a.family&&a.color&&a.count>0);assert.deepEqual(a,animationProfile(m));}
});
test('all animation families render without relying on browser globals',()=>{
 const ctx={save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},arc(){},ellipse(){},fillRect(){},fill(){}};
 for(const name of ['Healing Remedy','Shield Barrier','Thunder Storm','Sleep Curse','War Dance','Solar Beam','Swarm Barrage','Fault Quake','Vine Snare','Talon Slash','Heavy Impact','Astral Bolt'])assert.doesNotThrow(()=>drawTechnique(ctx,{id:name,name,type:'Fire',kind:'energy',power:50},.5,{x:100,y:200},{x:400,y:100},800,400));
});

test('animation semantics distinguish delivery, recovery, and secondary effects',()=>{
 assert.equal(animationProfile({name:'Soul Leech',power:65,effect:'drain'}).family,'drain');
 assert.equal(animationProfile({name:'Rage Bloom',power:65,category:'Physical',effect:'boostMight'}).family,'impact');
 assert.equal(animationProfile({name:'Monsoon Lance',power:85,effect:'weatherStrike'}).family,'projectile');
 assert.equal(animationProfile({name:'Renewal Bloom',power:0,effect:'heal',target:'ally'}).recipient,'recipient');
 assert.equal(animationProfile({name:'Battle Trance',power:0,effect:'boostMight',target:'self'}).recipient,'caster');
 for(const [name,motif] of [['Hamstring Bite','fang'],['Rivet Shot','gear'],['Lulling Hymn','note'],['Spectral Chains','chain'],['Glacier Lance','crystal'],['Fatebreaker','clock']])assert.equal(animationProfile({name,power:50}).motif,motif);
});

test('every catalog technique has a distinct rendered score across animation phases',async()=>{
 const {allMoveTemplates}=await import('../moves.mjs');const {MOVE_CATALOG}=await import('../engine.mjs');
 const moves=[...new Map([...allMoveTemplates(),...MOVE_CATALOG].map(m=>[m.id,m])).values()],seen=new Map();
 for(const move of moves){const trace=[];const ctx=new Proxy({}, {get:(_,name)=>(...args)=>{assert.ok(args.every(v=>typeof v!=='number'||Number.isFinite(v)),move.name);trace.push([name,...args]);},set:(_,key,value)=>{trace.push([key,value]);return true;}});
  for(const progress of [.15,.4,.7,.9])drawTechnique(ctx,move,progress,{x:100,y:220},{x:650,y:180},900,500);
  const score=JSON.stringify(trace);assert.ok(!seen.has(score),move.name+' duplicates '+seen.get(score));seen.set(score,move.name);
 }
 assert.ok(moves.length>300);
});
test('custom Domains use their affinity palette and frames are invisible at endpoints',async()=>{
 const {registerDomain}=await import('../domains.mjs');registerDomain('Crystal Embers',{affinity:'Fire'});
 assert.equal(animationProfile({id:'custom',name:'New Manifest',domain:'Crystal Embers',power:40}).color,animationProfile({name:'New Manifest',domain:'Fire',power:40}).color);
 const ctx=new Proxy({}, {get(){throw Error('Endpoint must not draw');}});for(const p of [0,1])drawTechnique(ctx,{name:'Test'},p,{x:0,y:0},{x:1,y:1},900,500);
});
