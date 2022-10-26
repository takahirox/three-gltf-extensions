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
    // Note: If server doesn't support HTTP range requests
    //       reject callback is fired.
    fileLoader.load(url, resolve, undefined, reject);
    fileLoader.setRequestHeader(currentRequestHeader);
  });
};

// Based on the code in FileLoader
// Used if server doesn't support HTTP range requests.
const loadArrayBufferFromResponse = (response, onProgress) => {
  const reader = response.body.getReader();
  const contentLength = response.headers.get('Content-Length');
  const total = contentLength ? parseInt(contentLength) : 0;
  const lengthComputable = total !== 0;
  let loaded = 0;

  // periodically read data into the new stream tracking while download progress
  return new Response(
    new ReadableStream({
      start(controller) {
        readData();
        function readData() {
          reader.read().then(({done, value}) => {
            if (done) {
              controller.close();
            } else {
              loaded += value.byteLength;
              const event = new ProgressEvent('progress', {lengthComputable, loaded, total});
              if (onProgress) onProgress(event);
              controller.enqueue(value);
              readData();
            }
          });
        }
      }
    })
  ).arrayBuffer();
};


// GLB File Format handlers
// Specification: https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#glb-file-format-specification

const BINARY_HEADER_MAGIC = 'glTF';
const BINARY_HEADER_LENGTH = 12;
const BINARY_CHUNK_TYPES = {JSON: 0x4E4F534A, BIN: 0x004E4942};

export default class GLBRangeRequests {
  constructor(parser, url, binChunkOffset) {
    this.name = 'GLB_range_requests';
    this.parser = parser;
    this.url = url;
    this.binChunkOffset = binChunkOffset;
  }

  static load(url, loader, onLoad, onProgress, onError, fileLoader = null) {
    const assetUrl = (loader.path || '') + url;
    let resourcePath;
    if (loader.resourcePath !== '') {
      resourcePath = loader.resourcePath;
    } else if (loader.path !== '') {
      resourcePath = loader.path;
    } else {
      resourcePath = LoaderUtils.extractUrlBase(assetUrl);
    }

    GLBRangeRequests.loadContent(assetUrl, fileLoader).then(content => {
      loader
        .register(parser => new GLBRangeRequests(
          parser,
          assetUrl,
          content.binChunkOffset
        ))
        .parse(content.jsonContent, resourcePath, onLoad, onError);
    }).catch((error) => {
      // If server doesn't support range requests.
      // Response has full range content.
      // Parse with the full range content as fallback.
      if (error.response && error.response.status === 200) {
        loadArrayBufferFromResponse(error.response, onProgress).then(buffer => {
          loader.parse(buffer, resourcePath, onLoad, onError);
        }).catch(error => {
          if (onError) onError(error);
        });
        return;
      }

      // Perhaps rejected due to the either one
      // 1. The asset is not GLB (but glTF)
      // 2. The asset includes EXT_meshopt_compression extension that the
      //    this plugin can't handle
      // so load in the regular way as fallback.
      // @TODO: Check the error reason and don't run the fallback loading
      //        if the error reason is others?

      //console.error(error);
      loader.load(url, onLoad, onProgress, onError);
    });
  }

  // Note: Rejects if server doesn't support HTTP range requests
  static async loadContent(url, fileLoader = null) {
    if (fileLoader === null) {
      fileLoader = new FileLoader().setResponseType('arraybuffer');
    }

    // Load the GLB header and the first chunk info
    const buffer = await loadPartially(fileLoader, url, 0, BINARY_HEADER_LENGTH + 4);
    const view = new DataView(buffer);
    const header = {
      magic: LoaderUtils.decodeText(new Uint8Array(buffer.slice(0, 4))),
      version: view.getUint32(4, true),
      length: view.getUint32(8, true)
    };

    if (header.magic !== BINARY_HEADER_MAGIC) {
      return Promise.reject(new Error('GLBRangeRequests: The file is not GLB.'));
    }

    if (header.version < 2.0) {
      return Promise.reject(new Error('GLBRangeRequests: Legacy binary file detected.'));
    }

    const firstChunkLength = view.getUint32(12, true);
    let offset = BINARY_HEADER_LENGTH + 8;

    // The json chunk is required and must be the first chunk.
    // The bin chunk is optional and must be the second chunk if exists.
    // The number of json chunks must be 1. The number of bin chunks must be 0 or 1.
    // Specification: https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#chunks
    // Note: Assuming the GLB format is valid

    const result = {
      jsonContent: null,
      binChunkOffset: null
    };

    result.jsonContent = await loadPartially(fileLoader, url, offset, firstChunkLength);
    offset += firstChunkLength;

    if (offset < header.length) {
      result.binChunkOffset = offset + 8;
    }

    if (result.jsonContent.extensionsUsed &&
        result.jsonContent.extensionsUsed.indexOf('EXT_meshopt_compression') >= 0) {
      // @TODO: Resolve this problem.
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
    const length = bufferViewDef.byteLength || 0;
    const offset = bufferViewDef.byteOffset || 0;

    return loadPartially(fileLoader, this.url, this.binChunkOffset + offset, length);
  }
}
