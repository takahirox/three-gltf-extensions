# [Three.js](https://threejs.org) [GLTFLoader](https://threejs.org/docs/#examples/en/loaders/GLTFLoader) [EXT_mesh_gpu_instancing](https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/EXT_mesh_gpu_instancing) extension

## How to use

```javascript
import * as THREE from 'path_to_three.module.js';
import {GLTFLoader} from 'path_to_GLTFLoader.js';
import GLTFInstancingExtension from 'path_to_three-gltf-exensions/loaders/EXT_mesh_gpu_instancing/EXT_mesh_gpu_instancing.js';

const loader = new GLTFLoader();
loader.register(parser => new GLTFInstancingExtension(parser, THREE));
loader.load(path_to_gltf_asset, gltf => {
  scene.add(gltf.scene);
  render();
});
```

## Status

In progress

## Compatible Three.js revision

&gt;= r128dev

## Dependencies

- [InstancedMesh](https://threejs.org/docs/#api/en/objects/InstancedMesh)
- [Object3D](https://threejs.org/docs/#api/en/core/Object3D)

Pass the class to `GLTFInstancingExtension` constructor as the second argument.

## API

### Constructor

**GLTFInstancingExtension(parser: GLTFParser, THREE: Object)**

`parser` -- `GLTFParser` instance which comes from `GLTFLoader.register()` callback

`THREE` -- Three.js dependencies the plugin needs. Either following style is expected to pass

```
import * as THREE from 'path_to_three.module.js';

loader.register(parser => new GLTFInstancingExtension(parser, THREE));
```

or

```
import {
  InstancedMesh,
  Object3D
} from 'path_to_three.module.js';

loader.register(parser => new GLTFInstancingExtension(parser, {
  InstancedMesh,
  Object3D
}));
```

## Limitations

- No [glTF multiple mesh primitives](https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#meshprimitives-white_check_mark) support yet
- No [Three.js SkinnedMesh](https://threejs.org/docs/#api/en/objects/SkinnedMesh) support (yet)
