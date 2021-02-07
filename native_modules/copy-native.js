const fs = require("fs");
const path = require("path");
const fse = require("fs-extra");

let native_modules = path.resolve(path.join(".", "native_modules"));
let bindings_path = path.resolve(path.join("node_modules", "@serialport", "bindings", "lib", "binding"));
let build_path = path.resolve(path.join("node_modules", "@serialport", "bindings", "build"));

if (fs.existsSync(build_path)) {
    console.log("Deleting build folder..");

    fs.rmdirSync(build_path, {
        recursive: true,
        force: true
    });   
}

if (fs.existsSync(bindings_path)) {
    console.log("Deleting bindings folder..");
    
    fs.rmdirSync(bindings_path, {
        recursive: true,
        force: true
    });   
}

console.log("Creating bindings folder..");
fs.mkdirSync(bindings_path);

let folders = fs.readdirSync(native_modules);

for(let f of folders){
    let item = path.join(native_modules, f);
    if (fs.lstatSync(item).isDirectory()) {
        console.log(`Copying ${f} ...`);
        fse.copySync(item, path.join(bindings_path, f));
    }
}
