import {readyImage} from './asset-loader.mjs';

// Authored raster artwork; 32 world pixels match the overworld and its actors.
export const DUNGEON_TILE=32;
export const DUNGEON_MATERIALS='./assets/dungeon-materials-v1.webp';
export const DUNGEON_PROPS='./assets/dungeon-props-v1.webp';
export const DUNGEON_THEMES=Object.freeze(['granite','moss','slate','sandstone']);
export const DUNGEON_PROP_NAMES=Object.freeze([
 'boulder','roots','crystal','stalagmites',
 'stairs-up','stairs-down','exit','torch',
 'chest-closed','chest-open','lever-up','lever-down',
 'tablet','rune-amber','rune-blue','rune-violet',
 'hazard','crossing','bones','mushrooms',
 'pillar','rubble','urn','winch'
]);
const phase=n=>((n%4)+4)%4;
export function dungeonAtlas(){return readyImage(DUNGEON_MATERIALS);}
export function dungeonArtworkReady(){const materials=dungeonAtlas(),props=readyImage(DUNGEON_PROPS);return !!(materials&&props);}

// Each material spans four-by-four world cells. Adjacent floor tiles sample
// neighboring parts of the texture instead of repeating one outlined square.
export function drawDungeonAtlasTile(ctx,biome,kind,x,y,{tileX=0,tileY=0,temple=false,neighbors={}}={}){
 const image=dungeonAtlas();if(!image)return false;
 const wall=kind>=6&&kind<=11,row=wall?1:temple?3:0;
 const sx=phase(biome)*256+phase(tileX)*64,sy=row*256+phase(tileY)*64;
 const px=Math.round(x),py=Math.round(y);ctx.imageSmoothingEnabled=false;
 ctx.drawImage(image,sx,sy,64,64,px,py,32,32);
 if(wall){
  ctx.fillStyle='#10171330';ctx.fillRect(px,py,32,32);
  if(neighbors.south){
   ctx.fillStyle='#10151380';ctx.fillRect(px,py+21,32,11);
   ctx.drawImage(image,phase(biome)*256+phase(tileX)*64,512,64,64,px,py+20,32,12);
   ctx.fillStyle='#11191480';ctx.fillRect(px,py+30,32,2);
  }
  if(neighbors.west){ctx.fillStyle='#15201b70';ctx.fillRect(px,py,3,32);}
  if(neighbors.east){ctx.fillStyle='#10171390';ctx.fillRect(px+29,py,3,32);}
 }else{
  ctx.fillStyle='#10171338';
  if(neighbors.north)ctx.fillRect(px,py,32,3);
  if(neighbors.west)ctx.fillRect(px,py,2,32);
 }
 return true;
}
export function drawDungeonProp(ctx,name,x,y,width=32,height=width){
 const index=DUNGEON_PROP_NAMES.indexOf(name),image=readyImage(DUNGEON_PROPS);
 if(index<0||!image)return false;
 ctx.imageSmoothingEnabled=false;
 ctx.drawImage(image,index%4*256,Math.floor(index/4)*256,256,256,Math.round(x),Math.round(y),width,height);
 return true;
}
export function dungeonFeatureSprite(feature,state={}){
 if(feature.kind==='lever')return state.lever?'lever-down':'lever-up';
 if(feature.kind==='treasure')return state.treasure?'chest-open':'chest-closed';
 if(feature.kind==='hazard')return state.hazard?'crossing':'hazard';
 if(feature.kind==='rune')return ['rune-amber','rune-blue','rune-violet'][feature.order]||'rune-amber';
 return feature.kind==='secret'?'exit':'tablet';
}
export function dungeonDecoration(seed,{wall=false,nearWall=false,occupied=false,temple=false}={}){
 if(occupied)return null;
 if(wall){if(!nearWall)return null;if(seed%19===0)return 'torch';if(temple&&seed%31===0)return 'pillar';if(temple&&seed%73===0)return 'winch';return null;}
 if(temple&&nearWall&&seed%59===0)return 'urn';
 if(nearWall&&seed%43===0)return 'mushrooms';
 if(nearWall&&seed%67===0)return 'stalagmites';
 if(seed%97===0)return 'bones';
 if(seed%71===0)return 'rubble';
 return null;
}
export function drawDungeonLight(ctx,x,y,time=0,{cool=false,radius=38}={}){
 const pulse=.9+Math.sin(time/190+x*.13)*.06+Math.sin(time/83+y*.17)*.04;
 ctx.save();ctx.globalCompositeOperation='screen';
 const glow=ctx.createRadialGradient(x,y,1,x,y,radius);
 glow.addColorStop(0,cool?'rgba(106,201,193,.19)':'rgba(241,174,77,'+(.22*pulse)+')');
 glow.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=glow;ctx.fillRect(x-radius,y-radius,radius*2,radius*2);ctx.restore();
}
