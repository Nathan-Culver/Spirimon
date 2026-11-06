import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {ROSTER} from '../roster.mjs';
import * as DEX from '../spiridex.mjs';
import {spiridexPage,spiridexDetail} from '../spiridex-view.mjs';

const species=ROSTER.map(row=>({...row,id:'roster-'+row.id}));
function journey(){return {species:Object.fromEntries(species.map(sp=>[sp.id,structuredClone(sp)])),spirits:[],seen:[]};}
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ui={esc,action:(a,label,v='')=>'<button data-action="'+a+'" data-value="'+esc(v)+'">'+label+'</button>',sprite:(sp,n)=>'<canvas data-species="'+esc(sp.id)+'" data-form="'+n+'"></canvas>',chip:t=>'<span>'+esc(t)+'</span>',types:['Beast','Construct','Fey']};
const options=()=>({search:'',status:'all',type:'all',page:0});

test('a new Spiridex has 150 hidden lineages and 450 forms, without exposing preloaded species',()=>{
 const s=journey();s.species.future={id:'future',forms:['Secret','Future','Spoiler']};
 const entries=DEX.spiridexEntries(s,ROSTER);
 assert.equal(entries.length,150);assert.deepEqual(DEX.spiridexSummary(entries),{total:150,seen:0,sealed:0,forms:0,totalForms:450,additional:0});
 assert.equal(DEX.filterSpiridex(entries,{search:ROSTER[0].forms[0]}).length,0);
 assert.equal(DEX.filterSpiridex(entries,{search:'#001'})[0].id,species[0].id);
 assert.equal(DEX.filterSpiridex(entries,{type:'Beast'}).length,0);
 const html=spiridexPage(s,ROSTER,options(),ui);assert.doesNotMatch(html,/<canvas/);assert.doesNotMatch(html,new RegExp(ROSTER[0].forms[0]));
});
test('encounters record the actual form and distinct places, without duplicate progress',()=>{
 const s=journey(),sp=species[3];assert.equal(DEX.recordSpiridexEncounter(s,sp,2,'Mossveil'),true);
 assert.equal(DEX.recordSpiridexEncounter(s,sp,2,'Mossveil'),false);DEX.recordSpiridexEncounter(s,sp,1,'Fen Crossing');
 const row=DEX.spiridexEntries(s,ROSTER)[3];assert.deepEqual(row.seenForms,[1,2]);assert.deepEqual(row.sealedForms,[]);assert.deepEqual(row.places,['Mossveil','Fen Crossing']);assert.deepEqual(s.seen,[sp.id]);
 assert.equal(DEX.filterSpiridex([row],{search:sp.forms[2].toUpperCase()}).length,1);
 assert.equal(DEX.filterSpiridex([row],{search:sp.forms[0]}).length,0,'Unseen form names stay hidden');
});
test('old saves recover discoveries and owned form unlocks, counting each lineage once',()=>{
 const s=journey();s.seen=[species[0].id,ROSTER[0].id,species[1].id];s.spirits=[{species:species[0].id,form:1,appearance:0},{species:species[0].id,form:0,appearance:0}];
 const before=structuredClone(s.spirits),entries=DEX.spiridexEntries(s,ROSTER),row=entries[0];
 assert.deepEqual(row.sealedForms,[0,1]);assert.equal(row.owned,2);assert.equal(DEX.spiridexSummary(entries).seen,2);assert.equal(DEX.spiridexSummary(entries).sealed,1);assert.deepEqual(s.spirits,before);
});
test('sealing history survives trade-away, serialization, reload and cosmetic form changes',()=>{
 let s=journey();s.spirits=[{species:species[0].id,form:1,appearance:1}];DEX.syncSpiridex(s);
 s.spirits[0].form=2;DEX.syncSpiridex(s);s.spirits[0].appearance=0;DEX.syncSpiridex(s);
 s.spirits=[];s=JSON.parse(JSON.stringify(s));const row=DEX.spiridexEntries(s,ROSTER)[0];
 assert.deepEqual(row.sealedForms,[0,1,2]);assert.equal(row.owned,0);assert.equal(row.sealed,true);assert.equal(DEX.filterSpiridex([row],{status:'sealed'}).length,1);
});
test('additional generated lineages appear only after encounters, independently of general-roster totals',()=>{
 const s=journey(),extra={id:'wild-custom',base:'Fey',alter:'Ooze',forms:['Dew <bud>','Dewling','Dew Regent'],domains:['Nature']};s.species[extra.id]=extra;
 assert.equal(DEX.spiridexEntries(s,ROSTER).length,150);DEX.recordSpiridexEncounter(s,extra,0);
 const entries=DEX.spiridexEntries(s,ROSTER);assert.equal(entries.length,151);assert.equal(DEX.spiridexSummary(entries).additional,1);assert.equal(DEX.spiridexSummary(entries).seen,0);
 assert.equal(DEX.filterSpiridex(entries,{search:'nature',status:'seen',type:'Ooze'})[0].id,extra.id);
});
test('malformed legacy records are normalized and form progress never exceeds three',()=>{
 const s=journey(),id=species[0].id;s.spiridex={entries:{[id]:{seenForms:[-1,0,0,2,3,'1'],sealedForms:[0,0,99],places:[null,'Forest','Forest']}}};
 const row=DEX.spiridexEntries(s,ROSTER)[0];assert.deepEqual(row.seenForms,[0,2]);assert.deepEqual(row.sealedForms,[0]);assert.deepEqual(row.places,['Forest']);
});
test('pagination clamps after filtering and detail forms protect unknown artwork and names',()=>{
 const s=journey(),opts=options();opts.page=99;spiridexPage(s,ROSTER,opts,ui);assert.equal(opts.page,6);
 opts.search='not-a-species';const empty=spiridexPage(s,ROSTER,opts,ui);assert.equal(opts.page,0);assert.match(empty,/No matching entries/);
 DEX.recordSpiridexEncounter(s,species[0],1);const row=DEX.spiridexEntries(s,ROSTER)[0],known=spiridexDetail(row,1,ui),hidden=spiridexDetail(row,2,ui);
 assert.ok(known.title.includes(species[0].forms[1]));assert.match(known.body,/data-form="1"/);
 assert.doesNotMatch(hidden.title,new RegExp(species[0].forms[2]));assert.doesNotMatch(hidden.body,/data-form="2"/);assert.match(hidden.body,/NOT YET RECORDED/);
});
test('imported species and encounter-place text is escaped in the guide',()=>{
 const s=journey(),sp={id:'custom',base:'Fey',alter:'Beast',forms:['<img onerror=bad()>','B','C'],description:'<script>bad()</script>',domains:['<svg>'],ability:'<b>bad</b>'};s.species.custom=sp;DEX.recordSpiridexEncounter(s,sp,0,'<script>place</script>');
 const row=DEX.spiridexEntries(s,ROSTER).at(-1),html=spiridexDetail(row,0,ui).body;assert.doesNotMatch(html,/<script>|<img|<svg>|<b>bad/);assert.match(html,/&lt;script&gt;/);
 assert.match(spiridexPage(s,ROSTER,{...options(),status:'seen'},ui),/&lt;img/);
});
test('the real menu and discovery hook expose the guide and record an encountered higher form',()=>{
 const app=readFileSync(new URL('../app.mjs',import.meta.url),'utf8');const start=app.indexOf('function discover('),end=app.indexOf('\nconst npcWander',start);
 const s=journey(),notes=[];const h=vm.createContext({DEX,s,currentRegion:()=>({name:'Highland'}),note:m=>notes.push(m),save(){},sp:species[0]});vm.runInContext(app.slice(start,end)+'\ndiscover(sp,2);discover(sp,2);',h);
 assert.deepEqual(s.spiridex.entries[species[0].id].seenForms,[2]);assert.equal(notes.length,1);
 assert.match(app,/action\('view','SPIRIDEX','spiridex'\)/);assert.match(app,/view==='spiridex'\?spiridexHTML\(\)/);assert.match(app,/discover\(spOf\(enemy\),enemy.appearance\)/);
});
