"""Mechanically crop and resize generated three-form PNG strips; never redraw artwork."""
from pathlib import Path
from PIL import Image
import numpy as np
import json,re,os,argparse
root=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--first',type=int,default=1)
parser.add_argument('--last',type=int,default=150)
parser.add_argument('--source-directory',type=Path,default=root/'artwork/roster-source')
args=parser.parse_args()
report=[]
def gap_runs(projection,lo,hi):
 runs=[];start=None
 for x in range(lo,hi):
  if projection[x]<=3:
   if start is None:start=x
  elif start is not None:
   if x-start>=3:runs.append((start,x))
   start=None
 if start is not None and hi-start>=3:runs.append((start,hi))
 return runs
for source in sorted(args.source_directory.resolve().glob('*.png')):
 number=int(source.stem.split('-',1)[0])
 if not args.first<=number<=args.last:continue
 lineage=re.sub(r'^\d+-','',source.stem)
 im=Image.open(source).convert('RGBA');alpha=np.asarray(im)[:,:,3];h,w=alpha.shape
 border=np.concatenate((alpha[0,:],alpha[-1,:],alpha[:,0],alpha[:,-1]))
 assert np.median(border)<=16,source
 projection=(alpha>=128).sum(axis=0);cuts=[]
 for pos,lo,hi in [(1,.16,.46),(2,.43,.83)]:
  runs=gap_runs(projection,int(w*lo),int(w*hi));assert runs,source
  best=max(runs,key=lambda run:min(run[1]-run[0],int(w*.06))-abs(sum(run)/2-w*pos/3)*.08)
  cuts.append(round(sum(best)/2))
 boundaries=[0,*cuts,w];boxes=[]
 for n in range(3):
  left,right=boundaries[n:n+2];ys,xs=np.where(alpha[:,left:right]>=48);assert len(xs),source
  boxes.append((max(left,left+int(xs.min())-3),max(0,int(ys.min())-3),min(right,left+int(xs.max())+4),min(h,int(ys.max())+4)))
 scale=min(236/max(b[2]-b[0] for b in boxes),236/max(b[3]-b[1] for b in boxes))
 atlas=Image.new('RGBA',(768,256),(0,0,0,0))
 for n,box in enumerate(boxes):
  cell=im.crop(box);cell=cell.resize((max(1,round(cell.width*scale)),max(1,round(cell.height*scale))),Image.Resampling.LANCZOS)
  atlas.alpha_composite(cell,(n*256+(256-cell.width)//2,250-cell.height))
 target=root/'assets/roster'/f'{lineage}.webp';pending=target.with_suffix('.pending.webp')
 atlas.save(pending,format='WEBP',quality=92,alpha_quality=100,method=6);os.replace(pending,target)
 check=Image.open(target).convert('RGBA');assert check.size==(768,256)
 for n in range(3):
  a=np.asarray(check.crop((n*256,0,n*256+256,256)))[:,:,3];ys,xs=np.where(a>=48)
  assert len(xs)>100 and xs.min()>0 and xs.max()<255 and ys.min()>0 and ys.max()<255,(lineage,n)
 report.append({'id':lineage,'source':str(source.relative_to(root)),'atlas':str(target.relative_to(root)),'sourceBoxes':boxes,'bytes':target.stat().st_size})
print(json.dumps(report,indent=2))
