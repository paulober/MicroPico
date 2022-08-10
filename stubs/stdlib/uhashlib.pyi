"""
Module: 'uhashlib' on micropython-v1.19.1-rp2
"""
# MCU: {'ver': 'v1.19.1', 'build': '', 'sysname': 'rp2', 'platform': 'rp2', 'version': '1.19.1', 'release': '1.19.1', 'port': 'rp2', 'family': 'micropython', 'name': 'micropython', 'machine': 'Raspberry Pi Pico W with RP2040', 'nodename': 'rp2'}
from typing import Any, Optional


class sha1():
    """
    A previous generation algorithm. Not recommended for new 
    usages, but SHA1 is a part of number of Internet standards 
    and existing applications, so boards targeting network 
    connectivity and interoperability will try to provide this.
    """

    def __init__(self, *argv, **kwargs) -> None:
        """Create an SHA1 hasher object and optionally feed data into it."""
        ...

    def update(self, data) -> None:
        """Feed more binary data into hash."""
        ...

    def digest(self, *args, **kwargs) -> bytes:
        """Return hash for all data passed through hash, 
        as a bytes object. After this method is called, 
        more data cannot be fed into the hash any longer.
        """
        ...

    def hexdigest(self) -> None:
        """This method is NOT implemented. 
        Use ``binascii.hexlify(hash.digest())`` 
        to achieve a similar effect.
        """
        raise NotImplementedError()


class sha256():
    """
    The current generation, modern hashing algorithm 
    (of SHA2 series). It is suitable for 
    cryptographically-secure purposes. Included 
    in the MicroPython core and any board is recommended 
    to provide this, unless it has particular code 
    size constraints.
    """

    def __init__(self, data: Optional[Any] = ...) -> None:
        """Create an SHA256 hasher object and optionally feed data into it."""
        ...

    def update(self, data) -> None:
        """Feed more binary data into hash."""
        ...

    def digest(self) -> bytes:
        """Return hash for all data passed through hash, as a 
        bytes object. After this method is called, more data 
        cannot be fed into the hash any longer.
        """
        ...

    def hexdigest(self) -> None:
        """This method is NOT implemented. 
        Use ``binascii.hexlify(hash.digest())`` 
        to achieve a similar effect.
        """
        raise NotImplementedError()
