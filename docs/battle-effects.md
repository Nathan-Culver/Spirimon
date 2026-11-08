# Layered battle effects

Each technique keeps its existing deterministic choreography and adds layers
selected from its delivery, effect, power, Type, Domain and thematic motif.
The same path handles player techniques, enemy techniques, support, item moves,
custom techniques, and single/multiple recipients.

Rendering order:

1. Battlefield and platforms, with capped camera displacement and brief color inversion.
2. Background dimming; HUDs fade slightly without moving or losing interactivity.
3. Creature artwork, animated with a continuous mesh weighted to its body plan.
   Windup, striking/support poses, recovery, breathing and actual-hit reactions
   use local offsets, so positions cannot accumulate drift.
4. An animated illustration from the supplied effect atlases.
5. The original procedural technique effect, followed by an analytic particle
   emitter with emission times, lifetimes, trajectories, turbulence and gravity.
6. A brief, low-opacity impact flash, followed by readable damage numbers/timers.

Illustrations are shared thematic assets, not individually hand-drawn animation
frames for every technique. The existing per-technique score supplies distinct
choreography, motifs and timing. Two 8-by-8 atlases are packaged as optimized
WebP assets and included in web, desktop, Android and standalone HTML builds.

Full-screen flashes/inversion share a 900 ms gate. Overlapping attacks use
maximum dim/flash intensity rather than adding brightness; camera displacement
and particles have global caps. The renderer retains at most 18 recent effects
and 32 isolated creature textures. Effects use the battle clock and freeze with it.
Recipient positions are captured at execution, preserving the impact location
if a creature faints or the formation changes before the animation ends.

Settings → Battle effects defaults to the device's reduced-motion preference.
Reduced mode disables battlefield shake, sprite deformation/flips and screen
flashes/inversion, and reduces particles and background dimming. Full mode can
be selected explicitly.
