/* global QUnit */

import * as THREE from '../examples/three/three.module.js';
import {GLTFLoader} from '../examples/three/loaders/GLTFLoader.js';
import GLTFVideoTextureExtension from '../loaders/EXT_texture_video/EXT_texture_video.js';

const assetPath = '../examples/assets/gltf/Box/glTF-texture-video/BoxTextured.gltf';

export default QUnit.module('EXT_texture_video', () => {
  QUnit.module('GLTFVideoTextureExtension', () => {
    QUnit.test('register', assert => {
      const done = assert.async();
      new GLTFLoader()
        .register(parser => new GLTFVideoTextureExtension(parser, THREE))
        .parse('{"asset": {"version": "2.0"}}', null, result => {
          assert.ok(true, 'can register');
          done();
		}, error => {
          assert.ok(false, 'can register');
          done();
        });
    });
  });

  QUnit.module('GLTFVideoTextureExtension-webonly', () => {
    QUnit.test('parse', assert => {
      const done = assert.async();
      new GLTFLoader()
        .register(parser => new GLTFVideoTextureExtension(parser, THREE))
        .load(assetPath, gltf => {
          assert.ok(true, 'can load');
          // @TODO: Properer check
          let hasVideoTexture = false;
          gltf.scene.traverse(object => {
            if (!object.material) {
              return;
            }
            const materials = Array.isArray(object.material) ? object.material : [object.material];
            for (const material of materials) {
              for (const key in material) {
                const prop = material[key];
                if (prop && prop.isVideoTexture) {
                  hasVideoTexture = true;
                }
              }
            }
          });
          assert.ok(hasVideoTexture, 'can parse');
          done();
		}, undefined, error => {
          assert.ok(false, 'can load');
          done();
        });
	});
  });
});
