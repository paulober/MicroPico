"""
Module: 'lwip' on micropython-v1.19.1-rp2
"""
# MCU: {'ver': 'v1.19.1', 'build': '', 'sysname': 'rp2', 'platform': 'rp2', 'version': '1.19.1', 'release': '1.19.1', 'port': 'rp2', 'family': 'micropython', 'name': 'micropython', 'machine': 'Raspberry Pi Pico W with RP2040', 'nodename': 'rp2'}

from typing import Any


AF_INET = 2 # type: int
AF_INET6 = 10 # type: int
IPPROTO_IP = 0 # type: int
IP_ADD_MEMBERSHIP = 1024 # type: int
SOCK_DGRAM = 2 # type: int
SOCK_RAW = 3 # type: int
SOCK_STREAM = 1 # type: int
SOL_SOCKET = 1 # type: int
SO_REUSEADDR = 4 # type: int

def callback() -> Any:
    ...

def getaddrinfo(*args, **kwargs) -> Any:
    ...

def print_pcbs(*args, **kwargs) -> Any:
    ...

def reset(*args, **kwargs) -> Any:
    ...


class socket():
    def __init__(self, *argv, **kwargs) -> None:
        ...

    def close(self, *args, **kwargs) -> Any:
        ...

    def read(self, *args, **kwargs) -> Any:
        ...

    def readinto(self, *args, **kwargs) -> Any:
        ...

    def readline(self, *args, **kwargs) -> Any:
        ...

    def send(self, *args, **kwargs) -> Any:
        ...

    def write(self, *args, **kwargs) -> Any:
        ...

    def accept(self, *args, **kwargs) -> Any:
        ...

    def bind(self, *args, **kwargs) -> Any:
        ...

    def connect(self, *args, **kwargs) -> Any:
        ...

    def listen(self, *args, **kwargs) -> Any:
        ...

    def makefile(self, *args, **kwargs) -> Any:
        ...

    def recv(self, *args, **kwargs) -> Any:
        ...

    def recvfrom(self, *args, **kwargs) -> Any:
        ...

    def sendall(self, *args, **kwargs) -> Any:
        ...

    def sendto(self, *args, **kwargs) -> Any:
        ...

    def setblocking(self, *args, **kwargs) -> Any:
        ...

    def setsockopt(self, *args, **kwargs) -> Any:
        ...

    def settimeout(self, *args, **kwargs) -> Any:
        ...

