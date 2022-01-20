/**
 * Mesh GPU Instancing extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Vendor/EXT_mesh_gpu_instancing
 */

 import {
	BufferAttribute,
	Matrix4,
	Vector3,
	Quaternion,
} from 'three';

 export default class GLTFMeshGPUInstancingExtension {

	constructor( writer ) {

		this.writer = writer;
		this.name = 'EXT_mesh_gpu_instancing';

	}

	writeNode( node, nodeDef ) {

		if(node.constructor.name !== "InstancedMesh") return;

		const writer = this.writer;
		const extensionsUsed = writer.extensionsUsed;
		const extensionDef = {};
		
		nodeDef.extensions = nodeDef.extensions || {};
		nodeDef.extensions[ this.name ] = extensionDef;

		let mat = new Matrix4();
		const pos0 = new Array();
		const rot0 = new Array();
		const scl0 = new Array();

		for(let i = 0; i < node.count; i++)
		{
			node.getMatrixAt(i, mat);
			
			let p = new Vector3();
			let r = new Quaternion();
			let s = new Vector3();

			mat.decompose(p,r,s);
			
			pos0.push(p.x,p.y,p.z);
			rot0.push(r.x,r.y,r.z,r.w);
			scl0.push(s.x,s.y,s.z);
		};

		const pos = new Float32Array(pos0);
		const rot = new Float32Array(rot0);
		const scl = new Float32Array(scl0);

		extensionDef.attributes = {
			"TRANSLATION" : writer.processAccessor( new BufferAttribute( pos, 3 ) ),
			"ROTATION" : writer.processAccessor( new BufferAttribute( rot, 4 ) ),
			"SCALE" : writer.processAccessor( new BufferAttribute( scl, 3 ) ),
		};

		extensionsUsed[ this.name ] = true;

	}
}