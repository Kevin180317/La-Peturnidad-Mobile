# Docs screenshot flows

Maestro flows used on 2026-11-07 to capture `docs/images/`. They are **not** part of CI (`.maestro/config.yaml` and the workflow only run `.maestro/flows/`).

- Run with `-e OUT=out` (relative path: Maestro refuses paths outside the workspace). PNGs end up in `~/.maestro/tests/<timestamp>/<flow>/takeScreenshot/out/`.
- `02`, `09`, `14` and `16` need `-e TEST_EMAIL=... -e TEST_PASSWORD=...`; `14` also needs `-e ADMIN_EMAIL=... -e ADMIN_PASSWORD=...`.
- **Not idempotent:** `03`, `05`, `06`, `10`, `11`, `12`, `14` write data (pet, post, notice, group, story, follow/chat, report) to the live Supabase project. Re-running duplicates it. Use test accounts only.
- The photo picker flows expect two images in the emulator gallery (`adb push`, then `MEDIA_SCANNER_SCAN_FILE`).

Full report: `docs/auto_testing/EMULATOR_RUN_2026-11-07.md`.
