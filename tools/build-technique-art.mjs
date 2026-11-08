import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {allMoveTemplates} from '../moves.mjs';
import {MOVE_CATALOG,STRUGGLE} from '../engine.mjs';
const root=new URL('../',import.meta.url),source=JSON.parse(await readFile(new URL('docs/technique-art-sources.json',root),'utf8'));
const catalog=new Map([...allMoveTemplates(),...MOVE_CATALOG,STRUGGLE].map(m=>[m.id,m])),seen=new Set(),rows=[['technique_id','technique_name','atlas','cell','source_file']];
for(const atlas of source.atlases){
 if(atlas.techniqueIds.length!==atlas.cells)throw Error('Wrong cell count: '+atlas.source);
 atlas.techniqueIds.forEach((id,cell)=>{
  if(seen.has(id)||!catalog.has(id))throw Error('Invalid/duplicate authored technique: '+id);seen.add(id);
  rows.push([id,catalog.get(id).name,'./assets/battle-effects/'+atlas.output,cell,atlas.source]);
 });
}
const paths=source.atlases.map(a=>'./assets/battle-effects/'+a.output),counts=source.atlases.map(a=>a.cells);
const layouts=source.atlases.map(a=>a.rowBounds?{rowBounds:a.rowBounds.map(n=>n/a.sourceHeight)}:null);
const text=[
 '// Generated from the frozen assignments in docs/technique-art-sources.json.',
 '// New catalog entries use semantic fallback; existing IDs never shift cells.',
 'export const EFFECT_ATLASES=Object.freeze('+JSON.stringify(paths)+');',
 'export const EFFECT_ART_COUNTS=Object.freeze('+JSON.stringify(counts)+');',
 'export const EFFECT_ATLAS_LAYOUTS=Object.freeze('+JSON.stringify(layouts)+');',
 'const authoredIDs='+JSON.stringify(source.atlases.map(a=>a.techniqueIds.join(' ')))+';',
 'export const TECHNIQUE_ARTWORK=Object.freeze(Object.fromEntries(authoredIDs.flatMap((ids,atlas)=>ids.split(" ").map((id,cell)=>[id,Object.freeze({atlas,cell})]))));',''
 ].join('\n');
const csv=rows.map(row=>row.map(value=>'"'+String(value).replaceAll('"','""')+'"').join(',')).join('\n')+'\n';
const outputs=[['technique-artwork.mjs',text],['docs/technique-artwork.csv',csv]];
for(const [name,contents]of outputs){
 const url=new URL(name,root);
 if(process.argv.includes('--check')){if(await readFile(url,'utf8')!==contents)throw Error('Stale '+name+'; run node '+fileURLToPath(import.meta.url));}
 else await writeFile(url,contents);
}
console.log(seen.size+' unique technique illustrations in '+paths.length+' atlases.');
