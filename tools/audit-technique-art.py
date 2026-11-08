"""Verify every runtime source rectangle contains distinct visible artwork."""
import hashlib
import json
import math
import subprocess
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
code = """
import {TECHNIQUE_ARTWORK,EFFECT_ATLASES} from './technique-artwork.mjs';
import {artworkFrame} from './battle-effects.mjs';
console.log(JSON.stringify(Object.entries(TECHNIQUE_ARTWORK).map(([id,a])=>({
 id,path:EFFECT_ATLASES[a.atlas],rect:artworkFrame(a,{width:768,height:768})
}))));
"""
rows = json.loads(subprocess.check_output(
    ["node", "--input-type=module", "-e", code], cwd=root, text=True))
images, seen = {}, set()
minimum = float("inf")
for row in rows:
    path = root / row["path"]
    if row["path"] not in images:
        images[row["path"]] = Image.open(path).convert("RGBA")
    image = images[row["path"]]
    assert image.size == (768, 768), f"Review new atlas dimensions: {path}"
    x, y, width, height = row["rect"]
    assert 0 <= x < x + width <= 768 and 0 <= y < y + height <= 768
    crop = image.crop((math.floor(x), math.floor(y),
                       math.ceil(x + width), math.ceil(y + height)))
    count = sum(crop.getchannel("A").histogram()[32:])
    minimum = min(minimum, count)
    assert count >= 50, f"Empty artwork: {row['id']}"
    digest = hashlib.sha256(crop.tobytes()).hexdigest()
    assert digest not in seen, f"Duplicate artwork: {row['id']}"
    seen.add(digest)
report = {
    "atlases": len(images),
    "assignedPieces": len(rows),
    "distinctPieceHashes": len(seen),
    "minimumVisiblePixels": minimum,
    "emptyAssignments": 0,
    "registrySHA256": hashlib.sha256((root / "technique-artwork.mjs").read_bytes()).hexdigest(),
    "assetSHA256": {path: hashlib.sha256((root / path).read_bytes()).hexdigest()
                   for path in images},
}
(root / "docs/technique-art-audit.json").write_text(json.dumps(report, indent=2) + "\n")
print(f"Verified {len(rows)} distinct visible pieces across {len(images)} atlases.")
