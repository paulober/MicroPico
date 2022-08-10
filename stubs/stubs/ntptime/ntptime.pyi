"""
Module: 'ntptime' on micropython-v1.19.1-rp2
"""
# MCU: {'ver': 'v1.19.1', 'build': '', 'sysname': 'rp2', 'platform': 'rp2', 'version': '1.19.1', 'release': '1.19.1', 'port': 'rp2', 'family': 'micropython', 'name': 'micropython', 'machine': 'Raspberry Pi Pico W with RP2040', 'nodename': 'rp2'}
from typing import Any

def time() -> int:
    """Retrieve time from NTP server and return it expressed in seconds since the Epoch."""
    ...

host = 'pool.ntp.org' # type: str
"""host constant set as default on micropython raspberry pi pico w firmware"""
def settime() -> None:
    """Get time from ``ntptime.time()`` and parse it into ``machine.RTC().datetime()`` module.
    
    NOTE: There is currently not timezone support in MicroPython, 
    and the RTC is set in UTC time.
    """
    ...

