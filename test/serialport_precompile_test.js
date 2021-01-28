// ***********************************************************************************************************
// ***********************************************************************************************************
// declaration
// ***********************************************************************************************************
const path = require('path');
const fs = require('fs');
var nodeabi = require('node-abi')
var a = require('./bindings-abi.js')


var Port1, Port2
// ***********************************************************************************************************

// ***********************************************************************************************************
// Port 1
// ***********************************************************************************************************
try{ 
    Port1 = require('serialport')
    console.log("Succesfully created serial port 1", Port1.Binding.name)
    // display platform details on success ?
    // # Port1.Binding["[[Scopes]]"][0].binding.path is only visible in debugger 
} catch (e) {
    console.log("error defining port x")
    console.log(e.message)
}



// // ***********************************************************************************************************
// // Port 2 - using custom bindings which uses the abi 
// // ***********************************************************************************************************
// try {
//     Port2 = require('./bindings-abi.js')('serialport')
//     console.log("Succesfully created serial port 2")
// } catch (e) {
//     console.log("error defining port x")
//     console.log(e.message)
// }

