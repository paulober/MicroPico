//@ts-check

'use strict';

const path = require('path');

/**@type {import('webpack').Configuration}*/
const config = {
  target: 'node',
  entry: './src/extension.mts',
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: 'extension.js',
    libraryTarget: 'commonjs2',
    devtoolModuleFilenameTemplate: '../[resource-path]',
  },
  node: {
    __dirname: false,
  },
  devtool: 'source-map',
  externals: {
    vscode: "commonjs vscode"
  },
  resolve: {
    extensions: ['.mts', '.ts', '.mjs', '.js'],
    mainFields: ['main', 'module'],
    extensionAlias: {
      '.mjs': ['.mts', '.mjs'], // allow imports written as ./file.mjs to resolve ./file.mts
      '.js': ['.ts', '.js'],  // allow imports written as ./file.js  to resolve ./file.ts
    },
  },
  module: {
    rules: [{
      test: /\.[cm]?ts$/,
      exclude: /node_modules/,
      use: [{
        // configure TypeScript loader:
        // * enable sources maps for end-to-end source maps
        loader: 'ts-loader',
        options: {
          compilerOptions: {
            "inlineSourceMap": true,
          }
        }
      }]
    }, {
      test: /.node$/,
      loader: 'node-loader',
    }]
  },
  optimization: {
    minimize: true
  },
  stats: {
    warnings: false
  }
};

const uninstallerEsm = {
  name: 'uninstaller',
  target: 'node',
  mode: 'production',
  entry: './vscodeUninstall.mjs',       // your existing file with TLA
  experiments: { outputModule: true, topLevelAwait: true },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'vscodeUninstall.mjs',
    library: { type: 'module' },
    chunkFormat: 'module',
    clean: false,
  },
  devtool: false,
  resolve: { extensions: ['.mjs', '.js'] },
};

// @ts-ignore
module.exports = [config, uninstallerEsm];
