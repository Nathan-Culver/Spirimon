import {readFile,writeFile} from 'node:fs/promises';
import {ROSTER} from '../roster.mjs';
const source=await readFile(new URL('../roster.mjs',import.meta.url),'utf8'),raw=JSON.parse(source.match(/const SOURCE_ROSTER=(\[.*?\]);/s)[1]);
const revisions=await Promise.all(['roster-art-review-v7.json','roster-art-review-v6.json','roster-art-review-v5.json','roster-evolution-review.json'].map(async name=>JSON.parse(await readFile(new URL('../docs/'+name,import.meta.url),'utf8'))));
const plans=JSON.parse(await readFile(new URL('../roster-plan.json',import.meta.url),'utf8'));
const references=ROSTER.map(row=>{
 const original=raw.find(r=>r.id===row.id),current=revisions.flatMap(d=>d.lineages||[]).find(r=>r.id===row.id&&r.atlas===row.atlas),plan=plans.find(r=>r.id===row.id&&r.atlas===row.atlas);
 let description=original.description;const arms=row.formAnatomy?.map(a=>a.limbs?.arms);
 if(arms?.length===3&&arms.every(n=>n===2))description=description.replace(/four-armed/gi,'two-armed');
 return {id:row.id,forms:row.forms,base:row.base,alter:row.alter,domains:row.domains,atlas:row.atlas,artRevision:row.artRevision,description,formDescriptions:plan?.formDescriptions||[],formAnatomy:row.formAnatomy||[],approvedCorrection:current?.action==='revised'?current.adjustment:null,tags:[row.base,row.alter,...row.domains,...(row.anatomy?.traits||[])],authority:'Current approved atlas and matching revision; older prompts cannot override it'};
});
await writeFile(new URL('../generation-references.mjs',import.meta.url),'// Generated from current approved General roster. Rebuild with tools/build-generation-references.mjs.\nexport const GENERATION_REFERENCES='+JSON.stringify(references)+';\n');
console.log('Prepared '+references.length+' current approved roster references.');
