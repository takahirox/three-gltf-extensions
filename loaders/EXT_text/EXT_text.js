import {
  Color,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  ShapeGeometry
} from 'three';

/**
 * Text Extension
 *
 * Specification: https://github.com/takahirox/EXT_text
 *
 */
export default class GLTFTextExtension {
  constructor(parser, fontLoader, fontUrl) {
    this.name = 'EXT_text';
    this.parser = parser;
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
      const geometry = new ShapeGeometry(shapes);
      return new Mesh(
        geometry,
        new MeshBasicMaterial({
          side: DoubleSide,
          color: new Color(color[0], color[1], color[2]),
          transparent: color[3] < 1.0,
          opacity: color[3]
        })
      );
    }).catch(error => {
      // @TODO: Properer error handling
      console.error(error);
      return Object3D();
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
