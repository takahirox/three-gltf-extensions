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

This plugin allows to import objects having [`glTF MSFT_lod extension`](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Vendor/MSFT_lod) as [Three.js LOD](https://threejs.org/docs/#api/en/objects/LOD).

The plugin supports progressively loading that first loads the lowest level and then loads the
other levels on demand.

With LOD and progressive loading, you will get the following benefits
* Shorter response time from the loader because it first loads only the lowest level
* Better application runtime performance because of lower quality assets for distant objects
* Save network usage because of loading only the needed levels

## Compatible Three.js revision

&gt;= r148dev

## API

### Constructor

**GLTFLodExtension(parser: GLTFParser, options: Object)**

`parser` -- `GLTFParser` instance which comes from `GLTFLoader.register()` callback

`options` -- [optional]

* `loadingMode: string` -- [optional] indicates how assets in a gltf file are loaded
and when `onLoad` callback is fired by `GLTFLoader`. Allowed parameters are
  * `'all'`: Load all the levels at a time and `onLoad` callback is fired when all the levels are ready. Default
  * `'any'`: Load all the levels at a time and `onLoad` callback is fired when any of the levels is ready
  * `'progressive'`: First load only the lowest level and progressively load the others on demand. `onLoad` callback is fired when the lowest levels are ready
* `onLoadNode(lod: THREE.LOD, node: THREE.Object3D, level: integer, lowestLevel: integer) - THREE.Object3D` -- [optional] a callback function called before a
new LOD level `Three.js Object3D` object is added to the `Three.js LOD` object. This function is a hook for customizing the `Object3D` object and its descendant
objects. The hook is expected to return a `Three.js Object3D` object added to the `Three.js LOD` object.
* `onUpdate(lod: THREE.LOD, node: THREE.Object3D, level: integer, lowestLevel: integer)` -- [optional] a callback function called when a new level of LOD is added.
* `calculateDistance(level: integer, lowestLevel: integer, coverages: Array) - number` -- [optional] a callback function fired right before
a new level of LOD is added. This function is a hook for setting up distance used for [Three.js LOD.addLevel](https://threejs.org/docs/#api/en/objects/LOD.addLevel) and
expected to return number `distance` value. `coverages` is [`extras.MSFT_screencoverage`](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Vendor/MSFT_lod) if defined, or an empty array.

## Limitations

- Ignore material LOD
- `any` and `progressive` loading mode are not guaranteed that they work properly if `Three.js LOD` and associated objects
are manipulated (eg. copy, clone) before all the levels loading completion.
