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
    pending.push(this.parser.createNodeMesh(nodeIndex));
    for (const key in attributesDef) {
      pending.push(this.parser.getDependency('accessor', attributesDef[key]).then(accessor => {
        return {key: key, attribute: accessor};
      }));
    }

    return Promise.all(pending).then(results => {
      const mesh = results[0];

      // @TODO: Fix me. Support Group (= glTF multiple mesh.primitives).
      if (!mesh.isMesh) {
        return mesh;
      }

      const accessors = results.slice(1);
      const count = accessors[0].attribute.count; // All attribute counts should be same
      // For Working
      const m = mesh.matrix.clone();
      const p = mesh.quaternion.clone();
      const q = mesh.quaternion.clone();
      const s = mesh.quaternion.clone();
      const instancedMesh = new this.THREE.InstancedMesh(mesh.geometry, mesh.material, count);
      for (let i = 0; i < count; i++) {
        p.set(0, 0, 0);
        q.set(0, 0, 0, 1);
        s.set(1, 1, 1);
        for (const accessor of accessors) {
          const attribute = accessor.attribute;
          switch(accessor.key) {
            case 'TRANSLATION':
              p.fromBufferAttribute(attribute, i);
              break;
            case 'ROTATION':
              q.fromBufferAttribute(attribute, i);
              break;
            case 'SCALE':
              s.fromBufferAttribute(attribute, i);
              break;
            // @TODO: Support _ID and others
          }
        }
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
