# Spiritual Energy and GCD/LCD combat

This is the implemented rule reference for the two design questionnaires. Save data is migrated in place; exported backups include the Sealer, support preparation, learned techniques, shrine allowances, NPC Sealer records, and persistent cooldowns.

## Energy, progression and the lead

Energy is spent at release, never continuously drained or reserved. Recalling a creature refunds nothing. Every subsequent release is charged again. Each side can manifest up to three creatures. There is no additional deployment-capacity restriction.

The designated lead is free to release, including at zero Energy. Voluntary Lead changes and attunement are available only at safe places, including shrine surroundings. When the Lead is knocked out, the first conscious member in traveling-party order automatically becomes the saved Lead, inherits free manifestation, and follows outdoors, in dungeons, and inside buildings. Reviving the former Lead does not switch the role back. If the entire party is defeated, the last Lead is retained through normal Shrine blackout recovery and no unconscious companion is drawn. The traveling party can contain six members; creatures in storage do not require support assignments.

All surviving manifested creatures return to their seals at battle end. An ordinary following companion is free. Releasing another creature for a field task spends Energy; repeated physical actions within that task do not. Push/Cleave/Crush barriers retain their alternate physical solutions when the appropriate release is unaffordable. Field capabilities continue to require actual anatomy.

Sealer level grows through battles and first-time exploration. Unique spiritual instruction, meditation milestones, and completed rituals improve spiritual training. Strong individual bonds contribute a capped capacity bonus. Existing saves receive credit for historic victories once; migration never repeatedly awards experience or refills an existing reserve.

Maximum Energy is 100 + 8 per Sealer level after the first + up to 40 training + up to 40 ritual growth + up to 45 bond growth. Release strength estimates healthy HP/defenses, expected damage throughput, utility, passive abilities, equipment-adjusted stats, equipped Techniques and level. It ignores current injuries and transient buffs. Bond discounts cap at 15%.

`npm run audit:energy` checks a free lead plus two ordinary releases and occasional support at five reference stages. These estimates meet 6–10 routine encounters; actual solo expeditions can last longer because the lead is free. Three powerful creatures can be stronger in a particular encounter while costing more over an expedition. Equal expenditure is not a guarantee of identical matchup outcomes.

## Exhaustion and recovery

At zero Energy, manifested creatures deal 15% less damage, receive 15% more damage, have 15% longer casts/cooldowns, and provide weaker creature healing/wards. Bond reduces the penalty, reaching 7.5% at bond 100. Any positive Energy removes exhaustion immediately. Existing cast and cooldown deadlines are not retroactively rescaled.

| Recovery | Rule |
| --- | --- |
| Passive | One full reserve per two hours of active unpaused exploration; no battle/menu/offline recovery |
| Shrine communion | 50%; shares one action with Restore and Meditate per Shrine until day/night reset |
| Shrine meditation | 25%; uses the same shared Shrine action |
| Dangerous meditation | 25% interruption chance; interruption retains half of that session's restoration and starts an actual encounter |
| Shrine restoration | Restores attuned creature Health/resources and Sealer Energy; uses the same shared Shrine action |
| Spiritual draught | 35%; sold by merchants; can be used in battle with the Sealer utility timer |
| Bonding | 4% once per individual per day/night period; consuming an offering or a meaningful companion interaction can trigger it |

Energy is stored as whole points. Passive recovery accumulates partial progress until a full point is earned, so a hidden tiny fraction cannot bypass visible zero-Energy exhaustion. Percentage restoration rounds to the nearest point.

The world day lasts 35 minutes and night 25 minutes. Cave darkness does not reset calendar allowances. Meditation/communion advance the calendar, but this does not fast-forward cooldowns. Recovery usage is saved before the interruption can begin. Shrines are deterministically placed on traversable tiles at one quarter of their former density, with at most one per town or route region and many regions empty. The starting town, Mossveil Crossing, always has a reachable Shrine.

A full traveling-team defeat causes a blackout to the last Shrine approached, without requiring Restore, Meditate or Commune to register the visit. The checkpoint persists in saves. With no prior visit, return to Mossveil Crossing’s Shrine; valid legacy Shrine rest points remain usable. Spent return Shrines advance the calendar to the next day/night reset before restoring the team and consuming that phase’s shared use. Simultaneous knockouts and the last conscious Spirimon falling to an exploration affliction use the same return.

No resting place, shrine, item, meditation, blackout, preparation change, recall, revival or new encounter resets a long cooldown. Timers use a saved unpaused-gameplay clock. Pausing, hiding the tab, closing the game, and offline time do not progress it.

## GCDs, LCDs and manual controls

Each creature has independent timers. Base GCD is 3.5 seconds with a 1-second haste floor. Creature Speed affects both GCD and individual Technique LCDs with diminishing returns; temporary speed effects, styles and afflictions also apply. **Technique Speed is retired**, including AI-generated mechanics. Individual Technique cast and recast profiles instead pay for their power, spread coverage, accuracy, utility and level scaling.

