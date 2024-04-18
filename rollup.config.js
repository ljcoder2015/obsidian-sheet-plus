import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import webWorkerLoader from 'rollup-plugin-web-worker-loader';
import babel from '@rollup/plugin-babel';
import css from 'rollup-plugin-css-porter';

export default {
  input: 'src/main.ts',
  output: {
    dir: '.',
    sourcemap: 'inline',
    format: 'cjs',
    exports: 'default',
  },
  external: [
    'obsidian'
  ],
  plugins: [
    css(),
    typescript(),
    nodeResolve({ browser: true }),
    commonjs(),
    json(),
    babel({
      presets: [['@babel/preset-env', {
        targets: {
          esmodules: true,
        },
      }]],
      exclude: "node_modules/**"
    }),
    webWorkerLoader({
      targetPlatform: 'browser',
      extensions: ['.ts'],
      preserveSource: true,
      sourcemap: true,
    }),
  ],
};
