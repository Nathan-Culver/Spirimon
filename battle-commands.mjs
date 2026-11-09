// The command dock has a bounded number of cells. Cooldowns never reflow it.
export function commandMetrics(width=1000,height=700,textScale=1,slots=54){
 const landscape=width>height,columns=width>=1100?12:width>=640?10:width>=480?8:5,rows=Math.max(1,Math.ceil(slots/columns));
 const budget=Math.max(96,Math.floor(height*(landscape?.52:.55))),cellHeight=Math.max(16,Math.min(Math.round(40*Math.min(1.35,Math.max(1,textScale))),Math.floor((budget-(rows-1)*3)/rows)));
 return {columns,rows,capacity:columns*rows,cellHeight,landscape};
}
export function actorCommandSlots(previous=[],ids=[]){
 const slots=Array.from({length:3},(_,n)=>ids.includes(previous[n])?previous[n]:null);
 for(const id of ids)if(!slots.includes(id)){const n=slots.indexOf(null);if(n>=0)slots[n]=id;}
 return slots;
}
export function commandIdentity(attrs){
 const read=name=>attrs.match(new RegExp(name+'="([^"]*)"'))?.[1]||'',action=read('data-action'),value=read('data-value');
 return action==='unified-seal'?'seal':action==='item-seal'?'item-seal':action+'|'+value+'|'+read('data-slot-key');
}
export function commandGroup(action){return action==='unified-move'?'moves':['support-use','cooperative-use','energy-restore-menu','unified-seal'].includes(action)?'support':['tonic','ether','spiritual-draught','unified-held','purifier','revival','item-seal'].includes(action)?'items':'utility';}
export function commandPosition(index,columns){return {row:Math.floor(index/columns)+1,column:index%columns+1};}
// Cooperation follows the three actor cells, even after recall or replacement.
export function cooperativeCommandKey(plan,slots){
 const family=plan.id.split(':')[0];
 return 'cooperative-use|'+(family==='triune'?'triune':family+':'+plan.participants.map(p=>slots.indexOf(p.id)).sort((a,b)=>a-b).join(':'))+'|';
}
export function cooperativeCommandSlots(advanced=[]){
 const keys=[];for(const [a,b]of [[0,1],[0,2],[1,2]])for(const family of ['pack','resonance','circuit','shelter'])keys.push('cooperative-use|'+family+':'+a+':'+b+'|');
 if(advanced.includes('triune'))keys.push('cooperative-use|triune|');
 if(advanced.includes('united'))for(let n=0;n<3;n++)keys.push('cooperative-use|united:'+n+'|');
 return keys;
}