A casting GCD Technique starts the shared timer immediately. Cast and GCD overlap. Another GCD cannot begin before both the cast and GCD finish. LCD Techniques have their own timers and do not restart the GCD. Basic LCD execution locks last 550ms; using one late enough can clip the next GCD. Heavy GCD Techniques can also require a longer individual recast. These are shown in Technique details.

There is no action queue or allied AI automation. A pressed unavailable Technique is rejected rather than saved for later. Select an ally tab, a foe/ally target, and a ready Technique. Other creatures' timers continue normally. Status, HP/resource readouts, shields and cooldown labels update during selection. Pause freezes execution and prevents issuing actions.

GCD/LCD Technique profiles retain level thresholds 1, 16, 36, 60, 85 and 100. The Technique audit includes timing class, shared GCD, local recast, casts, resources, effects, and power at all six thresholds. Precise competitive balance still benefits from extended human playtesting.

## Procedural support and preparation

Start by choosing three of nine generated instructions. Other techniques are learned through trainers, spiritual training, shrine/ritual discoveries, and encounter discoveries. They are not automatically granted merely for reaching a Sealer level.

There are six assigned selections across the active traveling party, at least one per member, and one additional free-floating selection. Duplicate assignments are allowed across different members. The floating selection must differ from every assigned technique. Unfilled slots remain available while the early collection is small. Preparation can change outside battle, and an occupied slot can be replaced without leaving a member unassigned.

Copies of the exact same generated technique share a Sealer-wide cooldown. Mechanically different generated variants have independent timers, even in the same family. Procedural identity is based on mechanics rather than a changeable display name.

| Family | Effect |
| --- | --- |
| Ward | HP-based shield, with a total active shield cap |
| Mend | Percentage HP restoration |
| Concord | Shortens sleep, confusion and other mental disruption |
| Conduit | Percentage Willpower restoration |
| Resonance | Temporary offensive/defensive empowerment |
| Recall | Protected withdrawal; binding can prevent it; an existing cast finishes before withdrawal |
| Purification | Removes physical afflictions |
| Sanctuary | Prevents new statuses/interruption |
| Quickening | Accelerates subsequent casting and Technique cooldown profiles |
| Reprise | Reduces remaining Technique GCDs/LCDs, never player support timers |
| Soulbridge | Shares incoming damage with a living active ally without recursive redirection |
| Reawakening | Revives a defeated party member within its seal |
| Mantle | General or damage-category/Domain-specific protection |

The generator combines compatible effects, durations, potency, team coverage, restrictions, and optional HP/defense sacrifices under one work budget. Combinations include synergy and multi-target surcharges. Every technique still costs at least one Spiritual Energy. No technique creates player Energy from creature resources. Specialized techniques can require actual Type, active Domain, anatomical trait, or ability. Support does not add Domains to a creature.

Support never cancels the recipient's ongoing cast. GCD-classified support requires the recipient GCD ready and restarts it. Team-wide GCD support requires **every affected GCD ready and restarts all of them**. LCD support applies immediately and uses its own shared technique cooldown. GCD classification is derived from the generated effects.

Revival may be repeated whenever Energy and cooldowns allow. It restores HP within the seal, with a separate manifestation payment to return to battle; the designated lead retains its free-release exception. Neither revival nor recall resets creature Technique timers. With no manifested defender, a six-second emergency window permits items, revival, release or escape before rescue/defeat.

## Sealing, cooperation and enemies

Sealing requires a fixed strength-based base payment plus optional extra Energy. Extra investment improves success with diminishing returns. Health/status, creature stats, trust and seal quality contribute to success. Both the base and extra are lost on failure, along with the catalyst. Peaceful offering seals also need Energy after the first-bond tutorial exception.

Basic coordinated physical attacks, shared-Domain attacks, Water/Lightning combinations, and restorative combinations are recognized from equipped Techniques and actual active Domains. Advanced United and Triune Releases are learned from spiritual instruction. Cooperation requires every participant's selected action to be ready and fundable; it commits Energy and each creature's action/resources. Dedicated cooperative cooldowns persist.

Field rituals can purify the party, permanently unseal nearby dungeon obstacles, or stabilize an area against random encounters for 30 steps. They require suitable Domains and pay for non-lead manifestation. First-time ritual discoveries award training and procedural support instruction. Cleared barriers are stored in the actual dungeon's persistent changes.

NPC Sealers and bosses follow the same maximum of three, free designated lead, paid additional releases, support legality, zero-Energy penalties and costs. They choose actions through algorithmic AI. Named opponents retain Energy and long timers across rematches on the same saved gameplay clock. Bosses receive no free extra actions, refills, or manifestation exemptions.

## Verification and tuning

Regression tests cover migration, persistence, resource accounting, three-creature limits, manual control, casting/GCD overlap, weaving, exhaustion, each recovery source, exact-copy support sharing, team-wide GCD gating, procedural validation, repeated revival, sacrifices, sealing, cooperation, and shrine placement. The browser playtest uses its own save namespace.

Balance remains data-driven: the main tuning points are Speed curves, per-Technique recasts/locks, generated support budgets and stacking caps, NPC support choices, and shrine/encounter pacing. Audit CSVs are reproducible with the npm audit commands; they are design benchmarks rather than proof of universal matchup equivalence.
