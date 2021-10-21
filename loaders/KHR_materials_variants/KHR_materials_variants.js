/**
 * Materials variants extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_variants
 */

/**
 * KHR_materials_variants specification allows duplicated variant names
 * but it makes handling the extension complex.
 * We ensure tha names and make it easier.
 * If you want to export the extension with the original names
 * you are recommended to write GLTFExporter plugin to restore the names.
 *
 * @param variantNames {Array<string>}
 * @return {Array<string>}
 */
const ensureUniqueNames = (variantNames) => {
  const uniqueNames = [];
  const knownNames = new Set();

  for (const name of variantNames) {
    let uniqueName = name;
    let suffix = 0;
    // @TODO: An easy solution.
    //        O(N^2) in the worst scenario where N is variantNames.length.
    //        Fix me if needed.
    while (knownNames.has(uniqueName)) {
      uniqueName = name + '.' + (++suffix);
    }
    knownNames.add(uniqueName);
    uniqueNames.push(uniqueName);
  }

  return uniqueNames;
};

/**
 * Convert mappings array to table object to make handling the extension easier.
 *
 * @param extensionDef {glTF.meshes[n].primitive.extensions.KHR_materials_variants}
 * @param variantNames {Array<string>} Required to be unique names
 * @return {Object}
 */
const mappingsArrayToTable = (extensionDef, variantNames) => {
  const table = {};
  for (const mapping of extensionDef.mappings) {
    for (const variant of mapping.variants) {
      table[variantNames[variant]] = {
        material: null,
        gltfMaterialIndex: mapping.material
      };
    }
  }
  return table;
};

/**
 * @param object {THREE.Object3D}
 * @return {boolean}
 */
const compatibleObject = object => {
  return object.material !== undefined && // easier than (!object.isMesh && !object.isLine && !object.isPoints)
    object.userData && // just in case
    object.userData.variantMaterials;
};

/**
 * @param obj1 {THREE.Object3D}
 * @param obj2 {THREE.Object3D}
 * @param callback {function}
 */
const traversePair = (obj1, obj2, callback) => {
  callback(obj1, obj2);
  // Assume obj1 and obj2 have the same tree structure
  for (let i = 0; i < obj1.children.length; i++) {
    traversePair(obj1.children[i], obj2.children[i], callback);
  }
};

// Variant materials and original material instances are stored under
// object.userData.variantMaterials/originalMaterial.
// Three.js Object3D.cppy/clone() doesn't copy/clone Three.js objects under
// .userData so this function is a workaround.
/**
 * @param dst {THREE.Object3D}
 * @param src {THREE.Object3D}
 * @param callback {function}
 */
const copyVariantMaterials = (dst, src) => {
  if (src.userData.variantMaterials !== undefined) {
    dst.userData.variantMaterials = Object.assign({}, src.userData.variantMaterials);
  }
  if (src.userData.originalMaterial !== undefined) {
    dst.userData.originalMaterial = src.userData.originalMaterial;
  }
};

export default class GLTFMaterialsVariantsExtension {
  constructor(parser) {
    this.parser = parser;
    this.name = 'KHR_materials_variants';
  }

