"""
Module: 'usys' on micropython-v1.19.1-rp2
"""
# MCU: {'ver': 'v1.19.1', 'build': '', 'sysname': 'rp2', 'platform': 'rp2', 'version': '1.19.1', 'release': '1.19.1', 'port': 'rp2', 'family': 'micropython', 'name': 'micropython', 'machine': 'Raspberry Pi Pico W with RP2040', 'nodename': 'rp2'}
from typing import Any

argv = [] # type: list
"""A mutable list of arguments the current program was started with."""
byteorder = 'little' # type: str
"""The byte order of the system (``"little"`` or ``"big"``)."""

def exit(retval=0,/) -> Any:
    """Terminate current program with a given 
    exit code. Underlyingly, this function 
    raise as ``SystemExit`` exception. If an 
    argument is given, its value given as 
    an argument to ``SystemExit``.
    """
    ...

implementation = () # type: tuple
"""Object with information about the current Python 
implementation. For MicroPython, it has following attributes:

- *name* - string “micropython”
- *version* - tuple (major, minor, micro), e.g. (1, 7, 0)
- *_machine* - string describing the underlying machine
- *_mpy* - supported mpy file-format version (optional attribute)

This object is the recommended way to distinguish MicroPython 
from other Python implementations (note that it still may not 
exist in the very minimal ports).
"""
maxsize = 2147483647 # type: int
"""Maximum value which a native integer type can hold on the 
current platform, or maximum value representable by 
MicroPython integer type, if it's smaller than platform max 
value (that is the case for MicroPython ports without long 
int support).
"""
modules = {} # type: dict
"""Dictionary of loaded modules. On some ports, 
it may not include builtin modules.
"""
path = [] # type: list
"""A mutable list of directories to search for imported modules."""
platform = 'rp2' # type: str
"""The platform that MicroPython is running on."""

def print_exception(exc, file=stdout, /) -> Any:
    """Print exception with a traceback to a file-like 
    object file (or ``usys.stdout`` by default).
    """
    ...

ps1 = '>>> ' # type: str
"""Mutable attributes holding strings, which are used 
for the REPL prompt. The defaults give the standard 
Python prompt of ``>>> `` and ``.... ``
"""
ps2 = '... ' # type: str
"""Mutable attributes holding strings, which are used 
for the REPL prompt. The defaults give the standard 
Python prompt of ``>>> `` and ``.... ``
"""
stderr : Any ## <class 'FileIO'> = <io.FileIO 2>
"""Standard error ``stream``."""
stdin : Any ## <class 'FileIO'> = <io.FileIO 0>
"""Standard input ``stream``."""
stdout : Any ## <class 'FileIO'> = <io.FileIO 1>
"""Standard output ``stream``."""
version = '3.4.0; MicroPython v1.19.1 on 2022-10-27' # type: str
"""Python language version that this implementation conforms to, as a string."""
version_info = () # type: tuple
"""Python language version that this implementation conforms to, as a tuple of ints."""
