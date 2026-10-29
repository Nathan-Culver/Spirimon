# Spirimon
An original, local-first browser RPG about people who seal spirits into tattoo bonds.

## Play
- **Hosted:** https://nathan-culver.github.io/Spirimon/ (after publication).
- **Local, no installation:** open Spirimon.html in a normal desktop browser. The in-app preview may block local file URLs.
- **Local companion:** install Node.js 20 or newer, then double-click Start-Spirimon.cmd, or run npm start and open http://127.0.0.1:4317.
- No npm dependencies, API keys, subscriptions, or paid generation services are required.

Saves and the species library live in this browser's IndexedDB. Hosted, local-server and standalone-file versions have separate storage origins. Use Settings → Export/Import to transfer a world. Export before clearing browser storage. Browser storage is not a substitute for a backup.

## Controls
WASD / arrows: move. E / Enter: interact. B: bag.
1: explore. 2: tattoos. 3: atlas. 4: journal.
Hold Shift to run. Touch/click movement controls are on the map. Tile movement and camera scrolling are smoothly interpolated; the world fills the window without letterboxing.

On phones, Spirimon automatically uses a landscape emulator layout with translucent D-pad, A/B, Menu and Bag buttons. Hold a direction to keep walking. A interacts; holding B runs. The BAG button opens supplies. MENU opens Spirits, Map, Journal, Sealer, Options and Save. Rotate the phone sideways; fullscreen and orientation locking are offered where the browser supports them. Settings can force emulator or desktop layout. Battle and collection menus remain directly touchable. Mobile saves stay on the phone; export/import moves saves between devices. AI generation targets the Windows companion, not phone hardware.

## The first journey
Begin with no Spirit. Your first encounter is random: earn its trust with interaction or offerings, then complete the sealing challenge. A completed fresh local-AI lineage is used when available; otherwise the original shared roster provides the encounter. Keeper Iona restores spirits; Tavi sells supplies; Rowan offers rank-scaled battles and reserve-spirit trades; Scholar Elin rewards discoveries and exploration. Roaming spirits can be approached peacefully, offered food, or challenged. Hidden encounters occur in tall grass.

## Art direction and animations
A bright handheld-era presentation with original feudal Japanese/Chinese-inspired pixel villages: swept tiled roofs, timber halls, lanterns, shrine gates, bamboo, cherry trees and robed sealers. Exploration fills every screen shape. The overworld uses textured forest canopies, tall-grass patches, terraced cliffs, shoreline banks, bright village tiles and smooth grid-aligned movement. Battles use compact HP/PP HUDs, a bottom dialogue window and Fight / Bag / Spirits / Run menus. Physical lunges, elemental streams, ice shards, leaf bursts, healing and wards animate across the battle stage. Reduced-motion preferences are respected. An original offline 5×7 pixel font ships with the game.

The shared starter library contains 50 original ordered-type lineages, each with three distinct forms (150 sprites). User-uploaded images are visual references only and are not shipped. Artwork has transparent backgrounds and bounded 256×256 form cells. Local AI lineages become encounterable only when all three sprites and their validated information are complete.

## Buildings
Walk north into a doorway or interact directly below it. Sealer Halls, inns and homes have interiors, residents and a south exit. Hall keepers restore HP and shared PP; attunement is available at safe places.

## Implemented systems## Implemented systems
- Seeded, expanding world with five biomes, persistent regions, towns, terrain collision, trails and fixed regional danger.
- 13 ordered, distinct base/modifier types, complete three-form lineages, and repeated independent 1% rare-domain rolls.
- Mutually exclusive wild-form rolls: starting 94%, intermediate 5%, final 1%.
- Habitat-weighted species selection, 90% familiar / 10% new for already discovered ordered type pairs when rolling new encounters. Already placed spirits retain their identities.
- Shared local species library, with per-world discovery history.
- Six attuned tattoo spirits; reserves remain sealed. Change attunement in towns.
- Combined attack/defense power, unnumbered commitment slider, physical/spiritual resistance, physical/spiritual move traits, intuitive core matchups, statuses, passive abilities, speed modifiers and independent Agile/Normal/Strong styles.
- One baseline action each round, plus action borrowing and repayment (below).
- One shared PP pool per spirit, escalating additional-action costs, soul draught recovery, and a recoil fallback when PP is exhausted.
- Battle sealing influenced by health, status, catalyst quality and form; cooperative sealing through patience/offerings and an accessible timing challenge.
- Levels, individual potential, natures, training investment, bonds, permanent level/bond transformations, and cosmetic switching among unlocked forms.
- Guild rank, field techniques requiring suitable spirits, support wards, simple friendships, NPC trade, optional notices and a field journal.
- Recovery cost after defeat; supplies remain recoverable at the defeat location.
- Autosave, battle resume, export/import and previous-world recovery.

## Borrowed actions and PP
Select Normal action, Borrow +1, or Borrow +2.
Borrowed actions repeat the selected move. Each voluntarily funded extra action gives the opposing side one bonus action next round. Bonus actions do not create debt. Debt belongs to the battle side, so switching spirits cannot erase it. Unfunded extra actions are skipped and do not create debt.

