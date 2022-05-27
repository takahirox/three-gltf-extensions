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

// This callback is fired when a new level of LOD is added
const onUpdate = () => {
  render();
};
const loader = new GLTFLoader();
loader.register(parser => new GLTFLodExtension(parser, onUpdate));
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
It starts to load all lavels in parallel, the lowest level loading should be completed first in general
especially if data files are separated because of the smaller data size,
and the plugin dynamically adds levels one by one when each one is ready.
So that users can expect the better response time. And also they can expect better app runtime performance
by swithing an object to lower quality one if it moves further.

## Compatible Three.js revision

&gt;= r128dev

## API

### Constructor

**GLTFLodExtension(parser: GLTFParser, onUpdate: function)**

`parser` -- `GLTFParser` instance which comes from `GLTFLoader.register()` callback

`onUpdate` -- [optional] a function is called when a new level of LOD is added

## Limitations

- Currently if both node and material have LOD settings, the plugin may not correctly. [#41](https://github.com/takahirox/three-gltf-extensions/issues/41)
