Frozen PHEISI v2 preview

Source: eb719248edad30f9290dab8fe4bd6b9a199f60d2 (Sites repository). All 19 source blobs are copied exactly; the active Sites identity is stored inertly as provenance/site-hosting.json. The manifest maps every original path and pins Git blob, SHA-256, size and mode. This is a review fixture, not a production entry point or deployment.

Foundation files originate from local commit cb16311bbce72aee38847f345f12393615045e26. All 66 files of db6920193fb76028947ce148cd8ed61c847c5c3d remain byte-identical.

Historical local evidence: 27/27 browser scenarios (nine each: Chromium desktop, Chromium Samsung emulation, WebKit iPhone emulation) and 21/21 foundation/storage tests. These are localhost synthetic contexts, not physical-device or hosted-offline qualification and not GitHub CI. CI must produce its own results. WebKit offline local tests disconnect the origin socket due to Playwright issue 42775.

Sites version 1 and deployment appgdep_6ad0fc3e04288191ae71fea01b1ecbaa bind the source commit. The archive SHA in the manifest is server-reported, not independently downloaded and rehashed. Nine static resources were byte-verified against live hosting. The hosting redirects /index.html to / and injects Cloudflare script into root HTML, so source HTML differs from served HTML. Hosted offline is NOT qualified.

No analytics implementation, production deployment, protected baseline changes or PR #8 merge. Hosted-offline repair must be a separate branch/version and must preserve this fixture.