PP is shared across all four moves. Costs derive from the move's mechanics; within a round the cost multipliers are 1×, 1.5×, 2×, 2.5×, and so on, rounded upward. The UI previews total cost. Awarded bonus actions also use escalating PP costs. Items, switching and support consume the normal action, forfeit your unused bonus attacks, and allow all owed enemy actions. Styles alter damage and priority, not allocation or the number of actions.

A spirit's previous allocation persists until it acts. Later scheduled actions have a priority offset so fast borrowed attacks can interleave with opposing actions. Fainted spirits cannot act.

## Optional free local AI
The game is immediately playable with **procedural prototype designs and pixel art**. This fallback is explicitly labeled; it is not represented as LLM generation.

For actual AI generation:
1. Install Ollama from its official site and download a text model suitable for your RAM. No model is bundled, and Spirimon does not download models automatically.
2. Run a compatible local Stable Diffusion WebUI with its API enabled (typically --api) and a locally installed image model.
3. Run Start-Spirimon.cmd.
4. Open Settings → Check companion, choose an installed text model, and enable local AI.
5. Queue a lineage or explore new regions.

Default endpoints:
- Text: http://127.0.0.1:11434
- Image: http://127.0.0.1:7860
- Companion: http://127.0.0.1:4317

Text generates a schema-checked three-form design and move names. Code preserves type rolls, stats and effects. Image generation runs sequentially after the text model is unloaded. Later forms use the first sprite as an image-to-image reference. A lineage enters the AI species library only after text and all three PNGs complete. Discovered procedural spirits are never silently replaced.

Windows computers without a dedicated GPU may take a long time to generate images. Actual model quality, memory use, evolution consistency and generation latency still require hardware testing. Review the licenses of models you choose; freely downloadable does not automatically mean unrestricted redistribution.

Custom loopback endpoints can be set with SPIRIMON_OLLAMA and SPIRIMON_IMAGE. Additional trusted browser origins can be supplied in SPIRIMON_ORIGINS (comma-separated). The companion binds only to 127.0.0.1 and permits the player's GitHub Pages origin plus local play. No credentials are embedded. Browser local-network permissions may apply; if the hosted page cannot reach the companion, play through its local URL instead.

Official adapter references:
- https://docs.ollama.com/api/generate
- https://github.com/AUTOMATIC1111/stable-diffusion-webui/wiki/API

Append ?playtest to the hosted URL for a separate browser playtest save and species library. Use ?playtest=your-test-name for an independently isolated test slot. It never reads or writes the regular game's IndexedDB database.

## Development
npm test
node build.mjs
npm start

engine.mjs: deterministic generation and combat rules.
sprites.mjs: original procedural pixel renderer.
app.mjs: gameplay, interface, browser storage, generation queue.
companion.mjs: static server and local-model adapters.
build.mjs: dependency-free standalone HTML packager.
tests/: rule and HTTP tests.

The GitHub workflow is for deployment from a dedicated repository's main branch. On the existing personal Pages repository, publish the spirimon/ folder on its already configured master branch; no hosting settings or unrelated files need changing.

## Scope of this release
This is the first playable alpha, not a completed FireRed-sized RPG. It has original assets and rules inspired by the agreed design. Full dungeon interiors, a broad move catalog, tournament brackets, richer NPC event chains, item/location transformation variants, full creature animation sets and production balance remain expansion work. The local model adapters are optional and need installed models; no actual AI model or generated AI artwork is bundled.



## Latest expansion
All50 lineages and150 distinct sprites are included. Detailed painted ground textures and irregular paths/shorelines match the town/Spirit art. Six enterable building types include the forge, herbalist and archive; towns also have roofed stone wells, barrels, crates, guardian statues, timber fencing, stone walls and stalls. The lead Spirit no longer follows on the map.

Wild encounters stay level1–5 in the starting region and6–8 in its eight immediate neighbors. After every seeded group of1–3 towns visited, newly formed farther areas gain1–3 levels. Caught Spirit levels are preserved; old wild encounters are rebalanced.

The move library has eight techniques for each of13 main types and four for each rare domain. Individuals can practice alternative moves at safe places. Mobile move menus reserve a separate Back row. Cosmetic changes and permanent transformations use generic seal-ring/silhouette/particle animations.

Offerings are one cooperation attempt per individual. Choose a resource plan: lavish requires one trial, careful two, humble three. Materials and a seal catalyst are consumed at commitment. Trial order is randomized perindividual; riddles allow one answer, while singing and dance use15-second original wordless synthesized melodies. Exact input timestamps are scored at±45/90/150ms with60% required. Options offers eight-tap median lag calibration. Failed Spirits remain available for battle and battle seals. Closing or reloading an active trial forfeits cooperation for that individual.

Music is synthesized from original note sequences, requiring a first click/tap for browser audio permission. The map uses calm instrumental music; battles use an upbeat instrumental arrangement. Music can be muted in Options. No copyrighted recordings or external audio services are used.
