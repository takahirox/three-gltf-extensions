import { nodeResolve } from '@rollup/plugin-node-resolve';
require('qunit');

export default [{
  input: 'index.js',
  plugins: [
    nodeResolve()
  ],
  output: [{
    format: 'umd',
    file: 'build/unit.js'
  }]
}];
