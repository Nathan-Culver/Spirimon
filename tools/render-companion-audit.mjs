// Optional visual QA: uses a Canvas2D implementation; never needed by the game.
import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
import path from 'node:path';
import {ROSTER} from '../roster.mjs';
import {LEGENDS,applyLegendArtwork} from '../legendary-roster.mjs';
import {battleBackSource} from '../battle-art.mjs';
import {companionRig,drawRigFrame} from '../companion-animation.mjs';
const require=createRequire(import.meta.url),canvasPath=process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'@napi-rs/canvas'): '@napi-rs/canvas';
const {createCanvas,loadImage}=require(canvasPath),catalog=[...ROSTER,...LEGENDS.map(p=>applyLegendArtwork({id:p.key},p))];
const report={forms:0,frames:0,empty:[],clipped:[],rigs:{}},preview=createCanvas(1024,1280),g=preview.getContext('2d'),samples=['kilnscale','silkclasp','tempestrill','quasarshard','dewveil','jarjell','oculume','truffleroot','last-dawn','deep-listener'];
g.fillStyle='#b3d49e';g.fillRect(0,0,preview.width,preview.height);
for(const sp of catalog){const front=await loadImage(new URL('../'+sp.atlas,import.meta.url).pathname),backInfo=battleBackSource(sp,0),back=await loadImage(new URL('../'+backInfo.source,import.meta.url).pathname);
 for(let form=0;form<3;form++){
  const rig=companionRig(sp,form),rear=battleBackSource(sp,form),br=rear.frame||[form*256,0,256,256],sheet=createCanvas(256,256),ctx=sheet.getContext('2d');ctx.imageSmoothingEnabled=false;
  for(let d=0;d<4;d++)for(let f=0;f<4;f++){
   ctx.save();ctx.translate(f*64,d*64);drawRigFrame(ctx,d===0?back:front,d===0?br:[form*256,0,256,256],rig,f,d);ctx.restore();report.frames++;
   const pixels=ctx.getImageData(f*64,d*64,64,64).data;let visible=0,edge=0;for(let y=0;y<64;y++)for(let x=0;x<64;x++){if(pixels[(y*64+x)*4+3]>8){visible++;if(x===0||x===63||y===0||y===63)edge++;}}
   if(!visible)report.empty.push([sp.id,form,d,f]);if(edge)report.clipped.push([sp.id,form,d,f,edge]);
  }
  report.forms++;report.rigs[rig.kind]=(report.rigs[rig.kind]||0)+1;
  const row=samples.indexOf(sp.id);if(row>=0&&form===2){g.fillStyle='#142922';g.font='12px sans-serif';g.fillText(sp.id+' · '+rig.kind,6,row*128+14);for(let d=0;d<4;d++)g.drawImage(sheet,0,d*64,256,64,d*256,row*128+35,256,64);}
 }
}
await writeFile(new URL('../docs/companion-animation-audit.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
await writeFile(new URL('../docs/companion-animation-preview.png',import.meta.url),preview.toBuffer('image/png'));
console.log(JSON.stringify(report));if(report.empty.length||report.clipped.length)process.exitCode=1;
