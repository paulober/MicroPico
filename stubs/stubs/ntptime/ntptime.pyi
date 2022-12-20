"""
Module: 'ntptime'
"""

def time() -> int:
    """Retrieve time from NTP server and return it expressed in seconds since the Epoch."""
    ...

timeout = 1 # type: int
host = 'pool.ntp.org' # type: str
"""host constant set as default on micropython raspberry pi pico w firmware"""

def settime() -> None:
    """Get time from ``ntptime.time()`` and parse it into ``machine.RTC().datetime()`` module.
    
    NOTE: There is currently not timezone support in MicroPython, 
    and the RTC is set in UTC time.
    """
    ...

