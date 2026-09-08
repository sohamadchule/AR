# AR behavior and testing

AR uses `<model-viewer>` and platform mechanisms only — there is **no** custom
WebGL/AR engine.

```
                 model-viewer
                      |
        +-------------+-------------+
        |                           |
     Android                       iOS
   Scene Viewer / WebXR        Quick Look (AR)
```

`ar-modes="webxr scene-viewer quick-look"` lets `<model-viewer>` pick the best
available path per device.

## How the app handles AR

- The `ModelViewer` component detects AR support **after the model loads** via
  the element's `canActivateAR` property.
- When AR is supported, a prominent **"View in AR"** button triggers
  `activateAR()` (from a user gesture, as required).
- When AR is **not** supported, a clear message is shown and the normal 3D
  viewer keeps working — the page is never left unusable.
- AR session state is tracked via the `ar-status` event
  (`not-presenting` / `session-started` / `object-placed` / `failed`).
- Models are interpreted in **meters** (canonical AR unit), and `ar-scale` is
  `fixed`, so a chair authored at real-world scale places at real size.

## Where AR works

| Platform | Browser | AR path |
| -------- | ------- | ------- |
| Android  | Chrome (and Chromium browsers) | Scene Viewer (ARCore) / WebXR |
| iOS      | Safari  | Quick Look (ARKit) |
| Desktop  | any     | No AR — 3D viewer only, with an "AR unavailable" message |

Notes:
- iOS Quick Look prefers a USDZ file. If a product later supplies an `iosSrc`
  (USDZ), pass it through; otherwise Quick Look uses the GLB where supported.
- AR generally requires HTTPS on real devices. `localhost` is treated as secure
  for desktop testing, but to test AR on a phone you need to reach the dev
  server over HTTPS (e.g. a tunnel) or deploy.

## How to test

1. **Desktop (3D + fallback):** open `/viewer-demo`. Rotate/zoom the model.
   Because desktop has no AR, you should see the "AR unavailable" message — this
   verifies the graceful fallback.
2. **Broken model:** click "Test broken URL" to confirm the error + retry path.
3. **On a phone:** serve the app over HTTPS reachable from the phone, open
   `/viewer-demo` (or, later, a product's `/view/<id>` page), load the model, and
   tap **View in AR**. Android launches Scene Viewer; iOS launches Quick Look.
   Place the object on a detected surface.
