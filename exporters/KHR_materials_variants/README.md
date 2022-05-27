# Three.js GLTFExporter [KHR_materials_variants](https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_variants) extension

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
import GLTFExporterMaterialsVariantsExtension from 'path_to_three-gltf-extensions/exporters/KHR_materials_variants/KHR_materials_variants_exporter.js';

const exporter = new GLTFExporter();
exporter.register(writer => new GLTFExporterMaterialsVariantsExtension(writer));
gltf.functions.ensureLoadVariants(scene); // Refer to "ensureLoadVariants()" in the KHR_materials_variants GLTFLoader plugin README
exporter.parse(scene, result => {
  ...
});
</script>
```

## Compatible Three.js revision

&gt;= r126

## API

The plugin traverses a scene graph and find valid `mesh.userData.variantMaterials` as the following layout

```javascript
{
  variantName0: {
    material: Three.js material instance
  },
  variantName1: {
    material: Three.js material instance
  },
  ...
}
```

and embeds the variant names and materials as `KHR_materials_variants` extension into exported glTF content.

And if `mesh.userData.originalMaterial` is defined as Three.js Material, the plugin overrides `gltf.meshes[n].primitive.material` with it.

## Limitations

* Three.js multi material is not supported (yet)
* The plugin doesn't verify `.userData` format. it's a user side responsibility.
* If you want to export the models including variants materials loaded by the `GLTFLoader` KHR_materials_variants plugin, be careful that unloaded materials are not exported. If you want to ensure that all the variant materials will be exported, use `ensureLoadVariants()` of the loader plugin.
