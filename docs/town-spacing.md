# Town spacing

Settlement candidate coordinates are stretched by a factor of two along both world axes. The same seeded ordinary-town rolls and city-anchor rolls are evaluated at their original candidate coordinates, then placed at doubled coordinates. This doubles the spacing of the settlement layout instead of merely halving a random spawn probability. City districts retain their existing 2-4 by 2-4 region footprint and shared identity.

Existing journeys retain their already-generated regions through `useRegionHistory`. The player, visited towns, interiors, roaming individuals and saved map discoveries keep their coordinates. Newly reached areas use the wider layout. The same region history is used for terrain rendering, NPC placement and world information, preventing a remembered town from turning into wilderness underneath the player. Starting Mossveil Crossing remains at the origin.
