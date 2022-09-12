/**
 * DDS Texture Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/MSFT_texture_dds
 *
 */
export default class GLTFTextureDDSExtension {
  constructor(parser, ddsLoader) {
    this.name = 'MSFT_texture_dds';
    this.parser = parser;
    this.ddsLoader = ddsLoader;
  }

  loadTexture(textureIndex) {
    const json = this.parser.json;
    const textureDef = json.textures[textureIndex];
    if (!textureDef.extensions || !textureDef.extensions[this.name]) {
      return null;
    }
    const extensionDef = textureDef.extensions[this.name];
    return this.parser.loadTextureImage(textureIndex, extensionDef.source, this.ddsLoader);
  }
}
