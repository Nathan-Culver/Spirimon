// Run: node --test tests/regression.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as E from '../engine.mjs';
const app=readFileSync(new URL('../app.mjs',import.meta.url),'utf8');
const sprites=readFileSync(new URL('../sprites.mjs',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
test('new games have valid world and encounter state',()=>{const s=E.newGame('test');assert.equal(s.player.x,24);assert.deepEqual(s.roamers,{});assert.deepEqual(s.spirits,[]);});
test('coordinates map to their own region',()=>{for(const [x,y] of [[24,19],[48,36],[-1,-1]]){const c=E.coord(x,y);assert.equal(c.cx,Math.floor(x/48));assert.equal(c.cy,Math.floor(y/36));}});
test('wild species and individuals have valid stats',()=>{const sp=E.makeSpecies('regression','Beast','Fey',[]),ind=E.makeIndividual(sp,3);E.heal(ind,sp);assert.ok(ind.hp>0);assert.ok(E.stats(ind,sp).hp>0);});
test('only one wild Spirit render pass',()=>{const body=app.slice(app.indexOf('function drawWorld(time)'),app.indexOf('function tick(time)'));assert.equal((body.match(/drawSpirit\(c,/g)||[]).length,1);});
test('wild Spirit movement uses current NPC locations',()=>{const body=app.slice(app.indexOf('function wanderSpirits('),app.indexOf('function drawWorld(time)'));assert.match(body,/townNPCs\(pos.cx,pos.cy\)/);});
test('no repeated proximity spawns',()=>{assert.doesNotMatch(app,/function ensureVisibleSpirits\(/);assert.doesNotMatch(app,/function replenish\(/);});
test('grass encounters do not inject roaming Spirits',()=>{const body=app.slice(app.indexOf('function move(dx,dy)'),app.indexOf('function interact()'));assert.doesNotMatch(body,/s\.roamers\[reg.key\]\.push\(encounter\)/);});
test('save repair precedes roaming world discovery',()=>{assert.ok(app.indexOf('normalizeWildPopulation();')<app.indexOf('discoverRegion();',app.indexOf('function boot()')));});
test('player uses stable sprite frame',()=>{assert.match(sprites,/frame=1;ctx\.save\(\)/);});
test('no temporary Spirit debug badges',()=>{assert.doesNotMatch(html,/id="spirit-build"/);assert.doesNotMatch(app,/SPIRITS '\+'|BUILD 11/);});
