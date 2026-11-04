import {readFile,writeFile,mkdir,cp,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
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
 const sections=['(function(){"use strict";if(window.__spirimonStarted)return;window.__spirimonStarted=true;const __modules=Object.create(null);const __moduleURL=id=>new URL(id,/^(?:file:|content:)/.test(document.baseURI)?"https://nathan-culver.github.io/Spirimon/":document.baseURI).href;'];
 for(const id of ordered){
  const namespace=id==='app.mjs'?{}:await import(pathToFileURL(path.join(directory,id)).href),names=Object.keys(namespace);
  let source=sources.get(id).replace(importPattern,(_,clause,specifier)=>{
   const dep=path.posix.normalize(path.posix.join(path.posix.dirname(id),specifier)),value='__modules['+JSON.stringify(dep)+']';
   if(clause.startsWith('* as '))return 'const '+clause.slice(5)+'='+value+';';
   if(clause.startsWith('{'))return 'const '+clause.replace(/\bas\b/g,':')+'='+value+';';
   throw Error('Unsupported browser import: '+clause);
  });
  source=source.replace(/^export\s+\{[^}]+\};?\s*$/gm,'').replace(/\bexport\s+(?=(?:async\s+)?(?:const|let|var|function|class)\b)/g,'').replaceAll('import.meta.url','__moduleURL('+JSON.stringify(id)+')');
  sections.push('__modules['+JSON.stringify(id)+']=(function(){\n'+source+'\nreturn {'+names.join(',')+'};})();');
 }
 sections.push('})();');const script=sections.join('\n');
 new vm.Script(script,{filename:'spirimon-inline.js'});
 const font=await readFile(path.join(directory,'assets/spirimon-pixel.ttf'));
 const css=(await readFile(path.join(directory,'style.css'),'utf8')).replace(/\r\n/g,'\n').replace('./assets/spirimon-pixel.ttf','data:font/ttf;base64,'+font.toString('base64'));
 const template=(await readFile(path.join(directory,'index.template.html'),'utf8')).replace(/\r\n/g,'\n').trimEnd()+'\n';
 const moduleMeta='<meta name="spirimon-modules" content="'+ordered.join(',')+'">';
 const offlineArt={};
 const world=await import(pathToFileURL(path.join(directory,'world-art.mjs')).href),placeholder=await import(pathToFileURL(path.join(directory,'placeholder-art.mjs')).href);
 const alreadyEmbedded={...world.WORLD_ART,...world.SETTLEMENT_ART,...placeholder.PLACEHOLDER_ART};
 const assetPaths=new Set([...script.matchAll(/['"](\.\/assets\/[a-zA-Z0-9_/-]+\.(?:webp|svg|png))['"]/g)].map(m=>m[1]));
 async function collectAssets(folder){for(const entry of await readdir(path.join(directory,folder),{withFileTypes:true})){const file=path.posix.join(folder,entry.name);if(entry.isDirectory())await collectAssets(file);else if(/\.(?:webp|svg|png)$/.test(file))assetPaths.add('./'+file);}}
 await collectAssets('assets');
 for(const asset of assetPaths){if(alreadyEmbedded[asset])continue;const bytes=await readFile(path.join(directory,asset));const mime=asset.endsWith('.svg')?'image/svg+xml':asset.endsWith('.png')?'image/png':'image/webp';offlineArt[asset]='data:'+mime+';base64,'+bytes.toString('base64');}
 const standaloneScript='window.__spirimonOfflineArt='+JSON.stringify(offlineArt)+';\n'+script;
 new vm.Script(standaloneScript,{filename:'spirimon-offline.js'});
 const standaloneHtml=template.replace(/<link rel="stylesheet"[^>]*>/,()=>'<style>'+css+'</style>')
  .replace('<!-- SPIRIMON_GAME -->',()=>moduleMeta+'\n<script id="spirimon-game">\n'+standaloneScript.replace(/<\/script/gi,'<\\/script')+'\n</script>');
 // Pages starts with one small classic bundle. Large atlas data belongs only in
 // the downloadable offline copy; on Pages the four images load independently.
 const artStart=script.indexOf('__modules["world-art.mjs"]='),artEnd=script.indexOf('\n__modules[',artStart+1);
 if(artStart<0||artEnd<0)throw Error('World artwork module is missing.');
 const pageScript=script.slice(0,artStart)+'__modules["world-art.mjs"]={WORLD_ART:{},SETTLEMENT_ART:{}};'+script.slice(artEnd);
 new vm.Script(pageScript,{filename:'spirimon-pages.js'});
 const hash=value=>createHash('sha256').update(value).digest('hex').slice(0,12);
 const bundleName='game-'+hash(pageScript)+'.js',styleName='style-'+hash(css)+'.css';
 const html=template.replace(/<link rel="stylesheet"[^>]*>/,()=>'<link rel="stylesheet" href="./'+styleName+'">')
  .replace('<!-- SPIRIMON_GAME -->',()=>moduleMeta+'\n<script>window.spirimonLoadGame("./'+bundleName+'");</script>');
 if(html.includes('<!-- SPIRIMON_GAME -->'))throw Error('Game template placeholder is missing.');
 return {html,script,pageScript,standaloneHtml,css,bundleName,styleName,offlineArt,modules:ordered};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const built=await buildPage(),{html,modules}=built;
 if(process.argv.includes('--check')){if(await readFile(path.join(root,'index.html'),'utf8')!==html)throw Error('Published index.html is stale. Run npm run build.');}
 else{
  const outIndex=process.argv.indexOf('--out-dir'),output=outIndex<0?root:path.resolve(root,process.argv[outIndex+1]);
  await mkdir(output,{recursive:true});
  for(const [name,value]of Object.entries({'index.html':html,'Spirimon.html':built.standaloneHtml,[built.bundleName]:built.pageScript,[built.styleName]:built.css}))await writeFile(path.join(output,name),value);
  if(output!==root){await cp(path.join(root,'assets'),path.join(output,'assets'),{recursive:true});for(const name of ['manifest.webmanifest','service-worker.js'])await cp(path.join(root,name),path.join(output,name));}
 }
 console.log('Spirimon Pages: '+Math.round(Buffer.byteLength(html)/1024)+' KB entry, '+Math.round(Buffer.byteLength(built.pageScript)/1024)+' KB game; '+modules.length+' modules.');
}
