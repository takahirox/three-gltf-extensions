import {
  FileLoader,
  LoaderUtils
} from 'three';

export default class GLTFManyfoldMeshProgressiveExtension {
  constructor(parser, url, binChunkOffset) {
    this.name = 'MANYFOLD_mesh_progressive';
    this.parser = parser;
    this.url = url;
    this.binChunkOffset = binChunkOffset;
    console.log(`${this.name} loader created`)
  }

  static load(url, loader, onLoad, onProgress, onError, fileLoader = null) {
    console.log(`${this.name} falling back to original loader`)
    loader.load(url, onLoad, onProgress, onError);
  }
}
