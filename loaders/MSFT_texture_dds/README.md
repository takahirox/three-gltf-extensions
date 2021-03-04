# [Three.js](https://threejs.org) [GLTFLoader](https://threejs.org/docs/#examples/en/loaders/GLTFLoader) [MSFT_texture_dds](https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/MSFT_texture_dds) extension

## How to use

```javascript
import * as THREE from 'path_to_three.module.js';
import {GLTFLoader} from 'path_to_GLTFLoader.js';
import {DDSLoader} from 'path_to_DDSLoader.js';
import GLTFTextureDDSExtension from 'path_to_three-gltf-exensions/loaders/MSFT_texture_dds/MSFT_texture_dds.js';

const loader = new GLTFLoader();
loader.register(parser => new GLTFTextureDDSExtension(parser, new DDSLoader()));
loader.load(path_to_gltf_asset, gltf => {
  scene.add(gltf.scene);
  render();
});
```

## Compatible Three.js revision

&gt;= r126

## Dependencies

- [Three.js DDSLoader](https://github.com/mrdoob/three.js/blob/dev/examples/jsm/loaders/DDSLoader.js)

Pass `DDSLoader` instance to `GLTFTextureDDSExtension` constructor as the second argument.
