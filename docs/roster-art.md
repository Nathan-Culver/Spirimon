# Dedicated roster artwork production

All entries 51–150 have individually generated three-form source strips (300 new form images). The production workspace disconnected during final packing and validation. GitHub's runner recovered eight strips, including an empty Frostwyrm checkpoint file. The runtime now includes dedicated artwork for entries 51–88 and 144–150, plus corrected Lacquertor: 95 of the 150 lineages, 285 forms in total. Entries 89–143 still need source recovery, packing and review; they retain the mystery placeholder. The complete artwork integration remains unfinished.

Atlases are transparent 768×256 WebP files, with three 256×256 form cells. Lacquertor's versioned atlas preserves its juvenile and replaces the castle towers on forms two and three with rugged shoulder boulders in the actual image. The runtime paint-over was removed.

Saved roster species receive their current atlas path and description while preserving individual forms, levels, resources, bonds, cooldowns, equipment and techniques. Old procedural PNG caches are discarded for roster species with dedicated atlases.

All 100 design briefs and the common generation prompt are in `roster-art-prompts.json`. Eight recoverable original PNG strips are preserved under `artwork/roster-source/`. `tools/pack-recovered-roster-art.py` mechanically locates transparent gaps and scales the three forms together without redrawing creature designs. Other original images were generated in the conversation and should be recovered rather than needlessly regenerated. The interrupted workspace had packed images through entry 129; only entries 51–88 had been uploaded before disconnection.
