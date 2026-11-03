# Stable map camera verification

The camera allows movement within the central 40% of each viewport axis (capped at 192 internal pixels), then follows at the boundary. Terrain, props, and actors use a shared integer camera offset. Finite interiors and caves keep the camera within their bounds and center rooms that fit entirely on screen.

Browser check: walked east, south, and west in Mossveil Crossing using an isolated playtest journey. The player moved independently of the scenery; the well, lantern, buildings, and path retained their screen positions during nearby steps. Confirmed the latest scenery depth-ordering changes remain intact. Screenshot: [map-camera.jpg](map-camera.jpg).

Automated checks: 314 tests pass, including five camera regressions covering fixed landmarks, monotonic edge scrolling, reversal, viewport/scene transitions, bounded rooms, and movement timestamps before the animation start. Production and offline bundle builds succeed.
