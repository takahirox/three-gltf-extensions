/**
 * GPU Instancing Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/EXT_mesh_gpu_instancing
 *
 */
export default class GLTFInstancingExtension {
  constructor(parser, THREE) {
    this.name = 'EXT_mesh_gpu_instancing';
    this.parser = parser;
    this.THREE = THREE;
  }

  createNodeMesh(nodeIndex) {
    const json = this.parser.json;
    const nodeDef = json.nodes[nodeIndex];

    if (!nodeDef.extensions || !nodeDef.extensions[this.name] ||
      nodeDef.mesh === undefined) {
      return null;
    }

    const extensionDef = nodeDef.extensions[this.name];
    const attributesDef = extensionDef.attributes;

    // @TODO: Should we directly create InstancedMesh, not from regular Mesh?
    // @TODO: Can we support InstancedMesh + SkinnedMesh?
    const pending = [];
    const attributes = {};
    pending.push(this.parser.createNodeMesh(nodeIndex));
    for (const key in attributesDef) {
      pending.push(this.parser.getDependency('accessor', attributesDef[key]).then(accessor => {
        attributes[key] = accessor;
        return attributes[key];
      }));
    }

    return Promise.all(pending).then(results => {
      const mesh = results[0];

      // @TODO: Fix me. Support Group (= glTF multiple mesh.primitives).
      if (!mesh.isMesh) {
        return mesh;
      }

      const count = results[1].count; // All attribute counts should be same

      // For Working
      const m = mesh.matrix.clone();
      const p = mesh.position.clone().set(0, 0, 0);
      const q = mesh.quaternion.clone().set(0, 0, 0, 1);
      const s = mesh.scale.clone().set(1, 1, 1);

      const instancedMesh = new this.THREE.InstancedMesh(mesh.geometry, mesh.material, count);
      for (let i = 0; i < count; i++) {
        if (attributes.TRANSLATION) {
          p.fromBufferAttribute(attributes.TRANSLATION, i);
        }
        if (attributes.ROTATION) {
          q.fromBufferAttribute(attributes.ROTATION, i);
        }
        if (attributes.SCALE) {
          s.fromBufferAttribute(attributes.SCALE, i);
        }
        // @TODO: Support _ID and others
        instancedMesh.setMatrixAt(i, m.compose(p, q, s));
      }

      // Just in case
      this.THREE.Object3D.prototype.copy.call(instancedMesh, mesh);

      instancedMesh.frustumCulled = false;
      this.parser.assignFinalMaterial(instancedMesh);
      return instancedMesh;
    });
  }
}
