/**
 * Video Texture Extension
 *
 * Specification: https://github.com/takahirox/EXT_texture_video
 *
 */

export default class GLTFTextExtension {
  constructor(parser, THREE) {
    this.name = 'EXT_texture_video';
    this.parser = parser;
    this.THREE = THREE;

    this.WEBGL_FILTERS = {
      9728: THREE.NearestFilter,
      9729: THREE.LinearFilter,
      9984: THREE.NearestMipmapNearestFilter,
      9985: THREE.LinearMipmapNearestFilter,
      9986: THREE.NearestMipmapLinearFilter,
      9987: THREE.LinearMipmapLinearFilter
    };

    this.WEBGL_WRAPPINGS = {
      33071: THREE.ClampToEdgeWrapping,
      33648: THREE.MirroredRepeatWrapping,
      10497: THREE.RepeatWrapping
    };
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
        const texture = new this.THREE.VideoTexture(video);
        texture.flipY = false;
        texture.magFilter = this.WEBGL_FILTERS[samplerDef.magFilter] || this.THREE.LinearFilter;
        texture.minFilter = this.WEBGL_FILTERS[samplerDef.minFilter] || this.THREE.LinearFilter;
        texture.wrapS = this.WEBGL_WRAPPINGS[samplerDef.wrapS] || this.THREE.RepeatWrapping;
        texture.wrapT = this.WEBGL_WRAPPINGS[samplerDef.wrapT] || this.THREE.RepeatWrapping;
        resolve(texture);
      };
      video.addEventListener('canplaythrough', onCanplaythrough);
    });
  }
}
