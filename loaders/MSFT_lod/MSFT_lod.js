/**
 * LOD Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/MSFT_lod
 *
 */
export default class GLTFLodExtension {
  constructor(parser, camera=null, THREE) {
    this.name = 'MSFT_lod';
    this.parser = parser;
    this.camera = camera;
    this.THREE = THREE;
    this.materialMap = new Map();
    this.processing = new Map();
  }

  loadMaterial(materialIndex) {
    const json = this.parser.json;
    const materialDef = json.materials[materialIndex];

    if (!materialDef.extensions || !materialDef.extensions[this.name] ||
      this.processing.has(materialIndex)) {
      return null;
    }

    this.processing.set(materialIndex, true);

    const extensionDef = materialDef.extensions[this.name];
    const pending = [];

    // Low to high LOD to request the lower ones first
    const materialIndices = [];
    extensionDef.ids.forEach(id => materialIndices.unshift(id));
    materialIndices.push(materialIndex);

    for (const index of materialIndices) {
      pending.push(this.parser.getDependency('material', index));
    }
    this.materialMap.set(materialIndex, pending);

    this.processing.delete(materialIndex);

    // Return the lowest LOD material
    return pending[0];
  }

  createNodeMesh(nodeIndex) {
    const json = this.parser.json;
    const nodeDef = json.nodes[nodeIndex];

    const hasExtensionInNode = this._hasExtensionInNode(nodeDef);
    const hasExtensionInMaterial = this._hasExtensionInMaterial(nodeDef);

    if (!hasExtensionInNode && !hasExtensionInMaterial) {
      return null;
    }

    // Low to high LOD to request the lower ones first
    const nodeIndices = [];

    if (hasExtensionInNode) {
      const extensionDef = nodeDef.extensions[this.name];
      extensionDef.ids.forEach(id => nodeIndices.unshift(id));
    }

	nodeIndices.push(nodeIndex);

    const lod = new this.THREE.LOD();

    const pending = [];

    for (const nodeIndex of nodeIndices) {
      pending.push(this._loadNodeMesh(nodeIndex).then(mesh => {
        // 
        const meshes = mesh.isGroup ? mesh.children : [mesh];
        const materialIndices = this._getMaterialIndices(json.nodes[nodeIndex]);

        const materialPending = [];
        // Assume meshes.length and materialIndices.length are same so far
        for (const materialIndex of materialIndices) {
          if (this.materialMap.has(materialIndex)) {
            const materialPromises = this.materialMap.get(materialIndex);
            for (let i = 0, il = materialPromises.length; i < il; i++) {
              const materialPromise = materialPromises[i];
              const level = materialPromises.length - i - 1;
              materialPending.push(materialPromise.then(material => {
                const lodMesh = mesh.clone();
                lodMesh.material = material;
                lod.addLevel(lodMesh, this._calculateDistance(level));
              }));
            }
          } else {
            lod.addLevel(mesh, this._calculateDistance());
            materialPending.push(Promise.resolve());
          }
        }

        return Promise.any(materialPending);
      }));
    }

    return Promise.any(pending).then(_ => {
      console.log(lod);
      return lod;
    });
  }

  async _loadNodeMesh(nodeIndex) {
    const json = this.parser.json;
    const nodeDef = json.nodes[nodeIndex];
    const meshIndex = nodeDef.mesh;
    const mesh = await this.parser.getDependency('mesh', meshIndex);
    if (mesh.isMesh && nodeDef.weights) {
      for (let i = 0, il = nodeDef.weights.length; i < il; i++) {
        mesh.morphTargetInfluences[i] = nodeDef.weights[i];
      }
    }
    return mesh;
  }

  _getMeshIndices(nodeDef) {
    if (this._hasExtensionInNode(nodeDef)) {
      const json = this.parser.json;
      const extensionDef = nodeDef.extensions[this.name];
      const nodeDefs = extensionDef.ids.map(id => json.nodes[id]);
      nodeDefs.unshift(nodeDef);
      return nodeDefs.map(nodeDef => nodeDef.mesh);
    } else {
      return nodeDef.mesh !== undefined ? [nodeDef.mesh] : [];
    }
  }

  _getMaterialIndices(nodeDef) {
    const meshIndex = nodeDef.mesh;
    const meshDef = this.parser.json.meshes[meshIndex];
    return meshDef.primitives.map(primitive => {
      return primitive.material !== undefined ? primitive.material : -1;
    });
  }

  _hasExtensionInNode(nodeDef) {
    if (!nodeDef.extensions || !nodeDef.extensions[this.name]) {
      return false;
    }
    const json = this.parser.json;
    const extensionDef = nodeDef.extensions[this.name];
    const nodeDefs = extensionDef.ids.map(id => json.nodes[id]);
    nodeDefs.unshift(nodeDef);
    return nodeDefs.filter(nodeDef => nodeDef.mesh === undefined).length === 0;
  }

  _hasExtensionInMaterial(nodeDef) {
    const json = this.parser.json;
    const meshIndices = this._getMeshIndices(nodeDef);
    for (const meshIndex of meshIndices) {
      const meshDef = json.meshes[meshIndex];
      for (const primitive of meshDef.primitives) {
        if (primitive.material === undefined) {
          continue;
        }
        const materialDef = json.materials[primitive.material];
        if (materialDef.extensions && materialDef.extensions[this.name]) {
          return true;
        }
      }
    }
    return false;
  }

  // level: 0 is highest LOD
  _calculateDistance(level) {
    // @TODO: Fix  me
    return level * 2;
  }
}
