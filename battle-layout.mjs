// Coordinates are shared by creature rendering, HUDs and move effects.
// Slots retain their combat indices even when a fainted creature is omitted.
export function battleStageLayout({height=550,compact=false,multi=false,allies=[],enemies=[]}={}){
 const living=units=>units.map((unit,slot)=>({unit,slot})).filter(({unit})=>unit&&unit.hp>0);
 const groups={a:living(allies),b:living(enemies)},layout={a:[],b:[],compact};
 for(const side of ['a','b']){
  const units=groups[side],count=units.length,opponents=groups[side==='a'?'b':'a'].length;
  units.forEach(({unit,slot},position)=>{
   let x,ground,size,rx,ry,hud;
   if(!compact){
    x=multi?(side==='a'?[120,280,440]:[560,720,880])[slot]:side==='a'?260:735;
    ground=height*(multi?(side==='a'?.68:.50):side==='a'?.92:.44);
    size=multi?Math.min(175,height*.32):side==='a'?Math.min(360,height*.82):Math.min(300,height*.62);
    rx=multi?110:side==='a'?210:163;ry=Math.min(multi?23:side==='a'?43:30,height*(multi?.055:side==='a'?.08:.065));
   }else{
    const ally=side==='a';
    x=(ally?count===1?[.50]:count===2?[.38,.75]:[.27,.59,.90]:count===1?[.83]:count===2?[.72,.91]:[.64,.79,.93])[position]*1000;
    size=ally?count===1?Math.min(330,height*.78):count===2?Math.min(190,height*(opponents===3?.34:.47)):Math.min(120,height*.30)
     :count===1?Math.min(285,height*.53):count===2?Math.min(160,height*.39):Math.min(120,height*.28);
    rx=Math.max(count===3?34:48,Math.min(count===3?60:150,size*.60));
    ry=Math.max(8,Math.min(25,height*.06,size*.095));
    ground=Math.min(height*(ally?(count===2&&opponents===3?.97:count===3?.94:.91):count===1?.57:count===2?.45:.61),height-ry-8);
    if(ally){
     const left=count===1?.02:count===2?[.02,.43][position]:[.015,.345,.675][position];
     const width=count===1?.29:count===2?[.24,.20][position]:.18;
     const center=ground-size*(count===1?.28:count===2?(opponents===3?.50:.34):.42);
     hud={left:left*100,top:center/height*100,width:width*100,maxHeight:count===1?44:count===2?42:32};
    }else hud={left:(count===1?.02:count===2?[.02,.29][position]:[.02,.35,.68][position])*100,top:3,width:count===1?29:count===2?25:29,maxHeight:count===3?32:40};
   }
   layout[side].push({id:unit.id,slot,x,ground,size,rx,ry,hud,effect:{x,y:ground-size*.43}});
  });
 }
 return layout;
}
