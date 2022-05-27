# [Three.js](https://threejs.org) [GLTFLoader](https://threejs.org/docs/#examples/en/loaders/GLTFLoader) [EXT_text](https://github.com/takahirox/EXT_text) extension

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
import GLTFTextExtension from 'path_to_three-gltf-exensions/loaders/EXT_text/EXT_text.js';

const loader = new GLTFLoader();
loader.register(parser => new GLTFTextExtension(parser, new THREE.FontLoader(),
  fontUrl));
loader.load(path_to_gltf_asset, gltf => {
  scene.add(gltf.scene);
  render();
});
</script>
```

## Compatible Three.js revision

&gt;= r133

## Dependencies

- [Three.js FontLoader](https://threejs.org/docs/#api/en/loaders/FontLoader)

Pass `FontLoader` instance to `GLTFTextExtension` constructor as the second argument.

## API

### Constructor

**GLTFTextExtension(parser: GLTFParser, fontLoader: FontLoader, fontUrl: string)**

`parser` -- `GLTFParser` instance which comes from `GLTFLoader.register()` callback

`fontLoader` -- [Three.js `FontLoader`](https://threejs.org/docs/#api/en/loaders/FontLoader) instance

`fontUrl` -- The url of font file passed to `FileLoader.load()`. Refer to [this page](https://github.com/mrdoob/three.js/tree/dev/examples/fonts) for the font files.
