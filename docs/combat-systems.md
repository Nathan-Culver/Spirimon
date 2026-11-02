# Combat systems

This release uses one round resolver for single and double battles. Existing saves, creature IDs, learned moves, shared resource pools, and the original five charm IDs are retained.

## Moves and conditions

Every catalog effect has a combat handler. Might, power, defenses, speed, accuracy and evasion stages affect their calculations and are bounded from −6 to +6. Paralysis reduces speed and can interrupt actions. Confusion can cause self-damage. Sleep, freezing, trapping, disabling, taunting, regeneration, screens, weather and terrain have timed lifetimes. Their timers and ongoing damage advance once per round, including rounds spent on items, support or switching. Afflictions do not tick multiple times because of borrowed actions.

Counter and Mirror Coat retaliate against the matching attack category received earlier in the round. Destiny Bond can cause a mutual knockout. Seed effects drain vitality to their living source. Sleep-only attacks require sleep, delayed attacks wait for their countdown, rampages lock the selected move, and damaging pivots and Baton Pass request a free replacement between rounds. Baton Pass carries combat stages to that replacement.

Rain and sun affect matching elemental damage. Sand and snow cause chip damage with defined type/domain exemptions. Grassy terrain restores vitality; electric terrain prevents sleep, misty terrain prevents afflictions and psychic terrain stops priority-effect attacks. Reflect and energy screens protect a whole side and expire. Safeguard protects against afflictions. Break-ward attacks remove wards and defensive screens before damage.

Move previews remain narrative only. Numerical data, targeting, equipment rules and action costs appear in their own controls or inventory pages.

## Switching

Spikes stack to three layers, toxic spikes to two, and rocks and web to one. They belong to the battle side and affect every incoming replacement. Hazard clearing removes the acting side's hazards. Boots prevent all entry hazards; Swift aspects avoid web; Titan aspects and Grounding Anchors resist forced displacement. Trapping prevents ordinary voluntary switching; Baton Pass can escape the binding.

Ordinary switches clear volatile conditions and stages while preserving major status and resources. Batons transfer stages. Major-status healing, resource restoration and complete combat-state cleanup are distinct operations. Full restoration removes stale battle state without changing permanent build choices. Once-per-battle item, aspect and ability flags survive switches.

## Double battles

Both sides declare an order for each healthy active Spirimon before resolving the round. Players can inspect a move, confirm it, choose a target, style, commitment and up to two borrowed actions. The first declaration can be undone before the second declaration commits the round. Each Spirimon can attack, support, use an item or switch. Four HUDs and four creature images show both teams.

Single-target attacks select a foe; compatible support techniques select an ally. Spread attacks hit both foes and pay resources once, with Pressure increasing that single payment if any target has Pressure. The new team techniques include spread attacks, shared recovery and a team ward. Party cleansing includes reserves. Equal-priority actions use a shared HP snapshot, allowing mutual knockouts. Both teams losing all members produces a draw with no victory reward or defeat penalty.

Borrowed actions create debt for the opposing slot; switches cannot erase it. If a slot has no healthy occupant, its owed actions transfer to a living slot. Interrupted, unfunded extra actions create no debt. Items and switches forfeit that actor's extra attacks. The arena supplies two opposing active creatures and two reserves; the player's other attuned creatures are reserves. Healthy reserves replace defeated creatures, with player choice for allied replacements. Participants receive experience on victory.

## Opponent decision tree

The AI first chooses a release, survival, finishing or development branch. It then generates legal move/style/target candidates and scores expected damage, knockout probability, speed, resource availability, recoil, healing, protection, existing conditions, hazards, battlefield synergy and reserve matchups. It can preserve a threatened creature by switching to a healthier counter. In doubles, a shared damage budget discourages both attackers wasting their orders on an already-covered knockout, and reserve reservations prevent two units selecting the same replacement. The AI never reads the player's declared actions. Local randomness only breaks equally scored choices.

## Equipment and aspects

Twenty held items include stat charms, accuracy aids, thorns, draining attacks, one-time status protection, survival bands, entry-hazard boots, switch recovery, an offensive orb, screen/weather extension and consumable healing, cleansing and resource recovery. Equipment changes require a safe place. Equipping consumes an owned inventory copy; replacing or unequipping returns it; consumed items are removed permanently. Changing HP equipment preserves current HP and clamps it to the new maximum; it never heals or revives the wearer. Resting refills an increased maximum.

Eight aspects—Natural, Primal, Astral, Titan, Swift, Verdant, Umbral and Stormbound—combine stat changes with entry, weather, terrain, priority or damage behavior. Unlocks have level, bond and Coin requirements; once unlocked, switching is free at safe places. Each individual stores its own unlocks and aspect. Existing aspects are retained. Aspects have colored auras and Radiant creatures have visible glints in battles, the collection and companion rendering. These overlays preserve the original lineage artwork.

## Verification

The automated suite covers catalog-handler completeness, stages, conditions, timers, counters, delayed moves, hazards, passing, targeted and spread attacks, shared costs, action debt, simultaneous knockouts, save serialization, inventory conservation, consumables, aspect unlocks and AI choices. Browser playtests use separate saves. The Pages cache uses network-first HTML so deployments can replace an older game while preserving browser saves.
