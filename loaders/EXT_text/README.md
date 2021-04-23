# [Three.js](https://threejs.org) [GLTFLoader](https://threejs.org/docs/#examples/en/loaders/GLTFLoader) [EXT_text](https://github.com/takahirox/EXT_text) extension

## How to use

```javascript
import * as THREE from 'path_to_three.module.js';
import {GLTFLoader} from 'path_to_GLTFLoader.js';
import GLTFTextExtension from 'path_to_three-gltf-exensions/loaders/EXT_text/EXT_text.js';

const loader = new GLTFLoader();
loader.register(parser => new GLTFTextExtension(parser, new THREE.FontLoader(),
  fontUrl, THREE));
loader.load(path_to_gltf_asset, gltf => {
  scene.add(gltf.scene);
  render();
});
```

## Compatible Three.js revision

&gt;= r126

## Dependencies

- [Three.js FontLoader](https://threejs.org/docs/#api/en/loaders/FontLoader)

Pass `FontLoader` instance to `GLTFTextExtension` constructor as the second argument.

- [Color](https://threejs.org/docs/#api/en/math/Color)
- [DoubleSide](https://threejs.org/docs/#api/en/materials/Material.side)
- [Mesh](https://threejs.org/docs/#api/en/objects/Mesh)
- [MeshBasicMaterial](https://threejs.org/docs/#api/en/materials/MeshBasicMaterial)
- [Object3D](https://threejs.org/docs/#api/en/core/Object3D)
- [ShapeGeometry](https://threejs.org/docs/#api/en/geometries/ShapeGeometry)

Pass the classes to `GLTFTextExtension` constructor as the fourth argument.

## API

### Constructor

**GLTFTextExtension(parser: GLTFParser, fontLoader: FontLoader, fontUrl: string, THREE: Object)**

`parser` -- `GLTFParser` instance which comes from `GLTFLoader.register()` callback

`fontLoader` -- [Three.js `FontLoader`](https://threejs.org/docs/#api/en/loaders/FontLoader) instance

`fontUrl` -- The url of font file passed to `FileLoader.load()`. Refer to [this page](https://github.com/mrdoob/three.js/tree/dev/examples/fonts) for the font files.

`THREE` -- Three.js dependencies the plugin needs. Either following style is expected to pass

```
import * as THREE from 'path_to_three.module.js';

loader.register(parser => new GLTFTextExtension(parser, new THREE.FontLoader(),
  fontUrl, THREE));
```

or

```
import {
  FontLoader,
  Color,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  ShapeGeometry
} from 'path_to_three.module.js';

loader.register(parser => new GLTFTextExtension(parser, new FontLoader(), fontUrl, {
  Color,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  ShapeGeometry
}));
```
