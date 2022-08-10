"""
Module: 'ssl' on micropython-v1.19.1-rp2
"""
# MCU: {'ver': 'v1.19.1', 'build': '', 'sysname': 'rp2', 'platform': 'rp2', 'version': '1.19.1', 'release': '1.19.1', 'port': 'rp2', 'family': 'micropython', 'name': 'micropython', 'machine': 'Raspberry Pi Pico W with RP2040', 'nodename': 'rp2'}
from typing import Any

from .usocket import socket

CERT_NONE = 0 # type: int
"""Supported value for cert_reqs parameter"""
CERT_OPTIONAL = 1 # type: int
"""Supported value for cert_reqs parameter"""
CERT_REQUIRED = 2 # type: int
"""Supported value for cert_reqs parameter"""

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
    ...
