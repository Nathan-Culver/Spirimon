import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../app.mjs',import.meta.url),'utf8');
test('forced challenge dialogs survive backdrop taps and Escape while ordinary dialogs close',async()=>{
 const click=source.split('\n').find(line=>line.startsWith("document.addEventListener('click',async ev=>"));
 const key=source.split('\n').find(line=>line.startsWith("document.addEventListener('keydown',ev=>{const k="));
 for(const modal of ['challenge','welcome','generic']){
  let closed=0;const handlers={};
  const context=vm.createContext({modal,document:{addEventListener:(name,handler)=>handlers[name]=handler},closeModal:()=>closed++});
  vm.runInContext(click.slice(0,click.indexOf('const btn='))+'});',context);
  vm.runInContext(key,context);
  await handlers.click({target:{classList:{contains:()=>true}}});
  handlers.keydown({key:'Escape',target:{tagName:'BUTTON'}});
  assert.equal(closed,modal==='generic'?2:0,modal);
 }
});
