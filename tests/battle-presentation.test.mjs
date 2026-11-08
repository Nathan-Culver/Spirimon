import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {techniqueMotion,encounterMusic} from '../battle-presentation.mjs';
import {enemySpeech} from '../npc-dialogue.mjs';
const source=readFileSync(new URL('../app.mjs',import.meta.url),'utf8');
const extract=name=>{const start=source.indexOf('function '+name+'('),next=source.slice(start+1).search(/\n(?:async )?function /);return source.slice(start,next<0?source.length:start+1+next);};
test('both teams advance for damage, retreat for support, shake and return exactly home',()=>{
 for(const side of ['a','b']){const sign=side==='a'?1:-1;
  for(const [move,direction] of [[{power:40},1],[{power:0,effect:'heal'},-1]]){
   assert.ok(techniqueMotion(move,side,120).x*sign*direction>0);
   assert.notEqual(techniqueMotion(move,side,210).x,techniqueMotion(move,side,230).x);
   assert.ok(Math.abs(techniqueMotion(move,side,550).x)<Math.abs(techniqueMotion(move,side,160).x));
   assert.deepEqual(techniqueMotion(move,side,600),{x:0,y:0});
  }
 }
});
test('encounter terrain, night and all dungeons use combat music while interiors remain quiet',()=>{
 for(const options of [{battle:true},{cave:true},{night:true},{tile:'grass'},{tile:'water'}])assert.equal(encounterMusic(options),'battle');
 assert.equal(encounterMusic({interior:true,night:true}),'map');assert.equal(encounterMusic({tile:'path'}),'map');assert.equal(encounterMusic({battle:true,offering:true}),'offering');
});
test('dialogue arcs preserve player answers, faction identity and rematch memories',()=>{
 const s={},n={id:'ashen-hand-watchman',name:'Cinder',faction:'ashen-hand'};
 const before=enemySpeech(s,n,'before');assert.match(before[0],/Ashen|Flame|seals|sanctuary/);
 s.enemyConversations[n.id].branch='curiosity';const opening=enemySpeech(s,n,'start');assert.match(opening.join(' '),/testing/);
 const arc=s.enemyConversations[n.id].arc;const end=enemySpeech(s,n,'end','won');assert.match(end.join(' '),/answer to study/);
 const after=enemySpeech(s,n,'after','won');assert.equal(s.enemyConversations[n.id].arc,arc);assert.notDeepEqual(end,after);
 assert.match(enemySpeech(s,n,'before').join(' '),/Last time you overcame/);
 const arcs=new Set();for(let k=0;k<12;k++){enemySpeech(s,n,'before');arcs.add(s.enemyConversations[n.id].arc);}assert.equal(arcs.size,12);
});
function dialogueHarness(trainer=true){
 const dialogs=[],nodes=[],battle={trainer,dialogueIdentity:{id:'test',name:'Ari'}},s={tutorial:{battleStarted:true}};
 const h=vm.createContext({battle,s,battleDialogue:null,queueMicrotask:fn=>fn(),enemySpeech,sceneFadeUntil:0,performance:{now:()=>0},document:{querySelector:()=>({}),body:{appendChild:n=>nodes.push(n)},addEventListener(){}},showModal:(title,body)=>dialogs.push({title,body}),closeModal(){},save(){},render(){},esc:String,action:(op,text,value)=>`<button data-value="${value}">${text}</button>`,finishSceneFade:n=>{if(n)nodes.push('fade');}});
 vm.runInContext(['queueBattleIntroduction','showBattleDialogue','advanceBattleDialogue','battleClosingDialogue'].map(extract).join('\n'),h);
 return {h,battle,s,dialogs,nodes};
}
test('NPC map introduction branches into battle speech and only then releases the combat gate',()=>{
 const t=dialogueHarness(),map={setAttribute(){},removeAttribute(){},classList:{add(){}},remove(){t.nodes.push('removed');}};
 t.h.queueBattleIntroduction(t.battle,map);assert.equal(t.battle.dialogueGate,true);assert.match(t.dialogs[0].title,/Before/);assert.equal(t.nodes[0],map);
 t.h.advanceBattleDialogue('respect');assert.match(t.dialogs[1].title,/begins/);assert.equal(t.battle.dialogueGate,true);assert.ok(t.nodes.includes('fade'));
 t.h.advanceBattleDialogue('');assert.equal(t.battle.dialogueGate,undefined);assert.equal(t.s.enemyConversations.test.branch,'respect');
});
test('ending speech and the first-battle Menu guide finish before rewards or a return to the map',()=>{
 const t=dialogueHarness(false);let ended=0;
 assert.equal(t.h.battleClosingDialogue('won',()=>ended++),true);assert.equal(ended,0);assert.match(t.dialogs[0].body,/MENU.*TUTORIAL/);
 t.h.advanceBattleDialogue('');assert.equal(ended,1);assert.equal(t.battle.endingDialogueDone,true);assert.equal(t.s.tutorial.menuExplained,true);
});
test('fullscreen attempts startup and retries on the first user gesture',async()=>{
 const events={};let requests=0;const h=vm.createContext({document:{documentElement:{requestFullscreen(){requests++;return Promise.reject(Error('gesture required'));}},addEventListener:(name,fn)=>events[name]=fn}});
 vm.runInContext(extract('requestStartupFullscreen'),h);h.requestStartupFullscreen();assert.equal(requests,1);events.pointerdown();assert.equal(requests,2);await Promise.resolve();
});
test('offering countdown displays the game while inputs remain disabled for three seconds',async()=>{
 const offering=readFileSync(new URL('../offerings.mjs',import.meta.url),'utf8'),start=offering.indexOf('async function visibleCountdown'),buttons=[{disabled:false}],label={setAttribute(){},remove(){this.removed=true;}};
 let timeout,delay;const session={};const h=vm.createContext({session,performance:{now:()=>0},document:{querySelector:()=>({querySelector:()=>({prepend(){}}),querySelectorAll:()=>buttons}),createElement:()=>label},setInterval:()=>1,clearInterval(){},setTimeout:(fn,ms)=>{timeout=fn;delay=ms;}});
 vm.runInContext(offering.slice(start),h);const result=h.visibleCountdown(session);assert.equal(delay,3000);assert.equal(buttons[0].disabled,true);assert.match(label.textContent,/3/);timeout();assert.equal(await result,true);assert.equal(buttons[0].disabled,false);
});
