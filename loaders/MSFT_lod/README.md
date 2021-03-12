# [Three.js](https://threejs.org) [GLTFLoader](https://threejs.org/docs/#examples/en/loaders/GLTFLoader) [MSFT_lod](https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/MSFT_lod) extension

## How to use

```javascript
import * as THREE from 'path_to_three.module.js';
import {GLTFLoader} from 'path_to_GLTFLoader.js';
import GLTFLodExtension from 'path_to_three-gltf-exensions/loaders/MSFT_lod/MSFT_lod.js';

const onNewLodIsAdded = () => {
  render();
};
const loader = new GLTFLoader();
loader.register(parser => new GLTFTextureLodExtension(parser, onNewLodIsAdded, THREE));
loader.load(path_to_gltf_asset, gltf => {
  scene.add(gltf.scene);
  render();
});
```

## Status

In progress

## Compatible Three.js revision

&gt;= r127dev + [takahirox/three.js@6abde5e](https://github.com/takahirox/three.js/commit/6abde5e86f042b146cdbbfca61d49c041c2c29a2)

## Dependencies

- [LOD](https://threejs.org/docs/#api/en/objects/LOD)

Pass the class to `GLTFLodExtension` constructor as the third argument.
