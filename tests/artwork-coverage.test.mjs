import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import * as E from '../engine.mjs';
import {ROSTER} from '../roster.mjs';
const source=readFileSync(new URL('../app.mjs',import.meta.url),'utf8');
const extract=name=>{const start=source.search(new RegExp('(?:async )?function '+name+'\\(')),end=source.slice(start+1).search(/\n(?:async )?function /);assert.ok(start>=0,name);return source.slice(start,end<0?source.length:start+1+end);};
function harness(){
 const state=E.newGame('artwork-coverage'),library=Object.fromEntries(ROSTER.map(row=>{const sp={...E.makeSpecies(row.id,row.base,row.alter,row.domains),...row,id:'roster-'+row.id,proceduralArt:false};return [sp.id,sp];}));state.species={...library};
 const h=vm.createContext({E,ROSTER,s:state,library,structuredClone,battle:null,queue:[],queued:[],buildingSpriteBlocked:()=>false,equipWildItem:u=>u,save(){},register:sp=>{state.species[sp.id]=sp;return sp;},queueFresh:(_reg,_r,_force,sp)=>h.queued.push(sp?.id||'future'),syncCapabilities(){},certifyRenderedAnatomy(){}});
 vm.runInContext(['hasFinishedArtwork','speciesFor','roamerArtworkReady','normalizeWildPopulation','installRoster'].map(extract).join('\n'),h);
 return {h,state,library,eval:code=>vm.runInContext(code,h)};
}
test('new encounters never select unfinished or partial artwork across all 132 ordered type pairs',()=>{
 const t=harness();let checked=0;
 for(const base of E.TYPES)for(const alter of E.TYPES)if(base!==alter){const sp=E.makeSpecies('unfinished-'+base+alter,base,alter);sp.sprites=['diagram0','diagram1','diagram2'];t.library[sp.id]=sp;}
 t.library['partial']={...E.makeSpecies('partial','Beast','Elemental'),id:'partial',proceduralArt:false,sprites:['one','two']};
 for(const base of E.TYPES)for(const alter of E.TYPES)if(base!==alter){
  const modifiers=E.TYPES.filter(type=>type!==base),rolls=[0,(modifiers.indexOf(alter)+.1)/modifiers.length,.95,.1];t.h.reg={biome:{types:[base]}};t.h.r=()=>rolls.shift()??.5;
  const selected=t.eval('speciesFor(reg,r)');assert.ok(t.eval('hasFinishedArtwork(library['+JSON.stringify(selected.id)+'])'));assert.equal(selected.base,base);assert.ok(selected.atlas);checked++;
 }
 assert.equal(checked,132);assert.equal(t.h.queued.length,0,'offline play must not queue impossible image jobs');
});
test('AI discovery plans remain outside encounters until all three finished images exist',()=>{
 const t=harness();t.state.settings.aiEnabled=true;const pending=E.makeSpecies('pending','Beast','Elemental');t.library[pending.id]=pending;
 t.h.reg={biome:{types:['Beast']}},t.h.r=E.rng(7);
 for(let n=0;n<80;n++)assert.notEqual(t.eval('speciesFor(reg,r)').id,pending.id);assert.ok(t.h.queued.length>0);
 pending.sprites=['form0','form1','form2'];pending.proceduralArt=false;pending.visualValidation={status:'vision-verified'};t.state.seen=[pending.id];const rolls=[0,(E.TYPES.filter(type=>type!=='Beast').indexOf('Elemental')+.1)/11,0,0];t.h.r=()=>rolls.shift()??0;
 assert.equal(t.eval('speciesFor(reg,r)').id,pending.id,'a completed lineage becomes discoverable under its own ID');
});
test('saved unfinished roamers retain their IDs and progress while completed encounters backfill once',()=>{
 const t=harness(),sp=E.makeSpecies('saved-unfinished','Beast','Elemental'),ind=E.makeIndividual(sp,9);ind.xp=37;ind.bond=65;t.state.species[sp.id]=sp;
 const saved={id:'saved-roamer',x:26,y:20,ind,active:true};t.state.roamers={'0,0':[saved]};const before=structuredClone(saved);t.state.regions['0,0']={...E.region(t.state.seed,0,0),...E.encounterRange(t.state.seed,0,0,0)};
 t.eval('normalizeWildPopulation()');assert.deepEqual(saved,before);const group=t.state.roamers['0,0'];assert.equal(group.filter(r=>t.h.roamerArtworkReady(r)).length,7);assert.equal(t.h.roamerArtworkReady(saved),false);
 const ids=group.map(r=>r.id);t.eval('normalizeWildPopulation()');assert.deepEqual(t.state.roamers['0,0'].map(r=>r.id),ids);
 sp.atlas='./assets/roster/kilnscale-v4.webp';assert.equal(t.h.roamerArtworkReady(saved),true,'the original saved individual returns when its artwork is completed');assert.equal(saved.ind.id,ind.id);
});
test('finished images recover from the species library without changing owned gameplay records',()=>{
 const t=harness(),sp=E.makeSpecies('same-species','Beast','Elemental'),ind=E.makeIndividual(sp,32);ind.xp=81;ind.bond=91;ind.heldItem={id:'saved-item'};t.state.species[sp.id]=sp;t.state.spirits=[ind];
 t.library[sp.id]={...structuredClone(sp),proceduralArt:false,sprites:['finished0','finished1','finished2'],visualValidation:{status:'vision-verified'}};
 const before=structuredClone(ind),moves=structuredClone(sp.moves),forms=[...sp.forms];t.eval('installRoster()');assert.deepEqual(ind,before);assert.deepEqual(sp.moves,moves);assert.deepEqual(sp.forms,forms);assert.equal(t.h.hasFinishedArtwork(sp),true);assert.deepEqual(sp.sprites,['finished0','finished1','finished2']);
});
test('artwork admission rejects sparse, empty and incomplete form arrays and internal diagrams',()=>{
 const t=harness();for(const sprites of [['a','b'],['a','b',''],['a','b',' '],Object.assign(new Array(3),{0:'a'})])assert.equal(t.h.hasFinishedArtwork({sprites}),false);
 for(const flags of [{proceduralArt:true},{visualValidation:{status:'procedural-verified'}},{visualValidation:{semanticSource:'renderer-geometry'}}])assert.equal(t.h.hasFinishedArtwork({sprites:['a','b','c'],...flags}),false);
 assert.equal(t.h.hasFinishedArtwork({atlas:' '}),false);assert.equal(t.h.hasFinishedArtwork({sprites:['a','b','c']}),true);
});
test('an unfinished legendary encounter reports its state before starting a mystery-sprite battle',()=>{
 const t=harness(),sp=E.makeSpecies('legend','Celestial','Undead');sp.legendary=true;t.h.adventureState=()=>({legends:[]});t.h.legendSite=()=>({...t.state.player});t.h.legendarySpecies=()=>sp;t.h.party=()=>[{hp:1}];t.h.currentRegion=()=>({});t.h.toast=()=>{};t.h.artworkStatusHTML=()=>'<p>Artwork unavailable</p>';let started=0,message='';t.h.startBattle=()=>started++;t.h.showModal=(_title,html)=>message=html;
 vm.runInContext(extract('adventureBattle'),t.h);t.eval("adventureBattle('legend','legend-test',40)");assert.equal(started,0);assert.match(message,/available when its finished artwork is ready/);assert.equal(t.h.battle,null);
});
test('a missing-art legendary binding rite does not offer an Energy-spending ritual stage',()=>{
 const t=harness(),sp=E.makeSpecies('ritual-legend','Celestial','Undead');t.state.sealer={energy:100};t.h.A={legendAt:()=>({id:'legend-test',title:'Ancient presence',available:true})};t.h.adventureState=()=>({legends:[]});t.h.legendSite=()=>({...t.state.player});t.h.legendarySpecies=()=>sp;t.h.legendChallenge=()=>{throw Error('Unexpected fallback');};t.h.isNight=()=>true;t.h.mapWeather=()=>({kind:'rain'});t.h.currentRegion=()=>({});t.h.toast=()=>{};t.h.artworkStatusHTML=()=>'<p>Artwork unavailable</p>';let message='';t.h.showModal=(_title,html)=>message=html;
 vm.runInContext(extract('legendaryRitual'),t.h);t.eval('legendaryRitual()');assert.match(message,/No ritual Energy has been spent/);assert.doesNotMatch(message,/ritual-stage/);assert.equal(t.state.sealer.energy,100);
});
