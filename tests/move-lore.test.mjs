import test from 'node:test';
import assert from 'node:assert/strict';
import {TYPE_MOVES,EXTRA_MOVES,ENVIRONMENT_MOVES,ADVANCED_MOVES,domainMoves,moveLore} from '../moves.mjs';
import * as E from '../engine.mjs';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const mechanical=/\d|%|\b(?:HP|DMG|Stanima|stamina|Willpower|accuracy|damage|recoil|cooldown|stats?|buff|debuff|physical|energy|status|cost|chance|percent|maximum|quarter)\b/i;
const builtins=[...Object.values(TYPE_MOVES).flat(),...EXTRA_MOVES,...ENVIRONMENT_MOVES,...ADVANCED_MOVES,...E.DOMAINS.flatMap(domain=>domainMoves(domain,'Celestial')),...E.MOVE_CATALOG,E.STRUGGLE];
test('every built-in and domain move has narrative and related atmosphere without rules or numbers',()=>{
 for(const move of builtins){const lore=moveLore(move);assert.ok(lore.description.length>55,move.name);assert.ok(lore.context.length>55,move.name);assert.doesNotMatch(lore.description+' '+lore.context,mechanical,move.name);assert.doesNotMatch(lore.description,/^(?:Special )?Technique:|A specific expression|A technique shaped by|An advanced technique\.$/i,move.name);}
});
test('all core techniques have distinct descriptions matching their imagery',()=>{
 const moves=Object.values(TYPE_MOVES).flat(),stories=moves.map(m=>moveLore(m).description);assert.equal(new Set(stories).size,moves.length);
 assert.match(moveLore(TYPE_MOVES.Celestial[0]).description,/feather.*lance/i);assert.match(moveLore(TYPE_MOVES.Beast[2]).description,/shelter/i);assert.match(moveLore(TYPE_MOVES.Elemental[1]).description,/sand/i);
});
test('existing saves receive the same narrative without changing move mechanics',()=>{
 const sp=E.makeSpecies('saved-lore','Beast','Celestial',[]);sp.moves[0].desc='Attack power 99; costs 3 Willpower.';const mechanics=sp.moves.map(({desc,...move})=>move);const before=E.resourceMaximums({},sp);
 E.refreshTechniques(sp);assert.deepEqual(sp.moves.map(({desc,...move})=>move),mechanics);assert.deepEqual(E.resourceMaximums({},sp),before);assert.equal(sp.moves[0].desc,moveLore(sp.moves[0]).description);
});
test('generated moves preserve narrative prose and replace mechanical or generic copy',()=>{
 const desc='A silver moth rises from the Spirimon’s shadow, its wings carrying the scent of distant rain.';
 assert.equal(moveLore({id:'custom',name:'Silver Moth',desc}).description,desc);
 for(const desc of ['Damage 100. Cost 2 Willpower.','Technique: burn.','A beast technique.'])assert.doesNotMatch(moveLore({id:'custom',name:'Murmur',effect:'burn',desc}).description,mechanical);
});
test('the move information panel contains narrative only',()=>{
 const source=readFileSync(new URL('../app.mjs',import.meta.url),'utf8'),a=source.indexOf('function movePreviewHTML('),b=source.indexOf('\nfunction battleHTML(',a),context=vm.createContext({E,esc:String});vm.runInContext(source.slice(a,b),context);
 const html=context.movePreviewHTML(TYPE_MOVES.Beast[2]);assert.match(html,/move-preview-description/);assert.match(html,/move-preview-context/);assert.doesNotMatch(html,/Effects:|Select this move again|style and commitment|Willpower|Stanima|HP|[0-9]/);
});
