import sys
import socket
import selectors
import types
import os
import threading
import time
import signal

NEXT_CHARACTER_IS_KEYCODE = [b'\xe0', b'\x00']

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
socketDelay = 0.01
characterDelay = 0.05

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
                time.sleep(characterDelay)
            except IOError:
                pass
    finally:
        termios.tcsetattr(fd, termios.TCSAFLUSH, oldterm)
        fcntl.fcntl(fd, fcntl.F_SETFL, oldflags)


def getCharacterWindows():
    while True:
        c1 = msvcrt.getch()
        # c1 is no unicode or even ascii char if it's a function key or an arrow key
        # thes keys are sent as two bytes, e.g. 0xe0 0x48
        # we need to wait for the second byte to avoid thrown errors by .decode()
        # TODO: suport arrow up for history
        if c1 in NEXT_CHARACTER_IS_KEYCODE:
            # Wait for the second character.
            c2 = ord(msvcrt.getch())
            if c2 == 72: #Up arrow ↑
                yield "\x1b[A"
            elif c2 == 80: #Down arrow ↓
                yield "\x1b[B"
            elif c2 == 77: #Right arrow →
                yield "\x1b[C"
            elif c2 == 75: #Left arrow ←
                yield "\x1b[D"
            elif c2 == 83: #Delete
                yield "\x1b[3~"

        # german special chars
        # TODO: avoid adding more and more chars thought try catch
        elif c1 not in [b'\x84', b'\x81', b'\x94']:
            yield c1.decode("utf-8")
        time.sleep(characterDelay)


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
            time.sleep(socketDelay)
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
            time.sleep(characterDelay)
    else:
        while True:
            for ch in getCharacterPosix():
                sys.stdout.flush()
                userInput(ch)
            time.sleep(characterDelay)


def handler(signum, frame):
    userInput(str(chr(3)))


server = threading.Thread(target=runServer)
server.start()

inputMonitor = threading.Thread(target=listenForInput)
inputMonitor.start()

# Don't let Ctrl+C end this Python process: send it to the board instead!
signal.signal(signal.SIGINT, handler)

server.join()
