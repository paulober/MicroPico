"""
Module: 'aioble.__init__' on micropython-v1.20-441-rp2
"""
# MCU: {'ver': 'v1.20-441', 'build': '441', 'sysname': 'rp2', 'platform': 'rp2', 'version': '1.20.0', 'release': '1.20.0', 'port': 'rp2', 'family': 'micropython', 'name': 'micropython', 'machine': 'Raspberry Pi Pico W with RP2040', 'nodename': 'rp2'}
# Stubber: 1.5.7
from typing import Any

def const(*args, **kwargs) -> Any:
    ...

def stop(*args, **kwargs) -> Any:
    ...

def config(*args, **kwargs) -> Any:
    ...


class scan():
    def __init__(self, *argv, **kwargs) -> None:
        ...

    cancel : Any ## <class 'generator'> = <generator>

class Device():
    def __init__(self, *argv, **kwargs) -> None:
        ...

    connect : Any ## <class 'generator'> = <generator>
    def addr_hex(self, *args, **kwargs) -> Any:
        ...


class DeviceDisconnectedError(Exception):
    ...
def log_info(*args, **kwargs) -> Any:
    ...

def log_warn(*args, **kwargs) -> Any:
    ...

def log_error(*args, **kwargs) -> Any:
    ...


class GattError(Exception):
    ...
advertise : Any ## <class 'generator'> = <generator>

class Service():
    def __init__(self, *argv, **kwargs) -> None:
        ...


class Characteristic():
    def __init__(self, *argv, **kwargs) -> None:
        ...

    def read(self, *args, **kwargs) -> Any:
        ...

    def write(self, *args, **kwargs) -> Any:
        ...

    written : Any ## <class 'generator'> = <generator>
    def on_read(self, *args, **kwargs) -> Any:
        ...

    def notify(self, *args, **kwargs) -> Any:
        ...

    indicate : Any ## <class 'generator'> = <generator>

class BufferedCharacteristic():
    def __init__(self, *argv, **kwargs) -> None:
        ...

    def read(self, *args, **kwargs) -> Any:
        ...

    def write(self, *args, **kwargs) -> Any:
        ...

    written : Any ## <class 'generator'> = <generator>
    def on_read(self, *args, **kwargs) -> Any:
        ...

    def notify(self, *args, **kwargs) -> Any:
        ...

    indicate : Any ## <class 'generator'> = <generator>

class Descriptor():
    def __init__(self, *argv, **kwargs) -> None:
        ...

    def read(self, *args, **kwargs) -> Any:
        ...

    def write(self, *args, **kwargs) -> Any:
        ...

    written : Any ## <class 'generator'> = <generator>
    def on_read(self, *args, **kwargs) -> Any:
        ...

def register_services(*args, **kwargs) -> Any:
    ...

ADDR_PUBLIC = 0 # type: int
ADDR_RANDOM = 1 # type: int
