import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {trialFailurePenalty} from '../spiritual-energy.mjs';

function offeringHarness(){
 const q={energy:100,maxEnergy:100},events={},notices=[];let won=0,failed=0;
 const config={roamer:{offeringAttempted:true},penalizeFailure:kind=>trialFailurePenalty(q,kind),notice:msg=>notices.push(msg),onFailure:()=>failed++,onSuccess:()=>won++};
 const h=vm.createContext({config,document:{addEventListener:(name,fn)=>events[name]=fn},audio:{stopTrial(){}},cancelAnimationFrame(){},requestAnimationFrame(){return 1;},performance,navigator:{maxTouchPoints:0},setTimeout,clearTimeout,setInterval,clearInterval});
 const source=readFileSync(new URL('../offerings.mjs',import.meta.url),'utf8').replace(/^import .*$/gm,'').replace(/^export /gm,'');vm.runInContext(source,h);
 vm.runInContext("session={config,kind:'riddle',stage:'riddle',step:0,plan:{trials:['riddle']},riddle:{answer:0}};installHandlers();",h);
 return {q,h,notices,won:()=>won,failed:()=>failed,answer:n=>events.click({target:{closest:()=>({dataset:{offer:'answer',value:String(n)}})}})};
}

test('riddle penalties use 5% of maximum and other trial penalties use 10%, clamped at zero',()=>{
 const q={energy:100,maxEnergy:100};assert.equal(trialFailurePenalty(q,'riddle').amount,5);assert.equal(q.energy,95);assert.equal(trialFailurePenalty(q,'dance').amount,10);assert.equal(q.energy,85);
 q.maxEnergy=117;assert.equal(trialFailurePenalty(q,'riddle').amount,6);q.energy=3;assert.equal(trialFailurePenalty(q,'sing').amount,3);assert.equal(q.energy,0);assert.equal(trialFailurePenalty(q,'sing').amount,0);
});
test('each actual wrong riddle answer drains Energy and the correct answer does not',()=>{
 const t=offeringHarness();t.answer(1);t.answer(2);assert.equal(t.q.energy,90);assert.equal(t.notices.length,2);assert.match(t.notices[0],/Lost 5 Spiritual Energy/);t.answer(0);assert.equal(t.q.energy,90);assert.equal(t.won(),1);assert.equal(t.failed(),0);
});
test('a failed rhythm trial drains once; later callbacks cannot charge it again',()=>{
 const t=offeringHarness();vm.runInContext("session.kind='dance';fail('The rhythm did not hold.');fail('Late callback');",t.h);assert.equal(t.q.energy,90);assert.equal(t.failed(),1);
});
