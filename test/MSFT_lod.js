/* global QUnit */

import * as THREE from '../examples/three/three.module.js';
import {GLTFLoader} from '../examples/three/loaders/GLTFLoader.js';
import GLTFLodExtension from '../loaders/MSFT_lod/MSFT_lod.js';

const assetPath = '../examples/assets/gltf/Torus/glTF-lod/Torus.gltf';

export default QUnit.module('MSFT_lod', () => {
  QUnit.module('GLTFLodExtension', () => {
    QUnit.test('register', assert => {
      const done = assert.async();
      new GLTFLoader()
        .register(parser => new GLTFLodExtension(parser, undefined, THREE))
        .parse('{"asset": {"version": "2.0"}}', null, result => {
          assert.ok(true, 'can register');
          done();
		}, error => {
          assert.ok(false, 'can register');
          done();
        });
    });
  });

  QUnit.module('GLTFLodExtension-webonly', () => {
    QUnit.test('parse', assert => {
      const done = assert.async();
      new GLTFLoader()
        .register(parser => new GLTFLodExtension(parser, undefined, THREE))
        .load(assetPath, gltf => {
          assert.ok(true, 'can load');
          // @TODO: More proper test
          let foundLod = false;
          gltf.scene.traverse(obj => {
            if (obj.isLOD) {
              foundLod = true;
            }
          });
          assert.ok(foundLod, 'LOD is created');
          done();
		}, undefined, error => {
          assert.ok(false, 'can load');
          done();
        });
	});

    QUnit.todo('onUpdate', assert => {
      assert.ok(false);
    });
  });
});
