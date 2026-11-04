import test from 'node:test';
import assert from 'node:assert/strict';
import {ensurePassives,passivePool,retrainPassive,passiveEffects} from '../classification-passives.mjs';
test('each innate Type and Domain receives one persistent passive',()=>{
 const sp={id:'unit-passives',base:'Beast',alter:'Fey',domains:['Nature','Spirit']};
 ensurePassives(sp);
 assert.deepEqual(Object.keys(sp.passives),['Beast','Fey','Nature','Spirit']);
 assert.equal(new Set(Object.values(sp.passives)).size,4);
 assert.deepEqual(ensurePassives(sp),sp.passives);
});
test('acquired Domains do not add passive slots',()=>{
 const sp={id:'unit-domains',base:'Beast',alter:'Fey',domains:['Nature']};
 ensurePassives(sp);passiveEffects(sp,{acquiredDomains:['Void']});
 assert.equal(Object.keys(sp.passives).length,3);
});
test('retraining requires eligibility and unlock',()=>{
 const sp={id:'unit-retrain',base:'Beast',alter:'Fey',domains:['Nature']};
 const chosen=passivePool('Beast')[0].id;
 assert.equal(retrainPassive(sp,'Beast',chosen,[]),false);
 assert.equal(retrainPassive(sp,'Beast',chosen,[chosen]),true);
 assert.equal(sp.passives.Beast,chosen);
 assert.equal(retrainPassive(sp,'Void',passivePool('Void')[0].id,[passivePool('Void')[0].id]),false);
});
test('lost innate Domain loses its passive',()=>{
 const sp={id:'unit-change',base:'Beast',alter:'Fey',domains:['Nature']};
 ensurePassives(sp);sp.domains=['Spirit'];ensurePassives(sp);
 assert.equal(sp.passives.Nature,undefined);
 assert.ok(sp.passives.Spirit);
});
