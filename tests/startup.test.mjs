import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const loader=html.match(/<script>([\s\S]*?)<\/script>/)[1];
function harness(loadGame=()=>new Promise(()=>{})){
 const elements={main:{innerHTML:html.match(/<main[^>]*>([\s\S]*?)<\/main>/)[1],querySelector(selector){return selector==='#startup-panel'&&this.innerHTML.includes('id="startup-panel"')?{}:null;}},'startup-status':{textContent:'Loading game code…'},'startup-help':{textContent:'Your saved journey stays on this device.'},'startup-retry':{hidden:true}};
 const listeners=new Map(),timers=[],calls=[];
 const context={document:{getElementById:id=>elements[id]},window:{setTimeout(fn,ms){const timer={fn,ms};timers.push(timer);return timer;},addEventListener(name,fn){listeners.set(name,fn);}},clearTimeout(timer){timer.cleared=true;},loadModule(path){calls.push(path);return loadGame();}};
 // Substitute only the dynamic import boundary; run the shipped loader and its event handlers.
 vm.runInNewContext(loader.replace("import('./app.mjs')","loadModule('./app.mjs')"),context);
 return {elements,timers,calls,emit:(name,detail)=>listeners.get(name)?.({detail}),emitError:message=>listeners.get('error')?.({message})};
}
test('startup uses the inline game without any module download or fetch preflight',()=>{
 const h=harness();assert.deepEqual(h.calls,[]);assert.doesNotMatch(loader,/\bfetch\(|\bimport\(/);assert.ok(html.includes('id="spirimon-game"'));
 assert.match(h.elements.main.innerHTML,/Loading Spirimon/);
});
test('a slow download stays in loading state and offers retry instead of claiming failure',()=>{
 const h=harness();h.timers[0].fn();assert.match(h.elements['startup-help'].textContent,/taking longer/);assert.equal(h.elements['startup-retry'].hidden,false);
 assert.doesNotMatch(h.elements.main.innerHTML,/could not start/);
});
test('storage initialization reports its current phase and readiness cancels the slow timer',()=>{
 const h=harness();h.emit('spirimon-startup','Reading saved Spirimon…');assert.equal(h.elements['startup-status'].textContent,'Reading saved Spirimon…');
 h.elements.main.innerHTML='<canvas id="world"></canvas>';h.emit('spirimon-ready');assert.equal(h.timers[0].cleared,true);h.timers[0].fn();assert.equal(h.elements.main.innerHTML,'<canvas id="world"></canvas>');
});
test('actual script failures show escaped diagnostic text without deleting saved data',()=>{
 const h=harness();h.emitError('Invalid <script>');assert.match(h.elements.main.innerHTML,/Invalid &lt;script&gt;/);assert.match(h.elements.main.innerHTML,/saved journey has not been erased/);
});
test('actual save initialization errors are surfaced and cannot be overwritten by the slow timer',()=>{
 const h=harness();h.emit('spirimon-startup-error','Save could not be opened');const error=h.elements.main.innerHTML;assert.match(error,/Save could not be opened/);h.timers[0].fn();assert.equal(h.elements.main.innerHTML,error);
});
test('the inline page includes every transitive browser module',()=>{
 const modules=html.match(/<meta name="spirimon-modules" content="([^"]+)">/)[1].split(','),checked=new Set(),queue=['./app.mjs'];
 while(queue.length){const path=queue.pop();if(checked.has(path))continue;checked.add(path);assert.ok(modules.includes(path.slice(2)),path+' missing from inline bundle');
  const module=readFileSync(new URL('../'+path.slice(2),import.meta.url),'utf8');for(const m of module.matchAll(/^import .*?from ['"]([^'"]+)['"]/gm))queue.push(m[1]);
 }
 assert.equal(checked.size,modules.length);assert.ok(checked.size>=17);assert.doesNotMatch(html,/<script[^>]+(?:type="module"|src=)|type="importmap"/);
});
