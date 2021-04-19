# [Three.js](https://threejs.org) [GLTFLoader](https://threejs.org/docs/#examples/en/loaders/GLTFLoader) [MSFT_lod](https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/MSFT_lod) extension

## How to use

```javascript
import * as THREE from 'path_to_three.module.js';
import {GLTFLoader} from 'path_to_GLTFLoader.js';
import GLTFLodExtension from 'path_to_three-gltf-exensions/loaders/MSFT_lod/MSFT_lod.js';

// This callback is fired when a new level of LOD is added
const onUpdate = () => {
  render();
};
const loader = new GLTFLoader();
loader.register(parser => new GLTFLodExtension(parser, onUpdate, THREE));
loader.load(path_to_gltf_asset, gltf => {
  scene.add(gltf.scene);
  render();
});
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

## Dependencies

- [LOD](https://threejs.org/docs/#api/en/objects/LOD)
- [Object3D](https://threejs.org/docs/#api/en/core/Object3D)

Pass the class to `GLTFLodExtension` constructor as the third argument.

## API

### Constructor

**GLTFLodExtension(parser: GLTFParser, onUpdate: function, THREE: Object)**

`parser` -- `GLTFParser` instance which comes from `GLTFLoader.register()` callback

`onUpdate` -- [optional] a function is called when a new level of LOD is added

`THREE` -- Three.js dependencies the plugin needs. Either following style is expected to pass

```
import * as THREE from 'path_to_three.module.js';

loader.register(parser => new GLTFLodExtension(parser, onUpdate, THREE));
```

or

```
import {
  LOD,
  Object3D
} from 'path_to_three.module.js';

loader.register(parser => new GLTFLodExtension(parser, onUpdate, {
  LOD,
  Object3D
}));
```

## Limitations

- Currently if both node and material have LOD settings, the plugin may not correctly. [#41](https://github.com/takahirox/three-gltf-extensions/issues/41)
