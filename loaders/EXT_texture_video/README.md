# [Three.js](https://threejs.org) [GLTFLoader](https://threejs.org/docs/#examples/en/loaders/GLTFLoader) [EXT_texture_video](https://github.com/takahirox/EXT_texture_video) extension

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
import GLTFVideoTextureExtension from 'path_to_three-gltf-exensions/loaders/EXT_texture_video/EXT_texture_video.js';

const loader = new GLTFLoader();
loader.register(parser => new GLTFVideoTextureExtension(parser));
loader.load(path_to_gltf_asset, gltf => {
  scene.add(gltf.scene);
  render();
});
</script>
```

## Compatible Three.js revision

&gt;= r128

## API

### Constructor

**GLTFVideoTextureExtension(parser: GLTFParser)**

`parser` -- `GLTFParser` instance which comes from `GLTFLoader.register()` callback
