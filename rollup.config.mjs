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
    ],
    plugins: [
        !isProduction && copy({
            targets: [
                {
                    src: 'node_modules/@paulober/pyboard-serial-com/scripts',
                    dest: 'dist/'
                },
            ],
        }),
        nodeResolve({
            preferBuiltins: true,
        }),
        commonjs(),
        typescript({
            tsconfig: 'tsconfig.json',
        }),
        isProduction && terser(),
        // required by axios
        json(),
    ],
};
