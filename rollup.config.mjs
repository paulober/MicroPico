import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import copy from 'rollup-plugin-copy';
import json from '@rollup/plugin-json';

const isProduction = process.env.BUILD === 'production';

export default {
    input: 'src/extension.mts',
    output: {
        //dir: 'dist',
        file: 'dist/extension.cjs',
        format: 'cjs',
        sourcemap: true,
        exports: 'named',
    },
    external: [
        'vscode',
        // need to be externalized and included by packager for native modules of pico-mpy-com
        "@serialport/bindings-cpp",
    ],
    plugins: [
        !isProduction && copy({
            targets: [
                {
                    src: 'node_modules/@serialport/bindings-cpp/scripts',
                    dest: 'dist/'
                },
            ],
        }),
        nodeResolve({
            preferBuiltins: true,
        }),
        commonjs({
            ignoreDynamicRequires: true,
        }),
        typescript({
            tsconfig: 'tsconfig.json',
        }),
        isProduction && terser(),
        // required by axios and serialport
        json(),
    ],
};
