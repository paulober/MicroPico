const fs = require('fs');
const path = require('path');

const patches = [
  ['ftp-srv', 'ftp-srv.d.ts', path.join(__dirname, '..', 'node_modules', 'ftp-srv', 'ftp-srv.d.ts')],
  ['dtrace-provider', 'dtrace-provider.js', path.join(__dirname, '..', 'node_modules', 'dtrace-provider', 'dtrace-provider.js')],
  ['node-gyp-build', 'node-gyp-build.js', path.join(__dirname, '..', 'node_modules', 'node-gyp-build', 'index.js')],
];

for (let i = 0; i < patches.length; i++) {
  let pkgName = patches[i][0];
  let src = path.join(__dirname, '..', 'patches', patches[i][1]);
  let dst = patches[i][2];

  fs.readFile(src, (err, data) => {
    if (err) {
      console.error("Package ["+pkgName+"]: Failed to patch (step1)!");
      throw err;
    }
  
    fs.writeFile(dst, data, (err) => {
      if (err) {
        console.error("Package ["+pkgName+"]: Failed to patch (step2)!");
        throw err;
      }
      console.log("Package ["+pkgName+"]: Was patched successfully!");
    });
  });  
}