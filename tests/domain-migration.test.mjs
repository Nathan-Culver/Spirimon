import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../engine.mjs';
import * as CP from '../classification-passives.mjs';
import * as Q from '../equipment.mjs';
import * as SE from '../spiritual-energy.mjs';
import {DOMAINS,DOMAIN_ALIASES,normalizeMoveDomains,fieldAffinities} from '../domains.mjs';
import {ROSTER} from '../roster.mjs';
import {LEGENDS} from '../legendary-roster.mjs';
import {generateSupport} from '../support-techniques.mjs';
import {spiritualDefense} from '../spiritual-core.mjs';
import {allMoveTemplates} from '../moves.mjs';
import {fieldCapabilityAvailable} from '../anatomy.mjs';
test('every active catalog, generated support, item and clan uses the agreed nine Domains',async()=>{
 assert.deepEqual(DOMAINS,['Life','Death','Fate','Void','Spirit','Psionic','Nature','Storm','Magic']);
 const {CLANS}=await import('../adventure-systems.mjs');for(const sp of [...ROSTER,...LEGENDS])assert.ok(sp.domains.every(d=>DOMAINS.includes(d)));
 for(const clan of CLANS)assert.ok(DOMAINS.includes(clan.domain));
 for(let seed=0;seed<250;seed++){const sp=E.makeSpecies(seed),item=Q.generateHeldItem(seed),t=generateSupport(seed,{level:40});assert.ok(sp.domains.every(d=>DOMAINS.includes(d)));assert.ok(DOMAINS.includes(item.domain));assert.ok(DOMAINS.includes(item.active.domain));if(t.requires?.domain)assert.ok(DOMAINS.includes(t.requires.domain));for(const e of t.effects)if(e.domain)assert.ok(DOMAINS.includes(e.domain));}
 for(const move of allMoveTemplates())if(move.domain)assert.ok(DOMAINS.includes(move.domain),move.id);
});
test('legacy elemental Techniques keep IDs, names, learning progress, weather flavor and field eligibility',()=>{
 const move={id:'domain-water-0',name:'Old family wave',domain:'Water',type:'Beast',kind:'spiritual',power:35,accuracy:1},sp=E.makeSpecies('legacy','Beast','Giant',['Water','Fire','Time','Space','Mind']);sp.moves=[move];sp.learnset=[move];sp.moveRevision=5;
 const u=E.heal(E.makeIndividual(sp,25,0,E.rng(42)),sp);u.moveIds=[move.id];u.unlockedMoves=[move.id];u.moveCooldowns={[move.id]:19000};u.xp=37;u.bond=82;u.hp=3;const s=E.newGame('old');s.species[sp.id]=sp;s.spirits=[u];s.party=[u.id];
 E.refreshTechniques(sp);E.migrateSaveCreatures(s);assert.deepEqual(sp.domains,['Nature','Fate','Void','Psionic']);assert.equal(move.domain,'Nature');assert.equal(move.domainTheme,'Water');assert.equal(move.element,'water');assert.equal(move.name,'Old family wave');assert.deepEqual(u.moveIds,['domain-water-0']);assert.deepEqual(u.unlockedMoves,['domain-water-0']);assert.equal(u.moveCooldowns[move.id],19000);assert.equal(u.hp,3);assert.equal(u.bond,82);assert.equal(u.xp,37);assert.ok(fieldAffinities(sp,u).includes('water'));assert.ok(fieldCapabilityAvailable(sp,'swim',u));assert.ok(sp.learnset.some(m=>m.id==='domain-nature-0'));
 const first=JSON.stringify(s);E.refreshTechniques(sp);E.migrateSaveCreatures(s);assert.equal(JSON.stringify(s),first);
});
test('merged passive slots retain valid trained choices and canonical choices take precedence without losing unlocks',()=>{
 const sp={id:'merged',base:'Plant',alter:'Fey',domains:['Nature','Fire','Water','Time']},u={passives:{Fire:'fire-clarity',Water:'water-vigor',Nature:'nature-resolve',Time:'time-clarity',Plant:'plant-endurance'},unlockedPassives:['fire-clarity','water-vigor','nature-resolve','time-clarity']};
 CP.ensureIndividualPassives(sp,u);assert.deepEqual(Object.keys(u.passives).sort(),['Fate','Fey','Nature','Plant']);assert.equal(CP.passivePool('Nature').find(p=>p.id===u.passives.Nature)?.kind,'statusResistance');assert.equal(CP.passivePool('Fate').find(p=>p.id===u.passives.Fate)?.kind,'accuracy');assert.ok(u.unlockedPassives.includes(u.passives.Nature));assert.ok(u.unlockedPassives.length>=4);
});
test('legacy aliases remain functional for equipped items, guard effects and temporary elemental field abilities',()=>{
 const sp=E.makeSpecies('requirements','Beast','Giant',['Nature']);assert.equal(Q.canEquipHeldItem({requires:{domains:['Fire']}},sp).ok,true);
 assert.equal(spiritualDefense({spiritualBuffs:[{kind:'guard',domain:'Water',amount:.2,until:500}]},{domain:'Nature'},'Energy',1),.8);
 const a={...sp,domains:[],elementalAffinities:[],moves:[],learnset:[],anatomy:{bodyPlan:'biped',traits:[],strength:1}};assert.ok(fieldAffinities(a,{temporaryDomains:[{domain:'Air',until:500}],realtimeNow:1}).includes('air'));assert.deepEqual(fieldAffinities(a,{temporaryDomains:[{domain:'Air',until:500}],realtimeNow:501}),[]);
 const s=E.newGame('support-save'),q=SE.ensureSealer(s),t=generateSupport('legacy',{primary:'guard',basic:true});t.effects[0].domain='Fire';q.known[t.id]=t;SE.ensureSealer(s);assert.equal(q.known[t.id].effects[0].domain,'Nature');
 for(const [legacy,next]of Object.entries(DOMAIN_ALIASES)){const m=normalizeMoveDomains({domain:legacy});assert.equal(m.domain,next);}
});
