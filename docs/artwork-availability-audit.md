# Spirimon artwork availability audit

The audit covers all 150 general-roster lineages and all 450 forms, plus runtime encounter selection, generated designs, saved libraries, imports, recovery worlds and artwork jobs.

## Results

- Every general-roster atlas exists and decodes as a transparent 768×256 WebP. All 450 form cells contain visible artwork, have clear borders and differ from every other cell.
- Phone portrait and landscape browser checks downloaded every roster atlas and rendered all 450 forms successfully. Each new-world roaming encounter used completed artwork.
- Encounter selection was checked across all 132 ordered Type pairs. Unfinished designs and incomplete sprite arrays were excluded; completed library lineages provide encounters while future artwork is prepared.
- Actual browser backup import restored completed images from the shared species library, restored the imported generation queue, preserved owned IDs, XP and bonds, and retained unfinished wild individuals while providing seven completed roaming encounters.

## Corrections

Normal wild, trainer, trade and facility encounters now use completed artwork. New designs remain outside the encounter pool until all three form images are finished. Existing unfinished wild records are retained and become interactive again when their own images are complete; visible populations receive a one-time backfill of completed lineages.

Legendary battles and binding rites check artwork before beginning a battle or offering an Energy-spending ritual stage. A missing-art legend remains unavailable until its images are ready and reports why.

Saved species recover finished images already stored under that same species ID. Owned records retain their names, stats, Techniques and progression. Imports and recovery worlds load the correct queue. Changing worlds cancels generation requests, and late responses cannot write into another save.

Artwork repairs cover owned, battle, trade, roaming and seen species. Unseen future designs remain repairable after text-only generation. Referenced and owned repairs cannot be starved by a full queue of future designs.

## Limits

A code update cannot invent missing finished images in a private device save. Existing owned generated creatures without images still require their exact saved design and an image-capable provider or separately created artwork. Their identities are preserved, and their missing-art status remains explicit. The audit did not read the player's private phone storage.

Validation: the full automated suite passes, including artwork admission, save recovery, queue priority and cancellation regressions. Browser validation covers phone portrait and landscape layouts.
