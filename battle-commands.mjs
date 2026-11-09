// The command dock has a bounded number of cells. Cooldowns never reflow it.
export function commandMetrics(width=1000,height=700,textScale=1,slots=54){
 const landscape=width>height,count=Math.max(1,slots),scale=Math.min(1.35,Math.max(1,textScale));
 // Fit at most two rows. The budget includes dialogue, targeting and borders,
 // so hidden actions cannot leave a dock taller than a third of the screen.
 const columns=Math.max(Math.ceil(count/2),Math.min(count,Math.floor((width-16)/(104*scale))||1)),rows=Math.ceil(count/columns);
 const budget=Math.floor(height/3),chromeHeight=52,gap=3,cellHeight=Math.max(1,Math.min(Math.round(52*scale),Math.floor((budget-chromeHeight-(rows-1)*gap)/rows)));
 const cellWidth=Math.max(1,(width-16-(columns-1)*gap)/columns);
 return {columns,rows,capacity:columns*rows,cellHeight,cellWidth,budget,chromeHeight,gap,landscape};
}
export function reserveCommandCells(previous=[],keys=[]){return [...new Set([...previous,...keys])];}
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
