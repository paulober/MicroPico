"""DS18x20 temperature sensor driver
"""

from .onewire import OneWire


class DS18X20:
    def __init__(self, onewire: OneWire) -> None:
        ...

    def convert_temp(self) -> float:
        """
        Convert the raw temperature data into degrees celsius and return as a fixed point with 2 decimal places.
        """
        ...

    def read_scratch(self, rom: bytearray) -> bytearray:
        """
        Read the scratchpad memory of the addressed device. 9 bytes of data will be returned
        """
        ...

    def read_temp(self, rom: bytearray) -> int:
        """
        Get the temperature reading of the addressed device as degree Celsuis. In 
        case of an CRC error, None is returned.

        Warning: After power up and before a conversion cycle has been performed, 
        the DS18x20 sensors will return the value 85°C. Since this is also a valid 
        return value, the calling app must decide, whether it is a reasonable value 
        in the given context.
        """
        ...

    def scan(self) -> list:
        """
        Return the list of DS18x2x devices on the bus. Only devices with 
        rom type 0x10, 0x22 and 0x22 are selected.
        """
        ...

    def write_scratch(self, rom: bytearray, buf: bytearray) -> None:
        """
        Write to the scratchpad of the addressed devices. data shall be three bytes. 
        The first two bytes are the high and low alarm temperature. The third by is 
        the configuration. See the DS18B20 data sheet for details.
        """
        ...


def const(expr: ...):
    """
    See `from micropython import const`.
    """
    ...
