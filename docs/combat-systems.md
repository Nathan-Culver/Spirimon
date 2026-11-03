> Current live rules: [Spiritual Energy and GCD/LCD combat](spiritual-energy.md). The historical round/borrowing descriptions below document the legacy resolver retained for regression tests; live combat uses manual three-creature GCD/LCD scheduling and Sealer support.

# Combat systems

This release uses one elapsed-time simulation for single and double battles. See [real-time combat](real-time-combat.md) for cooldowns, level thresholds, timers and pause behavior. Existing saves, creature IDs, learned moves, shared resource pools, and the original five charm IDs are retained.

## Moves and conditions

Every catalog effect has a combat handler. Might, power, defenses, speed, accuracy and evasion stages affect their calculations and are bounded from −6 to +6. Paralysis reduces speed and can interrupt actions. Confusion can cause self-damage. Sleep, freezing, trapping, disabling, taunting, regeneration, screens, weather and terrain have timed lifetimes. Their lifetimes use elapsed-time deadlines. Ongoing damage pulses every two simulated seconds, including while selecting Moves or using Bag controls. Pause, backgrounding and required replacement selection freeze the clock.

Counter and Mirror Coat retaliate against the matching attack category received within the last eight seconds. Destiny Bond can cause a mutual knockout. Seed effects drain vitality to their living source. Sleep-only attacks require sleep, delayed attacks wait for their countdown, rampages lock the selected move, and damaging pivots and Baton Pass request replacement selection on the live timeline. Baton Pass carries combat stages to that replacement.

Rain and sun affect matching elemental damage. Sand and snow cause chip damage with defined type/domain exemptions. Grassy terrain restores vitality; electric terrain prevents sleep, misty terrain prevents afflictions and psychic terrain stops priority-effect attacks. Reflect and energy screens protect a whole side and expire. Safeguard protects against afflictions. Break-ward attacks remove wards and defensive screens before damage.

Move previews remain narrative only. Numerical data, targeting, equipment rules and action costs appear in their own controls or inventory pages.

## Switching

Spikes stack to three layers, toxic spikes to two, and rocks and web to one. They belong to the battle side and affect every incoming replacement. Hazard clearing removes the acting side's hazards. Boots prevent all entry hazards; Swift aspects avoid web; Titan aspects and Grounding Anchors resist forced displacement. Trapping prevents ordinary voluntary switching; Baton Pass can escape the binding.

Ordinary switches clear volatile conditions and stages while preserving major status and resources. Batons transfer stages. Major-status healing, resource restoration and complete combat-state cleanup are distinct operations. Full restoration removes stale battle state without changing permanent build choices. Once-per-battle item, aspect and ability flags survive switches.

## Double battles

Both teams have independently acting active Spirimon. Select an ally to command it, or enable Auto for that ally. Each has its own casting, recovery and Move cooldown record. Single-target attacks choose a foe, compatible support techniques choose an ally, and spread attacks pay resources once even when both targets are struck. Pressure increases that single payment if any struck target has Pressure.

Four HUDs show health, resources and timed status badges. Each enemy chooses actions without waiting for player orders. Bag abilities and switches commit the acting Spirimon's recovery. Healthy reserves replace defeated creatures; required allied replacement selection pauses the timeline. Participants receive experience on victory. Cooldowns remain attached to each individual across withdrawal and re-entry.

## Opponent decision tree

The AI first chooses a release, survival, finishing or development branch. It then generates legal move/style/target candidates and scores expected damage, knockout probability, speed, resource availability, recoil, healing, protection, existing conditions, hazards, battlefield synergy and reserve matchups. It can preserve a threatened creature by switching to a healthier counter. In live combat, candidates on cooldown are excluded, expected results are evaluated against execution time, and the second enemy re-evaluates public state independently. The AI never reads the player's declared actions. Local randomness only breaks equally scored choices.

## Equipment and aspects

The original twenty held items remain compatible with the [procedural Held Item expansion](held-items.md). Its six categories and five rarities add active Bag abilities and generated relics. Legacy items include stat charms, accuracy aids, thorns, draining attacks, one-time status protection, survival bands, entry-hazard boots, switch recovery, an offensive orb, screen/weather extension and consumable healing, cleansing and resource recovery. Equipment changes require a safe place. Equipping consumes an owned inventory copy; replacing or unequipping returns it; consumed items are removed permanently. Changing HP equipment preserves current HP and clamps it to the new maximum; it never heals or revives the wearer. Resting refills an increased maximum.

Eight aspects—Natural, Primal, Astral, Titan, Swift, Verdant, Umbral and Stormbound—combine stat changes with entry, weather, terrain, priority or damage behavior. Unlocks have level, bond and Coin requirements; once unlocked, switching is free at safe places. Each individual stores its own unlocks and aspect. Existing aspects are retained. Aspects have colored auras and Radiant creatures have visible glints in battles, the collection and companion rendering. These overlays preserve the original lineage artwork.

## Verification

The automated suite covers catalog-handler completeness, stages, conditions, timers, counters, delayed moves, hazards, passing, targeted and spread attacks, shared costs, real-time scheduling and interruptions, save serialization, inventory conservation, consumables, aspect unlocks and AI choices. Browser playtests use separate saves. The Pages cache uses network-first HTML so deployments can replace an older game while preserving browser saves.
