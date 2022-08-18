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
  _calculateDistance(level, def) {
    const coverages = loadScreenCoverages(def);

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

    if (this.options.loadingMode === LOADING_MODES.Progressive) {
      const firstLoadLevel = meshIndices.length - 1;
      return parser.loadMesh(meshIndices[firstLoadLevel]).then(mesh => {
        lod.addLevel(mesh, this._calculateDistance(firstLoadLevel, materialDef));

        for (let level = meshIndices.length - 2; level >= 0; level--) {
          const clonedMesh = mesh.clone();
          const currentOnBeforeRender = clonedMesh.onBeforeRender;
          clonedMesh.onBeforeRender = () => {
            parser.loadMesh(meshIndices[level]).then(mesh => {
              removeLevel(lod, clonedMesh);
              lod.addLevel(mesh, this._calculateDistance(level, materialDef));
              if (this.options.onUpdate) {
                this.options.onUpdate(lod, mesh, level);
              }
            });
            clonedMesh.onBeforeRender = currentOnBeforeRender;
          };
          lod.addLevel(clonedMesh, this._calculateDistance(level, materialDef));
        }

        if (this.options.onUpdate) {
          this.options.onUpdate(lod, mesh, firstLoadLevel);
        }

        return lod;
      });
    } else {
      const pending = [];

      for (let level = meshIndices.length - 1; level >= 0; level--) {
        pending.push(parser.loadMesh(meshIndices[level]).then(mesh => {
          lod.addLevel(mesh, this._calculateDistance(level, materialDef));
          if (this.options.onUpdate) {
            this.options.onUpdate(lod, mesh, level);
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

    for (let level = 0; level < nodeIndices.length; level++) {
      const nodeDef = json.nodes[nodeIndices[level]];
      if (nodeDef.mesh === undefined) {
        lod.addLevel(new Object3D(), this._calculateDistance(level, nodeDef));
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
        lod.addLevel(mesh, this._calculateDistance(firstLoadLevel, nodeDef));

        for (let level = 0; level < nodeIndices.length; level++) {
          if (json.nodes[nodeIndices[level]].mesh === undefined) {
            continue;
          }

          const clonedMesh = mesh.clone();
          const currentOnBeforeRender = clonedMesh.onBeforeRender;
          clonedMesh.onBeforeRender = () => {
            parser.createNodeMesh(nodeIndices[level]).then(mesh => {
              removeLevel(lod, clonedMesh);
              lod.addLevel(mesh, this._calculateDistance(level, nodeDef));
              if (this.options.onUpdate) {
                this.options.onUpdate(lod, mesh, level);
              }
            });
            clonedMesh.onBeforeRender = currentOnBeforeRender;
          };
          lod.addLevel(clonedMesh, this._calculateDistance(level, nodeDef));
        }

        if (this.options.onUpdate) {
          this.options.onUpdate(lod, mesh, firstLoadLevel);
        }

        return lod;
      });
    } else {
      const pending = [];

      for (let level = nodeIndices.length - 1; level >= 0; level--) {
        if (json.nodes[nodeIndices[level]].mesh === undefined) {
          continue;
        }

        pending.push(parser.createNodeMesh(nodeIndices[level]).then(mesh => {
          lod.addLevel(mesh, this._calculateDistance(level, nodeDef));
          if (this.options.onUpdate) {
            this.options.onUpdate(lod, mesh, level);
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
