import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {ROSTER} from '../roster.mjs';
import {TYPES,makeSpecies} from '../engine.mjs';
test('shared original roster has fifty unique ordered type combinations and three named forms each',()=>{assert.equal(ROSTER.length,50);assert.equal(new Set(ROSTER.map(r=>r.id)).size,50);assert.equal(new Set(ROSTER.map(r=>r.base+'>'+r.alter)).size,50);for(const r of ROSTER){assert(TYPES.includes(r.base));assert(TYPES.includes(r.alter));assert.notEqual(r.base,r.alter);assert.equal(new Set(r.forms).size,3);assert.equal(makeSpecies(r.id,r.base,r.alter,[]).moves.length,4);}});
test('all fifty original sprite strips are present with three 256px form cells',async()=>{for(const r of ROSTER){const b=await readFile(new URL('../'+r.atlas,import.meta.url));assert.equal(b.toString('ascii',0,4),'RIFF',r.id);assert.equal(b.toString('ascii',8,12),'WEBP',r.id);assert.equal(b.toString('ascii',12,16),'VP8X',r.id);assert.equal(b.readUIntLE(24,3)+1,768,r.id);assert.equal(b.readUIntLE(27,3)+1,256,r.id);}});
