from typing import Any

class Event:
    def __init__(self) -> None:
        ...
        
    def is_set(self) -> Any:
        #   0: return self.state
        # ? 0: return self.state
        ...
        
    def set(self) -> None:
        ...

    def clear(self) -> None:
        ...

class ThreadSafeFlag:
    def ioctl(self):
        ...

    def set(self):
        """
        Set the flag. If there is a task waiting on the event, it will be scheduled to run.
        """
        ...

    wait = None
