"""
Module: 'aioble.server' on micropython-v1.20-441-rp2
"""
# MCU: {'ver': 'v1.20-441', 'build': '441', 'sysname': 'rp2', 'platform': 'rp2', 'version': '1.20.0', 'release': '1.20.0', 'port': 'rp2', 'family': 'micropython', 'name': 'micropython', 'machine': 'Raspberry Pi Pico W with RP2040', 'nodename': 'rp2'}
# Stubber: 1.5.7
from typing import Any

def const(*args, **kwargs) -> Any:
    ...


class deque():
    def __init__(self, *argv, **kwargs) -> None:
        ...

    def append(self, *args, **kwargs) -> Any:
        ...

    def popleft(self, *args, **kwargs) -> Any:
        ...

def log_info(*args, **kwargs) -> Any:
    ...

def log_warn(*args, **kwargs) -> Any:
    ...

def log_error(*args, **kwargs) -> Any:
    ...


class GattError(Exception):
    ...

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

def ensure_active(*args, **kwargs) -> Any:
    ...

def register_irq_handler(*args, **kwargs) -> Any:
    ...

ble : Any ## <class 'BLE'> = <BLE>

class DeviceTimeout():
    def __init__(self, *argv, **kwargs) -> None:
        ...


class DeviceConnection():
    def __init__(self, *argv, **kwargs) -> None:
        ...

    disconnect : Any ## <class 'generator'> = <generator>
    def timeout(self, *args, **kwargs) -> Any:
        ...

    device_task : Any ## <class 'generator'> = <generator>
    disconnected : Any ## <class 'generator'> = <generator>
    def is_connected(self, *args, **kwargs) -> Any:
        ...

    service : Any ## <class 'generator'> = <generator>
    def services(self, *args, **kwargs) -> Any:
        ...

    pair : Any ## <class 'generator'> = <generator>
    exchange_mtu : Any ## <class 'generator'> = <generator>
    l2cap_accept : Any ## <class 'generator'> = <generator>
    l2cap_connect : Any ## <class 'generator'> = <generator>

class BaseCharacteristic():
    def __init__(self, *argv, **kwargs) -> None:
        ...

    def read(self, *args, **kwargs) -> Any:
        ...

    def write(self, *args, **kwargs) -> Any:
        ...

    written : Any ## <class 'generator'> = <generator>
    def on_read(self, *args, **kwargs) -> Any:
        ...

