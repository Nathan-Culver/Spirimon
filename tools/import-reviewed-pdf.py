"""Import embedded, alpha-masked illustrations without redrawing the reviewed art.

Usage: python tools/import-reviewed-pdf.py /path/to/this.pdf
Requires PyMuPDF and Pillow. Unchanged cells retain their decoded RGBA pixels.
"""
import copy
import hashlib
import io
import json
import os
from pathlib import Path
import re
import subprocess
import sys

import fitz
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
pdf_path = Path(sys.argv[1]).resolve()
pdf = fitz.open(pdf_path)
source = (ROOT / 'roster.mjs').read_text()
match = re.search(r'const SOURCE_ROSTER=(\[.*?\]);', source, re.S)
rows = json.loads(match[1])
plans = json.loads((ROOT / 'roster-plan.json').read_text())
resolved = json.loads(subprocess.check_output(
    ['node', '--input-type=module', '-e',
     "import {ROSTER} from './roster.mjs';console.log(JSON.stringify(ROSTER))"],
    cwd=ROOT, text=True))
report = {'revision': 7, 'sourcePdfSha256': hashlib.sha256(pdf_path.read_bytes()).hexdigest(),
          'approvedForms': 0, 'lineages': []}
prior_report = ROOT / 'docs/roster-art-review-v7.json'
prior = {r['id']: r['previousAtlas'] for r in json.loads(prior_report.read_text())['lineages']} if prior_report.exists() else {}

for page_index in range(2, len(pdf)):
    page = pdf[page_index]
    text = page.get_text()
    number = int(re.search(r'^(\d{3}) / UPDATED LINEAGE', text)[1])
    row, plan = rows[number - 1], plans[number - 1]
    forms = [int(n) for n in re.findall(r'FORM (\d)', text)]
    # PDF resource order is unrelated to visual reading order.
    images = sorted(page.get_images(), key=lambda image: min(rect.x0 for rect in page.get_image_rects(image[0])))
    assert len(forms) == len(images), (number, forms)
    previous = prior.get(row['id'], row['atlas'])
    old = Image.open(ROOT / previous).convert('RGBA')
    assert old.size == (768, 256)
    cells = []
    for image in images:
        xref, smask = image[:2]
        assert smask, (number, 'missing alpha mask')
        rgb = Image.open(io.BytesIO(pdf.extract_image(xref)['image'])).convert('RGB')
        alpha = Image.open(io.BytesIO(pdf.extract_image(smask)['image'])).convert('L')
        rgb.putalpha(alpha)
        cells.append(rgb.crop(rgb.getbbox()))
    scale = min(232 / max(cell.width for cell in cells), 232 / max(cell.height for cell in cells))
    atlas = old.copy()
    for form, cell in zip(forms, cells):
        fitted = cell.resize((max(1, round(cell.width * scale)), max(1, round(cell.height * scale))), Image.Resampling.LANCZOS)
        atlas.paste((0, 0, 0, 0), ((form - 1) * 256, 0, form * 256, 256))
        atlas.alpha_composite(fitted, ((form - 1) * 256 + (256 - fitted.width) // 2, 246 - fitted.height))
    target = f'./assets/roster/{row["id"]}-v7.webp'
    # Lossless encoding preserves every unmodified cell exactly after decoding.
    encoded = io.BytesIO()
    atlas.save(encoded, 'WEBP', lossless=True, method=6, exact=True)
    temp = (ROOT / target).with_suffix('.webp.tmp')
    with temp.open('wb') as stream:
        stream.write(encoded.getvalue())
        stream.flush()
        os.fsync(stream.fileno())
    temp.replace(ROOT / target)
    saved = Image.open(ROOT / target).convert('RGBA')
    for form in range(1, 4):
        box = ((form - 1) * 256, 0, form * 256, 256)
        if form not in forms:
            assert saved.crop(box).tobytes() == old.crop(box).tobytes()
        else:
            bounds = saved.crop(box).getbbox()
            assert bounds and min(bounds[:2]) > 0 and max(bounds[2:]) < 256
    # Description appears after the Domains line and before the first FORM.
    description = re.search(r'Domains: [^\n]+\n(.*?)\nFORM ', text, re.S)[1]
    description = ' '.join(description.split())
    adjustment = ' '.join(text.split('What changed.', 1)[1].split('SPIRIMON / UPDATED FORMS ONLY')[0].split())
    anatomy = copy.deepcopy(resolved[number - 1].get('formAnatomy') or [resolved[number - 1]['anatomy']] * 3)
    for form in forms:
        a = anatomy[form - 1]
        a.update(source='reviewed-pdf', evidence=f'updated-forms-page-{page_index + 1}', confidence=.95)
        if number in [11, 102, 115, 141, 144]:
            a['bodyPlan'] = 'quadruped'
            a['limbs'].update(legs=4, arms=0)
            a['manipulators'] = 0
        if number == 13:
            a['bodyPlan'] = 'serpentine'
        if number == 27:
            a['limbs']['wings'] = 2
            a['traits'] = sorted(set(a['traits'] + ['wings', 'fly']))
        if number == 133:
            a['bodyPlan'] = 'biped'
            a['limbs'].update(arms=4, legs=2)
            a['manipulators'] = 4
            a['traits'] = sorted(set(a['traits'] + ['hands', 'fangs']))
        if number in [63, 76, 89]:
            a['bodyPlan'] = 'rooted'
            a['traits'] = sorted(set(a['traits'] + ['roots']))
        if number in [55, 68, 81, 94, 129]:
            a['bodyPlan'] = 'amorphous'
    for record in (row, plan):
        record.update(atlas=target, updatedForms=forms, artRevision=7,
                      proceduralArt=False, description=description, formAnatomy=copy.deepcopy(anatomy))
        if record is plan:
            record['anatomy'] = copy.deepcopy(anatomy[0])
            record['artNotes'] = adjustment
            descriptions = record.setdefault('formDescriptions', ['', '', ''])
            for form in forms:
                descriptions[form - 1] = f'{row["forms"][form - 1]}: {adjustment}'
    report['approvedForms'] += len(forms)
    report['lineages'].append({'number': number, 'id': row['id'], 'forms': forms,
        'atlas': target, 'previousAtlas': previous, 'pdfPage': page_index + 1,
        'action': 'revised', 'adjustment': adjustment,
        'atlasSha256': hashlib.sha256((ROOT / target).read_bytes()).hexdigest(),
        'unchangedCellsVerified': [n for n in range(1, 4) if n not in forms]})
    print(f'{number:03} {row["id"]}: forms {forms}')

assert len(report['lineages']) == 26 and report['approvedForms'] == 47
(ROOT / 'roster.mjs').write_text(source[:match.start(1)] + json.dumps(rows, separators=(',', ':')) + source[match.end(1):])
(ROOT / 'roster-plan.json').write_text(json.dumps(plans, indent=2) + '\n')
(ROOT / 'docs/roster-art-review-v7.json').write_text(json.dumps(report, indent=2) + '\n')
