"""
Module: 'uheapq' on micropython-v1.19.1-rp2
"""
# MCU: {'ver': 'v1.19.1', 'build': '', 'sysname': 'rp2', 'platform': 'rp2', 'version': '1.19.1', 'release': '1.19.1', 'port': 'rp2', 'family': 'micropython', 'name': 'micropython', 'machine': 'Raspberry Pi Pico W with RP2040', 'nodename': 'rp2'}
from typing import Any

def heapify(x: list) -> Any:
    """Convert the list ``x`` into a heap. This is an in-place operation."""
    ...

def heappop(heap) -> Any:
    """Pop the first item from the ``heap``, and return it. 
    Raise ``IndexError`` if ``heap`` is empty.
    
    The returned item will be the smallest item in the ``heap``."""
    ...

def heappush(heap, item) -> Any:
    """Push the ``item`` onto the ``heap``."""
    ...

