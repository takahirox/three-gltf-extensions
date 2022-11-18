import {
  LOD,
  Object3D
} from 'three';

const EXTENSION_NAME = 'MSFT_lod';
const SCREENCOVERAGE_NAME = 'MSFT_screencoverage';

const LOADING_MODES = {
  All: 'all', // Default
  Any: 'any',
  Progressive: 'progressive'
};

// LOD.clone() and copy() copies its children
// in the order of first objects not in the levels
// and then LOD objects in the levels order.
// This function ensures the children order follows
// that because it should be less problematic in case
// where lod object is cloned or copied and compared
// between source and cloned graph.
const _map = new Map();
const sortChildrenOrder = (lod) => {
  for (let i = 0; i < lod.levels.length; i++) {
    _map.set(lod.levels[i].object);
  }
  let writeIndex = 0;
  for (let readIndex = 0; readIndex < lod.children.length; readIndex++) {
    if (!_map.has(lod.children[readIndex])) {
      lod.children[writeIndex++] = lod.children[readIndex];
    }
  }
  _map.clear();
  lod.children.length = writeIndex;
  for (let i = 0; i < lod.levels.length; i++) {
    lod.children.push(lod.levels[i].object);
  }
};

const loadScreenCoverages = (def) => {
  const extras = def.extras;
  const extensionsDef = def.extensions;

  if (!extras || !extras[SCREENCOVERAGE_NAME] ||
    !extensionsDef || !extensionsDef[EXTENSION_NAME]) {
    return [];
  }

  const screenCoverages = extras[SCREENCOVERAGE_NAME];
  const levelsLength = extensionsDef[EXTENSION_NAME].ids.length + 1;

  // extra field is free structure so validate more carefully
  if (!screenCoverages || !Array.isArray(screenCoverages) ||
    screenCoverages.length !== levelsLength) {
    return [];
  }

  return screenCoverages;
};

// level: 0 is the highest level
const calculateDistance = (level, lowestLevel, def, options) => {
  const coverages = loadScreenCoverages(def);

  // Use the distance set by users if calculateDistance callback is set
  if (options.calculateDistance) {
    return options.calculateDistance(level, lowestLevel, coverages);
  }

  if (level === 0) return 0;

  const levelsLength = def.extensions[EXTENSION_NAME].ids.length + 1;

  // 1.0 / Math.pow(2, level * 2) is just a number that seems to be heuristically good so far.
  const c = levelsLength === coverages.length ? coverages[level - 1] : 1.0 / Math.pow(2, level * 2);

  // This is just an easy approximation because it is not so easy to calculate the screen coverage
  // (in Three.js) since it requires camera info, geometry info (boundary box/sphere), world scale.
  // And also it needs to observe the change of them.
  // If users want more accurate value, they are expected to use calculateDistance hook.
  return 1.0 / c;
};

const getLODNodeDependency = (level, nodeIndices, parser) => {
  const nodeIndex = nodeIndices[level];

  if (level > 0) {
    return parser.getDependency('node', nodeIndex);
  }

  // For the highest LOD GLTFLodExtension.loadNode() needs to be avoided
  // to be called again
  const extensions = Object.values(parser.plugins);
  extensions.push(parser);
  for (let i = 0; i < extensions.length; i++) {
    const ext = extensions[i];
    if (ext.constructor === GLTFLodExtension) {
      continue;
    }
    const result = ext.loadNode && ext.loadNode(nodeIndex);
    if (result) {
      return result;
    }
  }
  throw new Error('Unreachable');
};

const LOADING_STATES = {
  NotStarted: 0,
  Loading: 1,
  Complete: 2
};

class GLTFProgressiveLOD extends LOD {
  constructor(nodeIndices, parser, options) {
    super();
    this._parser = parser;
    this._options = options;
    this._nodeIndices = nodeIndices;
    this._lowestLevel = nodeIndices.length - 1;
    this._states = [];
    this._objectLevels = []; // Current object level set to this level
    for (let i = 0; i < nodeIndices.length; i++) {
      this._states[i] = LOADING_STATES.NotStarted;
      this._objectLevels[i] = nodeIndices.length;
    }
  }

