from typing import Any


class CancelledError(BaseException): ...
class TimeoutError(Exception): ...

class SingletonGenerator:
    def __init__(self) -> None: ...
    def __iter__(self) -> Any: ...
        #   0: return self
        # ? 0: return self
    def __next__(self) -> None: ...
def sleep_ms(t: Any, sgen: Any=SingletonGenerator()) -> Any: ...
    #   0: return sgen
    # ? 0: return sgen
def sleep(t: Any) -> Any: ...
    #   0: return sleep_ms(int(t*))
    # ? 0: return sleep_ms(int(t*))
class IOQueue:
    def __init__(self) -> None: ...
    def _enqueue(self, s: Any, idx: Any) -> None: ...
    def _dequeue(self, s: Any) -> None: ...
    def queue_read(self, s: Any) -> None: ...
    def queue_write(self, s: Any) -> None: ...
    def remove(self, task: Any) -> None: ...
    def wait_io_event(self, dt: Any) -> None: ...
def _promote_to_task(aw: Any) -> Any: ...
def create_task(coro: Any) -> Any: ...
    #   0: return t
    # ? 0: return t
def run_until_complete(main_task: Any) -> Any: ...
    #   0: return
    #   0: return 
    #   1: return er.value
    # ? 1: return er.value
def run(coro: Any) -> Any:
    #   0: return run_until_complete(create_task(coro))
    # ? 0: return run_until_complete(create_task(coro))
    ...

class Loop:
    def create_task(self, coro: Any) -> Any:
        #   0: return create_task(coro)
        # ? 0: return create_task(coro)
        ...
       
    def run_forever(self) -> None:
        ...

    def run_until_complete(self, aw: Any) -> Any:
        #   0: return run_until_complete(_promote_to_task(aw))
        # ? 0: return run_until_complete(_promote_to_task(aw))
        ...

    def stop(self) -> None:
        ...

    def close(self) -> None:
        ...

    def set_exception_handler(self, handler: Any) -> None:
        ...

    def get_exception_handler(self) -> Any:
        #   0: return Loop._exc_handler
        # ? 0: return Loop._exc_handler
        ...

    def default_exception_handler(self, loop: Any, context: Any) -> None:
        ...

    def call_exception_handler(self, context: Any) -> None:
        ...

def get_event_loop(runq_len: Any, waitq_len: Any) -> Any: ...
    #   0: return Loop
    # ? 0: return Loop
def new_event_loop() -> Any: ...
    #   0: return Loop
    # ? 0: return Loop

class TaskQueue:
    ''
    def __init__(self):
        ...

    def peek(self) -> Any:
        ...

    def push_sorted(self, v, key):
        ...

    def push_head(self, v):
        ...

    def pop_head(self) -> Any:
        ...

    def remove(self, v):
        ...


def ticks() -> int:
    """
    Returns the uptime of the module in milliseconds.

    :return: The uptime of the module in milliseconds.
    """
    ...

def ticks_add(ticks: int, delta: int) -> int:
    """
    Offsets ticks value by a given number, which can be either positive or
    negative. Given a ticks value, this function allows to calculate ticks
    value delta ticks before or after it, following modular-arithmetic
    definition of tick values (see ``ticks_ms()``).

    This method is useful for calculating deadlines for events/tasks.

    **Note**: You must use ``ticks_diff()`` function to work with deadlines.

    :param ticks: Number obtained from a direct result of call to
        ``ticks_ms()``, ``ticks_us()``, or ``ticks_cpu()`` functions (or from
        previous call to ``ticks_add()``)
    :param delta: Arbitrary integer number or numeric expression.

    :return: Returns the result of the add operation.
    """
    ...

def ticks_diff(ticks1: int, ticks2: int) -> int:
    """
    Measures the period (ticks) difference between values returned from
    ``ticks_ms()``, ``ticks_us()``, or ``ticks_cpu()`` functions, as a signed
    value which may wrap around, so directly subtracting them is not supported.

    The argument order is the same as for subtraction operator,
    ``ticks_diff(ticks1, ticks2)`` has the same meaning as ``ticks1 - ticks2``.

    :param ticks1: Ticks that precede in time the value of ``ticks2``.
    :param ticks2: Second (newer) ticks value.

    :return: The difference between the given ticks values.
    """
    ...