  // Note that the following properties will be overridden even if they are pre-defined
  // - gltf.userData.variants
  // - mesh.userData.variantMaterials
  afterRoot(gltf) {
    const parser = this.parser;
    const json = parser.json;

    if (!json.extensions || !json.extensions[this.name]) {
      return null;
    }

    const extensionDef = json.extensions[this.name];
    const variantsDef = extensionDef.variants || [];
    const variants = ensureUniqueNames(variantsDef.map(v => v.name));

    for (const scene of gltf.scenes) {
      // Save the variants data under associated mesh.userData
      scene.traverse(object => {
        const association = parser.associations.get(object);

        if (!association || association.meshes === undefined || association.primitives === undefined) {
          return;
        }

        const meshDef = json.meshes[association.meshes];
        const primitiveDef = meshDef.primitives[association.primitives];
        const extensionsDef = primitiveDef.extensions;

        if (!extensionsDef || !extensionsDef[this.name]) {
          return;
        }

        // object should be Mesh
        object.userData.variantMaterials = mappingsArrayToTable(extensionsDef[this.name], variants);
      });
    }

    gltf.userData.variants = variants;

    // @TODO: Adding new unofficial property .functions.
    //        It can be problematic especially with TypeScript?
    gltf.functions = gltf.functions || {};

    /**
     * @param object {THREE.Mesh}
     * @param variantName {string|null}
     * @return {Promise}
     */
    const switchMaterial = async (object, variantName, onUpdate) => {
      if (!object.userData.originalMaterial) {
        object.userData.originalMaterial = object.material;
      }

      const oldMaterial = object.material;
      let gltfMaterialIndex = null;

      if (variantName === null || !object.userData.variantMaterials[variantName]) {
        object.material = object.userData.originalMaterial;
        if (parser.associations.has(object.material)) {
          gltfMaterialIndex = parser.associations.get(object.material).index;
        }
      } else {
        const variantMaterialParam = object.userData.variantMaterials[variantName];

        if (variantMaterialParam.material) {
          object.material = variantMaterialParam.material;
          if (variantMaterialParam.gltfMaterialIndex !== undefined) {
            gltfMaterialIndex = variantMaterialParam.gltfMaterialIndex;
          }
        } else {
          // Assume the variant material is defined in glTF
          gltfMaterialIndex = variantMaterialParam.gltfMaterialIndex;
          object.material = await parser.getDependency('material', gltfMaterialIndex);
          parser.assignFinalMaterial(object);
          variantMaterialParam.material = object.material;
        }
      }

      if (onUpdate !== null) {
        onUpdate(object, oldMaterial, gltfMaterialIndex);
      }
    };

    /**
     * @param object {THREE.Mesh}
     * @return {Promise}
     */
    const ensureLoadVariants = object => {
      const currentMaterial = object.material;
      const variantMaterials = object.userData.variantMaterials;
      const pending = [];
      for (const variantName in variantMaterials) {
        const variantMaterial = variantMaterials[variantName];
        if (variantMaterial.material) {
          continue;
        }
        const materialIndex = variantMaterial.gltfMaterialIndex;
        pending.push(parser.getDependency('material', materialIndex).then(material => {
          object.material = material;
          parser.assignFinalMaterial(object);
          variantMaterials[variantName].material = object.material;
        }));
      }
      return Promise.all(pending).then(() => {
        object.material = currentMaterial;
      });
    };

    /**
     * @param object {THREE.Object3D}
     * @param variantName {string|null}
     * @param doTraverse {boolean} Default is true
     * @return {Promise}
     */
    gltf.functions.selectVariant = (object, variantName, doTraverse = true, onUpdate = null) => {
      const pending = [];
      if (doTraverse) {
        object.traverse(o => compatibleObject(o) && pending.push(switchMaterial(o, variantName, onUpdate)));
      } else {
        compatibleObject(object) && pending.push(switchMaterial(object, variantName, onUpdate));
      }
      return Promise.all(pending);
    };

    /**
     * @param object {THREE.Object3D}
     * @param doTraverse {boolean} Default is true
     * @return {Promise}
     */
    gltf.functions.ensureLoadVariants = (object, doTraverse = true) => {
      const pending = [];
      if (doTraverse) {
        object.traverse(o => compatibleObject(o) && pending.push(ensureLoadVariants(o)));
      } else {
        compatibleObject(object) && pending.push(ensureLoadVariants(object));
      }
      return Promise.all(pending);
    };

    /**
     * @param dst {THREE.Object3D}
     * @param src {THREE.Object3D}
     * @param doTraverse {boolean} Default is true
     */
    gltf.functions.copyVariantMaterials = (dst, src, doTraverse = true) => {
      if (doTraverse) {
        traversePair(dst, src, (dst, src) => copyVariantMaterials(dst, src));
      } else {
        copyVariantMaterials(dst, src);
      }
    };
  }
}
