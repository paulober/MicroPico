"""
Module: 'ssl' on micropython-v1.19.1-rp2
"""
# MCU: {'ver': 'v1.19.1', 'build': '', 'sysname': 'rp2', 'platform': 'rp2', 'version': '1.19.1', 'release': '1.19.1', 'port': 'rp2', 'family': 'micropython', 'name': 'micropython', 'machine': 'Raspberry Pi Pico W with RP2040', 'nodename': 'rp2'}
from usocket import socket

CERT_NONE = 0 # type: int
"""Supported value for cert_reqs parameter"""
CERT_OPTIONAL = 1 # type: int
"""Supported value for cert_reqs parameter"""
CERT_REQUIRED = 2 # type: int
"""Supported value for cert_reqs parameter"""
PROTOCOL_TLS_CLIENT = 0 # type: int
PROTOCOL_TLS_SERVER = 1 # type: int

class SSLContext():
    def __init__(self, protocol: int, /) -> None:
        """
        Create a new SSLContext instance. The protocol argument must be one of the PROTOCOL_* constants.
        """
        ...

    def wrap_socket(
            self,
            sock, 
            *, 
            server_side=False, 
            do_handshake_on_connect=True, 
            server_hostname=None) -> SSLContext:
        """
        Takes a stream sock (usually socket.socket instance of SOCK_STREAM type), and returns 
        an instance of ssl.SSLSocket, wrapping the underlying stream. The returned object has the 
        usual stream interface methods like read(), write(), etc.

        - `server_side` selects whether the wrapped socket is on the server or client side. 
        A server-side SSL socket should be created from a normal socket returned from accept() 
        on a non-SSL listening server socket.

        - `do_handshake_on_connect` determines whether the handshake is done as part of the 
        `wrap_socket` or whether it is deferred to be done as part of the initial reads or 
        writes For blocking sockets doing the handshake immediately is standard. For 
        non-blocking sockets (i.e. when the sock passed into `wrap_socket` is in 
        non-blocking mode) the handshake should generally be deferred because otherwise 
        `wrap_socket` blocks until it completes. Note that in AXTLS the handshake can be 
        deferred until the first read or write but it then blocks until completion.

        - `server_hostname` is for use as a client, and sets the hostname to check 
        against the received server certificate. It also sets the name for Server 
        Name Indication (SNI), allowing the server to present the proper certificate.
        """
        ...

def wrap_socket(
    sock, 
    server_side=False, 
    keyfile=None, 
    certfile=None, 
    cert_reqs=CERT_NONE, 
    cadata=None, 
    server_hostname=None, 
    do_handshake=True
    ) -> socket:
    """
    Wrap the given sock and return a new wrapped-socket object. 
    The implementation of this function is to first create an `SSLContext`
    and then call the SSLContext.wrap_socket method on that context object. 
    The arguments sock, server_side and server_hostname are passed through 
    unchanged to the method call. The argument do_handshake is passed through 
    as `do_handshake_on_connect`. The remaining arguments have the following 
    behaviour:

    - cert_reqs determines whether the peer (server or client) must present 
    a valid certificate. Note that for mbedtls based ports, `ssl.CERT_NONE` 
    and `ssl.CERT_OPTIONAL` will not validate any certificate, 
    only `ssl.CERT_REQUIRED` will.
    
    - `cadata` is a bytes object containing the CA certificate chain 
    (in DER format) that will validate the peer’s certificate. 
    Currently only a single DER-encoded certificate is supported.
    
    Depending on the underlying module implementation in a particular 
    MicroPython port, some or all keyword arguments above may be not supported.
    """
    ...
