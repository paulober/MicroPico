#!/usr/bin/python

import sys
import socket
import selectors
import types
import os 
import threading
import time

isWindows = sys.platform == "win32"

if isWindows:
    import msvcrt
else:
    import termios
    import fcntl

port = int(sys.argv[1]) if len(sys.argv) == 2 else 1337
ip = "127.0.0.1"
debug = False
sel = selectors.DefaultSelector()

clients = set()
clients_lock = threading.Lock()

def acceptWrapper(sock):
    conn, addr = sock.accept()  # Should be ready to read

    log("Accepted connection from " + str(addr))
    with clients_lock:
        clients.add(conn)

    conn.setblocking(False)
    data = types.SimpleNamespace(addr=addr, inb=b"", outb=b"")
    events = selectors.EVENT_READ | selectors.EVENT_WRITE
    sel.register(conn, events, data=data)

def serviceConnection(key, mask):
    sock = key.fileobj
    data = key.data
    if mask & selectors.EVENT_READ:
        recv_data = sock.recv(1024)  # Should be ready to read
        if recv_data:
            #data.outb += recv_data
            boardInput(recv_data)
        else:
            log("Closing connection to " + str(data.addr))
            sel.unregister(sock)
            sock.close()
            clients.remove(sock)

def getCharacterPosix():
  fd = sys.stdin.fileno()

  oldterm = termios.tcgetattr(fd)
  newattr = termios.tcgetattr(fd)
  newattr[3] = newattr[3] & ~termios.ICANON & ~termios.ECHO
  termios.tcsetattr(fd, termios.TCSANOW, newattr)

  oldflags = fcntl.fcntl(fd, fcntl.F_GETFL)
  fcntl.fcntl(fd, fcntl.F_SETFL, oldflags | os.O_NONBLOCK)

  try:        
    while True:            
      try:
        c = sys.stdin.read(1)
        yield c
      except IOError: pass
  finally:
    termios.tcsetattr(fd, termios.TCSAFLUSH, oldterm)
    fcntl.fcntl(fd, fcntl.F_SETFL, oldflags)

def getCharacterWindows():
    while True:
        c = msvcrt.getch().decode("utf-8")
        yield c     

def boardInput(data: bytes):
    sys.stdout.write(data.decode("utf-8"))
    sys.stdout.flush()

def userInput(ch: str):
    if (ch != ""):
        log("Received: " + ch)
        # Posix sends \n only; Windows sends \r only.
        # The board expects \r\n.
        if ch == "\n" or ch == "\r":
            ch = "\r\n"

        with clients_lock:
            for client in clients:
                client.sendall(str.encode(ch))

def log(msg: str):
    if debug:
        print(msg)

def runServer():
    log("Starting server...")

    lsock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    lsock.bind((ip, port))
    lsock.listen()

    sel.register(lsock, selectors.EVENT_READ, data=None)

    try:
        while True:
            events = sel.select(timeout=None)
            for key, mask in events:
                if key.data is None:
                    acceptWrapper(key.fileobj)
                else:
                    serviceConnection(key, mask)
            time.sleep(0.001)
    except KeyboardInterrupt:
        log("Caught keyboard interrupt: exiting!")
    finally:
        sel.close()

def listenForInput():
    if isWindows:
        while True:
            for ch in getCharacterWindows():
                sys.stdout.flush()
                userInput(ch)
            time.sleep(0.001)
    else:
        while True:
            for ch in getCharacterPosix():
                sys.stdout.flush()
                userInput(ch)
            time.sleep(0.001)

server = threading.Thread(target=runServer)
server.start()

inputMonitor = threading.Thread(target=listenForInput)
inputMonitor.start()

server.join()
