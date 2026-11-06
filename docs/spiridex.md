# Spiridex

Open **Menu > SPIRIDEX** (or press **5** outside battle). The guide has numbered slots for all 150 general-roster lineages and their 450 forms. Encounters reveal the actual form seen; sealed bonds record every form that individual has unlocked. Each entry has artwork, three form selectors, Type and Domain information, field notes, owned count and recorded encounter places. Unrecorded artwork and form names remain hidden.

Search by a recorded name, number, Type or Domain, and filter by record status or either Type. Results use 24 entries per page. Encountered procedural lineages are included as extra field entries, separate from completion of the general roster.

Records are stored in `save.spiridex.entries` and travel with normal saves and exported backups. Sealing records remain after trading away a Spirimon. Older saves recover known species from `seen` and sealed forms from current owned individuals; unavailable historical details are not invented. Existing IDs, individuals, resources and progression remain intact. Newly visible enemy team members are recorded when rendered; hidden reserves and preloaded artwork do not count as discoveries.

`spiridex.mjs` owns migration, recording, completion and filtering. `spiridex-view.mjs` renders the guide and details. Tests cover legacy saves, transformations, permanent sealing records, generated lineages, hidden form searches, pagination and escaped imported text.
