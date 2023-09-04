from typing import Any

def const(*args, **kwargs) -> Any:
    ...


class Device():
    def __init__(self, *argv, **kwargs) -> None:
        ...

    connect : Any ## <class 'generator'> = <generator>
    def addr_hex(self, *args, **kwargs) -> Any:
        ...


class DeviceDisconnectedError(Exception):
    ...

def log_error(*args, **kwargs) -> Any:
    ...

def register_irq_handler(*args, **kwargs) -> Any:
    ...

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
