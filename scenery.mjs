// Collision and drawing share the bottom row of every tall feature.
export function sceneryBaseRow({y,h=1}){return y+h-1;}
export function sceneryFootprintBlocked(feature,x,y){
 return y===sceneryBaseRow(feature)&&x>=feature.x&&x<feature.x+(feature.w||1);
}
export function sceneryDepth(feature){return sceneryBaseRow(feature)+.5;}
export function caveFootprint(entrance){return {x:entrance.x-2,y:entrance.y-3,w:5,h:4};}
export function caveRimBlocked(entrance,x,y){
 return sceneryFootprintBlocked(caveFootprint(entrance),x,y)&&x!==entrance.x;
}
