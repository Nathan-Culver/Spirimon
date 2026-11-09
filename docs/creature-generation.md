# Creature generation and migration

The public taxonomy contains twelve ordered types. Humanoid is retained only as legacy save nomenclature and as a hidden, visually inferred body-plan flag. It grants no type matchups and no automatic stat multiplier.

## Generation policy revision 2

New lineages use the current 150-lineage General roster as curated references, including matching approved revision corrections. `generation-references.mjs` is compiled by `tools/build-generation-references.mjs`; it never uses an older rejected atlas to override current anatomy. Conflicting language such as Mistralwisp's former four-arm description is corrected in the reference material and roster installation.

Each design has one coherent identity, materials, personhood trait and restrained spirit motif. Three explicit Form plans describe structure, proportions, posture, spiritual manifestation, anatomy, intentional surrealism and estimated dimensions. Adjacent Forms must change at least two meaningful structural axes. Size, ornament and texture alone do not qualify. Planned anatomy can change between Forms; inspection checks the appropriate permanent Form rather than requiring all three to have identical body plans.

New species have explicit Health, Physical Attack, Physical Defense, Spiritual Attack, Spiritual Defense and Speed bases. Seeded role profiles distribute a 306–336 base-stat budget across all six stats. The model cannot alter these bases, Types, assigned Domains, IVs, EVs or Natures. Classification learnset buckets have equal quotas, count each Technique toward one source, retain lineage signatures and starting moves, and apply a small role preference within the eligible choices. Existing saved species are not rerolled or rebalanced.

The companion validates the text/structural plan before requesting images. The default image settings are 768×768, 28 steps and guidance 6, with bounded provider overrides. Later Forms reference the immediately preceding accepted image. Each Form receives framing and independent semantic inspection for anatomy, nonhuman identity, Type/Domain integration, readable personhood, planned surrealism, material clarity, style and readability at game scale. A separate three-image review checks family continuity, structural progression and originality. Renaming a copied concept does not bypass novelty checks.

Only a failing Form is retried, with its precise validation error; accepted Forms remain intact. After the initial images, one bounded family repair pass can target the reported Form indices. Exhausted repairs return explicitly labeled internal geometry and an unavailability reason, never finished-art certification. The browser independently rechecks the policy revision, Form plans, image observations, family review and pixels before installing external art. Installation is transactional and retains the species' gameplay state. Missing vision/image services keep designs pending outside normal encounters.

Companion, other text providers, device AI and offline planning share the same code-authored design rules. Smaller device models receive a compact brief and retain the complete deterministic Form plans. The text-only and offline routes cannot claim finished artwork.

The six-lineage, eighteen-Form example batch is available through Options → Review new generation designs. It covers Beast, Plant, Construct, Ooze, Monstrosity and Aberration concepts. Examples are review material and are not added to encounter pools or represented as having passed a local runtime vision model. Source prompts and packing provenance are recorded in `generation-review-plans.json` and `generation-review-art.json`.

## Species creation

1. Select a biome-weighted base type and a different modifier type.
2. For a discovered ordered pair, choose a familiar species on the 90% branch. The other branch selects an undiscovered species or creates a new one. Already placed individuals keep their IDs.
3. Choose a seeded anatomical reference from `creature-catalog.mjs` and a modifier from a separate transformation catalog. The [full catalog](creature-catalog.md) contains 481 animal references and 232 references across the other eleven types. No minimum animal weight is imposed.
4. Build a body plan, limb and manipulator counts, trait list, strength class, reference morphology, three related names, and a shared visual motif. Modifier traits are combined with the base; they do not replace its identity.
5. Assign a guaranteed appropriate Domain from weighted anatomical/concept cues, then repeat the existing independent 1% check for each additional nonduplicated Domain. Old valid Domains are retained. Reloading does not reroll Domains.
6. Build the initial four moves and broader learnset from types, assigned Domains and anatomy. Physical claw, fang, horn and wing moves require matching recorded anatomy; spiritual manifestations need not have physical appendages. Anatomical techniques add grasping, natural weapons, wings, armor, roots and psychic organs. New advanced Domain techniques require their assigned Domain; existing learned techniques remain available after migration.
7. Keep unfinished designs outside the encounter pool until finished artwork exists for all three forms. Offline encounters use completed lineages from the library, preferring the rolled ordered Type pair, then the same base Type, then biome-compatible lineages. AI generation prepares future discoveries in the background. Text-only and offline providers prepare design data rather than borrowing another creature's artwork.

## Combat Domains

Active combat Domains are the union of the species' assigned Domains and the Domains on that individual's equipped Techniques. Assigned Domains always remain active, even with no Domain-bearing Techniques equipped. Replacing the last Technique of an additional Domain removes only that temporary affinity. A known but unequipped Technique adds no Domain, and duplicate Domains or their legacy aliases count once. The same combined set determines combat weaknesses, resistances and Domain-based weather protection. Technique-granted combat affinities do not permanently alter species records or grant Domain-restricted equipment or field capabilities.

## Artwork checks and limits

