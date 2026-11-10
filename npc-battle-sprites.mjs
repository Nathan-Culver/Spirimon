import {readyImage} from './asset-loader.mjs';

export const NPC_BATTLE_ATLAS='./assets/npc-battle/wardrobe-v1.webp';
export const NPC_BATTLE_PARTS=['trousers','shirt','head','hat'];
const COUNTS={trousers:5,shirt:5,head:5,hat:5};
function hash(value){let n=2166136261;for(const ch of String(value))n=Math.imul(n^ch.charCodeAt(0),16777619);return n>>>0;}
// No encounter counters or current coordinates: the same person keeps their wardrobe.
export function npcBattleAppearance(seed,identity={}){
 const key=String(identity.id||identity.name||'opposing-sealer');
 const appearance={version:1};
 for(const part of NPC_BATTLE_PARTS)appearance[part]=hash(seed+'|'+key+'|'+part)%COUNTS[part];
 // Explicit parts allow authored recurring characters and future wardrobe changes.
 for(const part of NPC_BATTLE_PARTS){const value=identity.battleAppearance?.[part];if(Number.isInteger(value)&&value>=0&&value<COUNTS[part])appearance[part]=value;}
 return appearance;
}
export function npcBattleLayers(appearance){
 // Registered source bands used by tooling; renderer masks garment overlap.
 return [{part:'trousers',top:490,bottom:793},{part:'shirt',top:220,bottom:490},{part:'head',top:135,bottom:220},{part:'hat',top:0,bottom:135}].map(layer=>({...layer,variant:appearance[layer.part]??0}));
}
export function drawNPCBattleSprite(ctx,image,appearance,{x=0,y=0,width=240,height=480}={}){
 const cellWidth=image.width/5;
 ctx.save();ctx.translate(x,y);ctx.scale(width/cellWidth,height/793);ctx.imageSmoothingEnabled=false;
 const stamp=(part,top,bottom)=>ctx.drawImage(image,(appearance[part]??0)*cellWidth,top,cellWidth,bottom-top,0,top,cellWidth,bottom-top);
 const polygon=points=>{ctx.moveTo(...points[0]);for(const point of points.slice(1))ctx.lineTo(...point);ctx.closePath();};
 // Lower garments retain their own waist wraps and talismans beneath the
 // shirt hem; drawing the original cloth preserves natural folds and legs.
 stamp('trousers',410,793);
 // Authored hem masks retain coat tails and hands without copying trousers.
 const hems=[[[110,405],[289,405],[303,475],[270,488],[225,441],[132,500],[106,480]],[[116,405],[283,405],[303,475],[265,486],[225,429],[172,480],[116,480]],[[117,405],[285,405],[302,485],[265,500],[224,440],[174,492],[110,473]],[[117,405],[287,405],[292,440],[113,440]],[[115,405],[286,405],[301,483],[265,500],[222,441],[169,492],[108,475]]];
 ctx.save();ctx.beginPath();ctx.rect(0,220,cellWidth,190);ctx.rect(0,410,112,92);ctx.rect(310,410,cellWidth-310,92);polygon(hems[appearance.shirt??0]);ctx.clip();stamp('shirt',220,530);ctx.restore();
 // Headwear includes its own hair and side trim. Only the face is swapped,
 // so a hood cannot leave behind a straw brim or a floating cap tassel.
 stamp('hat',0,220);
 ctx.save();ctx.beginPath();polygon([[169,151],[253,151],[273,171],[269,193],[242,215],[210,221],[175,205],[159,180]]);ctx.clip();stamp('head',135,220);ctx.restore();
 ctx.restore();
}
export function renderNPCBattleSprites(root=document){
 const canvases=root.querySelectorAll('canvas[data-npc-battle]');if(!canvases.length)return;
 const image=readyImage(NPC_BATTLE_ATLAS);if(!image)return;
 for(const canvas of canvases){
  let appearance;try{appearance=JSON.parse(canvas.dataset.npcBattle);}catch{continue;}
  const ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);
  drawNPCBattleSprite(ctx,image,appearance,{width:canvas.width,height:canvas.height});
 }
}
export function npcBattleSpriteHTML(seed,identity={},escape=String){
 const appearance=npcBattleAppearance(seed,identity),name=identity.name||'Opposing Sealer';
 return '<div class="npc-battle-portrait"><canvas width="240" height="480" data-npc-battle="'+escape(JSON.stringify(appearance))+'" role="img" aria-label="'+escape(name+' battle sprite')+'"></canvas></div>';
}
export const NPC_REVIEW_IDENTITIES=[
 {id:'review-0',name:'NPC 1'},
 {id:'review-1',name:'NPC 2'},
 {id:'review-2',name:'NPC 3'},
 {id:'review-66',name:'NPC 4'},
 {id:'review-182',name:'NPC 5'}
];
