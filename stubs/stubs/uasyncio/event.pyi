from typing import Any

class Event:
    def __init__(self) -> None:
        ...

    def clear(self) -> None:
        ...
        
    def set(self) -> None:
        ...

    def is_set(self) -> Any:
        ...

    wait : Any ## <class 'generator'> = <generator>

class ThreadSafeFlag():
    def __init__(self, *argv, **kwargs) -> None:
        ...

    def clear(self, *args, **kwargs) -> Any:
        ...

    def set(self):
        """
        Set the flag. If there is a task waiting on the event, it will be scheduled to run.
        """
        ...

    def ioctl(self):
        ...

    wait : Any ## <class 'generator'> = <generator>
