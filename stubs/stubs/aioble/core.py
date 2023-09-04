from typing import Any
from ubluetooth import BLE

def stop() -> None:
    ...

def config(*args, **kwargs) -> Any:
    ...

def log_info(*args, **kwargs) -> Any:
    ...

def log_warn(*args, **kwargs) -> Any:
    ...

def log_error(*args, **kwargs) -> Any:
    ...


class GattError(Exception):
    ...
def ensure_active(*args, **kwargs) -> Any:
    ...

def register_irq_handler(irq, shutdown) -> None:
    ...

def ble_irq(event, data) -> Any:
    ...

log_level = 1 # type: int
ble: BLE
