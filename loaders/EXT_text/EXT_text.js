/**
 * Text Extension
 *
 * Specification: https://github.com/takahirox/EXT_text
 *
 */
export default class GLTFTextExtension {
  constructor(parser, fontLoader, fontUrl, THREE) {
    this.name = 'EXT_text';
    this.parser = parser;
    this.THREE = THREE;
    this.fontLoader = fontLoader;
    this.fontUrl = fontUrl;
    this.fontPromise = null;
  }

  createNodeAttachment(nodeIndex) {
    const json = this.parser.json;
    const nodeDef = json.nodes[nodeIndex];
    if (!json.extensions || !json.extensions[this.name] ||
      !nodeDef.extensions || !nodeDef.extensions[this.name]) {
      return null;
    }
    const extensionDef = nodeDef.extensions[this.name];
    const textsDef = json.extensions[this.name].texts;
    const textDef = textsDef[extensionDef.text];
    const textContent = textDef.text;
    const color = textDef.color || [0.5, 0.5, 0.5, 1.0];
    return this._loadFont().then(font => {
      const shapes = font.generateShapes(textContent);
      const geometry = new this.THREE.ShapeGeometry(shapes);
      return new this.THREE.Mesh(
        geometry,
        new this.THREE.MeshBasicMaterial({
          side: this.THREE.DoubleSide,
          color: new this.THREE.Color(color[0], color[1], color[2]),
          transparent: color[3] < 1.0,
          opacity: color[3]
        })
      );
    }).catch(error => {
      // @TODO: Properer error handling
      console.error(e);
      return this.THREE.Object3D();
    });
  }

  _loadFont() {
    if (this.fontPromise) { return this.fontPromise; }

    this.fontPromise = new Promise((resolve, reject) => {
      this.fontLoader.load(this.fontUrl, resolve, undefined, reject);
    });

    return this.fontPromise;
  }
}
