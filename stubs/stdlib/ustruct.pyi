"""
Module: 'ustruct' on micropython-v1.19.1-rp2
"""
# MCU: {'ver': 'v1.19.1', 'build': '', 'sysname': 'rp2', 'platform': 'rp2', 'version': '1.19.1', 'release': '1.19.1', 'port': 'rp2', 'family': 'micropython', 'name': 'micropython', 'machine': 'Raspberry Pi Pico W with RP2040', 'nodename': 'rp2'}
from typing import Any

def calcsize(fmt: str) -> int:
    """Return the number of bytes needed to store the given *fmt*."""
    ...

def pack(fmt: str, v1: Any, *vn: Any) -> Any:
    """Pack the values v1, v2, … according to the format 
    string fmt. The return value is a bytes object 
    encoding the values.
    """
    ...

def pack_into(fmt: str, buffer: Any, offset: int, v1: Any, *vn: Any) -> Any:
    """Pack the values v1, v2, … according to the format string fmt into a buffer 
    starting at offset. offset may be negative to count from the end of buffer.
    """
    ...

def unpack(fmt: str, data: Any) -> tuple[Any]:
    """Unpack from the data according to the format string *fmt*. 
    The return value is a tuple of the unpacked values.
    """
    ...

def unpack_from(fmt: str, data: Any, offset=0, /) -> Any:
    """Unpack from the *data* starting at offset according to the 
    format string *fmt*. offset may be negative to count from the 
    end of buffer. The return value is a tuple of the unpacked 
    values.
    """
    ...
