"""
Module: 'dht' on micropython-v1.19.1-rp2
"""
# MCU: {'ver': 'v1.19.1', 'build': '', 'sysname': 'rp2', 'platform': 'rp2', 'version': '1.19.1', 'release': '1.19.1', 'port': 'rp2', 'family': 'micropython', 'name': 'micropython', 'machine': 'Raspberry Pi Pico W with RP2040', 'nodename': 'rp2'}
from typing import Any
from .rp2 import dht_readinto as rp2_dht_readinto

def dht_readinto(*args, **kwargs) -> Any:
    """This function will be redirected by micropython 
    the the rp2 module containing dht_readinto implementation for rp2 boards.
    """
    return rp2_dht_readinto(*args, **kwargs)


class DHTBase():
    def __init__(self, *argv, **kwargs) -> None:
        ...

    def measure(self, *args, **kwargs) -> Any:
        ...


class DHT11():
    def __init__(self, *argv, **kwargs) -> None:
        ...

    def measure(self, *args, **kwargs) -> Any:
        ...

    def humidity(self, *args, **kwargs) -> Any:
        ...

    def temperature(self, *args, **kwargs) -> Any:
        ...


class DHT22():
    def __init__(self, *argv, **kwargs) -> None:
        ...

    def measure(self, *args, **kwargs) -> Any:
        ...

    def humidity(self, *args, **kwargs) -> Any:
        ...

    def temperature(self, *args, **kwargs) -> Any:
        ...

