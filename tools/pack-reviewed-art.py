"""Pack approved three-form art without redrawing it; preserve roster gameplay data."""
from pathlib import Path
from PIL import Image
import numpy as np
import json,re,sys,hashlib

root=Path(__file__).resolve().parents[1]
manifest=json.loads(Path(sys.argv[1]).read_text())
path=root/'roster.mjs';text=path.read_text();match=re.search(r'const SOURCE_ROSTER=(\[.*?\]);',text,re.S)
rows=json.loads(match[1]);plan=json.loads((root/'roster-plan.json').read_text())
report={'revision':5,'generator':'OpenAI image_gen','reviewedLineages':150,'reviewedForms':450,'approvedLineages':len(manifest),'approvedPreviewForms':len(manifest)*3,'reviewFile':'Spirimon_Anatomy_Identity_Art_Review.pdf','lineages':[]}
for result in sorted(manifest,key=lambda x:x['number']):
 n=result['number'];row=rows[n-1];source=Path(result['path'])
 im=Image.open(source).convert('RGBA');alpha=np.asarray(im)[:,:,3];h,w=alpha.shape
 assert np.median(np.concatenate((alpha[0],alpha[-1],alpha[:,0],alpha[:,-1])))<=16,source
 projection=(alpha>=64).sum(axis=0);cuts=[];boxes=[];cells=[];extraction='transparent-columns'
 for pos,lo,hi in [(1,.18,.46),(2,.46,.83)]:
  runs=[];start=None
  for x in range(int(w*lo),int(w*hi)):
   if projection[x]<=2:
    if start is None:start=x
   elif start is not None:
    if x-start>=3:runs.append((start,x))
    start=None
  if start is not None:runs.append((start,int(w*hi)))
  if not runs:break
  best=max(runs,key=lambda r:min(r[1]-r[0],w*.05)-abs(sum(r)/2-w*pos/3)*.12)
  cuts.append(round(sum(best)/2))
 if len(cuts)==2:
  boundaries=[0,*cuts,w]
  for k in range(3):
   left,right=boundaries[k:k+2];ys,xs=np.where(alpha[:,left:right]>=48)
   assert len(xs)>100,(row['id'],k,'empty')
   box=(max(left,left+int(xs.min())-2),max(0,int(ys.min())-2),min(right,left+int(xs.max())+3),min(h,int(ys.max())+3))
   boxes.append(box);cells.append(im.crop(box))
 else:
  from scipy import ndimage
  labels,count=ndimage.label(alpha>=32);sizes=np.bincount(labels.ravel());regions=ndimage.find_objects(labels)
  core_ids=sorted(np.argsort(sizes[1:])[-3:]+1,key=lambda i:(regions[i-1][1].start+regions[i-1][1].stop)/2)
  assert min(sizes[i] for i in core_ids)>500,(row['id'],'missing body')
  centers=[(regions[i-1][1].start+regions[i-1][1].stop)/2 for i in core_ids]
  assert min(np.diff(centers))>w*.15,(row['id'],'ambiguous split')
  cores=np.zeros(alpha.shape,dtype=np.uint8)
  for k,i in enumerate(core_ids):cores[labels==i]=k+1
  nearest=ndimage.distance_transform_edt(cores==0,return_distances=False,return_indices=True)
  owners=cores[tuple(nearest)];pixels=np.asarray(im);extraction='connected-bodies'
  for k in range(3):
   mask=owners==k+1;ys,xs=np.where((alpha>=48)&mask)
   box=(max(0,int(xs.min())-2),max(0,int(ys.min())-2),min(w,int(xs.max())+3),min(h,int(ys.max())+3))
   separated=pixels.copy();separated[~mask,3]=0
   boxes.append(box);cells.append(Image.fromarray(separated).crop(box))
 scale=min(232/max(b[2]-b[0] for b in boxes),232/max(b[3]-b[1] for b in boxes))
 atlas=Image.new('RGBA',(768,256))
 for k,cell in enumerate(cells):
  cell=cell.resize((max(1,round(cell.width*scale)),max(1,round(cell.height*scale))),Image.Resampling.LANCZOS)
  atlas.alpha_composite(cell,(k*256+(256-cell.width)//2,246-cell.height))
 target=root/'assets/roster'/f'{row["id"]}-v5.webp';atlas.save(target,'WEBP',quality=92,alpha_quality=100,method=4)
 check=np.asarray(Image.open(target).convert('RGBA'))[:,:,3]
 for k in range(3):
  a=check[:,k*256:(k+1)*256];ys,xs=np.where(a>=48)
  assert len(xs)>100 and xs.min()>0 and xs.max()<255 and ys.min()>0 and ys.max()<255,(row['id'],k,'cropped')
  assert not np.any(np.concatenate((a[0],a[-1],a[:,0],a[:,-1]))),(row['id'],k,'border')
 previous=row['atlas']
 for r in (row,plan[n-1]):
  r.update(atlas='./'+str(target.relative_to(root)),artRevision=5,proceduralArt=False)
  if n==113 and r.get('formAnatomy'):
   for a in r['formAnatomy']:a['limbs']['arms']=2;a['manipulators']=2
 report['lineages'].append({'number':n,'id':row['id'],'forms':row['forms'],'previousAtlas':previous,'atlas':row['atlas'],'libraryFileId':result['libraryFileId'],'sourceFilename':source.name,'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'sourceBoxes':boxes,'extraction':extraction,'atlasSha256':hashlib.sha256(target.read_bytes()).hexdigest()})
path.write_text(text[:match.start(1)]+json.dumps(rows,separators=(',',':'))+text[match.end(1):])
(root/'roster-plan.json').write_text(json.dumps(plan,indent=2)+'\n')
(root/'docs/roster-art-review-v5.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'packedLineages':len(report['lineages']),'forms':len(report['lineages'])*3,'extractions':{k:sum(x['extraction']==k for x in report['lineages']) for k in ['transparent-columns','connected-bodies']}}))
