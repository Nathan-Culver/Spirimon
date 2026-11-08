import {animationProfile} from './move-animations.mjs';
import {readyImage} from './asset-loader.mjs';
import {BATTLE_EFFECT_MS} from './battle-sprite-animation.mjs';
export const EFFECT_ATLASES=Object.freeze(['./assets/battle-effects/techniques.webp','./assets/battle-effects/arcane.webp']);
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n)),pulse=(age,start,end)=>age<start||age>end?0:Math.sin((age-start)/(end-start)*Math.PI);
const random=(seed,n)=>{let x=(seed^Math.imul(n+1,2654435761))>>>0;x=Math.imul(x^(x>>>16),2246822507);return ((x^(x>>>13))>>>0)/4294967296;};
// Atlas cells are illustrations, not claimed to be bespoke animation frames.
// Delivery, orbit, deformation and impact animate them alongside legacy effects.
export function effectArtwork(move){
 const a=animationProfile(move),family=a.family,m=a.motif;
 const arcane={crystal:[3,4,5,6,7,8,9],clock:[1,2,11],blade:[10,14],shield:[13,15,27,29,30],petal:[36,45,46,47,48,50,51],vine:[45,46,49],flame:[33,40,61],bolt:[0,28,31],portal:[39,41,44,53],chain:[42],rune:[24,25,26,27],star:[32,34,35,37],heart:[36],dream:[17,18,19,20,21,22,23]};
 const base={fang:[12,13,14,16],claw:[11,19],feather:[17,22],gear:[34,38,41],note:[26,33],eye:[0,1,4,8,9],bone:[2,3],drop:[46,47,51],rock:[18,42,45,50],crescent:[62],wind:[46,47],heart:[61]};
 const choices=arcane[m]||base[m]||[27,30,63],atlas=arcane[m]?1:0;
 const cell=family==='healing'?57:family==='barrier'&&atlas===0?28:choices[a.hash%choices.length];
 return {atlas,cell:family==='healing'&&atlas===1?36:cell};
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
 const iw=image.naturalWidth||image.width,ih=image.naturalHeight||image.height,cw=iw/8,ch=ih/8;
 c.save();c.globalAlpha=Math.sin(p*Math.PI)*(field?.35:.65);c.translate(anchor.x,anchor.y-18);
 const rotating=['gear','portal','clock','wind'].includes(a.motif);c.rotate(reduced?0:rotating?p*a.spin*.8:a.family==='slash'?(p-.5)*.5:0);
 c.scale(growth*(from.x>to.x&&projectile?-1:1),growth);
 c.drawImage(image,(art.cell%8)*cw+2,Math.floor(art.cell/8)*ch+2,cw-4,ch-4,-size/2,-size/2,size,size);c.restore();return true;
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
