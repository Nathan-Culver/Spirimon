# Settlement and interior artwork

The settlement collection adds 48 reusable assets, prepared from the three user-supplied artwork sheets and packaged into three 1024×1024 WebP atlases. Each atlas has sixteen 256×256 cells, reading left to right, top to bottom. Transparent sprites retain their alpha; atlas packaging trims disconnected neighbouring-cell fragments.

## Files and generation briefs

- `assets/settlement-props-v1.webp`: Four town façades (blue canal house, ochre tea house, jade apothecary, red workshop), then market stall, fountain, barrel cart, noticeboard, bench, stone lantern, bamboo fence, flower box, barrels/sacks, cherry planter, lion guardian, lantern post. Prompt: Japanese-inspired fantasy RPG, rich hand-painted pixel clusters, orthographic top-down three-quarter view, parallel horizontal front façades, centered front doors, weathered wood and tile, moss, coherent upper-left lighting. Four-by-four isolated sprites on genuine transparent alpha, no labels or people.
- `assets/interior-furnishings-v1.webp`: Bookshelf, counter, tea table, bed, armchair, altar, forge, anvil, apothecary cabinet, writing desk, crates/baskets, planter, lattice window, paper lantern, flowering vase, cooking hearth. Prompt: richly textured Japanese-inspired fantasy RPG furniture, carved cedar and gold trim, jade and burgundy, detailed wood grain and ceramics, orthographic top-down three-quarter view showing tops and front faces. Four-by-four isolated sprites, transparent alpha, no scenery, labels, or grid lines.
- `assets/interior-materials-v1.webp`: Cedar, walnut, travertine, slate, tatami, jade tile, burgundy carpet, indigo carpet, timber/plaster, brick, cedar paneling, carved stone relief, cobble, sandstone, jade/gold mosaic, terracotta. Prompt: exact four-by-four equal-cell material atlas, flat top-down seamless material textures, edge-to-edge, fine restrained weathering, dense crisp pixel detailing, harmonious natural palette, no objects, labels, shadows, or vignette.

These are original generated assets, rather than extracted commercial game artwork. The generator inputs and slicing helpers are not runtime dependencies.

## Procedural generation

`towns.mjs` supplies stable coordinate-based façades and two to four additional residences, yielding eight to ten buildings. All six established services retain their previous doors, names, and NPC identities. New street furnishings have explicit ground anchors, matching collision geometry. Added residential doorsteps connect to the main streets. The original wilderness and outdoor terrain art remain in use.

`world.mjs` defines distinct furnishing plans for halls, archives, inns, homes, forges, and herbalists. Ground footprints drive movement; upper sprite portions can overlap characters standing behind the furniture. Save restoration relocates an occupant only when its previous position is no longer reachable. Existing collections, Held Items, progression, and outside return positions remain intact.

`interior-assets.mjs` renders continuous four-by-four material phases, room-specific palettes, bounded rugs/tatami, windows, cornices, lantern light, thresholds and correctly sorted furniture/actors. The interior camera fits the room where possible and clamps to its edges on smaller displays. Furniture uses complete sprites rather than repeating one bed or desk in each occupied tile.

## Loading and offline use

The Pages bundle excludes large embedded settlement images. The three WebP files load through the existing retrying image loader as needed, so optional interior art cannot hold up world startup. The downloaded single-file game embeds byte-identical copies in `SETTLEMENT_ART`, with existing SVG fallbacks for furnishings while artwork becomes available. No extra startup image barrier is introduced.

## Validation

The regression suite checks atlas byte identity and offline loading, stable generation and varied densities, service-door preservation, every generated doorway and NPC's accessibility across a sample of towns, all six interior layouts, and saved-position recovery. Browser review covered the hall, inn, forge, outdoor settlement, and walking through the original hall exit and doorway.

## Supplied source sheets

The furniture and settlement atlases use the supplied transparent sheets, with disconnected cell-edge fragments trimmed during atlas preparation. The 1536×1536 supplied material sheet is resized to the shared 1024×1024 runtime grid, preserving all sixteen material cells. Original source SHA-256 values:

- Furniture: `a5d2371f7001eafbe62c05f3dc5d9b60f668357fbf97ecb47ab4799d4df839fc`
- Materials: `5fef7b977f6c59e8ea674fc98b4c1742563b3e152018ad38943c948dab63afa8`
- Settlement: `c99a4823bbea184724826580d7c6ef2c247837655822c708c112a149a0672f36`
