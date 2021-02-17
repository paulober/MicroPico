# Copyright (c) 2020, Digi International Inc.
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in
# all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.

import machine
#import usocket
from typing import List, Iterator, Optional, Tuple, Union

_Waitable = machine.UART
_SelectList = Union[List[_Waitable], Tuple[_Waitable]]
_PollTuple = Tuple[_Waitable, int]

__all__ = ("POLLIN", "POLLOUT", "POLLERR", "POLLHUP", "select", "poll")

POLLIN: int = ...
POLLOUT: int = ...
POLLERR: int = ...
POLLHUP: int = ...


def select(
    rlist: _SelectList,
    wlist: _SelectList,
    xlist: _SelectList,
    timeout: Optional[float] = None,
    /  # positional arguments only
) -> Tuple[List[_Waitable], List[_Waitable], List[_Waitable]]:
    """
    Wait for activity on a set of objects.

    This function is provided for compatibility and is not efficient.
    Use ``select.poll()`` instead.

    The first three arguments are sequences of "waitable objects": on XBee
    and XBee 3 Cellular products, these include sockets and the ``machine.UART``
    type. Empty sequences are allowed.

    The optional ``timeout`` argument specifies the time-out as a floating point
    number in seconds. When the ``timeout`` argument is omitted, the function
    blocks until at least one waitable object is ready. A ``timeout`` of zero
    specifies a poll and will not block.

    The return value is a length-3 tuple of lists of objects that are ready.
    These lists are subsets of the first three arguments to ``select()``.
    When the timeout is reached without an object becoming ready, three
    empty lists are returned.

    **Note:** This is only available on XBee and XBee 3 Cellular products
    with firmware ending in 15 or newer.

    :param rlist: List or tuple of "waitable objects". If one or more of the
        objects in rlist becomes ready for reading, those objects will be
        included in the first returned list.
    :param wlist: List or tuple of "waitable objects". If one or more of the
        objects in wlist becomes ready for writing, those objects will be
        included in the second returned list.
    :param wlist: List or tuple of "waitable objects". If one or more of the
        objects in xlist enter an "exceptional condition" (i.e. closed),
        those objects will be included in the third returned list.
    :param timeout: Optional timeout, in seconds, controlling how long the
        select call can block. If omitted, select will block indefinitely
        until at least one waitable object is ready.
    :returns: A tuple of three lists of ready waitable objects, mirroring the
        argument list (rlist, wlist, xlist). If select timed out, all three
        lists will be empty.
    """
    ...


class _poll:
    """
    Polling object for more efficient waiting for ready waitable objects.

    Polling objects can only be created using ``select.poll()``.
    """

    def register(
        self,
        obj: _Waitable,
        eventmask: int = (POLLIN | POLLOUT),
        /  # positional arguments only
    ) -> None:
        """Register a waitable object with the polling object.

        Future calls to the ``poll()`` method will check whether the
        waitable object has any pending I/O events.

        ``eventmask`` is an optional bitmask describing the type of events
        you want to check for, and can be a combination of these constants:

        * ``POLLIN``: There is data to read.
        * ``POLLOUT``: Ready for output; writing will not block.
        * ``POLLERR``: Error condition of some sort (i.e. closed).

        It is okay to call this function multiple times for the same ``obj``.
        Successive calls will behave as ``modify()``.

        :param obj: A "waitable object".
        :param eventmask: A bitmask of events to check for.
        """
        ...

    def unregister(self, obj: _Waitable, /) -> None:
        """Unregister ``obj`` from polling."""
        ...

    def modify(self, obj: _Waitable, eventmask: int, /) -> None:
        """Update the ``eventmask`` for ``obj``.

        :raises OSError ENOENT: ``obj`` is not registered.
        """
        ...

    def poll(self, timeout: Optional[float] = None, /) -> List[_PollTuple]:
        """
        Wait for at least one of the registered objects to become ready
        or have an exceptional condition, with optional timeout in milliseconds.

        ``poll()`` returns a list of (obj, eventmask) tuples. Note that
        the flags ``POLLHUP`` and ``POLLERR`` can be returned at any time,
        even if they were not asked for), and must be acted on accordingly
        (the corresponding object unregistered and likely closed),
        because otherwise all future calls to ``poll()`` may return immediately
        with these flags set again.

        In case of timeout, an empty list is returned.

        :param timeout: Optional timeout, in milliseconds, controlling how long
            the select call can block. If omitted, select will block
            indefinitely until at least one waitable object is ready.
        :returns: A list of (obj, eventmask) tuples.
        """
        ...

    def ipoll(
        self,
        timeout: Optional[float] = None,
        flags: int = 0,
        /
    ) -> Iterator[_PollTuple]:
        """Like ``poll()``, but returns an iterator instead.

        This method provides an efficient, allocation-free way to poll
        on waitable objects.

        Note that the returned iterator yields a **callee-owned tuple**,
        meaning that the tuple object will be reused on each iteration.

        **One-shot behavior:**

        If ``flags`` is set to the value ``1``, one-shot behavior for events
        is employed. Objects with new I/O events will have their configured
        event masks automatically cleared (equivalent to ``modify(obj, 0)``),
        so that new events for the object will not be processed until a new
        mask is set using ``modify()``.

        :param timeout: Optional timeout, in milliseconds, controlling how long
            the select call can block. If omitted, select will block
            indefinitely until at least one waitable object is ready.
        :param flags: Determines whether one-shot behavior is employed.
        :returns: An iterator which yields a callee-owned tuple of
            (obj, eventmask).
        """
        ...


def poll() -> _poll:
    """
    Create a new polling object, which can be used to wait for activity
    on a set of objects.

    **Note:** This is only available on XBee and XBee 3 Cellular products
    with firmware ending in 15 or newer.
    """
    ...