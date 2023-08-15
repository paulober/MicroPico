"""
Module: 'usocket' on micropython-v1.19.1-rp2
"""
# MCU: {'ver': 'v1.19.1', 'build': '', 'sysname': 'rp2', 'platform': 'rp2', 'version': '1.19.1', 'release': '1.19.1', 'port': 'rp2', 'family': 'micropython', 'name': 'micropython', 'machine': 'Raspberry Pi Pico W with RP2040', 'nodename': 'rp2'}
from typing import Any, Union, Optional

AF_INET = 2 # type: int
AF_INET6 = 10 # type: int
IPPROTO_IP = 0 # type: int
IP_ADD_MEMBERSHIP = 1024 # type: int
IP_DROP_MEMBERSHIP = 1025 # type: int
SOCK_DGRAM = 2 # type: int
SOCK_RAW = 3 # type: int
SOCK_STREAM = 1 # type: int
SOL_SOCKET = 1 # type: int
SO_REUSEADDR = 4 # type: int

def callback(*args, **kwargs) -> Any:
    ...

def getaddrinfo(host, port, af=0, type=0, proto=0, flags=0, /) -> Any:
    """Translate the host/port argument into a sequence of 5-tuples that contain all the necessary arguments for creating a socket connected to that service. Arguments af, type, and proto (which have the same meaning as for the socket() function) can be used to filter which kind of addresses are returned. If a parameter is not specified or zero, all combinations of addresses can be returned (requiring filtering on the user side).

    The resulting list of 5-tuples has the following structure::

    (family, type, proto, canonname, sockaddr)
    """
    ...

def print_pcbs(*args, **kwargs) -> Any:
    ...

def reset(*args, **kwargs) -> Any:
    ...


