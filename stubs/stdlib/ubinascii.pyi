"""
Module: 'ubinascii' on micropython-v1.19.1-rp2
"""
# MCU: {'ver': 'v1.19.1', 'build': '', 'sysname': 'rp2', 'platform': 'rp2', 'version': '1.19.1', 'release': '1.19.1', 'port': 'rp2', 'family': 'micropython', 'name': 'micropython', 'machine': 'Raspberry Pi Pico W with RP2040', 'nodename': 'rp2'}
from typing import Any

def a2b_base64(data: str) -> bytes:
    """Decode base64-encoded data, ignoring invalid characters 
    in the input. Conforms to RFC 2045 s.6.8. Returns 
    a bytes object.
    """
    ...

def b2a_base64(data: Any, *, newline: bool=True) -> bytes:
    """Encode binary data in base64 format, as in RFC 3548. 
    Returns the encoded data followed by a newline character 
    if *newline* is true, as a bytes object.
    """
    ...

def crc32(data: Any, value: Any = ...) -> Any:
    """Compute CRC-32, the unsigned 32-bit checksum of data, 
    starting with an initial CRC of value. The default initial 
    CRC is zero. The algorithm is consistent with the ZIP file 
    checksum. Since the algorithm is designed for use as a 
    checksum algorithm, it is not suitable for use as a 
    general hash algorithm.

    ---
    © The Python Software Foundation.
    >> https://docs.python.org/3.9/library/binascii.html
    """
    ...

def hexlify(data: Any, sep: Any = ...) -> bytes:
    """Convert the bytes in the data object to a hexadecimal 
    representation. Returns a bytes object.

    If the additional argument *sep* is supplied it is used as 
    a separator between hexadecimal values.
    """
    ...

def unhexlify(data: Any) -> str:
    """Convert hexadecimal data to binary representation. 
    Returns bytes string. (i.e. inverse of hexlify)
    """
    ...

