"""
Module: 'uselect' on micropython-v1.19.1-rp2
"""
# MCU: {'ver': 'v1.19.1', 'build': '', 'sysname': 'rp2', 'platform': 'rp2', 'version': '1.19.1', 'release': '1.19.1', 'port': 'rp2', 'family': 'micropython', 'name': 'micropython', 'machine': 'Raspberry Pi Pico W with RP2040', 'nodename': 'rp2'}
from typing import Any, Iterator, Optional

POLLERR = 8 # type: int
POLLHUP = 16 # type: int
POLLIN = 1 # type: int
POLLOUT = 4 # type: int

class _poll:
    """This class does not exist like so in current firmware. 
    It's only for linting and autocompletion purposes.

    ``uselect.poll()`` returns ``<class 'poll'>`` type with these methods 
    on current firmware.
    """

    def ipoll(self, timeout: int=-1, flags=0,/) -> Iterator[Any]:
        """Like poll.poll(), but instead returns an iterator which 
        yields a callee-owned tuple. This function provides an 
        efficient, allocation-free way to poll on streams.
        """
        ...

    def modify(self, obj: Any, eventmask: Any) -> Any:
        """Modify the eventmask for obj. If obj is not registered, 
        ``OSError`` is raised with error of ENOENT.
        """
        ...

    def poll(self, timeout: int = -1, /) -> Any:
        """Wait for at least one of the registered objects to become 
        ready or have an exceptional condition, with optional timeout 
        in milliseconds (if timeout arg is not specified or -1, 
        there is no timeout).
        """
        ...

    def register(self, obj: Any, eventmask: int= POLLIN | POLLOUT) -> Any:
        """Register stream obj for polling. eventmask is logical OR of:

        - ``select.POLLIN`` - data available for reading
        - ``select.POLLOUT`` - more data can be written
        """
        ...

    def unregister(self, obj: Any) -> None:
        """Unregister obj from polling."""
        ...


def poll() -> _poll:
    """Create an instance of the Poll class."""
    ...

def select(rlist, wlist, xlist, timeout: Any = ...) -> Any:
    """Wait for activity on a set of objects.

    This function is provided by some MicroPython ports 
    for compatibility and is not efficient. Usage of 
    Poll is recommended instead.
    """
    ...

