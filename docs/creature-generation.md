# Creature generation and migration

The public taxonomy contains twelve ordered types. Humanoid is retained only as legacy save nomenclature and as a hidden, visually inferred body-plan flag. It grants no type matchups and no automatic stat multiplier.

## Species creation

1. Select a biome-weighted base type and a different modifier type.
2. For a discovered ordered pair, choose a familiar species on the 90% branch. The other branch selects an undiscovered species or creates a new one. Already placed individuals keep their IDs.
3. Choose a seeded anatomical reference from `creature-catalog.mjs` and a modifier from a separate transformation catalog. The [full catalog](creature-catalog.md) contains 481 animal references and 232 references across the other eleven types. No minimum animal weight is imposed.
4. Build a body plan, limb and manipulator counts, trait list, strength class, reference morphology, three related names, and a shared visual motif. Modifier traits are combined with the base; they do not replace its identity.
5. Assign a guaranteed appropriate Domain from weighted anatomical/concept cues, then repeat the existing independent 1% check for each additional nonduplicated Domain. Old valid Domains are retained. Reloading does not reroll Domains.
6. Build the initial four moves and broader learnset from types, assigned Domains and anatomy. Physical claw, fang, horn and wing moves require matching recorded anatomy; spiritual manifestations need not have physical appendages. Anatomical techniques add grasping, natural weapons, wings, armor, roots and psychic organs. New advanced Domain techniques require their assigned Domain; existing learned techniques remain available after migration.
7. Complete and validate three form images before registering a newly generated lineage. Built-in generation works without AI. All providers use the same admission rules; text-only providers use original procedural artwork rather than borrowing another creature's atlas.

## Combat Domains

Active combat Domains are the union of the species' assigned Domains and the Domains on that individual's equipped Moves. Assigned Domains always remain active, even with no Domain-bearing Moves equipped. Replacing the last Move of an additional Domain removes only that temporary affinity. A known but unequipped Move adds no Domain, and duplicate Domains or their legacy aliases count once. The same combined set determines combat weaknesses, resistances and Domain-based weather protection. Move-granted combat affinities do not permanently alter species records or grant Domain-restricted equipment or field capabilities.

## Artwork checks and limits

The anatomy renderer constructs body plans, limbs, features and shared markings directly from the anatomical record. The resulting `procedural-verified` status attests to that construction and pixel checks; it is not a claim that an independent vision model recognized a particular animal species. These simplified diagrams remain internal design data. In the game, unfinished lineages use the supplied question-mark mystery creature and its walking animation until finished artwork is available. Legacy cached procedural PNGs follow the same rule.

External image-model artwork must pass both pixel checks and a vision-capable local Ollama model. Without a vision model, the companion uses the offline renderer. Image checking never silently converts an unknown image into a successful semantic classification.

Pixel checks cover dimensions, foreground occupancy, margins, edge clipping, bounding-box-normalized silhouettes, palette overlap, pixel fingerprints and near-duplicate appearance signatures. Border-connected near-white pixels are removed; enclosed white markings remain. Three evolution images must differ and retain sufficient silhouette and palette continuity. The browser also compares new artwork against the metrics of the species already present in its library.

The vision model independently reports ordered types, body plan, visible traits, manipulators, nonhuman status, and confidence in the anatomical reference. Each form requires confidence of at least 0.8 and must visibly contain a modifier feature. Incorrect types, different body plans, missing modifiers, low reference confidence, and human subjects are rejected. Image generation retries once with the validation error, then uses a procedural fallback. Model confidence is evidence, not a guarantee of recognition accuracy; ambiguous images remain unverified.

Original atlas species keep their artwork. Settings → Inspect collection anatomy checks owned original lineages through the companion. With AI enabled and a detected vision model, inspection also runs at startup. Each form receives its own anatomy record. Specialized equipment eligibility uses the actual permanent form; cosmetic form switching cannot change it. Existing equipment is grandfathered during migration until the owner replaces it.

## Anatomical capabilities

Every species has a structured record for Push, Crush, Cleave, Swim, Fly, Dig, Teleport, Climb, operating mechanisms and manipulating equipment. Each entry stores availability, method, evidence and confidence. Field logic reads the record instead of searching names/descriptions on each interaction. Natural and supernatural routes coexist: strong limbs or vines can Push, while a Psionic Domain provides telekinetic alternatives.

New specialized equipment benefits require verified grasping appendages. Upright posture alone does not grant equipment handling, and no hidden humanoid flag increases item potency. Original artwork without vision inspection uses an explicitly lower-confidence legacy anatomical record for field fallbacks; the game's alternative puzzle mechanisms remain available.

## AI mechanics

AI may propose four starting moves and change their supported mechanics. Each move retains its slot identity and assigned type/Domain. Values are bounded: power 0–100, accuracy 0.65–1, speed −30–25, supported Physical/Energy/Status categories, targeting and effects. Expected damage, extra hits, positive speed, status effects and spread targeting share a 120-point budget. Resource contribution is recalculated by code, never accepted from the model. Unsupported or anatomically impossible proposals fall back per slot without discarding the valid species design. Accepted changes are also written into its learnset so equipping a move by ID retains those mechanics.

## Saves

Migration preserves species IDs, names, owned and wild individual IDs, levels, experience, bonds, training, equipment, permanent/cosmetic forms, learned move IDs and world progress. Former Humanoid types are reclassified from their existing concept into a distinct supported type; their old ordered types remain in hidden migration metadata. Old move IDs remain usable and their displayed type changes to the migrated species type. New Domains and techniques are added without replacing established moves.

Species records are stored in the browser species library as well as the current world, fixing cross-world persistence. Backup import migrates creature records before validating the twelve-type taxonomy. Original roster installation reuses saved species snapshots instead of rerolling them.
