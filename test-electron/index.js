/* eslint-disable node/no-missing-require,no-unused-vars,node/no-unpublished-require,node/no-extraneous-require */
const app = require('electron').app

console.log( `electron: ${process.versions.electron}, ABI: ${process.versions.modules}, platform:${process.platform}, arch: ${process.arch}`)
console.log( `  [node/electron]-v${process.versions.modules}-${process.platform}-${process.arch}`)
try {
    // will seek 'upwards' to find the the serialport configured in the project above.
    const serialport = require('serialport')
    console.log(`loaded serialport OK`)
    app.exit(0)
  //console.log( JSON.stringify(process.arch))
} catch (e) {
    console.error('Error loading serialport')
    console.error(e)
    //console.error(e.stack)
    app.exit(-1)
}

app.quit()
