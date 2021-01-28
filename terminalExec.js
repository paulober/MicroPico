#!/usr/bin/env node

var port = process.argv.length >=3 ? process.argv[2] : 1337
var ip = '127.0.0.1'

var net = require('net')
var clients = []
var stdin = process.openStdin();
stdin.setRawMode(true);
var debug = false;

log("Starting server...")
net.createServer(function(socket){

    log("Client connected")
    clients.push(socket)

    socket.on('data', function (data) {
      boardInput(data)
    });

    socket.on('end', function () {
      log("Client disconnected")
      clients.splice(clients.indexOf(socket), 1);
    });

}).listen(port, ip);

stdin.addListener("data", function(text) {
  userInput(text)
})

// Send a message to all clients
function userInput(message) {
  clients.forEach(function (client) {
    client.write(message);
  });
}

function boardInput(message){
  process.stdout.write(message)
}

function log(mssg){
  if(debug){
    console.log(mssg)
  }
}