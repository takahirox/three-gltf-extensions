# three-gltf-plugins

[Three.js](https://threejs.org) glTF [loader](https://threejs.org/docs/#examples/en/loaders/GLTFLoader) and [exporter](https://threejs.org/docs/#examples/en/exporters/GLTFExporter) have plugin system to provide extensibility mechanism to users. glTF extensions can be handled with the plugin system.

Some plugins for major and stable extensions are built-in in the loader and exporter. But other extensions are not supported as built-in by them (yet) because for example the specification is not great fit to Three.js API or structure, or the specification is not finalized.

If you want to use such extensions you need to write plugins by yourself but it requires the knowledge of glTF specification, extensions specification, Three.js core API, or Three.js glTF loader/exporter API. It can be difficult for some users.

This project provides you Three.js glTF loader/extension plugins even for such extensions. You no longer need to write the plugin on your own.

## Goals

* Provide reusablity and easiness to use even for the the extensions the spec of which isn't great fit
* Allow early trial of glTF extensions the spec of which is not finalized yet
* Send feedback to Three.js glTF loader/exporter plugin system APIs

## Supported glTF extensions

* [KHR_materials_variants](https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_variants) (Currently loader only)

## How to use

**GLTFLoader plugins**

```
// Import Three.js
import * as THREE from 'path_to_three.module.js';
import { GLTFLoader } from 'path_to_GLTFLoader.js';

// Import three-gltf-plugins loader plugins
import FooExtensionPlugin from 'path_to_three-gltf-plugins/loaders/FooExtension/plugin.js';

// Register the plugin to the loader and then load glTF
const loader = new GLTFLoader();
loader.register(parser => new FooExtensionPlugin(parser));
loader.load(path_to_gltf_asset, gltf => {
  ...
});
```


**GLTFExporter plugins**

```
T.B.D
```

Refer to each plugin's README for more detail.

## Customize the plugins in your side

As written above, some extensions are not great fit to Three.js API or structure. So the plugins for them may have some limitations. If they don't cover your use case, please fork the repository and customize in your side.
