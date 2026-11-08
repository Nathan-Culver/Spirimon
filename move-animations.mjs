import {DOMAIN_DEFINITIONS,canonicalDomain} from './domains.mjs';
// Semantic choreography plus a stable per-technique score: never random per frame.
const PALETTES={Fire:['#ff773b','#ffd47a'],Water:['#51bfff','#c0f6ff'],Ice:['#acecff','#ffffff'],Lightning:['#ffe660','#ffffff'],Earth:['#bb9065','#e6ca98'],Air:['#a9e5df','#efffff'],Light:['#fff4b1','#ffffff'],Dark:['#8160b4','#d8b3ff'],Sun:['#ffbc42','#fff5ad'],Moon:['#b8b6fa','#f4efff'],Metal:['#acbfce','#ffffff'],Chaos:['#e281d5','#86f3dc'],Law:['#93baff','#fff2ba'],Good:['#ffe8a3','#ffffff'],Evil:['#a866ba','#f37b75'],Creation:['#78e1b1','#fff5b7'],Destruction:['#fa7861','#ffcfad'],War:['#e98261','#ffe0a6'],Peace:['#a4dfd6','#ffffff'],Fear:['#9d7bba','#e4c6f6'],Wrath:['#f25d4e','#ffcf76'],Love:['#f395bc','#ffe2ed'],Hope:['#ffdc83','#ffffff'],Despair:['#7f81ad','#c5c7eb'],Sorrow:['#779ec9','#c5ebff'],Fate:['#cca5f0','#ffedae'],Dreams:['#ab9ee6','#e7e0ff'],Nightmares:['#715083','#dc9cd8'],Life:['#84df92','#faffad'],Death:['#a6b5b7','#e7eee1'],Spirit:['#8ee6dd','#f1fffb'],Psionic:['#e89ee7','#d9c4ff'],Nature:['#8ace6a','#d5f6a0'],Void:['#8473b9','#d5ccff'],Storm:['#82b7df','#fff2a0'],Magic:['#c79cff','#9de5ff'],Aberration:['#d098dc','#a5ebce'],Beast:['#d9b17d','#ffebbc'],Celestial:['#ffdf94','#ffffff'],Construct:['#b0c7cd','#ffe0a6'],Elemental:['#7bd9e2','#ffd49b'],Fey:['#e8a2d2','#d7fca4'],Fiend:['#ed7c62','#ffc779'],Giant:['#bea482','#eee0bc'],Monstrosity:['#c8b087','#f1e9c9'],Ooze:['#81cfaa','#d3ffe2'],Plant:['#87c566','#e1f9a3'],Undead:['#a3d1c5','#eef5df']};
const hashOf=value=>{let h=2166136261;for(const ch of value)h=Math.imul(h^ch.charCodeAt(0),16777619)>>>0;return h;};
const cache=new Map();
export function animationProfile(move={}){
 const id=String(move.id||move.name||'technique'),key=JSON.stringify([id,move.name,move.effect,move.power,move.kind,move.category,move.domain,move.type,move.element,move.domainTheme,move.target]);
 if(cache.has(key))return cache.get(key);
 const name=String(move.name||'').toLowerCase(),effect=String(move.effect||'').toLowerCase(),words=name+' '+effect,hash=hashOf(key),status=move.category==='Status'||move.kind==='status'||move.power===0;
 // Effect semantics precede names: Soul Leech is a drain, not a self heal.
 const family=/drain|siphon|absorb|leechseed/.test(effect)||/leech|siphon|vampir/.test(name)?'drain':
 /heal|rest|regenerate|itemresources|cleanse/.test(effect)?'healing':
 status&&/weather|terrain|spikes|stealthrock|stickyweb|clearhazards/.test(effect)?'weather':
 /ward|protect|reflect|lightscreen|safeguard|auroraveil/.test(effect)?'barrier':
 /lower|sleep|burn|poison|toxic|freeze|paralysis|confusion|infatuation|curse|perish|disable|taunt|nightmare|flinch/.test(effect)&&status?'status':
 status&&/boost|focus|haze|swapstats|invertstats|destinybond|bellydrum|batonpass/.test(effect)?'aura':
 /trap|bind|snare|tether|entangle|grasp/.test(words)?'snare':
 /multihit|doublehit|barrage|flurry|volley|swarm|chorus/.test(words)?'barrage':
 /quake|fault|collapse|avalanche|eruption|piledriver|slam/.test(name)?'quake':
 /beam|ray|cannon|jet|breath|torrent/.test(name)?'beam':
 /claw|talon|slash|cut|cleave|rend|shear/.test(name)?'slash':
 /physical/i.test(move.category||move.kind||'')?'impact':status?'aura':'projectile';
 const motifRules=[['fang',/fang|bite|snap|vampir/],['claw',/claw|talon|raking|scratch/],['feather',/feather|wing|skybound/],['gear',/gear|rivet|spring|repair|piledriver/],['chain',/chain|shackle|lock|ghostly binding/],['vine',/vine|root|briar|bramble|entangle|thorn|seed|forest|verdant/],['petal',/petal|bloom|pollen|nectar|blessing/],['note',/hymn|chant|chorus|knell|echo|roar|cry|murmur|whisper|song/],['eye',/gaze|glare|sight|doubt|disquiet/],['heart',/heart|love|infatuat/],['dream',/sleep|dream|drowse|lull|hypno|nightmare/],['bone',/bone|grave|tomb|mortal|reassembl|revenant/],['portal',/void|null|abyss|dimension|spatial|fold|paradox|recursive|rift|burrow/],['clock',/fate|destiny|time|omen|stored|delayed/],['crystal',/ice|frost|glacier|rime|winter|hail|snow/],['bolt',/lightning|thunder|static|voltage|charged|spark|jolt/],['flame',/fire|pyre|cinder|ember|ash|infernal|furnace|scorch|solar|sun |sunlight/],['drop',/water|rain|tidal|tide|torrent|mist|flood|current|submerge|droplet|gel|jelly|ooze|caustic|venom|poison|toxic|corros/],['rock',/stone|rock|granite|clay|boulder|mountain|ground|earth|dust|sand|quake|fault/],['crescent',/moon|lunar|crescent|silver/],['star',/star|comet|meteor|dawn|prism|judgment|halo|radiant|gleam|lucent/],['wind',/air|wind|gale|gust|squall|zephyr|cyclone|tempest/],['shield',/guard|shield|barrier|ward|aegis|mantle|shelter|hide|shell|bastion|veil|shroud|screen/],['blade',/lance|spear|needle|pin|pierc|blade|slash|cleave|cut/]];
 const domain=canonicalDomain(move.domainTheme||move.domain||move.type||'Magic'),affinity=DOMAIN_DEFINITIONS.get(domain)?.affinity||domain;
 const defaults={Fire:'flame',Water:'drop',Ice:'crystal',Lightning:'bolt',Storm:'bolt',Nature:'vine',Plant:'vine',Earth:'rock',Air:'wind',Metal:'gear',Moon:'crescent',Sun:'star',Light:'star',Celestial:'feather',Void:'portal',Fate:'clock',Dreams:'dream',Nightmares:'eye',Death:'bone',Undead:'bone',Love:'heart',Psionic:'eye',Construct:'gear',Ooze:'drop',Beast:'fang',Fiend:'flame',Giant:'rock',Fey:'petal',Aberration:'eye'};
 const motif=motifRules.find(([,re])=>re.test(words))?.[0]||defaults[affinity]||'rune',palette=PALETTES[move.domain||move.type?domain:({flame:'Fire',drop:'Water',crystal:'Ice',bolt:'Lightning',vine:'Nature',petal:'Life',bone:'Death',heart:'Love',dream:'Dreams',clock:'Fate',rock:'Earth',crescent:'Moon',star:'Light',wind:'Air',gear:'Metal',portal:'Void'}[motif]||domain)]||PALETTES[affinity]||PALETTES.Magic;
 const recipient=['healing','barrier','aura'].includes(family)?(move.target&& !['self','opponent','allOpponents'].includes(move.target)?'recipient':'caster'):'recipient';
 const a=Object.freeze({id,hash,signature:key,family,motif,recipient,color:palette[0],accent:palette[1],count:4+hash%5,spin:hash&1?1:-1,scale:.85+(hash%101)/250,phase:(hash%360)*Math.PI/180,lanes:1+(hash>>>8)%3,turns:1+(hash>>>12)%3,spread:22+(hash>>>16)%43,tempo:.75+(hash>>>20)%40/100});
 if(cache.size>2048)cache.clear();cache.set(key,a);return a;
}
export function drawTechnique(c,move,progress,from,to,width,height){
 const p=Math.max(0,Math.min(1,progress));if(p<=0||p>=1)return;
 const a=animationProfile(move),unit=Math.max(.75,Math.min(width/900,height/500,1.6)),pulse=Math.sin(p*Math.PI),ease=t=>1-(1-t)**3,rand=n=>(hashOf(a.signature+':'+n)%10000)/10000;
 const origin={x:from.x,y:from.y-18*unit},target=a.recipient==='caster'?origin:{x:to.x,y:to.y-18*unit};
 const line=(x,y,xx,yy)=>{c.beginPath();c.moveTo(x,y);c.lineTo(xx,yy);c.stroke();};
 const ring=(x,y,r,ratio=1)=>{c.beginPath();c.ellipse(x,y,Math.max(.1,r),Math.max(.1,r*ratio),0,0,Math.PI*2);c.stroke();};
 const shape=(points,fill=false)=>{c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.lineTo(...points[0]);fill?c.fill():c.stroke();};
 function glyph(m,x,y,size,theta=0){
  const cs=Math.cos(theta),sn=Math.sin(theta),pt=(u,v)=>[x+(u*cs-v*sn)*size,y+(u*sn+v*cs)*size],seg=(u,v,uu,vv)=>line(...pt(u,v),...pt(uu,vv)),poly=(points,fill)=>shape(points.map(([u,v])=>pt(u,v)),fill);
  if(m==='fang'){poly([[-1,-.7],[-.45,1],[0,-.5],[.45,1],[1,-.7]],false);}
  else if(m==='claw'||m==='blade'){for(let i=0;i<(m==='claw'?3:1);i++)poly([[-1+i*.5,-1],[-.6+i*.5,.2],[-.5+i*.5,1],[-.15+i*.5,-.1]],true);}
  else if(m==='bolt'){poly([[-.1,-1],[-.8,.1],[0,0],[-.2,1],[.8,-.25],[.2,-.15]],true);}
  else if(m==='flame'){poly([[0,-1.4],[.35,-.4],[.7,-.8],[1,.4],[.4,1],[-.5,.9],[-.9,.1],[-.3,-.7]],true);}
  else if(m==='drop'){poly([[0,-1.3],[.65,-.1],[.7,.55],[0,1],[-.7,.55],[-.65,-.1]],true);}
  else if(m==='crystal'){poly([[0,-1.3],[.65,-.4],[.5,.8],[0,1.2],[-.5,.8],[-.65,-.4]],false);seg(0,-1.3,0,1.2);seg(-.6,-.4,.5,.8);seg(.6,-.4,-.5,.8);}
  else if(m==='rock'){poly([[-.9,-.4],[-.35,-1],[.7,-.7],[1,.4],[.3,.9],[-.8,.7]],true);}
  else if(m==='note'){ring(...pt(-.2,.65),size*.35,.65);seg(.1,.6,.1,-1);seg(.1,-1,.8,-.7);}
  else if(m==='eye'){poly([[-1,0],[-.4,-.55],[.4,-.55],[1,0],[.4,.55],[-.4,.55]],false);ring(x,y,size*.25);}
  else if(m==='heart'){poly([[0,1],[-1,-.1],[-.7,-.8],[-.2,-.8],[0,-.4],[.2,-.8],[.7,-.8],[1,-.1]],true);}
  else if(m==='feather'||m==='petal'||m==='vine'){poly([[0,-1.2],[.65,-.45],[.6,.3],[0,1.2],[-.6,.3],[-.65,-.45]],m==='petal');seg(0,-1,0,1.2);if(m==='feather'){seg(0,-.4,.5,-.65);seg(0,.1,-.5,-.2);}}
  else if(m==='chain'){ring(x,y,size,.5);ring(...pt(1.2,0),size,.5);}
  else if(m==='bone'){seg(-.7,0,.7,0);for(const u of [-.8,.8])for(const v of [-.23,.23])ring(...pt(u,v),size*.3);}
  else if(m==='shield'){poly([[-.8,-1],[.8,-1],[.75,.3],[0,1.2],[-.75,.3]],false);seg(0,-.7,0,.65);seg(-.45,-.1,.45,-.1);}
  else if(m==='crescent'||m==='dream'){c.beginPath();c.arc(x,y,size,theta+.3,theta+5.2);c.stroke();if(m==='dream'){seg(-.4,-.4,.4,-.4);seg(.4,-.4,-.4,.4);seg(-.4,.4,.4,.4);}}
  else if(m==='portal'){ring(x,y,size,.45);ring(x,y,size*.65,.45);}
  else if(m==='wind'){for(let i=0;i<3;i++){seg(-1,-.6+i*.6,.7,-.6+i*.6);ring(...pt(.7,-.75+i*.6),size*.2);}}
  else if(m==='clock'){ring(x,y,size);seg(0,0,0,-.7);seg(0,0,.55,.2);for(let i=0;i<4;i++){const t=i*Math.PI/2;seg(Math.cos(t)*.8,Math.sin(t)*.8,Math.cos(t),Math.sin(t));}}
  else {const n=m==='gear'?12:m==='star'?8:6,points=[];for(let i=0;i<n*2;i++){const t=i*Math.PI/n,r=i%2?.5:1;points.push([Math.cos(t)*r,Math.sin(t)*r]);}poly(points,false);if(m==='gear')ring(x,y,size*.3);else seg(-.4,0,.4,0);}
 }
 c.save();c.globalAlpha=pulse*.85;c.lineWidth=2.5*unit;c.strokeStyle=a.color;c.fillStyle=a.color;
 // Every technique has a scored, polygonal windup at its origin.
 if(p<.28){const t=p/.28;ring(origin.x,origin.y,(8+28*ease(t))*unit,.45);glyph(a.motif,origin.x,origin.y,6*unit*t,a.phase);}
 const travel=Math.max(0,Math.min(1,(p-.12)/(.55*a.tempo))),impact=Math.max(0,(p-.55)/.45),size=(14+8*a.scale)*unit;
 if(a.family==='weather'){
  // Field effects remain translucent and never flash an opaque screen overlay.
  for(let i=0;i<a.count*3;i++){const x=rand(i)*width,y=(rand(i+30)*height+p*height*.65)%height;c.globalAlpha=pulse*.3;glyph(a.motif,x,y,size*.7,a.phase+p*a.spin);}
  ring(width/2,height*.78,width*.35*ease(travel),.18);
 }else if(a.family==='barrier'){
  for(let i=0;i<a.lanes+1;i++){c.globalAlpha=pulse*(.6-i*.12);ring(target.x,target.y,(28+i*12)*unit*ease(Math.min(1,p*4)),1.2);}
  for(let i=0;i<a.count;i++){const t=i*Math.PI*2/a.count+a.phase;glyph(a.motif,target.x+Math.cos(t)*38*unit,target.y+Math.sin(t)*45*unit,size*.6,t);}
 }else if(a.family==='healing'||a.family==='aura'||a.family==='status'){
  const inward=a.family==='healing',r=(inward?1-travel:travel)*a.spread*unit+12*unit;
  for(let i=0;i<a.count;i++){const t=a.phase+i*Math.PI*2/a.count+p*a.turns*a.spin*2;glyph(a.motif,target.x+Math.cos(t)*r,target.y+Math.sin(t)*r*.65-(inward?p*25*unit:0),size*(.5+.5*pulse),t*.2);}
  c.strokeStyle=a.accent;ring(target.x,target.y,(12+28*pulse)*unit,.5);
 }else if(a.family==='snare'){
  for(let i=0;i<a.lanes+2;i++){const t=a.phase+i*Math.PI*2/(a.lanes+2),r=(1-ease(travel))*65*unit+16*unit,x=target.x+Math.cos(t)*r,y=target.y+Math.sin(t)*r;line(x,y,target.x,target.y);glyph(a.motif,x,y,size,t);}
 }else if(a.family==='quake'){
  for(let i=0;i<a.count;i++){const t=i/a.count*Math.PI*2+a.phase,r=20+ease(travel)*a.spread;glyph(a.motif,target.x+Math.cos(t)*r*unit,target.y+Math.sin(t)*r*.35*unit-Math.sin(travel*Math.PI)*(15+rand(i)*25)*unit,size,a.phase+travel*a.spin);}
  for(let i=0;i<3;i++)ring(target.x,target.y+18*unit,(10+travel*65+i*9)*unit,.25);
 }else if(a.family==='slash'||a.family==='impact'){
  const t=ease(travel);for(let i=0;i<a.lanes;i++){const angle=a.phase+i*.6,dx=Math.cos(angle)*a.spread*unit,dy=Math.sin(angle)*a.spread*unit;line(target.x-dx,target.y-dy,target.x-dx+dx*2*t,target.y-dy+dy*2*t);glyph(a.motif,target.x-dx+dx*2*t,target.y-dy+dy*2*t,size,angle);}
 }else {
  const drain=a.family==='drain',returning=drain&&p>.55,start=returning?target:origin,end=returning?origin:target,n=a.family==='beam'?a.count*2:a.family==='barrage'?a.count:a.lanes;
  for(let i=0;i<n;i++){const delay=i/n*.25,t=returning?Math.min(1,(p-.55)/.4):Math.max(0,Math.min(1,(travel-delay)/(1-delay))),arc=Math.sin(t*Math.PI)*(rand(i+9)-.5)*a.spread*unit,x=start.x+(end.x-start.x)*t,y=start.y+(end.y-start.y)*t+arc;
   if(t<=0)continue;c.globalAlpha=pulse*.85;glyph(a.motif,x,y,size*(a.family==='beam'?.65:1),a.phase+t*a.spin*a.turns);if(a.family==='beam'){c.globalAlpha=pulse*.25;line(start.x,start.y,x,y);}
  }
 }
 // Distinct impact spokes and secondary motif connect delivery to the actual effect.
 if(impact>0&&!['weather','healing','barrier','aura','status'].includes(a.family)){
  c.strokeStyle=a.accent;c.fillStyle=a.accent;c.globalAlpha=(1-impact)*.8;
  const secondary={burn:'flame',freeze:'crystal',frostbite:'crystal',paralysis:'bolt',poison:'drop',toxic:'drop',sleep:'dream',confusion:'eye',infatuation:'heart',curse:'bone',slow:'clock',breakWard:'shield'}[move.effect];
  if(secondary){if(['poison','toxic'].includes(move.effect)){c.strokeStyle='#c18ce3';c.fillStyle='#c18ce3';}glyph(secondary,target.x,target.y-20*unit,size*(.5+impact),a.phase+impact*a.spin);}
  if(a.family==='drain'){c.strokeStyle='#a2eb9c';ring(origin.x,origin.y,(10+impact*20)*unit,.6);}
  for(let i=0;i<a.count;i++){const t=a.phase+i*Math.PI*2/a.count,r=(12+impact*a.spread)*unit;line(target.x+Math.cos(t)*r*.5,target.y+Math.sin(t)*r*.5,target.x+Math.cos(t)*r,target.y+Math.sin(t)*r);}
 }
 c.restore();
}
