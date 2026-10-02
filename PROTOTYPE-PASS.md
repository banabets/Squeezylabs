# Coastal / cosmic prototype pass — 2026-10-02

Preserves the existing Claude scene, bodega, materials, daylight and continuous camera journey.

Implemented:
- Mango branches merged by material; conservative frustum bounds and spatially distributed foliage LOD.
- Colonial static geometry merged; repeated bodega packages instanced with their original picking keys. Cloth and animated objects excluded.
- Stable scene callbacks/memoization; distant/offscreen cloth suspended; hidden-tab rendering suspended; conservative adaptive pixel ratio.
- Water noise reduced from five to three octaves, distant seabed work skipped with a blended boundary, inverted smoothstep calls corrected.
- Original supplied logo integrated, physical 3D alien/programmer and ship arrival, nonblocking Spanish welcome.
- Articulated swept gull wings with intermittent flapping and gliding; these remain procedural models, not photoreal scanned assets.
- Camera entrance lowered, intermediate rise softened, bodega lamp moved out of its central sightline; text fades while travelling.
- Playable signal-catching arcade demo; demo catalog labeled before its product cards; mobile layout checked at 390 × 844.

Validation:
- TypeScript and Vite production build.
- node tests/batching.mjs: nested transforms/bounds retained, interactive objects retained, 52 clickable packages consolidated, moving mesh excluded.
- Browser: six chapters, welcome, arcade score increment, catalog, responsive layout; no captured warnings/errors in QA tab.
- Development diagnostic panel: append ?perf=1. Reports mean FPS, p95 frame interval and previous render counters over 120 frames.

Indicative local observations at roughly 1265 × 712, with another preview tab open:
- Arrival before: 48.9 FPS / 846 draws / p95 24.7 ms.
- Arrival with new visitor: about 61 FPS / 412 draws / p95 20.1 ms (later draw count 404).
- Bodega before package batching: 52.4 FPS / 1007 draws / p95 27.6 ms.
- Bodega after package batching: 77.1 FPS / 266 draws / p95 18.9 ms.
These are short development samples, not cross-device performance guarantees. HMR, compilation, display refresh and GPU contention affect results.

Still needs user content/art-production work:
- Real projects, screenshots and results; none fabricated.
- Approved catalog/pricing and actual contact/payment integrations.
- Bespoke production-quality character and wildlife assets if photorealism is required. Current models establish composition and behavior.
