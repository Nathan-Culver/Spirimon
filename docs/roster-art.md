# Dedicated roster artwork

All 150 general-roster lineages have dedicated full-body artwork for their three named forms: 450 form images. Each lineage resolves to its own transparent 768×256 WebP atlas, with three 256×256 cells in progression order.

## Evolution progression review

The completed review covers all 150 lineages and 450 forms. It selected 144 lineages for replacement, producing 432 reworked form images. The six retained lines already have substantial transformations: #15 Jarjell, #17 Kilnwarden, #18 Torrentreed, #19 Cinerwraith, #20 Glasswhorl and #32 Lacquertor.

Reworked lines use versioned `-v4.webp` filenames. Designs retain their creature identity, materials, palette and canonical Types while changing body proportions, silhouette, posture and defining structures. Examples include Kilnscale’s curled pup → low crawler → upright armored sentinel, Aurelattice’s hatchling → articulated guardian → six-winged mechanism, and Mycogaze’s eye capsule → walking fungal ring → spreading mycelial organism. Size and ornament alone were not accepted as meaningful transformations.

`roster-evolution-review.json` records every decision, all three stage descriptions, source and packed-image hashes, extraction bounds, and completion status. `roster-evolution-prompts.json` records the OpenAI image_gen design prompts and any finishing prompt used to correct a background. Full-resolution generation-source filenames are provenance, not runtime dependencies; the game consumes only the packed atlases.

Kilnwarden retains its vertical fire-and-darkness eye. Lacquertor retains four long bulky arms, its hunchback and natural boulder mantle. Other requested monstrous features are preserved, including Gloomglen’s boar head, Wraithspire’s two heads, and Mistralwisp’s four arms. Form-specific anatomy follows the observed artwork when an evolution changes its body plan or limb structure.

## Existing journeys

Existing journeys and imported backups receive the current atlas paths, descriptions and form anatomy automatically. Individual IDs, forms, levels, resources, bonds, cooldowns, equipment and techniques are preserved. Old procedural PNG caches are discarded for roster species with dedicated atlases. Newly discovered procedural lineages still use mystery artwork until their own finished artwork is supplied.

## Packing and validation

`tools/pack-evolution-art.py` accepts a JSON manifest of numbered source images and prompts. It mechanically separates and scales all three forms together without redrawing their designs. Transparent columns are preferred; connected-body extraction preserves tails, wings and effects whose horizontal extents overlap. Packing uses Pillow and NumPy, with SciPy for that fallback.

`tools/audit-roster-art.py` verifies every atlas, its dimensions and alpha channel, distinct lineage and form images, nonempty cells, and transparent borders. `roster-art-audit.json` records the resulting hashes and bounds for all 450 cells. Runtime tests also cover artwork selection, saved-game migration and the compiled game bundle.