class socket():
    def __init__(self, af=AF_INET, type=SOCK_STREAM, proto: int=0, /) -> None:
        """! NOTE: proto might not default to 0 on all MicroPython implementations

        Create a new socket using the given address family, socket type and 
        protocol number. Note that specifying proto in most cases is not 
        required (and not recommended, as some MicroPython ports may omit 
        ``IPPROTO_*`` constants). Instead, type argument will select needed 
        protocol automatically:

        Create STREAM TCP socket::
        socket(AF_INET, SOCK_STREAM)

        Create DGRAM UDP socket::
        socket(AF_INET, SOCK_DGRAM)
        """
        ...

    def close(self) -> Any:
        """Mark the socket closed and release 
        all resources. Once that happens, all 
        future operations on the socket object 
        will fail. The remote end will receive 
        EOF indication if supported by protocol.

        Sockets are automatically closed when they 
        are garbage-collected, but it is recommended 
        to ``close()`` them explicitly as soon you 
        finished working with them.
        """
        ...

    def read(self, size: Optional[int]=None) -> bytes:
        """Read up to *size* bytes from the socket. 
        Return a bytes object. If *size* is not given, 
        it reads all data available from the socket 
        until EOF; as such the method will not return 
        until the socket is closed. This function tries 
        to read as much data as requested 
        (no “short reads”). This may be not possible 
        with non-blocking socket though, and then less 
        data will be returned.
        """
        ...

    def readinto(self, *args, **kwargs) -> Any:
        ...

    def readline(self) -> Any:
        """Read a line, ending in a newline character.

        Return value: the line read.
        """
        ...

    def send(self, bytes) -> Any:
        """Send data to the socket. The socket 
        must be connected to a remote socket. 
        Returns number of bytes sent, which may 
        be smaller than the length of 
        data (“short write”).
        """
        ...

    def write(self, buf) -> int:
        """Write the buffer of bytes to the socket. 
        This function will try to write all data to 
        a socket (no “short writes”). This may be 
        not possible with a non-blocking socket 
        though, and returned value will be less 
        than the length of *buf*.

        Return value: number of bytes written."""
        ...

    def accept(self) -> Any:
        """Accept a connection. The socket 
        must be bound to an address and 
        listening for connections. The 
        return value is a pair (conn, address) 
        where conn is a new socket object 
        usable to send and receive data on 
        the connection, and address is the 
        address bound to the socket on the 
        other end of the connection.
        """
        ...

    def bind(self, address) -> Any:
        """Bind the socket to address. The socket must not already be bound."""
        ...

    def connect(self, address: Union[tuple, list]) -> Any:
        """Connect to a remote socket at address."""
        ...

    def listen(self, backlog: Optional[int] =None) -> Any:
        """Enable a server to accept connections. If 
        *backlog* is specified, it must be at least 0 
        (if it's lower, it will be set to 0); and 
        specifies the number of unaccepted connections 
        that the system will allow before refusing new 
        connections. If not specified, a default 
        reasonable value is chosen.
        """
        ...

    def makefile(self, mode='rb', buffering=0,/) -> Any:
        """Return a file object associated with the socket. 
        The exact returned type depends on the arguments 
        given to ``makefile()``. The support is limited to 
        binary modes only ('rb', 'wb', and 'rwb'). CPython's 
        arguments: encoding, errors and newline are 
        not supported.

        | NOTE: at the moment firmware 1.19.1, MicroPython does
        not support buffered stream, values of *buffering** 
        parameter are ignored and treated as if it 
        was 0 (unbuffered).

        | NOTE: Closing the file object returned 
        by ``makefile()`` WILL close the original 
        socket as well.
        """
        ...

    def recv(self, bufsize) -> Any:
        """Receive data from the socket. 
        The return value is a bytes object 
        representing the data received. The 
        maximum amount of data to be received 
        at once is specified by bufsize.
        """
        ...

    def recvfrom(self, bufsize) -> Any:
        """Receive data from the socket. The return 
        value is a pair (bytes, address) where bytes 
        is a bytes object representing the data received 
        and address is the address of the socket 
        sending the data.
        """
        ...

    def sendall(self, bytes) -> Any:
        """Send all data to the socket. The socket 
        must be connected to a remote socket. Unlike 
        send(), this method will try to send all of 
        data, by sending data chunk by chunk consecutively.

        The behaviour of this method on non-blocking 
        sockets is undefined. Due to this, on MicroPython, 
        it's recommended to use ``write()`` method instead, 
        which has the same “no short writes” policy for 
        blocking sockets, and will return number of bytes 
        sent on non-blocking sockets.
        """
        ...

    def sendto(self, bytes, address) -> Any:
        """Send data to the socket. The socket should not be 
        connected to a remote socket, since the destination 
        socket is specified by address.
        """
        ...

    def setblocking(self, flag) -> Any:
        """Set blocking or non-blocking mode of the socket: 
        if flag is false, the socket is set to non-blocking, 
        else to blocking mode.

        This method is a shorthand for certain 
        ``settimeout()`` calls:

        - ``sock.setblocking(True)`` is equivalent 
        to ``sock.settimeout(None)``

        - ``sock.setblocking(False)`` is equivalent 
        to ``sock.settimeout(0)``
        """
        ...

    def setsockopt(self, level, optname, value) -> Any:
        """Set the value of the given socket option. The 
        needed symbolic constants are defined in the socket 
        module (SO_* etc.). The value can be an integer or 
        a bytes-like object representing a buffer.
        """
        ...

    def settimeout(self, value) -> None:
        """Note: Not every port supports this method, see below.

        Set a timeout on blocking socket operations. The value 
        argument can be a nonnegative floating point number 
        expressing seconds, or None. If a non-zero value is given, 
        subsequent socket operations will raise an ``OSError`` 
        exception if the timeout period value has elapsed before 
        the operation has completed. If zero is given, the socket 
        is put in non-blocking mode. If None is given, the socket 
        is put in blocking mode.

        Not every MicroPython port supports this method. A more 
        portable and generic solution is to use ``select.poll`` 
        object. This allows to wait on multiple objects at the 
        same time (and not just on sockets, but on generic 
        ``stream`` objects which support polling).
        """
        ...

