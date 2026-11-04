"""Decode and inspect every roster atlas, including all three individual forms."""
from pathlib import Path
from PIL import Image
import hashlib,json
import numpy as np

root=Path(__file__).resolve().parents[1]
rows=json.loads((root/'roster-plan.json').read_text())
report=[];strip_hashes=set();form_hashes=set()
assert len(rows)==150
for row in rows:
 path=root/row['atlas'];payload=path.read_bytes()
 digest=hashlib.sha256(payload).hexdigest()
 assert digest not in strip_hashes,('Duplicate lineage artwork',row['id'])
 strip_hashes.add(digest)
 with Image.open(path) as source:
  assert source.format=='WEBP' and source.size==(768,256),row['id']
  im=source.convert('RGBA')
 forms=[]
 for form,name in enumerate(row['forms']):
  cell=im.crop((form*256,0,(form+1)*256,256));pixels=np.asarray(cell);alpha=pixels[:,:,3]
  ys,xs=np.where(alpha>=48)
  assert len(xs)>100,('Empty form',row['id'],form)
  bounds=[int(xs.min()),int(ys.min()),int(xs.max())+1,int(ys.max())+1]
  assert bounds[0]>0 and bounds[1]>0 and bounds[2]<256 and bounds[3]<256,('Clipped cell',row['id'],form,bounds)
  border=np.concatenate((alpha[0,:],alpha[-1,:],alpha[:,0],alpha[:,-1]))
  assert not np.any(border),('Opaque cell border',row['id'],form)
  form_digest=hashlib.sha256(cell.tobytes()).hexdigest()
  assert form_digest not in form_hashes,('Duplicate form artwork',row['id'],form)
  form_hashes.add(form_digest)
  forms.append({'name':name,'bounds':bounds,'visiblePixels':int(len(xs)),'sha256':form_digest})
 report.append({'entry':row['index']+1,'id':row['id'],'atlas':row['atlas'],'dimensions':[768,256],'bytes':len(payload),'sha256':digest,'transparentBorder':True,'forms':forms})
output={'lineages':150,'forms':450,'distinctLineageImages':len(strip_hashes),'distinctFormImages':len(form_hashes),'entries':report}
(root/'docs/roster-art-audit.json').write_text(json.dumps(output,indent=2)+'\n')
print(json.dumps({key:value for key,value in output.items() if key!='entries'}))
