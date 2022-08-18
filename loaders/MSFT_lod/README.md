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
  onUpdate: (lod, mesh, level) => { render(); }
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

* `loadingMode` -- [optional] How internal promises are resolved. `all`: All levels are ready,
`any`: Any of the levels is ready, `progressive`: First load only the lowest level and progressively
load the others on demand. Default is `all`.
* `onUpdate` -- [optional] a callback function called when a new level of LOD is added with
the parameters `Three.js LOD` object, an added `Three.js Mesh` object, and the `level` integer.
* `calculateDistance` -- [optional] a callback function right before when a new level of LOD
is added with the parameters the `level` ingeter and
(`gltfDef.extras.MSFT_screencoverage`)[https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Vendor/MSFT_lod].
The callback function is expected to return float `distance` value used for
[Three.js LOD.addLevel](https://threejs.org/docs/#api/en/objects/LOD.addLevel).

## Limitations

- If both node and material have LOD settings, the plugin uses the material one and ignore the other so far. [#41](https://github.com/takahirox/three-gltf-extensions/issues/41)
- Ignore material LOD if mesh has multiple primitives
