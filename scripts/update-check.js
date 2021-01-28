var vtools = require('./functions-versions.js')

vtools.getCurrentVersions(function(atom_version){
  console.log("VSCode current: "+atom_version)
  // console.log("Electron current: "+electron_version)
  vtools.loadLatest(function(atom_latest_version){
    console.log("VSCode Latest: "+atom_latest_version)
    if(vtools.versionBiggerThen(atom_latest_version,atom_version)){
      console.log("New version "+atom_latest_version+" available! Download link:")
      console.log(vtools.getDownloadUrl(atom_latest_version))
    }
  })
})
