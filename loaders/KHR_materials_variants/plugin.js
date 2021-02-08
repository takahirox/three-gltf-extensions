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
    gltf.functions.selectVariant = (scene, variantName) => {
      const pending = [];
      const variantIndex = variants.indexOf(variantName);

      if (variantIndex === -1) {
        // @TODO: return Promise.reject()?
        return Promise.resolve();
      }

      scene.traverse(object => {
        if (!object.isMesh || !object.userData.gltfExtensions ||
         !object.userData.gltfExtensions[name]) {
          return;
	    }

        const meshVariantDef = object.userData.gltfExtensions[name];
		const mapping = meshVariantDef.mappings.find(mapping => mapping.variants.includes(variantIndex));

        if (mapping) {
          if (!object.userData.originalMaterial) {
            object.userData.originalMaterial = object.material;
          }
          pending.push(parser.getDependency('material', mapping.material).then(material => {
            object.material = material;
            parser.assignFinalMaterial(object);
          }));
        } else if (object.userData.originalMaterial) {
          object.material = object.userData.originalMaterial;
        }
      });
      return Promise.all(pending);
    }
  }
}
