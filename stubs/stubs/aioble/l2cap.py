"""
Module: 'aioble.l2cap' on micropython-v1.20-441-rp2
"""
# MCU: {'ver': 'v1.20-441', 'build': '441', 'sysname': 'rp2', 'platform': 'rp2', 'version': '1.20.0', 'release': '1.20.0', 'port': 'rp2', 'family': 'micropython', 'name': 'micropython', 'machine': 'Raspberry Pi Pico W with RP2040', 'nodename': 'rp2'}
# Stubber: 1.5.7
from typing import Any

def const(*args, **kwargs) -> Any:
    ...

accept : Any ## <class 'generator'> = <generator>
connect : Any ## <class 'generator'> = <generator>
def log_error(*args, **kwargs) -> Any:
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

class L2CAPDisconnectedError(Exception):
    ...

class L2CAPConnectionError(Exception):
    ...

class L2CAPChannel():
    def __init__(self, *argv, **kwargs) -> None:
        ...

    send : Any ## <class 'generator'> = <generator>
    disconnect : Any ## <class 'generator'> = <generator>
    flush : Any ## <class 'generator'> = <generator>
    disconnected : Any ## <class 'generator'> = <generator>
    recvinto : Any ## <class 'generator'> = <generator>
    def available(self, *args, **kwargs) -> Any:
        ...

