from typing import Tuple, Sequence
from machine import Pin

class OneWire:
    """
    OneWire library for MicroPython
    """
    MATCH_ROM = 85
    SEARCH_ROM = 240
    SKIP_ROM = 204

    def __init__(self, pin : Pin):
        ...

    def _search_rom(self, l_rom: bytearray, diff: int) -> Tuple[bytearray, int]:
        pass

    def crc8(self, data:bytearray) -> int:
        """
        Compute CRC
        """
        pass

    def readbit(self) -> int:
        pass

    def readbyte(self) -> int:
        pass

    def readinto(self, buf: bytearray):
        pass

    def reset(self, required:bool=False) -> int:
        """
        Perform the onewire reset function.
        """
        pass

    def scan(self) -> Sequence[bytearray]:
        """
        Return a list of ROMs for all attached devices.
        Each ROM is returned as a bytes object of 8 bytes.
        """
        pass

    def select_rom(self, rom:bytearray):
        """
        Select a specific device to talk to. Pass in rom as a bytearray (8 bytes).
        """
        pass

    def write(self, buf:bytearray):
        pass

    def writebit(self, value:int) -> None:
        pass

    def writebyte(self, value:int) -> None:
        pass


class OneWireError:
    ''

