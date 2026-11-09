# Real-time GCD/LCD combat

The current live system is specified in [Spiritual Energy and GCD/LCD combat](spiritual-energy.md). All wild, trainer, boss, arena and facility encounters use its saved elapsed-gameplay scheduler. The older round resolver remains solely for compatibility/regression tests.

## Timing and controls

Each side can manifest up to three Spirimon. Player creatures are manually controlled, with separate GCD/LCD timers and no input queue. The base GCD is 3.5 seconds, reducible by Creature Speed and buffs to a minimum of 1 second. Cast and GCD start together and overlap. LCD Techniques do not trigger the GCD; their animation locks allow weaving and can cause clipping. Powerful GCD Techniques can have an additional local recast. Technique Speed has been removed from generated and migrated Technique data.

All long timers persist across encounters, healing, recall, revival and save/load. Only elapsed unpaused gameplay advances them. Pausing/backgrounding freezes the simulation; selection menus and deployment panels during battle do not. No recovery method resets timers.

Player support uses Spiritual Energy and separately assigned techniques. It never cancels ongoing casts. GCD support restarts the recipient GCD; team-wide GCD support requires and restarts every affected GCD. Exact copies share a team-wide technique cooldown; distinct procedural variants do not.

## Scaling and effects

Damage scales continuously through attacker level and battle stats, without extra potency tiers or a level-100 ceiling. See [Technique balance](technique-balance.md). All catalogue Technique timings are audited in [move-balance-audit.csv](move-balance-audit.csv), including accuracy, multi-hit/spread workload, effects, resource contribution, GCD/LCD classification and local recasts.

Sleep, freeze and stagger stop creature commands and interrupt creature casts. Hard-control protection prevents immediate repeated immobilization. Confusion, burns, poison, toxic poison, paralysis, frostbite, infatuation, binding, leeching, curses, nightmares, disable, silence, regeneration and doom have timed simulation effects and visible badges. Afflictions and damage-over-time progress without player input. Shields, buffs, healing, screens, hazards, weather and terrain use the same timeline.

Zero Sealer Energy weakens creature damage, durability, casting/cooldowns and creature support. The free designated lead remains usable. See the main rules for bond mitigation, restoration, sealing, cooperation, NPC parity, persistence and verification.

Automated audits provide reproducible budgets and regression coverage; they do not establish perfect competitive balance across all generated matchups.

## Combat audit corrections

An explicit `cooldownMs` overrides a GCD Technique's individual recast independently of its shared GCD, including light Techniques and an explicit zero. Speed, style, and exhaustion scale the recast.

Resource funding is checked again at impact using every living target's Pressure ability. If the full cost cannot be paid, a spread attack damages no targets and spends neither pool. Only multi-hit strikes that penetrate shields and remove HP contribute damage delay.

Delayed attacks check Ward, shields, screens, defensive support, survival equipment, and damage sharing when they land. Placing an omen does not consume Ward. Fully blocked or absorbed delayed damage adds no cooldown delay.

Quickening accelerates the unfinished portion of an ongoing cast immediately, using the same capped haste multiplier as new casts. Stacking and expiration update the remaining cast without cancelling it. Existing GCD requirements for support still apply.

The Seal button is available directly in the action dock and Bag. Tap for the base cost; slide right for extra Energy and release to attempt. The button previews base plus extra cost and success chance. Slide upward or left to cancel; interrupted touches and focus loss spend nothing. Keyboard arrows adjust extra Energy (Shift changes five points), Escape clears it, and Enter attempts. The gesture retains its original target and rechecks funds at release. Failure spends all invested Energy and one catalyst.

### Styles and gesture controls

Strong uses the normal 5% base critical chance and increases critical damage from 1.5× to 1.65×. Agile retains its +10 percentage point critical chance bonus. All diagonals add one or two extra Technique uses based on drag distance. Upward diagonals also increase attack commitment with distance; downward diagonals use defensive zero attack commitment. Ordinary taps use 50% attack and 50% defense. Incoming damage cannot extend GCD or local cooldown timers started by instant-cast Techniques, even while another Technique is being cast. Cast-time Technique timers retain their existing delay limits.


## Difficulty and learning

See [the combined difficulty and learning update](difficulty-tutorial-dialogue.md). Normal is the default original Health/damage baseline; Hard applies the previous half-Health and 1.25× damage rules to both sides, while Easy applies asymmetric player benefits and enemy penalties. Percentage healing scales from the affected individual’s actual maximum. Normalized manifestation strength prevents difficulty benefits from raising Energy costs. Shared GCD and support timing rules are unchanged; support cards now expose effect, cast and recast directly.
