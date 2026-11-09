import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {ROSTER} from '../roster.mjs';
import {GENERATION_REFERENCES} from '../generation-references.mjs';
import {LEGENDS,legendProfile,applyLegendArtwork} from '../legendary-roster.mjs';
import {battleBackSource,BATTLE_BACK_ART} from '../battle-art.mjs';
import {companionRig} from '../companion-animation.mjs';
const read=name=>JSON.parse(readFileSync(new URL('../docs/'+name,import.meta.url),'utf8'));
const names=read('approved-form-names.json'),review=read('roster-art-review-v7.json');

test('approved names reach every current roster and generation reference',()=>{
 assert.equal(names.general.length,150);assert.equal(names.legendary.length,12);
 for(const entry of names.general){
  const row=ROSTER[entry.number-1],reference=GENERATION_REFERENCES.find(r=>r.id===row.id);
  assert.equal(row.id,entry.id);assert.equal(row.forms[2],entry.after);
  assert.deepEqual(reference.forms,row.forms);assert.equal(reference.atlas,row.atlas);
  for(const name of row.forms)assert.match(name,/^[A-Za-z]+$/);
 }
 for(const profile of LEGENDS){
  assert.equal(legendProfile(profile.legacyName),profile);assert.equal(legendProfile(profile.key),profile);
  const sp=applyLegendArtwork({},profile);assert.equal(sp.name,profile.forms[2]);
  for(const name of sp.forms){assert.match(name,/^[A-Za-z]+$/);assert.ok(names.legendary.some(n=>n.after===name));}
 }
});

test('all 47 approved forms use their PDF artwork; unchanged forms keep matching rear art',()=>{
 assert.equal(review.lineages.length,26);let changed=0;
 for(const entry of review.lineages){
  const row=ROSTER.find(r=>r.id===entry.id),bytes=readFileSync(new URL('../'+entry.atlas,import.meta.url));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),entry.atlasSha256);
  for(let form=0;form<3;form++){
   const view=battleBackSource({...row,id:'roster-'+row.id},form);
   assert.equal(view.source,entry.forms.includes(form+1)?row.atlas:BATTLE_BACK_ART[row.id]);
   if(entry.forms.includes(form+1)){changed++;assert.deepEqual(view.frame,[form*256,0,256,256]);}
  }
 }
 assert.equal(changed,47);
 const gossamer=ROSTER.find(r=>r.id==='gossamerwisp');assert.equal(companionRig(gossamer,2).arms,4);
 assert.equal(companionRig(ROSTER.find(r=>r.id==='seralotus'),2).kind,'quadruped');
});
