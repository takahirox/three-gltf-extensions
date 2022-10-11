import {
  FileLoader,
  LoaderUtils
} from 'three';

const loadPartially = (fileLoader, url, offset, length) => {
  return new Promise((resolve, reject) => {
    const currentRequestHeader = fileLoader.requestHeader;
    fileLoader.setRequestHeader(Object.assign(
      {Range: `bytes=${offset}-${offset + length - 1}`},
      currentRequestHeader
    ));
    fileLoader.load(url, resolve, undefined, reject);
    fileLoader.setRequestHeader(currentRequestHeader);
  });
};

// GLB File Format handlers
// Specification: https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#glb-file-format-specification

const BINARY_HEADER_MAGIC = 'glTF';
const BINARY_HEADER_MAGIC_LENGTH = 4;
const BINARY_HEADER_LENGTH = 12;
const BINARY_CHUNK_TYPES = {JSON: 0x4E4F534A, BIN: 0x004E4942};

const isGLB = (buffer) => {
  return LoaderUtils.decodeText(buffer.slice(0, BINARY_HEADER_MAGIC_LENGTH)) === BINARY_HEADER_MAGIC;
};

const isGLBFile = (fileLoader, url) => {
  return loadPartially(fileLoader, url, 0, BINARY_HEADER_MAGIC_LENGTH).then(isGLB);
};

export default class GLBRangeRequests {
  constructor(parser, url, binChunkOffset) {
    this.parser = parser;
    this.url = url;
    this.binChunkOffset = binChunkOffset;
  }

  static load(url, loader, onLoad, onProgress, onError, fileLoader = null) {
    GLBRangeRequests.loadContent((loader.path || '') + url, fileLoader)
      .then(content => {
        let resourcePath;
        if (loader.resourcePath !== '') {
          resourcePath = loader.resourcePath;
        } else if (loader.path !== '') {
          resourcePath = loader.path;
        } else {
          resourcePath = LoaderUtils.extractUrlBase(url);
        }

        loader
          .register(parser => new GLBRangeRequests(
            parser,
            url,
            content.binChunkOffset
          ))
          .parse(content.jsonContent, resourcePath, onLoad, onError);
      })
      .catch(() => {
        loader.load(url, onLoad, onProgress, onError);
      });
  }

  static async loadContent(url, fileLoader = null) {
    if (fileLoader === null) {
      fileLoader = new FileLoader().setResponseType('arraybuffer');
    }

    const buffer = await loadPartially(fileLoader, url, 0, BINARY_HEADER_LENGTH);
    const view = new DataView(buffer);
    const header = {
      magic: LoaderUtils.decodeText(new Uint8Array(buffer.slice(0, 4))),
      version: view.getUint32(4, true),
      length: view.getUint32(8, true)
    };

    if (header.version < 2.0) {
      return Promise.reject(new Error('GLBRangeRequests: Legacy binary file detected.'));
    }

    const result = {
      jsonContent: null,
      binChunkOffset: null
    };

    let offset = BINARY_HEADER_LENGTH;

    while (offset < header.length) {
      const buffer = await loadPartially(fileLoader, url, offset, 8);
      const view = new DataView(buffer);
      const length = view.getUint32(0, true);
      const type = view.getUint32(4, true);
      offset += 8;

      if (type === BINARY_CHUNK_TYPES.JSON) {
        result.jsonContent = await loadPartially(fileLoader, url, offset, length);
      } else if (type === BINARY_CHUNK_TYPES.BIN) {
        result.binChunkOffset = offset;
      }

      offset += length;
    }

    if (result.binChunkOffset === null) {
      return Promise.reject(new Error('GLBRangeRequests: No BIN chunk so progressive glb loading is not needed.'));
    }

    if (result.jsonContent.extensionsUsed &&
        result.jsonContent.extensionsUsed.indexOf('EXT_meshopt_compression') >= 0) {
      return Promise.reject(new Error('GLBRangeRequests: currently no EXT_meshopt_compression extension support.'));
    }

    return result;
  }

  loadBufferView(bufferViewIndex) {
    const parser = this.parser;
    const json = parser.json;

    const bufferViewDef = json.bufferViews[bufferViewIndex];
    const bufferIndex = bufferViewDef.buffer;
    const bufferDef = json.buffers[bufferIndex];

    if (bufferDef.type !== undefined && bufferDef.type !== 'arraybuffer') {
      return null;
    }

    if (bufferDef.uri !== undefined || bufferIndex !== 0) {
      return null;
    }

    const fileLoader = parser.fileLoader;
    const options = parser.options;
    const length = bufferViewDef.byteLength || 0;
    const offset = bufferViewDef.byteOffset || 0;

    return loadPartially(fileLoader, LoaderUtils.resolveURL(this.url, options.path), this.binChunkOffset + offset, length);
  }
}
