"""
Module: 'aioble.client' on micropython-v1.20-441-rp2
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


class GattError(Exception):
    ...
def register_irq_handler(*args, **kwargs) -> Any:
    ...

ble : Any ## <class 'BLE'> = <BLE>

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

class ClientDiscover():
    def __init__(self, *argv, **kwargs) -> None:
        ...


class ClientService():
    def __init__(self, *argv, **kwargs) -> None:
        ...

    def characteristics(self, *args, **kwargs) -> Any:
        ...

    characteristic : Any ## <class 'generator'> = <generator>

class BaseClientCharacteristic():
    def __init__(self, *argv, **kwargs) -> None:
        ...

    read : Any ## <class 'generator'> = <generator>
    write : Any ## <class 'generator'> = <generator>

class ClientCharacteristic():
    def __init__(self, *argv, **kwargs) -> None:
        ...

    read : Any ## <class 'generator'> = <generator>
    write : Any ## <class 'generator'> = <generator>
    def descriptors(self, *args, **kwargs) -> Any:
        ...

    descriptor : Any ## <class 'generator'> = <generator>
    notified : Any ## <class 'generator'> = <generator>
    indicated : Any ## <class 'generator'> = <generator>
    subscribe : Any ## <class 'generator'> = <generator>

class ClientDescriptor():
    def __init__(self, *argv, **kwargs) -> None:
        ...

    read : Any ## <class 'generator'> = <generator>
    write : Any ## <class 'generator'> = <generator>
