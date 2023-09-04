from typing import Any

def libc_ver(*args, **kwargs) -> tuple[str, str]:
    """
    Tries to determine the libc version against which the MicroPython executable is linked.
    Returns a tuple of strings (lib, version) which default to the given parameters in
    case the lookup fails.
    """
    ...

def platform(*args, **kwargs) -> str:
    """
    Returns a single string identifying the underlying platform with as much useful 
    information as possible.
    """
    ...

def python_compiler() -> str:
    """Returns a string identifying the compiler used for compiling MicroPython."""
    ...
