import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import * as E from '../engine.mjs';
import * as A from '../adventure-systems.mjs';
const source=readFileSync(new URL('../app.mjs',import.meta.url),'utf8');
const extract=name=>{const a=source.indexOf('function '+name+'('),b=source.slice(a+1).search(/\n(?:async )?function /);assert.ok(a>=0,name);return source.slice(a,b<0?source.length:a+1+b);};
function harness(){
 const s=E.newGame('entry-conditions');s.adventure={crests:[],bosses:[],legends:[],champion:false};A.competitionState(s.adventure);let html='',title='',started=0;const toasts=[];
 const h=vm.createContext({E,A,s,battle:null,Date,party:()=>s.spirits.filter(u=>s.party.includes(u.id)),adventureState:()=>s.adventure,currentTemple:()=>({name:'First Temple',philosophy:'Patience',sequence:0,level:8}),esc:String,action:(name,label,value='')=>'<button data-action="'+name+'" data-value="'+value+'">'+label+'</button>',showModal:(t,body)=>{title=t;html=body;},toast:t=>toasts.push(t),prepareCompetitionBattle:()=>started++,save(){},render(){}});
 vm.runInContext(['competitionPartyLevel','battleFacility','guildTrialsMenu','templeInterior','multiArenaMenu','startGuildTrial','startFacilityMatch'].map(extract).join('\n'),h);
 return {h,s,toasts,html:()=>html,title:()=>title,started:()=>started,add(level=3,hp=10){const u={id:'party-'+s.spirits.length,level,hp};s.spirits.push(u);s.party.push(u.id);return u;}};
}
test('facility previews match actual first, resumed and restarted matches without changing saved progress',()=>{
 for(const facility of A.FACILITY_TYPES){
  const a={crests:[]};const before=JSON.stringify(a),preview=A.previewFacilityMatch(a,facility.id,73.2,'preview',5);assert.equal(JSON.stringify(a),before);
  A.beginFacilityRun(a,facility.id,'preview',5);assert.deepEqual(preview,A.facilityMatch(a,facility.id,73.2));assert.ok(preview.level>=74);
  A.recordFacilityResult(a,facility.id,true);const active=JSON.stringify(a);assert.deepEqual(A.previewFacilityMatch(a,facility.id,4,'preview',99),A.facilityMatch(a,facility.id,4));assert.equal(JSON.stringify(a),active);
  A.recordFacilityResult(a,facility.id,false);const restart=A.previewFacilityMatch(a,facility.id,4,'preview',99);A.beginFacilityRun(a,facility.id,'preview',99);assert.deepEqual(restart,A.facilityMatch(a,facility.id,4));
 }
});
test('empty and unconscious parties receive explicit facility entry guidance and cannot start a run',()=>{
 const t=harness();t.h.battleFacility();assert.match(t.html(),/No Guild rank or Crest minimum/);assert.match(t.html(),/conscious/);assert.doesNotMatch(t.html(),/data-action="facility-battle"/);
 t.h.startFacilityMatch('arena');assert.equal(t.started(),0);assert.equal(Object.keys(t.s.adventure.facilityRuns).length,0);assert.match(t.toasts.at(-1),/conscious/);
 t.add(3,0);t.h.battleFacility();assert.doesNotMatch(t.html(),/data-action="facility-battle"/);
});
test('facility cards show the actual scaled level, format and restrictions instead of a lower teaser level',()=>{
 const t=harness();t.add(65);t.h.battleFacility();const c=A.previewFacilityMatch(t.s.adventure,'arena',65,t.s.seed,Math.floor(Date.now()/(7*24*60*60*1000)));
 assert.match(t.html(),new RegExp('Next opponent level '+c.level));assert.match(t.html(),/Team of 2/);assert.match(t.html(),/Up to 1 manifested per side/);assert.match(t.html(),/Consumables prohibited/);assert.match(t.html(),/choose 1 of your 1 attuned/);assert.doesNotMatch(t.html(),/undefined/);
});
test('Guild menus distinguish rank locks, recommended levels and maximum active count',()=>{
 const t=harness();t.add();t.h.guildTrialsMenu();assert.match(t.html(),/Recommended level 12\+/);assert.match(t.html(),/Locked: reach Guild rank 2/);assert.match(t.html(),/maximum, not a minimum party size/);
 assert.match(t.html(),/data-value="discipline"/);assert.doesNotMatch(t.html(),/data-value="cooperation"/);
 t.s.rank=2;t.h.guildTrialsMenu();assert.match(t.html(),/data-value="cooperation"/);t.h.startGuildTrial('cooperation');assert.equal(t.started(),1,'A single conscious companion may enter a format permitting up to two');
 t.s.spirits[0].hp=0;t.h.startGuildTrial('discipline');assert.equal(t.started(),1);assert.match(t.toasts.at(-1),/conscious/);
});
test('Temple exploration remains open while its battle preparation and Master roster are explicit',()=>{
 const t=harness();t.h.templeInterior();assert.match(t.html(),/without a Guild rank minimum/);assert.match(t.html(),/recommendation, not an entry lock/);assert.match(t.html(),/Master level 8/);assert.match(t.html(),/Master team of 3/);assert.match(t.html(),/data-action="temple-map-enter"/);
});
test('the multi arena previews six opponents and requires a separate intentional entry action',()=>{
 const t=harness();t.add();t.h.multiArenaMenu();const c=A.multiArenaProfile(t.s.rank);assert.match(t.html(),new RegExp('levels '+c.minLevel+'–'+c.maxLevel));assert.match(t.html(),/Opposing team: 6/);assert.match(t.html(),/Up to 3 manifested/);assert.match(t.html(),/multi-arena-fight/);assert.equal(t.started(),0);
 assert.match(source,/case'multi-arena':multiArenaMenu\(\);break;/);assert.match(source,/case'multi-arena-fight':multiArena\(\);break;/);
});

test('championship qualification exposes all three requirements to early players without opening a run',()=>{
 const t=harness();vm.runInContext(extract('championshipMenu'),t.h);t.h.championshipMenu();assert.match(t.html(),/0\/8/);assert.match(t.html(),/Guild rank 4/);assert.match(t.html(),/0\/3/);assert.equal(t.s.adventure.championship,undefined);assert.doesNotMatch(t.html(),/championship-fight/);
});
