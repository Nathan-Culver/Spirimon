# PDF specification integration

Source documents: **Spirimon_Comprehensive_Game_Design_Specification.pdf** and
**Spirimon_Complete_Specification_with_199_Reconstructed_QA.pdf**, supplied on
4 November 2026. The second repeats the design specification and adds a
best-effort reconstruction, explicitly not a verbatim historical questionnaire.
This record distinguishes implemented changes from unresolved design choices;
it does not certify every open-ended content requirement as exhaustive.

## Changes in this update

| PDF sections / reconstructed questions | Runtime change | Verification |
| --- | --- | --- |
| 3, 12, 18 / 26–39, 44, 46–55, 70, 159–170 | One classification source resolves innate, equipped and temporary Domains, aliases, suppression and expiry. Combat, matching bonuses, statuses and field eligibility use it. Unknown/unequipped IDs and old derived Domain caches grant nothing. Plant remains a Type; Plant used as a Domain aliases to Nature. | Cross-system alias, suppression, expiry, unknown Move and stale-cache regressions. |
| 4, 14 / 40–45, 195 | Sixteen distinct disciplines per Type/Domain, with classification affinity, status-group, weather and tactical triggers. HP and Speed effects now modify actual stats and cooldown calculations. Species defaults remain stable; individual study/preparation does not retrain siblings. Safe-place training retains HP percentage and does not restore resources or reset timers. | Pool uniqueness, individual JSON persistence, stat/cooldown effects, real UI handlers and legacy passive migration. |
| 5, 6 / 61–77, 85–86 | Relative duration modifiers apply once. Major and condition timers keep application time, original duration and relief factors. Suppression or equipment changes reassess duration without restarting it. Mental relief survives reassessment. | Major timer and Steady Bond regressions; existing casting/status tests. |
| 5, 14, 24 / 71–77, 195, 197–198 | Persistent afflictions retain elapsed time after an encounter and through saves. Only the healthy following companion advances exploration afflictions; sealed reserves pause them, while Move cooldowns continue on the Sealer clock. Recovery clears the saved affliction state. | Encounter exit → exploration → JSON save/load → next battle; sealed reserve timers; healing cleanup. |
| 9, 10 / 112–115, 126–139 | Player support applies current exhaustion effectiveness, including when spending the last Energy. Support does not replace an ongoing cast. Existing shared cooldown and preparation rules remain. | Existing support/casting/exhaustion suite plus mental relief persistence checks. |
| 13 / 55, 87–88, 97–104 | Available Move cards identify the actor and show STA/WIL use, GCD/LCD timing, effect and current target effectiveness. Different actors have distinct colors. Creature HUDs select actual allied/enemy targets and display allied XP. Ready Held Item actions appear in the same dock; unavailable recovery actions are omitted. The dock no longer requires its own Move-list scrolling. Submenus have a top-right Back button. | Compiled boot and existing gesture/resource UI tests; target-aware availability checks. |
| 16 / 143–152, 194 | Nighttime grass encounters are exactly twice daytime, including settlements. Water multiplies the relevant base rate. World weather enters combat; ambient weather persists and returns after temporary Move weather. Lightning can produce synthesized thunder. | Encounter ratios; ambient weather lasting beyond ordinary temporary-weather duration. |
| 17, 18 / 153–170 | Indoor following uses the designated healthy lead. Mount eligibility respects impairing statuses; field travel validates a destination before spending Energy. Dig can actually leave a cave. Existing 680 ms unaided swim, submerged sprite, faster mounted swim and two-tile follower behavior remain. | Existing swim, follower, anatomy, camera and field tests. |
| 19, 20 / 171–178 | Physical Temple floors require an actual cleared barrier/counterweight, lever, or walked rune sequence. Dungeon maps include persistent reliquaries, stabilizable hazards, inscriptions and revealed passages. Counterweights move barriers on the map; inspecting a tablet can reveal a real shortcut. Original obstacle placement and subsequent pushes preserve exit connectivity. Dungeon layouts are cached instead of regenerated every frame. | Determinism, reachable mechanisms, rune order, exit connectivity and secret passage checks across seeds. |
| 20, 21 / 176–183 | Guild trials launch real single/double/multi battles. Championship qualification checks eight Crests, rank 4 and all three trials. Eight matches span qualifiers, league, playoffs and final; only the final awards the title. Defeat, concession, draw or escape eliminates the attempt. Titles can be defended. Defeated Clan Masters can be rematched without duplicate Crests. NPC escape attempts are allowed and can fail. | Qualification, real encounter handlers, elimination, eight-match victory, title defense and rematch state. |
| 21, 22 / 179–185 | All six facilities now have persistent circuits using their prescribed match counts, scaling above conventional level caps, records and weekly Challenge Hall restrictions. Active limits and item/support restrictions are enforced by the combat engine. Draft selects three owned companions; HP, resources and Energy carry between rounds. | Every facility circuit, rotation, elimination, engine restrictions, active limits and actual trial/championship entry. |
| 22 / 184–185 | Blind random guessing is replaced by an inferable sigil pattern and a timed rhythm exercise. Activities track best scores, successes and five-win milestones; companion anatomy, Domains, tools and training influence rewards. Regional jobs use post-acceptance exploration/maintenance metrics. Nighttime settlements offer a Lantern Festival. | Pattern and timing scores; persistent records/milestones and bounded companion reward bonuses. |
| 23 / 192 | Legendary presences use stable named lineages and their own classification identities. Ritual names match the creature encountered. Legendary battles are wild encounters, allowing actual sealing; successful sealing records the legendary bond. Boss phases and real opponent teams run in the real-time path. | Compiled boot and encounter integration; deterministic world/legend tests. |
| 14, 24 / 60, 193, 195–198 | Sealer advancement also continues beyond level 100. Old individual passive choices and aliases migrate safely. Original equipment, world changes, Crests and saves remain intact. | Advancement without Energy or cooldown reset; canonical passive migration; existing save/import tests. |
| 24 / 196–198 | The standalone HTML embeds every built-in roster portrait and other referenced artwork in addition to code, CSS, fonts and world textures. The smaller online bundle does not contain the additional portrait payload. Automatic folder/file saves remain available on browsers exposing the required API; other browsers retain JSON export/import and IndexedDB recovery. | Byte-for-byte portrait embedding and independent online/offline build checks. |

