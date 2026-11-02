# Procedural Held Items

The Held Item expansion follows the agreed rules:

- Each Spirimon has one Held Item slot.
- Most equipment is universal. A few items require a creature type or Magical Domain.
- Humanoid as either base or modifier type qualifies for Humanoid equipment. Humanoids gain more choices, never an extra item-effect multiplier.
- Activatable abilities are accessed through **Bag → Held Item** and replace the Spirimon’s normal action. They do not occupy a fifth move slot or replace any of its four equipped moves.
- Consumed items remain spent after wild battles, trainer matches, facilities, victory, defeat and healing.
- Acquisition comes from regional merchants, specialist merchants, exploration caches, wild encounters, quests, Clan Masters, faction bosses, legends, championships and facility milestones.

## Procedural identity and progression

The generator combines 37 tested archetypes across weapons/shields, armor/clothing, magical foci/relics, tools/utility gear, charms/talismans and consumables. It rolls material, name, affinity, rarity, stat potency, eligible tactical affixes and active-ability strength. Common, Uncommon, Rare, Epic and Relic equipment have bounded power budgets. Some items exchange defense or resistance for stronger offense or speed. Common specialist effects such as entry-hazard protection stay useful throughout the game.

Relics are individually seeded reusable equipment with unique identities and an additional tactical effect. Their names, effects and ownership records are stored in full with a generator version. Loading a save does not reroll discovered equipment. Claim keys prevent repeatedly collecting a cache, quest reward or boss relic. Each world has its own collection.

Humanoid-exclusive examples include a Duelist’s Sabre, Court Warfan, Articulated Cuirass, Runic Codex and Artificer’s Device. Their rarity and potency use the same budgets as universal equipment. Construct, Beast/Monstrosity and Fire/Sun exceptions provide other specialized choices. The inventory explains eligibility before equipping.

## Active and automatic behavior

Reusable offensive and support abilities use the same matching shared pool and Pressure rules as normal moves, including existing cross-pool conversion. They have a short, displayed cooldown. Consumables instead pay by permanently consuming the item. Interrupted or invalid activations do not consume it. Cooldowns survive switching and tick while the wearer is benched; regular battle restoration resets cooldowns without replenishing consumed items.

Items can provide passive stat changes, physical or energy specialization, affinity boosts, accuracy, critical hits, damage reflection, draining attacks, regeneration, resource recovery, hazard protection, survival, status protection, or extended weather/screens. Choice-style items grant substantial bonuses but lock the selected move until switching. Separate relic protections track their own once-per-battle flags.

Automatic consumables trigger under their defined conditions. They can restore HP or resources, cleanse afflictions, raise a ward or grant a tactical boost. Bag activation can use an eligible consumable earlier, at the cost of the normal action. Its effect and permanent consumption are shown in the item panel.

Single and double battles use the same activation resolver. Targeted recovery can select a living ally. Spread abilities affect both opponents while paying once, with Pressure checked across their targets. Activating an item forfeits that creature’s unused extra attacks; it does not create new action debt. Enemy turns and end-of-round conditions still occur normally.

## Inventory, merchants and saves

The inventory supports recipient selection, category filters, rarity ordering, effect descriptions, compatibility explanations, equipping, unequipping, inspection and selling spare copies. Replacing an item returns the old copy. Selling cannot remove an equipped copy. Changing maximum HP never heals or revives a creature. NPC trades return the outgoing creature’s item to the player inventory.

Merchants have seeded, persistent regional stock. Forge, herbalist and archive merchants specialize in weapons, consumables and magical equipment. Guild advancement exposes new stock. Purchase and sale transactions validate stock and currency before changing ownership. Procedural item records, claim history, merchant stock and cooldowns travel in existing browser saves and exported backups. Legacy charm IDs and counts migrate without losing equipped items or duplicating inventory.

Opponents receive compatible procedural equipment and score its active ability alongside moves, recovery, setup and switches. Cooldowns, resource limits, existing conditions and available targets affect the decision. Consumed NPC equipment is not regenerated during the same encounter.

## Verification and inspiration

Automated tests cover seeded generation, all categories and archetype abilities, Humanoid and Domain restrictions, shared power budgets, inventory conservation, legacy migration, transactions, permanent consumption, no-effect/interrupted activations, cooldowns, switching, double-battle targets and Pressure, save validation and AI decisions. Browser playtests cover the inventory and Bag activation.

Design inspiration includes the one-item choice, conditional consumables, stat modifiers, move specialization and end-of-turn recovery described in the [official Pokémon battling guide](https://diamondpearl.pokemon.com/en-us/trainersguide/fundamentals/battling/). Spirimon adds its own procedural identities, compatibility rules and Bag-activated abilities.
