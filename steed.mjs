// Field-scale and rideability are anatomical capabilities, never battle Moves.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const readNumber=(...values)=>values.map(Number).find(v=>Number.isFinite(v)&&v>0);
export function companionSize(sp,form=0){
 const anatomy=sp?.anatomy||{},dimensions=sp?.dimensions||{},formInfo=sp?.formDimensions?.[form]||sp?.formData?.[form]||{};
 const description=[sp?.description,sp?.forms?.[form],formInfo.description,anatomy.description].filter(Boolean).join(' ').toLowerCase();
 const types=[sp?.base,sp?.alter,...(sp?.types||[])].join(' ').toLowerCase();
 const height=readNumber(formInfo.heightMeters,formInfo.height,dimensions.heightMeters,sp?.heightMeters,anatomy.heightMeters);
 const length=readNumber(formInfo.lengthMeters,formInfo.length,dimensions.lengthMeters,sp?.lengthMeters,anatomy.lengthMeters);
 const huge=/colossal|gigantic|titanic|towering|enormous|massive/.test(description)||anatomy.scale==='colossal';
 const tiny=/tiny|miniature|diminutive|mouse-sized/.test(description);
 const large=/giant|hulking|great beast|large/.test(description)||/giant/.test(types);
 const slender=/serpentine|serpent|snake|eel|long-bodied/.test(description)||anatomy.bodyPlan==='serpentine';
 const fluid=/ooze|amorphous|incorporeal|spectral/.test(types+' '+description);
 const meters=Math.max(height||0,(length||0)*(slender?.55:.38));
 let size=meters?32*Math.sqrt(Math.max(.15,meters)/1.4):huge?75:large?57:tiny?19:fluid?31:36;
 if(huge)size=Math.max(size,68);
 if(tiny)size=Math.min(size,25);
 // Form-specific transformations may explicitly alter physical scale.
 const formScale=readNumber(formInfo.scaleMultiplier,formInfo.sizeMultiplier)||1;
 size=clamp(Math.round(size*formScale),18,112);
 return {size,height:height||null,length:length||null,scale:formScale,bodyPlan:anatomy.bodyPlan||null};
}
export function canSteed(sp,form=0){
 if(!sp)return false;
 const a=sp.anatomy||{},traits=new Set(a.traits||[]),d=companionSize(sp,form);
 const description=[sp.description,sp.forms?.[form],a.description].filter(Boolean).join(' ').toLowerCase();
 const supported=['quadruped','serpentine','many-legged','winged'].includes(a.bodyPlan)||traits.has('mount')||traits.has('rideable');
 const solid=!/incorporeal|spectral|ghostly|amorphous|intangible/.test(description)&&!['amorphous','radial','rooted'].includes(a.bodyPlan);
 const capacity=d.height>=1.2||d.length>=2||d.size>=48||a.scale==='colossal'||traits.has('rideable');
 return solid&&supported&&capacity;
}
export function drawMounted(ctx,drawCompanion,drawPerson,sp,form,x,y,face,moving,progress,time,appearance){
 const {size}=companionSize(sp,form),mountSize=Math.max(46,size);
 const bob=moving?Math.sin(progress*Math.PI*2)*2:0;
 const mx=Math.round(x+16-mountSize/2),my=Math.round(y+30-mountSize+bob);
 // Mount first; the rider is layered above the back, with lower legs
 // occluded by a cropped foreground slice of the existing mount sprite.
 drawCompanion(ctx,sp,form,mx,my,mountSize,face,moving,progress);
 const riderX=Math.round(x+4),riderY=Math.round(my+mountSize*.30-13);
 ctx.save();ctx.translate(0,bob);drawPerson(ctx,riderX,riderY,'player',time,face,moving,appearance);ctx.restore();
 ctx.save();ctx.beginPath();ctx.rect(mx,my+mountSize*.58,mountSize,mountSize*.25);ctx.clip();
 drawCompanion(ctx,sp,form,mx,my,mountSize,face,moving,progress);
 ctx.restore();
}
