import test from 'node:test';
import assert from 'node:assert/strict';
import {ensurePassives,passiveEffects,passivePool} from '../classification-passives.mjs';
import {statusChance,statusModifier,rebaseStatusTimer} from '../classification-status.mjs';

test('suppressed innate classifications do not grant passive effects',()=>{
 const sp={id:'passive-suppression',base:'Beast',alter:'Fey',domains:['Life']};
 ensurePassives(sp);
 const hpChoice=c=>passivePool(c).find(p=>p.kind==='maxHp'&&!p.condition);
 for(const c of ['Beast','Fey','Life'])sp.passives[c]=hpChoice(c).id;
 const all=passiveEffects(sp,{hp:100},{maxHp:100});
 assert.equal(all.maxHp,Math.min(.25,['Beast','Fey','Life'].reduce((n,c)=>n+hpChoice(c).amount,0)));
 const limited=passiveEffects(sp,{hp:100,suppressedTypes:['Beast'],suppressedDomains:['Life']},{maxHp:100});
 assert.equal(limited.maxHp,hpChoice('Fey').amount);
});

test('temporary Domains modify status application without stacking with innate Domains',()=>{
 const sp={id:'temporary-domain-status',base:'Beast',alter:'Giant',domains:['Life']};
 const plain=statusModifier('paralysis',sp,{},'application');
 const temporary=statusModifier('paralysis',sp,{temporaryDomains:['Storm']},'application');
 assert.equal(temporary-plain,-.25);
 const innate={...sp,domains:['Life','Storm']};
 assert.equal(statusModifier('paralysis',innate,{temporaryDomains:['Storm']},'application')-statusModifier('paralysis',innate,{},'application'),0);
});

test('status chance always stays in the probability interval',()=>{
 const sp={id:'chance-bounds',base:'Beast',alter:'Giant',domains:['Life']};
 assert.equal(statusChance(.2,'burn',sp,{}, {minimumChance:5}),1);
 assert.equal(statusChance(-1,'burn',sp,{}, {ignoreResistance:true}),0);
 assert.equal(statusChance(5,'burn',sp,{}, {ignoreResistance:true}),1);
});

test('rebasing a legacy timer records an application time and is repeatable',()=>{
 const sp={id:'timer-rebase',base:'Beast',alter:'Giant',domains:['Life']};
 const first=rebaseStatusTimer({until:30},10,'burn',sp,{});
 const second=rebaseStatusTimer(first,12,'burn',sp,{});
 assert.equal(first.appliedAt,10);
 assert.equal(second.until,first.until);
});
