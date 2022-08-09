import {
  LOD,
  Object3D
} from 'three';

/**
 * LOD Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/MSFT_lod
 */
export default class GLTFLodExtension {
  constructor(parser, options={}) {
    this.name = 'MSFT_lod';
    this.parser = parser;
    this.options = options;
    this.materialMap = new Map();
    // Save material indices being processed to prevent an infinite loop
    this.processing = new Map();
  }

  _hasExtensionInNode(nodeDef) {
    if (!nodeDef.extensions || !nodeDef.extensions[this.name]) {
      return false;
    }

    const extensionDef = nodeDef.extensions[this.name];
    const nodeDefs = extensionDef.ids.map(id => this.parser.json.nodes[id]);
    nodeDefs.push(nodeDef);

    // We determine that it's invalid as the extension if all the nodes don't have mesh so far
    return nodeDefs.filter(def => def.mesh !== undefined).length > 0;
  }

  _hasExtensionInMaterial(nodeDef) {
    const json = this.parser.json;
    const meshIndices = [];

    // Collect mesh indices of this node and the LOD nodes.
    if (nodeDef.mesh !== undefined) {
      meshIndices.push(nodeDef.mesh);
    }

    if (this._hasExtensionInNode(nodeDef)) {
      nodeDef.extensions[this.name].ids
        .filter(id => json.nodes[id].mesh !== undefined)
        .forEach(id => meshIndices.push(json.nodes[id].mesh));
    }

    // Check if any mesh.primitive refers to material having the extension
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

  _loadScreenCoverages(def) {
    const extras = def.extras;

    if (!extras) {
      return [];
    }

    const screenCoverages = extras['MSFT_screencoverage'];

    // extra field is free structure so validate more carefully
    if (!screenCoverages || !Array.isArray(screenCoverages)) {
      return [];
    }

    return screenCoverages;
  }

  // level: 0 is the highest level
  _calculateDistance(level, def) {
    const coverages = this._loadScreenCoverages(def);

    // Use the distance set by users if calculateDistance callback is set
    if (this.options.calculateDistance) {
      return this.options.calculateDistance(level, coverages);
    }

    if (level === 0) return 0;

    const levelNum = def.extensions[this.name].ids.length + 1;

    // If coverage num doesn't match to LOD level num, we ignore coverage so far.
    // Assuming coverage is in the range 1.0(near) - 0.0(far) @TODO: Is this assumption true?
    // Ignoring the last coverage because I want to display the lowest LOD at the furtherest
    // @TODO: Is that ok?
    const c = levelNum === coverages.length ? coverages[level - 1] : (level / levelNum);

    // @TODO: Improve
    const near = 0.0;
    const far = 100.0;
    return Math.pow((1.0 - c), 4.0) * (far - near) + near;
  }

  async _loadMesh(nodeDef) {
    if (nodeDef.mesh === undefined) {
      return new Object3D();
    }

    const parser = this.parser;

    // @TODO: Fix me. Private methods of the parser shouldn't be accessible.
    const mesh = parser._getNodeRef(
      this.parser.meshCache,
      nodeDef.mesh,
      // @TODO: How can we resolve the case that another mesh index is defined
      // in another node extension and it should be loaded instead?
      // Maybe we should delegate to other plugins but how?
      await this.parser.getDependency('mesh', nodeDef.mesh)
    );

    // @TODO: Write comment why we need this
    if (nodeDef.weights) {
      // mesh is Mesh or Group
      mesh.traverse(obj => {
        if (!obj.isMesh) {
          return;
        }
        for (let i = 0, il = nodeDef.weights.length; i < il; i++) {
          obj.morphTargetInfluences[i] = nodeDef.weights[i];
        }
      });
    }

    return mesh;
  }

  loadMaterial(materialIndex) {
    const parser = this.parser;
    const json = parser.json;
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

    const pending = [];
    // Reverse order is to request materials load from low to high levels
    for (let i = materialIndices.length - 1; i >= 0; i--) {
      pending.push(parser.getDependency('material', materialIndices[i]));
    }

    // To refer to LOD materials from createNodeMesh() later
    this.materialMap.set(materialIndex, pending);

    this.processing.delete(materialIndex);

    // Return the lowest level for the better response time
    return pending[0];
  }

  createNodeMesh(rootNodeIndex) {
    const parser = this.parser;
    const json = parser.json;
    const rootNodeDef = json.nodes[rootNodeIndex];

    const hasExtensionInNode = this._hasExtensionInNode(rootNodeDef);
    const hasExtensionInMaterial = this._hasExtensionInMaterial(rootNodeDef);

    if (!hasExtensionInNode && !hasExtensionInMaterial) {
      return null;
    }

    // Assume LODs are defined in either node or material so far.
    // It may work weirdly if the both define LODs.
    // @TODO: Fix me.
    //        Refer to https://github.com/KhronosGroup/glTF/issues/1952

    const nodeIndices = [rootNodeIndex];
    if (hasExtensionInNode) {
      rootNodeDef.extensions[this.name].ids.forEach(id => nodeIndices.push(id));
    }

    const lod = new LOD();
    const meshPending = [];

    // Reverse order is to request meshes load from low to high levels
    for (let i = nodeIndices.length - 1; i >= 0; i--) {
      const nodeIndex = nodeIndices[i];
      const nodeDef = json.nodes[nodeIndex];

      meshPending.push(this._loadMesh(nodeDef).then(mesh => {
        // mesh is Object3D
        if (nodeDef.mesh === undefined) {
          lod.addLevel(mesh, this._calculateDistance(i, rootNodeDef));
          if (this.options.onUpdate) {
            this.options.onUpdate(lod, mesh, i);
          }
          return;
        }

        // mesh is Mesh/Line/Points or Group
        // @TODO: There can be a case that other plugins create other type objects?
        //        And in that case how should we resolve?
        const meshes = mesh.isGroup ? mesh.children : [mesh];
        const meshDef = parser.json.meshes[nodeDef.mesh];
        const materialPending = [];

        // Assume mesh.primitives.length, meshes.length and materialIndices.length are
        // the same so far. The lengths can be different if other plugins apply some changes.
        // @TODO: In such a case how should we process correctly?
        for (let j = 0, jl = meshes.length; j < jl; j++) {
          const mesh = meshes[j];
          const materialIndex = meshDef.primitives[j].material !== undefined
            ? meshDef.primitives[j].material
            : -1;

          if (this.materialMap.has(materialIndex)) {
            // This mesh refers to a material having LODs so
            // make mesh clones for the levels and add them to LOD object
            const materialPromises = this.materialMap.get(materialIndex);
            const materialDef = json.materials[materialIndex];
            for (let k = 0, kl = materialPromises.length; k < kl; k++) {
              // material promises order is from low to high
              const materialLevel = kl - k - 1;
              materialPending.push(materialPromises[k].then(material => {
                const lodMesh = mesh.clone();
                lodMesh.material = material;
                parser.assignFinalMaterial(lodMesh);
                lod.addLevel(lodMesh, this._calculateDistance(materialLevel, materialDef));
                if (this.options.onUpdate) {
                  this.options.onUpdate(lod, lodMesh, materialLevel);
                }
              }));
            }
          } else {
            // This mesh doesn't refer to a material having LODs so just add it
            lod.addLevel(mesh, this._calculateDistance(i, rootNodeDef));
            if (this.options.onUpdate) {
              this.options.onUpdate(lod, mesh, i);
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
}
