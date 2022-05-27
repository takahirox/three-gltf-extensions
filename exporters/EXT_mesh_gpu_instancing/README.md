# Three.js GLTFExporter [EXT_mesh_gpu_instancing](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Vendor/EXT_mesh_gpu_instancing) extension

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
import {GLTFExporter} from 'path_to_GLTFExporter.js';
import GLTFExporterMeshGPUInstancingExtension from 'path_to_three-gltf-extensions/exporters/EXT_mesh_gpu_instancing/EXT_mesh_gpu_instancing_exporter.js';

const exporter = new GLTFExporter();
exporter.register(writer => new GLTFExporterMeshGPUInstancingExtension(writer));
exporter.parse(scene, result => {
  ...
});
</script>
```

## Compatible Three.js revision

&gt;= r136

## API

The plugin traverses a scene graph and finds valid `InstancedMesh` usages  
decomposes the instancing matrices and exports them as `EXT_mesh_gpu_instancing` extension into exported glTF content.

## Limitations

* Only pos(3), rot(4), scale(3) matrices (4x4 transform matrices) are supported.
* Colors are not supported yet.
