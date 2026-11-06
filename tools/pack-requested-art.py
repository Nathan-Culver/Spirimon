"""Package the approved review illustrations as three transparent runtime cells.

This removes only connected review-paper background and fits existing artwork;
it does not redraw anatomy or synthesize new creature features.
"""
from pathlib import Path
from PIL import Image
from scipy import ndimage
import numpy as np
import json,re,sys,hashlib,copy
root=Path(__file__).resolve().parents[1]
review=Path(sys.argv[1]).resolve()
changes=json.loads((review.parent/'work/changes.json').read_text())
manifest=json.loads((review/'revision_manifest.json').read_text())
resolved=json.loads((review.parent/'work/resolved_roster.json').read_text())
text=(root/'roster.mjs').read_text();match=re.search(r'const SOURCE_ROSTER=(\[.*?\]);',text,re.S);rows=json.loads(match[1])
prior_text=(review.parent/'work/prior_roster.mjs').read_text();prior=json.loads(re.search(r'const SOURCE_ROSTER=(\[.*?\]);',prior_text,re.S)[1])
plan=json.loads((root/'roster-plan.json').read_text())
v5={x['number']:x for x in json.loads((root/'docs/roster-art-review-v5.json').read_text())['lineages']}
report={'revision':6,'approvedLineages':len(changes),'approvedForms':len(changes)*3,'reviewFile':'Spirimon_Requested_Form_Adjustments_Review.pdf','lineages':[]}

def transparent_paper(im,closed_paper=False):
 p=np.array(im.convert('RGBA'));rgb=p[:,:,:3].astype(np.int16);h,w=p.shape[:2]
 corners=np.concatenate([rgb[:8,:8].reshape(-1,3),rgb[:8,-8:].reshape(-1,3),rgb[-8:,:8].reshape(-1,3),rgb[-8:,-8:].reshape(-1,3)])
 paper=np.median(corners,axis=0)
 eligible=(np.max(np.abs(rgb-paper),axis=2)<=24)&(np.min(rgb,axis=2)>=208)
 seeds=np.zeros((h,w),bool);seeds[0]=eligible[0];seeds[-1]=eligible[-1];seeds[:,0]=eligible[:,0];seeds[:,-1]=eligible[:,-1]
 background=ndimage.binary_propagation(seeds,mask=eligible)
 if closed_paper:
  # Enclosed negative space between dark limbs/tails uses the same review paper.
  labels,count=ndimage.label(eligible);regions=ndimage.find_objects(labels)
  for index,region in enumerate(regions,1):
   if region is None:continue
   local=labels[region]==index
   if local.sum()<100:continue
   values=rgb[region][local]
   if np.max(np.abs(values.mean(axis=0)-paper))<3 and np.max(values.std(axis=0))<7:
    background[region]|=local
 p[background,3]=0
 # Clear tiny isolated paper specks, retaining small authored lights and motes.
 labels,n=ndimage.label(p[:,:,3]>32);sizes=np.bincount(labels.ravel());tiny=sizes<3;tiny[0]=False;p[tiny[labels],3]=0
 return Image.fromarray(p)

def separate(im):
 a=np.array(im)[:,:,3];h,w=a.shape;projection=(a>=64).sum(axis=0);cuts=[]
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
 boxes=[];cells=[]
 if len(cuts)==2:
  boundaries=[0,*cuts,w]
  for left,right in zip(boundaries,boundaries[1:]):
   ys,xs=np.where(a[:,left:right]>=48);assert len(xs)>100
   b=(left+int(xs.min()),int(ys.min()),left+int(xs.max())+1,int(ys.max())+1)
   boxes.append(b);cells.append(im.crop(b))
  return boxes,cells,'transparent-columns'
 labels,n=ndimage.label(a>=32);sizes=np.bincount(labels.ravel());regions=ndimage.find_objects(labels)
 ids=sorted(np.argsort(sizes[1:])[-3:]+1,key=lambda i:(regions[i-1][1].start+regions[i-1][1].stop)/2)
 assert min(sizes[i] for i in ids)>500
 centers=[(regions[i-1][1].start+regions[i-1][1].stop)/2 for i in ids];assert min(np.diff(centers))>w*.15
 cores=np.zeros(a.shape,dtype=np.uint8)
 for k,i in enumerate(ids):cores[labels==i]=k+1
 nearest=ndimage.distance_transform_edt(cores==0,return_distances=False,return_indices=True);owners=cores[tuple(nearest)];pixels=np.array(im)
 for k in range(3):
  mask=owners==k+1;ys,xs=np.where((a>=48)&mask);b=(int(xs.min()),int(ys.min()),int(xs.max())+1,int(ys.max())+1)
  isolated=pixels.copy();isolated[~mask,3]=0;boxes.append(b);cells.append(Image.fromarray(isolated).crop(b))
 return boxes,cells,'connected-bodies'

