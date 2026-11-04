import test from 'node:test';
import assert from 'node:assert/strict';
import {statusChance,statusDuration,periodicDamage,rebaseStatusTimer} from '../classification-status.mjs';
test('inherent resistance changes status chance and duration',()=>{
 const sp={base:'Construct',alter:'Beast',domains:['Psionic']};
 assert.ok(statusChance(.8,'sleep',sp,{})<.8);
 assert.ok(statusDuration(10000,'sleep',sp,{})<10000);
});
test('acquired Domains grant half chance resistance, no periodic resistance',()=>{
 const sp={base:'Beast',alter:'Giant',domains:[]};
 const acquired={acquiredDomains:['Life']};
 assert.ok(statusChance(.8,'poison',sp,acquired)<.701);
 assert.ok(periodicDamage(100,'poison',sp,acquired)<=100);
});
test('suppression removes inherent resistance immediately',()=>{
 const sp={base:'Beast',alter:'Giant',domains:['Psionic']};
 assert.ok(statusChance(.8,'sleep',sp,{})<statusChance(.8,'sleep',sp,{suppressedDomains:['Psionic']}));
});
test('zero periodic damage remains zero after rounding',()=>{
 const sp={base:'Construct',alter:'Undead',domains:[]};
 assert.equal(periodicDamage(1,'poison',sp,{}),0);
});
test('timer rebasing preserves elapsed time',()=>{
 const sp={base:'Beast',alter:'Giant',domains:[]};
 const timer={appliedAt:1000,baseDuration:10000,until:11000};
 assert.equal(rebaseStatusTimer(timer,4000,'sleep',sp,{}).until,11000);
});
