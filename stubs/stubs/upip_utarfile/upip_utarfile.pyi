"""
Module: 'upip_utarfile' on micropython-v1.19.1-rp2
"""
# MCU: {'ver': 'v1.19.1', 'build': '', 'sysname': 'rp2', 'platform': 'rp2', 'version': '1.19.1', 'release': '1.19.1', 'port': 'rp2', 'family': 'micropython', 'name': 'micropython', 'machine': 'Raspberry Pi Pico W with RP2040', 'nodename': 'rp2'}
from typing import Any
import uctypes

DIRTYPE = 'dir' # type: str

class TarFile():
    def __init__(self, name=None, fileobj=None) -> None:
        ...

    def next(self) -> TarInfo|None:
        ...

    def extractfile(self, tarinfo: TarInfo) -> Any:
        ...

    def __iter__(self) -> TarFile:
        ...

    def __next__(self) -> Any:
        """Could raise StopIteration"""
        ...


class FileSection():
    def __init__(self, f, content_len: int, aligned_len: int) -> None:
        ...

    def read(self, sz=65536) -> bytes | Any:
        ...

    def readinto(self, buf) -> Any:
        ...

    def skip(self) -> Any:
        ...


class TarInfo():
    def __str__(self) -> str:
        ...

def roundup(val, align) -> Any:
    ...

TAR_HEADER = {
    "name": (uctypes.ARRAY | 0, uctypes.UINT8 | 100),
    "size": (uctypes.ARRAY | 124, uctypes.UINT8 | 11),
} # type: dict
REGTYPE = 'file' # type: str
