import {InstancedMesh, Object3D} from 'three';

/**
 * GPU Instancing Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/EXT_mesh_gpu_instancing
 *
 */
export default class GLTFMeshGpuInstancingExtension {
  constructor(parser) {
    this.name = 'EXT_mesh_gpu_instancing';
    this.parser = parser;
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
    for (const key in attributesDef) {
      pending.push(this.parser.getDependency('accessor', attributesDef[key]).then(accessor => {
        attributes[key] = accessor;
        return attributes[key];
      }));
    }

    if (pending.length < 1) {
      return null;
    }

    pending.push(this.parser.createNodeMesh(nodeIndex));

    return Promise.all(pending).then(results => {
      const nodeObject = results.pop();
      const meshes = nodeObject.isGroup ? nodeObject.children : [nodeObject];
      const count = results[0].count; // All attribute counts should be same
      const instancedMeshes = [];

      for (const mesh of meshes) {
        // Temporal variables
        const m = mesh.matrix.clone();
        const p = mesh.position.clone().set(0, 0, 0);
        const q = mesh.quaternion.clone().set(0, 0, 0, 1);
        const s = mesh.scale.clone().set(1, 1, 1);

        const instancedMesh = new InstancedMesh(mesh.geometry, mesh.material, count);
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
          instancedMesh.setMatrixAt(i, m.compose(p, q, s));
        }

        // We store other attributes to mesh.geometry so far.
        for (const attributeName in attributes) {
          if (attributeName !== 'TRANSLATION' &&
            attributeName !== 'ROTATION' &&
            attributeName !== 'SCALE') {
            mesh.geometry.setAttribute(attributeName, attributes[attributeName]);
          }
        }

        // Just in case
        Object3D.prototype.copy.call(instancedMesh, mesh);

        instancedMesh.frustumCulled = false;
        this.parser.assignFinalMaterial(instancedMesh);

        instancedMeshes.push(instancedMesh);
      }

      if (nodeObject.isGroup) {
        while (nodeObject.children.length > 0) {
          nodeObject.remove(nodeObject.children[0]);
        }

        for (const instancedMesh of instancedMeshes) {
          nodeObject.add(instancedMesh);
        }
        return nodeObject;
      }

      return instancedMeshes[0];
    });
  }
}
