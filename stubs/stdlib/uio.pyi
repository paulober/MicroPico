"""
Module: 'uio' on micropython-v1.19.1-rp2
"""
# MCU: {'ver': 'v1.19.1', 'build': '', 'sysname': 'rp2', 'platform': 'rp2', 'version': '1.19.1', 'release': '1.19.1', 'port': 'rp2', 'family': 'micropython', 'name': 'micropython', 'machine': 'Raspberry Pi Pico W with RP2040', 'nodename': 'rp2'}
from typing import Any

def open(name, mode='r', **kwargs) -> Any:
    """Open a file. Builtin ``open()`` function is aliased 
    to this function. All ports (which provide access to file 
    system) are required to support mode parameter, but support 
    for other arguments vary by port.
    """
    ...


class BytesIO():
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

    def write(self, *args, **kwargs) -> Any:
        ...

    def flush(self, *args, **kwargs) -> Any:
        ...

    def getvalue(self) -> Any:
        """Get the current contents of the underlying buffer which holds data."""
        ...

    def seek(self, *args, **kwargs) -> Any:
        ...

    def tell(self, *args, **kwargs) -> Any:
        ...


class IOBase():
    def __init__(self, *argv, **kwargs) -> None:
        ...


class StringIO():
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

    def write(self, *args, **kwargs) -> Any:
        ...

    def flush(self, *args, **kwargs) -> Any:
        ...

    def getvalue(self, *args, **kwargs) -> Any:
        ...

    def seek(self, *args, **kwargs) -> Any:
        ...

    def tell(self, *args, **kwargs) -> Any:
        ...

