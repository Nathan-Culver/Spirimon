# Responsive UI and trial failure audit

## Scope and results

The browser audit covers 87 UI states across 26 viewport profiles in both touch/emulator and mouse/desktop modes, plus rotation/resize checks while the Menu remains open: 4,529 distinct layout checks, with zero remaining failures or browser runtime errors. The game also passes 709 regression tests.

These are Chromium viewport simulations, including safe-area overrides and reduced-height keyboard scenarios. They do not claim physical-device testing of every tablet, browser or operating-system keyboard.

| Category | CSS viewport sizes |
| --- | --- |
| Phone portrait | 280×640, 320×568, 360×640, 390×844, 412×915 |
| Phone landscape and short screens | 568×320, 640×360, 740×360, 480×240 |
| Tablet | 600×960, 768×1024, 800×1280, 1024×600, 1024×768, 1280×800, 1536×922 |
| Desktop and large screens | 1366×768, 1920×1080, 2560×1440, 3840×2160 |
| Reduced height | 1280×600, 800×400, 390×330, 640×280 |
| Safe areas | 390×844 and 844×390, with top/bottom/side inset overrides |

The states include exploration, collection, Spiridex, map, journal, Menu, Bag, individual Spirimon details, move information, practice, passives, transformations, equipment, shops, Sealer progression, support, recovery, rituals, field capabilities, competitive menus, all seventeen handbook tabs, offering preparation/trials, side activities, NPC roles, quest boards, the orientation prompt, the first-battle lesson, every battle submenu, and a full three-versus-three formation with reserves.

## Fixes

- Replace competing dialog height/centering rules with one bounded grid inside the visible viewport. Padding and safe-area reservations now reduce the actual available dialog area; a tall dialog cannot begin above the screen.
- Keep the close control visible while scrolling and ensure the final action can be brought into view. Track the visual viewport when keyboard visibility, orientation or browser chrome changes it.
- Let narrow menu grids become one column. Remove intrinsic minimum widths that made long names, collection rows, input fields and detail grids extend horizontally.
- Move portrait A/B controls into a narrow vertical group so they do not overlap movement arrows. Keep navigation, location information and hints within narrow-screen bounds. Movement controls are hidden while a dialog blocks movement.
- Give dance controls a full-width portrait layout and a compact two-column short-landscape layout, preserving readable labels and usable touch buttons.
- Cap the battle command dock and scroll its contents. Moves, Bag, Release, Support and cooperative options remain reachable even with a full team and many ready actions. In very short views, secondary HUD information can also be scrolled instead of being clipped.

## Failure penalties

- Every incorrect offering-riddle answer deducts 5% of maximum Spiritual Energy and allows another answer.
- A failed singing/dancing trial deducts 10% once when the trial ends, rather than on every missed beat or input.
- Failed side activities and rejected Clan Temple trial responses deduct 10% of maximum Spiritual Energy.
- Penalties round up to whole Energy, stop at zero, and never prevent a deduction merely because the player cannot pay its full amount. Correct answers, successful trials, ordinary menu errors, cancellation, and calibration do not receive failure charges.
- Notices and tutorials explain the costs; incorrect answers save their deduction immediately through the normal save flow.

## Reproduction

Run `node build.mjs`, `npm test`, and `node tools/audit-responsive.mjs /tmp/spirimon-responsive-audit` with Playwright available. `SPIRIMON_AUDIT_BROWSER` can select a Chromium executable. `SPIRIMON_AUDIT_QUICK=1` runs the targeted regression sizes; `SPIRIMON_AUDIT_ONLY=battle-full-roster` isolates the full formation. The local audit server adds test helpers in memory; no helper is added to production game code.

Machine-readable coverage is recorded in `docs/responsiveness-audit.json`.
