import {readFile,writeFile,mkdir,cp,readdir,rm,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const root=path.dirname(fileURLToPath(import.meta.url));
const importPattern=/^import\s+(.+?)\s+from\s+['"](.+?)['"];?\s*$/gm;

// Package the existing browser modules into isolated classic-script scopes.
// Export names come from their real module namespaces, including multi-variable declarations.
export async function buildPage(directory=root,{standalone=true}={}){
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
 const sections=['(function(){"use strict";if(window.__spirimonStarted)return;window.__spirimonStarted=true;const __modules=Object.create(null);const __moduleURL=id=>new URL(id,/^(?:file:|content:)/.test(document.baseURI)&&!(typeof window!=="undefined"&&window.__spirimonPackaged)?"https://nathan-culver.github.io/Spirimon/":document.baseURI).href;'];
 for(const id of ordered){
  const namespace=id==='app.mjs'?{}:await import(pathToFileURL(path.join(directory,id)).href),names=Object.keys(namespace);
  let moduleSource=sources.get(id);
  if(id==='roster.mjs'){
   // Share repeated anatomy records in the download while giving every form
   // its own mutable copy, as in the unbundled roster.
   moduleSource=moduleSource.replace(/const SOURCE_ROSTER=(\[.*?\]);/s,(_,json)=>{
    const rows=JSON.parse(json),records=[],ids=new Map();
    for(const row of rows)if(row.formAnatomy)row.formAnatomy=row.formAnatomy.map(record=>{
     const key=JSON.stringify(record);if(!ids.has(key)){ids.set(key,records.length);records.push(record);}return ids.get(key);
    });
    return 'const __atlasAnatomy='+JSON.stringify(records)+';const SOURCE_ROSTER='+JSON.stringify(rows)+'.map(row=>row.formAnatomy?{...row,formAnatomy:row.formAnatomy.map(id=>structuredClone(__atlasAnatomy[id]))}:row);';
   });
  }
  let source=moduleSource.replace(importPattern,(_,clause,specifier)=>{
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
 // Runtime literals cover front atlases, scenery and interiors. Rear paths are
 // generated from roster IDs, so enumerate their exported map explicitly.
 // Historical art revisions and previews stay in git, outside release payloads.
 const {BATTLE_BACK_ART}=await import(pathToFileURL(path.join(directory,'battle-art.mjs')).href);
 const assetPaths=[...new Set([...script.matchAll(/['"](\.\/assets\/[a-zA-Z0-9_/-]+\.(?:webp|svg|png))['"]/g)].map(m=>m[1]).concat(Object.values(BATTLE_BACK_ART),Object.keys(alreadyEmbedded),'./assets/spirimon-icon.svg'))].sort();
 const assets=[];
 for(const asset of assetPaths){
  const filename=path.join(directory,asset),info=await stat(filename);assets.push({path:asset,bytes:info.size});
  if(!standalone||alreadyEmbedded[asset])continue;
  const bytes=await readFile(filename),mime=asset.endsWith('.svg')?'image/svg+xml':asset.endsWith('.png')?'image/png':'image/webp';offlineArt[asset]='data:'+mime+';base64,'+bytes.toString('base64');
 }
 const standaloneScript=standalone?'window.__spirimonOfflineArt='+JSON.stringify(offlineArt)+';\n'+script:null;
 if(standalone)new vm.Script(standaloneScript,{filename:'spirimon-offline.js'});
 const standaloneHtml=standalone?template.replace(/<link rel="stylesheet"[^>]*>/,()=>'<style>'+css+'</style>')
  .replace('<!-- SPIRIMON_GAME -->',()=>moduleMeta+'\n<script id="spirimon-game">\n'+standaloneScript.replace(/<\/script/gi,'<\\/script')+'\n</script>'):null;
 // Pages starts with one small classic bundle. Large atlas data belongs only in
 // the downloadable offline copy; on Pages the four images load independently.
 const artStart=script.indexOf('__modules["world-art.mjs"]='),artEnd=script.indexOf('\n__modules[',artStart+1);
 if(artStart<0||artEnd<0)throw Error('World artwork module is missing.');
 const pageScript=script.slice(0,artStart)+'__modules["world-art.mjs"]={WORLD_ART:{},SETTLEMENT_ART:{}};'+script.slice(artEnd);
 new vm.Script(pageScript,{filename:'spirimon-pages.js'});
 // Installed apps already carry these two images as local files. The web build
 // keeps embedded mystery sprites so startup tolerates a failed image request.
 const placeholderStart=pageScript.indexOf('__modules["placeholder-art.mjs"]='),placeholderEnd=pageScript.indexOf('\n__modules[',placeholderStart+1);
 if(placeholderStart<0||placeholderEnd<0)throw Error('Mystery artwork module is missing.');
 const packagedScript=pageScript.slice(0,placeholderStart)+'__modules["placeholder-art.mjs"]='+JSON.stringify({...placeholder,PLACEHOLDER_ART:{}})+';'+pageScript.slice(placeholderEnd);
 new vm.Script(packagedScript,{filename:'spirimon-packaged.js'});
 const hash=value=>createHash('sha256').update(value).digest('hex').slice(0,12);
 const bundleName='game-'+hash(pageScript)+'.js',packagedBundleName='game-'+hash(packagedScript)+'.js',styleName='style-'+hash(css)+'.css';
 const html=template.replace(/<link rel="stylesheet"[^>]*>/,()=>'<link rel="stylesheet" href="./'+styleName+'">')
  .replace('<!-- SPIRIMON_GAME -->',()=>moduleMeta+'\n<script>window.spirimonLoadGame("./'+bundleName+'");</script>');
 if(html.includes('<!-- SPIRIMON_GAME -->'))throw Error('Game template placeholder is missing.');
 const packagedHtml=html.replace(bundleName,packagedBundleName).replace('window.spirimonLoadGame(', 'window.__spirimonPackaged=true;window.spirimonLoadGame(');
 // The optional wardrobe review uses exactly the production mixer and renderer,
 // bundled alone so viewing five NPCs never boots a new game or a save.
 const npcModule=sources.get('npc-battle-sprites.mjs');
 const npcReviewTemplate=await readFile(path.join(directory,'npc-battle-review.template.html'),'utf8');
 const npcReviewCode=npcModule.replace(/^import .*?;\n/gm,'').replace(/^export /gm,'');
 const npcReviewLoader="const npcImages=new Map();function readyImage(path){return npcImages.get(path)||null;}queueMicrotask(()=>{for(const path of Object.values(NPC_BATTLE_ASSETS)){const image=new Image();image.onload=()=>{npcImages.set(path,image);globalThis.spirimonArtLoaded?.();};image.src=path;}});\n";
 const npcReviewHtml=npcReviewTemplate.replace(/^import .*?from '\.\/npc-battle-sprites\.mjs';/m,()=>npcReviewLoader+npcReviewCode);
 return {html,packagedHtml,script,pageScript,packagedScript,standaloneHtml,npcReviewHtml,css,bundleName,packagedBundleName,styleName,offlineArt,assets,modules:ordered};
}

export async function writeRelease(output,{target='web',directory=root}={}){
 if(!['web','app'].includes(target))throw Error('Unknown release target: '+target);
 if(target==='app'&&path.resolve(output)===path.resolve(directory))throw Error('Packaged app builds need a separate output directory.');
 const built=await buildPage(directory,{standalone:target==='web'});
 await mkdir(output,{recursive:true});
 // Clean only generated release files; never delete source assets in the repo.
 if(path.resolve(output)!==path.resolve(directory)){
  await rm(path.join(output,'assets'),{recursive:true,force:true});
  for(const name of await readdir(output))if(/^(?:game|style)-[a-f0-9]{12}\.(?:js|css)$/.test(name)||name==='Spirimon.html')await rm(path.join(output,name),{force:true});
 }
 const app=target==='app',files={'index.html':app?built.packagedHtml:built.html,[app?built.packagedBundleName:built.bundleName]:app?built.packagedScript:built.pageScript,[built.styleName]:built.css};
 if(built.standaloneHtml)files['Spirimon.html']=built.standaloneHtml;
 if(!app)files['npc-battle-review.html']=built.npcReviewHtml;
 for(const [name,value]of Object.entries(files))await writeFile(path.join(output,name),value);
 if(path.resolve(output)!==path.resolve(directory)){
  for(const asset of built.assets){const dest=path.join(output,asset.path);await mkdir(path.dirname(dest),{recursive:true});await cp(path.join(directory,asset.path),dest);}
  for(const name of ['manifest.webmanifest','service-worker.js'])await cp(path.join(directory,name),path.join(output,name));
 }
 const report={target,assets:built.assets,assetBytes:built.assets.reduce((sum,a)=>sum+a.bytes,0),codeBytes:Buffer.byteLength(app?built.packagedScript:built.pageScript),singleFileBytes:built.standaloneHtml?Buffer.byteLength(built.standaloneHtml):0};
 if(path.resolve(output)!==path.resolve(directory))await writeFile(path.join(output,'asset-manifest.json'),JSON.stringify(report,null,2)+'\n');
 return {built,report};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const targetIndex=process.argv.indexOf('--target'),target=targetIndex<0?'web':process.argv[targetIndex+1];
 const outIndex=process.argv.indexOf('--out-dir'),output=outIndex<0?root:path.resolve(root,process.argv[outIndex+1]);
 if(target==='app'&&output===root)throw Error('Packaged app builds need --out-dir to preserve the web entry.');
 let built;
 if(process.argv.includes('--check')){built=await buildPage(root,{standalone:false});if(await readFile(path.join(root,'index.html'),'utf8')!==built.html)throw Error('Published index.html is stale. Run npm run build.');}
 else{const release=await writeRelease(output,{target});built=release.built;console.log('Release assets: '+built.assets.length+' files, '+(release.report.assetBytes/1024/1024).toFixed(1)+' MiB; '+(target==='app'?'local artwork loads on demand':'single-file download '+(release.report.singleFileBytes/1024/1024).toFixed(1)+' MiB')+'.');}
 const {html,modules}=built;
 console.log('Spirimon Pages: '+Math.round(Buffer.byteLength(html)/1024)+' KB entry, '+Math.round(Buffer.byteLength(built.pageScript)/1024)+' KB game; '+modules.length+' modules.');
}
