# Contributing

Issues and pull requests are welcome. Keep the app local-first and the shared UI
usable in both Chrome and Electron. Do not introduce analytics, accounts or remote
scripts without a separate product discussion.

1. Use Node.js 22.12+ and run `npm ci`.
2. Run `npm start` to develop the desktop app, or load `extension/` in Chrome.
3. Run `npm run check`, `npm test`, and (on a graphical desktop) `npm run test:desktop`.
4. Describe the problem, resulting behavior and relevant verification in your PR.

The desktop test creates an isolated temporary profile and tests the real Electron
runtime, native bridge, backup compatibility and restart persistence. It does not
access your normal application library or browser profile. It writes a screenshot
to `docs/images/desktop.png`; include it only when intentionally updating the UI.

Never expose generic filesystem, shell or IPC access through preload. New external
URLs, catalog parameters or assets must be reviewed in `desktop/policy.mjs` and
covered by boundary tests. Keep sandbox, context isolation and web security enabled.

Code contributions use MIT. The bundled dataset retains its separate ODC-By
license; do not remove attribution or add unlicensed videos/media to the repository.

A tag matching `desktop-v*` triggers the cross-platform release build. The release
workflow validates that the tag matches `package.json` before publishing artifacts.
Maintainers must verify macOS arm64 locally and describe platform/signing limits.
