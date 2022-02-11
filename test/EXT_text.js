/* global QUnit */

import {FontLoader} from 'three/examples/jsm/loaders/FontLoader.js';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import GLTFTextExtension from '../loaders/EXT_text/EXT_text.js';

const assetPath = '../examples/assets/gltf/BoomBox/glTF-text/BoomBox.gltf';
const fontPath = '../examples/assets/fonts/helvetiker_regular.typeface.json';

export default QUnit.module('EXT_text', () => {
  QUnit.module('GLTFTextExtension', () => {
    QUnit.test('register', assert => {
      const done = assert.async();
      new GLTFLoader()
        .register(parser => new GLTFTextExtension(parser, new FontLoader(), fontPath))
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
        .register(parser => new GLTFTextExtension(parser, new FontLoader(), fontPath))
        .load(assetPath, gltf => {
          assert.ok(true, 'can load');
          // @TODO: Properer check
          let hasShapeGeometry = false;
          gltf.scene.traverse(object => {
            if (object.isMesh && object.geometry.type === 'ShapeGeometry') {
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
