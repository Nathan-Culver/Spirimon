// The command dock has a bounded number of cells. Cooldowns never reflow it.
export function commandMetrics(width=1000,height=700,textScale=1){
 const landscape=width>height,columns=width>=1100?8:width>=640?6:width>=480?4:3;
 const maxRows=landscape?2:4,capacity=columns*maxRows;
 return {columns,maxRows,capacity,cellHeight:Math.round(44*Math.min(1.35,Math.max(1,textScale))),landscape};
}
export function actorCommandSlots(previous=[],ids=[]){
 const slots=Array.from({length:3},(_,n)=>ids.includes(previous[n])?previous[n]:null);
 for(const id of ids)if(!slots.includes(id)){const n=slots.indexOf(null);if(n>=0)slots[n]=id;}
 return slots;
}
export function commandIdentity(attrs){
 const read=name=>attrs.match(new RegExp(name+'="([^"]*)"'))?.[1]||'',action=read('data-action'),value=read('data-value');
 return action==='unified-seal'?'seal':action+'|'+value+'|'+read('data-slot-key');
}
export function commandGroup(action){return action==='unified-move'?'moves':['support-use','cooperative-use','energy-restore-menu'].includes(action)?'support':['tonic','ether','spiritual-draught','unified-held'].includes(action)?'items':'utility';}
export function commandPosition(index,columns){return {row:Math.floor(index/columns)+1,column:index%columns+1};}
export function commandPage(catalog,page,capacity){const pages=Math.max(1,Math.ceil(catalog.length/capacity)),selected=Math.max(0,Math.min(pages-1,Math.floor(page)||0));return {page:selected,pages,start:selected*capacity};}
