from typing import Any, Optional
from ubluetooth import BLE

def const(*args, **kwargs) -> Any:
    ...


class scan():
    def __init__(self, duration_ms, interval_us=None, window_us=None, active=False):
        ...

    async def cancel(self) -> None:
        ...

def log_info(*args, **kwargs) -> Any:
    ...

def log_warn(*args, **kwargs) -> Any:
    ...

def log_error(*args, **kwargs) -> Any:
    ...

def ensure_active(*args, **kwargs) -> Any:
    ...

def register_irq_handler(*args, **kwargs) -> Any:
    ...

ble : BLE

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

class ScanResult():
    def __init__(self, device) -> None:
        ...

    def name(self) -> Optional[str]:
        ...

    def services(self) -> Any:
        ...

    def manufacture(self, filter=None) -> Any:
        ...
