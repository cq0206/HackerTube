# Security

Please report security issues through GitHub's **Security → Report a vulnerability**
when available: <https://github.com/cq0206/HackerTube/security/advisories/new>.
If private reporting is unavailable, open an issue requesting a private contact
without posting exploit details or personal backup data.

Only the latest release is maintained. This app does not auto-update; install a
new release from this repository when security fixes are published. Verify the
SHA-256 checksums attached to the release. Current builds are unsigned and not
Apple-notarized; no publisher identity verification is supplied by a certificate.

The renderer is sandboxed, cannot access Node.js, and uses a narrow isolated bridge.
External destinations and native API requests are allowlisted. No arbitrary URL,
command, file path or IPC channel is accepted from the renderer. Native backup paths
come only from an OS file picker. The app denies permission requests and does not
render remote HTML or embed YouTube frames.

A compromised OS account can read the plaintext local library and backups. Network
providers can observe ordinary thumbnail/API requests. See [PRIVACY.md](PRIVACY.md).
