export function sealingGestureChoice(dx,dy,maxExtra){
 const cancelled=dy<=-55||dx<=-40;
 const fraction=Math.max(0,Math.min(1,(dx-18)/110));
 return {cancelled,extra:cancelled?0:Math.round(fraction*Math.max(0,Math.floor(maxExtra))),fraction};
}
