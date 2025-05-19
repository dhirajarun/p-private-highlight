import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default [
  {
    input: './prosemirror.js',
    output: {
      name: 'demo',
      file: './dist/prosemirror.js',
      format: 'iife',
      sourcemap: true,
    },
    plugins: [
      nodeResolve({
        mainFields: ['module', 'browser', 'main'],
      }),
      commonjs(),
    ],
  },
];
