import {AUTHORED_COMPANIONS,RIG_KIND,EXTRA_ARMS} from './companion-rigs.mjs';
// Hand-authored deformation rigs, retargeted to each form's observed anatomy.
// The texture is always finished roster art; reviewed front-only forms also use it northward.
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
export const COMPANION_RIGS=Object.freeze({
 quadruped:{stride:.060,lift:.024,bob:.008},
 biped:{stride:.048,lift:.035,bob:.010},
 scuttle:{stride:.045,lift:.018,bob:.004},
 winged:{stride:.025,lift:.018,bob:.018,flap:.065},
 serpentine:{sway:.045,bob:.004},
 rooted:{stride:.022,lift:.010,sway:.012,bob:.004},
 flow:{sway:.040,bob:.012},
 hover:{sway:.018,bob:.025}
});
export function companionRig(sp,form=0){
 const anatomy=sp.formAnatomy?.[form]||sp.anatomy||{},traits=new Set(anatomy.traits||[]),plan=anatomy.bodyPlan;
 let kind=({quadruped:'quadruped',biped:'biped','many-legged':'scuttle',winged:'winged',aquatic:'serpentine',serpentine:'serpentine',rooted:'rooted',tentacled:'flow',amorphous:'flow',radial:'hover'})[plan]||'hover';
 if(traits.has('levitate')&&!(anatomy.limbs?.legs>0))kind=traits.has('tentacles')?'flow':'hover';
 const id=String(sp.id||'').replace(/^roster-/,''),binding=anatomy.source==='reviewed-pdf'?null:AUTHORED_COMPANIONS[id];if(binding)kind=RIG_KIND[binding[Math.max(0,Math.min(2,form))]];
 return {kind,...COMPANION_RIGS[kind],wings:binding?(kind==='winged'?2:0):anatomy.limbs?.wings||0,arms:binding?(EXTRA_ARMS[id]||(kind==='biped'?2:0)):anatomy.limbs?.arms||0,legs:anatomy.limbs?.legs||0,tentacles:anatomy.limbs?.tentacles||0,tail:traits.has('tail')||/tail|trunk/.test(sp.description||''),phaseOffset:0};
}
export function companionFrame(face='down',moving=false,progress=0){
 const phase=Number.isFinite(Number(progress))?((Number(progress)%1)+1)%1:0;
 return {row:({up:0,down:1,left:2,right:3})[face]??1,frame:moving?Math.floor(phase*4):0};
}
export function rigPoint(rig,u,v,frame,direction){
 const phase=frame*Math.PI/2,beat=Math.sin(phase),side=u<.5?-1:1,lateral=direction>=2;
 let x=u,y=v;
 // Feet alternate rather than translating the entire image. Weight fades into
 // the hips so the face, thorax and central ornaments retain their silhouettes.
 const foot=smooth(.57,.96,v),edge=smooth(.10,.34,Math.abs(u-.5)),weight=foot*(.45+.55*edge);
 if(rig.stride){
  const stride=beat*side*(rig.kind==='scuttle'?(Math.floor(u*6)%2?1:-1):1);
  x+=weight*rig.stride*stride*(lateral?1:.45);
  y-=weight*(rig.lift||0)*Math.max(0,stride);
  if(!lateral)y+=weight*rig.stride*.35*stride;
 }
 // Arms counter-swing at the shoulders, including extra-arm body plans.
 if(rig.arms){const arm=smooth(.18,.42,Math.abs(u-.5))*(1-smooth(.76,.9,v))*smooth(.26,.42,v);x-=arm*beat*side*.025;y+=arm*beat*side*.015;}
 if(rig.wings||rig.flap){const wing=smooth(.16,.42,Math.abs(u-.5))*(1-smooth(.67,.84,v));x+=wing*side*(Math.cos(phase)-1)*.035;y+=wing*beat*(rig.flap||.035);}
 if(rig.sway){const lower=smooth(.28,.94,v);x+=lower*rig.sway*Math.sin(phase+v*4+side*.7)*Math.sin(phase/2)**2;}
 if(rig.tail){const tail=smooth(.23,.46,Math.abs(u-.5))*smooth(.45,.82,v);y+=tail*beat*side*.018;}
 y-=Math.abs(beat)*(rig.bob||0)*(1-foot*.5);
 return {x,y};
}
function triangle(ctx,image,src,dst){
 const [a,b,c]=src,[p,q,r]=dst,det=(b.x-a.x)*(c.y-a.y)-(c.x-a.x)*(b.y-a.y);if(Math.abs(det)<1e-8)return;
 const aa=((q.x-p.x)*(c.y-a.y)-(r.x-p.x)*(b.y-a.y))/det,bb=((q.y-p.y)*(c.y-a.y)-(r.y-p.y)*(b.y-a.y))/det;
 const cc=((r.x-p.x)*(b.x-a.x)-(q.x-p.x)*(c.x-a.x))/det,dd=((r.y-p.y)*(b.x-a.x)-(q.y-p.y)*(c.x-a.x))/det;
 ctx.save();ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.lineTo(r.x,r.y);ctx.closePath();ctx.clip();ctx.transform(aa,bb,cc,dd,p.x-aa*a.x-cc*a.y,p.y-bb*a.x-dd*a.y);ctx.drawImage(image,0,0);ctx.restore();
}
export function drawRigFrame(ctx,image,rect,rig,frame,direction,cell=64){
 const [sx,sy,sw,sh]=rect,cols=8,rows=8,span=cell-10,scale=span/Math.max(256,sw,sh),dw=sw*scale,dh=sh*scale,ox=(cell-dw)/2,oy=cell-5-dh,flip=direction===3;
 const source=(u,v)=>({x:sx+u*sw,y:sy+v*sh});
 const dest=(u,v)=>{const point=rigPoint(rig,u,v,frame,direction);return {x:ox+(flip?1-point.x:point.x)*dw,y:oy+point.y*dh};};
 // A neutral frame is a single exact texture draw. Other poses deform the
 // complete texture mesh; there are no pasted duplicate limbs or shape stand-ins.
 if(frame===0){ctx.save();if(flip){ctx.translate(cell,0);ctx.scale(-1,1);}ctx.drawImage(image,sx,sy,sw,sh,ox,oy,dw,dh);ctx.restore();return;}
 for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
  const uv=[[x/cols,y/rows],[(x+1)/cols,y/rows],[x/cols,(y+1)/rows],[(x+1)/cols,(y+1)/rows]],s=uv.map(p=>source(...p)),d=uv.map(p=>dest(...p));
  triangle(ctx,image,[s[0],s[1],s[2]],[d[0],d[1],d[2]]);triangle(ctx,image,[s[1],s[3],s[2]],[d[1],d[3],d[2]]);
 }
}
