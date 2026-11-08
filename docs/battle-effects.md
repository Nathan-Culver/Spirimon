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

All 1,046 supplied illustrations are assigned individually: one for each of the
1,045 established technique IDs and one for Struggle. Sixteen full 8-by-8
atlases and a final 22-piece sheet ship in web, desktop, Android and standalone
HTML builds. The final sheet uses its actual, taller row boundaries to avoid
cropping. These are animated illustrations, combined with the existing
per-technique choreography, rather than separate frame-by-frame drawings.

Assignments are frozen by technique ID in `technique-artwork.mjs`, with source
names, hashes and ordering in `docs/technique-art-sources.json`. The complete
name-to-cell table is `docs/technique-artwork.csv`. Adding a technique never
shifts existing artwork. Unknown generated techniques and support variants
use a thematic fallback. All established techniques use their dedicated art.

Only the atlases required by active battlers are warmed at battle entry; other
artwork loads on demand. The complete illustrations occupy less than 8 MiB,
alongside the unchanged 40 MiB core artwork budget. The complete standalone
download remains below 66 MiB. No extra startup download is required.

Run `node tools/build-technique-art.mjs --check` to verify the frozen registry
and CSV. Run `python3 tools/audit-technique-art.py` (Pillow required) to check
every runtime source rectangle for visible, distinct pixel content. The
regression suite checks the audit against the exact shipped file hashes.

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
