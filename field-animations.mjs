// Small, asset-free overlays for non-Technique field activities.
export function drawFieldAnimation(ctx,kind,x,y,elapsed,duration=620){
 const t=Math.max(0,Math.min(1,elapsed/duration)),fade=1-t;
 if(fade<=0)return;
 ctx.save();ctx.globalAlpha=fade;ctx.lineWidth=2;
 const colors={push:'#d6c19d',crush:'#d9c5ed',cleave:'#9bdb85',fly:'#d8f2ff',swim:'#a4e5ff',dig:'#d5b68a',teleport:'#c8a3f9',climb:'#e7d2a1',steed:'#ffe4a2'};
 ctx.strokeStyle=colors[kind]||'#f5e8bd';ctx.fillStyle=ctx.strokeStyle;
 const pulse=Math.sin(t*Math.PI);
 if(kind==='swim'){for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(x+16,y+23,8+i*7+t*12,3+i*2+t*3,0,Math.PI*1.04,Math.PI*1.96);ctx.stroke();}}
 else if(kind==='fly'){for(let i=0;i<6;i++){const xx=x-12+i*11,yy=y+24-((t*45+i*7)%55);ctx.fillRect(xx,yy,2,7);}}
 else if(kind==='teleport'){for(let i=0;i<9;i++){const a=i*Math.PI*2/9+t*5;ctx.fillRect(x+16+Math.cos(a)*(10+30*pulse),y+12+Math.sin(a)*(10+30*pulse),3,3);}}
 else if(kind==='cleave'){ctx.beginPath();ctx.arc(x+16,y+12,9+20*t,-.85,1.85);ctx.stroke();ctx.beginPath();ctx.moveTo(x+4,y+27-18*t);ctx.lineTo(x+29,y+5-9*t);ctx.stroke();}
 else if(kind==='push'){for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(x+3+i*7-t*15,y+8+i*7);ctx.lineTo(x+17+i*7-t*15,y+8+i*7);ctx.stroke();}}
 else if(kind==='crush'){for(let i=0;i<7;i++){const a=i*Math.PI*2/7;ctx.fillRect(x+16+Math.cos(a)*28*t,y+16+Math.sin(a)*25*t,4,4);}}
 else if(kind==='dig'){for(let i=0;i<8;i++){const a=i*2.4;ctx.fillRect(x+16+Math.cos(a)*(6+22*t),y+25-Math.abs(Math.sin(a))*(5+15*t),3,3);}}
 else if(kind==='climb'){for(let i=0;i<4;i++){ctx.fillRect(x+5+i*7,y+25-(t*26+i*5)%32,3,6);}}
 else {ctx.beginPath();ctx.ellipse(x+16,y+26,8+24*t,4+7*t,0,0,Math.PI*2);ctx.stroke();}
 ctx.restore();
}
export function drawSwimming(ctx,drawPerson,x,y,face,moving,time,appearance){
 const bob=moving?Math.sin(time/115)*2:0;
 // The waterline cuts across the swimmer's waist: only the upper half
 // of the existing player sprite is rendered, with no legs visible underwater.
 ctx.save();ctx.beginPath();ctx.rect(x-7,y-14,48,23);ctx.clip();
 drawPerson(ctx,x,y+bob,'player',time,face,moving,appearance);
 ctx.restore();
 ctx.save();ctx.strokeStyle='#b8eeff';ctx.lineWidth=2;
 for(let n=0;n<2;n++){const offset=(time/240+n*12)%22;ctx.beginPath();ctx.ellipse(x+16,y+10,9+offset,3+offset*.27,0,0,Math.PI);ctx.stroke();}
 ctx.restore();
}
export function drawWaterMount(ctx,drawMounted,drawCompanion,drawPerson,sp,form,x,y,face,moving,progress,time,appearance){
 ctx.save();ctx.beginPath();ctx.rect(x-60,y-100,152,132);ctx.clip();
 drawMounted(ctx,drawCompanion,drawPerson,sp,form,x,y,face,moving,progress,time,appearance);
 ctx.restore();
 ctx.save();ctx.strokeStyle='#a5e5fa';ctx.lineWidth=2;
 const radius=14+((time/125)%15);
 ctx.beginPath();ctx.ellipse(x+16,y+25,radius+10,4+radius*.15,0,0,Math.PI*2);ctx.stroke();
 ctx.restore();
}
