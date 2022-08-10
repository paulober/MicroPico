"""
Module: 'neopixel' on micropython-v1.19.1-rp2
"""
# MCU: {'ver': 'v1.19.1', 'build': '', 'sysname': 'rp2', 'platform': 'rp2', 'version': '1.19.1', 'release': '1.19.1', 'port': 'rp2', 'family': 'micropython', 'name': 'micropython', 'machine': 'Raspberry Pi Pico W with RP2040', 'nodename': 'rp2'}
from typing import Any
from .machine import Pin

def bitstream(*args, **kwargs) -> Any:
    ...


class NeoPixel():
    def __init__(self, pin: Pin, n: int, *, bpp: int=3, timing=1) -> None:
        """Construct an NeoPixel object. The parameters are:

        ``pin`` is a machine.Pin instance.

        ``n`` is the number of LEDs in the strip.

        ``bpp`` is 3 for RGB LEDs, and 4 for RGBW LEDs.

        ``timing`` is 0 for 400KHz, and 1 for 800kHz LEDs (most are 800kHz).
        """
        ...

    def write(self) -> Any:
        """Writes the current pixel data to the strip."""
        ...

    def fill(self, pixel) -> Any:
        """Sets the value of all pixels to the 
        specified pixel value (i.e. an RGB/RGBW tuple)."""
        ...

    ORDER = () # type: tuple

    def __len__(self) -> int:
        """Returns the number of LEDs in the strip."""
        ...

    def __setitem__(self, index, val) -> Any:
        """Set the pixel at index to the value, which is an RGB/RGBW tuple."""
        ...

    def __getitem__(self, index) -> Any:
        """Returns the pixel at index as an RGB/RGBW tuple."""
        ...
