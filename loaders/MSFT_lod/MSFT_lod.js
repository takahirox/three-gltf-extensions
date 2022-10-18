import {
  LOD,
  Object3D
} from 'three';

const LOADING_MODES = {
  All: 'all', // Default
  Any: 'any',
  Progressive: 'progressive'
};

const removeLevel = (lod, obj) => {
  const levels = lod.levels;
  let readIndex = 0;
  let writeIndex = 0;
  for (readIndex = 0; readIndex < levels.length; readIndex++) {
    if (levels[readIndex].object !== obj) {
      levels[writeIndex++] = levels[readIndex];
    }
  }
  if (writeIndex < readIndex) {
    levels.length = writeIndex;
    lod.remove(obj);
  }
};

const loadScreenCoverages = (def) => {
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
};

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
  }

  _hasLODMaterial(meshIndex) {
    const parser = this.parser;
    const json = parser.json;
    const meshDef = json.meshes[meshIndex];

    // Ignore LOD + multiple primitives so far because
    // it might be a bit too complicated.
    // @TODO: Fix me
    if (meshDef.primitives.length > 1) {
      return null;
    }

    for (const primitiveDef of meshDef.primitives) {
      if (primitiveDef.material === undefined) {
        continue;
      }
      const materialDef = json.materials[primitiveDef.material];
      if (materialDef.extensions && materialDef.extensions[this.name]) {
        return true;
      }
    }
    return false;
  }

  _hasLODMaterialInNode(nodeIndex) {
    const parser = this.parser;
    const json = parser.json;
    const nodeDef = json.nodes[nodeIndex];

    const nodeIndices = (nodeDef.extensions && nodeDef.extensions[this.name])
      ? nodeDef.extensions[this.name].ids.slice() : [];
    nodeIndices.unshift(nodeIndex);

    for (const nodeIndex of nodeIndices) {
      if (json.nodes[nodeIndex].mesh !== undefined &&
        this._hasLODMaterial(json.nodes[nodeIndex].mesh)) { 
        return true;
      }
    }

    return false;
  }

  // level: 0 is the highest level
  _calculateDistance(level, lowestLevel, def) {
    const coverages = loadScreenCoverages(def);

    // Use the distance set by users if calculateDistance callback is set
    if (this.options.calculateDistance) {
      return this.options.calculateDistance(level, lowestLevel, coverages);
    }

    if (level === 0) return 0;

    const levelsLength = def.extensions[this.name].ids.length + 1;

    // 1.0 / Math.pow(2, level * 2) is just a number that seems to be heuristically good so far.
    const c = levelsLength === coverages.length ? coverages[level - 1] : 1.0 / Math.pow(2, level * 2);

    // This is just an easy approximation. If users want more accurate value, they are expected
    // to use calculateDistance hook.
    return 1.0 / c;
  }

  _assignOnBeforeRender(meshPending, clonedMesh, level, lowestLevel, def) {
    const _this = this;
    const currentOnBeforeRender = clonedMesh.onBeforeRender;
    clonedMesh.onBeforeRender = function () {
      const clonedMesh = this;
      const lod = clonedMesh.parent;
      meshPending.then(mesh => {
        if (_this.options.onLoadMesh) {
          mesh = _this.options.onLoadMesh(lod, mesh, level, lowestLevel);
        }
        removeLevel(lod, clonedMesh);
        lod.addLevel(mesh, _this._calculateDistance(level, lowestLevel, def));
        if (_this.options.onUpdate) {
          _this.options.onUpdate(lod, mesh, level, lowestLevel);
        }
      });
      clonedMesh.onBeforeRender = currentOnBeforeRender;
    };
  }

  // For LOD in materials
  loadMesh(meshIndex) {
    if (!this._hasLODMaterial(meshIndex)) {
      return null;
    }

    const parser = this.parser;
    const json = parser.json;
    const meshDef = json.meshes[meshIndex];

    const primitiveDef = meshDef.primitives[0];
    const materialIndex = primitiveDef.material;
    const materialDef = json.materials[materialIndex];
    const extensionDef = materialDef.extensions[this.name];

    const meshIndices = [meshIndex];
    // Very hacky solution.
    // Clone the mesh def, replace the material index with a lower level one,
    // add to json.meshes.
    // @TODO: Fix me. Polluting json is a bad idea.
    for (const materialIndex of extensionDef.ids) {
      const clonedMeshDef = Object.assign({}, meshDef);
      clonedMeshDef.primitives = [Object.assign({}, clonedMeshDef.primitives[0])];
      clonedMeshDef.primitives[0].material = materialIndex;
      meshIndices.push(json.meshes.push(clonedMeshDef) - 1);
    }

    const lod = new LOD();
    const lowestLevel = meshIndices.length - 1;

    if (this.options.loadingMode === LOADING_MODES.Progressive) {
      const firstLoadLevel = meshIndices.length - 1;
      return parser.loadMesh(meshIndices[firstLoadLevel]).then(mesh => {
        if (this.options.onLoadMesh) {
          mesh = this.options.onLoadMesh(lod, mesh, firstLoadLevel, lowestLevel);
        }

        for (let level = 0; level < meshIndices.length - 1; level++) {
          const clonedMesh = mesh.clone();
          this._assignOnBeforeRender(parser.loadMesh(meshIndices[level]),
            clonedMesh, level, lowestLevel, materialDef);
          lod.addLevel(clonedMesh, this._calculateDistance(level, lowestLevel, materialDef));
        }
        lod.addLevel(mesh, this._calculateDistance(firstLoadLevel, lowestLevel, materialDef));

        if (this.options.onUpdate) {
          this.options.onUpdate(lod, mesh, firstLoadLevel, lowestLevel);
        }

        return lod;
      });
    } else {
      const pending = [];

      for (let level = 0; level < meshIndices.length; level++) {
        pending.push(parser.loadMesh(meshIndices[level]).then(mesh => {
          if (this.options.onLoadMesh) {
            mesh = this.options.onLoadMesh(lod, mesh, level, lowestLevel);
          }
          lod.addLevel(mesh, this._calculateDistance(level, lowestLevel, materialDef));
          if (this.options.onUpdate) {
            this.options.onUpdate(lod, mesh, level, lowestLevel);
          }
        }));
      }

      return (this.options.loadingMode === LOADING_MODES.Any
        ? Promise.any(pending)
        : Promise.all(pending)
      ).then(() => lod);
    }
  }

  // For LOD in nodes
  createNodeMesh(nodeIndex) {
    const parser = this.parser;
    const json = parser.json;
    const nodeDef = json.nodes[nodeIndex];

    if (!nodeDef.extensions || !nodeDef.extensions[this.name]) {
      return null;
    }

    // If LODs are defined in both nodes and materials,
    // ignore the ones in the nodes and use the ones in the materials.
    // @TODO: Process correctly
    // Refer to https://github.com/KhronosGroup/glTF/issues/1952
    if (this._hasLODMaterialInNode(nodeIndex)) {
      return null;
    }

    const extensionDef = nodeDef.extensions[this.name];

    // Node indices from high to low levels
    const nodeIndices = extensionDef.ids.slice();
    nodeIndices.unshift(nodeIndex);

    const lod = new LOD();
    const lowestLevel = nodeIndices.length - 1;

    for (let level = 0; level < nodeIndices.length; level++) {
      const nodeDef = json.nodes[nodeIndices[level]];
      if (nodeDef.mesh === undefined) {
        lod.addLevel(new Object3D(), this._calculateDistance(level, lowestLevel, nodeDef));
      }
    }

    if (this.options.loadingMode === LOADING_MODES.Progressive) {
      let firstLoadLevel = null;
      for (let level = nodeIndices.length - 1; level >= 0; level--) {
        if (json.nodes[nodeIndices[level]].mesh !== undefined) {
          firstLoadLevel = level;
          break;
        }
      }

      if (firstLoadLevel === null) {
        return Promise.resolve(lod);
      }

      return parser.createNodeMesh(nodeIndices[firstLoadLevel]).then(mesh => {
        if (this.options.onLoadMesh) {
          mesh = this.options.onLoadMesh(lod, mesh, firstLoadLevel, lowestLevel);
        }

        for (let level = 0; level < nodeIndices.length - 1; level++) {
          if (json.nodes[nodeIndices[level]].mesh === undefined) {
            continue;
          }
          const clonedMesh = mesh.clone();
          this._assignOnBeforeRender(parser.createNodeMesh(nodeIndices[level]),
            clonedMesh, level, lowestLevel, nodeDef);
          lod.addLevel(clonedMesh, this._calculateDistance(level, lowestLevel, nodeDef));
        }
        lod.addLevel(mesh, this._calculateDistance(firstLoadLevel, lowestLevel, nodeDef));

        if (this.options.onUpdate) {
          this.options.onUpdate(lod, mesh, firstLoadLevel, lowestLevel);
        }

        return lod;
      });
    } else {
      const pending = [];

      for (let level = 0; level < nodeIndices.length; level++) {
        if (json.nodes[nodeIndices[level]].mesh === undefined) {
          continue;
        }

        pending.push(parser.createNodeMesh(nodeIndices[level]).then(mesh => {
          if (this.options.onLoadMesh) {
            mesh = this.options.onLoadMesh(lod, mesh, firstLoadLevel, lowestLevel);
          }
          lod.addLevel(mesh, this._calculateDistance(level, lowestLevel, nodeDef));
          if (this.options.onUpdate) {
            this.options.onUpdate(lod, mesh, level, lowestLevel);
          }
        }));
      }

      if (pending.length === 0) {
        return Promise.resolve(lod);
      }

      return (this.options.loadingMode === LOADING_MODES.Any
        ? Promise.any(pending)
        : Promise.all(pending)
      ).then(() => lod);
    }
  }
}
