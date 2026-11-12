# Followers flows (not CI)

Cover `feat-followers`: private profile, follow request (`/solicitudes`), suggested users, user search hint.
Run from repo root, e.g.:

    maestro test -e TEST_EMAIL=... -e TEST_PASSWORD=... -e TEST_NAME="Test User" \
      -e ADMIN_EMAIL=... -e ADMIN_PASSWORD=... -e ADMIN_FIRST_NAME=Admin \
      .maestro/followers/01-private-profile-follow-request.yaml

- `01` needs two accounts and the 4 `20261107*` migrations on the target Supabase. It restores state (A public, B not following).
- `02` depends on live suggestions and persists the dismissal.
- Shared steps live in `.maestro/subflows/` (`login-as`, `logout`, `open-user-profile`).
- Not validated on an emulator yet: label ambiguity of "Siguiendo" (button vs counter) on the public profile is the likely first fix.
