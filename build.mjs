import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const root=path.dirname(fileURLToPath(import.meta.url));
const importPattern=/^import\s+(.+?)\s+from\s+['"](.+?)['"];?\s*$/gm;

// Package the existing browser modules into isolated classic-script scopes.
// Export names come from their real module namespaces, including multi-variable declarations.
export async function buildPage(directory=root){
 const ordered=[],sources=new Map(),visiting=new Set();
 async function visit(id){
  if(sources.has(id))return;
  if(visiting.has(id))throw Error('Circular browser import: '+id);
  visiting.add(id);const source=(await readFile(path.join(directory,id),'utf8')).replace(/\r\n/g,'\n').trimEnd();
  for(const match of source.matchAll(importPattern)){
   if(!match[2].startsWith('./'))throw Error('External static browser import: '+match[2]);
   await visit(path.posix.normalize(path.posix.join(path.posix.dirname(id),match[2])));
  }
  visiting.delete(id);sources.set(id,source);ordered.push(id);
 }
 await visit('app.mjs');
 const sections=['(function(){"use strict";const __modules=Object.create(null);const __moduleURL=id=>new URL(id,/^(?:file|content):/.test(document.baseURI)?"https://nathan-culver.github.io/Spirimon/":document.baseURI).href;'];
 for(const id of ordered){
  const namespace=id==='app.mjs'?{}:await import(pathToFileURL(path.join(directory,id)).href),names=Object.keys(namespace);
  let source=sources.get(id).replace(importPattern,(_,clause,specifier)=>{
   const dep=path.posix.normalize(path.posix.join(path.posix.dirname(id),specifier)),value='__modules['+JSON.stringify(dep)+']';
   if(clause.startsWith('* as '))return 'const '+clause.slice(5)+'='+value+';';
   if(clause.startsWith('{'))return 'const '+clause.replace(/\bas\b/g,':')+'='+value+';';
   throw Error('Unsupported browser import: '+clause);
  });
  source=source.replace(/\bexport\s+(?=(?:async\s+)?(?:const|let|var|function|class)\b)/g,'').replaceAll('import.meta.url','__moduleURL('+JSON.stringify(id)+')');
  sections.push('__modules['+JSON.stringify(id)+']=(function(){\n'+source+'\nreturn {'+names.join(',')+'};})();');
 }
 sections.push('})();');const script=sections.join('\n');
 new vm.Script(script,{filename:'spirimon-inline.js'});
 const font=await readFile(path.join(directory,'assets/spirimon-pixel.ttf'));
 const css=(await readFile(path.join(directory,'style.css'),'utf8')).replace(/\r\n/g,'\n').replace('./assets/spirimon-pixel.ttf','data:font/ttf;base64,'+font.toString('base64'));
 const template=(await readFile(path.join(directory,'index.template.html'),'utf8')).replace(/\r\n/g,'\n');
 const html=template.replace(/<link rel="stylesheet"[^>]*>/,'<style>'+css+'</style>')
  .replace('<!-- SPIRIMON_GAME -->','<meta name="spirimon-modules" content="'+ordered.join(',')+'">\n<script id="spirimon-game">\n'+script.replace(/<\/script/gi,'<\\/script')+'\n</script>');
 if(html.includes('<!-- SPIRIMON_GAME -->')||!html.includes('id="spirimon-game"'))throw Error('Game template placeholder is missing.');
 return {html,script,modules:ordered};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const {html,modules}=await buildPage();
 if(process.argv.includes('--check')){if(await readFile(path.join(root,'index.html'),'utf8')!==html)throw Error('Published index.html is stale. Run npm run build.');}
 else{await writeFile(path.join(root,'index.html'),html);}
 console.log('Spirimon: '+modules.length+' modules, styles, font and world artwork in one '+Math.round(Buffer.byteLength(html)/1024)+' KB page.');
}
