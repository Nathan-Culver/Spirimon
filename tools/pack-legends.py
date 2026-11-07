"""Repack the six isolated figures in each generated sheet into runtime atlases."""
from pathlib import Path
from PIL import Image
import numpy as np
import json
root=Path(__file__).resolve().parents[1]
files={
 'sleeping-crown':'exec-fdddd76b-61c9-4d96-a82f-9ceff19ca3b9.png',
 'starved-star':'exec-be5e8087-8d68-4eb2-a219-1bfaf0ac9ee2.png',
 'last-dawn':'exec-e42b21d3-706d-4155-aea3-098f911b1057.png',
 'deep-listener':'exec-7904e834-9c4e-4bf7-955a-4dd90be2c20d.png'}
report={}
for key,name in files.items():
 im=Image.open(root/'source-art/legends'/(key+'.webp')).convert('RGBA');alpha=np.asarray(im)[:,:,3];height=im.height//2;report[key]={'source':name,'frames':{}}
 for row,side in enumerate(['front','back']):
  a=alpha[row*height:(row+1)*height];xs=np.where((a>8).sum(axis=0)>1)[0];groups=[]
  for x in xs:
   if not groups or x-groups[-1][-1]>22:groups.append([int(x)])
   else:groups[-1].append(int(x))
  assert len(groups)==3,(key,side,groups)
  out=Image.new('RGBA',(768,256));bounds=[]
  for column,g in enumerate(groups):
   left=max(0,min(g)-3);right=min(im.width,max(g)+4);ys=np.where((a[:,left:right]>8).any(axis=1))[0];top=max(0,int(ys.min())-3);bottom=min(height,int(ys.max())+4)
   crop=im.crop((left,row*height+top,right,row*height+bottom));scale=min(.5,240/crop.width,240/crop.height);size=(max(1,round(crop.width*scale)),max(1,round(crop.height*scale)));crop=crop.resize(size,Image.Resampling.LANCZOS)
   out.alpha_composite(crop,(column*256+(256-size[0])//2,248-size[1]));bounds.append([left,row*height+top,right,row*height+bottom])
  out.save(root/'assets/legends'/f'{key}-{side}.webp',lossless=True,method=6)
  report[key]['frames'][side]=bounds
(root/'docs/legend-art-audit.json').write_text(json.dumps(report,indent=2)+'\n')
