# Dedicated roster artwork

All 150 general-roster lineages now have dedicated full-body artwork for their three named forms: 450 form images in total. Entries 51–150 received individually designed three-form strips, adding 300 form images. All roster entries resolve directly to their own atlas rather than the mystery placeholder. Newly discovered procedural lineages still use the mystery image until their own finished artwork is supplied.

Atlases are transparent 768×256 WebP files with three 256×256 form cells in progression order. Shared colors and anatomical features carry through the juvenile, mature and final forms, while later forms gain distinctive details. The common generation prompt and all 100 individual design briefs are recorded in `roster-art-prompts.json`. OpenAI image_gen created the artwork.

Entries 23, 31, 32, 33, 50, 57, 98 and 113 use revision 3 atlases with one or two focused monstrous features in all three forms: Gelmirth’s slug body, Cloudgron’s ram head, Lacquertor’s six arms, Barrowgron’s elongated arms, Draugale’s aquatic skull and webbed feet, Gloomglen’s boar head, Wraithspire’s two heads and Mistralwisp’s four arms. Original colors, materials and other identifying features remain. Versioned atlas filenames bypass older cached artwork. Full edit prompts and reviewed anatomical records are in `monstrous-roster-rework.json`.

Existing journeys and imported backups automatically receive current roster atlas paths and descriptions. Anatomical redesigns also refresh the corresponding per-form anatomy and field capabilities once per anatomy revision. Individual IDs, forms, levels, resources, bonds, cooldowns, equipment and techniques are preserved. Old procedural PNG caches are discarded for roster species with dedicated atlases. Canonical creature Types are explicitly preserved when descriptions change.

`tools/pack-recovered-roster-art.py` locates transparent gaps and mechanically crops and scales the three forms together without redrawing creature designs. Its `--first` and `--last` options limit a packing pass to selected entry numbers. Generation-source filenames are production provenance, not runtime dependencies. The game consumes only the packed atlases.

Validation covers all 150 atlas files, dimensions, alpha channels, distinct lineage assets, nonempty distinct form cells, transparent borders, actual runtime artwork selection and saved-game migration. `roster-art-audit.json` records the packed image hashes and per-form bounds.
