# Sealer Spiritual Arts

The November 6 Spiritual Energy questionnaire is implemented as progression and occasional support, not continuous battle resource management. Personal signature Techniques, Overdraw and focus allocation are excluded.

## Attributes and migration

Reserve, Control and Output each have allocated points plus permanent training. Start with six points; every subsequent Sealer level grants three. `ensureDisciplines` migrates once from the saved level and distinct recorded training milestones. All earned allocation points become available, while recorded milestones become permanent gains. Existing Energy is clamped to the recalculated capacity, never replenished; support, creature and item cooldowns remain untouched. Fractional Energy survives normalization.

Maximum Energy is 100 + 5 × total Reserve, plus the existing individual-bond capacity reward. Control reduces costs by 40% × Control/(Control + 40); combine multiplicatively with bond and vow discounts, with a floor of 40% of the original cost. Paid actions round up. Reserve can grow without limit; efficiency and empowerment use diminishing returns.

Allocation is available outside battle in Menu → Spiritual Arts. Retraining requires a safe place and costs 100 + 25 × Sealer level Coin. It refunds allocated points, preserves permanent training and does not heal or refresh cooldowns. Distinct quests grant Control, training milestones grant Reserve, rituals grant Output. Sensing instruction requires level/milestone prerequisites and Coin. Repeated ordinary uses do not grant attribute points; meditation awards are limited to distinct 4/12/24/48-session milestones.

## Empowerment and timing

Tap support for normal strength; drag right to select extra Energy (five pixels per point after a 16-pixel dead zone). Drag upward 60 pixels to cancel. Arrow keys adjust expenditure and Home resets it. Pointer cancellation, loss of capture, Escape and blur discard the gesture. Pointer use suppresses the subsequent synthetic click to prevent double expenditure.

The default extra expenditure limit is 10 + Output. The effect bonus is 50% × extra/(extra + 10). Control discounts payment, not the investment used to calculate potency. The live preview shows total cost, effect, cast time, cooldown and sacrifices. Costs are revalidated on release; insufficient Energy spends nothing.

Mend, Conduit and Reawakening trade empowered strength for up to 1.5 × bonus seconds of casting; their cooldowns are unchanged. Other families stay instant and add up to bonus × 50% to their cooldowns. Ordinary taps remain instant. Cast-time support spends Energy and starts cooldown/GCD on initiation, resolves once on the simulation clock, survives saves, and does not queue another Sealer support action. Defeated, withdrawn or no-longer-safe sacrifice recipients are skipped. Instant support GCDs cannot be extended by incoming damage.

Support's minimum base expenditure is 3 Energy, or 10 for team-wide/revival Techniques; generated effects can cost more. Creature-level scaling, bond efficiency, Control and vows apply consistently to learned and generated copies. Copies still share cooldowns by Technique identity. Empowered cleanse removes additional eligible conditions in five-investment steps.

Sealing has a 4-Energy base before Control, plus Output-limited optional investment with its existing exponential diminishing success benefit. Rituals share the extra-expenditure cap, cost efficiency and diminishing potency: Purification adds healing, Sanctuary extends protected steps, and Passage Unbinding extends barrier reach. Field capabilities receive Control's discount but have no optional empowerment. Field releases cost approximately 2–6 Energy; a free battle lead is not a free field release. Already-paid ongoing traversal remains usable without paying again.

## Vows

Choose one curated vow at a safe place; selection persists. Three start unlocked; additional vows unlock through levels or distinct training milestones. Vow restrictions are enforced wherever applicable. A warning allows the player to continue deliberately. Breaking a vow suspends its benefit for the rest of that battle, or until the next battle ends when broken outside combat. Changing vows cannot bypass an outstanding penalty. Save/reload preserves penalties.

| Vow | Restriction | Benefit |
| --- | --- | --- |
| Solitary Bond | One active Spirimon | Support costs 15% less |
| Open Hand | No offensive Sealer support, Omega or attacking cooperation | Healing/protection support effects +10% |
| Unbroken Circle | Form the opening team before the first Technique, then no voluntary recalls or replacement | Cooperative cost −15% |
| Patient Seal | No empowered sealing | Unempowered sealing success +5 percentage points |
| Quiet Pilgrim | No perception or concealment | Out-of-battle Energy recovery +10% relative |
| Ritual Keeper | No empowered support or sealing | Ritual cost −20%, scalable ritual effects +10% |
| Concentrated Release | No exploration rituals | Empowerment expenditure limit +20 |

Ordinary Spirimon attacks do not violate Open Hand. Vows do not grant benefits that require nonexistent actions; their bonuses affect implemented systems. Breaking-vow execution is revalidated before resources are spent.

## Exploration

Perception and concealment are independent toggles that can run together. Their Energy drains add, accrue fractionally, pause when exploration is paused, stop at depletion and automatically turn off on battle entry. Manual reactivation is required afterward. Existing passive exploration recovery continues. Perception starts at six tiles and two Energy/minute; concealment starts at a 25% encounter/detection reduction and three Energy/minute. Control lowers drain. Output adds diminishing range/strength; paid, prerequisite-gated advanced training improves both range/strength and drain efficiency.

Perception marks exact coordinates for nearby completed Spirimon, Sealer presences, shrine/ritual traces, caches, dungeon barriers, inscriptions, runes, concealed passages and regional legendary disturbances. It neither completes puzzle sequences nor opens paths. Discovery overlays are cached for 400 ms and bounded by perception range. Concealment reduces random surface/cave encounters and detection by random hostile agents; higher-level enemies resist its effect. Mandatory rivals and narrative battles remain possible.

## Enemy Sealers and validation

Enemies distribute earned points across the same three attributes and use the same cost/Output/empowerment rules. Notable rivals and bosses can have visible vows; ordinary Sealers do not. AI chooses affordable empowerment and respects vows. HUD/log cues identify vows and support channeling.

`npm run audit:energy` checks balanced allocations against five progression benchmarks with a lead plus two paid manifestations and modest support per battle. Target: 6–10 routine battles per full reserve. Specialized allocations intentionally alter endurance and burst potential. Tests cover migration, retraining, costs, vows, delayed support, save persistence, depletion, enemy parity and mouse/touch/keyboard empowerment interactions.
