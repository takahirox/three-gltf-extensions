# [Three.js](https://threejs.org) [GLTFLoader](https://threejs.org/docs/#examples/en/loaders/GLTFLoader) [EXT_mesh_gpu_instancing](https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/EXT_mesh_gpu_instancing) extension

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
import GLTFMeshGpuInstancingExtension from 'path_to_three-gltf-exensions/loaders/EXT_mesh_gpu_instancing/EXT_mesh_gpu_instancing.js';

const loader = new GLTFLoader();
loader.register(parser => new GLTFMeshGpuInstancingExtension(parser));
loader.load(path_to_gltf_asset, gltf => {
  scene.add(gltf.scene);
  render();
});
</script>
```

## Status

In progress

## Compatible Three.js revision

&gt;= r128dev

## API

### Constructor

**GLTFInstancingExtension(parser: GLTFParser)**

`parser` -- `GLTFParser` instance which comes from `GLTFLoader.register()` callback

## Limitations

- No [Three.js SkinnedMesh](https://threejs.org/docs/#api/en/objects/SkinnedMesh) support (yet)
