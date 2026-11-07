import * as E from '../engine.mjs';
import * as RT from '../realtime-combat.mjs';
import * as SE from '../spiritual-energy.mjs';
import * as D from '../difficulty.mjs';
import {generateSupport} from '../support-techniques.mjs';
import {writeFile} from 'node:fs/promises';
const rows=[];
for(const mode of ['easy','normal','hard'])for(const level of [5,20,40,70,100]){
 const save=E.newGame('joint-balance'),sp=E.makeSpecies('joint-balance','Beast','Fey',[]);sp.power=sp.health=60;sp.speed=45;sp.ability='Wildheart';sp.suppressedTypes=['Beast','Fey'];sp.suppressedDomains=[...sp.domains];
 const a=E.heal(E.makeIndividual(sp,level,level>=36?2:level>=16?1:0,E.rng('same')),sp),b=structuredClone(a);b.id='enemy';save.species[sp.id]=sp;save.spirits=[a];save.party=[a.id];save.roamers.one=[{ind:b}];E.applyWorldDifficulty(save,mode);const q=SE.ensureSealer(save),move={id:'reference-strike',name:'Reference strike',power:50,kind:'physical',timing:'gcd',accuracy:1};
 const profile=RT.moveTiming(move,a,sp),scaled={...move,power:profile.power},damage=E.damage(a,sp,b,sp,scaled,'normal',()=>.5),incoming=E.damage(b,sp,a,sp,scaled,'normal',()=>.5),hp=E.stats(a,sp).hp,enemyHP=E.stats(b,sp).hp;
 const mend=generateSupport('reference-mend',{primary:'heal',basic:true}),base=SE.supportQuote(q,mend,a,0),extra=SE.supportQuote(q,mend,a,10);
 rows.push({mode,level,playerHP:hp,enemyHP,balancedHit:damage,incomingHit:incoming,hitsToDefeatEnemy:Math.ceil(enemyHP/damage),enemyHitsToDefeatPlayer:Math.ceil(hp/incoming),referenceSecondsToDefeatEnemy:Number(((Math.ceil(enemyHP/damage)-1)*profile.gcdMs/1000+profile.castMs/1000).toFixed(2)),gcdMs:profile.gcdMs,tonicHP:Math.ceil(hp*.5),tonicHits:Math.round(hp*.5/incoming*10)/10,mendPercent:Math.round(base.technique.effects[0].amount*1000)/10,mendCastMs:base.castMs,mendEnergy:base.cost,mendRecastMs:base.cooldownMs,empoweredMendPercent:Math.round(extra.technique.effects[0].amount*1000)/10,empoweredMendCastMs:extra.castMs,empoweredMendEnergy:extra.cost,caveEncounterChance:E.encounterChance('cave')});
}
await writeFile(new URL('../docs/joint-balance-audit.json',import.meta.url),JSON.stringify({method:'Identical seeded combatants; neutral stats, 50-power GCD scaled by real timing, balanced commitment, no crits/status/AI. These are reference budgets, not observed boss victories.',rows},null,2)+'\n');console.log(JSON.stringify(rows.filter(r=>r.level===20||r.level===70),null,2));
