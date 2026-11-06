import test from 'node:test';
import assert from 'node:assert/strict';
import {activeDomains,damage,effectiveness,endBattleRound,heal,makeIndividual,rng} from '../engine.mjs';

const plain={id:'plain',name:'Plain Strike',type:'Beast',kind:'physical',power:50,speed:0};
const fire={...plain,id:'fire',domain:'Fire'};
const ice={...plain,id:'ice',domain:'Ice'};
const water={...plain,id:'water',domain:'Water'};
const species=domains=>({id:'test',forms:['Test'],base:'Beast',alter:'Fey',domains,health:100,power:50,speed:40,physicalRes:1,spiritualRes:1,moves:[plain],learnset:[plain,fire,ice,water]});
const individual=sp=>heal(makeIndividual(sp,25,0,rng(7)),sp);

test('assigned Domains remain active with Domain-free Techniques or no Techniques',()=>{
 const sp=species(['Water']);assert.deepEqual(activeDomains(sp),['Water']);
 assert.deepEqual(activeDomains(sp,{moveIds:['plain']}),['Water']);
 assert.deepEqual(activeDomains({...sp,moves:[]}),['Water']);
 assert.equal(effectiveness({domain:'Lightning'},sp),1.5);
 assert.equal(effectiveness({domain:'Fire'},sp),.75);
});

test('equipped Techniques add temporary Domains and replacement removes only the temporary affinity',()=>{
 const sp=species(['Water']),ind={moveIds:['plain','fire']},before=structuredClone(sp);
 assert.deepEqual(activeDomains(sp,ind),['Water','Fire']);
 ind.moveIds=['plain','ice'];assert.deepEqual(activeDomains(sp,ind),['Water','Ice']);
 ind.moveIds=['plain'];assert.deepEqual(activeDomains(sp,ind),['Water']);
 assert.deepEqual(sp,before,'Combat affinity must not mutate species or learnsets');
});

test('assigned, Technique and legacy-alias Domains are canonicalized and counted once',()=>{
 const sp=species(['Water','Time','Fate','Mind','invalid']);sp.moves=[water,water,{...plain,domain:'Fate'},{...plain,domain:'Psionic'},plain];
 assert.deepEqual(activeDomains(sp),['Water','Fate','Psionic']);
 assert.equal(effectiveness({domain:'Lightning'},{...sp,domains:['Water','Water'],moves:[water,water]}),1.5);
});

test('unequipped known Techniques and other individuals do not supply combat Domains',()=>{
 const sp={...species(['Water']),moves:[fire]},a={moveIds:['plain']},b={moveIds:['ice']};
 assert.deepEqual(activeDomains(sp,a),['Water']);assert.deepEqual(activeDomains(sp,b),['Water','Ice']);
 assert.deepEqual(activeDomains(sp),['Water','Fire']);assert.deepEqual(activeDomains(sp,a),['Water']);
});

test('actual damage retains assigned affinity and uses the defender individual’s current equipped Techniques',()=>{
 const asp=species([]),dsp={...species(['Water']),moves:[fire]},a=individual(asp),d=individual(dsp);
 d.moveIds=['plain'];const lightning={...plain,id:'lightning',domain:'Lightning'};
 const neutral=damage(a,asp,d,{...dsp,domains:[]},lightning,'normal',()=>.5);
 assert.ok(damage(a,asp,d,dsp,lightning,'normal',()=>.5)>neutral);
 const waterAttack={...plain,id:'water-attack',domain:'Water'},withoutFire=damage(a,asp,d,dsp,waterAttack,'normal',()=>.5);
 d.moveIds=['fire'];assert.ok(damage(a,asp,d,dsp,waterAttack,'normal',()=>.5)>withoutFire);
 d.moveIds=['plain'];assert.equal(damage(a,asp,d,dsp,waterAttack,'normal',()=>.5),withoutFire);
});

test('weather protection uses innate Domains plus temporary equipped-Technique Domains',()=>{
 for(const [domain,weather]of [['Ice','snow'],['Earth','sand'],['Metal','sand']]){
  const sp=species([domain]),ind=individual(sp);ind.moveIds=['plain'];ind.battlefield={weather};
  const hp=ind.hp;endBattleRound([ind],()=>sp);assert.equal(ind.hp,hp,domain+' innate protection must survive move replacement');
 }
 const sp=species(['Water']),ind=individual(sp);ind.moveIds=['ice'];ind.battlefield={weather:'snow'};
 const hp=ind.hp;endBattleRound([ind],()=>sp);assert.equal(ind.hp,hp);
 ind.moveIds=['plain'];endBattleRound([ind],()=>sp);assert.ok(ind.hp<hp);assert.deepEqual(activeDomains(sp,ind),['Water']);
});
