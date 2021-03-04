#!/usr/bin/env node

let port = process.argv.length >= 3 ? process.argv[2] : 1337;
let ip = '127.0.0.1';

let net = require('net');
let clients = [];
let stdin = process.openStdin();
stdin.setRawMode(true);
let debug = false;

log('Starting server...');
net.createServer(function(socket) {

  log('Client connected');
  clients.push(socket);

  socket.on('data', function(data) {
    boardInput(data);
  });

  socket.on('end', function() {
    log('Client disconnected');
    clients.splice(clients.indexOf(socket), 1);
  });

}).listen(port, ip);

stdin.addListener('data', function(text) {
  userInput(text);
});

// Send a message to all clients
function userInput(message) {
  clients.forEach(function(client) {
    client.write(message);
  });
}

function boardInput(message) {
  process.stdout.write(message);
}

function log(mssg) {
  if (debug) {
    console.log(mssg);
  }
}