  initialize() {
    // Load only the lowest level as initialization.
    // Progressively load the higher levels on demand.
    // Assuming the lowest level LOD node has meshes for now.
    // @TODO: Load the lowest visible node as initialization.
    return this._loadLevel(this._lowestLevel).then(node => {
      const nodeDef = this._parser.json.nodes[this._nodeIndices[0]];
      for (let level = 0; level < this._nodeIndices.length - 1; level++) {
        this.addLevel(node.clone(), calculateDistance(level, this._lowestLevel, nodeDef, this._options));
        this._objectLevels[level] = this._lowestLevel;
      }
      this.addLevel(node, calculateDistance(this._lowestLevel, this._lowestLevel, nodeDef, this._options));
      this._objectLevels[this._lowestLevel] = this._lowestLevel;
      if (this._options.onUpdate) {
        this._options.onUpdate(this, node, this._lowestLevel, this._lowestLevel);
      }
      return this;
    });
  }

  _loadLevel(level) {
    this._states[level] = LOADING_STATES.Loading;
    return getLODNodeDependency(level, this._nodeIndices, this._parser).then(node => {
      this._states[level] = LOADING_STATES.Complete;
      if (this._options.onLoadNode) {
        node = this._options.onLoadNode(this, node, level, this._lowestLevel);
      }
      return node;
    });
  }

  _replaceLevelObject(object, levelNum) {
    const level = this.levels[levelNum];
    const oldObject = level.object;
    level.object = object;
    this.remove(oldObject);
    this.add(object);
    sortChildrenOrder(this);
  }

  update(camera) {
    super.update(camera);
    if (this._states[this._currentLevel] === LOADING_STATES.NotStarted) {
      const level = this._currentLevel;
      this._loadLevel(level).then(node => {
        this._replaceLevelObject(node, level);
        this._objectLevels[level] = level;

        // Replace the higher level objects with this level object
        // if they are not loaded yet or if they are set lower level object
        // than this level.
        for (let i = 0; i < level; i++) {
          if (this._states[i] !== LOADING_STATES.Complete &&
            this._objectLevels[i] > level) {
            this._replaceLevelObject(node.clone(), i);
            this._objectLevels[i] = level;
          }
        }

        if (this._options.onUpdate) {
          this._options.onUpdate(this, node, level, this._lowestLevel);
        }
      });
    }
  }

  clone(recursive) {
    return new this.constructor(this._nodeIndices, this._parser, this._options).copy(this, recursive);
  }

  copy(source, recursive = true) {
    super.copy(source, recursive);
    this._parser = source._parser;
    this._options = source._options;
    this._lowestLevel = source._lowestLevel;
    for (let i = 0; i < source._nodeIndices.length; i++) {
      this._nodeIndices[i] = source._nodeIndices[i];
      this._states[i] = source._states[i] === LOADING_STATES.Complete
        ? LOADING_STATES.Complete : LOADING_STATES.NotStarted;
      this._objectLevels[i] = source._objectLevels[i];
    }
    this._nodeIndices.length = source._nodeIndices.length;
    this._states.length = source._states.length;
    this._objectLevels.length = source._objectLevels.length;
    return this;
  }
}

/**
 * LOD Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/MSFT_lod
 */
// Note: This plugin doesn't support Material LOD for simplicity
export default class GLTFLodExtension {
  constructor(parser, options={}) {
    this.name = EXTENSION_NAME;
    this.parser = parser;
    this.options = options;
  }

  loadNode(nodeIndex) {
    const parser = this.parser;
    const json = parser.json;
    const nodeDef = json.nodes[nodeIndex];

    if (!nodeDef.extensions || !nodeDef.extensions[this.name]) {
      return null;
    }

    const extensionDef = nodeDef.extensions[this.name];

    // Node indices from high to low levels
    const nodeIndices = extensionDef.ids.slice();
    nodeIndices.unshift(nodeIndex);

    const lowestLevel = nodeIndices.length - 1;

    if (this.options.loadingMode === LOADING_MODES.Progressive) {
      return new GLTFProgressiveLOD(nodeIndices, this.parser, this.options).initialize();
    } else {
      const lod = new LOD();
      const pending = [];

      for (let level = 0; level < nodeIndices.length; level++) {
        pending.push(getLODNodeDependency(level, nodeIndices, parser).then(node => {
          if (this.options.onLoadNode) {
            node = this.options.onLoadNode(lod, node, level, lowestLevel);
          }
          lod.addLevel(node, calculateDistance(level, lowestLevel, nodeDef, this.options));
          sortChildrenOrder(lod);
          if (this.options.onUpdate) {
            this.options.onUpdate(lod, node, level, lowestLevel);
          }
        }));
      }

      return (this.options.loadingMode === LOADING_MODES.Any
        ? Promise.any(pending)
        : Promise.all(pending)
      ).then(() => lod);
    }
  }
}
