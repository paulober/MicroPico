"""
Module: 'ujson' on micropython-v1.19.1-rp2
"""
# MCU: {'ver': 'v1.19.1', 'build': '', 'sysname': 'rp2', 'platform': 'rp2', 'version': '1.19.1', 'release': '1.19.1', 'port': 'rp2', 'family': 'micropython', 'name': 'micropython', 'machine': 'Raspberry Pi Pico W with RP2040', 'nodename': 'rp2'}
from typing import Any, Optional

def dump(obj, stream, separators=None) -> str:
    """Serialise obj to a JSON string, writing it to the given *stream*."""
    ...

def dumps(obj, separators=None) -> str:
    ...

def load(stream) -> Any:
    """Parse the given stream, interpreting it as a JSON string and 
    deserialising the data to a Python object. The 
    resulting object is returned.
    """
    ...

def loads(str: str) -> Any:
    """Parse the JSON str and return an object. 
    Raises ``ValueError`` if the string is not correctly formed.
    """
    ...
