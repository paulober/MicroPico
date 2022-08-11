"""
Module: 'ucollections' on micropython-v1.19.1-rp2
"""
# MCU: {'ver': 'v1.19.1', 'build': '', 'sysname': 'rp2', 'platform': 'rp2', 'version': '1.19.1', 'release': '1.19.1', 'port': 'rp2', 'family': 'micropython', 'name': 'micropython', 'machine': 'Raspberry Pi Pico W with RP2040', 'nodename': 'rp2'}
from typing import Any


class OrderedDict(dict):
    """``dict`` type subclass which remembers and 
    preserves the order of keys added. When ordered 
    dict is iterated over, keys/items are returned 
    in the order they were added:
    """

    @classmethod
    def fromkeys(cls, *args, **kwargs) -> Any:
        ...


class deque():
    def __init__(self, iterable, maxlen: int, flags: int|Any|None=None) -> None:
        """Deques (double-ended queues) are a list-like container that 
        support O(1) appends and pops from either side of the deque. New 
        deques are created using the following arguments:

        *iterable* must be the empty tuple, and the new deque is created empty.

        *maxlen* must be specified and the deque will be bounded to this maximum length. Once the deque is full, any new items added will discard items from the opposite end.

        The optional *flags* can be 1 to check for overflow when adding items.


        As well as supporting ``bool`` and ``len``, deque objects have the following methods
        """
        ...

    def append(self, x: Any) -> Any:
        """Add x to the right side of the deque. Raises 
        IndexError if overflow checking is enabled 
        and there is no more room left.
        """
        ...

    def popleft(self) -> Any:
        ...

    def __len__(self) -> int:
        ...

    def __bool__(self) -> bool:
        ...
    __nonzero__=__bool__


def namedtuple(name: str, fields: tuple) -> Any:
    ...

