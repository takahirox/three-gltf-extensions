#!/usr/bin/bash

# Run this script at three-gltf-extensions/examples

# Path from three-gltf-extensions/examples to
# Three.js cloned repository directory
three_dir="../../three.js"

echo [log] copy ${three_dir}/build/three.module.js
cp ${three_dir}/build/three.module.js ./three/

for file in \
  'loaders/GLTFLoader.js' \
  'loaders/RGBELoader.js' \
  'loaders/DDSLoader.js' \
  'exporters/GLTFExporter.js' \
  'controls/OrbitControls.js'
do
  echo [log] copy ${three_dir}/examples/jsm/${file}
  cat ${three_dir}/examples/jsm/${file} |\
    sed -e 's/..\/..\/..\/build\/three/..\/three/' > ./three/${file}
done

