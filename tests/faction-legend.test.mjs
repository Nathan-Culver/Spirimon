import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync,existsSync} from 'node:fs';
import * as E from '../engine.mjs';
import * as A from '../adventure-systems.mjs';
import * as FC from '../faction-campaigns.mjs';
import * as SE from '../spiritual-energy.mjs';
import * as SW from '../spiritual-world.mjs';
import {LEGENDS,applyLegendArtwork,legendProfile} from '../legendary-roster.mjs';
import {regionalLegendSite} from '../legend-sites.mjs';
import {battleBackSource} from '../battle-art.mjs';
import {decodeSavePayload} from '../save-files.mjs';
import {capabilitiesFromAnatomy,syncCapabilities} from '../anatomy.mjs';
const source=readFileSync(new URL('../app.mjs',import.meta.url),'utf8');
function extract(name){const a=source.indexOf('function '+name+'('),b=source.slice(a+1).search(/\nfunction /);assert.ok(a>=0);return source.slice(a,b<0?source.length:a+1+b);}
const key=(x,y)=>x+','+y;
function reachable(map,objects=[]){const seen=new Set(),queue=[[1,1]],blocked=new Set(objects.map(o=>key(o.x,o.y)));for(let i=0;i<queue.length;i++){const [x,y]=queue[i],k=key(x,y);if(seen.has(k)||!E.caveWalkable(map,x,y)||blocked.has(k))continue;seen.add(k);for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]])queue.push([x+dx,y+dy]);}return seen;}
test('all three four-floor compounds have reachable clues, guards, mechanisms and exits without a field ability',()=>{
 for(const faction of A.FACTIONS)for(let floor=0;floor<4;floor++){
  const {map,features,objects}=FC.layout('physical-campaign',faction.id,floor),seen=reachable(map,objects);
  assert.ok(seen.has(key(23,17)),faction.id+' exit '+floor);
  for(const f of features)assert.ok([[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>seen.has(key(f.x+dx,f.y+dy))),f.name);
 }
});
test('physical objectives gate every descent; cache rewards and guard wins persist across reload',()=>{
 let save=E.newGame('factions');save.adventure={bosses:[]};
 for(const faction of A.FACTIONS)for(let floor=0;floor<4;floor++){
  const features=FC.layout(save.seed,faction.id,floor).features;assert.ok(!FC.canAdvance(save,faction.id,floor));
  const guard=features.find(f=>f.kind==='faction-guard'||f.kind==='faction-leader');
  if(floor===0||floor===2)assert.ok(!FC.interact(save,faction.id,floor,guard).battle);
  const supplies=features.filter(f=>f.kind==='faction-supply');if(supplies.length)assert.match(FC.interact(save,faction.id,floor,supplies[0]).message,/locked/);
  if(floor===2){const sigil=features.find(f=>f.kind==='faction-sigil');assert.match(FC.interact(save,faction.id,floor,sigil).message,/inscription/);}
  for(const f of features.filter(f=>!['faction-guard','faction-leader'].includes(f.kind)))FC.interact(save,faction.id,floor,f);
  const encounter=FC.interact(save,faction.id,floor,guard).battle;assert.ok(encounter);assert.ok(encounter.maxActive<=3);FC.recordVictory(save,encounter.kind,encounter.id);
  assert.ok(FC.canAdvance(save,faction.id,floor));const before=JSON.stringify(save.inventory);for(const f of supplies)FC.interact(save,faction.id,floor,f);assert.equal(JSON.stringify(save.inventory),before);
  save=decodeSavePayload({format:'spirimon-backup',version:1,save,library:[]}).save;assert.ok(FC.canAdvance(save,faction.id,floor));
 }
 assert.ok(A.FACTIONS.every(f=>FC.campaign(save,f.id).complete));
});
test('incorrect sigil order resets the array; completed legacy campaigns remain completed',()=>{
 const s=E.newGame('sigils'),id=A.FACTIONS[0].id,features=FC.layout(s.seed,id,2).features;
 FC.interact(s,id,2,features.find(f=>f.kind==='faction-inscription'));const sigils=features.filter(f=>f.kind==='faction-sigil');
 FC.interact(s,id,2,sigils[0]);FC.interact(s,id,2,sigils[2]);assert.equal(FC.floorState(s,id,2).sigilStep,0);assert.equal(FC.canAdvance(s,id,2),false);
 s.adventure={bosses:[id]};assert.equal(FC.campaign(s,id).complete,true);
});
test('camp sites are stable, separated and leave an accessible approach outside Shrine interaction range',()=>{
 for(let n=0;n<12;n++){
  const s=E.newGame('camp-'+n);for(const f of A.FACTIONS){const point=FC.site(s,f.id);assert.deepEqual(FC.site(s,f.id),point);assert.ok(FC.campFootprintBlocked(s,point.x,point.y));assert.ok(!FC.campFootprintBlocked(s,point.x,point.y-1));assert.ok(E.walkable(E.tile(s.seed,point.x,point.y+1)));for(const shrine of SW.shrinesForRegion(s.seed,point.cx,point.cy))assert.ok(Math.abs(shrine.x-point.x)+Math.abs(shrine.y-point.y)>=5);}
  const sites=FC.knownSites(s);assert.equal(sites.length,3);assert.equal(new Set(sites.map(p=>key(p.x,p.y))).size,3);
 }
});
test('all four legendary lineages have three finished front/rear forms with verified field anatomy',()=>{
 for(const profile of LEGENDS){const sp=applyLegendArtwork(E.makeSpecies(profile.key,profile.base,profile.alter,profile.domains),profile);assert.equal(sp.legendary,true);assert.ok(!sp.proceduralArt);for(let form=0;form<3;form++){const rear=battleBackSource(sp,form);assert.deepEqual(rear.frame,[form*256,0,256,256]);for(const path of [sp.atlas,rear.source])assert.ok(existsSync(new URL('../'+path,import.meta.url)));assert.equal(capabilitiesFromAnatomy(sp.formAnatomy[form],profile.domains).verified,true);}}
});
function ritualHarness(){
 const save=E.newGame('SP-461998'),cx=-7,cy=-4,site=regionalLegendSite(save.seed,cx,cy);save.player={...save.player,...site};SE.ensureSealer(save);save.sealer.energy=save.sealer.maxEnergy;save.adventure={legends:[],encounters:{}};
 const legend=A.legendAt(save.seed,cx,cy,true,'rain');assert.ok(legend);const events=[];
 const h=vm.createContext({E,A,SE,s:save,battle:null,party:()=>[{hp:1}],isNight:()=>true,mapWeather:()=>({kind:'rain'}),legendSite:(x,y)=>regionalLegendSite(save.seed,x,y),adventureState:()=>save.adventure,encounterState:()=>save.adventure.encounters,legendaryRitual:()=>events.push('rite'),adventureBattle:(...args)=>events.push(args),toast:t=>events.push(t),render(){events.push('refreshed');},save(){}});
 vm.runInContext(['legendChallenge','performLegendaryRitualStage'].map(extract).join('\n'),h);return {save,h,events,legend};
}
test('legendary Energy and battle access require the physical site, matching rite and current conditions',()=>{
 const {save,h,events,legend}=ritualHarness(),id='ritual-'+legend.id,before=save.sealer.energy;
 h.performLegendaryRitualStage('ritual-wrong');assert.equal(save.sealer.energy,before);
 save.player.x+=10;h.performLegendaryRitualStage(id);assert.equal(save.sealer.energy,before);h.legendChallenge();assert.equal(events.at(-1),'rite');save.player.x-=10;
 h.legendChallenge();assert.equal(events.at(-1),'rite');
 for(let n=0;n<3;n++)h.performLegendaryRitualStage(id);assert.equal(save.adventure.encounters[id],3);assert.ok(save.sealer.energy<before);assert.equal(events.filter(e=>e==='refreshed').length,3);const paid=save.sealer.energy;h.performLegendaryRitualStage(id);assert.equal(save.sealer.energy,paid);
 h.mapWeather=()=>({kind:'clear'});if(legend.requiresWeather)h.legendChallenge();h.mapWeather=()=>({kind:'rain'});h.legendChallenge();assert.deepEqual(Array.from(events.at(-1)),['legend',legend.id,legend.level]);
});
test('a simultaneous knockout restores at a real, consumed Shrine and awards no victory rewards',()=>{
 const save=E.newGame('draw-recovery'),sp=E.makeSpecies(1,'Beast','Construct'),u=E.makeIndividual(sp,3,0);save.species[sp.id]=sp;save.spirits=[u];save.party=[u.id];SE.ensureSealer(save);u.hp=0;save.cave={id:'old-cave'};let dialog='';
 const h=vm.createContext({s:save,SW,SE,battle:{},recordCompetitionDefeat(){},endCombatState(){SE.endSealerBattle(save.sealer);},save(){},render(){},showModal:(_title,body)=>dialog=body,action:()=>''});vm.runInContext(['recoverAtShrine','drawnBattle'].map(extract).join('\n'),h);h.drawnBattle();assert.ok(u.hp>0);const shrine=SW.nearbyShrine(save);assert.ok(shrine);assert.equal(SE.recoveryAvailable(save,'restore',shrine.id).ok,false);assert.equal(save.cave,undefined);assert.match(dialog,/no victory reward/);
});

test('an overcome legend can be retried for sealing; a bonded regional legend cannot be duplicated',()=>{
 const {save,h,events,legend}=ritualHarness();save.adventure.encounters['ritual-'+legend.id]=3;save.adventure.legends.push(legend.id);
 h.legendChallenge();assert.deepEqual(Array.from(events.at(-1)),['legend',legend.id,legend.level]);
 save.spirits.push({species:'legendary-'+legend.id});h.legendChallenge();assert.match(events.at(-1),/already formed/);
});

test('the cave renderer keeps faction chapter names and current clue progress instead of overwriting them',()=>{
 const s=E.newGame('labels'),room={faction:'ashen-hand',level:0,depth:4},h=vm.createContext({FC,A,s});vm.runInContext(extract('dungeonInfo'),h);
 assert.match(h.dungeonInfo(room).label,/Scout trail/);assert.match(h.dungeonInfo(room).biome,/ASHEN HAND/);assert.match(h.dungeonInfo(room).hint,/0\/3/);
 FC.floorState(s,'ashen-hand',0).clues.push(0);assert.match(h.dungeonInfo(room).hint,/1\/3/);assert.match(h.dungeonInfo({level:1,depth:3}).label,/Cave/);
});


test('the actual default legendary rite uses bundled artwork without requiring an image provider',()=>{
 const {save,h}=ritualHarness();save.settings.aiEnabled=false;let html='';
 Object.assign(h,{legendProfile,applyLegendArtwork,syncCapabilities,register:sp=>{E.refreshTechniques(sp);save.species[sp.id]=sp;return sp;},hasFinishedArtwork:sp=>!!sp.atlas,queueFresh:()=>{throw Error('Default legends must not request generated artwork');},action:(_a,label)=>label,showModal:(_title,body)=>html=body});
 vm.runInContext(['legendarySpecies','legendaryRitual'].map(extract).join('\n'),h);h.legendaryRitual();assert.match(html,/Complete ritual stage/);assert.doesNotMatch(html,/artwork is ready/);const sp=Object.values(save.species)[0];assert.ok(sp.atlas.startsWith('./assets/legends/'));assert.ok(sp.battleBackAtlas);
});
