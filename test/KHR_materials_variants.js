/* global QUnit */

import {GLTFLoader} from '../examples/three/loaders/GLTFLoader.js';
import GLTFMaterialsVariantsExtension from '../loaders/KHR_materials_variants/KHR_materials_variants.js';
import {
  Mesh,
  MeshStandardMaterial
} from '../examples/three/three.module.js';

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

    QUnit.test('selectVariant', assert => {
      const done = assert.async();
      new GLTFLoader()
        .register(parser => new GLTFMaterialsVariantsExtension(parser))
        .load(assetPath, async gltf => {
          const variants = gltf.userData.variants;
          const scene = gltf.scene;

          // The function should have an effect to even user defined Meshes
          const userMesh = new Mesh();
          userMesh.userData.variantMaterials = {};
          userMesh.userData.variantMaterials[variants[0]] = {
            material: new MeshStandardMaterial()
          };

          scene.traverse(object => {
            if (object.isMesh && object.userData.variantMaterials && userMesh.parent === null) {
              object.add(userMesh);
            }
          });

          assert.ok(userMesh.parent !== null, 'user mesh is added');

          const objects = [];
          scene.traverse(object => object.isMesh &&
            object.userData.variantMaterials && objects.push(object));

          await gltf.functions.selectVariant(scene, variants[0]);

          assert.ok(objects.length ===
            objects.filter(o => o.userData.variantMaterials[variants[0]].material !== null).length,
            'Cached');
          assert.ok(objects.length ===
            objects.filter(o => o.material === o.userData.variantMaterials[variants[0]].material).length,
            'Selected correctly');

          await gltf.functions.selectVariant(scene, null);

          assert.ok(objects.length ===
            objects.filter(o => o.material === o.userData.originalMaterial).length,
            'Deselected correctly');

          await gltf.functions.selectVariant(userMesh.parent, variants[0], false);

          assert.ok(objects.length ===
            objects.filter(o =>
              (o === userMesh.parent && o.material === o.userData.variantMaterials[variants[0]].material) ||
              (o !== userMesh.parent && o.material === o.userData.originalMaterial)
            ).length,
            'doTraverse option works');

          done();
        }, undefined, error => {
          assert.ok(false, 'can load');
          done();
        });
    });

    QUnit.test('ensureLoadVariants', assert => {
      const done = assert.async();
      new GLTFLoader()
        .register(parser => new GLTFMaterialsVariantsExtension(parser))
        .load(assetPath, async gltf => {
          const variants = gltf.userData.variants;
          const scene = gltf.scene;

          await gltf.functions.ensureLoadVariants(scene);

          let loaded = true;

          scene.traverse(object => {
            if (object.isMesh && object.userData.variantMaterials) {
              for (const key in object.userData.variantMaterials) {
                if (object.userData.variantMaterials[key].material === null) {
                  loaded = false;
                }
              }
            }
          });

          assert.ok(loaded, 'Loaded');

          // @TODO: Test doTraverse option

          done();
        }, undefined, error => {
          assert.ok(false, 'can load');
          done();
        });
    });
  });

  QUnit.module('GLTFExporterMaterialsVariantsExtension-webonly', () => {
    QUnit.todo('export', assert => {
      assert.ok(false);
    });
  });
});
