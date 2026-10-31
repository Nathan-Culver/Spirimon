// Deterministic technique-specific animation choreography. All moves receive a stable visual signature.
const COLORS={Fire:'#ff8b4c',Water:'#69c9f3',Ice:'#c4f5ff',Lightning:'#ffe46d',Earth:'#c1a27c',Air:'#b7e9e1',Light:'#fff2ad',Dark:'#9d82d8',Plant:'#8ed66d',Metal:'#c9d4e2',Moon:'#c1b9f9',Sun:'#ffd27a',Poison:'#ad73b7'};
export function animationProfile(move){
 const id=String(move?.id||move?.name||'technique'),name=String(move?.name||'').toLowerCase(),effect=String(move?.effect||'').toLowerCase(),domain=move?.domain||move?.type||'';
 let hash=2166136261;for(const ch of id)hash=Math.imul(hash^ch.charCodeAt(0),16777619)>>>0;
 const status=move?.kind==='status'||move?.category==='Status'||move?.power===0;
 let family=/heal|remedy|recover|restor|regener|drain|siphon|absorb/.test(name+' '+effect)?'healing':
 /shield|barrier|ward|guard|shelter|veil|armor|carapace|defen|protect|screen|cloak/.test(name+' '+effect)?'barrier':
 /rain|storm|sunlight|weather|hail|snow|sandstorm|fog|mist|terrain|field/.test(name+' '+effect)?'weather':
 /sleep|lull|hypno|dream|charm|confus|fear|stun|paraly|poison|toxic|curse|hex/.test(name+' '+effect)?'status':
 /dance|chant|boost|focus|meditat|power up|harden|strength|speed|agilit/.test(name+' '+effect)?'aura':
 /beam|ray|laser|cannon|jet|blast|breath|torrent/.test(name)?'beam':
 /swarm|barrage|thousand|multi|rapid|flurry|volley|shower/.test(name+' '+effect)?'barrage':
 /quake|fault|rupture|avalanche|tremor|eruption|crash/.test(name)?'quake':
 /vine|snare|bind|trap|chain|root|web/.test(name+' '+effect)?'snare':
 /slash|cut|blade|talon|claw|fang|strike|punch|kick|charge|rush|tackle/.test(name)?'slash':
 status?'aura':move?.kind==='physical'?'impact':'projectile';
 return {id,hash,family,color:COLORS[domain]||COLORS[move?.type]||'#e3c47e',count:5+hash%9,spin:hash%2?-1:1,scale:.8+(hash%7)*.11,phase:(hash%360)*Math.PI/180};
}
export function drawTechnique(c,move,progress,from,to,width,height){
 const a=animationProfile(move),p=Math.max(0,Math.min(1,progress)),self=['healing','barrier','aura','weather'].includes(a.family),target=self?from:to;
 const pulse=Math.sin(p*Math.PI),color=a.color,rand=n=>((Math.imul(a.hash^(n*1103515245),2654435761)>>>0)%1000)/1000;
 c.save();c.globalAlpha=Math.max(.05,pulse*.9);c.strokeStyle=color;c.fillStyle=color;c.lineWidth=3+a.scale*2;
 const line=(x,y,xx,yy)=>{c.beginPath();c.moveTo(x,y);c.lineTo(xx,yy);c.stroke();};
 const circle=(x,y,r)=>{c.beginPath();c.arc(x,y,Math.max(.5,r),0,Math.PI*2);c.stroke();};
 if(a.family==='weather'){c.globalAlpha=pulse*.32;c.fillRect(0,0,width,height);for(let i=0;i<a.count*5;i++){const x=rand(i)*width,y=((rand(i+70)+p*1.8)%1)*height;line(x,y,x+10*a.spin,y+20);}}
 else if(a.family==='quake'){for(let i=0;i<a.count;i++){const x=to.x+(rand(i)-.5)*180,y=to.y+(rand(i+30)-.5)*90;line(x,y,x+Math.sin(i+a.phase)*25*pulse,y-32*pulse);circle(x,y,3+12*pulse);}}
 else if(a.family==='barrier'){for(let i=0;i<3;i++){c.globalAlpha=pulse*(.7-i*.17);c.beginPath();c.ellipse(from.x,from.y-22,30+i*15+12*pulse,45+i*18,Math.sin(a.phase)*.2,0,Math.PI*2);c.stroke();}}
 else if(a.family==='healing'||a.family==='aura'){for(let i=0;i<a.count*2;i++){const theta=a.phase+i*2.4+p*7*a.spin,r=15+rand(i)*75*pulse;const x=from.x+Math.cos(theta)*r,y=from.y-20+Math.sin(theta)*r-p*50;circle(x,y,3+rand(i+10)*7);}circle(from.x,from.y-20,20+55*pulse);}
 else if(a.family==='status'){for(let i=0;i<a.count;i++){const theta=a.phase+i*Math.PI*2/a.count+p*5*a.spin;const x=to.x+Math.cos(theta)*(30+45*pulse),y=to.y-30+Math.sin(theta)*(25+45*pulse);circle(x,y,5+7*pulse);line(x,y-8,x,y-15);}}
 else if(a.family==='snare'){for(let i=0;i<a.count;i++){const theta=a.phase+i*Math.PI*2/a.count;const x=to.x+Math.cos(theta)*70*pulse,y=to.y+Math.sin(theta)*45*pulse;line(x,y,to.x,to.y-20);circle(x,y,4);}}
 else if(a.family==='slash'||a.family==='impact'){for(let i=0;i<3+(a.hash%3);i++){const theta=a.phase+i*.9,rad=30+55*pulse;line(to.x+Math.cos(theta)*rad,to.y+Math.sin(theta)*rad-25,to.x-Math.cos(theta)*rad,to.y-Math.sin(theta)*rad-25);}circle(to.x,to.y-20,12+60*pulse);}
 else {const t=Math.min(1,p*1.35),n=a.family==='barrage'?a.count*2:a.family==='beam'?12:a.count;for(let i=0;i<n;i++){const delay=a.family==='barrage'?i/n*.55:i/n*.24,travel=Math.max(0,Math.min(1,(t-delay)/(1-delay))),x=from.x+(to.x-from.x)*travel,y=from.y+(to.y-from.y)*travel+Math.sin(i*2.4+a.phase+p*15)*((a.family==='beam'?8:28)*pulse);if(a.family==='beam')line(x-14,y-6,x+14,y+6);else circle(x,y,3+rand(i)*9);}if(p>.55)circle(to.x,to.y-20,100*(p-.55)*a.scale);}
 c.restore();
}
