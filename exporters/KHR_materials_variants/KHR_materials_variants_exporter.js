/**
 * Materials variants extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_variants
 */
export default class GLTFExporterMaterialsVariantsExtension {
  constructor(writer) {
    this.writer = writer;
    this.name = 'KHR_materials_variants';
  }

  writeMesh(mesh, meshDef) {
    const userData = mesh.userData;
    if (!userData.gltfExtensions || !userData.gltfExtensions[this.name]) {
      return;
    }

    // @TODO: Need userData.gltfExtensions[name] validation?

    for (const primitiveDef of meshDef.primitives) {
      if (userData.originalMaterial) {
        primitiveDef.material = this.writer.processMaterial(userData.originalMaterial);
      }

      const mappingsDef = [];
      for (const mapping of userData.gltfExtensions[this.name].mappings) {
        const material = userData.variantMaterials[mapping.variants[0]];
        mappingsDef.push({
          material: this.writer.processMaterial(material),
          variants: mapping.variants.slice()
        });
      }
      primitiveDef.extensions = primitiveDef.extensions || {};
      primitiveDef.extensions[this.name] = {mappings: mappingsDef};
    }
  }

  afterParse(input) {
    const root = this.writer.json;
    root.extensions = root.extensions || {};

    // Find variants
    // @TODO: Write comment
    let variants = null;
    for (const scene of input) {
      scene.traverse(object => {
        if (variants) {
          return;
        }
        if (object.userData && object.userData.variants) {
          variants = object.userData.variants;
        }
      });
    }
    if (!variants) {
      return;
    }

    // @TODO: Need variants validation?

    const variantsDef = [];
    for (const variantName of variants) {
      variantsDef.push({name: variantName});
    }

    root.extensions[this.name] = {variants: variantsDef};
    this.writer.extensionsUsed[this.name] = true;
  }
}
