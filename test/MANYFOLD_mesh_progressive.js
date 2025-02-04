/* global QUnit */

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import GLTFManyfoldMeshProgressiveExtension from '../loaders/MANYFOLD_mesh_progressive/MANYFOLD_mesh_progressive.js';

export default QUnit.module('MANYFOLD_mesh_progressive', () => {
  QUnit.module('GLTFManyfoldMeshProgressiveExtension', () => {
    QUnit.test('register', assert => {
      const done = assert.async();
      new GLTFLoader()
        .register(parser => new GLTFManyfoldMeshProgressiveExtension(parser))
        .parse('{"asset": {"version": "2.0"}}', null, result => {
          assert.ok(true, 'can register');
          done();
        }, error => {
          assert.ok(false, 'can register');
          done();
        });
    });
  });

  QUnit.module('GLTFManyfoldMeshProgressiveExtension-webonly', () => {
    QUnit.test('loads base mesh', assert => {
      const done = assert.async();
      const assetPath = '../examples/assets/gltf/Progressive/progressive.glb';
      new GLTFLoader()
        .register(parser => new GLTFManyfoldMeshProgressiveExtension(parser))
        .load(assetPath, gltf => {
          let hasBaseMesh = false;
          let vertexCount = 0;
          let faceCount = 0;
          gltf.scene.traverse(object => {
            if (object.isMesh) {
              hasBaseMesh = true;
              if (object.geometry) {
                faceCount = object.geometry.index.count
                vertexCount = object.geometry.getAttribute("position").count
              }
            }
          });
          assert.ok(hasBaseMesh, 'can parse base mesh');
          assert.ok(vertexCount == 1647, 'loads expected number of vertices');
          assert.ok(faceCount == 2460, 'loads expected number of faces');
          done();
        }, undefined, error => {
          assert.ok(false, 'can load base mesh');
          done();
        });
    });
  });
});
