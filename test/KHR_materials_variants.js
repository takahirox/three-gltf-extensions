/* global QUnit */

import {GLTFLoader} from '../examples/three/loaders/GLTFLoader.js';
import GLTFMaterialsVariantsExtension from '../loaders/KHR_materials_variants/KHR_materials_variants.js';

const assetPath = '../examples/assets/gltf/MaterialsVariantsShoe/glTF/MaterialsVariantsShoe.gltf';

export default QUnit.module('KHR_materials_variants', () => {
  QUnit.module('GLTFMaterialsVariantsExtension', () => {
    QUnit.test('register', assert => {
      const done = assert.async();
      new GLTFLoader()
        .register(parser => new GLTFMaterialsVariantsExtension(parser))
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
        .register(parser => new GLTFMaterialsVariantsExtension(parser))
        .load(assetPath, gltf => {
          assert.ok(true, 'can load');

          const variants = gltf.userData.variants;
          assert.ok(Array.isArray(variants) &&
            variants.length === 3 &&
            variants[0] === 'midnight' &&
            variants[1] === 'beach' &&
            variants[2] === 'street',
            'expected variant names are saved under gltf.userData');

          const objects = [];
          gltf.scene.traverse(object => {
            if (object.isMesh && object.userData.variantMaterials) {
              objects.push(object);
            }
          });

          let validKey = true;
          let validInitialMaterial = true;
          let validGltfMaterialIndex = true;

          objects.forEach(object => {
            const variantMaterials = object.userData.variantMaterials;
            for (const key in variantMaterials) {
              const variant = variantMaterials[key];
              if (!variants.includes(key)) {
                validKey = false;
              }
              if (variant.material !== null) {
                validInitialMaterial = false;
              }
              // @TODO: Check index is in the length of gltfDef.materials
              if (typeof variant.gltfMaterialIndex !== 'number') {
                validGltfMaterialIndex = false;
              }
            }
          });

          assert.ok(objects.length > 0, 'variant materials info are saved under mesh.userData.variantMaterials');
          assert.ok(validKey, 'variantMaterials\' keys are included in variants');
          assert.ok(validInitialMaterial, 'initial variantMaterial.material is null');
          assert.ok(validGltfMaterialIndex, 'variant.gltfMaterialIndex is number');

          done();
		}, undefined, error => {
          assert.ok(false, 'can load');
          done();
		});
	});

    QUnit.todo('selectVariant', assert => {
      assert.ok(false);
    });

    QUnit.todo('ensureLoadVariants', assert => {
      assert.ok(false);
    });
  });

  QUnit.module('GLTFExporterMaterialsVariantsExtension-webonly', () => {
    QUnit.todo('export', assert => {
      assert.ok(false);
    });
  });
});
