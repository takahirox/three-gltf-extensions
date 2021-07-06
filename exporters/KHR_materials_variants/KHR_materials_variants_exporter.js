/**
 * Materials variants extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_variants
 */

/**
 * @param object {THREE.Object3D}
 * @return {boolean}
 */
const compatibleObject = object => {
  // @TODO: Need properer variantMaterials format validation?
  return object.material !== undefined && // easier than (!object.isMesh && !object.isLine && !object.isPoints)
    object.userData && // just in case
    object.userData.variantMaterials &&
    // Is this line costly?
    !!Object.values(object.userData.variantMaterials).filter(m => compatibleMaterial(m.material));
};

/**
 * @param material {THREE.Material}
 * @return {boolean}
 */
const compatibleMaterial = material => {
  // @TODO: support multi materials?
  return material && material.isMaterial && !Array.isArray(material);
};

export default class GLTFExporterMaterialsVariantsExtension {
  constructor(writer) {
    this.writer = writer;
    this.name = 'KHR_materials_variants';
    this.variantNames = [];
  }

  beforeParse(objects) {
    // Find all variant names and store them to the table
    const variantNameTable = new Set();
    for (const object of objects) {
      object.traverse(o => {
        if (!compatibleObject(o)) {
          return;
        }
        const variantMaterials = o.userData.variantMaterials;
        for (const variantName in variantMaterials) {
          const variantMaterial = variantMaterials[variantName];
          // Ignore unloaded variant materials
          if (compatibleMaterial(variantMaterial.material)) {
            variantNameTable.add(variantName);
          }
        }
      });
    }
    // We may want to sort?
    variantNameTable.forEach(name => this.variantNames.push(name));
  }

  writeMesh(mesh, meshDef) {
    if (!compatibleObject(mesh)) {
      return;
    }

    const userData = mesh.userData;
    const variantMaterials = userData.variantMaterials;
    const mappingTable = {};
    for (const variantName in variantMaterials) {
      const variantMaterialInstance = variantMaterials[variantName].material;
      if (!compatibleMaterial(variantMaterialInstance)) {
        continue;
      }
      const variantIndex = this.variantNames.indexOf(variantName); // Shouldn't be -1
      const materialIndex = this.writer.processMaterial(variantMaterialInstance);
      if (!mappingTable[materialIndex]) {
        mappingTable[materialIndex] = {
          material: materialIndex,
          variants: []
        };
      }
      mappingTable[materialIndex].variants.push(variantIndex);
    }

    const mappingsDef = Object.values(mappingTable)
      .map(m => {return m.variants.sort((a, b) => a - b) && m})
      .sort((a, b) => a.material - b.material);

    if (mappingsDef.length === 0) {
      return;
    }

    const originalMaterialIndex = compatibleMaterial(userData.originalMaterial)
      ? this.writer.processMaterial(userData.originalMaterial) : -1;

    for (const primitiveDef of meshDef.primitives) {
      // Override primitiveDef.material with original material.
      if (originalMaterialIndex >= 0) {
        primitiveDef.material = originalMaterialIndex;
      }
      primitiveDef.extensions = primitiveDef.extensions || {};
      primitiveDef.extensions[this.name] = {mappings: mappingsDef};
    }
  }

  afterParse(input) {
    if (this.variantNames.length === 0) {
      return;
    }

    const root = this.writer.json;
    root.extensions = root.extensions || {};

    const variantsDef = this.variantNames.map(n => {return {name: n};});
    root.extensions[this.name] = {variants: variantsDef};
    this.writer.extensionsUsed[this.name] = true;
  }
}
