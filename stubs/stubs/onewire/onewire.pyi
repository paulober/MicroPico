from machine import Pin
from collections.abc import Sequence

class OneWire:
    """
    OneWire library for MicroPython
    """
    MATCH_ROM = 85
    SEARCH_ROM = 240
    SKIP_ROM = 204

    def __init__(self, pin : Pin):
        ...

    def _search_rom(self, l_rom: bytearray, diff: int) -> tuple[bytearray, int]:
        ...

    def crc8(self, data:bytearray) -> int:
        """
        Compute CRC
        """
        ...

    def readbit(self) -> int:
        ...

    def readbyte(self) -> int:
        ...

    def readinto(self, buf: bytearray):
        ...

    def reset(self, required:bool = False) -> bool | int:
        """
        Perform the onewire reset function.
        """
        ...

    def scan(self) -> Sequence[bytearray]:
        """
        Return a list of ROMs for all attached devices.
        Each ROM is returned as a bytes object of 8 bytes.
        """
        ...

    def select_rom(self, rom:bytearray):
        """
        Select a specific device to talk to. Pass in rom as a bytearray (8 bytes).
        """
        ...

    def write(self, buf:bytearray | str):
        ...

    def writebit(self, value:int) -> None:
        ...

    def writebyte(self, value:int) -> None:
        ...


class OneWireError(Exception):
    ...
