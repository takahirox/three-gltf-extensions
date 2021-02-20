/* global QUnit */

import {GLTFLoader} from '../examples/three/loaders/GLTFLoader.js';
import {DDSLoader} from '../examples/three/loaders/DDSLoader.js';
import GLTFTextureDDSExtension from '../loaders/MSFT_texture_dds/MSFT_texture_dds.js';

const assetPath = '../examples/assets/gltf/BoomBox/glTF-dds/BoomBox.gltf';

export default QUnit.module('MSFT_texture_dds', () => {
  QUnit.module('GLTFMaterialsVariantsExtension', () => {
    QUnit.test('register', assert => {
      const done = assert.async();
      new GLTFLoader()
        .register(parser => new GLTFTextureDDSExtension(parser, new DDSLoader()))
        .parse('{"asset": {"version": "2.0"}}', null, result => {
          assert.ok(true, 'can register');
          done();
		}, error => {
          assert.ok(false, 'can register');
          done();
		});
    });
  });

  QUnit.module('GLTFMaterialsVariantsExtension-webonly', () => {
    QUnit.test('parse', assert => {
      const done = assert.async();
      new GLTFLoader()
        .register(parser => new GLTFTextureDDSExtension(parser, new DDSLoader()))
        .load(assetPath, gltf => {
          assert.ok(true, 'can load');

          const scene = gltf.scene;
          const meshes = [];
          scene.traverse(object => object.isMesh && object.material && meshes.push(object));;

          // @TODO: Properer check
          assert.ok(meshes.length > 0 &&
            meshes.filter(m => m.material.map && m.material.map.isCompressedTexture === true).length === meshes.length,
            'Textures are compressed textures');

          done();
        }, undefined, error => {
          assert.ok(false, 'can load');
          done();
        });
	});
  });
});