# Forms outside the requested edit stay byte-identical after WebP decoding.
preserved={'010':('current',[0,1]),'035':('previous',[1]),'055':('previous',[1,2]),'061':('previous',[0,1]),'087':('previous',[0,1]),'128':('current',[0,2])}
for item in manifest:
 key=item['id'];n=int(key);change=changes[key];row=rows[n-1];previous=resolved[n-1]['atlas'];source=review/item['atlas'];assert row['id']==prior[n-1]['id']
 if not change['edit']:
  target=v5[n]['previousAtlas'];assert (root/target).is_file();method='exact-prior-atlas';boxes=None
 else:
  im=transparent_paper(Image.open(source),key in ['015','035','047','065','074','081','087','088','102','115','117','124','135','139','141','142']);boxes,cells,method=separate(im)
  scale=min(232/max(c.width for c in cells),232/max(c.height for c in cells));atlas=Image.new('RGBA',(768,256))
  for k,cell in enumerate(cells):
   cell=cell.resize((max(1,round(cell.width*scale)),max(1,round(cell.height*scale))),Image.Resampling.LANCZOS)
   atlas.alpha_composite(cell,(k*256+(256-cell.width)//2,246-cell.height))
  if key in preserved:
   base,forms=preserved[key];oldpath=previous if base=='current' else v5[n]['previousAtlas'];old=Image.open(root/oldpath).convert('RGBA')
   for k in forms:atlas.paste(old.crop((k*256,0,(k+1)*256,256)),(k*256,0))
  target=f'./assets/roster/{row["id"]}-v6.webp';atlas.save(root/target,'WEBP',quality=92,alpha_quality=100,method=4)
 for record in (row,plan[n-1]):
  record.update(atlas=target,artRevision=6,proceduralArt=False)
  if change['base']=='previous':
   record['description']=prior[n-1]['description']
  if change['edit']:
   note=item['requested_adjustment'].replace('Restore previous forms; ','').replace('Restore previous forms. ','')
   if record is not row:record['artNotes']=note
  if key=='117':record['formData']=[{'scaleMultiplier':3} for _ in range(3)]
  if key=='010':
   forms=copy.deepcopy(resolved[n-1]['formAnatomy']);forms[2]=copy.deepcopy(forms[1]);forms[2]['limbs']['legs']=4;record['formAnatomy']=forms
  if key in ['034','035','087','094','120','124','133','139','141','055','015','047','074','081','088','106','112','116','091']:
   forms=copy.deepcopy(resolved[n-1].get('formAnatomy') or [resolved[n-1]['anatomy'] for _ in range(3)])
   for k,a in enumerate(forms):
    a['source']='image-analysis';a['confidence']=.92;a.setdefault('limbs',{});a['traits']=list(a.get('traits',[]))
    if key in ['034','035','120','124','133','139']:
     a['bodyPlan']='biped';a['limbs'].update(legs=2,arms=4 if key=='034' else 2);a['manipulators']=a['limbs']['arms'];a['traits']=list(set(a['traits']+['hands']))
    if key=='087' and k==2:a['bodyPlan']='quadruped';a['limbs'].update(legs=4,arms=0,wings=2);a['traits']=list(set(a['traits']+['wings','fly','gel','talons']))
    if key=='094':a['limbs']['wings']=2;a['traits']=list(set(a['traits']+['wings','fly']))
    if key=='055' and k==0:a['limbs']['wings']=6;a['traits']=list(set(a['traits']+['wings','fly']))
    if key=='141':a['bodyPlan']='quadruped';a['limbs'].update(legs=4,arms=0,wings=2 if k==2 else 0);a['manipulators']=0;a['traits']=list(set(a['traits']+(['wings','fly'] if k==2 else [])))
    if key in ['015','047','074','081','088','106','112','116']:a['limbs']['tentacles']=[2,4,6][k];a['traits']=list(set(a['traits']+['tentacles']))
    if key in ['081','091']:a['traits']=list(set(a['traits']+['talons']))
    a['traits'].sort()
   record['formAnatomy']=forms
  if record.get('formAnatomy'):
   if record is row:record.pop('anatomy',None)
   else:record['anatomy']=copy.deepcopy(record['formAnatomy'][0])
 report['lineages'].append({'number':n,'id':row['id'],'atlas':target,'previousAtlas':previous,'action':item['action'],'adjustment':item['requested_adjustment'],'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'sourceBoxes':boxes,'extraction':method,'atlasSha256':hashlib.sha256((root/target).read_bytes()).hexdigest()})
 pixels=np.array(Image.open(root/target).convert('RGBA'));assert pixels.shape==(256,768,4)
 for k in range(3):
  a=pixels[:,k*256:(k+1)*256,3];ys,xs=np.where(a>=48)
  assert len(xs)>100 and xs.min()>0 and xs.max()<255 and ys.min()>0 and ys.max()<255,(key,k,'clipped')
  assert not np.any(np.concatenate((a[0],a[-1],a[:,0],a[:,-1]))),(key,k,'border')
 print(key,row['id'],method,flush=True)
(root/'roster.mjs').write_text(text[:match.start(1)]+json.dumps(rows,separators=(',',':'))+text[match.end(1):])
(root/'roster-plan.json').write_text(json.dumps(plan,indent=2)+'\n')
(root/'docs/roster-art-review-v6.json').write_text(json.dumps(report,indent=2)+'\n')
