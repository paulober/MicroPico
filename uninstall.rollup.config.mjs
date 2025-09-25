import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';

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
    ],
};
