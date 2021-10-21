THREE_PATH=../../three.js

function copy_module {
  cat $1 | sed -e "s/\.\.\/\.\.\/\.\.\/build\/three\.module\.js/..\/three.module.js/g" > $2
}

echo cp ${THREE_PATH}/build/three.module.js three/
cp ${THREE_PATH}/build/three.module.js three/

echo cp ${THREE_PATH}/examples/jsm/controls/OrbitControls.js ./three/controls
copy_module ${THREE_PATH}/examples/jsm/controls/OrbitControls.js ./three/controls/OrbitControls.js

echo cp ${THREE_PATH}/examples/jsm/exporters/GLTFExporter.js ./three/exporters
copy_module ${THREE_PATH}/examples/jsm/exporters/GLTFExporter.js ./three/exporters/GLTFExporter.js

echo cp ${THREE_PATH}/examples/jsm/loaders/DDSLoder.js ./three/loaders/
copy_module ${THREE_PATH}/examples/jsm/loaders/DDSLoader.js ./three/loaders/DDSLoader.js
echo cp ${THREE_PATH}/examples/jsm/loaders/FontLoder.js ./three/loaders/
copy_module ${THREE_PATH}/examples/jsm/loaders/FontLoader.js ./three/loaders/FontLoader.js
echo cp ${THREE_PATH}/examples/jsm/loaders/GLTFLoader.js ./three/loaders/
copy_module ${THREE_PATH}/examples/jsm/loaders/GLTFLoader.js ./three/loaders/GLTFLoader.js
echo cp ${THREE_PATH}/examples/jsm/loaders/RGBELoader.js ./three/loaders/
copy_module ${THREE_PATH}/examples/jsm/loaders/RGBELoader.js ./three/loaders/RGBELoader.js

