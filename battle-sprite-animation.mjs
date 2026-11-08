import {companionRig} from './companion-animation.mjs';
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
export const BATTLE_EFFECT_MS=900;
export function battlePose(move,age,{side='a',hitAge=-1,time=0,reduced=false}={}){
 const sign=side==='a'?1:-1,active=age>=0&&age<600,damaging=Number(move?.power)>0||['damage','drain','recoil','fixed'].includes(move?.effect);
 const wind=active?smooth(age/160):0,strike=active?smooth((age-160)/110):0,returning=active?smooth((age-410)/190):0;
 const amount=wind*(1-returning),hit=hitAge>=0&&hitAge<230?Math.sin(hitAge/230*Math.PI):0;
 if(reduced)return {lean:0,reach:0,squash:0,flip:1,breath:0,hit:hit*.12};
 return {lean:sign*amount*(damaging?.11:-.06),reach:amount*(damaging?strike*.045:-.015),squash:amount*(damaging?(1-strike)*.055:-.025),
  flip:active&&/spin|roll|somersault/i.test(move?.name||'')?Math.cos(strike*(1-returning)*Math.PI*2):1,
  breath:Math.sin(time/680)*.007,hit};
}
// A small, continuous texture mesh bends the original artwork around hips,
// shoulders and extremities. No replacement creature drawings are generated.
export function battleMeshPoint(u,v,pose,rig){
 const edge=Math.abs(u-.5)*2,upper=1-v,root=Math.max(0,(v-.65)/.35),wing=rig.wings?edge*upper:0;
 const sway=['serpentine','flow','hover'].includes(rig.kind)?Math.sin(v*5)*pose.breath*edge:0;
 return {x:.5+(u-.5)*(1+pose.squash+pose.reach*upper)+pose.lean*upper*upper+sway+wing*pose.breath*2,
  y:1-(1-v)*(1-pose.squash+pose.breath)+pose.reach*edge*upper*(rig.arms?-1:.5)+root*pose.hit*.015};
}
function triangle(c,image,src,dst){
 const [a,b,d]=src,[p,q,r]=dst,det=(b.x-a.x)*(d.y-a.y)-(d.x-a.x)*(b.y-a.y);if(Math.abs(det)<1e-8)return;
 const aa=((q.x-p.x)*(d.y-a.y)-(r.x-p.x)*(b.y-a.y))/det,bb=((q.y-p.y)*(d.y-a.y)-(r.y-p.y)*(b.y-a.y))/det;
 const cc=((r.x-p.x)*(b.x-a.x)-(q.x-p.x)*(d.x-a.x))/det,dd=((r.y-p.y)*(b.x-a.x)-(q.y-p.y)*(d.x-a.x))/det;
 c.save();c.beginPath();c.moveTo(p.x,p.y);c.lineTo(q.x,q.y);c.lineTo(r.x,r.y);c.closePath();c.clip();
 c.transform(aa,bb,cc,dd,p.x-aa*a.x-cc*a.y,p.y-bb*a.x-dd*a.y);c.drawImage(image,0,0);c.restore();
}
const textures=new Map(),MAX_TEXTURES=32;
function texture(image,rect){
 // Isolate each form once so mesh draws never sample the neighbouring form.
 if(typeof document==='undefined')return {image,rect};
 const key=[image.src,...rect].join('|');let t=textures.get(key);
 if(t){textures.delete(key);textures.set(key,t);return t;}
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
 canvas.getContext('2d').drawImage(image,...rect,0,0,256,256);
 t={image:canvas,rect:[0,0,256,256]};textures.set(key,t);if(textures.size>MAX_TEXTURES)textures.delete(textures.keys().next().value);return t;
}
export function drawAnimatedBattleSprite(c,image,rect,sp,form,x,y,w,h,pose){
 if(!pose){c.drawImage(image,...rect,x,y,w,h);return;}
 const t=texture(image,rect),[sx,sy,sw,sh]=t.rect,rig=companionRig(sp,form);
 c.save();c.translate(x+w/2,y+h);c.scale(pose.flip*(1-pose.hit*.045),1+pose.hit*.025);c.translate(-w/2,-h);
 if(pose.hit>0)c.filter=(c.filter==='none'?'':c.filter+' ')+'brightness('+(1+pose.hit*.8)+')';
 // Reduced motion and neutral poses use one texture draw.
 if(!pose.lean&&!pose.reach&&!pose.squash&&!pose.breath){c.drawImage(t.image,...t.rect,0,0,w,h);c.restore();return;}
 const cols=4,rows=4,src=[],dst=[];
 for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){const u=i/cols,v=j/rows,p=battleMeshPoint(u,v,pose,rig);src.push({x:sx+u*sw,y:sy+v*sh});dst.push({x:p.x*w,y:p.y*h});}
 for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const a=j*(cols+1)+i,b=a+1,d=a+cols+1,e=d+1;
  triangle(c,t.image,[src[a],src[b],src[d]],[dst[a],dst[b],dst[d]]);
  triangle(c,t.image,[src[b],src[e],src[d]],[dst[b],dst[e],dst[d]]);
 }c.restore();
}
