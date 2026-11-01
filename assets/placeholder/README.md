# Mystery Spirimon artwork

- `mystery.webp`: the user's supplied translucent creature, mist and question-mark image, encoded at 256×171 for use in battles and menus. Its transparency and aspect ratio are preserved.
- `mystery-walk.webp`: a matching 320×320 atlas, four rows and four columns, with 80×80 cells. Rows: up, down, left, right. Columns: contact, passing, opposite contact, opposite passing. Walking uses all four frames; idle uses frame zero.
- `preview.html`: an animated preview of all four directions.
- `../../placeholder-art.mjs`: embedded copies of both WebP assets. The deployed game does not make separate network requests for its placeholders.

The shared fallback covers battle images, collection/detail canvases, roaming creatures, and following companions. Missing or failed species images keep the mystery form; successful image decoding automatically replaces it. A placeholder is never cached as a species-specific companion atlas. Creature names, stats, saves and battle rules remain intact.

## Generation provenance

The static image was supplied by the user as `1000015399.png`; the second supplied image illustrated its intended in-game use. The four-direction walking atlas was made with the built-in image-generation tool, using the supplied transparent creature as the identity reference. Assets were then resized and encoded as WebP for game delivery.

Prompt used for the walk atlas:

> Use case: identity-preserve. Asset type: production walking sprite sheet for the Spirimon browser game. Use the attached image as the exact creature identity reference: one generic translucent dark blue-gray mystery beast with swept spiky mane, long wispy tail, glowing pale mint eyes, a large pale question mark on its flank, and swirling soft white-gray mist around its feet. Create a single precisely aligned sprite atlas, 4 columns by 4 rows, all cells exactly equal size, transparent background, no grid lines, no labels, no scene, no ground platform. Each cell contains one full-body rendition of this SAME creature centered on the SAME ground baseline, surrounded by the SAME small mist halo, ample transparent gutters so sprites never touch. Row 1: walking UP / away from camera (back view). Row 2: walking DOWN / toward camera (front view). Row 3: walking LEFT (left-facing profile). Row 4: walking RIGHT (right-facing profile). In each row, columns are four consecutive animation poses for a smooth looping four-legged walk: contact, passing, opposite contact, opposite passing. Animate the actual legs in alternating diagonal pairs, gentle body rise/fall, swaying mane/tail, drifting translucent foot mist. Keep size, palette, volume, identity, opacity, head shape and baseline consistent across every frame. Keep the supplied mysterious creature design, no new species, no clothing, no scenery, no UI, no text except the pale '?' insignia where its body flank is visible. Transparent empty pixels outside creature and mist, preserve soft alpha in the mist. Pixel-art-inspired contours matching the attached reference, recognizable at small game sprite sizes. Output one square 4x4 atlas.
