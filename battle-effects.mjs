import {animationProfile} from './move-animations.mjs';
import {readyImage} from './asset-loader.mjs';
import {BATTLE_EFFECT_MS} from './battle-sprite-animation.mjs';
import {EFFECT_ATLASES,EFFECT_ART_COUNTS,EFFECT_ATLAS_LAYOUTS,TECHNIQUE_ARTWORK} from './technique-artwork.mjs';
export {EFFECT_ATLASES};
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n)),pulse=(age,start,end)=>age<start||age>end?0:Math.sin((age-start)/(end-start)*Math.PI);
const random=(seed,n)=>{let x=(seed^Math.imul(n+1,2654435761))>>>0;x=Math.imul(x^(x>>>16),2246822507);return ((x^(x>>>13))>>>0)/4294967296;};
// Established techniques use their dedicated illustration. Unknown generated
// techniques inherit thematic artwork without shifting any authored assignment.
export function effectArtwork(move){
 if(Object.hasOwn(TECHNIQUE_ARTWORK,move?.id))return TECHNIQUE_ARTWORK[move.id];
 const a=animationProfile(move),family=a.family,m=a.motif;
 const motifs={fang:['beast-1','beast-4','beast-5'],claw:['beast-0','themed-type-beast-0'],feather:['celestial-0','monstrosity-5'],gear:['construct-0','construct-1','construct-5'],
  note:['celestial-4','domain-death-2'],eye:['aberration-4','themed-type-aberration-1'],bone:['undead-0','undead-3'],drop:['domain-water-0','ooze-5'],rock:['giant-1','giant-5','domain-earth-0'],
  crescent:['domain-moon-0','domain-moon-2'],wind:['domain-air-0','domain-air-2'],crystal:['domain-ice-0','domain-ice-2'],clock:['themed-domain-fate-0','themed-domain-fate-2'],
  blade:['celestial-0','domain-sun-0'],shield:['ward','domain-magic-3'],petal:['fey-2','fey-6'],vine:['plant-1','plant-5'],flame:['domain-fire-0','domain-fire-2','fiend-7'],
  bolt:['domain-lightning-0','domain-storm-0'],portal:['aberration-3','domain-void-2'],chain:['fiend-1','undead-1'],rune:['domain-magic-0','domain-magic-2'],star:['celestial-5','celestial-7'],heart:['tech-10'],dream:['tech-8','domain-moon-1']};
 const choices=family==='healing'?['tech-15','mend','tech-16']:family==='barrier'?['ward','tech-18','tech-19']:motifs[m]||motifs.rune;
 return TECHNIQUE_ARTWORK[choices[a.hash%choices.length]];
}
export function artworkFrame(art,image){
 if(!art||!Number.isInteger(art.atlas)||art.atlas<0||art.atlas>=EFFECT_ART_COUNTS.length||!Number.isInteger(art.cell)||art.cell<0||art.cell>=EFFECT_ART_COUNTS[art.atlas])return null;
 const width=image.naturalWidth||image.width,height=image.naturalHeight||image.height,row=Math.floor(art.cell/8),cw=width/8,layout=EFFECT_ATLAS_LAYOUTS[art.atlas];
 const top=layout?layout.rowBounds[row]*height:row*height/8,bottom=layout?layout.rowBounds[row+1]*height:(row+1)*height/8;
 return [(art.cell%8)*cw,top,cw,bottom-top];
}
const warmedBattles=new WeakMap();
export function warmTechniqueArtwork(battle,unitId,provideMoves,load=readyImage){
 let units=warmedBattles.get(battle);if(!units){units=new Set();warmedBattles.set(battle,units);}if(units.has(unitId))return;units.add(unitId);
 for(const source of new Set(provideMoves().map(move=>EFFECT_ATLASES[effectArtwork(move).atlas])))load(source);
}
export function effectCue(move){
 const a=animationProfile(move),power=Math.max(0,Number(move?.power)||0),heavy=['quake','impact'].includes(a.family),energy=['beam','projectile','barrage'].includes(a.family);
 return {profile:a,heavy,dim:['beam','weather','status','drain','barrier'].includes(a.family)?.28:power>=75?.18:.05,
  shake:heavy?clamp(power/18,1.5,6):power>=70?2:0,
  flash:power>=65&&energy?.16:heavy?.07:0,invert:['portal','eye'].includes(a.motif)&&power>=60,
  gravity:['rock','drop','gear'].includes(a.motif)?100:['flame','petal'].includes(a.motif)?-45:0};
}
export function prepareBattleEvents(events,layout,lastFlashAt=-Infinity,targetOf=m=>m.target||'opponent'){
 const prepared=events.slice().sort((a,b)=>a.at-b.at).map(original=>{
  const event={...original},side=event.side,target=targetOf(event.move),friendly=['self','ally','allAllies'].includes(target),other=friendly?side:side==='a'?'b':'a';
  const from=layout?.[side]?.find(p=>p.id===event.actor),targets=target==='allAllies'?layout?.[side]:target==='allOpponents'?layout?.[other]:layout?.[other]?.filter(p=>p.id===(target==='self'?event.actor:event.target));
  event.visualFrom=from?.effect&&{...from.effect};event.visualTargets=targets?.map(p=>({...p.effect}));
  const cue=effectCue(event.move);
  event.flashAllowed=!!(cue.flash||cue.invert)&&event.at-lastFlashAt>=900;
  if(event.flashAllowed)lastFlashAt=event.at;
  return event;
 });return {events:prepared,lastFlashAt};
}
export function screenEffects(events,now,{reduced=false}={}){
 const out={x:0,y:0,dim:0,flash:0,invert:0,color:'#ffffff'};
 for(const event of events.slice(-18)){const age=now-event.at;if(age<0||age>=BATTLE_EFFECT_MS)continue;const cue=effectCue(event.move),envelope=pulse(age,30,850);
  out.dim=Math.max(out.dim,cue.dim*envelope*(reduced?.45:1));
  if(reduced)continue;
  const impact=pulse(age,260,540),flash=event.flashAllowed===true?pulse(age,285,455)*cue.flash:0;
  out.x+=Math.sin(age*.095+cue.profile.phase)*cue.shake*impact;
  out.y+=Math.sin(age*.077)*cue.shake*.6*impact;
  if(flash>out.flash){out.flash=flash;out.color=cue.profile.accent;}
  out.invert=Math.max(out.invert,event.flashAllowed===true&&cue.invert?pulse(age,285,455)*.5:0);
 }out.x=clamp(out.x,-7,7);out.y=clamp(out.y,-5,5);return out;
}
export function particleEmitter(move,age,from,to,{reduced=false,limit=48}={}){
 if(age<0||age>=BATTLE_EFFECT_MS)return [];
 const {profile:a,gravity}=effectCue(move),particles=[],emissionEnd=420,count=Math.min(limit,reduced?8:40),friendly=['healing','barrier','aura'].includes(a.family);
 // Analytic age/lifetime integration: stable after pauses, no growing arrays,
 // frame-dependent randomness, timers or persistent per-particle allocations.
 for(let n=0;n<count;n++){
  const birth=40+n/count*emissionEnd,life=240+random(a.hash,n+100)*200,t=(age-birth)/life;if(t<0||t>=1)continue;
  const r=random(a.hash,n),angle=r*Math.PI*2,speed=18+random(a.hash,n+40)*48,seconds=(age-birth)/1000;
  const travel=clamp((age-birth)/300),anchor=friendly?to:{x:from.x+(to.x-from.x)*travel,y:from.y+(to.y-from.y)*travel};
  const spread=friendly?(1-t)*55:Math.sin(travel*Math.PI)*28;
  const turbulence=reduced?0:Math.sin(seconds*11+n)*6*t;
  particles.push({x:anchor.x+Math.cos(angle)*(speed*seconds+spread)+turbulence,y:anchor.y+Math.sin(angle)*(speed*seconds+spread)+gravity*seconds*seconds*.5-18+turbulence*.4,
   alpha:Math.sin(t*Math.PI)*.75,radius:(2+random(a.hash,n+70)*5)*(1-t*.7),angle:angle+t*a.spin*2,color:n%3?a.color:a.accent});
 }return particles;
}
export function drawIllustratedEffect(c,move,age,from,to,width,height,{reduced=false,image:provided}={}){
 if(age<=0||age>=BATTLE_EFFECT_MS)return false;
 const a=animationProfile(move),art=effectArtwork(move),image=provided||readyImage(EFFECT_ATLASES[art.atlas]);if(!image)return false;
 const p=age/BATTLE_EFFECT_MS,travel=clamp((age-70)/270),friendly=['healing','barrier','aura'].includes(a.family),field=a.family==='weather';
 const dest=a.recipient==='caster'?from:to,projectile=['projectile','beam','barrage','drain'].includes(a.family),anchor=field?{x:width/2,y:height*.47}:projectile?{x:from.x+(dest.x-from.x)*travel,y:from.y+(dest.y-from.y)*travel}:dest;
 const unit=Math.min(width/1000,height/550),size=(field?210:friendly?115:125)*Math.max(.65,unit),growth=reduced?1:.45+Math.sin(p*Math.PI)*.7;
 const rect=artworkFrame(art,image);if(!rect)return false;const artHeight=size*rect[3]/rect[2];
 c.save();c.globalAlpha=Math.sin(p*Math.PI)*(field?.35:.65);c.translate(anchor.x,anchor.y-18);
 const rotating=['gear','portal','clock','wind'].includes(a.motif);c.rotate(reduced?0:rotating?p*a.spin*.8:a.family==='slash'?(p-.5)*.5:0);
 c.scale(growth*(from.x>to.x&&projectile?-1:1),growth);
 c.drawImage(image,...rect,-size/2,-artHeight/2,size,artHeight);c.restore();return true;
}
export function drawEmitter(c,move,age,from,to,width,height,options={}){
 const particles=particleEmitter(move,age,from,to,options),unit=Math.max(.65,Math.min(width/1000,height/550));
 c.save();c.globalCompositeOperation='lighter';
 for(const p of particles){c.globalAlpha=p.alpha;c.fillStyle=p.color;c.beginPath();c.ellipse(p.x,p.y,p.radius*unit,p.radius*.65*unit,p.angle,0,Math.PI*2);c.fill();}
 c.restore();return particles.length;
}
export function drawBattleFlash(c,frame,width,height){
 if(frame.flash<=0)return;c.save();c.globalAlpha=Math.min(.16,frame.flash);c.fillStyle=frame.color;c.fillRect(0,0,width,height);c.restore();
}
