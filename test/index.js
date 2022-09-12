// GLTFLoader accesses navigator.userAgent
// but Node.js doesn't seems to have it so
// defining it here as workaround.
// @TODO: Fix the root issue in Three.js
global.navigator = {userAgent: ''};

import './KHR_materials_variants.js'
import './EXT_mesh_gpu_instancing.js'
import './EXT_text.js'
import './EXT_texture_video.js'
import './MSFT_lod.js'
import './MSFT_texture_dds.js'
