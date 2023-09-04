from typing import Any


class BLE():
    def __init__(self, *argv, **kwargs) -> None:
        ...

    def active(self, active: bool=..., /) -> bool:
        ...

    def config(self, *args, **kwargs) -> Any:
        """
        Get or set configuration values of the BLE interface. 
        To get a value the parameter name should be quoted as a string, 
        and just one parameter is queried at a time. To set values use 
        the keyword syntax, and one or more parameter can be set at a time.
        """
        ...

    def gap_advertise(self, interval_us, adv_data=None, *, resp_data=None, connectable=True) -> Any:
        """
        Starts advertising at the specified interval (in microseconds). 
        This interval will be rounded down to the nearest 625us. To stop 
        advertising, set interval_us to None.
        """
        ...

    def gap_connect(self, addr_type, addr, scan_duration_ms=2000, min_conn_interval_us=None, max_conn_interval_us=None, /) -> Any:
        ...

    def gap_disconnect(self, conn_handle, /) -> bool:
        ...

    def gap_scan(self, duration_ms, interval_us=1280000, window_us=11250, active=False, /) -> Any:
        ...

    def gattc_discover_characteristics(self, conn_handle, start_handle, end_handle, uuid=None, /) -> Any:
        ...

    def gattc_discover_descriptors(self, conn_handle, start_handle, end_handle, /) -> Any:
        ...

    def gattc_discover_services(self, conn_handle, uuid=None, /) -> Any:
        ...

    def gattc_exchange_mtu(self, conn_handle, /) -> Any:
        ...

    def gattc_read(self, conn_handle, value_handle, /) -> Any:
        ...

    def gattc_write(self, conn_handle, value_handle, data, mode=0, /) -> Any:
        ...

    def gatts_indicate(self, conn_handle, value_handle, data=None, /) -> Any:
        ...

    def gatts_notify(self, conn_handle, value_handle, data=None, /) -> Any:
        ...

    def gatts_read(self, value_handle, /) -> Any:
        """
        Reads the local value for this handle (which has either been written by 
        `gatts_write` or by a remote client).
        """
        ...

    def gatts_register_services(self, services_definition, /) -> Any:
        ...

    def gatts_set_buffer(self, *args, **kwargs) -> Any:
        ...

    def gatts_write(self, value_handle, data, send_update=False, /) -> Any:
        ...

    def irq(self, *args, **kwargs) -> Any:
        """Registers a callback for events from the BLE stack."""
        ...

FLAG_INDICATE = 32 # type: int
FLAG_NOTIFY = 16 # type: int
FLAG_READ = 2 # type: int
FLAG_WRITE = 8 # type: int
FLAG_WRITE_NO_RESPONSE = 4 # type: int

class UUID():
    def __init__(self, value, /) -> None:
        """
        Creates a UUID instance with the specified value.

        The value can be either:

        - A 16-bit integer. e.g. `0x2908`.

        - A 128-bit UUID string. e.g. `'6E400001-B5A3-F393-E0A9-E50E24DCCA9E'`.
        """
        ...
