import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import copy from 'rollup-plugin-copy';

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
        /* In production the required scripts platform version needs to be copied manually */
        copy({
            targets: [
                !isProduction && {
                    src: 'node_modules/@paulober/pyboard-serial-com/scripts',
                    dest: 'dist/'
                },
                {
                    src: 'node_modules/xterm/lib/*.js',
                    dest: 'panel/xterm/lib',
                    extglob: true
                },
                {
                    src: 'node_modules/xterm/css/*.css',
                    dest: 'panel/xterm/css',
                    extglob: true
                },
                {
                    src: 'node_modules/xterm/LICENSE',
                    dest: 'panel/xterm'
                },
                {
                    src: 'node_modules/xterm/README.md',
                    dest: 'panel/xterm'
                }
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
    ],
};
