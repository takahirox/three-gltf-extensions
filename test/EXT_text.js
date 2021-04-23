/* global QUnit */

import * as THREE from '../examples/three/three.module.js';
import {GLTFLoader} from '../examples/three/loaders/GLTFLoader.js';
import GLTFTextExtension from '../loaders/EXT_text/EXT_text.js';

const assetPath = '../examples/assets/gltf/BoomBox/glTF-text/BoomBox.gltf';
const fontPath = '../examples/assets/fonts/helvetiker_regular.typeface.json';

export default QUnit.module('EXT_text', () => {
  QUnit.module('GLTFTextExtension', () => {
    QUnit.test('register', assert => {
      const done = assert.async();
      new GLTFLoader()
        .register(parser => new GLTFTextExtension(parser, new THREE.FontLoader(), fontPath, THREE))
        .parse('{"asset": {"version": "2.0"}}', null, result => {
          assert.ok(true, 'can register');
          done();
        }, error => {
          assert.ok(false, 'can register');
          done();
        });
    });
  });

  QUnit.module('GLTFTextExtension-webonly', () => {
    QUnit.test('parse', assert => {
      const done = assert.async();
      new GLTFLoader()
        .register(parser => new GLTFTextExtension(parser, new THREE.FontLoader(), fontPath, THREE))
        .load(assetPath, gltf => {
          assert.ok(true, 'can load');
          // @TODO: Properer check
          let hasShapeGeometry = false;
          gltf.scene.traverse(object => {
            if (object.isMesh && object.geometry instanceof THREE.ShapeGeometry) {
              hasShapeGeometry = true;
            }
          });
          assert.ok(hasShapeGeometry, 'can parse');
          done();
        }, undefined, error => {
          assert.ok(false, 'can load');
          done();
        });
    });
  });
});
