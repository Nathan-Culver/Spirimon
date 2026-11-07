import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../engine.mjs';
import {normalizeSpeciesDomains,elementOf,fieldAffinities} from '../domains.mjs';
const plain={id:'plain',name:'Plain Strike',type:'Beast',kind:'physical',power:50};
const fate={...plain,id:'fate',domain:'Fate'},spirit={...plain,id:'spirit',domain:'Spirit'},ice={...plain,id:'ice',domain:'Ice'};
const species=domains=>({id:'test',forms:['Test'],base:'Beast',alter:'Fey',domains,health:100,power:50,speed:40,physicalRes:1,spiritualRes:1,moves:[plain],learnset:[plain,fate,spirit,ice]});
const individual=sp=>E.heal(E.makeIndividual(sp,25,0,E.rng(7)),sp);
test('innate Domains survive empty slots and elemental Domains retain their own identities',()=>{
 const sp=species(['Water']);assert.deepEqual(E.activeDomains(sp),['Water']);assert.deepEqual(E.activeDomains(sp,{moveIds:[]}),['Water']);assert.equal(E.effectiveness({domain:'Storm'},sp),1.5);assert.equal(E.effectiveness({domain:'Earth'},sp),.75);
});
test('equipped Domains appear and disappear per individual without mutating the species',()=>{
 const sp=species(['Nature']),ind={moveIds:['plain','fate']},before=structuredClone(sp);assert.deepEqual(E.activeDomains(sp,ind),['Nature','Fate']);
 ind.moveIds=['spirit'];assert.deepEqual(E.activeDomains(sp,ind),['Nature','Spirit']);ind.moveIds=[];assert.deepEqual(E.activeDomains(sp,ind),['Nature']);assert.deepEqual(sp,before);
});
test('legacy names, duplicate sources and unknown Domains reconcile to the agreed catalog',()=>{
 const sp=species(['Water','Fire','Time','Fate','Mind','invalid']);sp.moves=[{domain:'Space'},{domain:'Void'},{domain:'Good'}];
 assert.deepEqual(E.activeDomains(sp),['Water','Fire','Fate','Psionic','Void','Good']);
});
test('unequipped learned Techniques do not supply affinities or passive slots',()=>{
 const sp={...species(['Nature']),moves:[fate]},a={moveIds:['plain']},b={moveIds:['spirit']};assert.deepEqual(E.activeDomains(sp,a),['Nature']);assert.deepEqual(E.activeDomains(sp,b),['Nature','Spirit']);assert.deepEqual(E.activeDomains(sp),['Nature','Fate']);
});
test('actual damage reads the defender individual’s current equipped Domains',()=>{
 const asp=species([]),dsp=species(['Nature']),a=individual(asp),d=individual(dsp),attack={...plain,domain:'Sun'};d.moveIds=['plain'];const baseline=E.damage(a,asp,d,dsp,attack,'normal',()=>.5);
 d.moveIds=['spirit'];dsp.learnset.push({...plain,id:'dark',domain:'Dark'});d.moveIds=['dark'];assert.ok(E.damage(a,asp,d,dsp,attack,'normal',()=>.5)>baseline);d.moveIds=['plain'];assert.equal(E.damage(a,asp,d,dsp,attack,'normal',()=>.5),baseline);
});
test('elemental weather protection survives migration without granting every Nature creature every element',()=>{
 for(const [theme,weather]of [['Ice','snow'],['Earth','sand'],['Metal','sand']]){const sp=species([theme]);normalizeSpeciesDomains(sp);const u=individual(sp);u.moveIds=['plain'];u.battlefield={weather};const hp=u.hp;E.endBattleRound([u],()=>sp);assert.equal(u.hp,hp);assert.deepEqual(sp.domains,[theme]);}
 const sp=species(['Nature']),u=individual(sp);normalizeSpeciesDomains(sp);u.moveIds=['ice'];u.battlefield={weather:'snow'};const hp=u.hp;E.endBattleRound([u],()=>sp);assert.equal(u.hp,hp);u.moveIds=['plain'];E.endBattleRound([u],()=>sp);assert.ok(u.hp<hp);assert.equal(elementOf(sp.learnset.find(m=>m.id==='ice')),'ice');assert.deepEqual(fieldAffinities(sp,u),[]);
});