## Existing foundations retained

Anatomy-led generation, twelve Types, three forms, Natures, IVs/EVs, individual
resource pools, cross-drain and Struggle, independent real-time GCD/LCD, manual
three-creature combat, Energy manifestation, support generation, sealing investment,
held equipment, day/night clocks, weather visuals, cities, shops, NPC quests,
roaming rivals, multi-floor cave generation, animated capabilities, rendering
layers, save-folder selection and source/native packaging workflows already
exist. They were reused rather than replaced. Existing tests remain part of the
full regression suite.

## Deliberate boundaries and unresolved design choices

- **Domain catalog:** both PDFs call the authoritative 28-name list unresolved
  while also listing 36 established names. Keep all 36 supported names and
  canonical aliases; do not silently remove a saved creature's affinity.
- **Pressure:** preserve the established baseline of one resource point per use
  and one additional point against Pressure (two total). The PDFs explicitly
  leave a proposed larger additional cost unresolved.
- **Omega:** preserve the existing once-per-creature-per-encounter flag, Energy
  investment and equipped-Move cooldown. The PDFs do not provide a replacement
  activation rule. This update does not invent one.
- **Progression balance:** rank 4 plus three Guild trials is the concrete
  qualification threshold chosen for the PDF's rank/trial requirement. Draft
  uses a subset of owned creatures; rentals were not specified. These choices
  live in `adventure-systems.mjs` and can be tuned without changing save identity.
- **Leaderboards:** facility records and history are local to the player's save;
  there is no authenticated global leaderboard service. New campaigns, portraits,
  season content and narrative variations can still be expanded; their catalogs
  are not claimed to be exhaustive.
- **Native saves:** an Android browser without a persistent file-access API
  cannot be made to grant one by game JavaScript. Native packaging is a separate
  workflow; JSON Save/Load and browser recovery remain functional fallbacks.
