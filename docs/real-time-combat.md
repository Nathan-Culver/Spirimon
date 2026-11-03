# Real-time GCD/LCD combat

The current live system is specified in [Spiritual Energy and GCD/LCD combat](spiritual-energy.md). All wild, trainer, boss, arena and facility encounters use its saved elapsed-gameplay scheduler. The older round resolver remains solely for compatibility/regression tests.

## Timing and controls

Each side can manifest up to three Spirimon. Player creatures are manually controlled, with separate GCD/LCD timers and no input queue. The base GCD is 3.5 seconds, reducible by Creature Speed and buffs to a minimum of 1.5 seconds. Cast and GCD start together and overlap. LCD Moves do not trigger the GCD; their animation locks allow weaving and can cause clipping. Powerful GCD Moves can have an additional local recast. Move Speed has been removed from generated and migrated Move data.

All long timers persist across encounters, healing, recall, revival and save/load. Only elapsed unpaused gameplay advances them. Pausing/backgrounding freezes the simulation; selection menus and deployment panels during battle do not. No recovery method resets timers.

Player support uses Spiritual Energy and separately assigned techniques. It never cancels ongoing casts. GCD support restarts the recipient GCD; team-wide GCD support requires and restarts every affected GCD. Exact copies share a team-wide technique cooldown; distinct procedural variants do not.

## Scaling and effects

Power scales at levels 1, 16, 36, 60, 85 and 100. All catalogue Move timings are audited in [move-balance-audit.csv](move-balance-audit.csv), including accuracy, multi-hit/spread workload, effects, resource contribution, GCD/LCD classification and local recasts.

Sleep, freeze and stagger stop creature commands and interrupt creature casts. Hard-control protection prevents immediate repeated immobilization. Confusion, burns, poison, toxic poison, paralysis, frostbite, infatuation, binding, leeching, curses, nightmares, disable, silence, regeneration and doom have timed simulation effects and visible badges. Afflictions and damage-over-time progress without player input. Shields, buffs, healing, screens, hazards, weather and terrain use the same timeline.

Zero Sealer Energy weakens creature damage, durability, casting/cooldowns and creature support. The free designated lead remains usable. See the main rules for bond mitigation, restoration, sealing, cooperation, NPC parity, persistence and verification.

Automated audits provide reproducible budgets and regression coverage; they do not establish perfect competitive balance across all generated matchups.
