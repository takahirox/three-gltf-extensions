/**
 * LOD Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/MSFT_lod
 *
 */
export default class GLTFLodExtension {
  constructor(parser, callback=null, THREE) {
    this.name = 'MSFT_lod';
    this.parser = parser;
    this.callback = callback;
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

    // To prevent an infinite loop
    this.processing.set(materialIndex, true);

    const extensionDef = materialDef.extensions[this.name];
    const materialIndices = [materialIndex];
    extensionDef.ids.forEach(id => materialIndices.push(id));

    // Low to high LOD to request the lower ones first
    materialIndices.reverse();

    const pending = materialIndices.map(index => this.parser.getDependency('material', index));

    // To refer to LOD materials from createNodeMesh() later
    this.materialMap.set(materialIndex, pending);

    this.processing.delete(materialIndex);

    // Return the lowest LOD material for the better response time
    return pending[0];
  }

  createNodeMesh(nodeIndex) {
    const json = this.parser.json;
    const rootNodeDef = json.nodes[nodeIndex];

    const hasExtensionInNode = this._hasExtensionInNode(rootNodeDef);
    const hasExtensionInMaterial = this._hasExtensionInMaterial(rootNodeDef);

    if (!hasExtensionInNode && !hasExtensionInMaterial) {
      return null;
    }

    const nodeIndices = [nodeIndex];

    if (hasExtensionInNode) {
      const extensionDef = rootNodeDef.extensions[this.name];
      extensionDef.ids.forEach(id => nodeIndices.push(id));
    }

    // Low to high LOD to request the lower ones first
    nodeIndices.reverse();

    const lod = new this.THREE.LOD();

    const meshPending = [];

    for (let i = 0, il = nodeIndices.length; i < il; i++) {
      const nodeIndex = nodeIndices[i];
      const nodeDef = json.nodes[nodeIndex];
      const nodeLevel = nodeIndices.length - i - 1;

      meshPending.push(this._loadMesh(nodeDef).then(mesh => {
        if (nodeDef.mesh === undefined) { // mesh is Object3D
          lod.addLevel(mesh, this._calculateDistance(nodeLevel, rootNodeDef));
          if (this.callback) {
            this.callback(lod, mesh);
          }
          return;
        }

        // mesh is Mesh/Line/Points or Group
        // @TODO: There can be a case that other plugins create other type objects?
        //        And in that case how should we resolve?
        const meshes = mesh.isGroup ? mesh.children : [mesh];
        const meshDef = this.parser.json.meshes[nodeDef.mesh];
        const materialIndices = meshDef.primitives.map(primitive => {
          return primitive.material !== undefined ? primitive.material : -1;
        });

        const materialPending = [];
        // Assume meshes.length and materialIndices.length are same so far.
        // The lengths can be different if other plugins apply some changes.
        // @TODO: In such a case how should we process correctly?
        for (let j = 0, jl = Math.min(meshes.length, materialIndices.length); j < jl; j++) {
          const mesh = meshes[j];
          const materialIndex = materialIndices[j];
          if (this.materialMap.has(materialIndex)) {
            const materialPromises = this.materialMap.get(materialIndex);
            const materialDef = json.materials[materialIndex];
            // @TODO: Process correctly if LODs are defined both in node and material
            for (let k = 0, kl = materialPromises.length; k < kl; k++) {
              const materialPromise = materialPromises[k];
              const materialLevel = materialPromises.length - k - 1;
              materialPending.push(materialPromise.then(material => {
                const lodMesh = mesh.clone();
                lodMesh.material = material;
                this.parser.assignFinalMaterial(lodMesh);
                lod.addLevel(lodMesh, this._calculateDistance(materialLevel, materialDef));
                if (this.callback) {
                  this.callback(lod, lodMesh);
                }
              }));
            }
          } else {
            lod.addLevel(mesh, this._calculateDistance(nodeLevel, rootNodeDef));
            if (this.callback) {
              this.callback(lod, mesh);
            }
            materialPending.push(Promise.resolve());
          }
        }

        return Promise.any(materialPending);
      }));
    }

    return Promise.any(meshPending).then(_ => {
      return lod;
    });
  }

  async _loadMesh(nodeDef) {
    if (nodeDef.mesh === undefined) {
      return new this.THREE.Object3D();
    }

    // @TODO: How should we resolve the case that another mesh index is defined
    // in node extension and it, not nodeDef.mesh, should be loaded?
    // Maybe we should delegate to other plugins but how?
    const mesh = await this.parser.getDependency('mesh', nodeDef.mesh);
    const node = this.parser._getNodeRef(this.parser.meshCache, nodeDef.mesh, mesh);
    if (nodeDef.weights) {
      // node is Mesh or Group
      node.traverse(obj => {
        if (!obj.isMesh) {
          return;
        }
        for (let i = 0, il = nodeDef.weights.length; i < il; i++) {
          obj.morphTargetInfluences[i] = nodeDef.weights[i];
        }
      });
    }
    return node;
  }

  _hasExtensionInNode(nodeDef) {
    if (!nodeDef.extensions || !nodeDef.extensions[this.name]) {
      return false;
    }
    const nodeDefs = nodeDef.extensions[this.name].ids.map(id => this.parser.json.nodes[id]);
    nodeDefs.push(nodeDef);

    // We determine it's invalid as the extension if all node don't have mesh so far
    return nodeDefs.filter(def => def.mesh !== undefined).length > 0;
  }

  _hasExtensionInMaterial(nodeDef) {
    const json = this.parser.json;
    const meshIndices = [];

    if (this._hasExtensionInNode(nodeDef)) {
      const extensionDef = nodeDef.extensions[this.name];
      const nodeDefs = [nodeDef];
      extensionDef.ids.forEach(id => nodeDefs.push(json.nodes[id]));
      nodeDefs.forEach(nodeDef => nodeDef.mesh !== undefined && meshIndices.push(nodeDef.mesh));
    } else {
      if (nodeDef.mesh !== undefined) {
        meshIndices.push(nodeDef.mesh);
      }
    }

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
  _calculateDistance(level, def) {
    if (level === 0) return 0;

    const coverage = (def.extras && def.extras['MSFT_screencoverage'] &&
      Array.isArray(def.extras['MSFT_screencoverage'])) ? def.extras['MSFT_screencoverage'] : [];
    const levelNum = def.extensions[this.name].ids.length + 1;

    // If coverage num doesn't match to LOD level num, we ignore coverage so far.
    // Assuming coverage is in the range 1.0(near) - 0.0(far) @TODO: Is this assumption true?
    // Ignoring the last coverage because I want to display the lowest LOD at the furtherest
    // @TODO: Is that ok?
    const c = levelNum === coverage.length ? coverage[level - 1] : (level / levelNum);

    // @TODO: Improve
    const near = 0.0;
    const far = 100.0;
    return Math.pow((1.0 - c), 4.0) * (far - near) + near;
  }
}
