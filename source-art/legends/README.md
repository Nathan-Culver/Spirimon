# Legendary source sheets

Four generated transparent source sheets, stored as lossless WebP. The original PNGs remain in the generation history. Each sheet contains three front and three rear evolution figures.

`python tools/pack-legends.py` isolates the six alpha silhouettes and repacks them into equal 256-pixel runtime frames. Source crop rectangles are recorded in `docs/legend-art-audit.json`. Only the eight packed atlases under `assets/legends/` ship with the game.
