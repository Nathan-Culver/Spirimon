import test from 'node:test';
import assert from 'node:assert/strict';
import {anatomyRecord,effectiveFieldDomains,fieldCapabilityAvailable} from '../anatomy.mjs';

const anatomy=anatomyRecord('quadruped',['fur'],{source:'procedural-render',confidence:.95});
const species={anatomy,domains:['Nature'],moves:[],learnset:[{id:'mind',domain:'Psionic'},{id:'gate',domain:'Void'}]};
test('equipped Move Domains qualify for field capabilities without becoming innate',()=>{
 const ind={form:0,moveIds:['mind']};
 assert.deepEqual(effectiveFieldDomains(species,ind),['Nature','Psionic']);
 assert.equal(fieldCapabilityAvailable(species,'teleport',ind),true);
 assert.deepEqual(species.domains,['Nature']);
 assert.equal(fieldCapabilityAvailable(species,'teleport',{moveIds:[]}),false);
});
test('suppressed Domains remove eligibility and restoration restores it',()=>{
 const ind={moveIds:['mind'],suppressedDomains:['Psionic']};
 assert.equal(fieldCapabilityAvailable(species,'teleport',ind),false);
 delete ind.suppressedDomains;
 assert.equal(fieldCapabilityAvailable(species,'teleport',ind),true);
});
test('temporary Domains grant capability and suppression wins over grants',()=>{
 const ind={temporaryDomains:['Void']};
 assert.equal(fieldCapabilityAvailable(species,'teleport',ind),true);
 ind.suppressedDomains=['Void'];
 assert.equal(fieldCapabilityAvailable(species,'teleport',ind),false);
});
test('current Form anatomy is reassessed',()=>{
 const sp={...species,formAnatomy:[anatomy,anatomyRecord('winged',['wings','fly'],{source:'procedural-render',confidence:.95})]};
 assert.equal(fieldCapabilityAvailable(sp,'fly',{form:0}),false);
 assert.equal(fieldCapabilityAvailable(sp,'fly',{form:1}),true);
});
test('status-specific restrictions block only the named capability',()=>{
 const ind={moveIds:['mind'],fieldStatusRestrictions:['teleport']};
 assert.equal(fieldCapabilityAvailable(species,'teleport',ind),false);
 assert.equal(fieldCapabilityAvailable(species,'push',ind),true);
 ind.fieldStatusRestrictions=[];
 assert.equal(fieldCapabilityAvailable(species,'teleport',ind),true);
});
