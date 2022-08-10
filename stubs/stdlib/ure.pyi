"""
Module: 'ure' on micropython-v1.19.1-rp2
"""
# MCU: {'ver': 'v1.19.1', 'build': '', 'sysname': 'rp2', 'platform': 'rp2', 'version': '1.19.1', 'release': '1.19.1', 'port': 'rp2', 'family': 'micropython', 'name': 'micropython', 'machine': 'Raspberry Pi Pico W with RP2040', 'nodename': 'rp2'}
from typing import Any, Optional

def compile(regex_str: str, **kwargs) -> Any:
    """Compile regular expression, return regex object."""
    ...

def match(*args, **kwargs) -> Any:
    """Compile regex_str and match against string. Match 
    always happens from starting position in a string.
    """
    ...

def search(regex_str: str, string: str) -> Any:
    """Compile *regex_str* and search it in a *string*. 
    Unlike ``match``, this will search string for first 
    position which matches regex (which still may 
    be 0 if regex is anchored)."""
    ...

def sub(regex_str: str, replace, string: str, count: int=0, flags: int=0, /) -> str:
    """Compile *regex_str* and search for it in *string*, replacing all matches with 
    *replace*, and returning the new string.

    *replace* can be a string or a function. If it is a string then escape 
    sequences of the form ``\<number>`` and ``\g<number>`` can be used to 
    expand to the corresponding group (or an empty string for unmatched groups). 
    If replace is a function then it must take a single argument (the match) 
    and should return a replacement string.
    
    If *count* is specified and non-zero then substitution will stop after this many 
    substitutions are made. The flags argument is ignored.
    """
    ...
