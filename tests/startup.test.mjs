import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8'),loader=html.match(/<script>([\s\S]*?)<\/script>/)[1];
function harness(){
 const elements={main:{innerHTML:html.match(/<main[^>]*>([\s\S]*?)<\/main>/)[1],querySelector(selector){return selector==='#startup-panel'&&this.innerHTML.includes('id="startup-panel"')?{}:null;}},'startup-status':{textContent:'Connecting to game code…'},'startup-help':{textContent:'Your saved journey stays on this device.'},'startup-retry':{hidden:true}};
 const listeners=new Map(),timers=[],scripts=[],navigations=[];
 const context={URL,Date,document:{baseURI:'https://nathan-culver.github.io/Spirimon/',getElementById:id=>elements[id],createElement:()=>({remove(){this.removed=true;}}),head:{appendChild:s=>scripts.push(s)}},location:{href:'https://nathan-culver.github.io/Spirimon/?playtest=qa',replace:url=>navigations.push(url)},window:{setTimeout(fn,ms){const timer={fn,ms};timers.push(timer);return timer;},addEventListener(name,fn){listeners.set(name,fn);}},clearTimeout(timer){timer.cleared=true;}};
 vm.runInNewContext(loader,context);
 return {elements,timers,scripts,context,navigations,emit:(name,detail)=>listeners.get(name)?.({detail}),emitError:message=>listeners.get('error')?.({message}),run(ms){const timer=timers.find(t=>t.ms===ms&&!t.cleared&&!t.used);assert.ok(timer,'Expected timer '+ms);timer.used=true;timer.fn();}};
}
test('slow startup offers retry without claiming failure',()=>{
 const h=harness();h.run(12000);assert.match(h.elements['startup-help'].textContent,/taking longer/);assert.equal(h.elements['startup-retry'].hidden,false);assert.doesNotMatch(h.elements.main.innerHTML,/could not start/);
});
test('one classic bundle starts without module preflight and stalled downloads retry fresh URLs',()=>{
 const h=harness();h.context.window.spirimonLoadGame('./game-123.js');assert.equal(h.scripts.length,1);assert.equal(h.scripts[0].src,'https://nathan-culver.github.io/Spirimon/game-123.js');
 h.run(25000);assert.equal(h.scripts[0].removed,true);assert.equal(h.scripts.length,2);assert.ok(new URL(h.scripts[1].src).searchParams.has('retry'));
 h.context.window.__spirimonStarted=true;h.scripts[1].onload();assert.ok(h.timers.filter(t=>t.ms===25000).every(t=>t.cleared));assert.doesNotMatch(h.elements.main.innerHTML,/could not start/);
});
test('exhausted game downloads stop with an actionable error instead of waiting forever',()=>{
 const h=harness();h.context.window.spirimonLoadGame('./game.js');h.run(25000);h.scripts[1].onerror();h.run(25000);assert.equal(h.scripts.length,3);assert.match(h.elements.main.innerHTML,/could not download after three attempts/);assert.match(h.elements.main.innerHTML,/has not been erased/);
});
test('retry bypasses cached HTML while preserving the existing save namespace',()=>{
 const h=harness();h.context.window.spirimonRetry();const url=new URL(h.navigations[0]);assert.equal(url.pathname,'/Spirimon/');assert.equal(url.searchParams.get('playtest'),'qa');assert.ok(url.searchParams.has('reload'));
});
test('storage phases report and readiness cancels the slow timer',()=>{
 const h=harness();h.emit('spirimon-startup','Reading saved Spirimon…');assert.equal(h.elements['startup-status'].textContent,'Reading saved Spirimon…');h.elements.main.innerHTML='<canvas id="world"></canvas>';h.emit('spirimon-ready');assert.equal(h.timers[0].cleared,true);h.timers[0].fn();assert.equal(h.elements.main.innerHTML,'<canvas id="world"></canvas>');
});
test('actual failures show escaped diagnostics and preserve saved data',()=>{
 const h=harness();h.emitError('Invalid <script>');assert.match(h.elements.main.innerHTML,/Invalid &lt;script&gt;/);assert.match(h.elements.main.innerHTML,/saved journey has not been erased/);const error=h.elements.main.innerHTML;h.timers[0].fn();assert.equal(h.elements.main.innerHTML,error);
});
test('the compiled game includes every transitive browser module',()=>{
 const modules=html.match(/<meta name="spirimon-modules" content="([^"]+)">/)[1].split(','),checked=new Set(),queue=['./app.mjs'];
 while(queue.length){const path=queue.pop();if(checked.has(path))continue;checked.add(path);assert.ok(modules.includes(path.slice(2)),path+' missing from bundle');const module=readFileSync(new URL('../'+path.slice(2),import.meta.url),'utf8');for(const m of module.matchAll(/^import .*?from ['"]([^'"]+)['"]/gm))queue.push(m[1]);}
 assert.equal(checked.size,modules.length);assert.doesNotMatch(html,/type="module"|type="importmap"/);
});
