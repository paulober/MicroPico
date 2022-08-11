from typing import Any

class Stream:
    def __init__(self, s: Any, e: Any={}) -> None:
        ...
        
    def get_extra_info(self, v: Any) -> Any:
        #   0: return self.e[v]
        # ? 0: return self.e[v]
        ...
        
    def close(self) -> None: ...
    def write(self, buf: Any) -> None:
        ...

class StreamReader:
    def __init__(self, s: Any, e: Any={}) -> None:
        ...

    def get_extra_info(self, v: Any) -> Any:
        #   0: return self.e[v]
        # ? 0: return self.e[v]
        ...
        
    def close(self) -> None: ...
    def write(self, buf: Any) -> None:
        ...

class StreamWriter:
    def __init__(self, s: Any, e: Any={}) -> None:
        ...

    def get_extra_info(self, v: Any) -> Any:
        #   0: return self.e[v]
        # ? 0: return self.e[v]
        ...
        
    def close(self) -> None:
        ...

    def write(self, buf: Any) -> None:
        ...

class Server:
    def close(self) -> None: ...
