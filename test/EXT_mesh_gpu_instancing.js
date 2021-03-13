/* global QUnit */

import * as THREE from '../examples/three/three.module.js';
import {GLTFLoader} from '../examples/three/loaders/GLTFLoader.js';
import GLTFInstancingExtension from '../loaders/EXT_mesh_gpu_instancing/EXT_mesh_gpu_instancing.js';

const assetPath = '../examples/assets/gltf/Teapots/glTF-instancing/teapots_galore.gltf';

export default QUnit.module('EXT_mesh_gpu_instancing', () => {
  QUnit.module('GLTFInstancingExtension', () => {
    QUnit.test('register', assert => {
      const done = assert.async();
      new GLTFLoader()
        .register(parser => new GLTFInstancingExtension(parser, THREE))
        .parse('{"asset": {"version": "2.0"}}', null, result => {
          assert.ok(true, 'can register');
          done();
        }, error => {
          assert.ok(false, 'can register');
          done();
        });
    });
  });

  QUnit.module('GLTFInstancingExtension-webonly', () => {
    QUnit.test('parse', assert => {
      const done = assert.async();
      new GLTFLoader()
        .register(parser => new GLTFInstancingExtension(parser, THREE))
        .load(assetPath, gltf => {
          assert.ok(true, 'can load');
          // @TODO: More proper test
          let foundInstancedMesh = false;
          gltf.scene.traverse(obj => {
            if (obj.isInstancedMesh) {
              foundInstancedMesh = true;
            }
          });
          assert.ok(foundInstancedMesh, 'InstancedMesh is created');
          done();
        }, undefined, error => {
          assert.ok(false, 'can load');
          done();
        });
    });
  });
});
