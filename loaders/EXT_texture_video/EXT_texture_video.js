import {
  ClampToEdgeWrapping,
  LinearFilter,
  LinearMipmapLinearFilter,
  LinearMipmapNearestFilter,
  MirroredRepeatWrapping,
  NearestFilter,
  NearestMipmapNearestFilter,
  NearestMipmapLinearFilter,
  RepeatWrapping,
  VideoTexture
} from 'three';

const WEBGL_FILTERS = {
  9728: NearestFilter,
  9729: LinearFilter,
  9984: NearestMipmapNearestFilter,
  9985: LinearMipmapNearestFilter,
  9986: NearestMipmapLinearFilter,
  9987: LinearMipmapLinearFilter
};

const WEBGL_WRAPPINGS = {
  33071: ClampToEdgeWrapping,
  33648: MirroredRepeatWrapping,
  10497: RepeatWrapping
};

/**
 * Video Texture Extension
 *
 * Specification: https://github.com/takahirox/EXT_texture_video
 *
 */
export default class GLTFTextExtension {
  constructor(parser) {
    this.name = 'EXT_texture_video';
    this.parser = parser;
  }

  loadTexture(textureIndex) {
    const json = this.parser.json;
    const textureDef = json.textures[textureIndex];
    if (!json.extensions || !json.extensions[this.name] ||
      !textureDef.extensions || !textureDef.extensions[this.name]) {
      return null;
    }
    const extensionDef = textureDef.extensions[this.name];
    const videosDef = json.extensions[this.name].videos;
    const videoDef = videosDef[extensionDef.source];
    const video = document.createElement('video');
    const samplersDef = json.samplers || [];
    const samplerDef = samplersDef[extensionDef.sampler] || {};
    return new Promise(resolve => {
      // @TODO: Support buffer view?
      video.src = (this.parser.options.path || '') + videoDef.uri;
      video.loop = true;
      video.muted = true;
      video.load();
      const onCanplaythrough = event => {
        video.removeEventListener('canplaythrough', onCanplaythrough);
        video.play();
        const texture = new VideoTexture(video);
        texture.flipY = false;
        texture.magFilter = WEBGL_FILTERS[samplerDef.magFilter] || LinearFilter;
        texture.minFilter = WEBGL_FILTERS[samplerDef.minFilter] || LinearFilter;
        texture.wrapS = WEBGL_WRAPPINGS[samplerDef.wrapS] || RepeatWrapping;
        texture.wrapT = WEBGL_WRAPPINGS[samplerDef.wrapT] || RepeatWrapping;
        resolve(texture);
      };
      video.addEventListener('canplaythrough', onCanplaythrough);
    });
  }
}
