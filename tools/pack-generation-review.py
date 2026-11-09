"""Mechanically isolate generated review Forms and pack without redrawing artwork."""
from pathlib import Path
from PIL import Image
import numpy as np
from scipy import ndimage
import json, hashlib
root=Path(__file__).resolve().parents[1]
sources={
'rimewake':'exec-1c37d2a5-c1a2-405b-8947-721e86deda2b.png',
'nectarveil':'exec-7ba2bd28-8129-4292-bb7c-8bd5dfd1383f.png',
'knellkeeper':'exec-1e7c8baf-fdac-4083-8ad2-1677a80c207d.png',
'vespergel':'exec-9b2cf419-0dcb-4eab-8764-a09c6fa50a8b.png',
'briarcrest':'exec-fbe88046-1f53-44d1-8e6d-43e97518bc00.png',
'foldwitness':'exec-15e759f4-37dc-4402-9e9d-dbffb7132796.png'}
report=[]
for key,name in sources.items():
 source=root.parent/'generated_images'/name
 im=Image.open(source).convert('RGBA');pixels=np.array(im);alpha=pixels[:,:,3];h,w=alpha.shape
 projection=(alpha>=64).sum(axis=0);cuts=[]
 for pos,lo,hi in [(1,.18,.46),(2,.46,.83)]:
  runs=[];start=None
  for x in range(int(w*lo),int(w*hi)):
   if projection[x]<=2:
    if start is None:start=x
   elif start is not None:
    if x-start>=3:runs.append((start,x))
    start=None
  if start is not None:runs.append((start,int(w*hi)))
  if runs:
   best=max(runs,key=lambda r:min(r[1]-r[0],w*.05)-abs(sum(r)/2-w*pos/3)*.12);cuts.append(round(sum(best)/2))
 cells=[];boxes=[]
 if len(cuts)==2:
  boundaries=[0,*cuts,w]
  for n in range(3):
   left,right=boundaries[n:n+2];ys,xs=np.where(alpha[:,left:right]>=48)
   if len(xs)<100:raise ValueError('Empty Form '+key)
   box=(max(left,left+int(xs.min())-2),max(0,int(ys.min())-2),min(right,left+int(xs.max())+3),min(h,int(ys.max())+3));boxes.append(box);cells.append(im.crop(box))
 else:
  labels,count=ndimage.label(alpha>=32);sizes=np.bincount(labels.ravel());regions=ndimage.find_objects(labels)
  ids=sorted(np.argsort(sizes[1:])[-3:]+1,key=lambda i:(regions[i-1][1].start+regions[i-1][1].stop)/2)
  if min(sizes[i] for i in ids)<500:raise ValueError('Cannot isolate '+key)
  cores=np.zeros(alpha.shape,dtype=np.uint8)
  for n,i in enumerate(ids):cores[labels==i]=n+1
  nearest=ndimage.distance_transform_edt(cores==0,return_distances=False,return_indices=True);owners=cores[tuple(nearest)]
  for n in range(3):
   mask=owners==n+1;ys,xs=np.where((alpha>=48)&mask);box=(max(0,int(xs.min())-2),max(0,int(ys.min())-2),min(w,int(xs.max())+3),min(h,int(ys.max())+3));copy=pixels.copy();copy[~mask,3]=0;boxes.append(box);cells.append(Image.fromarray(copy).crop(box))
 # Shared scaling preserves the source's family proportions and complete effects.
 scale=min(224/max(c.width for c in cells),224/max(c.height for c in cells));atlas=Image.new('RGBA',(768,256))
 for n,cell in enumerate(cells):
  cell=cell.resize((max(1,round(cell.width*scale)),max(1,round(cell.height*scale))),Image.Resampling.LANCZOS);atlas.alpha_composite(cell,(n*256+(256-cell.width)//2,240-cell.height))
 dest=root/'assets/generation-review'/f'{key}.webp';dest.parent.mkdir(parents=True,exist_ok=True);atlas.save(dest,'WEBP',quality=92,method=4)
 for n in range(3):
  a=np.array(atlas)[:,n*256:(n+1)*256,3];assert a.max()>0 and not np.any(np.concatenate((a[0],a[-1],a[:,0],a[:,-1])))
 report.append(dict(id=key,sourceFilename=name,sourceSha256=hashlib.sha256(source.read_bytes()).hexdigest(),atlas='./'+str(dest.relative_to(root)),atlasSha256=hashlib.sha256(dest.read_bytes()).hexdigest(),boxes=boxes))
(root/'docs/generation-review-art.json').write_text(json.dumps(dict(generator='OpenAI image_gen',status='Review examples only; no runtime model-validation claim',lineages=report),indent=2)+'\n')
print(json.dumps(report))
