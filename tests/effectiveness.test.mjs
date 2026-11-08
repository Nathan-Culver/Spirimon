import assert from 'node:assert/strict';
import {test} from 'node:test';
import {TYPES,DOMAINS,DOMAIN_IDENTITY,ADVANTAGE,RESIST,DOMAIN_ADVANTAGE,DOMAIN_RESIST,effectiveness} from '../engine.mjs';
const defender=(base='Beast',alter='Beast',domains=[])=>({base,alter,domains,moves:domains.map(domain=>({domain}))});
test('all 12 creature types have offensive and defensive relationships',()=>{assert.equal(TYPES.length,12);for(const t of TYPES){assert.ok(ADVANTAGE[t]?.length>0,t);assert.ok(RESIST[t]?.length>0,t);}});
test('all 36 established Domains have offensive and defensive relationships',()=>{assert.equal(DOMAINS.length,36);for(const d of DOMAINS){assert.ok(DOMAIN_ADVANTAGE[d]?.length>0,d);assert.ok(DOMAIN_RESIST[d]?.length>0,d);assert.ok(DOMAIN_ADVANTAGE[d]?.length>0,d);assert.ok(DOMAIN_IDENTITY[d],d);}});
test('creature advantage is 2x',()=>assert.equal(effectiveness({type:'Celestial'},defender('Fiend','Beast')),2));
test('creature resistance is 0.75x',()=>assert.equal(effectiveness({type:'Beast'},defender('Construct','Construct')),0.75));
test('duplicate base and alter do not stack',()=>assert.equal(effectiveness({type:'Celestial'},defender('Fiend','Fiend')),2));
test('domain advantages add 100% and resistances subtract 25%',()=>{assert.equal(effectiveness({type:'Beast',domain:'Life'},defender('Aberration','Aberration',['Death'])),2);assert.equal(effectiveness({type:'Beast',domain:'Earth'},defender('Aberration','Aberration',['Life'])),.75);});
test('duplicate domains do not stack',()=>assert.equal(effectiveness({type:'Beast',domain:'Life'},defender('Aberration','Aberration',['Death','Death'])),2));
test('effectiveness is capped between 0.5x and 2x and never immune',()=>{for(const t of TYPES)for(const u of TYPES)for(const d of DOMAINS){const x=effectiveness({type:t,domain:d},defender(u,u,DOMAINS));assert.ok(x>=.5&&x<=2,[t,u,d,x].join(' '));}});

test('domain chart has no contradictory pairings',()=>{for(const a of DOMAINS)for(const d of DOMAINS)assert.ok(!(DOMAIN_ADVANTAGE[a].includes(d)&&DOMAIN_RESIST[d].includes(a)));});
