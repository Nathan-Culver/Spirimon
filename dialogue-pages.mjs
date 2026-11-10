// Split only when a measured dialogue page cannot fit. The original sentences
// remain intact whenever possible; unusually long sentences split at words.
export function dialoguePages(lines,fits){
 const pages=[];let current=[];
 for(const raw of lines){let remaining=String(raw).trim();if(!remaining)continue;
  while(remaining){
   if(fits([...current,remaining])){current.push(remaining);break;}
   if(current.length){pages.push(current);current=[];continue;}
   const words=remaining.split(/\s+/);let low=1,high=words.length,best=0;
   while(low<=high){const count=(low+high)>>1;if(fits([words.slice(0,count).join(' ')])){best=count;low=count+1;}else high=count-1;}
   // The layout reserves at least one text line; long unbroken words can wrap.
   if(!best)best=1;pages.push([words.slice(0,best).join(' ')]);remaining=words.slice(best).join(' ');
  }
 }
 if(current.length)pages.push(current);return pages.length?pages:[[]];
}
const textLength=page=>page.join(' ').length+1;
export function dialoguePageAtOffset(pages,offset=0){let end=0;for(let n=0;n<pages.length;n++){end+=textLength(pages[n]);if(end>offset)return n;}return Math.max(0,pages.length-1);}
export function paintDialoguePage(root,pages,index=0){
 index=Math.max(0,Math.min(pages.length-1,index));const lines=root.querySelector('.npc-dialogue-lines'),responses=root.querySelector('.npc-dialogue-responses'),back=root.querySelector('.npc-dialogue-back'),next=root.querySelector('.npc-dialogue-more'),actions=root.querySelector('.npc-dialogue-actions');
 lines.replaceChildren(...pages[index].map(text=>{const p=lines.ownerDocument.createElement('p');p.textContent=text;return p;}));
 const multiple=pages.length>1,last=index===pages.length-1;actions.classList.toggle('is-paged',multiple);back.hidden=!multiple;back.disabled=index===0;next.hidden=last;responses.hidden=!last;next.textContent='Continue · '+(index+1)+' / '+pages.length;next.setAttribute('aria-label','Read next dialogue page, '+(index+1)+' of '+pages.length);return index;
}
export function fitDialoguePages(root,lines,{pages=[[]],index=0,compact=false}={}){
 const modal=root.closest('.modal'),overlay=modal.parentElement,speech=root.querySelector('.npc-battle-speech'),copy=root.querySelector('.npc-dialogue-lines'),actions=root.querySelector('.npc-dialogue-actions'),responses=root.querySelector('.npc-dialogue-responses'),back=root.querySelector('.npc-dialogue-back'),next=root.querySelector('.npc-dialogue-more');
 if(!compact)modal.classList.remove('npc-dialogue-tight','npc-dialogue-text-only');
 const offset=pages.slice(0,index).reduce((sum,page)=>sum+textLength(page),0);
 root.style.height='';copy.style.height='';copy.replaceChildren(...lines.map(text=>{const p=copy.ownerDocument.createElement('p');p.textContent=text;return p;}));actions.style.minHeight='';actions.classList.add('is-paged');back.hidden=false;back.disabled=true;responses.hidden=false;next.hidden=true;
 const css=getComputedStyle(modal),outer=getComputedStyle(overlay),gridCSS=getComputedStyle(root),modalTop=modal.getBoundingClientRect().top,gridTop=root.getBoundingClientRect().top;
 const maximum=overlay.clientHeight-parseFloat(outer.paddingTop)-parseFloat(outer.paddingBottom),chrome=gridTop-modalTop+parseFloat(css.paddingBottom)+parseFloat(css.borderBottomWidth);
 const available=Math.max(1,maximum-chrome),footer=Math.max(44,actions.getBoundingClientRect().height),gap=parseFloat(gridCSS.rowGap)||0;
 root.style.height=Math.min(available,Math.max(root.scrollHeight,root.getBoundingClientRect().height))+'px';actions.style.minHeight=footer+'px';
 const name=speech.querySelector('.npc-dialogue-speaker'),margin=parseFloat(getComputedStyle(copy).marginTop)||0;
 copy.style.height=Math.max(1,root.getBoundingClientRect().height-footer-gap-name.getBoundingClientRect().height-margin)+'px';
 if(!compact&&copy.clientHeight<parseFloat(getComputedStyle(copy.firstElementChild||name).lineHeight)){modal.classList.add('npc-dialogue-tight');return fitDialoguePages(root,lines,{pages,index,compact:true});}
 if(compact&&!modal.classList.contains('npc-dialogue-text-only')&&copy.clientHeight<parseFloat(getComputedStyle(copy.firstElementChild||name).lineHeight)){modal.classList.add('npc-dialogue-text-only');return fitDialoguePages(root,lines,{pages,index,compact:true});}
 const fitted=dialoguePages(lines,trial=>{copy.replaceChildren(...trial.map(text=>{const p=copy.ownerDocument.createElement('p');p.textContent=text;return p;}));return copy.scrollHeight<=copy.clientHeight+1;});
 return {pages:fitted,index:paintDialoguePage(root,fitted,dialoguePageAtOffset(fitted,offset))};
}
