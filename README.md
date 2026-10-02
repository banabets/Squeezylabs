# Squeezy Labs — coastal world prototype

An original Venezuelan Caribbean environment rendered in real time with React, Vite, TypeScript, Three.js, React Three Fiber, Drei and GSAP ScrollTrigger. No scene images or background videos are used.

## Run

```sh
npm install
npm run dev
```

`npm run build` type-checks and creates the production output in `dist`. `npm run preview` serves that build.

## Experience

Scroll forward or backward through one persistent 3D scene. Chapter buttons smoothly navigate the same scroll path. The bodega chapter sells placeholder digital products through a prototype tab and takes custom-work requests; checkout is not connected to a payment provider. The arcade, desktop screen and experiment sculpture open their corresponding dialogs; the same actions are accessible through HTML buttons. Pause freezes ambient movement. The operating system's reduced-motion preference disables ambient movement, pointer parallax and UI transitions.

The contact dialog exports a local text brief. It does not send email or store a lead on a server. Add verified contact details or a delivery integration before a public launch. Project copy is explicitly placeholder content; no Platyverse assets or invented shipped projects are included.

## Source map

- `src/data/journey.ts`: chapter copy, progress landmarks, continuous camera and look-at splines.
- `src/experience/CameraRig.tsx`: normalized scroll, damping and subtle pointer parallax.
- `src/experience/Experience.tsx`: renderer, lighting and scene composition.
- `src/scene/`: original procedural architecture, vegetation, boat, props and material textures.
- `src/shaders/water.ts`, `src/scene/Water.tsx`: clear water with a visible seabed, depth absorption, caustics, shoreline foam and the peñero's shadow on the bottom.
- `src/scene/Bodega.tsx`, `src/data/store.ts`: the corner-store chapter (shelf of digital products, fridge, counter, whitewashed house next door) and its catalog.
- `src/scene/Cloth.tsx`, `src/scene/Mango.tsx`, `src/scene/wind.ts`: Verlet clotheslines in strong wind, mango trees and GPU wind shared by foliage and its shadows.
- `src/ui/`: HTML overlays, navigation, modal dialogs and responsive styling.

## Scope and performance

This is a stylized procedural prototype, not a photorealistic environment. Water is a single shader pass (no reflection render) that fakes refraction, absorption and caustics. Sand, plaster and timber use locally bundled photographic PBR maps from Poly Haven (CC0). Foliage uses instancing, materials and basic geometries are shared, pixel ratio is capped at 1.5, and shadows use one 2048px directional map. Approximately 6 MB of locally bundled material and HDR files load with real progress before the world is shown. Fonts use Google Fonts with local fallbacks.

Before launch: profile on physical midrange phones, add asset LODs or adaptive quality as needed, replace placeholder project content with approved projects, connect contact delivery, and complete accessibility/device testing. Reduced motion still allows a user-controlled 3D journey; a separate static reading mode may be added for users unable to use WebGL.

