# [Three.js](https://threejs.org) [GLTFLoader](https://threejs.org/docs/#examples/en/loaders/GLTFLoader) [EXT_texture_video](https://github.com/takahirox/EXT_texture_video) extension

## How to use

```javascript
import * as THREE from 'path_to_three.module.js';
import {GLTFLoader} from 'path_to_GLTFLoader.js';
import GLTFVideoTextureExtension from 'path_to_three-gltf-exensions/loaders/EXT_texture_video/EXT_texture_video.js';

const loader = new GLTFLoader();
loader.register(parser => new GLTFVideoTextureExtension(parser, THREE));
loader.load(path_to_gltf_asset, gltf => {
  scene.add(gltf.scene);
  render();
});
```

## Compatible Three.js revision

&gt;= r128

## Dependencies

Three.js dependencies

- [VideoTexture](https://threejs.org/docs/#api/en/textures/VideoTexture)
- [NearestFilter](https://threejs.org/docs/#api/en/constants/Textures)
- [LinearFilter](https://threejs.org/docs/#api/en/constants/Textures)
- [NearestMipmapNearestFilter](https://threejs.org/docs/#api/en/constants/Textures)
- [LinearMipmapNearestFilter](https://threejs.org/docs/#api/en/constants/Textures)
- [NearestMipmapLinearFilter](https://threejs.org/docs/#api/en/constants/Textures)
- [LinearMipmapLinearFilter](https://threejs.org/docs/#api/en/constants/Textures)
- [ClampToEdgeWrapping](https://threejs.org/docs/#api/en/constants/Textures)
- [MirroredRepeatWrapping](https://threejs.org/docs/#api/en/constants/Textures)
- [RepeatWrapping](https://threejs.org/docs/#api/en/constants/Textures)

Pass the classes to `GLTFVideoTextureExtension` constructor as the second argument.

## API

### Constructor

**GLTFVideoTextureExtension(parser: GLTFParser, THREE: Object)**

`parser` -- `GLTFParser` instance which comes from `GLTFLoader.register()` callback

`THREE` -- Three.js dependencies the plugin needs. Either following style is expected to pass

```
import * as THREE from 'path_to_three.module.js';

loader.register(parser => new GLTFVideoTextureExtension(parser, THREE));
```

or

```
import {
  VideoTexture,
  NearestFilter,
  LinearFilter,
  NearestMipmapNearestFilter,
  LinearMipmapNearestFilter,
  NearestMipmapLinearFilter,
  LinearMipmapLinearFilter,
  ClampToEdgeWrapping,
  MirroredRepeatWrapping,
  RepeatWrapping
} from 'path_to_three.module.js';

loader.register(parser => new GLTFTextExtension(parser, {
  VideoTexture,
  NearestFilter,
  LinearFilter,
  NearestMipmapNearestFilter,
  LinearMipmapNearestFilter,
  NearestMipmapLinearFilter,
  LinearMipmapLinearFilter,
  ClampToEdgeWrapping,
  MirroredRepeatWrapping,
  RepeatWrapping
}));
```
