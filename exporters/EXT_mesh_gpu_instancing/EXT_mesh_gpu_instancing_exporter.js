import {
  BufferAttribute,
  Matrix4,
  Vector3,
  Quaternion
} from 'three';

/**
 * Mesh GPU Instancing extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Vendor/EXT_mesh_gpu_instancing
 */
export default class GLTFExporterMeshGPUInstancingExtension {
  constructor(writer) {
    this.writer = writer;
    this.name = 'EXT_mesh_gpu_instancing';
  }

  writeNode(node, nodeDef) {
    if (node.isInstancedMesh !== true) {
      return;
    }

    const count = node.count;
    const matrix = new Matrix4();
    const positions = new Float32Array(count * 3);
    const quaternions = new Float32Array(count * 4);
    const scales = new Float32Array(count * 3);

    const p = new Vector3();
    const q = new Quaternion();
    const s = new Vector3();

    for (let i = 0; i < count; i++) {
      node.getMatrixAt(i, matrix);
      matrix.decompose(p, q, s);

      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;

      quaternions[i * 4] = q.x;
      quaternions[i * 4 + 1] = q.y;
      quaternions[i * 4 + 2] = q.z;
      quaternions[i * 4 + 3] = q.w;

      scales[i * 3] = s.x;
      scales[i * 3 + 1] = s.y;
      scales[i * 3 + 2] = s.z;
    }

    const writer = this.writer;
    const extensionDef = {};

    // @TODO: Export attributes only if the values are not default values?
    // @TODO: Support colors
    extensionDef.attributes = {
      TRANSLATION: writer.processAccessor(new BufferAttribute(positions, 3)),
      ROTATION: writer.processAccessor(new BufferAttribute(quaternions, 4)),
      SCALE: writer.processAccessor(new BufferAttribute(scales, 3)),
    };

    nodeDef.extensions = nodeDef.extensions || {};
    nodeDef.extensions[this.name] = extensionDef;
    writer.extensionsUsed[this.name] = true;
  }
}