The anatomy renderer constructs body plans, limbs, features and shared markings directly from the anatomical record. The resulting `procedural-verified` status attests to that construction and pixel checks; it is not a claim that an independent vision model recognized a particular animal species. These simplified diagrams remain internal design data. In the game, unfinished lineages use the supplied question-mark mystery creature and its walking animation until finished artwork is available. Legacy cached procedural PNGs follow the same rule. Missing artwork is not a pending download: the details and encounter screens explicitly report when finished images are unavailable. Text-only and offline generation cannot finish image-model artwork.

When image generation is enabled, owned unfinished lineages take priority in the queue. Each repair targets the existing species ID, design and three named forms, rather than creating another species. Only finished, vision-verified images complete a repair; unavailable services or procedural fallbacks remain pending with a visible reason and a one-minute retry delay. Names, combat stats, learned techniques and individual progression are retained.

External image-model artwork must pass both pixel checks and a vision-capable inspection model. The existing local path uses Ollama; the optional OpenAI path uses a configured OpenAI vision model and never claims a procedural fallback is completed model artwork. Without a local vision model, the local companion uses the offline renderer. Image checking never silently converts an unknown image into a successful semantic classification. See [OpenAI setup](openai-generation.md) for service configuration and phone access.

Pixel checks cover dimensions, foreground occupancy, margins, edge clipping, bounding-box-normalized silhouettes, palette overlap, pixel fingerprints and near-duplicate appearance signatures. Border-connected near-white pixels are removed; enclosed white markings remain. Three evolution images must differ and retain palette and family continuity; planned structural changes use a relaxed silhouette floor plus an independent family review. The browser also compares new artwork against the metrics of the species already present in its library.

The vision model independently reports ordered types, body plan, visible traits, manipulators, nonhuman status, and confidence in the anatomical reference. Each form requires confidence of at least 0.8 and must visibly contain a modifier feature. Incorrect types, different body plans, missing modifiers, low reference confidence, and human subjects are rejected. Image generation retries the failing Form once with its validation error, then uses a bounded targeted family repair pass or an explicitly internal procedural fallback. Model confidence is evidence, not a guarantee of recognition accuracy; ambiguous images remain unverified.

Original atlas species keep their artwork. Settings → Inspect collection anatomy checks owned original lineages through the companion. With AI enabled and a detected vision model, inspection also runs at startup. Each form receives its own anatomy record. Specialized equipment eligibility uses the actual permanent form; cosmetic form switching cannot change it. Existing equipment is grandfathered during migration until the owner replaces it.

## Anatomical capabilities

Every species has a structured record for Push, Crush, Cleave, Swim, Fly, Dig, Teleport, Climb, operating mechanisms and manipulating equipment. Each entry stores availability, method, evidence and confidence. Field logic reads the record instead of searching names/descriptions on each interaction. Natural and supernatural routes coexist: strong limbs or vines can Push, while a Psionic Domain provides telekinetic alternatives.

New specialized equipment benefits require verified grasping appendages. Upright posture alone does not grant equipment handling, and no hidden humanoid flag increases item potency. Original artwork without vision inspection uses an explicitly lower-confidence legacy anatomical record for field fallbacks; the game's alternative puzzle mechanisms remain available.

## AI mechanics

AI may propose four starting moves and change their supported mechanics. Each move retains its slot identity and assigned type/Domain. Values are bounded: power 0–100, accuracy 0.65–1, explicit cooldowns, supported Physical/Energy/Status categories, targeting and effects. Expected damage, extra hits, cooldown timing, status effects and spread targeting share a 120-point budget. Resource contribution is recalculated by code, never accepted from the model. Unsupported or anatomically impossible proposals fall back per slot without discarding the valid species design. Accepted changes are also written into its learnset so equipping a move by ID retains those mechanics.

## Saves

Migration preserves species IDs, names, owned and wild individual IDs, levels, experience, bonds, training, equipment, permanent/cosmetic forms, learned move IDs and world progress. Former Humanoid types are reclassified from their existing concept into a distinct supported type; their old ordered types remain in hidden migration metadata. Old move IDs remain usable and their displayed type changes to the migrated species type. New Domains and techniques are added without replacing established moves.

Species records are stored in the browser species library as well as the current world, fixing cross-world persistence. Backup import migrates creature records before validating the twelve-type taxonomy. Original roster installation reuses saved species snapshots instead of rerolling them.

## Encounter artwork admission

Normal wild, trainer, trade and facility encounters select only lineages with finished artwork for all three forms. Sparse or empty sprite arrays and internal procedural diagrams are excluded. Saved unfinished wild individuals remain intact in the save; they are withheld from new interactions and visible populations are backfilled once with completed lineages. They become available under their original identities when their own artwork is finished. Owned creatures and battles already in progress remain intact.

Legendary encounters and binding rites also require finished artwork. An unavailable legend reports the reason before starting a battle or spending ritual Energy. Its design stays queued when image generation is enabled.

Artwork recovery covers owned, battle, trade, active roaming and seen species. Loading or importing an old species snapshot recovers completed images already stored under that same ID in the shared library without replacing names, stats or individual progress. Imports restore their own generation queue, and changing worlds cancels pending artwork jobs so late results cannot be installed into another save.
