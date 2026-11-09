# Approved forms and names — 9 November 2026

The attached **Updated Spirimon** review PDF supplies 47 changed Forms across 26
General roster lineages. Those embedded illustrations are now the runtime art.
The source PDF hash, page numbers, form numbers, changes and atlas hashes are
recorded in `roster-art-review-v7.json`.

The importer reads each page's visual left-to-right placement, combines the
embedded RGB images with their original alpha masks, and fits them into the
existing 256-pixel runtime cells. It preserves the original decoded pixels of
all cells that the PDF does not replace, verified before writing the report.
The atlases use lossless WebP; the complete offline download consequently has
a 69 MiB budget and the core art a 43 MiB budget.

The PDF contains front illustrations only. All 47 changed Forms now have matching
authored rear views for ally battles and northward companion rendering.
`reviewed-rear-art-v7.json` records their source hashes, prompts, reference front
hashes and runtime atlas hashes. Every unchanged rear silhouette is preserved
pixel for pixel. All 150 rear atlases / 450 source rectangles are audited again
after packing to retain complete silhouettes without neighboring fragments.
Updated anatomy drives companion motion, including Gossarach's four arms and
Lotoseraph's quadrupedal body.

`approved-form-names.json` records all 150 General Form 3 renames and all 12
legendary form renames. General Forms 1 and 2 keep their names. Legendary
lineages are Astravore, Somnarch, Ultirora and Bathyecho; their stable internal
keys and location IDs remain unchanged, and their former names still resolve
to the correct legendary profile.

Roster installation refreshes shared species names, form names, artwork and
anatomy in saved journeys. Individual levels, experience, learned Techniques,
equipment, bonds and current resources remain intact. Legendary names migrate
at startup, including legends already bonded before the update. Generation
references are rebuilt from the new current roster.

To reimport the source PDF with PyMuPDF and Pillow installed:

```bash
python tools/import-reviewed-pdf.py /path/to/this.pdf
node tools/build-generation-references.mjs
node build.mjs
node --test tests/*.test.mjs
```
