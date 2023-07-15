import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

export default {
    input: './vscodeUninstall.mjs',
    output: {
        file: 'dist/vscodeUninstall.mjs',
        format: 'es',
        sourcemap: false,
        exports: 'named',
    },
    plugins: [
        nodeResolve({
            preferBuiltins: true,
        }),
        commonjs(),
        terser(),
    ],
};
