# Real-time combat

All live single, trainer, boss, facility and double battles use one saved elapsed-time simulation clock. The legacy round resolver remains for compatibility tests; live battles initialize real-time state and do not call it. Existing encounters migrate with their creatures, health, resources and progression intact. Unspent turn orders and borrowed-action debt are retired.

## Commands and time

Tap a ready Move to cast it. Casting has a visible delay, after which the Move resolves, spends its resources and applies its effects. Every individual has per-Move cooldown deadlines and a shared recovery deadline. A Move can be ready while its user is still recovering. Cycling between four attacks does not evade recovery, and withdrawing/re-entering preserves the individual's cooldown record. Interrupted or missed casts still occupy their scheduled time. Sleep, freeze and stagger interrupt casting immediately; these afflictions prevent new commands until recovery.

Both enemy slots make independent tactical decisions. Each active ally can be controlled directly or individually set to Auto; automation uses the same public-state AI and cooldown rules. There is no requirement to declare both allied actions. Menus, targeting and the log do not stop the enemy. Pause explicitly freezes the clock; hidden/background tabs and mandatory replacement selection also freeze it. Returning from another app does not replay missed attacks or damage.

Bag supplies, Held Item abilities, switching and Sealer's Ward use the same recovery system. Sealing and escape attempts require readiness and commit recovery, preventing repeated immediate attempts. Paid charged Moves from older saved battles remain paid; new charge Moves use their cast time instead of a second turn. Omega techniques have longer timing budgets and remain once per battle.

## Level scaling and viability

All damaging Moves gain 5% base power per threshold at levels **1, 16, 36, 60, 85, 100**, reaching 125% at level 100. Existing offensive/defensive level statistics continue to apply. Healing percentages and positive/negative duration benefits also improve at the thresholds; stage buffs naturally benefit the user's larger statistics. A learned Move is not replaced by a stronger numerical version merely because a level threshold is reached.

The timing budget evaluates each Move's expected hit count (3.5 for a multi-hit Move, 2 for a double hit), accuracy, secondary-effect likelihood, effects, recoil/recharge tradeoffs, conditional bonuses and multi-target coverage. Heavier attacks occupy longer cooldowns/recovery. Quick attacks offer short commitments and more resource contribution; slow attacks offer burst and fewer uses. Support and control trade damage opportunities for other outcomes. Haste from Speed has diminishing returns and a cap; paralysis and slowing increase action times. Agile/Strong styles change both their existing damage behavior and their timing budgets.

The [audit CSV](move-balance-audit.csv) lists every catalog template, role, effect, timing, resource contribution and six level-scaled powers. It is a deterministic design audit rather than proof that every matchup is competitively balanced. Contextual Moves such as counters, hazard removal, weather setup, anti-status attacks and ally healing require their stated situation. AI-generated and legacy custom Moves are evaluated by the same runtime timing formula.

## Afflictions

| Effect | Baseline duration | Behavior |
|---|---:|---|
| Sleep | 4 s | Interrupts casting and prevents acting. |
| Frozen | 4.5 s | Interrupts casting and prevents acting. |
| Stagger/flinch | 0.9 s | Brief interrupt and action lock. |
| Confusion | 8 s | Actions have a 33% self-damage interruption chance. |
| Burn | 16 s | Damage pulses; Physical damage is reduced. |
| Poison | 18 s | Damage pulses independently of commands. |
| Toxic poison | 16 s | Damage pulses escalate to a bounded maximum. |
| Paralysis | 12 s | Slower cooldowns plus a 25% interruption chance. |
| Frostbite | 16 s | Damage pulses; Energy damage is reduced. |
| Bound/trapped | 8 s | Prevents ordinary switching and deals periodic damage. |
| Silenced/Move sealed | 8 s | Restricts support or the sealed Move. |

Durations can improve with the caster's level threshold. Hard control grants a four-second recovery-protection window after its duration to prevent chaining permanent locks across multiple attackers. Afflictions, their expiry and recovery are shown on both teams' HUDs. Confusion and other volatile effects can coexist with a major affliction. Major afflictions remain mutually exclusive, as before. Cleansing, restoration and status-protection equipment work on these records.

Damage-over-time and regeneration pulse every two simulated seconds. Duration deadlines, casts and cooldowns progress continuously rather than consuming turns. Timed wards, screens, weather, terrain, delayed strikes, doom, drain sources, rampage, passing and forced displacement retain their mechanics on that clock. Assigned Domains plus equipped-Move Domains determine combat affinities and weather protection.

## Verification

Tests cover autonomous enemy attacks, timing gates, per-individual cooldowns, level thresholds across the complete catalog, status application/expiry/overlap, cast interruption, anti-lock protection, healing/items, switching, charged actions, saving/resuming and legacy migration. Application-loop tests exercise idle-player damage, independent double-battle slots, optional allied automation and background/replacement pause. Physical mobile play and extended balance playtesting remain separate from deterministic engine verification.
