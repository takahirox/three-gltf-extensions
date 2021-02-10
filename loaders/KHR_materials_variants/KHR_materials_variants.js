/**
 * Materials variants extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_variants
 */
export default class GLTFMaterialsVariantsExtension {
  constructor(parser) {
    this.parser = parser;
    this.name = 'KHR_materials_variants';
  }

  afterRoot(gltf) {
    const parser = this.parser;
    const json = parser.json;
    const name = this.name;

    if (!json.extensions || !json.extensions[name]) {
      return null;
    }

    const extensionDef = json.extensions[name];
    const variantsDef = extensionDef.variants || [];
    const variants = [];

    for (const variantDef of variantsDef) {
      variants.push(variantDef.name);
    }

    for (const scene of gltf.scenes) {
      scene.userData.variants = variants;

      // Save the extension def under associated mesh.userData.gltfExtensions;
      scene.traverse(object => {
        // The following code can be simplified if parser.associations directly supports meshes.
        const association = parser.associations.get(object);

        if (!association || association.type !== 'nodes') {
          return;
        }

        const nodeDef = json.nodes[association.index];
        const meshIndex = nodeDef.mesh;

        if (meshIndex === undefined) {
          return;
        }

        // Two limitations:
        // 1. The nodeDef shouldn't have any objects (camera, light, or nodeDef.extensions object)
        //    other than nodeDef.mesh
        // 2. Other plugins shouldn't change any scene graph hierarchy
        // The following code can cause error if hitting the either or both limitations
        // If parser.associations will directly supports meshes these limitations can be removed

        const meshDef = json.meshes[meshIndex];
        const primitivesDef = meshDef.primitives;
        const meshes = object.isMesh ? [object] : object.children;

        for (let i = 0; i < primitivesDef.length; i++) {
          const primitiveDef = primitivesDef[i];
          const extensionsDef = primitiveDef.extensions;

          if (!extensionsDef || !extensionsDef[name]) {
            continue;
          }

          const mesh = meshes[i];
          const userData = mesh.userData;
          userData.gltfExtensions = userData.gltfExtensions || {};
          userData.gltfExtensions[name] = extensionsDef[name];
        }
      });
    }

    gltf.userData.variants = variants;
    gltf.functions = gltf.functions || {};

    const switchMaterial = async (object, variantIndex) => {
      if (!object.isMesh || !object.userData.gltfExtensions ||
        !object.userData.gltfExtensions[name]) {
        return;
      }

      if (!object.userData.originalMaterial) {
        object.userData.originalMaterial = object.material;
      }

      object.userData.variantMaterials = object.userData.variantMaterials || {};

      if (object.userData.variantMaterials[variantIndex]) {
        object.material = object.userData.variantMaterials[variantIndex];
        return;
      }

      const meshVariantDef = object.userData.gltfExtensions[name];
      const mapping = meshVariantDef.mappings.find(mapping => mapping.variants.includes(variantIndex));

      if (mapping) {
        const materialIndex = mapping.material;
        object.material = await parser.getDependency('material', mapping.material);
        parser.assignFinalMaterial(object);
        object.userData.variantMaterials[variantIndex] = object.material;
      } else {
        object.material = object.userData.originalMaterial;
      }
    };

    gltf.functions.selectVariantByIndex = async (scene, variantIndex) => {
      if (variantIndex >= variants.length || variantIndex < 0) {
        return Promise.reject('Wrong variant index');
      }

      const pending = [];
      scene.traverse(object => {
        pending.push(switchMaterial(object, variantIndex));
      });

      return Promise.all(pending);
    };

    gltf.functions.selectVariantByName = async (scene, variantName) => {
      return gltf.functions.selectVariantByIndex(scene, variants.indexOf(variantName));
    };

    gltf.functions.ensureLoadVariants = async scene => {
      const currentMaterialMap = new Map();

      scene.traverse(object => {
        if (!object.isMesh || !object.userData.gltfExtensions ||
	      !object.userData.gltfExtensions[name]) {
          return;
        }
        currentMaterialMap.set(object, object.material);
      });

      const pending = [];
      for (let i = 0; i < variants.length; i++) {
        pending.push(gltf.functions.selectVariantByIndex(scene, i));
      }
      await Promise.all(pending);

      scene.traverse(object => {
        if (!object.isMesh || !object.userData.gltfExtensions ||
	      !object.userData.gltfExtensions[name]) {
          return;
        }
        object.material = currentMaterialMap.get(object);
      });
    };
  }
}
