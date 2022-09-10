# [Three.js](https://threejs.org) [GLTFLoader](https://threejs.org/docs/#examples/en/loaders/GLTFLoader) [MSFT_lod](https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/MSFT_lod) extension

## How to use

```javascript
<script type="importmap">
{
  "imports": {
    "three": "path_to_three.module.js"
  }
}
</script>
<script type="module">
import * as THREE from 'three';
import {GLTFLoader} from 'path_to_GLTFLoader.js';
import GLTFLodExtension from 'path_to_three-gltf-exensions/loaders/MSFT_lod/MSFT_lod.js';

const loader = new GLTFLoader();
loader.register(parser => new GLTFLodExtension(parser, {
  loadingMode: 'progressive',
  // This callback is fired when a new level of LOD is added
  onUpdate: (lod, mesh, level, lowestLevel) => { render(); }
}));
loader.load(path_to_gltf_asset, gltf => {
  scene.add(gltf.scene);
  render();
});
</script>
```

## Status

In progress

## Features

This plugin imports `MSFT_lod` as [Three.js LOD](https://threejs.org/docs/#api/en/objects/LOD).

The plugin supports progressively loading that first loads the lowest level and then loads the
other levels on demand.

With LOD, response time can be shorter with the progressive loading. And application runtime
performance can be improved by swithing an object to lower quality one if it moves further.

## Compatible Three.js revision

&gt;= r128dev

## API

### Constructor

**GLTFLodExtension(parser: GLTFParser, options: Object)**

`parser` -- `GLTFParser` instance which comes from `GLTFLoader.register()` callback

`options` -- [optional]

* `loadingMode` -- [optional] indicates how assets in a gltf file are loaded and when `onLoad` callback
is fired by `GLTFLoader`.
  * `'all'`: All levels are ready. Default
  * `'any'`: Any of the levels is ready
  * `'progressive'`: First load only the lowest level and progressively load the others on demand
* `onLoadMesh(lod, mesh, level, lowestLevel) - THREE.Object3D` -- [optional] a callback function called before a
new level `Three.js Mesh` object is added to the `Three.js LOD` object.
This hook is for customizing the `Mesh` object and is expected to return a `Three.js Object3D` object added
to the `Three.js LOD` object.
  * `lod`: `THREE.LOD`
  * `mesh`: `THREE.Mesh`
  * `level`: `integer`
  * `lowestLevel`: `integer`
* `onUpdate(lod, mesh, level, lowestLevel)` -- [optional] a callback function called when a new level of LOD is added.
  * `lod`: `THREE.LOD`
  * `mesh`: `THREE.Mesh`
  * `level`: `integer`
  * `lowestLevel`: `integer`
* `calculateDistance(level, lowestLevel, coverages) - number` -- [optional] a callback function fired right before
a new level of LOD is added. This hooks if for setting up distance used for [Three.js LOD.addLevel](https://threejs.org/docs/#api/en/objects/LOD.addLevel) and expected to return number `distance` value.
  * `level`: `integer`
  * `lowestLevel`: `integer`
  * `coverages`: `Array`

## Limitations

- If both node and material have LOD settings, the plugin uses the material one and ignore the other so far. [#41](https://github.com/takahirox/three-gltf-extensions/issues/41)
- Ignore material LOD if mesh has multiple primitives
- `any` and `progressive` loading mode are not guaranteed that they work properly if `Three.js LOD` and associated objects
are manipulated (eg. copy, clone) before loading completion.
